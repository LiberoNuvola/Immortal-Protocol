#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const tracked = execFileSync('git', ['ls-files', '-z'], { encoding: 'utf8' })
  .split('\0').filter(Boolean)

const ignoredRoots = new Set(['node_modules/', 'evidence/', 'audit/**/evidence/'])
const isTextCandidate = (p) => /\.(?:js|mjs|cjs|ts|tsx|json|ya?ml|yaml|ps1|sh|py|hs|md|txt|env(?:\.\w+)?)$/i.test(p)

const patterns = [
  { name: 'BLOCKFROST_API_KEY literal', re: /BLOCKFROST(?:_MAINNET)?_API_KEY\s*[:=]\s*[`'\"][^`'\"]+[`'\"]/i },
  { name: 'DEMETER_API_KEY literal', re: /DEMETER(?:_OGMIOS)?(?:_API_KEY)?\s*[:=]\s*[`'\"][^`'\"]+[`'\"]/i },
  { name: 'Authorization bearer literal', re: /Authorization\s*[:=]\s*[`'\"]Bearer\s+[A-Za-z0-9._~+\/-]{20,}[`'\"]/i },
  { name: 'provider key header literal', re: /(?:dmtr-api-key|project_id)\s*[:=]\s*[`'\"][A-Za-z0-9._-]{24,}[`'\"]/i },
]

const violations = []
for (const file of tracked) {
  if (!isTextCandidate(file)) continue
  if ([...ignoredRoots].some((root) => file.startsWith(root))) continue
  const source = fs.readFileSync(file, 'utf8')
  for (const { name, re } of patterns) {
    if (re.test(source)) violations.push(`${file}: ${name}`)
  }
}

if (violations.length) {
  console.error('Credential boundary violations detected:')
  for (const violation of violations) console.error(`- ${violation}`)
  process.exit(1)
}

console.log(`Credential boundary check: PASS (${tracked.length} tracked files inspected)`)
