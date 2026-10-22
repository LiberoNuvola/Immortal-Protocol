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

- Derived the candidate Preprod Treasury address from `plutus/out/treasury.plutus.json` (Plutus V2): `addr_test1wrnd6rtjfzyc06r2rza338d3py0xeuuafpw6fe8rva5wruqawmlq4`. This is a code-derived address, not by itself proof of a live Treasury UTxO.
- Added `audit/cardano-integration/observe-preprod-treasury-inventory.mjs`, a read-only Koios observer that derives the address from the current artifact, queries `POST /address_info`, lists exact UTxO refs, and totals native lovelace (tADA) plus the exact configured tUSDM unit (policy `e675b46e4d2242c991a8932a99db3044e80515ae14b4c4ccf6b3f4c9`, asset name hex `745553444d`). It preserves integer atomic units and records explicit limitations.
- Added `.github/workflows/observe-preprod-treasury-inventory.yml` to run on pushes to this branch when the observer/artifact/workflow changes, and to publish the JSON as a run artifact and step summary.
- Inspected GitHub Actions runs `39835122116`, `39835156320`, and `39837517892`; all failed before the Koios request. The latest log pinpoints the cause: `Lucid.new()` attempted to fetch protocol parameters from the placeholder `127.0.0.1:8080` Blockfrost endpoint (`ECONNREFUSED`). No inventory JSON artifact was produced, so no live balance conclusion can be drawn.
- Fixed the observer in commit `146e6bb763f6008f639913239874c6b49b562842` to use Lucid's local `Emulator` for offline address/hash derivation; the observer's actual ledger read remains Koios. The commit has not yet produced a visible Actions run in the available run listing, so this correction is not yet runtime-verified. Re-run the observer workflow and inspect its artifact before claiming current tADA/tUSDM balances.
- Even if balances are present, this is only custody/inventory evidence; no DEX route, minimum-output bound, executed swap, or QNE proof follows from it.
