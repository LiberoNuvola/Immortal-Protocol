// Static guard for the dedicated Real Preprod Reveal path.
// The main application retains legacy lucid-cardano paths intentionally;
// this guard protects the fresh Lucid Evolution Preprod transaction harness.

import { readFile } from 'node:fs/promises'

const path = 'audit/cardano-integration/preprod-real-reveal.mjs'
const source = await readFile(path, 'utf8')
const rootPackage = JSON.parse(await readFile('package.json', 'utf8'))
const auditPackage = JSON.parse(await readFile('audit/cardano-integration/package.json', 'utf8'))

const forbidden = [
  '.attachMintingPolicy(',
  '.attachSpendingValidator(',
  '.payToContract(',
  '.payToAddressWithData(',
  '.sign().complete()',
]
const malformed = [
  '{ inline:',
  '{ scriptRef:',
  'scriptRef: scripts.',
]
const hits = forbidden.filter(token => source.includes(token))
const malformedHits = malformed.filter(token => source.includes(token))

const rootLucidVersion = rootPackage.dependencies?.['@lucid-evolution/lucid']
const auditLucidVersion = auditPackage.dependencies?.['@lucid-evolution/lucid']
if (!rootLucidVersion || !auditLucidVersion) {
  throw new Error('Lucid Evolution dependency declaration is missing')
}
if (rootLucidVersion !== auditLucidVersion) {
  throw new Error(
    'Lucid Evolution dependency mismatch: root=' +
    rootLucidVersion + ', audit/cardano-integration=' + auditLucidVersion
  )
}

if (hits.length || malformedHits.length) {
  throw new Error(
    'Legacy or malformed Lucid Evolution transaction shape remains in ' + path +
    ': ' + [...hits, ...malformedHits].join(', ')
  )
}

console.log(JSON.stringify({
  message: 'Preprod Reveal transaction API is Lucid Evolution compatible.',
  lucidEvolutionVersion: rootLucidVersion,
}, null, 2))
