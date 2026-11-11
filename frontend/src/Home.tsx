import {DefaultHome} from './NavigationPages';
import {useViewerSkin} from './interface-service';
import PublishedHome from './PublishedHome';
import { useState, useEffect, type CSSProperties } from 'react';
import { Play } from 'lucide-react';
import { houses, works, posts, houseById, workById, workPath, discoveryDesign, type HomeDesign, type SectionId } from './fixtures';
import { useApp } from './state';
import { Button, Image, WorkCards, SectionTitle, LiveCard, themeClass } from './components';
import { PostCard } from './Board';
import Exchange from './Exchange';
import Discovery from './Discovery';
export const sectionNames: Record<SectionId, string> = { featured: 'Featured film', new: 'New from your Houses', conversations: 'Conversations you’re part of', watchlist: 'Your House watchlist', board: 'From the Board', live: 'Local room preview' };
export function HomeSections({ design, preview = false }: {
    design: HomeDesign;
    preview?: boolean;
}) {
    const { state, setModal, requireAccount } = useApp();
    if (design.layout === 'discovery')
        return <Discovery preview={preview} design={design}/>;
    const savedWorks = state.saved.map(workById).filter((x): x is NonNullable<typeof x> => !!x);
    return <div className={`home-sections ${preview ? 'designer-sections' : ''}`}>{design.sections.map(section => <section data-section={section} key={section}>
 {section === 'featured' ? <div className="home-feature"><div className="hero-film"><Image name="boardMountain" alt="A camper van in a mountain valley"/><div className="film-shade"/><a className="hero-house" href="#/houses/off-grid"><Image name="forestCamp"/>Off Grid</a><div className="film-name">The long way home</div><p className="film-credit">A film by Maya Laurent</p><div className="hero-bottom"><span>Local 8-second sample</span><a className="button" href="#/videos/the-long-way-home"><Play size={14}/>Watch film</a></div></div><LiveCard /></div> :
                section === 'new' ? <><SectionTitle right={<a className="text-button" href="#/home?tab=exchange">See all</a>}>New from your Houses</SectionTitle><WorkCards items={works.filter(w => w.home)} theme={design}/></> :
                    section === 'conversations' ? <><SectionTitle>Conversations you’re part of</SectionTitle><div className="conversation-card"><Image name="viewer"/><div><b>The Margin</b><small>{state.comments.filter(c => c.target === 'tides-and-letting-go').length} replies in this fixture thread</small></div><a className="button" href="#/board/posts/tides-and-letting-go">Return to thread</a></div></> :
                        section === 'watchlist' ? <><SectionTitle>Your House watchlist</SectionTitle><div className="watchlist-card"><Image name="mountains"/><div><b>Saved works</b><small>{savedWorks.length} items</small></div><Button kind="green" onClick={() => requireAccount(() => setModal({ type: 'watchlist' }))}>View watchlist</Button></div></> :
                            section === 'board' ? <><SectionTitle>From the Board</SectionTitle><PostCard post={posts[0]} compact/></> : <LiveCard />}
 </section>)}</div>;
}
export function LegacyHome() {
    const { state, account, requireAccount, route } = useApp();
    const [tab, setTab] = useState(() => typeof location !== 'undefined' && location.hash.includes('tab=exchange') ? 'Exchange' : 'Discover');
    useEffect(() => { const value = new URLSearchParams(location.hash.split('?')[1]).get('tab'); setTab(value === 'exchange' ? 'Exchange' : value === 'mix' ? 'My mix' : 'Discover'); }, [route]);
    const switchTab = (value: string) => { setTab(value); location.hash = `#/home${value === 'Discover' ? '' : `?tab=${value === 'Exchange' ? 'exchange' : 'mix'}`}`; };
    return <main className={`home-page ${themeClass(state.design)}`} style={{ '--columns': state.design.columns } as CSSProperties}><h1 className="sr-only">Home</h1><div className="tabs home-tabs" aria-label="Home views">{['Discover', 'My mix'].map(t => <button key={t} className={tab === t ? 'active' : ''} aria-pressed={tab === t} onClick={() => switchTab(t)}><span className="tab-label">{t}</span></button>)}</div>{tab === 'Discover' ? <HomeSections design={state.design}/> : tab === 'Exchange' ? <Exchange /> : !account?<section className="creator-card"><h2>Your mix</h2><p>Sign in to save and personalize. These features remain local to this browser.</p><Button onClick={()=>requireAccount(()=>{})}>Sign in to continue</Button></section>: <><p className="fixture-note">Saves and reposts stay in this browser; they are not published or synced.</p><div className="subheading"><h2>Your mix</h2><span>{state.reposts.length} local reposts</span></div>{state.reposts.length ? state.reposts.map(id => <PostCard post={posts.find(p => p.id === id)!} key={id}/>) : <div className="empty-state">Repost a Board post to add it to your local mix.</div>}<SectionTitle>Saved for a quieter moment</SectionTitle><WorkCards items={state.saved.map(workById).filter((w): w is NonNullable<typeof w> => !!w)} theme={state.design}/>{state.saved.filter(id => posts.some(p => p.id === id)).map(id => <PostCard post={posts.find(p => p.id === id)!} key={id}/>)}</>}</main>;
}
function NetworkHome() {
    const { state, account, requireAccount, route } = useApp();
    const previewPreset = typeof location !== 'undefined' && new URLSearchParams(location.hash.split('?')[1]).get('preset') === 'discovery' && state.design.layout !== 'discovery';
    const visibleDesign = previewPreset ? discoveryDesign : state.design;
    const tab = typeof location === 'undefined' ? 'Discover' : new URLSearchParams(location.hash.split('?')[1]).get('tab') === 'exchange' ? 'Exchange' : new URLSearchParams(location.hash.split('?')[1]).get('tab') === 'mix' ? 'My mix' : 'Discover';
    return <main className={`home-page network-home ${tab === 'Exchange' ? 'exchange-home' : ''} ${themeClass(visibleDesign)}`} style={{ '--columns': visibleDesign.columns } as CSSProperties}><h1 className="sr-only">{tab==='Exchange'?'Exchange':tab==='My mix'?'My mix':'Discover'}</h1><>{previewPreset && <div className="discovery-preset-offer"><span>Previewing MUNK Discovery. Your saved layout is unchanged.</span><a className="text-button" href="#/home">Exit preview</a></div>}</>{tab!=='Exchange'&&<div className="tabs home-tabs network-tabs" aria-label="Home views">{['Discover', 'My mix'].map(t => <a key={t} className={tab === t ? 'active' : ''} aria-current={tab === t ? 'page' : undefined} href={`#/home${t === 'Discover' ? '' : `?tab=${t === 'Exchange' ? 'exchange' : 'mix'}`}`}>{t}</a>)}</div>}{tab === 'Exchange' ? <Exchange /> : tab === 'Discover' ? <Discovery design={visibleDesign}/> : !account?<section className="creator-card"><h2>Your mix</h2><p>Sign in to save and personalize. These features remain local to this browser.</p><Button onClick={()=>requireAccount(()=>{})}>Sign in to continue</Button></section>: <><p className="fixture-note">Saves and reposts stay in this browser; they are not published or synced.</p><div className="subheading"><h2>Your mix</h2><span>{state.reposts.length} local reposts</span></div>{state.reposts.length ? state.reposts.map(id => <PostCard post={posts.find(p => p.id === id)!} key={id}/>) : <div className="empty-state">Repost a Board post to add it here.</div>}<SectionTitle>Saved works</SectionTitle><WorkCards items={state.saved.map(workById).filter((w): w is NonNullable<typeof w> => !!w)} theme={state.design}/>{state.saved.filter(id => posts.some(p => p.id === id)).map(id => <PostCard post={posts.find(p => p.id === id)!} key={id}/>)}</>}</main>;
}
export default function Home(){const skin=useViewerSkin();const params=new URLSearchParams(location.hash.split('?')[1]);if(skin.design.template==='estuary'&&!params.get('tab')&&!params.get('section')&&!params.get('q'))return <DefaultHome/>;const tab=typeof location==='undefined'?'':new URLSearchParams(location.hash.split('?')[1]).get('tab');return tab==='mix'?<NetworkHome/>:tab==='exchange'?<main className="home-page exchange-home"><Exchange/></main>:<PublishedHome/>;}
