import {frontendRoot,projectRoot,reviewRoot,artifactsRoot,viteEntry} from './paths.mjs';
// Focused read-only route captures. Never opens the designer or saves a preset.
import {spawn} from 'node:child_process';
import {mkdir,writeFile,mkdtemp,rm,stat} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import assert from 'node:assert/strict';
const output='../review/discovery-exchange';await mkdir(`${output}/screenshots`,{recursive:true});
const appURL=process.env.MUNK_URL||'http://127.0.0.1:5173';
const chrome=process.env.CHROME_PATH||(process.platform==='darwin'?'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome':'google-chrome');
const port=Number(process.env.MUNK_CDP_PORT||9223);const profile=await mkdtemp(join(tmpdir(),'munk-route-capture-'));
const server=process.env.MUNK_URL?null:spawn(process.execPath,[viteEntry,'--host','127.0.0.1','--port','5173','--strictPort'],{stdio:['ignore','pipe','pipe']});
let diagnostic='';server?.stderr.on('data',d=>diagnostic+=d);server?.on('error',e=>diagnostic+=e.message);
const sleep=ms=>new Promise(r=>setTimeout(r,ms));const screenshots=[];let browser,ws,id=0;const pending=new Map();let failure=null;
async function waitFor(fn,label){for(let i=0;i<60;i++){try{if(await fn())return;}catch{}await sleep(100);}throw new Error(`Timed out: ${label}. ${diagnostic}`);}
function send(method,params={}){return new Promise((resolve,reject)=>{const key=++id;const timer=setTimeout(()=>{pending.delete(key);reject(new Error(`CDP timeout: ${method}`));},10000);pending.set(key,{resolve,reject,timer});ws.send(JSON.stringify({id:key,method,params}));});}
async function evaluate(expression){const result=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(result.exceptionDetails)throw new Error(result.exceptionDetails.exception?.description||result.exceptionDetails.text);return result.result.value;}

try {
 await waitFor(async()=>{const r=await fetch(appURL);return r.ok;},'Vite local listener');
 browser=spawn(chrome,['--headless=new','--disable-gpu','--no-first-run','--no-default-browser-check',`--remote-debugging-port=${port}`,`--user-data-dir=${profile}`,'about:blank'],{stdio:['ignore','ignore','pipe']});
 browser.stderr.on('data',d=>diagnostic+=d);browser.on('error',e=>diagnostic+=e.message);
 let target;await waitFor(async()=>{const r=await fetch(`http://127.0.0.1:${port}/json/list`);target=(await r.json()).find(t=>t.type==='page');return target;},'Chrome debug endpoint');
 ws=new WebSocket(target.webSocketDebuggerUrl);await new Promise((resolve,reject)=>{ws.onopen=resolve;ws.onerror=reject;});
 ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id){const item=pending.get(m.id);if(item){clearTimeout(item.timer);pending.delete(m.id);m.error?item.reject(new Error(m.error.message)):item.resolve(m.result);}}};
 await send('Page.enable');await send('Runtime.enable');
 const views=[['discovery','#/home?preset=discovery','.discovery'],['exchange-mosaic','#/home?tab=exchange&view=mosaic','.exchange-canvas']];
 const devices=[['desktop',1440,1024],['tablet',768,1024],['mobile',390,844]];
 // A disposable profile cannot read/write the user's normal browser storage.
 // No account gate, designer, preset-save or localStorage mutation is invoked.
 await send('Page.navigate',{url:appURL});
 await waitFor(()=>evaluate("Boolean(document.querySelector('main'))"),'Initial page');
 const savedBefore=await evaluate("localStorage.getItem('munk-frontend-v2')");
 for(const [device,width,height] of devices){
  await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:device==='mobile'});
  for(const [view,hash,selector] of views){
   await evaluate(`location.hash=${JSON.stringify(hash)}`);
   await waitFor(()=>evaluate(`location.hash===${JSON.stringify(hash)} && Boolean(document.querySelector(${JSON.stringify(selector)}))`),`${view}/${device}`);
   await evaluate("document.querySelectorAll('img').forEach(i=>i.loading='eager');document.fonts.ready.then(()=>Promise.all([...document.images].map(i=>i.decode().catch(()=>{}))))");
   if(view==='exchange-mosaic')assert.equal(await evaluate("document.querySelectorAll('.house-mosaic-tile').length"),20,'Expected expanded 20-House catalog');
   await evaluate('scrollTo(0,0)');await sleep(250);
   const layout=await send('Page.getLayoutMetrics');
   const shot=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:true,clip:{x:0,y:0,width,height:Math.ceil(layout.cssContentSize.height),scale:1}});
   const file=`${view}-${device}-${width}px.png`;const path=`${output}/screenshots/${file}`;
   const bytes=Buffer.from(shot.data,'base64');assert.ok(bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])),'Invalid PNG');
   await writeFile(path,bytes);assert.ok((await stat(path)).size>8);
   screenshots.push({file,url:`${appURL.replace(/\/$/,'')}/${hash}`,width,height,bytes:bytes.length});console.log(path);
  }
 }
 assert.equal(await evaluate("localStorage.getItem('munk-frontend-v2')"),savedBefore,'Capture must not change saved Home data');
 assert.equal(screenshots.length,6);
}catch(error){failure=error.message;console.error(failure);process.exitCode=1;}
finally {
 for(const p of pending.values())clearTimeout(p.timer);ws?.close();browser?.kill();server?.kill();await sleep(100);await rm(profile,{recursive:true,force:true}).catch(()=>{});
 await writeFile(`${output}/capture-result.json`,JSON.stringify({date:new Date().toISOString(),status:failure?'BLOCKED_OR_FAILED':'PASS',error:failure,screenshots},null,2));
 await writeFile(`${output}/screenshots/README.md`,`# Discovery / Exchange route captures\n\n${screenshots.length}/6 PNGs verified in this run. Status: ${failure?'BLOCKED_OR_FAILED':'PASS'}.\n\n${failure||'Saved Home data remained unchanged. No preset was applied or saved.'}\n\nSee ../capture-result.json for the exact routes and viewport sizes. A completed capture is not visual approval.\n`.replaceAll('\n','\n'));
}
