/**
 * Certified PRE-RICH ticket binding.
 *
 * The NFT identity is immutable: (policyId, assetName).
 * The economic/ticket state is mutable through the canonical PrizeDatum.
 * A renderer can only consume a successfully certified binding.
 */

export type CertifiedTicketIdentity = {
  policyId: string
  assetName: string
}

export type CertifiedTicketState = {
  identity: CertifiedTicketIdentity
  purchaseTxHash?: string
  priceUsdm: bigint
  commitment: string
  gameVersion: string
  ticketNonce: bigint
  status: 'Pending' | 'Revealed' | 'Claimed'
  result: string
  prizeTier: bigint
  prizeAmount: bigint
  issuedAt: bigint
  expiresAt: bigint
  row1Tier: bigint
  row2Tier: bigint
  beaconTarget: string
  verificationReference?: string
}

function normalizeHex(value: string): string {
  return value.replace(/^0x/i, '').toLowerCase()
}

export function certifyTicketBinding(input: {
  walletAssetPolicyId: string
  walletAssetNameHex: string
  datum: {
    ticketPolicy: string
    ticketName: string
    priceUsdm: bigint
    commitment: string
    gameVersion: string
    ticketNonce: bigint
    status: 'Pending' | 'Revealed' | 'Claimed'
    result: string
    prizeTier: bigint
    prizeAmount: bigint
    issuedAt: bigint
    expiresAt: bigint
    row1Tier: bigint
    row2Tier: bigint
    beaconTarget: string
  }
  purchaseTxHash?: string
  verificationReference?: string
}): CertifiedTicketState {
  const expectedPolicy = normalizeHex(input.walletAssetPolicyId)
  const expectedName = normalizeHex(input.walletAssetNameHex)
  const datumPolicy = normalizeHex(input.datum.ticketPolicy)
  const datumName = normalizeHex(input.datum.ticketName)

  if (expectedPolicy !== datumPolicy) {
    throw new Error('ticket policy ID does not match PrizeDatum identity')
  }
  if (expectedName !== datumName) {
    throw new Error('ticket asset name does not match PrizeDatum identity')
  }
  if (input.datum.priceUsdm <= 0n) throw new Error('ticket price must be positive')
  if (input.datum.prizeAmount < 0n) throw new Error('prize amount must be non-negative')
  if (input.datum.prizeTier < 0n) throw new Error('prize tier must be non-negative')
  if (input.datum.row1Tier < 0n || input.datum.row2Tier < 0n) throw new Error('row tiers must be non-negative')
  if (input.datum.issuedAt < 0n) throw new Error('issuedAt must be non-negative')
  if (input.datum.expiresAt < input.datum.issuedAt) throw new Error('expiresAt must not precede issuedAt')

  return {
    identity: {
      policyId: datumPolicy,
      assetName: datumName,
    },
    purchaseTxHash: input.purchaseTxHash,
    priceUsdm: input.datum.priceUsdm,
    commitment: input.datum.commitment,
    gameVersion: input.datum.gameVersion,
    ticketNonce: input.datum.ticketNonce,
    status: input.datum.status,
    result: input.datum.result,
    prizeTier: input.datum.prizeTier,
    prizeAmount: input.datum.prizeAmount,
    issuedAt: input.datum.issuedAt,
    expiresAt: input.datum.expiresAt,
    row1Tier: input.datum.row1Tier,
    row2Tier: input.datum.row2Tier,
    beaconTarget: input.datum.beaconTarget,
    verificationReference: input.verificationReference,
  }
}

export function isTicketTerminal(state: CertifiedTicketState): boolean {
  return state.status === 'Claimed' || BigInt(Date.now()) >= state.expiresAt
}

export function assertRendererIsNotAuthority(): void {
  // Deliberate no-op marker for presentation-layer audits. Economic decisions
  // must never be derived from renderer-local state.
}

export function assertObservedTicketNft(
  assets: Readonly<Record<string, bigint>>,
  policyId: string,
  assetNameHex: string,
): void {
  const unit = normalizeHex(policyId) + normalizeHex(assetNameHex)
  if (assets[unit] !== 1n) {
    throw new Error('certified ticket NFT must be observed with quantity exactly one')
  }
}
