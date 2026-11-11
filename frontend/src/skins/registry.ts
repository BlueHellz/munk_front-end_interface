import type{InterfaceDesign}from'../../../contracts/src';
/** Authoritative viewer identities. Legacy templates are compatibility loaders,
 * never aliases for the new Cinema/SiLVO/AH2 presentations. */
export type ViewerSkin={id:string;name:string;description:string;free:true;status:string;available?:boolean;loader:'default'|'browse'|'cinema'|'silvo'|'ah2'|null;template:InterfaceDesign['template']|null;previewUrl?:string};
export const viewerSkinRegistry:readonly ViewerSkin[]=[
 {id:'default',name:'MUNK default',description:'The original quiet fresh-launch interface. Default and recovery presentation.',free:true,status:'Integrated · default / recovery',loader:'default',template:'estuary'},
 {id:'browse',name:'MUNK Browse',description:'Prominent search, compact navigation and landscape video grids across all Houses.',free:true,status:'Integrated · free to use',loader:'browse',template:'browse'},
 {id:'cinema',name:'MUNK Cinema',description:'The repaired Cinema presentation: slim navigation rail, layered surfaces, centred MUNK face and cinematic playback.',free:true,status:'Integrated · free to use',available:true,loader:'cinema',template:'cinema-viewer'},
 {id:'silvo',name:'SiLVO-inspired',description:'Artwork-led browsing, horizontal navigation and selected-work filmstrips. Real Houses and shared Catalogue.',free:true,status:'Integrated · free to use',available:true,loader:'silvo',template:'silvo-viewer'},
 {id:'ah2',name:'Arctic Horizon 2-inspired',description:'Layered House discovery, horizontal navigation and landscape Catalogue widgets using the same MUNK services.',free:true,status:'Integrated · free to use',available:true,loader:'ah2',template:'ah2-viewer'}
];
const legacyNames:Record<string,string>={discovery:'Discovery (saved legacy configuration)',cinema:'Cinema (saved legacy configuration)',compact:'Compact (saved legacy configuration)'};
export function viewerPresentation(design:InterfaceDesign){const entry=design.scope==='viewer'?viewerSkinRegistry.find(s=>s.loader&&s.template===design.template):undefined;return entry?{kind:entry.loader!,name:entry.name,entry}: {kind:'legacy' as const,name:legacyNames[design.template]||'Saved configuration',entry:null};}
export const skinById=(id:string)=>viewerSkinRegistry.find(s=>s.id===id);
export const canUseSkin=(skin:ViewerSkin|undefined):skin is ViewerSkin&{loader:'default'|'browse'|'cinema'|'silvo'|'ah2';template:InterfaceDesign['template']}=>!!skin?.loader&&!!skin.template&&skin.available!==false;

export function supportedViewerTemplate(template:string){return viewerSkinRegistry.some(s=>s.loader&&s.template===template)||Object.hasOwn(legacyNames,template);}
