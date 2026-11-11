import type {FastifyReply,FastifyRequest} from 'fastify';
import {MediaStore} from './store.js';
import {DomainError} from '../api/errors.js';
export async function deliverMedia(request:FastifyRequest,reply:FastifyReply,store:MediaStore,key:string,type='video/mp4'){
 let size:number;try{size=await store.size(key);}catch{throw new DomainError(503,'unavailable','Media file is temporarily unavailable.');}
 reply.type(type).header('accept-ranges','bytes').header('cache-control','no-store');
 const range=request.method==='GET'&&!request.headers['if-range']?request.headers.range:undefined;
 let start=0,end=size-1;
 if(range){
  const match=/^bytes=(\d*)-(\d*)$/.exec(range);
  const fail=()=>reply.code(416).header('content-range',`bytes */${size}`).header('content-length','0').send();
  if(!match||(!match[1]&&!match[2]))return fail();
  if(!match[1]){const suffix=Number(match[2]);if(!Number.isSafeInteger(suffix)||suffix<=0)return fail();start=Math.max(0,size-suffix);}
  else {start=Number(match[1]);if(match[2])end=Math.min(Number(match[2]),size-1);}
  if(!Number.isSafeInteger(start)||!Number.isSafeInteger(end)||start<0||start>=size||end<start)return fail();
  reply.code(206).header('content-range',`bytes ${start}-${end}/${size}`);
 }
 reply.header('content-length',String(end-start+1));
 // An empty Fastify payload rewrites Content-Length to zero. End HEAD at the
 // HTTP layer with the already-authorized file headers and no media read.
 if(request.method==='HEAD'){
  reply.hijack();
  for(const [name,value] of Object.entries(reply.getHeaders()))if(value!==undefined)reply.raw.setHeader(name,value);
  reply.raw.writeHead(reply.statusCode);reply.raw.end();return reply;
 }
 return reply.send(store.read(key,{start,end}));
}
