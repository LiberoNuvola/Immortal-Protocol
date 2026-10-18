/// Typed-context Claim owner checks for the isolated Aiken V3 parity harness.
///
/// This module verifies the owner from the ticket NFT in actual transaction
/// inputs and checks the transaction signatories. It intentionally does not
/// claim to verify settlement, oracle valuation, Prize/PrizePool transitions,
/// or to be a deployable replacement for PrizeValidator.hs.
use aiken/collection/list
use cardano/address.{VerificationKey}
use cardano/assets
use cardano/transaction
use cardano/transaction.{Input, Transaction}

/// Mirrors the canonical Haskell ticketOwnerPkh scan: select the first
/// input carrying exactly one ticket NFT, then require a public-key credential.
/// If that first matching input is script-locked, fail closed as Haskell does.
fn ticket_owner(
  inputs: List<Input>,
  ticket_policy: assets.PolicyId,
  ticket_name: assets.AssetName,
) -> Option<ByteArray> {
  when inputs is {
    [] -> None
    [input, ..rest] ->
      if assets.quantity_of(input.output.value, ticket_policy, ticket_name) == 1 {
        when input.output.address.payment_credential is {
          VerificationKey(owner_hash) -> Some(owner_hash)
          _ -> None
        }
      } else {
        ticket_owner(rest, ticket_policy, ticket_name)
      }
  }
}

/// Returns the ticket owner using the canonical first-match scan.
/// This intentionally does not impose a new uniqueness rule on ticket inputs.
pub fn unique_ticket_owner(
  tx: Transaction,
  ticket_policy: assets.PolicyId,
  ticket_name: assets.AssetName,
) -> Option<ByteArray> {
  ticket_owner(tx.inputs, ticket_policy, ticket_name)
}

/// Verifies the ticket owner's signature against the actual transaction
/// signatory set. It does not accept a caller-supplied boolean.
pub fn ticket_owner_signed(
  tx: Transaction,
  ticket_policy: assets.PolicyId,
  ticket_name: assets.AssetName,
) -> Bool {
  when unique_ticket_owner(tx, ticket_policy, ticket_name) is {
    Some(owner_hash) ->
      list.any(tx.extra_signatories, fn(signer) { signer == owner_hash })
    None -> False
  }
}

test claim_owner_fails_closed_when_ticket_input_is_absent() {
  !ticket_owner_signed(transaction.placeholder, #"a1", #"01")
}

test claim_owner_resolution_fails_closed_when_ticket_input_is_absent() {
  unique_ticket_owner(transaction.placeholder, #"a1", #"01") == None
}

