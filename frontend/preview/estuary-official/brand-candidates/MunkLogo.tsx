import React from 'react';
import {symbolPath,wordmarkPath} from './geometry';
import './logo.css';
export function MunkLogo({variant='stacked',className=''}:{variant?:'symbol'|'wordmark'|'stacked'|'horizontal';className?:string}){return <svg className={'munk-logo '+className} viewBox={variant==='symbol'?'450 20 630 440':variant==='wordmark'?'460 465 620 128':variant==='horizontal'?'450 20 1570 440':'450 20 630 580'} role="img" aria-label="MUNK" fill="currentColor" fillRule="evenodd">{variant!=='wordmark'&&<g className="munk-logo-face"><path d={symbolPath}/></g>}{variant!=='symbol'&&<g transform={variant==='horizontal'?'translate(70 15) translate(1080 0) scale(1.35) translate(-460 -350)':undefined}><path d={wordmarkPath}/></g>}</svg>}
