/** Public profile fields deliberately exclude wallets, provider IDs and private account data. */
export type ViewerProfile={accountId:string;handle:string;displayName:string;bio:string};
export type CommunityHouse={id:string;address:string;name:string;subscribed?:boolean};
export type BoardPost={id:string;house:CommunityHouse;body:string;createdAt:string;replyCount:number};
export type BoardReply={id:string;postId:string;author:ViewerProfile|null;body:string;createdAt:string};
export type Conversation={id:string;peer:ViewerProfile|null;lastMessage:string;updatedAt:string};
export type DirectMessage={id:string;conversationId:string;mine:boolean;body:string;createdAt:string};
const obj=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v);
export const isViewerProfile=(v:unknown):v is ViewerProfile=>obj(v)&&['accountId','handle','displayName','bio'].every(k=>typeof v[k]==='string');
export const isCommunityHouse=(v:unknown):v is CommunityHouse=>obj(v)&&['id','address','name'].every(k=>typeof v[k]==='string')&&(v.subscribed===undefined||typeof v.subscribed==='boolean');
export const isBoardPost=(v:unknown):v is BoardPost=>obj(v)&&typeof v.id==='string'&&isCommunityHouse(v.house)&&typeof v.body==='string'&&typeof v.createdAt==='string'&&Number.isInteger(v.replyCount);
export const isBoardReply=(v:unknown):v is BoardReply=>obj(v)&&['id','postId','body','createdAt'].every(k=>typeof v[k]==='string')&&(v.author===null||isViewerProfile(v.author));
export const isConversation=(v:unknown):v is Conversation=>obj(v)&&['id','lastMessage','updatedAt'].every(k=>typeof v[k]==='string')&&(v.peer===null||isViewerProfile(v.peer));
export const isDirectMessage=(v:unknown):v is DirectMessage=>obj(v)&&['id','conversationId','body','createdAt'].every(k=>typeof v[k]==='string')&&typeof v.mine==='boolean';
export const profileInputSchema={type:'object',additionalProperties:false,required:['handle','displayName','bio'],properties:{handle:{type:'string',pattern:'^[a-z][a-z0-9-]{2,29}$'},displayName:{type:'string',minLength:1,maxLength:80,pattern:'\\S'},bio:{type:'string',maxLength:1000}}};
export const textInputSchema={type:'object',additionalProperties:false,required:['body','clientId'],properties:{body:{type:'string',minLength:1,maxLength:4000,pattern:'\\S'},clientId:{type:'string',format:'uuid'}}};
export const messageInputSchema={...textInputSchema,required:['body','clientId','recipientId'],properties:{...textInputSchema.properties,recipientId:{type:'string',format:'uuid'}}};
export const uuidParamsSchema={type:'object',additionalProperties:false,required:['id'],properties:{id:{type:'string',format:'uuid'}}};
