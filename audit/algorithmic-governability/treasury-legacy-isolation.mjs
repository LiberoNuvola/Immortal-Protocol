#!/usr/bin/env node

import fs from 'node:fs'
import path from 'node:path'

const assert = (condition, message) => {
  if (!condition) throw new Error(`FAIL: ${message}`)
  console.log(`PASS: ${message}`)
}

const repoRoot = process.cwd()
// Scan executable/runtime and deployment tooling surfaces. Historical
// treasuryPolicy.ts and this harness are excluded because this boundary
// verifies non-use by call surfaces, not removal of compatibility code or the
// literal patterns embedded in the detector itself.
const roots = ['src', 'relayer', 'web', 'scripts']

function walk(dir) {
  const out = []
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) out.push(...walk(full))
    else out.push(full)
  }
  return out
}

const sourceFiles = roots.flatMap((root) => {
  const abs = path.join(repoRoot, root)
  return fs.existsSync(abs) ? walk(abs) : []
}).filter((file) => /.(ts|tsx|js|jsx|mjs|cjs)$/.test(file))
  .filter((file) => !file.endsWith(path.join('src', 'treasuryPolicy.ts')))
  .filter((file) => !file.endsWith(path.join('audit', 'algorithmic-governability', 'treasury-legacy-isolation.mjs')))

const forbiddenPatterns = [
  /(?:from|require)\s*\(?['"][^'"]*treasuryPolicy(?:\.ts)?['"]\)?/,
  /\bTREASURY_POLICY\b/,
  /\bcalculateTreasuryDistribution\s*\(/,
  /\b(?:TreasuryAction|DISTRIBUTE_REDEEMER)\b/,
]

const hits = []
for (const file of sourceFiles) {
  const content = fs.readFileSync(file, 'utf8')
  for (const pattern of forbiddenPatterns) {
    if (pattern.test(content)) hits.push({ file, pattern: String(pattern) })
  }
}

assert(
  hits.length === 0,
  'legacy Treasury policy symbols are absent from executable runtime and deployment-tool call surfaces',
)
console.log('ALL TREASURY LEGACY ISOLATION CHECKS PASSED')
