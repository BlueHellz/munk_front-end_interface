import { series, artPath } from './discovery-model';
import { workById, houseById, workPath } from './fixtures';
export default function Series({ id }: {
    id: string;
}) { const s = series.find(s => s.id === id)!; const h = houseById(s.houseId)!; return <main className="series-page"><a className="text-button" href={`#/houses/${h.id}`}>← Back to {h.name}</a><div className="series-heading"><img src={artPath(s.art)} alt="Original series illustration"/><div><small>FIXTURE SERIES · SAMPLE MEDIA</small><h1>{s.title}</h1><p>{s.description}</p><p>By {h.creator.name}</p></div></div><h2>Episodes · creator-listed order</h2><ol className="series-episodes">{s.episodes.map(id => { const w = workById(id)!; return <li key={id}><a href={workPath(w)}><h3>{w.title}</h3><p>{w.summary}</p><span>{w.duration} →</span></a></li>; })}</ol></main>; }
