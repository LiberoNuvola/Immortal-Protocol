import { describe, expect, it } from 'vitest'
import {
  actionAvailabilityLabel,
  isActionAvailable,
  type ActionAvailability,
} from '../publicActionAvailability'

describe('public action availability', () => {
  const base: ActionAvailability = {
    action: 'BUY_TICKET',
    state: 'AVAILABLE',
    available: true,
    reason: 'Sale phase is open.',
    currentPhase: 'SALE',
    subject: 'Round 185',
    observedAt: '2026-09-26T07:00:00Z',
  }

  it('allows only an authoritative AVAILABLE declaration', () => {
    expect(isActionAvailable(base)).toBe(true)
    expect(isActionAvailable({ ...base, state: 'BLOCKED', available: false })).toBe(false)
    expect(isActionAvailable({ ...base, state: 'PAUSED', available: false })).toBe(false)
    expect(isActionAvailable({ ...base, state: 'HALTED', available: false })).toBe(false)
  })

  it('exposes descriptive labels without hiding the reason', () => {
    expect(actionAvailabilityLabel('NOT_YET_OPEN')).toBe('NOT YET OPEN')
    expect(actionAvailabilityLabel('BLOCKED')).toBe('BLOCKED')
    expect(actionAvailabilityLabel('HALTED')).toBe('HALTED')
  })
})