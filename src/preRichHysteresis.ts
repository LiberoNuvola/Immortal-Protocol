/**
 * PRE-RICH application-level hysteresis reference.
 *
 * This module deliberately does not belong to the IMMORTAL universal kernel.
 * It encodes the already-closed PRE-RICH policy:
 *   KA = 8  (activation)
 *   KC = 4  (maintenance)
 *   KD = 4  (post-distribution floor)
 *
 * Capacity is compared against policy multiples of an externally supplied
 * exact integer capacity-cost X(P). No floating point or implicit rounding is
 * used here.
 */

export interface PreRichHysteresisPolicy {
  readonly activationThreshold: bigint;
  readonly maintenanceThreshold: bigint;
  readonly distributionThreshold: bigint;
}

export const PRE_RICH_HYSTERESIS_V1: PreRichHysteresisPolicy = Object.freeze({
  activationThreshold: 8n,
  maintenanceThreshold: 4n,
  distributionThreshold: 4n,
});

export interface HysteresisClass {
  readonly id: number;
  /**
   * Exact capacity cost X(P) for this class, already including only costs
   * that the canonical model requires for the selected horizon.
   */
  readonly capacityCost: bigint;
}

export interface HysteresisState {
  readonly currentActiveClass: number | null;
  readonly highestClassEverActivated: number | null;
}

export interface HysteresisResult extends HysteresisState {
  readonly action:
    | "ACTIVATE"
    | "UPGRADE"
    | "RETAIN"
    | "CONTRACT"
    | "HALT";
}

/**
 * Validate the PRE-RICH hysteresis policy shape.
 *
 * The canonical relationship is:
 *   KC <= KD < KA
 * and therefore KA > KC.
 */
export function validatePreRichHysteresisPolicy(
  policy: PreRichHysteresisPolicy,
): void {
  if (policy.maintenanceThreshold <= 0n) {
    throw new Error("maintenance threshold must be positive");
  }
  if (policy.activationThreshold <= policy.maintenanceThreshold) {
    throw new Error("activation threshold must be greater than maintenance threshold");
  }
  if (policy.distributionThreshold < policy.maintenanceThreshold) {
    throw new Error(
      "distribution threshold must be at least the maintenance threshold",
    );
  }
  if (policy.distributionThreshold >= policy.activationThreshold) {
    throw new Error(
      "distribution threshold must remain below the activation threshold",
    );
  }
}

/**
 * Exact activation predicate:
 *   C >= KA * X(P)
 */
export function isActivationEligible(
  capacity: bigint,
  capacityCost: bigint,
  policy: PreRichHysteresisPolicy = PRE_RICH_HYSTERESIS_V1,
): boolean {
  validateCapacityInputs(capacity, capacityCost);
  return capacity >= policy.activationThreshold * capacityCost;
}

/**
 * Exact maintenance predicate:
 *   C >= KC * X(P)
 */
export function isMaintenanceEligible(
  capacity: bigint,
  capacityCost: bigint,
  policy: PreRichHysteresisPolicy = PRE_RICH_HYSTERESIS_V1,
): boolean {
  validateCapacityInputs(capacity, capacityCost);
  return capacity >= policy.maintenanceThreshold * capacityCost;
}

/**
 * Exact post-distribution floor predicate:
 *   C_after_distribution >= KD * X(P_current)
 */
export function isDistributionAdmissible(
  capacityAfterDistribution: bigint,
  currentCapacityCost: bigint,
  policy: PreRichHysteresisPolicy = PRE_RICH_HYSTERESIS_V1,
): boolean {
  validateCapacityInputs(capacityAfterDistribution, currentCapacityCost);
  return (
    capacityAfterDistribution >=
    policy.distributionThreshold * currentCapacityCost
  );
}

/**
 * Select the highest class that can be entered from an unactivated state.
 *
 * The caller supplies the application class set and exact capacity costs.
 * Class ids are not assumed to be contiguous, and the ladder itself is not
 * encoded in this generic helper.
 */
export function highestActivationEligibleClass(
  capacity: bigint,
  classes: readonly HysteresisClass[],
  policy: PreRichHysteresisPolicy = PRE_RICH_HYSTERESIS_V1,
): number | null {
  validatePolicyAndClasses(policy, classes);

  let selected: HysteresisClass | null = null;
  for (const candidate of classes) {
    if (
      isActivationEligible(capacity, candidate.capacityCost, policy) &&
      (selected === null || candidate.id > selected.id)
    ) {
      selected = candidate;
    }
  }

  return selected?.id ?? null;
}

/**
 * Select the highest class <= currentActiveClass that remains maintainable.
 *
 * This is intentionally a direct contraction: intermediate classes do not
 * need to be visited.
 */
export function highestMaintainableClassAtOrBelow(
  capacity: bigint,
  classes: readonly HysteresisClass[],
  currentActiveClass: number,
  policy: PreRichHysteresisPolicy = PRE_RICH_HYSTERESIS_V1,
): number | null {
  validatePolicyAndClasses(policy, classes);

  let selected: HysteresisClass | null = null;
  for (const candidate of classes) {
    if (
      candidate.id <= currentActiveClass &&
      isMaintenanceEligible(capacity, candidate.capacityCost, policy) &&
      (selected === null || candidate.id > selected.id)
    ) {
      selected = candidate;
    }
  }

  return selected?.id ?? null;
}

/**
 * Evolve the application class controller for one observed capacity state.
 *
 * Ordering:
 * 1. no active class -> activate highest activation-eligible class;
 * 2. higher class becomes activation-eligible -> upgrade directly;
 * 3. otherwise retain the current class while maintenance remains valid;
 * 4. if maintenance fails -> contract directly to the highest maintainable
 *    class at or below the current class;
 * 5. if none is maintainable -> HALT (represented by null).
 *
 * HighestClassEverActivated never decreases.
 */
export function evolvePreRichHysteresis(
  capacity: bigint,
  classes: readonly HysteresisClass[],
  state: HysteresisState,
  policy: PreRichHysteresisPolicy = PRE_RICH_HYSTERESIS_V1,
): HysteresisResult {
  validatePolicyAndClasses(policy, classes);
  validateState(state);

  if (state.currentActiveClass === null) {
    const activated = highestActivationEligibleClass(capacity, classes, policy);
    return finalize("ACTIVATE", activated, state.highestClassEverActivated, state);
  }

  const current = classes.find(
    (candidate) => candidate.id === state.currentActiveClass,
  );
  if (!current) {
    throw new Error("current active class is absent from supplied class set");
  }

  const highestEligible = highestActivationEligibleClass(capacity, classes, policy);
  if (highestEligible !== null && highestEligible > current.id) {
    return finalize("UPGRADE", highestEligible, state.highestClassEverActivated, state);
  }

  if (isMaintenanceEligible(capacity, current.capacityCost, policy)) {
    return finalize(
      "RETAIN",
      current.id,
      state.highestClassEverActivated,
      state,
    );
  }

  const contracted = highestMaintainableClassAtOrBelow(
    capacity,
    classes,
    current.id,
    policy,
  );
  if (contracted === null) {
    return finalize("HALT", null, state.highestClassEverActivated, state);
  }

  return finalize(
    "CONTRACT",
    contracted,
    state.highestClassEverActivated,
    state,
  );
}

function finalize(
  action: HysteresisResult["action"],
  currentActiveClass: number | null,
  previousHighest: number | null,
  previousState: HysteresisState,
): HysteresisResult {
  const highestClassEverActivated =
    currentActiveClass === null
      ? previousHighest
      : previousHighest === null
        ? currentActiveClass
        : Math.max(previousHighest, currentActiveClass);

  if (
    previousState.highestClassEverActivated !== null &&
    highestClassEverActivated !== null &&
    highestClassEverActivated <
      previousState.highestClassEverActivated
  ) {
    throw new Error("highest-ever activated class must be monotonic");
  }

  return {
    action,
    currentActiveClass,
    highestClassEverActivated,
  };
}

function validatePolicyAndClasses(
  policy: PreRichHysteresisPolicy,
  classes: readonly HysteresisClass[],
): void {
  validatePreRichHysteresisPolicy(policy);
  if (classes.length === 0) {
    throw new Error("at least one class is required");
  }

  const seen = new Set<number>();
  for (const candidate of classes) {
    if (!Number.isInteger(candidate.id) || candidate.id < 0) {
      throw new Error("class ids must be non-negative integers");
    }
    if (seen.has(candidate.id)) {
      throw new Error("class ids must be unique");
    }
    seen.add(candidate.id);
    if (candidate.capacityCost <= 0n) {
      throw new Error("capacity costs must be positive");
    }
  }
}

function validateCapacityInputs(
  capacity: bigint,
  capacityCost: bigint,
): void {
  if (capacity < 0n) {
    throw new Error("capacity must be non-negative");
  }
  if (capacityCost <= 0n) {
    throw new Error("capacity cost must be positive");
  }
}

function validateState(state: HysteresisState): void {
  if (
    state.currentActiveClass !== null &&
    (!Number.isInteger(state.currentActiveClass) || state.currentActiveClass < 0)
  ) {
    throw new Error("current active class must be a non-negative integer or null");
  }
  if (
    state.highestClassEverActivated !== null &&
    (!Number.isInteger(state.highestClassEverActivated) ||
      state.highestClassEverActivated < 0)
  ) {
    throw new Error(
      "highest-ever activated class must be a non-negative integer or null",
    );
  }
  if (
    state.currentActiveClass !== null &&
    state.highestClassEverActivated !== null &&
    state.currentActiveClass > state.highestClassEverActivated
  ) {
    throw new Error(
      "current active class cannot exceed highest-ever activated class",
    );
  }
}
