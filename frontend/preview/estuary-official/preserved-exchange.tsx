// Visual-checkpoint adapter. Original tiles, packing, data and CSS are reused.
// No viewer design input, authentication, persistence or financial services.
import type {CSSProperties} from 'react';
import HouseMosaic from '../../src/HouseMosaic';
import {compareHouses,defaultExchange} from '../../src/exchange-model';
import {packMosaic} from '../../src/mosaic-layout';
import '../../src/exchange.css';
const shown=compareHouses(defaultExchange);
const layouts=([2,4,6] as const).map(columns=>({columns,placements:packMosaic(shown.map(m=>m.houseId),columns)}));
const styles=shown.map((_,index)=>Object.fromEntries(layouts.flatMap(({columns,placements})=>{const p=placements[index];return [[`--mosaic-column-${columns}`,p.column],[`--mosaic-row-${columns}`,p.row],[`--mosaic-width-${columns}`,p.width],[`--mosaic-height-${columns}`,p.height],[`--mosaic-title-${columns}`,p.width*p.height>=4?'28px':p.width>=2?'21px':'16px']];})) as CSSProperties);
export default function PreservedExchange({onPreviewAction}:{onPreviewAction:(label:string)=>void}){return <section className="exchange-view exchange-density-compact" data-view="mosaic" aria-label="House Exchange" onClickCapture={e=>{if((e.target as Element).closest('a')){e.preventDefault();onPreviewAction('Illustrative House preview');}}}>
 <div className="exchange-heading"><div><h2>Explore the Houses.</h2></div><span className="exchange-preview-label">Fictional catalog · {shown.length} Houses</span></div>
 <p className="exchange-sample-notice"><strong>Illustrative market figures.</strong> Sample USD prices and scores · Trading unavailable.</p>
 <div className="exchange-canvas" data-count={shown.length}>{shown.map((market,index)=><HouseMosaic key={market.houseId} market={market} style={styles[index]} watched={false} onWatch={()=>onPreviewAction('Exchange watchlist')}/>)}</div>
 </section>;}
