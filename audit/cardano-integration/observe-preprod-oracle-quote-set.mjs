import { createHash } from 'node:crypto'
import { Lucid } from '@lucid-evolution/lucid'
import { Data } from 'lucid-cardano'
import { inspectOracleDatum } from './oracleQuoteSetObservation.mjs'

function required(name, ...aliases) {
  for (const candidate of [name, ...aliases]) {
    const value = process.env[candidate]?.trim()
    if (value) return value
  }
  throw new Error(`Required configuration is missing: ${[name, ...aliases].join(' or ')}`)
}

function hashJson(value) {
  return createHash('sha256')
    .update(JSON.stringify(value, (_key, item) => typeof item === 'bigint' ? item.toString() : item))
    .digest('hex')
}

function hashCborHex(hex) {
  if (!/^(?:[0-9a-fA-F]{2})+$/.test(hex)) throw new Error('Oracle datum CBOR is not canonical even-length hex')
  return createHash('sha256').update(Buffer.from(hex, 'hex')).digest('hex')
}

function exactRef(utxo) {
  if (
    !utxo ||
    typeof utxo.txHash !== 'string' ||
    !/^[0-9a-fA-F]{64}$/.test(utxo.txHash) ||
    !Number.isInteger(utxo.outputIndex) ||
    utxo.outputIndex < 0
  ) {
    throw new Error('Oracle singleton UTxO has no exact txHash/outputIndex reference')
  }
  return `cardano:tx/${utxo.txHash}#${utxo.outputIndex}`
}

const projectId = required('BLOCKFROST_PROJECT_ID', 'VITE_BLOCKFROST_PROJECT_ID')
const blockfrostUrl =
  process.env.BLOCKFROST_PREPROD_URL?.trim() ||
  process.env.VITE_BLOCKFROST_PREPROD_URL?.trim() ||
  'https://cardano-preprod.blockfrost.io/api/v0'
const oracleStateAddress = required('ORACLE_STATE_ADDRESS', 'VITE_ORACLE_STATE_ADDRESS')
const oraclePolicyId = required('ORACLE_STATE_POLICY_ID', 'VITE_ORACLE_STATE_POLICY_ID').toLowerCase()
const oracleTokenNameHex = required(
  'ORACLE_STATE_TOKEN_NAME_HEX',
  'VITE_ORACLE_STATE_TOKEN_NAME_HEX',
).toLowerCase()
const expectedPublisherPkh = required(
  'ORACLE_PUBLISHER_PKH',
  'VITE_ORACLE_PUBLISHER_PKH',
).toLowerCase()

if (!/^[0-9a-f]{56}$/.test(oraclePolicyId)) {
  throw new Error('Oracle State policy ID must be 28-byte hex')
}
if (!/^(?:[0-9a-f]{2})+$/.test(oracleTokenNameHex)) {
  throw new Error('Oracle State token name must be non-empty even-length hex')
}
if (!/^[0-9a-f]{56}$/.test(expectedPublisherPkh)) {
  throw new Error('Oracle publisher must be a 28-byte key hash')
}

/*
 * Read-only operational observation.
 * This script has no wallet seed, private key, transaction builder, signer,
 * submit call or state-update path. It reports the exact currently configured
 * singleton and its visible quote records; it does not assert external market
 * truth and does not promote a quote to "source-qualified".
 */
const lucid = await Lucid.new(
  { kind: 'Blockfrost', url: blockfrostUrl, projectId },
  'Preprod',
)
const oracleUnit = oraclePolicyId + oracleTokenNameHex
const oracleUtxos = await lucid.utxosAt(oracleStateAddress)
const matches = oracleUtxos.filter(utxo => (utxo.assets?.[oracleUnit] ?? 0n) === 1n)

if (matches.length !== 1) {
  throw new Error(
    `Oracle State observation blocked: expected exactly one configured singleton UTxO, found ${matches.length}`,
  )
}

const singleton = matches[0]
if (!singleton.datum) {
  throw new Error('Oracle State singleton has no inline datum; refusing to infer or fetch a different state')
}

const datumCborHex = typeof singleton.datum === 'string'
  ? singleton.datum
  : Data.to(singleton.datum)
const observedSlot = await lucid.currentSlot()
const observedAtMs = BigInt(lucid.utils.slotToUnixTime(observedSlot))
const inspection = inspectOracleDatum(datumCborHex, {
  expectedPublisherPkh,
  nowMs: observedAtMs,
})

const baseManifest = {
  schema: 'IMMORTAL-ORACLE-QUOTE-SET-OBSERVATION-v1',
  operation: {
    mode: 'READ_ONLY',
    signed: false,
    submitted: false,
    stateChanged: false,
  },
  network: 'cardano-preprod',
  observedAt: {
    slot: observedSlot,
    posixMs: observedAtMs.toString(),
    clockSource: 'Lucid Preprod slot-to-time mapping',
  },
  configuredOracleState: {
    address: oracleStateAddress,
    singletonPolicyId: oraclePolicyId,
    singletonTokenNameHex: oracleTokenNameHex,
    singletonUnit: oracleUnit,
    configuredPublisherPkh: expectedPublisherPkh,
    utxoReference: exactRef(singleton),
    transactionHash: singleton.txHash,
    outputIndex: singleton.outputIndex,
    datumCborSha256: hashCborHex(datumCborHex),
  },
  inspection,
  qualification: {
    formatAndQuoteShapeInspected: true,
    externalPriceSourceVerified: false,
    configuredPublisherTrustIndependentlyEliminated: false,
    multiAssetSettlementAuthorisedByThisObservation: false,
    note: 'Datum presence, quote identity, timestamp and publisher-field matching do not prove the external price source is truthful or permissionless. Qualify each source separately under the existing Oracle trust contract.',
  },
}

const evidenceHash = hashJson(baseManifest)
console.log(JSON.stringify({ ...baseManifest, evidenceHash }, null, 2))
