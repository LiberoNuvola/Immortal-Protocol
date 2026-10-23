import { mkdir, writeFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { Emulator, Lucid } from 'lucid-cardano'

const KOIOS = process.env.KOIOS_PREPROD_URL ?? 'https://preprod.koios.rest/api/v1'
const ADDRESS = process.env.PREPROD_TREASURY_ADDRESS?.trim()
const SCRIPT_HASH = process.env.PREPROD_TREASURY_SCRIPT_HASH?.trim().toLowerCase()
const BINDING_REFERENCE = process.env.PREPROD_TREASURY_BINDING_REFERENCE?.trim()
const OUTPUT_PATH = process.env.TREASURY_OBSERVATION_OUTPUT ?? 'audit/preprod-evidence/configured-treasury-observation.json'
const TUSDM_POLICY_ID = 'e675b46e4d2242c991a8932a99db3044e80515ae14b4c4ccf6b3f4c9'
const TUSDM_ASSET_NAME_HEX = '0014df10745553444d'
const TUSDM_UNIT = TUSDM_POLICY_ID + TUSDM_ASSET_NAME_HEX

function required(value, name) {
  if (!value) throw new Error('CONFIGURATION_MISSING: ' + name)
  return value
}

required(ADDRESS, 'PREPROD_TREASURY_ADDRESS')
required(SCRIPT_HASH, 'PREPROD_TREASURY_SCRIPT_HASH')
required(BINDING_REFERENCE, 'PREPROD_TREASURY_BINDING_REFERENCE')
if (!/^addr_test1[0-9a-z]+$/.test(ADDRESS)) {
  throw new Error('CONFIGURATION_INVALID: Treasury address is not a Cardano Preprod address')
}
if (!/^[0-9a-f]{56}$/.test(SCRIPT_HASH)) {
  throw new Error('CONFIGURATION_INVALID: Treasury script hash must be 28-byte hex')
}
if (BINDING_REFERENCE.length < 8 || BINDING_REFERENCE.length > 512) {
  throw new Error('CONFIGURATION_INVALID: binding reference must identify a reviewed deployment record')
}

const lucid = await Lucid.new(new Emulator([]), 'Preprod')
const details = lucid.utils.getAddressDetails(ADDRESS)
if (details.paymentCredential?.type !== 'Script') {
  throw new Error('IDENTITY_MISMATCH: configured Treasury address does not have a script payment credential')
}
if (details.paymentCredential.hash.toLowerCase() !== SCRIPT_HASH) {
  throw new Error('IDENTITY_MISMATCH: configured Treasury address payment credential differs from PREPROD_TREASURY_SCRIPT_HASH')
}

const response = await fetch(KOIOS + '/address_utxos', {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ _addresses: [ADDRESS] }),
})
if (!response.ok) throw new Error('KOIOS_ADDRESS_UTXOS_HTTP_' + response.status)
const rows = await response.json()
if (!Array.isArray(rows)) throw new Error('KOIOS_ADDRESS_UTXOS_INVALID_RESPONSE')
if (rows.some(row => row?.address !== ADDRESS)) {
  throw new Error('KOIOS_RETURNED_UTXO_FOR_UNEXPECTED_ADDRESS')
}
const utxos = rows.map(row => {
  const assets = Object.fromEntries((row.asset_list ?? []).map(asset => [
    String(asset.policy_id).toLowerCase() + String(asset.asset_name ?? '').toLowerCase(),
    String(asset.quantity),
  ]))
  return {
    outRef: String(row.tx_hash) + '#' + String(row.tx_index),
    lovelace: String(row.value),
    canonicalTusdmAtomic: assets[TUSDM_UNIT] ?? '0',
    assets: Object.entries(assets).map(([unit, quantity]) => ({ unit, quantity })),
  }
})
const total = utxos.reduce((sum, utxo) => sum + BigInt(utxo.canonicalTusdmAtomic), 0n)
const evidence = {
  schema: 'IMMORTAL-CONFIGURED-PREPROD-TREASURY-OBSERVATION-v1',
  observedAt: new Date().toISOString(),
  network: 'cardano-preprod',
  configuredAddress: ADDRESS,
  configuredScriptHash: SCRIPT_HASH,
  bindingReference: BINDING_REFERENCE,
  bindingReferenceVerification: 'CALLER_SUPPLIED_NOT_CRYPTOGRAPHICALLY_VERIFIED',
  source: { provider: 'Koios', endpoint: 'POST /address_utxos', returnedRows: rows.length },
  assetIdentity: { canonicalTusdmUnit: TUSDM_UNIT, policyId: TUSDM_POLICY_ID, assetNameHex: TUSDM_ASSET_NAME_HEX },
  totals: { utxoCount: utxos.length, lovelace: utxos.reduce((sum, u) => sum + BigInt(u.lovelace), 0n).toString(), canonicalTusdmAtomic: total.toString() },
  utxos,
  qualification: {
    configuredAddressProvided: true,
    addressNetworkChecked: true,
    paymentCredentialMatchesConfiguredScriptHash: true,
    ledgerObservationObtained: true,
    liquidationRouteVerified: false,
    swapExecuted: false,
    qneProven: false,
  },
  limitations: [
    'This observer verifies that the configured Preprod address has a script payment credential matching the separately supplied script hash.',
    'The bindingReference is caller-supplied and is not authenticated by this script; reviewers must verify it against the actual deployment record.',
    'The observer does not prove that the script hash was deployed by an authorized release, nor that the Treasury is protocol-controlled.',
    'Balances do not prove a DEX route, execution proceeds, minimum-output protection, execution costs, or QNE.',
  ],
}
evidence.evidenceHash = createHash('sha256').update(JSON.stringify(evidence)).digest('hex')
await mkdir(OUTPUT_PATH.split('/').slice(0, -1).join('/') || '.', { recursive: true })
await writeFile(OUTPUT_PATH, JSON.stringify(evidence, null, 2) + '\n')
console.log(JSON.stringify({ status: 'OBSERVED', address: ADDRESS, scriptHash: SCRIPT_HASH, utxoCount: utxos.length, canonicalTusdmAtomic: total.toString(), evidenceHash: evidence.evidenceHash, output: OUTPUT_PATH }, null, 2))
