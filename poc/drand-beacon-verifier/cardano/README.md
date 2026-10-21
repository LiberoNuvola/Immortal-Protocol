# Plutus V3 Quicknet verification feasibility PoC

This package is deliberately isolated from PRE-RICH and the production Beacon registry.

It implements the cryptographic equation for the pinned drand Quicknet scheme:

- encode the selected round as an 8-byte big-endian unsigned integer;
- hash that byte string with SHA-256;
- hash the result to G1 using Quicknet's exact DST, `BLS_SIG_BLS12381G1_XMD:SHA-256_SSWU_RO_NUL_`;
- verify `e(signature, G2_generator) = e(hash_to_curve(message), public_key)` using Plutus V3 BLS12-381 pairing builtins.

## Current evidence status

- Aiken compiler qualification: **PASS** on Aiken v1.1.24.
- `aiken check`: **PASS**, 4 checks, 0 errors, 0 warnings.
- Blueprint generation: **PASS**, `plutus.json` generated.
- Real Quicknet round-42 signature: **PASS** in Aiken's test evaluator.
- Wrong-round negative vector: **PASS** in Aiken's test evaluator; the same round-42 signature is rejected when checked as round 43.
- Actual valid-signature Cardano ledger transaction: **PASS** — the local Yaci ledger accepted and confirmed a spend through the compiled Plutus V3 validator.
- Actual invalid-signature/incorrect-round twin: **PASS** — attempting to spend with the real round-42 signature while declaring round 43 was rejected by the Conway ledger with `ValidationTagMismatch` / `PlutusFailure`; the target script UTxO remained unspent.
- Yaci/Ogmios REST transaction evaluation: **PASS** for the valid spend, returning the spend redeemer's memory/step budget.
- Off-chain JavaScript signature verification and adversarial tests: **PASS** in the same CI workflow.
- Preprod/mainnet execution-unit headroom: **OPEN**.
- Production round-selection and ticket binding: **OPEN**.
- Materios GRANDPA/finality and provenance: **NOT PROVEN by this PoC**.
- PRE-RICH integration: **NOT STARTED**.
- B3 approval: **NOT APPROVED**.

Reproducible CI evidence: [IMMORTAL drand Beacon Verification PoC — run #82](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39543072212), pinned to Yaci DevKit `0.12.0`. The workflow log confirms `Yaci Store tx evaluator mode: ogmios`, and the uploaded `immortal-drand-plutus-ledger-evidence` artifact contains the valid accepted transaction, the Ogmios evaluation result, and the rejected wrong-round twin.

## Local Yaci transaction measurements

These measurements apply only to the local Yaci devnet and its observed protocol parameters, not to Preprod or mainnet.

| Measurement | Observed result |
|---|---:|
| Compiled validator | Plutus V3 |
| Valid spend result | `LEDGER_ACCEPTED` |
| Valid spend transaction CBOR size | 1,025 bytes |
| Observed `maxTxSize` | 16,384 bytes |
| Valid transaction size as a share of limit | 6.26% |
| Valid transaction fee | 281,908 lovelace (0.281908 ADA) |
| Yaci/Ogmios evaluation and assigned memory budget | 26,043 (matching) |
| Observed `maxTxExMem` | 16,500,000 |
| Memory budget as a share of limit | 0.158% |
| Yaci/Ogmios evaluation and assigned step budget | 1,106,076,956 (matching) |
| Observed `maxTxExSteps` | 10,000,000,000 |
| Step budget as a share of limit | 11.06% |
| Invalid-round twin | Rejected; original script input remains unspent |

The valid transaction's assigned ExUnits match the values returned by Yaci Store's REST `/utils/txs/evaluate/utxos` endpoint in Ogmios mode. These are ledger cost-model memory/step units, not wall-clock CPU time or host-process memory. The workflow now fails closed if the REST endpoint is unavailable, returns no spend budget, or reports a budget above the observed transaction limits / above the budget assigned to the signed transaction. The wrong-round twin deliberately uses a conservative explicit test budget so its rejection can be established by the ledger independently of the evaluator endpoint.

The earlier HTTP 500 / `ExceptionInInitializerError` was observed with Yaci DevKit `0.12.0-beta5`. With stable `0.12.0`, the workflow confirms Ogmios is the selected evaluator and the REST evaluation returns `PASS`.

## Scope and remaining gates

The test vector is the real captured Quicknet round 42 also checked by the off-chain `drand-client@1.4.2` profile. The positive Aiken test verifies that signature with the Plutus V3 BLS12-381 builtins; the wrong-round tests reject reuse of the signature with round 43; the local ledger probe confirms both the valid and invalid branches.

Before production use, the remaining gates are to repeat qualification against the intended target protocol parameters (including Preprod/mainnet), establish production-safe round selection and ticket binding, and prove Materios GRANDPA finality, receipt/storage-root authenticity, and authority-set provenance. PRE-RICH integration remains out of scope.

This PoC does **not** prove Materios GRANDPA finality, receipt/storage-root authenticity, authority-set provenance, or PRE-RICH integration. No production PRE-RICH, B1, B3 or Reveal semantics are changed by this isolated work.
