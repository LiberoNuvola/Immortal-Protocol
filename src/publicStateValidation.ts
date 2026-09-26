import type { ActionAvailability } from './publicActionAvailability'
import { isActionAvailable } from './publicActionAvailability'
import type { ProtocolModeDeclaration } from './publicProtocolMode'
import { modeDeclarationPublishable } from './publicProtocolMode'
import type { PublicStateSnapshot } from './publicStateSnapshot'

export type PublicObservationValidation =
  | { readonly valid: true }
  | { readonly valid: false; readonly reason: string }

export function validateActionDeclaration(
  action: ActionAvailability,
): PublicObservationValidation {
  if (!action.observedAt || !Number.isFinite(Date.parse(action.observedAt))) {
    return { valid: false, reason: 'missing or invalid observation time' }
  }
  if (!action.reason.trim()) return { valid: false, reason: 'missing action reason' }
  if (action.state === 'AVAILABLE' && !action.evidenceRef?.trim()) {
    return { valid: false, reason: 'AVAILABLE action is missing evidence reference' }
  }
  if (action.state === 'AVAILABLE' && !action.available) {
    return { valid: false, reason: 'AVAILABLE action must be marked available' }
  }
  if (action.state !== 'AVAILABLE' && action.available) {
    return { valid: false, reason: 'non-AVAILABLE action cannot be marked available' }
  }
  return { valid: true }
}

export function validateModeDeclaration(
  mode: ProtocolModeDeclaration,
): PublicObservationValidation {
  if (!modeDeclarationPublishable(mode)) {
    return { valid: false, reason: 'mode declaration is missing reason, evidence, or observation time' }
  }
  if (!Number.isFinite(Date.parse(mode.observedAt))) {
    return { valid: false, reason: 'mode declaration has invalid observation time' }
  }
  if (mode.status === 'ACTIVE' && !mode.active) {
    return { valid: false, reason: 'ACTIVE mode must be marked active' }
  }
  if (mode.status !== 'ACTIVE' && mode.active) {
    return { valid: false, reason: 'non-ACTIVE mode cannot be marked active' }
  }
  return { valid: true }
}

export function validatePublicStateSnapshot(
  snapshot: PublicStateSnapshot,
): PublicObservationValidation {
  for (const action of snapshot.publicState.actions) {
    const result = validateActionDeclaration(action)
    if (!result.valid) return result
    if (isActionAvailable(action) && action.state !== 'AVAILABLE') {
      return { valid: false, reason: 'action availability predicate is inconsistent' }
    }
  }

  for (const mode of snapshot.publicState.modes) {
    const result = validateModeDeclaration(mode)
    if (!result.valid) return result
  }

  const activeClass = snapshot.publicState.activeClass
  if (activeClass) {
    if (!Number.isSafeInteger(activeClass.classId) || activeClass.classId < 0) {
      return { valid: false, reason: 'active class id is outside public integer range' }
    }
    if (!activeClass.evidenceRef.trim()) {
      return { valid: false, reason: 'active class is missing evidence reference' }
    }
    if (!activeClass.observedAt || !Number.isFinite(Date.parse(activeClass.observedAt))) {
      return { valid: false, reason: 'active class has invalid observation time' }
    }
  }

  return { valid: true }
}

/**
 * Validate freshness at the public boundary without choosing a universal
 * freshness window. The authoritative caller supplies the allowed age.
 */
export function isObservationFresh(
  observedAt: string,
  now: Date,
  maxAgeMs: number,
): boolean {
  if (!Number.isFinite(maxAgeMs) || maxAgeMs < 0) return false
  const timestamp = Date.parse(observedAt)
  if (!Number.isFinite(timestamp)) return false
  const age = now.getTime() - timestamp
  return age >= 0 && age <= maxAgeMs
}
