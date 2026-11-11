import {useEffect} from 'react';
let dirty=false;
export function clearUnsavedInterface(){dirty=false;}
export function canLeave(){return !dirty||window.confirm('Leave this screen and discard unsaved interface edits?');}
export function useUnsavedInterface(changed:boolean){useEffect(()=>{dirty=changed;const unload=(e:BeforeUnloadEvent)=>{if(changed){e.preventDefault();e.returnValue='';}};addEventListener('beforeunload',unload);return()=>{dirty=false;removeEventListener('beforeunload',unload);};},[changed]);}
const trail:Array<{hash:string;scroll:number}>=[];
let active=typeof location==='undefined'?'#/home':location.hash||'#/home';
export function routeChanged(next:string){if(next===active)return true;if(!canLeave()){history.replaceState(null,'',active);return false;}trail.push({hash:active,scroll:document.querySelector('[data-viewer-scroll],.page-content')?.scrollTop||scrollY});active=next;return true;}
export function goBack(fallback='#/home'){if(!canLeave())return;const previous=trail.pop();const target=previous?.hash||fallback;active=target;location.hash=target;requestAnimationFrame(()=>requestAnimationFrame(()=>{const main=document.querySelector('[data-viewer-scroll],.page-content');if(main)main.scrollTop=previous?.scroll||0;window.scrollTo(0,previous?.scroll||0);}));}

let utilityOrigin:{hash:string;scroll:number}|null=null;
const isUtility=(hash:string)=>/^#\/(settings|appearance)(\?|$)/.test(hash);
export function openUtility(target:string,origin?:string){if(!canLeave())return;if(origin)utilityOrigin={hash:origin,scroll:0};else if(!isUtility(location.hash))utilityOrigin={hash:location.hash||'#/home',scroll:document.querySelector('[data-viewer-scroll],.page-content')?.scrollTop||scrollY};location.hash=target;}
export function closeUtility(fallback='#/home'){if(!canLeave())return;const origin=utilityOrigin||{hash:fallback,scroll:0};utilityOrigin=null;const at=trail.findIndex(f=>f.hash===origin.hash);if(at>=0)trail.splice(at);active=origin.hash;location.hash=origin.hash;requestAnimationFrame(()=>requestAnimationFrame(()=>{const node=document.querySelector('[data-viewer-scroll],.page-content');if(node)node.scrollTop=origin.scroll;}));}
