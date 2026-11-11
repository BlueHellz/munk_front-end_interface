/** Portable foundation contracts. Authentication endpoints await embedded-wallet setup. */
export const MANUAL_CREATOR_REVIEW_LABEL = 'Manual creator review' as const;
export const admissionStatuses = ['draft', 'pending_review', 'admitted', 'changes_requested', 'rejected'] as const;
export type AdmissionStatus = typeof admissionStatuses[number];
export const assetStates = ['created', 'receiving', 'received', 'queued', 'processing', 'ready', 'failed', 'cancelled', 'expired'] as const;
export type AssetState = typeof assetStates[number];
export type MembershipRole = 'owner' | 'publisher';
export type PublicationState = 'draft' | 'published' | 'unpublished';

export const apiErrorCodes = ['validation', 'unauthenticated', 'forbidden', 'not_found', 'conflict', 'too_large', 'unavailable', 'internal'] as const;
export type ApiErrorCode = typeof apiErrorCodes[number];
export type ApiError = {
  ok: false;
  code: ApiErrorCode;
  message: string;
  retryable: boolean;
  requestId: string;
  fieldErrors?: Record<string, string>;
};
export type HealthResponse = { status: 'ok'; service: 'munk-api' };
export type ReadinessResponse = { status: 'ready'; database: 'ready' };
export type HouseDraftInput = { address: string; name: string; description: string; publicName: string; focus: string };
export type HouseDraftPatch = Omit<HouseDraftInput, 'address'> & { version: number };

export const apiErrorSchema = {
  type: 'object', additionalProperties: false,
  required: ['ok', 'code', 'message', 'retryable', 'requestId'],
  properties: {
    ok: { const: false }, code: { type: 'string', enum: apiErrorCodes },
    message: { type: 'string', minLength: 1 }, retryable: { type: 'boolean' },
    requestId: { type: 'string', minLength: 1 },
    fieldErrors: { type: 'object', additionalProperties: { type: 'string' } },
  },
} as const;
export const healthSchema = {
  type: 'object', additionalProperties: false, required: ['status', 'service'],
  properties: { status: { const: 'ok' }, service: { const: 'munk-api' } },
} as const;
export const readinessSchema = {
  type: 'object', additionalProperties: false, required: ['status', 'database'],
  properties: { status: { const: 'ready' }, database: { const: 'ready' } },
} as const;
const houseProperties = {
  name: { type: 'string', maxLength: 120 }, description: { type: 'string', maxLength: 4000 },
  publicName: { type: 'string', maxLength: 80 }, focus: { type: 'string', maxLength: 120 },
} as const;
export const houseDraftSchema = {
  type: 'object', additionalProperties: false,
  required: ['address', 'name', 'description', 'publicName', 'focus'],
  properties: { address: { type: 'string', pattern: '^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$' }, ...houseProperties },
} as const;
export const houseDraftPatchSchema = {
  type: 'object', additionalProperties: false,
  required: ['version', 'name', 'description', 'publicName', 'focus'],
  properties: { version: { type: 'integer', minimum: 1, maximum: 2147483647 }, ...houseProperties },
} as const;

const record = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
const keys = (v: Record<string, unknown>, allowed: string[]) => Object.keys(v).every(k => allowed.includes(k));
export function isApiError(v: unknown): v is ApiError {
  return record(v) && keys(v, ['ok', 'code', 'message', 'retryable', 'requestId', 'fieldErrors']) &&
    v.ok === false && apiErrorCodes.includes(v.code as ApiErrorCode) && typeof v.message === 'string' && v.message.length > 0 &&
    typeof v.retryable === 'boolean' && typeof v.requestId === 'string' && v.requestId.length > 0 &&
    (v.fieldErrors === undefined || (record(v.fieldErrors) && Object.values(v.fieldErrors).every(e => typeof e === 'string')));
}
export function isHealthResponse(v: unknown): v is HealthResponse {
  return record(v) && keys(v, ['status', 'service']) && v.status === 'ok' && v.service === 'munk-api';
}
export function isReadinessResponse(v: unknown): v is ReadinessResponse {
  return record(v) && keys(v, ['status', 'database']) && v.status === 'ready' && v.database === 'ready';
}
