import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

export const backendRoot = fileURLToPath(new URL('../../', import.meta.url));
export type Config = {
  environment: 'development' | 'test' | 'production';
  productMode: 'strict'|'demo';
  host: string;
  port: number;
  appOrigin: string;
  databaseUrl: string;
  databaseSsl: boolean;
  databasePoolMax: number;
  mediaRoot: string;
  ffmpegPath: string;
  ffprobePath: string;
  privyAppId: string;
  privyAppSecret?: string;
  logLevel: 'fatal' | 'error' | 'warn' | 'info' | 'debug' | 'trace' | 'silent';
};

function integer(value: string | undefined, fallback: number, max: number, name: string): number {
  if (value === undefined) return fallback;
  if (!/^[1-9]\d*$/.test(value) || !Number.isSafeInteger(Number(value)) || Number(value) > max) {
    throw new Error(`${name} must be an integer between 1 and ${max}.`);
  }
  return Number(value);
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const environment = env.NODE_ENV ?? 'development';
  if (!['development', 'test', 'production'].includes(environment)) throw new Error('NODE_ENV is invalid.');
  const databaseUrl = env.DATABASE_URL;
  if (!databaseUrl) throw new Error('DATABASE_URL is required. Copy backend/.env.example to backend/.env and configure a local database.');
  let database: URL;
  try { database = new URL(databaseUrl); } catch { throw new Error('DATABASE_URL must be a PostgreSQL URL.'); }
  if (!['postgres:', 'postgresql:'].includes(database.protocol) || !database.hostname || database.pathname.length < 2 || database.hash || database.search) {
    throw new Error('DATABASE_URL must name a PostgreSQL host and database, without query parameters or fragments. Use DATABASE_SSL for TLS.');
  }
  if (env.DATABASE_SSL !== undefined && !['true', 'false'].includes(env.DATABASE_SSL)) throw new Error('DATABASE_SSL must be true or false.');
  let origin: URL;
  try { origin = new URL(env.APP_ORIGIN ?? 'http://localhost:5173'); } catch { throw new Error('APP_ORIGIN is invalid.'); }
  if (!['http:', 'https:'].includes(origin.protocol) || origin.username || origin.password || origin.search || origin.hash || origin.pathname !== '/') {
    throw new Error('APP_ORIGIN must be an HTTP(S) origin without credentials, path, query or fragment.');
  }
  if (environment === 'production' && origin.protocol !== 'https:') throw new Error('APP_ORIGIN must use HTTPS in production.');
  const logLevel = env.LOG_LEVEL ?? 'info';
  if (!['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'].includes(logLevel)) throw new Error('LOG_LEVEL is invalid.');
  const host = env.API_HOST ?? '127.0.0.1';
  if (!host.trim() || /[\s/]/.test(host)) throw new Error('API_HOST is invalid.');
  const productMode=env.MUNK_PRODUCT_MODE??'strict';
  if(!['strict','demo'].includes(productMode))throw Error('MUNK_PRODUCT_MODE must be strict or demo.');
  if(productMode==='demo'&&(environment==='production'||!['localhost','127.0.0.1','::1'].includes(host)||!['localhost','127.0.0.1','[::1]'].includes(origin.hostname)))throw Error('Demo mode requires non-production loopback API and frontend origins.');
  return {
    productMode:productMode as Config['productMode'],environment: environment as Config['environment'], host,
    port: integer(env.API_PORT, 3001, 65535, 'API_PORT'), appOrigin: origin.origin,
    databaseUrl, databaseSsl: env.DATABASE_SSL === 'true',
    databasePoolMax: integer(env.DATABASE_POOL_MAX, 5, 50, 'DATABASE_POOL_MAX'),
    mediaRoot: resolve(backendRoot, env.MEDIA_ROOT ?? '.data/media'),
    ffmpegPath: env.FFMPEG_PATH ?? 'ffmpeg', ffprobePath: env.FFPROBE_PATH ?? 'ffprobe',
    privyAppId: env.PRIVY_APP_ID ?? 'cmvrdnznc00we0glcf33db0xh', privyAppSecret: env.PRIVY_APP_SECRET || undefined,
    logLevel: logLevel as Config['logLevel'],
  };
}
