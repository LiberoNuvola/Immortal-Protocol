import { describe, expect, it } from 'vitest'
import {
  assertCip113MintBurnHasCanonicalBinding,
  assertCip113OperationIsEconomicallyBound,
  assertCip113ReplayDeployment,
  assertCip113ThirdPartyActionExplicitlyAdmitted,
  assertCip113UnfrackingIsRepresentationOnly,
  type Cip113OperationEvidence,
} from './Cip113PreRichIsolation'

const base: Cip113OperationEvidence = {
  deploymentId: 'cip113-preprod-v1',
  transactionReference: 'tx-001',
  operation: 'Transfer',
  ownershipBefore: 'stake:alice',
  ownershipAfter: 'stake:alice',
  tokenQuantityBefore: 100n,
  tokenQuantityAfter: 100n,
  canonicalTransitionReference: 'economic-transition-001',
}

describe('CIP-113 PRE-RICH isolation', () => {
  it('requires every economically relevant operation to bind to a canonical transition', () => {
    expect(() =>
      assertCip113OperationIsEconomicallyBound(base),
    ).not.toThrow()

    expect(() =>
      assertCip113OperationIsEconomicallyBound({
        ...base,
        canonicalTransitionReference: null,
      }),
    ).toThrow(/no canonical economic transition binding/)
  })

  it('fails closed for third-party actions until PRE-RICH explicitly defines an authorization profile', () => {
    expect(() =>
      assertCip113ThirdPartyActionExplicitlyAdmitted({
        ...base,
        operation: 'ThirdParty',
        ownershipAfter: 'stake:treasury',
        canonicalTransitionReference: null,
      }),
    ).toThrow(/requires an explicit PRE-RICH authorization profile/)
  })

  it('accepts unfracking only as same-owner, same-quantity representation restructuring', () => {
    expect(() =>
      assertCip113UnfrackingIsRepresentationOnly({
        ...base,
        operation: 'Unfracking',
      }),
    ).not.toThrow()

    expect(() =>
      assertCip113UnfrackingIsRepresentationOnly({
        ...base,
        operation: 'Unfracking',
        ownershipAfter: 'stake:bob',
      }),
    ).toThrow(/changed ownership/)

    expect(() =>
      assertCip113UnfrackingIsRepresentationOnly({
        ...base,
        operation: 'Unfracking',
        tokenQuantityAfter: 99n,
      }),
    ).toThrow(/changed token quantity/)
  })

  it('requires canonical binding for mint and burn', () => {
    expect(() =>
      assertCip113MintBurnHasCanonicalBinding({
        ...base,
        operation: 'Mint',
      }),
    ).not.toThrow()

    expect(() =>
      assertCip113MintBurnHasCanonicalBinding({
        ...base,
        operation: 'Burn',
        canonicalTransitionReference: null,
      }),
    ).toThrow(/no canonical economic transition binding/)
  })

  it('rejects replay against a different deployment identity', () => {
    expect(() =>
      assertCip113ReplayDeployment(base, 'cip113-preprod-v1'),
    ).not.toThrow()

    expect(() =>
      assertCip113ReplayDeployment(base, 'cip113-other-deployment'),
    ).toThrow(/deployment identity mismatch/)
  })
})
