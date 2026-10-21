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
- Wrong-round negative vector: **PASS**; the same round-42 signature is rejected when checked as round 43.
- Actual local Cardano ledger transaction: **PASS** — a transaction using the compiled Plutus V3 validator spent a script UTxO and was accepted/confirmed by the local Yaci devnet.
- Off-chain JavaScript signature verification and adversarial tests: **PASS** in the same CI workflow.
- Preprod/mainnet execution-unit headroom: **OPEN**.
- Production round-selection and ticket binding: **OPEN**.
- PRE-RICH integration: **NOT STARTED**.
- Materios GRANDPA/finality and provenance: **NOT PROVEN by this PoC**.
- B3 approval: **NOT APPROVED**.

Reproducible CI evidence: [IMMORTAL drand Beacon Verification PoC — run #73](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39540212780). The run uploaded the artifact `immortal-drand-plutus-ledger-evidence`, which contains the captured transaction result, protocol parameters, validator hash and Yaci logs.

## Local Yaci transaction measurements

These measurements apply only to the local Yaci devnet and its observed protocol parameters, not to Preprod or mainnet.

| Measurement | Observed result |
|---|---:|
| Compiled validator | Plutus V3 |
| Spend transaction result | `LEDGER_ACCEPTED` |
| Spend transaction CBOR size | 1,025 bytes |
| Observed `maxTxSize` | 16,384 bytes |
| Size as a share of `maxTxSize` | 6.26% |
| Transaction fee | 281,908 lovelace (0.281908 ADA) |
| Assigned redeemer memory budget | 26,043 |
| Observed `maxTxExMem` | 16,500,000 |
| Memory budget as a share of limit | 0.158% |
| Assigned redeemer step budget | 1,106,076,956 |
| Observed `maxTxExSteps` | 10,000,000,000 |
| Step budget as a share of limit | 11.06% |

The ExUnits above are the budget assigned by Lucid's local UPLC evaluation during transaction construction, and the Cardano ledger accepted that budget for this transaction. They are **not** a direct measurement of actual consumed CPU/memory returned by Yaci's REST evaluator. That evaluator returned HTTP 500 with `ExceptionInInitializerError`; this remains a separate open diagnostic. The local ledger's acceptance is the positive transaction-execution result, not proof that the REST evaluator works.

## Scope and next acceptance gates

The test vector is the real captured Quicknet round 42 also checked by the off-chain `drand-client@1.4.2` profile. The positive Aiken test verifies that signature with the Plutus V3 BLS12-381 builtins; the negative test reuses the signature with round 43 and expects rejection. A separate local Yaci transaction confirms a spend through the compiled validator.

Before treating this as production-feasible, the next gates are: investigate Yaci's REST evaluator initialization failure; run equivalent measurements against the intended target protocol parameters; repeat adversarial/invalid-signature behavior through an actual ledger transaction; and establish production-safe round selection and ticket binding.

This PoC does **not** prove Materios GRANDPA finality, receipt/storage-root authenticity, authority-set provenance, or PRE-RICH integration. No production PRE-RICH, B1, B3 or Reveal semantics are changed by this isolated work.
