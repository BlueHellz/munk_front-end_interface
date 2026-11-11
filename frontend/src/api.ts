import {isServiceError,isApiError,type ServiceResult} from '../../contracts/src';
let csrfToken='';
let expired: (()=>void)|undefined;
export function setApiSession(token:string,onExpired?:()=>void){csrfToken=token;expired=onExpired;}
/** All future HTTP service adapters use this boundary. Current preview services
 * remain explicitly unavailable; constructing this client performs no requests. */
export function createApiClient(baseUrl:string,fetcher:typeof fetch=(...args)=>fetch(...args)) {
 const base=baseUrl.trim().replace(/\/+$/,'');
 if(!base||(!/^https?:\/\//i.test(base)&&!/^\/(?!\/)/.test(base)))throw Error('API base must be an HTTP(S) URL or an absolute same-origin path such as /api.');
 if(/^https?:/i.test(base)){const url=new URL(base);if(url.username||url.password||url.search||url.hash)throw Error('API base must not contain credentials, query strings or fragments.');}
 else if(/[?#]/.test(base))throw Error('API base must not contain a query string or fragment.');
 const url=(path:string)=>{if(!/^\/(?!\/)/.test(path)||path.split(/[?#]/)[0].split('/').some(p=>{try{return decodeURIComponent(p)==='..'||decodeURIComponent(p).includes('\\');}catch{return true;}}))throw Error('Use a resource path beginning with one slash, without traversal.');return base+path;};
 const request=async<T>(path:string,validate:(value:unknown)=>value is T,options:RequestInit={}):Promise<ServiceResult<T>>=>{
  try {
   const response=await fetcher(url(path),{...options,credentials:'include',headers:{Accept:'application/json',...(csrfToken?{'X-CSRF-Token':csrfToken}:{}),...options.headers}});
   const data:unknown=await response.json();
   if(!response.ok){if(response.status===401&&!path.startsWith('/auth/'))expired?.();if(isServiceError(data))return data;if(isApiError(data))return {ok:false,code:response.status===401||response.status===403||(response.status===404&&/^\/(houses|uploads)\//.test(path))?'permission':data.code==='validation'?'validation':data.code==='unavailable'?'unavailable':'network',message:data.message,retryable:data.retryable,...(data.fieldErrors?{fieldErrors:data.fieldErrors}:{}),requestId:data.requestId};return {ok:false,code:response.status===401||response.status===403||(response.status===404&&/^\/(houses|uploads)\//.test(path))?'permission':'network',message:`API request failed (${response.status}).`,retryable:response.status>=500};}
   if(!validate(data))return {ok:false,code:'validation',message:'The API returned an invalid response.',retryable:false};
   return {ok:true,value:data};
  }catch(error){return {ok:false,code:options.signal?.aborted?'cancelled':'network',message:error instanceof Error?error.message:'API request failed.',retryable:!options.signal?.aborted};}
 };
 return {baseUrl:base,url,request};
}
export const apiClient=createApiClient(import.meta.env?.VITE_API_BASE_URL||'/api');
