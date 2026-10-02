export type PreStakingBalance = {
  beneficiaryId: string
  balance: bigint
}

export type PreStakingSnapshot = {
  epochId: string
  snapshotId: string
  observedAt: number
  assetId: string
  balances: readonly PreStakingBalance[]
}

export type PreStakingWeightRule = 'linear'

/** The single PRE-RICH Treasury's separate internal staking-accounting balance. */
export type PreTreasuryStakingAccount = {
  epochId: string
  assetId: string
  availableBalance: bigint
}

export type PreStakingEntitlement = {
  epochId: string
  snapshotId: string
  beneficiaryId: string
  weight: bigint
  totalWeight: bigint
  rewardAmount: bigint
}

export type PreStakingDistribution = {
  epochId: string
  snapshotId: string
  assetId: string
  treasuryStakingBalance: bigint
  totalWeight: bigint
  entitlements: readonly PreStakingEntitlement[]
  distributed: bigint
  undistributedDust: bigint
}

const nonEmpty = (value: string) => value.trim().length > 0

export function calculatePreStakingDistribution(
  snapshot: PreStakingSnapshot,
  treasury: PreTreasuryStakingAccount,
  rule: PreStakingWeightRule = 'linear',
): PreStakingDistribution {
  if (!nonEmpty(snapshot.epochId) || !nonEmpty(snapshot.snapshotId) || !nonEmpty(snapshot.assetId)) {
    throw new Error('Invalid snapshot identity')
  }
  if (snapshot.epochId !== treasury.epochId) throw new Error('Epoch mismatch')
  if (snapshot.assetId !== treasury.assetId) throw new Error('Asset mismatch')
  if (!Number.isFinite(snapshot.observedAt) || snapshot.observedAt < 0) throw new Error('Invalid snapshot time')
  if (treasury.availableBalance < 0n) throw new Error('Negative Treasury staking balance')
  if (rule !== 'linear') throw new Error('Unsupported weight rule')

  const seen = new Set<string>()
  const eligible = snapshot.balances
    .map(({ beneficiaryId, balance }) => {
      if (!nonEmpty(beneficiaryId)) throw new Error('Invalid beneficiary')
      if (seen.has(beneficiaryId)) throw new Error('Duplicate beneficiary')
      seen.add(beneficiaryId)
      if (balance < 0n) throw new Error('Negative balance')
      return { beneficiaryId, weight: balance }
    })
    .filter(({ weight }) => weight > 0n)

  const totalWeight = eligible.reduce((sum, item) => sum + item.weight, 0n)
  if (totalWeight === 0n) {
    if (treasury.availableBalance !== 0n) throw new Error('Treasury staking balance has no eligible weight')
    return {
      epochId: snapshot.epochId,
      snapshotId: snapshot.snapshotId,
      assetId: snapshot.assetId,
      treasuryStakingBalance: treasury.availableBalance,
      totalWeight,
      entitlements: [],
      distributed: 0n,
      undistributedDust: 0n,
    }
  }

  const entitlements = eligible.map(({ beneficiaryId, weight }) => ({
    epochId: snapshot.epochId,
    snapshotId: snapshot.snapshotId,
    beneficiaryId,
    weight,
    totalWeight,
    rewardAmount: (treasury.availableBalance * weight) / totalWeight,
  }))

  const distributed = entitlements.reduce((sum, item) => sum + item.rewardAmount, 0n)

  return {
    epochId: snapshot.epochId,
    snapshotId: snapshot.snapshotId,
    assetId: snapshot.assetId,
    treasuryStakingBalance: treasury.availableBalance,
    totalWeight,
    entitlements,
    distributed,
    undistributedDust: treasury.availableBalance - distributed,
  }
}

export function assertNoDoubleDistribution(
  completedEpochIds: ReadonlySet<string>,
  epochId: string,
): void {
  if (!nonEmpty(epochId)) throw new Error('Invalid epoch')
  if (completedEpochIds.has(epochId)) throw new Error('Epoch already distributed')
}
