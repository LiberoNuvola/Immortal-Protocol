import type { ActionAvailability } from '../../src/publicActionAvailability'
import type { ProtocolModeDeclaration } from '../../src/publicProtocolMode'
import type { PublicProtocolState } from '../../src/protocolDeclaration'
import type { EconomicStateV3 } from './PreRichCardanoObservationProjection'

export type PreRichPublicStateEvidence = {
  readonly activeClassEvidenceRef: string
  readonly observedAt: string
  readonly roundId?: string
}

/**
 * Projects only the dimensions that are explicitly observed in the
 * PRE-RICH economic observation. It deliberately does not derive economic
 * modes or action availability from balances.
 *
 * Modes/actions must be supplied by their own authoritative declarations.
 */
export function projectObservedPreRichPublicState(
  state: EconomicStateV3,
  evidence: PreRichPublicStateEvidence,
  actions: readonly ActionAvailability[],
  modes: readonly ProtocolModeDeclaration[],
): PublicProtocolState {
  if (!evidence.activeClassEvidenceRef) {
    throw new Error('active class evidence reference is required')
  }

  const classId = Number(state.control.currentActiveClass)
  if (!Number.isSafeInteger(classId) || classId < 0) {
    throw new Error('observed current active class is outside public integer range')
  }

  return {
    activeClass: {
      classId,
      status: 'ACTIVE',
      ...(evidence.roundId ? { roundId: evidence.roundId } : {}),
      evidenceRef: evidence.activeClassEvidenceRef,
      observedAt: evidence.observedAt,
    },
    actions,
    modes,
  }
}
