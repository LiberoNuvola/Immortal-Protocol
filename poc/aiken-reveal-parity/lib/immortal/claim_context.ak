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

fn owner_inputs(
  inputs: List<Input>,
  ticket_policy: assets.PolicyId,
  ticket_name: assets.AssetName,
) -> List<Input> {
  list.filter(
    inputs,
    fn(input) {
      assets.quantity_of(input.output.value, ticket_policy, ticket_name) == 1
        && when input.output.address.payment_credential is {
          VerificationKey(_) -> True
          _ -> False
        }
    },
  )
}

/// Returns the sole public-key owner input for the ticket NFT, if unique.
/// Script-locked ticket inputs and ambiguous owner inputs fail closed.
pub fn unique_ticket_owner(
  tx: Transaction,
  ticket_policy: assets.PolicyId,
  ticket_name: assets.AssetName,
) -> Option<ByteArray> {
  when owner_inputs(tx.inputs, ticket_policy, ticket_name) is {
    [input] ->
      when input.output.address.payment_credential is {
        VerificationKey(owner_hash) -> Some(owner_hash)
        _ -> None
      }
    _ -> None
  }
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

