import { apiClient } from './api';
import type { HouseRecord, UploadStatus, HouseDraftInput, HouseDraftPatch, ServiceResult,DemoHouseInput,ProductMode } from '../../contracts/src';
const object = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object';
export const isHouse = (v: unknown): v is HouseRecord => object(v) && typeof v.id === 'string' && typeof v.address === 'string' && typeof v.name === 'string' && typeof v.description === 'string' && typeof v.publicName === 'string' && typeof v.focus==='string' && Number.isInteger(v.version) && Number.isInteger(v.admissionRevision) && ['draft','pending_review','admitted','changes_requested','rejected'].includes(v.admissionStatus as string);
export const isUpload = (v: unknown): v is UploadStatus => object(v) && typeof v.assetId === 'string' && typeof v.uploadId === 'string' && ['video','introduction'].includes(v.purpose as string) && typeof v.state === 'string' && Number.isSafeInteger(v.uploadedBytes) && Number.isSafeInteger(v.totalBytes) && (v.durationMs === null || typeof v.durationMs === 'number') && (v.errorCode === null || typeof v.errorCode === 'string');
export async function unwrap<T>(result: Promise<ServiceResult<T>>): Promise<T> { const value = await result; if (!value.ok) throw Object.assign(Error(value.message),{code:value.code,fieldErrors:value.fieldErrors,requestId:value.requestId}); return value.value; }
export const serverCreator = {
  mode:()=>unwrap(apiClient.request('/config',(v):v is {mode:ProductMode;publicPublishing:boolean}=>object(v)&&['strict','demo'].includes(v.mode as string)&&typeof v.publicPublishing==='boolean')),
  createDemo:(input:DemoHouseInput,key:string)=>unwrap(apiClient.request('/demo/houses',isHouse,{method:'POST',headers:{'Content-Type':'application/json','Idempotency-Key':key},body:JSON.stringify(input)})),
  updateDemo:(id:string,input:HouseDraftPatch & {address?:string})=>unwrap(apiClient.request(`/houses/${id}/draft`,isHouse,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify(input)})),
  houses: () => unwrap(apiClient.request('/me/houses', (v): v is HouseRecord[] => Array.isArray(v) && v.every(h=>isHouse(h)&&['owner','publisher'].includes(h.membershipRole||'')))),
  house: (id: string) => unwrap(apiClient.request(`/houses/${id}/draft`, isHouse)),
  create: (input: HouseDraftInput, key: string) => unwrap(apiClient.request('/houses', isHouse, { method:'POST',headers:{'Content-Type':'application/json','Idempotency-Key':key},body:JSON.stringify(input) })),
  update: (id: string, input: HouseDraftPatch) => {
    // Address is immutable. Whitelist the wire fields even if a caller passes
    // a wider object at runtime; Fastify rejects additional properties.
    const {name,description,publicName,focus,version}=input;
    return unwrap(apiClient.request(`/houses/${id}/draft`, isHouse, {method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({name,description,publicName,focus,version})}));
  },
  uploads: (house: string) => unwrap(apiClient.request(`/houses/${house}/uploads`, (v): v is UploadStatus[] => Array.isArray(v) && v.every(isUpload))),
  status: (id: string, signal?: AbortSignal) => unwrap(apiClient.request(`/uploads/${id}`, isUpload,{signal})),
  allocate: (house: string, file: File, signal: AbortSignal) => unwrap(apiClient.request(`/houses/${house}/uploads`, isUpload,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({purpose:'video',size:file.size}),signal})),
  receive: (id: string, file: File, signal: AbortSignal) => unwrap(apiClient.request(`/uploads/${id}/content`,isUpload,{method:'PUT',headers:{'Content-Type':'application/octet-stream'},body:file,signal})),
  async upload(house: string, file: File, purpose: 'introduction'|'video', signal: AbortSignal) {
    const allocation = await unwrap(apiClient.request(`/houses/${house}/uploads`, isUpload,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({purpose,size:file.size}),signal}));
    return unwrap(apiClient.request(`/uploads/${allocation.uploadId}/content`,isUpload,{method:'PUT',headers:{'Content-Type':'application/octet-stream'},body:file,signal}));
  },
  retry: (id: string) => unwrap(apiClient.request(`/uploads/${id}/retry-processing`,isUpload,{method:'POST'})),
  async submit(house: HouseRecord, asset: string, signal: AbortSignal) {
    return unwrap(apiClient.request(`/houses/${house.id}/admission`, (v): v is {submissionId:string} => object(v)&&typeof v.submissionId==='string', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({version:house.version,introductionAssetId:asset,faceVisible:true,publicConsent:true}),signal}));
  },
};
