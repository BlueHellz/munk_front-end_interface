import assert from 'node:assert/strict';
import { test } from 'node:test';
import { randomUUID, createHash } from 'node:crypto';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { PGlite } from '@electric-sql/pglite';
import { Pool } from 'pg';
import { migrate, readMigrations, pendingMigrations, databaseReady } from '../src/db/migrations.js';
import { transaction } from '../src/db/transaction.js';

// SQL is executed by PostgreSQL in WASM, not a SQL mock. This adapter only bridges
// pg's pool/result interface for a single connection; network/concurrency are separate checks.
function pglitePool(db: PGlite): Pool {
  const query = async (sql: string, values?: unknown[]) => {
    if (values) { const result = await db.query(sql, values); return { ...result, rowCount: result.affectedRows ?? result.rows.length }; }
    const results = await db.exec(sql);
    const result = results.at(-1) ?? { rows: [], affectedRows: 0 };
    return { ...result, rowCount: result.affectedRows ?? result.rows.length };
  };
  return { query, connect: async () => ({ query, release() {} }) } as unknown as Pool;
}

test('migration history rejects drift, gaps and unknown applied migrations', async () => {
  const migrations = await readMigrations();
  assert.equal(migrations.length, 6);
  assert.deepEqual(pendingMigrations(migrations, []), migrations);
  assert.deepEqual(pendingMigrations(migrations, migrations), []);
  assert.throws(() => pendingMigrations(migrations, [{ ...migrations[0], checksum: '0'.repeat(64) }]), /history/);
  assert.throws(() => pendingMigrations(migrations, [{ name: '9999_unknown.sql', checksum: '0'.repeat(64) }]), /history/);
});

async function exerciseDatabase(pool: Pool) {
  assert.deepEqual(await migrate(pool), (await readMigrations()).map(m => m.name));
  assert.deepEqual(await migrate(pool), []);
  assert.equal(await databaseReady(pool), true);
  const a = randomUUID(), b = randomUUID(), house = randomUUID(), otherHouse = randomUUID();
  await pool.query('INSERT INTO accounts (id, display_name) VALUES ($1, $2), ($3, $4)', [a, 'Creator A', b, 'Viewer B']);
  await pool.query(`INSERT INTO houses (id, address, founder_account_id, operator_account_id) VALUES ($1, 'a-house', $2, $2), ($3, 'b-house', $4, $4)`, [house, a, otherHouse, b]);
  await assert.rejects(pool.query('INSERT INTO houses (address, founder_account_id, operator_account_id) VALUES ($1, $2, $2)', ['a-house', b]));
  await assert.rejects(pool.query('INSERT INTO houses (address, founder_account_id, operator_account_id) VALUES ($1, $2, $2)', ['Uppercase', b]));
  await pool.query('INSERT INTO follows (account_id, house_id) VALUES ($1, $2)', [b, house]);
  await assert.rejects(pool.query('INSERT INTO follows (account_id, house_id) VALUES ($1, $2)', [b, house]));
  const identity = 'did:privy:test-only';
  await pool.query('INSERT INTO account_identities (account_id, provider, subject) VALUES ($1, $2, $3)', [a, 'privy', identity]);
  await assert.rejects(pool.query('INSERT INTO account_identities (account_id, provider, subject) VALUES ($1, $2, $3)', [b, 'privy', identity]));
  const asset = randomUUID();
  await pool.query(`INSERT INTO assets (id, house_id, created_by, purpose, expected_bytes) VALUES ($1, $2, $3, 'video', 1024)`, [asset, house, a]);
  await assert.rejects(pool.query("UPDATE assets SET state = 'ready' WHERE id = $1", [asset]));
  await assert.rejects(pool.query('UPDATE assets SET received_bytes = 1025 WHERE id = $1', [asset]));
  const work = randomUUID(), otherWork = randomUUID(), parent = randomUUID();
  await pool.query('INSERT INTO works (id, house_id, created_by) VALUES ($1, $2, $3), ($4, $5, $6)', [work, house, a, otherWork, otherHouse, b]);
  await assert.rejects(pool.query('UPDATE works SET video_asset_id = $1 WHERE id = $2', [asset, otherWork]));
  await assert.rejects(pool.query("UPDATE works SET publication = 'published' WHERE id = $1", [work]));
  await pool.query('INSERT INTO comments (id, work_id, account_id, body) VALUES ($1, $2, $3, $4)', [parent, work, b, 'A real persisted test comment']);
  await assert.rejects(pool.query('INSERT INTO comments (work_id, account_id, parent_id, body) VALUES ($1, $2, $3, $4)', [otherWork, b, parent, 'Cross-work reply']));
  await assert.rejects(transaction(pool, async client => {
    await client.query('INSERT INTO accounts (display_name) VALUES ($1)', ['Rolled back']);
    throw Error('intentional rollback');
  }), /intentional rollback/);
  assert.equal((await pool.query('SELECT count(*)::integer AS count FROM accounts')).rows[0].count, 2);
  const intro = randomUUID(), submission = randomUUID();
  await pool.query(`INSERT INTO assets (id, house_id, created_by, purpose, expected_bytes) VALUES ($1, $2, $3, 'introduction', 1024)`, [intro, house, a]);
  await pool.query(`INSERT INTO admission_submissions (id, house_id, revision, submitted_by, introduction_asset_id, introduction_sha256, snapshot, face_visible_declared, public_information_consent)
    VALUES ($1, $2, 1, $3, $4, $5, '{}', true, true)`, [submission, house, a, intro, 'a'.repeat(64)]);
  await assert.rejects(pool.query('DELETE FROM admission_submissions WHERE id = $1', [submission]), /append-only/);
  await pool.query(`INSERT INTO review_decisions (submission_id, reviewer_account_id, kind, outcome, method, reason) VALUES ($1, $2, 'creator_control', 'changes_requested', 'test fixture', 'Automated schema test only')`, [submission, b]);
  await assert.rejects(pool.query("UPDATE review_decisions SET outcome = 'approved' WHERE submission_id = $1", [submission]), /append-only/);

  const migrations = await readMigrations();
  const sql = 'CREATE TABLE failed_migration_probe (id integer); SELECT * FROM deliberately_missing_table;';
  await assert.rejects(migrate(pool, [...migrations, { name: '0004_failure.sql', sql, checksum: createHash('sha256').update(sql).digest('hex') }]));
  assert.equal((await pool.query("SELECT to_regclass('failed_migration_probe') AS name")).rows[0].name, null);
  assert.deepEqual(await migrate(pool), []);
}

test('PostgreSQL WASM: migrations, constraints, rollback and persisted reopen', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'munk-db-test-'));
  let db = new PGlite(directory);
  try {
    await exerciseDatabase(pglitePool(db));
    await db.close();
    db = new PGlite(directory);
    assert.equal(await databaseReady(pglitePool(db)), true);
    assert.equal((await db.query<{ count: number }>('SELECT count(*)::integer AS count FROM comments')).rows[0].count, 1);
    assert.equal((await db.query<{ count: number }>('SELECT count(*)::integer AS count FROM follows')).rows[0].count, 1);
  } finally { await db.close(); await rm(directory, { recursive: true, force: true }); }
});

test('native PostgreSQL integration (requires TEST_DATABASE_URL)', { skip: !process.env.TEST_DATABASE_URL }, async () => {
  // Explicit test URL only. Isolate every object in a disposable generated schema.
  const schema = `munk_test_${randomUUID().replaceAll('-', '')}`;
  const admin = new Pool({ connectionString: process.env.TEST_DATABASE_URL, connectionTimeoutMillis: 3000 });
  let pool: Pool | undefined;
  try {
    await admin.query(`CREATE SCHEMA "${schema}"`);
    pool = new Pool({ connectionString: process.env.TEST_DATABASE_URL, options: `-c search_path=${schema},public`, connectionTimeoutMillis: 3000 });
    await exerciseDatabase(pool);
  } finally {
    await pool?.end();
    await admin.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
    await admin.end();
  }
});
