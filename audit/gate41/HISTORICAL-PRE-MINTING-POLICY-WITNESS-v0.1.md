# Gate 41 — Historical PRE Minting Policy Witness v0.1

Date: 2026-09-26

## Canonical historical transaction

- Transaction: `0235e186550383a53855a9727c02ceeb93d16956b3ae049ac367d85d291c6cf4`
- Era: Babbage
- PRE policy: `1b29fda97d0fd321398c5b7b3285fdaadd519a0d002932853311f02c`
- Asset name: `5052452d52494348` (PRE-RICH)
- Historical mint quantity: 1,000,000,000 PRE-RICH
- PRE mint redeemer: `{"int":1}`

## Deterministic witness evidence

The transaction evidence contains three PlutusV2 scripts. The PRE minting policy witness is:

- Type: `PlutusV2`
- Policy hash: `1b29fda97d0fd321398c5b7b3285fdaadd519a0d002932853311f02c`
- Script length: 381 bytes
- Witness role: minting policy for the PRE-RICH asset
- Mint redeemer index: 0
- Mint redeemer: `{"int":1}`

The same transaction evidence reports the PRE script as a Plutus witness and reports the transaction as valid.

## Historical PRE minting policy script

The exact 381-byte PlutusV2 script witness recovered from the transaction evidence is:

```text
59017a59017701000032323232323232323232322253330083232325332233300d00200114a0666010444a666018002294054ccc038c008c04400452889980180118080009191919baf374e60240046e9cc0480053012bd8799fd8799f5820f6874f42a880915f7d79d6b23ecc55eb378b5fd8847c4004ed1c98a2eba70509ff04ff00300f30100010011323370e64646644666601600490001199980600124000eb4dd58008029bae3011001375c602260200026022002664466e9520003300d37520046601a6ea40052f5c0646464a66601e66e1d20000021375c60240022c6026004601c0026ea8c8c040c03c004c0400152201085052452d524943480048202a35ae41cdd598071918071807180700098068011bac300d001300d001300b300c0011498588c008dd480091111980291299980400088028a99980519baf300b300d00100613004300f300d00113002300c0010012323002233002002001230022330020020015573eae815cd2ab9d5744ae848c008dd5000aab9e01
```

The leading CBOR bytes `59 01 7a` encode the 378-byte Plutus program payload after the CBOR length prefix; the complete serialized script witness is 381 bytes as reported by the transaction evidence.

## Gate conclusion

The historical PRE minting-policy witness is no longer OPEN.

The evidence chain is:

`transaction 0235... -> PlutusV2 witness -> policy hash 1b29...f02c -> mint redeemer index 0 -> 1,000,000,000 PRE-RICH`.

This closes the historical-policy acquisition gap. It does **not** by itself prove that canonical PRE has been materially deployed on Preprod; the Preprod materialization gate remains separate and open.

## Source boundary

Source: transaction evidence for `0235e186550383a53855a9727c02ceeb93d16956b3ae049ac367d85d291c6cf4`, including its `scripts`, `redeemers`, `mint`, and `witnesses` sections.

No synthetic policy, Yaci fixture, or reconstructed policy was used.
