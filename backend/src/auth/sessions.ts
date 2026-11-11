import { createHash, createHmac, randomBytes, randomUUID, timingSafeEqual } from 'node:crypto';
import type { Pool, PoolClient } from 'pg';
import type { AccountSession } from '../../../contracts/src/auth.js';
import { transaction } from '../db/transaction.js';
import { DomainError } from '../api/errors.js';
import type { Actor } from '../domain/access.js';

export type VerifiedIdentity = { subject: string; sessionId: string; wallets: { address: string; kind: 'embedded' | 'external'; id?: string }[] };
export interface IdentityVerifier { verify(accessToken: string): Promise<VerifiedIdentity> }
export const tokenHash = (token: string) => createHash('sha256').update(token).digest('hex');
const csrf = (token: string) => createHmac('sha256', token).update('munk-session-csrf-v1').digest('hex');
const opaque = () => randomBytes(32).toString('hex');
export const sessionCookieName = 'munk_session';
export const challengeCookieName = 'munk_login';
const deny = (): never => { throw new DomainError(401, 'unauthenticated', 'Sign in to MUNK to continue.'); };

export class Sessions {
  constructor(private pool: Pool, private verifier: IdentityVerifier) {}
  private async limit(ip: string) {
    const window = Math.floor(Date.now() / 300000);
    const result = await this.pool.query('INSERT INTO auth_rate_windows (actor_hash,window_start) VALUES ($1,$2) ON CONFLICT (actor_hash,window_start) DO UPDATE SET attempts=auth_rate_windows.attempts+1 RETURNING attempts', [tokenHash(ip), window]);
    if (result.rows[0].attempts > 30) throw new DomainError(429, 'unavailable', 'Too many sign-in attempts. Wait five minutes and retry.');
    await this.pool.query('DELETE FROM auth_rate_windows WHERE window_start < $1', [window - 1]);
  }
  async challenge(ip: string) {
    await this.limit(ip);
    const token = opaque();
    await this.pool.query('DELETE FROM auth_login_challenges WHERE expires_at < now()');
    await this.pool.query("INSERT INTO auth_login_challenges (token_hash,expires_at) VALUES ($1,now()+interval '5 minutes')", [tokenHash(token)]);
    return { token, challenge: tokenHash(token) };
  }
  async login(accessToken: string, cookie: string | undefined, challenge: string | undefined, ip: string, previous?: string): Promise<{ token: string; session: AccountSession }> {
    await this.limit(ip);
    if (!cookie || !/^[a-f0-9]{64}$/.test(cookie) || tokenHash(cookie) !== challenge) return deny();
    const valid = await this.pool.query('SELECT token_hash FROM auth_login_challenges WHERE token_hash=$1 AND consumed_at IS NULL AND expires_at>now()', [challenge]);
    if (!valid.rows[0]) return deny();
    const identity = await this.verifier.verify(accessToken);
    if (!identity.subject.startsWith('did:privy:') || !identity.sessionId || !identity.wallets.length) return deny();
    const token = opaque();
    const accountId = await transaction(this.pool, async client => {
      const consumed = await client.query('UPDATE auth_login_challenges SET consumed_at=now() WHERE token_hash=$1 AND consumed_at IS NULL AND expires_at>now() RETURNING token_hash', [challenge]);
      if (!consumed.rows[0]) return deny();
      const revoked = await client.query('SELECT 1 FROM revoked_provider_sessions WHERE subject=$1 AND session_id=$2 AND expires_at>now()', [identity.subject, identity.sessionId]);
      if (revoked.rows[0]) return deny();
      await client.query('SELECT pg_advisory_xact_lock(hashtext($1))', [identity.subject]);
      let id = (await client.query("SELECT account_id FROM account_identities WHERE provider='privy' AND subject=$1", [identity.subject])).rows[0]?.account_id as string | undefined;
      if (!id) {
        id = randomUUID();
        await client.query('INSERT INTO accounts (id,display_name) VALUES ($1,$2)', [id, 'MUNK creator']);
        await client.query("INSERT INTO account_identities (account_id,provider,subject) VALUES ($1,'privy',$2)", [id, identity.subject]);
      }
      const account = await client.query("SELECT id FROM accounts WHERE id=$1 AND status='active' FOR UPDATE", [id]);
      if (!account.rows[0]) throw new DomainError(403, 'forbidden', 'Account is not active.');
      for (const wallet of identity.wallets) {
        const existing = await client.query("SELECT account_id FROM wallet_credentials WHERE namespace='eip155' AND address=$1", [wallet.address]);
        if (existing.rows[0] && existing.rows[0].account_id !== id) throw new DomainError(409, 'conflict', 'Wallet is already associated with another MUNK account.');
        const bound = await client.query(`INSERT INTO wallet_credentials (account_id,address,kind,provider_wallet_id,authenticated_at) VALUES ($1,$2,$3,$4,now())
          ON CONFLICT (namespace,address) DO UPDATE SET authenticated_at=now() WHERE wallet_credentials.account_id=EXCLUDED.account_id RETURNING id`, [id, wallet.address, wallet.kind, wallet.id ?? null]);
        if(!bound.rows[0])throw new DomainError(409,'conflict','Wallet is already associated with another MUNK account.');
      }
      if (previous) await client.query('UPDATE account_sessions SET revoked_at=now() WHERE token_hash=$1', [tokenHash(previous)]);
      await client.query(`INSERT INTO account_sessions (token_hash,account_id,provider_subject,provider_session_id,expires_at) VALUES ($1,$2,$3,$4,now()+interval '7 days')`, [tokenHash(token), id, identity.subject, identity.sessionId]);
      return id;
    });
    return { token, session: await this.me(token, accountId) };
  }
  async authenticate(token: string | undefined, csrfToken?: string, mutation = false): Promise<Actor> {
    if (!token || !/^[a-f0-9]{64}$/.test(token)) return deny();
    if (mutation) {
      const expected = csrf(token);
      if (!csrfToken || !/^[a-f0-9]{64}$/.test(csrfToken) || !timingSafeEqual(Buffer.from(expected), Buffer.from(csrfToken))) throw new DomainError(403, 'forbidden', 'Session CSRF check failed. Refresh and retry.');
    }
    const result = await this.pool.query(`SELECT s.account_id FROM account_sessions s JOIN accounts a ON a.id=s.account_id
      WHERE s.token_hash=$1 AND s.expires_at>now() AND s.revoked_at IS NULL AND a.status='active'`, [tokenHash(token)]);
    if (!result.rows[0]) return deny();
    return { accountId: result.rows[0].account_id };
  }
  async me(token: string | undefined, _knownAccountId?: string): Promise<AccountSession> {
    const actor = await this.authenticate(token);
    const result = await this.pool.query(`SELECT a.id,a.display_name,s.expires_at,EXISTS(SELECT 1 FROM reviewer_capabilities r WHERE r.account_id=a.id) AS reviewer
      FROM account_sessions s JOIN accounts a ON a.id=s.account_id WHERE s.token_hash=$1 AND a.id=$2`, [tokenHash(token!), actor.accountId]);
    const row = result.rows[0];
    return { account: { id: row.id, displayName: row.display_name, reviewer: row.reviewer }, expiresAt: new Date(row.expires_at).toISOString(), csrfToken: csrf(token!) };
  }
  async logout(token: string | undefined, csrfToken: string | undefined) {
    await this.authenticate(token, csrfToken, true);
    await transaction(this.pool, async client => {
      const session = (await client.query('SELECT * FROM account_sessions WHERE token_hash=$1 FOR UPDATE', [tokenHash(token!)])).rows[0];
      await client.query(`INSERT INTO revoked_provider_sessions (subject,session_id,expires_at) VALUES ($1,$2,now()+interval '7 days') ON CONFLICT (subject,session_id) DO UPDATE SET expires_at=EXCLUDED.expires_at`, [session.provider_subject, session.provider_session_id]);
      await client.query('UPDATE account_sessions SET revoked_at=now() WHERE provider_subject=$1 AND provider_session_id=$2', [session.provider_subject, session.provider_session_id]);
    });
  }
}
