import {frontendRoot,projectRoot,reviewRoot,artifactsRoot,viteEntry} from './paths.mjs';
import {spawnSync} from 'node:child_process';
for(const script of ['scripts/render-check.mjs','scripts/exchange-check.mjs','scripts/discovery-check.mjs','scripts/creator-check.mjs','scripts/mosaic-check.mjs','scripts/api-check.mjs','scripts/onboarding-check.mjs']){const result=spawnSync(process.execPath,[script],{stdio:'inherit'});if(result.status!==0)process.exit(result.status||1);}
