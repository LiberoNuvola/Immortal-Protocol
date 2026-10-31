#!/usr/bin/env node
/**
 * Read-only WingRiders V2 USDM pool observer.
 *
 * Authenticates the policy from the official WingRiders V2 factory-token
 * reference UTxO, derives each unique share-token name from the official
 * datum formula, and validates pool validity token, script address, datum,
 * and active reserves against the SuperCardano independent indexer.
 */
import { blake2b } from '@noble/hashes/blake2.js'
import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'

const KOIOS = 'https://api.koios.rest/api/v1'
const USDM = {
  policyId: 'c48cbb3d5e57ed56e276bc45f99ab39abe94e6cd7ac39fb402da47ad',
  assetNameHex: '0014df105553444d',
}
const USDM_UNIT = USDM.policyId + USDM.assetNameHex
const FACTORY_TOKEN_UTXO = '914a0f1e615f41b3f462855f6052a6b37d1d291aab53918ad4c9d5f4245204ce#1'
const FACTORY_TOKEN_NAME_HEX = '46' // ASCII "F", from official DEX constants
const POOL_VALIDITY_TOKEN_NAME_HEX = '4c' // ASCII "L", from official DEX constants
const POOL_OIL_ADA = 3_000_000n
const FEE_BASIS = 10_000n
const MAINNET_POOL_SCRIPT_HASHES = {
  ConstantProduct: 'af97793b8702f381976cec83e303e9ce17781458c73c4bb16fe02b83',
  Stableswap: '946ae228430f2fc64aa8b3acb910ee27e9b3e47aa8f925fac27834a1',
}

function sha256(raw) {
  return createHash('sha256').update(raw).digest('hex')
}
function argValue(argv, flag, fallback) {
  const i = argv.indexOf(flag)
  return i >= 0 && argv[i + 1] ? resolve(argv[i + 1]) : resolve(fallback)
}
function bytes(value, name) {
  if (!value || typeof value.bytes !== 'string' || !/^(?:[0-9a-f]{2})*$/i.test(value.bytes)) {
    throw new Error(name + '_BYTES_INVALID')
  }
  return value.bytes.toLowerCase()
}
function integer(value, name) {
  if (!value || !['number', 'string', 'bigint'].includes(typeof value.int)) {
    throw new Error(name + '_INT_INVALID')
  }
  const raw = String(value.int)
  if (!/^-?\d+$/.test(raw)) throw new Error(name + '_INT_INVALID')
  return BigInt(raw)
}
function constr(value, index, name) {
  if (!value || value.constructor !== index || !Array.isArray(value.fields)) {
    throw new Error(name + '_CONSTR_' + index + '_INVALID')
  }
  return value.fields
}
function unit(symbol, token) {
  return symbol + token
}
function parseAsset(symbol, token, name) {
  const policyId = bytes(symbol, name + '_POLICY')
  const assetNameHex = bytes(token, name + '_NAME')
  if (policyId === '' && assetNameHex === '') return { policyId, assetNameHex, unit: '' }
  if (policyId.length !== 56) throw new Error(name + '_POLICY_LENGTH_INVALID')
  return { policyId, assetNameHex, unit: unit(policyId, assetNameHex) }
}
function parsePoolDatum(value) {
  const fields = constr(value, 0, 'WINGRIDERS_POOL_DATUM')
  if (fields.length !== 21) throw new Error('WINGRIDERS_POOL_DATUM_FIELD_COUNT_INVALID')
  const datum = {
    requestValidatorHash: bytes(fields[0], 'REQUEST_VALIDATOR_HASH'),
    assetA: parseAsset(fields[1], fields[2], 'ASSET_A'),
    assetB: parseAsset(fields[3], fields[4], 'ASSET_B'),
    swapFeeInBasis: integer(fields[5], 'SWAP_FEE'),
    protocolFeeInBasis: integer(fields[6], 'PROTOCOL_FEE'),
    projectFeeInBasis: integer(fields[7], 'PROJECT_FEE'),
    reserveFeeInBasis: integer(fields[8], 'RESERVE_FEE'),
    feeBasis: integer(fields[9], 'FEE_BASIS'),
    agentFeeAda: integer(fields[10], 'AGENT_FEE_ADA'),
    lastInteraction: integer(fields[11], 'LAST_INTERACTION'),
    treasuryA: integer(fields[12], 'TREASURY_A'),
    treasuryB: integer(fields[13], 'TREASURY_B'),
    projectTreasuryA: integer(fields[14], 'PROJECT_TREASURY_A'),
    projectTreasuryB: integer(fields[15], 'PROJECT_TREASURY_B'),
    reserveTreasuryA: integer(fields[16], 'RESERVE_TREASURY_A'),
    reserveTreasuryB: integer(fields[17], 'RESERVE_TREASURY_B'),
    projectBeneficiary: fields[18],
    reserveBeneficiary: fields[19],
    poolSpecifics: fields[20],
  }
  if (datum.assetA.unit === datum.assetB.unit) throw new Error('WINGRIDERS_POOL_IDENTICAL_PAIR_ASSETS')
  if (datum.feeBasis !== FEE_BASIS) throw new Error('WINGRIDERS_FEE_BASIS_UNEXPECTED')
  for (const [name, value] of Object.entries(datum)) {
    if (typeof value === 'bigint' && value < 0n) throw new Error('WINGRIDERS_' + name.toUpperCase() + '_NEGATIVE')
  }
  for (const [name, fee] of Object.entries({
    swapFeeInBasis: datum.swapFeeInBasis,
    protocolFeeInBasis: datum.protocolFeeInBasis,
    projectFeeInBasis: datum.projectFeeInBasis,
    reserveFeeInBasis: datum.reserveFeeInBasis,
  })) {
    if (fee > datum.feeBasis) throw new Error('WINGRIDERS_' + name.toUpperCase() + '_OUT_OF_RANGE')
  }
  const specifics = constr(datum.poolSpecifics, 0, 'POOL_SPECIFICS')
  if (specifics.length === 0) {
    datum.poolType = 'ConstantProduct'
    datum.poolTypeId = '0'
    datum.aScale = 1n
    datum.bScale = 1n
    datum.parameterD = null
  } else if (specifics.length === 3) {
    datum.poolType = 'Stableswap'
    datum.poolTypeId = '1'
    datum.parameterD = integer(specifics[0], 'PARAMETER_D')
    datum.aScale = integer(specifics[1], 'A_SCALE')
    datum.bScale = integer(specifics[2], 'B_SCALE')
    if (datum.parameterD <= 0n || datum.aScale <= 0n || datum.bScale <= 0n) {
      throw new Error('WINGRIDERS_STABLESWAP_SPECIFICS_NONPOSITIVE')
    }
    if (datum.aScale !== 1n && datum.bScale !== 1n) {
      throw new Error('WINGRIDERS_STABLESWAP_SCALE_INVALID')
    }
  } else {
    throw new Error('WINGRIDERS_POOL_SPECIFICS_SHAPE_UNSUPPORTED')
  }
  return datum
}
function blake256(data) {
  return blake2b(data, { dkLen: 32 })
}
function deriveShareTokenName(datum) {
  const assetA = Buffer.concat([
    Buffer.from(datum.assetA.policyId, 'hex'),
    Buffer.from(datum.assetA.assetNameHex, 'hex'),
  ])
  const assetB = Buffer.concat([
    Buffer.from(datum.assetB.policyId, 'hex'),
    Buffer.from(datum.assetB.assetNameHex, 'hex'),
  ])
  const parts = [
    blake256(Buffer.from(datum.poolTypeId, 'utf8')),
    blake256(Buffer.from(datum.aScale.toString(), 'utf8')),
    blake256(Buffer.from(datum.bScale.toString(), 'utf8')),
    blake256(assetA),
    blake256(assetB),
  ]
  return Buffer.from(blake256(Buffer.concat(parts))).toString('hex')
}
function keyToShareToken(pool) {
  const prefix = 'wingriders-v2:'
  const key = String(pool.key ?? '')
  if (!key.startsWith(prefix)) throw new Error('WINGRIDERS_POOL_KEY_PREFIX_INVALID')
  const fullUnit = key.slice(prefix.length).toLowerCase()
  const policyId = fullUnit.slice(0, 56)
  const assetNameHex = fullUnit.slice(56)
  if (policyId.length !== 56 || assetNameHex.length !== 64) throw new Error('WINGRIDERS_SHARE_TOKEN_ID_INVALID')
  return { fullUnit, policyId, assetNameHex }
}
function quantityOf(utxo, assetUnit) {
  if (assetUnit === '') return BigInt(String(utxo.value ?? '0'))
  const a = (utxo.asset_list ?? []).find((x) =>
    String(x.policy_id ?? '').toLowerCase() + String(x.asset_name ?? '').toLowerCase() === assetUnit)
  return BigInt(String(a?.quantity ?? '0'))
}
async function koios(path, body) {
  const url = KOIOS + path
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json', accept: 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(45_000),
  })
  const rawBody = await response.text()
  const evidence = {
    url, method: 'POST', status: response.status,
    responseDate: response.headers.get('date'),
    bodySha256: sha256(rawBody), bodyBytes: Buffer.byteLength(rawBody), rawBody,
  }
  if (!response.ok) throw Object.assign(new Error('KOIOS_' + path.slice(1).toUpperCase() + '_HTTP_' + response.status), { evidence })
  return { json: JSON.parse(rawBody), evidence }
}

async function main() {
  const argv = process.argv.slice(2)
  const superPath = argValue(argv, '--supercardano', 'audit/indexer/supercardano-usdm-readonly.json')
  const outPath = argValue(argv, '--out', 'audit/oracles/wingriders-v2-usdm-readonly.json')
  const startedAt = new Date().toISOString()
  const supercardano = JSON.parse(await readFile(superPath, 'utf8'))
  if (supercardano.network !== 'cardano-mainnet' || supercardano.unit?.toLowerCase() !== USDM_UNIT) {
    throw new Error('WINGRIDERS_SUPERCARDANO_INPUT_ASSET_OR_NETWORK_INVALID')
  }
  const pools = (supercardano.pools ?? []).filter((p) => p.venue === 'wingriders-v2')
  const shareMap = new Map()
  for (const pool of pools) {
    const share = keyToShareToken(pool)
    if (!shareMap.has(share.fullUnit)) shareMap.set(share.fullUnit, { share, pool })
  }
  const requested = [...shareMap.values()]
  if (requested.length === 0) throw new Error('WINGRIDERS_NO_USDM_POOLS_DISCOVERED')

  const policyIds = [...new Set(requested.map(({ share }) => share.policyId))]
  if (policyIds.length !== 1) throw new Error('WINGRIDERS_MULTIPLE_SHARE_TOKEN_POLICIES')
  const observedPolicyId = policyIds[0]
  const factoryTokenUnit = observedPolicyId + FACTORY_TOKEN_NAME_HEX
  const validityTokenUnit = observedPolicyId + POOL_VALIDITY_TOKEN_NAME_HEX
  const [poolResponse] = await Promise.all([
    koios('/asset_utxos?limit=1000&offset=0', {
      _asset_list: [
        ...requested.map(({ share }) => [share.policyId, share.assetNameHex]),
        [observedPolicyId, FACTORY_TOKEN_NAME_HEX],
      ],
      _extended: true,
    }),
  ])
  const factoryTokenRows = poolResponse.json.filter((row) => quantityOf(row, factoryTokenUnit) > 0n)
  const factoryTokenTotal = factoryTokenRows.reduce((sum, row) => sum + quantityOf(row, factoryTokenUnit), 0n)
  // Factory split operations can leave multiple live factory UTxOs. The
  // on-chain validator mints one additional F token per split, so cardinality
  // greater than one is expected; require every discovered factory output to
  // carry exactly one F token instead of assuming a single factory UTxO.
  if (factoryTokenRows.length === 0 || factoryTokenRows.some((row) => quantityOf(row, factoryTokenUnit) !== 1n)) {
    throw Object.assign(new Error('WINGRIDERS_FACTORY_TOKEN_F_MISSING_OR_NONUNIT'), {
      evidence: {
        policyId: observedPolicyId,
        factoryTokenUnit,
        factoryTokenUtxos: factoryTokenRows.map((row) => ({
          utxoRef: String(row.tx_hash) + '#' + String(row.tx_index),
          quantityRaw: quantityOf(row, factoryTokenUnit).toString(),
          address: row.address ?? null,
          paymentCredential: row.payment_cred ?? null,
          datumHash: row.datum_hash ?? null,
        })),
        poolAssetResponse: poolResponse.evidence,
      },
    })
  }
  const factoryTokenUtxoCount = factoryTokenRows.length
  // Share tokens are fungible and may be held by many wallets. The actual
  // pool UTxO is distinguished by exactly one validity token L and an official
  // pool validator payment credential; do not treat LP-holder UTxOs as pools.
  const officialPoolCredentials = new Set(Object.values(MAINNET_POOL_SCRIPT_HASHES))
  const byShare = new Map()
  for (const row of poolResponse.json) {
    if (quantityOf(row, validityTokenUnit) !== 1n) continue
    if (!officialPoolCredentials.has(String(row.payment_cred ?? '').toLowerCase())) continue
    for (const a of row.asset_list ?? []) {
      const shareUnit = String(a.policy_id ?? '').toLowerCase() + String(a.asset_name ?? '').toLowerCase()
      if (shareMap.has(shareUnit)) {
        if (!byShare.has(shareUnit)) byShare.set(shareUnit, [])
        byShare.get(shareUnit).push(row)
      }
    }
  }

  const results = []
  for (const { share, pool } of requested) {
    const rows = byShare.get(share.fullUnit) ?? []
    if (rows.length === 0) {
      results.push({ status: 'NO_CURRENT_UTXO_FOR_SHARE_TOKEN', share, poolKey: pool.key, poolHeight: pool.height, poolTime: pool.time })
      continue
    }
    if (rows.length !== 1) {
      results.push({ status: 'POOL_UTXO_CARDINALITY_INVALID', share, poolKey: pool.key, rowCount: rows.length })
      continue
    }
    const utxo = rows[0]
    try {
      if (share.policyId !== observedPolicyId) throw new Error('WINGRIDERS_POOL_POLICY_DIFFERS_FROM_FACTORY_POLICY')
      const shareQty = quantityOf(utxo, share.fullUnit)
      if (shareQty <= 0n) throw new Error('WINGRIDERS_SHARE_TOKEN_QUANTITY_NONPOSITIVE')
      const validityUnit = validityTokenUnit
      const validityQty = quantityOf(utxo, validityUnit)
      if (validityQty !== 1n) throw new Error('WINGRIDERS_POOL_VALIDITY_TOKEN_NOT_ONE')
      if (!utxo.inline_datum?.value) throw new Error('WINGRIDERS_POOL_INLINE_DATUM_MISSING')
      const datum = parsePoolDatum(utxo.inline_datum.value)
      if (datum.assetA.unit !== USDM_UNIT && datum.assetB.unit !== USDM_UNIT) {
        throw new Error('WINGRIDERS_DATUM_NOT_EXACT_USDM_PAIR')
      }
      const derivedShareName = deriveShareTokenName(datum)
      if (derivedShareName !== share.assetNameHex) throw new Error('WINGRIDERS_DERIVED_SHARE_TOKEN_NAME_MISMATCH')
      const expectedScriptHash = MAINNET_POOL_SCRIPT_HASHES[datum.poolType]
      const paymentCredential = String(utxo.payment_cred ?? '').toLowerCase()
      if (paymentCredential !== expectedScriptHash) throw new Error('WINGRIDERS_POOL_PAYMENT_CREDENTIAL_MISMATCH')
      const sameOrder = String(pool.assetA ?? '').toLowerCase() === datum.assetA.unit &&
        String(pool.assetB ?? '').toLowerCase() === datum.assetB.unit
      const reverseOrder = String(pool.assetA ?? '').toLowerCase() === datum.assetB.unit &&
        String(pool.assetB ?? '').toLowerCase() === datum.assetA.unit
      if (!sameOrder && !reverseOrder) throw new Error('WINGRIDERS_SUPERCARDANO_DATUM_PAIR_MISMATCH')
      const rawA = quantityOf(utxo, datum.assetA.unit)
      const rawB = quantityOf(utxo, datum.assetB.unit)
      const activeA = rawA - datum.treasuryA - datum.projectTreasuryA - datum.reserveTreasuryA -
        (datum.assetA.unit === '' ? POOL_OIL_ADA : 0n)
      const activeB = rawB - datum.treasuryB - datum.projectTreasuryB - datum.reserveTreasuryB
      if (activeA <= 0n || activeB <= 0n) throw new Error('WINGRIDERS_ACTIVE_RESERVE_NONPOSITIVE')
      if (datum.assetA.unit !== '' && BigInt(String(utxo.value ?? '0')) < POOL_OIL_ADA) {
        throw new Error('WINGRIDERS_POOL_OIL_ADA_MISSING')
      }
      const scReserveA = BigInt(String(sameOrder ? pool.reserveA : pool.reserveB))
      const scReserveB = BigInt(String(sameOrder ? pool.reserveB : pool.reserveA))
      const reserveMatch = activeA === scReserveA && activeB === scReserveB
      // SuperCardano lp metric is retained for audit but is not assumed
      // semantically identical to the share-token reserve in the pool UTxO.
      const scLp = pool.lp === null || pool.lp === undefined ? null : String(pool.lp)
      const assetCount = (utxo.asset_list ?? []).length + 1 // include ADA
      const expectedAssetCount = datum.assetA.unit === '' ? 4 : 5
      if (assetCount !== expectedAssetCount) throw new Error('WINGRIDERS_POOL_ASSET_COMPOSITION_COUNT_INVALID')
      results.push({
        status: reserveMatch ? 'MATCH' : 'ACTIVE_RESERVE_MISMATCH',
        officialPolicyIdMatches: share.policyId === observedPolicyId,
        poolKey: pool.key,
        poolType: datum.poolType,
        shareToken: share,
        derivedShareTokenName: derivedShareName,
        validityTokenUnit: validityUnit,
        validityTokenQuantityRaw: validityQty.toString(),
        shareTokenQuantityRaw: shareQty.toString(),
        supercardanoLpQuantityRaw: scLp,
        supercardanoLpMetricRaw: scLp,
        paymentCredential,
        expectedPaymentCredential: expectedScriptHash,
        paymentCredentialMatchesOfficial: true,
        utxoRef: String(utxo.tx_hash).toLowerCase() + '#' + String(utxo.tx_index),
        address: utxo.address ?? null,
        datumHash: utxo.datum_hash ?? null,
        inlineDatumCborHex: utxo.inline_datum.bytes ?? null,
        datum: {
          assetA: datum.assetA, assetB: datum.assetB,
          swapFeeInBasis: datum.swapFeeInBasis.toString(),
          protocolFeeInBasis: datum.protocolFeeInBasis.toString(),
          projectFeeInBasis: datum.projectFeeInBasis.toString(),
          reserveFeeInBasis: datum.reserveFeeInBasis.toString(),
          feeBasis: datum.feeBasis.toString(),
          lastInteraction: datum.lastInteraction.toString(),
          treasuryA: datum.treasuryA.toString(),
          treasuryB: datum.treasuryB.toString(),
          projectTreasuryA: datum.projectTreasuryA.toString(),
          projectTreasuryB: datum.projectTreasuryB.toString(),
          reserveTreasuryA: datum.reserveTreasuryA.toString(),
          reserveTreasuryB: datum.reserveTreasuryB.toString(),
          aScale: datum.aScale.toString(), bScale: datum.bScale.toString(),
          parameterD: datum.parameterD?.toString() ?? null,
        },
        rawValueReserveARaw: rawA.toString(),
        rawValueReserveBRaw: rawB.toString(),
        activeReserveARaw: activeA.toString(),
        activeReserveBRaw: activeB.toString(),
        supercardanoReserveARaw: scReserveA.toString(),
        supercardanoReserveBRaw: scReserveB.toString(),
        exactActiveReserveMatch: reserveMatch,
        blockHeight: utxo.block_height ?? null,
        blockTime: utxo.block_time ?? null,
        supercardanoPoolHeight: pool.height ?? null,
        supercardanoPoolTime: pool.time ?? null,
        poolFreshnessAtSourceAsOf: pool.freshnessAtSourceAsOf ?? 'NOT_CLASSIFIED',
      })
    } catch (cause) {
      results.push({
        status: 'UNQUALIFIED_POOL',
        officialPolicyIdMatches: share.policyId === observedPolicyId,
        poolKey: pool.key,
        shareToken: share,
        utxoRef: String(utxo.tx_hash).toLowerCase() + '#' + String(utxo.tx_index),
        paymentCredential: utxo.payment_cred ?? null,
        error: cause instanceof Error ? cause.message : String(cause),
        datumHash: utxo.datum_hash ?? null,
        inlineDatumCborHex: utxo.inline_datum?.bytes ?? null,
        blockHeight: utxo.block_height ?? null,
        blockTime: utxo.block_time ?? null,
      })
    }
  }

  const evidence = {
    schema: 'immortal-wingriders-v2-usdm-readonly-v1',
    classification: 'WINGRIDERS_V2_POOL_IDENTITY_DATUM_VALUE_RECONCILIATION_NOT_PRICE_OR_ORACLE_QUALIFICATION',
    network: 'cardano-mainnet',
    exactAsset: USDM,
    source: {
      provider: 'Koios',
      baseUrl: KOIOS,
      officialRepository: 'https://github.com/WingRiders/dex-v2-contracts',
      officialFactoryTokenNameHex: FACTORY_TOKEN_NAME_HEX,
      poolValidityTokenNameHex: POOL_VALIDITY_TOKEN_NAME_HEX,
      observedPolicyIdFromShareAndFactoryTokens: observedPolicyId,
      policySeedReferenceUtxo: FACTORY_TOKEN_UTXO,
      mainnetPoolScriptHashes: MAINNET_POOL_SCRIPT_HASHES,
    },
    discoverySource: {
      provider: 'SuperCardano',
      sourceMeta: supercardano.sourceMeta,
      startedAt: supercardano.startedAt,
      completedAt: supercardano.completedAt,
      poolCount: pools.length,
    },
    startedAt,
    completedAt: new Date().toISOString(),
    acquisition: {
      poolAndFactoryTokenAssetUtxos: poolResponse.evidence,
      factoryToken: {
        unit: factoryTokenUnit,
        totalQuantityRaw: factoryTokenTotal.toString(),
        utxoCount: factoryTokenRows.length,
        utxos: factoryTokenRows.map((row) => ({
          utxoRef: String(row.tx_hash) + '#' + String(row.tx_index),
          quantityRaw: quantityOf(row, factoryTokenUnit).toString(),
          address: row.address ?? null,
          paymentCredential: row.payment_cred ?? null,
          datumHash: row.datum_hash ?? null,
        })),
      },
      requestedShareTokens: requested.map(({ share }) => share),
    },
    summary: {
      poolShareTokensDiscovered: requested.length,
      currentUtxoCount: results.filter((r) => r.utxoRef).length,
      matchedCount: results.filter((r) => r.status === 'MATCH').length,
      activeReserveMismatchCount: results.filter((r) => r.status === 'ACTIVE_RESERVE_MISMATCH').length,
      unqualifiedCount: results.filter((r) => r.status === 'UNQUALIFIED_POOL').length,
      missingCurrentUtxoCount: results.filter((r) => r.status === 'NO_CURRENT_UTXO_FOR_SHARE_TOKEN').length,
      cardinalityErrorCount: results.filter((r) => r.status === 'POOL_UTXO_CARDINALITY_INVALID').length,
      paymentCredentialOfficialMatches: results.filter((r) => r.paymentCredentialMatchesOfficial).length,
      factoryTokenUtxoCount: factoryTokenRows.length,
      factoryTokenQuantityRaw: factoryTokenTotal.toString(),
    },
    pools: results,
    limitations: [
      'The observed policy id is taken from the SuperCardano share-token unit and independently required to contain the current official factory token F and each pool validity token L; the official source pins the minting-policy seed reference UTxO. Each share-token name is re-derived from the official blake2b-256 formula and its actual PoolDatum.',
      'The mainnet pool payment script hashes are anchored by Cardanoscan pages explicitly labeled WingRiders V2 Constant Product Pool and Stableswap Pool; each observed UTxO payment credential must match its datum pool type.',
      'A MATCH confirms pool NFT/share token identity, validity token, pool script credential, pair identity and active reserve agreement with SuperCardano. It does not derive an executable swap quote or USD price.',
      'SuperCardano is an independent indexer, not a separate DEX venue or independent USD oracle.',
      'No USD/USDM peg, issuer reserve, oracle qualification, EEV valuation, deployment approval, wallet action, transaction, or chain write is produced.',
    ],
  }
  await mkdir(dirname(outPath), { recursive: true })
  await writeFile(outPath, JSON.stringify(evidence, null, 2) + '\n', 'utf8')
  console.log(JSON.stringify({
    status: 'READ_ONLY_WINGRIDERS_V2_OBSERVATION_COMPLETE',
    output: outPath,
    summary: evidence.summary,
    completedAt: evidence.completedAt,
  }, null, 2))
}

main().catch((error) => {
  console.error(JSON.stringify({
    status: 'READ_ONLY_WINGRIDERS_V2_OBSERVATION_FAILED',
    error: error instanceof Error ? error.message : String(error),
    evidence: error?.evidence ?? null,
    timestamp: new Date().toISOString(),
  }, null, 2))
  process.exitCode = 1
})
