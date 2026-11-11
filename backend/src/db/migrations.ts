import { createHash } from 'node:crypto';
import { readdir, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import type { Pool } from 'pg';

export const migrationsDirectory = fileURLToPath(new URL('../../migrations/', import.meta.url));
export type Migration = { name: string; sql: string; checksum: string };
export type MigrationRecord = { name: string; checksum: string };

export async function readMigrations(directory = migrationsDirectory): Promise<Migration[]> {
  const names = (await readdir(directory)).filter(name => name.endsWith('.sql')).sort();
  const versions = new Set<string>();
  return Promise.all(names.map(async name => {
    if (!/^\d{4}_[a-z0-9_]+\.sql$/.test(name) || versions.has(name.slice(0, 4))) throw new Error('Invalid or duplicate migration version.');
    versions.add(name.slice(0, 4));
    const sql = await readFile(resolve(directory, name), 'utf8');
    return { name, sql, checksum: createHash('sha256').update(sql).digest('hex') };
  }));
}

/** Applied migrations must remain an unchanged prefix of source migrations. */
export function pendingMigrations(source: Migration[], applied: MigrationRecord[]): Migration[] {
  for (const [index, migration] of applied.entries()) {
    if (source[index]?.name !== migration.name || source[index]?.checksum !== migration.checksum) {
      throw new Error('Database migration history does not match source. Restore original migrations; add a new migration for changes.');
    }
  }
  return source.slice(applied.length);
}

export async function migrate(pool: Pool, source?: Migration[]): Promise<string[]> {
  const migrations = source ?? await readMigrations();
  const client = await pool.connect();
  let locked = false;
  let discard = false;
  const completed: string[] = [];
  try {
    // Session lock serializes independent migration runners, including table creation.
    await client.query("SELECT pg_advisory_lock(687117, 1)");
    locked = true;
    await client.query(`CREATE TABLE IF NOT EXISTS schema_migrations (
      name text PRIMARY KEY, checksum text NOT NULL CHECK (checksum ~ '^[0-9a-f]{64}$'),
      applied_at timestamptz NOT NULL DEFAULT now()
    )`);
    const applied = await client.query<MigrationRecord>('SELECT name, checksum FROM schema_migrations ORDER BY name');
    for (const migration of pendingMigrations(migrations, applied.rows)) {
      await client.query('BEGIN');
      try {
        await client.query(migration.sql);
        await client.query('INSERT INTO schema_migrations (name, checksum) VALUES ($1, $2)', [migration.name, migration.checksum]);
        await client.query('COMMIT');
        completed.push(migration.name);
      } catch (error) {
        try { await client.query('ROLLBACK'); } catch { discard = true; }
        throw error;
      }
    }
    return completed;
  } finally {
    if (locked && !discard) {
      try { await client.query('SELECT pg_advisory_unlock(687117, 1)'); } catch { discard = true; }
    }
    client.release(discard);
  }
}

export async function databaseReady(pool: Pool): Promise<boolean> {
  const applied = await pool.query<MigrationRecord>('SELECT name, checksum FROM schema_migrations ORDER BY name');
  return pendingMigrations(await readMigrations(), applied.rows).length === 0;
}
