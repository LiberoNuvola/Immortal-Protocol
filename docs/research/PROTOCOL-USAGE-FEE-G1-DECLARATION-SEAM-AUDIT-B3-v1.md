# IMMORTAL — G1 Declaration Seam Audit B3 v1

**Classification:** non-normative branch-local research
**Branch:** `work/b3-materios-provenance-evidence`
**Date:** 2026-10-20
**Status:** AUDIT COMPLETE / NO AUTHORIZATION SEAM FOUND IN INSPECTED SURFACES
**Scope:** identify an existing declaration/authorization interface that could carry G1 applicability. No code changes.

## Finding

The inspected repository surfaces provide a public observation/declaration pattern, but they do **not** establish a reusable authoritative Protocol Usage Fee applicability contract. The existing public declaration layer must not be repurposed as fee authorization without a separately specified semantic and authority contract.

## Surfaces inspected on this branch

### 1. `src/protocolDeclaration.ts`

Defines `ProtocolDeclaration`, public lifecycle/activity/status, evidence references, and optional `PublicProtocolState`. `declarationPublishable` checks non-empty declaration/evidence fields. Its own comments explicitly classify the layer as observation/presentation, not economic authority, and state that the publishability check does not validate economic admissibility.

**G1 reuse decision:** NOT SUFFICIENT. Presence of evidence and publishability are not proof that a fee-bearing class was authorized.

### 2. `src/publicActionAvailability.ts`

Defines application-facing action names and availability states. Its comments explicitly say it does not decide economic or cryptographic admissibility and must be produced by an authoritative state/observation layer. Its action list is UI/action availability, not fee applicability.

**G1 reuse decision:** NOT SUFFICIENT. `available=true` must not be interpreted as `FeeBearing=true`, and a disabled action does not imply a fee exemption.

### 3. `docs/04-guides/13_PROTOCOL_DECLARATION_LAYER_v0.1.md`

Describes the declaration layer as a projection of authoritative observations and explicitly prohibits it from creating or approving transitions not supported by canonical state. The guide is marked DESIGN / NON-NORMATIVE and names a different branch in its header (`work/immortal-green-closure`); it is used here only as architecture context, not as proof of a G1 implementation on this branch.

**G1 reuse decision:** NOT AN AUTHORIZATION CONTRACT. Public transparency and fee applicability are distinct concerns.

### 4. Existing deployment/profile patterns

Search results identified application deployment profiles, including `PRE-RICH/src/PreRichPreprodDeploymentProfile.ts`, but no fee-specific `FeePolicy`, `FeeBearing` implementation, or profile hash/authorization contract was found by the targeted searches. These search results are discovery evidence only, not proof of repository-wide absence.

**G1 reuse decision:** no inspected profile surface can currently be identified as the canonical Protocol Usage Fee declaration producer.

## Boundary conclusion

The nearest existing pattern is `authoritative observation → declaration + evidence`, but it is a **shape analogy only**. Reusing it directly would conflate three distinct questions:

1. Is an action available now?
2. Is this action class declared fee-bearing for this deployment/profile?
3. If fee-bearing, what economic obligation is owed?

These must remain separate. G1 needs a deployment/profile declaration with canonical class identifiers, explicit applicability values, profile/version binding, and verifiable authority/provenance. The exact authority mechanism is not selected here.

## Safe next step

Before creating a production type or wiring any call site, prepare a design-only G1 interface proposal that:

- references the existing observation/declaration pattern without reusing it as economic authority;
- specifies the minimum information a fee-applicability declaration must carry;
- records unknown/missing declarations as unconfigured and blocks claims of fee conformance;
- keeps the declaration separate from `EconomicFeeTarget`, settlement, accounting classification, and rewards;
- makes no change to V3 or Reveal semantics.

## Limits

Targeted GitHub code-search and exact-branch file reads were used. Search index results can be incomplete and code search may index a different ref; therefore this is **not** a whole-repository proof of absence. No production code, tests, CI, deployment, or on-chain behavior was changed or verified.