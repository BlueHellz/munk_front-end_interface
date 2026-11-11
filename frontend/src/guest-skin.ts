import{supportedViewerTemplate}from'./skins/registry';
import {isInterfaceRecord,type InterfaceDesign} from '../../contracts/src';
const key='munk-guest-interface-v1',handoff='munk-interface-signin-v1';
export function guestSkin():InterfaceDesign|null{try{const design=JSON.parse(localStorage.getItem(key)||'null');return isInterfaceRecord({revision:0,updatedAt:null,design})&&design.scope==='viewer'&&supportedViewerTemplate(design.template)?design:null;}catch{return null;}}
export function useGuestSkin(design:InterfaceDesign){let persistent=true;try{localStorage.setItem(key,JSON.stringify(design));}catch{persistent=false;}window.dispatchEvent(new CustomEvent('munk-guest-skin',{detail:design}));return persistent;}
export function preserveGuestSkin(){const design=guestSkin();if(design&&design.viewerSelection!=='acceptance-test'&&design.viewerSelection!=='draft')try{sessionStorage.setItem(handoff,JSON.stringify(design));}catch{/* Active provider still retains its design in this tab. */}}
export function takeGuestSkin(){try{const value=sessionStorage.getItem(handoff);sessionStorage.removeItem(handoff);return value?JSON.parse(value) as InterfaceDesign:null;}catch{return null;}}
/** Per-account browser override: using a skin never silently writes account settings. */
const accountKey=(id:string)=>`munk-account-interface-use-v1:${id}`;
export function accountSkin(id:string):InterfaceDesign|null{try{const design=JSON.parse(localStorage.getItem(accountKey(id))||'null');return isInterfaceRecord({revision:0,updatedAt:null,design})&&design.scope==='viewer'&&supportedViewerTemplate(design.template)?design:null;}catch{return null;}}
export function rememberAccountSkin(id:string,design:InterfaceDesign){try{localStorage.setItem(accountKey(id),JSON.stringify(design));return true;}catch{return false;}}
export function clearAccountSkin(id:string){try{localStorage.removeItem(accountKey(id));}catch{/* Session state still updates; browser storage remains best effort. */}}
