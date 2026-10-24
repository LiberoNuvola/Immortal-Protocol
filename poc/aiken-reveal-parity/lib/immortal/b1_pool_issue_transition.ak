/// Composes the existing TicketIssued guards without changing their semantics.
/// This is still an isolated candidate predicate, not a validator entry point.
use aiken/crypto.{ScriptHash}
use cardano/assets.{AssetName, PolicyId}
use cardano/transaction
use immortal/b1_pool_context.{
  pool_continuing_datum_matches, pool_global_context_is_valid,
}
use immortal/b1_pool_prize_context.{ticket_issued_prize_context_is_valid}
use immortal/b1_pool_types.{pool_ticket_issued_transition_matches}
use immortal/reveal_types.{B1PrizePoolDatum}

pub fn ticket_issued_transition_context_is_valid(
  tx: transaction.Transaction,
  own_ref: transaction.OutputReference,
  pool_hash: ScriptHash,
  authority_policy: PolicyId,
  authority_name: AssetName,
  prize_hash: ScriptHash,
  before: B1PrizePoolDatum,
  after: B1PrizePoolDatum,
  action_price_usdm: Int,
) -> Bool {
  pool_global_context_is_valid(
    tx,
    own_ref,
    pool_hash,
    authority_policy,
    authority_name,
    before,
  )
    && pool_continuing_datum_matches(tx, pool_hash, after)
    && pool_ticket_issued_transition_matches(before, after, action_price_usdm)
    && ticket_issued_prize_context_is_valid(tx, prize_hash, action_price_usdm)
}
