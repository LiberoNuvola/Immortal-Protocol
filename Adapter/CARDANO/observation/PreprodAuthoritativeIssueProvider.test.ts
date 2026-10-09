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
          controlAddress: 'control',
          controlPolicyId: 'controlpolicy',
          controlTokenNameHex: 'controlname',
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
          controlAddress: 'control',
          controlPolicyId: 'controlpolicy',
          controlTokenNameHex: 'controlname',
        },
        authorityUrl: 'https://authority.invalid/issue',
        authorityPublicKeyPem: '',
        directUsdmUnit: 'b'.repeat(56),
        command: 'issue-admission',
      }),
    ).toThrow('authorityPublicKeyPem is required')
  })

  it('requires the authenticated B2 control identity in deployment configuration', () => {
    const config = {
      lucid: {},
      deployment: {
        counterAddress: 'counter',
        b1PrizePoolAddress: 'pool',
        poolTokenUnit: 'poolunit',
        carrierAddress: 'carrier',
        carrierPolicyId: 'carrierpolicy',
        carrierTokenNameHex: 'carriername',
        controlAddress: '',
        controlPolicyId: 'controlpolicy',
        controlTokenNameHex: 'controlname',
      },
      authorityUrl: 'https://authority.invalid/issue',
      authorityPublicKeyPem: 'key',
      directUsdmUnit: 'b'.repeat(56),
      command: 'issue-admission',
    }

    expect(() =>
      createPreprodAuthoritativeIssueProvider(config),
    ).toThrow('controlAddress is required')
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
          controlAddress: 'control',
          controlPolicyId: 'controlpolicy',
          controlTokenNameHex: 'controlname',
        },
        authorityUrl: 'https://authority.invalid/issue',
        authorityPublicKeyPem: 'key',
        directUsdmUnit: 'b'.repeat(56),
        command: '',
      }),
    ).toThrow('command is required')
  })
})
