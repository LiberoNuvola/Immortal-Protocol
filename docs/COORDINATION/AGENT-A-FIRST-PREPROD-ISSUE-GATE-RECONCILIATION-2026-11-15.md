# Agent A — First Preprod Issue gate reconciliation

**Date:** 2026-11-15  
**Branch:** `work/immortal-green-closure`  
**Inspected HEAD:** `8b301e95795e98d7066103debb81ce0693080202`  
**Classification:** READ-ONLY SOURCE / EVIDENCE RECONCILIATION — NON-NORMATIVE; NO IMPLEMENTATION AUTHORITY  
**Scope:** First PRE-RICH V1 Issue on Cardano Preprod. This note does not authorize a transaction, deployment, validator change, economic-policy change, or certificate substitution.

## 1. Executive disposition

**NO-GO: do not submit the first real Issue from the current branch state.**

Two independent blockers are presently sufficient to stop the transaction:

1. **B1 Registry identity is BLOCKED / P0.** Agent B's 2026-11-15 adversarial evidence shows that the current Issue MintPolicy can accept a buyer-controlled counterfeit Pending Registry reference. The current Registry read path establishes a matching payment ScriptHash and datum contents, not an authenticated Registry instance or authorized transition lineage.
2. **R1/Kc/Ω deployment certification remains MISSING.** At the declared PRE-RICH Preprod S0, the current valid Issue action `Issue(0,1)` lowers the unclamped R1 margin by exactly 500 RU. No total deployment-bound χ/`Wit`, authoritative-Ω proof, VC1–VC6 package, or E1–E10 certification has been demonstrated.

These gates are independent. Closing one does not close the other. A successful general CI run, a qualified EEV artifact, a deployment-approval artifact, or a structurally complete admission envelope cannot replace either proof.

## 2. Current B1 Registry identity finding

### 2.1 Exact Issue consumer behavior

On the inspected current branch:

- `plutus/MintPolicy.hs::readRegistry` walks `txInfoReferenceInputs`.
- Its matching predicate checks only whether the reference output's payment credential is `ScriptCredential regHash`.
- It decodes the first matching datum and returns it; it does not reject multiple matches after selecting the first.
- The positive-price Issue branch then checks `sameTarget`, round equality, and `brStatus == BeaconPending`.

The Issue MintPolicy does not require the Registry UTxO to be spent by `BeaconRegistry`, does not establish a unique Registry state-token identity, and does not verify a preceding RegistryPublish transition or its relayer authorization. The relayer-signature check in `plutus/BeaconRegistry.hs::validatePublish` is executed only when that Registry validator is invoked as a spending validator; reading a reference input from MintPolicy does not execute it.

### 2.2 Evidence and limits

Agent B recorded the following in the shared coordination register:

- Cardano Integration Lab run [43678893383](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/43678893383), source SHA `53edd61177968ad4f2e1d0dc761c9c5d152bab1e).
- The compiled Haskell CEK adversarial suite characterized positive-price MintPolicy acceptance of a buyer-controlled Pending Registry reference.
- The local-Yaci B0 characterization showed that an ordinary payment can create a Ready-shaped output at a script address without executing that Registry validator.
- The corresponding Beacon closure matrix now classifies B1 as **BLOCKED / P0 Registry identity**.

These are source/CEK and local-Yaci characterization results, not a Preprod transaction or Mainnet exploit observation. They are nevertheless sufficient to reject the current Registry consumer as authenticated for the intended Issue path.

The comparison from source SHA `53edd61177968ad4f2e1d0dc761c9c5d152bab1e` to inspected HEAD `8b301e95795e98d7066103debb81ce0693080202` contains ten commits and changes only the conservative-optimization workflow plus the Beacon matrix and coordination documentation. `plutus/MintPolicy.hs` is unchanged; the finding therefore remains applicable to the inspected HEAD.

## 3. Independent R1/Kc/Ω blocker

The current Agent A source audits establish:

- At S0, the only structurally valid current V3 action is `Issue(0,1)`.
- Under the direct-EEV margin `b = EEV - ProtectedCapital`, this action changes the margin by `-500 RU`.
- Immediate solvency at a sufficiently large EEV is not the same property as QNE non-erosion.
- The existing pure Active/Quiescent lifecycle helper is not reachable from the deployed S0 execution boundary, is not wired into `PreRichEconomicAdmission`, and does not prove completeness/authenticity of authoritative Ω.
- Current B1 `FundTreasury` is not a qualified QNE witness for the Direct-USDM profile: the validator's Oracle-valued liquidity predicate is not equivalent to physical tUSDM monotonicity, and donor availability is not guaranteed.
- The current `allOmegaSuccessorsCertified` boolean is an input/gate field, not an independently enumerated or cryptographically verified Ω proof.

The current runtime admission boundary validates the *shape* and cross-field binding of the viability-certificate envelope: non-empty references, 32-byte digest formatting, required VC1–VC6 and E1–E10 entries, network, state, carrier, EEV-snapshot and ProtectedCapital-source bindings. It does not verify the underlying proof contents or establish Ω completeness. The presence of these references or the boolean flag must not be represented as a completed R1 certificate.

No RiskMode downgrade, statistical substitution, new coefficient, or change to the 500× floor is authorized by this audit.

## 4. Readiness-gate limitation

`audit/cardano-integration/preprod-first-issue-readiness.mjs` currently checks deployment/source-set/EV1–EV7/Oracle/EEV-approval evidence, B2 control identity, a configured provider module, and the syntax of an external authority URL and public key.

It does **not** check:

- an authenticated B1 Registry identity/lineage artifact;
- a deployment-bound R1/Kc/Ω certificate or validation of VC1–VC6 and E1–E10 proofs;
- a live signed Issue-authority response for the exact proposed Issue request.

The corresponding test deliberately reaches `READY_FOR_WALLET_REVIEW` with generated synthetic artifacts, a generated Ed25519 public key, and an `.invalid` authority URL. The script separately marks `transactionsSubmitted=false` and `walletSigned=false`, and states that the status is not authorization to submit.

Therefore `READY_FOR_WALLET_REVIEW` is only a bounded pre-review status. It is not a security go/no-go for the first Issue and must never be presented as proof that the Registry and R1 gates are closed.

## 5. Gate order and ownership

| Gate | Current classification | Required closure |
|---|---|---|
| B1 Registry identity in Issue and SyncBeacon consumers | **BLOCKED / P0** | Agent B: specify and implement a non-forgeable unique Registry identity and authenticated lineage; require exact unambiguous references and preserve publisher/round/target/Value invariants. Validate with adversarial CEK and native local-ledger twins; do not count CEK harness PASS as security approval. |
| R1/Kc/authoritative Ω | **MISSING / BLOCKING** | Agent A: provide a total deployment-bound characteristic predicate and witness selector, a valid action model at the actual S0, VC1–VC6 and E1–E10 evidence, and an authoritative Ω completeness argument. Agent B independently reviews transaction/ledger binding. |
| Direct-USDM EEV and deployment approval | **REVALIDATE AT CURRENT LIVE CUT** | Re-observe the exact B1 PrizePool UTxO, asset identity and quantity; bind the current EV1–EV7 qualification and approval hashes to that exact candidate. Never infer live qualification from old artifacts or general CI. |
| Oracle/source and B2 control | **REVALIDATE AT CURRENT LIVE CUT** | Verify the exact authenticated Oracle State and external-source qualification, freshness, B2 singleton identity and their bindings to the same accepted deployment snapshot. |
| Wallet Issue transaction | **NOT AUTHORIZED** | Only after all upstream gates close: build the exact Issue request, independently review the final transaction body and settlement, obtain the intended CIP-30 wallet signature, submit, then reconcile the minted NFT and every state transition from the ledger. |

## 6. Agent A operational decision

1. Keep the first real Issue blocked while B1 Registry identity is unauthenticated.
2. Keep the first real Issue blocked while R1/Kc/Ω remains missing. Treat the S0 `-500 RU` result as a real proof obligation, not a paperwork omission.
3. Do not manufacture a viability certificate, accept a caller boolean as an Ω proof, rely on a buyer-selected Registry datum, or downgrade V1 500×.
4. Coordinate the Registry source/consumer fix with Agent B; resume the economic certificate work only against an explicit, stable action and state model.
5. Re-run the read-only readiness checks only after the missing gate contracts exist, and interpret `READY_FOR_WALLET_REVIEW` no more broadly than its documented scope.

**Non-effects:** no production source, test, workflow, datum/redeemer ABI, V3, Reveal, 500× rule, wallet, key, deployment, transaction, Preprod/Mainnet ledger state, or economic parameter was changed or executed by this audit.
