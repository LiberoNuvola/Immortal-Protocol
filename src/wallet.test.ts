import { describe, expect, it, beforeEach } from 'vitest'
import wallet from './wallet'

describe('modern CIP-30 wallet discovery', () => {
  beforeEach(() => {
    ;(globalThis as any).window = {
      cardano: {
        zeta: { enable: async () => ({}), name: 'Zeta', apiVersion: '1.0.0' },
        alpha: { enable: async () => ({}), name: 'Alpha', apiVersion: '1.0.0' },
        unnamed: { enable: async () => ({}) },
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
    const providers = (globalThis as any).window.cardano
    for (const provider of Object.values(providers) as any[]) {
      if (provider.enable) expect(provider.enable).not.toHaveBeenCalled?.()
    }
  })
})
