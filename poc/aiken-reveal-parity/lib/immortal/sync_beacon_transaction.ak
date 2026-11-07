use aiken/collection/list
use aiken/crypto.{ScriptHash}
use cardano/address.{Script}
use cardano/transaction
use immortal/reveal_types.{BeaconPending, BeaconReady, BeaconRegistryDatum, Pending, PrizeDatum, B1PrizePoolDatum}

// Resolve inline and hashed Registry/Prize datums; missing witnesses fail closed.
fn datum_data(tx: transaction.Transaction, output: transaction.Output) -> Option<Data> {
  when output.datum is {
    transaction.InlineDatum(data) -> Some(data)
    transaction.DatumHash(hash) -> transaction.find_datum(tx.outputs, tx.datums, hash)
    transaction.NoDatum -> None
  }
}

fn same_target(a: immortal.reveal_types.BeaconTarget, b: immortal.reveal_types.BeaconTarget) -> Bool {
  a.network_id == b.network_id
    && a.round_id == b.round_id
    && a.mainchain_ref == b.mainchain_ref
    && a.version == b.version
}

fn registry_reference_matches(input: transaction.Input, registry_hash: ScriptHash) -> Bool {
  input.output.address.payment_credential == Script(registry_hash)
}

// Haskell readRegistry returns the first reference input with the configured
// Registry script credential. Decode only that matching input; do not accept a
// lookalike address or fall through to a later Registry if its datum is invalid.
fn read_registry(
  tx: transaction.Transaction,
  registry_hash: ScriptHash,
) -> Option<BeaconRegistryDatum> {
  when list.find(tx.reference_inputs, fn(input) {
    registry_reference_matches(input, registry_hash)
  }) is {
    Some(input) ->
      when datum_data(tx, input.output) is {
        Some(raw) -> {
          expect registry: BeaconRegistryDatum = raw
          Some(registry)
        }
        None -> None
      }
    None -> None
  }
}

fn only_script_output(
  outputs: List<transaction.Output>,
  script_hash: ScriptHash,
) -> Option<transaction.Output> {
  when list.filter(outputs, fn(output) {
    output.address.payment_credential == Script(script_hash)
  }) is {
    [output] -> Some(output)
    _ -> None
  }
}

fn own_datum_matches(
  tx: transaction.Transaction,
  own_ref: transaction.OutputReference,
  expected: PrizeDatum,
) -> Bool {
  when transaction.find_input(tx.inputs, own_ref) is {
    Some(input) ->
      when datum_data(tx, input.output) is {
        Some(raw) -> {
          expect decoded: PrizeDatum = raw
          decoded == expected
        }
        None -> False
      }
    None -> False
  }
}

// Same fields as PrizeValidator.identityFieldsEq. Beacon receipt/result fields
// are the only fields SyncBeacon is allowed to write.
fn identity_fields_equal(a: PrizeDatum, b: PrizeDatum) -> Bool {
  a.ticket_policy == b.ticket_policy
    && a.ticket_name == b.ticket_name
    && a.player_commitment == b.player_commitment
    && a.price_usdm == b.price_usdm
    && a.commitment == b.commitment
    && a.game_version == b.game_version
    && a.ticket_nonce == b.ticket_nonce
    && a.payment_policy == b.payment_policy
    && a.payment_name == b.payment_name
    && same_target(a.beacon_target, b.beacon_target)
    && a.prize_pool_hash == b.prize_pool_hash
    && a.issued_at == b.issued_at
    && a.expires_at == b.expires_at
    && a.row1_tier == b.row1_tier
    && a.row2_tier == b.row2_tier
    && a.prize_amount == b.prize_amount
}

fn sync_output_matches(
  input: PrizeDatum,
  output: PrizeDatum,
  registry: BeaconRegistryDatum,
) -> Bool {
  identity_fields_equal(input, output)
    && input.status == Pending
    && input.beacon_status == BeaconPending
    && registry.status == BeaconReady
    && registry.round == input.beacon_target.round_id
    && same_target(registry.target, input.beacon_target)
    && bytearray.length(registry.beacon_value) > 0
    && output.status == Pending
    && output.beacon_status == BeaconReady
    && output.beacon_value == registry.beacon_value
    && output.mc_hash == registry.mc_hash
    && output.materios_context == registry.materios_context
    && bytearray.length(output.result) == 0
    && output.prize_tier == 0
}

pub fn sync_beacon_transaction_is_valid(
  tx: transaction.Transaction,
  own_ref: transaction.OutputReference,
  input_datum: PrizeDatum,
  registry_hash: ScriptHash,
) -> Bool {
  when transaction.find_input(tx.inputs, own_ref) is {
    None -> False
    Some(own_input) ->
      when own_input.output.address.payment_credential is {
        Script(own_hash) -> {
          let own_inputs = list.filter(tx.inputs, fn(input) {
            input.output.address.payment_credential == Script(own_hash)
          })
          and {
            own_datum_matches(tx, own_ref, input_datum),
            list.length(own_inputs) == 1,
            when read_registry(tx, registry_hash) is {
              None -> False
              Some(registry) ->
                when only_script_output(tx.outputs, own_hash) is {
                  None -> False
                  Some(continuing) ->
                    when datum_data(tx, continuing) is {
                      None -> False
                      Some(raw) -> {
                        expect output_datum: PrizeDatum = raw
                        continuing.value == own_input.output.value
                          && sync_output_matches(input_datum, output_datum, registry)
                      }
                    }
                }
            },
          }
        }
        _ -> False
      }
  }
}

test sync_target_requires_network_round_reference_and_version() {
  let expected = immortal.reveal_types.BeaconTarget {
    network_id: 0,
    round_id: 42,
    mainchain_ref: #"010203",
    version: "v1",
  }
  same_target(
    expected,
    immortal.reveal_types.BeaconTarget {
      network_id: 0,
      round_id: 42,
      mainchain_ref: #"010203",
      version: "v1",
    },
  )
    && !same_target(
      expected,
      immortal.reveal_types.BeaconTarget {
        network_id: 0,
        round_id: 43,
        mainchain_ref: #"010203",
        version: "v1",
      },
    )
}

test sync_requires_ready_registry_with_nonempty_beacon_and_target() {
  let target = immortal.reveal_types.BeaconTarget {
    network_id: 0,
    round_id: 42,
    mainchain_ref: #"010203",
    version: "v1",
  }
  let registry = BeaconRegistryDatum {
    round: 42,
    target,
    status: BeaconReady,
    beacon_value: #"aabb",
    mc_hash: #"ccdd",
    materios_context: #"eeff",
    relayer: #"010203",
  }
  registry.status == BeaconReady
    && registry.round == target.round_id
    && same_target(registry.target, target)
    && bytearray.length(registry.beacon_value) > 0
}
