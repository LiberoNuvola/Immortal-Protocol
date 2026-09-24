import {
  validateCanonicalEconomicState,
  type CanonicalEconomicState,
} from '../serialization/CanonicalEconomicState'

export type ObservationSource =
  | 'datum'
  | 'reference-input'
  | 'transaction'
  | 'oracle'

export type EconomicObservation = {
  source: ObservationSource
  observedAt: bigint
  state: CanonicalEconomicState
  stateHash?: string
}

export type ObservationResult =
  | { ok: true; observation: EconomicObservation }
  | { ok: false; reason: string }

export function acceptEconomicObservation(
  observation: EconomicObservation,
): ObservationResult {
  if (observation.observedAt < 0n) {
    return { ok: false, reason: 'negative observation timestamp' }
  }

  try {
    // The Adapter validates an already-derived canonical state.
    // It does not interpret ticket classes, Jackpot state, payout tables,
    // activation policy, or any other PRE-RICH application rule.
    validateCanonicalEconomicState(observation.state)
    return { ok: true, observation }
  } catch (e) {
    return {
      ok: false,
      reason: e instanceof Error ? e.message : 'invalid canonical economic observation',
    }
  }
}