import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

const SOURCE_EXTENSIONS=new Set(['.hs','.lhs','.ts','.tsx','.js','.mjs'])

function walk(root){
  const out=[]
  for(const name of readdirSync(root)){
    if(name==='.git'||name==='node_modules') continue
    const p=join(root,name)
    const st=statSync(p)
    if(st.isDirectory()) out.push(...walk(p))
    else if(SOURCE_EXTENSIONS.has(p.slice(p.lastIndexOf('.')))) out.push(p)
  }
  return out
}

const roots=['IMMORTAL','Adapter/CARDANO']
const violations=[]

for(const root of roots){
  for(const file of walk(root)){
    const source=readFileSync(file,'utf8')
    const lines=source.split(/\r?\n/)
    for(let i=0;i<lines.length;i++){
      const line=lines[i]
      if(!/^\s*import\b|^\s*(?:const|let|var)\s+.*\brequire\s*\(/.test(line)) continue
      if(/^IMMORTAL\/(?:kernel|state)\//.test(file)){
        if(/(?:['"])[^'"]*(?:PRE[-_]RICH|pre[-_]rich)[^'"]*(?:['"])/i.test(line) || /\b(?:import|require).*Adapter(?:[\\/]|\b)/i.test(line)){
          violations.push(`${file}:${i+1}: universal kernel/state imports application or adapter surface`)
        }
        if(/^\s*import\s+(?:qualified\s+)?PreRich/i.test(line)){
          violations.push(`${file}:${i+1}: universal kernel/state imports PRE-RICH module`)
        }
      }
      if(/^Adapter\/CARDANO\//.test(file) && /(?:['"])[^'"]*(?:PRE[-_]RICH|pre[-_]rich)[^'"]*(?:['"])/i.test(line)){
        violations.push(`${file}:${i+1}: Cardano adapter imports PRE-RICH surface`)
      }
    }
  }
}

if(violations.length){
  console.error('LAYER BOUNDARY VIOLATIONS')
  for(const v of violations) console.error(v)
  process.exit(1)
}

console.log('LAYER BOUNDARY CHECK: PASS')
console.log('Rules: IMMORTAL kernel/state -> no PRE-RICH/Adapter; Cardano Adapter -> no PRE-RICH')
