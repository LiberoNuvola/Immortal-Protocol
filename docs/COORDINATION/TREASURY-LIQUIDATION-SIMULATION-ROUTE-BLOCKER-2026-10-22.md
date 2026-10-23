# Treasury liquidation simulation — route blocker

**Date:** 2026-10-22  
**Branch:** `work/immortal-green-closure`  
**Classification:** audit/engineering note; non-normative. No deployment authorization.

## Confirmed source state

- `plutus/Treasury.hs` implements the legacy `Distribute` action and percentage distribution to four destinations. It is not an asset-swap action.
- `src/mint.ts` sends application-sale settlement to the configured Treasury output; that does not establish a Treasury-to-USDM liquidation route.
- Repository searches for Minswap, SundaeSwap, DexHunter and `swapExact` returned no implementation matches in the indexed default-branch code. This is a search result, not proof that no integration exists anywhere in every branch or external service.
- No route has yet been evidenced that binds a Treasury-owned asset input, a specific Cardano DEX/AMM execution, minimum USDM output, execution costs, and the resulting USDM output to one transaction.

## Simulation harness

- `audit/cardano-integration/treasury-liquidation-simulation.mjs` computes deterministic integer arithmetic from explicitly supplied inputs.
- `audit/cardano-integration/treasury-liquidation-simulation.test.mjs` covers a buffer-preserving scenario, buffer erosion, negative post-sale buffer, missing inputs, and costs exceeding gross proceeds.
- `.github/workflows/treasury-liquidation-simulation.yml` runs the tests before a manual scenario and uploads the result artifact.
- These tests and the workflow have been committed but have **not** been executed in GitHub Actions in this work session. A workflow definition is not run evidence.

## Required next proof

Before using this to claim a sale is executable, select and evidence an actual route with:
1. canonical asset identity and Treasury-controlled input UTxO;
2. exact pool/route identity and current on-chain state;
3. deterministic quote/transaction construction, including slippage bound and minimum USDM output;
4. submitted transaction and observed ledger result, including actual received USDM and fees;
5. reconciliation of asset value removed from EEV versus net USDM received, using the governed execution-cost and valuation method;
6. post-state EEV and ProtectedCapital recomputation from authenticated sources.

The simulator's `SCENARIO_PASS` is only a result for the supplied arithmetic. It is not proof of a swap, liquidity, custody, authoritative EEV, or the universal QNE condition. `OBSERVED_EXECUTION` is only an input label and must not be treated as authenticated by the simulator.

## Guardrails
Do not infer a DEX route, price, liquidity, haircut, slippage, or fee model. Do not change normative economic semantics, V3 carrier, or Reveal. Keep the QNE universal proof separate from a single successful execution scenario.

## Treasury inventory observation — 2026-10-22 follow-up

- The observer uses Lucid's canonical utility path with a local `Emulator` for offline script-address derivation and Koios for live read-only queries.
- Verified successful run: [GitHub Actions run 39838496359](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39838496359); artifact ID `12450959815` (`preprod-treasury-inventory-observation`); observed at `2026-10-22T19:15:54.567Z`.
- Current artifact-derived candidate: `addr_test1wpaz5k9ejt3f6y82ufu6araf8w6ymp20lqe0pq3mpxcewzq4mhrsw`; script hash `7a2a58b992e29d10eae279ae8fa93bb44d854ff832f0823b09b19708`; artifact SHA-256 `1387e1875da33ec65120356763fc0e1b3373c9ca3ccec9b57d749b395045318c`.
- Koios `POST /address_utxos` returned zero rows for this candidate: `utxoCount=0`, `tADA=0`, `tUSDM=0`. This only proves the candidate address has no indexed UTxOs at observation time; it does not prove the deployment-configured Treasury is empty or that it uses this address.
- The first observer version used the bare asset name `745553444d` (`tUSDM`) and was wrong for the configured Preprod asset. The canonical configured unit is policy `e675b46e4d2242c991a8932a99db3044e80515ae14b4c4ccf6b3f4c9` plus asset-name hex `0014df10745553444d`; the CIP-67 label prefix is part of the unit. The observer was corrected in commit `5bb1bfe56746345a0aca5570aca658785437fcff`.
- On the same Preprod policy, Koios `GET /policy_asset_list` returned two assets: `000643b0745553444d` with total supply `1`, and canonical `0014df10745553444d` with total supply `20120457000000` atomic units. `GET /asset_addresses` found **281 current holders** of the canonical unit, but the current artifact-derived Treasury address is not among them.
- This confirms that the configured tUSDM asset exists and is held on Preprod, while the current artifact-derived Treasury candidate holds neither tADA nor tUSDM. The unresolved blocker is the identity/binding of the actual deployment-configured Treasury address or its known live UTxO. Do not infer which of the 281 holders is the Treasury, and do not fund or bootstrap an address merely to make the check pass.
- Historical-address cross-check also completed in [run 39838748869](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39838748869), artifact ID `12451099826`. The Treasury artifact at commit `2d3277ecf89a1b2e7489c85795470b0777446691` derives to `addr_test1wp3534ewfhn88gduvs723k0x8eakdduf5rpsdhr823enzlqumm5u4` (script hash `6348d72e4de673a1bc643ca8d9e63e7b66b789a0c306dc675473317c`); Koios also returned zero UTxOs there. Neither of the two known Treasury artifact versions identifies the funded address.
- The earlier manually derived address `addr_test1wrnd6rtjfzyc06r2rza338d3py0xeuuafpw6fe8rva5wruqawmlq4` and hash `e6dd0d72488987e86a18bb189db1091e6cf39d485da4e4e36768e1f0` are superseded; do not use them as canonical evidence.
- Repository trace confirms `src/mint.ts` uses deployment-configured `VITE_TREASURY_ADDRESS` when present, and only falls back to the address derived from the unparameterized `treasuryValidator`; `.env.example` leaves that variable blank and the public Preprod workflow does not expose its deployment value. Thus the zero-UTxO result on the derived address cannot resolve the actual configured address. The first PRE/tUSDM holder intersection query returned 0 because Koios reports 0 holders for the configured PRE unit; this is not evidence that Treasury lacks funds. The subsequent read-only scan of all 281 canonical tUSDM holders has completed in [run 39843060345](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39843060345); see the completed-scan findings below. Candidates remain unqualified until matched to the actual deployment binding or known transaction reference.
- The script-holder discovery completed successfully in [run 39843060345](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39843060345), artifact ID `12453783129`, observed at `2026-10-22T19:48:21.931Z`. Koios `POST /address_info` returned records for all 281 searched holders and identified 15 as script addresses with canonical tUSDM. This is candidate discovery only: none has been matched to the deployed `VITE_TREASURY_ADDRESS`, the Treasury validator identity, or a known Treasury transaction reference.
- The scan includes script-address balances ranging from tiny amounts to `9,629,000` tUSDM and `4,999,000` tUSDM (displayed in token units using 6 decimal places). Large balances are not evidence of Treasury ownership; they may belong to unrelated contracts or liquidity infrastructure. Do not attribute any candidate to IMMORTAL by balance, datum presence, or script-address status alone.
- The artifact explicitly records `liquidationRouteVerified=false`, `swapExecuted=false`, and `qneProven=false`. Current derived Treasury address remains at zero UTxOs. Thus this run advances discovery but does not close the custody/inventory blocker and does not authorize a sale or bootstrap.
- Follow-up repository triangulation (current `work/immortal-green-closure`): `docs/04-guides/15_PREPROD_TREASURY_USER_BOUNDARY_v0.1.md` explicitly says Preprod must expose a real protocol-controlled Treasury script address, describes deriving it from the published Treasury validator, inspecting its UTxOs, and only then optionally making a user-signed deposit. `docs/COORDINATION/IMMORTAL_MASTER_FRONT_MATRIX_v0.1.md` still marks deployment-configured Treasury identity and canonical observation/admission binding OPEN. This supports classifying the issue as an unresolved deployment/identity binding, not a proven hidden funded Treasury.
- Searches across the indexed repository source found no literal `VITE_TREASURY_ADDRESS` deployment value or committed Treasury deployment manifest. `.env.example` leaves it blank; application config reads it from runtime environment. The public Preprod workflow's `PREPROD_WALLET_ADDRESS` is a user wallet and MUST NOT be reused as the Treasury identity. GitHub secrets are not exposed by the repository search/API, so absence from public source cannot prove whether a private deployment variable exists.
- A further distinction from the existing `audit/cardano-integration/fund-treasury-oracle-valuation-trace.ts`: despite its filename, it is a local-Yaci fixture that creates a test wallet, a test Oracle singleton, and a synthetic B1 PrizePool, then exercises the Pool's `FundTreasury`/canonical ADA valuation path. Its own source hardcodes a test seed, test policy identities, and synthetic liquidity amounts. It is not evidence of a funded Preprod Treasury, a Treasury-owned tUSDM balance, or a Treasury-to-USDM swap. The existing workflow step must not be conflated with liquidation support.
- The 281-holder scan is now a completed discovery pass, not a continuing path to identify Treasury by guesswork. Do not select one of the 15 script holders from balance/shape. The next qualifying input must be either (a) the actual deployment value for `VITE_TREASURY_ADDRESS`, or (b) a known transaction/UTxO reference binding the canonical Treasury script hash to a live Preprod output. If neither exists, report the Treasury as not yet evidenced/deployed and do not claim inventory or swap readiness.
- Even after locating the actual Treasury, inventory evidence alone does not prove a DEX route, minimum-output bound, executed swap, or QNE.

## Follow-up verification — 2026-10-23

- The latest conformance workflows on commit `e52479345bce6dbb906d3d4b84b87a893ecce5d5` completed successfully: [Protocol Declaration Conformance](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39897944623), [Cardano Adapter Sale Conformance](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39897944669), [IMMORTAL Portability Conformance](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39897944594), [Algorithmic Governability Adversarial Lab](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39897944616), and [Documentation Link Check](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39897944631). These are conformance checks for the repository changes; they are not a live Treasury observation or a DEX execution.
- Re-inspection of `audit/cardano-integration/preprod-real-reveal.mjs` confirms that it constructs test policy IDs from the workflow wallet and synthetic Pool/Oracle context; it hardcodes `PRICE_USDM = 100n` and `TOTAL_LIQUIDITY_USDM = 100_000n`. A deployment manifest emitted by that test sequence is not, by its filename alone, proof of the canonical Treasury deployment, actual tUSDM custody, or a live liquidation route.
- The EEV approval workflow is explicitly manual (`workflow_dispatch`) and gated by `approve_eev=true`, plus configured secrets/environment. No evidence found in the reviewed public source establishes that this workflow has been run successfully against a canonical Treasury UTxO. Do not infer approval from the workflow definition or unrelated successful CI.
- Conclusion unchanged: code-level conformance is green for the latest listed checks, while the operational Treasury identity/custody and liquidation route remain unproven. No transaction, deposit, bootstrap, V3 change, or Reveal semantic change was made.


## Notion triangulation — historical EEV approval provenance gap

The Notion **PRE-RICH — Control Center**, entry dated 2026-10-22 (checkpoint §10.72), records historical approval run [#39552468679](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39552468679), but explicitly identifies a source-provenance mismatch: the artifact binds to workflow commit `97b09a38742098f17a61eb07734c401aeedccc06` on `main`, where four EV paths required by the readiness gate (EV2 `DirectUsdmEev.ts`, EV3 source-set producer, EV4 conversion tests, EV5 exact-Pool binding tests) were not present at that SHA. The recorded historical `DEPLOYMENT_APPROVED` artifact is therefore not reproducible as current EV1–EV7 source evidence. This does not prove its calculation false; it breaks the source/evidence provenance join and cannot be used as current approval proof.

The same Notion control-center entry says the earlier source observation was at `2026-10-21T05:57:26.613Z` and required `LIVE_UTXO_REVALIDATION` immediately before admission. The exact out-reference was not freshly revalidated in the evidence reviewed here. The configured Preprod tUSDM unit is identified as policy `e675b46e4d2242c991a8932a99db3044e80515ae14b4c4ccf6b3f4c9` plus asset name `0014df10745553444d`; however, governance approval of this test-network asset as the settlement unit for IMMORTAL/PRE-RICH is a separate decision and must not be inferred from the asset identity alone.

**Disposition:** historical EEV approval is not sufficient to close P-01 or authorize Issue. Required sequence remains: current reviewed source bytes → fresh exact-Pool live source-set → EV1–EV7 qualification with source and evidence digests bound together → separately authorized new approval → live UTxO revalidation at admission. This is not the same as identifying a Treasury liquidation route; both the deployment Treasury identity/custody and any asset-to-USDM execution route remain unproven. No approval workflow was dispatched and no transaction was submitted during this check.


## Notion governance cross-check — settlement equivalence versus liquidation

**Checked:** 2026-10-23; Notion pages `11 — EconomicFeeTarget Parameterization & PRE Settlement Asset Decision Record v0.1`, `18 — PRE Settlement Asset Granularity, Price Domain & Concrete Affordability Parameters v0.1`, and `23 — DApp → Cardano Adapter Operational Bridge & Live Conformance v0.1`.

- The recorded settlement rule (DEC-3) keeps **USDM as the economic reference unit** and allows USDM, ADA, or another supported asset only when the exact required USDM-equivalent value is established by the active verified price reference and settlement precision. Overpayment and underpayment are invalid.
- This is a settlement-conformance rule; it does **not** prove a Treasury-to-USDM swap route, actual liquidity, execution cost, minimum-output protection, or a completed ledger transaction. The DApp → Adapter operational bridge remains OPEN.
- The settlement-asset parameterization record is not a numerical or execution authorization: deployment-specific price/affordability parameters remain open. No new governance decision authorizing a Preprod tUSDM settlement profile or a Treasury liquidation route was found in the reviewed records.
- Therefore the next qualifying evidence is still deployment-bound: identify the actual configured Treasury via `VITE_TREASURY_ADDRESS` or a known transaction/UTxO reference bound to the canonical Treasury script, then independently establish a concrete route and execution evidence. Do not choose among the 281 tUSDM holders by balance or script shape.
- No workflow was dispatched, no transaction was submitted, and no V3/Reveal semantics were changed by this cross-check.


## Workflow safety boundary — direct-USDM bootstrap is not a liquidation probe

**Rechecked:** 2026-10-23 against `.github/workflows/immortal-cardano-preprod.yml`.

- The workflow exposes manual input `bootstrap_direct_usdm`. Its job verifies `PREPROD_REVEAL_SEED`, materializes Oracle State, bootstraps a direct-USDM B1 PrizePool, and then creates source-set and EV1–EV7 qualification artifacts. This is a chain-changing bootstrap path, not a read-only Treasury inventory check and not an asset-to-USDM swap.
- Do not dispatch this job as a substitute for finding the configured Treasury or proving liquidation. It can sign/submit transactions and its artifacts would not, by themselves, prove an existing Treasury-owned asset can be sold.
- The current simulator remains arithmetic-only. It accepts `OBSERVED_EXECUTION` as a caller-supplied label and explicitly says external evidence must substantiate it; the label is not authenticated by code.
- Latest documentation/conformance runs for commit `da0f29386e6809ba178e0d722049a8fdb77bcd34` are green: Documentation Link Check [39899137883](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39899137883), Protocol Declaration [39899137884](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39899137884), Cardano Adapter Sale [39899137859](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39899137859), Portability [39899137970](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39899137970), and Algorithmic Governability [39899137899](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39899137899). These are code/documentation conformance only.
- At the time of this check, Integration Lab run [39899115419](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39899115419) and Aiken Reveal Parity run [39899115424](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39899115424) were still in progress on a different commit (`c1cf860c6587e74181a793b9188c0be605393b9b`). Their eventual results must be evaluated on their own SHA and must not be conflated with Treasury/EEV evidence.
- No workflow was dispatched and no transaction was submitted during this review. V3 and Reveal semantics remain untouched.

## CI refresh — 2026-10-23 04:20 UTC

Latest runs on `work/immortal-green-closure` were checked against their exact commit SHAs:

- Checkpoint commit `aed69a6f53fc57260145658a10c1245827a9313b`: Protocol Declaration Conformance `39899502847`, Cardano Adapter Sale Conformance `39899502938`, IMMORTAL Portability Conformance `39899502872`, Algorithmic Governability Adversarial Lab `39899502865`, and Documentation Link Check `39899502967` all completed successfully.
- Reveal Parity run `39899115424` on `c1cf860c6587e74181a793b9188c0be605393b9b` subsequently completed successfully. This records test status only; no Reveal semantics or code were changed here.
- IMMORTAL Cardano Integration Lab run `39899115419` on the same `c1cf860c6587e74181a793b9188c0be605393b9b` was still in progress at the real TicketIssued 500x solvency boundary trace when checked; downstream lab steps remain pending. Do not infer a final pass/fail from this intermediate state.
- The latest successful runs above are conformance/documentation checks, not proof of a live Treasury identity, Treasury swap route, liquidatable inventory, or EEV qualification. The existing address-derivation workflow only derives a script address from the committed validator artifact and explicitly emits `verifiedOnLedger: false`; it does not establish a deployment-configured Treasury UTxO.
- No workflow was dispatched, no approval was created, and no transaction was built, signed, or submitted during this refresh.

## Deployment binding re-check — 2026-10-23

A fresh tracked-tree scan at commit `435af3eac896fe73c48c6397530ec9e364592470` found no committed `preprod-deployment.json`, `preprod-direct-usdm-deployment.json`, `preprod-oracle-state-deployment.json`, or generated `treasury-address.json`; only `.env.example` matched the environment-file scan. GitHub code search also found `VITE_TREASURY_ADDRESS` only as a deployment-configured variable in `src/config.ts`, an empty placeholder in `.env.example`, and descriptive references in the Treasury surface map. This is evidence that the live deployment binding is not committed in the scanned tree, **not** evidence that repository/environment secrets are absent; secret values are not readable through this audit.

The address-derivation workflow deterministically derives a candidate from `plutus/out/treasury.plutus.json` and explicitly marks `verifiedOnLedger: false`. It is not a substitute for the deployment-bound address plus an observed live UTxO.

Integration Lab run `39899115419` (commit `c1cf860c6587e74181a793b9188c0be605393b9b`) later ended as **cancelled**, not passed. Its earlier in-progress state must not be cited as a successful final run. This audit did not rerun it because it is a devnet integration workflow and the cancellation reason is not established here.

Next evidence needed: a non-secret deployment manifest or public deployment record that binds the configured Treasury script hash/address to the exact network and deployed validator version, followed by read-only exact UTxO observation. If the deployment binding exists only in GitHub environment configuration, a permitted workflow should emit a sanitized, signed/hash-bound manifest without exposing secrets or performing funding/approval actions. Do not infer the configured address from the user's wallet or from the unparameterized script address.


## Historical EEV approval artifact inspection — 2026-10-23

Downloaded and inspected existing GitHub Actions artifacts without dispatching a workflow:

- Direct-USDM deployment artifact from run [#39540626322](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39540626322), artifact ID `12319471653`, SHA-256 of the uploaded ZIP reported by Actions `8db815c0a773f0a6c6fe26d7b82c6a2a9fa41e94873598b68dffe4b0213bda99`.
- Approved EEV artifact from run [#39552468679](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39552468679), artifact ID `12324421376`.

The direct-USDM manifest records network `cardano-preprod`, a derived B1 PrizePool address/hash, exact canonical tUSDM unit `e675b46e4d2242c991a8932a99db3044e80515ae14b4c4ccf6b3f4c9` + asset name `0014df10745553444d`, quantity `1000000000` atomic units, and EEV conversion `100000` sub-units. It explicitly says `bootstrap.txHash=null` and `reusedExisting=true`: this run reused an already-existing direct-USDM Pool rather than executing a swap. The manifest's `treasuryHash` is a topology value derived by `buildScriptsFromLucid`; it does not bind a configured `VITE_TREASURY_ADDRESS` or identify a Treasury UTxO.

The approved artifact contains a nested `DEPLOYMENT_APPROVED` decision bound to the direct-USDM Pool candidate and hashes for the qualification, source set, deployment manifest and Oracle State. It explicitly limits its effect: it does not authorize Issue admission; live UTxO revalidation and authenticated control state, ProtectedCapital provenance, viability/liquidity evidence and authoritative Issue decision remain required. The source set used for that approval was observed on 2026-10-21 and references exact Pool out-ref `b84fce37cd31ea6463d2c59fa1c2a7cd0871e1620146fe3741308ab2e610b020#0`; it is historical evidence, not a fresh observation as of this checkpoint.

**Classification update:** the direct-USDM EEV candidate did have a historical successful EV1–EV7 qualification and a separate approval artifact. Therefore do not describe the direct-USDM candidate as never approved. The remaining blocker in this workstream is different: no proof of Treasury asset-to-USDM execution/liquidation or actual route proceeds has been found, and the direct-USDM Pool artifact is not a Treasury deployment binding. The apparent provenance discrepancy is partially resolved by the workflow definition: although the approval run itself is registered on `main` at `97b09a38742098f17a61eb07734c401aeedccc06`, `.github/workflows/pre-rich-b1-eev-approval.yml` explicitly checks out the qualified protocol snapshot `0e5fa575f84e3759655b6d0a3492b2f0b79aa446` before running EV1–EV7. The four questioned EV2–EV5 paths are present at that pinned snapshot. This resolves the mistaken comparison against the workflow-definition SHA, but does not independently reproduce the historical live observation/approval or make it current admission evidence.

No workflow was dispatched and no chain state was changed while retrieving or inspecting these artifacts.


## Historical approval source-pin reconciliation — 2026-10-23

The provenance check was completed against the exact workflow definition and exact checkout pin:

- Approval run [#39552468679](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39552468679) was triggered from `main` at workflow-definition SHA `97b09a38742098f17a61eb07734c401aeedccc06`. That SHA does not contain the four EV2–EV5 source paths.
- The workflow `.github/workflows/pre-rich-b1-eev-approval.yml` at that SHA explicitly pins its checkout to qualified protocol snapshot `0e5fa575f84e3759655b6d0a3492b2f0b79aa446` (comment: “Pin the exact qualified protocol snapshot; update only after requalification”). The approval job runs the source-set producer, qualification producer and approval producer from that pinned checkout, not from the workflow-definition SHA.
- Direct reads at the pinned SHA confirmed all four paths exist: `Adapter/CARDANO/observation/DirectUsdmEev.ts`, `audit/cardano-integration/preprod-direct-usdm-source-set.mjs`, `Adapter/CARDANO/observation/DirectUsdmEev.test.ts`, and `Adapter/CARDANO/observation/PreprodDirectUsdmObservation.test.ts`. The qualification script itself names these as EV2–EV5 inputs.
- **Corrected finding:** the 404s at `97b09a...` do not establish a broken EV-source provenance join; they resulted from checking the workflow-definition SHA instead of its pinned qualified source SHA. The historical successful run and `DEPLOYMENT_APPROVED` artifact remain real historical records. This audit did not replay the workflow because it includes live re-observation and an approval action, and replay would not be read-only.
- The historical source set still dates from 2026-10-21 and the approval itself explicitly requires live UTxO revalidation plus authenticated control state, ProtectedCapital provenance, viability/liquidity evidence and authoritative Issue decision before Issue admission. The pin reconciliation does not make that source set fresh, prove a Treasury swap, prove the configured Treasury address, or authorize a new workflow run.

On the checkpoint commit, `Algorithmic Governability Adversarial Lab` run [#39923842713](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39923842713) and `IMMORTAL Portability Conformance` run [#39923842729](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39923842729) both completed successfully on SHA `12c715d00026a800ce2a83fbd78646190c37c886`. These are documentation/conformance signals only and do not close the Treasury route blocker.


## Post-reconciliation CI and route-search refresh — 2026-10-23

After the source-pin correction was committed as `2649d6d4dfb6c91bc8bf70b4e326d75f04247c36`, all five branch workflows completed successfully on that exact SHA:

- [Protocol Declaration Conformance #39925809505](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39925809505)
- [Cardano Adapter Sale Conformance #39925809678](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39925809678)
- [Documentation Link Check #39925809512](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39925809512)
- [Algorithmic Governability Adversarial Lab #39925809783](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39925809783)
- [IMMORTAL Portability Conformance #39925809686](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39925809686)

These checks pass for the documented source-pin correction and repository conformance; none executes a Treasury swap or proves live deployment binding.

A fresh GitHub code-search pass on the repository returned no matches for `swapExact`, `Minswap`, or `SundaeSwap`. `VITE_TREASURY_ADDRESS` appears as a runtime environment read in `src/config.ts`, as a blank placeholder in `.env.example`, and in explanatory documentation; no deployment value is present in searchable committed source. This is bounded evidence only: external DEX adapters, private environment values, or non-indexed paths cannot be ruled out by code search alone.

**Operational next gate remains external/deployment-bound:** obtain a non-secret authenticated manifest or known transaction/UTxO reference proving the configured Treasury address and deployed script hash on Preprod, then read-only observe its exact UTxOs. Only after identity/custody is established should a concrete route be evaluated. No workflow was dispatched, no transaction was built/signed/submitted, and V3/Reveal were untouched during this refresh.

## Deployment-manifest path contradiction — 2026-10-23

Read-only source check of `.github/workflows/immortal-cardano-preprod.yml` and `audit/cardano-integration/preprod-real-reveal.mjs` found a direct contradiction in the manual `preprod-deploy` job:

- The workflow sets `PREPROD_DEPLOY_ONLY: '1'` and invokes `node --import tsx/esm audit/cardano-integration/preprod-real-reveal.mjs`, describing the job as a deployment witness that should emit `preprod-deployment.json`.
- The invoked script reads that flag into `DEPLOY_ONLY` and immediately throws when it is set: `if (DEPLOY_ONLY) throw new Error('PREPROD_DEPLOY_ONLY is not supported in this Reveal-only harness')`. Thus, at the currently inspected branch source, the job cannot reach manifest creation or upload on that path.
- The same script constructs its policy from the workflow wallet's payment key hash and hardcodes a test ticket context, `PRICE_USDM = 100n`, and `TOTAL_LIQUIDITY_USDM = 100_000n`. It is a Reveal/test harness, not a canonical Treasury deployment routine. Simply deleting the throw or rerunning it would not establish the configured `VITE_TREASURY_ADDRESS`, Treasury-owned inventory, or a liquidation route.
- The latest known successful manual run `#39540626322` ran the separate `bootstrap_direct_usdm` path and emitted `preprod-direct-usdm-deployment.json`; that artifact says `reusedExisting=true` and `bootstrap.txHash=null`. It is not evidence that the `preprod-deploy` job succeeded or that a Treasury deployment manifest exists.
- No workflow was dispatched and no transaction was built, signed, or submitted during this check. No code, V3, or Reveal semantics were changed.

**Disposition:** treat the current manifest-generation path as blocked by a workflow/script contract mismatch. The safe next engineering task is to separate a genuinely read-only Treasury identity/UTxO observer from any deployment or Reveal harness, and define the manifest's provenance fields from a verified deployment record. Do not repurpose the current Reveal harness or run the manual deploy job as a workaround. The actual configured Treasury address remains unproven; route, swap execution, and QNE remain open.


## Read-only configured Treasury observer — 2026-10-23

Added a separate, manual-only observation path on `work/immortal-green-closure`:

- Script: [`audit/cardano-integration/observe-configured-preprod-treasury.mjs`](https://github.com/LiberoNuvola/Immortal-Protocol/blob/work/immortal-green-closure/audit/cardano-integration/observe-configured-preprod-treasury.mjs)
- Workflow: [`.github/workflows/observe-configured-preprod-treasury.yml`](https://github.com/LiberoNuvola/Immortal-Protocol/blob/work/immortal-green-closure/.github/workflows/observe-configured-preprod-treasury.yml)
- Workflow requires the non-secret DEMETER environment variables `PREPROD_TREASURY_ADDRESS`, `PREPROD_TREASURY_SCRIPT_HASH`, and `PREPROD_TREASURY_BINDING_REFERENCE`. If absent or malformed, the observer fails closed. It does not derive the configured address from the current unparameterized validator artifact.
- Before querying Koios, it checks that the configured address is a Preprod script address and its payment credential matches the separately supplied script hash. It then records exact returned UTxOs and the canonical tUSDM unit, timestamp, totals, and evidence digest.
- Safety: the workflow is manual-only, has read-only repository permissions, and does not sign, fund, bootstrap, approve, or submit transactions. It does not dispatch the old Reveal harness or alter V3/Reveal.
- **Important limit:** `PREPROD_TREASURY_BINDING_REFERENCE` is explicitly caller-supplied and the script labels it `CALLER_SUPPLIED_NOT_CRYPTOGRAPHICALLY_VERIFIED`. The script proves address↔script-hash consistency and reads the ledger; it does not itself authenticate that the reference is an authorized deployment record or prove protocol control. Reviewers must verify the supplied binding reference independently.
- No workflow was dispatched as part of adding this path, and no live observation was produced. The three environment variables have not been verified as configured. Therefore Treasury identity/custody, liquidation route, swap execution, and QNE remain OPEN.

This is a safer read-only diagnostic surface, not a closure of the Treasury blocker. The next gate is to populate the variables only from a reviewed deployment record, then run this manual observer and independently validate the recorded binding evidence.
