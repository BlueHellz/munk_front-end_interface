import { useState } from 'react';
import { useCreator } from './creator-state';
import { Button } from './components';
import { apiClient } from './api';
import { serverCreator } from './server-creator';
export default function RemoteUploadQueue() {
  const {serverUploads,reloadServer,houseHref}=useCreator();const [message,setMessage]=useState('');
  return <section data-upload-queue><h2>Uploads & processing queue</h2><p>These are your actual server uploads. Incomplete transfers restart from zero; completed uploads and processing jobs survive reloads.</p><a className="text-button" href={houseHref('#/creator/videos/new')}>Start another video</a>{!serverUploads.length&&<p>No saved server uploads yet.</p>}{serverUploads.map(u=><article className="creator-library-row" key={u.uploadId}><div><h3>{u.purpose==='introduction'?'Creator introduction':'Video upload'}</h3><p>{u.state} · {u.uploadedBytes} / {u.totalBytes} bytes received{u.durationMs?` · ${(u.durationMs/1000).toFixed(1)} seconds`:''}</p>{u.errorCode&&<p role="alert">{u.errorCode}</p>}{u.state==='ready'&&<video className="creator-media" controls preload="metadata" src={apiClient.url(`/uploads/${u.uploadId}/playback`)}/>}</div>{u.state==='failed'&&<Button kind="outline" onClick={()=>{if(!window.confirm('Retry processing this server upload?'))return;void serverCreator.retry(u.uploadId).then(()=>reloadServer()).catch(error=>setMessage(error instanceof Error?error.message:'Retry failed.'));}}>Retry processing</Button>}</article>)}<p role="status">{message}</p></section>;
}
