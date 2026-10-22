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

- The observer now derives the address through Lucid's canonical utility path using a local `Emulator` (no fake Blockfrost call) and queries Koios `POST /address_utxos`.
- Successful read-only run: [GitHub Actions run 39838021036](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39838021036); artifact ID `12452615035` (`preprod-treasury-inventory-observation`). Observation timestamp: `2026-10-22T19:12:31.932Z`.
- Exact artifact-derived candidate address in the observation: `addr_test1wpaz5k9ejt3f6y82ufu6araf8w6ymp20lqe0pq3mpxcewzq4mhrsw`; script hash `7a2a58b992e29d10eae279ae8fa93bb44d854ff832f0823b09b19708`; artifact SHA-256 `1387e1875da33ec65120356763fc0e1b3373c9ca3ccec9b57d749b395045318c`.
- Koios returned **zero UTxO rows** for that candidate address. The artifact therefore reports `utxoCount=0`, `tADA=0`, and `tUSDM=0` for this exact address at the observation time. This is evidence about the derived address only; it does **not** establish that the deployment-configured Treasury address is the same address or that the overall Treasury holds no funds.
- The earlier manually derived address `addr_test1wrnd6rtjfzyc06r2rza338d3py0xeuuafpw6fe8rva5wruqawmlq4` and hash `e6dd0d72488987e86a18bb189db1091e6cf39d485da4e4e36768e1f0` are superseded and must not be used as canonical evidence. Use the Lucid-derived address/hash above.
- A follow-up code change in commit `adaa22d4177631dd6a64198e84eeea68cdc57bbd` distinguishes an empty UTxO result from a positive address match; its corresponding run/artifact is pending verification.
- Since the expected Treasury should hold tADA and tUSDM, the remaining blocker is to recover the **actual deployment-configured Treasury address or a known Treasury UTxO reference**, then observe that exact address independently. Do not bootstrap, fund, or alter any address merely to make this observation pass.
- Even if balances are found at the actual address, this is only custody/inventory evidence; no DEX route, minimum-output bound, executed swap, or QNE proof follows from it.
