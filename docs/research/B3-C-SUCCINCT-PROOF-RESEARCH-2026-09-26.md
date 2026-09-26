# B3-C — Succinct Proof Research Note — 2026-09-26

## Classification

**Research / non-normative.** This note does not select a proof system, does not alter B3, and does not promote any external primitive to IMMORTAL authority.

## Question

Can the current B3 target be reduced to a proof that Cardano can verify without trusting the Materios adapter or a publisher?

The target relation remains:

`VerifyRootProof(checkpointRef, root, context, proof) = true => Canonical(checkpointRef, root, context)`

The proof must bind at minimum:

- Materios checkpoint identity and protocol/runtime version;
- finality evidence or an independently authenticated finality statement;
- finalized `stateRoot`;
- the exact storage key / anchor identity;
- the claimed storage value/root;
- the context consumed by Beacon derivation;
- protocol/version domain separation.

## External evidence

### Plutus V3 cryptographic capability

Current Cardano documentation describes Plutus V3 BLS12-381 primitives as part of the platform and explicitly notes their use for efficient zero-knowledge-proof verification. The upstream Plutus cost-model sources also expose dedicated BLS12-381 operations including G1/G2 arithmetic, pairing-related operations and `finalVerify`.

This proves **verifier primitives exist** in the target execution environment. It does not prove that the complete Materios proof is affordable or fits the repository's transaction/script constraints.

### Mithril as adjacent proof technology

Mithril documents non-recursive SNARK aggregation that compresses verification of a set of signatures/lottery claims into a small proof, and documents recursive SNARK aggregation for collapsing a certificate chain. Mithril's current documentation also describes certified Cardano data/messages and Merkle membership proofs.

This is directly relevant as an engineering reference for succinct verification architecture, but it is **not yet the B3 proof target**:

- Mithril's documented circuits prove Mithril-specific certificate relations;
- a Materios B3 circuit must prove the relation between a finalized Materios state root and a specific authenticated storage value/context;
- therefore reusing Mithril would require an explicit statement that the required Materios relation is inside the imported proof language/circuit and remains bound to the exact checkpoint.

### Halo2 as a proof-system candidate

The Halo2 repository documents a PLONKish arithmetization with custom gates and lookup arguments. Mithril's 2026 engineering update explicitly says its upcoming SNARK-based certificate verification is optimized for Halo2 and changed network parameters to reduce Halo2 constraint overhead.

This makes Halo2 a credible **research candidate**, not a selected IMMORTAL dependency.

## B3-C candidate proof paths

### A — Native L1 verifier

Encode enough finality/storage proof structure directly in Plutus.

**Pros:** direct Cardano enforcement.

**Main unknown:** complete Materios GRANDPA + storage verification cost and script/transaction budget.

**Status:** open feasibility experiment.

### B — Succinct proof adapter

An untrusted off-chain prover generates a succinct proof of:

`Materios finality + finalized stateRoot + storage inclusion + anchor binding`

Cardano verifies only the succinct proof and the public inputs.

**Pros:** keeps the adapter untrusted and moves expensive reconstruction off-chain.

**Main unknown:** concrete circuit, verifier footprint and proof/public-input encoding.

**Status:** primary architecture under investigation, not yet selected as normative design.

### C — Mithril-derived proof infrastructure

Reuse or adapt Mithril-style aggregation/certificate machinery.

**Pros:** mature adjacent architecture for stake-backed succinct verification.

**Main unknown:** whether and how a Mithril proof can attest the exact Materios state relation required by B3 without introducing a different trust authority.

**Status:** research only.

### D — Cardano bridge/state UTxO

Represent the already-proven external fact in a dedicated L1 UTxO whose validator enforces update/authentication rules.

**Pros:** smaller application-facing verifier.

**Main unknown:** the external-proof mechanism that establishes the UTxO's canonical external meaning.

**Status:** architectural alternative; not B3 by existence of the UTxO alone.

## Minimum experiment sequence

1. Complete Materios POC-0 from a real node.
2. Complete independent finality verification.
3. Complete storage proof against the finalized `stateRoot`.
4. Compose the full RootProof relation and execute conflicting-root/replay/stale-checkpoint adversarial cases.
5. Only then benchmark a succinct circuit.
6. Measure:
   - verifier script size;
   - CPU/memory budget;
   - proof size;
   - public input size;
   - proof generation cost;
   - exact transaction encoding overhead.
7. Decide the proof system only after these measurements.

## Current conclusion

B3-C is **not blocked by lack of cryptographic primitives**. The open problem is the complete proof relation and its execution economics.

The repository therefore must not claim:

- “B3 = Mithril”;
- “B3 = Halo2”;
- “BLS support proves the Materios state”;
- “a Cardano UTxO is canonical because it contains the root”.

The correct current statement remains:

**B1 authorized-publisher Beacon is implemented; B3 canonical publisher-independent Beacon remains unproven.**

## Sources

- Cardano Docs — Chang / Plutus V3 BLS12-381 capabilities:
  https://docs.cardano.org/about-cardano/evolution/upgrades/chang
- IntersectMBO Plutus — BLS12-381 cost model sources:
  https://github.com/IntersectMBO/plutus/blob/master/plutus-core/cost-model/data/models.R
- Mithril — non-recursive SNARK:
  https://mithril.network/doc/next/mithril/advanced/mithril-protocol/aggregation/non-recursive-snark/
- Mithril — recursive SNARK:
  https://mithril.network/doc/next/mithril/advanced/mithril-protocol/aggregation/recursive-snark/
- Mithril — Cardano node database certification:
  https://mithril.network/doc/mithril/advanced/mithril-certification/cardano-node-database/
- Mithril — aggregation flavors:
  https://mithril.network/doc/next/mithril/advanced/mithril-protocol/aggregation/
- Halo2:
  https://github.com/zcash/halo2
