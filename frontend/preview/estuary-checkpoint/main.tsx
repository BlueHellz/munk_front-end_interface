// Isolated visual checkpoint. Does not import App, authentication, services or storage.
import React from 'react';
import {createRoot} from 'react-dom/client';
import {Search,Settings,UserCircle,Compass,Film,Layers,BookOpen,Home,PanelsTopLeft,LayoutGrid,Bookmark,Package} from 'lucide-react';
import '../../src/styles.css';
import './preview.css';
const destinations=[['Discover',Compass],['Videos',Film],['Series',Layers],['Writing',BookOpen],['Houses',Home],['Board',PanelsTopLeft],['Exchange',LayoutGrid],['Saved',Bookmark],['Add-ons',Package]] as const;
function Preview(){return <div className="checkpoint-shell" ref={node=>node?.setAttribute('inert','')} aria-label="Non-interactive desktop visual preview">
 <aside className="checkpoint-rail">
  <header className="checkpoint-brand"><img src="/assets/wordmark.png" alt="MUNK"/><div className="checkpoint-utilities" aria-label="Utilities">{([['Search',Search],['Settings',Settings],['Account',UserCircle]] as const).map(([label,Icon])=><button type="button" aria-label={label} title={label} key={label}><Icon aria-hidden="true"/></button>)}</div></header>
  <nav className="checkpoint-menu" aria-label="Main destinations">{destinations.map(([label,Icon],i)=><button type="button" key={label} className={i===0?'selected':''} aria-current={i===0?'page':undefined}><span className="checkpoint-menu-icon"><Icon aria-hidden="true"/></span><span>{label}</span></button>)}</nav>
 </aside>
 <main className="checkpoint-panel"><time className="checkpoint-clock" aria-label="Current time">{new Date().toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit'})}</time><section className="checkpoint-welcome"><h1>Discover</h1><p>Welcome to MUNK. Watch published videos and explore creator Houses.<br/>Browse without signing in or setting anything up.</p><div className="checkpoint-actions"><button type="button" className="checkpoint-primary">Browse videos</button><button type="button" className="checkpoint-secondary">Explore Houses</button></div></section></main>
 </div>;}
createRoot(document.getElementById('root')!).render(<Preview/>);
