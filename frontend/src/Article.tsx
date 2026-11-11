import { readProgress, recordProgress } from './progress';
import { useState, useEffect, useRef } from 'react';
import { Bookmark } from 'lucide-react';
import { workById, houseById, defaultDesign } from './fixtures';
import { toggleId } from './model';
import { useApp } from './state';
import { Image, Button, Thread, themeClass } from './components';
export default function Article({ id }: {
    id: string;
}) {
    const reader = useRef<HTMLElement>(null);
    useEffect(() => {
        let last = 0;
        const update = () => {
            if (Date.now() - last < 400 || !reader.current)
                return;
            last = Date.now();
            const r = reader.current.getBoundingClientRect();
            const fraction = Math.max(0, Math.min(1, -r.top / Math.max(1, r.height - innerHeight * .4)));
            if (fraction > 0)
                recordProgress(id, fraction, 1);
        };
        if (new URLSearchParams(location.hash.split('?')[1]).get('resume') === '1') {
            const p = readProgress().find(p => p.id === id);
            if (p && reader.current)
                window.scrollTo(0, reader.current.offsetTop + p.position * Math.max(1, reader.current.offsetHeight - innerHeight * .4));
        }
        window.addEventListener('scroll', update, { passive: true });
        return () => window.removeEventListener('scroll', update);
    }, [id]);
    const [houseTheme, setHouseTheme] = useState(false);
    const { state, setState, requireAccount } = useApp();
    const w = workById(id)!;
    const h = houseById(w.houseId)!;
    return <main className={`article-page ${houseTheme ? 'house-theme' : 'network-theme'} ${themeClass(houseTheme ? h.theme : defaultDesign)}`} data-theme={houseTheme ? 'house' : 'network'}><a href={`#/houses/${h.id}`} className="text-button">← Back to {h.name}</a><div className="article-theme-controls"><small>{houseTheme ? `${h.name} House theme` : 'Network default · orange / ivory'}</small><button className="button outline small" aria-pressed={houseTheme} onClick={() => setHouseTheme(!houseTheme)}>{houseTheme ? 'Use network default' : `Use ${h.name} House theme`}</button></div><article className="reader" ref={reader}><small>{h.name.toUpperCase()} · FIXTURE ESSAY</small><Image name={w.image} alt={w.title}/><h1>{w.title}</h1><p className="byline">By {h.creator.name} · {w.duration}</p>{w.paragraphs?.map((text, i) => <p key={i}>{text}</p>)}<Button kind="outline" onClick={() => requireAccount(() => setState(s => ({ ...s, saved: toggleId(s.saved, id) })))}><Bookmark size={16}/>{state.saved.includes(id) ? 'Bookmarked' : 'Bookmark essay'}</Button></article><div className="section-title"><h2>Comments {state.comments.filter(c => c.target === id).length}</h2></div><Thread target={id}/></main>;
}
