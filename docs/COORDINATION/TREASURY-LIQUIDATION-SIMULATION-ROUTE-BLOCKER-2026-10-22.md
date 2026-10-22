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
