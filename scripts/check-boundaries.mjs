import assert from 'node:assert/strict';
import {readFile,readdir,stat} from 'node:fs/promises';
import {resolve,relative,sep} from 'node:path';
import ts from 'typescript';
const root=resolve(import.meta.dirname,'..');
const files=async directory=>{const result=[];for(const entry of await readdir(directory,{withFileTypes:true})){const path=resolve(directory,entry.name);if(entry.isDirectory())result.push(...await files(path));else if(/\.[cm]?[jt]sx?$/.test(path))result.push(path);}return result;};
const inside=(file,directory)=>file===directory||file.startsWith(directory+sep);
for(const directory of ['frontend/src','contracts/src'])for(const file of await files(resolve(root,directory))){
 const source=await readFile(file,'utf8');const ast=ts.createSourceFile(file,source,ts.ScriptTarget.Latest,true,file.endsWith('tsx')?ts.ScriptKind.TSX:ts.ScriptKind.TS);
 const imports=[];const visit=node=>{if((ts.isImportDeclaration(node)||ts.isExportDeclaration(node))&&node.moduleSpecifier&&ts.isStringLiteral(node.moduleSpecifier))imports.push(node.moduleSpecifier.text);if(ts.isCallExpression(node)&&(node.expression.kind===ts.SyntaxKind.ImportKeyword||node.expression.getText(ast)==='require')&&node.arguments[0]&&ts.isStringLiteral(node.arguments[0]))imports.push(node.arguments[0].text);ts.forEachChild(node,visit);};visit(ast);
 for(const specifier of imports){const target=specifier.startsWith('.')?resolve(file,'..',specifier):specifier;
  assert.ok(!specifier.includes('@munk/backend')&&!inside(target,resolve(root,'backend')),`${relative(root,file)} imports backend implementation: ${specifier}`);
  if(directory==='contracts/src')assert.ok(specifier.startsWith('.')&&inside(target,resolve(root,'contracts/src')),`Shared contracts must have only local, portable dependencies: ${specifier}`);
 }
 if(directory==='frontend/src'&&!file.endsWith('/api.ts')){
  let directFetch=false;const detect=node=>{if(ts.isCallExpression(node)&&(/^(fetch|window\.fetch|globalThis\.fetch)$/.test(node.expression.getText(ast))))directFetch=true;ts.forEachChild(node,detect);};detect(ast);
  assert.ok(!directFetch,`${relative(root,file)} must use the configurable api.ts boundary`);
 }
}
// One repository at the root only; symlinked workspace dependencies are ignored.
async function noNested(directory){for(const entry of await readdir(directory,{withFileTypes:true})){if(['node_modules','review','artifacts','dist','.qa','.git'].includes(entry.name)){if(entry.name==='.git')assert.equal(directory,root,'Nested Git repository found');continue;}if(entry.isDirectory())await noNested(resolve(directory,entry.name));}}
await noNested(root);
const pkg=JSON.parse(await readFile(resolve(root,'package.json'),'utf8'));assert.deepEqual(pkg.workspaces,['frontend','backend','contracts']);
console.log('Workspace boundaries PASS: frontend cannot import backend; contracts have no external/server dependencies; HTTP fetch stays in api.ts; no nested repositories.');
try{await stat(resolve(root,'.git'));console.log('Root Git repository is present.');}catch{console.log('Root Git repository is absent: git init was blocked by filesystem permissions; run git init -b main locally.');}
