import {frontendRoot,projectRoot,reviewRoot,artifactsRoot,viteEntry} from './paths.mjs';
import ts from 'typescript';
import {readFile,writeFile,readdir} from 'node:fs/promises';
for(const file of (await readdir('src')).filter(file=>/\.tsx?$/.test(file)).map(file=>'src/'+file)){
 const source=await readFile(file,'utf8');
 const ast=ts.createSourceFile(file,source,ts.ScriptTarget.Latest,true,file.endsWith('tsx')?ts.ScriptKind.TSX:ts.ScriptKind.TS);
 await writeFile(file,ts.createPrinter({newLine:ts.NewLineKind.LineFeed}).printFile(ast));
}
