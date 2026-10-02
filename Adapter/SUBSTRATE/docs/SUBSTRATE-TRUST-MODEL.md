# Substrate / Materios Adapter — Trust Model

**Role:** trust-boundary specification for a future Substrate / Materios Adapter under IMMORTAL.

**Semantic status:** DRAFT / OPEN DECISION. Nothing in this document is canonical. It does not authorize implementation.

## 1. Boundary

The Adapter is a translation, observation and realization layer, not a second economic authority.

Universal IMMORTAL semantics remain upstream: canonical economic state, obligations/liabilities, exposure, executable liquidity, ProtectedCapital / RawSurplus, Economic Gate, Viability Gate, safe action, atomic transition and history.

Substrate/Materios-specific consensus, runtime execution, authority selection, storage proofs and finality remain adapter/external-evidence concerns.

## 2. Native execution model

A Substrate runtime can express strong state-transition predicates through pallets and runtime logic, but expressivity is not itself proof of IMMORTAL economic conformance.

A future adapter must separately establish canonical state translation, predecessor/anchor integrity, candidate-action construction, economic admission, runtime execution, finality, and observation/evidence.

A valid Substrate extrinsic is not, by itself, an IMMORTAL economic acceptance certificate.

## 3. Materios / GRANDPA finality

The current Materios PoC treats GRANDPA verification as an explicit trust boundary.

A production-capable boundary must establish, independently and fail-closed: exact target header, GRANDPA justification, authority-set identity, authority-set transition provenance, ancestry linkage, quorum/finality conditions, and rejection of stale, conflicting or malformed evidence.

The authoritative Materios authority-selection procedure must not be replaced by a TypeScript approximation.

## 4. Authority selection

Required provenance remains the upstream Materios procedure, including genesis UTxO; AuthoritySelectionInputs; sidechain epoch; candidate filtering; D-parameter/stake weighting; ordering; seed epoch_nonce + sidechain_epoch; weighted selection; deduplication; safety floor; and resulting committee.

This document does not redefine that procedure.

## 5. Runtime execution proofs

Where a production B3 path requires proving a Materios runtime transition, the proof boundary must bind the exact finalized block, exact runtime method, exact call data, runtime/version identity, execution result, execution-proof system and canonical checkpoint.

Execution-proof transport is infrastructure, not B3 certification.

The IMMORTAL-side consumer must verify an externally supplied execution-proof result before it can cross into a verified authority transition. IMMORTAL does not reimplement Materios runtime execution.

## 6. Storage authentication

For the currently inspected OrinqReceipts::Anchors storage:

StorageMap<_, Blake2_128Concat, H256, AnchorRecord<...>, OptionQuery>

the raw key construction is:

Twox128("OrinqReceipts") || Twox128("Anchors") || Blake2_128(anchorId) || anchorId

This proves only how to address a known key. It does not establish the canonical derivation of anchorId for a Beacon checkpoint.

A production evidence path must independently verify StateRoot → exact storage key → exact AnchorRecord and separately establish canonical checkpoint → canonical anchorId → AnchorRecord.root_hash.

No guessed key derivation is permitted.

## 7. Randomness / B3

Substrate finality and runtime execution must not be conflated with publisher-independent randomness.

A native Substrate/Materios mechanism is not promoted to B3 merely because it has GRANDPA finality, a runtime, a committee or a storage root.

Any B3 claim requires its own publisher-independent canonicality proof, deterministic verification, adversarial evidence and explicit application boundary.

## 8. Runtime upgrades and governance

Runtime upgrade authority is a separate trust surface.

A future adapter must account for runtime/version binding, upgrade activation, proof compatibility across upgrades, governance authority, stale-version rejection, and fail-closed behavior where required verification semantics are unavailable.

No runtime upgrade may silently change the economic interpretation of an already-committed IMMORTAL action.

## 9. Required conformance corpus

Before implementation promotion, compare against the Reference Adapter transition-by-transition, including solvent, exact boundary, insolvent, negative state, stale/unverified external input, incomplete obligations, insufficient liquidity, unsafe post-state, uncertified viability/Ω, replay, conflicting predecessor, duplicate, expiry/terminal, unsupported version, reorg/conflicting finality evidence, and malformed proof.

A successful runtime execution is not sufficient if the canonical economic projection diverges.

## 10. Current status

**DRAFT / OPEN DECISION**

No Substrate/Materios implementation is authorized by this document.

Open gates: executable conformance against Reference; real GRANDPA/finality fixture; authoritative authority-selection evidence; real runtime execution-proof fixture; independent storage-proof verification; canonical checkpoint-to-anchor binding; adversarial replay/reorg/conflict evidence; and any publisher-independent B3 proof.

## 11. Non-contamination

This document does not modify IMMORTAL economic semantics, PRE-RICH policy, Materios consensus, authority selection or Beacon policy.

It records a trust boundary so those concerns can be tested without silently becoming universal IMMORTAL rules.
