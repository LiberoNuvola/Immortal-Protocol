# Gate 41 — PRE-native witness acquisition handoff

Date: 2026-09-24

## Current finding

The repository triangulation confirms that the historical PRE mint transaction is closed at the transaction/UTxO level, while the historical mint-purpose witness remains an acquisition gap.

Target transaction:
`0235e186550383a53855a9727c02ceeb93d16956b3ae049ac367d85d291c6cf4`

PRE policy:
`1b29fda97d0fd321398c5b7b3285fdaadd519a0d002932853311f02c4`

Known historical outputs:
- Pool-NFT-bearing output #1: 13 ADA + 996,071,981 PRE + Pool NFT
- creator-side output #2: 3,928,019 PRE
- 1B PRE total is closed
- 10,000,000 lovelace residual is factual
- 10 ADA = creator initial-buy funding remains OPEN

## Acquisition packet

The helper `scripts/acquire-pre-snek-witness.ps1` now explicitly acquires:
1. transaction metadata;
2. transaction UTxOs;
3. transaction CBOR;
4. transaction redeemers;
5. exact mint-purpose redeemers filtered by PRE policy;
6. SHA-256 hashes and provider/timestamp provenance for raw artifacts.

It fails closed when the exact PRE mint redeemer is absent.

## Interpretation rule

Do not use later curve-spend redeemers, current Snek v1 parameters, numerical correlations, or provider `info.outputId` semantics as substitutes for the historical mint witness.

After acquisition, test only the witness satisfying:
`purpose=mint` + PRE policy hash.

Then compare its encoded fields/commitments against:
- 3,928,019 PRE creator-side allocation;
- 10,000,000 lovelace residual.

No economic interpretation is promoted before this test.

## External source triangulation

Blockfrost documents transaction info, UTxOs, CBOR, and redeemer endpoints. The Cardano Developer Portal independently documents Blockfrost/Koios/Maestro as Cardano providers and their network endpoints.

No normative IMMORTAL/PRE-RICH economics changed.
