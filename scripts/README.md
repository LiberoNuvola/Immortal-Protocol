# Gate 41 — PRE Snek Pool NFT Asset History v0.1

This is the focused lineage pass.

Instead of following every Plutus predecessor, it queries the exact Pool NFT asset history:

- policy `63f947b8d9535bc4e4ce6919e3dc056547e8d30ada12f29aa5f826b8`
- name `5485c3f75f0e0ad7424759a5761b516f0c95acb5032d2afb68ddf61aba1494cc`

Then it fetches `tx_info` for each transaction and reconstructs:

`Pool NFT-bearing output -> spending transaction`

This is the evidence path needed to test:

`0235...#0 -> ... -> e457...#0`

It does not infer seed/min-ADA semantics.

Run:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File ".\scripts\trace-pre-snek-pool-nft.ps1"
```

Outputs:

- `koios-pool-nft-asset-txs.json`
- one raw `tx_info` JSON per NFT transaction
- `pool-nft-lineage-index.json`
- `pool-nft-lineage-edges.json`
