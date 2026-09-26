import { Data, type UTxO } from 'lucid-cardano'

import {
  GENESIS_PRE_TREASURY_THRESHOLD_USDM_SUBUNITS,
  CANONICAL_ORACLE_PRECISION,
  type GenesisTreasuryObservation,
} from '../PRE-RICH/profile/GenesisTreasuryAdmission'

export const ORACLE_MAX_AGE_MS = 3_600_000n

type ObservationInput = {
  lucid: any
  treasuryAddress: string
  oracleStateAddress: string
  prePolicyId: string
  preAssetNameHex: string
  oracleStatePolicyId: string
  oracleStateTokenNameHex: string
  oraclePublisherPkh: string
  sourceRegime?: 'PRE-GENESIS' | 'GENESIS'
  nowMs?: bigint
}

function parseDatum(raw: unknown): any {
  if (raw == null) return null
  if (typeof raw === 'string') {
    try { return Data.from(raw) } catch { return null }
  }
  return raw
}

function fieldsOf(value: any): any[] | null {
  return value && Array.isArray(value.fields) ? value.fields : null
}

function intOf(value: any): bigint | null {
  if (typeof value === 'bigint') return value
  if (typeof value === 'number' && Number.isInteger(value)) return BigInt(value)
  if (value && typeof value.int !== 'undefined') return BigInt(value.int)
  return null
}

function bytesOf(value: any): string | null {
  if (typeof value === 'string') return value
  if (value && typeof value.bytes === 'string') return value.bytes
  return null
}

function singletonUtxo(utxos: UTxO[], unit: string, label: string): UTxO {
  const matches = utxos.filter((u) => (u.assets?.[unit] ?? 0n) === 1n)
  if (matches.length !== 1) {
    throw new Error(`${label}: expected exactly one singleton UTxO, found ${matches.length}`)
  }
  return matches[0]
}

/**
 * Observe the concrete Treasury PRE state and the authenticated Oracle state.
 *
 * This is an application observation boundary. It does not mint, spend or
 * change economic state. Ambiguous singleton/source state fails closed.
 */
export async function observeGenesisTreasuryState(
  input: ObservationInput,
): Promise<GenesisTreasuryObservation> {
  if (!input.treasuryAddress) throw new Error('Treasury address is required')
  if (!input.oracleStateAddress) throw new Error('Oracle state address is required')
  if (!input.prePolicyId || !input.preAssetNameHex) throw new Error('PRE identity is required')
  if (!input.oracleStatePolicyId || !input.oracleStateTokenNameHex) {
    throw new Error('Oracle singleton identity is required')
  }
  if (!input.oraclePublisherPkh) throw new Error('Oracle publisher is required')

  const preUnit = input.prePolicyId + input.preAssetNameHex
  const oracleUnit = input.oracleStatePolicyId + input.oracleStateTokenNameHex

  const treasuryUtxos: UTxO[] = await input.lucid.utxosAt(input.treasuryAddress)
  const treasuryMatches = treasuryUtxos.filter((u) => (u.assets?.[preUnit] ?? 0n) > 0n)
  if (treasuryMatches.length !== 1) {
    throw new Error(`Treasury PRE state is ambiguous: expected exactly one PRE-bearing UTxO, found ${treasuryMatches.length}`)
  }
  const treasury = treasuryMatches[0]
  const preQuantity = treasury.assets?.[preUnit] ?? 0n
  if (preQuantity <= 0n) throw new Error('Treasury PRE quantity must be positive')

  const oracleUtxos: UTxO[] = await input.lucid.utxosAt(input.oracleStateAddress)
  const oracle = singletonUtxo(oracleUtxos, oracleUnit, 'Oracle State')

  const oracleFields = fieldsOf(parseDatum(oracle.datum))
  if (!oracleFields || oracleFields.length !== 5) {
    throw new Error('OracleDatum is missing or malformed')
  }

  const oraclePrePolicy = bytesOf(oracleFields[0])
  const oraclePreName = bytesOf(oracleFields[1])
  const price = intOf(oracleFields[2])
  const timestamp = intOf(oracleFields[3])
  const publisher = bytesOf(oracleFields[4])

  if (oraclePrePolicy !== input.prePolicyId || oraclePreName !== input.preAssetNameHex) {
    throw new Error('Oracle State asset identity does not match PRE')
  }
  if (price === null || price < 0n) throw new Error('Oracle price is invalid')
  if (timestamp === null || timestamp < 0n) throw new Error('Oracle timestamp is invalid')
  if (publisher !== input.oraclePublisherPkh) throw new Error('Oracle publisher mismatch')

  const nowMs = input.nowMs ?? BigInt(Date.now())
  const oracleFresh = timestamp <= nowMs && nowMs - timestamp <= ORACLE_MAX_AGE_MS
  const sourceRegime = input.sourceRegime ?? 'PRE-GENESIS'
  const treasuryRef = `cardano:tx/${treasury.txHash}#${treasury.outputIndex}`
  const oracleRef = `cardano:tx/${oracle.txHash}#${oracle.outputIndex}`

  return {
    sourceRegime,
    treasuryIdentity: input.treasuryAddress,
    treasuryStateReference: treasuryRef,
    prePolicyId: input.prePolicyId,
    preAssetNameHex: input.preAssetNameHex,
    preQuantity,
    verifiedPreUsdmPrice: price,
    oraclePrecision: CANONICAL_ORACLE_PRECISION,
    oracleStateReference: oracleRef,
    oraclePublisher: publisher,
    oracleTimestamp: timestamp,
    observedAt: nowMs,
    sourceStateHash: treasury.txHash,
    valuationVerified: true,
    oracleFresh,
  }
}

export function genesisTreasuryThresholdReached(
  observation: GenesisTreasuryObservation,
): boolean {
  if (!observation.valuationVerified || !observation.oracleFresh) return false
  const value = (observation.preQuantity * observation.verifiedPreUsdmPrice) /
    observation.oraclePrecision
  return value >= GENESIS_PRE_TREASURY_THRESHOLD_USDM_SUBUNITS
}
