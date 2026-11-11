import type{Appearance}from'../domain/appearance.js';import{appearanceInputSchema,type ThemeMode}from'../../../contracts/src/appearance.js';
import type{Community}from'../domain/community.js';
import{profileInputSchema,textInputSchema,messageInputSchema,uuidParamsSchema}from'../../../contracts/src/community.js';
import type { FastifyInstance, FastifyRequest } from 'fastify';
import {demoHouseSchema,type DemoHouseInput,type ProductMode} from '../../../contracts/src/creator.js';
import type { HouseDraftInput, HouseDraftPatch } from '../../../contracts/src/foundation.js';
import { houseDraftSchema, houseDraftPatchSchema } from '../../../contracts/src/foundation.js';
import { admissionInputSchema, allocateUploadSchema, idParamsSchema, reviewInputSchema, type AdmissionInput, type AllocateUploadInput, type ReviewInput } from '../../../contracts/src/creator.js';
import type { Actor } from '../domain/access.js';
import type { Houses } from '../domain/houses.js';
import type { Uploads } from '../domain/uploads.js';
import {Interfaces} from '../domain/interfaces.js';
import {interfaceSaveSchema,type InterfaceDesign} from '../../../contracts/src/interface.js';
import type {Videos} from '../domain/videos.js';
import {videoInputSchema,publicationInputSchema,type VideoInput} from '../../../contracts/src/video.js';
import {deliverMedia} from '../media/delivery.js';
import type { Admissions } from '../domain/admissions.js';
import { DomainError, invalid } from './errors.js';
import { Sessions, sessionCookieName } from '../auth/sessions.js';

declare module 'fastify' { interface FastifyRequest { munkActor: Actor | null } }
async function authenticatedActor(request: FastifyRequest): Promise<Actor> {
  if (!request.munkActor) throw new DomainError(401, 'unauthenticated', 'Sign in to MUNK to continue.');
  return request.munkActor;
}
export type CreatorServices = { appearance?:Appearance; community?:Community; houses: Houses; uploads: Uploads; admissions: Admissions; videos?:Videos; interfaces?:Interfaces };
export async function protectedRoutes(app: FastifyInstance, services?: CreatorServices, sessions?: Sessions,mode:ProductMode='strict') {
  app.decorateRequest('munkActor', null);
  app.addHook('onRequest', async request => {
    if (!sessions) throw new DomainError(401, 'unauthenticated', 'Authentication is not configured.');
    const header = request.headers['x-csrf-token'];
    request.munkActor = await sessions.authenticate(request.cookies[sessionCookieName], typeof header === 'string' ? header : undefined, !['GET','HEAD','OPTIONS'].includes(request.method));
  });
  const required = () => {
    if (!services) throw new DomainError(503, 'unavailable', 'Creator services are unavailable.');
    return services;
  };
  const appearance=()=>{const v=required().appearance;if(!v)throw new DomainError(503,'unavailable','Appearance storage is unavailable.');return v;};
  app.get('/api/me/appearance',async q=>appearance().get(await authenticatedActor(q)));
  app.put<{Body:{theme:ThemeMode}}>('/api/me/appearance',{schema:{body:appearanceInputSchema}},async q=>appearance().save(await authenticatedActor(q),q.body.theme));
  const community=()=>{const v=required().community;if(!v)throw new DomainError(503,'unavailable','Community services are unavailable.');return v;};
  app.get('/api/me/profile',async q=>community().ownProfile(await authenticatedActor(q)));
  app.put<{Body:{handle:string;displayName:string;bio:string}}>('/api/me/profile',{schema:{body:profileInputSchema}},async q=>community().saveProfile(await authenticatedActor(q),q.body));
  app.get('/api/me/subscriptions',async q=>community().houses(await authenticatedActor(q)));
  app.put<{Params:{id:string}}>('/api/houses/:id/subscription',{schema:{params:uuidParamsSchema}},async q=>community().subscribe(await authenticatedActor(q),q.params.id,true));
  app.delete<{Params:{id:string}}>('/api/houses/:id/subscription',{schema:{params:uuidParamsSchema}},async q=>community().subscribe(await authenticatedActor(q),q.params.id,false));
  app.get<{Querystring:{house?:string}}>('/api/board',{schema:{querystring:{type:'object',additionalProperties:false,properties:{house:{type:'string',format:'uuid'}}}}},async q=>community().feed(await authenticatedActor(q),q.query.house));
  app.post<{Params:{id:string};Body:{body:string;clientId:string}}>('/api/houses/:id/posts',{schema:{params:uuidParamsSchema,body:textInputSchema}},async q=>community().createPost(await authenticatedActor(q),q.params.id,q.body));
  app.get<{Params:{id:string}}>('/api/posts/:id/replies',{schema:{params:uuidParamsSchema}},q=>community().replies(q.params.id));
  app.post<{Params:{id:string};Body:{body:string;clientId:string}}>('/api/posts/:id/replies',{schema:{params:uuidParamsSchema,body:textInputSchema}},async q=>community().reply(await authenticatedActor(q),q.params.id,q.body));
  app.get('/api/messages',async q=>community().conversations(await authenticatedActor(q)));
  app.get<{Params:{id:string}}>('/api/messages/:id',{schema:{params:uuidParamsSchema}},async q=>community().messages(await authenticatedActor(q),q.params.id));
  app.post<{Body:{recipientId:string;body:string;clientId:string}}>('/api/messages',{schema:{body:messageInputSchema}},async q=>community().send(await authenticatedActor(q),q.body));
  app.post<{Body:DemoHouseInput}>('/api/demo/houses',{schema:{body:demoHouseSchema}},async request=>{
    if(mode!=='demo')throw new DomainError(403,'forbidden','Demo creation is disabled in strict mode.');
    const key=request.headers['idempotency-key'];if(typeof key!=='string')return invalid('An idempotency key is required.');
    return required().houses.createDemo(await authenticatedActor(request),request.body,key);
  });
  app.addHook('preValidation',async request=>{const route=request.routeOptions.url||'';if(mode==='demo'&&(/\/admission$/.test(route)||route.startsWith('/api/reviews')))throw new DomainError(409,'conflict','Manual creator review is not part of local Demo mode. No network admission is granted.');});
  const videos=()=>{const v=required().videos;if(!v)throw new DomainError(503,'unavailable','Video publication is unavailable.');return v;};
  app.get<{Params:{id:string}}>('/api/houses/:id/videos',{schema:{params:idParamsSchema}},async request=>videos().list(await authenticatedActor(request),request.params.id));
  app.post<{Params:{id:string};Body:VideoInput}>('/api/houses/:id/videos',{schema:{params:idParamsSchema,body:videoInputSchema}},async request=>videos().save(await authenticatedActor(request),request.params.id,request.body));
  app.get<{Params:{id:string}}>('/api/videos/:id',{schema:{params:idParamsSchema}},async request=>videos().get(await authenticatedActor(request),request.params.id));
  app.post<{Params:{id:string};Body:{version:number}}>('/api/videos/:id/publish',{schema:{params:idParamsSchema,body:publicationInputSchema}},async request=>videos().publish(await authenticatedActor(request),request.params.id,request.body.version));
  app.post<{Params:{id:string};Body:{version:number}}>('/api/videos/:id/unpublish',{schema:{params:idParamsSchema,body:publicationInputSchema}},async request=>videos().unpublish(await authenticatedActor(request),request.params.id,request.body.version));
  const interfaces=()=>{const v=required().interfaces;if(!v)throw new DomainError(503,'unavailable','Interface storage is unavailable.');return v;};
  app.get('/api/me/interface',async request=>interfaces().get(await authenticatedActor(request)));
  app.put<{Body:{revision:number;design:InterfaceDesign}}>('/api/me/interface',{schema:{body:interfaceSaveSchema}},async request=>interfaces().save(await authenticatedActor(request),request.body));
  app.get<{Params:{id:string}}>('/api/houses/:id/interface',{schema:{params:idParamsSchema}},async request=>interfaces().get(await authenticatedActor(request),request.params.id));
  app.put<{Params:{id:string};Body:{revision:number;design:InterfaceDesign}}>('/api/houses/:id/interface',{schema:{params:idParamsSchema,body:interfaceSaveSchema}},async request=>interfaces().save(await authenticatedActor(request),request.body,request.params.id));
  app.get<{Params:{id:string}}>('/api/houses/:id/interface-content',{schema:{params:idParamsSchema}},async request=>{await interfaces().get(await authenticatedActor(request),request.params.id);return videos().houseCatalog(request.params.id);});
  app.get('/api/me/houses', async request => required().houses.list(await authenticatedActor(request)));
  app.post<{ Body: HouseDraftInput }>('/api/houses', { schema: { body: houseDraftSchema } }, async request => {
    const key = request.headers['idempotency-key'];
    if (typeof key !== 'string') return invalid('An idempotency key is required.');
    return required().houses.create(await authenticatedActor(request), request.body, key);
  });
  app.get<{ Params: { id: string } }>('/api/houses/:id/draft', { schema: { params: idParamsSchema } }, async request => required().houses.get(await authenticatedActor(request), request.params.id));
  app.patch<{ Params: { id: string }; Body: HouseDraftPatch & {address?:string} }>('/api/houses/:id/draft', { schema: { params: idParamsSchema, body: mode==='demo'?{...houseDraftPatchSchema,properties:{...houseDraftPatchSchema.properties,address:{type:'string',pattern:'^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$'}}}:houseDraftPatchSchema } }, async request => required().houses.update(await authenticatedActor(request), request.params.id, request.body));
  app.post<{ Params: { id: string }; Body: AllocateUploadInput }>('/api/houses/:id/uploads', { schema: { params: idParamsSchema, body: allocateUploadSchema } }, async request => required().uploads.allocate(await authenticatedActor(request), request.params.id, request.body));
  app.get<{ Params: { id: string } }>('/api/uploads/:id', { schema: { params: idParamsSchema } }, async request => required().uploads.status(await authenticatedActor(request), request.params.id));
  app.get<{ Params: { id: string } }>('/api/houses/:id/uploads', { schema: { params: idParamsSchema } }, async request => required().uploads.list(await authenticatedActor(request), request.params.id));
  app.get<{ Params: { id: string } }>('/api/uploads/:id/playback', { schema: { params: idParamsSchema } }, async (request, reply) => {
    const key = await required().uploads.playbackKey(await authenticatedActor(request), request.params.id);
    return deliverMedia(request,reply,required().uploads.store,key);
  });
  app.delete<{ Params: { id: string } }>('/api/uploads/:id', { schema: { params: idParamsSchema } }, async request => required().uploads.cancel(await authenticatedActor(request), request.params.id));
  app.post<{ Params: { id: string } }>('/api/uploads/:id/retry-processing', { schema: { params: idParamsSchema } }, async request => required().uploads.retryProcessing(await authenticatedActor(request), request.params.id));
  // Streaming parser is scoped to these protected routes and returns the stream,
  // without buffering it. The service enforces the declared allocation size.
  app.addContentTypeParser('application/octet-stream', (_request, stream, done) => done(null, stream));
  app.put<{ Params: { id: string } }>('/api/uploads/:id/content', { schema: { params: idParamsSchema }, bodyLimit: 2147483648 }, async request => {
    const controller = new AbortController();
    const abort = () => controller.abort(); request.raw.once('aborted', abort);
    try { return await required().uploads.receive(await authenticatedActor(request), request.params.id, request.body as import('node:stream').Readable, controller.signal); }
    finally { request.raw.removeListener('aborted', abort); }
  });
  app.post<{ Params: { id: string }; Body: AdmissionInput }>('/api/houses/:id/admission', { schema: { params: idParamsSchema, body: admissionInputSchema } }, async request => required().admissions.submit(await authenticatedActor(request), request.params.id, request.body));
  app.get('/api/reviews', async request => required().admissions.queue(await authenticatedActor(request)));
  app.post<{ Params: { id: string }; Body: ReviewInput }>('/api/reviews/:id/decisions', { schema: { params: idParamsSchema, body: reviewInputSchema } }, async request => required().admissions.decide(await authenticatedActor(request), request.params.id, request.body));
  app.get<{ Params: { id: string } }>('/api/reviews/:id/introduction', { schema: { params: idParamsSchema } }, async (request, reply) => {
    const key = await required().admissions.previewKey(await authenticatedActor(request), request.params.id);
    return deliverMedia(request,reply,required().uploads.store,key);
  });
}
