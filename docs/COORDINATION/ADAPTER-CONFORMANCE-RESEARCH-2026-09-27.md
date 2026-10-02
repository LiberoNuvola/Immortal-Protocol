# Adapter Conformance / Trust Research Delta — 2026-09-27

**Role:** non-normative coordination delta for the current working branch.

## Materialized
- Adapter/REFERENCE/docs/README.md — Reference Adapter boundary; no deployment target or economic authority.
- Adapter/REFERENCE/docs/CONFORMANCE-METHODOLOGY.md — differential methodology and mismatch taxonomy.
- Adapter/SOLANA/docs/SOLANA-TRUST-MODEL.md — CU, account persistence, CPI authority, finality and ordering boundaries.
- Adapter/COSMOS/docs/COSMOS-TRUST-MODEL.md — IBC/light-client, relayer, validator-set and governance boundaries.
- docs/research/B3-C-MATERIOS-IBC-LIGHT-CLIENT-RESEARCH-2026-09-27.md — standalone Materios↔IBC research pass.

## Classification
All five artifacts are DRAFT / RESEARCH / OPEN and authorize no chain implementation.

## Reference Adapter
The Reference Adapter is explicitly derived from EconomicKernel.hs. It is not a second normative implementation. Differential comparison targets canonical economic state transition-by-transition.

## Solana
Open requirements include measured CU boundedness, account persistence/rent, CPI authority, finality and leader-information/ordering analysis. Randomness remains a separate B1/B3 question.

## Cosmos / IBC
IBC is treated as a candidate verification mechanism for remote finality/state authenticity, not as a randomness primitive and not as automatic system-wide B3. Relayers remain transport/liveness actors, not economic authorities.

## Materios non-contamination rule
The Cosmos research MUST NOT modify or weaken the existing Materios B3 work, reimplement the authoritative selector, invent anchor-ID semantics, or promote SDK conventions to canonical rules.

## Next executable research
1. Reuse the existing Materios real-fixture contract when a real finalized fixture exists.
2. Determine exact GRANDPA/light-client compatibility and validator-set transition requirements.
3. Determine the minimum authenticated state/storage proof.
4. Run adversarial light-client verification experiments outside IMMORTAL if needed.
5. Measure execution/storage economics and compare with the existing succinct-proof research.
6. Keep all adapter implementations blocked until the trust boundary and Reference conformance corpus are accepted.

## Relationship to main coordination register
This delta is intentionally append-only so the large coordination register is not rewritten from a truncated read. The main register should absorb this delta at the next controlled coordination update.