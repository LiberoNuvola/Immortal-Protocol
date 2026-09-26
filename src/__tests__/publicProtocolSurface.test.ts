import { describe, expect, it } from 'vitest'
import {
  buildProtocolDeclarationView,
} from '../publicProtocolSurface'
import type { ProtocolDeclaration } from '../protocolDeclaration'

describe('public protocol surface', () => {
  it('renders only the supplied declaration values', () => {
    const declaration: ProtocolDeclaration = {
      protocolId: 'PRE-RICH',
      lifeState: 'MEDUSA',
      currentActivity: {
        kind: 'ACTIVATING_CLASS',
        subject: { kind: 'CLASS', classId: 4 },
      },
      operationalStatus: 'ONLINE',
      beacon: {
        mode: 'B1_AUTHORIZED',
        version: 'V1',
      },
      observedAt: '2026-09-26T08:00:00.000Z',
      evidence: [
        {
          evidenceRef: 'cardano:tx/abc#0',
          canonicalStateRef: 'cardano:tx/abc#0',
          observedAt: '2026-09-26T08:00:00.000Z',
          source: 'cardano-prize-utxo',
          scope: 'current-prize',
        },
      ],
    }

    const view = buildProtocolDeclarationView(declaration)

    expect(view.protocolId).toBe('PRE-RICH')
    expect(view.lifeState).toBe('MEDUSA')
    expect(view.currentActivity).toBe('ACTIVATING_CLASS')
    expect(view.activitySubject).toBe('Class 4')
    expect(view.operationalStatus).toBe('ONLINE')
    expect(view.beacon).toBe('B1_AUTHORIZED · V1')
    expect(view.evidence[0].evidenceRef).toBe('cardano:tx/abc#0')
  })

  it('does not invent a Beacon mode when none was declared', () => {
    const declaration: ProtocolDeclaration = {
      protocolId: 'PRE-RICH',
      lifeState: 'POLYP',
      currentActivity: { kind: 'IDLE' },
      operationalStatus: 'DEGRADED',
      observedAt: '2026-09-26T08:00:00.000Z',
      evidence: [
        {
          evidenceRef: 'cardano:tx/def#1',
          canonicalStateRef: 'cardano:tx/def#1',
          observedAt: '2026-09-26T08:00:00.000Z',
          source: 'cardano-prize-utxo',
          scope: 'current-prize',
        },
      ],
    }

    expect(buildProtocolDeclarationView(declaration).beacon)
      .toBe('UNDECLARED')
  })
})
