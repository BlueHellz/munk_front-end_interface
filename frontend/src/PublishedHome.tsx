import{openUtility}from'./navigation-flow';
import{HouseDirectory}from'./Community';
import {useApp} from './state';
import {InterfaceRenderer} from './InterfaceRenderer';
import {useCatalog,useViewerSkin} from './interface-service';
import {Button} from './components';
export default function PublishedHome(){
 const {searchQuery,account,requireAccount,state}=useApp(),catalog=useCatalog(),skin=useViewerSkin();
 const destination=new URLSearchParams(location.hash.split('?')[1]).get('section')||'discover',mediaCenter=skin.design.template==='estuary';
 const title=searchQuery.trim()?'Search':({discover:'Discover',videos:'Catalogue',series:'Series',writing:'Writing',houses:'Houses',saved:'Saved'} as Record<string,string>)[destination]||'Discover';
 const saved=catalog.videos.filter(v=>state.saved.includes(v.id));
 const browseSkins=<a className="button" href="#/appearance?tab=browse" onClick={e=>{e.preventDefault();openUtility('#/appearance?tab=browse');}}>Browse skins</a>;
 if(mediaCenter&&destination==='videos')return <main className="default-centered-page" data-media-destination="videos" data-catalogue-requires-skin><section className="default-centered-group"><h1>Catalogue</h1><p>Choose a viewer skin to browse videos in Catalogue.</p>{browseSkins}</section></main>;
 if(mediaCenter&&destination==='saved'&&(!account||!saved.length))return <main className="default-centered-page" data-media-destination="saved"><section className="default-centered-group"><h1>Saved</h1><p>{account?'No saved works yet. Saving network videos is not connected yet.':'Sign in to see your personal saves.'}</p><div className="button-row">{!account&&<Button onClick={()=>requireAccount(()=>{},'#/home?section=saved')}>Sign in</Button>}{browseSkins}</div></section></main>;
 const content=<><h1 className={mediaCenter?'media-center-title':'sr-only'}>{title}</h1>{!mediaCenter&&<nav className="tabs home-tabs network-tabs" aria-label="Home views"><a href="#/home" className="active" aria-current="page">Discover</a><a href="#/home?tab=mix">My mix</a></nav>}{destination==='houses'?<HouseDirectory/>:destination==='saved'&&!account?<section className="media-center-empty"><h2>Your saved works</h2><p>Sign in to see your personal saves. Network videos are available without an account.</p><div className="button-row"><Button onClick={()=>requireAccount(()=>{},'#/home?section=saved')}>Sign in</Button><a className="button outline" href="#/home?section=videos">Browse videos</a></div></section>:catalog.loading||skin.loading?<p role="status">Loading published catalog…</p>:catalog.error||skin.error?<section><p role="alert">{catalog.error||skin.error}</p><Button onClick={()=>{catalog.retry();skin.retry();}}>Retry</Button><p>Saved designs and server content have not been replaced.</p></section>:destination==='saved'&&!saved.length?<section className="media-center-empty"><h2>No saved works yet</h2><p>Your saves are local to this browser. Saving network videos is not connected yet.</p><a className="button outline" href="#/home?section=videos">Browse videos</a></section>:<InterfaceRenderer design={skin.design} videos={destination==='saved'?saved:catalog.videos} query={searchQuery} destination={destination}/>}</>;
 return <main className={`home-page network-home ${mediaCenter?'media-center-home default-centered-page':''}`} data-media-destination={destination}>{mediaCenter?<section className="default-centered-group default-wide-group">{content}</section>:content}
 </main>;
}
