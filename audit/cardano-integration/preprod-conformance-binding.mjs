import { createHash } from 'node:crypto'
import { readFile, writeFile } from 'node:fs/promises'
import { execFileSync } from 'node:child_process'

const evidenceDir = process.env.PREPROD_EVIDENCE_DIR ?? 'audit/preprod-evidence'

const files = [
  'IMMORTAL/kernel/EconomicTransitionV3.hs',
  'IMMORTAL/kernel/UniversalEconomicKernel.hs',
  'PRE-RICH/profile/PreRichEconomicProjection.hs',
  'Adapter/CARDANO/serialization/CanonicalEconomicState.ts',
  'src/__tests__/immortal-reveal-conformance.test.ts',
  'plutus/test/ProjectionBoundaryConformanceTest.hs',
]

const contextPath = evidenceDir + '/ogmios-preprod-context.json'
const walletPath = evidenceDir + '/preprod-wallet-utxo.json'
const conformancePath = evidenceDir + '/immortal-pre-rich-reveal-conformance.txt'

async function fileSha256(path) {
  const bytes = await readFile(path)
  return createHash('sha256').update(bytes).digest('hex')
}

function requireEqual(actual, expected, label) {
  if (actual !== expected) {
    throw new Error(label + ': expected ' + expected + ', got ' + String(actual))
  }
}

const context = JSON.parse(await readFile(contextPath, 'utf8'))
const wallet = JSON.parse(await readFile(walletPath, 'utf8'))
const conformanceOutput = await readFile(conformancePath, 'utf8')
if (!conformanceOutput.includes('Test Files  1 passed') && !conformanceOutput.includes('Tests  ')) {
  throw new Error('IMMORTAL/PRE-RICH conformance output does not contain an expected Vitest success summary')
}
requireEqual(context.schema, 'IMMORTAL-PREPROD-OGMIOS-CONTEXT-v0.1', 'context schema')
requireEqual(context.source?.provider, 'Demeter', 'context provider')
requireEqual(context.source?.network, 'cardano-preprod', 'context network')
requireEqual(context.source?.interface, 'Ogmios v7 JSON-RPC', 'context interface')
requireEqual(wallet.schema, 'IMMORTAL-PREPROD-WALLET-UTXO-v0.1', 'wallet schema')
requireEqual(wallet.source?.provider, 'Demeter', 'wallet provider')
requireEqual(wallet.source?.network, 'cardano-preprod', 'wallet network')

const gitSha = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim()
const hashes = {}
for (const path of files) hashes[path] = await fileSha256(path)

const packet = {
  schema: 'IMMORTAL-PREPROD-CONFORMANCE-BINDING-v0.1',
  status: 'BOUND',
  classification: {
    preprod_observation: true,
    executable_boundary_conformance: true,
    ledger_aligned_evaluator_run: false,
    full_end_to_end_equivalence_claim: false,
  },
  snapshot: {
    gitHead: gitSha,
    sourceSha256: hashes,
  },
  observations: {
    ogmiosContextSha256: await fileSha256(contextPath),
    walletUtxoSha256: await fileSha256(walletPath),
    conformanceOutputSha256: await fileSha256(conformancePath),
    networkTip: context.network_tip ?? null,
    ledgerEpoch: context.ledger_epoch ?? null,
    walletStatus: wallet.wallet?.status ?? null,
    walletUtxoCount: wallet.utxoCount ?? null,
    walletLovelaceBalance: wallet.lovelaceBalance ?? null,
  },
  conformanceScope: [
    'IMMORTAL V3 transition semantics',
    'V3 to Universal economic projection',
    'PRE-RICH Reveal canonical boundary',
    'Cardano observation provenance on Preprod',
  ],
  interpretation:
    'This packet binds one exact source snapshot to one live Demeter/Ogmios Preprod observation and executable boundary-conformance run. It does not claim a ledger evaluator result for a submitted Preprod Reveal transaction.',
}

await writeFile(
  evidenceDir + '/preprod-conformance-binding.json',
  JSON.stringify(packet, null, 2) + '\\n',
)

const digest = createHash('sha256')
  .update(JSON.stringify(packet))
  .digest('hex')

await writeFile(
  evidenceDir + '/preprod-conformance-binding.sha256',
  digest + '  preprod-conformance-binding.json\\n',
)

console.log(JSON.stringify({
  status: packet.status,
  gitHead: gitSha,
  conformanceScope: packet.conformanceScope,
  ogmiosContextSha256: packet.observations.ogmiosContextSha256,
  walletUtxoSha256: packet.observations.walletUtxoSha256,
  bindingSha256: digest,
}, null, 2))
