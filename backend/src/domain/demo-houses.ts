import {createHash,randomUUID} from 'node:crypto';
import type {Pool} from 'pg';
import type {DemoHouseInput} from '../../../contracts/src/creator.js';
import {activeAccount,memberHouse,type Actor,type HouseRow} from './access.js';
import {transaction} from '../db/transaction.js';
import {DomainError,conflict,invalid} from '../api/errors.js';

/** Called only by Houses.createDemo after its server mode check. */
export async function createDemoHouse(pool:Pool,actor:Actor,input:DemoHouseInput,key:string):Promise<HouseRow>{
  if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(key))invalid('A UUID idempotency key is required.');
  const fingerprint=createHash('sha256').update(JSON.stringify([input.existingHouseId,input.version,input.address,input.name,input.description,input.publicName,input.focus])).digest('hex');
  try{return await transaction(pool,async client=>{
    await activeAccount(client,actor);
    const prior=(await client.query("SELECT * FROM creation_requests WHERE account_id=$1 AND operation='demo-house' AND request_key=$2",[actor.accountId,key])).rows[0];
    if(prior){if(prior.fingerprint!==fingerprint)conflict('Retry the original creation request without changing its contents.');return memberHouse(client,actor,prior.resource_id,true);}
    const existing=input.existingHouseId?await memberHouse(client,actor,input.existingHouseId,true):null;
    if(existing&&existing.version!==input.version)conflict('House changed. Reload before continuing it as a demo House.');
    const name=(input.name??existing?.name)?.trim()||'My demo House';
    const publicName=(input.publicName??existing?.public_name)?.trim()||'Demo creator';
    const description=input.description??existing?.description??'';
    const focus=input.focus?.trim()||existing?.focus||'Both';
    const address=input.address?.trim()||existing?.address||`demo-${randomUUID().replaceAll('-','')}`;
    for(const [field,value,max] of [['name',name,120],['publicName',publicName,80],['description',description,4000],['focus',focus,120]] as const)
      if(typeof value!=='string'||[...value].length>max)throw new DomainError(422,'validation','Check the highlighted fields.',{[field]:`Use at most ${max} characters.`});
    if(!/^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$/.test(address))throw new DomainError(422,'validation','Choose a valid address or leave it blank.',{address:'Use lowercase letters, numbers and hyphens, or leave blank for an automatic address.'});
    let row:HouseRow;
    if(existing){
      const changed=existing.name!==name||existing.public_name!==publicName||existing.description!==description||existing.focus!==focus;
      const result=await client.query<HouseRow>(`UPDATE houses SET demo_ready=true,name=$2,public_name=$3,description=$4,focus=$5,
        admission_status=CASE WHEN $6 THEN 'draft' ELSE admission_status END,
        admission_revision=admission_revision+CASE WHEN $6 AND admission_status<>'draft' THEN 1 ELSE 0 END,
        version=version+CASE WHEN $6 OR NOT demo_ready THEN 1 ELSE 0 END,updated_at=now() WHERE id=$1 RETURNING *`,[existing.id,name,publicName,description,focus,changed]);
      row={...result.rows[0],membership_role:'owner'};
    }else{
      const id=randomUUID();const result=await client.query<HouseRow>(`INSERT INTO houses (id,address,name,description,public_name,focus,founder_account_id,operator_account_id,demo_ready)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$7,true) RETURNING *`,[id,address,name,description,publicName,focus,actor.accountId]);
      await client.query("INSERT INTO house_memberships (house_id,account_id,role) VALUES ($1,$2,'owner')",[id,actor.accountId]);row={...result.rows[0],membership_role:'owner'};
    }
    await client.query("INSERT INTO creation_requests (account_id,operation,request_key,fingerprint,resource_id) VALUES ($1,'demo-house',$2,$3,$4)",[actor.accountId,key,fingerprint,row.id]);return row;
  });}catch(error){if((error as {code?:string}).code==='23505')throw new DomainError(409,'conflict','House address is reserved.',{address:'Choose another address or leave blank for an automatic address.'});throw error;}
}
