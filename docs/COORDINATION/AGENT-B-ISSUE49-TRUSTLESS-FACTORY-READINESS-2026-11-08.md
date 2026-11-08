# Agent B — Issue #49 trustless Factory readiness and governance/target dependency audit

**Date:** 2026-11-08  
**Branch:** `work/immortal-green-closure`  
**Exact reviewed HEAD:** `0cc3e4f077e5f6544dfeff2894f42b805121f49c`  
**Classification:** DESIGN / READINESS AUDIT — NON-NORMATIVE; NO IMPLEMENTATION AUTHORITY  
**Scope:** Issue #49, Registry identity issuance, permissionless OpenRound, governance/configuration trust root, and exact BeaconTarget derivation.

## 1. Executive disposition

The authenticated per-round Registry design has a viable **identity-and-uniqueness mechanism candidate**: one Factory state-thread token (STT) per PRE-RICH game/deployment namespace, with one deterministic round identity token minted when the Factory advances. Separate Registry UTxOs remain live per round. Any eligible subject can submit the valid transition; the Factory state serializes competing submissions.

That mechanism is not, by itself, a trustless round-opening authority. It proves that one Factory instance opened one Registry for a given sequence position and that consumers can distinguish its authentic identity token from fake Registry-shaped outputs. It does **not** prove that the selected target was the canonical target, nor that the application configuration authorizing it was genuinely adopted.

The protocol-owner clarifications in Issue #49 make the missing dependencies explicit and non-negotiable:

1. No per-round signature or runtime allowlist from a RoundDefinitionAuthority, B1 publisher, relayer, keeper, maintainer, administrator, or off-chain service.
2. OpenRound must be a deterministic on-chain transition from authenticated, adopted application configuration and authenticated target inputs. Anyone may submit/retry it.
3. The existing governance Haskell replay is not a Cardano-verifiable governance state. PRE voting snapshot authenticity and denominator completeness are still unproven.
4. The rule mapping an application round to the full `BeaconTarget`, especially `mainchainRef`, has not been defined as a deterministic, authenticated on-chain predicate.
5. B1 publisher authorization remains a separate external-data trust assumption. It must not become round-opening authority or be described as publisher-independent truth.

**Conclusion:** retain the Factory STT as the preferred candidate for per-round identity uniqueness, but mark Issue #49 **NOT IMPLEMENTATION-READY / NOT DEPLOYABLE AS TRUSTLESS** until the governance-to-Cardano state and deterministic target-derivation dependencies are designed and independently reviewed. Do not replace those dependencies with a signer, committee, server, or manually approved permit.

This audit does not change the first-Issue gates in Issue #37, Issue #43 release-blocking status, 500×, V3 carrier semantics, Reveal semantics, or any deployed state.

## 2. Exact source baseline and verified facts

The active branch resolves to `0cc3e4f077e5f6544dfeff2894f42b805121f49c`. The source blobs inspected at that HEAD include:

| Path | Blob SHA | Relevant current behavior |
|---|---|---|
| `plutus/BeaconRegistry.hs` | `184f4178139dde01845853dcc0ab51371949ec9b` | Pending → Ready only; nominated datum relayer signs; no Registry identity token check; no full Value equality check |
| `plutus/MintPolicy.hs` | `0d59fc05b4c11873984fffd10014bd46d8470509` | `readRegistry` scans reference inputs by payment ScriptHash and returns the first matching datum |
| `plutus/PrizeValidator.hs` | `0e76d5c3bfd636b2cf212b3513ca84d48c6e3a41` | `readRegistry` has the same first-match pattern |
| `plutus/Types.hs` | `60caeb747018b512e8e6ae7d8a100bb7023863d9` | Seven-field `BeaconRegistryDatum`; no Factory/round identity field |
| `src/createRound.ts` | `4112d87b7b6d88d77da0bbaee5ed2e172527609e` | Caller supplies `BeaconTarget` and `relayerPkh`; builder uses ordinary `payToContract`; no on-chain authenticated initialization |
| `src/registryFlow.ts` | `c402d52ed1e60bb63d0f47d80de6cf0d48c71691` | `GameRoundCommitment` consistency is checked off-chain; comments explicitly state the seven-field on-chain datum does not authenticate it |
| `src/beacon.ts` | `4ad58dedb68bb3db1b52900b113126105dcd8766` | Full `BeaconTarget` tuple is networkId, round, mainchainRef, version |
| `IMMORTAL/governance/Governance.hs` | `982b8fc6e1cc7a703ddb3a9f01487d5cecba317d` | Snapshot is a Haskell list of EntityId/Weight pairs; `snapshotValid` checks timestamp, positive weights and unique EntityIds, not ledger balance provenance or completeness |
| `IMMORTAL/governance/GovernanceAuthorization.hs` | `8a2716ed368e7403fbac82c7121369bc95ae53d1` | `authorizationValid` is an event-type/actor-class mapping; `evidenceValid` checks non-empty evidence-reference strings |
| `IMMORTAL/governance/GovernanceEventSchema.hs` | `3f933e727b4316e44bc2f456470410b3a8c635bc` | Canonical event model is chain-neutral data; no Cardano credential witness or ledger transaction context in the event itself |
| `plutus/export/Export.hs` | `b33cd08b2d9dc6800215e771f18d561c87bc34c7` | Exports BeaconRegistry, B1, MintPolicy, PrizeValidator, Genesis and V3 scripts; no governance validator or governance-state carrier |

Additional source observations:

- `src/createRound.ts` expressly documents that anyone can currently create competing Pending outputs with different relayer hashes.
- `src/registryFlow.ts` computes and checks `GameRoundCommitment` client-side; this does not make the commitment ledger-authenticated.
- The off-chain `src/mint.ts` selector rejects multiple matching Pending entries, but that is client behavior, not a ledger trust boundary.
- The existing Genesis one-shot carrier mint policy is a useful structural precedent for consuming a concrete seed reference once. It does not prove the correctness of arbitrary initial configuration data unless the genesis commitment is itself fixed and checked.

The current code therefore matches the security gap in Issue #43: a payment-ScriptHash match or a Ready-shaped datum is not an authenticated per-round Registry identity.

## 3. Threat model and invariants

The design must reject:

- Fake Pending or Ready datums at the Registry script address.
- A valid-looking datum with no authentic round identity asset.
- A round token minted under a different Factory namespace.
- Duplicate, missing, substituted, burned, or wrong-quantity identity assets.
- Multiple matching Registry reference inputs, regardless of list order.
- A Registry datum whose numeric round and embedded target round differ.
- A target whose network, round, mainchain reference, or version differs from the canonical target.
- An OpenRound transaction that changes the target, config, publisher, or progression rule.
- A second issuance of the same round identity, including after retries, competing keepers, or transaction replay.
- A Pending creator selecting its own publisher key.
- RegistryPublish that substitutes the publisher, removes/replaces the identity token, reduces/inflates/substitutes the Registry Value, or creates multiple continuations.
- Any transition requiring a privileged per-round signature or an allowlisted submitter.

Permissionless execution means any eligible participant/runtime may construct, submit, and retry a valid transaction. It does not mean that a caller may choose unverified target data. A Factory must validate the protocol predicate and authenticated inputs itself.

## 4. Alternatives

### A. Independent per-round permit UTxOs

**Rejected as a root uniqueness mechanism.**

A deterministic asset name and a publisher signature do not stop a stateless minting policy from authorizing that same target/name in separate transactions. Giving each permit a separate one-shot seed creates separate policy IDs, so two permits for the same logical round can appear under different namespaces unless there is already an authenticated canonical registry/allowlist. If permits are issued by one shared singleton authority, that authority is functionally a Factory and the extra permit stage adds cost without removing the root serialization mechanism.

A permit may be used as a bearer representation of a Factory-approved transition, but it must not replace the Factory's authenticated unique state.

### B. One Factory STT per game/deployment namespace

**Preferred candidate for uniqueness and replay prevention; not sufficient for trustless target authorization.**

The Factory is one authenticated state UTxO whose thread token is unique. Each successful OpenRound transition consumes that state, advances the sequence, mints one per-round identity token, and creates one Pending Registry output. Previously created Registry UTxOs remain separate and may coexist.

The Factory predecessor serializes competing OpenRound transactions: only one transaction can consume that predecessor. A stale competitor must re-read the new Factory state and rebuild. No submitter key or keeper allowlist is required.

The candidate invariants are:

- Exactly one Factory state token exists in exactly one continuing Factory UTxO.
- The Factory token is never duplicated or burned.
- Only the Factory transition can mint a round identity.
- One round identity token has quantity exactly one and is carried by exactly one Registry UTxO.
- The Factory records the last successfully opened round (or equivalent monotonic state); the mint policy rejects a second issuance for the same sequence position.
- The OpenRound transaction creates exactly one Registry output at the configured Registry address, with the exact Pending datum and exact round token.
- RegistryPublish preserves the identity asset and the complete Registry Value unchanged, preserves the full target and publisher identity, and creates exactly one continuing Registry output.
- All trusted consumers require the exact Factory policy ID, the expected round token name, quantity exactly one, the configured Registry address, and exactly one matching reference input.

A domain-separated token name may be derived from the numeric round; the Factory policy ID supplies the game/deployment namespace. This matches the current off-chain selection model, which is primarily round-number based. The full `BeaconTarget` must still be compared field-for-field. A numeric round token is not a substitute for target authentication.

## 5. Candidate script-hash topology — avoid a Factory/Registry cycle

A direct design in which the Factory is parameterized by the Registry hash while the Registry is also parameterized by the Factory policy ID creates a circular script-hash dependency. Do not build that topology.

A candidate acyclic dependency order is:

1. Compile the BeaconRegistry validator as an independent script whose hash does not depend on the Factory policy ID. Call this hash `H_R`.
2. Compile the Factory STT multi-purpose script parameterized by `H_R` and the immutable deployment/bootstrap parameters. Its own script hash is also the Factory token currency symbol `H_F`.
3. Derive the round token name from a fixed domain separator and the numeric round. The asset is `(H_F, roundTokenName(round))`.
4. Parameterize MintPolicy and PrizeValidator with the exact Registry credential/address `H_R` and the expected Factory policy ID `H_F`. Apply the same expected identity rule to Aiken V3 SyncBeacon.
5. Keep RegistryDatum at its existing seven-field ABI for the first design candidate. The Factory sets `brRelayerPkh` from the authenticated application configuration when it creates Pending. RegistryPublish preserves that field and the identity asset. The Registry validator can inspect the identity token in its own input and preserve it without taking `H_F` as a parameter; the authoritative `H_F` check remains in the configured ticket consumers.

This is a dependency proposal, not a proven compiler/script construction. The exact STT purpose handling, token parsing, value constraints, script hashes, CEK cost, and transaction-size impact must be established with a small isolated prototype and exact pinned toolchain before implementation. Do not assume that conceptual hash acyclicity proves the actual Plutus artifact graph is valid.

## 6. Trustless OpenRound architecture

The Factory must not accept a target merely because it is supplied by a caller, a B1 publisher, a relayer, a keeper, an API, or an off-chain Haskell replay.

The intended architecture is:

```text
immutable genesis anchor
        |
        v
ledger-verifiable adopted application configuration
        |
        +---- authenticated target inputs / deterministic target resolver
        |
        v
Factory state + deterministic next-round predicate
        |
        v
any eligible submitter may relay OpenRound
        |
        v
Factory validates on-chain and atomically:
  - advances Factory state
  - mints one round identity
  - creates exactly one Pending Registry
```

### 6.1 Immutable genesis anchor

A one-shot seed reference may establish the initial Factory STT. It is a finite bootstrap anchor, not an ongoing administrator capability.

The deployment manifest must fix and independently reproduce the initial commitment: Factory instance/game namespace, initial ruleset/config commitment, Registry credential, B1-only trust profile, publisher identity, progression rule, target-derivation contract, script hashes, seed reference, and the expected initial Factory state. The bootstrap path must constrain the exact initial Factory output and token placement; consuming a seed once is not enough if the first submitter can choose arbitrary initial configuration.

After bootstrap, the seed grants no pause, target selection, arbitrary mint, publisher override, upgrade, or recovery power. Any later config change must pass the canonical governance transition.

### 6.2 Governance-to-ledger prerequisite

The existing Haskell governance model is not yet a Cardano-verifiable authority:

- `EntityId` is an integer and a `Snapshot` contains supplied `(EntityId, Weight)` pairs.
- `snapshotValid` checks structural properties but does not prove that weights equal PRE balances at the voting-start snapshot or that the denominator includes every eligible entity.
- `GovernanceAuthorization.authorizationValid` maps actor classes to event types; it does not authenticate a real Cardano credential or transaction signature.
- `evidenceValid` checks that evidence-reference strings are non-empty; it does not verify the referenced evidence on-chain.
- Canonical replay is deterministic over supplied events, but determinism is not proof of event provenance.
- The Plutus package includes Governance Haskell modules and tests, but the exported script set contains no governance validator/state carrier.

A trustless Factory therefore requires, before it can consume an adopted configuration:

1. A Cardano-verifiable governance/genesis anchor for the constitution and initial ruleset.
2. Credential-bound proposal, vote, delegation, review, adoption, conformance, and canonicalization records.
3. A voting-start PRE snapshot proof that establishes both authenticity and denominator completeness, without silently changing the normative non-custodial linear-PRE voting representation.
4. An on-chain verifier for the frozen GOV-16/17/18 quorum, approval, delegation, timing, challenge/finality, adoption, conformance, and canonicalization lifecycle.
5. An authenticated application-config state that advances only from a verified canonical governance transition and exposes the currently adopted application namespace, ruleset/config hash, progression/skip policy, target-derivation contract, and B1 trust profile.

No off-chain indexer, signed JSON, bare Merkle root, Haskell replay result, evidence URL, or single publisher/committee signature may substitute for snapshot completeness or governance verification. A lock/escrow voting representation would materially alter the current non-custodial voting contract and is not selected here.

### 6.3 Deterministic BeaconTarget derivation prerequisite

`BeaconTarget` is the complete tuple:

`(networkId, round, mainchainRef, version)`.

The application configuration and authenticated inputs must determine this tuple before Registry creation. In particular, the rule that determines `mainchainRef` must be specified and independently verifiable. Do not invent a block schedule, selector, round-to-mainchain mapping, time threshold, or external proof source in this task.

The B1 publisher may publish its authorized observation for an already-determined target. It must not choose or rewrite the target. If the required target input is unavailable or its proof does not validate, OpenRound fails closed.

B1 remains an authorized-publisher external-data profile; Factory identity does not prove Materios finality or publisher-independent external truth. B3/B4 proof paths remain separate and are not a fallback silently added to this B1 Factory.

## 7. Publisher binding

The B1 publisher is a property of the adopted Factory/application configuration, not a property selected by the creator of Pending.

At OpenRound, Factory must copy the currently authenticated B1 publisher identity into the seven-field Registry datum. Because the Registry identity token can only be minted by Factory, and RegistryPublish must preserve both the token and `brRelayerPkh`, the Pending creator cannot substitute a publisher.

RegistryPublish remains a separate B1-authorized publication action. It requires the publisher signature and validates the Beacon derivation from the supplied `mcHash` and Materios context, while preserving the target, round, publisher and full Value. This is intentionally not a claim that B1 observations are trustless.

A publisher/configuration change, if allowed, must be a versioned canonical governance/configuration transition. It must affect only rounds opened under the new configuration and must not rewrite the publisher already fixed in existing Registry datums.

## 8. Canonical Registry read contract

Every ledger consumer must implement the same fail-closed rule:

1. Match the exact configured Registry payment credential/address (including the required staking-credential form).
2. Match the exact Factory currency symbol `H_F` and domain-separated token name for the target round.
3. Require the identity asset quantity to be exactly one.
4. Require exactly one matching reference input. Reject zero, multiple, substituted, or lookalike matches; never use first-match order.
5. Decode inline datum or datum-hash witness fail-closed. Reject missing, malformed, or undecodable datums.
6. Require `brRound == btRound(brTarget)`.
7. Compare networkId, numeric round, mainchainRef, and version exactly against the ticket target.
8. Require the lifecycle state expected by the consuming action (Pending for Issue; Ready for SyncBeacon).
9. Reject any Registry output/reference that lacks the authenticated identity, regardless of how plausible its datum appears.

Apply the same asset/address/target/uniqueness semantics to:

- `plutus/MintPolicy.hs::readRegistry`;
- `plutus/PrizeValidator.hs::readRegistry`;
- `poc/aiken-reveal-parity/lib/immortal/sync_beacon_transaction.ak::read_registry`;
- off-chain `src/mint.ts`, `src/gameFlow.ts`, `src/registryFlow.ts`, and `relayer/beaconRegistrySelection.js` selectors (as convenience checks, never as the trust boundary).

## 9. RegistryPublish transition contract

For an authenticated Registry input:

- exactly one Registry script input at the exact Registry address;
- exactly one continuing Registry output at the same exact address;
- the authenticated per-round identity asset quantity is one in both input and output;
- no mint or burn of the identity asset during publication;
- complete Registry Value is identical before and after;
- target is unchanged field-for-field;
- `brRound == btRound(brTarget)` in both states;
- Pending → Ready only;
- Beacon value equals the canonical derivation from target, mcHash and Materios context;
- mcHash/context remain non-empty and unchanged where required by the current contract;
- publisher identity is unchanged and the configured B1 publisher is the signer;
- no additional continuation or Registry-script input is accepted.

The exact datum/redeemer ABI should remain unchanged for this first candidate. The identity is carried in Value. If the implementation cannot prove the publisher's initial binding from the Factory-created identity token while retaining the seven-field datum, stop and submit a separate ABI decision instead of silently adding fields.

## 10. Progression, concurrency and retries

Use one Factory namespace per PRE-RICH game/deployment for this ABI generation. This avoids ambiguity where different games share the same numeric round while existing consumers group primarily by round.

A strict monotonic sequence is required. The proposed baseline is to open only the next round number represented by the authenticated Factory/config state. A skip, if the protocol permits one, must be a deterministic rule-driven transition visible in canonical state; no operator may manually skip, reopen, freeze, or reorder. The exact progression and skip predicates remain application-policy decisions and must be fixed in the adopted configuration before code.

Concurrency behavior:

- Two keepers racing on the same Factory predecessor cannot both advance it.
- The winner creates the one identity/Registry pair.
- The losing/stale transaction fails because its Factory input is spent.
- Any eligible participant may re-read and retry from the new Factory state.
- Already opened Registry UTxOs remain independent, so publishing one round does not consume another round's Registry state.
- Round identities remain non-fungible and cannot be reissued after resolution; no burn/reissue path is allowed.

## 11. Legacy compatibility and migration

Existing seven-field Pending/Ready Registry UTxOs without the new authenticated identity must not be treated as authenticated by the new consumers. They fail closed under the new read contract.

Before activating the new consumer hashes, inventory any live tickets/Registry UTxOs that depend on the legacy path. An already-issued, not-yet-synced ticket may be stranded if its legacy Registry ceases to be accepted. Do not assume that a Registry-only migration is safe for a live ticket. Either retain a separately qualified legacy path until all affected tickets resolve, or design and separately authorize an explicit migration that authenticates the exact old target and cannot create a duplicate round identity. No automatic migration is approved by this audit.

For a fresh deployment namespace with no live legacy tickets, legacy Registry outputs can simply remain unsupported by the new namespace. Do not reuse an old round number in a way that lets a legacy output collide with the new identity.

## 12. Implementation and resource gates

Issue #49's existing implementation-path comment records a mandatory size gate: the reviewed Haskell V2 PrizeValidator was measured at **16,443 bytes**, and a reference-script publication transaction at **16,540 bytes**, against the **16,384-byte** transaction limit. These measurements require a fresh same-source/same-toolchain reproduction before they are treated as current, but they already make adding identity lookup logic to the PrizeValidator an unsafe assumption.

Before any consumer implementation:

1. Rebuild and capture the exact current exported factory/parameterized validator bytes with pinned compiler/toolchain.
2. Link the factory source, parameterization inputs, output CBOR, script hash and deployed artifact by reproducible evidence.
3. Measure a no-semantic-change candidate and transaction envelope before adding the Registry identity predicate.
4. Establish Haskell V2 CEK and transaction-size impact, not only source-code size.
5. Do not use a smaller Aiken V3 path as a shortcut or claim cross-language parity from harness completion.
6. Preserve V3 carrier semantics, Reveal semantics/economics, 500×, KA/KC/KD, EEV/USDM authority and the existing datum/redeemer ABI.

The adversarial conformance matrix must include at least:

- Bootstrap wrong seed, seed replay, wrong initial config, wrong output address, missing/duplicated Factory token, counterfeit Factory, and value/datum substitution.
- OpenRound without a privileged signature; altered/unverified target; wrong network/round/mainchainRef/version; stale config; out-of-order/repeated opening; duplicate mint; unauthorized token name; burn; extra Registry output; wrong Registry address; concurrent predecessor race and permissionless retry.
- Fake Ready without identity; arbitrary fake token; wrong Factory policy ID; token quantity 0/2; missing/duplicated/substituted token; wrong address/staking credential; multiple matching refs in both orders; malformed datum; missing datum witness; wrong lifecycle; complete target mismatch.
- RegistryPublish wrong/non-publisher signature; publisher substitution; duplicate input/continuation; target or round substitution; missing/changed token; reduced/inflated/substituted Value; wrong Beacon derivation.
- Equivalent acceptance/rejection results for MintPolicy, Haskell V2 PrizeValidator and Aiken V3 SyncBeacon, with harness completion separated from property PASS/FAIL and raw outcomes retained.

## 13. Exact implementation prerequisites

Issue #49 may proceed to implementation planning only after these prerequisites are independently closed:

| Gate | Required evidence | Current disposition |
|---|---|---|
| G1 — Governance/genesis trust root | Authenticated initial config; verifiable canonical governance state; PRE voting snapshot authenticity and denominator completeness; credential-bound event lifecycle | **BLOCKED** |
| G2 — Target derivation | Deterministic, authenticated rule for complete BeaconTarget, including mainchainRef; no caller/publisher target selection | **BLOCKED** |
| G3 — Factory identity | STT design, uniqueness/replay proof, exact output constraints, hash-acyclic topology, bootstrap reproducibility | **DESIGN CANDIDATE** |
| G4 — Registry lifecycle | Authenticated initialization, immutable publisher binding, exact Value continuity, canonical read contract | **DESIGN CONTRACT; NOT IMPLEMENTED** |
| G5 — Resource feasibility | Fresh factory-to-artifact provenance, Haskell V2 bytes, CEK cost, transaction size | **BLOCKED / MUST REPRODUCE** |
| G6 — Legacy safety | Inventory live tickets/registries; decide old-path retirement or explicit migration | **BLOCKED** |
| G7 — Owner approval | Reviewed trust root, target rule, progression, bootstrap and exact changed-path authorization | **NOT GRANTED BY THIS DOCUMENT** |

Implementation remains a separate write slot with exact starting HEAD and a bounded changed-path manifest. This document does not authorize code, datum/redeemer changes, workflow edits, CI dispatch, wallet signing, transactions, deployment, or Preprod/Mainnet queries.

## 14. Next Agent B work

The next useful work is not to add a per-round signer or start coding the Factory. It is to close the two missing inputs at design level:

1. **Governance-to-Cardano canonical state:** design how the existing GOV-16/17/18 rules obtain an authentic and complete PRE snapshot and become a ledger-verifiable adopted application-config state without changing the frozen voting representation or delegating authority to a snapshot publisher.
2. **BeaconTarget derivation:** identify the exact canonical source and proof contract that determines networkId, round, mainchainRef and version before B1 publication. Keep B1 observation and B3/B4 canonicality trust domains separate.

Until both are closed, the Factory can be specified as a uniqueness state machine, but no honest trustless OpenRound implementation can be declared ready.

## 15. Explicit non-effects

- No production code, ABI, validator, minting policy, script parameter, workflow, branch topology, test, CI run, wallet action, transaction, deployment, or ledger state was changed or executed.
- No new authority, signer, threshold, schedule, skip rule, proof provider, target formula, or economic parameter was selected.
- No V3 or Reveal semantics were changed.
- Issue #43 remains release-blocking.
- Issue #37 first-ticket admission/EEV/R1/Kc gates remain independent and unresolved by this work.
- B1 remains an authorized-publisher external-data profile, not a fully publisher-independent trust model.
