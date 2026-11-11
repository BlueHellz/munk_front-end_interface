// Explicit strict-mode review-only renderer (not the active local Demo journey). Never imported by main.tsx, server.ts, or a production build.
import {build} from 'esbuild';
import {mkdir,writeFile,rm} from 'node:fs/promises';
import {join} from 'node:path';
export const reviewHouseId='f1111111-1111-4111-8111-111111111111';
export const reviewAccountId='review-fixture-account';
export async function createReviewFixture(frontendRoot,token){
 const directory=join(frontendRoot,'.qa',`review-${token}`);await mkdir(directory,{recursive:true});
 const source=`
import React from 'react';import{createRoot}from'react-dom/client';
import App from '../../src/App';import{AuthContext}from'../../src/auth-context';
import{emptyCreator,newContent}from'../../src/creator-model';
import'../../src/styles.css';import'../../src/visual-fixes.css';import'../../src/discovery.css';import'../../src/creator.css';import'../../src/exchange-mosaic.css';import'../../src/network-navigation.css';
const accountId=${JSON.stringify(reviewAccountId)},houseId=${JSON.stringify(reviewHouseId)};
const house={id:houseId,address:'review-fixture-house',name:'Review fixture House',description:'Isolated visual-review example. No real account, server House, publication, or admission.',publicName:'Review fixture creator',focus:'Both',version:1,admissionRevision:1,admissionStatus:'draft',membershipRole:'owner'};
const creator=structuredClone(emptyCreator);creator.house={...creator.house,name:house.name,address:house.address,description:house.description,publicName:house.publicName};
creator.content=[{...newContent('video','review-video'),title:'Review video draft',description:'Local sample media for visual review. Not uploaded or published.'},{...newContent('article','review-article'),title:'Review article draft',description:'Isolated review fixture. Not published.',body:'This is a private article preview.\\n\\nNo real creator account or public publication is represented.'}];
localStorage.setItem('munk-creator-account-v2:'+accountId+':'+houseId,JSON.stringify(creator));
localStorage.setItem('munk-creator-account-v2:'+accountId+':new',JSON.stringify({...creator,house:{...creator.house,name:'New review House draft',address:'new-review-house'}}));
window.__reviewFixture={scope:'authenticated-fixture',productMode:'strict',accountId,houseId,requests:[],writes:[],unexpected:[]};
window.fetch=async(url,options={})=>{const path=String(url),method=options.method||'GET',audit=window.__reviewFixture;audit.requests.push({path,method});
 if(method!=='GET'){audit.writes.push({path,method});throw Error('Review harness refuses all backend mutations.');}
 let data;if(path==='/api/config')data={mode:'strict',publicPublishing:false};else if(path==='/api/me/houses')data=[house];else if(path==='/api/houses/'+houseId+'/uploads')data=[];else if(path==='/api/houses/'+houseId+'/draft')data=house;
 else{audit.unexpected.push(path);throw Error('Unexpected review API call blocked: '+path);}
 return new Response(JSON.stringify(data),{headers:{'Content-Type':'application/json'}});};
const noop=()=>{};const session={account:{id:accountId,displayName:'Review fixture account',reviewer:false},csrfToken:'not-a-real-session',expiresAt:'2099-01-01T00:00:00.000Z'};
createRoot(document.getElementById('root')).render(<AuthContext.Provider value={{session,busy:false,phase:'authenticated',attemptFailure:0,message:'Review fixture only; no real authentication.',setupPending:false,createWallet:noop,retrySetup:noop,connectWallet:noop,loginPasskey:noop,sendEmailCode:async()=>false,verifyEmailCode:noop,linkEmail:noop,exportWallet:noop,logout:async()=>{}}}><App/></AuthContext.Provider>);
`;
 // stdin resolveDir keeps all imports scoped to this temporary fixture directory.
 await build({stdin:{contents:source,resolveDir:directory,loader:'tsx'},outfile:join(directory,'fixture.js'),bundle:true,format:'esm',platform:'browser',jsx:'automatic',define:{'process.env.NODE_ENV':'"development"'}});
 await writeFile(join(directory,'index.html'),`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><link rel="stylesheet" href="./fixture.css"></head><body><div id="root"></div><aside id="review-fixture-label" role="note" style="position:fixed;right:10px;bottom:10px;z-index:99999;max-width:calc(100vw - 20px);padding:8px 10px;border:1px solid #fff5e8;border-radius:6px;background:#17335e;color:#fff5e8;font:11px/1.4 Arial,sans-serif;pointer-events:none">AUTHENTICATED UI FIXTURE · STRICT MODE · NO REAL LOGIN OR SERVER SESSION</aside><script type="module" src="./fixture.js"></script></body></html>`);
 return {path:`/.qa/review-${token}/index.html`,dispose:()=>rm(directory,{recursive:true,force:true,maxRetries:5,retryDelay:100})};
}
