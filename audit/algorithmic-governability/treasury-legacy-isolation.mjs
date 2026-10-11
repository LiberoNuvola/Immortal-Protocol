#!/usr/bin/env node

import fs from 'node:fs'
import path from 'node:path'

const assert = (condition, message) => {
  if (!condition) throw new Error(`FAIL: ${message}`)
  console.log(`PASS: ${message}`)
}

const repoRoot = process.cwd()

// Scan executable/runtime and deployment tooling surfaces. Historical
// treasuryPolicy.ts plus detector-style scripts are excluded because this
// boundary verifies non-use by call surfaces, not removal of compatibility code
// or inspection logic that necessarily contains legacy symbol names.
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

const excludedFiles = new Set([
  path.resolve(repoRoot, 'src', 'treasuryPolicy.ts'),
  path.resolve(repoRoot, 'scripts', 'predeploy-check.mjs'),
  path.resolve(repoRoot, 'audit', 'algorithmic-governability', 'treasury-legacy-isolation.mjs'),
])

const sourceFiles = roots.flatMap((root) => {
  const abs = path.join(repoRoot, root)
  return fs.existsSync(abs) ? walk(abs) : []
}).filter((file) => /.(ts|tsx|js|jsx|mjs|cjs)$/.test(file))
  .filter((file) => !excludedFiles.has(path.resolve(file)))

const forbiddenCallPatterns = [
  /(?:from|require)s*\(?['"][^'"]*treasuryPolicy(?:\.ts)?['"]\)?/,
  /\bcalculateTreasuryDistribution\s*\(/,
  /\b(?:TreasuryAction|DISTRIBUTE_REDEEMER)\b/,
]

const declarationPatterns = [
  /\b(?:const|let|var)\s+TREASURY_POLICY\b/,
  /\b(?:const|let|var)\s+DISTRIBUTE_REDEEMER\b/,
  /\bfunction\s+calculateTreasuryDistribution\s*\(/,
]

function activeLegacyReferences(source) {
  const lines = source.split(/\r?\n/)
  const hits = []

  for (const [index, line] of lines.entries()) {
    // The legacy compatibility symbols may remain as local definitions.
    // They are a failure only when imported/invoked/consumed as an active
    // production call surface.
    if (declarationPatterns.some((pattern) => pattern.test(line))) continue

    for (const pattern of forbiddenCallPatterns) {
      if (pattern.test(line)) hits.push({ line: index + 1, pattern: String(pattern), text: line.trim() })
    }
  }

  return hits
}

const hits = []
for (const file of sourceFiles) {
  const source = fs.readFileSync(file, 'utf8')
  for (const hit of activeLegacyReferences(source)) {
    hits.push({ file, ...hit })
  }
}

assert(
  hits.length === 0,
  'legacy Treasury distribution has no active import/invocation/consumer call surface in runtime or deployment tooling',
)

const relayerPath = path.resolve(repoRoot, 'relayer', 'relayer.js')
if (fs.existsSync(relayerPath)) {
  const relayer = fs.readFileSync(relayerPath, 'utf8')
  assert(
    /legacy distribution disabled[\s\S]*canonical EconomicAdmission path required/.test(relayer),
    'legacy Treasury worker remains explicitly fail-closed pending canonical EconomicAdmission',
  )
}

console.log('ALL TREASURY LEGACY ISOLATION CHECKS PASSED')
