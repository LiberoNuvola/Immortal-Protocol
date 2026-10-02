/**
 * Public economic/protocol mode declaration.
 *
 * Presentation-only vocabulary. The authoritative observation layer supplies
 * the active mode and its evidence; the frontend never derives a mode from
 * balances, button state, or failed transactions.
 */

export const PUBLIC_PROTOCOL_MODES = [
  'NORMAL_OPERATION',
  'ACTIVE_CLASS',
  'RECOVERY_MODE',
  'SURPLUS_MODE',
  'CAPITAL_PROTECTION',
  'REGENERATION',
] as const

export type PublicProtocolMode = typeof PUBLIC_PROTOCOL_MODES[number]

export type ProtocolModeDeclaration = {
  readonly mode: PublicProtocolMode
  readonly active: boolean
  readonly status: 'ACTIVE' | 'INACTIVE' | 'TRANSITIONING' | 'BLOCKED'
  readonly reason: string
  readonly subject?: string
  readonly evidenceRef: string
  readonly observedAt: string
}

export function modeLabel(mode: PublicProtocolMode): string {
  switch (mode) {
    case 'NORMAL_OPERATION': return 'NORMAL OPERATION'
    case 'ACTIVE_CLASS': return 'ACTIVE CLASS'
    case 'RECOVERY_MODE': return 'RECOVERY MODE'
    case 'SURPLUS_MODE': return 'SURPLUS MODE'
    case 'CAPITAL_PROTECTION': return 'CAPITAL PROTECTION'
    case 'REGENERATION': return 'REGENERATION'
  }
}

/**
 * A mode claim is public only when its observation/evidence boundary is
 * complete. This does not establish economic admissibility.
 */
export function modeDeclarationPublishable(
  declaration: ProtocolModeDeclaration,
): boolean {
  return (
    declaration.mode.length > 0 &&
    declaration.reason.length > 0 &&
    declaration.evidenceRef.length > 0 &&
    declaration.observedAt.length > 0
  )
}
