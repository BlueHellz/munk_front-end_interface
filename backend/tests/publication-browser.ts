import {build} from 'esbuild';
import {spawn} from 'node:child_process';
import {mkdtemp,readFile,readdir,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import type {FastifyInstance} from 'fastify';
import assert from 'node:assert/strict';

const frontend=resolve(import.meta.dirname,'../../frontend');
/** Test-only same-origin static serving. Production server never exposes this harness. */
export async function attachBrowserPages(app:FastifyInstance){
 const builtIndex=await readFile(join(frontend,'dist/index.html'));
 const builtAssets=new Map<string,Buffer>();for(const item of await readdir(join(frontend,'dist/assets'),{withFileTypes:true}))if(item.isFile())builtAssets.set(item.name,await readFile(join(frontend,'dist/assets',item.name)));
 const bundle=await build({stdin:{resolveDir:frontend,loader:'tsx',contents:`
import React from 'react';import{createRoot}from'react-dom/client';import App from './src/App';import{AuthContext}from './src/auth-context';import{apiClient,setApiSession}from './src/api';import{isAccountSession}from '../contracts/src';
import './src/styles.css';import './src/visual-fixes.css';import './src/discovery.css';import './src/creator.css';import './src/exchange-mosaic.css';import './src/network-navigation.css';
const result=await apiClient.request('/me',isAccountSession);if(!result.ok)throw Error('Test session could not restore');setApiSession(result.value.csrfToken);const noop=()=>{};
createRoot(document.getElementById('root')).render(<AuthContext.Provider value={{session:result.value,phase:'authenticated',busy:false,message:'',setupPending:false,attemptFailure:0,createWallet:noop,retrySetup:noop,loginPasskey:noop,connectWallet:noop,sendEmailCode:async()=>false,verifyEmailCode:noop,linkEmail:noop,exportWallet:noop,logout:async()=>{}}}><App/></AuthContext.Provider>);
`},outfile:'creator.js',bundle:true,write:false,format:'esm',platform:'browser',jsx:'automatic',define:{'process.env.NODE_ENV':'"development"'},logLevel:'silent'});
 const js=bundle.outputFiles!.find(f=>f.path.endsWith('.js'))!.contents,css=bundle.outputFiles!.find(f=>f.path.endsWith('.css'))!.contents;
 app.get('/creator-test',async(_q,r)=>r.type('text/html').send('<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/creator-test.css"><div id="root"></div><script type="module" src="/creator-test.js"></script>'));
 app.get('/creator-test.js',async(_q,r)=>r.type('application/javascript').send(Buffer.from(js)));
 app.get('/creator-test.css',async(_q,r)=>r.type('text/css').send(Buffer.from(css)));
 app.get('/',async(_q,r)=>r.type('text/html').send(builtIndex));
 app.get<{Params:{'*':string}}>('/assets/*',async(q,r)=>{const name=q.params['*'];if(!/^[a-zA-Z0-9_.-]+$/.test(name))return r.code(404).send();const extension=name.split('.').pop()||'';const types:Record<string,string>={js:'application/javascript',css:'text/css',png:'image/png',jpg:'image/jpeg',svg:'image/svg+xml',woff2:'font/woff2'};try{return builtAssets.has(name)?r.type(types[extension]||'application/octet-stream').send(builtAssets.get(name)):r.code(404).send();}catch{return r.code(404).send();}});
}

export async function chromePage(){
 const directory=await mkdtemp(join(tmpdir(),'munk-publication-browser-'));
 const process=spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',['--headless=new','--disable-gpu','--autoplay-policy=no-user-gesture-required','--no-first-run','--no-default-browser-check','--remote-debugging-port=0',`--user-data-dir=${directory}`,'about:blank'],{stdio:'ignore'});
 const sleep=(ms:number)=>new Promise(r=>setTimeout(r,ms));let ws:WebSocket|undefined;let next=0;
 const pending=new Map<number,{resolve:(v:any)=>void;reject:(e:Error)=>void;timer:ReturnType<typeof setTimeout>}>();
 const dispose=async()=>{for(const p of pending.values())clearTimeout(p.timer);ws?.close();process.kill();await sleep(500);await rm(directory,{recursive:true,force:true,maxRetries:8,retryDelay:200});};
 try{
  let port='';for(let i=0;i<160;i++){try{port=(await readFile(join(directory,'DevToolsActivePort'),'utf8')).split('\n')[0];if(port)break;}catch{}await sleep(200);}if(!port)throw Error('Test Chrome could not start.');
  const targets=await (await fetch(`http://127.0.0.1:${port}/json/list`)).json() as {type:string;webSocketDebuggerUrl:string}[];
  const target=targets.find(t=>t.type==='page');assert.ok(target);ws=new WebSocket(target.webSocketDebuggerUrl);await new Promise<void>((r,j)=>{ws!.onopen=()=>r();ws!.onerror=()=>j(Error('Chrome debugger unavailable'));});
  ws.onmessage=e=>{const data=JSON.parse(String(e.data)),p=pending.get(data.id);if(p){clearTimeout(p.timer);pending.delete(data.id);data.error?p.reject(Error(data.error.message)):p.resolve(data.result);}};
  const send=(method:string,params:Record<string,unknown>={})=>new Promise<any>((resolve,reject)=>{const id=++next,timer=setTimeout(()=>{pending.delete(id);reject(Error('Browser command timed out: '+method));},45000);pending.set(id,{resolve,reject,timer});ws!.send(JSON.stringify({id,method,params}));});
  const evaluate=async(expression:string)=>{const result=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(result.exceptionDetails)throw Error('Browser evaluation failed: '+result.exceptionDetails.text);return result.result.value;};
  const wait=async(expression:string)=>{for(let i=0;i<300;i++){if(await evaluate(expression))return;await sleep(200);}throw Error('Browser state timed out: '+expression);};
  await send('Page.enable');await send('Runtime.enable');await send('Network.enable');
  return {send,evaluate,wait,dispose};
 }catch(error){await dispose();throw error;}
}

export async function creatorBrowser(input:{base:string;cookie:string;houseId:string;file:string;processQueued:()=>Promise<void>}){
 const page=await chromePage();const {send,evaluate,wait}=page;
 try{
  await send('Network.setCookie',{name:'munk_session',value:input.cookie,url:input.base+'/api',path:'/api',httpOnly:true,sameSite:'Strict'});
  await send('Page.navigate',{url:input.base+`/creator-test#/creator/videos/new?house=${input.houseId}`});await wait("!!document.querySelector('[data-video-file]')");
  const document=await send('DOM.getDocument'),node=await send('DOM.querySelector',{nodeId:document.root.nodeId,selector:'[data-video-file]'});await send('DOM.setFileInputFiles',{nodeId:node.nodeId,files:[input.file]});
  const fill=async(selector:string,value:string)=>evaluate(`(()=>{const e=document.querySelector(${JSON.stringify(selector)});Object.getOwnPropertyDescriptor(e instanceof HTMLInputElement?HTMLInputElement.prototype:HTMLTextAreaElement.prototype,'value').set.call(e,${JSON.stringify(value)});e.dispatchEvent(new Event('input',{bubbles:true}));})()`);
  await fill('[data-content-title]','Actual backend browser video');await fill('textarea','Persisted while processing.');
  await wait("document.querySelector('main')?.textContent.includes('Queued for processing')");
  assert.equal(await evaluate("[...document.querySelectorAll('button')].find(b=>b.textContent==='Publish').disabled"),true);
  await input.processQueued();
  await wait("[...document.querySelectorAll('button')].some(b=>b.textContent==='Publish'&&!b.disabled)");
  await evaluate("window.confirm=()=>true;[...document.querySelectorAll('button')].find(b=>b.textContent==='Publish').click()");
  await wait("!!document.querySelector('[aria-label=\"Viewer URL\"]')");
  const url=await evaluate("document.querySelector('[aria-label=\"Viewer URL\"]').value") as string;
  const editor=await evaluate('location.href') as string;
  await send('Page.reload');await wait("!!document.querySelector('[aria-label=\"Viewer URL\"]')");assert.equal(await evaluate("document.querySelector('[aria-label=\"Viewer URL\"]').value"),url);
  return {url,editor,scope:'Creator browser uses a test identity context restored from actual session endpoint; no API responses or publication/media states mocked.'};
 }finally{await page.dispose();}
}

export async function guestBrowser(url:string){
 const page=await chromePage();const {send,evaluate,wait}=page;
 try{
  await send('Page.navigate',{url});await wait("!!document.querySelector('.video-page video')");
  await wait("(()=>{const v=document.querySelector('video');return v&&Number.isFinite(v.duration)&&v.duration>0;})()");
  const guest=await evaluate("fetch('/api/me').then(r=>r.status)");assert.equal(guest,401);
  const played=await evaluate("document.querySelector('video').play().then(()=>true).catch(()=>false)");assert.equal(played,true);
  await wait("document.querySelector('video').currentTime>0.1");
  await evaluate("const v=document.querySelector('video');v.pause();v.currentTime=v.duration*0.65");
  await wait("(()=>{const v=document.querySelector('video');return !v.seeking&&v.currentTime>=v.duration*0.6&&v.readyState>=2;})()");
  const playback=await evaluate("({duration:document.querySelector('video').duration,position:document.querySelector('video').currentTime,mediaError:document.querySelector('video').error?.code||null})");
  await evaluate("[...document.querySelectorAll('a')].find(a=>a.textContent==='Visit House').click()");await wait("!!document.querySelector('.house-page [data-work-id]')");
  return {scope:'Fresh guest profile; actual production frontend, backend, native DB and processed MP4; no authenticated cookie or API fixture.',guestMeStatus:guest,played:true,seeked:true,houseListsVideo:true,playback};
 }finally{await page.dispose();}
}

/** Real HTTP/UI integration; test identity context only, never fixture content/API. */
export async function interfaceBrowser(input:{base:string;cookie:string;houseId:string;address:string;videoId:string}){
 const page=await chromePage(),{send,evaluate,wait}=page;
 const route=async(hash:string)=>{await evaluate(`location.hash=${JSON.stringify(hash)}`);};
 const click=async(label:string)=>evaluate(`(()=>{const b=[...document.querySelectorAll('button')].find(b=>b.textContent.trim()===${JSON.stringify(label)});if(!b)throw Error('Button missing: '+${JSON.stringify(label)});b.click();})()`);
 const link=async(label:string)=>evaluate(`(()=>{const a=[...document.querySelectorAll('a')].find(a=>a.textContent.trim()===${JSON.stringify(label)});if(!a)throw Error('Link missing');a.click();})()`);
 const ids=()=>evaluate("[...new Set([...document.querySelectorAll('main [data-interface-catalog] [data-work-id]')].map(e=>e.dataset.workId))].sort()");
 const home=async(template:string)=>{await route('#/home');await wait(`!!document.querySelector('main [data-interface-template="${template}"]')`);assert.deepEqual(await ids(),[input.videoId]);assert.equal(await evaluate("!!document.querySelector('.appearance-choices,.interface-editor')"),false);};
 const preview=async(name:string)=>{await wait(`!!document.querySelector('[aria-label="Preview ${name}"]')`);await evaluate(`document.querySelector('[aria-label="Preview ${name}"]').click()`);await wait("!!document.querySelector('.appearance-preview-frame')");assert.equal(await evaluate("!!document.querySelector('.interface-editor')"),false);};
 const apply=async()=>{await click('Apply');await wait("!![...document.querySelectorAll('[role=status]')].find(e=>e.textContent.includes('applied.'))");};
 const scope=async()=>evaluate("fetch('/api/me/interface').then(r=>r.json()).then(v=>({revision:v.current.revision,template:v.current.design.template,font:v.current.design.font}))");
 try{
  await send('Network.setCookie',{name:'munk_session',value:input.cookie,url:input.base+'/api',path:'/api',httpOnly:true,sameSite:'Strict'});
  await send('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});
  await send('Page.navigate',{url:input.base+'/creator-test#/home'});await home('discovery');
  assert.equal((await scope()).font,'modern');assert.equal(await evaluate("!!document.querySelector('main .font-modern')"),true);
  await evaluate("document.querySelector('[aria-label=\"Open navigation\"]').click()");
  await evaluate("document.querySelector('#network-sidebar [aria-label=\"Appearance & add-ons\"]').click()");await wait("!!document.querySelector('.appearance-cards')");
  const before=await scope();await preview('Cinema');assert.deepEqual(await scope(),before);await link('Return to browsing');await home('discovery');
  for(const [template,name]of [['cinema','Cinema'],['compact','Compact grid']] as const){await route('#/appearance');await preview(name);await apply();await link('Return to browsing');await home(template);}
  await send('Page.reload');await wait("!!document.querySelector('main [data-interface-template=compact]')");assert.deepEqual(await ids(),[input.videoId]);
  await route('#/appearance?tab=installed');await wait("!!document.querySelector('.appearance-current')");assert.equal(await evaluate("document.querySelector('.appearance-current h3').textContent"),'Current skin · Compact grid');
  await click('Customize');await wait("!!document.querySelector('.interface-editor')");await click('Cancel');await wait("!!document.querySelector('.appearance-current')");
  await click('Restore default');await wait("!!document.querySelector('.appearance-preview-frame')");assert.equal((await scope()).template,'compact');await apply();await link('Return to browsing');await home('estuary');
  assert.equal(await evaluate("document.querySelector('.media-center-destinations').querySelectorAll('a').length"),9);
  await route('#/appearance?tab=installed');await wait("!!document.querySelector('.appearance-current')");await click('Customize');await wait("!!document.querySelector('.version-list button')");
  // The third saved revision is Compact grid; restoration still uses the unchanged editor.
  await evaluate("[...document.querySelectorAll('.version-list button')].find(b=>b.textContent.startsWith('Restore revision 3 ')).click()");await click('Save interface');await wait("document.querySelector('.interface-editor')?.textContent.includes('Interface saved to the server')");await click('Cancel');await home('compact');
  await route('#/appearance?tab=houses');await wait("!!document.querySelector('.appearance-page a[href*=\"creator/design\"]')");await link('Appearance');await wait("!!document.querySelector('.appearance-cards')");await preview('Cinema House');await apply();
  await route(`#/houses/${input.address}`);await wait("!!document.querySelector('.house-page [data-interface-template=cinema-house]')");assert.deepEqual(await ids(),[input.videoId]);
  await route('#/my-houses');await wait("!!document.querySelector('a[href*=\"creator/design\"]')");await link('Appearance');await wait("!!document.querySelector('.appearance-cards')");await preview('Editorial House');await apply();await link('View House');await wait("!!document.querySelector('.house-page [data-interface-template=editorial-house]')");assert.deepEqual(await ids(),[input.videoId]);await home('compact');
  await route('#/appearance');await preview('MUNK Estuary');const priorEstuary=await scope();await apply();await link('Return to browsing');await home('estuary');assert.equal(await evaluate("!!document.querySelector('.media-center-shell')"),true);
  await route(`#/houses/${input.address}`);await wait("!!document.querySelector('.house-page [data-interface-template=editorial-house]')");await home('estuary');
  await route('#/appearance?tab=installed');await wait("!!document.querySelector('.appearance-current')");await click('Customize');await wait("!!document.querySelector('.version-list button')");await evaluate("[...document.querySelectorAll('.version-list button')].find(b=>b.textContent.startsWith('Restore revision 3 ')).click()");await click('Save interface');await wait("document.querySelector('.interface-editor')?.textContent.includes('Interface saved to the server')");await click('Cancel');await home('compact');
  await route('#/appearance?tab=addons');await wait("document.querySelector('main')?.textContent.includes('Not available yet')");assert.equal(await evaluate("!!document.querySelector('.interface-editor')"),false);
  await route('#/appearance');await wait("!!document.querySelector('.appearance-cards')");
  for(const width of [768,390]){await send('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:width===390});assert.equal(await evaluate('document.documentElement.scrollWidth<=innerWidth+1'),true);}
 }finally{await page.dispose();}
 const second=await chromePage();try{await second.send('Network.setCookie',{name:'munk_session',value:input.cookie,url:input.base+'/api',path:'/api',httpOnly:true,sameSite:'Strict'});await second.send('Page.navigate',{url:input.base+'/creator-test#/home'});await second.wait("!!document.querySelector('main [data-interface-template=compact]')");}finally{await second.dispose();}
 const guest=await chromePage();try{await guest.send('Page.navigate',{url:input.base+'/#/home'});await guest.wait("!!document.querySelector('main [data-interface-template=estuary]')");assert.equal(await guest.evaluate("!!document.querySelector('.appearance-choices,.interface-editor')"),false);await guest.evaluate(`location.hash=${JSON.stringify('#/houses/'+input.address)}`);await guest.wait("!!document.querySelector('.house-page [data-interface-template=editorial-house]')");assert.equal(await guest.evaluate("fetch('/api/me').then(r=>r.status)"),401);}finally{await guest.dispose();}
 return {scope:'Actual production UI and native HTTP/database/media with synthetic provider identity; no API content mocks.',defaultBrowsingWithoutChooser:true,existingCustomSkinPreserved:true,menuToVisualPreviewToApply:true,previewDoesNotSave:true,advancedEditorSecondary:true,installedRestoreDefault:true,houseBuildIndependent:true,homeRestoresViewerSkin:true,freshBrowserPersistence:true,mobilePageBounds:true,guestDefaultAndSavedHouseBuild:true,addOnsHonestUnavailable:true};
}
