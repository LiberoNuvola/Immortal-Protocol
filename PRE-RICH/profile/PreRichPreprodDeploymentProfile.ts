/**
 * Explicit PRE-RICH Preprod deployment profile.
 *
 * This is deployment/application configuration, not IMMORTAL universal law.
 * It provides the initial V3 carrier state needed for the first real
 * PRE-RICH Preprod user flow.
 *
 * Initial regime:
 * - class 0 (1 USDM) is the active Genesis class;
 * - no tickets/liabilities/reserves exist yet;
 * - protected-capital components are zero because no obligation exists yet;
 * - all eight classes have an explicit deployment cap;
 * - only class 0 is initially saleable;
 * - HighestClassEverActivated starts at class 0;
 * - Jackpot starts inactive.
 *
 * The cap of 10 tickets per class is a deployment parameter. It is not a
 * universal IMMORTAL constant and can only be changed by changing this
 * explicit deployment profile.
 */

export const PRE_RICH_PREPROD_DEPLOYMENT_PROFILE_V1 = Object.freeze({
  stateVersion: 0n,
  classCap: 10n,
  currentActiveClass: 0n,
  highestClassEverActivated: 0n,
  crystallizedLiabilities: 0n,
  unresolvedReserve: 0n,
  unresolvedTicketCount: 0n,
  safetyCapital: 0n,
  reserveProtection: 0n,
  mandatoryFutureCosts: 0n,
  jackpot: Object.freeze({
    lockedAmount: 0n,
    threshold: 0n,
    status: 'inactive' as const,
    cycle: 0n,
  }),
} as const)

export const PRE_RICH_PREPROD_CLASS_PRICES = [
  1n, 2n, 3n, 5n, 10n, 25n, 50n, 100n,
] as const

export type PreRichPreprodInitialClass = {
  readonly classId: bigint
  readonly issued: bigint
  readonly unresolved: bigint
  readonly exposure: bigint
  readonly cap: bigint
  readonly saleable: boolean
}

export function buildPreRichPreprodInitialClasses(): PreRichPreprodInitialClass[] {
  return PRE_RICH_PREPROD_CLASS_PRICES.map((_, index) => ({
    classId: BigInt(index),
    issued: 0n,
    unresolved: 0n,
    exposure: 0n,
    cap: PRE_RICH_PREPROD_DEPLOYMENT_PROFILE_V1.classCap,
    saleable: index === 0,
  }))
}

export function assertPreRichPreprodInitialProfile(): void {
  const p = PRE_RICH_PREPROD_DEPLOYMENT_PROFILE_V1
  if (p.classCap <= 0n) throw new Error('Preprod class cap must be positive')
  if (p.currentActiveClass !== 0n || p.highestClassEverActivated !== 0n) {
    throw new Error('Preprod initial control must start at class 0')
  }
  if (p.unresolvedReserve !== 0n || p.unresolvedTicketCount !== 0n) {
    throw new Error('Preprod initial state cannot contain unresolved tickets')
  }
  if (p.crystallizedLiabilities !== 0n ||
      p.safetyCapital !== 0n ||
      p.reserveProtection !== 0n ||
      p.mandatoryFutureCosts !== 0n) {
    throw new Error('Preprod initial state cannot contain pre-existing obligations')
  }
  if (p.jackpot.lockedAmount !== 0n || p.jackpot.cycle !== 0n || p.jackpot.status !== 'inactive') {
    throw new Error('Preprod initial Jackpot must be inactive and empty')
  }
  const classes = buildPreRichPreprodInitialClasses()
  if (classes.length !== 8 || classes.some((c, i) => c.classId !== BigInt(i))) {
    throw new Error('Preprod initial profile must contain exactly 8 canonical classes')
  }
  if (!classes[0].saleable || classes.slice(1).some((c) => c.saleable)) {
    throw new Error('Preprod initial saleability must expose only class 0')
  }
}
