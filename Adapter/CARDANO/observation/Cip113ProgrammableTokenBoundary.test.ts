import { describe, expect, it } from 'vitest'
import {
  assertCip113EvidenceMatchesTransaction,
  assertCip113UpgradeAuthorityIsNotEconomicAuthority,
  validateCip113ProgrammableTokenEvidence,
  type Cip113ProgrammableTokenEvidence,
} from './Cip113ProgrammableTokenBoundary'

const evidence: Cip113ProgrammableTokenEvidence = {
  deploymentId: 'cip113-preprod-v1',
  protocolParamsReference: 'protocol-params-utxo#0',
  registryNodeReference: 'registry-node-utxo#0',
  tokenPolicyId: 'aa'.repeat(28),
  assetNameHex: '505245',
  transferLogicReference: 'transfer-logic-ref-v1',
  transactionReference: 'tx-preprod-001',
  ownershipCredential: 'stake:holder-001',
  upgradeAuthorityReference: 'cip113-governance-reference',
}

describe('CIP-113 Adapter boundary', () => {
  it('accepts a complete programmable-token evidence packet', () => {
    expect(() => validateCip113ProgrammableTokenEvidence(evidence)).not.toThrow()
  })

  it('binds registry, protocol parameters and transfer logic to the observed transaction', () => {
    expect(() =>
      assertCip113EvidenceMatchesTransaction(evidence, {
        deploymentId: 'cip113-preprod-v1',
        protocolParamsReference: 'protocol-params-utxo#0',
        registryNodeReference: 'registry-node-utxo#0',
        tokenPolicyId: 'aa'.repeat(28),
        assetNameHex: '505245',
        transferLogicReference: 'transfer-logic-ref-v1',
        transactionReference: 'tx-preprod-001',
        ownershipCredential: 'stake:holder-001',
      }),
    ).not.toThrow()
  })

  it('rejects stale registry configuration', () => {
    expect(() =>
      assertCip113EvidenceMatchesTransaction(evidence, {
        deploymentId: 'cip113-preprod-v1',
        protocolParamsReference: 'protocol-params-utxo#0',
        registryNodeReference: 'registry-node-STALE#0',
        tokenPolicyId: 'aa'.repeat(28),
        assetNameHex: '505245',
        transferLogicReference: 'transfer-logic-ref-v1',
        transactionReference: 'tx-preprod-001',
        ownershipCredential: 'stake:holder-001',
      }),
    ).toThrow(/registryNodeReference mismatch/)
  })

  it('rejects stale protocol-parameter configuration', () => {
    expect(() =>
      assertCip113EvidenceMatchesTransaction(evidence, {
        deploymentId: 'cip113-preprod-v1',
        protocolParamsReference: 'protocol-params-STALE#0',
        registryNodeReference: 'registry-node-utxo#0',
        tokenPolicyId: 'aa'.repeat(28),
        assetNameHex: '505245',
        transferLogicReference: 'transfer-logic-ref-v1',
        transactionReference: 'tx-preprod-001',
        ownershipCredential: 'stake:holder-001',
      }),
    ).toThrow(/protocolParamsReference mismatch/)
  })

  it('rejects replay against a different transaction', () => {
    expect(() =>
      assertCip113EvidenceMatchesTransaction(evidence, {
        deploymentId: 'cip113-preprod-v1',
        protocolParamsReference: 'protocol-params-utxo#0',
        registryNodeReference: 'registry-node-utxo#0',
        tokenPolicyId: 'aa'.repeat(28),
        assetNameHex: '505245',
        transferLogicReference: 'transfer-logic-ref-v1',
        transactionReference: 'tx-other-999',
        ownershipCredential: 'stake:holder-001',
      }),
    ).toThrow(/transactionReference mismatch/)
  })

  it('keeps CIP-113 upgrade governance separate from economic authority', () => {
    expect(() =>
      assertCip113UpgradeAuthorityIsNotEconomicAuthority(
        'immortal-economic-authority',
        evidence,
      ),
    ).not.toThrow()

    expect(() =>
      assertCip113UpgradeAuthorityIsNotEconomicAuthority(
        evidence.upgradeAuthorityReference,
        evidence,
      ),
    ).toThrow(/must not be reused as economic authority/)
  })

  it('rejects malformed policy identifiers before they become evidence', () => {
    expect(() =>
      validateCip113ProgrammableTokenEvidence({
        ...evidence,
        tokenPolicyId: 'not-hex',
      }),
    ).toThrow(/tokenPolicyId must be hexadecimal/)
  })
})
