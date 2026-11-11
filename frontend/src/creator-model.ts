import { houses, type Theme } from './fixtures';
export const CREATOR_KEY = 'munk-creator-preview-v1';
export const houseSectionIds = ['featured', 'library', 'about', 'community'] as const;
export type HouseSection = typeof houseSectionIds[number];
export type HouseDesign = Theme & {
    schemaVersion: 1;
    sections: HouseSection[];
};
export const houseTemplates: {
    name: string;
    design: HouseDesign;
}[] = [
    { name: 'Editorial ivory', design: { schemaVersion: 1, surface: 'ivory', font: 'classic', spacing: 'balanced', density: 'comfortable', columns: 3, sections: ['featured', 'library', 'about', 'community'] } },
    { name: 'Peach studio', design: { schemaVersion: 1, surface: 'peach', font: 'modern', spacing: 'relaxed', density: 'comfortable', columns: 2, sections: ['about', 'featured', 'library', 'community'] } },
    { name: 'Quiet paper', design: { schemaVersion: 1, surface: 'paper', font: 'literary', spacing: 'tight', density: 'compact', columns: 4, sections: ['featured', 'about', 'library'] } }
];
export type FileInfo = {
    name: string;
    size: number;
    type: string;
    lastModified: number;
};
export type AdmissionStatus = 'draft' | 'unavailable';
export type HouseDraft = {
    name: string;
    address: string;
    description: string;
    focus: 'Films' | 'Writing' | 'Both';
    publicName: string;
    intro?: FileInfo;
    introDuration?: number;
    faceVisible: boolean;
    publicConsent: boolean;
    identityStatus: 'not-verified';
    introReview: 'not-reviewed';
    admission: AdmissionStatus;
    design: HouseDesign;
    versions: {
        id: string;
        label: string;
        design: HouseDesign;
    }[];
    undo: HouseDesign[];
};
export type PublicationStatus = 'draft' | 'published' | 'unpublished';
export type UploadState = 'not-started' | 'selected' | 'uploading' | 'processing' | 'ready' | 'failed' | 'cancelled';
export type ContentDraft = {
    id: string;
    kind: 'video' | 'article';
    title: string;
    description: string;
    body: string;
    file?: FileInfo;
    cover?: FileInfo;
    captions?: FileInfo;
    series: string;
    episode: number;
    uploadState: UploadState;
    publication: PublicationStatus;
    error: string;
    updatedAt: number;
    serverVideoId?:string;
    serverUploadId?: string;
    serverAssetId?: string;
};
export type CreatorState = {
    schemaVersion: 1;
    house: HouseDraft;
    content: ContentDraft[];
};
export const emptyCreator: CreatorState = { schemaVersion: 1, house: { name: '', address: '', description: '', focus: 'Both', publicName: '', faceVisible: false, publicConsent: false, identityStatus: 'not-verified', introReview: 'not-reviewed', admission: 'draft', design: houseTemplates[0].design, versions: [], undo: [] }, content: [] };
const obj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
const str = (v: unknown, max: number) => typeof v === 'string' && v.length <= max;
export function isHouseDesign(v: unknown): v is HouseDesign { return obj(v) && v.schemaVersion === 1 && ['ivory', 'peach', 'sage', 'paper'].includes(v.surface as string) && ['classic', 'literary', 'modern'].includes(v.font as string) && ['balanced', 'relaxed', 'tight'].includes(v.spacing as string) && ['comfortable', 'compact'].includes(v.density as string) && [2, 3, 4].includes(v.columns as number) && Array.isArray(v.sections) && v.sections.length <= 4 && new Set(v.sections).size === v.sections.length && v.sections.every(s => houseSectionIds.includes(s as HouseSection)); }
export function isFileInfo(v: unknown): v is FileInfo { return obj(v) && str(v.name, 255) && str(v.type, 100) && typeof v.size === 'number' && Number.isFinite(v.size) && v.size > 0 && typeof v.lastModified === 'number' && Number.isFinite(v.lastModified); }
export function isCreatorState(v: unknown): v is CreatorState {
    if (!obj(v) || v.schemaVersion !== 1 || !obj(v.house) || !Array.isArray(v.content) || v.content.length > 100)
        return false;
    const h = v.house;
    if (!str(h.name, 80) || !str(h.address, 60) || !str(h.description, 2000) || !str(h.publicName, 80) || !['Films', 'Writing', 'Both'].includes(h.focus as string) || typeof h.faceVisible !== 'boolean' || typeof h.publicConsent !== 'boolean' || h.identityStatus !== 'not-verified' || h.introReview !== 'not-reviewed' || !['draft', 'unavailable'].includes(h.admission as string) || !isHouseDesign(h.design) || (h.intro !== undefined && !isFileInfo(h.intro)) || (h.introDuration !== undefined && (typeof h.introDuration !== 'number' || !Number.isFinite(h.introDuration) || h.introDuration <= 0)))
        return false;
    if (!Array.isArray(h.versions) || h.versions.length > 30 || !h.versions.every(x => obj(x) && str(x.id, 100) && str(x.label, 100) && isHouseDesign(x.design)) || !Array.isArray(h.undo) || h.undo.length > 30 || !h.undo.every(isHouseDesign))
        return false;
    return new Set(v.content.map(x => obj(x) ? x.id : null)).size === v.content.length && v.content.every(x => obj(x) && typeof x.id === 'string' && /^[a-z0-9-]{1,80}$/.test(x.id) && ['video', 'article'].includes(x.kind as string) && str(x.title, 160) && str(x.description, 4000) && str(x.body, 100000) && str(x.series, 80) && typeof x.episode === 'number' && Number.isInteger(x.episode) && x.episode >= 1 && x.episode <= 999 && ['not-started', 'selected', 'uploading', 'processing', 'ready', 'failed', 'cancelled'].includes(x.uploadState as string) && ['draft', 'published', 'unpublished'].includes(x.publication as string) && str(x.error, 1000) && typeof x.updatedAt === 'number' && Number.isFinite(x.updatedAt) && [x.serverVideoId,x.serverUploadId,x.serverAssetId].every(id=>id===undefined||(typeof id==='string'&&/^[0-9a-f-]{36}$/i.test(id))) && [x.file, x.cover, x.captions].every(f => f === undefined || isFileInfo(f)));
}
export function loadCreator(storage: Pick<Storage, 'getItem'>): {
    state: CreatorState;
    warning: string;
} {
    try {
        const raw = storage.getItem(CREATOR_KEY);
        if (!raw)
            return { state: structuredClone(emptyCreator), warning: '' };
        const parsed: unknown = JSON.parse(raw);
        if (isCreatorState(parsed))
            return { state: { ...parsed, content: parsed.content.map(c => !c.serverUploadId && (c.uploadState === 'uploading' || c.uploadState === 'processing') ? { ...c, uploadState: 'failed', error: 'Connection interrupted. Re-select your local file; server resume is unavailable.' } : c) }, warning: '' };
        return { state: structuredClone(emptyCreator), warning: 'Saved creator data is invalid. Defaults loaded; the original stored data is retained until you save.' };
    }
    catch {
        return { state: structuredClone(emptyCreator), warning: 'Creator storage unavailable. Drafts will last only in this tab.' };
    }
}
export function saveCreator(storage: Pick<Storage, 'setItem'>, state: CreatorState): string { if (!isCreatorState(state))
    return 'Invalid creator data was not saved.'; try {
    storage.setItem(CREATOR_KEY, JSON.stringify(state));
    return '';
}
catch {
    return 'Creator draft could not be saved to browser storage. Keep this tab open; changes remain in memory only.';
} }
export const fileInfo = (f: File): FileInfo => ({ name: f.name, size: f.size, type: f.type, lastModified: f.lastModified });
export function validateFile(f: FileInfo, kind: 'video' | 'intro' | 'image' | 'captions'): string {
    const max = kind === 'video' ? 2 * 1024 ** 3 : kind === 'intro' ? 512 * 1024 ** 2 : kind === 'image' ? 10 * 1024 ** 2 : 1024 ** 2;
    const accepted = kind === 'image' ? ['image/jpeg', 'image/png', 'image/webp'] : kind === 'captions' ? ['text/vtt', ''] : ['video/mp4', 'video/webm', 'video/quicktime'];
    if (f.size <= 0 || f.size > max)
        return `Choose a non-empty file under ${kind === 'video' ? '2 GB' : kind === 'intro' ? '512 MB' : kind === 'image' ? '10 MB' : '1 MB'}.`;
    if (!accepted.includes(f.type) || (kind === 'captions' && !/\.vtt$/i.test(f.name)))
        return `Unsupported ${kind} file. ${kind === 'image' ? 'Use JPEG, PNG or WebP.' : kind === 'captions' ? 'Use a WebVTT (.vtt) file.' : 'Use MP4, WebM or QuickTime.'}`;
    return '';
}
export function addressError(address: string): string { if (!/^[a-z0-9](?:[a-z0-9-]{1,38}[a-z0-9])$/.test(address))
    return 'Use 3–40 lowercase letters, numbers or hyphens; start and end with a letter or number. Example: mountain-studio.'; if (houses.some(h => h.id === address) || ['home', 'board', 'creator', 'create', 'admin', 'api'].includes(address))
    return 'This address is already used. Choose another proposed address.'; return ''; }
/** Saving incomplete metadata is allowed. Introduction/consent belong to admission. */
export function houseDraftErrors(h:HouseDraft):Record<string,string> {
    const errors:Record<string,string>={};const address=addressError(h.address);if(address)errors.address=address;
    for(const [field,max] of [['name',120],['description',4000],['publicName',80],['focus',120]] as const)
        if([...h[field]].length>max)errors[field]=`Use at most ${max} characters.`;
    return errors;
}
export function admissionRequirements(h: HouseDraft, hasIntro: boolean): string[] {
    return [!h.name.trim() && 'Add your House name.', addressError(h.address), !h.description.trim() && 'Describe your House.', !h.publicName.trim() && 'Add your public creator name.', (!h.intro || !hasIntro) && 'Select the introduction video again in this tab.', (!h.introDuration || h.introDuration < 120 || h.introDuration > 240) && 'Use an introduction approximately three minutes long (2–4 minutes); wait for its duration to load.', !h.faceVisible && 'Confirm your face is visible in the introduction (self-declaration, not verification).', !h.publicConsent && 'Acknowledge which creator information will be public.'].filter((x): x is string => typeof x === 'string' && !!x);
}
export function contentRequirements(c: ContentDraft, hasVideo: boolean): string[] { return [!c.title.trim() && 'Add a title.', !c.description.trim() && 'Add a description.', c.kind === 'article' && !c.body.trim() && 'Write your article.', c.kind === 'video' && !hasVideo && 'Select a local video for preview.'].filter((s): s is string => typeof s === 'string' && !!s); }
export function newContent(kind: ContentDraft['kind'], id: string = crypto.randomUUID()): ContentDraft { return { id, kind, title: '', description: '', body: '', series: '', episode: 1, uploadState: 'not-started', publication: 'draft', error: '', updatedAt: Date.now() }; }
export function commitHouseDesign(h: HouseDraft, design: HouseDesign, id: string = crypto.randomUUID()): HouseDraft { if (!isHouseDesign(design))
    throw Error('Invalid House design'); return { ...h, design, versions: [...h.versions, { id, label: new Date().toLocaleString(), design }].slice(-30), undo: [...h.undo, h.design].slice(-30) }; }
// Plain text only. React escapes every character; markup is never interpreted.
export function articleParagraphs(body: string): string[] { return body.replace(/\r\n?/g, '\n').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '').split(/\n\s*\n/).filter(p => p.trim()); }

/** Wizard saves also preserve House design history; metadata edits do not create design versions. */
export function prepareHouseSave(current:HouseDraft,draft:HouseDraft):HouseDraft {
 const withHistory={...draft,versions:current.versions,undo:current.undo};
 return JSON.stringify(current.design)===JSON.stringify(draft.design)?withHistory:commitHouseDesign({...withHistory,design:current.design},draft.design);
}
