# Materios B3-C native execution-proof pipeline

Status: preparatory native execution-witness integration implemented; exact-head Rust/TypeScript conformance passed; live capture blocked because the proposed upstream Materios RPC is not deployed. This is not the succinct/ZK proof or Cardano verifier required for complete B3-C.

## Existing verifier reuse

This path reuses the existing Rust crate at `poc/materios-execution-verifier/`. It does not introduce a second verifier or duplicate the Polkadot SDK proof-check implementation.

The added binary `verify-execution-proof` is a thin file adapter over the existing library function `verify_execution_proof`. It accepts:

1. exact block `stateRoot`;
2. SCALE-encoded native `StorageProof`;
3. runtime WASM bytes;
4. expected Blake2-256 runtime-code hash;
5. exact runtime API method;
6. exact SCALE call data;
7. expected runtime result.

The binary is intentionally restricted to `SessionValidatorManagementApi_calculate_committee`. A successful result means the supplied runtime reproduced the expected result against the proof backend authenticated by the supplied state root.

## TypeScript acquisition and binding

Run:

```sh
npm ci --prefix poc/materios-checkpoint
npm --prefix poc/materios-checkpoint run capture:verify:execution
```

The script selects `MATERIOS_B3_BLOCK_HASH` when supplied, otherwise the RPC-reported finalized head. It requires the selected block to be at or below the RPC-reported finalized head and requires `chain_getBlockHash(blockNumber)` to return the same hash.

It then obtains, all at that exact target hash:

- the header and `stateRoot`;
- runtime version and runtime code (`:code`);
- native `materios_b3_calculateCommitteeProof(block_hash, call_data_hex)` response;
- raw block extrinsics and the unique `SessionCommitteeManagement::set` selection-input commitment.

The existing `executionProof.ts` validator checks the v2 envelope and exact input/epoch call-data construction. The extracted on-block selection-input hash must equal the Blake2-256 hash of the supplied exact `AuthoritySelectionInputs` bytes. The runtime WASM's computed Blake2-256 must equal the packet's declared code hash.

The TypeScript layer is transport and binding validation, not cryptographic execution verification. The Rust binary performs the native SCALE proof decoding, WASM hash check, execution-proof verification against `stateRoot`, exact method/call-data execution, and reproduced-result equality check.

## Required GitHub Actions repository variables

The live job is opt-in through the existing workflow's `workflow_dispatch` input `run_live_execution_proof=true`. Set these repository variables before running it:

| Variable | Meaning |
| --- | --- |
| `MATERIOS_B3_AUTHORITY_SELECTION_INPUTS_HEX` | Exact SCALE bytes of authoritative `AuthoritySelectionInputs`; do not synthesize them in this script |
| `MATERIOS_B3_SIDECHAIN_EPOCH` | Exact sidechain epoch used in the runtime API call |
| `MATERIOS_B3_CARDANO_EPOCH_NONCE_HEX` | Exact Cardano epoch nonce bytes |
| `MATERIOS_B3_GENESIS_UTXO_HEX` | Exact encoded genesis UTxO bytes |
| `MATERIOS_B3_SELECTION_PATH_KIND` | `normal` or `pinned` |
| `MATERIOS_B3_SELECTION_PATH_EVIDENCE_HASH` | 32-byte digest identifying the selection-path evidence |
| `MATERIOS_B3_SELECTION_PATH_UNTIL_EPOCH` | Required only when selection path is `pinned` |
| `MATERIOS_B3_AUTHORITY_COMMITMENT` | 32-byte authority commitment for the packet |
| `MATERIOS_B3_BLOCK_HASH` | Optional exact transition block hash; recommended when the latest finalized block is not the block containing the committee `set` inherent |

The workflow passes public evidence values as repository variables, not as newly invented defaults. Missing or malformed inputs fail closed. The selected block must contain exactly one decodable `SessionCommitteeManagement::set` inherent. The script does not reconstruct selector inputs or choose the selection regime.

## Output artifacts

The script writes `poc/materios-checkpoint/out/b3c/`:

- `MateriosB3CExecutionProofPacket.json`: exact v2 packet, with big integers serialized as decimal strings;
- `MateriosB3CExecutionProofAttestation.json`: packet ID, hashes of the packet and execution artifacts, Rust verifier output, exact block/state/runtime/call/result bindings, and explicit unresolved outer predicates;
- `state-root.hex`, `proof-scale.hex`, `runtime.wasm`, `expected-runtime-code-hash.hex`, `runtime-method.txt`, `call-data.hex`, and `expected-result.hex`: the byte-exact inputs supplied to the Rust verifier.

The attestation status is `EXECUTION_PROOF_VERIFIED_ONLY`. Its execution result is PASS only after the Rust binary exits successfully and its reproduced result exactly matches the TypeScript packet result.

## Claims deliberately left OPEN

This pipeline does **not** promote an RPC response into authenticated canonical state. The following remain open and must be discharged by the independent outer B3 verifiers:

- cryptographic authentication of the target header and `stateRoot`;
- GRANDPA finality proof and authority-set transition;
- proof that the supplied WASM is the canonical deployed runtime at the target block, including trusted source/build correspondence;
- semantic correctness and enactment of the resulting authority transition;
- full B3 checkpoint composition.

In particular, a WASM hash computed from the node's `:code` response and checked against the same captured bytes is a byte-identity check, not a proof of canonical runtime deployment. A matching block hash at height and an RPC finalized-head height are also RPC observations, not independent GRANDPA verification.

The workflow's ordinary CI path still runs Rust formatting/tests and TypeScript conformance tests. The live execution-proof job is separately opt-in so missing upstream RPC capability or unconfigured authoritative context cannot be confused with a successful synthetic test or make unrelated CI silently claim B3-C completion.


## Classification against the actual B3 system boundary

This pipeline is a **preparatory native execution-witness stage**, not a completed B3-C proof.

The system map defines B3-C as:

`B3-A + B3-B → succinct/ZK proof → Cardano verification`.

The pipeline in this document stops after an off-chain native Substrate proof is checked by the Rust verifier. It does not:
- generate a succinct/SNARK/ZK proof from the verified execution witness;
- define or prove the complete public-input relation combining authenticated GRANDPA finality, StateRoot, storage/application value and Beacon context;
- produce a proof artifact that the Cardano Plutus verifier accepts;
- implement or benchmark the Cardano-side proof verifier or its actual transaction/script budget.

Therefore the correct classification is `B3-C_PREPARATORY_NATIVE_EXECUTION_WITNESS`. A successful run of `verify_execution_proof` is useful evidence for the later prover, but it must not be reported as B3-C closure, succinct-proof generation, or Cardano verification. The proof-system research note remains non-normative; no proof system is selected here.

## Upstream capability decision — 2026-10-30

The proposed producer RPC is not deployed in the upstream Materios node.

- Upstream repository: `Flux-Point-Studios/materios`, `main` at `7d5c36e7dcd60824d84353e93df5d4a03c9c6c30` (latest observed commit, 2026-10-21).
- `partnerchain/node/src/rpc.rs` registers only `System`, `OrinqReceipts`, and `MotraRpc`; there is no `materios_b3_calculateCommitteeProof` handler or executor-proof dependency wiring.
- Upstream issue [#50](https://github.com/Flux-Point-Studios/materios/issues/50), which proposed this narrow RPC, is **CLOSED / NOT_PLANNED** since 2026-09-26. The current source still contains no implementation, and no matching upstream branch/PR/commit was found in the audit.

Consequently, configuring IMMORTAL repository variables cannot make the live job succeed against the current public node. The collector will reach a JSON-RPC method-not-found response once it calls the proposed method. Do not dispatch the live job as an availability test and do not substitute `state_call` plus `state_getReadProof`; that would not be the native execution witness specified by this contract.

A future live attempt requires a separately authorized upstream implementation/deployment or a different explicitly reviewed node endpoint that exposes the same native SDK `ProofProvider::execution_proof` semantics. The upstream issue is not reopened and no external repository was modified in this pass.
