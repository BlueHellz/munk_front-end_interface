import {resolve,dirname,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
export const frontendRoot=resolve(import.meta.dirname,'..');
export const projectRoot=resolve(frontendRoot,'..');
export const reviewRoot=join(projectRoot,'review');
export const artifactsRoot=join(projectRoot,'artifacts');
const require=createRequire(import.meta.url);
export const viteEntry=join(dirname(require.resolve('vite/package.json')),'bin','vite.js');
// Entry scripts work from either the workspace root or frontend/, including direct node invocation.
process.chdir(frontendRoot);
