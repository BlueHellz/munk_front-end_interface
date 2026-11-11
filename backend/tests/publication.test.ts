import assert from 'node:assert/strict';
import {test} from 'node:test';
import {generateKeyPairSync,randomUUID,sign} from 'node:crypto';
import {mkdtemp,readFile,rm,writeFile,mkdir} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {build} from 'esbuild';
import {Pool} from 'pg';
import {verifyAccessToken} from '@privy-io/node';
import ffmpeg from '@ffmpeg-installer/ffmpeg';
import ffprobe from '@ffprobe-installer/ffprobe';
import {loadConfig} from '../src/config/env.js';
import {migrate} from '../src/db/migrations.js';
import {buildApp} from '../src/api/app.js';
import {Sessions} from '../src/auth/sessions.js';
import {verifiedIdentity} from '../src/auth/privy.js';
import {Houses} from '../src/domain/houses.js';
import {Admissions} from '../src/domain/admissions.js';
import {Uploads} from '../src/domain/uploads.js';
import {Interfaces} from '../src/domain/interfaces.js';
import {interfaceTemplate} from '../../contracts/src/interface.js';
import {Videos} from '../src/domain/videos.js';
import {MediaStore} from '../src/media/store.js';
import {Processor} from '../src/jobs/processor.js';
import {command} from '../src/media/process.js';
import {isAccountSession,isLoginChallenge} from '../../contracts/src/index.js';
import {attachBrowserPages,creatorBrowser,guestBrowser,interfaceBrowser} from './publication-browser.js';

test('real video publication: frontend creator, guest playback/seek, HTTP Range, permissions and restart', {skip:!process.env.TEST_DATABASE_URL},async()=>{
 const schema=`munk_publication_${randomUUID().replaceAll('-','')}`,directory=await mkdtemp(join(tmpdir(),'munk-publication-'));
 const admin=new Pool({connectionString:process.env.TEST_DATABASE_URL}),nativeFetch=globalThis.fetch;
 let restartProbeWritten=false;
 let pool:Pool|undefined,app:ReturnType<typeof buildApp>|undefined,base='';
 const config=loadConfig({NODE_ENV:'test',MUNK_PRODUCT_MODE:'demo',DATABASE_URL:'postgresql://unused@localhost/test',LOG_LEVEL:'silent'});
 const {privateKey,publicKey}=generateKeyPairSync('ec',{namedCurve:'prime256v1'}),pem=publicKey.export({format:'pem',type:'spki'}).toString();
 const verifier={async verify(token:string){const claims=await verifyAccessToken({access_token:token,app_id:config.privyAppId,verification_key:pem});return verifiedIdentity(claims,{id:claims.user_id,linked_accounts:[{type:'wallet',chain_type:'ethereum',address:`0x${(claims.user_id.endsWith('-b')?'b':'a').repeat(40)}`,wallet_client_type:'metamask',user_can_sign:true,delegated:false}]});}};
 const store=new MediaStore(join(directory,'media')),tools={ffmpeg:ffmpeg.path,ffprobe:ffprobe.path};
 const cookies=new Map<string,string>();
 const http=async(path:string,options:RequestInit={})=>{const r=await nativeFetch(base+path,{...options,headers:{Connection:'close',Origin:config.appOrigin,Cookie:[...cookies].map(([k,v])=>`${k}=${v}`).join('; '),...options.headers}});for(const c of r.headers.getSetCookie()){const pair=c.split(';')[0],i=pair.indexOf('=');cookies.set(pair.slice(0,i),pair.slice(i+1));}return r;};
 const start=async(mode:'demo'|'strict',port=0,browser=false)=>{
  config.productMode=mode;app=buildApp({config,sessions:new Sessions(pool!,verifier),creatorServices:{interfaces:new Interfaces(pool!),houses:new Houses(pool!,mode),admissions:new Admissions(pool!),uploads:new Uploads(pool!,store),videos:new Videos(pool!,store,mode)},databaseReady:async()=>true,closeDatabase:async()=>{}});
  if(browser)await attachBrowserPages(app);base=await app.listen({host:'127.0.0.1',port});config.appOrigin=base;
 };
 const login=async(subject:string)=>{
  const challenge=await (await http('/api/auth/challenge')).json();assert.ok(isLoginChallenge(challenge));
  const head=Buffer.from(JSON.stringify({alg:'ES256',typ:'JWT'})).toString('base64url'),payload=Buffer.from(JSON.stringify({iss:'privy.io',aud:config.privyAppId,iat:Math.floor(Date.now()/1000),exp:Math.floor(Date.now()/1000)+600,sub:subject,sid:subject+'-session'})).toString('base64url');
  const accessToken=`${head}.${payload}.${sign('sha256',Buffer.from(`${head}.${payload}`),{key:privateKey,dsaEncoding:'ieee-p1363'}).toString('base64url')}`;
  const response=await http('/api/auth/sessions',{method:'POST',headers:{'Content-Type':'application/json','X-Login-Challenge':challenge.challenge},body:JSON.stringify({accessToken})});assert.equal(response.status,200);const session=await response.json();assert.ok(isAccountSession(session));return session;
 };
 try{
  await admin.query(`CREATE SCHEMA "${schema}"`);pool=new Pool({connectionString:process.env.TEST_DATABASE_URL,options:`-c search_path=${schema},public`});await migrate(pool);
  await start('demo',0,true);const session=await login('did:privy:publication-a');
  const entry=join(directory,'adapters.mjs');await build({stdin:{resolveDir:resolve(import.meta.dirname,'../../frontend'),loader:'ts',contents:"export{serverCreator}from'./src/server-creator';export{serverVideos}from'./src/server-videos';export{setApiSession}from'./src/api';"},outfile:entry,bundle:true,platform:'node',format:'esm',logLevel:'silent'});
  globalThis.fetch=((url,options)=>String(url).startsWith('/api/')?http(String(url),options):nativeFetch(url,options)) as typeof fetch;
  const {serverCreator,serverVideos,setApiSession}=await import(pathToFileURL(entry).href);setApiSession(session.csrfToken);
  const house=await serverCreator.createDemo({},randomUUID());assert.equal(house.demoReady,true);
  const source=join(directory,'generated-video.webm');await command(tools.ffmpeg,['-hide_banner','-loglevel','error','-nostdin','-y','-f','lavfi','-i','testsrc2=s=160x120:r=12:d=6','-c:v','libvpx','-threads','1','-an',source]);
  const creator=await creatorBrowser({base,cookie:cookies.get('munk_session')!,houseId:house.id,file:source,processQueued:async()=>{
   let rows:any[]=[];for(let i=0;i<100;i++){rows=await serverVideos.list(house.id);if(rows.length&&rows[0].title==='Actual backend browser video'&&rows[0].description==='Persisted while processing.')break;await new Promise(r=>setTimeout(r,100));}
   assert.equal(rows.length,1);assert.equal(rows[0].assetState,'queued');await assert.rejects(serverVideos.publish(rows[0]),/not ready/);
   assert.equal(await new Processor(pool!,store,tools).runOnce(),true);
  }});
  const id=creator.url.split('/videos/')[1];assert.match(id,/^[a-f0-9-]{36}$/);
  const saved=(await serverVideos.list(house.id))[0];assert.equal(saved.publication,'published');assert.equal((await serverVideos.publish(saved)).id,id);assert.equal((await serverVideos.list(house.id)).length,1);
  const get=(path:string,headers:Record<string,string>={})=>nativeFetch(base+path,{headers:{Connection:'close',...headers}});
  const publicJson=await get(`/api/public/videos/${id}`);assert.equal(publicJson.status,200);const publicBody=await publicJson.json();const text=JSON.stringify(publicBody);for(const forbidden of ['accountId','wallet','source_key','playback_key','csrfToken'])assert.equal(text.includes(forbidden),false);
  const keys=(await pool.query('SELECT a.playback_key,a.poster_key FROM works w JOIN assets a ON a.id=w.video_asset_id WHERE w.id=$1',[id])).rows[0];const bytes=await readFile(store.path(keys.playback_key));
  const full=await get(`/api/public/videos/${id}/media`);assert.equal(full.status,200);assert.deepEqual(Buffer.from(await full.arrayBuffer()),bytes);
  for(const [range,start,end]of [['bytes=0-31',0,31],['bytes=32-',32,bytes.length-1],['bytes=-16',bytes.length-16,bytes.length-1]] as const){const result=await get(`/api/public/videos/${id}/media`,{Range:range});assert.equal(result.status,206);assert.equal(result.headers.get('content-range'),`bytes ${start}-${end}/${bytes.length}`);assert.deepEqual(Buffer.from(await result.arrayBuffer()),bytes.subarray(start,end+1));}
  for(const range of [`bytes=${bytes.length}-`,'bytes=10-2','bytes=0-1,3-4','bytes=-0']){const r=await get(`/api/public/videos/${id}/media`,{Range:range});assert.equal(r.status,416);assert.equal(r.headers.get('content-range'),`bytes */${bytes.length}`);await r.arrayBuffer();}
  const head=await nativeFetch(base+`/api/public/videos/${id}/media`,{method:'HEAD'});assert.equal(head.status,200);assert.equal(Number(head.headers.get('content-length')),bytes.length);assert.equal((await head.arrayBuffer()).byteLength,0);
  const publicHouse=await get(`/api/public/houses/${house.address}`);assert.equal(publicHouse.status,200);assert.equal((await publicHouse.json() as {videos:unknown[]}).videos.length,1);
  const guest=await guestBrowser(creator.url);
  await new Interfaces(pool!).save({accountId:session.account.id},{revision:0,design:{...interfaceTemplate('discovery','viewer'),font:'modern'}});
  const presentation=await interfaceBrowser({base,cookie:cookies.get('munk_session')!,houseId:house.id,address:house.address,videoId:id});
  const originalInterface=await new Interfaces(pool!).get({accountId:session.account.id});assert.equal(originalInterface.current.design.template,'compact');
  assert.equal((await nativeFetch(base+'/api/me/interface')).status,401);
  assert.equal((await http('/api/me/interface',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({revision:originalInterface.current.revision,design:originalInterface.current.design})})).status,403);
  const badDesign={revision:originalInterface.current.revision,design:{...interfaceTemplate('discovery','viewer'),script:'alert(1)'}};
  assert.equal((await http('/api/me/interface',{method:'PUT',headers:{'Content-Type':'application/json','X-CSRF-Token':session.csrfToken},body:JSON.stringify(badDesign)})).status,400);
  assert.equal((await http('/api/me/interface',{method:'PUT',headers:{'Content-Type':'application/json','X-CSRF-Token':session.csrfToken},body:JSON.stringify({revision:0,design:interfaceTemplate('cinema','viewer')})})).status,409);

  const headers={'Content-Type':'application/json','X-CSRF-Token':session.csrfToken};
  assert.equal((await nativeFetch(base+`/api/videos/${id}/publish`,{method:'POST',headers:{Origin:base,'Content-Type':'application/json'},body:JSON.stringify({version:saved.version})})).status,401);
  assert.equal((await http(`/api/videos/${id}/publish`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({version:saved.version})})).status,403);
  const draftOnly=await serverVideos.save(house.id,{clientDraftId:'private-other-draft',uploadId:saved.uploadId,title:'',description:''});assert.equal((await get(`/api/public/videos/${draftOnly.id}`)).status,404);const optionalMetadata=await serverVideos.publish(draftOnly);assert.equal(optionalMetadata.title,'Untitled video');assert.equal(optionalMetadata.description,'');await serverVideos.unpublish(optionalMetadata);
  const unpublished=await serverVideos.unpublish(saved);assert.equal((await (await get('/api/public/catalog')).json() as {id:string}[]).some(v=>v.id===id),false);assert.equal((await get(`/api/public/houses/${house.address}/interface`)).status,404);assert.equal((await get(`/api/public/videos/${id}`)).status,404);assert.equal((await get(`/api/public/videos/${id}/media`)).status,404);assert.equal((await get(`/api/public/videos/${id}/poster`)).status,404);
  const published=await serverVideos.publish(unpublished);assert.equal(published.id,id);
  const cookieA=cookies.get('munk_session')!;cookies.delete('munk_session');const other=await login('did:privy:publication-b');
  assert.equal((await http(`/api/videos/${id}/publish`,{method:'POST',headers:{'Content-Type':'application/json','X-CSRF-Token':other.csrfToken},body:JSON.stringify({version:published.version})})).status,404);
  assert.equal((await http(`/api/videos/${id}`)).status,404);
  assert.equal((await http(`/api/houses/${house.id}/interface`)).status,404);
  assert.equal((await http('/api/me/interface')).status,200);assert.equal((await new Interfaces(pool!).get({accountId:other.account.id})).current.revision,0);assert.equal((await new Interfaces(pool!).get({accountId:other.account.id})).current.design.template,'estuary');assert.equal((await (await http('/api/me/houses')).json() as unknown[]).length,0);assert.equal((await (await http('/api/public/catalog')).json() as {id:string}[]).some(v=>v.id===id),true);
  await pool.query("INSERT INTO house_memberships (house_id,account_id,role) VALUES ($1,$2,'publisher')",[house.id,other.account.id]);
  assert.equal((await http(`/api/houses/${house.id}/interface`,{method:'PUT',headers:{'Content-Type':'application/json','X-CSRF-Token':other.csrfToken},body:JSON.stringify({revision:0,design:interfaceTemplate('cinema-house','house')})})).status,404);
  cookies.set('munk_session',cookieA);setApiSession(session.csrfToken);
  const port=Number(new URL(base).port);await app!.close();await pool.end();pool=new Pool({connectionString:process.env.TEST_DATABASE_URL,options:`-c search_path=${schema},public`});
  await start('strict',port);assert.equal((await get(`/api/public/videos/${id}`)).status,404);assert.equal((await http(`/api/videos/${id}/publish`,{method:'POST',headers,body:JSON.stringify({version:published.version})})).status,403);await app!.close();
  await start('demo',port);assert.equal((await get(`/api/public/videos/${id}`)).status,200);const reopened=await get(`/api/public/videos/${id}/media`,{Range:'bytes=0-31'});assert.equal(reopened.status,206);assert.deepEqual(Buffer.from(await reopened.arrayBuffer()),bytes.subarray(0,32));assert.equal((await http('/api/me')).status,200);assert.deepEqual((await new Interfaces(pool!).get({accountId:session.account.id})).current,originalInterface.current);
  if(process.env.MUNK_TEST_INTERFACE_RESTART_PROBE){await writeFile(process.env.MUNK_TEST_INTERFACE_RESTART_PROBE,JSON.stringify({schema,accountId:session.account.id,houseId:house.id,current:originalInterface.current,houseCurrent:(await new Interfaces(pool!).get({accountId:session.account.id},house.id)).current}));restartProbeWritten=true;}
  const evidence={status:'PASS',timestamp:new Date().toISOString(),presentation,scope:'Disposable native PostgreSQL; real production adapters/HTTP/processed media. Synthetic provider lookup/test identity for creator context; no personal records.',creator:creator.scope,guest,range:'200/206/416/HEAD and byte equality PASS',publicationAfterApiPoolStoreRestart:true,strictModeDoesNotExposeDemoVideo:true,unpublishedMediaDenied:true,ownershipAndCsrfDenied:true,duplicatePublishDoesNotDuplicateWork:true};
  const output=resolve(import.meta.dirname,'../../artifacts/publication');await mkdir(output,{recursive:true});await writeFile(join(output,'native-browser-results.json'),JSON.stringify(evidence,null,2));const interfaceOutput=resolve(import.meta.dirname,'../../artifacts/interface-foundation');await mkdir(interfaceOutput,{recursive:true});await writeFile(join(interfaceOutput,'native-browser-results.json'),JSON.stringify(evidence,null,2));const appearanceOutput=resolve(import.meta.dirname,'../../artifacts/appearance-flow');await mkdir(appearanceOutput,{recursive:true});await writeFile(join(appearanceOutput,'browser-results.json'),JSON.stringify({status:'PASS',timestamp:evidence.timestamp,presentation},null,2));console.info('Actual publication PASS: creator UI → real upload/metadata/publish → separate guest playback and seek → real House listing → Range permissions/unpublish → API/pool/media reopen. No public/processing state mocked.');
 }finally{globalThis.fetch=nativeFetch;await app?.close();await pool?.end();if(!restartProbeWritten)await admin.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);await admin.end();await rm(directory,{recursive:true,force:true});}
});
