import {useEffect,useRef,useState,type ReactNode} from 'react';
import {PrivyProvider,usePrivy,useCreateWallet,useSignupWithPasskey,useLoginWithPasskey,useExportWallet,useLogin,useLoginWithEmail,useUser} from '@privy-io/react-auth';
import {apiClient,setApiSession} from './api';
import {isAccountSession,isLoginChallenge,type AccountSession} from '../../contracts/src';
import {AuthContext,type AuthPhase} from './auth-context';
import {cancelledAuthentication,finishAccountSetup,setupStorageKey} from './auth-flow';

function SessionBridge({children}:{children:ReactNode}){
 const privy=usePrivy();const {createWallet}=useCreateWallet();const {refreshUser}=useUser();const {exportWallet}=useExportWallet();
 const [session,setSession]=useState<AccountSession|null>(null);
 const [phase,setPhase]=useState<AuthPhase>('loading'),[message,setMessage]=useState('Loading sign-in…');
 const [checked,setChecked]=useState(false),[attempt,setAttempt]=useState(0),[attemptFailure,setAttemptFailure]=useState(0);
 const pending=useRef<string|null>(null);const [setupPending,setSetupPending]=useState(false);
 const intent=useRef<'create'|'login'|null>(null),exchanging=useRef(false),generation=useRef(0),working=useRef(false);
 const phaseRef=useRef<AuthPhase>('loading');phaseRef.current=phase;
 const update=(next:AuthPhase,text:string)=>{phaseRef.current=next;setPhase(next);setMessage(text);};
 const markPending=(userId:string)=>{pending.current=userId;setSetupPending(true);try{sessionStorage.setItem(setupStorageKey,userId);}catch{}};
 const clearPending=()=>{pending.current=null;setSetupPending(false);try{sessionStorage.removeItem(setupStorageKey);}catch{}};
 const failed=(error:unknown)=>{
   if(!working.current)return;
   generation.current++;working.current=false;intent.current=null;
   setAttemptFailure(n=>n+1);
   update(cancelledAuthentication(error)?'cancelled':'error',cancelledAuthentication(error)?'Sign-in cancelled. Your draft is still saved.':'Sign-in could not complete. Please try again.');
 };
 const {signupWithPasskey}=useSignupWithPasskey({onError:failed});
 const {loginWithPasskey}=useLoginWithPasskey({onError:failed});
 const {login}=useLogin({onError:failed});
 const {sendCode,loginWithCode}=useLoginWithEmail({onError:failed});
 const install=(value:AccountSession|null)=>{
   setSession(value);setApiSession(value?.csrfToken||'',()=>{generation.current++;intent.current=null;working.current=false;setSession(null);setApiSession('');update('error','Your session expired. Sign in again. Your draft is still saved.');});
 };
 useEffect(()=>{try{pending.current=sessionStorage.getItem(setupStorageKey);setSetupPending(!!pending.current);}catch{}let active=true;
   void apiClient.request('/me',isAccountSession).then(result=>{if(!active)return;if(result.ok){install(result.value);update('authenticated','Signed in to MUNK.');}else if(result.code!=='permission')update('error','Could not check your MUNK session. Please try again.');setChecked(true);});
   return()=>{active=false;};
 },[]);
 useEffect(()=>{if(!checked||session||phaseRef.current!=='loading')return;
   if(privy.ready)update('idle','');
 },[checked,privy.ready,session]);
 useEffect(()=>{if(privy.ready)return;const timer=setTimeout(()=>{if(!session&&!working.current)update('error','Sign-in is taking too long to load. Reload sign-in to try again.');},20000);return()=>clearTimeout(timer);},[privy.ready,session]);
 useEffect(()=>{if(privy.error&&!session&&!working.current)update('error','Sign-in could not load. Reload sign-in to try again.');},[privy.error,session]);
 useEffect(()=>{
   if(!checked||!privy.ready||!privy.authenticated||!privy.user||session||intent.current||exchanging.current)return;
   if(pending.current===privy.user.id){setSetupPending(true);update('setup-failed','Your account was created. Retry setup to finish signing in. You will not create another account.');}
 },[checked,privy.ready,privy.authenticated,privy.user?.id,session]);
 useEffect(()=>{if(!session)return;let active=true;
   const refresh=()=>{const current=generation.current;void apiClient.request('/me',isAccountSession).then(result=>{if(!active||current!==generation.current)return;if(result.ok)install(result.value);else if(result.code!=='permission')setMessage('Could not refresh your account status.');});};
   const timer=setInterval(refresh,60000);window.addEventListener('focus',refresh);return()=>{active=false;clearInterval(timer);window.removeEventListener('focus',refresh);};
 },[session?.account.id]);
 useEffect(()=>{
   if(!checked||!privy.ready||!privy.authenticated||!privy.user||!intent.current||exchanging.current)return;
   const userId=privy.user.id,create=intent.current==='create'||pending.current===userId;
   exchanging.current=true;const current=++generation.current;
   const active=()=>current===generation.current;
   void finishAccountSetup({userId,create,markPending,active,
     phase:next=>{if(active())update(next,next==='setup'?'Setting up your account…':'Finishing sign-in…');},
     refreshWallet:async()=>{const user=await refreshUser();if(user.id!==userId)throw Error('Account changed.');return user.linkedAccounts.some(a=>a.type==='wallet'&&a.walletClientType==='privy'&&a.chainType==='ethereum');},
     createWallet:()=>createWallet(), // No developer signers or MUNK signing authority.
     exchange:async()=>{
       const accessToken=await privy.getAccessToken();if(!accessToken)throw Error('No authentication token.');
       const challenge=await apiClient.request('/auth/challenge',isLoginChallenge);if(!challenge.ok)throw Error(challenge.message);
       const result=await apiClient.request('/auth/sessions',isAccountSession,{method:'POST',headers:{'Content-Type':'application/json','X-Login-Challenge':challenge.value.challenge},body:JSON.stringify({accessToken})});
       if(!result.ok){if(!create&&result.code==='permission')await privy.logout();throw Error(result.message);}return result.value;
     },
   }).then(value=>{if(!active())return;if(pending.current===userId)clearPending();install(value);update('authenticated','Signed in to MUNK.');})
   .catch(error=>{if(!active())return;setAttemptFailure(n=>n+1);
     if(create)update('setup-failed','Your account was created, but setup could not finish. Retry setup; you will not create another account.');
     else update(cancelledAuthentication(error)?'cancelled':'error',cancelledAuthentication(error)?'Sign-in cancelled. Your draft is still saved.':'Could not finish signing in. Please try again.');
   }).finally(()=>{if(active()){intent.current=null;working.current=false;}exchanging.current=false;});
 },[checked,privy.ready,privy.authenticated,privy.user,attempt]);
 const begin=(mode:'create'|'login',action:()=>void|Promise<unknown>)=>{
   if(!privy.ready||!checked||working.current||exchanging.current||session)return;
   if(mode==='create'&&privy.authenticated&&pending.current!==privy.user?.id){update('error','An account is already signed in on this device. Choose Sign in to continue with it.');return;}
   intent.current=mode;working.current=true;setAttempt(n=>n+1);
   update(privy.authenticated?'verifying':'device',privy.authenticated?'Finishing sign-in…':'Complete sign-in on your device.');
   try{if(!privy.authenticated){const result=action();if(result)void result.catch(failed);}}catch(error){failed(error);}
 };
 const passkeyAction=(mode:'create'|'login',action:()=>Promise<unknown>)=>{if(typeof PublicKeyCredential==='undefined'||!navigator.credentials){update('error','Passkeys are not available in this browser. Use a supported browser or choose More ways to sign in.');return;}begin(mode,action);};
 const retrySetup=()=>{
   if(!pending.current)return;
   if(!privy.authenticated||privy.user?.id!==pending.current){update('error','Sign in with the passkey for your new account to finish setup.');return;}
   begin('create',()=>{});
 };
 const sendEmailCode=async(email:string)=>{
   if(!privy.ready||!checked||working.current||session)return false;
   working.current=true;update('sending-code','Sending your sign-in code…');
   try{await sendCode({email,disableSignup:true});working.current=false;update('email-code','Check your linked email for a sign-in code.');return true;}
   catch{working.current=false;update('error','Could not send a code. Use an email already linked to your MUNK account, or try again.');return false;}
 };
 const logout=async()=>{
   if(working.current)return;working.current=true;update('verifying','Signing out…');
   try{const result=await apiClient.request('/auth/session',(v):v is {status:string}=>!!v&&typeof v==='object'&&'status'in v&&v.status==='logged_out',{method:'DELETE'});if(!result.ok)throw Error(result.message);
     generation.current++;intent.current=null;install(null);await privy.logout();clearPending();update('idle','Signed out.');
   }catch{update('error','Sign out could not complete. Please try again.');}finally{working.current=false;}
 };
 const busy=!checked||!privy.ready||['loading','device','setup','verifying','sending-code'].includes(phase);
 return <AuthContext.Provider value={{session,busy,phase,attemptFailure,message,setupPending,
   createWallet:()=>passkeyAction('create',signupWithPasskey),retrySetup,
   loginPasskey:()=>passkeyAction('login',loginWithPasskey),connectWallet:()=>begin('login',()=>login({loginMethods:['wallet']})),
   sendEmailCode,verifyEmailCode:code=>begin('login',()=>loginWithCode({code})),
   linkEmail:()=>privy.linkEmail(),exportWallet:()=>{void exportWallet().catch(()=>setMessage('Wallet export could not complete.'));},logout,
 }}>{children}</AuthContext.Provider>;
}
export function PrivyAuth({children}:{children:ReactNode}){
 const appId=import.meta.env.VITE_PRIVY_APP_ID||'cmvrdnznc00we0glcf33db0xh';
 return <PrivyProvider appId={appId} config={{loginMethods:['email','wallet'],embeddedWallets:{ethereum:{createOnLogin:'off'}},appearance:{theme:'light',accentColor:'#2458c6'}}}><SessionBridge>{children}</SessionBridge></PrivyProvider>;
}
