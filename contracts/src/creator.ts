import type { AdmissionStatus } from './foundation.js';

export const uuidSchema = { type: 'string', format: 'uuid' } as const;
export const idParamsSchema = { type: 'object', additionalProperties: false, required: ['id'], properties: { id: uuidSchema } } as const;
export type HouseRecord = {
  demoReady?:boolean;
  membershipRole?: 'owner' | 'publisher';
  id: string; address: string; name: string; description: string; publicName: string; focus: string;
  version: number; admissionRevision: number; admissionStatus: AdmissionStatus;
};
export type AllocateUploadInput = { purpose: 'video' | 'introduction'; size: number };
export type UploadStatus = {
  assetId: string; uploadId: string; purpose: 'video' | 'introduction';
  state: string; uploadedBytes: number; totalBytes: number; durationMs: number | null;
  errorCode: string | null;
};
export const allocateUploadSchema = {
  type: 'object', additionalProperties: false, required: ['purpose', 'size'],
  properties: { purpose: { type: 'string', enum: ['video', 'introduction'] }, size: { type: 'integer', minimum: 1, maximum: 2147483648 } },
} as const;
export type AdmissionInput = { version: number; introductionAssetId: string; faceVisible: true; publicConsent: true };
export const admissionInputSchema = {
  type: 'object', additionalProperties: false, required: ['version', 'introductionAssetId', 'faceVisible', 'publicConsent'],
  properties: { version: { type: 'integer', minimum: 1, maximum: 2147483647 }, introductionAssetId: uuidSchema, faceVisible: { const: true }, publicConsent: { const: true } },
} as const;
export type ReviewInput = { kind: 'creator_control' | 'introduction'; outcome: 'approved' | 'changes_requested' | 'rejected'; method: string; reason: string };
export const reviewInputSchema = {
  type: 'object', additionalProperties: false, required: ['kind', 'outcome', 'method', 'reason'],
  properties: {
    kind: { type: 'string', enum: ['creator_control', 'introduction'] },
    outcome: { type: 'string', enum: ['approved', 'changes_requested', 'rejected'] },
    method: { type: 'string', minLength: 1, maxLength: 500 }, reason: { type: 'string', minLength: 1, maxLength: 4000 },
  },
} as const;

export type ProductMode='strict'|'demo';
export type DemoHouseInput=Partial<{name:string;address:string;description:string;publicName:string;focus:string;existingHouseId:string;version:number}>;
export const demoHouseSchema={type:'object',additionalProperties:false,properties:{name:{type:'string',maxLength:120},address:{type:'string',maxLength:40},description:{type:'string',maxLength:4000},publicName:{type:'string',maxLength:80},focus:{type:'string',maxLength:120},existingHouseId:uuidSchema,version:{type:'integer',minimum:1,maximum:2147483647}}} as const;
