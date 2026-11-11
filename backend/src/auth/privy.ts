import { PrivyClient, type VerifyAccessTokenResponse } from '@privy-io/node';
import type { Config } from '../config/env.js';
import { DomainError } from '../api/errors.js';
import type { IdentityVerifier, VerifiedIdentity } from './sessions.js';

export function verifiedIdentity(claims: VerifyAccessTokenResponse, user: { id: string; linked_accounts: unknown[]; is_guest?: boolean }): VerifiedIdentity {
  if (user.is_guest || claims.user_id !== user.id || !claims.user_id.startsWith('did:privy:') || !claims.session_id || claims.issued_at > Date.now()/1000+30 || claims.expiration <= Date.now()/1000) {
    throw new DomainError(401, 'unauthenticated', 'Invalid or expired Privy login.');
  }
  const wallets: VerifiedIdentity['wallets'] = [];
  for (const item of user.linked_accounts) {
    if (!item || typeof item !== 'object') continue;
    const wallet = item as Record<string, unknown>;
    if (wallet.type !== 'wallet' || wallet.chain_type !== 'ethereum' || typeof wallet.address !== 'string' || !/^0x[0-9a-f]{40}$/i.test(wallet.address)) continue;
    if (wallet.user_can_sign === false || wallet.delegated === true) continue;
    const embedded = wallet.wallet_client_type === 'privy';
    if (embedded && typeof wallet.id !== 'string') continue;
    wallets.push({address:wallet.address.toLowerCase(),kind:embedded?'embedded':'external',id:typeof wallet.id==='string'?wallet.id:undefined});
  }
  if (!wallets.length) throw new DomainError(422, 'validation', 'No user-controlled Ethereum wallet is linked. Create a wallet in MUNK or sign in with your existing wallet.');
  return { subject: claims.user_id, sessionId: claims.session_id, wallets };
}
export class PrivyIdentityVerifier implements IdentityVerifier {
  private client?: PrivyClient;
  constructor(config: Config) {
    if (config.privyAppSecret) this.client = new PrivyClient({appId:config.privyAppId,appSecret:config.privyAppSecret,timeout:10000,maxRetries:1,logLevel:'off'});
  }
  async verify(accessToken: string): Promise<VerifiedIdentity> {
    if (!this.client) throw new DomainError(503,'unavailable','Enter the read-only development PRIVY_APP_SECRET locally in backend/.env and restart the API. Never send it in chat.');
    let claims: VerifyAccessTokenResponse;
    try { claims=await this.client.utils().auth().verifyAccessToken(accessToken); }
    catch { throw new DomainError(401,'unauthenticated','Privy authentication could not be verified. Sign in again.'); }
    try {
      const user=await this.client.users()._get(claims.user_id);
      return verifiedIdentity(claims,user);
    }catch(error){
      if(error instanceof DomainError)throw error;
      throw new DomainError(503,'unavailable','Privy user lookup failed. Check the local read-only app secret and provider connectivity.');
    }
  }
}
