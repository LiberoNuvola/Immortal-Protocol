/**
 * Live Preprod V3 carrier observation.
 *
 * This probe proves only the deployment/runtime witness for the V3 singleton:
 * exactly one UTxO at the configured carrier address carrying exactly one
 * configured carrier asset, with an exact txHash#outputIndex.
 *
 * It deliberately does not infer economics, EEV, liquidity, or Issue
 * admissibility. Those remain separate authenticated inputs.
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { Lucid } from 'lucid-cardano'

const required = (name: string): string => {
  const value = process.env[name]?.trim()
  if (!value) throw new Error(name + ' is required')
  return value
}

const projectId = required('BLOCKFROST_PROJECT_ID')
const carrierAddress = required('VITE_V3_CARRIER_ADDRESS')
const policyId = required('VITE_V3_CARRIER_POLICY_ID').toLowerCase()
const tokenNameHex = required('VITE_V3_CARRIER_TOKEN_NAME_HEX').toLowerCase()

if (!/^[0-9a-f]+$/.test(policyId) || policyId.length !== 56) {
  throw new Error('VITE_V3_CARRIER_POLICY_ID must be 28-byte hex')
}
if (!/^[0-9a-f]+$/.test(tokenNameHex)) {
  throw new Error('VITE_V3_CARRIER_TOKEN_NAME_HEX must be hex')
}

const lucid = await Lucid.new(
  {
    kind: 'Blockfrost',
    url: 'https://cardano-preprod.blockfrost.io/api/v0',
    projectId,
  },
  'Preprod',
)

const unit = policyId + tokenNameHex
const utxos = await lucid.utxosAt(carrierAddress)
const matches = utxos.filter((u) => (u.assets?.[unit] ?? 0n) === 1n)

if (matches.length !== 1) {
  throw new Error(
    'V3 carrier singleton is not uniquely materialized: expected exactly one matching UTxO, found ' +
      matches.length,
  )
}

const carrier = matches[0]
if (!/^[0-9a-fA-F]{64}$/.test(carrier.txHash) || !Number.isInteger(carrier.outputIndex)) {
  throw new Error('observed V3 carrier lacks an exact txHash/outputIndex')
}
if (!carrier.datum || typeof carrier.datum === 'string') {
  throw new Error('observed V3 carrier has no inline datum')
}

const evidence = {
  evidenceType: 'PRE-RICH-V3-CARRIER-LIVE-OBSERVATION',
  network: 'Preprod',
  carrierAddress,
  carrierPolicyId: policyId,
  carrierTokenNameHex: tokenNameHex,
  carrierUnit: unit,
  carrierStateReference: carrier.txHash + '#' + carrier.outputIndex,
  datumPresent: true,
  observedAssetQuantity: String(carrier.assets?.[unit] ?? 0n),
}

mkdirSync('audit/preprod-evidence', { recursive: true })
writeFileSync(
  'audit/preprod-evidence/preprod-v3-carrier-observation.json',
  JSON.stringify(evidence, null, 2) + '\n',
)
console.log(JSON.stringify(evidence, null, 2))
