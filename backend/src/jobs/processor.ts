import { randomUUID } from 'node:crypto';
import type { Pool } from 'pg';
import { transaction } from '../db/transaction.js';
import { MediaStore } from '../media/store.js';
import { processVideo, ProcessingError, type MediaTools } from '../media/process.js';

type Job = { id: string; asset_id: string; generation: number; attempts: number; max_attempts: number; source_key: string; purpose: 'video' | 'introduction' };
export class Processor {
  constructor(private pool: Pool, private store: MediaStore, private tools: MediaTools) {}
  async runOnce(signal?: AbortSignal): Promise<boolean> {
    if (signal?.aborted) return false;
    const token = randomUUID();
    const job = await transaction(this.pool, async client => {
      // Expired final attempts become explicit failures instead of stuck processing.
      const exhausted = await client.query(`UPDATE processing_jobs SET state='failed',lease_token=NULL,lease_until=NULL,error_code='attempts_exhausted',updated_at=now()
        WHERE state='processing' AND lease_until < now() AND attempts >= max_attempts RETURNING asset_id,generation`);
      for (const row of exhausted.rows) await client.query("UPDATE assets SET state='failed',error_code='attempts_exhausted',updated_at=now() WHERE id=$1 AND generation=$2 AND state='processing'", [row.asset_id, row.generation]);
      const result = await client.query<Job>(`SELECT j.*,a.source_key,a.purpose FROM processing_jobs j JOIN assets a ON a.id=j.asset_id AND a.generation=j.generation
        WHERE j.attempts < j.max_attempts AND j.available_at <= now() AND (j.state='queued' OR (j.state='processing' AND j.lease_until < now()))
        AND a.state IN ('queued','processing') AND a.purpose IN ('video','introduction')
        ORDER BY j.created_at,j.id FOR UPDATE OF j,a SKIP LOCKED LIMIT 1`);
      const row = result.rows[0]; if (!row) return null;
      await client.query("UPDATE processing_jobs SET state='processing',attempts=attempts+1,lease_token=$2,lease_until=now()+interval '30 seconds',updated_at=now() WHERE id=$1", [row.id, token]);
      await client.query("UPDATE assets SET state='processing',updated_at=now() WHERE id=$1", [row.asset_id]);
      return { ...row, attempts: row.attempts + 1 };
    });
    if (!job) return false;
    const controller = new AbortController();
    const abort = () => controller.abort(); signal?.addEventListener('abort', abort, { once: true });
    if (signal?.aborted) abort();
    let seconds = 0, pending = Promise.resolve();
    const heartbeat = () => {
      pending = pending.then(async () => {
        const result = await this.pool.query(`UPDATE processing_jobs SET lease_until=now()+interval '30 seconds',progress_seconds=$3,updated_at=now()
          WHERE id=$1 AND lease_token=$2 AND state='processing' AND lease_until > now()`, [job.id, token, seconds]);
        if (!result.rowCount) controller.abort();
      }).catch(() => controller.abort());
    };
    const timer = setInterval(heartbeat, 5000); timer.unref();
    const stop = async () => { clearInterval(timer); await pending; signal?.removeEventListener('abort', abort); };
    const prefix = `${job.asset_id}/${token}`;
    let output: Awaited<ReturnType<typeof processVideo>> | undefined;
    try {
      output = await processVideo(this.store, this.tools, job.source_key, prefix, job.purpose, controller.signal, value => { seconds = value; });
      await stop();
      const committed = await transaction(this.pool, async client => {
        const owned = await client.query("SELECT id FROM processing_jobs WHERE id=$1 AND lease_token=$2 AND state='processing' AND lease_until > now() FOR UPDATE", [job.id, token]);
        if (!owned.rows[0]) return false;
        const asset = await client.query(`UPDATE assets SET state='ready',playback_key=$3,poster_key=$4,duration_ms=$5,probe=$6,error_code=NULL,updated_at=now()
          WHERE id=$1 AND generation=$2 AND state='processing' RETURNING id`, [job.asset_id, job.generation, output!.playbackKey, output!.posterKey, output!.metadata.durationMs, JSON.stringify(output!.metadata)]);
        if (!asset.rows[0]) return false;
        await client.query("UPDATE processing_jobs SET state='succeeded',lease_token=NULL,lease_until=NULL,progress_seconds=$3,error_code=NULL,updated_at=now() WHERE id=$1 AND lease_token=$2", [job.id, token, output!.metadata.durationMs / 1000]);
        return true;
      });
      if (!committed) { await this.store.remove(output.playbackKey); await this.store.remove(output.posterKey); }
    } catch (error) {
      await stop();
      const code = error instanceof ProcessingError ? error.code : 'processing_failed';
      // Do not delete a possibly committed output when COMMIT acknowledgement is lost.
      await transaction(this.pool, async client => {
        const owned = await client.query("SELECT id FROM processing_jobs WHERE id=$1 AND lease_token=$2 AND state='processing' AND lease_until > now() FOR UPDATE", [job.id, token]);
        if (!owned.rows[0]) return;
        const retry = signal?.aborted === true;
        await client.query("UPDATE processing_jobs SET state=$3,lease_token=NULL,lease_until=NULL,error_code=$4,updated_at=now() WHERE id=$1 AND lease_token=$2", [job.id, token, retry && job.attempts < job.max_attempts ? 'queued' : 'failed', code]);
        await client.query('UPDATE assets SET state=$3,error_code=$4,updated_at=now() WHERE id=$1 AND generation=$2 AND state=\'processing\'', [job.asset_id, job.generation, retry && job.attempts < job.max_attempts ? 'queued' : 'failed', code]);
      });
    }
    return true;
  }
}
