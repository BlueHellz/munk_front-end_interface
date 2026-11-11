import{useAppearance}from'../appearance-preference';
import{interfaceTemplate,type InterfaceDesign}from'../../../contracts/src';import{defaultMode}from'./mode';
import{Search,Settings,UserCircle}from'lucide-react';import{MunkLogo}from'../brand/MunkLogo';import{defaultDestinations}from'./destinations';import{DefaultHome}from'../NavigationPages';
/** Real default Home content and destination registry, without invented catalog shelves. */
export default function DefaultPreview({design=interfaceTemplate('estuary','viewer')}:{design?:InterfaceDesign}){const{theme}=useAppearance();return <div className="default-skin-preview" data-default-mode={theme}><aside><MunkLogo variant="wordmark"/><div className="default-preview-utilities"><Search/><Settings/><UserCircle/></div><nav>{defaultDestinations.map(([label,,Icon])=><span key={label} className={label==='Home'?'selected':''}><Icon/>{label}</span>)}</nav></aside><div><DefaultHome/></div></div>;}
