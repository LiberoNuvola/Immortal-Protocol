# Agent A — Direct-USDM approval snapshot and B1 action/test-coverage closure

**Date:** 2026-11-15  
**Branch at audit start:** `work/immortal-green-closure`  
**Source HEAD:** `215e9d31023be1b71d1ab1db1876bad6dafd87e9`  
**Classification:** READ-ONLY EVIDENCE RECONCILIATION / ACTION-PERIMETER AUDIT — NO IMPLEMENTATION AUTHORITY  
**Purpose:** Reconcile the exact Direct-USDM identity and historical protected approval with the latest live Preprod Pool observation; enumerate the complete B1 PrizePool redeemer set and adjacent NFT transitions; inspect whether compiled validator tests cover the direct-Value predicates identified in §§46.06–46.07.  
**Non-effects:** no source, test, validator, policy, workflow, ABI, wallet, signature, deployment, or ledger state changed or executed.

## 1. Executive disposition

Three new evidence points are established:

1. **The Preprod tUSDM identity is not merely a guessed candidate.** A protected GitHub Actions deployment-approval workflow produced an exact Direct-USDM EEV approval artifact on 2026-10-21 for the specified tUSDM unit, exact B1 Pool UTxO reference, exact deployment profile and EV1–EV7 evidence digest.
2. **The 2026-11-15 read-only Preprod context observed the same Pool UTxO reference and the same physical tUSDM amount still live** at a stable Demeter/Ogmios acquired-ledger-state snapshot (slot 139037521). This is an independent context re-observation, not a refresh of the EEV approval artifact: direct-USDM bootstrap/requalification was skipped by that context workflow, and no Issue authorization was created.
3. **The current B1 Pool redeemer set is exactly five constructors**, while the MintPolicy has a separate exact-single-NFT burn path. Existing compiled tests prove exact full-Value preservation for Issue, but the Reveal CEK test fixes the Pool input/output Value equal by construction and therefore does not test the newly identified direct-Value gap. No dedicated compiled-CEK direct-Value mutation test for Claim, FundTreasury or Expire was found in the inspected `plutus/test` set.

**R1 remains OPEN.** B1 Registry identity remains independently P0. First Issue remains NO-GO.

## 2. Direct-USDM identity and exact conversion

### 2.1 Canonical conversion

`Adapter/CARDANO/observation/DirectUsdmEev.ts` pins:

- ledger decimals: 6;
- IMMORTAL USDM sub-units per USDM: 100;
- atomic token units per tUSDM: 1,000,000;
- conversion: `(atomicQuantity × 100) / 1,000,000` using `bigint` integer division (floor).

The compiled test assertions in `DirectUsdmEev.test.ts` include:

| tUSDM atomic quantity | Direct-USDM EEV |
|---:|---:|
| 1,000,000 | 100 RU |
| 1,000,000,000 | 100,000 RU |
| 10,009 | 1 RU |
| 20,000 | 2 RU |

The conversion is therefore consistent with:

```text
1 tUSDM = 1 USDM = 100 RU
1 RU = 10,000 tUSDM atomic units
1,000,000,000 atomic units = 1,000 tUSDM = 1,000 USDM = 100,000 RU
```

All transition inequalities in §46.06 are in integer RU. The exact state comparison is:

```text
ΔEEV_direct =
  floor(q_out × 100 / 1,000,000)
  - floor(q_in  × 100 / 1,000,000)
```

It is important not to replace this with Oracle-valued `ppTotalLiquidity`.

### 2.2 Protected EEV deployment approval (historical exact candidate)

GitHub Actions run [39552468679 — PRE-RICH B1 EEV Deployment Approval](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39552468679) completed **SUCCESS** on 2026-10-21. It produced artifact `immortal-preprod-eev-approved` (artifact id `12324421376`), which was retrieved and inspected.

The approved qualification records:

- schema: `PRE-RICH-EEV-USDM-DIRECT-V1-QUALIFICATION-v0.1`;
- qualification status: `qualified`;
- deployment approval: `DEPLOYMENT_APPROVED`;
- exact approved profile: `PRE-RICH-EEV-USDM-DIRECT-V1`;
- exact direct asset unit: `e675b46e4d2242c991a8932a99db3044e80515ae14b4c4ccf6b3f4c90014df10745553444d`;
- exact B1 Pool UTxO: `b84fce37cd31ea6463d2c59fa1c2a7cd0871e1620146fe3741308ab2e610b020#0`;
- observed physical amount at qualification: `1,000,000,000` atomic units;
- observed EEV: `100,000` RU;
- `validUntilOrRevalidationRule = LIVE_UTXO_REVALIDATION`;
- approval reference: `github-actions:environment/PREPROD-EEV-APPROVAL/run/39552468679`;
- approval actor: `LiberoNuvola`;
- approval workflow commit: `97b09a38742098f17a61eb07734c401aeedccc06`.

The artifact's governance text expressly says that this approval does not itself authorize Issue admission; exact live UTxO revalidation and authenticated control state, ProtectedCapital provenance, viability/liquidity evidence and authoritative Issue decision remain separate requirements.

The source constant is named `PREPROD_TUSDM_CANDIDATE_UNIT` and its comment says the constant alone is not normative deployment approval. This is not evidence that no approval exists: the separate protected-environment artifact above is the authority record for this exact candidate/profile. The code constant itself must never be treated as a substitute for that artifact.

### 2.3 Latest observed Preprod Pool snapshot

The [IMMORTAL Cardano Preprod Context run 43681459946](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/43681459946) completed SUCCESS on 2026-11-15. Its `preprod-context` job completed the read-only checks, including:

- Verify live Preprod B1 Pool candidate UTxO evidence — SUCCESS;
- exact B1 Pool address census — one UTxO;
- acquired-ledger-state tip remained stable at slot `139037521`, id `8ffe4177afff9e937e46f10301e08c1dcda7311d5cb402008ab7951ab24848b9`;
- exact historical candidate out-reference `b84fce37cd31ea6463d2c59fa1c2a7cd0871e1620146fe3741308ab2e610b020#0` was present;
- Pool singleton quantity = 1;
- approved tUSDM unit quantity = `1,000,000,000` atomic units;
- ADA envelope = `5,000,000` lovelace;
- observed source time = `2026-11-15T05:32:31.173Z`.

Thus the historical approval and the November 15 Preprod context packet refer to the **same exact Pool UTxO reference and the same tUSDM amount**. The packet is a same-ledger-state read-only context observation. Its own address provenance is marked `HISTORICAL_DEPLOYMENT_CANDIDATE_REVALIDATION_REQUIRED`; it is not the direct-USDM EEV requalification workflow.

Important job boundaries:

- `preprod-deploy` — SKIPPED;
- `direct-usdm-preprod-bootstrap` — SKIPPED;
- `real-preprod-reveal` — SKIPPED;
- conformance binding states `ledger_aligned_evaluator_run=false` and `full_end_to_end_equivalence_claim=false`.

This evidence improves confidence that the historical candidate remains live at the observed snapshot, but it does not create a new EV1–EV7 source-set/qualification artifact, renew the approval, or authorize Issue. Before an actual Issue, the exact current Pool reference must be revalidated immediately before admission and consumed by that same Issue transaction. The exact source identity must also be checked against the current protected approval evidence, not merely copied from the old JSON.

## 3. Exhaustive B1 Pool action surface

`plutus/Types.hs::B1PrizePoolAction` declares exactly these five constructors:

1. `FundTreasury`
2. `TicketIssued Integer`
3. `TicketRevealed Integer`
4. `TicketClaimed Integer`
5. `TicketExpired`

`plutus/B1PrizePool.hs::mkValidator` dispatches on those five constructors. This is the exhaustive current B1 PrizePool datum/action API examined in this audit.

The per-action Direct-USDM reconciliation remains the one in §46.06:

| Action | Existing physical-Value property | R1 status |
|---|---|---|
| FundTreasury | Oracle-valued liquidity increase; no Direct-USDM quantity monotonicity predicate | OPEN |
| TicketIssued | MintPolicy exact complete Pool Value equality | Value preserved; `Δb=-500P` |
| TicketRevealed | `ppTotalLiquidity` unchanged; Pool input/output Value may differ | OPEN |
| TicketClaimed | Oracle-valued `poolInputUsdm-poolOutputUsdm == Y` | OPEN |
| TicketExpired | Exact complete Pool input/output Value equality | Direct EEV preserved; Revealed-expiry V3 mapping OPEN |

### 3.1 Separate ticket NFT burn is part of the wider transition perimeter

The ticket MintPolicy also has a separate guard:

```text
isExactSingleBurn ownCs minted
```

A single asset-name entry with amount `-1` enters the burn path, which returns success before the Issue-path predicates. This is not a sixth `B1PrizePoolAction` and does not itself spend/continue the Pool.

However, the PrizeValidator's `ticketOwnerPkh` finds the ticket owner only by finding the ticket NFT in transaction inputs. `validateClaim` then requires that owner to sign. If the unique NFT is burned in a separate transaction before Claim, a later Claim cannot derive an owner from the now-absent NFT input. The ticket's pending/revealed Pool accounting remains until its applicable expiry transition; the existing expiry path is therefore relevant to eventual liability release.

This is not automatically a solvency exploit and this report does not propose disabling burn. It does mean the complete `(S,A,Accept,Ω,T,Safe)` model cannot enumerate only B1 Pool redeemers: it must also include ticket ownership transfers and the allowed NFT burn transition, including the corresponding loss/expiry of the claim path. Otherwise the representation-preservation part of VC3 is incomplete.

## 4. Compiled test coverage: what is proven and what is not

### 4.1 Issue — exact physical Value preservation is tested against the compiled MintPolicy

`plutus/test/MintPolicyB1ValuePreservationTest.hs` applies the actual exported compiled MintPolicy factory. Its successful/failing CEK cases verify:

- identical input/output Pool Values are accepted;
- changed lovelace is rejected;
- changed qualified native-asset quantity is rejected;
- an added native asset is rejected;
- a removed native asset is rejected.

This is direct compiled-policy evidence for the exact Value equality used by Issue. It is a Plutus CEK test, not a Preprod transaction.

### 4.2 Reveal — current CEK test does not exercise a changed Pool Value

`plutus/test/B1RevealHeadroomTest.hs` evaluates the compiled B1 validator and, in its dual sequence, the PrizeValidator with one shared synthetic `TxInfo`.

In `makeRevealContext`, both the Pool input and continuing Pool output are constructed with the same top-level `poolValue` constant. The tests characterize headroom/solvency and payout-order cases, including the exact WCE boundary. They do not mutate the Pool output Value while preserving the current datum predicates.

Therefore the passing Reveal headroom suite is not evidence that a Pool Value reduction or composition substitution would be rejected. It also does not prove the missing direct-USDM inequality.

### 4.3 Claim, FundTreasury and Expire — no direct-Value CEK mutation cases found

The inspected `plutus/test` set contains `B1LegacyAdapterTest.hs`, `B1RevealHeadroomTest.hs`, `MintPolicyB1ValuePreservationTest.hs` and `RevealSchemaFixtures.hs`; no dedicated compiled-CEK suite was found that changes physical Pool Value to characterize the Claim, FundTreasury or Expire action predicates.

`src/__tests__/b1-invariants.test.ts` explicitly describes the B1 transitions as pure TypeScript mirror tests. Those tests are useful for the accounting equations but do not execute the production Plutus validator or prove physical Value predicates.

This test-gap finding is bounded to the inspected source/test tree at the audited HEAD; it is not a claim that no test can exist outside that tree.

## 5. Required next validation matrix (test-only candidate; no authorization implied)

Once an explicit test-only changed-path slot is granted, the direct-value tests should use the actual compiled validator factory and change only the Pool Value/input-output composition relevant to each predicate:

| Action | Positive baseline | Negative mutation that must be characterized |
|---|---|---|
| Issue | exact complete Pool Value equality | any changed asset quantity/add/remove rejected (already covered) |
| Reveal | canonical unchanged Pool Value | lower direct tUSDM while datum `ppTotalLiquidity` remains unchanged; determine current compiled result |
| Claim | canonical exact payout settlement | non-tUSDM asset substitution maintaining Oracle total but violating direct tUSDM bound; determine current compiled result |
| FundTreasury | canonical direct tUSDM deposit | Oracle-valued non-tUSDM increase with direct tUSDM unchanged/decreasing; determine current compiled result |
| Pending / Revealed Expire | exact Pool Value equality | any physical Value change rejected (source predicate already says so; add compiled regression) |

Any adversarial context must otherwise satisfy the real datum, PrizeDatum, owner, token, Oracle and time predicates so the failing predicate is isolated. Where an Oracle fixture is required, it must be internally coherent and the result must be labelled CEK characterization, not a native-ledger transaction.

A separate test should characterize allowed NFT transfer/burn semantics and confirm the expected expiry path for a burned ticket. That test must not silently change the normative right/expiry rules.

## 6. Final disposition

- Direct-USDM asset identity: exact unit approved by protected workflow for a specific candidate and EEV profile.
- Historical approved Pool reference: same exact reference independently observed live in the November 15 Preprod context packet with the same amount.
- Fresh Issue-time EEV admission: still requires exact current UTxO revalidation and same-transaction input binding; latest context job skipped direct-USDM refresh/approval and did not authorize Issue.
- B1 Pool actions: complete current redeemer set is five constructors.
- Additional accepted ticket transition: single NFT burn is outside the B1 Pool redeemer set but inside the wider ticket entitlement/representation perimeter.
- Physical direct-Value test coverage: Issue is positive/negative characterized; Reveal, Claim, FundTreasury and Expire need targeted compiled tests.
- R1/Kc/authoritative Ω: OPEN.
- B1 Registry identity: BLOCKED / P0.
- First real Preprod Issue: **NO-GO**.

**Non-effects:** no production source, validator, MintPolicy, test, ABI, workflow, economic parameter, V3, Reveal, 500× rule, wallet, signing, deployment or on-chain state changed.
