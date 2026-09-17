import { validateEconomicStateV3, type EconomicStateV3 } from '../serialization/CanonicalEconomicState'

export type ObservationSource =
  | 'datum'
  | 'reference-input'
  | 'transaction'
  | 'oracle'

export type EconomicObservation = {
  source: ObservationSource
  observedAt: bigint
  state: EconomicStateV3
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
    // Runtime validation is performed at the Adapter boundary.
    // The observation layer does not create economic state; it validates
    // state already decoded from an authoritative chain object.
    validateEconomicStateV3(observation.state)
    return { ok: true, observation }
  } catch (e) {
    return {
      ok: false,
      reason: e instanceof Error ? e.message : 'invalid economic observation',
    }
  }
}
