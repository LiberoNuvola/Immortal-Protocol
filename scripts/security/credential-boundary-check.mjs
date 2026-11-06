#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const tracked = execFileSync('git', ['ls-files', '-z'], { encoding: 'utf8' }).split('\0').filter(Boolean)
const textCandidate = (file) => /\.(?:js|mjs|cjs|ts|tsx|json|ya?ml|yaml|ps1|sh|py|hs|md|txt|env(?:\.\w+)?)$/i.test(file)
const patterns = [
  { name: 'BLOCKFROST_API_KEY literal', re: /BLOCKFROST(?:_MAINNET)?_API_KEY\s*[:=]\s*[\x60'"][^\x60'"]+[\x60'"]/i },
  { name: 'DEMETER_API_KEY literal', re: /DEMETER(?:_OGMIOS)?(?:_API_KEY)?\s*[:=]\s*[\x60'"][^\x60'"]+[\x60'"]/i },
  { name: 'Authorization bearer literal', re: /Authorization\s*[:=]\s*['"]Bearer\s+[A-Za-z0-9._~+\/-]{20,}['"]/i },
  { name: 'provider key header literal', re: /(?:dmtr-api-key|project_id)\s*[:=]\s*['"][A-Za-z0-9._-]{24,}['"]/i },
]
const violations = []
const config = fs.readFileSync('src/config.ts', 'utf8')
const wallet = fs.readFileSync('src/wallet.ts', 'utf8')
if (/import\.meta\s+as\s+any|import\.meta\.env\s*\[[^]]+\]/.test(config)) violations.push('src/config.ts: dynamic Vite environment access')
if (/BLOCKFROST_PROJECT_ID|BLOCKFROST_PREPROD_URL/.test(wallet)) violations.push('src/wallet.ts: browser credential or direct provider URL reference')
for (const file of tracked) {
  if (!textCandidate(file) || file.startsWith('node_modules/') || file.startsWith('evidence/')) continue
  const source = fs.readFileSync(file, 'utf8')
  for (const pattern of patterns) if (pattern.re.test(source)) violations.push(file + ': ' + pattern.name)
}
if (violations.length) {
  console.error('Credential boundary violations detected:')
  for (const violation of violations) console.error('- ' + violation)
  process.exit(1)
}
console.log('Credential boundary check: PASS (' + tracked.length + ' tracked files inspected)')
