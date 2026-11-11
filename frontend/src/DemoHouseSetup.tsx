import {useEffect,useState} from 'react';
import {useCreator} from './creator-state';
import {useAuth} from './auth-context';
import {Button} from './components';
import {addressError,isCreatorState,type HouseDraft} from './creator-model';

export default function DemoHouseSetup(){
 const {creator,save,selection,serverHouse,createDemoHouse,saveHouse,houseHref}=useCreator();const {session}=useAuth();
 const key=`munk-house-edit-v1:${session?.account.id}:${selection||'new'}`;
 const [draft,setDraft]=useState<HouseDraft>(()=>{try{const value=JSON.parse(sessionStorage.getItem(key)||'null');if(value&&isCreatorState({...creator,house:value}))return value;}catch{}return creator.house;});
 const [busy,setBusy]=useState(false),[message,setMessage]=useState(''),[errors,setErrors]=useState<Record<string,string>>({});
 useEffect(()=>{save({...creator,house:draft});try{sessionStorage.setItem(key,JSON.stringify(draft));}catch{}},[draft,key]);
 const [previous]=useState(()=>{try{return !!JSON.parse(localStorage.getItem(`munk-demo-create-v1:${session?.account.id}:blank`)||'null')?.houseId;}catch{return false;}});
 const entered=!!(draft.name||draft.address||draft.description||draft.publicName||draft.intro||creator.content.length);
 const error=(e:unknown)=>{setErrors((e as {fieldErrors?:Record<string,string>}).fieldErrors||{});setMessage(e instanceof Error?e.message:'Could not save. Your draft is retained.');};
 const create=async(continueDraft:boolean,another=false)=>{if(busy)return;setBusy(true);setErrors({});try{await createDemoHouse(continueDraft?draft:null,another);}catch(e){error(e);}finally{setBusy(false);}};
 const update=(field:keyof HouseDraft,value:string)=>{setDraft(d=>({...d,[field]:value}));setErrors(e=>({...e,[field]:''}));};
 const saveDetails=async()=>{if(busy)return;if(draft.address&&addressError(draft.address)){setErrors({address:addressError(draft.address)});return;}setBusy(true);setErrors({});try{const result=await saveHouse(draft);setDraft(d=>({...d,name:result.name,address:result.address,publicName:result.publicName}));setMessage('Demo House details saved. Publish individual videos from the workspace.');}catch(e){error(e);}finally{setBusy(false);}};
 return <main className="creator-page" data-demo-house-setup><h1>{serverHouse?'House details':'Create House'}</h1><p><small>Demo mode</small> · No introduction, description, customization, consent declarations or review is required. Real account ownership still applies.</p>
 <section className="creator-card"><h2>{serverHouse?.demoReady?'House ready for demo use':'Ready when you are'}</h2><p>A House supports private uploads until you choose Publish. Demo mode does not grant identity verification or network admission.</p>
 {!serverHouse?<div className="button-row"><Button disabled={busy} onClick={()=>void create(false)}>{previous?'Open created demo House':'Create House'}</Button>{entered&&<Button kind="outline" disabled={busy} onClick={()=>void create(true)}>Continue current draft as demo House</Button>}{previous&&<Button kind="outline" disabled={busy} onClick={()=>void create(false,true)}>Create another demo House</Button>}</div>:serverHouse.demoReady?<div className="button-row"><a className="button" href={houseHref('#/creator/overview')}>Open workspace</a><a className="button outline" href={houseHref('#/creator/videos/new')}>Upload video</a></div>:<Button disabled={busy} onClick={()=>void create(true)}>Continue this House as demo House</Button>}
 {entered&&!serverHouse&&<p>Your original draft stays saved. Continuing it reuses any saved owner House with the same address. An invalid or omitted proposed address gets a generated demo address; the original draft is kept separately. Retrying the same creation reopens the same House.</p>}
 </section>
 <details className="creator-card"><summary>Optional details · Complete later</summary><p>Leave fields blank to use defaults. For a different new video or House, use the explicit new action rather than retrying a pending request.</p>
 {([['name','House name',80],['publicName','Creator name',80],['address','House address',40],['description','Description',2000]] as const).map(([field,label,max])=><label className="creator-field" key={field}><span>{label} · Complete later</span>{field==='description'?<textarea maxLength={max} value={draft[field]} aria-invalid={!!errors[field]} aria-describedby={`demo-${field}-error`} onChange={e=>update(field,e.target.value)}/>:<input maxLength={max} value={draft[field]} aria-invalid={!!errors[field]} aria-describedby={`demo-${field}-error`} onChange={e=>update(field,e.target.value)}/>}<span id={`demo-${field}-error`} role="alert">{errors[field]}</span></label>)}
 <p>Address format: 3–40 lowercase letters, numbers or hyphens; start and end with a letter or number. Example: mountain-studio. Leave blank for an automatic address when creating.</p>
 {serverHouse?.demoReady&&<Button disabled={busy} onClick={()=>void saveDetails()}>Save optional details</Button>}
 </details><section className="creator-card"><h2>Complete later</h2><p>Introduction, description and customization are optional. Creator verification and manual review are outside this demo. Videos can be published from the workspace.</p></section>
 {busy&&<p role="status">Saving your demo House…</p>}<p role="status">{message}</p>{Object.keys(errors).length>0&&<p role="alert">Open Optional details to correct the highlighted controls. Your draft is retained.</p>}
 </main>;
}
