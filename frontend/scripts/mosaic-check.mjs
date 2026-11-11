import {frontendRoot,projectRoot,reviewRoot,artifactsRoot,viteEntry} from './paths.mjs';
import {build} from 'esbuild';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
await mkdir('.qa',{recursive:true});
await build({entryPoints:['src/mosaic-layout.ts'],outfile:'.qa/mosaic-layout.mjs',bundle:true,platform:'node',format:'esm'});
await build({entryPoints:['src/fixtures.ts'],outfile:'.qa/mosaic-fixtures.mjs',bundle:true,platform:'node',format:'esm'});
const {packMosaic}=await import('../.qa/mosaic-layout.mjs');const {houses}=await import('../.qa/mosaic-fixtures.mjs');
const ids=houses.map(h=>h.id),checks=[];
for(const columns of [2,4,6]){
 for(const order of [ids,[...ids].reverse(),ids.slice(0,1),ids.slice(2,9),[]]){
  const layout=packMosaic(order,columns);assert.deepEqual(layout,packMosaic(order,columns));assert.deepEqual(layout.map(p=>p.id),order);
  const occupied=new Set();let previous=-1;
  for(const p of layout){
   assert.ok(p.width>=1&&p.height>=1&&p.column>=1&&p.column+p.width-1<=columns);
   const anchor=(p.row-1)*columns+p.column-1;assert.ok(anchor>previous,'Visual reading order must match the sorted DOM');previous=anchor;
   for(let y=0;y<p.height;y++)for(let x=0;x<p.width;x++){const cell=(p.row-1+y)*columns+p.column-1+x;assert.ok(!occupied.has(cell),'Tiles must never overlap');occupied.add(cell);}
  }
  // All slots before the final tile's anchor are occupied, even with mixed spans.
  for(let cell=0;cell<previous;cell++)assert.ok(occupied.has(cell),'No internal holes before the final tile');
 }
 const layout=packMosaic(ids,columns),shapes=new Set(layout.map(p=>`${p.width}x${p.height}`));
 assert.ok(shapes.size>=3,`Expected scattered sizes at ${columns} columns, got ${[...shapes]}`);
 checks.push(`${columns}-column mosaic: varied sizes, stable packing, sort/DOM order, bounds, no overlaps or internal holes PASS`);
}
await mkdir('../artifacts',{recursive:true});await writeFile('../artifacts/mosaic-check.json',JSON.stringify({date:new Date().toISOString(),scope:'Pure packing geometry; not browser CSS/layout verification',checks},null,2));console.log(checks.join('\n'));
