import { describe, expect, it } from 'vitest'
import { createPreprodAuthoritativeIssueProvider } from './PreprodAuthoritativeIssueProvider'

describe('Preprod authoritative Issue provider composition', () => {
  it('fails closed without the signed authority endpoint', () => {
    expect(() =>
      createPreprodAuthoritativeIssueProvider({
        lucid: {},
        deployment: {
          counterAddress: 'counter',
          b1PrizePoolAddress: 'pool',
          poolTokenUnit: 'poolunit',
          carrierAddress: 'carrier',
          carrierPolicyId: 'carrierpolicy',
          carrierTokenNameHex: 'carriername',
        },
        authorityUrl: '',
        authorityPublicKeyPem: 'key',
        directUsdmUnit: 'b'.repeat(56),
        command: 'issue-admission',
      }),
    ).toThrow('authorityUrl is required')
  })

  it('fails closed without the authority verification key', () => {
    expect(() =>
      createPreprodAuthoritativeIssueProvider({
        lucid: {},
        deployment: {
          counterAddress: 'counter',
          b1PrizePoolAddress: 'pool',
          poolTokenUnit: 'poolunit',
          carrierAddress: 'carrier',
          carrierPolicyId: 'carrierpolicy',
          carrierTokenNameHex: 'carriername',
        },
        authorityUrl: 'https://authority.invalid/issue',
        authorityPublicKeyPem: '',
        directUsdmUnit: 'b'.repeat(56),
        command: 'issue-admission',
      }),
    ).toThrow('authorityPublicKeyPem is required')
  })

  it('requires the canonical Haskell Issue producer command', () => {
    expect(() =>
      createPreprodAuthoritativeIssueProvider({
        lucid: {},
        deployment: {
          counterAddress: 'counter',
          b1PrizePoolAddress: 'pool',
          poolTokenUnit: 'poolunit',
          carrierAddress: 'carrier',
          carrierPolicyId: 'carrierpolicy',
          carrierTokenNameHex: 'carriername',
        },
        authorityUrl: 'https://authority.invalid/issue',
        authorityPublicKeyPem: 'key',
        directUsdmUnit: 'b'.repeat(56),
        command: '',
      }),
    ).toThrow('command is required')
  })
})
