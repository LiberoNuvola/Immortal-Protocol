# Agent A — B1 Direct-USDM CEK + EV3 test-execution specification

**Date:** 2026-11-15  
**Audited source HEAD:** `ec0f56429c291b59167bf49886dfcc7814d9c693`  
**Branch:** `work/immortal-green-closure`  
**Classification:** TEST-ONLY SPECIFICATION / ADVERSARIAL CHARACTERIZATION PLAN — NOT EXECUTED, NOT AN IMPLEMENTATION CHANGE  
**Owners proposed:** Agent A (economic/direct-EEV acceptance criteria); Agent B (Plutus CEK harness, script boundary and transaction-context review).  
**Purpose:** turn findings in coordination §§46.06–46.09 into reproducible, predicate-isolating EV3 and compiled-Plutus tests.  
**Non-effects:** this document only. No validator, policy, test, source helper, cabal stanza, workflow, ABI, economic parameter, V3/Reveal semantics, wallet, transaction or ledger state changed.

## 1. Decision and scope boundary

This specification defines a **test-only slice**. It does not grant authority to modify the Plutus validators, MintPolicy, B1 redeemer set, deployed scripts, transaction builders, or economic rules.

The first phase is a characterization of the current code: where the code is expected to accept a counterexample, the test must record that acceptance as an **OBSERVED GAP**, not report it as a safety PASS. A later closure phase may invert the negative test's expected result only after an explicit predicate/design is approved and implemented.

Do not:

- change `EconomicTransitionV3`, V3 action constructors or V3 carrier ABI;
- change Reveal generation, beacon semantics, or payout calculation;
- change the 500× rule, face-price ladder, protected-capital model, or USDM unit conversion;
- silently impose a new oracle peg/price floor;
- disable or rewrite Claim, Expire, FundTreasury, ticket ownership or NFT burn semantics;
- run an EEV deployment approval, bootstrap, wallet signing or Preprod transaction as part of CEK tests.

## 2. Sources and verified harness entry points

### 2.1 Direct-USDM profile and EV3 producer

- `Adapter/CARDANO/observation/DirectUsdmEev.ts` defines the runtime profile and conversion.
- `Adapter/CARDANO/observation/PreprodDirectUsdmObservation.ts` resolves one exact live Pool UTxO and calls the strict observer with only Pool NFT and ADA as non-economic envelope units.
- `Adapter/CARDANO/observation/PreprodAuthoritativeIssueProvider.ts` uses that observer before requesting signed Issue authority.
- `audit/cardano-integration/preprod-direct-usdm-source-set.mjs` is the separate EV3 source-set producer.
- `audit/cardano-integration/preprod-direct-usdm-source-set.test.mjs` currently tests rejection of an unapproved tUSDM unit, not a foreign positive asset mixed into a Pool.
- `audit/cardano-integration/preprod-direct-usdm-qualification.mjs` hashes EV1–EV7 source bytes and binds the source-set data to the qualification record.

### 2.2 Compiled Haskell CEK harness

- `plutus/test/B1RevealHeadroomTest.hs` already applies the actual compiled `B1PrizePool.compiledValidatorFactory` and contains a shared-TxInfo dual-CEK Reveal helper. Its current `makeRevealContext` uses the same constant `poolValue` for input and output, so it does not vary the Pool Value.
- `plutus/test/EconomicOracleTest.hs` contains synthetic `OracleDatum` and `OracleQuoteSet` fixtures, including the exact authenticated singleton/reference-input shape and publisher/timestamp handling.
- `plutus/test/MintPolicyB1ValuePreservationTest.hs` applies the actual compiled MintPolicy and already characterizes full Pool Value preservation for Issue.
- `plutus/pre-rich-plutus.cabal` has the test-suite registration pattern and dependencies for `plutus-tx-testlib`.
- `.github/workflows/immortal-haskell-conformance.yml` runs the Haskell test suites; `.github/workflows/preprod-eev-qualification.yml` is the read-only EV1–EV7 qualification workflow.

The compiled CEK layer is the correct first gate to isolate script predicates. A CEK result is **not** a Cardano ledger transaction or a Preprod result.

## 3. Canonical units for all fixtures

The Direct-USDM conversion is:

```text
direct RU = floor(tUSDM_atomic × 100 / 1,000,000)
1 tUSDM  = 100 RU
1 RU     = 10,000 tUSDM atomic units
```

The Plutus Oracle valuation fixture uses `precision = 1,000,000` and `ceilingDiv(amount × quotePrice / precision)`. These are deliberately different functions. The test must not assume an Oracle quote for the tUSDM unit is fixed to the Direct-USDM unit conversion: current `oraclePriceFor` checks singleton identity, publisher, timestamp and non-negative price, but does not enforce that price = 100 RU per 1,000,000 atomic units.

All numbers below are protocol USDM sub-units (RU), unless explicitly labelled atomic tUSDM.

## 4. EV3 source-set basket tests

### 4.1 Required canonical basket boundary

For the approved `PRE-RICH-EEV-USDM-DIRECT-V1` profile, the positive Pool basket is limited to:

- the exact configured Pool singleton unit, quantity exactly 1;
- the exact specification-approved tUSDM unit, quantity strictly positive;
- ADA/lovelace as the Cardano output envelope.

Every other positive native-asset unit is unqualified and must fail closed. The full observed basket must be committed to source-set evidence; recording only the tUSDM unit and amount is insufficient to reproduce the basket check.

A reusable canonical basket representation should contain:

```text
{
  poolOutReference,
  poolAddress,
  lovelaceQuantity,
  positiveAssets: [{ unit, quantity }],
  basketDigest
}
```

Canonicalization requirements: lowercase hex units; integer quantities represented without floating point; sort units lexicographically before hashing; reject duplicate unit records rather than allowing object overwrite; retain the exact Pool reference and snapshot/tip provenance in the parent source-set artifact.

This representation is a test/evidence requirement, not a new on-chain datum or an ABI proposal.

### 4.2 Required EV3 unit-test matrix

A deterministic pure helper should be tested directly, without network access or a real Koios call.

| Case | Input basket | Expected result after EV3 closure |
|---|---|---|
| EV3-POS-01 | ADA + Pool singleton=1 + approved tUSDM>0 | PASS; returns canonical full basket and digest |
| EV3-NEG-01 | EV3-POS-01 + any positive foreign native asset | REJECT |
| EV3-NEG-02 | tUSDM absent or quantity 0 | REJECT |
| EV3-NEG-03 | Pool singleton absent, 0 or quantity >1 | REJECT |
| EV3-NEG-04 | Negative quantity / malformed Koios asset record | REJECT |
| EV3-NEG-05 | Duplicate policy/name unit in asset list | REJECT; no last-write-wins |
| EV3-NEG-06 | Invalid policy hex, odd asset-name hex, or asset name over Cardano's 32-byte limit | REJECT |
| EV3-NEG-07 | Duplicate exact Pool out-reference in address response | REJECT |
| EV3-NEG-08 | Exact Pool out-reference no longer live | REJECT |
| EV3-INT-01 | Same basket records in different input order | Same canonical basket digest |
| EV3-INT-02 | Basket quantity or unit changes by one value | Basket digest changes |
| EV3-INT-03 | Tampered basket digest/source-set content | Integrity verification rejects |

The tests must also retain the existing invalid-`PREPROD_TUSDM_UNIT` identity test. It must not be replaced by the new basket tests.

### 4.3 Current baseline characterization

At the audited HEAD, `preprod-direct-usdm-source-set.mjs` decodes the whole Koios asset list but only checks the Pool singleton and tUSDM quantity before creating a source-set record. It does not scan all positive assets or persist a full asset basket. The new foreign-asset fixture is therefore expected to expose the gap: the current producer can emit `OBSERVED_NOT_QUALIFIED` source-set evidence for a basket the runtime observer would reject.

The existing runtime observer's positive and foreign-asset negative test must be run alongside EV3 tests, proving that the Issue-time path is strict while the EV3 producer baseline is not.

### 4.4 Qualification / approval integrity follow-through

After the EV3 producer is deliberately repaired in a future authorized source-only slice:

1. include the complete canonical basket and its digest in the source-set evidence;
2. make EV3 qualification bind that exact basket digest and verify the source-set artifact's own integrity;
3. add negative integrity twins for missing, altered or recomputed-but-unapproved asset basket evidence;
4. rerun read-only source qualification for the same live Pool UTxO and verify it remains `OBSERVED_NOT_QUALIFIED` at source-set stage / `qualified` at EV1–EV7 stage, with deployment approval still pending unless a separate protected approval is explicitly invoked;
5. never reuse the historical October approval as if it approved changed EV3 source bytes or a changed basket schema.

Changing the EV3 source file changes its EV3 source digest. That necessarily invalidates an old EV1–EV7 qualification digest until a new qualification is generated. It does not authorize running the protected deployment-approval workflow.

## 5. Compiled CEK transition characterization

Proposed new test file: `plutus/test/B1DirectUsdmTransitionCharacterizationTest.hs`.

Use the actual compiled `B1PrizePool.compiledValidatorFactory`. Reuse the Oracle fixture pattern in `EconomicOracleTest.hs` for all actions that call `poolUsdmValue`. The test should build one coherent `TxInfo` per case, isolate the B1 Pool input/output `Value` mutation, and assert both the script result and the independently computed Direct-USDM delta.

A passing CEK result for an adversarial fixture is reported as `OBSERVED_GAP_ACCEPTED_BY_CURRENT_VALIDATOR`, not as a protocol PASS.

### 5.1 Reveal — current Pool Value decrease is not checked

Fixture:

- pre Pool datum: `ppTotalLiquidity=1000`, `ppPendingLiabilities=0`, `ppUnresolvedReserve=1`, `ppUnresolvedTicketCount=1`, `ppLockedJackpot=0`;
- ticket price (P=1) RU;
- valid loss Reveal (Y=0), using the already validated loss secret/commitment fixture in `B1RevealHeadroomTest.hs`;
- post datum: liquidity 1000, liabilities 0, unresolved reserve 0, count 0;
- input Pool tUSDM: 10,000,000 atoms = 1000 RU;
- output Pool tUSDM: 4,990,000 atoms = 499 RU;
- Pool singleton unchanged; no other native asset change; PrizeDatum input/output Value unchanged.

Exact calculation:

```text
ΔProtectedCapital = Y - 500P = -500 RU
ΔEEV_direct       = 499 - 1000 = -501 RU
Required QNE      = ΔEEV_direct >= -500 RU
Counterexample    = -501 < -500
```

Current-source expectation: the B1 compiled validator's TicketRevealed branch has no full Pool Value equality or direct tUSDM delta check. Its datum and solvency predicates do not account for this output Value change. The shared PrizeValidator Reveal path checks PrizeDatum Value preservation and Pool datum accounting, not the Pool's full physical Value. A dual-CEK test using the valid Reveal fixture should therefore characterize whether both consumers accept this exact changed Pool Value.

Required controls:
- unchanged Pool Value, valid loss Reveal: accepted;
- unchanged Pool Value, valid maximum payout Reveal at exact WCE: accepted;
- changed Pool Value with `ΔEEV_direct = -501 RU` above: current acceptance is a gap;
- a mutation with `ΔEEV_direct = -500 RU` exactly: boundary vector for the mathematical predicate, to be used only after the predicate itself is approved.

Do not change the secret, beacon proof, payout or datum fields between the positive control and the mutated Pool Value case.

### 5.2 Claim — a qualified single-tUSDM basket counterexample

This is a stronger CEK countermodel than an asset-substitution example because the Pool basket can remain profile-qualified: the discrepancy comes from the current B1 use of an Oracle quote for tUSDM rather than the Direct-USDM physical conversion.

Fixture OracleState:

- one reference input with the configured Oracle singleton quantity 1;
- one `OracleQuoteSet` entry for the approved tUSDM policy/name;
- authorized publisher and fresh timestamp;
- quote price = 50, precision = 1,000,000;
- `Economic.oraclePriceFor` currently accepts this fresh, publisher-bound, non-negative quote; no equality with the Direct-USDM 100-RU conversion is enforced.

Pool and ticket:

- pre Pool direct tUSDM = 1,000,000 atoms = 100 RU Direct EEV;
- Pool datum: `ppTotalLiquidity=100`, `ppPendingLiabilities=1`, unresolved reserve/count 0;
- PrizeDatum input is Revealed with payout (Y=1) RU; continuing PrizeDatum output is Claimed, immutable payout/identity fields;
- post Pool direct tUSDM = 980,000 atoms = 98 RU Direct EEV;
- Pool datum output: `ppTotalLiquidity=99`, `ppPendingLiabilities=0`, other accounting fields unchanged;
- owner input contains exactly one ticket NFT at a PubKeyCredential and is signed;
- owner output returns the NFT and receives 20,000 tUSDM atoms; the Oracle fixture includes a zero-price quote for the ticket NFT so the owner output's total Oracle value is exactly 1 RU;
- PrizeDatum own input/output Value is preserved.

Current B1 Oracle equality:

```text
poolInputUsdm  = ceil(1,000,000 × 50 / 1,000,000) = 50 RU
poolOutputUsdm = ceil(980,000 × 50 / 1,000,000)   = 49 RU
poolInputUsdm - poolOutputUsdm                   = 1 RU = claimedAmount
payoutPaidUsdm = ceil(20,000 × 50 / 1,000,000)   = 1 RU
```

But physical Direct-USDM EEV is:

```text
pre EEV_direct  = 100 RU
post EEV_direct = 98 RU
ΔEEV_direct     = -2 RU
ΔProtectedCapital = -1 RU
Required QNE      = ΔEEV_direct >= -1 RU
Counterexample    = -2 < -1
```

This is a clean qualified-basket countermodel: only tUSDM and the Pool singleton are in the Pool Value. It demonstrates that an Oracle price quote for the tUSDM unit at a value other than the fixed Direct-USDM conversion can make the B1 Oracle delta exactly equal the claim while the direct physical outflow exceeds the crystallized liability.

Current-source expectation: the B1 compiled `TicketClaimed` predicate will accept if the Oracle, owner, PrizeDatum, accounting and solvency conditions above are all met. That acceptance is an observed gap, not a safety PASS. Any test failure caused by fixture construction (e.g. missing Oracle quote, malformed raw signatory data, owner output NFT quote, or invalid datum) is a fixture failure and cannot be classified as a successful negative test.

Controls:
- quote price = 100 RU per 1,000,000 atoms, direct pool decrease = 1 RU: accepted positive control;
- quote price = 50, exact 1-RU Oracle delta / 2-RU physical tUSDM delta above: current gap characterization;
- missing/duplicate/wrong-publisher/stale quote: rejected by Oracle path, proving fixture is authenticated and fail-closed.

### 5.3 FundTreasury — Oracle output value can increase while physical tUSDM falls

Fixture:

- pre Pool direct tUSDM = 1,000,000 atoms = 100 RU;
- pre Pool datum `ppTotalLiquidity=100`, with zero liabilities, unresolved reserve/count and locked jackpot;
- output Pool direct tUSDM = 900,000 atoms = 90 RU;
- one Oracle quote for tUSDM: price 112, precision 1,000,000, correct singleton, publisher and freshness;
- output Pool datum has `ppTotalLiquidity=101`; all obligation/Jackpot/class fields unchanged.

The current FundTreasury branch computes:

```text
recomputedLiquidity = ceil(900,000 × 112 / 1,000,000)
                    = ceil(100.8)
                    = 101 RU
101 > pre datum 100, so the existing liquidity-increase predicate passes.
```

But:

```text
ΔEEV_direct = 90 - 100 = -10 RU
ΔProtectedCapital = 0
Required QNE = ΔEEV_direct >= 0
Counterexample = -10 < 0
```

Current-source expectation: the compiled B1 FundTreasury branch accepts when the continuing datum matches the recomputed Oracle output and increases above the previous datum. It does not compare direct tUSDM input/output quantities. This must be recorded as `OBSERVED_GAP_ACCEPTED_BY_CURRENT_VALIDATOR`.

Controls:
- same tUSDM quantity and quote 112 would make recomputed liquidity 112 > 100 but Direct EEV delta 0; accepted and QNE-neutral;
- positive tUSDM increase with canonical 100 quote: accepted;
- direct tUSDM decrease shown above: current gap characterization;
- absent or invalid Oracle reference: rejected.

This test must not add another asset to the Pool. The counterexample exists with only the qualified tUSDM Pool asset, so it isolates the Oracle-vs-Direct valuation discrepancy.

### 5.4 Expire — full physical Value equality already enforced

Use both Pending and Revealed-expiry states as separate fixture families.

| Variant | Pre datum | Post datum | Direct-EEV requirement |
|---|---|---|---|
| Pending | reserve includes (P), count includes ticket | reserve minus (P), count minus 1 | `ΔEEV_direct=0`, `ΔPC=-500P` |
| Revealed Loss | no positive payout liability | accounting unchanged | `ΔEEV_direct=0`, `ΔPC=0` |
| Revealed Win | pending liabilities include (Y) | pending liabilities minus (Y) | `ΔEEV_direct=0`, `ΔPC=-Y` |

For all three:
- `txOutValue (ownInputResolved ctx) == ownOutputValue ctx`;
- exact Pool singleton remains quantity 1;
- Pool datum output is otherwise consistent with the exact branch;
- PrizeDatum script UTxO is consumed with no continuing PrizeDatum output;
- expiry interval begins at or after `pdExpiresAt` for the PrizeValidator consumer.

Expected result: canonical Value-preserving cases pass the relevant B1 CEK predicate; every mutation to lovelace, tUSDM quantity or another native asset fails the explicit complete-Value equality. This is a positive safety control, not an open gap. No additional direct-USDM validator predicate should be inferred as necessary for this exact equality property.

### 5.5 Issue — existing compiled MintPolicy test is the control, not a new B1 test

Retain `MintPolicyB1ValuePreservationTest.hs` as the existing exact-Value Issue control:

- unchanged Pool Value passes;
- altered ADA quantity fails;
- altered tUSDM/other native-asset quantity fails;
- added or removed asset fails.

This proves the MintPolicy's atomic Issue reservation equality. It does not mean the B1 Pool's own `TicketIssued` branch alone proves this property; the sale path is jointly enforced by MintPolicy + B1 Pool.

## 6. Wider ticket-rights / burn test (separate from the four Pool CEK cases)

The MintPolicy admits a separate exact single-token burn branch. PrizeValidator Claim derives its owner from the ticket NFT in transaction inputs, whereas Expire can proceed from the PrizeDatum after expiry without the holder's owner-signature Claim path.

A separate test-only characterization should prove:

1. an exact single ticket NFT burn is accepted by the current MintPolicy burn branch;
2. burn itself does not update the PrizeDatum or B1 Pool liability;
3. a later Claim with no ticket NFT input cannot derive `maybeOwner` and fails closed;
4. after `pdExpiresAt`, the appropriate Pending or Revealed PrizeDatum expiry path remains available and releases the exact represented reserve/liability in B1;
5. no test calls burn an automatic loss of Pool solvency or a premature release of ProtectedCapital.

This test is needed for the complete ticket-entitlement action perimeter in R1/VC3/representation. It is not a request to change token-burn semantics.

## 7. Proposed test files and CI wiring

Test-only changes, when explicitly authorized, should be confined to:

| Path | Test-only change |
|---|---|
| `audit/cardano-integration/preprod-direct-usdm-source-set.test.mjs` | Add the EV3 full-basket negative/positive fixtures |
| `audit/cardano-integration/direct-usdm-asset-basket.mjs` (new, or equivalent isolated pure helper) | Canonical basket parser/validator importable without network access; no approval or ledger side effects |
| `plutus/test/B1DirectUsdmTransitionCharacterizationTest.hs` (new) | Compiled B1 CEK cases for Reveal, Claim, FundTreasury and Expire |
| `plutus/pre-rich-plutus.cabal` | Register a new test-suite with the same CEK dependencies as `b1-reveal-headroom-tests` |
| `.github/workflows/immortal-haskell-conformance.yml` | Run the new compiled CEK suite as a required test step |
| `.github/workflows/preprod-eev-qualification.yml` | Run the deterministic EV3 source-set test before live qualification; qualification remains read-only and must not materialize deployment approval |

Do not place an EEV approval action into the test workflow. Do not reuse the Cardano Preprod context job as proof of a source-set basket test.

Suggested local/CI Haskell command:

```bash
cd plutus
cabal test b1-direct-usdm-transition-characterization-tests --test-show-details=direct
```

Suggested EV3 command:

```bash
node --test audit/cardano-integration/preprod-direct-usdm-source-set.test.mjs
```

The existing `cabal test b1-reveal-headroom-tests` and `cabal test mint-policy-b1-value-preservation-tests` remain required controls.

## 8. Reporting format and acceptance gates

For each test case, the evidence packet must record:

- exact source commit and compiled validator hash/version used;
- full pre/post B1 datum fields;
- full Pool input/output Value maps;
- exact Pool singleton and tUSDM quantities;
- OracleState reference identity, quote records, publisher and timestamp where applicable;
- PrizeDatum input/output statuses and amounts where applicable;
- owner NFT input/output and signatory where applicable;
- script evaluator (B1 Haskell V2, PrizeValidator Haskell V2 differential, or Aiken V3 production candidate);
- CEK result and exact failure trace;
- independent Direct-USDM conversion and `ΔProtectedCapital` calculation;
- classification: `EXPECTED_CONTROL_PASS`, `CURRENT_GAP_ACCEPTED`, `CURRENT_GUARD_REJECTED`, or `FIXTURE_INVALID`.

No evidence packet may describe a synthetic CEK evaluation as a submitted transaction, local Yaci ledger success, or Preprod ledger observation.

### Phase gate A — test-fixture validity

All canonical controls evaluate to expected success. All adversarial fixtures satisfy all other actual script predicates; a failure must be attributable to the target predicate and not malformed datum/reference/signatory/interval data.

### Phase gate B — current-code characterization

The expected current-code results in §§5.1–5.5 are reproduced. In particular, any current CEK acceptance of the Reveal, Claim or FundTreasury countermodels is reported as a gap. A different result requires source-level reconciliation and a corrected fixture before classification.

### Phase gate C — later implementation closure

Only after a separately authorized source/predicate change, rerun the same positive and negative vectors. The negative tests then must demonstrate that the approved direct-EEV/safe-state rule is enforced while all valid existing ticket operations remain available. No closure claim follows from test addition alone.

## 9. Final disposition

This document converts §§46.06–46.09 into a reproducible test design and sharpens two important current-code countermodels:

- Claim can satisfy its exact Oracle-valued pool delta while reducing physical tUSDM by more than the claim amount, even when the Pool holds only the qualified tUSDM asset, because the B1 validator does not bind the tUSDM Oracle quote to the Direct-USDM conversion.
- FundTreasury can increase the Oracle-recomputed output liquidity above the prior datum while decreasing the physical tUSDM balance, again with only the tUSDM asset in the Pool.

Reveal has a direct-quantity-only CEK countermodel; Expire and Issue already have complete-Value preservation controls.

**R1/Kc/authoritative Ω:** OPEN.  
**B1 Registry identity:** BLOCKED / P0.  
**First real Preprod Issue:** **NO-GO**.

**No implementation was performed.** This is the next test-only specification offered for cross-agent review; source/test/workflow changes remain a separate explicit authorization.


## 10. Fixture realism and ledger-balance controls

The CEK test contexts should be internally ledger-balanced even though the Plutus CEK evaluator itself does not execute Cardano's Value-conservation rule. This avoids countermodels that only exist because the synthetic context violates a basic ledger constraint.

For Oracle-valued FundTreasury/Claim cases, include exactly the Pool min-UTxO ADA quantity in Pool input/output and include an ADA quote (policy/name = ADA identity) with price zero in the synthetic `OracleQuoteSet`. `Economic.totalUsdmValue` requests a quote for each non-zero asset before applying the ADA min-UTxO economic exclusion. For Claim, include a zero-price quote for the ticket NFT in the owner's combined NFT+payout output, otherwise the correct Oracle traversal will reject the missing NFT quote before the target Pool-delta predicate is reached.

Recommended balanced flows:

- **Reveal:** Pool input 10,000,000 tUSDM atoms; Pool output 4,990,000; a separate output receives the remaining 5,010,000 atoms. Pool singleton and ADA envelope are preserved. No unauthorized mint/burn or value creation is needed.
- **Claim:** Pool input 1,000,000 tUSDM atoms; Pool output 980,000; the owner's output contains the ticket NFT plus 20,000 tUSDM atoms (payout). Pool singleton and ADA envelope are preserved. The direct tUSDM balance is fully conserved; the 2-RU physical outflow is exactly the amount delivered to the claimant, while the Oracle quote values it at 1 RU.
- **FundTreasury:** Pool input 1,000,000 tUSDM atoms; Pool output 900,000; a separate funder/change output receives the remaining 100,000 atoms. Pool singleton and ADA envelope are preserved. The current FundTreasury validator has no origin/destination check that prevents the residual tUSDM from leaving the Pool while an Oracle quote makes the continuing output's recomputed liquidity exceed the old datum.
- **Expire:** Pool input/output complete Value equality, no ADA or token change, no additional beneficiary output.

All Oracle quotes must be included on the same singleton reference UTxO, have a unique policy/name identity, the configured publisher, a timestamp that satisfies the actual `TxInfo` validity upper bound and non-negative price. All B1 datum/PrizeDatum/payout fields must otherwise satisfy the real compiled branch. A fixture that omits required ADA/NFT quotes or fails Value conservation is `FIXTURE_INVALID`, not evidence against or for the target predicate.

This clarification does not upgrade synthetic CEK contexts to a native-ledger execution claim.
