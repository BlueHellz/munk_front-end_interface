import{viewerPresentation}from'./skins/registry';
import {guestSkin,takeGuestSkin,useGuestSkin,accountSkin,rememberAccountSkin,clearAccountSkin} from './guest-skin';
import {useEffect,useLayoutEffect,useState,createContext,createElement,useContext,type ReactNode} from 'react';
import {apiClient} from './api';
import {unwrap} from './server-creator';
import {useAuth} from './auth-context';
import {interfaceTemplate,isInterfaceRecord,isPublicVideo,type InterfaceDesign,type InterfaceRecord,type InterfaceHistory,type PublicVideo} from '../../contracts/src';
export type InterfaceBundle={current:InterfaceRecord;history:InterfaceHistory};
const bundle=(v:unknown):v is InterfaceBundle=>!!v&&typeof v==='object'&&'current'in v&&'history'in v&&isInterfaceRecord(v.current)&&Array.isArray(v.history)&&v.history.every(isInterfaceRecord);
export const interfaces={
 catalog:(signal?:AbortSignal)=>unwrap(apiClient.request('/public/catalog',(v):v is PublicVideo[]=>Array.isArray(v)&&v.every(isPublicVideo),{signal})),
 get:(house?:string,signal?:AbortSignal)=>unwrap(apiClient.request(house?`/houses/${house}/interface`:'/me/interface',bundle,{signal})),
 save:(record:InterfaceRecord,design:InterfaceDesign,house?:string)=>unwrap(apiClient.request(house?`/houses/${house}/interface`:'/me/interface',isInterfaceRecord,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({revision:record.revision,design})})),
 house:(address:string,signal?:AbortSignal)=>unwrap(apiClient.request(`/public/houses/${address}/interface`,isInterfaceRecord,{signal})),
 content:(house:string,signal?:AbortSignal)=>unwrap(apiClient.request(`/houses/${house}/interface-content`,(v):v is PublicVideo[]=>Array.isArray(v)&&v.every(isPublicVideo),{signal}))
};
export function interfaceChanged(record?:InterfaceRecord){window.dispatchEvent(new CustomEvent('munk-interface-saved',{detail:record}));}
export function useViewerInterface(){
 const {session}=useAuth(),key=session?.account.id||'',defaultDesign=interfaceTemplate('estuary','viewer');
 const [guest,setGuest]=useState<InterfaceDesign|null>(guestSkin);
 const [carry,setCarry]=useState<{key:string;design:InterfaceDesign}|null>(null);
 useEffect(()=>{const update=(e:Event)=>setGuest((e as CustomEvent<InterfaceDesign>).detail);window.addEventListener('munk-guest-skin',update);return()=>window.removeEventListener('munk-guest-skin',update);},[]);
 useLayoutEffect(()=>{if(key){const handoff=takeGuestSkin(),design=handoff||accountSkin(key);if(handoff)rememberAccountSkin(key,handoff);setCarry(design?{key,design}:null);}else setCarry(null);},[key]);
 const [value,setValue]=useState<{key:string;record:InterfaceRecord|null;error:string}>({key:'',record:null,error:''}),[attempt,setAttempt]=useState(0);
 useEffect(()=>{const c=new AbortController();if(!key){setValue({key,record:null,error:''});return()=>c.abort();}setValue(previous=>({key,record:previous.key===key?previous.record:null,error:''}));void interfaces.get(undefined,c.signal).then(v=>setValue({key,record:v.current,error:''})).catch(e=>{if(!c.signal.aborted)setValue({key,record:null,error:e.message});});return()=>c.abort();},[key,attempt]);
 useEffect(()=>{const refresh=(event:Event)=>{const record=(event as CustomEvent<InterfaceRecord>).detail;if(record&&key)setValue({key,record,error:''});if(key)clearAccountSkin(key);setCarry(null);setAttempt(n=>n+1);};window.addEventListener('munk-interface-saved',refresh);return()=>window.removeEventListener('munk-interface-saved',refresh);},[key]);
 const storedDesign=!key?(guest||defaultDesign):carry?.key===key?carry.design:value.key===key&&value.record?value.record.design:defaultDesign;const kind=viewerPresentation(storedDesign).kind,confirmed=storedDesign.viewerSelection!=='acceptance-test'&&storedDesign.viewerSelection!=='draft'&&kind!=='legacy',design=confirmed?storedDesign:defaultDesign;
 return {use:(input:InterfaceDesign)=>{const design={...input,viewerSelection:'user' as const};if(!key)return useGuestSkin(design);const persisted=rememberAccountSkin(key,design);setCarry({key,design});return persisted;},design,storedDesign,hasSelection:confirmed&&kind!=='default',unsavedGuestChoice:!!key&&carry?.key===key,loading:!!key&&(value.key!==key||!value.record&&!value.error),error:value.key===key?value.error:'',retry:()=>setAttempt(n=>n+1)};
}
export function useCatalog(){const [videos,setVideos]=useState<PublicVideo[]>([]),[loading,setLoading]=useState(true),[error,setError]=useState(''),[attempt,setAttempt]=useState(0);useEffect(()=>{const c=new AbortController();setLoading(true);setError('');void interfaces.catalog(c.signal).then(v=>{if(!c.signal.aborted)setVideos(v);}).catch(e=>{if(!c.signal.aborted)setError(e.message);}).finally(()=>{if(!c.signal.aborted)setLoading(false);});return()=>c.abort();},[attempt]);return {videos,loading,error,retry:()=>setAttempt(n=>n+1)};}

const ViewerSkinContext=createContext<ReturnType<typeof useViewerInterface>|null>(null);
export function ViewerSkinProvider({children}:{children:ReactNode}){return createElement(ViewerSkinContext.Provider,{value:useViewerInterface()},children);}
export function useViewerSkin(){const value=useContext(ViewerSkinContext);if(!value)throw Error('Missing viewer skin provider.');return value;}
