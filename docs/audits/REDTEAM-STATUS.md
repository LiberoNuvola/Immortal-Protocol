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
| RT-1.5 | Non-executable liquidity | OPEN | Locked/wrong-policy/non-spendable value excluded from executable liquidity |
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
