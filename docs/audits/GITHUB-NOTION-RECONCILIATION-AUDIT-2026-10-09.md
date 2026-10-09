# IMMORTAL / PRE-RICH — GitHub ↔ Notion Reconciliation & Repository Audit Snapshot

**Date:** 2026-10-09  
**Active branch:** `work/immortal-green-closure`  
**Verified branch tip:** `fc2db10f6e15ebafdf50c8ade6fc0f88507aa8e9`  
**Tip commit:** `Cache compiled B2 Plutus artifacts between Preprod runs`

## 1. Repository topology truth

The active implementation remains `work/immortal-green-closure`.

Comparison against `main`:

- status: **diverged**
- work branch: **620 commits ahead**
- work branch: **3 commits behind**
- merge base: `8c6873e1d50115659727c82c294426b9a946f1fa`

The 3 commits present on `main` after the merge base are the B2 Preprod workflow exposure/zero-input commits. The active work branch already contains its own newer B2 Preprod workflow and must not be mechanically merged with `main` merely to eliminate the numerical divergence.

**Operational rule:** active implementation stays on `work/immortal-green-closure`; `main` remains the release/public line until a deliberate promotion.

## 2. Cross-source reconciliation

### B1 / EEV

Current repository contains:

- direct-USDM observation boundary;
- EV1–EV7 evidence model;
- deployment-approval model;
- signed Issue-authority envelope verification;
- Haskell Issue decision producer boundary;
- Preprod authoritative Issue provider;
- exact Pool/V3/B2 observation binding.

The remaining blocker is no longer an absent TypeScript interface. A concrete production closure still depends on a valid deployment-specific authority package: authenticated signed authority, complete EEV evidence, ProtectedCapital provenance, viability certificate, and concrete deployment Kc/Ω evidence.

### B2 Control

Current repository contains:

- authenticated B2 control validator;
- one-shot B2 mint policy;
- deployment script;
- exact singleton observation;
- authority-key binding;
- Issue-side B2 reference-input binding;
- adversarial/conformance tests.

B2 remains **deployment/evidence open** until the real Preprod control singleton is observed on-chain and an adversarial ledger trace proves authorized mutation, singleton uniqueness and Issue reference binding.

### V3 carrier

The current source file `PRE-RICH/onchain/V3EconomicStateCarrierMintPolicy.hs` is explicitly marked **Diagnostic Probe C** and currently returns `True` without decoding the redeemer/context. The deployment script `scripts/deployV3Carrier.mts` consumes the generated V3 carrier mint-policy artifact.

Therefore the current artifact is **not suitable as a production singleton mint policy**. Before any new V3 carrier deployment, the policy source must be restored/confirmed as the intended secure one-shot policy and the live carrier policy identity must be checked against the deployed artifact. No existing live deployment is assumed compromised from source inspection alone.

### B3 / Materios / Beacon 4

B3 remains separate and non-blocking for the first real Issue.

Beacon 4 remains research/open architecture and must not be promoted to normative status or used as a prerequisite for the first ticket.

## 3. Repository audit findings

### F-01 — V3 carrier mint policy is currently diagnostic/unrestricted
**Severity:** P0/P1 before any V3 deployment.

`PRE-RICH/onchain/V3EconomicStateCarrierMintPolicy.hs` currently defines a diagnostic policy whose predicate is always true and does not inspect `ScriptContext`. The deployment path loads that artifact.

**Risk:** a future deployment using this artifact would not cryptographically enforce one-shot seed consumption or singleton minting at the mint-policy layer.

**Required action:** do not deploy this artifact. Restore/validate the intended secure mint-policy implementation, then run the remote mint-policy test and verify the live policy identity before declaring V3 deployment secure.

### F-02 — Issue production path makes B2/V3 binding optional at API level
**Severity:** P1 before enabling the first-user Buy path.

In `src/mint.ts`, both `requireB2ControlBinding` and `requireV3CarrierBinding` are caller-supplied booleans. The transaction adds the B2 control reference and V3 carrier continuation only when those flags are enabled.

The Cardano execution adapter correctly requires an authoritative Issue witness, but the generic Issue admission contract alone does not prove that the live B2 singleton was consumed as a reference input.

**Risk:** a future production call-site could provide a structurally valid authoritative witness while omitting the live B2 reference-input binding.

**Required action:** make the first-user/production Issue entrypoint require B2 + V3 bindings unconditionally, or introduce a distinct production constructor whose type/contract makes omission impossible. Keep generic infrastructure paths separate.

### F-03 — Type contract drift in PreprodAuthoritativeIssueProvider
**Severity:** P1/P2.

`Adapter/CARDANO/observation/PreprodAuthoritativeIssueProvider.ts` reads `inputs.controlStateReference` inside its `observationSource` callback, but that property is absent from the callback input type. The corresponding `HaskellIssueAdmissionProviderOptions.observationSource` type also omits `controlStateReference`.

Runtime composition later supplies/observes the B2 control reference, so this is primarily a type-safety/interface-consistency defect, but it can be hidden by transpile-only execution.

**Required action:** align the callback types with the actual Issue runtime contract and ensure CI performs a real TypeScript typecheck over these files.

### F-04 — Saleability has two predicates with different authority boundaries
**Severity:** P2, conformance hardening.

`EconomicKernel.classSaleable` checks active-class and cap conditions but does not inspect `tcsSaleable`. PRE-RICH Issue refinement also uses active-class + cap, while the live V3 observation path separately checks `liveClass.saleable`.

The repository's state-ownership documentation treats `tcsSaleable` as application policy, so this may be an intentional layering decision rather than an immediate invariant violation.

**Risk:** future code could accidentally rely on `EconomicKernel.classSaleable` alone and admit a class marked non-saleable by application state.

**Required action:** add an explicit negative conformance vector for `tcsSaleable = false` with otherwise valid active/cap state, and document the required layer at every Issue entrypoint.

### F-05 — B2/V3 cross-check only compares current/highest activation state
**Severity:** P2.

`relayer/preprodIssueObservationReader.js` verifies that B2 and V3 agree on `currentActiveClass` and `highestClassEverActivated`, while B2 also has `stateVersion` and `transitionNonce`.

**Risk:** two different control-carrier states could share the same class-control values while differing in version/nonce. If those fields are intended as identity/provenance, the comparison is weaker than the deployment-state binding.

**Required action:** explicitly decide whether stateVersion/transitionNonce are identity-bearing; if yes, bind and compare them in the Issue authority path and tests.

### F-06 — B2 workflow cache validation is syntactic, not provenance-cryptographic
**Severity:** P2.

The latest workflow correctly reuses compiled B2 artifacts on cache hits, but cache-hit validation only checks JSON type and CBOR hex shape. The cache key hashes selected source files, yet there is no embedded compiled-artifact digest or source-to-artifact equivalence check.

**Risk:** a stale/corrupted cache artifact can pass the current syntactic validation.

**Required action:** retain the cache reuse, but validate expected artifact hashes or a deterministic source/artifact provenance digest.

### F-07 — Workflow dependency installation is not lockfile-reproducible
**Severity:** P2.

`.github/workflows/pre-rich-b2-control-preprod.yml` uses `npm install --no-audit --no-fund` instead of `npm ci`.

**Risk:** dependency resolution can vary from the committed lockfile state.

**Required action:** use the repository's locked dependency installation mode for CI.

### F-08 — Historical credential exposure requires rotation verification
**Severity:** P1 security hygiene.

The repository history contains a prior commit explicitly removing provider secrets from tracking. Removing a credential from the current tree does not make the historical credential safe.

**Required action:** verify that the exposed credential was revoked/rotated and that no active deployment still relies on the historical value. Never store provider credentials in Git history.

### F-09 — Blockfrost proxy is an operational abuse surface
**Severity:** P2 unless deployment is strictly private.

`blockfrost-proxy/proxy.js` allows wildcard CORS, forwards a server-side provider credential, logs proxied URLs, and exposes the proxy without an application-level authentication/rate-limit layer.

**Required action:** confirm whether this service is private/internal. If public, add appropriate rate limiting, request restrictions and safe logging, and minimize exposed endpoint surface.

## 4. Documentation drift

The following repository/Notion records are stale relative to the verified 2026-10-09 branch tip:

- `docs/COORDINATION/PREPROD-FIRST-TICKET-HANDOFF-20261003.md` still describes the authoritative Issue producer as open.
- `docs/03-audit/IMMORTAL-IMPLEMENTATION-CLOSURE-STATUS.md` still contains earlier B2/EEV blocker wording.
- `PRE-RICH/docs/B2-AUTHENTICATED-CONTROL-DESIGN-v0.1.md` predates the now-materialized deployment identity/authority wiring.
- Notion `05 — SOURCE REGISTRY` still contains the September GitHub-403/old test snapshot language.
- Notion Control Center still needs the exact 2026-10-09 branch tip and the above audit findings represented as the current operational snapshot.

These documents should not be silently rewritten as normative history. A dated reconciliation delta is the correct mechanism.

## 5. Non-regression boundary

This audit does **not** reopen:

- V3 economic semantics;
- Reveal semantics;
- Classic-6 distribution;
- 500× payout cap;
- ProtectedCapital accounting;
- EEV direct-USDM perimeter;
- B3/Materios semantics;
- Beacon 4 research assumptions.

No protocol/economic semantics were changed by this audit snapshot.

## 6. Immediate priority order

1. F-01 — prevent deployment of the diagnostic V3 mint policy.
2. F-02 — make production Issue binding to B2/V3 non-optional.
3. F-03 — repair provider type contracts and run real TS typecheck.
4. F-08 — verify credential rotation.
5. F-05/F-06/F-07 — harden provenance and CI reproducibility.
6. F-04 — close saleability conformance ambiguity with explicit negative evidence.
7. F-09 — harden or explicitly isolate the Blockfrost proxy.

**Current conclusion:** the architecture is materially further closed than the older status documents indicate. The remaining blockers are concentrated in concrete deployment evidence and a small number of implementation-boundary hardening issues, with F-01 and F-02 the most important code-level findings before production Issue/V3 deployment.
