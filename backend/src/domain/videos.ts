import type {Pool,PoolClient} from 'pg';
import type {ProductMode,ServerVideo,PublicHouse,PublicVideo,VideoInput} from '../../../contracts/src/index.js';
import {memberHouse,type Actor} from './access.js';
import {transaction} from '../db/transaction.js';
import {DomainError,conflict} from '../api/errors.js';
import {MediaStore} from '../media/store.js';

type Row={id:string;house_id:string;upload_session_id:string;video_asset_id:string;client_draft_id:string;title:string;description:string;series_name:string;episode:number|null;publication:'draft'|'published'|'unpublished';published_at:Date|null;version:number;asset_state:string};
const view=(w:Row):ServerVideo=>({id:w.id,houseId:w.house_id,uploadId:w.upload_session_id,assetId:w.video_asset_id,clientDraftId:w.client_draft_id,title:w.title,description:w.description,seriesName:w.series_name,episode:w.episode,publication:w.publication,publishedAt:w.published_at?new Date(w.published_at).toISOString():null,version:w.version,assetState:w.asset_state,viewerPath:w.publication==='published'?`#/videos/${w.id}`:null});
const select=`SELECT w.*,a.state AS asset_state FROM works w JOIN assets a ON a.id=w.video_asset_id`;
const hidden=():never=>{throw new DomainError(404,'not_found','Video is not available.');};
export class Videos{
 constructor(private pool:Pool,readonly store:MediaStore,private mode:ProductMode){}
 private async owned(client:PoolClient,actor:Actor,id:string){
  const found=(await client.query<{house_id:string}>('SELECT house_id FROM works WHERE id=$1',[id])).rows[0];if(!found)return hidden();
  const house=await memberHouse(client,actor,found.house_id);
  const work=(await client.query<Row>(select+' WHERE w.id=$1 AND w.created_by=$2 FOR UPDATE OF w,a',[id,actor.accountId])).rows[0];if(!work)return hidden();return {house,work};
 }
 async list(actor:Actor,houseId:string){return transaction(this.pool,async c=>{await memberHouse(c,actor,houseId);return (await c.query<Row>(select+' WHERE w.house_id=$1 AND w.created_by=$2 AND w.upload_session_id IS NOT NULL AND w.client_draft_id IS NOT NULL ORDER BY w.created_at DESC,w.id LIMIT 100',[houseId,actor.accountId])).rows.map(view);});}
 async get(actor:Actor,id:string){return transaction(this.pool,async c=>view((await this.owned(c,actor,id)).work));}
 async save(actor:Actor,houseId:string,input:VideoInput){return transaction(this.pool,async c=>{
  await memberHouse(c,actor,houseId);
  const asset=(await c.query<{id:string;state:string}>(`SELECT a.id,a.state FROM upload_sessions u JOIN assets a ON a.id=u.asset_id WHERE u.id=$1 AND u.account_id=$2 AND a.house_id=$3 AND a.purpose='video' FOR SHARE OF u,a`,[input.uploadId,actor.accountId,houseId])).rows[0];
  if(!asset)return hidden();
  const prior=(await c.query<Row>(select+' WHERE w.house_id=$1 AND w.created_by=$2 AND w.client_draft_id=$3 FOR UPDATE OF w',[houseId,actor.accountId,input.clientDraftId])).rows[0];
  const title=input.title.trim()||'Untitled video',series=input.seriesName||'',episode=input.episode??null;
  if(prior){
   const same=prior.title===title&&prior.description===input.description&&prior.video_asset_id===asset.id&&prior.series_name===series&&prior.episode===episode;
   if(same)return view(prior);
   if(prior.publication==='published')conflict('Unpublish before changing this published video.');
   if(prior.version!==input.version)conflict('Video changed. Reload its server details before saving.');
   await c.query('UPDATE works SET title=$2,description=$3,video_asset_id=$4,upload_session_id=$5,series_name=$6,episode=$7,version=version+1,updated_at=now() WHERE id=$1',[prior.id,title,input.description,asset.id,input.uploadId,series,episode]);
   return view((await c.query<Row>(select+' WHERE w.id=$1',[prior.id])).rows[0]);
  }
  const result=await c.query<{id:string}>(`INSERT INTO works (house_id,created_by,client_draft_id,upload_session_id,title,description,video_asset_id,series_name,episode) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id`,[houseId,actor.accountId,input.clientDraftId,input.uploadId,title,input.description,asset.id,series,episode]);
  return view((await c.query<Row>(select+' WHERE w.id=$1',[result.rows[0].id])).rows[0]);
 });}
 async publish(actor:Actor,id:string,version:number){return transaction(this.pool,async c=>{
  const {house,work}=await this.owned(c,actor,id);
  if(!(house.admission_status==='admitted'||this.mode==='demo'&&house.demo_ready))throw new DomainError(403,'forbidden',this.mode==='demo'?'Continue this House as a demo House before publishing.':'Strict publication requires an admitted House.');
  if(work.asset_state!=='ready')conflict('The video is not ready. Wait for processing, or check Uploads & processing for errors.');
  const asset=(await c.query<{playback_key:string;poster_key:string;purpose:string}>('SELECT playback_key,poster_key,purpose FROM assets WHERE id=$1 AND house_id=$2',[work.video_asset_id,house.id])).rows[0];
  if(!asset||asset.purpose!=='video')return hidden();
  try{if(!(await this.store.size(asset.playback_key))||!(await this.store.size(asset.poster_key)))throw Error();}catch{throw new DomainError(503,'unavailable','Processed video files are unavailable. Check the worker and media storage.');}
  if(work.publication==='published')return view(work);
  if(work.version!==version)conflict('Video changed. Reload before publishing.');
  await c.query("UPDATE works SET publication='published',published_at=now(),version=version+1,updated_at=now() WHERE id=$1",[id]);
  return view((await c.query<Row>(select+' WHERE w.id=$1',[id])).rows[0]);
 });}
 async unpublish(actor:Actor,id:string,version:number){return transaction(this.pool,async c=>{
  const {work}=await this.owned(c,actor,id);if(work.publication!=='published')return view(work);
  if(work.version!==version)conflict('Video changed. Reload before unpublishing.');
  await c.query("UPDATE works SET publication='unpublished',version=version+1,updated_at=now() WHERE id=$1",[id]);return view((await c.query<Row>(select+' WHERE w.id=$1',[id])).rows[0]);
 });}
 private publicQuery(){return `SELECT w.id,w.title,w.description,w.series_name,w.episode,w.published_at,a.duration_ms,a.playback_key,a.poster_key,h.id AS house_id,h.address,h.name,h.public_name,h.description AS house_description,h.demo_ready,EXISTS(SELECT 1 FROM assets intro WHERE intro.house_id=h.id AND intro.purpose='introduction' AND intro.state='ready') AS introduction_present,EXISTS(SELECT 1 FROM admission_submissions si JOIN assets ai ON ai.id=si.introduction_asset_id AND ai.house_id=h.id WHERE si.house_id=h.id AND si.revision=h.admission_revision AND si.public_information_consent=true AND h.admission_status='admitted' AND ai.state='ready') AS introduction_public FROM works w JOIN assets a ON a.id=w.video_asset_id AND a.house_id=w.house_id JOIN houses h ON h.id=w.house_id JOIN accounts operator ON operator.id=h.operator_account_id JOIN accounts author ON author.id=w.created_by AND author.status='active' WHERE w.publication='published' AND a.purpose='video' AND a.state='ready' AND operator.status='active' AND (h.admission_status='admitted' OR ($1::boolean AND h.demo_ready))`;}
 private publicView(row:Record<string,unknown>):PublicVideo{
  const house:PublicHouse={id:String(row.house_id),address:String(row.address),name:String(row.name),creatorName:String(row.public_name),description:String(row.house_description),demo:row.demo_ready===true,introductionPresent:row.introduction_present===true,...(row.introduction_public===true?{introductionUrl:`/api/public/houses/${row.address}/introduction`}:{})};
  return {id:String(row.id),title:String(row.title),description:String(row.description),seriesName:String(row.series_name),episode:row.episode as number|null,publishedAt:new Date(row.published_at as Date).toISOString(),durationMs:Number(row.duration_ms),house,mediaUrl:`/api/public/videos/${row.id}/media`,posterUrl:`/api/public/videos/${row.id}/poster`};
 }
 async catalog(){return (await this.pool.query(this.publicQuery()+' ORDER BY w.published_at DESC,w.id',[this.mode==='demo'])).rows.map(r=>this.publicView(r));}
 async houseCatalog(id:string){return (await this.pool.query(this.publicQuery()+' AND h.id=$2 ORDER BY w.published_at DESC,w.id',[this.mode==='demo',id])).rows.map(r=>this.publicView(r));}
 async publicVideo(id:string){const row=(await this.pool.query(this.publicQuery()+' AND w.id=$2',[this.mode==='demo',id])).rows[0];if(!row)return hidden();return this.publicView(row);}
 async publicHouse(address:string){
  const row=(await this.pool.query(`SELECT h.id,h.address,h.name,h.public_name,h.description,h.demo_ready,
   EXISTS(SELECT 1 FROM assets a WHERE a.house_id=h.id AND a.purpose='introduction' AND a.state='ready') introduction_present,
   EXISTS(SELECT 1 FROM admission_submissions s JOIN assets a ON a.id=s.introduction_asset_id AND a.house_id=h.id WHERE s.house_id=h.id AND s.revision=h.admission_revision AND s.public_information_consent=true AND h.admission_status='admitted' AND a.state='ready') introduction_public
   FROM houses h JOIN accounts operator ON operator.id=h.operator_account_id AND operator.status='active'
   WHERE h.address=$1 AND (h.admission_status='admitted' OR ($2::boolean AND h.demo_ready))`,[address,this.mode==='demo'])).rows[0];
  if(!row)return hidden();const house:PublicHouse={id:row.id,address:row.address,name:row.name,creatorName:row.public_name,description:row.description,demo:row.demo_ready,introductionPresent:row.introduction_present,...(row.introduction_public?{introductionUrl:`/api/public/houses/${row.address}/introduction`}:{})};return {house,videos:await this.houseCatalog(row.id)};
 }
 async introductionKey(address:string){await this.publicHouse(address);const row=(await this.pool.query(`SELECT a.playback_key FROM houses h JOIN admission_submissions s ON s.house_id=h.id AND s.revision=h.admission_revision JOIN assets a ON a.id=s.introduction_asset_id AND a.house_id=h.id WHERE h.address=$1 AND h.admission_status='admitted' AND s.public_information_consent=true AND a.purpose='introduction' AND a.state='ready'`,[address])).rows[0];if(!row)return hidden();return String(row.playback_key);}
 async mediaKey(id:string,poster=false){const row=(await this.pool.query(this.publicQuery()+' AND w.id=$2',[this.mode==='demo',id])).rows[0];if(!row)return hidden();return String(poster?row.poster_key:row.playback_key);}
}
