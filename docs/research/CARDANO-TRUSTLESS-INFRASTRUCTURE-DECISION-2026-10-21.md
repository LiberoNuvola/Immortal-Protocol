# Cardano Trustless Infrastructure Decision Record — 2026-10-21

**Status:** NON-NORMATIVE engineering audit / decision proposal  
**Branch inspected:** `work/b3-materios-provenance-evidence`  
**Scope:** infrastructure and trust boundaries only  
**Normative impact:** none. This document does not modify economic rules, V3, Reveal semantics, datum/redeemer layouts, or the IMMORTAL authority hierarchy.

## 1. Objective

The project target remains:

- 100% trustless with respect to the protocol properties claimed as trustless;
- permissionless invocation of admissible transitions;
- security enforced at the state-transition boundary;
- economic rules and critical authorization enforced on-chain;
- automatic outcomes, with keepers/relayers treated as liveness actors rather than economic authorities.

“100%” is an engineering acceptance target, not a claim of metaphysical/absolute security. Every proof must state its cryptographic, consensus, bootstrap, and availability assumptions. A source label, API response, TypeScript type, digest, boolean, successful unit test, or simulated transaction is not by itself canonical proof.

## 2. Current-source observations

1. `package.json` declares `@lucid-evolution/lucid` and `lucid-cardano`; it does not declare Mesh SDK packages. Do not introduce Mesh merely as a proxy for trustlessness.
2. The Cardano wallet integration uses CIP-30 and Lucid. Wallet signing authority remains with the user's wallet.
3. `audit/cardano-integration/materialize-preprod-p28-context.mjs` obtains transaction/UTxO/protocol context from Koios and requires an Ogmios endpoint exposed through a Demeter URL. This is useful evidence acquisition, but hosted API output is not intrinsically cryptographic proof.
4. `audit/cardano-integration/KoiosOgmiosProvider.mjs` adapts Koios data into provider objects. A provider adapter normalizes returned data; normalization does not authenticate it.
5. `Adapter/CARDANO/observation/HaskellIssueAdmissionProvider.ts` invokes the canonical Haskell decision producer and checks consistency between its output and the observation object. The actual `observationSource` is injected. This module does not, by itself, prove that the source's claims (for example `truthVerified`, freshness, completeness, EEV, and liquidity provenance) are authentic.
6. `poc/materios-grandpa/src/authority-transition.ts` declares an `AuthoritySetTransitionProofVerifier` boundary and explicitly states that the repository does not yet provide a concrete implementation. B3-C research marks canonical checkpoint/finality binding, a real finalized storage proof, and a concrete independent storage verifier as open. A later anchor-key triangulation record closes the raw FRAME storage-key construction sub-boundary; the semantic checkpoint/round-to-anchorId binding remains open.
7. The Cardano native-ledger runner and Reveal reference-script remediation are existing paths. They should be completed with exact transaction/context evidence, not bypassed by changing SDK or semantics.
8. The existing Materios capture tools already attempt to obtain finalized-state/GRANDPA evidence (`poc/materios-checkpoint/src/capture-finalized.ts`) and a historical AnchorRecord plus `state_getReadProof` (`src/capture-anchor.ts`). A new read-only capability probe and workflow now record the advertised RPC surface and attempt both captures through the existing endpoint. This only tests availability/acquisition; its output must not be labelled proof verification. The workflow has been committed but its live result is not yet verified in this session.

This register is based on source inspection plus the live observations below; it does not claim B3 closure.

## 2.1 Live Materios Preprod observation — 2026-10-21

The read-only workflow run [#39556119848](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39556119848) identified 85 advertised RPC methods. On the public `https://materios.fluxpointstudios.com/preprod-rpc` endpoint:
- `state_getReadProof`, `state_getStorage`, `state_call`, `chain_getFinalizedHead`, `chain_getHeader`, and `chain_getBlock` are advertised.
- `grandpa_proveFinality`, `state_getCode`, and `materios_b3_calculateCommitteeProof` are not advertised.
- The attempted old target block returned `UnknownBlock: State already discarded`; the capture now defaults to the endpoint's current finalized-head observation instead of silently requiring archive history.

At block `2379062`, hash `0x78b4375c28342ebb784f80fa0bca1db7439562618712351ba68772ec52424954`, state root `0x58aadb1ee170715f6daa814c0b945bcf01b3a38e72bc34f57037bda50b1a16e1`, the modified `capture:anchor` successfully acquired the configured `OrinqReceipts::Anchors` value and 10 read-proof nodes. The proof's `at` equals the requested block hash. This is **capture evidence only** until the independent trie verifier completes, and the root remains an untrusted RPC observation until B3-A finality is authenticated.

The existing [B3-B live storage-proof job in run #39556187996](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39556187996) independently verified a different receipt-storage key/value against that same state root and reported:
- `B3_B_STORAGE_PROOF_VALID=true`
- `B3_B_STORAGE_KEY_EXISTS=true`
- `B3_B_STORAGE_VALUE_MATCH=true`
- `B3_B_STATE_ROOT_BOUND=true`

This proves the existing route can return a valid Substrate trie-membership proof for the receipt item in that evidence packet. It does **not** verify the separate `Anchors` value, authenticate finality, or close B3.

The same run tried both public Materios RPC URLs (`/rpc` and `/preprod-rpc`): both returned `-32601 Method not found` for `grandpa_proveFinality`, and both had `chain_getBlock.justifications = null` at the observed finalized head. Its bounded scan of 768 blocks did not find a real GRANDPA justification. No archive RPC was configured. The run therefore recorded `NO_REAL_GRANDPA_JUSTIFICATION_FOUND_IN_DENSE_SCAN`; B3-A remains OPEN.

The current run [#39556404546](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39556404546) completed the independent verification of the specific `OrinqReceipts::Anchors` read-proof successfully. The Rust verifier reported `B3_B_STORAGE_PROOF_VERIFICATION=PASS`. The verified relation is deliberately narrow: the captured storage key resolves to the exact captured 136-byte SCALE value under the supplied state root. The proof has 10 nodes, and its `proof.at` equals target block hash `0x884f82d748bdf2ed123f260f23682898c8cfc2b1a1f4e2da2ab2325db5b99c59` (block `2379082`), with state root `0x0ec5d9cb65e45ab9eac6323f49ae6e6507dff44940fd54dc507bb16caccd6ce5`.

The run remains **FAILED / fail-closed** because the endpoint does not expose `grandpa_proveFinality` or `state_getCode`. Consequently, the report explicitly leaves `grandpa_finality_verified=false`, `authority_set_provenance_verified=false`, `deployed_runtime_identity_verified=false`, `anchor_id_to_beacon_round_binding_verified=false`, and `b3_conformance=false`. This is a real verified storage-membership sub-boundary, not an authenticated canonical/finalized Materios state claim.

The resulting artifact is [materios-existing-route-proof-probe-39556404546-1](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39556404546/artifacts/12325098545), SHA-256 `bf50317dca948a7311ad97d5bac4257f6dde4aa4ab84cc9be069a5d71781256b`. It contains the RPC capability inventory, finalized-state capture, anchor witness and the independent storage-proof verification report.

**Decision based on live evidence:** the standard public endpoints are useful for receipt/anchor reads and for producing a real storage-membership proof. The specific `OrinqReceipts::Anchors` key/value proof has now passed the existing independent Substrate trie verifier against the observed state root. B3-A is still OPEN: the same endpoints do not expose `grandpa_proveFinality`, block justifications were null in the bounded scan, and `state_getCode` is not advertised. The workflow now uses `archive_rpc`, when supplied, for the whole capture/probe path, not just historical anchor reads; the latest run did not have an archive endpoint configured. Do not modify Materios or fabricate a fallback.

### Upstream source boundary — why repeating the same public calls is not enough

The upstream Materios `partnerchain/node/src/rpc.rs` inspected from `Flux-Point-Studios/materios` `main` currently merges `System`, `OrinqReceipts`, and `MotraRpc` into `create_full`; it does not merge the standard `sc-consensus-grandpa-rpc` module. `partnerchain/node/Cargo.toml` does declare `sc-consensus-grandpa-rpc`, but a dependency is not a registered endpoint. The existing IMMORTAL handoff for a narrow execution-proof RPC is explicitly defined but **not applied upstream**. Upstream issue [#50](https://github.com/Flux-Point-Studios/materios/issues/50) describing `materios_b3_calculateCommitteeProof` is marked closed, but current upstream `main` still has no such registration and a live method probe says `not-listed`; the issue-close event has no linked commit. Therefore “closed issue” is not treated as shipped implementation evidence. This matches the live result: IMMORTAL-side code cannot manufacture raw finality/execution proof bytes that the chosen service does not return.

Given the explicit constraint not to modify/activate the Materios node, the next acceptable external option is a **pre-existing archive/proof endpoint** that serves the needed bytes. Supplying one to the workflow is an acquisition route, not a trust grant: every finality, runtime and storage proof still has to verify independently. Until such a route produces the missing witness, keep B3-A/B3-C open.

### Separate candidate for randomness — not a Materios proof substitute

The repository's `poc/drand-beacon-verifier` proves a different relation: a pinned drand Quicknet signature/round can be checked, and an earlier local Yaci test accepted the correctly bound signature and rejected a wrong-round signature. Its own README labels it **candidate only**, not a selected normative randomness source and not a Materios finality/storage proof; Preprod/Mainnet evidence remains open. It therefore cannot be promoted silently to B3 or used to authenticate the Materios `AnchorRecord`.

The existing Beacon failover contract describes B3 → B2 → B1 **only for new, not-yet-committed rounds**, when the selected mode's own verifier has produced round-bound evidence. A fresh repository search found `selectBeaconMode` only in `src/beaconTrust.ts` and `src/__tests__/beaconTrust.test.ts`, with no production call site found. Its `validEvidence` check verifies presence/non-empty metadata and matching `roundId`; it does not itself verify signatures or cryptographic proof material. Therefore the helper is not evidence that automatic failover is already integrated or enforced on-chain.

If drand is considered for future-round randomness, it must be explicitly qualified under an approved mode and its threshold/availability assumptions must be declared; this audit does not alter the mode set or activate that fallback. The current drand PoC is not the missing production integration and is not a substitute for Materios finality/storage authentication. Existing rounds remain frozen.

## 3. Infrastructure classification

| Component | Correct role | Trust classification | Decision |
|---|---|---|---|
| `cardano-node` run by us | Validating node / live L1 query and submission boundary | Strongest available L1 read path when fully synced, correctly configured, and queried locally; still relies on Cardano consensus and the configured network/bootstrap | Target for critical production reads if operationally feasible |
| Ogmios connected to our node | Node protocol interface | Transport/interface, not a separate source of truth | Use locally; never treat a hosted Ogmios URL as equivalent to self-hosting |
| Kupo connected to our node | Targeted UTxO index | Derived index/read model; lag and rollback are possible | Useful for discovery; verify exact output references and let the ledger enforce transaction validity |
| Koios / Blockfrost / Maestro / hosted Demeter | Acquisition, convenience reads, diagnostics, submission interfaces | Operator/provider dependency unless result is independently verified | Keep as fallback/triage sources, not sole authority for security-critical claims |
| Lucid Evolution | Transaction construction, wallet/provider integration | Off-chain construction library | Retain; bind declared inputs to the completed transaction body and use the real ledger to establish acceptance |
| Mesh | Alternative SDK / DApp ergonomics | Does not remove provider or data-authenticity trust | No migration without a measured, testable advantage |
| Mithril | Certified Cardano snapshots / supported transaction and data membership proofs | Cryptographic light-client mechanism under its signer, certificate-chain, and bootstrap assumptions | Evaluate for historical inclusion / bootstrap; do not equate inclusion with current unspent UTxO status |
| Yaci DevKit | Local integration/devnet environment | Test witness, not Preprod/Mainnet witness | Keep for reproducible integration tests; label its evidence correctly |
| Native Cardano-ledger evaluation | Evaluation against exact ledger context | Strong execution evidence when exact typed inputs are captured and validated | Complete the existing runner and evidence packet |
| Reference inputs / reference scripts (CIP-31/CIP-33) | Reuse read-only UTxOs and script witnesses | On-chain ledger mechanism | Keep the selected Reveal design; require exact script-hash binding and size measurement |
| Hydra / Leios | Potential scaling paths | Different execution/scaling models, not a remedy for current trust gaps | No current dependency; revisit only against concrete workloads and released network capability |
| Pyth or another price oracle | External asset valuation | External-data trust model | Must not be used to redefine the PRE-RICH direct-USDM EEV profile; only consider where the normative rule genuinely needs an external price |

## 4. Decisions

### D1 — Make a self-validated Cardano node the preferred critical read path

The target trust-reduced configuration is:

`cardano-node (local N2C socket) → Ogmios → optional Kupo index → IMMORTAL adapter`

The node performs Cardano chain validation; Ogmios exposes its interfaces; Kupo provides an index for efficient discovery. Kupo is not itself the authority for an output being current. Exact UTxO references, currentness, datum/value identity, and all relevant transaction preconditions still need to be checked at the appropriate boundary.

This is an architectural target, not an instruction to deploy infrastructure blindly. Before choosing it, measure hardware/storage/uptime cost and identify which existing environment already has equivalent locally controlled access. If a self-hosted node is not available, explicitly retain the hosted-provider trust assumption or supply a cryptographic verification path for the exact claim. Multiple API responses alone do not prove authenticity, particularly when providers share upstream infrastructure.

### D2 — Keep provider transport separate from verification

Provider code may retrieve, decode, normalize, and package observations. It must not promote a response into verified truth merely by assigning a type or boolean.

For every security-relevant datum, evidence must bind at minimum:
- network/chain identity;
- exact transaction hash and output index;
- exact asset policy/name and integer quantity;
- datum/schema/version and its digest;
- observation point/slot and freshness rule where freshness is semantically required;
- derivation/version and source provenance;
- independent verification result or explicit trust assumption.

Provider disagreement, stale state, incomplete data, invalid proofs, ambiguous singleton matches, missing reference scripts, unknown network, and unavailable verification must fail closed. A fallback provider may improve availability only if its output still passes the same verifier.

### D3 — Do not change EEV-USDM semantics to simplify the provider

For `PRE-RICH-EEV-USDM-DIRECT-V1`, VerifiedUSDM remains the quantity of canonical USDM physically present in the exact qualified B1 PrizePool UTxO. No ADA liquidation, PRE liquidation, PRE-to-USDM oracle, Snek price/depth, Charli3 valuation, invented haircut, or assumed slippage is introduced.

The observation producer must derive that value from an authenticated exact output, not trust a caller's `poolUsdmValue` field. Existing EEV qualification/approval evidence remains bound to the precise profile, qualified/excluded properties, version, snapshot, and evidence digests.

### D4 — Preserve the native-ledger and reference-script path

Do not alter V3 or Reveal semantics to accommodate another SDK. The Reveal closure criterion remains an actually built transaction using the deployed reference scripts, under the protocol's observed `maxTxSize`, evaluated against exact typed ledger context, with transaction/context hashes retained in an evidence packet. Reference scripts reduce repeated script bytes; they do not prove validator correctness, affordable ExUnits, or successful ledger acceptance by themselves.

### D5 — Keep Mithril's guarantee narrow

Mithril can help verify supported certified Cardano data without requiring every consumer to operate a full node. Its certificates/proofs must be verified against the appropriate trusted bootstrap material and certificate chain. Transaction inclusion is historical evidence: it does not alone establish that a particular output remains unspent at the current tip. Do not use Mithril to claim Materios finality or external storage authenticity; those require the separate B3 verifier.

### D6 — Keep SDK changes orthogonal to authority

Mesh and Lucid are transaction/DApp tooling. Neither one authenticates a remote provider's economic claims by being installed. Keep Lucid unless a concrete comparison demonstrates a benefit to build correctness, transaction size, provider compatibility, or maintenance. Any SDK experiment must run through the same conformance and ledger-evidence gates.

## 5. Highest-priority unresolved gates

### P0 — B3 external canonical-state verification

Required chain:

`trusted bootstrap → authenticated authority-set transitions → GRANDPA finality/ancestry → finalized header/state root → canonical storage key + storage proof → verified Materios value → Cardano-bound state transition`

Open evidence must not be replaced by:
- a successful RPC request;
- block existence without finality proof;
- GRANDPA signatures checked against an untrusted caller-selected authority set;
- a pluggable verifier interface without a concrete cryptographic verifier;
- a publisher-supplied key/value accepted without storage proof;
- a proof generator's assertion that its own proof is valid.

First produce a real Materios checkpoint and raw storage proof for the exact canonical key, independently verify it off-chain with adversarial vectors, and bind the chain/runtime identity. Then evaluate the actual cost and size of a Cardano verifier. If direct verification is infeasible, compare succinct-proof approaches against this exact relation and explicit assumptions; do not select a proof system before the statement being proved is precise.

### P0 — Authoritative Issue observation / EEV

For Issue, the producer must not be the authority for its own inputs. Separate:
1. observation/acquisition;
2. cryptographic/state verification;
3. canonical datum and exact UTxO decoding;
4. economic derivation in the canonical Haskell path;
5. admission witness construction;
6. transaction-body binding;
7. on-chain revalidation of every property the validator is responsible for enforcing.

Values such as `truthVerified=true`, `eevFresh=true`, `obligationsComplete=true`, `allOmegaSuccessorsCertified=true` are not evidence merely because the producer emits them. They need derivation evidence, and the relevant checks must be performed by a verifier or enforcing ledger script. A digest establishes byte identity relative to a known digest; it does not authenticate who had authority to approve it.

Acceptance requires a real Preprod packet with exact Counter, Control, carrier, and Pool references; direct-USDM derivation from the qualified output; evidence tied to the same snapshot; a canonical Haskell decision; a wallet-signed Issue transaction; and post-state observation. Any missing prerequisite stays fail-closed.

### P1 — Permissionless liveness

A keeper/relayer may observe and submit a valid transaction, but must not be required as an exclusive privileged signer or economic decision-maker. For each lifecycle transition, demonstrate:
- a public, deterministic precondition;
- permissionless construction/submission by any eligible party;
- independent validation by the ledger;
- atomic state/economic effects;
- no administrative side door;
- optional execution incentives only if already authorized by canonical rules;
- a recoverable path when a provider, watcher or single relayer is unavailable.

### P1 — Current-state integrity and reorg awareness

An index result must be tied to a slot/block or exact output reference and reconciled against the current node state before using it for a transaction. Evidence must distinguish confirmation/finality level from mere visibility. Rollbacks, provider lag, spent outputs, duplicate matches and stale snapshots must never silently become a current-state claim.

## 6. Acceptance test matrix

| Test family | Positive case | Negative/adversarial twin |
|---|---|---|
| Provider independence | Same exact output and datum obtained through independently operated sources or verified from our node | Providers disagree, one is stale or returns a different output; admission must not be decided by provider preference |
| UTxO identity | Exact qualified Pool output, expected policy/name/quantity and datum | Wrong output index, wrong policy/name, duplicate singleton, altered quantity, spent/stale output |
| Observation provenance | Evidence hashes, slot, source, derivation and qualified profile bind to one snapshot | Swap any reference or digest; use a caller-provided boolean; replay stale evidence |
| Issue admission | Haskell decision corresponds to exact authenticated pre-state and action | Alter EEV, protected capital, class/control state, action fingerprint or candidate state |
| B3 finality | Correct chain/genesis, authority history, GRANDPA quorum and ancestry verify | Wrong setId, duplicated/unknown signer, mutated ancestry, conflicting checkpoint, bootstrap substitution |
| B3 storage | Real proof authenticates exact canonical key/value against the verified state root | Mutated root/key/value, missing node, proof from another checkpoint, arbitrary publisher-supplied key |
| Ledger evaluation | Exact transaction plus exact UTxO/PParams/EpochInfo/SystemStart produces typed report | Missing/mismatched context, hash mismatch, wrong era, malformed datum, evaluator error |
| Reference scripts | Exact deployed hashes, transaction below observed maxTxSize, ledger evaluation succeeds | Missing/duplicate/wrong script reference, inline fallback, transaction over size limit |
| Permissionless liveness | Unprivileged eligible wallet submits valid transition | Relayer unavailable, admin approval absent, invalid transition or attempted bypass |

## 7. Immediate execution order

1. Finish the currently defined Reveal/reference-script and native-ledger evidence gates without changing semantics.
2. Implement and test the missing concrete verifier boundaries for Materios B3—first exact storage proof and authenticated authority/finality chain, then feasibility of on-chain verification.
3. Close the Issue observation producer: derive and authenticate exact on-chain values and control state; do not merely validate consistency among values supplied by the same producer.
4. Determine the minimum self-hosted Cardano read infrastructure needed for production. Use Ogmios/Kupo to serve access/indexing but retain ledger/proof verification as the security boundary.
5. Add Mithril only for a defined certificate/bootstrap or historical-inclusion use case. Do not make Mesh migration part of the trustless closure.
6. Run independent negative twins and real Preprod executions; report source/commit hashes and evidence class for every closure claim.

## 8. Source references

### IMMORTAL repository
- `package.json`
- `audit/cardano-integration/materialize-preprod-p28-context.mjs`
- `audit/cardano-integration/KoiosOgmiosProvider.mjs`
- `Adapter/CARDANO/observation/HaskellIssueAdmissionProvider.ts`
- `poc/materios-grandpa/src/authority-transition.ts`
- `poc/materios-grandpa/src/materios-evidence-adapter.ts`
- `.github/workflows/materios-existing-route-proof-availability.yml`
- `poc/materios-checkpoint/src/probe-rpc-capabilities.ts`
- `poc/materios-checkpoint/test-rpc-capabilities.ts`
- `poc/materios-checkpoint/src/capture-finalized.ts`
- `poc/materios-checkpoint/src/capture-anchor.ts`
- `docs/research/B3-C-POC2-STORAGE-PROOF-BOUNDARY-2026-09-27.md`
- `docs/research/B3-C-POC2-MATERIOS-ANCHOR-KEY-TRIANGULATION-2026-09-27.md`
- `docs/04-verification/MATERIOS-B3-NODE-RPC-PATCH-HANDOFF.md`
- `docs/04-verification/MATERIOS-B3-GRANDPA-RPC-HANDOFF.md`
- `poc/drand-beacon-verifier/README.md`
- Upstream Materios node RPC assembly: https://github.com/Flux-Point-Studios/materios/blob/main/partnerchain/node/src/rpc.rs
- Upstream Materios node dependencies: https://github.com/Flux-Point-Studios/materios/blob/main/partnerchain/node/Cargo.toml
- `docs/audits/P2.8-REVEAL-REFERENCE-SCRIPT-REMEDIATION-v0.1.md`
- `docs/COORDINATION/IMMORTAL_MASTER_FRONT_MATRIX_v0.1.md`

### Primary external references (checked 2026-10-21)
- Cardano Developer Portal — Connecting to the Chain: https://developers.cardano.org/docs/get-started/infrastructure/overview/
- Cardano Developer Portal — Self-Hosting: https://developers.cardano.org/docs/developers/curriculum/production/self-hosting/
- Cardano Developer Portal — Query the Chain: https://developers.cardano.org/docs/developers/curriculum/start-building/query-the-chain/
- Cardano Developer Portal — Transactions, CIP-31 reference inputs and CIP-33 reference scripts: https://developers.cardano.org/docs/developers/curriculum/fundamentals/core-concepts/transactions/
- Cardano Developer Portal — Mithril: https://developers.cardano.org/docs/operators/operator-tools/mithril/
- Mithril — Cardano transactions certification (check newer certification status when implementing): https://mithril.network/doc/mithril/advanced/mithril-certification/cardano-transactions/

## Final decision

**No Mesh migration and no new trust-bearing service by default.** Prefer a self-validated Cardano node for critical L1 state when feasible; use Ogmios as its interface and Kupo only as an index; keep hosted APIs as acquisition/diagnostic paths; verify the claims that affect admission; finish B3 cryptographic canonicality and native-ledger evidence; and make on-chain enforcement plus permissionless invocation the final authority. This advances the existing architecture instead of substituting convenience for trustlessness.
