import { series } from './discovery-model';
import { defaultDesign, discoveryDesign, discoverySectionIds, houses, works, posts, sectionIds, type HomeDesign, type Comment, initialComments } from './fixtures';
export type Route = {
    type: 'home' | 'board' | 'myHouses' | 'signIn' | 'accountSettings' | 'appearance' | 'settings' | 'profile' | 'search' | 'messages' | 'munkeeStudio';
} | {
    type: 'wallet'; mode: 'viewer' | 'house'; houseId?: string;
} | {
    type: 'house' | 'video' | 'article' | 'post' | 'series' | 'serverHouse' | 'serverVideo';
    id: string;
} | {
    type: 'creator'; panel: 'overview'|'library'|'uploads'|'design'|'community'|'settings';
} | { type:'houseSetup'|'housePreview';
} | {type:'contentEditor';kind:'video'|'article';id:string;preview:boolean;
} | {
    type: 'missing';
};
export function parseRoute(hash: string): Route {
    const path = hash.replace(/^#/, '').split('?')[0];
    if (!path || path === '/' || path === '/home')
        return { type: 'home' };
    if(path==='/munkee-studio'||path==='/studio')return {type:'munkeeStudio'};
    if(path==='/wallet'||path==='/wallet/viewer')return {type:'wallet',mode:'viewer'};
    if(path==='/wallet/house')return {type:'wallet',mode:'house',houseId:'off-grid'};
    const walletHouse=path.match(/^\/wallet\/house\/([a-z0-9-]+)$/);
    if(walletHouse)return {type:'wallet',mode:'house',houseId:walletHouse[1]};
    if(path==='/settings')return {type:'settings'};
    if(path==='/profile')return {type:'profile'};
    if(path==='/search')return {type:'search'};
    if(path==='/messages')return {type:'messages'};
    if (path === '/sign-in') return {type:'signIn'};
    if(path==='/appearance')return {type:'appearance'};
    if (path === '/account/settings') return {type:'accountSettings'};
    if (path === '/my-houses') return {type:'myHouses'};
    if (path === '/board')
        return { type: 'board' };
    if(path==='/create/house')return {type:'houseSetup'};
    if(path==='/creator/house-preview')return {type:'housePreview'};
    if(path==='/creator')return {type:'creator',panel:'overview'};
    const creator=path.match(/^\/creator\/(overview|library|uploads|design|community|settings)$/);
    if(creator)return {type:'creator',panel:creator[1] as 'overview'|'library'|'uploads'|'design'|'community'|'settings'};
    const editor=path.match(/^\/creator\/(videos|articles)\/([a-z0-9-]{1,80})(\/preview)?$/);
    if(editor)return {type:'contentEditor',kind:editor[1]==='videos'?'video':'article',id:editor[2],preview:!!editor[3]};
    const m = path.match(/^\/(houses|videos|articles|series|board\/posts)\/([a-z0-9-]+)$/);
    if (!m)
        return { type: 'missing' };
    const [, group, id] = m;
    if(group==='houses'&&new URLSearchParams(hash.split('?')[1]).get('source')==='server'&&/^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$/.test(id))return {type:'serverHouse',id};
    if (group === 'series' && series.some(s => s.id === id))
        return { type: 'series', id };
    if (group === 'houses' && houses.some(x => x.id === id))
        return { type: 'house', id };
    if (group === 'videos' && works.some(x => x.id === id && x.kind === 'FILM'))
        return { type: 'video', id };
    if(group==='houses'&&/^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$/.test(id))return {type:'serverHouse',id};
    if(group==='videos'&&/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(id))return {type:'serverVideo',id};
    if (group === 'articles' && works.some(x => x.id === id && x.kind === 'ESSAY'))
        return { type: 'article', id };
    if (group === 'board/posts' && posts.some(x => x.id === id))
        return { type: 'post', id };
    return { type: 'missing' };
}
const object = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
export function isDesign(v: unknown): v is HomeDesign {
    if (!object(v))
        return false;
    return (v.schemaVersion===undefined||v.schemaVersion===1) && (v.discoverySections === undefined || (Array.isArray(v.discoverySections) && v.discoverySections.length <= discoverySectionIds.length && new Set(v.discoverySections).size === v.discoverySections.length && v.discoverySections.every(x => discoverySectionIds.includes(x as typeof discoverySectionIds[number])))) && (v.layout === undefined || v.layout === 'classic' || v.layout === 'discovery') && typeof v.surface === 'string' && ['ivory', 'peach', 'sage', 'paper'].includes(v.surface) && typeof v.font === 'string' && ['classic', 'literary', 'modern'].includes(v.font) && typeof v.spacing === 'string' && ['relaxed', 'balanced', 'tight'].includes(v.spacing) && typeof v.density === 'string' && ['comfortable', 'compact'].includes(v.density) && [2, 3, 4].includes(v.columns as number) && Array.isArray(v.sections) && v.sections.length <= sectionIds.length && new Set(v.sections).size === v.sections.length && v.sections.every(x => sectionIds.includes(x as typeof sectionIds[number]));
}
export type Version = {
    id: string;
    label: string;
    design: HomeDesign;
};
export type State = {
    design: HomeDesign;
    versions: Version[];
    undo: HomeDesign[];
    following: string[];
    saved: string[];
    reposts: string[];
    likes: string[];
    comments: Comment[];
    messages: {
        id: string;
        houseId: string;
        text: string;
    }[];
};
export const initialState: State = { design: discoveryDesign, versions: [], undo: [], following: ['off-grid'], saved: [], reposts: [], likes: [], comments: initialComments, messages: [] };
const strings = (x: unknown): x is string[] => Array.isArray(x) && x.length <= 10000 && x.every(v => typeof v === 'string' && v.length < 300);
export function isState(v: unknown): v is State {
    if (!object(v) || !isDesign(v.design) || !Array.isArray(v.versions) || v.versions.length > 30 || !v.versions.every(x => object(x) && typeof x.id === 'string' && typeof x.label === 'string' && isDesign(x.design)) || !Array.isArray(v.undo) || v.undo.length > 30 || !v.undo.every(isDesign))
        return false;
    if (!strings(v.following) || !v.following.every(id => houses.some(h => h.id === id)) || !strings(v.saved) || !v.saved.every(id => works.some(w => w.id === id) || posts.some(p => p.id === id)) || !strings(v.reposts) || !v.reposts.every(id => posts.some(p => p.id === id)) || !strings(v.likes))
        return false;
    if (!Array.isArray(v.comments) || v.comments.length > 10000 || !v.comments.every(c => object(c) && typeof c.id === 'string' && typeof c.target === 'string' && (works.some(w => w.id === c.target) || posts.some(p => p.id === c.target)) && typeof c.author === 'string' && c.author.length < 100 && typeof c.text === 'string' && c.text.length <= 2000 && strings(c.likes) && (c.parent === undefined || typeof c.parent === 'string')))
        return false;
    const comments = v.comments as Comment[];
    if (new Set(comments.map(c => c.id)).size !== comments.length)
        return false;
    for (const c of comments) {
        const seen = new Set([c.id]);
        let parent = c.parent;
        while (parent) {
            const p = comments.find(x => x.id === parent && x.target === c.target);
            if (!p || seen.has(p.id))
                return false;
            seen.add(p.id);
            parent = p.parent;
        }
    }
    return Array.isArray(v.messages) && v.messages.length <= 1000 && v.messages.every(m => object(m) && typeof m.id === 'string' && typeof m.houseId === 'string' && houses.some(h => h.id === m.houseId) && typeof m.text === 'string' && m.text.length <= 2000);
}
export const STORAGE_KEY = 'munk-frontend-v2';
export function loadState(storage: Pick<Storage, 'getItem'>): {
    state: State;
    warning: string;
} {
    try {
        const raw = storage.getItem(STORAGE_KEY);
        if (!raw)
            return { state: initialState, warning: '' };
        const value: unknown = JSON.parse(raw);
        if (isState(value))
            return { state: value, warning: '' };
        return { state: initialState, warning: 'Saved preview data was invalid. Safe defaults are loaded.' };
    }
    catch {
        return { state: initialState, warning: 'Browser storage is unavailable or invalid. Changes may last only for this tab.' };
    }
}
export function persistState(storage: Pick<Storage, 'setItem'>, state: State): string {
    if (!isState(state))
        return 'Invalid local data was not stored. Safe defaults will be used after reload.';
    try {
        storage.setItem(STORAGE_KEY, JSON.stringify(state));
        return '';
    }
    catch {
        return 'Changes are in memory only: browser storage is unavailable or full.';
    }
}
export function toggleId(list: string[], id: string) { return list.includes(id) ? list.filter(x => x !== id) : [...list, id]; }
export function likeCount(base: string[], id: string, local: string[]) { return new Set([...base, ...(local.includes(id) ? ['viewer-preview'] : [])]).size; }
export function sortPosts(ids: string[], mode: string, likes: string[]) { return ids.map(id => posts.find(p => p.id === id)!).filter(Boolean).sort((a, b) => mode === 'Most liked' ? likeCount(b.likes, b.id, likes) - likeCount(a.likes, a.id, likes) || b.createdAt - a.createdAt : b.createdAt - a.createdAt); }
export function children(comments: Comment[], target: string, parent?: string) { return comments.filter(c => c.target === target && c.parent === parent); }
/** Apply an explicit user save; a layout switch also retains the prior custom layout. */
export function commitDesign(state: State, design: HomeDesign, makeId: () => string = () => crypto.randomUUID(), label = new Date().toLocaleString()): State {
    if (!isDesign(design))
        throw new Error('Invalid Home design');
    const switched = (state.design.layout || 'classic') !== (design.layout || 'classic');
    const versions = [...state.versions, ...(switched ? [{ id: makeId(), label: 'Before layout switch', design: state.design }] : []), { id: makeId(), label, design }].slice(-30);
    return { ...state, design: {...design,schemaVersion:1}, versions, undo: [...state.undo, state.design].slice(-30) };
}
