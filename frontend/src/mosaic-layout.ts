/** Stable irregular sizes, packed in top-left reading order rather than dense CSS
 * backfilling. A House keeps its preferred shape through search/sort changes.
 * Packing may shrink it to fit a remaining slot; no item jumps ahead in the DOM. */
export type MosaicPlacement = {id:string;column:number;row:number;width:number;height:number};
function fingerprint(id:string):number {
 let value=2166136261;
 for(const character of id)value=Math.imul(value^character.charCodeAt(0),16777619);
 value^=value>>>16;value=Math.imul(value,0x7feb352d);value^=value>>>15;
 return value>>>0;
}
export function packMosaic(ids:readonly string[],columns:2|4|6):MosaicPlacement[] {
 const occupied=new Set<number>();
 const shapes=columns===2?[[1,1],[2,1],[1,2],[2,2],[1,1]]:[[1,1],[2,1],[1,2],[2,2],[3,2],[2,3],[1,1]];
 const result:MosaicPlacement[]=[];
 for(const id of ids){
  let anchor=0;
  while(occupied.has(anchor))anchor++;
  const row=Math.floor(anchor/columns),column=anchor%columns;
  const [preferredWidth,preferredHeight]=shapes[fingerprint(id)%shapes.length];
  let width=Math.min(preferredWidth,columns-column),height=preferredHeight;
  const fits=(w:number,h:number)=>{for(let y=row;y<row+h;y++)for(let x=column;x<column+w;x++)if(occupied.has(y*columns+x))return false;return true;};
  while(!fits(width,height)){if(width>1)width--;else height--;}
  for(let y=row;y<row+height;y++)for(let x=column;x<column+width;x++)occupied.add(y*columns+x);
  result.push({id,column:column+1,row:row+1,width,height});
 }
 // Remove empty space below the last reading-order row in short/filtered lists.
 const lastRow=result.at(-1)?.row??0;
 return result.map(item=>({...item,height:Math.min(item.height,lastRow-item.row+1)}));
}
