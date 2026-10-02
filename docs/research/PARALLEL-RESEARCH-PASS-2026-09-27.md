# Parallel Research Pass — 2026-09-27

## Classification

**Research / non-normative.** These notes do not alter canonical economics, B3 semantics, IMMORTAL authority, or deployment certification.

## Parallel fronts completed

### B3-A / B3-B — Materios finality and state authentication
`docs/research/B3-A-B-MATERIOS-FINALITY-STORAGE-TRIANGULATION-2026-09-27.md`

Finding: the strongest reusable architecture is a two-stage proof chain:

`finality / authority / ancestry → finalized StateRoot → storage membership → exact application value`

Production references include Polkadot SDK GRANDPA finality proofs, BEEFY, IBC light clients and Snowbridge.

### B3-C — succinct verification
The existing B3-C research remains the governing non-normative note. The new research strengthens it with production/near-production references:

- BEEFY as a compact finality commitment pattern;
- Snowbridge as a deployed light-client decomposition;
- SP1 Tendermint as a ZK light-client architecture reference;
- Mithril/Halo2 as adjacent Cardano proof-system research.

No proof system is selected.

### P2.8 — Cardano native evaluation
`docs/research/P2.8-LEDGER-NATIVE-RESEARCH-2026-09-27.md`

Finding: `evalTxExUnitsWithLogs` is the correct ledger-native boundary. Exact UTxO, PParams, EpochInfo and SystemStart remain required. No synthetic context is acceptable as equivalent evidence.

### Adapter differential conformance
`docs/research/ADAPTER-DIFFERENTIAL-CONFORMANCE-RESEARCH-2026-09-27.md`

Finding: differential testing can strengthen Adapter/F3/B6 conformance if the oracle is restricted to semantic/conformance outputs. It must never become an economic authority.

### Prior art / F12
`docs/research/IMMORTAL-PRIOR-ART-MATRIX-2026-09-27.md`

Finding: substantial prior art exists for each individual component and for cross-chain proof composition. Exact IMMORTAL composition remains an open research question; no novelty claim is justified yet.

## Materios implementation bridge

Materios issue #50 defines the required thin RPC boundary:

`exact block + exact runtime call → ProofProvider::execution_proof → deterministic proof envelope`

The issue explicitly forbids selector reimplementation and synthetic proof evidence.

## Result

The research fronts can now advance independently of CI:

- **B3-A:** proof-chain structure clarified; real Materios witness still open.
- **B3-B:** StateRoot/storage separation clarified; real Materios storage proof still open.
- **B3-C:** candidate architecture space narrowed; benchmark/verification experiment still open.
- **P2.8:** evidence boundary fixed; exact-head native packet still open.
- **Differential:** harness pattern identified; implementation can proceed after contract selection.
- **F12:** prior-art matrix materially advanced; not complete.

No canonical economic or architectural decision was changed by this pass.
