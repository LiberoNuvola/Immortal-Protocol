import { describe, expect, it } from 'vitest'
import {
  BEACON_TRUST_MODES,
  LIFE_STATES,
  OPERATIONAL_STATUSES,
  PROTOCOL_ACTIVITIES,
  declarationPublishable,
  isBeaconTrustMode,
  isLifeState,
  isOperationalStatus,
  isProtocolActivity,
  type ProtocolDeclaration,
} from '../protocolDeclaration'

const evidence = {
  evidenceRef: 'tx:abc',
  canonicalStateRef: 'state:123',
  observedAt: '2026-09-26T07:00:00Z',
  source: 'cardano-observation',
  scope: 'current-round',
} as const

const base: ProtocolDeclaration = {
  protocolId: 'PRE-RICH',
  lifeState: 'MEDUSA',
  operationalStatus: 'ONLINE',
  observedAt: '2026-09-26T07:00:00Z',
  evidence: [evidence],
}

describe('Protocol Declaration Layer', () => {
  it('exposes the international vocabulary as closed sets', () => {
    expect(LIFE_STATES).toContain('MEDUSA')
    expect(PROTOCOL_ACTIVITIES).toContain('SELLING_ASSET')
    expect(OPERATIONAL_STATUSES).toContain('ONLINE')
    expect(BEACON_TRUST_MODES).toContain('B3_VERIFIED')
  })

  it('keeps the four declaration dimensions independently typed', () => {
    expect(isLifeState('MEDUSA')).toBe(true)
    expect(isProtocolActivity('SELLING_ASSET')).toBe(true)
    expect(isOperationalStatus('DEGRADED')).toBe(true)
    expect(isBeaconTrustMode('B2_ATTESTED')).toBe(true)
  })

  it('rejects unknown public vocabulary values', () => {
    expect(isLifeState('KRAKEN')).toBe(false)
    expect(isProtocolActivity('MAKING_MONEY')).toBe(false)
    expect(isOperationalStatus('CERTIFIED')).toBe(false)
    expect(isBeaconTrustMode('B4_UNKNOWN')).toBe(false)
  })

  it('requires evidence before a declaration can be published', () => {
    expect(declarationPublishable(base)).toBe(true)
    expect(declarationPublishable({ ...base, evidence: [] })).toBe(false)
  })

  it('does not make activity part of economic authority', () => {
    const declaration = {
      ...base,
      currentActivity: { kind: 'SELLING_ASSET' as const },
    }
    expect(declarationPublishable(declaration)).toBe(true)
  })
})
