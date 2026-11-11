import type { AccountSession } from '../../contracts/src';
import type { AuthPhase } from './auth-context';
export const setupStorageKey = 'munk-pending-account-setup-v1';
export function cancelledAuthentication(error: unknown): boolean {
  const value=error as {name?:string;code?:string;privyErrorCode?:string;message?:string}|null;
  const code=typeof error==='string'?error:value?.privyErrorCode||value?.code||value?.name||'';
  return ['exited_auth_flow','oauth_user_denied','AbortError','NotAllowedError'].includes(code);
}
/** Only completes an already authenticated Privy account. It never signs up a user. */
export async function finishAccountSetup(options: {
  userId: string; create: boolean;
  refreshWallet: () => Promise<boolean>;
  createWallet: () => Promise<unknown>;
  markPending: (userId: string) => void;
  phase: (phase: AuthPhase) => void;
  exchange: () => Promise<AccountSession>;
  active: () => boolean;
}): Promise<AccountSession> {
  const check=()=>{if(!options.active())throw new DOMException('Authentication attempt ended.','AbortError');};
  check();
  if(options.create){
    options.markPending(options.userId);
    options.phase('setup');
    // Refresh before retry: a timed-out request may already have created the wallet.
    const exists=await options.refreshWallet();check();
    if(!exists){await options.createWallet();check();}
  }
  options.phase('verifying');
  const session=await options.exchange();check();
  return session;
}
