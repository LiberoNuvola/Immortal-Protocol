# P2.8-B.1 — normative evidence ingestion contract

A normative Reveal evaluation MUST provide the exact serialized transaction plus the matching ledger context:

- `tx.cbor`
- `utxo.json`
- `pparams.json`
- `epoch-info.json`
- `system-start.json`
- `manifest.json`

The packet must describe the network/era, transaction hash and inputs, acquisition provenance, protocol-parameter point, system-start source, exact script-artifact hashes, and SHA-256 hashes of the evidence files.

The evidence files must refer to the same ledger state. No synthetic emulator UTxOs, datum/redeemer/context, substitute scripts, or unrelated PRE/Snek transaction may be promoted to normative evidence.

The Cardano ledger API evaluation boundary requires protocol parameters, transaction, UTxO, epoch information and system start; the execution report can distinguish ExUnits from ledger-originated script/context failures. citeturn0search0

Until the packet is complete, the runner returns `SAFE_STALL: INCOMPLETE_LEDGER_EVIDENCE`. This is an evidence-state result, not a validator failure.
