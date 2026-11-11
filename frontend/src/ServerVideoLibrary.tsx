import {useEffect,useState} from 'react';
import {useCreator} from './creator-state';
import {serverVideos} from './server-videos';
import type {ServerVideo} from '../../contracts/src';
import {Button} from './components';
export default function ServerVideoLibrary(){
 const {serverHouse,creator,houseHref}=useCreator();const [rows,setRows]=useState<ServerVideo[]>([]),[error,setError]=useState(''),[loading,setLoading]=useState(true),[attempt,setAttempt]=useState(0);
 useEffect(()=>{let active=true;setLoading(true);setError('');void serverVideos.list(serverHouse!.id).then(v=>{if(active)setRows(v);}).catch(e=>{if(active)setError(e instanceof Error?e.message:'Could not load server videos.');}).finally(()=>{if(active)setLoading(false);});return()=>{active=false;};},[serverHouse!.id,attempt]);
 const local=creator.content.filter(c=>c.kind==='video'&&!rows.some(r=>r.clientDraftId===c.id));
 return <section><h3>Videos</h3>{loading&&<p role="status">Loading server videos…</p>}{error&&<><p role="alert">{error} Browser drafts below are retained.</p><Button onClick={()=>setAttempt(n=>n+1)}>Retry server videos</Button></>}{rows.map(v=><article className="creator-library-row" key={v.id}><div><h3>{v.title}</h3><p>{v.publication==='published'?'Published':v.assetState==='ready'?'Ready to publish':`Upload: ${v.assetState}`}</p></div><div className="button-row"><a className="button outline" href={houseHref(`#/creator/videos/${v.clientDraftId}`)}>Open video</a>{v.viewerPath&&<a className="button" href={v.viewerPath}>Watch video</a>}</div></article>)}{local.map(v=><article className="creator-library-row" key={v.id}><h3>{v.title||'Untitled video'}</h3><a className="button outline" href={houseHref(`#/creator/videos/${v.id}`)}>Continue draft</a></article>)}{!loading&&!error&&!rows.length&&!local.length&&<p>No videos yet. Use Upload video above.</p>}</section>;
}
