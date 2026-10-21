# PRE-RICH Settlement Oracle — Trust-Model Alternatives

**Status:** RESEARCH / CANDIDATE COMPARISON ONLY — no source selected for production.  
**Date:** 2026-10-21  
**Branch:** `work/immortal-green-closure`

## 1. Decision to be made

The quote-set extension solves a data-shape problem: one authenticated singleton can contain multiple asset quotes, and `Economic.totalUsdmValue` can find the exact (policy ID, asset name) quote for every nonzero asset. It does not solve the source-trust problem. The current `OracleQuote` entry is accepted when the configured publisher key matches, the timestamp is fresh and the price is non-negative. It does not prove that the value was derived from an external market or that the publisher cannot invent it.

The live evidence already recorded in [ORACLE-QUOTE-SET-EXTENSION-20261021.md](ORACLE-QUOTE-SET-EXTENSION-20261021.md) shows a legacy constructor-0 datum with one ADA quote, age about 306 hours at observation, against the existing one-hour freshness bound. Do not refresh it with a synthetic price or a local timestamp.

The target is a source-verifiable, open transaction path. We must keep the USDM sub-unit equality check, precision, `ceilingDiv`, ADA minimum-UTxO treatment, ticket economics, and EEV perimeter unchanged. A payment-asset quote is not EEV evidence.

## 2. Evidence from Cardano oracle options

### Candidate A — Pyth signed pull update

The [Cardano Developer Portal's Pyth guide](https://developers.cardano.org/docs/build/integrate/oracles/pyth/) documents an Aiken library (`pyth-lazer-cardano`) that reads signed updates from the transaction. Its example uses the ADA/USD feed with Pyth Pro feed ID 16. The intended transaction includes the signed update as the redeemer of a zero-withdrawal from the Pyth verification script, plus the Pyth State reference input.

The official integration guide makes two important limits explicit:
- the verifying script establishes signature validity, but the consuming contract must enforce freshness against the transaction validity upper bound;
- the off-chain Pyth Pro API requires an access token, which must stay server-side. Consumers can submit the update on-chain once they have the signed payload, but feed retrieval/liveness still depends on the publisher/API path.

The [Pyth Cardano consumer guide](https://docs.pyth.network/price-feeds/pro/integrate-as-consumer/cardano) documents the same model and notes that the verifier does not itself prevent reuse of a still-valid signed update. Therefore replay/freshness handling must be explicit in the consuming protocol.

**Assessment:** best first feasibility probe for ADA/USD because signature verification can happen on-chain without trusting a PRE-RICH-specific publisher to declare an arbitrary price. This is not yet a production decision. The checked sources do not establish availability of verified NIGHT/USD or PRE/USD feeds, and a signed feed proves integrity under Pyth's trust model, not market truth or perpetual liveness.

### Candidate B — DIA Cardano on-chain feeds

The [DIA Cardano Oracle repository](https://github.com/diadata-org/dia-cardano-oracle) supplies Aiken price contracts, a feeder, and a read-only indexer for on-chain Pair/Receiver/Config UTxOs. DIA's [Cardano milestone close-out report](https://github.com/diadata-org/dia-cardano-oracle/blob/main/docs/milestones/milestone-4-poa.md) records a live mainnet ARS/USDT feed and 16 Preview feeds, including ADA/USD. The listed Preview symbols do not include PRE or NIGHT; the project describes a process for requesting additional feeds, but this is not evidence that the two desired feeds already exist.

**Assessment:** useful candidate for a push-based on-chain source where a supported feed exists. Before selection, qualify the exact feed, source composition, update authority, publication cadence, fee/liveness constraints, policy identity and live UTxO. Do not treat the existence of the general DIA integration as proof of a PRE/NIGHT feed or as a permissionless guarantee.

### Candidate C — Charli3 push oracle

Charli3's [push-oracle contract repository](https://github.com/Charli3-Official/charli3-push-oracle-contracts) documents node data, aggregate feed state and a consensus mechanism for producing feed updates. Its architecture documentation states a maximum of six nodes due to on-chain memory limits. The current evidence inspected here does not qualify active ADA/PRE/NIGHT feeds on the intended network, their source market, or the configured DApp's live feed identity.

**Assessment:** investigate only after obtaining exact feed and deployment evidence. A distributed node set improves the source model over a single wallet key, but does not by itself prove the input data is true, and a consensus of bad or correlated inputs is still a risk.

### Candidate D — derive price from on-chain DEX liquidity

A DEX-derived quote can reduce dependence on a separate publisher because its inputs are ledger-visible. However, a raw spot ratio is manipulable and does not automatically prove an executable, conservative market value. A safe design needs an already-governed pool selection, time window or accumulator, liquidity/manipulation policy and integer conversion contract. Those parameters must not be invented in implementation, and a market quote cannot automatically be treated as spendable USDM liquidity.

**Assessment:** research candidate, not a shortcut. Do not implement a guessed TWAP, liquidity cutoff, haircut or slippage allowance.

## 3. Comparative status

| Path | On-chain verifiability | Permissionless transaction submission | Coverage established here | Current status |
|---|---|---|---|---|
| Current configured publisher + quote set | Checks publisher key, asset identity and freshness; source truth is not proven | Anyone may construct a transaction, but price authority is concentrated | One stale legacy ADA quote observed in workflow wallet; live DApp match unverified | **Not qualified** |
| Pyth signed pull | Signed update checked by Pyth/Aiken verifier; consumer must enforce freshness/replay rules | Signed payload can be submitted without a PRE-RICH price signer once obtained | ADA/USD feed ID 16 documented; PRE/NIGHT availability not established | **Prototype candidate for ADA** |
| DIA push feed | On-chain Pair identity and datum can be checked by consumer | Consumption uses referenced feed; publication remains dependent on DIA feeder/service | ADA/USD appears in Preview report; PRE/NIGHT not shown there | **Feed-by-feed qualification required** |
| Charli3 push feed | Contract aggregation is on-chain; consumer can verify feed UTxO | Depends on the oracle network's publishing path | Exact live feed availability not established in this review | **Unqualified candidate** |
| DEX-derived | All pool state is on-chain | Construction can be open | No canonical pool, TWAP, or manipulation policy selected | **No implementation until normative closure** |

## 4. Recommended next step — isolated Pyth ADA/USD verifier probe

This is a verification spike, not a switch of production oracle. Keep the existing Issue, V3 and Reveal semantics unchanged while proving whether the source-verification primitive can be integrated.

1. Build an isolated Aiken/Plutus V3 probe using the official Pyth Cardano library and ADA/USD feed ID 16. Do not wire it into the live Issue path yet.
2. Demonstrate that the same transaction carries the signed update, the authenticated Pyth State reference input, and a finite validity upper bound.
3. Require negative tests for forged/tampered payload, wrong feed ID, missing price/exponent, stale timestamp, timestamp after the transaction validity bound, missing state NFT and malformed update.
4. Record the exact compiler/toolchain, script hash and serialized size, execution units, transaction size and data-source/trust assumptions. No test fixture may be represented as a live market quote.
5. Separately verify whether the desired PRE and NIGHT assets have source-qualified feeds on DIA/Charli3 or other already-governed infrastructure. If not, keep those payment choices disabled instead of synthesizing price evidence.

**Integration constraint:** the current B1 Issue policy is Haskell/Plutus V2 and consumes `OracleQuoteSet`; the documented Pyth consumer library is Aiken/Plutus V3. The probe must demonstrate a safe binding between the verified signed update and the exact price the existing USDM equality predicate consumes. A standalone Pyth signature pass is insufficient if `MintPolicy` can still price the same Treasury output from an unrelated stale quote. If that cross-script binding cannot be established without changing normative semantics, stop at the probe and return to architecture review.

## 5. Explicit non-claims

- No Pyth, DIA or Charli3 source is selected or configured for production by this memo.
- No NIGHT/USD or PRE/USD feed is claimed to be available.
- No oracle key was rotated; no quote-set datum was published or migrated.
- No deployed script, main branch, public Pages release, V3 or Reveal behavior was changed.
- The EEV perimeter remains canonical USDM physically present in the qualified B1 PrizePool UTxO.
- Passing a signature check is not proof of oracle liveness, external market truth, or full system permissionlessness.


## 6. Isolated Aiken feasibility probe — first CI result

An isolated project now exists at `poc/aiken-pyth-ada-usd`. It uses the official `pyth-network/pyth-lazer-cardano` library, pinned to commit [`217b5917228b17f015719b27dd616a75ad6bd800`](https://github.com/pyth-network/pyth-lazer-cardano/commit/217b5917228b17f015719b27dd616a75ad6bd800), and the library-matched Aiken compiler `v1.1.21` / stdlib `v3.0.0`.

The probe validator calls `pyth.get_updates`, requires one update and one ADA/USD feed (feed ID 16), requires both update-level and feed-level timestamps, enforces the existing one-hour age limit against a finite transaction validity upper bound, and matches raw price/exponent/timestamps against its candidate datum. It deliberately does not convert the raw quote into the existing `OracleQuote.price` integer.

Initial unpinned-library run [#1](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39600265567) passed `aiken check` (9 synthetic tests) and `aiken build`. After pinning the Pyth library to the exact upstream commit, run [#2](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39600475220) passed the same synthetic test suite and compiled the Plutus V3 consumer; the final step was still running when first inspected. These results establish source-level/API compatibility for the isolated probe only.

They do **not** prove Pyth signature verification, source liveness/market truth, an authenticated ADA USD price, correct USDM conversion, or an executed ledger transaction. The next CI run adds an artifact containing the generated dependency lock, blueprint, SHA-256 hashes and build manifest. The actual Pyth withdraw verification and the relationship to the legacy Haskell MintPolicy remain unproven.
