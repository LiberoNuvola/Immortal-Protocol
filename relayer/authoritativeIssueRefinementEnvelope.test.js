const { describe, expect, it } = require('vitest')
const { validateAuthoritativeIssueRefinementEnvelope } = require('./authoritativeIssueRefinementEnvelope')

const base = {
  verificationReference: 'verify:eev:abc',
  sourceReference: 'oracle-state:tx/abc#0',
  derivationVersion: 'EEV-v1',
  observedAt: 100n,
  freshnessWindow: 300n,
  verificationStatus: 'VERIFIED',
  poolUsdmValue: 1000n,
  preEEV: 1000n,
  candidateEEV: 1000n,
  requiredImmediateLiquidity: 1n,
  truthVerified: true,
  eevFresh: true,
  obligationsComplete: true,
  allOmegaSuccessorsCertified: true,
  decisionReference: 'decision:abc',
}

describe('authoritative Issue refinement envelope', () => {
  it('accepts only an explicitly verified, provenance-bearing envelope', () => {
    expect(validateAuthoritativeIssueRefinementEnvelope(base).preEEV).toBe(1000n)
  })

  it('rejects an unverified envelope', () => {
    expect(() =>
      validateAuthoritativeIssueRefinementEnvelope({ ...base, verificationStatus: 'UNVERIFIED' }),
    ).toThrow(/VERIFIED/)
  })

  it('rejects missing provenance', () => {
    const { sourceReference, ...rest } = base
    expect(() => validateAuthoritativeIssueRefinementEnvelope(rest)).toThrow(/sourceReference/)
  })

  it('rejects a local or missing observation timestamp', () => {
    expect(() =>
      validateAuthoritativeIssueRefinementEnvelope({ ...base, observedAt: undefined }),
    ).toThrow(/observedAt/)
  })
})
