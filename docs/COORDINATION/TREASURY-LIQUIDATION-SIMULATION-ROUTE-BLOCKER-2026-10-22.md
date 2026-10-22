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
- Repository trace confirms `src/mint.ts` uses deployment-configured `VITE_TREASURY_ADDRESS` when present, and only falls back to the address derived from the unparameterized `treasuryValidator`; `.env.example` leaves that variable blank and the public Preprod workflow does not expose its deployment value. Thus the zero-UTxO result on the derived address cannot resolve the actual configured address. The first PRE/tUSDM holder intersection query returned 0 because Koios reports 0 holders for the configured PRE unit; this is not evidence that Treasury lacks funds. A read-only scan of all 281 canonical tUSDM holders for script-controlled addresses is now running: [run 39843060345](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39843060345). Its result is pending; candidates will remain unqualified until matched to the actual deployment binding or known transaction reference.
- The script-holder discovery completed successfully in [run 39843060345](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39843060345), artifact ID `12453783129`, observed at `2026-10-22T19:48:21.931Z`. Koios `POST /address_info` returned records for all 281 searched holders and identified 15 as script addresses with canonical tUSDM. This is candidate discovery only: none has been matched to the deployed `VITE_TREASURY_ADDRESS`, the Treasury validator identity, or a known Treasury transaction reference.
- The scan includes script-address balances ranging from tiny amounts to `9,629,000` tUSDM and `4,999,000` tUSDM (displayed in token units using 6 decimal places). Large balances are not evidence of Treasury ownership; they may belong to unrelated contracts or liquidity infrastructure. Do not attribute any candidate to IMMORTAL by balance, datum presence, or script-address status alone.
- The artifact explicitly records `liquidationRouteVerified=false`, `swapExecuted=false`, and `qneProven=false`. Current derived Treasury address remains at zero UTxOs. Thus this run advances discovery but does not close the custody/inventory blocker and does not authorize a sale or bootstrap.
- Even after locating the actual Treasury, inventory evidence alone does not prove a DEX route, minimum-output bound, executed swap, or QNE.
