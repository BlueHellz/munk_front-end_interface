import { useState } from 'react';
import { Search, Bookmark, Minimize2 } from 'lucide-react';
import { houses, houseById, workById, workPath, posts } from './fixtures';
import { toggleId } from './model';
import { useApp } from './state';
import { Dialog, Button, Image, WorkCards } from './components';
import Designer from './Designer';
export type Room = {
    messages: string[];
    reaction: string;
    reducedMotion: boolean;
    draft: string;
};
export function LiveDialog({ houseId, room, onUpdate, onMinimize }: {
    houseId: string;
    room: Room;
    onUpdate: (r: Room) => void;
    onMinimize: () => void;
}) {
    const { setModal } = useApp();
    const h = houseById(houseId)!;
    return <Dialog title={`${h.name} · local room preview`} onClose={() => setModal(null)}><div className="button-row"><Button kind="outline small" onClick={onMinimize}><Minimize2 size={16}/>Minimize</Button></div><div className={`live-stage ${room.reducedMotion ? 'reduced-motion' : ''}`}><Image name={h.image}/><span>No broadcast. No connected audience.</span>{room.reaction && <button className="sent-reaction" aria-label="Clear local reaction" onClick={() => onUpdate({ ...room, reaction: '' })}>{room.reaction}</button>}</div><p className="fixture-note">This room is a frontend notebook. Nothing is broadcast or delivered. These notes last only until reload.</p><div className="live-messages" aria-live="polite">{room.messages.map((text, i) => <p key={i}><b>Local preview</b>{text}</p>)}</div><div className="live-reactions">{['❤️', '🔥', '👏', '😍'].map(emoji => <button key={emoji} aria-label={`Show local ${emoji}`} onClick={() => onUpdate({ ...room, reaction: emoji, messages: [...room.messages, emoji] })}>{emoji}</button>)}<label><input type="checkbox" checked={room.reducedMotion} onChange={e => onUpdate({ ...room, reducedMotion: e.target.checked })}/>Reduce motion</label></div><form className="reply-form" onSubmit={e => {
            e.preventDefault();
            if (room.draft.trim())
                onUpdate({ ...room, messages: [...room.messages, room.draft.trim()], draft: '' });
        }}><label className="sr-only" htmlFor="room-note">Local room note</label><input id="room-note" value={room.draft} onChange={e => onUpdate({ ...room, draft: e.target.value })} required maxLength={2000} placeholder="Add a local note…"/><Button type="submit">Add local note</Button></form></Dialog>;
}
function Messages({ houseId }: {
    houseId: string;
}) {
    const { state, setState } = useApp();
    const [draft, setDraft] = useState('');
    const h = houseById(houseId)!;
    return <><p><b>House:</b> {h.name}<br /><b>Recipient:</b> {h.creator.name}</p><p className="fixture-note">Local draft storage only. No delivery, inbox or message encryption. Drafts are plaintext in this browser.</p><div className="message-history">{state.messages.filter(m => m.houseId === houseId).map(m => <p key={m.id}><b>Local draft to {h.creator.name}</b><br />{m.text}</p>)}</div><form onSubmit={e => {
            e.preventDefault();
            if (draft.trim()) {
                setState(s => ({ ...s, messages: [...s.messages, { id: crypto.randomUUID(), houseId, text: draft.trim() }].slice(-1000) }));
                setDraft('');
            }
        }}><label htmlFor="message-draft">Draft for {h.creator.name}</label><textarea id="message-draft" value={draft} onChange={e => setDraft(e.target.value)} required maxLength={2000}/><Button type="submit">Save local draft</Button></form></>;
}
function Explore() { const { setModal } = useApp(); const [search, setSearch] = useState(''); return <><label className="search-field"><Search size={18}/><input autoFocus value={search} onChange={e => setSearch(e.target.value)} placeholder="Search fixture Houses…" aria-label="Search Houses"/></label><div className="explore-grid">{houses.filter(h => (h.name + ' ' + h.creator.name).toLowerCase().includes(search.toLowerCase())).map(h => <a key={h.id} href={`#/houses/${h.id}`} onClick={() => setModal(null)}><Image name={h.image}/><h3>{h.name}</h3><span>{h.creator.name} →</span></a>)}</div>{!houses.some(h => (h.name + ' ' + h.creator.name).toLowerCase().includes(search.toLowerCase())) && <p>No matching fixture Houses.</p>}</>; }
export default function ModalContent() {
    const { modal, setModal, state, setState, requireAccount, route, go } = useApp();
    if (!modal || modal.type === 'live')
        return null;
    if (modal.type === 'edit')
        return <Designer />;
    const close = () => setModal(null);
    if (modal.type === 'explore')
        return <Dialog title="Explore Houses" onClose={close}><Explore /></Dialog>;
    if (modal.type === 'messages') {
        const h = houseById(modal.houseId)!;
        return <Dialog title={`Message ${h.name}`} onClose={close}><Messages key={h.id} houseId={h.id}/></Dialog>;
    }
    if (modal.type === 'intro') {
        const h = houseById(modal.houseId)!;
        return <Dialog title={h.creator.introduction.title} onClose={close}><div className="intro-preview"><Image name={h.creator.portrait} alt={h.creator.name}/><span>No introduction video supplied</span></div><h3>{h.creator.name}</h3><p>{h.creator.introduction.text}</p><p className="fixture-note">Text introduction fixture. No identity verification or face-visible three-minute video is available. This House is not admitted to a live network.</p></Dialog>;
    }
    if (modal.type === 'terms') {
        const h = houseById(modal.houseId)!;
        return <Dialog title={`${h.name} · ownership & terms`} onClose={close}><h3>{h.creator.name}</h3><p>Fixture founder and accountable operator of {h.name}.</p><p>Watching and reading remain free. No ownership interests, tokens or licenses are offered for sale.</p><p className="fixture-note">House MUNK ownership and content-work MUNKEE licenses are separate future concepts requiring explicit creator agreements. No financial infrastructure is implemented.</p></Dialog>;
    }
    if (modal.type === 'rights') {
        const w = workById(modal.workId)!;
        return <Dialog title={`${w.title} · content rights`} onClose={close}><p>{houseById(w.houseId)!.creator.name} · {houseById(w.houseId)!.name}</p><p>MUNKEE is the planned work identifier concept, not an issued token in this preview.</p><p>Free sample viewing. The original sample animation is CC0; fixture creator footage is not supplied. No licenses or ownership interests are sold.</p></Dialog>;
    }
    if (modal.type === 'watchlist') {
        const items = state.saved.map(workById).filter((w): w is NonNullable<typeof w> => !!w);
        return <Dialog title={`Your watchlist · ${items.length} works`} onClose={close}><WorkCards items={items} theme={state.design}/>{!items.length && <p>No saved works yet. Bookmark an article or use a film’s Details tab.</p>}{state.saved.filter(id => posts.some(p => p.id === id)).map(id => <p key={id}><a className="text-button" href={`#/board/posts/${id}`} onClick={close}>Saved Board thread: {posts.find(p => p.id === id)!.text}</a></p>)}</Dialog>;
    }
    const target = 'id' in route ? route.id : null;
    return <Dialog title="Page options" onClose={close}>{target && (workById(target) || posts.some(p => p.id === target)) ? <Button kind="outline" onClick={() => requireAccount(() => { setState(s => ({ ...s, saved: toggleId(s.saved, target) })); close(); })}><Bookmark size={16}/>{state.saved.includes(target) ? 'Remove bookmark' : 'Save this item'}</Button> : <p>House follows are available in the banner.</p>}<p className="fixture-note">Reporting, blocking and sharing services are not connected.</p><Button kind="outline" onClick={() => go('#/home')}>Back to Home</Button></Dialog>;
}
