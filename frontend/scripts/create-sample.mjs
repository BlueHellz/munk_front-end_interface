import {frontendRoot,projectRoot,reviewRoot,artifactsRoot,viteEntry} from './paths.mjs';
// Original procedural sample animation. All generated pixels and captions are CC0.
// No reference photographs, third-party footage or audio are encoded in this clip.
import {createRequire} from 'node:module';
const sharp=createRequire(import.meta.url)(process.env.SHARP_MODULE||'sharp');
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {mkdir,writeFile} from 'node:fs/promises';
await mkdir('public/media',{recursive:true});
const binary=process.env.FFMPEG_PATH||'ffmpeg';
const width=480,height=270,fps=6,seconds=8;
const ff=spawn(binary,['-y','-f','image2pipe','-vcodec','mjpeg','-r',String(fps),'-i','pipe:0','-an','-c:v','libvpx','-pix_fmt','yuv420p','-b:v','220k','public/media/munk-sample.webm'],{stdio:['pipe','ignore','pipe']});
let error='';ff.stdin.on('error',()=>{});ff.stderr.on('data',d=>error+=d);ff.on('error',e=>{console.error(e.message);process.exitCode=1;});
for(let frame=0;frame<fps*seconds;frame++){
 const b=Buffer.alloc(width*height*3);const sunX=80+frame*.8;
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  const i=(y*width+x)*3;const t=y/height;
  let r=240-t*100,g=192-t*74,blue=157-t*40;
  if((x-sunX)**2+(y-76)**2<19**2){r=255;g=226;blue=164;}
  if(y>153+Math.sin(x*.018)*34+Math.sin(x*.036)*18){r=80;g=98;blue=119;}
  if(y>205+Math.sin(x*.025+.8)*30){r=35;g=61;blue=77;}
  if(y>249+Math.sin(x*.021+1.7)*20){r=19;g=39;blue=48;}
  b[i]=r;b[i+1]=g;b[i+2]=blue;
 }
 if(!ff.stdin.write(await sharp(b,{raw:{width,height,channels:3}}).jpeg({quality:85}).toBuffer()))await once(ff.stdin,'drain');
}
ff.stdin.end();const [code]=await once(ff,'close');if(code!==0)throw new Error(error);
await writeFile('public/media/sample.vtt','WEBVTT\n\n00:00.000 --> 00:04.000\nOriginal silent sample: sunrise over illustrated mountains.\n\n00:04.000 --> 00:08.000\nLocal media playback test. No creator footage is supplied.\n');
console.log('Generated original 8-second silent VP8/WebM sample.');
