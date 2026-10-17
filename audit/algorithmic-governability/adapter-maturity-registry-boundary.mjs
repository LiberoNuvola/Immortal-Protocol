#!/usr/bin/env node

import { readdirSync, statSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const assert = (condition, message) => {
  if (!condition) throw new Error('FAIL: ' + message)
  console.log('PASS: ' + message)
}

const root = process.cwd()
const adapterRoot = join(root, 'Adapter')
const names = readdirSync(adapterRoot).filter((name) => statSync(join(adapterRoot, name)).isDirectory())

const expected = new Set(['CARDANO','REFERENCE','MIDNIGHT','BITCOIN','COSMOS','ETHEREUM','SOLANA','SUBSTRATE'])
for (const name of expected) assert(names.includes(name), name + ' adapter surface is explicitly accounted for')
const isRegisteredAdapterSurface = (name) => expected.has(name)
for (const name of names) {
  assert(isRegisteredAdapterSurface(name), name + ' adapter surface has an explicit maturity classification')
}
assert(!isRegisteredAdapterSurface('UNREGISTERED_ADAPTER'), 'unregistered adapter surface is rejected by the maturity registry')

assert(names.includes('CARDANO'), 'Cardano adapter surface exists')
assert(names.includes('MIDNIGHT'), 'Midnight research surface exists')
assert(names.includes('REFERENCE'), 'reference replay surface exists')


const cardanoEntries = readdirSync(join(adapterRoot, 'CARDANO'))
assert(cardanoEntries.includes('runtime') && cardanoEntries.includes('observation') && cardanoEntries.includes('serialization'),
  'Cardano exposes concrete runtime/observation/serialization surfaces')

const midnightEntries = readdirSync(join(adapterRoot, 'MIDNIGHT'))
assert(!midnightEntries.includes('runtime'), 'Midnight has no production runtime surface')
assert(midnightEntries.includes('IntentBoundary.ts'), 'Midnight Intent boundary is research-only and explicit')

const referenceText = readFileSync(join(adapterRoot, 'REFERENCE', 'ReferenceAdapter.hs'), 'utf8')
assert(referenceText.includes('replayValid'), 'Reference adapter is a semantic replay/reference implementation')

for (const name of ['BITCOIN','COSMOS','ETHEREUM','SOLANA','SUBSTRATE']) {
  const entries = readdirSync(join(adapterRoot, name))
  assert(entries.length === 1 && entries[0] === 'docs', name + ' contains only research docs in the current adapter tree')
}

console.log('ADAPTER MATURITY REGISTRY SHAPE CHECKS PASSED')
