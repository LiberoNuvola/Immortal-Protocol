import assert from 'node:assert/strict'
import { test } from 'node:test'

import {
  PRE_ASSET_NAME_HEX,
  PRE_POLICY_ID,
  PRE_UNIT,
  SNEK_CURVE_VALIDATOR_HASH,
  SNEK_POOL_NFT_POLICY_ID,
  decodeAssetClass,
  decodePreSnekDatum,
  decodeState0,
  parsePlutusData,
  type PreSnekEvidencePacket,
  type UtxoRecord,
} from '../preSnekDecoder'

const POOL_NFT_NAME_HEX = '504f4f4c'
const POOL_NFT_UNIT = SNEK_POOL_NFT_POLICY_ID + POOL_NFT_NAME_HEX

function cborBytes(hex: string): string {
  const len = hex.length / 2
  if (len < 24) return `4${len.toString(16)}${hex}`
  if (len < 256) return `58${len.toString(16).padStart(2, '0')}${hex}`
  throw new Error('fixture helper only supports short bytes')
}

function constr0(fields: string[]): string {
  const len = fields.length
  if (len >= 24) throw new Error('fixture helper only supports short lists')
  return `d879${(0x80 + len).toString(16)}${fields.join('')}`
}

function assetClass(policyId: string, nameHex: string): string {
  return constr0([constr0([cborBytes(policyId), cborBytes(nameHex)])])
}

function uint(value: bigint): string {
  if (value < 24n) return value.toString(16).padStart(2, '0')
  if (value <= 0xffn) return `18${Number(value).toString(16).padStart(2, '0')}`
  if (value <= 0xffffn) return `19${Number(value).toString(16).padStart(4, '0')}`
  if (value <= 0xffffffffn) return `1a${Number(value).toString(16).padStart(8, '0')}`
  return `1b${value.toString(16).padStart(16, '0')}`
}

const FIXTURE_DATUM_CBOR = constr0([
  assetClass(SNEK_POOL_NFT_POLICY_ID, POOL_NFT_NAME_HEX),
  assetClass('', ''),
  assetClass(PRE_POLICY_ID, PRE_ASSET_NAME_HEX),
  uint(122_525_779_519n),
  uint(2_545_182n),
  constr0([]),
  uint(18_188_400_000n),
  constr0([]),
  constr0([]),
])

const PACKET: PreSnekEvidencePacket = {
  schema: 'immortal.pre-snek-evidence.v1',
  network: 'Cardano-mainnet',
  provider: { name: 'fixture', version: '1' },
  retrieved_at: '2026-09-19T16:00:00Z',
  request: { asset_policy: PRE_POLICY_ID, asset_name: PRE_ASSET_NAME_HEX },
  raw_response: { fixture: true },
  response_hash: 'sha256:' + '11'.repeat(32),
}

function makeUtxo(): UtxoRecord {
  return {
    tx_hash: 'aa'.repeat(32),
    output_index: 0,
    address: 'addr1fixture',
    value: {
      lovelace: '18191400000',
      [POOL_NFT_UNIT]: '1',
      [PRE_UNIT]: '29386112',
    },
    assets: [
      { unit: POOL_NFT_UNIT, quantity: '1' },
      { unit: PRE_UNIT, quantity: '29386112' },
    ],
    payment_credential: SNEK_CURVE_VALIDATOR_HASH,
    datum_cbor: FIXTURE_DATUM_CBOR,
    datum_hash: 'bb'.repeat(32),
    slot: '47688',
    block_height: '11824399',
    block_time: '2025-05-05T12:59:39Z',
    deployment_version: 'synthetic-fixture-v1',
  }
}

test('fixture is a valid Plutus Constr 0 with exactly 9 fields', () => {
  const parsed = parsePlutusData(FIXTURE_DATUM_CBOR)
  assert.equal(typeof parsed, 'object')
  const decoded = decodePreSnekDatum(FIXTURE_DATUM_CBOR)
  assert.equal(decoded.constructorIndex, 0)
  assert.equal(decoded.fields, 9)
  assert.equal(decoded.aNum, 122_525_779_519n)
  assert.equal(decoded.bNum, 2_545_182n)
  assert.equal(decoded.thresholdLovelace, 18_188_400_000n)
})

test('fixture binds pool NFT, ADA asset_x and PRE asset_y', () => {
  const decoded = decodePreSnekDatum(FIXTURE_DATUM_CBOR)
  assert.equal(decoded.poolNft.policyId, SNEK_POOL_NFT_POLICY_ID)
  assert.equal(decoded.poolNft.nameHex, POOL_NFT_NAME_HEX)
  assert.equal(decoded.assetX.policyId, '')
  assert.equal(decoded.assetX.nameHex, '')
  assert.equal(decoded.assetY.policyId, PRE_POLICY_ID)
  assert.equal(decoded.assetY.nameHex, PRE_ASSET_NAME_HEX)
})

test('State-0 candidate is verified from UTxO value + datum + evidence packet', () => {
  const result = decodeState0(PACKET, [makeUtxo()])
  assert.equal(result.status, 'VERIFIED')
  if (result.status !== 'VERIFIED') return
  assert.equal(result.state.asset.name_hex, PRE_ASSET_NAME_HEX)
  assert.equal(result.state.pool.validator_hash, SNEK_CURVE_VALIDATOR_HASH)
  assert.equal(result.state.pool.pool_nft.policy, SNEK_POOL_NFT_POLICY_ID)
  assert.equal(result.state.reserves.ada_lovelace, '18191400000')
  assert.equal(result.state.reserves.pre, '29386112')
  assert.equal(result.state.evidence_hash, PACKET.response_hash)
})

test('wrong PRE asset identity is rejected', () => {
  const bad = { ...PACKET, request: { asset_policy: PRE_POLICY_ID, asset_name: '5052452d5252494348' } }
  const result = decodeState0(bad, [makeUtxo()])
  assert.equal(result.status, 'UNVERIFIED')
})

test('wrong validator is rejected', () => {
  const bad = { ...makeUtxo(), payment_credential: '00'.repeat(28) }
  const result = decodeState0(PACKET, [bad])
  assert.equal(result.status, 'UNVERIFIED')
})

test('missing pool NFT in physical UTxO value is rejected', () => {
  const bad = makeUtxo()
  delete bad.value[POOL_NFT_UNIT]
  bad.assets = bad.assets.filter((entry) => entry.unit !== POOL_NFT_UNIT)
  const result = decodeState0(PACKET, [bad])
  assert.equal(result.status, 'UNVERIFIED')
})

test('multiple qualifying pool candidates are never silently merged', () => {
  const second = { ...makeUtxo(), tx_hash: 'cc'.repeat(32), output_index: 1 }
  const result = decodeState0(PACKET, [makeUtxo(), second])
  assert.equal(result.status, 'UNVERIFIED')
  if (result.status !== 'UNVERIFIED') return
  assert.match(result.reason, /exactly one qualifying pool candidate/)
})

test('field count is strict', () => {
  const malformed = constr0([
    assetClass(SNEK_POOL_NFT_POLICY_ID, POOL_NFT_NAME_HEX),
    assetClass('', ''),
    assetClass(PRE_POLICY_ID, PRE_ASSET_NAME_HEX),
    uint(1n),
    uint(1n),
    constr0([]),
    uint(1n),
    constr0([]),
  ])
  assert.throws(() => decodePreSnekDatum(malformed), /9 fields/)
})

// Keep explicit constants in the fixture test so the exact machine identity
// remains visible and cannot silently regress.

test('canonical PRE identity is exactly policy + asset name', () => {
  assert.equal(PRE_UNIT, PRE_POLICY_ID + PRE_ASSET_NAME_HEX)
  assert.equal(PRE_ASSET_NAME_HEX, '5052452d52494348')
})

console.log('PRE Snek State-0 decoder fixture tests passed.')
