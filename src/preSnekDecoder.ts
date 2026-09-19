/**
 * PRE-RICH / Snek State-0 evidence decoder.
 *
 * Scope: deterministic decoding of an already-normalized Cardano-mainnet
 * evidence packet. This module intentionally does not acquire data from an
 * external provider and does not infer missing economic state.
 */

export const PRE_POLICY_ID = '1b29fda97d0fd321398c5b7b3285fdaadd519a0d002932853311f02c'
export const PRE_ASSET_NAME_HEX = '5052452d52494348'
export const PRE_UNIT = `${PRE_POLICY_ID}${PRE_ASSET_NAME_HEX}`

export const SNEK_CURVE_VALIDATOR_HASH =
  '905ab869961b094f1b8197278cfe15b45cbe49fa8f32c6b014f85a2d'
export const SNEK_POOL_NFT_POLICY_ID =
  '63f947b8d9535bc4e4ce6919e3dc056547e8d30ada12f29aa5f826b8'

const HEX = /^[0-9a-fA-F]+$/
const HASH = /^[0-9a-fA-F]{64}$/

export type CredentialData = PlutusData

export type AssetClass = {
  policyId: string
  nameHex: string
  encoding: 'asset-class-wrapper' | 'direct-pair'
}

export type PreSnekPoolDatum = {
  constructorIndex: 0
  fields: 9
  poolNft: AssetClass
  assetX: AssetClass
  assetY: AssetClass
  aNum: bigint
  bNum: bigint
  credential5: CredentialData
  thresholdLovelace: bigint
  credential7: CredentialData
  credential8: CredentialData
}

export type AssetEntry = {
  unit: string
  quantity: string
}

export type UtxoRecord = {
  tx_hash: string
  output_index: number
  address: string
  value: Record<string, string>
  assets: AssetEntry[]
  payment_credential: string
  datum_cbor?: string
  datum_hash?: string
  slot?: string
  block_height?: string
  block_time?: string
  deployment_version?: string
}

export type PreSnekEvidencePacket = {
  schema: 'immortal.pre-snek-evidence.v1'
  network: 'Cardano-mainnet'
  provider: { name: string; version: string }
  retrieved_at: string
  request: { asset_policy: string; asset_name: string }
  raw_response: unknown
  response_hash: string
}

export type PreSnekState0 = {
  schema: 'immortal.pre-snek-state.v1'
  network: 'Cardano-mainnet'
  asset: { policy: string; name_hex: string }
  pool: {
    validator_hash: string
    pool_nft: { policy: string; name_hex: string; quantity: '1' }
    utxo: { tx_hash: string; output_index: number }
    address: string
  }
  reserves: { ada_lovelace: string; pre: string }
  curve: { a_num: string; b_num: string; threshold_lovelace: string }
  datum_cbor: string
  datum_hash: string
  slot: string
  block_height: string
  block_time: string
  deployment_version: string
  evidence_hash: string
}

export type State0Result =
  | { status: 'VERIFIED'; state: PreSnekState0 }
  | { status: 'UNVERIFIED'; reason: string; candidateCount: number }

type CborArray = PlutusData[]

type PlutusConstr = {
  kind: 'constr'
  index: number
  fields: PlutusData[]
}

export type PlutusData = bigint | Uint8Array | CborArray | PlutusConstr

class CborReader {
  private readonly bytes: Uint8Array
  private offset = 0

  constructor(bytes: Uint8Array) {
    this.bytes = bytes
  }

  read(): PlutusData {
    const initial = this.readByte()
    const major = initial >>> 5
    const additional = initial & 0x1f

    switch (major) {
      case 0:
        return this.readUnsigned(additional)
      case 1:
        return -(this.readUnsigned(additional) + 1n)
      case 2:
        return this.readBytes(this.readLength(additional))
      case 4:
        return this.readArray(this.readLength(additional))
      case 6:
        return this.readTag(additional)
      default:
        throw new Error(`unsupported CBOR major type ${major}`)
    }
  }

  assertDone(): void {
    if (this.offset !== this.bytes.length) {
      throw new Error('trailing bytes after Plutus Data')
    }
  }

  private readByte(): number {
    if (this.offset >= this.bytes.length) throw new Error('unexpected end of CBOR')
    return this.bytes[this.offset++]
  }

  private readN(count: number): Uint8Array {
    if (count < 0 || this.offset + count > this.bytes.length) {
      throw new Error('CBOR length exceeds input')
    }
    const out = this.bytes.slice(this.offset, this.offset + count)
    this.offset += count
    return out
  }

  private readLength(additional: number): number {
    if (additional < 24) return additional
    if (additional === 24) return Number(this.readUnsigned(additional))
    if (additional === 25) return Number(this.readUnsigned(additional))
    if (additional === 26) return Number(this.readUnsigned(additional))
    if (additional === 27) {
      const n = this.readUnsigned(additional)
      if (n > BigInt(Number.MAX_SAFE_INTEGER)) throw new Error('CBOR array/bytes length is unsafe')
      return Number(n)
    }
    throw new Error('indefinite or reserved CBOR length is not canonical here')
  }

  private readUnsigned(additional: number): bigint {
    if (additional < 24) return BigInt(additional)
    if (additional === 24) return BigInt(this.readByte())
    if (additional === 25) {
      const b = this.readN(2)
      return BigInt((b[0] << 8) | b[1])
    }
    if (additional === 26) {
      const b = this.readN(4)
      return BigInt(b[0]) * 2n ** 24n + BigInt(b[1]) * 2n ** 16n + BigInt(b[2]) * 2n ** 8n + BigInt(b[3])
    }
    if (additional === 27) {
      const b = this.readN(8)
      let n = 0n
      for (const byte of b) n = (n << 8n) | BigInt(byte)
      return n
    }
    throw new Error('invalid CBOR additional information for integer')
  }

  private readBytes(length: number): Uint8Array {
    return this.readN(length)
  }

  private readArray(length: number): PlutusData[] {
    const out: PlutusData[] = []
    for (let i = 0; i < length; i++) out.push(this.read())
    return out
  }

  private readTag(additional: number): PlutusData {
    const tag = Number(this.readUnsigned(additional))
    if (tag >= 121 && tag <= 127) {
      const fields = this.read()
      if (!Array.isArray(fields)) throw new Error('constructor payload must be a CBOR list')
      return { kind: 'constr', index: tag - 121, fields }
    }
    if (tag >= 1280 && tag <= 1400) {
      const fields = this.read()
      if (!Array.isArray(fields)) throw new Error('constructor payload must be a CBOR list')
      return { kind: 'constr', index: tag - 1280 + 7, fields }
    }
    if (tag === 102) {
      const payload = this.read()
      if (!Array.isArray(payload) || payload.length !== 2) throw new Error('general constructor payload must be [index, fields]')
      const index = payload[0]
      const fields = payload[1]
      if (typeof index !== 'bigint' || index < 0n) throw new Error('general constructor index must be a non-negative integer')
      if (!Array.isArray(fields)) throw new Error('general constructor fields must be a list')
      return { kind: 'constr', index: Number(index), fields }
    }
    throw new Error(`unsupported CBOR tag ${tag}`)
  }
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
}

function hexToBytes(hex: string): Uint8Array {
  if (hex.length === 0) return new Uint8Array()
  if (hex.length % 2 !== 0 || !HEX.test(hex)) throw new Error('invalid hex')
  const out = new Uint8Array(hex.length / 2)
  for (let i = 0; i < out.length; i++) out[i] = Number.parseInt(hex.slice(i * 2, i * 2 + 2), 16)
  return out
}

export function parsePlutusData(cborHex: string): PlutusData {
  const clean = cborHex.startsWith('0x') ? cborHex.slice(2) : cborHex
  const reader = new CborReader(hexToBytes(clean))
  const data = reader.read()
  reader.assertDone()
  return data
}

function asConstr(value: PlutusData): PlutusConstr {
  if (typeof value === 'object' && value !== null && !Array.isArray(value) && 'kind' in value && value.kind === 'constr') {
    return value as PlutusConstr
  }
  throw new Error('expected Plutus constructor')
}

function asBytes(value: PlutusData): string {
  if (value instanceof Uint8Array) return bytesToHex(value)
  throw new Error('expected Plutus bytes')
}

function asInteger(value: PlutusData): bigint {
  if (typeof value === 'bigint') return value
  throw new Error('expected Plutus integer')
}

function decodePair(fields: PlutusData[]): { policyId: string; nameHex: string } {
  if (fields.length !== 2) throw new Error('asset-class pair must contain exactly two byte strings')
  return { policyId: asBytes(fields[0]), nameHex: asBytes(fields[1]) }
}

export function decodeAssetClass(value: PlutusData): AssetClass {
  const outer = asConstr(value)
  if (outer.index !== 0) throw new Error('asset-class constructor index must be 0')

  if (outer.fields.length === 1) {
    const pair = asConstr(outer.fields[0])
    if (pair.index !== 0) throw new Error('asset-class pair constructor index must be 0')
    return { ...decodePair(pair.fields), encoding: 'asset-class-wrapper' }
  }

  if (outer.fields.length === 2) {
    return { ...decodePair(outer.fields), encoding: 'direct-pair' }
  }

  throw new Error('asset-class must be wrapper[pair] or direct pair')
}

export function decodePreSnekDatum(cborHex: string): PreSnekPoolDatum {
  const root = asConstr(parsePlutusData(cborHex))
  if (root.index !== 0) throw new Error('pool datum constructor index must be 0')
  if (root.fields.length !== 9) throw new Error(`pool datum must contain 9 fields, got ${root.fields.length}`)

  const poolNft = decodeAssetClass(root.fields[0])
  const assetX = decodeAssetClass(root.fields[1])
  const assetY = decodeAssetClass(root.fields[2])
  const aNum = asInteger(root.fields[3])
  const bNum = asInteger(root.fields[4])
  const thresholdLovelace = asInteger(root.fields[6])

  if (aNum <= 0n || bNum <= 0n || thresholdLovelace <= 0n) {
    throw new Error('curve parameters and threshold must be strictly positive')
  }

  return {
    constructorIndex: 0,
    fields: 9,
    poolNft,
    assetX,
    assetY,
    aNum,
    bNum,
    credential5: root.fields[5],
    thresholdLovelace,
    credential7: root.fields[7],
    credential8: root.fields[8],
  }
}

function unitOf(asset: AssetClass): string {
  return asset.policyId + asset.nameHex
}

function valueAmount(utxo: UtxoRecord, unit: string): bigint {
  const direct = utxo.value[unit]
  if (direct !== undefined) return BigInt(direct)
  const asset = utxo.assets.find((entry) => entry.unit === unit)
  if (asset) return BigInt(asset.quantity)
  return 0n
}

function requireHex(value: string, name: string): void {
  if (value.length % 2 !== 0 || (value.length > 0 && !HEX.test(value))) throw new Error(`${name} is not valid hex`)
}

function validatePacket(packet: PreSnekEvidencePacket): void {
  if (packet.schema !== 'immortal.pre-snek-evidence.v1') throw new Error('wrong evidence schema')
  if (packet.network !== 'Cardano-mainnet') throw new Error('evidence is not Cardano-mainnet')
  if (!packet.provider.name || !packet.provider.version) throw new Error('provider identity missing')
  if (Number.isNaN(Date.parse(packet.retrieved_at))) throw new Error('retrieved_at is not a valid timestamp')
  if (packet.request.asset_policy !== PRE_POLICY_ID || packet.request.asset_name !== PRE_ASSET_NAME_HEX) throw new Error('PRE request identity mismatch')
  if (!/^sha256:[0-9a-f]{64}$/.test(packet.response_hash)) throw new Error('response_hash must be sha256:<64 hex>')
}

function validateUtxoEnvelope(utxo: UtxoRecord): void {
  if (!HASH.test(utxo.tx_hash)) throw new Error('invalid tx_hash')
  if (!Number.isInteger(utxo.output_index) || utxo.output_index < 0) throw new Error('invalid output_index')
  if (!utxo.address) throw new Error('address missing')
  if (!utxo.payment_credential) throw new Error('payment credential missing')
  const datum = utxo.datum_cbor
  if (!datum) throw new Error('datum_cbor missing')
  requireHex(datum.startsWith('0x') ? datum.slice(2) : datum, 'datum_cbor')
}

export function validateState0Candidate(utxo: UtxoRecord): PreSnekState0 {
  validateUtxoEnvelope(utxo)
  if (utxo.payment_credential !== SNEK_CURVE_VALIDATOR_HASH) throw new Error('not the Snek curve validator')

  const datumCbor = utxo.datum_cbor as string
  const datum = decodePreSnekDatum(datumCbor)

  if (datum.assetX.policyId !== '' || datum.assetX.nameHex !== '') throw new Error('asset_x is not ADA')
  if (datum.assetY.policyId !== PRE_POLICY_ID || datum.assetY.nameHex !== PRE_ASSET_NAME_HEX) throw new Error('asset_y is not PRE-RICH')
  if (datum.poolNft.policyId !== SNEK_POOL_NFT_POLICY_ID) throw new Error('pool NFT policy mismatch')

  const poolNftUnit = unitOf(datum.poolNft)
  if (valueAmount(utxo, poolNftUnit) !== 1n) throw new Error('pool NFT quantity must be exactly 1')

  const preAmount = valueAmount(utxo, PRE_UNIT)
  if (preAmount <= 0n) throw new Error('PRE reserve is missing or non-positive')

  const adaAmount = valueAmount(utxo, 'lovelace')
  if (adaAmount < 0n) throw new Error('ADA reserve cannot be negative')

  if (!utxo.slot || !utxo.block_height || !utxo.block_time || !utxo.deployment_version) {
    throw new Error('state-0 deployment evidence fields are incomplete')
  }

  const datumHash = utxo.datum_hash ?? ''
  if (!HASH.test(datumHash)) throw new Error('datum_hash missing or invalid')

  return {
    schema: 'immortal.pre-snek-state.v1',
    network: 'Cardano-mainnet',
    asset: { policy: PRE_POLICY_ID, name_hex: PRE_ASSET_NAME_HEX },
    pool: {
      validator_hash: SNEK_CURVE_VALIDATOR_HASH,
      pool_nft: { policy: datum.poolNft.policyId, name_hex: datum.poolNft.nameHex, quantity: '1' },
      utxo: { tx_hash: utxo.tx_hash, output_index: utxo.output_index },
      address: utxo.address,
    },
    reserves: { ada_lovelace: adaAmount.toString(), pre: preAmount.toString() },
    curve: {
      a_num: datum.aNum.toString(),
      b_num: datum.bNum.toString(),
      threshold_lovelace: datum.thresholdLovelace.toString(),
    },
    datum_cbor: datumCbor,
    datum_hash: datumHash,
    slot: utxo.slot,
    block_height: utxo.block_height,
    block_time: utxo.block_time,
    deployment_version: utxo.deployment_version,
    evidence_hash: '',
  }
}

export function decodeState0(packet: PreSnekEvidencePacket, utxos: UtxoRecord[]): State0Result {
  try {
    validatePacket(packet)
    const validStates: PreSnekState0[] = []
    const failures: string[] = []

    for (const utxo of utxos) {
      try {
        validStates.push(validateState0Candidate(utxo))
      } catch (error) {
        failures.push(error instanceof Error ? error.message : String(error))
      }
    }

    if (validStates.length === 0) {
      return {
        status: 'UNVERIFIED',
        reason: failures.length === 0 ? 'no UTxO candidates supplied' : failures[0],
        candidateCount: 0,
      }
    }

    if (validStates.length !== 1) {
      return {
        status: 'UNVERIFIED',
        reason: `expected exactly one qualifying pool candidate, found ${validStates.length}`,
        candidateCount: validStates.length,
      }
    }

    const state = validStates[0]
    state.evidence_hash = packet.response_hash
    return { status: 'VERIFIED', state }
  } catch (error) {
    return {
      status: 'UNVERIFIED',
      reason: error instanceof Error ? error.message : String(error),
      candidateCount: 0,
    }
  }
}
