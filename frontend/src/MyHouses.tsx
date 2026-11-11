import {BackControl} from './NavigationPages';
import {useEffect} from 'react';
import { useApp } from './state';
import { useCreator } from './creator-state';
import { Button } from './components';
export default function MyHouses(){
 const {account,requireAccount}=useApp();
 const {serverHouses,serverLoading,serverError,serverMessage,reloadServer,productMode}=useCreator();
 useEffect(()=>{if(account)void reloadServer();},[account]);
 return <main className="creator-page"><header className="creator-heading"><div><small>YOUR CREATOR ACCESS</small><h1>My Houses</h1><p>Only Houses with a current server-authorized membership appear here. Your viewing Home is always available.</p></div><BackControl fallback="#/profile"/></header>{!account?<><p>Sign in to load your memberships.</p><Button onClick={()=>requireAccount(()=>{})}>Sign in to continue</Button></>:serverLoading?<p role="status">Loading your memberships…</p>:serverError?<section role="alert"><h2>{serverError==='permission'?'Permission denied':'Could not load My Houses'}</h2><p>{serverMessage}</p><Button onClick={()=>void reloadServer()}>Retry</Button></section>:<>{!serverHouses.length?<section className="creator-card"><h2>No Houses yet</h2><p>Signing up creates your account only. Create a House when you are ready.</p></section>:serverHouses.map(h=><section className="creator-card" key={h.id}><h2>{h.name||h.address}</h2><p>{h.address} · Role: {h.membershipRole||'Unavailable'} · {productMode==='demo'?(h.demoReady?'House ready for demo use':'Complete later · continue as demo House'):`Manual creator review: ${h.admissionStatus.replaceAll('_',' ')}`}</p><div className="button-row"><a className="button" href={`#/creator/overview?house=${h.id}`}>Open workspace</a>{h.membershipRole==='owner'&&<a className="button outline" href={`#/creator/design?house=${h.id}`}>Appearance</a>}{h.membershipRole==='owner'&&<a className="button outline" href={`#/create/house?house=${h.id}`}>Edit House details</a>}</div></section>)}<a className="button" href="#/create/house">Create a House</a></>}</main>;
}
