# V3 Carrier Mint Policy — Diagnostic Finding (2026-10-25)

## Scope

This report records evidence from isolated Yaci devnet run #2207. It is not a deployment approval. Production V3 and Reveal sources were not changed.

Run: https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40168742585
Commit under test: 91958a2e6d4e41b1a587d75534c9b1f66f81ed6d
Evidence artifact: `immortal-cardano-lab-evidence` (SHA-256 `93abcfd26cd6abadf518bed93f6d07e9272cdc2ca98c356dc874e24f14621348`)

## Differential result

| Diagnostic variant | Native ledger result | Interpretation |
|---|---|---|
| `always-pass` | Accepted | Ledger submission path works |
| `typed-seed-param-only` | Failed: `data isn't supported in 'case'` | Typed parameter is being scrutinized as Data |
| `typed-token-name-param-only` with constructor encoding | Failed: expected bytestring, actual data | TokenName Data shape is wrong for the typed wrapper |
| `seed-param-only` (BuiltinData decode) | Accepted | Seed parameter can be decoded from applied Data |
| `context-inputs-only` | Accepted | ScriptContext decoding / ledger path works |
| `token-name-param-only-bytes` | Accepted | TokenName must be supplied as bytestring Data |
| `decoded-params-only` | Accepted | Explicit decoding of TxOutRef and TokenName works |
| `decoded-policy` | Accepted | Explicit decoding plus seed-consumption and exact-mint checks works |

## Failure boundary

The production V3 carrier mint policy uses a factory signature with typed parameters:

`wrap :: TxOutRef -> TokenName -> BuiltinData -> BuiltinData -> BuiltinUnit`

and passes those values directly to `mkPolicy`. Under the current Lucid parameter-application path, the applied arguments arrive as Data. The native ledger error is:

`'case' over a value of a built-in type failed with data isn't supported in 'case'`

The differential probes show the error occurs before the intended economic policy checks. The test-only decoded wrapper succeeds with the same seed/mint transaction shape.

## Recommended next step — approval required

Prepare a minimal production fix for review that changes only the parameter boundary of `V3EconomicStateCarrierMintPolicy.hs`: accept the applied parameters as `BuiltinData`, explicitly decode them to `TxOutRef` and `TokenName`, and retain the existing `seedConsumed` and `mintedExactlyOne` predicates unchanged. Preserve the existing token-name bytestring encoding used by Lucid. Do not change V3 validator semantics or Reveal.

This report alone does not authorize a production change, Preprod deployment, or real transaction.
