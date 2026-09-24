# Gate 41 — Mint-witness availability audit — 2026-09-24

## Result

A further triangulation pass checked the available Library evidence, current repository branch, Notion Gate 41, independent Snek-family prior art, and the exact PRE mint transaction references.

### What is actually available

The Library contains:

- the exact PRE mint `0235e186550383a53855a9727c02ceeb93d16956b3ae049ac367d85d291c6cf4` UTxO packet;
- exact inputs and outputs;
- the Pool NFT and PRE quantities;
- the creation PoolDatum;
- later State-0 transaction packets;
- the `followup-datums.json` record tying datum hash `04d5f46b...` to creation tx `0235...`.

The creation datum is fully recoverable and confirms:

- Pool NFT policy/name;
- PRE policy/name;
- `aNum = 122525779519`;
- `bNum = 2545182`;
- `adaCapThreshold = 18191400000`;
- permitted executor and witness credentials.

However, the available Library datum packet is **not a transaction-witness packet**: it contains datum/output information but does not expose the minting redeemer for the PRE token policy.

A local acquisition transcript lists a staged path:

`evidence/pre-snek/gate41-genesis/tx-info/0235...c6cf4.raw.json`

but that raw file is not currently exposed as a committed file on the active GitHub branch, and the Library transcript only records that it was staged. Therefore it cannot be treated as retrieved witness evidence.

### Important distinction

The PRE token policy ID

`1b29fda97d0fd321398c5b7b3285fdaadd519a0d002932853311f02c`

is confirmed on-chain, but no available source in this pass exposes its historical mint-policy source/compiled script or the actual mint redeemer for `0235...`.

Therefore:

**Historical PRE mint witness/redeemer — NOT YET OBSERVED**

This is a genuine evidence gap, not a negative finding.

## Consequence for the 10 ADA hypothesis

The ledger evidence remains:

- pool output #1 = 13 ADA + 996,071,981 PRE + Pool NFT;
- creator-side output #2 = 1.374890 ADA + 3,928,019 PRE + StepBeyond;
- output #3 = 2.218935 ADA to the same creator-side payment credential;
- PRE total = exactly 1,000,000,000.

The independent Snek prior-art evidence establishes a launch topology with a creator initial-token allocation, but it does not expose the historical PRE witness.

Therefore the correct status remains:

- 3 ADA seed: **STRONG CROSS-VALIDATED LEAD**
- creator initial allocation 3,928,019 PRE: **STRONGLY SUPPORTED**
- 10 ADA residual: **FACT**
- 10 ADA = creator initial-buy funding: **STRONGER LEAD / NOT PROVEN**
- historical PRE formula/version: **OPEN**
- historical PRE mint witness/redeemer: **OPEN**

## Next decisive acquisition

Do not infer the missing witness from current Snek v1.

The next acquisition should specifically obtain the full `tx_info` / ledger witness representation for `0235...` with script/redeemer fields, or the historical PRE mint policy artifact/source sufficient to reproduce the policy ID and interpret its redeemer.

If that evidence remains unavailable, the 10 ADA hypothesis must stay explicitly open.

No economic constants or IMMORTAL semantics changed.
