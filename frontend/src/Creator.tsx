import {AppearanceChoices} from './Appearance';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useApp } from './state';
import { useCreator } from './creator-state';
import { Button, themeClass } from './components';
import { RegisteredSections, designStyle, type SectionRegistry } from './design-system';
import { prepareHouseSave, isCreatorState, houseTemplates, addressError, houseDraftErrors, admissionRequirements, contentRequirements, validateFile, fileInfo, newContent, articleParagraphs, type HouseDraft, type HouseDesign, type HouseSection, type ContentDraft, type CreatorState } from './creator-model';
import { creatorServices } from './creator-services';
import { useAuth } from './auth-context';
import { apiClient } from './api';
import RemoteUploadQueue from './RemoteUploadQueue';
import ReviewerPanel from './ReviewerPanel';
import DemoHouseSetup from './DemoHouseSetup';
import VideoEditor from './VideoEditor';
import ServerVideoLibrary from './ServerVideoLibrary';
const panels = ['overview', 'library', 'uploads', 'design', 'community', 'settings'] as const;
export type CreatorPanel = typeof panels[number];
export function CreatorGate({children,allowNew=false}:{children:ReactNode;allowNew?:boolean}){
 const {account,requireAccount}=useApp();const {serverLoading,serverError,serverMessage,serverHouse,selection,reloadServer}=useCreator();
 if(!account)return <main className="creator-page"><h1>Your creator workspace</h1><p>Sign in with your MUNK account to continue. This does not create a House.</p><Button onClick={()=>requireAccount(()=>{})}>Sign in to continue</Button></main>;
 if(serverLoading)return <main className="creator-page"><h1>Your creator workspace</h1><p role="status">Loading server permissions…</p></main>;
 if(serverError)return <main className="creator-page"><h1>{serverError==='permission'?'House access denied':'Could not load creator workspace'}</h1><p role="alert">{serverMessage}</p><Button onClick={()=>void reloadServer()}>Retry</Button><a className="button outline" href="#/my-houses">My Houses</a></main>;
 if((!allowNew&&!serverHouse)||(allowNew&&selection&&serverHouse?.membershipRole!=='owner'))return <main className="creator-page"><h1>{serverHouse?'Owner permission required':'Select a House'}</h1><p>Choose an authorized House from My Houses, or intentionally create a new House.</p><a className="button" href="#/my-houses">My Houses</a><a className="button outline" href="#/create/house">Create a House</a></main>;
 return <>{children}</>;
}
export function CreatorStatus() { const { creator,serverUploads,houseHref } = useCreator(); const { account } = useApp(); return account && (creator.content.some(c => c.kind === 'video')||serverUploads.length>0) ? <a className="creator-status" href={houseHref('#/creator/uploads')}>Video queue · {serverUploads.length} server uploads</a> : null; }

export default function Creator({ panel = 'overview' }: {
    panel?: CreatorPanel;
}) {
    const { creator,houseHref,serverHouse,productMode } = useCreator();
    return <CreatorGate><main className="creator-page" data-creator-panel={panel}><header className="creator-heading"><div><small>CREATOR WORKSPACE</small><h1>{creator.house.name || 'Your next House'}</h1><p>Upload, edit details, then publish a video. House interfaces and video metadata save to the server. Article drafts stay in this browser.</p></div><div className="button-row"><a className="button" href={houseHref('#/creator/videos/new')}>Upload video</a><a className="button outline" href={houseHref('#/creator/uploads')}>Uploads &amp; processing</a>{serverHouse?.membershipRole==='owner'&&<a className="text-button" href={houseHref('#/create/house')}>Edit House details</a>}</div></header><nav className="creator-tabs" aria-label="Creator workspace">{panels.map(p => <a key={p} href={houseHref(`#/creator/${p}`)} aria-current={panel === p ? 'page' : undefined}>{p === 'design' ? 'Appearance' : p[0].toUpperCase() + p.slice(1)}</a>)}</nav><CreatorStorage />{panel === 'overview' ? <><div className="creator-stats"><div><strong>{creator.content.length}</strong><span>Local content drafts</span></div><div><strong>See status below</strong><span>{productMode==='demo'?'Demo readiness':'House admission'}</span></div><div><strong>Available</strong><span>Video publishing</span></div></div><section className="creator-card"><h2>Make something worth sharing.</h2><p>Upload a video while you enter its details, or write an article. Publish when processing is complete. Your viewer link works without signing in.</p><CreateLinks /></section><AdmissionSummary house={creator.house}/></> : panel === 'library' ? <Library /> : panel === 'uploads' ? <UploadQueue /> : panel === 'design' ? <HouseDesigner /> : panel === 'settings' ? <>{productMode==='strict'&&<ReviewerPanel/>}<AdmissionSummary house={creator.house}/><p>Founder: {creator.house.publicName || 'Not provided'}. Accountable operator: the same creator for this limited preview. Future ownership interests are separate from these responsibilities and are not implemented.</p>{serverHouse?.membershipRole==='owner'&&<a className="button" href={houseHref('#/create/house')}>Edit House details</a>}<p>Do not enter wallet balances, private keys or sensitive identity documents. No identity collection is available.</p></> : <section className="creator-card"><h2>Community</h2><p>Your draft House has no public community yet. The existing Board uses fixture posts and local comments. Rooms are local notebooks; message drafts are never delivered.</p><a className="button" href="#/board">Browse the Board</a><p>{productMode==='demo'?'House ready for demo use is separate from public publication. Shared public community is not connected.':'House-specific community links become available only after a server admits and publishes your House.'}</p></section>}</main></CreatorGate>;
}
function CreatorStorage() { const { warning,serverMessage,reloadServer,serverHouse } = useCreator(); return <><p className="creator-disclosure" role="status">{serverMessage}</p>{warning&&<p className="storage-warning" role="alert">{warning}</p>}<p className="creator-disclosure">House details, videos and video metadata save on the server. House interfaces save on the server; article drafts remain in this browser.</p><Button kind="outline" onClick={()=>void reloadServer()}>Reload saved House and upload status</Button>{serverHouse&&<small>Saved House: {serverHouse.address} · version {serverHouse.version}</small>}</>; }
function CreateLinks() { const {houseHref}=useCreator();return <div className="button-row"><a className="button outline" href={houseHref('#/creator/articles/new')}>Create → Article</a></div>; }
function AdmissionSummary({ house }: {
    house: HouseDraft;
}) { const {serverHouse,productMode,houseHref}=useCreator();if(productMode===null)return <p role="status">Loading server mode…</p>;if(productMode==='demo')return <section className="creator-card"><h2>{serverHouse?.demoReady?'House ready for demo use':'Complete later'}</h2><p>Publish individual videos when you are ready. Demo readiness does not claim identity verification or network admission.</p><p>Introduction, description and customization · Complete later. No reviewer or approval is needed.</p>{!serverHouse?.demoReady&&<a className="button outline" href={houseHref('#/create/house')}>Continue as demo House</a>}</section>;return <section className="creator-card admission-summary"><h2>Manual creator review</h2><dl><dt>Saved House admission</dt><dd>{serverHouse?.admissionStatus.replaceAll('_',' ')||'Draft · not yet saved on server'}</dd><dt>Review revision</dt><dd>{serverHouse?.admissionRevision||'Not submitted'}</dd></dl><p>Manual creator review is not verified legal identity or KYC. Selecting or uploading a video never grants admission.</p></section>; }
function Field({ label, children }: {
    label: string;
    children: ReactNode;
}) { return <label className="creator-field"><span>{label}</span>{children}</label>; }
export function HouseSetup() { const {selection,productMode,modeError,reloadMode}=useCreator();return <CreatorGate allowNew>{productMode===null?<main className="creator-page"><p role={modeError?'alert':'status'}>{modeError||'Loading House setup mode…'}</p>{modeError&&<Button onClick={()=>void reloadMode()}>Retry server mode</Button>}</main>:productMode==='demo'?<DemoHouseSetup key={selection||'new'}/>:<HouseSetupForm key={selection||'new'} />}</CreatorGate>; }
function HouseSetupForm() {
    const { creator, houseHref, save, asset, putAsset,saveHouse,submitHouse,serverHouse,selection } = useCreator();
    const {session}=useAuth();
    const editKey=`munk-house-edit-v1:${session?.account.id}:${selection||'new'}`;
    const [draft, setDraft] = useState<HouseDraft>(()=>{try{const raw=sessionStorage.getItem(editKey);if(raw){const pending=JSON.parse(raw);if(isCreatorState({...creator,house:pending}))return pending;}}catch{}return creator.house;}), [step, setStep] = useState(0), [message, setMessage] = useState(''), [busy, setBusy] = useState(false);
    const controller = useRef<AbortController>();
    const intro = asset('house-intro');
    const [fieldErrors,setFieldErrors]=useState<Record<string,string>>({});
    const draftErrors=houseDraftErrors(draft);
    const fieldError=(field:string)=>fieldErrors[field]||(field==='address'&&draft.address?draftErrors.address:'');
    const showErrors=(errors:Record<string,string>)=>{setFieldErrors(errors);const field=['address','name','description','focus','publicName'].find(f=>errors[f]);if(field){setStep(field==='publicName'?1:0);requestAnimationFrame(()=>document.getElementById('house-'+field)?.focus());}};
    useEffect(() => () => controller.current?.abort(), []);
    useEffect(() => { const heading = document.querySelector<HTMLElement>('[data-creator-view=house-setup] form h2'); if (heading) {
        heading.tabIndex = -1;
        heading.focus({ preventScroll: true });
    } }, [step]);
    useEffect(()=>{save({...creator,house:draft});try{sessionStorage.setItem(editKey,JSON.stringify(draft));}catch{}},[draft,editKey]);
    const update = (value: Partial<HouseDraft>) => {setFieldErrors(errors=>Object.fromEntries(Object.entries(errors).filter(([key])=>!(key in value))));setDraft(h => ({ ...h, ...value, admission: 'draft' }));};
    const requirements = admissionRequirements(draft, !!intro);
    const saveDraft = async () => {
        if(Object.keys(draftErrors).length){showErrors(draftErrors);setMessage('Fix the highlighted draft fields before saving. Your entered draft is retained.');return;}
        if(!window.confirm(serverHouse?'Save changes to this House?':'Create this House and reserve its address?'))return;
        setBusy(true);setFieldErrors({});save({...creator,house:prepareHouseSave(creator.house,draft)});
        try{await saveHouse(draft);try{sessionStorage.removeItem(editKey);}catch{}setMessage('House draft saved on the server. Add the introduction when ready to submit for review.');}
        catch(error){const details=(error as {fieldErrors?:Record<string,string>}).fieldErrors;if(details)showErrors(details);setMessage(error instanceof Error?error.message:'Server save failed. Local edits are retained.');}
        finally{setBusy(false);}
    };
    const selectIntro = (file?: File) => { if (!file)
        return; const error = validateFile(fileInfo(file), 'intro'); if (error) {
        setMessage(error);
        return;
    } putAsset('house-intro', file); update({ intro: fileInfo(file), introDuration: undefined, faceVisible: false }); setMessage('Selected locally. Wait for the duration; no upload or review has occurred.'); };
    const submit = async () => { if(busy)return;if(['pending_review','admitted'].includes(serverHouse?.admissionStatus||'')){setMessage('This House is already submitted or admitted.');return;} if(!serverHouse){setMessage('Save your House draft first, then review and confirm the admission submission.');return;} if (requirements.length) {
        setMessage('Complete the missing requirements below.');
        return;
    } if (!intro)
        return; if(!window.confirm('Upload this introduction and submit this House for Manual creator review?'))return; controller.current = new AbortController(); setBusy(true); try {
        await submitHouse(draft,intro.file,controller.current.signal);try{sessionStorage.removeItem(editKey);}catch{}
        if (!controller.current.signal.aborted)setMessage('Submitted for Manual creator review. The House is pending review, not admitted.');
    }
    catch (error) {
        setMessage(error instanceof Error?error.message:'Submission failed. Check your saved House and upload queue.');
    }
    finally {
        setBusy(false);
    } };
    const admissionBlockers=[...(!serverHouse?['Save your House draft first. No introduction is required to save a draft.']:[]),...(['pending_review','admitted'].includes(serverHouse?.admissionStatus||'')?['This House is already submitted or admitted.']:[]),...requirements];
    const steps = ['House details', 'Creator introduction', 'House design', 'Preview & admission'];
    return <main className="creator-page" data-creator-view="house-setup"><a href={houseHref('#/creator/overview')}>← Creator workspace</a><h1>{serverHouse?'Edit House details':'Create a House'}</h1><p>Save an incomplete House draft without an introduction. Add the introduction and consent before submitting for Manual creator review. Public discovery and publication are not connected yet.</p><CreatorStorage /><ol className="creator-steps">{steps.map((s, i) => <li key={s}><button aria-current={step === i ? 'step' : undefined} onClick={() => setStep(i)}>{i + 1}. {s}</button></li>)}</ol><form onSubmit={e => { e.preventDefault(); step < 3 ? setStep(step + 1) : void submit(); }}><section className="creator-card">{step === 0 ? <><h2>House details</h2><Field label="House name"><input id="house-name" aria-invalid={!!fieldError('name')} aria-describedby="house-name-error" required maxLength={80} value={draft.name} onChange={e => update({ name: e.target.value })}/><span id="house-name-error" role="alert">{fieldError('name')}</span></Field><Field label="Proposed unique address"><input id="house-address" disabled={!!serverHouse} aria-invalid={!!fieldError('address')} required aria-describedby="address-help house-address-error" maxLength={40} value={draft.address} onChange={e => update({ address: e.target.value })}/><span id="house-address-error" role="alert">{fieldError('address')}</span></Field><p id="address-help">Use 3–40 lowercase letters, numbers or hyphens; start and end with a letter or number. Example: mountain-studio. The server checks availability when you save; saved addresses cannot change.</p><Field label="Description"><textarea id="house-description" aria-invalid={!!fieldError('description')} aria-describedby="house-description-error" required maxLength={2000} value={draft.description} onChange={e => update({ description: e.target.value })}/><span id="house-description-error" role="alert">{fieldError('description')}</span></Field><Field label="Content focus"><select id="house-focus" aria-invalid={!!fieldError('focus')} aria-describedby="house-focus-error" value={draft.focus} onChange={e => update({ focus: e.target.value as HouseDraft['focus'] })}><option>Films</option><option>Writing</option><option>Both</option></select><span id="house-focus-error" role="alert">{fieldError('focus')}</span></Field></> : step === 1 ? <><h2>Meet the creator</h2><Field label="Creator’s public name"><input id="house-publicName" aria-invalid={!!fieldError('publicName')} aria-describedby="house-publicName-error" required maxLength={80} value={draft.publicName} onChange={e => update({ publicName: e.target.value })}/><span id="house-publicName-error" role="alert">{fieldError('publicName')}</span></Field><p>Your public name, House name/address/description/focus and introduction would be visible to viewers after admission. The introduction will be uploaded privately for review when you submit. Wallet details are never part of your public profile.</p><Field label="Face-visible introduction video · approximately three minutes"><input type="file" accept="video/mp4,video/webm,video/quicktime" onChange={e => selectIntro(e.target.files?.[0])}/></Field><p>MP4, WebM or QuickTime, up to 512 MB; 2–4 minutes. No identity documents.</p>{intro ? <video className="creator-media" controls preload="metadata" src={intro.url} onLoadedMetadata={e => { const duration = e.currentTarget.duration; if (Number.isFinite(duration))
        update({ introDuration: duration }); }} onError={() => { update({ introDuration: undefined }); setMessage('This browser cannot read the introduction. Choose a playable video.'); }}/> : draft.intro ? <p role="status">Previously selected: {draft.intro.name}. Re-select it; file bytes are not stored.</p> : null}<label className="creator-check"><input type="checkbox" checked={draft.faceVisible} onChange={e => update({ faceVisible: e.target.checked })}/>My face is visible in this introduction. This is a self-declaration, not identity verification.</label><label className="creator-check"><input type="checkbox" checked={draft.publicConsent} onChange={e => update({ publicConsent: e.target.checked })}/>I understand which creator information would be public.</label><AdmissionSummary house={draft}/></> : step === 2 ? <><h2>Choose a starting design</h2><p>Your introduction stays above custom content in every template. You can refine supported sections in House Design.</p><div className="button-row">{houseTemplates.map(t => <button key={t.name} type="button" className="button outline" aria-pressed={JSON.stringify(draft.design) === JSON.stringify(t.design)} onClick={() => update({ design: t.design })}>{t.name}</button>)}</div><LocalHousePreview house={draft} design={draft.design}/></> : <><h2>Preview & admission</h2><LocalHousePreview house={draft} design={draft.design}/><AdmissionSummary house={draft}/><h3>Admission requirements — separate from saving a draft</h3>{requirements.length ? <ul className="requirements" aria-live="polite">{requirements.map(r => <li key={r}>{r}</li>)}</ul> : <p>Form requirements are complete. The server will validate the uploaded introduction before accepting it for Manual creator review.</p>}<p>Submitting uploads and processes your introduction before requesting Manual creator review. Approval requires a separate reviewer.</p></>}</section>{step===3&&<section id="admission-prerequisites" aria-live="polite"><h3>{admissionBlockers.length?'Before you can submit':'Ready to submit for review'}</h3>{admissionBlockers.length?<ul>{admissionBlockers.map(r=><li key={r}>{r}</li>)}</ul>:<p>Your House draft is saved. Submission uploads and validates the introduction; it does not grant admission.</p>}</section>}<p role="status" className="creator-feedback">{message}</p><div className="creator-actions"><Button kind="outline" disabled={busy} onClick={()=>void saveDraft()}>Save House draft</Button>{step > 0 && <Button kind="outline" onClick={() => setStep(step - 1)}>Back</Button>}<Button type="submit" kind={step === 3 ? 'green' : ''} disabled={busy||(step===3&&admissionBlockers.length>0)}>{busy ? 'Checking submission…' : step === 3 ? 'Submit for Manual creator review' : 'Continue'}</Button><a href={houseHref('#/creator/overview')}>Close setup</a></div></form></main>;
}
export function LocalHousePreview({ house, design, preview = false }: {
    house: HouseDraft;
    design: HouseDesign;
    preview?: boolean;
}) {
    const { creator, asset,houseHref,productMode } = useCreator();
    const intro = asset('house-intro');
    const content = creator.content;
    const registry: SectionRegistry<HouseSection> = { featured: { label: 'Featured work', render: () => { const work = content[0]; return <section className="creator-card"><h2>Featured work</h2>{work ? <a href={houseHref(`#/creator/${work.kind === 'video' ? 'videos' : 'articles'}/${work.id}/preview`)}>{work.title || 'Untitled draft'} · private preview</a> : <p>Add a video or article draft to feature it here.</p>}</section>; } }, library: { label: 'Content library', render: () => <section className="creator-card"><h2>Content library</h2><div className="creator-work-grid">{content.map(c => <a key={c.id} href={houseHref(`#/creator/${c.kind === 'video' ? 'videos' : 'articles'}/${c.id}/preview`)}>{c.title || 'Untitled draft'}<small>{c.kind} · local draft</small></a>)}</div>{!content.length && <p>No content yet. Your first work will appear here as a private draft.</p>}</section> }, about: { label: 'About', render: () => <section className="creator-card"><h2>About {house.name || 'your House'}</h2><p>{house.description || 'Your House description will appear here.'}</p><p>{house.focus} · founder and accountable operator: {house.publicName || 'Your public name'}</p></section> }, community: { label: 'Community', render: () => <section className="creator-card"><h2>Community</h2><p>This draft House has no public community. Existing Board interactions are local fixture previews.</p><a href="#/board">Explore the Board</a></section> } };
    return <div className={`local-house-preview ${themeClass(design)} ${preview ? 'design-preview-surface' : ''}`} style={designStyle(design)} data-house-preview><section className="creator-intro" data-protected-intro><div className="creator-copy"><small>CREATOR INTRODUCTION · RESERVED POSITION</small><h2>{house.publicName || 'Your public name'}</h2><p>{productMode==='demo'?'Optional introduction · Complete later. No identity verification or network admission is claimed.':'Manual creator review status appears below. This is not legal identity verification or KYC.'}</p></div>{intro ? <video aria-label="Local creator introduction" controls preload="metadata" src={intro.url}/> : <p>No local introduction selection. Open Uploads for any saved server media.</p>}</section><header className="local-house-banner"><small>PRIVATE HOUSE PREVIEW · NOT PUBLIC</small><h2>{house.name || 'Your House'}</h2><p>{house.address ? `Proposed /houses/${house.address}` : 'Choose a proposed address'}</p></header><RegisteredSections order={design.sections} registry={registry}/>{!design.sections.length && <p>All custom sections are hidden. Your introduction remains visible.</p>}</div>;
}
export function HousePreviewPage() { const { creator,houseHref } = useCreator(); return <CreatorGate><main className="creator-page" data-creator-view="house-preview"><a href={houseHref('#/creator/design')}>← House Design</a><h1>Private House preview</h1><p>Preview the saved interface and actual published content below.</p><HouseDesigner/></main></CreatorGate>; }
function HouseDesigner(){const {serverHouse}=useCreator();return serverHouse?<AppearanceChoices houseId={serverHouse.id}/>:<p>Select a House first.</p>;}
export function ThemeControls<T extends HouseDesign>({ value, onChange }: {
    value: T;
    onChange: (v: T) => void;
}) { return <div className="design-controls"><Field label="Surface"><select value={value.surface} onChange={e => onChange({ ...value, surface: e.target.value as T['surface'] })}>{['ivory', 'peach', 'sage', 'paper'].map(v => <option key={v}>{v}</option>)}</select></Field><Field label="Font"><select value={value.font} onChange={e => onChange({ ...value, font: e.target.value as T['font'] })}>{['classic', 'literary', 'modern'].map(v => <option key={v}>{v}</option>)}</select></Field><Field label="Spacing"><select value={value.spacing} onChange={e => onChange({ ...value, spacing: e.target.value as T['spacing'] })}>{['relaxed', 'balanced', 'tight'].map(v => <option key={v}>{v}</option>)}</select></Field><Field label="Density"><select value={value.density} onChange={e => onChange({ ...value, density: e.target.value as T['density'] })}>{['comfortable', 'compact'].map(v => <option key={v}>{v}</option>)}</select></Field><Field label="Preferred desktop columns"><select value={value.columns} onChange={e => onChange({ ...value, columns: Number(e.target.value) as T['columns'] })}>{[2, 3, 4].map(v => <option key={v}>{v}</option>)}</select></Field><p>Tablet: up to two columns. Mobile: one. Columns and density apply to the content library.</p></div>; }
function Library() { const { creator,houseHref } = useCreator(); return <section data-content-library><h2>Content library</h2><CreateLinks /><ServerVideoLibrary/><p>Full e-book publishing is deferred. Series organize video drafts only.</p><LocalSeries />{!creator.content.length ? <div className="empty-state">No article drafts in this browser.</div> : creator.content.filter(c=>c.kind==='article').map(c => <article className="creator-library-row" key={c.id}><div><h3>{c.title || 'Untitled ' + c.kind}</h3><p>{c.kind} · {c.publication === 'published' ? 'Published status in local cache · not verified' : c.publication === 'unpublished' ? 'Unpublished' : 'Local draft · not public'}{c.series ? ` · ${c.series}, episode ${c.episode}` : ''}</p></div><div className="button-row"><a className="button outline" href={houseHref(`#/creator/${c.kind === 'video' ? 'videos' : 'articles'}/${c.id}`)}>Edit metadata & organize</a><a href={houseHref(`#/creator/${c.kind === 'video' ? 'videos' : 'articles'}/${c.id}/preview`)}>Private preview</a></div></article>)}</section>; }
function UploadQueue() { return <RemoteUploadQueue/>; }
export const uploadLabel = (state: ContentDraft['uploadState']) => ({ 'not-started': 'Not selected', selected: 'Selected locally · not uploaded', uploading: 'Awaiting server upload response · no transfer confirmed', processing: 'Processing · server response required', ready: 'Ready · server response required', failed: 'Server upload unavailable or failed', cancelled: 'Cancelled · local draft retained' }[state]);
export function ContentEditor({ kind, id, preview = false }: {
    kind: ContentDraft['kind'];
    id: string;
    preview?: boolean;
}) { return <CreatorGate>{kind==='video'?<VideoEditor key={id} id={id} preview={preview}/>:<ContentEditorForm key={kind + id} kind={kind} id={id} preview={preview}/>}</CreatorGate>; }
function ContentEditorForm({ kind, id, preview }: {
    kind: ContentDraft['kind'];
    id: string;
    preview: boolean;
}) {
    const { creator, houseHref, save, asset, putAsset, removeAsset, transferVideo, serverUploads, videoUploading, productMode } = useCreator();
    const { go } = useApp();
    const existing = creator.content.find(c => c.id === id && c.kind === kind);
    const [draft, setDraft] = useState<ContentDraft>(() => existing || newContent(kind)), [message, setMessage] = useState(''), [busy, setBusy] = useState(false), [videoError, setVideoError] = useState('');
    const [reading, setReading] = useState(preview);
    const controller = useRef<AbortController>();
    const draftRef = useRef(draft);
    draftRef.current = draft;
    useEffect(() => () => controller.current?.abort(), []);
    useEffect(() => setReading(preview), [preview]);
    const root = `#/creator/${kind === 'video' ? 'videos' : 'articles'}`;
    const media = asset(`${draft.id}:video`), cover = asset(`${draft.id}:cover`), captions = asset(`${draft.id}:captions`);
    const missing = contentRequirements(draft, !!media && !videoError);
    const update = (v: Partial<ContentDraft>) => { const next={...draftRef.current,...v,updatedAt:Date.now()};setDraft(next);if(kind==='video')persist(next); };
    const persist = (value: ContentDraft, navigate = false) => { if (!creator.content.some(c => c.id === value.id) && creator.content.length >= 100) {
        setMessage('Local library limit reached (100 drafts).');
        return false;
    } const next: CreatorState = { ...creator, content: [...creator.content.filter(c => c.id !== value.id), value].sort((a, b) => b.updatedAt - a.updatedAt) }; const ok = save(next); setMessage(ok ? 'Draft saved in this browser only. File bytes are kept only in this tab.' : 'Browser saving failed; keep this tab open.'); if (navigate)
        go(houseHref(`${root}/${value.id}`)); return ok; };
    // Create a stable draft URL before a file can be chosen. Upload ownership
    // lives in CreatorProvider, so editor/queue navigation cannot resend bytes.
    useEffect(()=>{if(id==='new'&&kind==='video')persist(draft,true);},[]);
    useEffect(()=>{if(existing)setDraft(existing);},[existing]);
    const sending=videoUploading.includes(draft.id);
    const upload=serverUploads.find(u=>u.uploadId===draft.serverUploadId);
    const select = (file: File | undefined, slot: 'video' | 'cover' | 'captions') => {
        if(!file)return;
        if(slot==='video'&&(sending||!!media||(!!draftRef.current.file&&!draftRef.current.serverUploadId))){setMessage('This draft already has a video. Use Upload video for a different video.');return;}
        if(slot==='video'&&draftRef.current.file&&JSON.stringify(fileInfo(file))!==JSON.stringify(draftRef.current.file)){setMessage('Choose the same original file to retry this upload. Use Upload video for a different file.');return;}
        const info=fileInfo(file),error=validateFile(info,slot==='cover'?'image':slot==='video'?'video':'captions');
        if(error){setMessage(error);return;}
        putAsset(`${draft.id}:${slot}`,file);
        const next:ContentDraft={...draftRef.current,...(slot==='video'?{file:info,title:draftRef.current.title.trim()?draftRef.current.title:info.name.replace(/\.[^.]+$/,'').replace(/[_-]+/g,' ').trim().slice(0,160)||'Untitled video',uploadState:'selected' as const,error:''}:slot==='cover'?{cover:info}:{captions:info}),updatedAt:Date.now()};
        setDraft(next);persist(next,id==='new'&&kind==='article');
        if(slot==='video'){setVideoError('');void transferVideo(next.id,file).catch(e=>setMessage(e instanceof Error?e.message:'Upload could not start.'));}
        else setMessage('Selection saved in this browser.');
    };
    const transfer=async()=>{if(!media||!draft.serverUploadId||sending)return;await transferVideo(draft.id,media.file);};
    const publish = async () => { if (missing.length) {
        setMessage('Complete the missing requirements before requesting publishing.');
        return;
    } setBusy(true); controller.current = new AbortController(); try {
        const result = await creatorServices.publish(draft, controller.current.signal);
        if (controller.current.signal.aborted)
            return;
        if (!result.ok)
            setMessage(result.message);
        else {
            const next = { ...draftRef.current, publication: result.value.status, updatedAt: Date.now() };
            setDraft(next);
            persist(next);
            setMessage('Server confirmed publication.');
        }
    }
    catch {
        setMessage('Publishing failed. Your local draft is unchanged.');
    }
    finally {
        setBusy(false);
    } };
    const unpublish = async () => { controller.current = new AbortController(); setBusy(true); try {
        const result = await creatorServices.unpublish(draft.id, controller.current.signal);
        if (controller.current.signal.aborted)
            return;
        if (!result.ok)
            setMessage(result.message);
        else {
            const next = { ...draftRef.current, publication: result.value.status, updatedAt: Date.now() };
            setDraft(next);
            persist(next);
            setMessage('Server confirmed unpublishing.');
        }
    }
    catch {
        setMessage('Unpublishing unavailable. No publication record changed.');
    }
    finally {
        setBusy(false);
    } };
    if(id==='new'&&kind==='video')return <main className="creator-page"><p role="status">{message||'Opening editor…'}</p><a href={houseHref('#/creator/library')}>Content library</a></main>;
    if (id !== 'new' && !existing)
        return <main className="creator-page"><h1>Draft not found</h1><p>This private draft is not in this browser, or its type does not match the route.</p><a href={houseHref('#/creator/library')}>Return to library</a></main>;
    return <main className="creator-page" aria-busy={busy} data-creator-view={kind + '-' + (reading ? 'preview' : 'editor')}><a href={houseHref('#/creator/library')}>← Content library</a><header className="creator-heading"><div><small>{kind==='video'?'VIDEO UPLOAD':'ARTICLE DRAFT'}</small><h1>{reading ? 'Private reading & viewing preview' : kind === 'video' ? 'Upload video' : 'Write an article'}</h1></div><span className="creator-state-badge">{draft.publication === 'published' ? 'Publication status cached locally · not verified' : 'Not public · local draft'}</span></header><CreatorStorage /><p><a className="button outline" href={houseHref('#/creator/uploads')}>Uploads &amp; processing</a></p><div className="button-row"><Button kind="outline" onClick={() => setReading(false)} disabled={!reading}>Edit details</Button><Button kind="outline" onClick={() => setReading(true)} disabled={reading}>Open private preview</Button></div>{reading ? <article className="creator-reading-preview" data-private-content><p className="fixture-note">Only you in this tab can preview this article draft. Article publishing is not connected.</p>{cover && <img className="creator-cover" src={cover.url} alt={draft.title ? `Cover for ${draft.title}` : 'Selected cover'}/>}<h2>{draft.title || 'Untitled draft'}</h2><p>By {creator.house.publicName || 'Your public name'}</p><p>{draft.description}</p>{kind === 'video' ? media ? <video className="creator-media" controls playsInline preload="metadata" src={media.url} onError={() => setVideoError('This browser cannot play the selected file. Try another supported file.')}><track key={captions?.url} kind="captions" src={captions?.url} srcLang="en" label="Selected captions"/></video> : <p role="status">No local video is available. Return to details and select your file; file bytes are not persisted.</p> : articleParagraphs(draft.body).map((p, i) => <p className="article-paragraph" key={i}>{p}</p>)}{videoError && <p role="alert">{videoError}</p>}</article> : <form onSubmit={e => { e.preventDefault(); persist(draft, id === 'new'); }}><section className="creator-card">{kind === 'video' && <><h2>1. Select a video to upload</h2><div className="creator-drop" onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); select(e.dataTransfer.files[0], 'video'); }}><Field label="Video file (or drop it here)"><input data-video-file disabled={sending||!!media||!!draft.file&&!draft.serverUploadId||!!upload&&['queued','processing','ready'].includes(upload.state)} aria-describedby="video-upload-help" type="file" accept="video/mp4,video/webm,video/quicktime" onChange={e => select(e.target.files?.[0], 'video')}/></Field><p><span id="video-upload-help">MP4, WebM or QuickTime · maximum 2 GB. Choosing a file starts its upload to this House immediately. You can enter details while it uploads. Keep this tab open until the server confirms receipt.</span></p></div>{draft.file && <p>{draft.file.name} · {(draft.file.size / 1024 ** 2).toFixed(1)} MB {media ? '· available in this tab' : '· re-select the same original file to retry an incomplete upload from zero'}</p>}{media && <video aria-label="Selected video preview" className="creator-media" controls preload="metadata" src={media.url} onError={() => setVideoError('This browser cannot play the selected file. Check the server processing result or start a different video.')}/>}<p role="alert">{videoError}</p><p className="creator-state-badge" role="status" aria-live="polite">{sending?(draft.serverUploadId?'Uploading video to the server…':'Preparing server upload…'):upload?`Server status: ${upload.state}${upload.state==='ready'?' · ready to play in Uploads & processing':''}`:draft.serverUploadId?'Checking server status — open Uploads & processing for the latest result.':'Choose a file to start uploading.'}</p>{((draft.error&&!upload?.state.match(/^(queued|processing|ready)$/))||upload?.errorCode)&&<p role="alert">{draft.error||`Processing failed (${upload?.errorCode}). Retry processing in Uploads & processing, or start a new video with a supported file.`}</p>}<div className="button-row">{!sending&&draft.serverUploadId&&(upload?.state==='failed'||draft.error&&!upload?.state.match(/^(queued|processing|ready)$/))&&<Button kind="outline" disabled={!media} onClick={()=>void transfer()}>Retry existing upload</Button>}{draft.file&&<a className="text-button" href={houseHref('#/creator/videos/new')}>Start a different video</a>}</div><ol className="pipeline-states" aria-label="Server publishing stages"><li>Choose file · upload starts automatically</li><li>Uploading · actual byte transfer</li><li>Processing · background worker</li><li>Ready · see server upload queue</li><li>Published · server publication required</li></ol><p>Status comes from actual server responses; no upload percentage is estimated. Uploads continue while you use this House workspace. Leaving the House, signing out or closing this tab interrupts incomplete transfers; byte-by-byte resume is unavailable. Title and description are saved automatically in this browser; publishing is not available yet.</p></>}<h2>{kind === 'video' ? '2. Details' : 'Article details'}</h2><Field label="Title"><input data-content-title required={productMode!=='demo'} maxLength={160} value={draft.title} onChange={e => update({ title: e.target.value })}/></Field><Field label="Description"><textarea maxLength={4000} value={draft.description} onChange={e => update({ description: e.target.value })}/></Field><Field label={kind === 'video' ? 'Thumbnail image (optional)' : 'Cover image (optional)'}><input type="file" accept="image/jpeg,image/png,image/webp" onChange={e => select(e.target.files?.[0], 'cover')}/></Field>{cover ? <><img className="creator-cover" src={cover.url} alt="Selected image preview"/><Button kind="outline" onClick={() => { removeAsset(`${draft.id}:cover`); update({ cover: undefined }); }}>Remove image</Button></> : draft.cover ? <p>Re-select {draft.cover.name} to preview it.</p> : <p>No image selected. A text placeholder is used.</p>}{kind === 'article' ? <><Field label="Article text"><textarea data-article-body className="article-editor" aria-describedby="article-editor-help" maxLength={100000} value={draft.body} onChange={e => update({ body: e.target.value })}/></Field><p id="article-editor-help">Plain text editor. Separate paragraphs with a blank line. HTML and scripts are displayed as text, never executed.</p></> : <><Field label="English captions (.vtt, optional)"><input type="file" accept=".vtt,text/vtt" onChange={e => select(e.target.files?.[0], 'captions')}/></Field>{draft.captions && <p>{draft.captions.name} {captions ? '· selected in this tab' : '· re-select after reload'}</p>}<Field label="Series name (optional)"><input list="creator-series" maxLength={80} value={draft.series} onChange={e => update({ series: e.target.value })}/></Field><datalist id="creator-series">{[...new Set(creator.content.filter(c => c.kind === 'video' && c.series).map(c => c.series))].map(s => <option key={s} value={s}/>)}</datalist>{draft.series && <Field label="Episode number"><input type="number" min={1} max={999} value={draft.episode} onChange={e => update({ episode: Math.max(1, Math.min(999, Number(e.target.value) || 1)) })}/></Field>}</>}</section><div className="creator-actions"><Button type="submit">{kind==='video'?'Save details in this browser':'Save local draft'}</Button><Button kind="outline" onClick={() => { setDraft(existing || newContent(kind, draft.id)); setMessage('Details are saved in this browser. Uploads already started are unaffected.'); }}>{kind==='video'?'Reload saved details':'Cancel edits'}</Button><a href={houseHref('#/creator/library')}>Close editor</a></div></form>}<section className="creator-card"><h2>Publishing</h2>{productMode==='demo'?<p>House ready for demo use does not mean published. Titles are derived from filenames when omitted; descriptions are optional.</p>:missing.length ? <ul className="requirements">{missing.map(m => <li key={m}>{m}</li>)}</ul> : <p>Local content requirements complete.</p>}<p>House admission, storage and processing use server services. Publishing is not available yet. Uploading and processing video already work; they do not make it public.</p><div className="button-row"><Button kind="green" disabled={busy||productMode==='demo'} onClick={() => void publish()}>Publish · service unavailable</Button><Button kind="outline" disabled={draft.publication !== 'published' || busy} onClick={() => void unpublish()}>Unpublish · service unavailable</Button></div><p>Unpublish requires a real server publication record. Local drafts have never been published.</p></section><p role="status" className="creator-feedback">{message}</p></main>;
}

function LocalSeries(){
 const {creator,houseHref}=useCreator();
 const names=[...new Set(creator.content.filter(c=>c.kind==='video'&&c.series.trim()).map(c=>c.series.trim()))];
 return names.length?<section className="creator-card" data-local-series><h3>Private video series</h3>{names.map(name=><div key={name}><h4>{name}</h4><ol>{creator.content.filter(c=>c.kind==='video'&&c.series.trim()===name).sort((a,b)=>a.episode-b.episode||a.title.localeCompare(b.title)).map(c=><li key={c.id}><a href={houseHref(`#/creator/videos/${c.id}/preview`)}>Episode {c.episode} · {c.title||'Untitled draft'}</a></li>)}</ol></div>)}</section>:null;
}
