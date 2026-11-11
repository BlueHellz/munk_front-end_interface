/** Browser/server-neutral wire types. No credentials, framework code or Node imports. */
export * from './foundation.js';
export * from './creator.js';
export * from './auth.js';
export type ServiceErrorCode = 'unavailable' | 'permission' | 'validation' | 'network' | 'cancelled';
export type ServiceResult<T> = {ok:true;value:T} | {ok:false;code:ServiceErrorCode;message:string;retryable:boolean;fieldErrors?:Record<string,string>;requestId?:string};
export type UploadReceipt = {
 assetId:string;
 state:'uploading'|'processing'|'ready'|'failed';
 uploadedBytes:number;
 totalBytes:number;
 resumeToken?:string;
 playbackUrl?:string;
};
// Standard JSON Schema objects can be consumed by either a browser or a future API.
export const serviceErrorSchema={type:'object',required:['ok','code','message','retryable'],additionalProperties:false,properties:{ok:{const:false},code:{enum:['unavailable','permission','validation','network','cancelled']},message:{type:'string'},retryable:{type:'boolean'},fieldErrors:{type:'object',additionalProperties:{type:'string'}},requestId:{type:'string'}}} as const;
export const uploadReceiptSchema={type:'object',required:['assetId','state','uploadedBytes','totalBytes'],additionalProperties:false,properties:{assetId:{type:'string',minLength:1},state:{enum:['uploading','processing','ready','failed']},uploadedBytes:{type:'integer',minimum:0},totalBytes:{type:'integer',minimum:0},resumeToken:{type:'string'},playbackUrl:{type:'string'}}} as const;
const record=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v);
export function isServiceError(value:unknown):value is Extract<ServiceResult<never>,{ok:false}>{return record(value)&&Object.keys(value).every(k=>['ok','code','message','retryable','fieldErrors','requestId'].includes(k))&&value.ok===false&&['unavailable','permission','validation','network','cancelled'].includes(value.code as string)&&typeof value.message==='string'&&typeof value.retryable==='boolean'&&(value.requestId===undefined||typeof value.requestId==='string')&&(value.fieldErrors===undefined||(record(value.fieldErrors)&&Object.values(value.fieldErrors).every(v=>typeof v==='string')));}
export function isUploadReceipt(value:unknown):value is UploadReceipt {
 return record(value)&&Object.keys(value).every(k=>['assetId','state','uploadedBytes','totalBytes','resumeToken','playbackUrl'].includes(k))&&typeof value.assetId==='string'&&value.assetId.length>0&&['uploading','processing','ready','failed'].includes(value.state as string)&&Number.isSafeInteger(value.uploadedBytes)&&Number.isSafeInteger(value.totalBytes)&&(value.uploadedBytes as number)>=0&&(value.totalBytes as number)>=0&&(value.uploadedBytes as number)<=(value.totalBytes as number)&&(value.resumeToken===undefined||typeof value.resumeToken==='string')&&(value.playbackUrl===undefined||typeof value.playbackUrl==='string');
}

export * from './video.js';
export * from './interface.js';
export * from './community.js';
export * from './appearance.js';
