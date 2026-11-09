# Agent A — R1 S0 witness reachability matrix (2026-11-09)

**Review type:** read-only source census and documentation synthesis.  
**Branch:** `work/immortal-green-closure`.  
**Exact starting branch SHA:** `9a874c4cfb8a662fdd3245023d374cfea36fad1d`. A compare against the preceding FundTreasury falsification SHA returned `identical` (ahead 0 / behind 0) before this report was created.  
**Target:** the declared PRE-RICH Preprod Genesis S0 under the adopted Direct-USDM EEV profile and existing deterministic V1 500× exposure rule.

## Executive finding

The source census does **not** identify an existing, permissionless, transaction-bound QNE witness that is total at the declared Genesis S0.

At this S0, the deployment profile starts with class 0 active and saleable, all other classes non-saleable, and zero tickets, unresolved reserve/count, crystallized liabilities, safety capital, reserve protection, mandatory future costs and Jackpot. Of the four IMMORTAL V3 economic actions, only `Issue(0, 1)` is available. Its atomic B1 sale path preserves the complete PrizePool `Value` and leaves `ppTotalLiquidity` unchanged, while the V1 projection adds 500× worst-case exposure. On the same exact Direct-USDM Pool observation:

`Δ(EEV − ProtectedCapital) = 0 − 500 RU = −500 RU`.

The other candidate paths do not repair this S0 result:

- Current B1 `FundTreasury` is rejected as-is as a Direct-USDM QNE witness (see the separate falsification report): its scalar increase is Oracle-revalued and does not enforce physical tUSDM monotonicity or same-cut input/output EEV.
- The pure `ACTIVE → QUIESCENT` / `QUIESCENT → QUIESCENT` lifecycle predicate is a useful local building block, but no inspected on-chain path connects it to the Genesis carrier or to `PreRichEconomicAdmission`; the QNE list is caller supplied and its soundness as authoritative Ω remains external.
- V3/control carriers are separate state carriers with authority signatures, not an independent permissionless economic witness. The V3 carrier binds datum endpoint hashes but does not prove the action fingerprint is the actual V3 transition or bind it to the exact B1 Pool/EEV/admission evidence.

This is a bounded source census, **not** a proof of global T-EROSION and not proof that `K* = ∅`. It does not select a new certificate design or parameter.

## 1. S0 is pinned by the deployment profile

The PRE-RICH Preprod deployment profile declares:

- `currentActiveClass = 0`, `highestClassEverActivated = 0`;
- all eight classes have explicit cap 10, but only class 0 is initially saleable;
- `unresolvedReserve = 0`, `unresolvedTicketCount = 0`;
- `crystallizedLiabilities = 0`, `safetyCapital = 0`, `reserveProtection = 0`, `mandatoryFutureCosts = 0`;
- Jackpot starts inactive with zero locked amount.

Source: [PreRichPreprodDeploymentProfile.ts](https://github.com/LiberoNuvola/Immortal-Protocol/blob/9a874c4cfb8a662fdd3245023d374cfea36fad1d/PRE-RICH/src/PreRichPreprodDeploymentProfile.ts) (blob `18f5d1798692f7472fec0bf99fb447f6db586588`).

## 2. V3 economic action matrix at S0

The complete `V3Action` algebra in `EconomicTransitionV3.hs` contains exactly `Issue`, `Reveal`, `Claim`, and `Expire`; there is no economic `Hold`/NoOp constructor.

| Action | S0 availability | Source condition / economic consequence | R1 disposition |
|---|---|---|---|
| `Issue(cid, price)` | **Only `Issue(0, 1)` is available** under the declared initial profile. | Requires canonical class price and `classSaleable`; it increments unresolved reserve/count and the class exposure. Under the V1 projection, worst-case protected exposure rises by 500 RU for the 1-USDM Genesis ticket. The atomic B1 sale path preserves the full Pool Value, so Direct-USDM EEV does not rise in that same transaction. | **Fails QNE by −500 RU** on the same Pool observation. Solvency at a high enough starting EEV is a separate predicate and does not change this delta. |
| `Reveal(cid, payout)` | **Unavailable.** | Requires an unresolved ticket of the class, a positive unresolved count/reserve and a valid payout. S0 has none. | Not an S0 witness. On later states, Reveal crystallizes liability and releases reserve; it is not a capital-accretion operation. |
| `Claim(amount)` | **Unavailable.** | Requires `amount > 0` and `amount <= v3CrystallizedLiabilities`; S0 liabilities are zero. | Not an S0 witness. It is a settlement outflow. |
| `Expire(cid)` | **Unavailable.** | Requires an unresolved ticket in the class and sufficient unresolved reserve; S0 has none. | Not an S0 witness. Expiry may release protected exposure on a later, expired-ticket state, but that does not provide a Genesis-S0 transition or a total witness for states without an expirable ticket. |

Sources: [EconomicTransitionV3.hs](https://github.com/LiberoNuvola/Immortal-Protocol/blob/9a874c4cfb8a662fdd3245023d374cfea36fad1d/IMMORTAL/kernel/EconomicTransitionV3.hs) (blob `62c2980a821cdcfc33a33e15a09617256ab8753c`); deployment profile above; [PreRichEconomicProjection.hs](https://github.com/LiberoNuvola/Immortal-Protocol/blob/9a874c4cfb8a662fdd3245023d374cfea36fad1d/PRE-RICH/onchain/PreRichEconomicProjection.hs).

## 3. B1 PrizePool action matrix

The B1 redeemer algebra contains `FundTreasury`, `TicketIssued`, `TicketRevealed`, `TicketClaimed`, and `TicketExpired`.

| B1 action | S0 availability | Relevant source-enforced behavior | R1 disposition |
|---|---|---|---|
| `FundTreasury` | Structurally available when a continuing Pool and funding transaction exist. | Recomputes the **output** Pool scalar with `Economic.poolUsdmValue`; requires output `ppTotalLiquidity` to equal that scalar and exceed the old input datum. It preserves liability/reserve/count/Jackpot datum fields and checks solvency. It does not require full physical Value monotonicity, direct tUSDM monotonicity, or same-cut revaluation of the input datum. | **Rejected as-is** for Direct-USDM QNE. See [FundTreasury falsification](https://github.com/LiberoNuvola/Immortal-Protocol/blob/9a874c4cfb8a662fdd3245023d374cfea36fad1d/docs/COORDINATION/AGENT-A-R1-FUNDTREASURY-QNE-FALSIFICATION-2026-11-09.md). |
| `TicketIssued(price)` | Only as part of the atomic ticket-mint sale; at S0 it accompanies `Issue(0,1)`. | The B1 validator keeps `ppTotalLiquidity` unchanged and increments unresolved reserve/count. Importantly, the **MintPolicy** also calls `atomicPoolReservationValid`, which requires the complete input Pool `Value ==` output Pool `Value`, unchanged `ppTotalLiquidity`, and the exact reserve/count delta. The same mint policy requires atomic Treasury payment. Thus a donor cannot add tUSDM to the Pool inside the ordinary ticket-mint transaction to repair the −500 RU delta. A compiled-MintPolicy regression suite exists for changed ADA/native-asset quantities and added/removed assets. | Confirms the Issue EEV delta is zero on the atomic path; **not QNE** after the 500 RU protected-exposure increase. |
| `TicketRevealed(price)` | Unavailable at S0; requires a consumed Pending Prize ticket. | B1 keeps `ppTotalLiquidity` unchanged and updates reserve/count/liabilities. The inspected B1 Reveal branch does not itself compare the complete Pool Value input/output; `PrizeValidator` checks the Pool datum accounting, not a complete direct-tUSDM identity. | Not an S0 witness. On future states, it is not a certified direct-EEV-preserving path merely because the scalar datum is unchanged. |
| `TicketClaimed(amount)` | Unavailable at S0; requires a Revealed ticket and positive crystallized payout. | Checks owner signature and payout; compares Oracle-valued Pool input minus output to `claimedAmount`; reduces `ppTotalLiquidity` and pending liabilities. This comparison is not a direct-tUSDM monotonicity proof. | Not an S0 witness; settlement consumes Pool value. |
| `TicketExpired` | Unavailable at S0; requires an existing Pending or Revealed ticket whose expiry time has arrived. | Requires exact full Pool `Value` equality between input and output; releases unresolved reserve/count or the expired unpaid liability. | Not an S0 witness. Could be relevant to a future state-dependent QNE proof because protected obligations may fall while physical EEV is preserved; it cannot witness Genesis S0 where no ticket exists. |

Primary sources:

- [B1PrizePool.hs](https://github.com/LiberoNuvola/Immortal-Protocol/blob/9a874c4cfb8a662fdd3245023d374cfea36fad1d/plutus/B1PrizePool.hs), blob `175be60b8f01ef214c92d7527191bcebb66ad656`.
- [MintPolicy.hs](https://github.com/LiberoNuvola/Immortal-Protocol/blob/9a874c4cfb8a662fdd3245023d374cfea36fad1d/plutus/MintPolicy.hs), blob `0d59fc05b4c11873984fffd10014bd46d8470509`: `atomicPoolReservationValid` requires exact Value equality; `mkPolicy` invokes it for the minted ticket.
- [MintPolicyB1ValuePreservationTest.hs](https://github.com/LiberoNuvola/Immortal-Protocol/blob/9a874c4cfb8a662fdd3245023d374cfea36fad1d/plutus/test/MintPolicyB1ValuePreservationTest.hs), blob `acf05b516647517b14e1536fb319199c2c89448c`; listed in [pre-rich-plutus.cabal](https://github.com/LiberoNuvola/Immortal-Protocol/blob/9a874c4cfb8a662fdd3245023d374cfea36fad1d/plutus/pre-rich-plutus.cabal), blob `91c66f5670a695924d6b462eb25d7dadeebdc670`. **The suite was inspected, not run as part of this audit.**
- [PrizeValidator.hs](https://github.com/LiberoNuvola/Immortal-Protocol/blob/9a874c4cfb8a662fdd3245023d374cfea36fad1d/plutus/PrizeValidator.hs), blob `0e76d5c3bfd636b2cf212b3513ca84d48c6e3a41`.

## 4. Other live state/action carriers are not an S0 QNE witness

### Genesis regime carrier

`GenesisRegimeCarrier` has one redeemer constructor: `ActivateGenesis`. It checks a verified Treasury/Oracle observation, singleton carrier identity, the `PRE_GENESIS → GENESIS` tag/nonce/version transition, and preserves the carrier's complete Value. The pure `preGenesisToGenesis` predicate is also explicitly restricted to that one edge. Neither path supplies a `GENESIS → ACTIVE` or `GENESIS → QUIESCENT` transition.

Sources: [GenesisRegimeCarrier.hs](https://github.com/LiberoNuvola/Immortal-Protocol/blob/9a874c4cfb8a662fdd3245023d374cfea36fad1d/PRE-RICH/onchain/GenesisRegimeCarrier.hs), blob `276b09deace4475853320356375a12f9ee5f1d60`; [PreRichRegimeState.hs](https://github.com/LiberoNuvola/Immortal-Protocol/blob/9a874c4cfb8a662fdd3245023d374cfea36fad1d/PRE-RICH/onchain/PreRichRegimeState.hs), blob `6d58607cb4a853b1a0a16e180552140d9219704e`.

### Existing lifecycle/QNE module

`PreRichLifecycleTransition` implements pure `ACTIVE → QUIESCENT` and `QUIESCENT → QUIESCENT` nonce-advancing transitions. `qneWitnessHolds` compares the pre/post `EEV − ProtectedCapital` and also checks representation/safety booleans. `qneAcrossOmega` rejects an empty witness list and checks every supplied element, but its module comment expressly leaves the caller responsible for proving that the list is a sound over-approximation of authoritative deployment Ω.

The module is exposed in the Haskell library and has a test suite, but the inspected on-chain entrypoints do not accept `PreRichLifecycleAction` or call `lifecycleTransition`; the Genesis carrier has no corresponding action and no Genesis-to-Active edge. The pure witness is therefore not a reachable or transaction-bound S0 witness.

Source: [PreRichLifecycleTransition.hs](https://github.com/LiberoNuvola/Immortal-Protocol/blob/9a874c4cfb8a662fdd3245023d374cfea36fad1d/PRE-RICH/onchain/PreRichLifecycleTransition.hs), blob `edae4c21dc98cb07791c83337d5df49bad9a01e5`.

### V3 economic state carrier

`V3EconomicStateCarrier` exposes only `AdvanceV3State`. Its envelope accepts one of the four text labels `Issue/Reveal/Claim/Expire`, binds supplied pre/post hashes to the datum endpoints, and verifies a 64-byte Ed25519 signature under a configured authority key. The carrier's complete Value is preserved.

This is not a permissionless economic transition proof: the signature is an authority gate, and the signed `actionFingerprint` is only checked for format/length and included in the signed message. The validator does not itself recompute the V3 transition from the action, bind the fingerprint to the B1 Pool UTxO/value, or consume the `PreRichEconomicAdmission` result/Ω certificate.

Source: [V3EconomicStateCarrier.hs](https://github.com/LiberoNuvola/Immortal-Protocol/blob/9a874c4cfb8a662fdd3245023d374cfea36fad1d/PRE-RICH/onchain/V3EconomicStateCarrier.hs), blob `f2d0beb9aeeddc0e95b21583d846d56786936dec`.

### B2 Control carrier

`PreRichControlCarrier` exposes `ActivateControl` and `ContractControl`. Both require a configured authority key among transaction signatories, preserve the complete carrier Value, and advance its state version/nonce. These actions adjust class-control fields; they do not create direct tUSDM EEV or bind a QNE successor envelope. They are not permissionless Hold/QNE witnesses.

Source: [PreRichControlCarrier.hs](https://github.com/LiberoNuvola/Immortal-Protocol/blob/9a874c4cfb8a662fdd3245023d374cfea36fad1d/PRE-RICH/onchain/PreRichControlCarrier.hs), blob `ce5a73dd29894367f031924e5a282935d8d3d66f`.

### Beacon, ticket-sync and Treasury auxiliary paths

- B1 `RegistryPublish` is relayer-signature gated and changes beacon registry data, not the PrizePool's EEV/ProtectedCapital state. Source: [BeaconRegistry.hs](https://github.com/LiberoNuvola/Immortal-Protocol/blob/9a874c4cfb8a662fdd3245023d374cfea36fad1d/plutus/BeaconRegistry.hs), blob `184f4178139dde01845853dcc0ab51371949ec9b`.
- Prize `SyncBeacon` updates a ticket's beacon fields after reading a ready registry. It is not one of the four V3 economic actions, requires an existing Prize ticket, and does not fund the B1 Pool. Source: [Types.hs](https://github.com/LiberoNuvola/Immortal-Protocol/blob/9a874c4cfb8a662fdd3245023d374cfea36fad1d/plutus/Types.hs), blob `60caeb747018b512e8e6ae7d8a100bb7023863d9`, and [PrizeValidator.hs](https://github.com/LiberoNuvola/Immortal-Protocol/blob/9a874c4cfb8a662fdd3245023d374cfea36fad1d/plutus/PrizeValidator.hs).
- Legacy Treasury `Distribute` computes a percentage split from lovelace and checks lovelace payments to configured scripts. It does not account for or create the Direct-USDM EEV witness. Source: [Treasury.hs](https://github.com/LiberoNuvola/Immortal-Protocol/blob/9a874c4cfb8a662fdd3245023d374cfea36fad1d/plutus/Treasury.hs), blob `8313ed0672ce2a18c6156fce01db0ea75efddd1c`.

## 5. Admission and EEV binding remain a separate certification gap

`PreRichEconomicAdmission` is a pure composition over `preEEV`, `candidateEEV`, executable liquidity, required liquidity, and caller-provided booleans `truthVerified`, `eevFresh`, `obligationsComplete`, and `allOmegaSuccessorsInCertifiedKernel`. It returns a structured admission value when those predicates pass, but this function alone does not authenticate those input booleans, enumerate authoritative Ω, or bind the candidate EEV to the exact Pool input/output references of the signed ledger transaction.

The adopted Direct-USDM producer reads the exact configured tUSDM quantity from a specified Pool observation and explicitly does not call `Economic.poolUsdmValue`. By contrast, `Economic.totalUsdmValue/poolUsdmValue` values non-zero assets using the current Oracle State and publisher. These are distinct valuation bases; an Oracle-valued scalar cannot silently stand in for physical tUSDM quantity.

Sources: [PreRichEconomicAdmission.hs](https://github.com/LiberoNuvola/Immortal-Protocol/blob/9a874c4cfb8a662fdd3245023d374cfea36fad1d/PRE-RICH/onchain/PreRichEconomicAdmission.hs), blob `a654587114beec997d97d59810d1fb648facf365`; [DirectUsdmEev.ts](https://github.com/LiberoNuvola/Immortal-Protocol/blob/9a874c4cfb8a662fdd3245023d374cfea36fad1d/Adapter/CARDANO/observation/DirectUsdmEev.ts), blob `0c6fa421a2655a2e84610f8ae4dae2a002120cbf`; [Economic.hs](https://github.com/LiberoNuvola/Immortal-Protocol/blob/9a874c4cfb8a662fdd3245023d374cfea36fad1d/plutus/Economic.hs), blob `e50366a65ce34e9433d5ff179dfc03a35a24c1a1`.

## 6. Disposition and non-claims

**Current S0 disposition:** no existing source path reviewed supplies the required permissionless, automatic, transaction-bound, Direct-USDM QNE witness at Genesis S0. `Issue(0,1)` is the only available V3 economic action and erodes the margin by exactly 500 RU under the unchanged V1 500× rule. `FundTreasury` is not a qualified substitute. The existing quiescence predicate is not ledger-reachable from Genesis and does not establish authoritative Ω.

**This does not establish:**

- that every reachable state/action erodes the margin (global T-EROSION);
- that the maximal non-eroding set is empty (`K* = ∅`);
- that an alternate inductive/terminal R1 certificate is impossible;
- that a future state-dependent expiry or separately governed funding path could never be QNE;
- that a probabilistic cohort guarantee is equivalent to the existing deterministic V1 promise.

**No change made:** no production source, tests, workflow, parameters, 500×, V3, Reveal, ABI, oracle, wallet, transaction, deployment or ledger state changed. No tests or CI were run. No R1/Kc certificate is issued. Issue #37 remains OPEN / BLOCKED.
