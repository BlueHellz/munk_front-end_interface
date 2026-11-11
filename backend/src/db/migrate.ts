import { loadConfig } from '../config/env.js';
import { createPool } from './pool.js';
import { migrate } from './migrations.js';

async function main() {
  const pool = createPool(loadConfig());
  try {
    const completed = await migrate(pool);
    console.log(completed.length ? `Applied: ${completed.join(', ')}` : 'Database migrations are up to date.');
  } finally { await pool.end(); }
}
main().catch(() => {
  // Driver errors may contain query data or credentials; do not dump them.
  console.error('Migration failed. Check database connectivity and migration history. No automatic reset was performed.');
  process.exitCode = 1;
});
