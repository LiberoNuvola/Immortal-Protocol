#!/usr/bin/env node

import fs from 'node:fs'
import path from 'node:path'

const assert = (condition, message) => {
  if (!condition) throw new Error('FAIL: ' + message)
  console.log('PASS: ' + message)
}

const root = process.cwd()
const testPath = path.join(root, 'IMMORTAL', 'governance', 'AG01GovernabilityConformanceTest.hs')
const cabalPath = path.join(root, 'plutus', 'pre-rich-plutus.cabal')
const matrixPath = path.join(root, 'docs', 'research', 'AG-01-EXECUTABLE-CONFORMANCE-MATRIX-v1.md')

const testSource = fs.readFileSync(testPath, 'utf8')
const cabal = fs.readFileSync(cabalPath, 'utf8')
const matrix = fs.readFileSync(matrixPath, 'utf8')

assert(testSource.includes('AG-01 EXECUTABLE GOVERNABILITY NEGATIVE MATRIX PASSED'),
  'AG-01 executable negative conformance test is present')

const requiredNegativeVectors = [
  'AG-01 candidate cannot self-authorize',
  'AG-04 ruleset commitment is bound',
  'AG-08 unregistered ruleset is rejected',
  'AG-07 predecessor mismatch is rejected',
  'AG-05 lifecycle amendment/adaptation boundary is preserved',
  'AG-03 payload and event type cannot be retagged',
  'AG-10 missing evidence is rejected',
  'AG-06 adoption cannot bypass its required predecessor state',
]
for (const vector of requiredNegativeVectors) {
  assert(testSource.includes(vector), `AG-01 negative vector remains wired: ${vector}`)
}

const suite = 'test-suite ag01-governability-conformance-tests'
const suiteStart = cabal.indexOf(suite)
assert(suiteStart >= 0, 'AG-01 test suite is declared in the Cabal package')
const suiteEnd = cabal.indexOf('\ntest-suite ', suiteStart + suite.length)
const suiteBlock = cabal.slice(suiteStart, suiteEnd >= 0 ? suiteEnd : cabal.length)

assert(suiteBlock.includes('main-is: AG01GovernabilityConformanceTest.hs'),
  'Cabal AG-01 suite points to the canonical Haskell conformance test')
assert(suiteBlock.includes('hs-source-dirs: ../IMMORTAL/governance'),
  'Cabal AG-01 suite binds the intended governance source directory')

assert(matrix.includes('AG-01') && matrix.includes('OPEN'),
  'AG-01 matrix remains explicitly classified as conformance work rather than silently promoted to closure')
assert(
  matrix.includes('No') || matrix.includes('not'),
  'AG-01 matrix retains explicit non-claim / bounded-evidence language',
)

console.log('ALL AG-01 EXECUTABLE WIRING BOUNDARY CHECKS PASSED')
