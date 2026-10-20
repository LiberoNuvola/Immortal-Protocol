# Plutus V3 Quicknet verification feasibility PoC

This package is deliberately isolated from PRE-RICH and the production Beacon registry.

It implements the cryptographic equation for the pinned drand Quicknet scheme:

- encode the selected round as an 8-byte big-endian unsigned integer;
- hash that byte string with SHA-256;
- hash the result to G1 using Quicknet's exact DST, `BLS_SIG_BLS12381G1_XMD:SHA-256_SSWU_RO_NUL_`;
- verify `e(signature, G2_generator) = e(hash_to_curve(message), public_key)` using Plutus V3 BLS12-381 pairing builtins.

The source follows the published drand-client verification construction and the Plutus V3 BLS12-381 builtin interface. It does not yet contain a real signature fixture test, measured execution-unit report, or PRE-RICH integration. The off-chain JavaScript PoC currently owns the positive and adversarial live beacon tests.

## Status

- Cryptographic source prototype: **ADDED**
- Compile and builtin smoke tests: **OPEN — current Aiken build attempt exits non-zero without a diagnostic in the captured Actions log; source is not compiler-qualified**
- Real fixed-signature parity against the JS verifier: **OPEN**
- Measured CPU/memory budget and transaction size: **OPEN**
- Production round-selection/ticket binding: **OPEN**
- PRE-RICH integration: **NOT STARTED**
- B3 approval: **NOT APPROVED**

Do not infer Cardano feasibility from the existence of BLS builtins alone. A passing Aiken compile is not a signature-verification conformance result. The next acceptance gate is first to resolve the Aiken compilation failure and obtain a compiler-qualified artifact; then run the exact same captured signature/public key/round through both implementations and measure the real Plutus execution budget on the target protocol parameters. The Aiken draft is intentionally excluded from the passing off-chain CI gate until it compiles.
