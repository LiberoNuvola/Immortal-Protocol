/**
 * Public protocol declaration model.
 *
 * This is an observation/presentation boundary, not an economic authority.
 * Values must be produced from authoritative state/observation layers.
 */

export const LIFE_STATES = [
  'PLANULA',
  'POLYP',
  'YOUNG_MEDUSA',
  'MEDUSA',
  'REGENERATION',
] as const

export type LifeState = typeof LIFE_STATES[number]

export const PROTOCOL_ACTIVITIES = [
  'IDLE',
  'ACTIVATING_CLASS',
  'SELLING_ASSET',
  'ISSUING',
  'SETTLING',
  'DISTRIBUTING',
  'PROTECTING_CAPITAL',
  'AWAITING_FINALITY',
  'REGENERATING',
] as const

export type ProtocolActivity = typeof PROTOCOL_ACTIVITIES[number]

export const OPERATIONAL_STATUSES = [
  'ONLINE',
  'DEGRADED',
  'PAUSED',
  'HALTED',
] as const

export type OperationalStatus = typeof OPERATIONAL_STATUSES[number]

export const BEACON_TRUST_MODES = [
  'B3_VERIFIED',
  'B2_ATTESTED',
  'B1_AUTHORIZED',
] as const

export type BeaconTrustMode = typeof BEACON_TRUST_MODES[number]

export type ActivitySubject =
  | { readonly kind: 'CLASS'; readonly classId: number }
  | { readonly kind: 'ASSET'; readonly assetRef: string }
  | { readonly kind: 'ROUND'; readonly roundId: string }

export type DeclarationEvidence = {
  readonly evidenceRef: string
  readonly canonicalStateRef: string
  readonly observedAt: string
  readonly source: string
  readonly scope: string
}

export type ProtocolActivityDeclaration = {
  readonly kind: ProtocolActivity
  readonly subject?: ActivitySubject
}

export type BeaconDeclaration = {
  readonly mode: BeaconTrustMode
  readonly version: string
}

export type ProtocolDeclaration = {
  readonly protocolId: string
  readonly lifeState: LifeState
  readonly currentActivity: ProtocolActivityDeclaration
  readonly operationalStatus: OperationalStatus
  readonly beacon?: BeaconDeclaration
  readonly observedAt: string
  readonly evidence: readonly DeclarationEvidence[]
  readonly publicState?: PublicProtocolState
}


// Optional richer public-state fields. They are declarations produced by the
// authoritative observation layer; the frontend must not derive them locally.
import type { ActionAvailability } from './publicActionAvailability'
import type { ProtocolModeDeclaration } from './publicProtocolMode'

export type ActiveClassDeclaration = {
  readonly classId: number
  readonly status: 'ACTIVE' | 'INACTIVE' | 'TRANSITIONING' | 'BLOCKED'
  readonly roundId?: string
  readonly evidenceRef: string
  readonly observedAt: string
}

export type PublicProtocolState = {
  readonly activeClass?: ActiveClassDeclaration
  readonly modes: readonly ProtocolModeDeclaration[]
  readonly actions: readonly ActionAvailability[]
}

export function isLifeState(value: string): value is LifeState {
  return (LIFE_STATES as readonly string[]).includes(value)
}

export function isProtocolActivity(value: string): value is ProtocolActivity {
  return (PROTOCOL_ACTIVITIES as readonly string[]).includes(value)
}

export function isOperationalStatus(value: string): value is OperationalStatus {
  return (OPERATIONAL_STATUSES as readonly string[]).includes(value)
}

export function isBeaconTrustMode(value: string): value is BeaconTrustMode {
  return (BEACON_TRUST_MODES as readonly string[]).includes(value)
}

/**
 * A public declaration with no evidence is not publishable.
 * This check intentionally does not validate economic admissibility.
 */
export type ObservedLifecycle =
  | 'ISSUING'
  | 'AWAITING_FINALITY'
  | 'SETTLING'
  | 'IDLE'

/**
 * Maps an already-observed canonical lifecycle event to public activity.
 * It deliberately does not inspect wallet/UI intent or infer economic state.
 */
export function activityFromObservedLifecycle(
  lifecycle: ObservedLifecycle,
): ProtocolActivityDeclaration {
  return { kind: lifecycle }
}

export function declarationPublishable(declaration: ProtocolDeclaration): boolean {
  return (
    declaration.protocolId.length > 0 &&
    declaration.observedAt.length > 0 &&
    declaration.evidence.length > 0 &&
    declaration.currentActivity.kind.length > 0 &&
    declaration.evidence.every((evidence) =>
      evidence.evidenceRef.length > 0 &&
      evidence.canonicalStateRef.length > 0 &&
      evidence.observedAt.length > 0 &&
      evidence.source.length > 0 &&
      evidence.scope.length > 0
    )
  )
}
