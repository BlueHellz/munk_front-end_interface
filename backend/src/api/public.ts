import type{Community}from'../domain/community.js';
import type {FastifyInstance} from 'fastify';
import type {Interfaces} from '../domain/interfaces.js';
import type {Videos} from '../domain/videos.js';
import {DomainError} from './errors.js';
import {idParamsSchema} from '../../../contracts/src/creator.js';
import {deliverMedia} from '../media/delivery.js';
export async function publicRoutes(app:FastifyInstance,videos?:Videos,interfaces?:Interfaces,community?:Community){
 const social=()=>{if(!community)throw new DomainError(503,'unavailable','Community services are unavailable.');return community;};
 app.get('/api/public/houses',()=>social().houses());
 app.get<{Querystring:{q?:string}}>('/api/public/profiles',{schema:{querystring:{type:'object',additionalProperties:false,properties:{q:{type:'string',maxLength:80}}}}},q=>social().profiles(q.query.q||''));
 app.get<{Params:{handle:string}}>('/api/public/profiles/:handle',{schema:{params:{type:'object',required:['handle'],properties:{handle:{type:'string',pattern:'^[a-z][a-z0-9-]{2,29}$'}}}}},q=>social().publicProfile(q.params.handle));
 const required=()=>{if(!videos)throw new DomainError(503,'unavailable','Video publication is unavailable.');return videos;};
 const addressParams={type:'object',additionalProperties:false,required:['address'],properties:{address:{type:'string',pattern:'^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$'}}};
 app.get<{Params:{address:string}}>('/api/public/houses/:address/introduction',{schema:{params:addressParams}},async(request,reply)=>{const v=required();return deliverMedia(request,reply,v.store,await v.introductionKey(request.params.address));});
 app.get('/api/public/catalog',()=>required().catalog());
 app.get<{Params:{address:string}}>('/api/public/houses/:address/interface',{schema:{params:addressParams}},async request=>{const data=await required().publicHouse(request.params.address);if(!interfaces)throw new DomainError(503,'unavailable','Interface storage is unavailable.');return interfaces.publicHouse(data.house.id);});
 app.get<{Params:{id:string}}>('/api/public/videos/:id',{schema:{params:idParamsSchema}},request=>required().publicVideo(request.params.id));
 app.get<{Params:{address:string}}>('/api/public/houses/:address',{schema:{params:addressParams}},request=>required().publicHouse(request.params.address));
 app.get<{Params:{id:string}}>('/api/public/videos/:id/media',{schema:{params:idParamsSchema}},async(request,reply)=>{const v=required();return deliverMedia(request,reply,v.store,await v.mediaKey(request.params.id));});
 app.get<{Params:{id:string}}>('/api/public/videos/:id/poster',{schema:{params:idParamsSchema}},async(request,reply)=>{const v=required();return deliverMedia(request,reply,v.store,await v.mediaKey(request.params.id,true),'image/jpeg');});
}
