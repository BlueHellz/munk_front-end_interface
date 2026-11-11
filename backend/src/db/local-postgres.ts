import { spawn } from 'node:child_process';
import { createHash, createHmac, pbkdf2Sync, randomBytes } from 'node:crypto';
import { existsSync } from 'node:fs';
import { mkdir, open, readFile, readdir, realpath, unlink } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { setTimeout as delay } from 'node:timers/promises';
import pg from 'pg';
import { backendRoot } from '../config/env.js';

// Persistent development lifecycle only. No dependency on the disposable test runner
// or embedded-postgres's automatic shutdown/deletion hooks.
const root = resolve(backendRoot, '.data/postgresql');
const data = join(root, 'data');
const metadataPath = join(root, 'managed.json');
const adminPasswordPath = join(root, 'admin.password');
const appPasswordPath = join(root, 'app.password');
const connectionPath = join(root, 'connection.env');
const logPath = join(root, 'postgres.log');
const port = 55432;
const adminUser = 'munk_local_admin';
const appUser = 'munk';
const env = { ...process.env, LC_ALL: 'C', LANG: 'C' };

async function binaryPaths() {
  if (process.platform !== 'darwin' || process.arch !== 'x64') throw Error('This launcher is for the downloaded Intel macOS binaries only.');
  const entry = fileURLToPath(import.meta.resolve('@embedded-postgres/darwin-x64'));
  const directory = resolve(dirname(entry), '../native/bin');
  return { initdb: join(directory, 'initdb'), postgres: join(directory, 'postgres'), control: join(directory, 'pg_ctl') };
}
async function run(binary: string, args: string[], allowed = [0]) {
  return new Promise<number>((resolveResult, reject) => {
    // initdb/control output may contain local paths/configuration. Keep CLI output
    // concise; raw application credentials are never sent to stdout/stderr.
    const child = spawn(binary, args, { env, stdio: 'ignore', shell: false });
    child.once('error', () => reject(Error('Could not execute downloaded PostgreSQL binary.')));
    child.once('close', code => allowed.includes(code ?? -1) ? resolveResult(code!) : reject(Error('PostgreSQL command failed. Existing data was retained.')));
  });
}
async function createPrivate(path: string, value: string) {
  const file = await open(path, 'wx', 0o600);
  try { await file.writeFile(value); await file.sync(); } finally { await file.close(); }
}
async function managed() {
  let metadata: unknown;
  try { metadata = JSON.parse(await readFile(metadataPath, 'utf8')); } catch { throw Error('Existing directory is not a recognized managed development cluster. It was not changed.'); }
  if (JSON.stringify(metadata) !== JSON.stringify({ format: 1, major: 18, port, adminUser, appUser })) throw Error('Existing cluster metadata differs. Refusing to overwrite or reset it.');
  if (await realpath(root) !== root) throw Error('Managed data directory must not be a symlink.');
}
async function initialize(initdb: string) {
  if (!existsSync(root)) {
    await mkdir(dirname(root), { recursive: true, mode: 0o700 });
    if (await realpath(dirname(root)) !== dirname(root)) throw Error('backend/.data must not be a symlink; no cluster was initialized.');
    await mkdir(root, { mode: 0o700 });
    const adminPassword = randomBytes(32).toString('hex');
    const appPassword = randomBytes(32).toString('hex');
    await createPrivate(adminPasswordPath, `${adminPassword}\n`);
    await createPrivate(appPasswordPath, `${appPassword}\n`);
    await createPrivate(connectionPath, `# Generated local credentials. Keep private; do not paste into chat.\nDATABASE_URL=postgresql://${appUser}:${appPassword}@127.0.0.1:${port}/munk\nTEST_DATABASE_URL=postgresql://${appUser}:${appPassword}@127.0.0.1:${port}/munk_test\nDATABASE_SSL=false\n`);
    await createPrivate(metadataPath, JSON.stringify({ format: 1, major: 18, port, adminUser, appUser }));
  }
  await managed();
  if (existsSync(join(data, 'PG_VERSION'))) {
    if ((await readFile(join(data, 'PG_VERSION'), 'utf8')).trim() !== '18') throw Error('Existing data has a different PostgreSQL major version; no migration/reset was attempted.');
    return;
  }
  if (existsSync(data) && (await readdir(data)).length) throw Error('Data directory contains an incomplete or unknown cluster. Refusing to initialize over it.');
  await run(initdb, ['-D', data, '--username', adminUser, '--pwfile', adminPasswordPath, '--auth', 'scram-sha-256', '--locale=C', '--encoding=UTF8']);
  console.log('Initialized persistent local PostgreSQL 18 data (no existing cluster replaced).');
}
function passwordVerifier(password: string) {
  const salt = randomBytes(16);
  const salted = pbkdf2Sync(password, salt, 4096, 32, 'sha256');
  const clientKey = createHmac('sha256', salted).update('Client Key').digest();
  const storedKey = createHash('sha256').update(clientKey).digest('base64');
  const serverKey = createHmac('sha256', salted).update('Server Key').digest('base64');
  return `SCRAM-SHA-256$4096:${salt.toString('base64')}$${storedKey}:${serverKey}`;
}
async function provision() {
  const password = (await readFile(adminPasswordPath, 'utf8')).trim();
  const appPassword = (await readFile(appPasswordPath, 'utf8')).trim();
  if (!/^[a-f0-9]{64}$/.test(password) || !/^[a-f0-9]{64}$/.test(appPassword)) throw Error('Local credential files are invalid. No password was reset.');
  const client = new pg.Client({ host: '127.0.0.1', port, user: adminUser, password, database: 'postgres', connectionTimeoutMillis: 1000, statement_timeout: 5000 });
  await client.connect();
  try {
    const settings = (await client.query("SELECT current_setting('data_directory') AS directory,current_setting('listen_addresses') AS listener,current_setting('unix_socket_directories') AS sockets")).rows[0];
    if (await realpath(settings.directory) !== await realpath(data) || settings.listener !== '127.0.0.1' || settings.sockets !== '') throw Error('Connected server is not this managed loopback-only cluster.');
    const role = (await client.query('SELECT rolsuper,rolcreatedb,rolcreaterole FROM pg_roles WHERE rolname=$1', [appUser])).rows[0];
    if (!role) {
      // Generated verifier contains no quote characters; do not interpolate an
      // arbitrary password or expose it in a SQL diagnostic.
      await client.query(`CREATE ROLE munk LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE PASSWORD '${passwordVerifier(appPassword)}'`);
    } else if (role.rolsuper || role.rolcreatedb || role.rolcreaterole) throw Error('Existing app role has unexpected administrative privileges. It was not altered.');
    for (const name of ['munk', 'munk_test']) {
      const database = (await client.query('SELECT pg_get_userbyid(datdba) AS owner FROM pg_database WHERE datname=$1', [name])).rows[0];
      if (!database) await client.query(`CREATE DATABASE ${name} OWNER munk`);
      else if (database.owner !== appUser) throw Error('Existing database has a different owner. It was not altered.');
    }
  } finally { await client.end(); }
  const app = new pg.Client({ host: '127.0.0.1', port, user: appUser, password: appPassword, database: 'munk', connectionTimeoutMillis: 1000 });
  try { await app.connect(); await app.query('SELECT 1'); } finally { await app.end(); }
}

export async function localPostgres(action = 'start') {
  const binaries = await binaryPaths();
  if (!['start', 'stop', 'status'].includes(action)) throw Error('Use start, stop or status. There is no reset/delete command.');
  if (action !== 'start') {
    if (!existsSync(metadataPath)) { console.log('No managed development cluster has been initialized.'); return; }
    await managed();
    const status = await run(binaries.control, ['-D', data, 'status'], [0, 3, 4]);
    if (status !== 0) { console.log('Managed PostgreSQL is stopped. Data is retained.'); return; }
    if (action === 'stop') {
      await run(binaries.control, ['-D', data, '-m', 'fast', '-w', '-t', '30', 'stop']);
      console.log('PostgreSQL stopped cleanly. Data and credentials are retained.');
    } else console.log(`Managed PostgreSQL is running on 127.0.0.1:${port}.`);
    return;
  }
  await initialize(binaries.initdb);
  const status = await run(binaries.control, ['-D', data, 'status'], [0, 3, 4]);
  if (status === 0) { await provision(); console.log(`Already running on 127.0.0.1:${port}; no second server started.`); return; }
  const lockPath = join(root, 'launcher.lock');
  const lock = await open(lockPath, 'wx', 0o600).catch(() => { throw Error('A launcher lock already exists. Refusing concurrent startup; no files were removed.'); });
  const log = await open(logPath, 'a', 0o600).catch(async () => {
    await lock.close(); await unlink(lockPath);
    throw Error('Could not open the private PostgreSQL log; existing data retained.');
  });
  let stopping = false;
  const child = spawn(binaries.postgres, ['-D', data, '-h', '127.0.0.1', '-p', String(port), '-c', 'unix_socket_directories='], { env, shell: false, stdio: ['ignore', log.fd, log.fd] });
  let ended = false;
  const closed = new Promise<number>((resolveResult, reject) => {
    child.once('error', () => { ended = true; reject(Error('PostgreSQL could not start. See its private log.')); });
    child.once('close', code => { ended = true; resolveResult(code ?? 1); });
  });
  void closed.catch(() => {}); // Awaited below; avoid an early unhandled spawn-error rejection.
  const stop = () => { stopping = true; if (!ended) child.kill('SIGINT'); };
  process.on('SIGINT', stop); process.on('SIGTERM', stop);
  try {
    let ready = false;
    for (let attempt = 0; attempt < 40 && !ended && !stopping; attempt++) {
      try { await provision(); ready = true; break; } catch { await delay(250); }
    }
    if (!ready) { stop(); await closed; throw Error(`Database startup could not be verified. Existing data retained; inspect ${logPath} locally.`); }
    console.log(`PostgreSQL 18 ready on 127.0.0.1:${port} (no network-facing or Unix-socket listener).`);
    console.log(`Persistent data: ${data}`);
    console.log(`Private connection settings: ${connectionPath} (values are not printed; backend/.env is unchanged).`);
    console.log('Leave this terminal open. Ctrl+C performs clean fast shutdown and retains all data.');
    const code = await closed;
    if (code !== 0) throw Error('PostgreSQL exited unsuccessfully. Data retained; inspect the private log locally.');
    console.log('PostgreSQL stopped cleanly; persistent data and credentials retained.');
  } finally {
    if (!ended) { stop(); await closed.catch(() => {}); }
    process.removeListener('SIGINT', stop); process.removeListener('SIGTERM', stop);
    await log.close(); await lock.close();
    await unlink(lockPath); // Only this invocation's own transient lock, never database data.
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  localPostgres(process.argv[2]).catch(error => {
    console.error(error instanceof Error ? error.message : 'Local PostgreSQL command failed; existing data retained.');
    process.exitCode = 1;
  });
}
