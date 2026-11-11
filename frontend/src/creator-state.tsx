import { createContext, useContext, useState, useRef, useEffect, type ReactNode, type Dispatch, type SetStateAction } from 'react';
import { loadCreator, saveCreator, emptyCreator, newContent,addressError, type CreatorState, type ContentDraft } from './creator-model';
import type { CreatorDraftRepository } from './creator-services';
import { useAuth } from './auth-context';
import { serverCreator } from './server-creator';
import type { HouseRecord, UploadStatus,DemoHouseInput,ProductMode } from '../../contracts/src';
import type { HouseDraft } from './creator-model';
const browserDrafts: CreatorDraftRepository = {
 load: () => { try { return loadCreator(window.localStorage); } catch { return {state:structuredClone(emptyCreator),warning:'Creator storage unavailable. Drafts last only in this tab.'}; } },
 save: state => { try { return saveCreator(window.localStorage,state); } catch { return 'Creator storage unavailable. Keep this tab open; drafts remain in memory only.'; } }
};
type Asset = {
    file: File;
    url: string;
};
type Value = {
    updateVideoDraft:(id:string,patch:Partial<ContentDraft>)=>ContentDraft;
    checkUpload:(id:string)=>Promise<UploadStatus>;
    productMode:ProductMode|null;
    modeError:string;
    reloadMode:()=>Promise<void>;
    createDemoHouse:(draft:HouseDraft|null,another?:boolean)=>Promise<void>;
    creator: CreatorState;
    setCreator: Dispatch<SetStateAction<CreatorState>>;
    warning: string;
    save: (next: CreatorState) => boolean;
    asset: (key: string) => Asset | undefined;
    putAsset: (key: string, file: File) => void;
    removeAsset: (key: string) => void;
    serverHouse: HouseRecord | null;
    serverHouses: HouseRecord[];
    serverUploads: UploadStatus[];
    serverLoading: boolean;
    serverMessage: string;
    serverError: string;
    selection: string;
    houseHref: (path: string) => string;
    reloadServer: (houseId?: string) => Promise<void>;
    saveHouse: (draft: HouseDraft) => Promise<HouseRecord>;
    submitHouse: (draft: HouseDraft, file: File, signal: AbortSignal) => Promise<void>;
    transferVideo: (draftId: string, file: File) => Promise<void>;
    videoUploading: string[];
};
const Context = createContext<Value | null>(null);
export function CreatorProvider({ children }: {
    children: ReactNode;
}) {
    const { session } = useAuth();
    const [productMode,setProductMode]=useState<ProductMode|null>(null),[modeError,setModeError]=useState('');
    const reloadMode=async()=>{setModeError('');try{setProductMode((await serverCreator.mode()).mode);}catch{setModeError('Could not load server mode. Check the API and retry; no House has been created.');}};
    useEffect(()=>{void reloadMode();},[]);
    const accountId = session?.account.id;
    const [loaded] = useState(() => typeof window === 'undefined' ? { state: emptyCreator, warning: '' } : browserDrafts.load());
    const [creator, setCreator] = useState(loaded.state), [warning, setWarning] = useState(loaded.warning), [, redraw] = useState(0);
    const assets = useRef(new Map<string, Asset>());
    const transfers = useRef(new Map<string, AbortController>());
    const [videoUploading,setVideoUploading]=useState<string[]>([]);
    const creatorRef=useRef(creator);creatorRef.current=creator;
    const [serverHouse,setServerHouse]=useState<HouseRecord|null>(null),[serverHouses,setServerHouses]=useState<HouseRecord[]>([]),[serverUploads,setServerUploads]=useState<UploadStatus[]>([]);
    const [serverLoading,setServerLoading]=useState(false),[loadedAccount,setLoadedAccount]=useState<string|undefined>(),[serverMessage,setServerMessage]=useState('');
    const loadRequest=useRef(0);
    const epoch=useRef(0),houseRef=useRef<HouseRecord|null>(null),creationKey=useRef(crypto.randomUUID());
    const readSelection=()=>typeof location==='undefined'?'':new URLSearchParams(location.hash.split('?')[1]).get('house')||'';
    const [selection,setSelection]=useState(readSelection);
    useEffect(()=>{const changed=()=>setSelection(readSelection());addEventListener('hashchange',changed);return()=>removeEventListener('hashchange',changed);},[]);
    const scope=selection||'new';
    const [loadedScope,setLoadedScope]=useState('');
    const justCreatedHouse=useRef('');
    const [serverError,setServerError]=useState('');
    const houseHref=(path:string)=>`${path}${selection?`?house=${encodeURIComponent(selection)}`:''}`;
    const localKey=accountId?`munk-creator-account-v2:${accountId}:${scope}`:null;
    const overlay=(state:CreatorState,h:HouseRecord):CreatorState=>({...state,house:{...state.house,name:h.name,address:h.address,description:h.description,publicName:h.publicName,focus:(['Films','Writing','Both'].includes(h.focus)?h.focus:'Both') as HouseDraft['focus']}});
    const reloadServer=async(houseId?:string)=>{
      const current=epoch.current,request=++loadRequest.current;setServerLoading(true);setServerError('');
      try {const list=await serverCreator.houses();const house=list.find(h=>h.id===(houseId||selection))??null;
        if((houseId||selection)&&!house)throw Object.assign(Error('You do not have permission to operate this House, or it no longer exists.'),{code:'permission'});
        const uploads=house?await serverCreator.uploads(house.id):[];
        if(current!==epoch.current||request!==loadRequest.current)return;setServerHouses(list);setServerHouse(house);houseRef.current=house;setServerUploads(uploads);
        if(house)setCreator(s=>{let restored=s;try{if(!window.localStorage.getItem(localKey!)){const legacy=loadCreator({getItem:()=>window.localStorage.getItem(`munk-creator-account-v1:${accountId}`)}).state;if(legacy.house.address===house.address){restored=legacy;saveCreator({setItem:(_key,value)=>window.localStorage.setItem(localKey!,value)},legacy);}}}catch{}return overlay(restored,house);});setServerMessage('House and upload status loaded from the server.');
      }catch(error){if(current===epoch.current&&request===loadRequest.current){houseRef.current=null;setServerHouse(null);setServerHouses([]);setServerUploads([]);setServerError((error as {code?:string}).code==='permission'?'permission':'server');setServerMessage(error instanceof Error?error.message:'Could not load server data.');}}
      finally{if(current===epoch.current&&request===loadRequest.current)setServerLoading(false);}
    };
    useEffect(()=>{
      const keepNewHouseFiles=justCreatedHouse.current===selection&&loadedAccount===accountId&&loadedScope==='new';justCreatedHouse.current='';
      const current=++epoch.current;transfers.current.forEach(c=>c.abort());transfers.current.clear();setVideoUploading([]);if(!keepNewHouseFiles){assets.current.forEach(a=>URL.revokeObjectURL(a.url));assets.current.clear();}houseRef.current=null;setServerHouse(null);setServerHouses([]);setServerUploads([]);creationKey.current=crypto.randomUUID();
      let local=structuredClone(emptyCreator);
      if(localKey){try{local=loadCreator({getItem:()=>window.localStorage.getItem(localKey)}).state;}catch{}}
      setCreator(local);setLoadedAccount(accountId);setLoadedScope(scope);setServerError('');
      if(accountId){void reloadServer();}else{setServerLoading(false);setServerMessage('Sign in to load your House.');}
      return()=>{if(epoch.current===current)epoch.current++;};
    },[accountId,scope]);
    useEffect(()=>{
      if(!accountId||!serverHouse||!serverUploads.some(u=>['queued','processing','receiving'].includes(u.state)))return;
      let active=true;const current=epoch.current;
      const timer=setInterval(()=>{void serverCreator.uploads(serverHouse.id).then(rows=>{if(active&&current===epoch.current)setServerUploads(rows);}).catch(error=>{if(active&&current===epoch.current){setServerMessage(error instanceof Error?error.message:'Status refresh failed.');if((error as {code?:string}).code==='permission'){houseRef.current=null;setServerHouse(null);setServerUploads([]);setServerError('permission');}}});},3000);
      return()=>{active=false;clearInterval(timer);};
    },[accountId,serverHouse?.id,serverUploads]);
    useEffect(() => () => { transfers.current.forEach(c=>c.abort());assets.current.forEach(a => URL.revokeObjectURL(a.url)); assets.current.clear(); }, []);
    const save = (next: CreatorState) => { creatorRef.current=next;setCreator(next); let error='';try{error=localKey?saveCreator({setItem:(_key,value)=>window.localStorage.setItem(localKey,value)},next):'Sign in to save account drafts.';}catch{error='Browser saving failed; keep this tab open.';}setWarning(error);return !error; };
    const saveHouse=async(draft:HouseDraft)=>{
      if(!accountId)throw Error('Sign in first.');if(selection&&!houseRef.current)throw Error('Select an authorized House before editing.');const current=epoch.current;
      const input={name:draft.name,address:draft.address,description:draft.description,publicName:draft.publicName,focus:draft.focus};
      const existing=houseRef.current;
      const patch={name:input.name,description:input.description,publicName:input.publicName,focus:input.focus,version:existing?.version||1};
      const result=existing?(productMode==='demo'?await serverCreator.updateDemo(existing.id,{...patch,...(input.address&&input.address!==existing.address?{address:input.address}:{})}):await serverCreator.update(existing.id,patch)):await serverCreator.create(input,creationKey.current);
      if(current!==epoch.current)throw Error('Account changed. Reload your House.');
      houseRef.current=result;setServerHouse(result);setServerHouses(list=>[...list.filter(h=>h.id!==result.id),result]);setServerMessage('House draft saved on the server.');save({...creator,house:draft});if(!existing){try{saveCreator({setItem:(_key,value)=>window.localStorage.setItem(`munk-creator-account-v2:${accountId}:${result.id}`,value)},{...creator,house:draft});window.localStorage.removeItem(localKey!);}catch{setWarning('House saved on server; local design could not be transferred.');}justCreatedHouse.current=result.id;location.hash=`/create/house?house=${result.id}`;}return result;
    };
    const updateVideoDraft=(id:string,patch:Partial<ContentDraft>)=>{
      const existing=creatorRef.current.content.find(c=>c.id===id)||newContent('video',id);
      const next={...existing,...patch,updatedAt:Date.now()};
      save({...creatorRef.current,content:[...creatorRef.current.content.filter(c=>c.id!==id),next]});return next;
    };
    const checkUpload=async(id:string)=>{const current=epoch.current;const row=await serverCreator.status(id);if(current===epoch.current)setServerUploads(rows=>[row,...rows.filter(u=>u.uploadId!==id)]);return row;};
    const demoCreating=useRef(false);
    const createDemoHouse=async(draft:HouseDraft|null,another=false)=>{
      if(!accountId||productMode!=='demo')throw Error('Sign in and load local Demo mode before creating a House.');
      if(demoCreating.current)return;demoCreating.current=true;const current=epoch.current;
      const intentKey=`munk-demo-create-v1:${accountId}:${draft?'continue:'+scope:'blank'}`;
      try{
        const stored=JSON.parse(localStorage.getItem(intentKey)||'null');
        if(another&&stored&&!stored.houseId)throw Error('A creation is awaiting confirmation. Retry Create House to reopen that result before creating another.');
        const otherKey=`munk-demo-create-v1:${accountId}:${draft?'blank':'continue:'+scope}`;
        const other=JSON.parse(localStorage.getItem(otherKey)||'null');
        if(other&&!other.houseId)throw Error(`Another creation is awaiting confirmation. Retry ${draft?'Create House':'Continue current draft as demo House'} first; your draft is retained.`);
        let intent:{key:string;input:DemoHouseInput;houseId?:string}|null=null;
        try{if(!another)intent=JSON.parse(localStorage.getItem(intentKey)||'null');}catch{throw Error('Browser storage is unavailable. Restore storage before creating safely.');}
        if(intent&&(!/^[0-9a-f-]{36}$/i.test(intent.key)||!intent.input||typeof intent.input!=='object'))throw Error('Saved creation request is invalid. Your source draft is retained; no request was sent.');
        if(!intent){
          const existing=draft?(houseRef.current||serverHouses.find(h=>h.address===draft.address&&h.membershipRole==='owner')):null;
          const input:DemoHouseInput=draft?{name:draft.name,description:draft.description,publicName:draft.publicName,focus:draft.focus,...(!addressError(draft.address)?{address:draft.address}:{}),...(existing?{existingHouseId:existing.id,version:existing.version}:{})}:{};
          intent={key:crypto.randomUUID(),input};
          try{if(draft&&!localStorage.getItem(`munk-demo-source-v1:${accountId}:${scope}`))localStorage.setItem(`munk-demo-source-v1:${accountId}:${scope}`,JSON.stringify({...creatorRef.current,house:draft}));localStorage.setItem(intentKey,JSON.stringify(intent));}
          catch{throw Error('Could not preserve the draft and retry key. No creation request was sent.');}
        }
        const house=await serverCreator.createDemo(intent.input,intent.key);
        if(current!==epoch.current)return;
        intent.houseId=house.id;try{localStorage.setItem(intentKey,JSON.stringify(intent));}catch{/* Frozen retry request was already stored. */}
        const source=draft?{...creatorRef.current,house:draft}:structuredClone(emptyCreator);
        const selected=overlay(source,house);
        saveCreator({setItem:(_key,value)=>localStorage.setItem(`munk-creator-account-v2:${accountId}:${house.id}`,value)},selected);
        if(draft)justCreatedHouse.current=house.id;
        setServerMessage('House ready for demo use. Not published, identity-verified or network-admitted.');
        location.hash=`/creator/overview?house=${house.id}`;
      }catch(error){if((error as {fieldErrors?:unknown}).fieldErrors){try{localStorage.removeItem(intentKey);}catch{}}throw error;}finally{demoCreating.current=false;}
    };
    const transferVideo=async(draftId:string,file:File)=>{
      const house=houseRef.current;if(!accountId||!house)throw Error('Select an authorized House before uploading.');
      if(transfers.current.has(draftId))return;
      const draft=creatorRef.current.content.find(c=>c.id===draftId);if(!draft)throw Error('Save this video draft before uploading.');
      const current=epoch.current,controller=new AbortController();transfers.current.set(draftId,controller);setVideoUploading([...transfers.current.keys()]);
      const active=()=>current===epoch.current&&!controller.signal.aborted;
      const patch=(value:Partial<ContentDraft>)=>{if(active())save({...creatorRef.current,content:creatorRef.current.content.map(c=>c.id===draftId?{...c,...value,updatedAt:Date.now()}:c)});};
      const record=(u:UploadStatus)=>{if(active())setServerUploads(rows=>[u,...rows.filter(x=>x.uploadId!==u.uploadId)]);};
      patch({uploadState:'uploading',error:''});
      try {
        // Retain allocation before sending bytes. Retries inspect and reuse it;
        // an ambiguous response must never silently allocate another upload.
        let upload=draft.serverUploadId?await serverCreator.status(draft.serverUploadId,controller.signal):await serverCreator.allocate(house.id,file,controller.signal);
        if(!active())return;
        patch({serverUploadId:upload.uploadId,serverAssetId:upload.assetId});record(upload);
        if(['created','receiving'].includes(upload.state)||(upload.state==='failed'&&upload.uploadedBytes===0))upload=await serverCreator.receive(upload.uploadId,file,controller.signal);
        else if(upload.state==='failed'&&upload.uploadedBytes===upload.totalBytes)upload=await serverCreator.retry(upload.uploadId);
        else if(!['queued','processing','ready'].includes(upload.state))throw Error('The server still owns this transfer or it has expired. Check Uploads & processing before retrying; do not start another upload.');
        if(!active())return;record(upload);patch({uploadState:upload.state==='ready'?'ready':'processing',error:''});
      }catch(error){
        patch({uploadState:'failed',error:`${error instanceof Error?error.message:'Upload failed.'} Open Uploads & processing to check the server. ${creatorRef.current.content.find(c=>c.id===draftId)?.serverUploadId?'Retry this upload after the transfer stops.':'Allocation could not be confirmed; do not select the file again or start a duplicate upload.'}`.slice(0,1000)});
      }finally{if(current===epoch.current){transfers.current.delete(draftId);setVideoUploading([...transfers.current.keys()]);}}
    };
    const submitHouse=async(draft:HouseDraft,file:File,signal:AbortSignal)=>{
      const house=await saveHouse(draft);const current=epoch.current;
      let upload=await serverCreator.upload(house.id,file,'introduction',signal);
      setServerUploads(rows=>[upload,...rows.filter(u=>u.uploadId!==upload.uploadId)]);
      const deadline=Date.now()+30*60*1000;
      while(upload.state!=='ready'){
        if(signal.aborted||current!==epoch.current)throw Error('Submission stopped. Completed uploads remain on the server.');
        if(['failed','cancelled','expired'].includes(upload.state))throw Error(`Introduction processing failed: ${upload.errorCode||upload.state}.`);
        if(Date.now()>deadline)throw Error('Processing is still pending. Check the upload queue before submitting again.');
        setServerMessage(`Introduction ${upload.state}; awaiting actual worker results…`);
        await new Promise<void>(resolve=>setTimeout(resolve,2000));upload=await serverCreator.status(upload.uploadId,signal);
      }
      const latest=await serverCreator.house(house.id);await serverCreator.submit(latest,upload.assetId,signal);
      await reloadServer(house.id);setServerMessage('Submitted for Manual creator review. This does not establish legal identity or KYC.');
    };
    const removeAsset = (key: string) => { const old = assets.current.get(key); if (old)
        URL.revokeObjectURL(old.url); assets.current.delete(key); redraw(n => n + 1); };
    const putAsset = (key: string, file: File) => { const old = assets.current.get(key); if (old)
        URL.revokeObjectURL(old.url); assets.current.set(key, { file, url: URL.createObjectURL(file) }); redraw(n => n + 1); };
    return <Context.Provider value={{ updateVideoDraft,checkUpload,productMode,modeError,reloadMode,createDemoHouse,creator, setCreator, warning, save, asset: (key: string) => assets.current.get(key), putAsset, removeAsset,serverHouse,serverHouses,serverUploads,serverLoading:serverLoading||loadedAccount!==accountId||loadedScope!==scope,serverMessage,serverError,selection,houseHref,reloadServer,saveHouse,submitHouse,transferVideo,videoUploading }}>{children}</Context.Provider>;
}
export function useCreator() { const value = useContext(Context); if (!value)
    throw Error('Missing CreatorProvider'); return value; }
