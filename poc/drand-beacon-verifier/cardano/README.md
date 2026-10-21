# Plutus V3 Quicknet verification feasibility PoC

This package is deliberately isolated from PRE-RICH and the production Beacon registry.

It implements the cryptographic equation for the pinned drand Quicknet scheme:

- encode the selected round as an 8-byte big-endian unsigned integer;
- hash that byte string with SHA-256;
- hash the result to G1 using Quicknet's exact DST, `BLS_SIG_BLS12381G1_XMD:SHA-256_SSWU_RO_NUL_`;
- verify `e(signature, G2_generator) = e(hash_to_curve(message), public_key)` using Plutus V3 BLS12-381 pairing builtins.

## Status

- Aiken compiler qualification: **PASS** on Aiken v1.1.24.
- `aiken check`: **PASS**, 4 checks, 0 errors, 0 warnings.
- Blueprint generation: **PASS**, `plutus.json` generated.
- Real Quicknet round-42 signature vector: **PASS** in Aiken's test evaluator.
- Wrong-round negative vector: **PASS**; the same round-42 signature is rejected when checked as round 43.
- JavaScript off-chain verifier and adversarial tests: **PASS** in the same CI workflow.
- Execution-unit and transaction-size measurements on the target Cardano environment: **OPEN**.
- End-to-end submitted transaction / ledger execution: **OPEN**.
- Production round-selection and ticket binding: **OPEN**.
- PRE-RICH integration: **NOT STARTED**.
- B3 approval: **NOT APPROVED**.

The round-42 signature and Quicknet public key are pinned as a test vector also captured by the off-chain `drand-client@1.4.2` verifier. The Aiken positive test verifies the real signature with the Plutus V3 BLS12-381 builtins; the negative test reuses the signature with round 43 and expects rejection.

These tests demonstrate compilation and cryptographic verification in Aiken's test evaluator. They do **not** by themselves prove successful execution in a submitted Cardano transaction, adequate execution-unit headroom under current protocol parameters, transaction-size feasibility, or production-safe round selection.

The next acceptance gate is to measure CPU/memory execution units for both valid and invalid vectors, record the applicable protocol parameters, and execute an end-to-end transaction on the target Cardano environment. No production PRE-RICH or B1/B3 semantics are changed by this isolated PoC.
