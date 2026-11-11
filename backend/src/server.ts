import{Appearance}from'./domain/appearance.js';
import{Community}from'./domain/community.js';
import { loadConfig } from './config/env.js';
import { createPool } from './db/pool.js';
import { databaseReady } from './db/migrations.js';
import { buildApp } from './api/app.js';
import { Houses } from './domain/houses.js';
import {Interfaces} from './domain/interfaces.js';
import {Videos} from './domain/videos.js';
import { Admissions } from './domain/admissions.js';
import { Uploads } from './domain/uploads.js';
import { MediaStore } from './media/store.js';
import { Sessions } from './auth/sessions.js';
import { PrivyIdentityVerifier } from './auth/privy.js';

async function main() {
  const config = loadConfig();
  const pool = createPool(config, () => console.error('Database connection lost.'));
  const creatorServices = { appearance:new Appearance(pool), community:new Community(pool,config.productMode), interfaces:new Interfaces(pool), houses: new Houses(pool,config.productMode), uploads: new Uploads(pool, new MediaStore(config.mediaRoot)), admissions: new Admissions(pool),videos:new Videos(pool,new MediaStore(config.mediaRoot),config.productMode) };
  const sessions = new Sessions(pool,new PrivyIdentityVerifier(config));
  const app = buildApp({ config, creatorServices,sessions, databaseReady: () => databaseReady(pool), closeDatabase: () => pool.end() });
  let stopping = false;
  const shutdown = async () => {
    if (stopping) return;
    stopping = true;
    try { await app.close(); } catch { process.exitCode = 1; }
  };
  process.once('SIGINT', shutdown);
  process.once('SIGTERM', shutdown);
  try { await app.listen({ host: config.host, port: config.port }); }
  catch (error) { await shutdown(); throw error; }
}
main().catch(() => {
  console.error('API startup failed. Check backend configuration and port availability.');
  process.exitCode = 1;
});
