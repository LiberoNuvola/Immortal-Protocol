import { describe, expect, it } from 'vitest'
import {
  isObservationFresh,
  validateActionDeclaration,
  validateModeDeclaration,
  validatePublicStateSnapshot,
} from '../publicStateValidation'
import type { PublicStateSnapshot } from '../publicStateSnapshot'

describe('public state validation', () => {
  it('rejects contradictory action availability', () => {
    expect(validateActionDeclaration({
      action: 'BUY_TICKET',
      state: 'BLOCKED',
      available: true,
      reason: 'Prerequisite pending.',
      observedAt: '2026-09-26T07:00:00Z',
    }).valid).toBe(false)

    expect(validateActionDeclaration({
      action: 'BUY_TICKET',
      state: 'AVAILABLE',
      available: false,
      reason: 'Sale is open.',
      observedAt: '2026-09-26T07:00:00Z',
    }).valid).toBe(false)
  })

  it('rejects contradictory mode activity', () => {
    expect(validateModeDeclaration({
      mode: 'RECOVERY_MODE',
      active: true,
      status: 'BLOCKED',
      reason: 'Prerequisite pending.',
      evidenceRef: 'evidence:1',
      observedAt: '2026-09-26T07:00:00Z',
    }).valid).toBe(false)
  })

  it('rejects a public snapshot with an evidence-less active class', () => {
    const snapshot = {
      publicState: {
        activeClass: {
          classId: 1,
          status: 'ACTIVE',
          evidenceRef: '',
          observedAt: '2026-09-26T07:00:00Z',
        },
        modes: [],
        actions: [],
      },
    } as unknown as PublicStateSnapshot

    expect(validatePublicStateSnapshot(snapshot).valid).toBe(false)
  })

  it('checks freshness without defining a protocol-wide freshness policy', () => {
    const now = new Date('2026-09-26T08:00:00Z')
    expect(isObservationFresh('2026-09-26T07:59:00Z', now, 120_000)).toBe(true)
    expect(isObservationFresh('2026-09-26T07:50:00Z', now, 120_000)).toBe(false)
    expect(isObservationFresh('not-a-date', now, 120_000)).toBe(false)
  })
})
