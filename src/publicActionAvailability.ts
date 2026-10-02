/**
 * Public protocol action availability.
 *
 * This is a declaration boundary for the public interface.
 * It does not decide whether an action is economically or cryptographically
 * admissible. An authoritative state/observation layer must produce it.
 *
 * The purpose is to prevent the UI from discovering protocol restrictions by
 * submitting transactions that are expected to fail.
 */

export const PUBLIC_ACTIONS = [
  'BUY_TICKET',
  'COMMIT_TICKET',
  'REVEAL_TICKET',
  'ACTIVATE_CLASS',
  'DEACTIVATE_CLASS',
  'CLAIM_PRIZE',
  'SETTLE_ROUND',
  'EXPIRE_TICKET',
  'ENTER_RECOVERY_MODE',
  'EXIT_RECOVERY_MODE',
  'ENTER_SURPLUS_MODE',
  'EXIT_SURPLUS_MODE',
  'DISTRIBUTE_SURPLUS',
] as const

export type PublicAction = typeof PUBLIC_ACTIONS[number]

export const ACTION_AVAILABILITY_STATES = [
  'AVAILABLE',
  'NOT_YET_OPEN',
  'PAUSED',
  'CLOSED',
  'BLOCKED',
  'HALTED',
] as const

export type ActionAvailabilityState =
  typeof ACTION_AVAILABILITY_STATES[number]

export type ActionAvailability = {
  readonly action: PublicAction
  readonly state: ActionAvailabilityState
  readonly available: boolean
  readonly reason: string
  readonly currentPhase?: string
  readonly subject?: string
  readonly transitionHint?: string
  readonly evidenceRef?: string
  readonly observedAt: string
}

/**
 * A public action is actionable only when the authoritative declaration says
 * so. The frontend must not reconstruct availability from button intent,
 * local guesses, or failed transactions.
 */
export function isActionAvailable(
  availability: ActionAvailability,
): boolean {
  return availability.available &&
    availability.state === 'AVAILABLE'
}

/**
 * Human-readable state labels. These are deliberately descriptive rather
 * than evaluative.
 */
export function actionAvailabilityLabel(
  state: ActionAvailabilityState,
): string {
  switch (state) {
    case 'AVAILABLE':
      return 'AVAILABLE'
    case 'NOT_YET_OPEN':
      return 'NOT YET OPEN'
    case 'PAUSED':
      return 'PAUSED'
    case 'CLOSED':
      return 'CLOSED'
    case 'BLOCKED':
      return 'BLOCKED'
    case 'HALTED':
      return 'HALTED'
  }
}
