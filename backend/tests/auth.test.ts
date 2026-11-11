import assert from 'node:assert/strict';
import { test } from 'node:test';
import { generateKeyPairSync, sign, randomUUID } from 'node:crypto';
import { PGlite } from '@electric-sql/pglite';
import { Pool } from 'pg';
import { verifyAccessToken } from '@privy-io/node';
import { Sessions, tokenHash } from '../src/auth/sessions.js';
import { verifiedIdentity, PrivyIdentityVerifier } from '../src/auth/privy.js';
import { buildApp } from '../src/api/app.js';
import { Houses } from '../src/domain/houses.js';
import { Uploads } from '../src/domain/uploads.js';
import { Admissions } from '../src/domain/admissions.js';
import { MediaStore } from '../src/media/store.js';
import { migrate } from '../src/db/migrations.js';
import { loadConfig } from '../src/config/env.js';

const config=loadConfig({NODE_ENV:'test',DATABASE_URL:'postgresql://test@localhost/test',LOG_LEVEL:'silent'});
const {privateKey,publicKey}=generateKeyPairSync('ec',{namedCurve:'prime256v1'});
const publicPem=publicKey.export({format:'pem',type:'spki'}).toString();
const jwt=(changes:Record<string,unknown>={})=>{
  const head=Buffer.from(JSON.stringify({alg:'ES256',typ:'JWT'})).toString('base64url');
  const body=Buffer.from(JSON.stringify({iss:'privy.io',aud:config.privyAppId,iat:Math.floor(Date.now()/1000),exp:Math.floor(Date.now()/1000)+300,sub:'did:privy:fixture-a',sid:'provider-session-a',...changes})).toString('base64url');
  return `${head}.${body}.${sign('sha256',Buffer.from(`${head}.${body}`),{key:privateKey,dsaEncoding:'ieee-p1363'}).toString('base64url')}`;
};
const verifier={async verify(token:string){
  const claims=await verifyAccessToken({access_token:token,app_id:config.privyAppId,verification_key:publicPem});
  // Only provider user lookup is a fixture. Tokens use real ES256 signatures and
  // the installed Privy SDK verifier. No test keys/config are used by server.ts.
  const address=claims.user_id.endsWith('-b')?'b':'a';
  return verifiedIdentity(claims,{id:claims.user_id,linked_accounts:[{type:'wallet',chain_type:'ethereum',address:`0x${address.repeat(40)}`,wallet_client_type:'metamask',user_can_sign:true,delegated:false}]});
}};
function wasmPool(db:PGlite):Pool{
  const query=async(sql:string,values?:unknown[])=>{const result=values?await db.query(sql,values):(await db.exec(sql)).at(-1)!;return {...result,rowCount:result.rows.length||result.affectedRows||0};};
  return {query,connect:async()=>({query,release(){}})} as unknown as Pool;
}

test('Privy SDK verifies actual signatures and rejects tampering, wrong app/issuer and expiry',async()=>{
  assert.equal((await verifier.verify(jwt())).subject,'did:privy:fixture-a');
  for(const token of [jwt({aud:'wrong-app'}),jwt({iss:'evil.invalid'}),jwt({exp:1}),`${jwt().split('.').slice(0,2).join('.')}.invalid`])await assert.rejects(verifier.verify(token));
  await assert.rejects(new PrivyIdentityVerifier(config).verify(jwt()),/PRIVY_APP_SECRET/);
  const claims=await verifyAccessToken({access_token:jwt(),app_id:config.privyAppId,verification_key:publicPem});
  assert.throws(()=>verifiedIdentity(claims,{id:claims.user_id,is_guest:true,linked_accounts:[]}),/Invalid/);
  assert.throws(()=>verifiedIdentity(claims,{id:claims.user_id,linked_accounts:[{type:'wallet',chain_type:'ethereum',address:`0x${'a'.repeat(40)}`,wallet_client_type:'privy',id:'fixture-wallet',delegated:true}]}),/user-controlled/);
});

async function exercise(pool:Pool){
  await migrate(pool);
  const sessions=new Sessions(pool,verifier);
  const services={houses:new Houses(pool),uploads:new Uploads(pool,new MediaStore('/private/tmp/munk-auth-test-unused')),admissions:new Admissions(pool)};
  const app=buildApp({config,sessions,creatorServices:services,databaseReady:async()=>true,closeDatabase:async()=>{}});
  const jar=new Map<string,string>();
  const request=async(method:'GET'|'POST'|'DELETE',url:string,payload?:Record<string,unknown>,headers:Record<string,string>={})=>{
    const result=await app.inject({method,url,headers:{origin:config.appOrigin,cookie:[...jar].map(([k,v])=>`${k}=${v}`).join('; '),...headers},payload});
    for(const c of result.cookies){if(c.maxAge===0)jar.delete(c.name);else jar.set(c.name,c.value);}
    return result;
  };
  const login=async(token=jwt())=>{
    const challenge=await request('GET','/api/auth/challenge');
    assert.equal(challenge.statusCode,200);
    return request('POST','/api/auth/sessions',{accessToken:token},{'x-login-challenge':challenge.json().challenge});
  };
  try{
    assert.equal((await request('GET','/api/me')).statusCode,401);
    const signed=await login();assert.equal(signed.statusCode,200,signed.body);
    const me=signed.json();const raw=jar.get('munk_session')!;assert.ok(raw);
    assert.ok(String(signed.headers['set-cookie']).includes('HttpOnly'));assert.ok(String(signed.headers['set-cookie']).includes('SameSite=Strict'));
    assert.equal(signed.body.includes(raw),false);
    assert.equal((await pool.query('SELECT token_hash FROM account_sessions')).rows[0].token_hash,tokenHash(raw));
    assert.equal((await request('GET','/api/me')).json().account.id,me.account.id);
    const input={address:'auth-test-house',name:'My House',description:'Server-authenticated draft',focus:'Films',publicName:'A'};
    assert.equal((await request('POST','/api/houses',input,{'idempotency-key':randomUUID()})).statusCode,403);
    const house=await request('POST','/api/houses',input,{'idempotency-key':randomUUID(),'x-csrf-token':me.csrfToken});
    assert.equal(house.statusCode,200,house.body);
    assert.equal((await request('POST','/api/houses',{...input,founder_account_id:randomUUID()},{'idempotency-key':randomUUID(),'x-csrf-token':me.csrfToken})).statusCode,400);
    const other=await login(jwt({sub:'did:privy:fixture-b',sid:'provider-session-b'}));assert.equal(other.statusCode,200,other.body);
    assert.equal((await request('GET',`/api/houses/${house.json().id}/draft`)).statusCode,404);
    const csrfToken=other.json().csrfToken,old=jar.get('munk_session')!;
    assert.equal((await request('DELETE','/api/auth/session')).statusCode,403);
    assert.equal((await request('DELETE','/api/auth/session',undefined,{'x-csrf-token':csrfToken})).statusCode,200);
    assert.equal(jar.has('munk_session'),false);
    jar.set('munk_session',old);assert.equal((await request('GET','/api/me')).statusCode,401);jar.delete('munk_session');
    assert.equal((await login(jwt({sub:'did:privy:fixture-b',sid:'provider-session-b'}))).statusCode,401);
    const again=await login(jwt({sub:'did:privy:fixture-b',sid:'provider-session-b-new'}));assert.equal(again.statusCode,200,again.body);
    assert.equal(again.json().account.id,other.json().account.id);
    const restored=new Sessions(pool,verifier);assert.equal((await restored.me(jar.get('munk_session'))).account.id,other.json().account.id);
    await pool.query("UPDATE account_sessions SET created_at=now()-interval '8 days',expires_at=now()-interval '1 day' WHERE token_hash=$1",[tokenHash(jar.get('munk_session')!)]);
    assert.equal((await request('GET','/api/me')).statusCode,401);
    assert.equal((await pool.query('SELECT count(*)::integer AS n FROM accounts')).rows[0].n,2);
  }finally{await app.close();}
}

test('HTTP sessions, hashed persistence, CSRF, logout replay prevention and House isolation (PostgreSQL WASM)',async()=>{
  const db=new PGlite();try{await exercise(wasmPool(db));}finally{await db.close();}
});
test('authentication and HTTP permissions on native PostgreSQL',{skip:!process.env.TEST_DATABASE_URL},async()=>{
  const schema=`munk_auth_${randomUUID().replaceAll('-','')}`;const admin=new Pool({connectionString:process.env.TEST_DATABASE_URL});let pool:Pool|undefined;
  try{await admin.query(`CREATE SCHEMA "${schema}"`);pool=new Pool({connectionString:process.env.TEST_DATABASE_URL,options:`-c search_path=${schema},public`});await exercise(pool);}
  finally{await pool?.end();await admin.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);await admin.end();}
});
