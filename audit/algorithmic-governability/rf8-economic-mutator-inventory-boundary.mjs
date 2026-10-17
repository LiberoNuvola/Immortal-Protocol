#!/usr/bin/env node

import fs from 'node:fs'
import path from 'node:path'

const ROOT = process.cwd()

const assert = (condition, message) => {
  if (!condition) throw new Error(`FAIL: ${message}`)
  console.log(`PASS: ${message}`)
}

const read = (relativePath) =>
  fs.readFileSync(path.join(ROOT, relativePath), 'utf8')

const stripComments = (source) =>
  source
    .replace(/\/\/.*$/gm, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')

const mint = stripComments(read('src/mint.ts'))
const game = stripComments(read('src/gameFlow.ts'))
const helpers = stripComments(read('src/txHelpers.ts'))
const registry = stripComments(read('src/registryFlow.ts'))
const createRound = stripComments(read('src/createRound.ts'))

assert(
  /\.submitEconomic\(tx, economicAdmission,[\s\S]*?'Issue'\)/.test(mint),
  'Issue remains bound to the Cardano economic submission path',
)
assert(
  !/signAndSubmitTx\(lucid, tx\)/.test(mint),
  'Issue does not fall back to infrastructure-only submission',
)

const economicFunctions = [
  ['Reveal', /export async function revealPrize\b/, /signAndSubmitEconomicTx\([\s\S]*?'Reveal'\)/],
  ['Claim', /export async function claimPrize\b/, /signAndSubmitEconomicTx\([\s\S]*?'Claim'\)/],
  ['Expire', /export async function expirePrize\b/, /signAndSubmitEconomicTx\([\s\S]*?'Expire'\)/],
]

for (const [action, functionStart, expectedSubmission] of economicFunctions) {
  const start = game.search(functionStart)
  assert(start >= 0, `${action} remains a named application transition`)
  const nextExport = game.indexOf('export async function ', start + 1)
  const segment = game.slice(start, nextExport >= 0 ? nextExport : game.length)
  assert(
    expectedSubmission.test(segment),
    `${action} remains bound to explicit EconomicAdmission submission`,
  )
}

const economicSubmissionCalls = game.match(/signAndSubmitEconomicTx\(/g) ?? []
assert(
  economicSubmissionCalls.length === 3,
  'gameFlow contains exactly three economic submission call sites (Reveal/Claim/Expire)',
)

const infrastructureCalls = game.match(/signAndSubmitTx\(/g) ?? []
assert(
  infrastructureCalls.length === 1,
  'gameFlow contains exactly one infrastructure submission call site for non-economic support work',
)

assert(
  /export async function signAndSubmitEconomicTx\b[\s\S]*?adapter\.submitEconomic\(/.test(helpers),
  'canonical economic helper delegates to Cardano submitEconomic',
)
assert(
  /buildClaimTx\b[\s\S]*?Legacy buildClaimTx disabled/.test(helpers),
  'legacy Claim builder remains fail-closed',
)
assert(
  /export async function signAndSubmitTx\b[\s\S]*?adapter\.submitInfrastructure\(/.test(helpers),
  'infrastructure helper remains explicitly separate from economic submission',
)

assert(
  /return signAndSubmitTx\(p\.lucid, tx\)/.test(registry),
  'registry publication remains an infrastructure/control submission path',
)
assert(
  /const txHash\s*=\s*await signAndSubmitTx\(lucid, tx\)/.test(createRound),
  'pending-round creation remains an infrastructure/control submission path',
)

console.log('ALL RF8 ECONOMIC MUTATOR INVENTORY BOUNDARY CHECKS PASSED')
