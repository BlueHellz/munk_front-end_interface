import CatalogueJourney from '../shared/CatalogueJourney';
import PreservedExchange from './preserved-exchange';
// Isolated visual prototype: no application, backend, auth or storage imports.
import React,{useEffect,useRef,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {Search,Settings,UserCircle,Home,LayoutGrid,Bookmark,Package,Building2,Menu,X,PanelsTopLeft} from 'lucide-react';
import {MunkLogo} from './brand-candidates/MunkLogo';
import '../../src/styles.css';
import '../../src/visual-fixes.css';
import '../../src/discovery.css';
import '../../src/creator.css';
import '../../src/exchange-mosaic.css';
import './composition.css';
const entries=[['Home',Home],['Catalogue',LayoutGrid],['Exchange',LayoutGrid],['Houses',Building2],['Board',PanelsTopLeft],['Extensions',Package],['Saved',Bookmark]] as const;
function Composition(){
 const [screen,setScreen]=useState<string>(new URLSearchParams(location.search).get('destination')||'Home');
 const [drawer,setDrawer]=useState(false),[mobile,setMobile]=useState(()=>matchMedia('(max-width:760px)').matches),[now,setNow]=useState(()=>new Date()),[announcement,setAnnouncement]=useState('');
 const menuButton=useRef<HTMLButtonElement>(null),nav=useRef<HTMLElement>(null);
 useEffect(()=>{const q=matchMedia('(max-width:760px)'),update=()=>{setMobile(q.matches);setDrawer(false);};q.addEventListener('change',update);return()=>q.removeEventListener('change',update);},[]);
 useEffect(()=>{const timer=setInterval(()=>setNow(new Date()),15000);return()=>clearInterval(timer);},[]);
 useEffect(()=>{if(drawer&&mobile)nav.current?.querySelector<HTMLButtonElement>('button')?.focus();},[drawer,mobile]);
 const close=()=>{setDrawer(false);requestAnimationFrame(()=>menuButton.current?.focus());};
 const previewAction=(label:string)=>{if(['Search','Settings','Profile'].includes(label)){if(label==='Search')setScreen('Search');else location.href='/preview/navigation-checkpoint/?screen='+ (label==='Settings'?'settings':'profile-guest');return;}setAnnouncement(`${label}: visual prototype only. Application navigation remains unchanged until approval.`);};
 const select=(name:string)=>{if(['Home','Catalogue','Exchange','Houses','Board'].includes(name)){setScreen(name);if(mobile)setDrawer(false);}else if(name==='Extensions')setAnnouncement('Extensions groups Skins, House builds and optional Features. External downloads and executable extensions are not implemented. The existing browser will be connected after approval.');else previewAction(name);};
 const utilities=()=> <div className="official-utilities" aria-label="Utilities">{([['Search',Search],['Settings',Settings],['Profile',UserCircle]] as const).map(([name,Icon])=><button type="button" aria-label={name} title={name} key={name} onClick={()=>previewAction(name)}><Icon aria-hidden="true"/></button>)}</div>;
 return <div className={`official-shell ${drawer?'drawer-open':''}`} aria-label="Isolated MUNK appearance prototype" data-mobile={mobile?'true':'false'} onKeyDown={e=>{if(e.key==='Escape'&&drawer){e.preventDefault();close();}}}>
 <header className="official-mobile-bar"><button ref={menuButton} type="button" className="official-drawer-toggle" aria-label={drawer?'Close navigation':'Open navigation'} aria-controls="prototype-navigation" aria-expanded={drawer} onClick={()=>drawer?close():setDrawer(true)}>{drawer?<X/>:<Menu/>}</button><MunkLogo variant="wordmark"/>{utilities()}</header>
 {drawer&&mobile&&<button className="official-backdrop" aria-label="Close navigation backdrop" onClick={close}/>}
 <aside className="official-sidebar" id="prototype-navigation" aria-label="Main navigation" role={mobile&&drawer?'dialog':undefined} aria-modal={mobile&&drawer?true:undefined}>
 <header className="official-brand"><div className="official-wordmark"><MunkLogo variant="stacked"/></div>{utilities()}</header>
 <nav className="official-menu" ref={nav} aria-label="Main destinations" onKeyDown={e=>{const buttons=[...e.currentTarget.querySelectorAll<HTMLButtonElement>('button')],i=buttons.indexOf(document.activeElement as HTMLButtonElement);let next=i;if(e.key==='ArrowDown')next=(i+1)%buttons.length;else if(e.key==='ArrowUp')next=(i-1+buttons.length)%buttons.length;else if(e.key==='Home')next=0;else if(e.key==='End')next=buttons.length-1;else if(e.key==='Tab'&&drawer&&mobile){if(e.shiftKey&&i===0)next=buttons.length-1;else if(!e.shiftKey&&i===buttons.length-1)next=0;else return;}else return;e.preventDefault();buttons[next]?.focus();buttons[next]?.scrollIntoView({block:'nearest'});}}>
 {entries.map(([name,Icon])=><button type="button" key={name} className={name===screen?'selected':''} aria-current={name===screen?'page':undefined} onClick={()=>select(name)}><span className="official-menu-icon"><Icon aria-hidden="true"/></span><span className="official-menu-label">{name}</span></button>)}
 </nav></aside>
 <main className={`official-panel ${screen==='Exchange'?'exchange-active':['Catalogue','Search','Houses'].includes(screen)?'catalogue-active':''}`} ref={node=>node?.toggleAttribute('inert',drawer&&mobile)}>{['Catalogue','Search','Houses'].includes(screen)?<CatalogueJourney key={screen} globalSearch={screen==='Search'} directory={screen==='Houses'}/>:screen==='Exchange'?<PreservedExchange onPreviewAction={previewAction}/>:screen==='Board'?<section className="official-context official-board-empty" aria-label="Empty subscriptions Board preview"><h1>Board</h1><p>Posts from Houses you subscribe to will appear here.</p><div className="official-actions"><button type="button" className="official-primary" data-integration-target="#/home?section=houses" onClick={()=>previewAction('Explore Houses')}>Explore Houses</button></div><p className="official-board-note">Subscribe means a free follow, not a payment.</p></section>:<><time className="official-clock" dateTime={now.toISOString()} aria-label="Local time">{now.toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit'})}</time><section className="official-context" aria-label="Welcome to MUNK"><h1>Make MUNK yours.</h1><p>Start with the built-in interface. Explore skins, House builds, and optional features whenever you’re ready.</p><div className="official-actions"><button type="button" className="official-primary" data-integration-target="#/appearance" onClick={()=>select('Extensions')}>Browse extensions</button></div></section></>}</main>
 <p className="sr-only" role="status" aria-live="polite">{announcement}</p>
 </div>;
}
createRoot(document.getElementById('root')!).render(<Composition/>);
