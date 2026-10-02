import { describe, expect, it, beforeEach } from 'vitest'
import wallet from './wallet'

describe('modern CIP-30 wallet discovery', () => {
  let enableCalls = 0
  beforeEach(() => {
    enableCalls = 0
    const enable = async () => {
      enableCalls += 1
      return {}
    }
    ;(globalThis as any).window = {
      cardano: {
        zeta: { enable, name: 'Zeta', apiVersion: '1.0.0' },
        alpha: { enable, name: 'Alpha', apiVersion: '1.0.0' },
        unnamed: { enable, apiVersion: '1.0.0' },
        broken: {},
      },
    }
  })

  it('discovers only usable CIP-30 providers and sorts them by display name', () => {
    expect(wallet.discover().map(option => option.name)).toEqual([
      'Alpha',
      'Unnamed',
      'Zeta',
    ])
  })

  it('does not auto-enable a wallet during discovery', () => {
    wallet.discover()
    expect(enableCalls).toBe(0)
  })
})
