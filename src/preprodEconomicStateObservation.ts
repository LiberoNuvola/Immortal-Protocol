import {
  PRE_RICH_CANONICAL_PRICES,
  type EconomicStateV3,
  type TicketClassStateV3,
} from '../PRE-RICH/profile/PreRichCardanoObservationProjection'

export type EconomicStateCarrierObservation = {
  carrierAddress: string
  carrierStateReference: string
  carrierPolicyId: string
  carrierTokenNameHex: string
  stateVersion: bigint
  state: EconomicStateV3
}

type CarrierInput = {
  lucid: any
  decodeDatum?: (raw: string) => unknown
  carrierAddress: string
  carrierPolicyId: string
  carrierTokenNameHex: string
}

function parseDatum(raw: unknown, decodeDatum?: (raw: string) => unknown): any {
  if (raw == null) return null
  if (typeof raw === 'string') {
    if (!decodeDatum) return null
    try { return decodeDatum(raw) } catch { return null }
  }
  return raw
}

function fieldsOf(value: any): any[] | null {
  return value && Array.isArray(value.fields) ? value.fields : null
}

function intOf(value: any): bigint | null {
  if (typeof value === 'bigint') return value
  if (typeof value === 'number' && Number.isInteger(value)) return BigInt(value)
  if (value && typeof value.int !== 'undefined') {
    try { return BigInt(value.int) } catch { return null }
  }
  return null
}

function constrIndexOf(value: any): number | null {
  if (!value || typeof value !== 'object') return null
  if (value.index !== undefined) return Number(value.index)
  if (value.constr !== undefined) return Number(value.constr)
  return null
}

function boolOf(value: any): boolean | null {
  const index = constrIndexOf(value)
  if (index === 0) return false
  if (index === 1) return true
  return null
}

function singletonCarrierUtxo(utxos: UTxO[], unit: string): UTxO {
  const matches = utxos.filter((u) => (u.assets?.[unit] ?? 0n) === 1n)
  if (matches.length !== 1) {
    throw new Error(
      `V3 economic state carrier is ambiguous: expected exactly one singleton UTxO, found ${matches.length}`,
    )
  }
  return matches[0]
}

/**
 * Decode the canonical V3 economic-state carrier datum.
 *
 * Datum shape:
 *   CarrierDatum(version, V3EconomicState)
 *   V3EconomicState(
 *     crystallizedLiabilities,
 *     unresolvedReserve,
 *     unresolvedTicketCount,
 *     safetyCapital,
 *     reserveProtection,
 *     mandatoryFutureCosts,
 *     classes,
 *     control,
 *     jackpot
 *   )
 *
 * This module only observes and validates. It never supplies defaults for
 * missing economic fields and never derives V3 state from B1/Treasury data.
 */
export async function observeEconomicStateCarrier(
  input: CarrierInput,
): Promise<EconomicStateCarrierObservation> {
  if (!input.carrierAddress) throw new Error('V3 economic state carrier address is required')
  if (!input.carrierPolicyId || !input.carrierTokenNameHex) {
    throw new Error('V3 economic state carrier singleton identity is required')
  }

  const unit = input.carrierPolicyId + input.carrierTokenNameHex
  const utxos: UTxO[] = await input.lucid.utxosAt(input.carrierAddress)
  const carrier = singletonCarrierUtxo(utxos, unit)

  const root = fieldsOf(parseDatum(carrier.datum, input.decodeDatum))
  if (!root || root.length !== 2) {
    throw new Error('V3 economic state carrier datum is missing or malformed')
  }

  const stateVersion = intOf(root[0])
  if (stateVersion === null || stateVersion < 0n) {
    throw new Error('V3 economic state carrier version is invalid')
  }

  const stateFields = fieldsOf(root[1])
  if (!stateFields || stateFields.length !== 9) {
    throw new Error('V3EconomicState datum is missing or malformed')
  }

  const ints = stateFields.slice(0, 6).map(intOf)
  if (ints.some((v) => v === null || v < 0n)) {
    throw new Error('V3EconomicState contains an invalid economic integer')
  }

  const classValues = stateFields[6]
  if (!Array.isArray(classValues) || classValues.length !== PRE_RICH_CANONICAL_PRICES.length) {
    throw new Error('V3EconomicState must contain exactly 8 canonical classes')
  }

  const classes: TicketClassStateV3[] = classValues.map((raw, index) => {
    const fields = fieldsOf(raw)
    if (!fields || fields.length !== 6) {
      throw new Error(`V3 class ${index} is malformed`)
    }

    const classId = intOf(fields[0])
    const issued = intOf(fields[1])
    const unresolved = intOf(fields[2])
    const exposure = intOf(fields[3])
    const cap = intOf(fields[4])
    const saleable = boolOf(fields[5])

    if (
      classId === null || issued === null || unresolved === null ||
      exposure === null || cap === null || saleable === null
    ) {
      throw new Error(`V3 class ${index} contains an invalid field`)
    }
    if (classId !== BigInt(index)) throw new Error('V3 classes must be canonical IDs 0..7')
    if (issued < 0n || unresolved < 0n || exposure < 0n || cap < 0n) {
      throw new Error('V3 class contains a negative value')
    }
    if (exposure !== PRE_RICH_CANONICAL_PRICES[index] * unresolved) {
      throw new Error(`V3 class ${index} exposure does not match canonical price`)
    }
    if (unresolved > issued) throw new Error('V3 unresolved tickets exceed issued tickets')

    return { classId, issued, unresolved, exposure, cap, saleable }
  })

  const control = fieldsOf(stateFields[7])
  if (!control || control.length !== 2) throw new Error('V3 control state is malformed')
  const currentActiveClass = intOf(control[0])
  const highestClassEverActivated = intOf(control[1])
  if (
    currentActiveClass === null || highestClassEverActivated === null ||
    currentActiveClass < 0n || highestClassEverActivated < 0n ||
    currentActiveClass > highestClassEverActivated ||
    currentActiveClass >= 8n || highestClassEverActivated >= 8n
  ) {
    throw new Error('V3 control state is invalid')
  }

  const jackpot = fieldsOf(stateFields[8])
  if (!jackpot || jackpot.length !== 4) throw new Error('V3 jackpot state is malformed')
  const lockedAmount = intOf(jackpot[0])
  const threshold = intOf(jackpot[1])
  const statusIndex = constrIndexOf(jackpot[2])
  const cycle = intOf(jackpot[3])
  if (
    lockedAmount === null || threshold === null || cycle === null ||
    lockedAmount < 0n || threshold < 0n || cycle < 0n ||
    statusIndex === null || statusIndex < 0 || statusIndex > 3
  ) {
    throw new Error('V3 jackpot state is invalid')
  }

  const state: EconomicStateV3 = {
    crystallizedLiabilities: ints[0]!,
    unresolvedReserve: ints[1]!,
    unresolvedTicketCount: ints[2]!,
    safetyCapital: ints[3]!,
    reserveProtection: ints[4]!,
    mandatoryFutureCosts: ints[5]!,
    classes,
    control: {
      currentActiveClass,
      highestClassEverActivated,
    },
    jackpot: {
      lockedAmount,
      threshold,
      status: statusIndex === 0 ? 'inactive' : statusIndex === 1 ? 'locked' : statusIndex === 2 ? 'payable' : 'closed',
      cycle,
    },
  }

  const derivedReserve = classes.reduce((sum, c) => sum + c.exposure, 0n)
  const derivedUnresolved = classes.reduce((sum, c) => sum + c.unresolved, 0n)
  if (derivedReserve !== state.unresolvedReserve) {
    throw new Error('V3 unresolved reserve does not equal class exposure')
  }
  if (derivedUnresolved !== state.unresolvedTicketCount) {
    throw new Error('V3 unresolved ticket count does not equal class state')
  }

  return {
    carrierAddress: input.carrierAddress,
    carrierStateReference: `cardano:tx/${carrier.txHash}#${carrier.outputIndex}`,
    carrierPolicyId: input.carrierPolicyId,
    carrierTokenNameHex: input.carrierTokenNameHex,
    stateVersion,
    state,
  }
}
