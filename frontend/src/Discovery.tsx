import { useState, type ReactNode } from 'react';
import { Search, Compass, Film, BookOpen, Layers, Home as HouseIcon, ArrowRight, Play } from 'lucide-react';
import { houses, works, workById, houseById, workPath, type Work, type HomeDesign, getDiscoverySections } from './fixtures';
import { editorialFeatures, editorialFilms, editorialWriting, discover, series, workArt, artPath, type DiscoveryCategory } from './discovery-model';
import { useApp } from './state';
import { useProgress } from './progress';
import {RegisteredSections,designStyle,type SectionRegistry} from './design-system';
import type {DiscoverySectionId} from './fixtures';
export function Art({ name, alt = '', className = '' }: {
    name: string;
    alt?: string;
    className?: string;
}) { return <img src={artPath(name)} alt={alt} className={className} loading="lazy"/>; }
function WorkTile({ work, featured = false, resume = false, progress }: {
    work: Work;
    featured?: boolean;
    resume?: boolean;
    progress?: number;
}) { const h = houseById(work.houseId)!; return <a className={`discovery-tile ${featured ? 'feature-lead' : ''}`} href={workPath(work) + (resume ? '?resume=1' : '')} aria-label={`${resume ? 'Continue' : 'Open'} ${work.title}, by ${h.creator.name}`}><Art name={workArt(work)}/><div className="discovery-tile-shade"/><span className="discovery-kind">{work.kind === 'FILM' ? <Film size={13}/> : <BookOpen size={13}/>} {work.kind === 'FILM' ? 'Film · sample clip' : 'Writing'}</span><div className="discovery-tile-caption"><span>{h.name}</span><h3>{work.title}</h3>{featured && <p>{work.summary}</p>}<small>{resume ? 'Continue in this browser' : work.duration}</small></div>{progress !== undefined && <span className="discovery-progress" aria-label={`${Math.round(progress * 100)}% complete`}><i style={{ width: `${progress * 100}%` }}/></span>}{featured && <span className="discovery-play"><Play size={20} fill="currentColor"/></span>}</a>; }
function HouseTile({ id }: {
    id: string;
}) { const h = houseById(id)!; return <a className="discovery-house-tile" href={`#/houses/${h.id}`}><Art name={h.id}/><div className="discovery-tile-shade"/><div><h3>{h.name}</h3><span>{h.creator.name}</span></div><ArrowRight size={20}/></a>; }
function Shelf({ title, note, children, onAll }: {
    title: string;
    note?: string;
    children: ReactNode;
    onAll?: () => void;
}) { return <section className="discovery-shelf"><header><div><h2>{title}</h2>{note && <p>{note}</p>}</div>{onAll && <button className="text-button" onClick={onAll}>See all <ArrowRight size={16}/></button>}</header><div className={`discovery-strip ${title.includes('House')?'discovery-house-grid':''}`}>{children}</div></section>; }
export function SeriesTile({ id }: {
    id: string;
}) { const s = series.find(s => s.id === id)!; return <a className="discovery-tile series-tile" href={`#/series/${s.id}`}><Art name={s.art}/><div className="discovery-tile-shade"/><span className="discovery-kind"><Layers size={13}/>Series fixture</span><div className="discovery-tile-caption"><span>{houseById(s.houseId)!.name}</span><h3>{s.title}</h3><small>{s.episodes.length} sample episodes</small></div></a>; }
export default function Discovery({ preview = false, design }: {
    preview?: boolean;
    design?: HomeDesign;
}) {
    const { state,searchQuery,setSearchQuery } = useApp();
    const recent = useProgress();
    const [previewQuery,setPreviewQuery]=useState('');
    const query=preview?previewQuery:searchQuery;
    const setQuery=preview?setPreviewQuery:setSearchQuery;
    const [category, setCategory] = useState<DiscoveryCategory>('All');
    const results = discover(query, category);
    const filtered = !!query.trim() || category !== 'All';
    const options: [DiscoveryCategory, ReactNode][] = [
        ['All', <Compass aria-hidden="true"/>],
        ['Films', <Film aria-hidden="true"/>],
        ['Writing', <BookOpen aria-hidden="true"/>],
        ['Series', <Layers aria-hidden="true"/>],
        ['Houses', <HouseIcon aria-hidden="true"/>]
    ];
    const sections = {
        featured: <section className="discovery-featured" aria-label="Editorial features"><div className="discovery-section-title"><h2>Take the long way home.</h2><p>A few places worth getting lost in.</p></div><div className="discovery-feature-grid">{editorialFeatures.map((id, i) => <WorkTile key={id} work={workById(id)!} featured={i === 0}/>)}</div></section>,
        continue: <Shelf title="Continue watching & reading" note="Your actual progress in this browser, newest activity first.">{recent.length ? recent.map(p => <WorkTile key={p.id} work={workById(p.id)!} resume progress={p.position / p.duration}/>) : <div className="discovery-empty">Start a sample film or scroll through an article. Your unfinished stories will appear here.</div>}</Shelf>,
        films: <Shelf title="Films for a different pace" note="Editorial fixture selection · sample media." onAll={() => setCategory('Films')}>{editorialFilms.map(id => <WorkTile key={id} work={workById(id)!}/>)}</Shelf>,
        writing: <Shelf title="A little room to read" onAll={() => setCategory('Writing')}>{editorialWriting.map(id => <WorkTile key={id} work={workById(id)!}/>)}</Shelf>,
        series: <Shelf title="Stay for the series" note="Fixture collections, ordered as listed." onAll={() => setCategory('Series')}>{series.map(s => <SeriesTile key={s.id} id={s.id}/>)}</Shelf>,
        following: <Shelf title="Houses you follow" note="Your explicit follows, in catalogue order.">{state.following.length ? houses.filter(h => state.following.includes(h.id)).map(h => <HouseTile key={h.id} id={h.id}/>) : <div className="discovery-empty">Enter a House to follow its stories.</div>}</Shelf>,
        houses: <Shelf title="Meet your next House" note="20 distinct fictional Houses · local fixtures" onAll={() => setCategory('Houses')}>{houses.map(h => <HouseTile key={h.id} id={h.id}/>)}</Shelf>
    };
    const registry=Object.fromEntries(Object.entries(sections).map(([id,node])=>[id,{label:id,render:()=>node}])) as SectionRegistry<DiscoverySectionId>;
    return <div style={designStyle(design??state.design)} className={`discovery ${preview ? 'discovery-preview' : ''}`}>{preview&&<div className="discovery-search"><Search size={22}/><label className="sr-only" htmlFor={preview ? 'preview-discovery-search' : 'discovery-search'}>Search films, writing, series and Houses</label><input id={preview ? 'preview-discovery-search' : 'discovery-search'} type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder="Search MUNK" maxLength={200}/></div>}<div className="discovery-categories" role="group" aria-label="MUNK content categories">{options.map(([name, icon]) => <button type="button" key={name} className={`category-${name.toLowerCase()}`} aria-pressed={category === name} onClick={() => setCategory(name)}>{icon}<span><b>{name}</b></span></button>)}</div><p className="discovery-order">{filtered ? 'Search results follow fixed catalogue order.' : 'Featured, films and writing follow the published fixture editorial order.'} No personalized ranking. <span>Fictional creators · original illustrative artwork</span></p>{filtered ? <><div className="discovery-results-heading"><h2>{query ? `Results for “${query}”` : category}</h2><span role="status">{results.works.length + results.houses.length + results.series.length} results</span><button className="text-button" onClick={() => { setQuery(''); setCategory('All'); }}>Reset discovery</button></div><div className="discovery-results-grid">{results.works.map(w => <WorkTile key={w.id} work={w}/>)}{results.houses.map(h => <HouseTile key={h.id} id={h.id}/>)}{results.series.map(s => <SeriesTile key={s.id} id={s.id}/>)}</div>{!results.works.length && !results.houses.length && !results.series.length && <p className="discovery-empty">No fixture content matches.</p>}</> : <div className="discovery-sections"><RegisteredSections order={getDiscoverySections(design??state.design)} registry={registry} attribute="data-discovery-section"/>{getDiscoverySections(design ?? state.design).length === 0 && <p className="discovery-empty">Your Home sections are hidden. Use Customize Home in your account menu to show them again.</p>}</div>}</div>;
}
