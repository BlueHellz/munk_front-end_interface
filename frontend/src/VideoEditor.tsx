import {useEffect,useRef,useState} from 'react';
import {useCreator} from './creator-state';
import {useApp} from './state';
import {Button} from './components';
import {fileInfo,newContent,validateFile,type ContentDraft} from './creator-model';
import {serverVideos} from './server-videos';
import type {ServerVideo} from '../../contracts/src';

const signature=(d:ContentDraft)=>JSON.stringify([d.serverUploadId,d.title,d.description,d.series,d.series?d.episode:null]);
export default function VideoEditor({id,preview=false}:{id:string;preview?:boolean}){
 const {creator,serverHouse,serverUploads,videoUploading,updateVideoDraft,asset,putAsset,transferVideo,checkUpload,houseHref,productMode}=useCreator();const {go}=useApp();
 const [record,setRecord]=useState<ServerVideo|null>(null),[loaded,setLoaded]=useState(false),[loadError,setLoadError]=useState(''),[message,setMessage]=useState(''),[error,setError]=useState(''),[busy,setBusy]=useState(false),[saving,setSaving]=useState(false),[attempt,setAttempt]=useState(0);
 const recordRef=useRef<ServerVideo|null>(null),active=useRef(true),inflight=useRef<Promise<ServerVideo>|null>(null),savedSignature=useRef(''),autoSaveAllowed=useRef(true),fresh=useRef(newContent('video'));
 const logicalId=record?.clientDraftId||id;
 const draft=creator.content.find(c=>c.id===logicalId),draftRef=useRef(draft);draftRef.current=draft;
 const hasLocal=useRef(!!draft),houseId=serverHouse!.id;
 useEffect(()=>{active.current=true;return()=>{active.current=false;};},[]);
 useEffect(()=>{if(id==='new'){const d=fresh.current;updateVideoDraft(d.id,d);go(houseHref(`#/creator/videos/${d.id}`));}},[]);
 useEffect(()=>{
  if(id==='new')return;const controller=new AbortController();setLoaded(false);setLoadError('');
  void serverVideos.list(houseId,controller.signal).then(rows=>{
   if(controller.signal.aborted)return;const found=rows.find(v=>v.id===id)||rows.find(v=>v.clientDraftId===id)||null;recordRef.current=found;setRecord(found);
   if(found){
    if(!hasLocal.current){updateVideoDraft(found.clientDraftId,{title:found.title,description:found.description,series:found.seriesName,episode:found.episode||1,serverVideoId:found.id,serverUploadId:found.uploadId,serverAssetId:found.assetId,publication:found.publication,uploadState:found.assetState==='ready'?'ready':'processing',error:''});}
    else if(draftRef.current)updateVideoDraft(found.clientDraftId,{serverVideoId:found.id,...(!draftRef.current.serverUploadId?{serverUploadId:found.uploadId,serverAssetId:found.assetId}:{})});
    savedSignature.current=JSON.stringify([found.uploadId,found.title,found.description,found.seriesName,found.seriesName?found.episode:null]);
    autoSaveAllowed.current=!draftRef.current||signature({...draftRef.current,serverUploadId:draftRef.current.serverUploadId||found.uploadId})===savedSignature.current;
    if(!autoSaveAllowed.current&&found.publication!=='published')setMessage('Browser edits are retained. Choose Save video to store them before publishing.');
   }
   setLoaded(true);
  }).catch(e=>{if(!controller.signal.aborted)setLoadError(e instanceof Error?e.message:'Could not load server video details.');});return()=>controller.abort();
 },[id,houseId,attempt]);
 const upload=serverUploads.find(u=>u.uploadId===draft?.serverUploadId);
 const sending=videoUploading.includes(logicalId),published=record?.publication==='published';
 const saveServer=async():Promise<ServerVideo>=>{
  while(inflight.current)await inflight.current;
  const d=draftRef.current;if(!d?.serverUploadId)throw Error('Choose a video or reconnect an existing server upload first.');
  const sig=signature(d);if(recordRef.current&&savedSignature.current===sig)return recordRef.current;
  setSaving(true);
  const request=serverVideos.save(houseId,{clientDraftId:d.id,uploadId:d.serverUploadId,title:d.title,description:d.description,seriesName:d.series,...(d.series?{episode:d.episode}:{}),...(recordRef.current?{version:recordRef.current.version}:{})}).then(v=>{
   if(active.current){recordRef.current=v;setRecord(v);savedSignature.current=sig;autoSaveAllowed.current=true;updateVideoDraft(d.id,{serverVideoId:v.id,publication:v.publication});setMessage('Video details saved.');setError('');}return v;
  }).finally(()=>{if(inflight.current===request)inflight.current=null;if(active.current)setSaving(false);});
  inflight.current=request;return request;
 };
 const sig=draft?signature(draft):'';
 useEffect(()=>{
  if(!loaded||!draft?.serverUploadId||published||busy||!autoSaveAllowed.current||sig===savedSignature.current)return;
  const timer=setTimeout(()=>{void saveServer().catch(e=>{if(active.current)setError(e instanceof Error?e.message:'Could not save video details. Retry Save video.');});},600);return()=>clearTimeout(timer);
 },[loaded,sig,published,busy]);
 const edit=(patch:Partial<ContentDraft>)=>{autoSaveAllowed.current=true;if(draft)updateVideoDraft(draft.id,patch);};
 const choose=(file?:File)=>{
  if(!file||published||sending||!draft)return;const problem=validateFile(fileInfo(file),'video');if(problem){setError(problem);return;}
  if(draft.serverUploadId){
   if(upload&&['queued','processing','ready'].includes(upload.state)){setError('This draft already has a server video. Use Upload video in the workspace for a different video.');return;}
   if(draft.file&&JSON.stringify(draft.file)!==JSON.stringify(fileInfo(file))){setError('Choose the same original file to retry this upload.');return;}
  }else if(draft.file&&!window.confirm('No server upload is linked to this draft. Check Use an existing upload first. Start a new upload of this file?'))return;
  putAsset(`${draft.id}:video`,file);edit({file:fileInfo(file),title:draft.title.trim()?draft.title:file.name.replace(/\.[^.]+$/,'').replace(/[_-]+/g,' ').trim().slice(0,160)||'Untitled video',error:''});setError('');
  void transferVideo(draft.id,file).catch(e=>setError(e instanceof Error?e.message:'Could not start upload.'));
 };
 const publish=async()=>{
  if(!draft||busy||sending)return;if(!window.confirm('Publish this video and show its House profile to anyone who opens the viewer link?'))return;
  setBusy(true);setError('');try{
   const current=await checkUpload(draft.serverUploadId!);if(current.state!=='ready')throw Error('Processing is not finished. Check the upload status before publishing.');
   const saved=await saveServer();if(!active.current)return;const result=await serverVideos.publish(saved);
   if(active.current){recordRef.current=result;setRecord(result);updateVideoDraft(draft.id,{serverVideoId:result.id,publication:'published'});setMessage('Published. Your viewer link is ready.');}
  }catch(e){if(active.current)setError(e instanceof Error?e.message:'Publishing failed. Your upload and draft are retained.');}finally{if(active.current)setBusy(false);}
 };
 const unpublish=async()=>{
  if(!record||busy||!window.confirm('Unpublish this video? New viewer requests will stop working. Your video and draft stay saved.'))return;setBusy(true);
  try{const result=await serverVideos.unpublish(record);recordRef.current=result;setRecord(result);if(draft)updateVideoDraft(draft.id,{publication:result.publication});setMessage('Unpublished. Your video remains saved.');}catch(e){setError(e instanceof Error?e.message:'Unpublishing failed.');}finally{setBusy(false);}
 };
 if(id==='new')return <main className="creator-page"><p role="status">Opening video editor…</p></main>;
 if(loadError)return <main className="creator-page"><h1>Upload video</h1><p role="alert">{loadError}</p><p>Your browser draft and server upload are retained.</p><Button onClick={()=>setAttempt(n=>n+1)}>Retry loading video</Button></main>;
 if(!loaded)return <main className="creator-page"><p role="status">Loading saved video and upload status…</p></main>;
 if(!draft)return <main className="creator-page"><h1>Draft not found</h1><p>No saved video matches this draft in this House.</p><a href={houseHref('#/creator/library')}>Content library</a></main>;
 const local=asset(`${draft.id}:video`),ready=upload?.state==='ready';
 const eligible=serverHouse!.admissionStatus==='admitted'||productMode==='demo'&&serverHouse!.demoReady===true;
 const reason=sending?'Uploading video…':!draft.serverUploadId?'Choose a file, or use an existing upload.':!upload?'Checking server upload. Use Check status if needed.':ready?'Ready to publish.':upload.state==='failed'?`Processing failed (${upload.errorCode||'unknown error'}). Open Uploads & processing to retry.`:upload.state==='queued'?'Queued for processing. The media worker must be running.':upload.state==='processing'?'Processing video…':`Upload status: ${upload.state}.`;
 const viewer=record?.viewerPath?new URL(record.viewerPath,location.origin+'/').href:'';
 return <main className="creator-page" data-creator-view={preview?'video-preview':'video-editor'}><a href={houseHref('#/creator/library')}>← Content library</a><header className="creator-heading"><div><small>{published?'PUBLISHED VIDEO':'VIDEO'}</small><h1>{published?record!.title:'Upload video'}</h1><p>{serverHouse!.name}</p></div><a className="button outline" href={houseHref('#/creator/uploads')}>Uploads &amp; processing</a></header>
 <section className="creator-card"><h2>{published?'Published':'1. Choose a video'}</h2>{!published&&<><label className="creator-field"><span>Video file</span><input data-video-file type="file" accept="video/mp4,video/webm,video/quicktime" disabled={busy||sending||!!draft.serverUploadId&&!!upload&&['queued','processing','ready'].includes(upload.state)} onChange={e=>choose(e.target.files?.[0])}/></label><p>Choosing a file starts its upload. You can edit the details while it uploads. Keep this tab open until receipt is confirmed.</p></>}
 <p role="status" aria-live="polite">{published?'Published — anyone with the viewer link can watch.':reason}</p>{!published&&draft.serverUploadId&&<Button kind="outline" onClick={()=>void checkUpload(draft.serverUploadId!).then(()=>setError('')).catch(e=>setError(e instanceof Error?e.message:'Could not check upload.'))}>Check status</Button>}
 {!published&&!sending&&draft.serverUploadId&&upload?.state==='failed'&&local&&<Button kind="outline" onClick={()=>void transferVideo(draft.id,local.file)}>Retry existing upload</Button>}
 {!published&&!sending&&serverUploads.some(u=>u.purpose==='video')&&<details><summary>Use an existing upload</summary><p>If this video was already uploaded, reconnect it instead of sending it again.</p><label className="creator-field"><span>Server upload</span><select aria-label="Use an existing upload" value="" onChange={e=>{const u=serverUploads.find(u=>u.uploadId===e.target.value);if(u){edit({serverUploadId:u.uploadId,serverAssetId:u.assetId,uploadState:u.state==='ready'?'ready':'processing',error:'',file:undefined});setError('');}}}><option value="">Choose an upload</option>{serverUploads.filter(u=>u.purpose==='video').map((u,i)=><option key={u.uploadId} value={u.uploadId}>Video {i+1} · {u.state} · {(u.totalBytes/1024/1024).toFixed(1)} MB{u.durationMs?` · ${(u.durationMs/1000).toFixed(0)} seconds`:''}</option>)}</select></label></details>}
 {local&&!published&&<video className="creator-media" controls playsInline preload="metadata" src={local.url}/>}</section>
 <section className="creator-card"><h2>2. Details</h2><label className="creator-field"><span>Title</span><input data-content-title maxLength={160} disabled={published||busy} value={published?record!.title:draft.title} onChange={e=>edit({title:e.target.value})}/></label><label className="creator-field"><span>Description · optional</span><textarea maxLength={4000} disabled={published||busy} value={published?record!.description:draft.description} onChange={e=>edit({description:e.target.value})}/></label>{!published&&<p role="status">{saving?'Saving video details…':record?'Server video linked. Details save as you edit.':'Details will save to the server when an upload is linked.'}</p>}</section>
 <section className="creator-card"><h2>{published?'Watch video':'3. Publish'}</h2>{published?<><a className="button" href={viewer}>Watch video</a><label className="creator-field"><span>Viewer URL — open in a guest browser</span><input aria-label="Viewer URL" readOnly value={viewer}/></label><a className="button outline" href={`#/houses/${serverHouse!.address}?source=server`}>View House</a><Button kind="outline" disabled={busy} onClick={()=>void unpublish()}>Unpublish</Button></>:<><p>{!eligible?(productMode==='demo'?'Continue this existing House as a demo House in House details before publishing.':'Strict mode requires House admission before publication.'):ready?'Publishing makes this video and its House profile viewable without signing in.':reason}</p>{!eligible&&<a href={houseHref('#/create/house')}>House details</a>}<div className="button-row"><Button disabled={busy||sending||!ready||!loaded||!eligible} kind="green" onClick={()=>void publish()}>{busy?'Publishing…':'Publish'}</Button><Button disabled={saving||!draft.serverUploadId} kind="outline" onClick={()=>void saveServer().catch(e=>setError(e instanceof Error?e.message:'Could not save video.'))}>Save video</Button></div></>}</section>
 {(error||draft.error)&&!published&&<><p role="alert">{error||draft.error}</p><Button kind="outline" onClick={()=>setAttempt(n=>n+1)}>Reload server details</Button><a className="text-button" href={houseHref('#/creator/videos/new')}>Start a different video</a></>}<p role="status">{message}</p></main>;
}
