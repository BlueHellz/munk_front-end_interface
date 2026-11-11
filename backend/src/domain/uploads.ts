import { randomUUID } from 'node:crypto';
import type { Readable } from 'node:stream';
import type { Pool, PoolClient } from 'pg';
import type { AllocateUploadInput, UploadStatus } from '../../../contracts/src/creator.js';
import { memberHouse, type Actor } from './access.js';
import { transaction } from '../db/transaction.js';
import { DomainError, conflict, invalid } from '../api/errors.js';
import { MediaStore } from '../media/store.js';

type UploadRow = { id: string; asset_id: string; house_id: string; account_id: string; purpose: 'video' | 'introduction'; state: string;
  expected_bytes: string; received_bytes: string; duration_ms: string | null; error_code: string | null; receive_token: string | null; source_key: string | null };
const view = (u: UploadRow): UploadStatus => ({ uploadId: u.id, assetId: u.asset_id, purpose: u.purpose, state: u.state, uploadedBytes: Number(u.received_bytes), totalBytes: Number(u.expected_bytes), durationMs: u.duration_ms === null ? null : Number(u.duration_ms), errorCode: u.error_code });
export class Uploads {
  constructor(private pool: Pool, readonly store: MediaStore) {}
  private async owned(client: PoolClient, actor: Actor, id: string) {
    const row = (await client.query<UploadRow>(`SELECT u.*,a.house_id,a.purpose,a.state,a.expected_bytes,a.received_bytes,a.duration_ms,a.error_code,a.source_key
      FROM upload_sessions u JOIN assets a ON a.id=u.asset_id WHERE u.id=$1`, [id])).rows[0];
    if (!row) throw new DomainError(404, 'not_found', 'Upload was not found.');
    await memberHouse(client, actor, row.house_id, row.purpose === 'introduction');
    if (row.account_id !== actor.accountId) throw new DomainError(404, 'not_found', 'Upload was not found.');
    // Fresh read after acquiring the House lock prevents stale state decisions.
    return (await client.query<UploadRow>(`SELECT u.*,a.house_id,a.purpose,a.state,a.expected_bytes,a.received_bytes,a.duration_ms,a.error_code,a.source_key
      FROM upload_sessions u JOIN assets a ON a.id=u.asset_id WHERE u.id=$1 FOR UPDATE OF u,a`, [id])).rows[0];
  }
  async allocate(actor: Actor, houseId: string, input: AllocateUploadInput): Promise<UploadStatus> {
    const max = input.purpose === 'introduction' ? 536870912 : 2147483648;
    if (!['video', 'introduction'].includes(input.purpose) || !Number.isSafeInteger(input.size) || input.size <= 0 || input.size > max) invalid('Upload purpose or size is invalid.');
    return transaction(this.pool, async client => {
      await memberHouse(client, actor, houseId, input.purpose === 'introduction');
      // Bound concurrently allocated/retained input per House for the local demonstration.
      const usage = await client.query('SELECT COALESCE(sum(expected_bytes),0)::text AS bytes FROM assets WHERE house_id=$1', [houseId]);
      if (Number(usage.rows[0].bytes) + input.size > 10 * 1024 ** 3) throw new DomainError(413, 'too_large', 'House storage allocation limit reached.');
      const assetId = randomUUID(), uploadId = randomUUID();
      await client.query('INSERT INTO assets (id,house_id,created_by,purpose,expected_bytes) VALUES ($1,$2,$3,$4,$5)', [assetId, houseId, actor.accountId, input.purpose, input.size]);
      await client.query("INSERT INTO upload_sessions (id,asset_id,account_id,expires_at) VALUES ($1,$2,$3,now()+interval '24 hours')", [uploadId, assetId, actor.accountId]);
      return view(await this.owned(client, actor, uploadId));
    });
  }
  async status(actor: Actor, id: string) { return transaction(this.pool, async client => view(await this.owned(client, actor, id))); }
  async list(actor: Actor, houseId: string) {
    return transaction(this.pool, async client => {
      await memberHouse(client, actor, houseId);
      const result = await client.query<UploadRow>(`SELECT u.*,a.house_id,a.purpose,a.state,a.expected_bytes,a.received_bytes,a.duration_ms,a.error_code,a.source_key FROM upload_sessions u
        JOIN assets a ON a.id=u.asset_id WHERE a.house_id=$1 AND u.account_id=$2 ORDER BY u.created_at DESC LIMIT 100`, [houseId, actor.accountId]);
      return result.rows.map(view);
    });
  }
  async playbackKey(actor: Actor, id: string) {
    return transaction(this.pool, async client => {
      const row = await this.owned(client, actor, id);
      if (row.state !== 'ready') conflict('Processed video is not ready.');
      const result = await client.query('SELECT playback_key FROM assets WHERE id=$1', [row.asset_id]);
      return result.rows[0].playback_key as string;
    });
  }
  async receive(actor: Actor, id: string, input: Readable, signal?: AbortSignal): Promise<UploadStatus> {
    const token = randomUUID();
    const upload = await transaction(this.pool, async client => {
      const row = await this.owned(client, actor, id);
      const valid = await client.query('SELECT expires_at > now() AS valid,receive_until > now() AS busy FROM upload_sessions WHERE id=$1', [id]);
      if (!valid.rows[0].valid) conflict('Upload expired. Allocate a new upload.');
      if (!['created', 'failed', 'receiving'].includes(row.state) || (row.state === 'receiving' && valid.rows[0].busy)) conflict('Upload cannot receive bytes in its current state.');
      // A processing failure must use retryProcessing, never overwrite reviewed source bytes.
      if (row.source_key) conflict('Source already received. Retry processing instead.');
      await client.query("UPDATE upload_sessions SET receive_token=$2,receive_until=now()+interval '30 seconds' WHERE id=$1", [id, token]);
      await client.query("UPDATE assets SET state='receiving',error_code=NULL,updated_at=now() WHERE id=$1", [row.asset_id]);
      return row;
    });
    const key = `${upload.asset_id}/${token}/source.bin`;
    const controller = new AbortController();
    const abort = () => controller.abort(); signal?.addEventListener('abort', abort, { once: true });
    if (signal?.aborted) abort();
    let pending = Promise.resolve();
    const timer = setInterval(() => {
      pending = pending.then(async () => {
        const result = await this.pool.query("UPDATE upload_sessions SET receive_until=now()+interval '30 seconds' WHERE id=$1 AND receive_token=$2 AND cancelled_at IS NULL", [id, token]);
        if (!result.rowCount) controller.abort();
      }).catch(() => controller.abort());
    }, 10000);
    timer.unref();
    const stop = async () => { clearInterval(timer); await pending; signal?.removeEventListener('abort', abort); };
    try {
      const received = await this.store.write(key, input, Number(upload.expected_bytes), controller.signal);
      await stop();
      return await transaction(this.pool, async client => {
        const row = await this.owned(client, actor, id);
        if (row.receive_token !== token || row.state !== 'receiving') conflict('Upload lease was lost or cancelled.');
        await client.query("UPDATE assets SET state='queued',received_bytes=$2,sha256=$3,source_key=$4,error_code=NULL,updated_at=now() WHERE id=$1", [row.asset_id, received.bytes, received.sha256, key]);
        await client.query('UPDATE upload_sessions SET completed_at=now(),receive_token=NULL,receive_until=NULL WHERE id=$1', [id]);
        await client.query('INSERT INTO processing_jobs (asset_id,generation) SELECT id,generation FROM assets WHERE id=$1', [row.asset_id]);
        return view({ ...row, state: 'queued', received_bytes: String(received.bytes) });
      });
    } catch (error) {
      await stop();
      // Resolve ambiguous COMMIT outcomes before deleting files. If the DB is
      // unavailable, leave an inaccessible orphan rather than delete a committed source.
      const remove = await transaction(this.pool, async client => {
        const lease = await client.query('SELECT asset_id,receive_token FROM upload_sessions WHERE id=$1 FOR UPDATE', [id]);
        const current = (await client.query('SELECT source_key FROM assets WHERE id=$1 FOR UPDATE', [upload.asset_id])).rows[0];
        if (current?.source_key === key) return false;
        if (lease.rows[0]?.receive_token === token) {
          await client.query("UPDATE assets SET state='failed',error_code='upload_failed',updated_at=now() WHERE id=$1 AND state='receiving'", [lease.rows[0].asset_id]);
          await client.query('UPDATE upload_sessions SET receive_token=NULL,receive_until=NULL WHERE id=$1', [id]);
        }
        return true;
      });
      if (remove) await this.store.remove(key);
      throw error;
    }
  }
  async cancel(actor: Actor, id: string) {
    return transaction(this.pool, async client => {
      const row = await this.owned(client, actor, id);
      // Completed sources may be referenced by immutable review evidence. Preserve them.
      if (!['created', 'receiving', 'failed'].includes(row.state) || row.source_key) conflict('Completed uploads cannot be cancelled.');
      await client.query('UPDATE upload_sessions SET cancelled_at=now(),receive_token=NULL,receive_until=NULL WHERE id=$1', [id]);
      await client.query("UPDATE assets SET state='cancelled',updated_at=now() WHERE id=$1", [row.asset_id]);
      return view({ ...row, state: 'cancelled' });
    });
  }
  async retryProcessing(actor: Actor, id: string) {
    return transaction(this.pool, async client => {
      const row = await this.owned(client, actor, id);
      if (row.state !== 'failed' || !row.source_key) conflict('Only a failed received asset can retry processing.');
      await client.query("UPDATE processing_jobs SET state='queued',attempts=0,lease_token=NULL,lease_until=NULL,error_code=NULL,available_at=now(),updated_at=now() WHERE asset_id=$1", [row.asset_id]);
      await client.query("UPDATE assets SET state='queued',error_code=NULL,updated_at=now() WHERE id=$1", [row.asset_id]);
      return view({ ...row, state: 'queued', error_code: null });
    });
  }
}
