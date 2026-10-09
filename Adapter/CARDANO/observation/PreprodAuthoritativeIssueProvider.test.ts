import { describe, expect, it } from 'vitest'
import {
  buildSignedIssueAuthorityRequest,
  createPreprodAuthoritativeIssueProvider,
} from './PreprodAuthoritativeIssueProvider'

describe('Preprod authoritative Issue provider composition', () => {
  it('binds the signed authority request to the live B2 reference, not the client hint', () => {
    const request = {
      controlStateReference: 'client'.repeat(10) + '#3',
      classId: 0n,
      price: 1n,
    }
    const live = {
      controlStateReference: 'live'.repeat(12) + '#7',
      observationReference: 'preprod-issue:live',
      poolInputReference: 'b'.repeat(64) + '#1',
      carrierStateReference: 'c'.repeat(64) + '#2',
    }

    const built = buildSignedIssueAuthorityRequest(
      request,
      live,
      'e'.repeat(64),
      100n,
      'preprod-direct:live',
      123n,
    )

    expect(built.controlStateReference).toBe(live.controlStateReference)
    expect(built.poolInputReference).toBe(live.poolInputReference)
    expect(built.carrierStateReference).toBe(live.carrierStateReference)
    expect(built.observationReference).toBe(live.observationReference)
  })


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
