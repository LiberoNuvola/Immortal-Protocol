import type { ActionAvailability } from './publicActionAvailability'
import type { ProtocolModeDeclaration } from './publicProtocolMode'
import type { ProtocolDeclaration, PublicProtocolState } from './protocolDeclaration'

export type PublicStateSnapshot = {
  readonly declaration: ProtocolDeclaration
  readonly publicState: PublicProtocolState
}

export function buildPublicStateSnapshot(
  declaration: ProtocolDeclaration,
  actions: readonly ActionAvailability[],
  modes: readonly ProtocolModeDeclaration[],
  activeClass?: PublicProtocolState['activeClass'],
): PublicStateSnapshot {
  return {
    declaration,
    publicState: {
      activeClass,
      actions,
      modes,
    },
  }
}

/**
 * Convenience projection for UI consumers. It only exposes declarations
 * supplied by the observation layer; it never derives availability.
 */
export function actionFor(
  snapshot: PublicStateSnapshot,
  action: ActionAvailability['action'],
): ActionAvailability | undefined {
  return snapshot.publicState.actions.find(candidate => candidate.action === action)
}

export function activeModes(
  snapshot: PublicStateSnapshot,
): readonly ProtocolModeDeclaration[] {
  return snapshot.publicState.modes.filter(mode => mode.active)
}
