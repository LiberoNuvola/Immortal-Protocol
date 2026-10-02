# GOV-28 — GOV-22 Contradiction Resolution

Date: 2026-09-24
Branch: `work/immortal-green-closure`

## Resolution

The previously isolated GOV-22 wording contradiction is already resolved by the repository coordination history.

The 2026-09-22 coordination entries explicitly established:
- `GovernanceEventSchema.hs` + `GovernanceCanonicalReplay.hs` are the authoritative GOV-22 semantic replay lineage;
- `CanonicalEvent.hs` is LEGACY / PARALLEL and non-authoritative;
- the active Cabal package does not expose `CanonicalEvent.hs`;
- GOV-22 canonical replay is the canonical-event-only API.

Relevant recorded commits:
- `bc4d08b40aa82f7af2942aadd4f908065caebb69` — GOV-22 status wording
- `9c669ff16556d86f8a32f6c3fd196dbf4d064ed8` — legacy lineage marker
- `16a2e5e368fd47a40abb0dad69f2ee25c3ec3e65` — package-boundary separation

Therefore the intended interpretation is **CanonicalEvent-only at the replay boundary**, with the existing `payloadToGovernanceEvent -> applyEvent` conversion treated as an internal compatibility implementation detail, not a second canonical event source.

## Consequence

No new normative decision is required for GOV-22.

The remaining defect is different: the authoritative canonical path still delegates lifecycle semantics to the older `GovernanceEvent`/`ProposalStatus` model, which lacks the distinct GOV-18 finalization/adoption/conformance/canonicalization event algebra.

That is the next implementation/conformance boundary.

External event-sourcing prior art independently supports the general architectural principle that immutable events are the source of state reconstruction and that live/replay paths should converge on the same state-application semantics. This is supporting engineering prior art only; GOV-18 remains the normative source for IMMORTAL semantics.