import { setTimeout as delay } from 'node:timers/promises';
import { loadConfig } from '../config/env.js';
import { createPool } from '../db/pool.js';
import { databaseReady } from '../db/migrations.js';
import { MediaStore } from '../media/store.js';
import { Processor } from './processor.js';

async function main() {
  const config = loadConfig();
  const pool = createPool(config, () => console.error('Worker database connection lost.'));
  const controller = new AbortController();
  process.once('SIGINT', () => controller.abort()); process.once('SIGTERM', () => controller.abort());
  const worker = new Processor(pool, new MediaStore(config.mediaRoot), { ffmpeg: config.ffmpegPath, ffprobe: config.ffprobePath });
  try {
    if (!await databaseReady(pool)) throw new Error('Migrations required.');
    while (!controller.signal.aborted) {
      try { if (await worker.runOnce(controller.signal)) continue; }
      catch { console.error('Processing attempt interrupted; durable lease recovery remains available.'); }
      try { await delay(1000, undefined, { signal: controller.signal }); } catch { break; }
    }
  } finally { await pool.end(); }
}
main().catch(() => { console.error('Worker startup failed. Check database migrations and media tools.'); process.exitCode = 1; });
