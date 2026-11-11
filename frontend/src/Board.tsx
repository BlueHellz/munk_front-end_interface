import { useRef, useState } from 'react';
import { Heart, MessageCircle, Repeat2, Bookmark, MoreHorizontal } from 'lucide-react';
import { posts, houseById, workById, workPath, type Post } from './fixtures';
import { likeCount, sortPosts, toggleId } from './model';
import { useApp } from './state';
import { Image, Thread, LiveCard } from './components';
export function PostCard({ post, detail = false, compact = false }: {
    post: Post;
    detail?: boolean;
    compact?: boolean;
}) {
    const { state, setState, requireAccount, setModal } = useApp();
    const h = houseById(post.houseId)!;
    const work = post.workId ? workById(post.workId) : null;
    const [replyOpen, setReplyOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    const count = state.comments.filter(c => c.target === post.id).length;
    return <article className={`post ${compact ? 'compact-post' : ''}`} data-post={post.id}><a className="post-avatar" href={`#/houses/${h.id}`} aria-label={`Open ${h.name}`}><Image name={h.image}/></a><div className="post-body"><div className="post-heading"><a href={`#/houses/${h.id}`}>{h.name}</a><a href={`#/board/posts/${post.id}`} className="post-permalink">Fixture post ↗</a><button className="more" aria-label="Post options" onClick={() => setModal({ type: 'options' })}><MoreHorizontal size={19}/></button></div><p><a href={`#/board/posts/${post.id}`}>{post.text}</a></p>{post.images && work ? <div className="post-photos">{post.images.map(image => <a key={image} className="image-button" href={workPath(work)} aria-label={`Open ${work.title}`}><Image name={image}/></a>)}</div> : work ? <a className="essay-card" href={workPath(work)}><Image name={work.image}/><div><small>{work.kind}</small><h2>{work.title}</h2><p>{work.summary}</p></div></a> : null}<div className="post-actions"><button className="like" aria-label={`Like ${post.id}`} aria-pressed={state.likes.includes(post.id)} onClick={() => requireAccount(() => setState(s => ({ ...s, likes: toggleId(s.likes, post.id) })))}><Heart size={19} fill={state.likes.includes(post.id) ? 'currentColor' : 'none'}/>{likeCount(post.likes, post.id, state.likes)}</button><button aria-label={`Reply to ${post.id}`} onClick={() => requireAccount(() => { setReplyOpen(true); setTimeout(() => ref.current?.querySelector('input')?.focus(), 0); })}><MessageCircle size={18}/>{count}</button><button aria-label={`Repost ${post.id}`} aria-pressed={state.reposts.includes(post.id)} onClick={() => requireAccount(() => setState(s => ({ ...s, reposts: toggleId(s.reposts, post.id) })))}><Repeat2 size={19}/>{state.reposts.includes(post.id) ? 1 : 0}</button><button aria-label={`Save ${post.id}`} aria-pressed={state.saved.includes(post.id)} onClick={() => requireAccount(() => setState(s => ({ ...s, saved: toggleId(s.saved, post.id) })))}><Bookmark size={17} fill={state.saved.includes(post.id) ? 'currentColor' : 'none'}/>{state.saved.includes(post.id) ? 'Saved' : 'Save'}</button><a className="text-button thread-link" href={`#/board/posts/${post.id}`}>Open thread</a></div>{(detail || replyOpen || (!compact && count > 0)) && <div className="thread" ref={ref}><Thread target={post.id}/></div>}</div></article>;
}
export default function Board({ postId }: {
    postId?: string;
}) {
    const { state } = useApp();
    const [filter, setFilter] = useState('All Houses');
    const [sort, setSort] = useState('Most recent');
    const houseFilter = typeof location === 'undefined' ? null : new URLSearchParams(location.hash.split('?')[1]).get('house');
    const shown = sortPosts(posts.filter(p => (!postId || p.id === postId) && (!houseFilter || p.houseId === houseFilter) && (filter === 'All Houses' || state.following.includes(p.houseId))).map(p => p.id), sort, state.likes);
    return <main className="board-page">{postId && <a href="#/board" className="text-button">← Back to the Board</a>}<h1>{postId ? houseById(posts.find(p => p.id === postId)!.houseId)!.name + ' · conversation' : 'The Houses are talking.'}</h1><div className="board-filters"><div className="tabs">{['All Houses', 'Followed Houses'].map(t => <button key={t} className={filter === t ? 'active' : ''} aria-pressed={filter === t} onClick={() => setFilter(t)}>{t}</button>)}</div><label className="sort"><span className="sr-only">Sort posts</span><select value={sort} onChange={e => setSort(e.target.value)}><option>Most recent</option><option>Most liked</option></select></label></div><div className="board-layout"><section className="feed">{shown.map(p => <PostCard post={p} detail={!!postId} key={p.id}/>)}{!shown.length && <p>No fixture posts match this filter. <a href="#/board">Show all Houses</a></p>}</section><div className="board-aside"><LiveCard houseId={postId ? posts.find(p => p.id === postId)!.houseId : 'off-grid'} board/></div></div></main>;
}
