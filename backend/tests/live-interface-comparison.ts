/** Read-only guest evidence against the existing local API, never saves a design. */
import Fastify from 'fastify';
import {build} from 'esbuild';
import {resolve} from 'node:path';
import {mkdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {chromePage} from './publication-browser.js';
const origin='http://127.0.0.1:3001',app=Fastify({logger:false});
const code=await build({stdin:{resolveDir:resolve(import.meta.dirname,'../../frontend'),loader:'tsx',contents:`
import React from 'react';import{createRoot}from'react-dom/client';import{InterfaceRenderer}from'./src/InterfaceRenderer';import{interfaceTemplate}from'../contracts/src';import './src/styles.css';import './src/discovery.css';
const data=await(await fetch('/comparison-data')).json();createRoot(document.getElementById('root')).render(<main><h1>Read-only real content comparison</h1>{['discovery','cinema','compact'].map(t=><section key={t}><h2>{t}</h2><InterfaceRenderer design={interfaceTemplate(t,'viewer')} videos={data.catalog}/></section>)}{['cinema-house','editorial-house'].map(t=><section key={t}><h2>{t}</h2><InterfaceRenderer design={interfaceTemplate(t,'house')} videos={data.house.videos}/></section>)}</main>);
`},outfile:'comparison.js',bundle:true,write:false,format:'esm',platform:'browser',jsx:'automatic',logLevel:'silent'});
const output=(suffix:string)=>Buffer.from(code.outputFiles!.find(f=>f.path.endsWith(suffix))!.contents);
let counts={catalog:0,house:0};
app.get('/',async(_q,r)=>r.type('text/html').send('<meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/comparison.css"><div id="root"></div><script type="module" src="/comparison.js"></script>'));
app.get('/comparison.js',async(_q,r)=>r.type('application/javascript').send(output('.js')));app.get('/comparison.css',async(_q,r)=>r.type('text/css').send(output('.css')));
app.get('/comparison-data',async()=>{const response=await fetch(origin+'/api/public/catalog');assert.equal(response.status,200);const catalog=await response.json() as any[];assert.ok(catalog.length,'No actual published works available');const responseHouse=await fetch(origin+'/api/public/houses/'+catalog[0].house.address);assert.equal(responseHouse.status,200);const house=await responseHouse.json() as any;counts={catalog:catalog.length,house:house.videos.length};return {catalog,house};});
app.get<{Params:{'*':string}}>('/api/public/*',async(q,r)=>{const path=q.params['*'];if(!/^videos\/[a-f0-9-]+\/poster$/.test(path))return r.code(404).send();const response=await fetch(origin+'/api/public/'+path);return r.code(response.status).type('image/jpeg').send(Buffer.from(await response.arrayBuffer()));});
const base=await app.listen({host:'127.0.0.1',port:0}),page=await chromePage();
try{
 await page.send('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});await page.send('Page.navigate',{url:base});await page.wait("document.querySelectorAll('[data-interface-template]').length===5");
 const designs=await page.evaluate("[...document.querySelectorAll('[data-interface-template]')].map(e=>({template:e.dataset.interfaceTemplate,ids:[...new Set([...e.querySelectorAll('[data-interface-catalog] [data-work-id]')].map(w=>w.dataset.workId))].sort(),layout:e.querySelector('[data-interface-section] .interface-arrangement')?.dataset.desktop,display:getComputedStyle(e.querySelector('[data-interface-section] .interface-arrangement')).display}))") as {template:string;ids:string[];layout:string;display:string}[];
 for(const d of designs.slice(0,3))assert.deepEqual(d.ids,designs[0].ids);assert.deepEqual(designs[3].ids,designs[4].ids);assert.notEqual(designs[0].layout,designs[1].layout);assert.notEqual(designs[3].layout,designs[4].layout);
 const evidence={status:'PASS',timestamp:new Date().toISOString(),scope:'Actual existing local public catalog/House API, read-only guest browser; shared renderer source. No fixture content, authentication mock, personal design mutation or screenshots.',counts,designs:designs.map(({ids,...d})=>({...d,workCount:ids.length,workSetHash:createHash('sha256').update(JSON.stringify(ids)).digest('hex')}))};
 await mkdir(resolve(import.meta.dirname,'../../artifacts/interface-foundation'),{recursive:true});await writeFile(resolve(import.meta.dirname,'../../artifacts/interface-foundation/live-content-comparison.json'),JSON.stringify(evidence,null,2));console.log('PASS: same existing real catalog in three viewer layouts; same existing real House in two presentations. No designs saved or personal data copied.');
}finally{await page.dispose();await app.close();}
