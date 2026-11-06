import { describe, expect, it } from 'vitest'

import { assertCompletedIssueValidityLowerBound } from '../issueSettlement'

describe('completed Issue validity lower-bound conformance', () => {
  it('accepts the exact finite validity-start slot', () => {
    const completedTx = {
      txComplete: {
        body: () => ({ validity_start_interval: () => 123n }),
      },
    }
    expect(() => assertCompletedIssueValidityLowerBound(completedTx, 123)).not.toThrow()
  })

  it('rejects a missing finite validity-start slot', () => {
    const completedTx = {
      txComplete: {
        body: () => ({ validity_start_interval: () => undefined }),
      },
    }
    expect(() => assertCompletedIssueValidityLowerBound(completedTx, 123)).toThrow(
      'Completed Issue transaction is missing a finite validity lower bound',
    )
  })

  it('rejects a completed body whose validity-start slot differs from the expiry anchor', () => {
    const completedTx = {
      txComplete: {
        body: () => ({ validity_start_interval: () => 122n }),
      },
    }
    expect(() => assertCompletedIssueValidityLowerBound(completedTx, 123)).toThrow(
      'Completed Issue validity-start mismatch: expected slot 123, got 122',
    )
  })
})
