import{useAppearance}from'./appearance-preference';
import{useViewerSkin}from'./interface-service';import{defaultMode}from'./default-ui/mode';
import { useState, useEffect, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { Search, Star } from 'lucide-react';
import { houses, houseById, type HouseId } from './fixtures';
import { useApp } from './state';
import { Image, Dialog } from './components';
import { markets, marketPrice, marketChange, contentCategory, defaultExchange, loadExchange, saveExchange, compareHouses, sparkline, type MarketFixture, type ExchangeSettings } from './exchange-model';
import './exchange.css';
import HouseMosaic from './HouseMosaic';
import {packMosaic} from './mosaic-layout';
import { artPath } from './discovery-model';
const money = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
const compactMoney = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', notation: 'compact', maximumFractionDigits: 1 }).format(n);
const percent = (n: number) => `${n >= 0 ? '+' : ''}${n.toFixed(2)}%`;
function HistoryChart({ market, large = false }: {
    market: MarketFixture;
    large?: boolean;
}) { const change = marketChange(market); return <svg className={`exchange-chart ${large ? 'large-chart' : ''} ${change >= 0 ? 'gain' : 'loss'}`} viewBox="0 0 240 44" preserveAspectRatio="none" role="img" aria-label={`${houseById(market.houseId)!.name}: fictional seven-day coin-price history, ${market.history.map(money).join(', ')}`}><title>Sample price history · seven fictional days · each chart uses its own range</title><path className="chart-guide" d="M4 40H236 M4 22H236 M4 4H236"/><polyline points={sparkline(market.history)} fill="none" stroke="currentColor" strokeWidth="2" vectorEffect="non-scaling-stroke"/></svg>; }
function MarketPreview({ market, onClose }: {
    market: MarketFixture;
    onClose: () => void;
}) { const h = houseById(market.houseId)!; return <Dialog title={`${h.name} · sample market preview`} onClose={onClose} wide><div className="exchange-market"><p className="exchange-sample-notice"><strong>Fictional sample data only.</strong> No live market, issued coin, ownership offer or trading functionality. All dollar figures are illustrative USD.</p><div className="market-preview-identity"><img src={artPath(h.id)} alt="Original House illustration"/><div><h3>{h.name}</h3><p>{h.creator.name} · sample symbol {market.symbol}</p></div></div><div className="market-price-summary"><div><span>Sample coin price</span><strong>{money(marketPrice(market))}</strong></div><div><span>Sample 24h change</span><strong className={marketChange(market) >= 0 ? 'gain' : 'loss'}>{percent(marketChange(market))}</strong></div></div><HistoryChart market={market} large/><dl className="exchange-market-metrics"><div><dt>Sample 24h volume</dt><dd>{money(market.volumeUsd)}</dd></div><div><dt>Sample market capitalization</dt><dd>{money(market.marketCapUsd)}</dd></div></dl><div className="exchange-valuation"><span>House valuation score · sample</span><strong>{market.valuationScore}<small> / 100</small></strong><p>An illustrative score, separate from coin price and market capitalization. It is not a monetary appraisal, a calculated return or a prediction.</p></div><section className="exchange-ownership"><h3>House ownership preview</h3><p><b>Fixture founder and accountable operator:</b> {h.creator.name} · {h.name}.</p><p>No ownership interests are offered. A future House MUNK ownership agreement is separate from any content-work MUNKEE license. These sample metrics confer no rights or network governance privileges.</p></section><details><summary>Inspect the fictional price-history records</summary><table><caption>Sample daily closing prices — not actual market dates</caption><thead><tr><th scope="col">Illustrative day</th><th scope="col">Sample coin price</th></tr></thead><tbody>{market.history.map((price, i) => <tr key={i}><th scope="row">Day {i + 1}</th><td>{money(price)}</td></tr>)}</tbody></table></details><p className="exchange-market-disclaimer">No trades, purchases, wallet approvals or financial transactions can be performed here. The valuation score is a fixed fixture value; no valuation engine is implemented.</p><a className="button" href={`#/houses/${h.id}`}>Enter House</a></div></Dialog>; }
export function ExchangeCard({ market, watched, onWatch }: {
    market: MarketFixture;
    watched: boolean;
    onWatch: () => void;
}) { const h = houseById(market.houseId)!; const change = marketChange(market); return <article className="exchange-card" data-house-id={h.id}><div className="exchange-cover"><img src={artPath(h.id)} alt="Original House illustration"/><span className="exchange-sample-tag">Sample data</span><button className="exchange-watch" aria-label={`${watched ? 'Remove' : 'Add'} ${h.name} ${watched ? 'from' : 'to'} Exchange watchlist`} aria-pressed={watched} onClick={onWatch}><Star size={18} fill={watched ? 'currentColor' : 'none'}/></button></div><div className="exchange-card-body"><div className="exchange-house-identity"><img src={artPath(h.id)} alt="Original House illustration"/><div><h3>{h.name}</h3><p>{h.creator.name}</p></div></div><div className="exchange-category"><span>{contentCategory(h.id) === 'Both' ? 'Video + writing' : contentCategory(h.id)}</span><span title="Illustrative House coin symbol">{market.symbol}</span></div><div className="exchange-price-row"><div><span>Sample coin price</span><strong>{money(marketPrice(market))}</strong></div><div className={change >= 0 ? 'gain' : 'loss'}><span>Sample 24h change</span><strong>{percent(change)}</strong></div></div><div className="exchange-history"><span>Sample 7-day price history</span><HistoryChart market={market}/></div><dl className="exchange-stats"><div><dt>Sample 24h volume</dt><dd title={money(market.volumeUsd)}>{compactMoney(market.volumeUsd)}</dd></div><div><dt>Sample market cap</dt><dd title={money(market.marketCapUsd)}>{compactMoney(market.marketCapUsd)}</dd></div></dl><div className="exchange-valuation"><span>House valuation score · sample</span><strong>{market.valuationScore}<small> / 100</small></strong><small>Separate from market price</small></div><footer className="exchange-actions"><a className="button" href={`#/houses/${h.id}`}>Enter House</a><a className="button green" href={`#/home?tab=exchange&view=comparison&market=${h.id}`}>View market</a></footer></div></article>; }
export default function Exchange() {
    const { requireAccount } = useApp();
    const {theme:appearance}=useAppearance();
    useEffect(()=>{document.body.dataset.exchangeAppearance=appearance;return()=>{delete document.body.dataset.exchangeAppearance;};},[appearance]);
    const [loaded] = useState(() => {
        try {
            return typeof window === 'undefined' ? { settings: defaultExchange, warning: '' } : loadExchange(window.localStorage);
        }
        catch {
            return { settings: defaultExchange, warning: 'Exchange storage is unavailable. Changes remain in this tab only.' };
        }
    });
    const [settings, setSettings] = useState<ExchangeSettings>(loaded.settings);
    const [warning, setWarning] = useState(loaded.warning);
    useEffect(() => {
        try {
            setWarning(saveExchange(window.localStorage, settings) || loaded.warning);
        }
        catch {
            setWarning('Exchange changes are in memory only: browser storage is unavailable.');
        }
    }, [settings, loaded.warning]);
    const query = typeof location === 'undefined' ? new URLSearchParams() : new URLSearchParams(location.hash.split('?')[1]);
    const explicitView = query.get('view');
    const mode = explicitView === 'comparison' || explicitView === 'mosaic' ? explicitView : settings.mode || 'mosaic';
    const chooseMode = (value: 'mosaic' | 'comparison') => { setSettings(prev => ({ ...prev, mode: value })); location.hash = `#/home?tab=exchange&view=${value}`; };
    const marketId = typeof location === 'undefined' ? null : new URLSearchParams(location.hash.split('?')[1]).get('market');
    const selected = markets.find(m => m.houseId === marketId);
    useEffect(() => {
        if (!selected)
            return;
        const shell = document.querySelector('.app-shell');
        const already = shell?.hasAttribute('inert');
        shell?.setAttribute('inert', '');
        return () => {
            if (!already)
                shell?.removeAttribute('inert');
        };
    }, [selected]);
    const update = (value: Partial<ExchangeSettings>) => setSettings(prev => ({ ...prev, ...value }));
    const watch = (houseId: HouseId) => requireAccount(() => setSettings(prev => ({ ...prev, watchlist: prev.watchlist.includes(houseId) ? prev.watchlist.filter(id => id !== houseId) : [...prev.watchlist, houseId] })));
    const shown = compareHouses(settings);
    const layouts=([2,4,6] as const).map(columns=>({columns,placements:packMosaic(shown.map(m=>m.houseId),columns)}));
    const mosaicStyles=shown.map((_,index)=>Object.fromEntries(layouts.flatMap(({columns,placements})=>{
        const p=placements[index];return [[`--mosaic-column-${columns}`,p.column],[`--mosaic-row-${columns}`,p.row],[`--mosaic-width-${columns}`,p.width],[`--mosaic-height-${columns}`,p.height],[`--mosaic-title-${columns}`,p.width*p.height>=4?'28px':p.width>=2?'21px':'16px']];
    })) as CSSProperties);
    const closeMarket = () => { document.querySelector('.app-shell')?.removeAttribute('inert'); location.hash = `#/home?tab=exchange&view=${mode}`; };
    return <section className={`exchange-view exchange-density-${settings.density}`} aria-label="House Exchange" data-view={mode} style={{ '--exchange-columns': settings.columns } as CSSProperties}><div className="exchange-heading"><div><h2>Explore the Houses.</h2></div><span className="exchange-preview-label">Fictional catalog · {houses.length} Houses</span></div><p className="exchange-sample-notice">Sample USD prices & scores · no issued coins or trading.</p>{warning && <p className="exchange-storage-warning" role="status">{warning}</p>}<div className="exchange-principal"><label className="exchange-search"><Search size={18}/><span className="sr-only">Search Houses or creators</span><input type="search" maxLength={200} placeholder="Search Houses, creators or symbols…" value={settings.query} onChange={e => update({ query: e.target.value })}/></label><div className="exchange-view-modes" role="group" aria-label="Exchange presentation"><button aria-pressed={mode === 'mosaic'} onClick={() => chooseMode('mosaic')}>House canvas</button><button aria-pressed={mode === 'comparison'} onClick={() => chooseMode('comparison')}>Comparison grid</button><span>{mode === 'mosaic' ? 'Canvas follows your selected sort, in reading order.' : 'Uniform cards for detailed comparison.'}</span></div></div><details className="exchange-advanced"><summary>Filters & sort <span>{settings.category} · {settings.sort === 'change' ? 'price change' : settings.sort === 'volume' ? 'volume' : 'valuation'}{settings.watchlistOnly ? ' · watchlist' : ''}</span></summary><div className="exchange-toolbar"><div className="exchange-category-filters" role="group" aria-label="House content category">{(['All', 'Video', 'Writing'] as const).map(category => <button key={category} aria-pressed={settings.category === category} onClick={() => update({ category })}>{category}</button>)}</div><label className="exchange-watchlist-filter"><input type="checkbox" checked={settings.watchlistOnly} onChange={e => update({ watchlistOnly: e.target.checked })}/>Watchlist ({settings.watchlist.length})</label><label className="exchange-sort">Sort by<select value={settings.sort} onChange={e => update({ sort: e.target.value as ExchangeSettings['sort'] })}><option value="change">Price change</option><option value="volume">Volume</option><option value="valuation">Valuation score</option></select></label><label>Order<select value={settings.direction} onChange={e => update({ direction: e.target.value as ExchangeSettings['direction'] })}><option value="desc">Highest first</option><option value="asc">Lowest first</option></select></label><label>Density<select value={settings.density} onChange={e => update({ density: e.target.value as ExchangeSettings['density'] })}><option value="compact">Compact</option><option value="comfortable">Comfortable</option></select></label>{mode === 'comparison' && <label className="exchange-columns">Comparison columns<select value={settings.columns} onChange={e => update({ columns: +e.target.value as 2 | 3 | 4 })}>{[2, 3, 4].map(n => <option key={n} value={n}>{n} columns</option>)}</select></label>}</div></details><div className="exchange-results"><span role="status">{shown.length} of {houses.length} Houses</span><small>Video and Writing include Houses offering both. USD amounts are samples.</small><button className="text-button" onClick={() => update({ query: '', category: 'All', watchlistOnly: false })}>Clear filters</button></div>{mode === 'mosaic' ? <div className="exchange-canvas" data-count={shown.length}>{shown.map((market,index) => <HouseMosaic style={mosaicStyles[index]} key={market.houseId} market={market} watched={settings.watchlist.includes(market.houseId)} onWatch={() => watch(market.houseId)}/>)}</div> : <div className="exchange-grid">{shown.map(market => <ExchangeCard key={market.houseId} market={market} watched={settings.watchlist.includes(market.houseId)} onWatch={() => watch(market.houseId)}/>)}</div>}{!shown.length && <div className="exchange-empty"><h3>No Houses match</h3><p>Change the search or filters. Add Houses using the star control to build your local Exchange watchlist.</p><button className="button outline" onClick={() => update({ query: '', category: 'All', watchlistOnly: false })}>Show all Houses</button></div>}{marketId && !selected && <p role="alert" className="exchange-storage-warning">That House market preview was not found. <a href="#/home?tab=exchange">Return to Exchange</a></p>}{selected && (typeof document === 'undefined' ? <MarketPreview key={selected.houseId} market={selected} onClose={closeMarket}/> : createPortal(<MarketPreview key={selected.houseId} market={selected} onClose={closeMarket}/>, document.body))}</section>;
}
