# DEEP CLOSURE AUDIT — Authority / EEV / RF8 / Genesis / B3-ID / P2.8

Date: 2026-09-28
Status: RESEARCH / NON-NORMATIVE
Branch: work/immortal-green-closure

## 1. Purpose

This note records the second-depth closure pass after the 2026-09-27 RF8/B6 triangulation. It does not change economic rules, choose a new oracle, choose a B3 proof system, or promote an implementation type into an authority.

## 2. First-user Preprod dependency chain

The concrete execution chain is:

P2.8 native Cardano-ledger replay
→ real Preprod Reveal
→ authenticated Genesis carrier
→ authoritative Issue producer / EEV provenance
→ first-user Issue
→ real Claim / Expire evidence.

The first-user blocker is therefore not a missing UI path. It is authoritative economic-input provenance.

## 3. CLASS-AUTH

The V3 design distinguishes:

- CurrentActiveClass: current economically sellable ceiling;
- HighestClassEverActivated: monotonic historical maximum.

The legacy B1 Pool datum cannot reconstruct both without loss.

A type named AuthoritativeClassState is not sufficient. Closure requires:

canonical economic state
→ authenticated observation
→ authoritative class state
→ Economic Gate.

Required properties:

H(t+1) >= H(t)

and current class must be the deterministic result of the canonical safety rules, not an operator/browser choice.

No implementation should manufacture this state from the current Pool balance alone.

## 4. EEV qualification

The current EEV model defines:

EEV(S, τ, q_max) = VerifiedUSDM + Σ_i LiquidationValue_i(S, τ, q_i)

with q_i limited to quantity actually liquidatable within τ.

For each asset, closure requires:

AssetIdentity
∧ HeldQuantity
∧ LiquidationRoute
∧ VerifiableExecutionData
∧ VerifiedUSDMConversion
∧ ExecutionCostModel
∧ τ.

Current source-of-truth status:

- EEV definition: CLOSED.
- Asset perimeter: OPEN.
- τ: OPEN.
- Oracle/data source per asset: OPEN.
- Execution-cost model: OPEN.
- Historical EHSE: OPEN.
- PRE contribution to EEV: not demonstrated; fail closed until a verifiable liquidation route exists.

Therefore Pool USDM value, displayed PRE value, market cap or a relayer-produced valuation must not be promoted to authoritative EEV.

## 5. Executable liquidity is separate

The Economic Gate distinguishes EEV from immediate executable liquidity.

The remaining closure question is provenance:

observed spendable UTxOs
→ exact Pool identity
→ declared liquidity
→ executable-liquidity observation
→ Economic Admission.

The semantic distinction already exists; the evidence must bind the observation to the exact ledger surface.

## 6. Genesis

The Genesis predicate is an admission predicate over an observation. It is not by itself proof of which Treasury/Oracle ledger inputs produced the observation.

Required runtime witness:

Treasury/Oracle inputs
→ authenticated observation
→ Genesis predicate
→ carrier consumption/continuation
→ validator revalidation
→ committed GENESIS state.

Legacy Treasury.Distribute is not the Genesis transition and must not become Genesis authority.

## 7. RF8 closed-world

Issue / Reveal / Claim / Expire are known economic mutators routed through EconomicAdmission.

RF8 remains open until every economically material deployed surface is classified:

CANONICAL / SUPPORT / LEGACY / DISABLED.

The inventory must include, at minimum:

- PrizePool actions;
- Prize/Ticket actions;
- ticket mint/burn;
- Treasury;
- Counter;
- Oracle/valuation;
- Genesis carrier;
- Beacon/control;
- governance actions;
- relayer actions;
- adapter submission;
- any alternate API or transaction producer.

For every economically material non-canonical surface, provide a negative twin proving it cannot create an economic effect outside the canonical transition relation.

## 8. B3-ID

Materios storage accepts an explicit anchor_id. Existing upstream evidence does not by itself define anchor_id as a deterministic function of round/checkpoint/block/StateRoot.

An SDK convention such as SHA256(rootHash || manifestHash) is not canonical PRE-RICH semantics until explicitly adopted or rejected by the relevant specification.

Before B3-C proof-system selection, define:

CanonicalAnchorId = I(round, checkpoint, finalized block, StateRoot, ...)

with exact input set, encoding, hash/versioning and replay semantics.

Then prove:

checkpoint → anchorId → AnchorRecord.root_hash

without first-match selection or guessed derivation.

## 9. P2.8 replay

The native runner has typed prerequisite handling and fail-closed behavior.

Closure requires a self-contained packet:

- tx.cbor
- exact UTxO set
- protocol parameters
- EpochInfo
- SystemStart
- source/commit identifier
- decoder/runtime manifest
- evaluator result/logs.

The same packet must be replayable independently with the same result.

A typed runner without a real packet is not native-ledger closure.

## 10. Test reproducibility

Multiple test families exist. “CI green” without runner/scope is not a sufficient evidence statement.

The project should maintain a matrix:

TEST-ID | runner | dependencies | command | expected result | artifact | commit | environment | evidence class.

Evidence classes must remain distinct:

unit/conformance
reference replay
Yaci/devnet
native Cardano ledger
Preprod
external canonical witness.

## 11. Universal theorem boundary

Economic Gate correctness is not an infinite-horizon viability theorem.

Universal closure still requires a complete state/action/uncertainty perimeter and preservation of the viability region. This is a certification/theorem obligation, not a reason to invent a shortcut for the first Preprod user.

## 12. Safe next implementation step

Do not implement a fake authoritative Issue producer.

Instead close the producer prerequisites in this order:

1. authoritative PRE-RICH control-state source;
2. EEV asset/perimeter/liquidation qualification;
3. executable-liquidity binding to exact Pool UTxO;
4. producer witness construction;
5. Issue transaction;
6. ledger evidence.

This preserves the existing authority boundary and avoids turning a TypeScript service into an economic oracle by accident.

## 10. SOURCE-OF-TRUTH DEEP PASS — 2026-09-28

A direct source census was performed for the two remaining authority inputs.

### 10.1 Control state

The current repository contains the deterministic PRE-RICH hysteresis implementation and an `AuthoritativeClassState` transport type. The hysteresis implementation can recompute the expected control result from supplied capacity/classes/history, but that computation is explicitly an application-boundary witness and does not authenticate its inputs.

The Cardano semantic-equivalence audit states that the current B1 PrizePool path does not directly reconstruct `CurrentActiveClass`, `HighestClassEverActivated`, or the PRE-RICH class-saleability predicate. The current B1 datum therefore cannot be promoted to a lossless control-state source.

The legacy adapter independently confirms the representation gap: its V3→B1 conversion rejects unsupported class composition, non-zero protected-capital components, Jackpot lifecycle state and missing historical control. This is strong evidence that the legacy Pool datum is not a canonical source for the full V3 control state.

**Conclusion:** CLASS-AUTH remains OPEN. The next step is an authenticated control-state carrier/observation, not another local hysteresis calculator.

### 10.2 EEV

The repository has a normative EEV Oracle and Valuation Contract (R9). It closes the *contract* V1–V9 but explicitly leaves correctness of any concrete valuation `V` to adapter conformance. Required artifacts EV1–EV7 include source specification, verification predicate, deterministic/versioned derivation, freshness, conservative-direction evidence, failure paths and Ω/perimeter linkage.

The existing Genesis Oracle surface is concrete and authenticated for the Genesis predicate: it carries PRE policy/asset identity, quantity, verified PRE→USDM price, oracle precision, oracle state reference and publisher. That source is sufficient evidence for the Genesis admission calculation when its ledger binding is demonstrated.

It is **not** evidence of a general EEV provider. The repository contains no identified concrete producer that discharges EV1–EV7 for the first-user Issue EEV. In particular, the existing Genesis PRE valuation must not be silently reused as general EEV, and the current EHSE perimeter still leaves PRE liquidation, τ, execution-cost model and general oracle adoption open.

**Conclusion:** EEV-PRODUCER remains OPEN. The immediate task is to qualify an actual adapter/profile valuation source against EV1–EV7, not to rename the Genesis Oracle result as EEV.

### 10.3 Executable liquidity

The source census confirms an existing concrete ledger-side surface: the authenticated singleton B1 PrizePool UTxO and its validated USDM valuation. The adapter already binds observed liquidity source references to candidate transaction inputs. This is useful execution provenance.

It still does not by itself prove that the economic-admission witness's EEV is correct, nor does it turn PrizePool liquidity into EEV. Fresh current-head ledger evidence remains required.

### 10.4 Resulting order

The safe order is now:

1. authenticate a PRE-RICH control-state carrier/observation;
2. qualify a concrete EEV source against EV1–EV7 and the declared asset/τ perimeter;
3. retain exact Pool UTxO binding as the separate executable-liquidity witness;
4. instantiate the existing Issue producer contract;
5. execute and archive the first-user Issue evidence.

No new economic constant, oracle, haircut, τ, or PRE valuation rule is introduced by this pass.


## 10.5 CURRENT-BRANCH ARITHMETIC RECONCILIATION — 2026-09-28

The current closure source at `acce8e6ef8fefcaa23ecaab4f7b922b482ed04e7` confirmed a concrete Genesis conformance discrepancy: `PRE-RICH/profile/PreRichGenesisAdmission.hs` was still using `EconomicKernel.ceilingDiv`, while the current TypeScript Genesis admission path and red-team record define conservative floor division for the hard `>= 4000 USDM` lower-bound predicate.

This is now corrected without changing economic policy. Commit `d6083997fcad5c884f86b4886e627752ae7cc9ff` switches the Plutus path to integer `divide`; commit `0765f73e8c7d5c084ce073e4fb3a7d73e1308101` adds the fractional-boundary regression test. The exact adversarial case is a mathematical value of 399,999.9 USDM subunits: floor remains below the 400,000-subunit threshold and therefore rejects; ceiling would incorrectly admit.

This closes the source-level arithmetic/conformance discrepancy only. It does not establish Genesis on-chain enforcement, authenticated observation provenance, or live carrier→ledger evidence.


## 10.6 GENESIS CARRIER SOURCE REALITY — 2026-09-28

The design note `PRE-RICH/docs/GENESIS-REGIME-CARRIER-DESIGN-v0.1.md` describes the Genesis carrier as implemented, but direct source inspection at the current closure commit found no `PRE-RICH/profile/GenesisRegimeCarrier.hs` and no `PRE-RICH/profile/GenesisCarrierMintPolicy.hs`. `plutus/Types.hs` also contains no dedicated regime datum; its B1 PrizePool datum is explicitly an accounting state and its suspended-class field is not an activation authority.

Therefore the Genesis carrier must remain classified **OPEN / implementation-source mismatch** until the exact canonical implementation is located or reintroduced through the documented implementation order. The design specification itself is not execution evidence. This finding prevents GENESIS-LIVE from being incorrectly marked closed.


## 10.7 ISSUE PRODUCER TRANSPORT IS PRESENT; AUTHORITY SOURCE IS NOT — 2026-09-28

Current-branch inspection found `Adapter/CARDANO/runtime/AuthoritativeIssueAdmission.ts` plus `Adapter/CARDANO/observation/HaskellIssueAdmissionProvider.ts`. The latter invokes an explicitly configured Haskell producer and binds decision/observation references to the resulting admission witness. This closes the previously described **transport boundary** gap.

It does not close the economic authority gap. The transport accepts producer input; it does not authenticate the underlying EEV or PRE-RICH control state. The Cardano-to-V3 projection requires `authoritativeClasses`, protected-capital components, `currentActiveClass`, and `highestClassEverActivated` as already authoritative inputs. Therefore the remaining blocker is provenance, not another TypeScript bridge: an authenticated control-state carrier and a qualified concrete EEV source must be supplied before the producer can be instantiated for a real Issue.
