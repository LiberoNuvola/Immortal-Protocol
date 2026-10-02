# Adapter Landscape

**Role:** index and comparison of all Adapter proposals for IMMORTAL — the one already implemented and the ones proposed as research/design drafts. Non-normative. Does not select, rank as "official," or authorize implementation of anything listed as DRAFT.

**Semantic status:** DRAFT / OPEN DECISION, except the Cardano row, which reflects the already-implemented adapter and is descriptive, not a new proposal.

**Relationship to existing documents:** this is the entry point to `Adapter/CARDANO/` and the sibling trust-model drafts below. It does not modify IMMORTAL universal semantics, any application layer, or any individual trust-model document. Where this table and a linked document disagree, the linked document is authoritative for its own adapter, per the source-of-truth discipline in `IMMORTAL-SYSTEM-MAP.md` §13.

## 1. How to read this table

Each adapter is evaluated on the same five axes:

- **On-chain expressivity** — can the target environment enforce IMMORTAL's economic invariants directly, or does that enforcement have to be relocated off-chain?
- **Atomicity of sale** (mint + payment + reservation) — native to the environment, or does it require careful multi-effect validator design?
- **Randomness / Beacon trust (B1 today)** — the named authority a production deployment would depend on right now.
- **Randomness / Beacon target (B3)** — whether a publisher-independent path is blocked by a missing primitive, blocked by missing integration work, or already has a concrete research path.
- **Risk class with no Cardano equivalent** — the new failure mode this environment introduces that the Cardano Adapter's design does not have to consider.

## 2. The table

| Adapter | Status | On-chain expressivity | Sale atomicity | B1 today | B3 target / research state | New risk class |
|---|---|---|---|---|---|---|
| **Cardano** | Implemented, production | Full (Plutus validators) | Explicit multi-effect validator checks | Authorized Beacon publisher | Materios/GRANDPA finality — PoC exists; real-fixture/conformance work remains | — reference case |
| **Bitcoin** | DRAFT — `Adapter/BITCOIN/docs/BITCOIN-TRUST-MODEL.md` | None on base L1; candidate paths depend on external/client-side mechanisms | Bitcoin transaction atomicity is native; enforcing the required cross-output relationship is the hard boundary | Path A: Liquid federation; Path B: client-side RGB-style validation | Native covenant path remains blocked by the missing required primitive in the evaluated baseline | Miner grinding / block-hash beacon risk |
| **Substrate / Materios-native** | DRAFT — `Adapter/SUBSTRATE/docs/SUBSTRATE-TRUST-MODEL.md` | Full (pallet/direct Rust) | Native single-extrinsic checks | Beacon-authenticity gap remains the research boundary | Runtime governance and cross-chain settlement remain research boundaries | Runtime-upgrade authority |
| **Ethereum / EVM** | DRAFT — `Adapter/ETHEREUM/docs/ETHEREUM-TRUST-MODEL.md` | Full (Solidity/EVM) | Native revert-on-failure | Chainlink VRF / drand candidates | Native proof-based randomness remains research-only; no activation assumption | Reentrancy; public-mempool ordering/MEV; shared mutable state |
| **Solana** | DRAFT — `Adapter/SOLANA/docs/SOLANA-TRUST-MODEL.md` | Full (program/CPI model) | Native transaction/CPI composition | External VRF/entropy candidate; exact provider boundary remains OPEN | Protocol-native randomness remains research-only; no activation assumption | Compute-unit ceiling; account persistence/rent; CPI authority; leader-information timing |
| **Cosmos / CosmWasm** | DRAFT — `Adapter/COSMOS/docs/COSMOS-TRUST-MODEL.md` | Full (CosmWasm/Rust) | Native transaction execution | Chain-specific/threshold randomness candidate; exact mechanism remains OPEN | IBC light-client path has an existing GRANDPA/Wasm technology precedent, but Materios compatibility and conformance remain OPEN | Relayer liveness as a distinct safety-preserving dependency |
| **Reference / Conformance** | DRAFT — `Adapter/REFERENCE/docs/README.md` | Not applicable — test/conformance artifact | Not applicable | Fixture-supplied | Not applicable — verifies adapter semantics rather than supplying consensus/randomness | None — no real-fund deployment target |

## 3. Repeating pattern

No non-Cardano adapter evaluated here has an already-accepted, publisher-independent B3 deployment path.

The current distinction is important:

- some candidate B3 routes are blocked by a missing protocol primitive;
- some have a concrete technology precedent but still require integration and conformance evidence;
- none should be promoted from B1 to B3 merely because a chain has finality, a threshold service, a light client, or a cryptographic primitive.

This table is a snapshot of the research state, not a scorecard.

## 4. Current research/conformance sequence

The repository currently converges on the following **research methodology**, not a production roadmap:

1. **Reference / Conformance** — establish canonical fixtures and transition-by-transition differential comparison without real funds.
2. **Cosmos / IBC research** — determine whether the existing GRANDPA/Wasm light-client architecture can authenticate the exact Materios evidence required by the existing B3 boundary.
3. **Chain-specific evaluation** — compare any future adapter against the same Reference fixture corpus before considering deployment.
4. **Implementation only after its own trust model, conformance evidence and authority boundaries are accepted.**

The sequence above is methodological; it does not commit IMMORTAL to supporting multiple non-Cardano adapters.

## 5. What this document does not decide

- It does not rank DRAFT adapters by desirability.
- It does not authorize implementation of any DRAFT adapter.
- It does not select a B3 mechanism.
- It does not alter IMMORTAL economic constants or universal semantics.
- It does not modify Materios consensus, authority selection, or the existing B3 research.
- It does not commit to supporting more than one non-Cardano adapter in production.

## 6. Document set indexed here

- `Adapter/CARDANO/docs/README.md` — implemented adapter.
- `Adapter/BITCOIN/docs/BITCOIN-TRUST-MODEL.md` — Bitcoin trust boundary.
- `Adapter/SUBSTRATE/docs/SUBSTRATE-TRUST-MODEL.md` — Substrate/Materios trust boundary.
- `Adapter/ETHEREUM/docs/ETHEREUM-TRUST-MODEL.md` — Ethereum trust boundary.
- `Adapter/SOLANA/docs/SOLANA-TRUST-MODEL.md` — Solana trust boundary.
- `Adapter/COSMOS/docs/COSMOS-TRUST-MODEL.md` — Cosmos/CosmWasm trust boundary.
- `Adapter/REFERENCE/docs/README.md` — Reference Adapter boundary.
- `Adapter/REFERENCE/docs/CONFORMANCE-METHODOLOGY.md` — shared differential methodology.
- `docs/research/B3-C-MATERIOS-IBC-LIGHT-CLIENT-RESEARCH-2026-09-27.md` — current Materios↔IBC research delta.
- `docs/research/B3-C-SUCCINCT-PROOF-RESEARCH-2026-09-26.md` — existing succinct-proof research baseline.
