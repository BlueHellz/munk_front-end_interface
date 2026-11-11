import assert from 'node:assert/strict';
import {Interfaces} from '../src/domain/interfaces.js';
import { randomBytes } from 'node:crypto';
import { mkdtemp, rm,readFile,writeFile,mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { createServer } from 'node:net';
import { spawn } from 'node:child_process';
import EmbeddedPostgres from 'embedded-postgres';
import { Pool } from 'pg';

let stage = 'reserving a loopback port';
async function main() {
  // CI/agent shells can inherit a locale unavailable to the native distribution.
  process.env.LC_ALL = 'C'; process.env.LANG = 'C';
  const directory = await mkdtemp(join(tmpdir(), 'munk-native-pg-'));
  const reservation = createServer();
  const port = await new Promise<number>((resolve, reject) => {
    reservation.once('error', reject);
    reservation.listen(0, '127.0.0.1', () => { const address = reservation.address(); if (address && typeof address !== 'string') resolve(address.port); });
  });
  await new Promise<void>((resolve, reject) => reservation.close(error => error ? reject(error) : resolve()));
  const password = randomBytes(24).toString('hex');
  const pg = new EmbeddedPostgres({ databaseDir: join(directory, 'db'), user: 'munk_test', password, port, persistent: true, createPostgresUser: false,
    authMethod: 'scram-sha-256', initdbFlags: ['--locale=C', '--encoding=UTF8'], postgresFlags: ['-h', '127.0.0.1', '-c', 'unix_socket_directories='], onLog: () => {}, onError: () => {} });
  let started = false;
  try {
    stage = 'initializing the temporary cluster';
    try { await pg.initialise(); }
    catch (error) {
      // This is a generated test cluster, not application credentials; redact its
      // random password while retaining initdb's actionable diagnostic.
      if (error instanceof Error) console.error(error.message.replaceAll(password, '[redacted]'));
      throw error;
    }
    stage = 'starting PostgreSQL'; await pg.start(); started = true;
    stage = 'creating the test database';
    const admin = new Pool({ host: '127.0.0.1', port, user: 'munk_test', password, database: 'postgres', connectionTimeoutMillis: 3000 });
    try { await admin.query('CREATE DATABASE munk_test'); } finally { await admin.end(); }
    const url = `postgresql://munk_test:${password}@127.0.0.1:${port}/munk_test`;
    let pool = new Pool({ connectionString: url });
    const version = await pool.query('SHOW server_version');
    console.log(`Native PostgreSQL ${version.rows[0].server_version}: isolated loopback test cluster.`);
    await pool.query('CREATE TABLE restart_probe (value integer)'); await pool.query('INSERT INTO restart_probe VALUES (42)'); await pool.end();
    stage = 'restarting PostgreSQL'; await pg.stop(); started = false; await pg.start(); started = true;
    pool = new Pool({ connectionString: url });
    try { if ((await pool.query('SELECT value FROM restart_probe')).rows[0]?.value !== 42) throw new Error('Restart persistence failed.'); }
    finally { await pool.end(); }
    console.log('Native PostgreSQL process stop/start persistence passed.');
    stage = 'running integration tests';
    const interfaceProbe=process.argv.includes('--publication')?join(directory,'interface-probe.json'):undefined;
    const code = await new Promise<number>((resolve, reject) => {
      const child = spawn(process.execPath, ['--import', 'tsx', '--test','--test-concurrency=1', ...(process.argv.includes('--publication')?['tests/publication.test.ts']:['tests/database.test.ts','tests/workflow.test.ts','tests/auth.test.ts','tests/house-save.test.ts','tests/publication.test.ts'])], {
        stdio: 'inherit', env: { ...process.env, TEST_DATABASE_URL: url,...(interfaceProbe?{MUNK_TEST_INTERFACE_RESTART_PROBE:interfaceProbe}:{}) },
      });
      child.once('error', reject); child.once('close', exitCode => resolve(exitCode ?? 1));
    });
    if(code===0&&interfaceProbe){
      stage='restarting PostgreSQL after actual interface saves';const probe=JSON.parse(await readFile(interfaceProbe,'utf8'));
      if(!/^munk_publication_[a-f0-9]+$/.test(probe.schema))throw Error('Invalid test schema');
      await pg.stop();started=false;await pg.start();started=true;
      const restored=new Pool({connectionString:url,options:`-c search_path=${probe.schema},public`});
      try{const service=new Interfaces(restored),actor={accountId:probe.accountId};assert.deepEqual((await service.get(actor)).current,probe.current);assert.deepEqual((await service.get(actor,probe.houseId)).current,probe.houseCurrent);assert.ok((await service.get(actor)).history.length>=3);await restored.query(`DROP SCHEMA "${probe.schema}" CASCADE`);}finally{await restored.end();}
      const output=join(import.meta.dirname,'../../artifacts/interface-foundation');await mkdir(output,{recursive:true});await writeFile(join(output,'database-restart.json'),JSON.stringify({status:'PASS',timestamp:new Date().toISOString(),scope:'Isolated native PostgreSQL process stop/start after actual UI saves; account design, House design and revision history match exactly; test identities and generated media only.'},null,2));console.log('Saved account/House interfaces and history survive actual PostgreSQL process restart: PASS.');
    }
    process.exitCode = code;
  } finally { if (started) await pg.stop(); await rm(directory, { recursive: true, force: true }); }
}
main().then(() => process.exit(process.exitCode ?? 0)).catch((error: unknown) => {
  const code = error && typeof error === 'object' && 'code' in error ? String(error.code) : 'unavailable';
  console.error(`Native PostgreSQL test failed while ${stage} (${code}). Check local process/port permissions and test binary availability.`);
  process.exit(1);
});
