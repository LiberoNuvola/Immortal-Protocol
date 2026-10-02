import { describe, expect, it } from 'vitest'
import {
  assertNoDoubleDistribution,
  calculatePreStakingDistribution,
  type PreTreasuryStakingAccount,
  type PreStakingSnapshot,
} from '../preStaking'

const snapshot: PreStakingSnapshot = {
  epochId: 'epoch-1',
  snapshotId: 'snapshot-1',
  observedAt: 1_000,
  assetId: 'policy.asset',
  balances: [
    { beneficiaryId: 'alice', balance: 700n },
    { beneficiaryId: 'bob', balance: 300n },
  ],
}

const treasury: PreTreasuryStakingAccount = {
  epochId: 'epoch-1',
  assetId: 'policy.asset',
  availableBalance: 100n,
}

describe('PRE-RICH non-custodial snapshot reward calculator', () => {
  it('keeps the underlying balances untouched and distributes proportionally', () => {
    const result = calculatePreStakingDistribution(snapshot, treasury)

    expect(result.totalWeight).toBe(1000n)
    expect(result.entitlements.map(x => [x.beneficiaryId, x.rewardAmount])).toEqual([
      ['alice', 70n],
      ['bob', 30n],
    ])
    expect(result.distributed).toBe(100n)
    expect(result.undistributedDust).toBe(0n)
  })

  it('freezes entitlement to the snapshot rather than later balances', () => {
    const result = calculatePreStakingDistribution(
      {
        ...snapshot,
        balances: [
          { beneficiaryId: 'alice', balance: 900n },
          { beneficiaryId: 'bob', balance: 100n },
        ],
      },
      treasury,
    )

    expect(result.entitlements[0].rewardAmount).toBe(90n)
  })

  it('handles integer dust without creating value', () => {
    const result = calculatePreStakingDistribution(
      {
        ...snapshot,
        balances: [
          { beneficiaryId: 'alice', balance: 1n },
          { beneficiaryId: 'bob', balance: 1n },
          { beneficiaryId: 'carol', balance: 1n },
        ],
      },
      { ...treasury, availableBalance: 10n },
    )

    expect(result.distributed).toBe(9n)
    expect(result.undistributedDust).toBe(1n)
  })

  it('fails closed on duplicate beneficiaries', () => {
    expect(() =>
      calculatePreStakingDistribution(
        { ...snapshot, balances: [...snapshot.balances, { beneficiaryId: 'alice', balance: 1n }] },
        treasury,
      ),
    ).toThrow('Duplicate beneficiary')
  })

  it('fails closed when the reward treasury has no eligible weight', () => {
    expect(() =>
      calculatePreStakingDistribution(
        { ...snapshot, balances: [{ beneficiaryId: 'alice', balance: 0n }] },
        treasury,
      ),
    ).toThrow('Reward treasury has no eligible weight')
  })

  it('rejects epoch and asset mismatches', () => {
    expect(() => calculatePreStakingDistribution(snapshot, { ...treasury, epochId: 'epoch-2' })).toThrow('Epoch mismatch')
    expect(() => calculatePreStakingDistribution(snapshot, { ...treasury, assetId: 'other.asset' })).toThrow('Asset mismatch')
  })

  it('rejects a second distribution for the same epoch', () => {
    expect(() => assertNoDoubleDistribution(new Set(['epoch-1']), 'epoch-1')).toThrow('Epoch already distributed')
    expect(() => assertNoDoubleDistribution(new Set(), 'epoch-2')).not.toThrow()
  })
})
