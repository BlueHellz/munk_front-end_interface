import type { ApiErrorCode } from '../../../contracts/src/foundation.js';

export class DomainError extends Error {
  constructor(public status: number, public code: ApiErrorCode, message: string, public fieldErrors?: Record<string,string>) { super(message); }
}
export const invalid = (message: string): never => { throw new DomainError(422, 'validation', message); };
export const conflict = (message: string): never => { throw new DomainError(409, 'conflict', message); };
