use aiken/crypto.{ScriptHash}
use cardano/assets.{AssetName, PolicyId}

/// Wire-compatible type declarations for the existing Haskell Types.hs schema.
/// Constructor order and field order are compatibility-sensitive. Do not reorder
/// variants or fields without a differential fixture against the Haskell encoder.

pub type PrizeStatus {
  Pending
  Revealed
  Claimed
}

pub type BeaconStatus {
  BeaconPending
  BeaconReady
}

pub type BeaconTarget {
  BeaconTarget {
    network_id: Int,
    round: Int,
    mainchain_ref: ByteArray,
    version: ByteArray,
  }
}

pub type PrizeDatum {
  PrizeDatum {
    ticket_policy: PolicyId,
    ticket_name: AssetName,
    player_commitment: ByteArray,
    price_usdm: Int,
    commitment: ByteArray,
    game_version: ByteArray,
    ticket_nonce: Int,
    prize_amount: Int,
    payment_policy: ByteArray,
    payment_name: ByteArray,
    status: PrizeStatus,
    result: ByteArray,
    prize_tier: Int,
    beacon_target: BeaconTarget,
    beacon_status: BeaconStatus,
    beacon_value: ByteArray,
    mc_hash: ByteArray,
    materios_context: ByteArray,
    prize_pool_hash: ScriptHash,
    issued_at: Int,
    expires_at: Int,
    row1_tier: Int,
    row2_tier: Int,
  }
}

pub type PrizeAction {
  SyncBeacon
  Reveal(ByteArray)
  Claim
  Expire
}

pub type B1PrizePoolDatum {
  B1PrizePoolDatum {
    total_liquidity: Int,
    pending_liabilities: Int,
    unresolved_reserve: Int,
    unresolved_ticket_count: Int,
    locked_jackpot: Int,
    jackpot_threshold: Int,
    suspended_classes: Int,
    prize_hash: ScriptHash,
  }
}

/// Redeemer wire schema matching Types.hs B1PrizePoolAction constructor order.
/// Keep these variants in the same order as the canonical Haskell type.
pub type B1PrizePoolAction {
  FundTreasury
  TicketIssued(Int)
  TicketRevealed(Int)
  TicketClaimed(Int)
  TicketExpired
}
