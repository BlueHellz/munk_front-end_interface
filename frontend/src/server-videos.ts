import {apiClient} from './api';
import {unwrap} from './server-creator';
import {isServerVideo,isPublicVideo,isPublicHouse,type ServerVideo,type VideoInput,type PublicVideo,type PublicHouse} from '../../contracts/src';
export const serverVideos={
 list:(house:string,signal?:AbortSignal)=>unwrap(apiClient.request(`/houses/${house}/videos`,(v):v is ServerVideo[]=>Array.isArray(v)&&v.every(isServerVideo),{signal})),
 save:(house:string,input:VideoInput,signal?:AbortSignal)=>unwrap(apiClient.request(`/houses/${house}/videos`,isServerVideo,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(input),signal})),
 publish:(video:ServerVideo,signal?:AbortSignal)=>unwrap(apiClient.request(`/videos/${video.id}/publish`,isServerVideo,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({version:video.version}),signal})),
 unpublish:(video:ServerVideo,signal?:AbortSignal)=>unwrap(apiClient.request(`/videos/${video.id}/unpublish`,isServerVideo,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({version:video.version}),signal})),
 video:(id:string,signal?:AbortSignal)=>unwrap(apiClient.request(`/public/videos/${id}`,isPublicVideo,{signal})),
 house:(address:string,signal?:AbortSignal)=>unwrap(apiClient.request(`/public/houses/${address}`,(v):v is {house:PublicHouse;videos:PublicVideo[]}=>!!v&&typeof v==='object'&&'house'in v&&'videos'in v&&isPublicHouse(v.house)&&Array.isArray(v.videos)&&v.videos.every(isPublicVideo),{signal})),
};
export const mediaUrl=(path:string)=>apiClient.url(path.replace(/^\/api/,''));
