import{useViewerSkin}from'./interface-service';import{openUtility}from'./navigation-flow';import{preserveAppearance}from'./appearance-preference';
import {routeChanged} from './navigation-flow';
import {preserveGuestSkin} from './guest-skin';
import { createContext, useContext, useState, useEffect, type ReactNode, type Dispatch, type SetStateAction } from 'react';
import { loadState, persistState, initialState, parseRoute, type State, type Route } from './model';
import { useAuth } from './auth-context';
export type Modal = {
    type: 'edit' | 'explore' | 'watchlist' | 'options';
} | {
    type: 'intro' | 'messages' | 'terms' | 'live';
    houseId: string;
} | {
    type: 'rights';
    workId: string;
} | null;
type Value = {
    state: State;
    setState: Dispatch<SetStateAction<State>>;
    route: Route;
    modal: Modal;
    setModal: Dispatch<SetStateAction<Modal>>;
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    notice: string;
    setNotice: (s: string) => void;
    storageWarning: string;
    account: boolean;
    requireAccount: (action: () => void, destination?: string) => void;
    openSignIn: (destination?: string) => void;
    leaveSignIn: (destination?: string) => void;
    go: (path: string) => void;
};
const Context = createContext<Value | null>(null);
export function Provider({ children }: {
    children: ReactNode;
}) {
    const auth = useAuth();const skin=useViewerSkin();
    const storageKey=auth.session?`munk-viewer-v3:${auth.session.account.id}`:'munk-viewer-guest-v3';
    const readViewer=()=>{try{const saved=loadState({getItem:()=>window.localStorage.getItem(storageKey)});if(window.localStorage.getItem(storageKey))return saved;const legacy=loadState(window.localStorage);return {state:{...initialState,design:legacy.state.design,versions:legacy.state.versions,undo:legacy.state.undo},warning:legacy.warning};}catch{return {state:initialState,warning:'Browser storage unavailable.'};}};
    const [loadedKey,setLoadedKey]=useState(storageKey);
    const [loaded] = useState(() => typeof window === 'undefined' ? { state: initialState, warning: '' } : readViewer());
    const [state, setState] = useState<State>(loaded.state);
    const [storageWarning, setStorageWarning] = useState(loaded.warning);
    const [route, setRoute] = useState(() => parseRoute(typeof location === 'undefined' ? '#/home' : location.hash));
    const [modal, setModal] = useState<Modal>(null);
    const [notice, setNotice] = useState('');
    const [searchQuery,setQuery]=useState(()=>typeof location==='undefined'?'':new URLSearchParams(location.hash.split('?')[1]).get('q')||'');
    const setSearchQuery=(value:string)=>{const query=value.slice(0,200);setQuery(query);
      if(typeof location!=='undefined'&&parseRoute(location.hash).type==='home'){
        const params=new URLSearchParams(location.hash.split('?')[1]);if(!params.has('tab')){if(query)params.set('q',query);else params.delete('q');const suffix=params.toString();window.history?.replaceState(null,'',`#/home${suffix?'?'+suffix:''}`);}
      }
    };
    const account = !!auth.session;
    useEffect(()=>{if(loadedKey!==storageKey){const restored=readViewer();setState(restored.state);setStorageWarning(restored.warning);setLoadedKey(storageKey);}},[storageKey,loadedKey]);
    useEffect(() => {
        if(loadedKey!==storageKey)return;try {
            const warning = persistState({setItem:(_key,value)=>window.localStorage.setItem(storageKey,value)}, state);
            setStorageWarning(warning || loaded.warning);
        }
        catch {
            setStorageWarning('Browser storage unavailable. Changes last only for this tab.');
        }
    }, [state, loaded.warning,storageKey,loadedKey]);
    const intentKey='munk-auth-return-v2';
    const readIntent=()=>{try{const value=JSON.parse(sessionStorage.getItem(intentKey)||'null');if(value&&typeof value.destination==='string'&&typeof value.origin==='string'&&/^#\//.test(value.destination)&&/^#\//.test(value.origin)&&!['signIn','missing'].includes(parseRoute(value.destination).type))return value as {destination:string;origin:string};}catch{}return null;};
    const openSignIn=(destination='#/home')=>{
      preserveGuestSkin();preserveAppearance();
      if(location.hash!=='#/sign-in'){try{sessionStorage.setItem(intentKey,JSON.stringify({destination,origin:location.hash||'#/home'}));}catch{setNotice('Keep this tab open; browser storage could not save your return destination.');}}
      setModal(null);location.hash='/sign-in';
    };
    const leaveSignIn=(destination?:string)=>{const origin=destination||readIntent()?.origin||'#/home';try{sessionStorage.removeItem(intentKey);}catch{}location.hash=origin;};
    useEffect(()=>{const onHash=()=>{if(!routeChanged(location.hash||'#/home'))return;setRoute(parseRoute(location.hash));setModal(null);const params=new URLSearchParams(location.hash.split('?')[1]);if(params.has('q'))setSearchQuery(params.get('q')!.slice(0,200));if(parseRoute(location.hash).type!=='signIn'){try{sessionStorage.removeItem(intentKey);}catch{}}window.scrollTo(0,0);};addEventListener('hashchange',onHash);return()=>removeEventListener('hashchange',onHash);},[]);
    useEffect(() => {
        if (!notice)
            return;
        const id = setTimeout(() => setNotice(''), 4000);
        return () => clearTimeout(id);
    }, [notice]);
    const requireAccount = (action: () => void, destination?: string) => {
      if(account)action();else openSignIn(destination||location.hash||'#/home');
    };
    useEffect(()=>{if(!account||skin.loading)return;const intent=readIntent();
      if(intent||route.type==='signIn'){
        try{sessionStorage.removeItem(intentKey);}catch{}
        if(!skin.hasSelection)openUtility('#/appearance?tab=browse','#/home');else location.hash=intent?.destination||'#/home';
        setNotice('Signed in. Review your draft and choose your next action when ready.');
      }
    },[account,route.type,skin.loading,skin.hasSelection]);
    const go = (path: string) => { setModal(null); location.hash = path; };
    return <Context.Provider value={{ state:loadedKey===storageKey?state:{...initialState,design:state.design}, setState, route, modal, setModal, searchQuery,setSearchQuery,notice, setNotice, storageWarning, account, requireAccount, openSignIn, leaveSignIn, go }}>{children}</Context.Provider>;
}
export function useApp() {
    const v = useContext(Context);
    if (!v)
        throw new Error('Missing application provider');
    return v;
}
