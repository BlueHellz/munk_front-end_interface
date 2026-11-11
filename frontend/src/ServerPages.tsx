import{Subscribe}from'./Community';
import{usePlaybackPreferences}from'./viewer-preferences';
import{useRef}from'react';
import {interfaces} from './interface-service';
import {InterfaceRenderer} from './InterfaceRenderer';
import type {InterfaceRecord} from '../../contracts/src';
import {useEffect,useState} from 'react';
import {serverVideos,mediaUrl} from './server-videos';
import type {PublicVideo,PublicHouse} from '../../contracts/src';
import {Button} from './components';
export default function ServerPage({kind,id}:{kind:'house'|'video';id:string}){
 const [presentation,setPresentation]=useState<InterfaceRecord|null>(null);
 const [data,setData]=useState<{house:PublicHouse;videos:PublicVideo[]}|null>(null),[error,setError]=useState(''),[attempt,setAttempt]=useState(0),[mediaError,setMediaError]=useState(false);
 const playback=usePlaybackPreferences(),player=useRef<HTMLVideoElement>(null);
 useEffect(()=>{if(player.current){player.current.playbackRate=playback.speed;player.current.muted=playback.muted;}},[data,playback.speed,playback.muted]);
 useEffect(()=>{const c=new AbortController();setData(null);setPresentation(null);setError('');setMediaError(false);void (kind==='video'?serverVideos.video(id,c.signal).then(v=>({house:v.house,videos:[v]})):Promise.all([serverVideos.house(id,c.signal),interfaces.house(id,c.signal)]).then(([v,d])=>{if(!c.signal.aborted)setPresentation(d);return v;})).then(v=>{if(!c.signal.aborted){setData(v);document.title=`MUNK — ${kind==='video'?v.videos[0].title:v.house.name}`;}}).catch(e=>{if(!c.signal.aborted)setError(e instanceof Error?e.message:'Could not load this page.');});return()=>c.abort();},[kind,id,attempt]);
 if(error)return <main className="creator-page"><h1>{kind==='video'?'Video unavailable':'House unavailable'}</h1><p role="alert">{error}</p><p>The item may be unpublished, unavailable, or still private.</p><Button onClick={()=>setAttempt(n=>n+1)}>Retry</Button><a className="button outline" href="#/home">Home</a></main>;
 if(!data)return <main><p role="status">Loading {kind}…</p></main>;
 const {house,videos}=data,video=videos[0];
 if(kind==='house')return <main className="house-page"><a className="text-button" href="#/home">← Home</a><header className="creator-heading"><div><small>{house.demo?'DEMO HOUSE':'HOUSE'}</small><h1>{house.name}</h1><p>By {house.creatorName}</p><p>{house.description}</p><Subscribe houseId={house.id}/></div></header>{presentation&&<InterfaceRenderer design={presentation.design} videos={videos} introductionPresent={house.introductionPresent} introductionUrl={house.introductionUrl}/>}</main>;
 return <main className="video-page"><a className="text-button" href={`#/houses/${house.address}?source=server`}>← {house.name}</a><header className="video-title"><h1>{video.title}</h1><span>By {house.creatorName}</span></header><div className="player"><video ref={player} key={video.id} controls playsInline preload="metadata" poster={mediaUrl(video.posterUrl)} src={mediaUrl(video.mediaUrl)} aria-label={video.title} onError={()=>setMediaError(true)}/></div>{mediaError&&<p role="alert">Video playback failed. Reload the page or check that the video is still published.</p>}<p>{video.description}</p>{video.seriesName&&<p>{video.seriesName}{video.episode?` · Episode ${video.episode}`:''}</p>}<a className="button outline" href={`#/houses/${house.address}?source=server`}>Visit House</a></main>;
}
