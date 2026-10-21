# IMMORTAL — Protocol Usage Fee Call-Site & Producer Inventory B3 v1

**Classification:** research / implementation inventory; non-normative  
**Repository:** `LiberoNuvola/Immortal-Protocol`  
**Branch inspected:** `work/b3-materios-provenance-evidence`  
**Scope:** targeted inventory of known fee, payment, treasury, adapter-settlement, and generalized-derivation surfaces. This is not a claim of exhaustive whole-repository static analysis.

## Executive finding

Within the inspected artifacts, the repository contains (1) a concrete PRE-RICH ticket-sale payment path, (2) Cardano economic-admission and transaction-input binding, and (3) structural fee/revenue/reward boundary harnesses. These are different responsibilities.

**No universal IMMORTAL Protocol Usage Fee producer was located in this targeted inventory.** In particular, the inspected fee-boundary harness receives an opaque target and settlement amount and checks structural separation/fail-closed conditions; it does not derive the amount from certified economic inputs. This finding is scoped to the files listed below and does not prove that no relevant implementation exists elsewhere in the repository.

The universal fee's normative rule/target, reference-unit and conversion contract, and proof of settlement conformance therefore remain open on the inspected evidence.

## Inventory

### A. PRE-RICH application payment — concrete, but not the universal fee

**Files**
- `src/mint.ts`
- `src/config.ts`

**Observed**
- `src/mint.ts` documents one transaction combining serial NFT minting, a pending Prize UTxO, Treasury payment, and B1PrizePool state update.
- The file explicitly says the current B1 launch settlement is 1 ADA / 1,000,000 lovelace and is **not** the USDM economic valuation; the canonical economic price remains `pdPriceUsdm`.
- The path requires a configured Oracle State singleton reference and describes the MintPolicy as valuing the exact Treasury payment through the canonical Economic oracle path.
- `src/config.ts` defines `TICKET_PAYMENT_LOVELACE = 1_000_000`, a deployment/application settlement constant.

**Classification**
- This is evidence of a PRE-RICH ticket sale/payment path and an application-level atomic transaction invariant.
- It is not, by itself, evidence of a chain-neutral IMMORTAL `ProtocolUsageFee` producer.
- The lovelace payment constant must not be treated as a USDM valuation or universal fee formula.

### B. Cardano admission and transaction binding — validation/settlement boundary, not fee derivation

**Files**
- `Adapter/CARDANO/runtime/AuthoritativeIssueAdmission.ts`
- `Adapter/CARDANO/runtime/EconomicAdmission.ts`
- `Adapter/CARDANO/runtime/CardanoExecutionAdapter.ts`
- `src/preRichIssueAdmissionBridge.ts`

**Observed**
- The admission modules validate evidence/witness fields and bind economic admission to referenced inputs and liquidity observations.
- The execution adapter checks that declared admission inputs are present in the actual transaction body and rejects duplicate/missing references.
- The inspected admission surfaces concern authoritative Issue/economic evidence and Cardano transaction correspondence. They do not establish a universal fee-target calculation in the code reviewed.

**Classification**
- These surfaces may supply important admission and settlement conformance evidence.
- Do not classify them as the missing universal fee producer without a concrete call-site that derives and passes a certified fee result.

### C. Structural fee-transition harness — boundary checks, not production calculation

**File**
- `audit/algorithmic-governability/fee-bearing-transition-separation-boundary.mjs`

**Observed**
- The fixture supplies opaque values such as `economicFeeTarget: 'target-opaque'` and `settlementAmount: 'amount-opaque'`.
- It checks separation between Protocol Usage Fee and ChainExecutionCost, required own-data fields, canonical transition identity, reference/conversion status, and fail-closed behavior.
- The harness can accept a supplied candidate as committed when its structural predicates pass; it does not compute the target or settlement amount from authenticated economic state.

**Classification**
- Structural/conformance harness.
- Not a production fee function, oracle, asset conversion implementation, or proof of live Cardano fee settlement.

### D. Treasury and reward surfaces — legacy application policy and structural accounting boundary

**Files**
- `src/treasuryPolicy.ts`
- `plutus/Treasury.hs`
- `audit/algorithmic-governability/reward-treasury-boundary.mjs`
- `docs/COORDINATION/FRONT-IMMORTAL-TREASURY-FEE.md`
- `docs/COORDINATION/FRONT-FEE-GOVERNANCE-BUILD-INCENTIVES.md`
- `docs/COORDINATION/FEE-INCENTIVE-ADVERSARIAL-LAB-v0.1.md`

**Observed**
- `src/treasuryPolicy.ts` explicitly marks its percentage policy as deprecated legacy/migration compatibility and says it is not an authoritative V3 economic rule and must not be imported by production economic flows.
- `plutus/Treasury.hs` implements a datum-driven lovelace distribution validator with threshold, percentage-sum and payout checks. This is a concrete Treasury validator, not proof of the universal IMMORTAL protocol-fee semantics.
- The reward/Treasury harness states that it introduces no reward amount, percentage, or allocation formula; the available-revenue relationship is supplied as an externally certified fact.
- The coordination/research documents separate fee semantics from reward policy and leave candidate fee/reward functions non-normative.

**Classification**
- Do not promote legacy PRE-RICH Treasury percentages to IMMORTAL rules.
- A Treasury receipt or protocol-controlled destination does not by itself classify the amount as ProtectedCapital, RawSurplus, available revenue, or reward budget.

### E. Generalized derivation contract — reusable architecture, not an instantiated fee producer

**File**
- `docs/research/GENERALIZED-DERIVATION-CONTRACT-v1.md`

**Observed**
- The document defines a non-normative boundary for derived results: authorized domain, declared rule, certified inputs, limits, evidence, version, contestability, and exit/fail-closed behavior.
- It names `EconomicFeeTarget(S,A)` as one possible function family and separates universal derivation from adapter encoding and chain settlement.
- It states that reuse of derivation machinery does not imply reuse of authority or semantics.

**Classification**
- Architecture/contract only. It does not instantiate a frozen production fee rule, target parameters, reference-unit conversion, or Cardano settlement proof.

## Evidence matrix

| Responsibility | Evidence found in inspected artifacts | Status from this inventory |
|---|---|---|
| PRE-RICH ticket payment | `src/mint.ts`, `src/config.ts` | Concrete application/deployment path |
| Authoritative Issue admission | Cardano admission and bridge modules | Validation/binding surface; not fee derivation |
| Universal Protocol Usage Fee producer | No concrete producer located in this targeted file set | **Not established** |
| Fee vs ChainExecutionCost distinction | Fee-bearing transition harness and coordination docs | Structural principle represented |
| Target/amount derived from certified state | Harness uses opaque supplied values | **Not established** |
| Reference-unit and asset conversion contract | Discussed in fee governance/Notion work; not instantiated by the inspected harness | **Not established** |
| Treasury distribution | Legacy TS policy and datum-driven Plutus validator | Concrete but application/legacy-scoped; not universal fee semantics |
| Reward budget from verified available revenue | Structural reward/Treasury harness with externally supplied certification fields | Boundary check only; production producer not established |
| Live Cardano fee settlement evidence | Not established by these source artifacts alone | **Not established by this inventory** |

## Notion triangulation retained as design context

The existing coordination map records the intended chain:

`Protocol Usage Fee → valuation/settlement contract → Treasury/accounting boundary → optional authorized reward budget`

It also preserves the distinction `ProtocolUsageFee != ChainExecutionCost` and prohibits silently promoting `src/treasuryPolicy.ts` percentages to IMMORTAL. The following Notion design records were identified in the prior fee traceability work:

- Economic Usage Fee & Adapter Settlement Workflow v0.1: https://app.notion.com/p/3e0c4454d6d581f9b78fd05de6ea7763
- Fee Ownership Matrix: https://app.notion.com/p/3e0c4454d6d581d89274e3009a371806
- Parameter Selection Boundary & Cardano Adapter Settlement Conformance: https://app.notion.com/p/3e0c4454d6d581209701ffaf4c830408
- Existing State Machine + Cardano Settlement Conformance Overlay: https://app.notion.com/p/3e0c4454d6d5815cb608e8f3d7882803
- Reference Unit, Target Function & Fee Affordability Formalization: https://app.notion.com/p/3e0c4454d6d5810789fcdf7aa7e8aba3

These records are design context; they do not substitute for implementation or execution evidence.

## Closure sequence — no policy invention

1. Continue call-site tracing from the inspected payment and admission surfaces to identify any existing producer/consumer contract for a universal fee.
2. If a producer exists elsewhere, verify its branch-local implementation, exact call-site, certified inputs, versioned rule and output type before connecting it.
3. If no producer is found after a broader bounded inventory, register the producer as an implementation gap rather than inventing a formula.
4. Keep denomination/reference, conversion, affordability, atomicity and adapter conformance as separate proof obligations.
5. Only after a concrete implementation path is identified, run the focused tests and record exact commands/results. No tests or CI runs are claimed by this inventory.

## Change and claim boundary

- Documentation-only inventory; no code, economic rule, parameter, threshold, fee amount, reward policy, or authority path changed.
- No new branch created.
- No V3 or Reveal semantics touched.
- No test, CI, or live-chain execution performed for this report.
- “Not established” means the inspected artifacts do not prove the claim; it is not a universal assertion that the capability cannot exist elsewhere.


## F. Operation and cost-attribution inventory — targeted branch-local pass

**Purpose:** identify which cost evidence exists today, what could be measured without inventing a fee formula, and what remains unsupported. This is an inventory, not a fee policy. No operation is declared fee-bearing by this section.

### F1. Operations and current evidence

| Operation / resource path | Evidence found on this branch | Cost category that can be identified now | What is not established |
|---|---|---|---|
| Cardano transaction execution | `Adapter/CARDANO/runtime/CardanoExecutionAdapter.ts` signs/submits a completed transaction and returns its transaction reference. `Adapter/CARDANO/docs/CARDANO-ADAPTER-COMPLETE-SYSTEM-SPECIFICATION.md` says transaction provenance should include fees and execution results. | **ChainExecutionCost**, separate from Protocol Usage Fee. In principle, a submitted transaction can be inspected for its actual ledger fee and execution units, with the matching protocol parameters and transaction context. | The inspected adapter does not calculate a universal IMMORTAL fee, and the cited generic evidence statement is not proof of a completed per-transaction cost-measurement pipeline. No branch-local end-to-end cost packet was established by this pass. |
| Plutus validation/execution | `audit/cardano-integration/evolution-cost-model-probe.ts` checks the expected shape/length of the Plutus cost-model parameters exposed by the provider. | Cost-model compatibility prerequisite; it can help establish that evaluation uses a compatible model. | It does not measure the execution units or actual fee of each business operation and does not derive Protocol Usage Fee. |
| PRE-RICH Issue / ticket sale | `src/mint.ts` combines ticket minting, Treasury payment, pending Prize UTxO creation and B1PrizePool update; it calls `tx.complete()` and submits through `submitEconomic`. `src/config.ts` provides a fixed launch settlement amount of 1,000,000 lovelace. | Application settlement/payment and a Cardano transaction that also incurs ChainExecutionCost. | The fixed lovelace amount is not a measurement of operating cost and is explicitly distinct from the USDM economic valuation. It is not a universal IMMORTAL fee. |
| PRE-RICH Reveal / Claim / Expire | `EconomicActionClass` and the V3 transition model identify these as economic action classes; the current admission boundary validates supplied witnesses and transaction input binding. | Candidate application transitions whose chain execution costs could be measured from actual transactions if/when submitted and observed. | No universal G1 applicability declaration, per-operation resource-cost ledger, or Protocol Usage Fee producer was identified in the inspected paths. No class is selected as fee-bearing. |
| Oracle / reference observations | The repository contains oracle observation and direct-USDM observation paths for application economic admission. | Potential external-service, compute and data-availability costs; chain execution cost only where an actual on-chain transaction is submitted. | The inspected artifacts do not provide a verified unit cost per observation, a provider invoice/usage meter, or an approved allocation of shared oracle costs to a protocol action. Observation alone does not imply a fee. |
| Materios evidence / anchoring / verification | The B3 work contains checkpoint, finality, storage-proof and execution-verifier tooling and evidence capture. | Potential infrastructure costs: compute, storage, bandwidth, RPC/provider use and operator time. These must be evidenced by the actual deployment/provider if they are to be recovered. | The inspected evidence artifacts are proof/provenance mechanisms, not a canonical cost meter. This pass did not establish actual per-operation prices, provider billing records, or a defensible allocation of shared node/storage costs to IMMORTAL actions. |
| Off-chain relayer / admission service | Relayer and authoritative-admission modules transport/verify witnesses and may call upstream providers. | Potential service operating costs such as compute, network, hosting and paid upstream access. | No authenticated metering or cost ledger was established that binds these expenses to a canonical IMMORTAL action. A relayer signature or admission witness is not cost evidence. |
| Shared development, maintenance and governance work | Research describes possible maintenance/build/review work but does not instantiate it as an operating-cost meter. | Shared overhead, if the owner later decides it belongs in the recoverable cost perimeter. | No approved allocation period, allocation key, cost evidence contract or rule for attributing shared overhead to individual operations exists in the inspected fee artifacts. Commit counts or lines of code would not be a reliable cost measure by themselves. |

### F2. Classification rules for the next evidence pass

Use these categories without collapsing them:

1. **Directly observed chain cost:** the actual ledger transaction fee and, where relevant, recorded execution-unit usage under the corresponding protocol parameters. This is ChainExecutionCost, not Protocol Usage Fee.
2. **Directly metered protocol cost:** a provider bill or trusted usage meter tied to a defined service interval/action, with source, units, time window and provenance.
3. **Shared operating overhead:** an actual documented expense whose allocation to operations is still a policy/model decision; do not divide it arbitrarily or label it a per-operation fact.
4. **Unmeasured / unverified:** a plausible cost without sufficient evidence. Keep it unpriced until a reliable measurement or approved estimation method exists.
5. **Excluded cost:** a cost explicitly outside the approved fee perimeter, including any chain cost already accounted for separately. The exclusion list itself still needs an authorized rule.

### F3. Measurement record needed before cost-based fee calculation

For any proposed recoverable cost, the evidence record should at least identify the operation/service, cost category, amount and unit, source/meter, observation period or transaction reference, timestamp, provenance, applicable rule/version, allocation method if shared, and a check against duplicate counting. These are evidence-design requirements for future review, not a claim that such a producer already exists.

Do not use `TICKET_PAYMENT_LOVELACE`, ticket price, `src/treasuryPolicy.ts` percentages, `v3MandatoryFutureCosts`, ProtectedCapital, RawSurplus, a Treasury balance, or a generic Plutus cost-model compatibility result as a proxy for the universal Protocol Usage Fee.

### F4. Result

- **ChainExecutionCost:** a distinct and potentially directly observable category, but a reproducible per-operation evidence packet was not established by this targeted pass.
- **Protocol-attributable operating cost:** possible categories identified, but no verified per-operation meter/allocation was established in the inspected surfaces.
- **Shared overhead:** no approved attribution method established.
- **Optional protocol contribution/margin:** no cost evidence or authorized calculation basis establishes a rate; leave it open.
- **Fee applicability (G1):** still OPEN. This inventory selects no fee-bearing operation.

**Scope limitation:** exact-branch reads of the listed fee inventory, Cardano adapter, PRE-RICH mint path, cost-model probe, admission types and related specifications. This is not a claim of exhaustive static analysis of every operation or external provider, and no tests, CI, deployment or live transaction measurements were run by this documentation pass.


## G. Operational evidence follow-up — current branch snapshot

### G1. Branch and evidence surfaces checked

This follow-up was performed against branch `work/b3-materios-provenance-evidence`, whose observed head at the start of this pass was `a45837c7f355d8c52883807e4c70de9d5c746d54`. The branch has advanced since the earlier inventory commit; conclusions below are limited to the specific current-head artifacts inspected.

The current branch contains `audit/cardano-ledger-runner/evidence/README.md` and `manifest.schema.json`, but that tracked directory contains the packet contract/schema rather than a populated real transaction packet. The contract requires `tx.cbor`, `utxo.json`, `pparams.json`, `epoch-info.json`, `system-start.json`, and `manifest.json` to describe the same ledger state and bind acquisition provenance, transaction inputs/hash, script artifacts and file digests. Its stated safe-stall behavior is an evidence gate, not evidence that a specific operation was evaluated.

The tracked Reveal golden-packet document likewise specifies the required signed/unsigned transaction, transaction ID, redeemers/ex-units, ledger observation, and reconstructed post-state, while explicitly stating that no real Reveal packet is claimed closed. This is a useful future evidence contract, but it does not supply a transaction fee or per-operation cost value.

The latest branch workflow run inspected during this pass was the drand Beacon Verification PoC. Its uploaded artifact is named `immortal-drand-verified-beacon`; a prior run also uploaded `immortal-drand-plutus-ledger-evidence`. These artifacts concern beacon verification/ledger evidence. The run metadata and artifact names alone do not establish a cost meter, provider invoice, fee-paid field tied to an IMMORTAL action, or a recoverable cost allocation. They are not to be reclassified as Protocol Usage Fee evidence without inspecting a specific artifact and proving that linkage.

### G2. What can and cannot be concluded

- **Evidence contract exists:** yes, for the P2.8 typed Ledger packet and Reveal transition.
- **Current tracked P2.8 evidence directory contains a real populated transaction packet:** no; the inspected tracked directory contains the README and schema only.
- **A reproducible operation-specific Cardano fee/execution-cost record was established by this follow-up:** no.
- **A verified off-chain provider bill or usage meter bound to a canonical IMMORTAL action was established:** no.
- **A general absence of all historical or external transaction evidence is proven:** no. Workflow artifacts and external provider records are not exhaustively enumerated by this targeted check.

A ledger transaction's fee and a ledger evaluator's ExUnits are related but distinct observations: the transaction fee is the actual chain charge; ExUnits describe script execution resource use and need the corresponding protocol parameters/cost model to support comparison or attribution. Neither, by itself, prices hosting, oracle access, storage, Materios verification, or shared engineering overhead.

### G3. Next evidence gate

The next useful evidence step is not to set a percentage or estimate a universal fee. It is to select an already observed transaction that can be bound to one canonical action and assemble its exact transaction/ledger packet, then extract the ledger-reported fee and any ledger-aligned redeemer ExUnits. Separately, obtain actual provider usage/billing records for off-chain services if those costs are to be considered. Keep the chain charge, metered service cost, shared overhead and optional protocol contribution as separate fields.

No transaction was submitted, no workflow was rerun, and no code, tests, CI, deployment, V3 or Reveal semantics were changed in this follow-up. G1 applicability and the economic fee formula remain OPEN.
