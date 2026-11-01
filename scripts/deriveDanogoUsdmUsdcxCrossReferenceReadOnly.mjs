#!/usr/bin/env node
/**
 * Read-only marginal spot reconstruction for exact Moneta USDM / Circle USDCx
 * Danogo CLMM pools. Evidence only: not OracleQuote, peg decision, executable
 * quote, valuation input, or production integration.
 *
 * Integer math is pinned to official Danogo SDK commit:
 * https://github.com/dano-finance/clmm-sdk/blob/0416dc1f3531ce77eec7664ea3947f192a3aca40/src/utils.ts
 */
import { createHash } from 'node:crypto'
import { readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { resolve } from 'node:path'

export const USDM_UNIT = 'c48cbb3d5e57ed56e276bc45f99ab39abe94e6cd7ac39fb402da47ad0014df105553444d'
export const USDCX_UNIT = '1f3aec8bfe7ea4fe14c5f121e2a92e301afe414147860d557cac7e345553444378'
export const DANO_POOL_SCRIPT_HASH = 'd8b69fc53637bcfadbc4469083f706bc293f4d9d2296646c5ca167bb'
export const DANOGO_SDK_COMMIT = '0416dc1f3531ce77eec7664ea3947f192a3aca40'

function parsePositive(value, name) {
  const n = BigInt(String(value))
  if (n <= 0n) throw new Error(name + '_NONPOSITIVE')
  return n
}

function ceilDiv(a, b) {
  if (b <= 0n) throw new Error('DANO_CLMM_DIVISOR_NONPOSITIVE')
  const q = a / b
  const r = a % b
  return r === 0n ? q : q + 1n
}

function sqrtBigInt(value) {
  if (value < 0n) throw new Error('DANO_CLMM_SQRT_NEGATIVE')
  if (value < 2n) return value
  let x0 = value
  let x1 = (x0 + value / x0) >> 1n
  while (x1 < x0) {
    x0 = x1
    x1 = (x0 + value / x0) >> 1n
  }
  return x0
}

export function formatRatio(numerator, denominator, decimals = 8) {
  if (numerator <= 0n || denominator <= 0n) throw new Error('DANO_CLMM_PRICE_RATIO_NONPOSITIVE')
  const scale = 10n ** BigInt(decimals)
  const rounded = (numerator * scale + denominator / 2n) / denominator
  const whole = rounded / scale
  const fraction = (rounded % scale).toString().padStart(decimals, '0').replace(/0+$/, '')
  return fraction ? whole.toString() + '.' + fraction : whole.toString()
}

function calcLiquidity(x, y, lower, upper) {
  // Exact integer translation of the pinned SDK's calcLiquidity().
  const denAdenB = lower.den * upper.den
  const numAnumB = lower.num * upper.num
  const delta = y * denAdenB - x * numAnumB
  const diffSquare = delta * delta
  const xy4Term = 4n * x * y * lower.den * lower.den * upper.num * upper.num
  const bigSqrt = sqrtBigInt(diffSquare + xy4Term)
  const numerator = y * denAdenB + x * numAnumB + bigSqrt
  const denominator = 2n * (upper.num * lower.den - upper.den * lower.num)
  if (numerator <= 0n || denominator <= 0n) throw new Error('DANO_CLMM_VIRTUAL_LIQUIDITY_INVALID')
  return { numerator, denominator }
}

export function derivePoolMarginalSpot(pool) {
  if (!pool || pool.status !== 'MATCH') throw new Error('DANO_POOL_NOT_STRUCTURALLY_MATCHED')
  if (pool.paymentCredentialMatchesPoolScript !== true) throw new Error('DANO_POOL_SCRIPT_CREDENTIAL_MISMATCH')
  if (pool.rewardEpochBehind === true &&
      (pool.rewardAmountRead !== true || pool.rewardAmountAppliedRaw === undefined || pool.rewardAmountAppliedRaw === null)) {
    throw new Error('DANO_POOL_REWARD_AMOUNT_UNRESOLVED')
  }
  const datum = pool.datum
  if (!datum?.tokenX?.unit || !datum?.tokenY?.unit) throw new Error('DANO_POOL_DATUM_ASSETS_MISSING')
  const xUnit = String(datum.tokenX.unit).toLowerCase()
  const yUnit = String(datum.tokenY.unit).toLowerCase()
  const xIsUsdm = xUnit === USDM_UNIT
  const yIsUsdm = yUnit === USDM_UNIT
  const xIsUsdcx = xUnit === USDCX_UNIT
  const yIsUsdcx = yUnit === USDCX_UNIT
  if (!(xIsUsdm && yIsUsdcx) && !(xIsUsdcx && yIsUsdm)) throw new Error('DANO_POOL_NOT_EXACT_USDM_USDCX_PAIR')
  if (String(pool.nft?.policyId ?? '').toLowerCase() !== DANO_POOL_SCRIPT_HASH) {
    throw new Error('DANO_POOL_NFT_POLICY_MISMATCH')
  }
  if (String(pool.paymentCredential ?? '').toLowerCase() !== DANO_POOL_SCRIPT_HASH) {
    throw new Error('DANO_POOL_PAYMENT_CREDENTIAL_MISMATCH')
  }
  if (BigInt(String(pool.nftQuantityRaw ?? '0')) !== 1n) throw new Error('DANO_POOL_NFT_QUANTITY_INVALID')

  const activeX = parsePositive(pool.activeReserveXRaw, 'DANO_CLMM_ACTIVE_RESERVE_X')
  const activeY = parsePositive(pool.activeReserveYRaw, 'DANO_CLMM_ACTIVE_RESERVE_Y')
  const lower = {
    num: parsePositive(datum.sqrtLowerPrice?.numeratorRaw, 'DANO_CLMM_LOWER_NUM'),
    den: parsePositive(datum.sqrtLowerPrice?.denominatorRaw, 'DANO_CLMM_LOWER_DEN'),
  }
  const upper = {
    num: parsePositive(datum.sqrtUpperPrice?.numeratorRaw, 'DANO_CLMM_UPPER_NUM'),
    den: parsePositive(datum.sqrtUpperPrice?.denominatorRaw, 'DANO_CLMM_UPPER_DEN'),
  }
  if (lower.num * upper.den >= upper.num * lower.den) throw new Error('DANO_CLMM_PRICE_RANGE_INVALID')

  const liquidity = calcLiquidity(activeX, activeY, lower, upper)
  const virtualX = ceilDiv(liquidity.numerator * upper.den, liquidity.denominator * upper.num) + activeX
  const virtualY = ceilDiv(liquidity.numerator * lower.num, liquidity.denominator * lower.den) + activeY
  if (virtualX <= 0n || virtualY <= 0n) throw new Error('DANO_CLMM_VIRTUAL_RESERVE_NONPOSITIVE')

  // Both exact assets have six decimals. X->Y is USDM->USDCx; invert when reversed.
  const numerator = xIsUsdm ? virtualY : virtualX
  const denominator = xIsUsdm ? virtualX : virtualY
  const lpFeeRate = BigInt(String(datum.lpFeeRate))
  if (lpFeeRate < 0n || lpFeeRate > 10_000n) throw new Error('DANO_CLMM_LP_FEE_INVALID')

  return {
    venue: 'Danogo CLMM',
    poolKey: pool.poolKey,
    poolNftUnit: pool.nft.unit,
    utxoRef: pool.utxoRef,
    datumHash: pool.datumHash,
    blockHeight: pool.blockHeight,
    blockTime: pool.blockTime,
    poolFreshnessAtSourceAsOf: pool.poolFreshnessAtSourceAsOf ?? 'NOT_CLASSIFIED',
    tokenXUnit: xUnit,
    tokenYUnit: yUnit,
    activeReserveXRaw: activeX.toString(),
    activeReserveYRaw: activeY.toString(),
    virtualReserveXRaw: virtualX.toString(),
    virtualReserveYRaw: virtualY.toString(),
    priceNumeratorRaw: numerator.toString(),
    priceDenominatorRaw: denominator.toString(),
    marginalUsdcxPerUsdm: formatRatio(numerator, denominator, 8),
    lpFeeRateBasisPoints: lpFeeRate.toString(),
    priceMethod: 'PINNED_DANOGO_SDK_VIRTUAL_RESERVE_MARGINAL_RATIO',
    priceLimit: 'PRE_LP_FEE_MARGINAL_SPOT; NOT_AN_EXECUTABLE_QUOTE',
  }
}

export function deriveEvidence(input) {
  if (input?.network !== 'cardano-mainnet') throw new Error('DANO_INPUT_NETWORK_INVALID')
  if (String(input?.exactAsset?.policyId ?? '').toLowerCase() + String(input?.exactAsset?.assetNameHex ?? '').toLowerCase() !== USDM_UNIT) {
    throw new Error('DANO_INPUT_USDM_IDENTITY_INVALID')
  }
  const pools = Array.isArray(input.pools) ? input.pools : []
  const candidatePools = pools.filter((p) => {
    const x = String(p.datum?.tokenX?.unit ?? '').toLowerCase()
    const y = String(p.datum?.tokenY?.unit ?? '').toLowerCase()
    return (x === USDM_UNIT && y === USDCX_UNIT) || (x === USDCX_UNIT && y === USDM_UNIT)
  })
  const observations = candidatePools.map(derivePoolMarginalSpot)
  if (observations.length === 0) throw new Error('DANO_NO_USDM_USDCX_POOLS_FOUND')
  const compare = (a, b) => {
    const left = BigInt(a.priceNumeratorRaw) * BigInt(b.priceDenominatorRaw)
    const right = BigInt(b.priceNumeratorRaw) * BigInt(a.priceDenominatorRaw)
    return left < right ? -1 : left > right ? 1 : 0
  }
  const min = observations.reduce((a, b) => compare(a, b) <= 0 ? a : b)
  const max = observations.reduce((a, b) => compare(a, b) >= 0 ? a : b)
  return {
    schema: 'immortal-danogo-usdm-usdcx-cross-reference-readonly-v1',
    classification: 'ONCHAIN_CLMM_MARGINAL_SPOT_CANDIDATE_NOT_USD_USDM_ORACLE_OR_EXECUTABLE_QUOTE',
    network: 'cardano-mainnet',
    exactPair: {
      usdm: { unit: USDM_UNIT, decimals: 6 },
      usdcx: { unit: USDCX_UNIT, decimals: 6 },
    },
    source: {
      venue: 'Danogo CLMM',
      ledgerProvider: 'Koios',
      reconciliationProvider: 'SuperCardano',
      poolScriptHash: DANO_POOL_SCRIPT_HASH,
      sdkCommit: DANOGO_SDK_COMMIT,
      sdkSource: 'https://github.com/dano-finance/clmm-sdk/blob/' + DANOGO_SDK_COMMIT + '/src/utils.ts',
      sourceWorkflowRun: input.sourceWorkflowRun ?? null,
      sourceArtifactId: input.sourceArtifactId ?? null,
      sourceArtifactZipSha256: input.sourceArtifactZipSha256 ?? null,
      sourceJsonSha256: input.sourceJsonSha256 ?? null,
    },
    sourceObservationWindow: { startedAt: input.startedAt, completedAt: input.completedAt },
    summary: {
      structurallyMatchedDirectPools: observations.length,
      minMarginalUsdcxPerUsdm: formatRatio(BigInt(min.priceNumeratorRaw), BigInt(min.priceDenominatorRaw), 8),
      maxMarginalUsdcxPerUsdm: formatRatio(BigInt(max.priceNumeratorRaw), BigInt(max.priceDenominatorRaw), 8),
    },
    observations,
    limitations: [
      'Pool datum, NFT, script credential, exact pair and active reserves are inherited from the same-run read-only Koios/SuperCardano structural reconciliation; no transaction was submitted.',
      'Spot is calculated from the pinned official Danogo SDK virtual-reserve math, not the raw reserve ratio; both assets have six decimals.',
      'The output is a pre-LP-fee marginal pool spot. It is not an executable quote, independent fiat price, USDCx redemption observation, USD/USDM peg decision, OracleQuote, EEV valuation or production input.',
      'The USDCx-to-USD leg requires its own xReserve identity, reserve/attestation and convertibility qualification; do not assume that the token ticker alone proves USD parity.',
      'Pool observations are not synchronous with each other or with any external USD source; preserve each block time and source age.',
    ],
    completedAt: new Date().toISOString(),
  }
}

async function main() {
  const argv = process.argv.slice(2)
  const getArg = (flag, fallback) => {
    const i = argv.indexOf(flag)
    return i >= 0 && argv[i + 1] ? argv[i + 1] : fallback
  }
  const inputPath = resolve(getArg('--danogo', 'audit/oracles/danogo-clmm-usdm-readonly.json'))
  const outPath = resolve(getArg('--out', 'audit/oracles/danogo-usdm-usdcx-cross-reference-readonly.json'))
  const raw = await readFile(inputPath)
  const input = JSON.parse(raw.toString('utf8'))
  const evidence = deriveEvidence(input)
  evidence.source.sourceInputSha256 = createHash('sha256').update(raw).digest('hex')
  await writeFile(outPath, JSON.stringify(evidence, null, 2) + '\n')
  process.stdout.write(JSON.stringify({
    status: 'READ_ONLY_DANOGO_USDM_USDCX_CROSS_REFERENCE_COMPLETE',
    output: outPath,
    summary: evidence.summary,
  }, null, 2) + '\n')
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  main().catch((error) => {
    process.stderr.write(JSON.stringify({
      status: 'READ_ONLY_DANOGO_USDM_USDCX_CROSS_REFERENCE_FAILED',
      error: error instanceof Error ? error.message : String(error),
    }) + '\n')
    process.exitCode = 1
  })
}
