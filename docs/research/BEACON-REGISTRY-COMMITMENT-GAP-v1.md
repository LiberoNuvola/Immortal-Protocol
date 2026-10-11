# IMMORTAL — Beacon Registry Commitment Representability Gap v1

**Classification:** implementation mismatch / evidence boundary  
**Branch:** `work/b3-materios-provenance-evidence`  
**Date:** 2026-10-11

## Finding

The off-chain registry publication flow treats `brGameRoundCommitment` as part of `BeaconRegistryDatum`, but the current on-chain datum definition does not contain that field.

Triangulated surfaces:

- `src/registryFlow.ts` validates and supplies `brGameRoundCommitment` when constructing the Ready datum.
- `src/registryDatum.ts` explicitly documents that the current Haskell datum has only seven fields and deliberately ignores `brGameRoundCommitment`.
- `plutus/Types.hs` currently defines `BeaconRegistryDatum` without `brGameRoundCommitment`.
- `plutus/BeaconRegistry.hs` therefore cannot authenticate that commitment as part of the canonical registry datum.

## Consequence

The current implementation can authenticate the existing registry fields, including `brMcHash`, `brMateriosContext` and `brRelayerPkh`, but it cannot claim that the GameRoundCommitment is itself stored and authenticated on-chain.

Therefore:

`off-chain GameRoundCommitment consistency`
`≠`
`on-chain canonical GameRoundCommitment authentication`

This is an **implementation/evidence gap**, not a reason to invent a new registry rule.

## Required closure

Closure requires one explicitly authorized schema decision followed by synchronized:

1. on-chain datum type;
2. validator decoding/verification;
3. adapter serialization;
4. off-chain builder;
5. conformance vectors;
6. real ledger evidence.

Until that happens, a RegistryPublish evidence packet must classify the GameRoundCommitment as **not independently authenticated by the current on-chain registry datum**.

## Non-regression

Do not resolve this gap by:

- silently assuming the off-chain field is on-chain;
- treating the relayer signature as proof of canonical round identity;
- changing the B3 selector;
- changing V3/Reveal/economic semantics;
- promoting synthetic registry output to canonical evidence.

**Status: OPEN IMPLEMENTATION/EVIDENCE GAP.**
