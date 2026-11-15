# Agent A — EV3 full-basket source producer implementation

**Date:** 2026-11-15  
**Branch:** `work/immortal-green-closure`  
**Implementation checkpoint:** `fc33c2df30e1f678d946a72ce4fdeeea133a9716`  
**Classification:** EVIDENCE-PRODUCER / QUALIFICATION-INTEGRITY IMPLEMENTATION — NOT A PROTOCOL OR DEPLOYMENT CHANGE  
**Status:** IMPLEMENTED IN THE SHARED BRANCH; WORKFLOW EXECUTION NOT YET VERIFIED IN THIS NOTE.

## 1. Finding addressed

The prior EV3 producer checked the configured Pool singleton and positive approved tUSDM quantity, but it did not reject every other positive native-asset unit and did not preserve the complete normalized Pool basket. The runtime Issue observer already rejected unqualified positive Pool assets. This left the source-set qualification path weaker than the live Issue path.

## 2. Implementation

The existing pure basket contract is now used by the live EV3 source-set producer.

The canonical basket binds:
- exact Pool `txHash#outputIndex` and Pool address;
- exact Pool singleton unit and quantity 1;
- exact approved tUSDM unit and positive physical quantity;
- the ADA/lovelace envelope;
- sorted, normalized positive asset units and quantities;
- a basket digest.

The basket verifier reconstructs the canonical basket from its contents before accepting the digest. It therefore rejects a foreign positive asset even when an attacker recomputes a syntactically valid basket digest. Canonical asset ordering uses locale-independent lexical comparison so basket hashes do not depend on runtime locale.

The source-set artifact now stores the complete canonical basket, its digest, and the exact basket-contract source digest. EV3 qualification verifies the basket, binds it to the deployment Pool reference/address/asset identities, rechecks the current basket-contract source bytes, and includes both digests in its snapshot and source-set evidence. The protected approval validator repeats the basket verification and checks that qualification is bound to the same basket and implementation digest.

## 3. Changed files

- `audit/cardano-integration/preprod-direct-usdm-basket-contract.mjs`
- `audit/cardano-integration/preprod-direct-usdm-basket-contract.test.mjs`
- `audit/cardano-integration/preprod-direct-usdm-source-set.mjs`
- `audit/cardano-integration/preprod-direct-usdm-source-set.test.mjs`
- `audit/cardano-integration/preprod-direct-usdm-qualification.mjs`
- `audit/cardano-integration/eev-approval-integrity.mjs`
- `audit/cardano-integration/eev-approval-integrity.test.mjs`
- `audit/cardano-integration/preprod-direct-usdm-approve.mjs`
- `audit/cardano-integration/preprod-direct-usdm-approve.test.mjs`

The existing `PRE-RICH Direct-USDM Conformance` workflow already includes the basket-contract test and EV3 source-set test paths. Its actual run result has not been verified here.

## 4. Evidence and safety boundary

Added/retained deterministic cases cover a valid ADA + Pool singleton + approved tUSDM basket, foreign positive assets, missing/zero tUSDM, incorrect Pool singleton quantity, malformed/negative/duplicate records, canonical order, digest tampering, exact Pool reference uniqueness, and a self-digested foreign-asset forgery. Approval fixtures exercise rejection of a forged basket after the outer source-set and qualification hashes are recomputed.

**CI status:** not independently observed yet. The latest follow-up `fc33c2df30e1f678d946a72ce4fdeeea133a9716` replaces locale-sensitive asset ordering with deterministic lexical ordering. These source changes must not be reported as passing tests until the exact-head workflow completes successfully.

No live Koios query, source-set materialization, EV1–EV7 qualification, protected deployment-approval workflow, wallet operation, transaction, deployment, or ledger write was executed by this implementation.

## 5. Required follow-through

Because EV3 source bytes and the basket contract changed, the historical EV1–EV7 qualification and October `DEPLOYMENT_APPROVED` artifact must not be reused as approval for this implementation. After exact-head CI passes, regenerate the read-only source-set and EV1–EV7 qualification against the same currently-live Pool candidate. Keep the separate protected approval step uninvoked until it is independently reviewed and explicitly authorized.

This work closes only the EV3 producer/qualification consistency defect. It does **not** close R1/Kc/authoritative Ω, the B1 Registry identity P0 blocker, the Reveal/Claim/FundTreasury Direct-USDM transition predicates, or the first-Preprod-Issue NO-GO. No V3, Reveal, MintPolicy, B1 validator, datum/redeemer ABI, 500× rule, EEV conversion or economic parameter was changed.
