export type AccountSession = {
  account: { id: string; displayName: string; reviewer: boolean };
  csrfToken: string;
  expiresAt: string;
};
export type LoginChallenge = { challenge: string };
export const loginSchema = {
  type: 'object', additionalProperties: false, required: ['accessToken'],
  properties: { accessToken: { type: 'string', minLength: 1, maxLength: 16384 } },
} as const;
const object = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
export function isAccountSession(v: unknown): v is AccountSession {
  return object(v) && object(v.account) && typeof v.account.id === 'string' && typeof v.account.displayName === 'string' && typeof v.account.reviewer === 'boolean' && typeof v.csrfToken === 'string' && typeof v.expiresAt === 'string';
}
export function isLoginChallenge(v: unknown): v is LoginChallenge { return object(v) && typeof v.challenge === 'string' && /^[a-f0-9]{64}$/.test(v.challenge); }
