import { loadConfig } from '../config/env.js';
import { createPool } from '../db/pool.js';
import { transaction } from '../db/transaction.js';
async function main(){
  const id=process.argv[2];
  if(!id||!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id))throw Error('Pass an existing MUNK account UUID.');
  const pool=createPool(loadConfig());
  try{await transaction(pool,async client=>{
    const account=await client.query("SELECT a.id FROM accounts a JOIN account_identities i ON i.account_id=a.id WHERE a.id=$1 AND a.status='active' AND i.provider='privy' FOR UPDATE OF a",[id]);
    if(!account.rows[0])throw Error('A real Privy-linked MUNK account is required.');
    await client.query('INSERT INTO reviewer_capabilities (account_id) VALUES ($1) ON CONFLICT DO NOTHING',[id]);
  });console.log('Manual creator review capability granted. Self-review remains prohibited.');}
  finally{await pool.end();}
}
main().catch(()=>{console.error('Reviewer grant failed. Supply an existing Privy-linked MUNK account UUID and check local database configuration.');process.exitCode=1;});
