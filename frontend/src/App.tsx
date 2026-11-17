import{AppearanceProvider,useAppearance}from'./appearance-preference';import DefaultClock from'./default-ui/DefaultClock';import'./platform-theme.css';
import{defaultMode}from'./default-ui/mode';
import'./default-theme.css';
import DefaultUtilities from './default-ui/DefaultUtilities';
import{viewerPresentation}from'./skins/registry';
import BrowseSkin from './skins/browse/BrowseSkin';
import ArtViewer from './skins/art/ArtViewer';
import DefaultNavigation from './DefaultNavigation';
import {NavigationPage,SubscriptionsBoard} from './NavigationPages';
import MediaCenterNav from './MediaCenterNav';
import {ViewerSkinProvider,useViewerSkin} from './interface-service';
import './media-center.css';
import Appearance from './Appearance';
import { useState, useEffect, useRef } from 'react';
import { Home as HomeIcon, LayoutGrid, PanelsTopLeft, Mail, Plus, X, ChevronDown, Paintbrush, Wallet as WalletIcon } from 'lucide-react';
import { houses, houseById, workById, postById } from './fixtures';
import { Provider, useApp } from './state';
import { Image, Dialog, Button, themeClass } from './components';
import Home from './Home';
import ServerPage from './ServerPages';
import MyHouses from './MyHouses';
import NetworkHeader from './NetworkHeader';
import Onboarding, {AccountSettings} from './Onboarding';
import {useCreator} from './creator-state';
import Creator, {CreatorStatus,HouseSetup,HousePreviewPage,ContentEditor} from './Creator';
import {CreatorProvider} from './creator-state';
import House from './House';
import Video from './Video';
import Article from './Article';
import Board from './Board';
import Series from './Series';
import WalletView from './wallet/WalletView';
import MunkeeStudio from './munkee-studio/MunkeeStudio';
import { series } from './discovery-model';
import ModalContent, { LiveDialog, type Room } from './Dialogs';
const emptyRoom = (): Room => ({ messages: [], reaction: '', reducedMotion: false, draft: '' });
function Shell() {
    const { state, route, modal, setModal, notice, storageWarning, account, setSearchQuery, requireAccount } = useApp();
    const {serverHouse}=useCreator();
    const {theme}=useAppearance();const skin=useViewerSkin(),presentation=viewerPresentation(skin.design),mediaCenter=presentation.kind==='default';
    const [searchOpen,setSearchOpen]=useState(false);
    const [navExpanded, setNavExpanded] = useState(false);
    const exchangeTab = typeof location !== 'undefined' && new URLSearchParams(location.hash.split('?')[1]).get('tab') === 'exchange';
    const network = true; // One recognizable network rail on every route; House content keeps its own theme.
    const [recipientPicker, setRecipientPicker] = useState(false);
    const [minimized, setMinimized] = useState<string | null>(null);
    const [rooms, setRooms] = useState<Record<string, Room>>({});
    const shell = useRef<HTMLDivElement>(null);
    const entityHouse = route.type === 'house' ? houseById(route.id) : route.type === 'video' || route.type === 'article' ? houseById(workById(route.id)!.houseId) : route.type === 'series' ? houseById(series.find(s => s.id === route.id)!.houseId) : route.type === 'post' ? houseById(postById(route.id)!.houseId) : null;
    const title = route.type === 'home' ? 'Home' : route.type === 'wallet' ? (route.mode === 'viewer' ? 'Viewer Wallet' : 'House Wallet') : route.type === 'house' ? entityHouse!.name : route.type === 'video' || route.type === 'article' ? workById(route.id)!.title : route.type === 'series' ? series.find(s => s.id === route.id)!.title : route.type === 'post' ? 'Board conversation' : route.type==='appearance'?'Appearance & add-ons':route.type === 'board' ? 'Board' : route.type==='serverHouse'?'House':route.type==='serverVideo'?'Video':route.type==='creator'?'Creator workspace':route.type==='signIn'?'Sign in':route.type==='accountSettings'?'Account settings':route.type==='myHouses'?'My Houses':route.type==='houseSetup'?'House details':route.type==='housePreview'?'Private House preview':route.type==='contentEditor'?'Content draft':'Page not found';
    const navigated=useRef(false);
    useEffect(() => { document.title = `MUNK — ${title}`; if(window.innerWidth<=760)setNavExpanded(false); if(navigated.current){const main=document.querySelector<HTMLElement>('main');if(main){main.tabIndex=-1;main.focus({preventScroll:true});}}navigated.current=true; }, [route, title]);
    useEffect(()=>{const sync=()=>{const content=document.querySelector('.page-content');if(content)content.toggleAttribute('inert',navExpanded&&window.innerWidth<=760);};sync();addEventListener('resize',sync);return()=>{removeEventListener('resize',sync);document.querySelector('.page-content')?.removeAttribute('inert');};},[navExpanded,route,mediaCenter]);
    const blocked = !!modal || recipientPicker;
    useEffect(() => {
        if (blocked)
            shell.current?.setAttribute('inert', '');
        else
            shell.current?.removeAttribute('inert');
    }, [blocked]);
    const openMessages = () => requireAccount(() => {location.hash='#/messages';},'#/messages');
    if(route.type==='signIn')return <><Onboarding/>{notice&&<div role="status" className="toast">{notice}</div>}</>;
    if(route.type==='munkeeStudio')return <MunkeeStudio/>;
    if(presentation.kind==='default'&&['settings','appearance'].includes(route.type))return <DefaultUtilities/>;
    if(route.type!=='wallet'){
        if(presentation.kind==='browse')return <BrowseSkin/>;
        if(presentation.kind==='cinema'||presentation.kind==='silvo'||presentation.kind==='ah2')return <ArtViewer skin={presentation.kind}/>;
    }
    return <><div className={`app-shell ${network ? 'network-shell' : ''} ${themeClass(state.design)} ${mediaCenter?'default-shell '+(route.type==='serverHouse'||route.type==='house'?'default-house-context ':exchangeTab?'default-exchange-context ':'')+(skin.design.motion==='none'?'default-reduce-motion ':'')+(skin.design.density==='compact'?'default-density-compact':''):''} ${network && navExpanded ? 'nav-expanded' : ''} ${searchOpen?'mobile-search-open':''}`} data-default-mode={mediaCenter?theme:undefined} ref={shell} onKeyDown={e=>{if(e.key==='Escape'&&navExpanded&&!blocked){setNavExpanded(false);document.querySelector<HTMLButtonElement>('.network-brand button')?.focus();}}}><a className="skip-link" href="#main-content" onClick={e=>{e.preventDefault();const main=document.querySelector<HTMLElement>('main');if(main){main.tabIndex=-1;main.focus();}}}>Skip to content</a>{mediaCenter?<DefaultNavigation expanded={navExpanded} toggle={()=>setNavExpanded(!navExpanded)}/>:<><NetworkHeader expanded={navExpanded} onToggle={()=>setNavExpanded(!navExpanded)} searchOpen={searchOpen} onSearchToggle={setSearchOpen} mediaCenter={mediaCenter}/>{navExpanded&&<button className="network-nav-backdrop" aria-label="Close navigation overlay" onClick={()=>setNavExpanded(false)}/>}<aside id="network-sidebar" className="sidebar network-sidebar" aria-label="Network navigation" onKeyDown={e=>{if(e.key==='Escape'){setNavExpanded(false);document.querySelector<HTMLButtonElement>('.network-brand button')?.focus();}}}>{mediaCenter?<MediaCenterNav/>:<><nav><a aria-label="Home" title="Home" className={route.type==='home'&&!exchangeTab?'active':''} href="#/home" onClick={()=>setSearchQuery('')}><HomeIcon/><span className="nav-text">Home</span></a><a aria-label="Exchange" title="Exchange" className={exchangeTab?'active':''} href="#/home?tab=exchange"><LayoutGrid/><span className="nav-text">Exchange</span></a><a aria-label="Wallet" title="Wallet" className={route.type==='wallet'?'active':''} href="#/wallet"><WalletIcon/><span className="nav-text">Wallet</span></a><a aria-label="Board" title="Board" className={route.type==='board'||route.type==='post'?'active':''} href="#/board"><PanelsTopLeft/><span className="nav-text">Board</span></a><button aria-label="Messages" title="Messages" onClick={openMessages}><Mail/><span className="nav-text">Messages</span></button><button aria-label="My Houses" title="My Houses" onClick={()=>requireAccount(()=>{location.hash='/my-houses';},'#/my-houses')}><LayoutGrid/><span className="nav-text">My Houses</span></button></nav><div className="network-sidebar-secondary"><a aria-label="Appearance & add-ons" title="Appearance & add-ons" href="#/appearance" className={route.type==='appearance'?'active':''}><Paintbrush/><span className="nav-text">Appearance &amp; add-ons</span></a><button aria-label="Create a House" title="Create a House" onClick={()=>requireAccount(()=>{location.hash='/create/house';},'#/create/house')}><Plus/><span className="nav-text">Create a House</span></button><button aria-label="Explore Houses" title="Discover Houses · fictional catalog" onClick={()=>setModal({type:'explore'})}><PanelsTopLeft/><span className="nav-text">Discover Houses</span></button></div></>}</aside></>}{mediaCenter&&<div className="default-clock-bar"><DefaultClock/></div>}<div className="page-content" key={route.type + ('id' in route ? route.id : '')}>{['creator','houseSetup','housePreview','contentEditor'].includes(route.type)&&<p className="creator-disclosure creator-workspace-context">Creator workspace · {serverHouse?`${serverHouse.name||serverHouse.address} · ${serverHouse.membershipRole||'role unavailable'}`:route.type==='houseSetup'?'New House draft':'Select a House'} · <a href="#/my-houses">My Houses</a></p>}{storageWarning && <p className="storage-warning" role="status">{storageWarning}</p>}{['settings','profile','search','messages'].includes(route.type)?<NavigationPage/>:route.type==='wallet'?<WalletView mode={route.mode} houseId={route.houseId}/>:route.type==='appearance'?<Appearance/>:route.type==='serverHouse'||route.type==='serverVideo'?<ServerPage kind={route.type==='serverHouse'?'house':'video'} id={route.id}/>:route.type==='accountSettings'?<AccountSettings/>:route.type==='myHouses'?<MyHouses/>:route.type==='creator'?<Creator panel={route.panel}/>:route.type==='houseSetup'?<HouseSetup/>:route.type==='housePreview'?<HousePreviewPage/>:route.type==='contentEditor'?<ContentEditor kind={route.kind} id={route.id} preview={route.preview}/>:route.type === 'home' ? <Home /> : route.type === 'house' ? <House id={route.id}/> : route.type === 'video' ? <Video id={route.id}/> : route.type === 'article' ? <Article id={route.id}/> : route.type === 'series' ? <Series id={route.id}/> : route.type === 'board' ? new URLSearchParams(location.hash.split('?')[1]).get('view')==='public-preview'?<Board/>:<SubscriptionsBoard/> : route.type === 'post' ? <Board postId={route.id}/> : <main><h1>That fixture was not found.</h1><p>Check the item URL or return Home.</p><a className="button" href="#/home">Back to Home</a></main>}</div><CreatorStatus/></div>{notice && <div role="status" className="toast">{notice}</div>}{<ModalContent />}{recipientPicker && <Dialog title="Choose a House recipient" onClose={() => setRecipientPicker(false)}><p className="fixture-note">Local message drafts only. Delivery and an inbox are not connected.</p><div className="recipient-list">{houses.map(h => <button key={h.id} onClick={() => { setRecipientPicker(false); setModal({ type: 'messages', houseId: h.id }); }}><Image name={h.creator.portrait}/><span>{h.name}<small>{h.creator.name}</small></span></button>)}</div></Dialog>}{modal?.type === 'live' && <LiveDialog key={modal.houseId} houseId={modal.houseId} room={rooms[modal.houseId] || emptyRoom()} onUpdate={room => setRooms(prev => ({ ...prev, [modal.houseId]: room }))} onMinimize={() => { setMinimized(modal.houseId); setModal(null); }}/>}{minimized && !blocked && <div className="minimized-live"><button onClick={() => { setModal({ type: 'live', houseId: minimized }); setMinimized(null); }}><Image name={houseById(minimized)!.image}/><span>{houseById(minimized)!.name}<small>Resume local room preview</small></span><ChevronDown /></button><button className="icon-button" aria-label="Close minimized room" onClick={() => setMinimized(null)}><X /></button></div>}</>;
}
export default function App() { return <AppearanceProvider><ViewerSkinProvider><Provider><CreatorProvider><Shell /></CreatorProvider></Provider></ViewerSkinProvider></AppearanceProvider>; }
