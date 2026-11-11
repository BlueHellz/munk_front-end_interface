import pg from 'pg';
import type { Config } from '../config/env.js';

export function createPool(config: Config, onError: () => void = () => {}): pg.Pool {
  const pool = new pg.Pool({
    connectionString: config.databaseUrl,
    ssl: config.databaseSsl ? { rejectUnauthorized: true } : false,
    max: config.databasePoolMax,
    connectionTimeoutMillis: 3000,
    idleTimeoutMillis: 10000,
    statement_timeout: 10000,
    application_name: 'munk-backend',
  });
  // Idle connection errors must not become uncaught EventEmitter errors.
  pool.on('error', onError);
  return pool;
}
