import assert from 'node:assert/strict';
import {test} from 'node:test';
import {generateKeyPairSync,randomUUID,sign} from 'node:crypto';
import {mkdtemp,readFile,rm} from 'node:fs/promises';
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
import {validationDetails} from '../src/api/validation.js';
import {Sessions} from '../src/auth/sessions.js';
import {verifiedIdentity} from '../src/auth/privy.js';
import {Houses} from '../src/domain/houses.js';
import {Admissions} from '../src/domain/admissions.js';
import {Uploads} from '../src/domain/uploads.js';
import {MediaStore} from '../src/media/store.js';
import {Processor} from '../src/jobs/processor.js';
import {command} from '../src/media/process.js';
import {isAccountSession,isLoginChallenge,isApiError} from '../../contracts/src/index.js';

test('validation diagnostics expose only known field names and fixed rules',()=>{
  const result=validationDetails([{keyword:'additionalProperties',params:{additionalProperty:'private-personal-field'}},{keyword:'pattern',instancePath:'/address',params:{pattern:'never-return-schema-or-data'}}]);
  assert.deepEqual(result.diagnostics,[{field:'_form',rule:'additionalProperties'},{field:'address',rule:'pattern'}]);
  assert.equal(JSON.stringify(result).includes('private-personal-field'),false);
  assert.equal(JSON.stringify(result).includes('never-return-schema-or-data'),false);
});

test('demo mode is explicit, local-only and forbidden in production',()=>{
  const base={DATABASE_URL:'postgresql://unused@localhost/test'};
  assert.equal(loadConfig(base).productMode,'strict');
  assert.equal(loadConfig({...base,MUNK_PRODUCT_MODE:'demo'}).productMode,'demo');
  assert.throws(()=>loadConfig({...base,MUNK_PRODUCT_MODE:'demo',NODE_ENV:'production',APP_ORIGIN:'https://localhost'}),/Demo mode/);
  assert.throws(()=>loadConfig({...base,MUNK_PRODUCT_MODE:'demo',API_HOST:'0.0.0.0'}),/Demo mode/);
  assert.throws(()=>loadConfig({...base,MUNK_PRODUCT_MODE:'demo',APP_ORIGIN:'https://example.test'}),/Demo mode/);
});

test('actual frontend House adapter → HTTP validation/session → native PostgreSQL → real media admission', {skip:!process.env.TEST_DATABASE_URL},async()=>{
  const schema=`munk_house_save_${randomUUID().replaceAll('-','')}`;
  const admin=new Pool({connectionString:process.env.TEST_DATABASE_URL});
  const directory=await mkdtemp(join(tmpdir(),'munk-house-save-'));
  let pool:Pool|undefined,app:ReturnType<typeof buildApp>|undefined;
  const nativeFetch=globalThis.fetch;
  try{
    await admin.query(`CREATE SCHEMA "${schema}"`);
    pool=new Pool({connectionString:process.env.TEST_DATABASE_URL,options:`-c search_path=${schema},public`});await migrate(pool);
    const config=loadConfig({NODE_ENV:'test',DATABASE_URL:'postgresql://unused@localhost/test',LOG_LEVEL:'silent'});
    const {privateKey,publicKey}=generateKeyPairSync('ec',{namedCurve:'prime256v1'});
    const pem=publicKey.export({format:'pem',type:'spki'}).toString();
    // Synthetic provider user lookup only; actual signature verification and
    // production session/challenge/CSRF/permissions are exercised unchanged.
    const verifier={async verify(token:string){const claims=await verifyAccessToken({access_token:token,app_id:config.privyAppId,verification_key:pem});return verifiedIdentity(claims,{id:claims.user_id,linked_accounts:[{type:'wallet',chain_type:'ethereum',address:`0x${'c'.repeat(40)}`,wallet_client_type:'metamask',user_can_sign:true,delegated:false}]});}};
    const store=new MediaStore(join(directory,'media'));
    app=buildApp({config,sessions:new Sessions(pool,verifier),creatorServices:{houses:new Houses(pool),uploads:new Uploads(pool,store),admissions:new Admissions(pool)},databaseReady:async()=>true,closeDatabase:async()=>{}});
    let base=await app.listen({host:'127.0.0.1',port:0});
    const cookies=new Map<string,string>();
    const captureCookies=(response:Response)=>{for(const c of response.headers.getSetCookie()){const pair=c.split(';')[0],at=pair.indexOf('=');cookies.set(pair.slice(0,at),pair.slice(at+1));}};
    const http=async(path:string,options:RequestInit={})=>{const result=await nativeFetch(base+path,{...options,headers:{Origin:config.appOrigin,Cookie:[...cookies].map(([k,v])=>`${k}=${v}`).join('; '),...options.headers}});captureCookies(result);return result;};
    assert.equal((await http('/api/me/houses')).status,401);
    const challenge=await (await http('/api/auth/challenge')).json();assert.ok(isLoginChallenge(challenge));
    const header=Buffer.from(JSON.stringify({alg:'ES256',typ:'JWT'})).toString('base64url');
    const payload=Buffer.from(JSON.stringify({iss:'privy.io',aud:config.privyAppId,iat:Math.floor(Date.now()/1000),exp:Math.floor(Date.now()/1000)+600,sub:'did:privy:house-save-test',sid:'house-save-test'})).toString('base64url');
    const accessToken=`${header}.${payload}.${sign('sha256',Buffer.from(`${header}.${payload}`),{key:privateKey,dsaEncoding:'ieee-p1363'}).toString('base64url')}`;
    const login=await http('/api/auth/sessions',{method:'POST',headers:{'Content-Type':'application/json','X-Login-Challenge':challenge.challenge},body:JSON.stringify({accessToken})});assert.equal(login.status,200);const session=await login.json();assert.ok(isAccountSession(session));
    const headers={'Content-Type':'application/json','X-CSRF-Token':session.csrfToken,'Idempotency-Key':randomUUID()};
    const input={address:'native-house-save',name:'Synthetic House',description:'Generated test draft',publicName:'Test creator',focus:'Films'};
    const invalid=await http('/api/houses',{method:'POST',headers,body:JSON.stringify({...input,address:'Invalid Address'})});assert.equal(invalid.status,400);const invalidBody=await invalid.json();assert.ok(isApiError(invalidBody));assert.ok(invalidBody.fieldErrors?.address);assert.equal(JSON.stringify(invalidBody).includes('Invalid Address'),false);
    console.info('Sanitized rejected request: POST houses; field=address; rule=pattern.');

    // Bundle and invoke the SAME production frontend adapter, not a hand-built
    // successful request that could conceal an adapter/contract mismatch.
    const frontend=resolve(import.meta.dirname,'../../frontend');
    const entry=join(directory,'frontend-adapter.mjs');
    await build({stdin:{resolveDir:frontend,loader:'ts',contents:"export {serverCreator} from './src/server-creator';export {setApiSession} from './src/api';"},outfile:entry,bundle:true,platform:'node',format:'esm',logLevel:'silent'});
    const requests:{method:string;fields:string[]}[]=[];
    globalThis.fetch=(async(url,options={})=>{const path=String(url);if(path==='/api/houses'||path.endsWith('/draft')&&options.method==='PATCH')requests.push({method:options.method||'GET',fields:Object.keys(JSON.parse(String(options.body)))});return http(path,options);}) as typeof fetch;
    const {serverCreator,setApiSession}=await import(pathToFileURL(entry).href);setApiSession(session.csrfToken);
    const created=await serverCreator.create(input,randomUUID());assert.ok(created.id);assert.equal(created.version,1);assert.equal(created.admissionStatus,'draft');
    await assert.rejects(serverCreator.create(input,randomUUID()),(error:unknown)=>{const e=error as {fieldErrors?:Record<string,string>};return !!e.fieldErrors?.address;});
    assert.equal((await pool.query('SELECT count(*)::int AS n FROM assets')).rows[0].n,0);
    const oldPatch=await http(`/api/houses/${created.id}/draft`,{method:'PATCH',headers,body:JSON.stringify({...input,version:created.version})});assert.equal(oldPatch.status,400);const oldError=await oldPatch.json();assert.ok(isApiError(oldError));assert.match(oldError.fieldErrors?.address??'',/must not be sent/);console.info('Sanitized rejected request: PATCH draft; field=address; rule=additionalProperties.');
    const updated=await serverCreator.update(created.id,{...input,name:'Edited synthetic House',version:created.version});assert.equal(updated.version,2);
    assert.deepEqual(requests.find(x=>x.method==='PATCH')?.fields.sort(),['description','focus','name','publicName','version']);
    const reloaded=await serverCreator.house(created.id);assert.equal(reloaded.id,created.id);assert.equal(reloaded.version,updated.version);assert.equal((await serverCreator.houses())[0].id,created.id);
    const denied=await http(`/api/houses/${created.id}/draft`,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:'',description:'',publicName:'',focus:'',version:reloaded.version})});assert.equal(denied.status,403);
    const missingIntro=await http(`/api/houses/${created.id}/admission`,{method:'POST',headers,body:JSON.stringify({version:reloaded.version,introductionAssetId:randomUUID(),faceVisible:true,publicConsent:true})});assert.equal(missingIntro.status,422);
    const tools={ffmpeg:ffmpeg.path,ffprobe:ffprobe.path};
    const source=join(directory,'generated.webm');await command(tools.ffmpeg,['-hide_banner','-loglevel','error','-nostdin','-y','-f','lavfi','-i','color=c=blue:s=64x48:r=2:d=121','-c:v','libvpx','-threads','1','-an',source]);
    const bytes=await readFile(source);const intro=await serverCreator.upload(created.id,new File([bytes],'synthetic-introduction.webm',{type:'video/webm'}),'introduction',new AbortController().signal);
    await new Processor(pool,store,tools).runOnce();assert.equal((await serverCreator.status(intro.uploadId)).state,'ready');
    // This is the sequence submitHouse actually uses: update, fresh version,
    // then admission. Previously its PATCH failed before admission could run.
    const latest=await serverCreator.update(created.id,{...input,name:updated.name,version:reloaded.version});
    await serverCreator.submit(latest,intro.assetId,new AbortController().signal);
    assert.equal((await serverCreator.house(created.id)).admissionStatus,'pending_review');
    assert.equal((await pool.query('SELECT count(*)::int AS n FROM houses')).rows[0].n,1);
    console.info('Actual frontend adapter/native HTTP: draft saved without introduction; PATCH accepted without address; reload ID/version retained; real intro processed; admission pending_review; CSRF denial preserved.');
    assert.equal((await http('/api/demo/houses',{method:'POST',headers,body:'{}'})).status,403);
    await app.close();
    app=buildApp({config:{...config,productMode:'demo'},sessions:new Sessions(pool,verifier),creatorServices:{houses:new Houses(pool,'demo'),uploads:new Uploads(pool,store),admissions:new Admissions(pool)},databaseReady:async()=>true,closeDatabase:async()=>{}});
    base=await app.listen({host:'127.0.0.1',port:0});
    assert.equal((await (await http('/api/config')).json() as {mode:string}).mode,'demo');
    const demoKey=randomUUID();
    const [blank,retried]=await Promise.all([serverCreator.createDemo({},demoKey),serverCreator.createDemo({},demoKey)]);
    assert.equal(blank.id,retried.id);assert.equal(blank.demoReady,true);assert.equal(blank.admissionStatus,'draft');assert.match(blank.address,/^demo-[a-f0-9]{32}$/);assert.ok(blank.name&&blank.publicName);
    assert.equal((await pool.query('SELECT count(*)::int AS n FROM assets WHERE house_id=$1',[blank.id])).rows[0].n,0);
    const browserDraftKey=randomUUID();
    const browserDraft={name:'Preserved synthetic draft',description:'Retained synthetic description'};
    const resumedDraft=await serverCreator.createDemo(browserDraft,browserDraftKey);
    assert.equal(resumedDraft.name,browserDraft.name);assert.equal(resumedDraft.description,browserDraft.description);assert.ok(resumedDraft.publicName);assert.match(resumedDraft.address,/^demo-/);
    assert.equal((await serverCreator.createDemo(browserDraft,browserDraftKey)).id,resumedDraft.id);
    const saved=await serverCreator.house(created.id);
    const continueKey=randomUUID(),continuation={existingHouseId:saved.id,version:saved.version};
    const continued=await serverCreator.createDemo(continuation,continueKey);
    assert.equal(continued.id,saved.id);assert.equal(continued.demoReady,true);assert.equal((await serverCreator.createDemo(continuation,continueKey)).id,saved.id);
    assert.equal((await pool.query('SELECT count(*)::int AS n FROM houses')).rows[0].n,3);
    assert.equal((await http('/api/demo/houses',{method:'POST',headers:{...headers,Cookie:''},body:'{}'})).status,401);
    assert.equal((await http('/api/demo/houses',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'})).status,403);
    assert.equal((await http(`/api/houses/${blank.id}/admission`,{method:'POST',headers,body:'{}'})).status,409);
    assert.equal((await http(`/api/houses/${blank.id}/admission?test=1`,{method:'POST',headers,body:'{}'})).status,409);
    assert.equal((await http('/api/reviews')).status,409);
    const edited=await serverCreator.updateDemo(blank.id,{name:'',publicName:'',description:'',focus:'Both',address:'edited-demo-address',version:blank.version});
    assert.equal(edited.address,'edited-demo-address');assert.ok(edited.name&&edited.publicName);assert.equal(edited.admissionStatus,'draft');
    const demoUpload=await serverCreator.upload(blank.id,new File([bytes],'automatic-title.webm',{type:'video/webm'}),'video',new AbortController().signal);
    await new Processor(pool,store,tools).runOnce();assert.equal((await serverCreator.status(demoUpload.uploadId)).state,'ready');
    assert.equal((await serverCreator.house(blank.id)).demoReady,true);
    console.info('Actual demo endpoints: blank creation/defaults, concurrent idempotent retry, existing House continuation without duplicates, editable demo address, upload without admission, auth/CSRF preserved, strict/production guards passed.');
  }finally{globalThis.fetch=nativeFetch;await app?.close();await pool?.end();await admin.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);await admin.end();await rm(directory,{recursive:true,force:true});}
});
