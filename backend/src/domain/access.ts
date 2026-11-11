import type { PoolClient } from 'pg';
import { DomainError } from '../api/errors.js';

// Internal service input. HTTP callers cannot supply an Actor. Until Privy is
// connected the HTTP authentication guard always denies, including in development.
export type Actor = { accountId: string };
export async function activeAccount(client: PoolClient, actor: Actor): Promise<void> {
  const result = await client.query("SELECT id FROM accounts WHERE id=$1 AND status='active' FOR UPDATE", [actor.accountId]);
  if (!result.rowCount) throw new DomainError(403, 'forbidden', 'Account is not active.');
}
export type HouseRow = {
  demo_ready:boolean;
  membership_role?: 'owner' | 'publisher';
  id: string; address: string; name: string; description: string; public_name: string; focus: string;
  founder_account_id: string; operator_account_id: string; version: number; admission_revision: number;
  admission_status: 'draft' | 'pending_review' | 'admitted' | 'changes_requested' | 'rejected';
};
export async function memberHouse(client: PoolClient, actor: Actor, houseId: string, ownerOnly = false): Promise<HouseRow> {
  await activeAccount(client, actor);
  // Serialize all House mutations and workflow decisions on this row. Always
  // re-read membership after the lock, so revoked permissions cannot be cached.
  const result = await client.query<HouseRow>('SELECT * FROM houses WHERE id=$1 FOR UPDATE', [houseId]);
  const membership = await client.query('SELECT role FROM house_memberships WHERE house_id=$1 AND account_id=$2 FOR SHARE', [houseId, actor.accountId]);
  if (!result.rows[0] || !membership.rows[0] || (ownerOnly && membership.rows[0].role !== 'owner')) {
    throw new DomainError(404, 'not_found', 'House was not found.');
  }
  return { ...result.rows[0], membership_role: membership.rows[0].role };
}
