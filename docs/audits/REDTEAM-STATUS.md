# IMMORTAL — Red-Team Status

## Purpose

This is an adversarial, non-normative closure register. It does not change economic semantics. A case is PASS only when the attack is rejected, neutralized, or explicitly detected with evidence.

## Current scope

The first attack pass is derived from the 2026-09-23 external red-team review and is mapped to the current working branch.

### RT-1 — Valuation / EEV / executable liquidity

| ID | Attack | Current status | Required evidence |
|---|---|---|---|
| RT-1.1 | Inflated EEV | OPEN | Gate refuses decisions based on unjustified valuation or explicit haircut/valuation bound |
| RT-1.2 | Deliberately low valuation | OPEN | Safe-direction monotonicity: lower valuation cannot create extra admissibility |
| RT-1.3 | Stale oracle | PARTIAL | Freshness checks exist in Genesis path; general EEV path still requires end-to-end evidence |
| RT-1.4 | Malformed valuation | PARTIAL | Genesis admission validates valuation fields; complete economic-input boundary inventory remains open |
| RT-1.5 | Non-executable liquidity | CLOSED at implementation binding / OPEN release-wide | Locked/wrong-policy/non-spendable value excluded; authenticated Pool input/value is bound to candidate inputs; fresh ledger evidence still required |
| RT-1.6 | Reflexive PRE valuation | OPEN / DESIGN QUESTION | Determine whether Genesis admission is mark-to-market or executable liquidation value; do not invent a haircut |
| RT-1.7 | Mid vs settlement price | OPEN | Settlement cannot silently consume protected capital because valuation convention differs |
| RT-1.8 | Treasury double-count | HARDENED / NEEDS EVIDENCE | Genesis carrier excludes PrizePool I/O and preserves carrier value; fresh ledger evidence still required |
| RT-1.9 | Mark-to-claim race | OPEN | Crystallized obligations remain protected; subsequent actions re-evaluate admissibility |
| RT-1.10 | Conversion spread/timing | OPEN | Conversion surface is bounded and fail-closed |

### RT-2 — Genesis observation / carrier

| ID | Attack | Current status |
|---|---|---|
| RT-2.1 | Below threshold | IMPLEMENTED IN MIRROR |
| RT-2.2 | Exact threshold | IMPLEMENTED IN MIRROR; canonical 10M PRE × 0.04 = 4,000 still needs fresh ledger evidence |
| RT-2.3 | Stale observation | IMPLEMENTED |
| RT-2.4 | Wrong Treasury | IMPLEMENTED |
| RT-2.5 | Wrong PRE asset | OPEN — must be exercised against authenticated ledger asset identity |
| RT-2.6 | Unverified valuation | IMPLEMENTED |
| RT-2.7 | Conflicting observations | OPEN |
| RT-2.8 | Duplicate transition | IMPLEMENTED in carrier/Yaci trace |
| RT-2.9 | Legacy Treasury distribute as Genesis authority | OPEN |
| RT-2.10 | Silent PrizePool inflation | HARDENED / NEEDS FRESH LEDGER EVIDENCE |
| RT-2.11 | UI Genesis while chain remains PRE-GENESIS | OPEN |
| RT-2.12 | Missing executable Genesis path | NO LONGER APPLICABLE — executable carrier exists |
| RT-2.13 | Forged observation authentication | OPEN |
| RT-2.14 | Off-chain/on-chain revalidation mismatch | OPEN |
| RT-2.15 | Carrier singleton capture | PARTIAL — singleton enforced; adversarial duplicate-authority ledger test still required |

### RT-3 — RF8 side-door inventory

**OPEN.** Enumerate every economic state mutator and attach a negative twin. Any mutator without a canonical authority path and negative test blocks release closure.

### RT-4 — B1 liveness

**OPEN.** Publisher outage, stale beacon, selective censorship and ordering must be classified as liveness/fairness effects rather than silently promoted to safety claims.

### RT-5 — Ω / commitment completeness

**OPEN.** The current work must demonstrate that all economically material obligations included in the intended commitment perimeter are represented in ProtectedCapital / gate inputs. An incomplete Ω cannot be called complete.

## Current priority

1. RT-2.13–2.15 against the real Genesis carrier.
2. RT-1.3–1.5 and RT-1.8 using the existing Treasury/Oracle observation surface.
3. RT-3 full economic-mutator inventory.
4. RT-1.6 as a source-of-truth/design determination, not an invented implementation constant.
5. RT-4 and RT-5 conformance evidence.

## Evidence discipline

- Model test ≠ Cardano ledger evidence.
- Observation fixture ≠ authenticated production observation.
- Workflow green ≠ universal proof.
- A failed red-team test must not be “fixed” by weakening a normative rule.
- No red-team PASS is promoted to release certification without current-head evidence.


## 2026-09-23 — Concrete valuation attack found and closed at source

Attack: Genesis valuation used ceiling division when converting oracle-priced value into USDM subunits. A valuation fractionally below the 4,000 USDM threshold could therefore round upward to exactly the threshold and be admitted.

Concrete adversarial case:
- preQuantity = 1
- verifiedPreUsdmPrice = 3,999,999
- oraclePrecision = 10
- mathematical value = 399,999.9 USDM subunits
- previous ceiling result = 400,000 subunits → false admission

Fix: Genesis admission now uses conservative integer floor division. A hard lower-bound predicate may not round a sub-threshold value upward into eligibility.

Added regression coverage in GenesisTreasuryAdmission.test.ts. No threshold, price, or economic policy changed; only arithmetic boundary behavior was corrected to preserve the existing >= 4,000 USDM predicate.

Status: RT-1 valuation-boundary attack CLOSED at this arithmetic layer; broader executable-liquidity and oracle-surface attacks remain OPEN.


## 2026-09-23 — RT-1.5 executable-liquidity boundary audit

Current branch inspection confirms that EconomicGate already distinguishes EEV from immediate executable liquidity through `egiAvailableExecutableLiquidity` and checks `requiredImmediateLiquidity <= availableExecutableLiquidity`.

However, the gate input is an interface supplied by the authoritative observation/refinement layer; the universal kernel does not itself authenticate that available liquidity against a concrete spendable ledger surface. `EconomicAdmissionWitness` likewise carries EEV and an observation reference, but the adapter does not derive or independently bind executable liquidity.

Therefore RT-1.5 is **NOT CLOSED**. The semantic distinction exists, but provenance/binding from observed spendable UTxOs to the gate input remains an evidence and adapter-conformance gap.

No code change is made here because inventing a liquidity source or haircut would exceed the current normative sources.


## 2026-09-23 — RT-1.5 concrete Cardano observation surface identified

The current B1PrizePool validator provides the concrete ledger-side liquidity observation surface needed for the next binding step. For FundTreasury it recomputes PrizePool USDM liquidity from the actual continuing Pool UTxO value through Economic.poolUsdmValue and requires the datum ppTotalLiquidity to equal that recomputed value. The same validator preserves/updates the physical Pool UTxO atomically for Issue/Reveal/Claim/Expire, while Claim additionally computes the consumed Pool UTxO's actual USDM value and requires the observed pool-value delta to match settlement accounting.

This establishes an existing canonical source that can be reused: the authenticated singleton B1PrizePool UTxO plus its validated USDM valuation, rather than inventing a new liquidity oracle. It does **not** yet close RT-1.5 because EconomicAdmissionWitness does not currently bind its EEV/liquidity decision to the exact Pool UTxO reference and observed value used by the adapter transaction.

Next binding target: carry the exact Pool UTxO identity and observed executable USDM value through the economic-admission witness, and require the observation to correspond to the transaction's consumed Pool UTxO. Negative tests must reject a different Pool UTxO, stale/double-counted liquidity, and an observed value that differs from the authenticated Pool UTxO valuation. No new economic valuation rule is introduced.


## 2026-09-23 — RT-3 concrete economic side-door found: ticket issuance bypassed adapter admission

Inventory of economic mutators found `src/mint.ts::mintSerialNFT` constructing the canonical TicketIssued transaction (Counter + ticket mint + PrizePool state transition + Treasury payment) but submitting it through the generic Cardano adapter path. This was a concrete RF8 side door: the on-chain B1 validators protected the transaction, but the off-chain Economic Gate admission boundary was not mandatory for issuance.

Minimal hardening applied:
- `MintSerialOptions.economicAdmission` is now mandatory.
- `mintSerialNFT` now submits through `submitEconomic(...)`, so a missing/invalid admission fails closed at the adapter boundary.
- `buyTickets` no longer defaults to an empty options object; callers must provide the admission witness.

Commits: `ff778c30d1c64b7692dac75877d007829fa59cfe`, `f7d48278888c572aca755d714ac81091d6326b8d`.

This does not close RT-3 globally: Reveal/Claim/Expire already cross the economic adapter, while every remaining economic mutator still needs inventory and negative twins. Fresh CI is also required because the API was intentionally tightened and no workflow run is yet associated with these commits.


## 2026-09-23 — RT-1.5 admission witness strengthened (provenance metadata, not yet binding)

`EconomicAdmissionWitness` now requires two explicit fields: `executableLiquidity` and `executableLiquidityObservationReference`. The adapter rejects negative executable liquidity and an empty observation reference.

This is deliberately classified as an interface hardening only. It does **not** claim that the adapter has proved the observation corresponds to the exact Pool UTxO consumed by the transaction. That correlation remains the next required step. No liquidity haircut, valuation rule, or new economic source was introduced.

Commit: `8210d62a1029e6af85b4af8f127a469ce4eb8bb4`.


## 2026-09-23 — RT-1.5 candidate-input binding hardened

The executable-liquidity observation surface now has an explicit evidence-binding check against the concrete inputs of the candidate transaction. The EconomicAdmission witness cannot be accepted through the economic Cardano submission boundary unless every observed liquidity UTxO is among the transaction inputs supplied by the action path.

Applied on `work/immortal-green-closure`:
- `assertExecutableLiquidityBoundToInputs(...)` added to the observation boundary.
- `EconomicAdmission` now requires the candidate input-reference set.
- `CardanoExecutionAdapter.submitEconomic(...)` carries that set into admission validation.
- Mint, Reveal, Claim and Expire pass their concrete consumed UTxO references into the economic submission boundary.

This closes the previously identified **provenance-to-candidate-input binding layer** as an implementation hardening step. It does **not** close RT-1.5 release-wide: fresh negative-test evidence and current-head Cardano ledger evidence are still required, including rejection of stale/double-counted observations and mismatched authenticated Pool UTxO valuation.

No new economic valuation rule or haircut was introduced.

## 2026-09-23 — RT-3 action-boundary reconciliation

The current Green Closure implementation now routes all four identified economic state transitions — Issue, Reveal, Claim and Expire — through an explicit EconomicAdmission witness at the Cardano submission boundary. The remaining RT-3 work is therefore no longer the previously observed generic-submit side door for those four paths; it is the exhaustive mutator inventory, negative-twin coverage, and fresh CI/evidence proving that no additional economic mutator bypass exists.



## 2026-09-23 — RT-1.5 negative twins + source-set binding verified

Fresh conformance coverage now exercises both layers of the binding:
- a valid observation whose source UTxOs are consumed is accepted;
- an observation/source UTxO absent from candidate inputs is rejected;
- duplicated physical UTxOs are rejected;
- declared liquidity different from observed spendable UTxOs is rejected;
- a source set differing from the economic action source is rejected before signing.

The adapter-level Vitest suite is green on the current Green Closure line. C13 semantic conformance was also corrected to use Vitest's `describe/it` API and its workflow is now green.

Current classification:
- **RT-1.5 provenance/input binding: GREEN at the implementation + negative-test layer.**
- **RT-1.5 release-wide: OPEN**, pending the authenticated canonical Pool UTxO valuation equivalence and current-head ledger evidence.

## 2026-09-23 — P2.8-B.1 evaluator rechecked on current Green Closure

The current P2.8-B.1 emulator job still fails before producing a usable ledger-aligned ExUnits result. The observed failure is:
`Spend[0] execution went over budget`
with nonsensical negative residual Mem/CPU values.

This remains classified as an **evaluator/harness diagnostic**, not as a validator-semantic verdict. The P2.8 acceptance criterion still requires exact Plutus V2 artifacts plus ledger-aligned transaction context and either measurable ExUnits or a ledger-originated script failure. No economic invariant was changed in response to this evaluator failure.


## 2026-09-23 — RT-2 forged-observation mirror twins added

The Genesis stress lab now explicitly models the authenticated observation fields already enforced by the current carrier predicate: canonical PRE policy identity, canonical PRE asset identity, and canonical Oracle publisher identity. Added negative twins reject:
- wrong PRE asset;
- forged Oracle publisher;
- wrong PRE policy.

This is a mirror/instrumentation hardening only. It demonstrates that the scenario harness does not silently treat those fields as irrelevant, but it does not prove that a real reference-input UTxO carrying the oracle state is itself authoritative or unforgeable. RT-2.13 therefore remains OPEN at ledger authority level until a real adversarial ledger trace proves that the authenticated Oracle/Treasury references cannot be replaced by attacker-controlled state while preserving the required token identities.

Related implementation commits: 7896bb57f7f4bece265e4412324ec8bc0705ea20 and 8c372499f73e905d4801356685e5acf4984a2117.


## 2026-09-26 — RT-1.1 current-head arithmetic discrepancy corrected

A current cross-language inspection found that the PRE-GENESIS → GENESIS arithmetic was inconsistent: the TypeScript admission mirror used conservative integer floor division, while the on-chain/reference Haskell path used `ceilingDiv`. A fractional value just below the 4,000 USDM threshold could therefore round upward in the Haskell predicate.

Concrete witness:
`9,999,999 PRE × 40,000 / 1,000,000 = 399,999.96`.

The Haskell implementation has now been changed to integer floor division, and a regression vector asserts both the floored value and rejection of the fractional-below-threshold transition.

**Classification:** arithmetic discrepancy = **CORRECTED IN SOURCE; CURRENT-HEAD CI EVIDENCE PENDING**. The previous historical RT-1 closure entry is retained as history; it is not used to infer present conformance.


## 2026-09-26 — RT-1.5 status reconciliation

The current implementation has progressed beyond the older RT-1.5 table entry. The EconomicAdmission boundary now binds executable-liquidity evidence to: (1) the candidate transaction inputs, (2) the exact authenticated B1 PrizePool input reference, and (3) the authenticated Pool USDM valuation. The existing negative twins cover missing source inputs, duplicated physical UTxOs, mismatched declared liquidity and source-set mismatch.

Therefore the earlier **RT-1.5 OPEN** table entry is stale at the implementation layer. The current classification is:

- **RT-1.5 implementation/provenance binding: CLOSED / GREEN by code + negative tests**.
- **RT-1.5 release-wide: OPEN**, pending current-head Cardano ledger evidence and independent authenticated valuation/source evidence.

No new valuation formula, haircut or oracle source was introduced.
