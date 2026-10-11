# MATERIOS B3 — local operator CLI patch v1

Status: **DESIGN FROZEN / NOT APPLIED**

Purpose: obtain B3 runtime execution proof from a locally running Materios node without exposing a new public RPC and without modifying selector semantics.

## Design

Extend the existing `materios-node` binary with a local-only subcommand:

`materios-node b3-proof`

Inputs:
- the standard node/run configuration (same chain spec and base path as the operator node);
- exact target `--block-hash`;
- exact SCALE `--call-data`.

The method identifier is fixed by the command implementation to:

`SessionValidatorManagementApi_calculate_committee`

The command uses the existing `service::new_partial(&config)` path, which already constructs the concrete `FullClient` used by Materios.

The collector then performs, against the local client:

1. `HeaderBackend::header(block_hash)` → exact header and state root;
2. `BlockBackend::justifications(block_hash)` → exact justifications stored for that block;
3. `ProofProvider::execution_proof(block_hash, canonical_method, call_data)` → runtime result + `StorageProof`;
4. `FullClient::runtime_version_at(block_hash)` → runtime version identity;
5. `FullClient::code_at(block_hash)` → runtime WASM bytes, from which IMMORTAL computes the declared code hash.

No network RPC is required for the proof call.

## CLI shape

```text
materios-node b3-proof \
  --chain <same-chain-spec> \
  --base-path <same-node-base-path> \
  --block-hash 0x... \
  --call-data 0x... \
  --output b3-execution-proof.json
```

The command MUST refuse:
- missing/invalid block hash;
- missing/invalid call data;
- an execution method different from the fixed canonical committee API;
- absent target block;
- absent execution proof;
- ambiguous runtime identity.

## Evidence output

The collector emits an operator evidence object containing:

```text
schemaVersion
chain/genesis identity
blockHash
blockNumber
stateRoot
runtime specName / implName / versions
runtimeCodeHash
runtimeApiMethod
callDataHex
resultHex
proofScaleHex
grandpaJustificationHex[]      (when present)
```

This output is transport evidence only. It does not mark the block canonical, finalized, or the committee correct.

## Why this is preferable to public RPC

The operator node already exposes the concrete client internally. The B3 proof therefore stays on the operator machine and can be exported as an immutable evidence artifact. A public endpoint is unnecessary for this acquisition path.

This also avoids:
- changing Materios public attack surface;
- adding a second authority-selection implementation;
- coupling B3 evidence to gateway deployment;
- confusing RPC availability with proof validity.

## Authority/finality path

The local CLI supplies the raw artifacts; IMMORTAL still performs the independent checks:

`block hash/number → header/state root → GRANDPA justification → authority set/set-id → ancestry/quorum → selection commitment → execution proof → VerifiedAuthoritySetTransition`

The CLI does not replace any verification layer.

## Important limitation

Materios' current `new_partial` also initializes main-chain follower data sources, so the exact operator environment must already provide the Cardano DB-sync configuration required by the current node.

The node must therefore be a real synced Materios operator/validator instance, not a synthetic dev chain.

## Status

Primary B3 acquisition route:

**real Materios operator node + local B3 CLI → evidence artifact → independent IMMORTAL verifier**

Fallback:

**public GRANDPA/execution-proof RPC transport patch**

B3-A remains **OPEN** until a real artifact crosses `VerifiedAuthoritySetTransition`.
