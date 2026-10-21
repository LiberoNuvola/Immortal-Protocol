# Cardano Dijkstra / Linear Leios / CIP-118 — IMMORTAL impact assessment

**Assessment date:** 2026-10-21  
**Repository branch:** `work/b3-materios-provenance-evidence`  
**Purpose:** non-normative research; no protocol, fee, validator, transaction, or deployment decision is made here.

## Executive result

Dijkstra is relevant to IMMORTAL for two distinct reasons:

1. **Linear Leios** targets higher Cardano Layer-1 throughput by letting Ranking Blocks announce/certify Endorser Blocks. This is a network-capacity change, not a relaxation of the transaction-size limit or an IMMORTAL fee rule.
2. **Nested Transactions (CIP-118)** introduces ledger-level transaction composition. A top-level transaction can complete sub-transactions that individually lack balance, fee, collateral, or min-UTxO coverage. The design explicitly covers DApp fee sponsorship and transaction batching.

Neither feature is evidence that the mainnet hard fork has activated. The official Dijkstra rollout page lists Q4 2026 as the code-completion target for Phase 1, followed by Preview, Pre-production and mainnet governance/testing. It calls all targets estimates, not guarantees. CIP-118 itself still labels its status **Proposed** and lists implementors as N/A (page last updated 2026-10-13).

**Recommended disposition:** record a forward-compatibility target; do not change the current PRE-RICH Plutus V2 Reveal path, the Haskell Plutus pin, fee semantics, or G1 on the basis of this roadmap.

## 1. Current upstream status (checked 2026-10-21)

### Dijkstra / Linear Leios

The official Intersect Dijkstra plan currently describes:

- Phase 1: new Dijkstra era, protocol version 12, with Linear Leios, Nested Transactions and related ledger/codec extensions; Q4 2026 is the code-completion target.
- Linear Leios uses Ranking Blocks (RBs) and Endorser Blocks (EBs). EBs hold references to transactions; a stake-based committee certificate is required before a later RB applies the endorsed transactions to the ledger.
- The rollout is sequential across Preview, Pre-production and mainnet, with governance ratification at the applicable networks. Mainnet activation date is TBD in that plan.
- The plan describes Linear Leios as a partial realization of the broader Leios research design, not the entire ultimate design.

Sources:
- https://github.com/IntersectMBO/product-website/blob/master/docs/hardfork-planning/dijkstra.md
- https://cips.cardano.org/cip/CIP-0164

### CIP-118 / Nested Transactions

CIP-118 (last updated 2026-10-13) remains marked **Proposed**. The official planning page includes Nested Transactions in Dijkstra Phase 1, but this is a roadmap target, not proof of mainnet activation or production support in a specific SDK.

Primary sources:
- https://cips.cardano.org/cip/CIP-0118
- https://github.com/IntersectMBO/cardano-ledger/issues/5123
- https://github.com/IntersectMBO/cardano-ledger/issues/5604
- https://github.com/IntersectMBO/plutus/issues/7342
- https://github.com/IntersectMBO/cardano-api/issues/1188

The last two references are especially relevant to Plutus V4 and API support. Before depending on CIP-118 in an application, verify support at the exact node, ledger, cardano-api, Lucid/evolution SDK and Plutus versions intended for the target network.

## 2. CIP-118 rules that matter architecturally

The proposal specifies one top-level transaction and zero or more sub-transactions. The entire batch must be balanced, though the individual sub-transactions need not be balanced alone.

Important constraints and capabilities:

- Sub-transactions cannot themselves contain sub-transactions.
- A sub-transaction does not specify its own final fee.
- Only the top-level transaction provides collateral; that collateral must cover scripts executed across the batch.
- A script failure invalidates the batch: none of its transaction effects are applied, and collateral is collected.
- All inputs in the batch must exist in the UTxO set before any batch transaction is applied.
- The total serialized top-level transaction, including sub-transactions, remains subject to `maxTxSize`.
- Scripts are shared across the batch, including reference scripts, which can avoid repeatedly embedding the same script.
- Sub-transaction script contexts are isolated: a script in one sub-transaction does not see the other sub-transactions or the top-level transaction in its ordinary context. The new Guard script purpose (CIP-112) and PlutusV4 context supply batch-observation capabilities.
- A transaction containing sub-transactions or top-level guards cannot execute PlutusV3-or-earlier scripts. Ordinary top-level transactions without sub-transactions remain compatible with earlier Plutus languages.

Consequences for implementation:
1. Batch-wide balancing is a ledger invariant, not an application promise.
2. A sponsor assumes responsibility for aggregate collateral and failure exposure; sponsorship is not a free or riskless payment wrapper.
3. The `maxTxSize` bound remains in force for the complete batch.
4. Batch-aware authorization requires the right Guard/PlutusV4 semantics. Existing V2/V3 validators cannot simply be dropped into a CIP-118 batch that uses the new features.

Source: https://cips.cardano.org/cip/CIP-0118 (abstract, use cases, Plutus and transaction-validity sections).

## 3. Fit with the current IMMORTAL / PRE-RICH baseline

### Existing evidence and toolchain

The branch's `plutus/pre-rich-plutus.cabal` and `cabal.project` pin the Plutus family to **1.67.0.0**. The P2.8 Reveal remediation dossier describes the existing PrizeValidator and B1PrizePool validators as **Plutus V2**.

The repository's recorded historical inline Reveal measurement is 18,365 bytes against a 16,384-byte transaction-size ceiling. The selected remediation is to use reference-script UTxOs, preserve the existing validator/datum/redeemer/economic semantics, and measure a real built transaction; the dossier explicitly prohibits raising `maxTxSize`. Its final real-ledger evidence gate remains distinct from the transaction-builder or static-script-size evidence.

Local source references:
- `plutus/pre-rich-plutus.cabal`
- `cabal.project`
- `docs/audits/P2.8-REVEAL-REFERENCE-SCRIPT-REMEDIATION-v0.1.md`
- `docs/audits/P2.8-B.1-cardano-ledger-runner.md`

### What Leios does and does not solve

Linear Leios could improve transaction throughput and inclusion capacity after rollout. It does **not** remove the per-transaction `maxTxSize` rule, shrink our serialized Reveal transaction, reduce our compiled validators, or certify that a given Reveal passed native ledger evaluation. Those remain separate, measurable acceptance criteria.

### What CIP-118 does and does not solve

CIP-118 could eventually enable sponsored or composed transactions for selected IMMORTAL adapter operations. It is **not** a drop-in fix for the current Reveal size blocker:

- The full nested batch still has to fit within `maxTxSize`.
- The existing Reveal spends Plutus V2 validators; a new-feature batch using sub-transactions/guards cannot run those V2 scripts under the CIP-118 compatibility rules.
- Using the new path would therefore require a separately designed and verified Dijkstra/PlutusV4 route, with new script artifacts/hashes, exact transaction construction, aggregate collateral accounting and ledger evidence.
- The already-selected reference-script remediation directly attacks the current witness-size issue without changing validator semantics and should remain the active route.

No claim is made here that a migration to PlutusV4 is safe, necessary, or approved.

## 4. Fee model: keep the categories separate

CIP-118 introduces ways for a top-level payer/aggregator to cover transaction fees, collateral, execution costs and min-UTxO costs associated with sub-transactions. It does not define IMMORTAL's universal Protocol Usage Fee.

Keep the protocol's current conceptual boundary:

- **ChainExecutionCost:** actual ledger transaction fee and any other chain execution costs that the protocol elects to account for as such.
- **ProtocolUsageFee:** a distinct IMMORTAL-level charge, applicable only under a separately resolved and authorized G1 declaration.
- **Sponsorship:** an adapter/composition arrangement that determines who advances or bears the chain-side costs. Sponsorship alone does not create a protocol fee entitlement or reimbursement rule.

A future sponsor may economically absorb costs, but whether IMMORTAL charges, recovers, subsidizes, or contributes any amount is a separate policy decision. This research selects no fee-bearing action classes, rates, settlement assets, destinations, subsidies, margins or accounting rules. **G1 remains OPEN.**

Leios throughput also does not establish a deterministic cost price per IMMORTAL action. The fee paid by a transaction remains tied to ledger rules and the actual transaction; a protocol-level cost-recovery model needs its own measured evidence and authorized allocation policy.

## 5. Suggested future qualification plan (not executed)

When a supported Dijkstra Preview/Pre-production environment and matching APIs are available, qualify Nested Transactions in an isolated experiment. Do not change the active P2.8 or Reveal path to conduct this research.

### Phase A — support matrix

Pin exact versions and establish, by reproducible build/test, support for:
- Dijkstra ledger serialization and decoding of the top-level/sub-transaction bodies;
- PlutusV4 script construction, language tagging/hash derivation, context translation and execution;
- Guard/CIP-112 witnesses and batch-context visibility;
- transaction balancing, fee calculation, reference-script handling, aggregate ExUnits and collateral;
- the deployed provider/SDK's ability to inspect, sign, submit and observe the exact transaction.

Mark each item SUPPORTED, UNSUPPORTED or NOT VERIFIED. Do not infer end-to-end support from source-level types alone.

### Phase B — minimal non-PRE-RICH proof

Build a minimal test batch with one deliberately fee-incomplete sub-transaction and a top-level sponsor. Record:
- exact CBOR, total bytes and observed `maxTxSize`;
- all inputs/outputs and conservation across the entire batch;
- fee payer, collateral, min-UTxO coverage and ExUnits;
- Plutus language/script hashes and exact protocol parameters;
- accepted ledger result plus a complete set of negative tests.

Negative cases should include missing sponsor funds, invalid Guard, modified sub-transaction, duplicated/conflicting inputs, insufficient aggregate collateral, a failing script, and an oversized aggregate batch. Demonstrate that failure does not partially apply the batch.

### Phase C — IMMORTAL boundary decision

Only after Phase B, determine whether any canonical IMMORTAL operation benefits from being sponsored/composed. Preserve the invariant that fee applicability/amount is determined by IMMORTAL's authorized economic semantics while Cardano-specific serialization, batching and payment mechanics remain in the Adapter. This phase must not silently choose G1 classes or a cost formula.

## Conclusion

Dijkstra/Linear Leios is a future Layer-1 throughput capability. CIP-118 is a more direct architectural opportunity for sponsorship and batching, but also introduces a new transaction model and PlutusV4/Guard requirements. Today the safest project decision is to preserve the existing reference-script Reveal remediation and current pinned evaluation lane; prepare a versioned support matrix and qualify CIP-118 separately when the target environment and API support are verifiable.

This document is research only. It changes no runtime behavior, tests, contracts, transaction semantics, branch configuration or economic policy.
