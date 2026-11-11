import type {CSSProperties} from 'react';
import { Star, ArrowUpRight } from 'lucide-react';
import { houseById } from './fixtures';
import { Art } from './Discovery';
import { marketPrice, marketChange, type MarketFixture } from './exchange-model';
export default function HouseMosaic({ market, watched, onWatch, style }: {
    style?: CSSProperties;
    market: MarketFixture;
    watched: boolean;
    onWatch: () => void;
}) { const h = houseById(market.houseId)!; const change = marketChange(market); return <article className="house-mosaic-tile" style={style} data-house-id={h.id}><a className="mosaic-house-entry" href={`#/houses/${h.id}`} aria-label={`Enter ${h.name} by ${h.creator.name}`}><Art name={h.id} className="house-mosaic-art"/></a><div className="mosaic-shade"/><span className="mosaic-sample">Fictional House</span><button className="exchange-watch" aria-label={`${watched ? 'Remove' : 'Add'} ${h.name} ${watched ? 'from' : 'to'} Exchange watchlist`} aria-pressed={watched} onClick={onWatch}><Star size={18} fill={watched ? 'currentColor' : 'none'}/></button><div className="mosaic-content"><span className="mosaic-symbol">{market.symbol} <span>· sample symbol</span></span><div className="mosaic-house-name"><h3>{h.name}</h3></div><p className="mosaic-creator">{h.creator.name}</p><div className="mosaic-price"><strong><span className="sr-only">Fictional sample price </span>${marketPrice(market).toFixed(2)}</strong><span className={change >= 0 ? 'mosaic-gain' : 'mosaic-loss'}>{change >= 0 ? '+' : ''}{change.toFixed(2)}% <small>sample 24h</small></span></div><footer className="mosaic-actions"><a className="mosaic-market-link" aria-label={`${h.name} · fictional market preview`} title="Fictional market preview" href={`#/home?tab=exchange&view=mosaic&market=${h.id}`}><span className="mosaic-market-label">Market preview</span><ArrowUpRight size={13}/></a></footer></div></article>; }
