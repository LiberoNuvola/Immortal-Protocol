import { createHash } from 'node:crypto'
import { Data } from 'lucid-cardano'
import { inspectOracleDatum } from './oracleQuoteSetObservation.mjs'

const KOIOS = process.env.KOIOS_PREPROD_URL?.trim() || 'https://preprod.koios.rest/api/v1'

// These identify the workflow's previously observed bootstrap-wallet singleton.
// They are intentionally not asserted to be the public Pages runtime identity.
const BOOTSTRAP_WALLET_ADDRESS =
  process.env.PREPROD_WALLET_ADDRESS?.trim() ||
  'addr_test1qp5lufttvlv0zxpz5d9j2z4chgn3hhkm2y76lx0xrzmtez2vdw4kh93zkwpqapr6nnnu5q8aakyr76ks9cl40wvaf96sqdraw4'
const ORACLE_POLICY_ID = '9ada0966f747542f84af2bc352d564685d77f3839ec0b053a1b7700e'
const ORACLE_TOKEN_NAME_HEX = '4f5241434c45'
const EXPECTED_PUBLISHER_PKH = '69fe256b67d8f11822a34b250ab8ba271bdedb513daf99e618b6bc89'
const ORACLE_UNIT = ORACLE_POLICY_ID + ORACLE_TOKEN_NAME_HEX

function sha256Hex(bytes) {
  return createHash('sha256').update(bytes).digest('hex')
}

function hashJson(value) {
  return createHash('sha256')
    .update(JSON.stringify(value, (_key, item) => typeof item === 'bigint' ? item.toString() : item))
    .digest('hex')
}

function exactRef(utxo) {
  if (
    !utxo ||
    typeof utxo.tx_hash !== 'string' ||
    !/^[0-9a-fA-F]{64}$/.test(utxo.tx_hash) ||
    !Number.isInteger(utxo.tx_index) ||
    utxo.tx_index < 0
  ) {
    throw new Error('Koios UTxO has no exact tx_hash/tx_index reference')
  }
  return `cardano:tx/${utxo.tx_hash}#${utxo.tx_index}`
}

// Use Koios chain-tip time for freshness classification; the runner wall clock
// is not an authoritative ledger-time proxy. This remains an observation only,
// not the actual transaction validity upper bound used by Plutus validators.
const tipResponse = await fetch(KOIOS + '/tip')
if (!tipResponse.ok) {
  throw new Error(`Koios tip failed with HTTP ${tipResponse.status}`)
}
const tipRows = await tipResponse.json()
const tip = Array.isArray(tipRows) ? tipRows[0] : tipRows?.data
if (
  !tip ||
  typeof tip.hash !== 'string' ||
  !/^[0-9a-fA-F]{64}$/.test(tip.hash) ||
  !Number.isSafeInteger(Number(tip.block_time)) ||
  Number(tip.block_time) < 0 ||
  !Number.isSafeInteger(Number(tip.abs_slot)) ||
  Number(tip.abs_slot) < 0
) {
  throw new Error('Koios returned malformed Preprod chain tip metadata')
}

const response = await fetch(KOIOS + '/address_info', {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ _addresses: [BOOTSTRAP_WALLET_ADDRESS] }),
})
if (!response.ok) {
  throw new Error(`Koios address_info failed with HTTP ${response.status}`)
}
const rows = await response.json()
const info = rows?.[0]
if (!info || info.address !== BOOTSTRAP_WALLET_ADDRESS) {
  throw new Error('Koios did not return the exact configured bootstrap wallet address')
}

const matches = (info.utxo_set ?? []).filter(utxo =>
  (utxo.asset_list ?? []).some(asset =>
    String(asset.policy_id ?? '').toLowerCase() === ORACLE_POLICY_ID &&
    String(asset.asset_name ?? '').toLowerCase() === ORACLE_TOKEN_NAME_HEX &&
    BigInt(asset.quantity) === 1n,
  ),
)
if (matches.length !== 1) {
  throw new Error(
    `Bootstrap-wallet Oracle singleton observation blocked: expected exactly one ${ORACLE_UNIT} UTxO, found ${matches.length}`,
  )
}

const utxo = matches[0]
const datumCborHex = utxo.inline_datum?.bytes
if (typeof datumCborHex !== 'string' || !/^(?:[0-9a-fA-F]{2})+$/.test(datumCborHex)) {
  throw new Error('Observed Oracle singleton has no valid inline datum CBOR')
}
const nowMs = BigInt(Number(tip.block_time)) * 1_000n
const inspection = inspectOracleDatum(Data.from(datumCborHex), {
  expectedPublisherPkh: EXPECTED_PUBLISHER_PKH,
  nowMs,
})

const baseManifest = {
  schema: 'IMMORTAL-BOOTSTRAP-WALLET-ORACLE-OBSERVATION-v1',
  operation: {
    mode: 'READ_ONLY',
    signed: false,
    submitted: false,
    stateChanged: false,
  },
  network: 'cardano-preprod',
  observationClock: {
    observedAtIso: new Date(Number(nowMs)).toISOString(),
    observedAtPosixMs: nowMs.toString(),
    source: 'Koios Preprod chain-tip block_time; classification only, not the Issue transaction validity upper bound',
    tipHash: String(tip.hash).toLowerCase(),
    tipBlockNo: Number(tip.block_no),
    tipAbsSlot: Number(tip.abs_slot),
    tipEpochNo: Number(tip.epoch_no),
  },
  identity: {
    source: 'prior public Preprod wallet singleton observation 39594377501',
    walletAddress: BOOTSTRAP_WALLET_ADDRESS,
    oracleStatePolicyId: ORACLE_POLICY_ID,
    oracleStateTokenNameHex: ORACLE_TOKEN_NAME_HEX,
    oracleStateUnit: ORACLE_UNIT,
    expectedPublisherPkh: EXPECTED_PUBLISHER_PKH,
    utxoReference: exactRef(utxo),
    txHash: utxo.tx_hash,
    outputIndex: utxo.tx_index,
    lovelace: String(utxo.value),
    datumCborSha256: sha256Hex(Buffer.from(datumCborHex, 'hex')),
  },
  inspection,
  qualification: {
    externalPriceSourceVerified: false,
    configuredPublicPagesRuntimeIdentityProven: false,
    configuredPublisherTrustIndependentlyEliminated: false,
    multiAssetSettlementAuthorisedByThisObservation: false,
    note: 'This read-only observation is bound to the historical bootstrap-wallet identity, not to the unobserved public Pages runtime variables. Datum shape, publisher-field matching and freshness classification do not prove market-source truth or permissionlessness.',
  },
}
console.log(JSON.stringify({ ...baseManifest, evidenceHash: hashJson(baseManifest) }, null, 2))
