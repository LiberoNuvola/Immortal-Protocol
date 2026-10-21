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
- A CIP-118 batch that actually uses new features cannot execute Plutus V3-or-earlier scripts in those feature-using transactions. The CIP also describes a legacy-isolation mode for an older Plutus script at the **top level**: that top-level transaction must balance independently, cannot itself use the new features, and cannot use supplemental datums for sub-transaction outputs/reference inputs. Sub-transactions using the new features cannot use old Plutus versions. This is narrower than saying all older scripts are forbidden anywhere in a batch.
- Consequently, putting the current Plutus V2 Reveal at the top level would not let it rely on a sponsor sub-transaction to balance its own fee/value, nor let it use the new transaction features. The entire serialized top-level batch, including every sub-transaction, still counts against `maxTxSize`; adding a batch is not a direct size remediation.
- Any future design that executes the relevant behavior inside a feature-using sub-transaction or uses top-level guards would need a separately designed and verified Dijkstra/PlutusV4 path, with new script artifacts/hashes, exact transaction construction, aggregate collateral accounting and ledger evidence.
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


## 6. Upstream implementation readiness and experiment entry gate (checked 2026-10-21)

A source-level readiness check found real progress, but not yet a cleanly established production test target:

| Upstream source | Observed status | Implication for IMMORTAL |
|---|---|---|
| Dijkstra readiness tracker, `cardano-ledger#5604` | Open; the ticket is explicitly the umbrella for a `cardano-node` release that can successfully hard fork into a fully functional Dijkstra era | Do not treat Dijkstra support in source branches as public-network activation |
| CIP-118 ledger implementation tracker, `cardano-ledger#5123` | Open | Keep the CIP implementation and end-to-end integration status distinct from the Proposed CIP text |
| Plutus V4 releases | Plutus 1.71.0.0 (published 2026-09-30) and 1.72.0.0 (published 2026-10-17) are released. 1.71 carries the Plutus V4 context work; 1.72 includes a fix for sum-type decoding when targeting Plutus Core 1.1.0. Tracker `plutus#7342` remains open. | A current V4 candidate exists; still pin and verify exact compiler, API, ledger and script context together |
| Cardano API, `cardano-api#1361` | Merged 2026-10-06; adds Dijkstra body fields plus construction/signing support for `SubTx`. Its PR describes some required top-level Guard fields as not yet written at that point. | API construction support exists, but does not establish full node/Guard end-to-end support |
| Cardano CLI, `cardano-cli#1453` / release `11.4.0.0` | Merged and released 2026-10-16. Dijkstra-only commands build, sign and identify sub-transactions, and `dijkstra transaction build-raw --signed-sub-tx-file` can embed signed sub-transactions. Balanced `build` fee estimation for nested transactions is explicitly deferred in the PR. | CLI raw-body/witness work can be preflighted, but do not assume the balanced builder estimates the complete batch fee correctly |
| Cardano Node 11.2, `cardano-node#6672` / PR `#6677` | Release tracker remains open; ledger, consensus, API and CLI dependencies are marked released in the tracker, while the node integration PR still reports “builds, needs review”. Node release page still identifies 11.1.3 as latest stable. | Dijkstra node release / public DijkstraNet is still the gating dependency for a supported public integration target |
| Local Dijkstra testnet integration, `cardano-node#6709` | Open PR, not merged; adds hard-fork, sub-transaction swap, script-witness and Guard properties. Its description reports 8/9 passing; the remaining Plutus V4 top-level Guard property fails during node-to-client submission with a streaming-decoder error before Guard validation. It is stacked on the 11.2 integration and uses cardano-api 11.9 plus a pinned CLI/ledger stack. | Strong upstream test basis, but the exact top-level Guard submission path remains a blocker; the eight passing tests do not establish full integration |

Sources:
- https://github.com/IntersectMBO/cardano-ledger/issues/5604
- https://github.com/IntersectMBO/cardano-ledger/issues/5123
- https://github.com/IntersectMBO/plutus/issues/7342
- https://github.com/IntersectMBO/plutus/releases/tag/1.71.0.0
- https://github.com/IntersectMBO/plutus/releases/tag/1.72.0.0
- https://github.com/IntersectMBO/cardano-api/pull/1361
- https://github.com/IntersectMBO/cardano-cli/pull/1453
- https://github.com/IntersectMBO/cardano-cli/releases/tag/cardano-cli-11.4.0.0
- https://github.com/IntersectMBO/cardano-node/issues/6672
- https://github.com/IntersectMBO/cardano-node/pull/6677
- https://github.com/IntersectMBO/cardano-node/pull/6709
- https://intersectmbo.org/news/intersect-weekly-update-133-oct-17-2026
- https://github.com/IntersectMBO/cardano-ledger/pull/6189

### Can we run the minimal CIP-118 experiment against an official Dijkstra testnet now?

**Not demonstrated by the inspected evidence.** The upstream integration PR is building the local Dijkstra testnet path, but it remains unmerged and reports a decoder blocker on one of the PlutusV4/Guard properties. The Dijkstra roadmap still describes staged rollout through Preview, Pre-production and Mainnet; code-completion targets are estimates, not an activation guarantee.

This repository session has no attached Dijkstra node/API endpoint or locally runnable cardano-node checkout. Therefore an end-to-end transaction experiment cannot be truthfully reported as executed here. The documented experiment is currently a **prepared entry gate**, not a pass.

### Minimal experiment to run once the upstream test target is usable

1. **Freeze the target:** record exact cardano-node, cardano-api/cli, cardano-ledger, Plutus compiler/API, era/protocol version and genesis configuration. Require a Dijkstra testnet that has actually reached protocol version 12.
2. **Build a separate toy batch:** no PRE-RICH validators and no IMMORTAL monetary semantics. Use a key-controlled sub-transaction that is intentionally short of its fee/value and a top-level sponsor that completes the batch; sign only the test keys. Avoid live funds.
3. **Baseline legacy isolation:** include a separately balanced legacy Plutus V2 top-level transaction plus an independently balanced feature-using sub-transaction, and verify that the top-level V2 script cannot depend on the sub-transaction's inputs, outputs, fee or new context.
4. **Measure and inspect:** serialize the whole parent transaction including sub-transactions; compare exact bytes with observed `maxTxSize`; record all input/output values, overall balance, parent fee payer, aggregate collateral, per-script ExUnits, script languages and hashes, and the exact protocol parameters.
5. **Negative cases:** missing sponsor funds, insufficient aggregate collateral, missing/invalid required Guard, duplicate/conflicting input, modified sub-transaction body, one failing script, and oversized aggregate CBOR. For script failure, prove the batch is not partially applied and only the specified collateral behavior occurs.
6. **Evidence pack:** preserve signed transaction CBOR, tx id, full UTxO context, protocol parameters, system start/epoch context as needed, node logs, ledger result, block/slot observation, and a manifest with source/fixture/build hashes. Mark every result as local testnet, not Preprod/Mainnet.
7. **Only then consider IMMORTAL:** decide whether an adapter operation benefits from sponsorship/composition; keep ProtocolUsageFee independent of Cardano chain fee/sponsorship. No G1 classification, fee formula or production migration is implied.

### Go/no-go decision

- **GO** for preparing the isolated experiment against a pinned upstream Dijkstra test harness when the decoder blocker and required toolchain are resolved.
- **NO-GO** for applying CIP-118 to the active Reveal/production path today: no demonstrated target-network/API support, no ledger evidence for the proposed path, and no benefit to the current transaction-size gate established.
- **G1 remains OPEN.** This readiness assessment selects no fee-bearing class, amount, fee destination, sponsor reimbursement, or optional margin.


## 7. Current usable preflight vs. actual end-to-end gate (updated 2026-10-21)

### Available now in released CLI

The published `cardano-cli 11.4.0.0` includes Dijkstra sub-transaction commands from PR #1453. The source documents this raw construction flow:

```sh
cardano-cli dijkstra sub-transaction build-raw --tx-in ... --tx-out ... --guard-key-hash HASH --out-file sub.unsigned
cardano-cli dijkstra sub-transaction sign --sub-tx-file sub.unsigned --signing-key-file k.skey --out-file sub.signed
cardano-cli dijkstra sub-transaction txid --signed-sub-tx-file sub.signed
cardano-cli dijkstra transaction build-raw ... --signed-sub-tx-file sub.signed --out-file tx.body
```

These are upstream command-shape examples, not a command run against this repository's wallet or a tested IMMORTAL transaction. The PR explicitly defers sub-transaction-aware fee estimation for the balanced `dijkstra transaction build`; do not use its ordinary fee estimate as evidence for a batch that embeds sub-transactions. Use the raw construction lane only for serialization/witness preflight until the matching balancing implementation is verified.

### The latest upstream failure is narrower than “CIP-118 is unimplemented”

The Dijkstra work is progressing in layers:
- cardano-api construction/signing support for `SubTx` has merged;
- cardano-cli raw build/sign/txid/embedding support has merged and been released;
- the ledger fix for `Data` / `PlutusData` decoding of the `requiredTopLevelGuards` field merged as `cardano-ledger#6189` on 2026-10-16;
- the node 11.2 integration and local Dijkstra testnet PR remain open, with one of nine end-to-end properties still failing at node-to-client submission before Guard validation.

The ledger decoder fix and the remaining streaming-decoder/submission error are distinct findings; do not mark the latter fixed merely because #6189 merged. Upstream's 2026-10-17 update still describes public DijkstraNet as forthcoming with Node 11.2, and Node 11.3 as the intended join point for Linear Leios. The separate Musashi Dojo is testing Leios; it is not, by itself, a public DijkstraNet target for CIP-118 sub-transactions.

### Decision and next concrete gate

**Ready for a CLI-format smoke test:** build/sign/txid an inert test sub-transaction and embed it in a raw top-level Dijkstra body, using only disposable test keys and no mainnet funds. This proves only the released CLI's wire-format pipeline.

**Not yet ready to claim an IMMORTAL-relevant ledger result:** the actual next gate is a reproducible node 11.2/Dijkstra test runtime, then the exact upstream nested-transaction integration tests with the remaining top-level Guard submission property passing. After that, add the minimal sponsor batch and inspect the serialized whole transaction, aggregate balance/collateral, script contexts/ExUnits and ledger result. It must be clear whether the tested path uses only key guards or the PlutusV4 top-level Guard path.

An isolated PowerShell harness has now been added at `audit/cardano-integration/dijkstra-cli-wire-preflight.ps1`. It uses a generated ephemeral payment key, a locally generated testnet address, synthetic nonexistent transaction inputs, the Dijkstra sub-transaction guard, and the CLI's raw build/sign/txid/embed pipeline. It records a machine-readable `evidence.json`, including serialized CBOR sizes for the signed sub-transaction, top-level body, and signed top-level transaction. The generated signing key is deleted in the script's `finally` block.

Run from the IMMORTAL repository root on Windows with the official CLI 11.4.0.0 or later:

```powershell
powershell -ExecutionPolicy Bypass -File .\audit\cardano-integration\dijkstra-cli-wire-preflight.ps1 -CardanoCli "C:\path\to\cardano-cli.exe"
```

The harness deliberately does **not** submit or ledger-evaluate its transaction. A `PASS` means only that local CLI serialization/signing/ID handling and embedding succeeded. It does not prove UTxO validity, fee balancing, `maxTxSize` compliance, PlutusV4 Guard support, a sponsorship result, or Cardano ledger acceptance. The dummy transaction must never be submitted.

The harness could not be executed in this session: no `cardano-cli`, `cardano-node`, `cabal`, `nix`, or PowerShell runtime is installed, and the shell cannot resolve public GitHub hosts. The script has been source-checked against the command shapes and official golden-test sequence in `cardano-cli 11.4.0.0`, but runtime success is **NOT VERIFIED**. The next evidence should be the actual local `evidence.json`, followed (only after a usable Dijkstra node is available) by ledger evaluation of a separate deliberately balanced test batch.

The experiment remains separated from active PRE-RICH: no change to `cabal.project`, Plutus pin, script version, Reveal, reference-script remediation, transaction deployment, ProtocolUsageFee or G1 is authorized by this research.
