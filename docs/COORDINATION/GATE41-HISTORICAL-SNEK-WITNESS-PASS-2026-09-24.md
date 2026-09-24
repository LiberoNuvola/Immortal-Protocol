# Gate 41 — Historical Snek-family witness pass — 2026-09-24

## Purpose

Record a new independent prior-art lead for interpreting the historical PRE launch transaction without promoting current Snek v1 semantics into historical PRE rules.

## Sources triangulated

- Historical PRE ledger evidence in Library:
  - mint tx: `0235e186550383a53855a9727c02ceeb93d16956b3ae049ac367d85d291c6cf4`
  - Pool-NFT-bearing output: `#1`, 13,000,000 lovelace + 996,071,981 PRE + Pool NFT
  - creator-side output: `#2`, 1,374,890 lovelace + 3,928,019 PRE
  - total PRE in launch outputs: exactly 1,000,000,000
- Independent SnekFun research:
  - repository: `open-tx3/snek-fun-protocols`
  - file: `snek-fun/investigacion/snek-fun-research.md`
  - research commit/file currently published by the repository
  - legacy reference launch: `87edffc1405348824bbe75adeb9df21d19e460fd13ed47da1072018bc0665125` (SNIGGA, September 2024)
  - current v1 reference launch: `7e7161f3d5906ff39c83b71be97bce31324d611208287bffd21947e323ffc4d`

## New evidence

The independent SnekFun research explicitly records a launch transaction shape in which:

- the 1B token emission is split between `initial_buy_tokens` (creator "dev buy") and `curve_tokens_remaining`;
- these quantities must sum to the token emission;
- launch is a single mint/seed/metadata/fee transaction;
- Pool NFT mint redeemer is parameterized by the seed transaction hash and index;
- token/metadata mint redeemer is `Constr 0 []`;
- the research corpus contains a concrete legacy September-2024 launch transaction, not only current v1 examples.

## What this changes for PRE

This materially strengthens the interpretation of PRE output #2 as a creator-side initial allocation compatible with Snek launch semantics.

It does **not** prove:

- that PRE used the same implementation/version;
- that PRE's 3,928,019 PRE was priced at exactly 10 ADA;
- that the 10,000,000 lovelace residual in PRE output #1 is the historical dev-buy funding component;
- that current `aNum/bNum` defines the historical PRE launch quote.

The independent research itself states that the exact bonding-curve quote is computed off-chain and that the published formula is not sufficient to reconstruct the exact historical quote.

## Current Gate 41 classification

- 3 ADA curve seed: **STRONG CROSS-VALIDATED LEAD**
- Pool-NFT-bearing output #1: **CLOSED**
- 1B PRE launch split: **CLOSED**
- 3,928,019 PRE creator-side allocation: **STRONGLY SUPPORTED**
- 10 ADA residual: **FACT**
- 10 ADA = creator dev-buy funding: **OPEN / STRONG SEMANTIC LEAD**
- Historical PRE pricing formula/version: **OPEN**
- Provider `info.outputId` #0 vs actual Pool NFT #1: **OPEN**
- Genesis funding role: **OPEN**

## Next decisive test

Retrieve and decode the legacy SNIGGA transaction `87edffc1405348824bbe75adeb9df21d19e460fd13ed47da1072018bc0665125` from an authoritative ledger source.

Compare:

1. output topology;
2. token quantity split;
3. pool ADA;
4. creator-side ADA;
5. metadata output;
6. launch fee/change;
7. Pool NFT mint redeemer;
8. token mint redeemer;
9. datum fields;
10. any witness/redeemer field that binds creator allocation to ADA.

Only a direct historical witness/implementation relation, or a sufficiently complete same-era launch reconstruction, should promote the 10 ADA attribution.

No IMMORTAL economic constants or normative protocol semantics changed.
