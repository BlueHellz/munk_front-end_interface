import assert from 'node:assert/strict';
import { test } from 'node:test';
import { randomUUID } from 'node:crypto';
import { mkdtemp, rm, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Readable } from 'node:stream';
import { PGlite } from '@electric-sql/pglite';
import { Pool } from 'pg';
import ffmpeg from '@ffmpeg-installer/ffmpeg';
import ffprobe from '@ffprobe-installer/ffprobe';
import { migrate } from '../src/db/migrations.js';
import { Houses } from '../src/domain/houses.js';
import { Uploads } from '../src/domain/uploads.js';
import { Admissions } from '../src/domain/admissions.js';
import { MediaStore } from '../src/media/store.js';
import { Processor } from '../src/jobs/processor.js';
import { command, probe } from '../src/media/process.js';

function wasmPool(db: PGlite): Pool {
  const query = async (sql: string, values?: unknown[]) => {
    const result = values ? await db.query(sql, values) : (await db.exec(sql)).at(-1)!;
    return { ...result, rowCount: result.rows.length || result.affectedRows || 0 };
  };
  return { query, connect: async () => ({ query, release() {} }) } as unknown as Pool;
}

async function scenarios(pool: Pool, directory: string) {
  const a = { accountId: randomUUID() }, b = { accountId: randomUUID() }, r = { accountId: randomUUID() };
  await pool.query('INSERT INTO accounts (id,display_name) VALUES ($1,$2),($3,$4),($5,$6)', [a.accountId, 'A (automated test)', b.accountId, 'B (automated test)', r.accountId, 'R (automated test)']);
  const houses = new Houses(pool), store = new MediaStore(join(directory, 'media')), uploads = new Uploads(pool, store), admissions = new Admissions(pool);
  const tools = { ffmpeg: ffmpeg.path, ffprobe: ffprobe.path };
  const worker = new Processor(pool, store, tools);
  const input = { address: 'workflow-test', name: 'Test House', description: 'Automated workflow evidence', publicName: 'Test creator', focus: 'Films' };
  const key = randomUUID(), h = await houses.create(a, input, key);
  assert.equal((await houses.create(a, input, key)).id, h.id);
  await assert.rejects(houses.create(a, { ...input, name: 'different' }, key), /Idempotency/);
  await assert.rejects(houses.create(b, input, randomUUID()), /reserved/);
  await assert.rejects(houses.create(a, { ...input, address: 'off-grid' }, randomUUID()), /reserved/);
  assert.equal((await houses.list(a))[0].membershipRole, 'owner');
  assert.equal((await houses.get(a,h.id)).membershipRole,'owner');
  assert.equal((await houses.list(b)).length, 0);
  await assert.rejects(houses.get(b, h.id), /not found/);
  await assert.rejects(houses.update(b, h.id, { ...input, version: h.version }), /not found/);
  await assert.rejects(houses.update(a, h.id, { ...input, version: 99 }), /changed/);
  await pool.query("INSERT INTO house_memberships (house_id,account_id,role) VALUES ($1,$2,'publisher')", [h.id, b.accountId]);
  assert.equal((await houses.list(b))[0].membershipRole,'publisher');
  assert.equal((await houses.get(b,h.id)).membershipRole,'publisher');
  await assert.rejects(houses.update(b, h.id, { ...input, version: h.version }), /not found/);
  await assert.rejects(uploads.allocate(b, h.id, { purpose: 'introduction', size: 5 }), /not found/);
  await pool.query('DELETE FROM house_memberships WHERE house_id=$1 AND account_id=$2',[h.id,b.accountId]);
  assert.deepEqual(await houses.list(b),[]);
  await assert.rejects(houses.get(b,h.id),/not found/);
  const bad = await uploads.allocate(a, h.id, { purpose: 'video', size: 4 });
  await assert.rejects(uploads.receive(a, bad.uploadId, Readable.from([Buffer.from('too large')])));
  assert.equal((await uploads.status(a, bad.uploadId)).state, 'failed');
  const cancelled = await uploads.allocate(a, h.id, { purpose: 'video', size: 4 });
  await uploads.cancel(a, cancelled.uploadId);
  await assert.rejects(uploads.receive(a, cancelled.uploadId, Readable.from([Buffer.from('four')])), /current state/);
  const invalid = await uploads.allocate(a, h.id, { purpose: 'video', size: 4 });
  await uploads.receive(a, invalid.uploadId, Readable.from([Buffer.from('four')]));
  assert.equal(await worker.runOnce(), true);
  assert.equal((await uploads.status(a, invalid.uploadId)).state, 'failed');
  assert.equal((await uploads.status(a, invalid.uploadId)).errorCode, 'invalid_or_failed_media');
  await uploads.cancel(a, bad.uploadId);
  const samplePath = await store.prepare('fixtures/intro.webm');
  // Actual generated 121-second input, not bundled sample media or a ready-state mock.
  await command(tools.ffmpeg, ['-hide_banner', '-loglevel', 'error', '-nostdin', '-y', '-f', 'lavfi', '-i', 'color=c=blue:s=64x48:r=2:d=121', '-c:v', 'libvpx', '-threads', '1', '-an', samplePath]);
  const bytes = await readFile(samplePath);
  const intro = await uploads.allocate(a, h.id, { purpose: 'introduction', size: bytes.length });
  await uploads.receive(a, intro.uploadId, Readable.from([bytes]));
  await assert.rejects(uploads.status(b, intro.uploadId), /not found/);
  await assert.rejects(admissions.submit(a, h.id, { version: h.version, introductionAssetId: intro.assetId, faceVisible: true, publicConsent: true }), /ready introduction/);
  assert.equal(await worker.runOnce(), true);
  const ready = await uploads.status(a, intro.uploadId);
  assert.equal(ready.state, 'ready', ready.errorCode ?? 'No processing error');
  assert.ok(ready.durationMs! >= 120000 && ready.durationMs! <= 240000);
  const output = (await pool.query('SELECT playback_key,poster_key FROM assets WHERE id=$1', [intro.assetId])).rows[0];
  assert.equal((await probe(tools, store.path(output.playback_key))).videoCodec, 'h264');
  assert.ok(await store.size(output.poster_key) > 0);
  await assert.rejects(uploads.cancel(a, intro.uploadId), /Completed/);
  const submission = await admissions.submit(a, h.id, { version: h.version, introductionAssetId: intro.assetId, faceVisible: true, publicConsent: true });
  assert.equal(submission.reviewLabel, 'Manual creator review');
  assert.equal((await houses.get(a, h.id)).admissionStatus, 'pending_review');
  const decision = { kind: 'creator_control' as const, outcome: 'approved' as const, method: 'Automated transition test, no human verification', reason: 'Synthetic test records only' };
  await assert.rejects(admissions.decide(b, submission.submissionId, decision), /permission/);
  await pool.query('INSERT INTO reviewer_capabilities (account_id) VALUES ($1),($2)', [a.accountId, r.accountId]);
  await assert.rejects(admissions.decide(a, submission.submissionId, decision), /own House/);
  const first = await admissions.decide(r, submission.submissionId, decision);
  assert.equal(first.house.admissionStatus, 'pending_review');
  assert.equal((await admissions.decide(r, submission.submissionId, decision)).house.admissionStatus, 'pending_review');
  const second = await admissions.decide(r, submission.submissionId, { ...decision, kind: 'introduction' });
  assert.equal(second.house.admissionStatus, 'admitted');
  assert.equal(await admissions.previewKey(r, submission.submissionId), output.playback_key);
  const updated = await houses.update(a, h.id, { ...input, name: 'Reviewed details changed', version: second.house.version });
  assert.equal(updated.admissionStatus, 'draft');
  assert.ok(updated.admissionRevision > second.house.admissionRevision);
  await assert.rejects(admissions.decide(r, submission.submissionId, decision), /superseded/);
  await assert.rejects(admissions.previewKey(r, submission.submissionId), /superseded/);
  const resubmission = await admissions.submit(a, h.id, { version: updated.version, introductionAssetId: intro.assetId, faceVisible: true, publicConsent: true });
  assert.notEqual(resubmission.submissionId, submission.submissionId);
  assert.equal((await admissions.queue(r)).submissions.length, 1);
  assert.equal((await admissions.decide(r, resubmission.submissionId, { ...decision, outcome: 'changes_requested' })).house.admissionStatus, 'changes_requested');
  const beforeRevoke = await houses.get(a, h.id);
  assert.equal(beforeRevoke.admissionStatus, 'changes_requested');
  await assert.rejects(uploads.allocate(b, h.id, { purpose: 'introduction', size: 5 }), /not found/);
  await pool.query('DELETE FROM house_memberships WHERE house_id=$1 AND account_id=$2', [h.id, b.accountId]);
  await assert.rejects(houses.get(b, h.id), /not found/);
  await assert.rejects(pool.query('UPDATE houses SET founder_account_id=$2 WHERE id=$1', [h.id, b.accountId]), /immutable/);

  // Lose only the acknowledgement after a real successful COMMIT. The receipt
  // may fail, but the committed source must survive and still process correctly.
  const uncertain = await uploads.allocate(a, h.id, { purpose: 'video', size: bytes.length });
  let commits = 0;
  const uncertainPool = {
    query: pool.query.bind(pool),
    connect: async () => {
      const client = await pool.connect();
      return {
        query: async (sql: string, values?: unknown[]) => {
          const result = await client.query(sql, values);
          if (sql === 'COMMIT' && ++commits === 2) throw Error('lost commit acknowledgement');
          return result;
        }, release: client.release.bind(client),
      };
    },
  } as unknown as Pool;
  await assert.rejects(new Uploads(uncertainPool, store).receive(a, uncertain.uploadId, Readable.from([bytes])), /lost commit/);
  assert.equal((await uploads.status(a, uncertain.uploadId)).state, 'queued');
  assert.equal(await worker.runOnce(), true);
  assert.equal((await uploads.status(a, uncertain.uploadId)).state, 'ready');

  // Simulate an expired lease left by a crashed worker, then run real processing.
  const recovered = await uploads.allocate(a, h.id, { purpose: 'video', size: bytes.length });
  await uploads.receive(a, recovered.uploadId, Readable.from([bytes]));
  await pool.query("UPDATE processing_jobs SET state='processing',attempts=1,lease_token=$2,lease_until=now()-interval '1 minute' WHERE asset_id=$1", [recovered.assetId, randomUUID()]);
  await pool.query("UPDATE assets SET state='processing' WHERE id=$1", [recovered.assetId]);
  assert.equal(await worker.runOnce(), true);
  assert.equal((await uploads.status(a, recovered.uploadId)).state, 'ready');
  assert.equal(await worker.runOnce(), false);
  await pool.query("UPDATE accounts SET status='suspended' WHERE id=$1", [a.accountId]);
  await assert.rejects(houses.get(a, h.id), /not active/);
}

test('creator services: permissions, actual upload/transcode, review revisions and expired lease recovery (PostgreSQL WASM)', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'munk-workflow-'));
  const db = new PGlite();
  try { const pool = wasmPool(db); await migrate(pool); await scenarios(pool, directory); }
  finally { await db.close(); await rm(directory, { recursive: true, force: true }); }
});

test('creator services on native PostgreSQL', { skip: !process.env.TEST_DATABASE_URL }, async () => {
  const schema = `munk_workflow_${randomUUID().replaceAll('-', '')}`;
  const directory = await mkdtemp(join(tmpdir(), 'munk-native-workflow-'));
  const admin = new Pool({ connectionString: process.env.TEST_DATABASE_URL });
  let pool: Pool | undefined;
  try {
    await admin.query(`CREATE SCHEMA "${schema}"`);
    pool = new Pool({ connectionString: process.env.TEST_DATABASE_URL, options: `-c search_path=${schema},public` });
    await Promise.all([migrate(pool), migrate(pool)]);
    await scenarios(pool, directory);
  } finally { await pool?.end(); await admin.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`); await admin.end(); await rm(directory, { recursive: true, force: true }); }
});
