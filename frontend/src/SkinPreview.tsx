import type {ReactNode} from 'react';
import type {InterfaceDesign} from '../../contracts/src';
import {mediaDestinations} from './MediaCenterNav';
import {Image} from './components';
/** Preview chrome shares the live destination registry; content stays the real renderer. */
export default function SkinPreview({design,children}:{design:InterfaceDesign;children:ReactNode}){if(design.template!=='estuary')return <>{children}</>;return <div className="skin-preview-estuary"><div className="skin-preview-toolbar"><Image name="wordmark" alt="MUNK"/><span>Search · Settings · Account</span></div><div className="skin-preview-body"><aside aria-label="Navigation preview">{mediaDestinations.map(({id,label,icon:Icon})=><div key={id} className={id==='discover'?'selected':''}><Icon aria-hidden="true" size={18}/><span>{label}</span></div>)}</aside><div className="skin-preview-content"><h2>Discover</h2>{children}</div></div></div>;}
