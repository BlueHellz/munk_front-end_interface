import { useState, useRef, useEffect, type ReactNode, type CSSProperties } from 'react';
import { Heart, ThumbsUp, X } from 'lucide-react';
import { asset, houseById, workPath, type Work, type Theme, type Comment } from './fixtures';
import { children, likeCount, toggleId } from './model';
import { useApp } from './state';
export function Image({ name, alt = '', className = '' }: {
    name: string;
    alt?: string;
    className?: string;
}) { return <img className={className} src={asset(name)} alt={alt}/>; }
export function Button({ children, onClick, kind = '', disabled = false, type = 'button', 'aria-label':ariaLabel }: {
    children: ReactNode;
    onClick?: () => void;
    kind?: string;
    disabled?: boolean;
    type?: 'submit' | 'button';
    'aria-label'?:string;
}) { return <button type={type} aria-label={ariaLabel} className={`button ${kind}`} onClick={onClick} disabled={disabled}>{children}</button>; }
export function SectionTitle({ children, right }: {
    children: ReactNode;
    right?: ReactNode;
}) { return <div className="section-title"><h2>{children}</h2>{right}</div>; }
export const themeClass = (t: Theme) => `surface-${t.surface} font-${t.font} spacing-${t.spacing} density-${t.density}`;
export function WorkCards({ items, theme }: {
    items: Work[];
    theme: Theme;
}) { const { setModal } = useApp(); return <div className="work-grid" style={{ '--columns': theme.columns } as CSSProperties}>{items.map(w => <article className="work-card" key={w.id}><a className="image-button" href={workPath(w)} onClick={() => setModal(null)} aria-label={`Open ${w.title}`}><Image name={w.image}/></a><small>{w.kind}</small><a className="title-link" href={workPath(w)} onClick={() => setModal(null)}>{w.title}</a><p>{houseById(w.houseId)!.name} · {w.duration}</p></article>)}</div>; }
export function LiveCard({ houseId = 'off-grid', board = false }: {
    houseId?: string;
    board?: boolean;
}) {
    const { setModal, requireAccount } = useApp();
    const h = houseById(houseId)!;
    return <aside className={`live-card ${board ? 'board-live' : ''}`}><span className="live-label"><i />Local room preview</span>{board ? <div className="live-house"><Image name={h.image}/><div><b>{h.name}</b><small>No connected audience</small></div></div> : <><h2>{h.name} room</h2><p>No live broadcast connected</p></>}<div className="live-photo"><Image name={h.image}/><Button onClick={() => requireAccount(() => setModal({ type: 'live', houseId: h.id }))}>Open local room</Button></div>{board && <div className="room-copy"><b>In this preview</b><p>Local notes and reactions only. No messages are sent to other people.</p></div>}</aside>;
}
function CommentNode({ comment, target, onReply, depth }: {
    comment: Comment;
    target: string;
    onReply: (c: Comment) => void;
    depth: number;
}) {
    const { state, setState, requireAccount } = useApp();
    return <div className="comment-branch" data-comment-id={comment.id}><article className={`comment ${depth ? 'nested' : ''}`}><Image name={comment.author === 'Viewer 772A' ? 'viewer2' : comment.author === 'Viewer 7F2A' ? 'avatar' : 'viewer'}/><div><b>{comment.author}</b><p>{comment.text}</p><div className="comment-actions"><button className="like" aria-label={`Like comment ${comment.id}`} aria-pressed={state.likes.includes(comment.id)} onClick={() => requireAccount(() => setState(s => ({ ...s, likes: toggleId(s.likes, comment.id) })))}><Heart size={14} fill={state.likes.includes(comment.id) ? 'currentColor' : 'none'}/>{likeCount(comment.likes, comment.id, state.likes)}</button><button onClick={() => requireAccount(() => onReply(comment))}><ThumbsUp size={13}/>Reply</button></div></div></article><div className="comment-children">{children(state.comments, target, comment.id).map(c => <CommentNode key={c.id} comment={c} target={target} onReply={onReply} depth={depth + 1}/>)}</div></div>;
}
export function Thread({ target }: {
    target: string;
}) {
    const { state, setState, requireAccount, account } = useApp();
    const draftKey=`munk-comment-draft:${target}`;
    const [draft, setDraft] = useState(()=>{try{return sessionStorage.getItem(draftKey)||'';}catch{return '';}});
    useEffect(()=>{try{sessionStorage.setItem(draftKey,draft);}catch{}},[draft,draftKey]);
    const [parent, setParent] = useState<Comment | null>(()=>{try{return state.comments.find(c=>c.target===target&&c.id===sessionStorage.getItem(`${draftKey}:reply`))||null;}catch{return null;}});
    useEffect(()=>{try{if(parent)sessionStorage.setItem(`${draftKey}:reply`,parent.id);else sessionStorage.removeItem(`${draftKey}:reply`);}catch{}},[draftKey,parent]);
    const input = useRef<HTMLInputElement>(null);
    const reply = (c: Comment) => { setParent(c); input.current?.focus(); };
    return <><p className="creator-disclosure">Sample conversation · your comments and reactions stay in this browser. No public posting service is connected.</p><div className="comments">{children(state.comments, target).map(c => <CommentNode key={c.id} comment={c} target={target} onReply={reply} depth={0}/>)}</div>{parent && <div className="reply-target">Replying to {parent.author}: {parent.text.slice(0, 90)}<button className="icon-button" aria-label="Cancel reply" onClick={() => setParent(null)}><X size={16}/></button></div>}<form className="comment-compose" onSubmit={e => {
            e.preventDefault();
            if (!draft.trim())
                return;
            requireAccount(() => { if(!window.confirm('Save this comment in this browser only? It will not be posted publicly.'))return;setState(s => ({ ...s, comments: [...s.comments, { id: crypto.randomUUID(), target, ...(parent ? { parent: parent.id } : {}), author: 'You · browser-local', text: draft.trim(), likes: [] }] })); setDraft(''); setParent(null); });
        }}><Image name="avatar" alt="Your local draft"/><label className="sr-only" htmlFor={`comment-${target}`}>Your {parent ? 'reply' : 'comment'}</label><input ref={input} id={`comment-${target}`} placeholder={account ? 'Draft a local comment…' : 'Write a draft · sign in to save locally'} value={draft} onChange={e => setDraft(e.target.value)} required maxLength={2000}/><Button type="submit">Save local {parent ? 'reply' : 'comment'}</Button></form></>;
}
export function Dialog({ title, onClose, children, wide = false }: {
    title: string;
    onClose: () => void;
    children: ReactNode;
    wide?: boolean;
}) {
    const ref = useRef<HTMLElement>(null);
    useEffect(() => {
        const previous = document.activeElement as HTMLElement | null;
        const oldOverflow=document.body.style.overflow;document.body.style.overflow='hidden';
        const dialog = ref.current;
        dialog?.focus();
        const fn = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                e.stopPropagation();
                onClose();
            }
            if (e.key === 'Tab' && dialog) {
                const list = Array.from(dialog.querySelectorAll<HTMLElement>('button:not(:disabled),a[href],input,select,textarea,video[controls]')).filter(x => x.getClientRects().length > 0);
                const first = list[0], last = list.at(-1);
                if (e.shiftKey && (document.activeElement === first || document.activeElement === dialog)) {
                    e.preventDefault();
                    last?.focus();
                }
                else if (!e.shiftKey && (document.activeElement === last || document.activeElement === dialog)) {
                    e.preventDefault();
                    first?.focus();
                }
            }
        };
        dialog?.addEventListener('keydown', fn);
        return () => { document.body.style.overflow=oldOverflow; dialog?.removeEventListener('keydown', fn); previous?.isConnected && previous.focus(); };
    }, []);
    return <div className="dialog-backdrop" onClick={onClose}><section ref={ref} className={`dialog ${wide ? 'design-dialog' : ''}`} role="dialog" aria-modal="true" aria-label={title} tabIndex={-1} onClick={e => e.stopPropagation()}><div className="dialog-heading"><h2>{title}</h2><button className="icon-button" aria-label="Close dialog" onClick={onClose}><X /></button></div>{children}</section></div>;
}
