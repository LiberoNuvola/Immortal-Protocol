 *
 *  0 pdTicketPolicy
 *  1 pdTicketName
 *  2 pdPlayerCommitment
 *  3 pdPriceUsdm
 *  4 pdCommitment
 *  5 pdGameVersion
 *  6 pdTicketNonce
 *  7 pdPrizeAmount
 *  8 pdPaymentPolicy
 *  9 pdPaymentName
 * 10 pdStatus
 * 11 pdResult
 * 12 pdPrizeTier
 * 13 pdBeaconTarget
 * 14 pdBeaconStatus
 * 15 pdBeaconValue
 * 16 pdMcHash
 * 17 pdMateriosContext
 * 18 pdPrizePoolHash
 * 19 pdIssuedAt
 * 20 pdExpiresAt
 * 21 pdRow1Tier
 * 22 pdRow2Tier
 */
function buildPrizeDatumConstr(
  fields: {
    ticketPolicyHex: string
    ticketNameHex: string
    playerCommitmentHex: string
    priceUsdm: number
    commitmentHex: string
    gameVersionHex: string
    ticketNonce: number
    prizeAmount: bigint
    paymentPolicyHex: string
    paymentNameHex: string
    target: BeaconTarget
    prizePoolHashHex: string
    issuedAt: bigint
    expiresAt: bigint
  },
): Constr<Data> {
  return constr(0, [
    fields.ticketPolicyHex,
    fields.ticketNameHex,
    fields.playerCommitmentHex,
    BigInt(fields.priceUsdm),
    fields.commitmentHex,
    fields.gameVersionHex,
    BigInt(fields.ticketNonce),
    fields.prizeAmount,
    fields.paymentPolicyHex,
    fields.paymentNameHex,

    // PrizeStatus = Pending
    constr(0),

    // Empty result
    '',

    // Tier = 0
    0n,

    beaconTargetToConstr(
      fields.target,
    ),

    // BeaconStatus = BeaconPending
    constr(0),

    // Empty beacon value
    '',

    // Empty MC hash
    '',

    // Empty Materios context
    '',

    // pdPrizePoolHash
    fields.prizePoolHashHex,

    // issuedAt
    fields.issuedAt,

    // expiresAt
    fields.expiresAt,

    // Classic-6 row results: both are zero before reveal.
    0n,
    0n,
  ])
}

// ============================================================
// Result types