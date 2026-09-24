import {
  evolvePreRichHysteresis,
  type HysteresisClass,
  type HysteresisResult,
  type HysteresisState,
  type PreRichHysteresisPolicy,
  PRE_RICH_HYSTERESIS_V1,
} from '../../src/preRichHysteresis'

export type ObservedPreRichControl = {
  readonly currentActiveClass: number | null
  readonly highestClassEverActivated: number | null
}

/**
 * Recompute the canonical PRE-RICH application controller from the verified
 * capacity state and fail closed if the observed V3/Cardano control differs.
 *
 * This is deliberately an application-boundary witness. It does not make
 * KA/KC/KD universal IMMORTAL constants and does not choose capacity costs:
 * the caller must provide the canonical exact-integer X(P) for every class.
 */
export function derivePreRichControl(
  capacity: bigint,
  classes: readonly HysteresisClass[],
  previousControl: ObservedPreRichControl,
  policy: PreRichHysteresisPolicy = PRE_RICH_HYSTERESIS_V1,
): HysteresisResult {
  return evolvePreRichHysteresis(
    capacity,
    classes,
    previousControl,
    policy,
  )
}

export function assertPreRichControlMatches(
  capacity: bigint,
  classes: readonly HysteresisClass[],
  previousControl: ObservedPreRichControl,
  observedControl: ObservedPreRichControl,
  policy: PreRichHysteresisPolicy = PRE_RICH_HYSTERESIS_V1,
): HysteresisResult {
  const expected = derivePreRichControl(
    capacity,
    classes,
    previousControl,
    policy,
  )

  if (
    expected.currentActiveClass !== observedControl.currentActiveClass ||
    expected.highestClassEverActivated !==
      observedControl.highestClassEverActivated
  ) {
    throw new Error(
      'PRE-RICH control-state mismatch: observed control is not the deterministic hysteresis result',
    )
  }

  // Apply the independent historical-control invariants to the same result
  // before exposing it as an admissible observation.
  assertPreRichControlHistory(previousControl, observedControl)

  return expected
}

export function assertPreRichControlHistory(
  previousControl: ObservedPreRichControl,
  result: ObservedPreRichControl,
): void {
  if (
    previousControl.highestClassEverActivated !== null &&
    result.highestClassEverActivated !== null &&
    result.highestClassEverActivated <
      previousControl.highestClassEverActivated
  ) {
    throw new Error(
      'PRE-RICH HighestClassEverActivated must be monotonic',
    )
  }

  if (
    result.currentActiveClass !== null &&
    result.highestClassEverActivated !== null &&
    result.currentActiveClass > result.highestClassEverActivated
  ) {
    throw new Error(
      'PRE-RICH CurrentActiveClass cannot exceed HighestClassEverActivated',
    )
  }
}
