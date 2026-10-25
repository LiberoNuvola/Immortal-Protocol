# V3 parameter ABI diagnostic — 2026-10-25

## Status and classification

**Diagnostic only; not ledger evidence.** This record captures the V3 mint-policy parameter isolation run and the follow-up probe. No diagnostic transaction was signed or submitted. No production V3 or Reveal semantics were changed.

## Evidence already observed

Run [IMMORTAL Cardano Integration Lab #2234](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40198328841), head `d933d586f7bc9e2d44b3412eca213fb3877000bb`, uploaded artifact `immortal-cardano-lab-evidence` (artifact ID `12601103618`, SHA-256 `0ae30e4db03ae0e4d32e40974760d4972ac035002e9aa7c98ac20e44cb8f7cda`). Its matrix schema is `IMMORTAL-V3-TXOUTREF-ISOLATION-MATRIX-v10`.

### Cases that passed provider evaluation/build

- `no-context-baseline`
- `read-inputs-only`
- `compare-seed-txoutref` (raw `BuiltinData` comparison)
- `decode-seed-explicitly` (explicit `TxOutRef` decoding from `BuiltinData`)
- `raw-decode-seed-and-name`
- `raw-decode-name-mint-only`

These are provider-evaluation/build results only; they are not ledger acceptance results.

### Cases rejected by the provider evaluator

- `seed-consumed-only` and `seed-consumed-serialized`: HTTP 400 from the Yaci/Ogmios evaluation endpoint with `'case' over a value of a built-in type failed with data isn't supported in 'case'`. The diagnostic parameter is represented as a `Constr` containing the seed reference.
- `assocmap-mint-only-bare-bytes`: HTTP 400 with `Type mismatch: expected: bytestring; actual: data`. The failed comparison receives `(con data (B ...))` where the compiled typed path expected a bytestring.
- `singleton-mint-only-constr-bytes`: the same bytestring-versus-data mismatch persists when the name parameter is passed as `Constr(0, [bytestring])`.

The original provider response is recorded in the artifact's `providerResponses`. Lucid subsequently emits `Cannot use 'in' operator to search for 'EvaluationResult' in undefined`; that is a secondary response-handling exception, not the underlying Plutus evaluation message.

## Interpretation

The controls show that context access itself can pass, while typed parameter paths fail once the parameter is consumed. The `BuiltinData` boundary with explicit `unsafeFromBuiltinData` decoding passes in these diagnostic cases. This is strong evidence for an ABI/representation boundary issue in the current typed parameterized factories, but it does not establish a successful V3 carrier mint on the ledger.

Plutus documents `TokenName` as a `newtype` backed by `BuiltinByteString` with `ToData`/`FromData` instances; Lucid's `applyParamsToScript` applies Plutus Data parameters to the compiled script. The observed type mismatch is consistent with the need to verify the exact compiled ABI rather than change the byte/constructor encoding speculatively.

References:
- [Plutus Ledger API V2 — TokenName](https://plutus.cardano.intersectmbo.org/haddock/master/plutus-ledger-api/PlutusLedgerApi-Data-V2.html)
- [Lucid Evolution — Applying Parameters](https://no-witness-labs.github.io/lucid-evolution/documentation/smart-contract-interactions/applying-parameters)

## Follow-up diagnostic — v11 result

On head `9046b8c5fc0b68b74be7e73039766edbe067817f`, matrix schema v11 adds `raw-decode-seed-name-singleton`: the raw `BuiltinData` ABI plus explicit decoding, followed by the exact `txInfoMint == singleton ... 1` predicate. It separates the ABI boundary from the mint predicate used by the carrier policy.

Run [IMMORTAL Cardano Integration Lab #2241](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40202737054), head `22e4badb74fdfd8594f8f16661fc823027a1abaf`, uploaded artifact `immortal-cardano-lab-evidence` (artifact ID `12603272638`, SHA-256 `29ebd385a511769f81f82ceffbd39fda91f0e5baca0770d078d0574a18ca5d28`). The matrix schema is `IMMORTAL-V3-TXOUTREF-ISOLATION-MATRIX-v11`.

### v11 evidence

The following raw-`BuiltinData` cases all returned HTTP 200 from the Yaci/Ogmios evaluation endpoint and completed Lucid transaction construction. They were **not signed or submitted**:

- `compare-seed-txoutref`
- `decode-seed-explicitly`
- `raw-decode-seed-and-name`
- `raw-decode-seed-name-singleton`
- `raw-decode-name-mint-only`

The new `raw-decode-seed-name-singleton` case specifically passed with the exact singleton-`Value` predicate. This shows the predicate can evaluate when both parameters cross the wrapper as `BuiltinData` and are explicitly decoded.

The typed cases still fail in the evaluator:

- `seed-consumed-only` and `seed-consumed-serialized`: `'case' over a value of a built-in type failed with data isn't supported in 'case'`.
- `assocmap-mint-only-bare-bytes` and `singleton-mint-only-constr-bytes`: `Type mismatch: expected: bytestring; actual: data`.

The production carrier step (step 26) failed before ledger submission. The provider response in `v3-provider-evaluation-response.json` was HTTP 400 with a Plutus `EvaluationFailure`; Lucid then raised the secondary `Cannot use 'in' operator to search for 'EvaluationResult' in undefined`. The native ledger accepted the separate smoke transaction, but **did not accept the V3 carrier**. Reveal and later gates were skipped.

### Updated interpretation

The strongest supported diagnosis is an ABI boundary mismatch in the current parameterized factory: a raw-`BuiltinData` wrapper with explicit decoding passes, while equivalent typed-parameter probes fail. The new singleton probe rules out the claim that the exact singleton mint predicate alone causes the observed failure. It does not prove that Yaci is the only possible source of incompatibility, nor is it ledger acceptance evidence.

The production mint-policy factory has **not** been changed in this diagnostic work. Switching its factory ABI to `BuiltinData` would alter the compiled script bytes and future policy ID; this requires a separate explicit change/redeployment decision, with independent review and a new native-ledger acceptance run.

## Guardrails

- Do not declare the Cardano lab GREEN until the carrier has been accepted and confirmed by the local native Cardano ledger and the required later evidence gates run.
- Do not modify production V3 or Reveal semantics as part of this diagnostic.
- A future switch of the production policy factory to a `BuiltinData` ABI would change compiled script bytes and therefore the policy ID for a future deployment; it must be handled as an explicit deployment/migration decision, not treated as a no-op wrapper edit.
- PR #36 remains Draft; this record does not qualify the Treasury observer or its configured deployment address.
