import{apiClient}from'./api';import{unwrap}from'./server-creator';import{isViewerProfile,isCommunityHouse,isBoardPost,isBoardReply,isConversation,isDirectMessage,type ViewerProfile,type CommunityHouse,type BoardPost,type BoardReply,type Conversation,type DirectMessage}from'../../contracts/src';
const array=<T,>(guard:(v:unknown)=>v is T)=>(v:unknown):v is T[]=>Array.isArray(v)&&v.every(guard);
const profileBundle=(v:unknown):v is{profile:ViewerProfile|null}=>!!v&&typeof v==='object'&&'profile'in v&&(v.profile===null||isViewerProfile(v.profile));
const ack=(v:unknown):v is{id:string}=>!!v&&typeof v==='object'&&'id'in v&&typeof v.id==='string';
const json=(method:string,body?:unknown):RequestInit=>({method,...(body===undefined?{}:{headers:{'Content-Type':'application/json'},body:JSON.stringify(body)})});
export const community={
 profile:()=>unwrap(apiClient.request('/me/profile',profileBundle)),
 saveProfile:(v:{handle:string;displayName:string;bio:string})=>unwrap(apiClient.request('/me/profile',profileBundle,json('PUT',v))),
 profiles:(q='')=>unwrap(apiClient.request('/public/profiles?q='+encodeURIComponent(q),array<ViewerProfile>(isViewerProfile))),
 publicProfile:(handle:string)=>unwrap(apiClient.request('/public/profiles/'+encodeURIComponent(handle),isViewerProfile)),
 houses:(signedIn=false)=>unwrap(apiClient.request(signedIn?'/me/subscriptions':'/public/houses',array<CommunityHouse>(isCommunityHouse))),
 subscribe:(id:string,enabled:boolean)=>unwrap(apiClient.request('/houses/'+id+'/subscription',(v):v is{subscribed:boolean}=>!!v&&typeof v==='object'&&'subscribed'in v&&typeof v.subscribed==='boolean',json(enabled?'PUT':'DELETE'))),
 posts:(house='')=>unwrap(apiClient.request('/board'+(house?'?house='+house:''),array<BoardPost>(isBoardPost))),
 post:(house:string,body:string,clientId:string)=>unwrap(apiClient.request('/houses/'+house+'/posts',isBoardPost,json('POST',{body,clientId}))),
 replies:(id:string)=>unwrap(apiClient.request('/posts/'+id+'/replies',array<BoardReply>(isBoardReply))),
 reply:(id:string,body:string,clientId:string)=>unwrap(apiClient.request('/posts/'+id+'/replies',ack,json('POST',{body,clientId}))),
 conversations:()=>unwrap(apiClient.request('/messages',array<Conversation>(isConversation))),
 messages:(id:string)=>unwrap(apiClient.request('/messages/'+id,array<DirectMessage>(isDirectMessage))),
 send:(recipientId:string,body:string,clientId:string)=>unwrap(apiClient.request('/messages',isDirectMessage,json('POST',{recipientId,body,clientId}))),
};
