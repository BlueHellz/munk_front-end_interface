import type {Pool,PoolClient} from 'pg';
import {interfaceTemplate,type InterfaceDesign,type InterfaceRecord,type InterfaceScope} from '../../../contracts/src/index.js';
import {activeAccount,memberHouse,type Actor} from './access.js';
import {transaction} from '../db/transaction.js';
import {DomainError,conflict} from '../api/errors.js';
const record=(r:any):InterfaceRecord=>({revision:r.revision,design:r.design,updatedAt:new Date(r.updated_at).toISOString()});
export class Interfaces{
 constructor(private pool:Pool){}
 private async access(c:PoolClient,actor:Actor,house?:string){if(house){const h=await memberHouse(c,actor,house,true);if(h.operator_account_id!==actor.accountId)throw new DomainError(403,'forbidden','Only the House operator can change its interface.');}else await activeAccount(c,actor);}
 private target(actor:Actor,house?:string){return {column:house?'house_id':'account_id',id:house||actor.accountId,scope:(house?'house':'viewer') as InterfaceScope};}
 async get(actor:Actor,house?:string){return transaction(this.pool,async c=>{await this.access(c,actor,house);const t=this.target(actor,house),row=(await c.query(`SELECT * FROM interface_designs WHERE ${t.column}=$1`,[t.id])).rows[0];const history=row?(await c.query('SELECT * FROM interface_design_versions WHERE design_id=$1 ORDER BY revision DESC LIMIT 30',[row.id])).rows.map(record):[];return {current:row?record(row):{revision:0,design:interfaceTemplate(house?'cinema-house':'estuary',t.scope),updatedAt:null},history};});}
 async save(actor:Actor,input:{revision:number;design:InterfaceDesign},house?:string){return transaction(this.pool,async c=>{
  await this.access(c,actor,house);const t=this.target(actor,house),d=input.design;
  if(d.scope!==t.scope||(t.scope==='viewer'?!['estuary','browse','cinema-viewer','silvo-viewer','ah2-viewer','discovery','cinema','compact'].includes(d.template):!['cinema-house','editorial-house'].includes(d.template))||new Set(d.sections.map(s=>s.id)).size!==d.sections.length)throw new DomainError(400,'validation','Design scope, template or section IDs are invalid.');
  const row=(await c.query(`SELECT * FROM interface_designs WHERE ${t.column}=$1 FOR UPDATE`,[t.id])).rows[0];
  if((row?.revision||0)!==input.revision)conflict('This interface changed in another browser. Reload saved design before applying your edits.');
  const saved=(await c.query(`INSERT INTO interface_designs (${t.column},revision,design) VALUES ($1,1,$2) ON CONFLICT (${t.column}) DO UPDATE SET revision=interface_designs.revision+1,design=EXCLUDED.design,updated_at=now() RETURNING *`,[t.id,JSON.stringify(d)])).rows[0];
  await c.query('INSERT INTO interface_design_versions (design_id,revision,design) VALUES ($1,$2,$3)',[saved.id,saved.revision,JSON.stringify(d)]);return record(saved);
 });}
 async publicHouse(house:string){const row=(await this.pool.query('SELECT * FROM interface_designs WHERE house_id=$1',[house])).rows[0];return row?record(row):{revision:0,design:interfaceTemplate('cinema-house','house'),updatedAt:null};}
}
