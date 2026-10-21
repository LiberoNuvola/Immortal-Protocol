# PRE-RICH — White Paper

> **Scope:** PRE-RICH application orientation only. It does not define universal IMMORTAL semantics. Universal authority: `../docs/00-normative/`; application policy: `../PRE-RICH/docs/`.

**Open Protocol for Transparent, Programmable and Resilient Economic Systems**

**Version:** 0.6.1 — Release Candidate
**Date:** September 2026
**Status:** Research / Active Development — Open-Source Candidate — Not Mainnet-Ready

> **Implementation status:** for the distinction between documented rules, implemented behavior, and verified evidence, see the [Conformance and Gap Matrix](03-audit/CONSTITUTION-GAP-MATRIX.md) and the [Constitution Gap Matrix](03-audit/CONSTITUTION-GAP-MATRIX.md).
>
> The Conformance Matrix tracks implementation evidence; it does not create or modify economic policy.

> **PRE-RICH is an open protocol to be extended, not a product to be copied. Scratch & Win is its first implementation.**

## Project Status at a Glance

| Area | Current status |
|---|---|
| Constitutional / normative economic baseline | **Closed; only the explicitly listed policy set remains open** |
| B1 architecture | **Substantially implemented** |
| Cryptographic core | **Final validation** |
| State-machine conformance | **In progress** |
| Economic implementation conformance | **Open / closing** |
| Issue admission | **Authority-backed; permissionless conformance open** |
| First real Issue transaction | **Not verified; settlement builder/body conformance open** |
| Multi-asset ticket settlement | **USDM-denominated rule defined; current Oracle/builder path incomplete** |
| B3 / canonical Beacon | **Target / in progress** |
| Independent external security audit | **Not completed** |
| Mainnet | **Not ready** |

> Open-source publication and mainnet readiness are separate milestones.

## Protocol at a Glance

| Element | Current baseline / status |
|---|---|
| Canonical economic unit | USDM |
| Ticket classes | 1 / 2 / 3 / 5 / 10 / 25 / 50 / 100 USDM |
| Genesis | 1 USDM; verified PRE bootstrap threshold >= 4,000 USDM |
| Maximum normal payout | 500 × ticket price |
| Accounting | Liability / protection-first |
| Sale | Atomic issuance + payment + unresolved reservation |
| Result | Deterministic from verified inputs |
| Claim | Frozen payout is not recalculated |
| Expiry | Expired economic right is extinguished; late reveal cannot create claim/liability |
| Current Beacon | B1 — Authorized Publisher |
| Target Beacon | B3 — publisher-independent canonicality |
| Mainnet | Not ready |

## Documentation Map

This White Paper is the orientation layer. It explains the protocol without overriding normative sources.

Recommended reading:

- **New to PRE-RICH:** White Paper → Constitution → Game Economy → Game Economy Specification
- **Economic Algorithm:** White Paper → Game Economy → Game Economy Specification → Economic Algorithm → Conformance Matrix
- **Implementation audit:** Constitution → specifications → Gap Matrix → architecture → implementation → tests/evidence
- **Contribute:** README → CONTRIBUTING → relevant specification → implementation → tests

Core documents:

1. `docs/00-normative/01_CONSTITUTION_FINAL.md`
2. `docs/00-normative/02_UNIVERSAL_ECONOMIC_MODEL.md`
3. `docs/00-normative/03_ECONOMIC_KERNEL_FINAL.md`
4. `docs/00-normative/04_STATE_TRANSITION_SPECIFICATION.md`
5. `docs/00-normative/05_INVARIANTS_CONSERVATION_FINAL.md`
6. `docs/00-normative/07_CONFORMANCE_SPECIFICATION_FINAL.md`
7. `PRE-RICH/docs/GAME-ECONOMY.md`
8. `PRE-RICH/docs/PRE-RICH-COMPLETE-SYSTEM-SPECIFICATION.md`
9. `docs/03-audit/CONSTITUTION-GAP-MATRIX.md`
10. `docs/03-audit/BEACON-CLOSURE-MATRIX.md`

> **Documentation principle:** the White Paper explains; normative documents define; the implementation realizes; tests and proofs provide evidence.

## Abstract

PRE-RICH is an open-source protocol framework for designing economic systems whose important rules can be expressed explicitly, inspected publicly and enforced through deterministic state transitions.

The project starts from a concrete Cardano implementation, **Scratch & Win**, as a laboratory for solvency, liability management, deterministic outcomes, non-custodial settlement and resistance to discretionary intervention.

The long-term objective is broader than the first application: reusable economic and verification primitives for other applications and participation models.

> **Economic truth should derive from verifiable rules and evidence, not from discretionary authority.**

## 1. Problem

Many digital economic systems depend on trusted operators for determining outcomes, maintaining balances, validating payments, calculating liabilities, deciding solvency, publishing external data or resolving disputes.

PRE-RICH instead makes important economic rules protocol-visible and seeks to make their enforcement independently inspectable.

The desired progression is:

**Trust the operator → Inspect the rules → Inspect the state → Verify the transition → Verify the evidence**

## 2. Design Objective

PRE-RICH aims to be:

- **Transparent** — rules and state transitions are inspectable.
- **Deterministic** — authenticated equivalent inputs produce equivalent results.
- **Solvent** — liabilities and protected capital are accounted for before new exposure.
- **Non-custodial** — users retain control except where an explicitly specified transition moves value.
- **Resistant to discretionary authority** — frontend/backend/relayer components cannot redefine economic truth.
- **Extensible** — applications can be added without recreating the protocol core.
- **Auditable** — normative claims are traceable to implementation and evidence.

## 3. Constitutional Model

The hierarchy is:

**CONSTITUTION → SPECIFICATIONS → IMPLEMENTATION → TESTS / PROOFS**

A lower layer cannot silently override a higher layer.

An implementation gap does not reopen a settled economic decision. If the normative rule is closed, implementation is the migration target unless a new explicit decision changes the rule.

## 4. Economic Authority

Protocol-controlled state and verifiable evidence are the intended economic authority.

A browser, backend, relayer, database, API endpoint or external provider is not economic authority by itself.

These components may observe state, transport data, construct transactions or submit evidence. The protocol determines whether evidence is valid.

### B1

Scratch & Win currently uses an **Authorized Publisher** model. B1 therefore retains an explicit Beacon trust assumption.

### B3

B3 is the target publisher-independent canonical Beacon architecture. A proof of concept is not equivalent to achieved canonicality.

## 5. First Implementation: Scratch & Win

Scratch & Win is the first concrete PRE-RICH implementation on Cardano.

It uses, as applicable:

- native assets / NFT tickets;
- commit-reveal;
- deterministic outcome derivation;
- Beacon-based randomness;
- on-chain state transitions;
- liability-first accounting;
- non-custodial claims;
- protocol-controlled settlement.

Simplified lifecycle:

**SALE → COMMIT → REVEAL → CRYSTALLISE → CLAIM**

Expiry and invalid/late transitions are constrained by protocol rules.

## 6. Commit-Reveal

Commit-reveal separates commitment from revelation.

The player commits before the relevant result can be known. At reveal, the protocol validates the commitment and combines authenticated inputs with the validated Beacon and ticket identity.

Security depends on the actual binding enforced by the protocol transition, not merely on frontend behavior.

## 7. Deterministic Outcomes

The result is derived from authenticated inputs rather than selected by an operator.

The derivation determines symbols, tier and payout. The payout is crystallised at reveal and becomes immutable.

**result determination → economic crystallisation → later claim**

Claim validates an established right rather than recalculating the game.

## 8. Canonical Economic Unit

The canonical economic unit is **USDM**.

It is the reference for:

- ticket price;
- prize value;
- thresholds;
- exposure;
- reserve;
- protected capital;
- pending liabilities;
- Jackpot;
- class activation.

Other assets may be used through verified conversion.

## 9. Economic Classes

The canonical ladder is:

**1 / 2 / 3 / 5 / 10 / 25 / 50 / 100 USDM**

Genesis is 1 USDM.

The current safe class is derived from verified economic state, not administrator choice.

`CurrentActiveClass` may contract.

`HighestClassEverActivated` is monotonic and is not retroactively erased.

## 10. Exposure and Solvency

PRE-RICH distinguishes statistical risk modelling from deterministic protection.

Reference statistical model:

`UnresolvedReserve(N) = N × μ + Z × σ × sqrt(N)`

Deterministic worst-case exposure:

`WorstCaseExposure(P,N) = 500 × P × N`

Statistical reserve estimates risk; deterministic limits constrain protocol exposure.

## 11. Liability-First Accounting

The conceptual effective pool is:

`EffectivePool = TotalLiquidity − PendingWinningLiabilities − UnresolvedTicketReserve − LockedJackpotLiquidity`

The canonical protected-capital boundary is:

`RawSurplus = max(0, EEV − ProtectedCapital)`

and the protected-obligation invariant includes:

`PendingWinningLiabilities + UnresolvedTicketReserve + LockedJackpotLiquidity ≤ TotalLiquidity`

Committed value must not be counted again as freely distributable value.

## 12. Safety Circuit Breaker

The contraction sequence is:

**100 → 50 → 25 → 10 → 5 → 3 → 2 → 1 → HALT**

Suspension affects new sales only.

The hysteresis **semantic principle is CLOSED** and:

- KA = 8
- KC = 4
- KD = 4

Any remaining quantitative validation or implementation conformance is not a semantic reopening.

## 13. Sale Atomicity

A valid sale binds:

**ticket mint + payment + PrizePool reservation**

atomically or through an equivalent on-chain mechanism that prevents unreserved issuance.

### 13.1 Economic denomination versus settlement asset

The ticket's **economic price is denominated in USDM**. This is a unit-of-account decision, not a requirement that the buyer hold or transfer USDM itself.

A deployment may permit payment in ADA, PRE, NIGHT or another asset only when that asset is explicitly supported by the deployment's authenticated price-reference contract and the on-chain calculation proves that the actual Treasury output has the required USDM-equivalent value. A permitted settlement basket would require every constituent asset to be independently priced and the entire conversion contract to be supported by the transaction's authenticated reference inputs. This paper does not imply that every example asset, or every combination of them, is already enabled in the current implementation.

The current Plutus sale invariant is exact equality, not a loose lower bound:

```text
Economic.totalUsdmValue(actualTreasuryOutput, authenticatedOracleReferences)
    == pdPriceUsdm
```

A missing, mismatched, unauthorized, negative or stale asset price must not be replaced with an assumed market quote. The ADA path has a specific economic-quantity adjustment for the configured minimum-UTxO amount. Integer precision and rounding are part of the on-chain conversion contract. The Adapter/builder may propose a settlement quantity, but the ledger-side predicate remains decisive.

The currently implemented Oracle representation imposes an additional limit: `OracleDatum` carries one exact asset policy/name, and the MintPolicy is parameterized with one Oracle State singleton identity. `Economic.totalUsdmValue` iterates every nonzero asset in the Treasury `Value` and calls the asset-specific oracle lookup before applying the ADA minimum-UTxO exclusion. Thus a token settlement output also holding ADA for its minimum UTxO needs valid, matching price entries for both ADA and that token. The current single-asset datum/singleton path does not establish that a PRE+ADA or NIGHT+ADA basket can be valued within one transaction. Do not describe such baskets as enabled until the quote-set/reference-input contract and its on-chain validation are formally designed and tested.
Settlement value and EEV perimeter are different concepts. Accepting PRE, NIGHT or ADA into Treasury does not automatically make those assets eligible as directly verified USDM liquidity for the PRE-RICH `PRE-RICH-EEV-USDM-DIRECT-V1` profile. That profile's qualified pool-value perimeter remains the canonical USDM physically present in the exact qualified B1 PrizePool UTxO unless a new normative decision explicitly changes it.

### 13.2 Current Issue implementation gap — not a successful-sale claim

The current working-branch builder requests a Treasury output with a fixed 1,000,000 lovelace amount through TICKET_PAYMENT_LOVELACE. The locked lucid-cardano dependency is version 0.10.11: the application supplies this explicit value to payToContract and calls complete(); the application code does not derive a settlement quantity from the USDM target or validate the completed transaction body's Treasury value against the canonical economic conversion before signing. No successful completed/signed Issue transaction establishes the final output value.

The Plutus conversion code sets minUtxoLovelace = 1,600,000 and values ADA using:

```text
economicAdaLovelace = max(0, outputAdaLovelace - minUtxoLovelace)
```

For an ADA-only Treasury value equal to the amount requested by the builder, the canonical valuation function returns:

```text
max(0, 1,000,000 - 1,600,000) = 0
valuedTreasuryOutput = 0 USDM sub-units
requiredGenesisPrice = 100 USDM sub-units
```

Therefore, if the requested ADA-only value is also the value in the final Treasury output, it contributes zero economic ADA value and cannot satisfy the positive exact-equality price check. If transaction completion rejects the under-minimum output or produces another final value, that must be observed and measured, not assumed. The proven conclusion is that the current builder has no explicit, tested, price-derived settlement construction or final-body settlement conformance check. This is an implementation/conformance gap, not a reason to relax the on-chain rule.

The current oracle datum is also a single-asset `OracleDatum`, and the DApp builder binds one configured Oracle State singleton. Consequently, multi-asset settlement combinations, and production support for PRE/NIGHT as individual payment choices, must not be reported as implemented until the reference-input/price-source representation, supported asset profile and builder are shown to provide the necessary authenticated quotes for the exact transaction. PRE/NIGHT acceptance additionally depends on qualifying the relevant asset-specific price-reference source.

**Paper consequence:** do not submit a real purchase simply to create a “first ticket” milestone under this builder. First repair and verify the settlement construction against the unchanged exact-value validator; otherwise the attempted transaction would not be evidence of a valid Issue implementation.

## 13.3 Issue authority boundary and honest evidence classification

The current Issue path is **not yet fully permissionless**. The V3 carrier validator requires a signature from its configured authority key, while an external signed admission envelope supplies economic evidence inputs that the on-chain sale validators do not independently reconstruct in full. The user's wallet signature authorizes the user's spend; it does not substitute for the economic gate.

### 13.4 Reference Issue delta versus on-chain enforcement

The existing reference transition in `IMMORTAL/kernel/EconomicTransitionV3.hs` already defines the Issue delta; it must not be re-invented for this paper. Under the canonical PRE-RICH profile, an accepted `Issue(classId, price)` requires the profile's exact price for that class and the existing class-saleability predicate. Its state delta is:

```text
v3UnresolvedReserve     += price
v3UnresolvedTicketCount += 1
targetClass.issued      += 1
targetClass.unresolved  += 1
targetClass.exposure    += price
```

Other class entries, crystallized liabilities, safety capital, reserve protection, mandatory future costs, control history and Jackpot state remain unchanged by this Issue transition. The reference transition also applies its existing pre/post conservation, non-negativity, profile and control-history checks. The separate Economic Admission function checks the candidate projected state against verified-truth, freshness, obligation-completeness, EEV, immediate-executable-liquidity and certified-Ω predicates.

These are **reference/Haskell decision semantics**, not proof that the Cardano ledger enforces the complete relation. The current V3 carrier datum/redeemer path does not provide the validator with independently decoded Issue class/price coordinates from which to recompute the delta; it validates state endpoints and a signature over the supplied action fingerprint. The signature's existence does not demonstrate that the fingerprint is the canonical hash of the actual permitted Issue delta. MintPolicy and B1 enforce their respective atomic sale/payment/reservation invariants, but do not independently close this V3 state-transition gap.

Accordingly, the paper may state that a canonical reference Issue transition and Economic Admission composition exist in Haskell, while marking **on-chain refinement of the exact Issue delta and authentication of all gate inputs as open implementation-conformance obligations**. The permissionless claim requires those obligations to be closed with adversarial evidence; removing only the signature check would be an unsafe weakening, not conformance.

A successful Issue transaction under that authority-backed model could be useful as a narrowly scoped Adapter/ledger integration experiment only after the actual settlement-value mismatch has been fixed. It would not, by itself, demonstrate permissionless execution, complete economic-gate equivalence, source-authenticity closure or full viability certification.

The current evidence should be classified as follows:

| Claim | Status suitable for publication |
|---|---|
| USDM is the ticket's economic unit of account | Defined by the PRE-RICH specification |
| Treasury intake must equal the ticket price under authenticated conversion | On-chain predicate exists; current builder is not conformant to it |
| Counter, ticket NFT, Pending PrizeDatum, payment and B1 reservation are composed into one candidate transaction | Implemented construction; a passing current end-to-end Issue transaction is not established |
| Current Issue is permissionless / external authority is unnecessary | **Not established; current V3 signature makes the path authority-dependent** |
| Full IMMORTAL Economic Gate / viability is equivalent to the Cardano transition for all relevant states | **Open conformance obligation** |
| Full ticket lifecycle is independently verified on a current Preprod transaction | **Not established** |

This status boundary is consistent with the universal IMMORTAL paper's evidence ladder: design, mathematical proof, model checks, implementation tests, audit and deployment evidence are separate classes. A source file or an off-chain decision result must not be promoted to a stronger claim than its actual evidence supports.

### 13.5 Integer conversion and rounding boundary

The phrase “exact USDM-equivalent value” needs a precise numeric domain. The current Plutus `Economic.totalUsdmValue` does not compare an unrounded rational exchange value with the ticket price. It converts each nonzero asset entry with `ceilingDiv(amount × oraclePrice, precision)` and sums those integer USDM sub-unit results; `MintPolicy` then compares that integer sum for equality with `pdPriceUsdm`.

This is deterministic integer-valued behavior, but equality after upward rounding is not the same proposition as equality of the underlying unrounded economic quantities. For example, with a **synthetic test quote only** of 100 USDM sub-units per ADA and precision 1,000,000:

```text
minUtxoLovelace = 1,600,000
output ADA = 2,600,000  -> economic ADA = 1,000,000 lovelace
raw conversion = 1,000,000 × 100 / 1,000,000 = 100
ceiling result = 100 USDM sub-units

output ADA = 2,599,999  -> economic ADA = 999,999 lovelace
raw conversion = 999,999 × 100 / 1,000,000 = 99.9999
ceiling result = 100 USDM sub-units
```

Both values map to the same integer target, even though their raw conversion differs. This example is a unit-test vector, not a claim about a live ADA price. For a value represented as the sum of separately rounded assets, the possible upward adjustment can accumulate across asset entries.

Therefore the paper may accurately claim **exact equality of the current canonical integer conversion result**. It must not claim exact equality of an unrounded economic amount for arbitrary asset/price domains unless the PriceReference contract, asset granularity and a bounded conversion-error policy justify that stronger statement. The existing PriceReference/rounding analysis leaves the general bounded-conversion rule open. No rounding direction, tolerance or numerical bound is invented here.

The Haskell conformance tests now isolate three relevant outcomes: the requested 1,000,000-lovelace value maps to zero after ADA minimum-UTxO exclusion; a positive synthetic ADA amount can map exactly to the 100-sub-unit target; and a one-lovelace-short amount rounds upward to the same integer result under current `ceilingDiv`. They test the actual Plutus valuation function, not the full MintPolicy or a completed Lucid transaction.

## 14. Treasury

The intended direction is:

**PLAYER → PROTOCOL TREASURY → PROTOCOL-CONTROLLED CATEGORIES**

No team/founder/developer/administrator receives an automatic personal economic entitlement.

The historical 75/10/10/5 allocation is non-canonical.

## 15A. First-Class Adaptive Mechanisms

The current PRE-RICH architecture contains explicit application mechanisms that operate inside the economic space made safe by IMMORTAL. They are not hidden implementation details.

| Mechanism | Role | Boundary |
|---|---|---|
| **AWRA — Adaptive Win Rate Algorithm** | Adapts winning-rate / payout behaviour within available application surplus and the authorized ruleset. | Cannot consume protected capital, bypass Economic Gate / viability, or define its own economic authority. |
| **Treasury Allocation Policy** | Chooses how residual application value is routed among permitted destinations. | Historical fixed splits such as 75/10/10/5 are non-canonical. |
| **Adaptive Asset / Liquidation Policy** | Chooses among safe asset-management actions such as HOLD, SALE, LIQUIDATE or REBALANCE. | Preference is evaluated only after economic feasibility and `A_safe`; no universal asset-ranking rule is implied. |
| **Jackpot Policy** | Manages the application-specific jackpot lifecycle. | Locked Jackpot remains protected; funding and payout remain subject to the economic boundary. |
| **Game Outcome / Randomization** | Produces the application result from canonical rules and randomness/evidence. | Unverified or player-supplied data cannot become economic authority. |

The boundary is:

```text
IMMORTAL Economic Gate / Viability
              ↓
           A_safe
              ↓
     PRE-RICH policy/mechanism
              ↓
       Cardano Adapter
              ↓
            Ledger
```

For AWRA specifically, the current repository has recovered and reproduced the historical static candidate machinery against the current Classic-6 model and recovered the historical dynamic risk-envelope lineage. The exact final optimizer, objective, cadence, alpha/budget fraction and dynamic selector remain application-policy work.

## 15. PrizePool and Jackpot

PrizePool tracks liquidity, unresolved reservations, pending liabilities, locked Jackpot liquidity and class state.

The Jackpot is separately locked/protected.

Funding is limited by:

`NewJackpot <= RawSurplus`

Payout is limited by:

`JackpotPayout <= LockedJackpotLiquidity`

No fixed JackpotAllocationRate is canonical by default.

The Jackpot payout mode is closed at the current PRE-RICH policy level: full current locked-balance payout exactly once.

## 16. Expiry

Expiry is an economic boundary.

After `expiresAt`:

- the economic right is extinguished;
- no claim may be created;
- no new liability may be created;
- the unresolved reserve is released exactly once;
- the expired payment commitment dissolves;
- a late reveal cannot create claimability or liability;
- a late reveal cannot resurrect the expired right.

The expiry mechanism is closed: the horizon is deterministically derived at issuance under `preRichExpiryPolicyV1` and crystallized into `expiresAt`; V1 bounds are 2 hours minimum / 300 days maximum and are application parameters, not IMMORTAL constants.

## 17. Non-Custodial Claims

Claim verifies an already-crystallised right and settles its frozen value to the rightful current owner.

The payout is not recalculated from mutable pool conditions.

Claim does not require NFT burning.

## 18. Randomness and Beacon Architecture

B1 uses an authorized publisher and Beacon Registry.

B3 aims for stronger publisher-independent canonicality through stronger evidence and finality.

The project separates proof-of-concept work, B1 operation and B3 target architecture.

## 19. Economic Algorithm

The Economic Algorithm is the formal execution layer between normative policy and implementation.

It specifies authoritative inputs, preconditions, deterministic calculations, postconditions, fail-closed conditions and proof obligations.

The canonical authority chain is:

```text
CONSTITUTION
      ↓
GAME ECONOMY
      ↓
GAME ECONOMY SPECIFICATION
      ↓
ECONOMIC ALGORITHM
      ↓
IMPLEMENTATION
      ↓
TESTS / PROOFS / EVIDENCE
```

## 20. Verification Philosophy

PRE-RICH distinguishes:

- reference-model validation;
- unit/property tests;
- adversarial tests;
- validator/on-chain evidence;
- integration evidence.

A TypeScript mirror test is not by itself proof of Plutus enforcement.

## 21. Current Development State

As of September 2026:

- normative economic semantics are **CLOSED**;
- implementation conformance remains **OPEN / CLOSING**;
- B1 remains the current operational Beacon model;
- B3 remains a target;
- independent external security audit is not completed;
- the project is **not mainnet-ready**.

Known implementation/evidence gaps include autonomous operational liveness consolidation, transition conformance, quantitative hysteresis validation, expiry conformance, Jackpot conformance and other previously identified implementation gaps; these are not policy openings.

These gaps do not reopen the frozen economic semantics.

## 22. Open-Source Model

PRE-RICH is organized conceptually as:

- Constitutional Core;
- Protocol Core;
- Extensions;
- Applications.

Scratch & Win is the first application.

## 23. Roadmap

The roadmap separates:

- open-source foundation;
- Scratch & Win release-candidate conformance;
- mainnet readiness;
- B3 evolution;
- long-term protocol extensions.

Publishing the repository does not imply mainnet readiness.

## 24. Status Vocabulary

- **CLOSED** — normative decision is settled.
- **CLOSING** — implementation/evidence is being brought into conformance.
- **IMPLEMENTED / VERIFIED** — implemented and supported by required evidence.
- **IMPLEMENTATION GAP** — specified behavior is not fully enforced.
- **TARGET** — intended future architecture.
- **EXPERIMENTAL** — research/reference work, not normative.
- **HISTORICAL** — retained for traceability, not current authority.
- **OPEN** — genuinely unresolved decision or requirement.

## 25. What PRE-RICH Does Not Claim

PRE-RICH does not claim:

- that B1 is equivalent to B3;
- that proof-of-concept work is production verification;
- that statistical reserve parameters are absolute guarantees;
- that the current repository is mainnet-ready;
- that implementation gaps are already solved;
- that future extensions are implemented;
- that the protocol guarantees financial returns.

## 26. Conclusion

PRE-RICH asks which economic facts a system can verify for itself rather than merely who operates it.

The framework separates constitutional principles, specifications, implementation and evidence so that implementation gaps can be identified without silently changing protocol meaning.

Scratch & Win is the first laboratory in which these principles are made concrete.

**Build with PRE-RICH, rather than rebuilding PRE-RICH.**

## Documentation Authority

For implementation-level truth:

1. Constitution / Decision Register
2. Canonical economic specifications
3. Economic Algorithm
4. Architecture specifications
5. Implementation
6. Tests / proofs / evidence
7. Gap Matrix
8. Experimental and historical material

This White Paper is explanatory and does not override normative sources.

## Document Set Alignment

This White Paper belongs to the aligned document set including:

- Economic Algorithm v0.3.1
- Economic Algorithm Conformance Matrix v0.1.1

Conformance is tracked by the IMMORTAL and PRE-RICH conformance specifications together with `docs/03-audit/CONSTITUTION-GAP-MATRIX.md`. Historical conformance matrices remain under `docs/archive/` and are not current authority.

## Disclaimer

This document reflects the PRE-RICH documentation state as of September 2026. It does not constitute an offer, financial advice, or a guarantee of future performance, completeness or mainnet readiness. The software remains under active development.
