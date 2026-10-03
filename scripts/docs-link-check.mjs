#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const failures=[];
const ignoredDirs=new Set(['.git','node_modules','dist','build','.next']);

function walk(dir){
  const out=[];
  for(const e of fs.readdirSync(dir,{withFileTypes:true})){
    if(ignoredDirs.has(e.name)) continue;
    const p=path.join(dir,e.name);
    if(e.isDirectory()) out.push(...walk(p));
    else out.push(p);
  }
  return out;
}

const files=walk(root);
const markdown=files.filter(f=>f.endsWith('.md'));
const exists=target=>fs.existsSync(target);

for(const file of markdown){
  const rel=path.relative(root,file).replaceAll(path.sep,'/');
  let text=fs.readFileSync(file,'utf8');
  text=text.replace(/```[\s\S]*?```/g,'');
  const re=/!??\[[^\]]*\]\(([^)\s]+)(?:\s+['\"][^)]*['\"])?\)/g;
  for(const m of text.matchAll(re)){
    const raw=m[1].trim().replace(/^<|>$/g,'');
    if(!raw || /^(?:https?:|mailto:|data:|#)/i.test(raw)) continue;
    const clean=raw.split('#')[0].split('?')[0];
    if(!clean || clean.startsWith('/')) continue;
    const target=path.resolve(path.dirname(file),clean);
    if(!exists(target) && !exists(target+'.md') && !exists(path.join(target,'README.md'))){
      failures.push(`${rel}: broken relative link -> ${raw}`);
    }
  }
}

const deprecated=[
  'docs/GOV-2',
  'docs/CONSTITUTION-GAP-MATRIX.md',
  'docs/ECONOMIC-ALGORITHM-CONFORMANCE-MATRIX.md',
  'docs/IMMORTAL-IMPLEMENTATION-CLOSURE-STATUS.md'
];
for(const file of markdown){
  const rel=path.relative(root,file).replaceAll(path.sep,'/');
  const text=fs.readFileSync(file,'utf8');
  for(const token of deprecated){ if(text.includes(token)) failures.push(`${rel}: deprecated path reference -> ${token}`); }
}

const immortalDocs=files.filter(f=>f.startsWith(path.join(root,'IMMORTAL','docs')) && f.endsWith('.md'));
for(const file of immortalDocs){
  const text=fs.readFileSync(file,'utf8');
  if(!/NON-NORMATIVE|canonical authority|integrative reader guide/i.test(text)) failures.push(`${path.relative(root,file).replaceAll(path.sep,'/')}: missing non-normative/canonical-authority banner`);
}

if(failures.length){
  console.error('Documentation link/scope check FAILED');
  for(const f of failures) console.error(`- ${f}`);
  process.exit(1);
}
console.log(`Documentation link/scope check passed: ${markdown.length} Markdown files scanned.`);