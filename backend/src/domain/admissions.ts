import type { Pool, PoolClient } from 'pg';
import type { AdmissionInput, ReviewInput } from '../../../contracts/src/creator.js';
import { MANUAL_CREATOR_REVIEW_LABEL } from '../../../contracts/src/foundation.js';
import { activeAccount, memberHouse, type Actor, type HouseRow } from './access.js';
import { houseView } from './houses.js';
import { transaction } from '../db/transaction.js';
import { DomainError, conflict, invalid } from '../api/errors.js';

export async function reviewer(client: PoolClient, actor: Actor) {
  await activeAccount(client, actor);
  const result = await client.query('SELECT account_id FROM reviewer_capabilities WHERE account_id=$1 FOR SHARE', [actor.accountId]);
  if (!result.rows[0]) throw new DomainError(403, 'forbidden', 'Manual creator review permission is required.');
}
export async function reviewSubmission(client: PoolClient, actor: Actor, id: string) {
  await reviewer(client, actor);
  const result = await client.query('SELECT * FROM admission_submissions WHERE id=$1', [id]);
  const submission = result.rows[0];
  if (!submission) throw new DomainError(404, 'not_found', 'Submission was not found.');
  const house = (await client.query<HouseRow>('SELECT * FROM houses WHERE id=$1 FOR UPDATE', [submission.house_id])).rows[0];
  const own = await client.query('SELECT 1 FROM house_memberships WHERE house_id=$1 AND account_id=$2', [house.id, actor.accountId]);
  if (own.rows[0] || house.founder_account_id === actor.accountId || house.operator_account_id === actor.accountId || submission.submitted_by === actor.accountId) {
    throw new DomainError(403, 'forbidden', 'Reviewing your own House is not allowed.');
  }
  if (house.admission_revision !== submission.revision || house.admission_status === 'draft') conflict('Submission is superseded.');
  return { submission, house };
}
export class Admissions {
  constructor(private pool: Pool) {}
  async submit(actor: Actor, houseId: string, input: AdmissionInput) {
    if (input.faceVisible !== true || input.publicConsent !== true) invalid('Face-visible declaration and public-information consent are required.');
    return transaction(this.pool, async client => {
      const house = await memberHouse(client, actor, houseId, true);
      if (house.version !== input.version) conflict('House changed. Reload before submitting.');
      if (['pending_review', 'admitted'].includes(house.admission_status)) conflict('House is already submitted or admitted.');
      if (![house.name, house.description, house.public_name, house.focus].every(s => s.trim())) invalid('Complete House details before submitting.');
      const asset = (await client.query(`SELECT * FROM assets WHERE id=$1 AND house_id=$2 AND purpose='introduction' AND state='ready' FOR SHARE`, [input.introductionAssetId, houseId])).rows[0];
      if (!asset || Number(asset.duration_ms) < 120000 || Number(asset.duration_ms) > 240000 || !asset.sha256) invalid('A ready introduction between two and four minutes is required.');
      const existing = await client.query('SELECT 1 FROM admission_submissions WHERE house_id=$1 AND revision=$2', [houseId, house.admission_revision]);
      const revision = house.admission_revision + (existing.rows[0] ? 1 : 0);
      const snapshot = { name: house.name, address: house.address, description: house.description, publicName: house.public_name, focus: house.focus, operatorAccountId: house.operator_account_id };
      const result = await client.query(`INSERT INTO admission_submissions (house_id,revision,submitted_by,introduction_asset_id,introduction_sha256,snapshot,face_visible_declared,public_information_consent)
        VALUES ($1,$2,$3,$4,$5,$6,true,true) RETURNING id`, [houseId, revision, actor.accountId, asset.id, asset.sha256, JSON.stringify(snapshot)]);
      await client.query("UPDATE houses SET admission_revision=$2,admission_status='pending_review',version=version+1,updated_at=now() WHERE id=$1", [houseId, revision]);
      return { submissionId: result.rows[0].id as string, revision, status: 'pending_review' as const, reviewLabel: MANUAL_CREATOR_REVIEW_LABEL };
    });
  }
  async queue(actor: Actor) {
    return transaction(this.pool, async client => {
      await reviewer(client, actor);
      const result = await client.query(`SELECT s.id,s.house_id AS "houseId",s.revision,s.snapshot,s.created_at AS "createdAt" FROM admission_submissions s
        JOIN houses h ON h.id=s.house_id AND h.admission_revision=s.revision WHERE h.admission_status='pending_review'
        AND h.founder_account_id<>$1 AND h.operator_account_id<>$1 AND s.submitted_by<>$1
        AND NOT EXISTS (SELECT 1 FROM house_memberships m WHERE m.house_id=h.id AND m.account_id=$1)
        ORDER BY s.created_at,s.id LIMIT 100`, [actor.accountId]);
      return { reviewLabel: MANUAL_CREATOR_REVIEW_LABEL, submissions: result.rows };
    });
  }
  async decide(actor: Actor, id: string, input: ReviewInput) {
    if (!['creator_control', 'introduction'].includes(input.kind) || !['approved', 'changes_requested', 'rejected'].includes(input.outcome) || !input.method.trim() || input.method.length > 500 || !input.reason.trim() || input.reason.length > 4000) invalid('A review outcome, method and reason are required.');
    return transaction(this.pool, async client => {
      const { submission, house } = await reviewSubmission(client, actor, id);
      const previous = (await client.query('SELECT * FROM review_decisions WHERE submission_id=$1 AND kind=$2', [id, input.kind])).rows[0];
      if (previous) {
        if (previous.reviewer_account_id !== actor.accountId || previous.outcome !== input.outcome || previous.method !== input.method || previous.reason !== input.reason) conflict('Review decisions are append-only. Submit a new revision for changes.');
        return { house: houseView(house), reviewLabel: MANUAL_CREATOR_REVIEW_LABEL };
      }
      const asset = (await client.query("SELECT id FROM assets WHERE id=$1 AND house_id=$2 AND state='ready' AND purpose='introduction' AND sha256=$3 AND duration_ms BETWEEN 120000 AND 240000 FOR SHARE", [submission.introduction_asset_id, house.id, submission.introduction_sha256])).rows[0];
      if (!asset) conflict('Reviewed introduction is no longer ready or no longer matches.');
      await client.query('INSERT INTO review_decisions (submission_id,reviewer_account_id,kind,outcome,method,reason) VALUES ($1,$2,$3,$4,$5,$6)', [id, actor.accountId, input.kind, input.outcome, input.method, input.reason]);
      const decisions = (await client.query<{ outcome: string }>('SELECT outcome FROM review_decisions WHERE submission_id=$1', [id])).rows;
      const status = decisions.some(d => d.outcome === 'rejected') ? 'rejected' : decisions.some(d => d.outcome === 'changes_requested') ? 'changes_requested' : decisions.length === 2 ? 'admitted' : 'pending_review';
      const updated = await client.query<HouseRow>('UPDATE houses SET admission_status=$2,version=version+1,updated_at=now() WHERE id=$1 RETURNING *', [house.id, status]);
      return { house: houseView(updated.rows[0]), reviewLabel: MANUAL_CREATOR_REVIEW_LABEL };
    });
  }
  async previewKey(actor: Actor, id: string): Promise<string> {
    return transaction(this.pool, async client => {
      const { submission } = await reviewSubmission(client, actor, id);
      const asset = (await client.query("SELECT playback_key FROM assets WHERE id=$1 AND state='ready' AND sha256=$2", [submission.introduction_asset_id, submission.introduction_sha256])).rows[0];
      if (!asset?.playback_key) conflict('Introduction playback is unavailable.');
      return asset.playback_key as string;
    });
  }
}
