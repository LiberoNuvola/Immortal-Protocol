# IMMORTAL / PRE-RICH — GitHub ↔ Notion Reconciliation & Repository Audit Snapshot

**Date:** 2026-10-09  
**Active branch:** `work/immortal-green-closure`  
**Initial reconciliation tip:** `fc2db10f6e15ebafdf50c8ade6fc0f88507aa8e9`  
**Current verified branch tip at this refresh:** `b1af5d801cd4b9b0d23a28e5139857727894571d`

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

The first audit pass found that `PRE-RICH/onchain/V3EconomicStateCarrierMintPolicy.hs` had been reduced to a Diagnostic Probe C implementation that unconditionally accepted the policy predicate.

This was corrected in the current branch. The source now enforces:
- the configured seed `TxOutRef` is consumed;
- the mint under the policy's own currency symbol is exactly the configured token name with quantity `1`;
- any other seed/token/quantity case is rejected.

The ledger probe was also strengthened with negative cases for unconsumed seed, wrong token name and wrong mint quantity.

**Remaining requirement:** the generated Plutus artifact must be rebuilt/validated on the next workflow run, because the source correction changes the artifact. The live deployed carrier must not be re-deployed from the old diagnostic artifact.

### B3 / Materios / Beacon 4

B3 remains separate and non-blocking for the first real Issue.

Beacon 4 remains research/open architecture and must not be promoted to normative status or used as a prerequisite for the first ticket.

## 3. Repository audit findings

### F-01 — V3 carrier mint-policy false-green (**SOURCE FIXED; ARTIFACT REBUILD PENDING**)
**Severity:** P0/P1 before any new V3 carrier deployment.

The source-level diagnostic/unrestricted predicate has been removed. The current policy is one-shot and singleton-constrained, and the ledger probe now contains negative cases that would fail under an unconditional policy.

**Remaining evidence:** rebuild/export the artifact, execute the strengthened probe against the current artifact, and bind the result to the exact commit SHA before any new V3 carrier deployment.
### F-02 — Generic Issue API exposes optional B2/V3 binding flags
**Severity:** P2 hardening; **not a current first-user blocker**.

In `src/mint.ts`, `requireB2ControlBinding` and `requireV3CarrierBinding` are caller-supplied booleans. However, the dedicated production entrypoint `mintSerialNFTWithAuthoritativeAdmission()` explicitly forces both to `true`.

**Conclusion:** the first-user Issue path is already protected against omission at this wrapper boundary. The remaining concern is future misuse of the lower-level generic `mintSerialNFT()` entrypoint.

**Required action:** add a regression test/documented production contract preventing the generic entrypoint from being reused as the public first-user path. No change to economic semantics is required.

### F-03 — Type contract drift in PreprodAuthoritativeIssueProvider
**Severity:** P1/P2 — **FIXED**.

`Adapter/CARDANO/observation/PreprodAuthoritativeIssueProvider.ts` reads `inputs.controlStateReference` inside its `observationSource` callback, but that property is absent from the callback input type. The corresponding `HaskellIssueAdmissionProviderOptions.observationSource` type also omits `controlStateReference`.

Runtime composition later supplies/observes the B2 control reference, so this is primarily a type-safety/interface-consistency defect, but it can be hidden by transpile-only execution.

**Resolution:** added `controlStateReference` to the callback contract and added an explicit TypeScript boundary typecheck to Direct-USDM conformance CI.

### F-04 — Saleability has two predicates with different authority boundaries
**Severity:** P2 — **FIXED**.

`EconomicKernel.classSaleable` checks active-class and cap conditions but does not inspect `tcsSaleable`. PRE-RICH Issue refinement also uses active-class + cap, while the live V3 observation path separately checks `liveClass.saleable`.

The repository's state-ownership documentation treats `tcsSaleable` as application policy, so this may be an intentional layering decision rather than an immediate invariant violation.

**Risk:** future code could accidentally rely on `EconomicKernel.classSaleable` alone and admit a class marked non-saleable by application state.

**Resolution:** `EconomicKernel.classSaleable` now requires `tcsSaleable`, and `PreRichIssueDecisionTest.hs` includes the explicit non-saleable negative vector.

### F-05 — B2/V3 cross-check only compares current/highest activation state
**Severity:** P2.

`relayer/preprodIssueObservationReader.js` verifies that B2 and V3 agree on `currentActiveClass` and `highestClassEverActivated`, while B2 also has `stateVersion` and `transitionNonce`.

**Risk:** two different control-carrier states could share the same class-control values while differing in version/nonce. If those fields are intended as identity/provenance, the comparison is weaker than the deployment-state binding.

**Required action:** explicitly decide whether stateVersion/transitionNonce are identity-bearing; if yes, bind and compare them in the Issue authority path and tests.

### F-06 — B2 workflow cache provenance
**Severity:** P2 — **HARDENED**.

The B2 cache key now includes the relevant source files, Plutus cabal files, `.github/actions/setup-plutus/action.yml` and `package-lock.json`.

This materially reduces stale-toolchain/cache drift. A stronger cryptographic source-to-artifact attestation remains a future hardening option, not a current deployment blocker.

### F-07 — Workflow dependency installation
**Severity:** addressed in current audit cycle.

`.github/workflows/pre-rich-b2-control-preprod.yml` now uses `npm ci --no-audit --no-fund`. The Direct-USDM conformance workflow was aligned as well.

### F-08 — Historical credential exposure requires rotation verification
**Severity:** P1 security hygiene.

The repository history contains a prior commit explicitly removing provider secrets from tracking. Removing a credential from the current tree does not make the historical credential safe.

**Required action:** verify that the exposed credential was revoked/rotated and that no active deployment still relies on the historical value. Never store provider credentials in Git history.

### F-09 — Blockfrost proxy is an operational abuse surface
**Severity:** P2 unless deployment is strictly private.

`blockfrost-proxy/proxy.js` allows wildcard CORS, forwards a server-side provider credential, logs proxied URLs, and exposes the proxy without an application-level authentication/rate-limit layer.

**Required action:** confirm whether this service is private/internal. If public, add appropriate rate limiting, request restrictions and safe logging, and minimize exposed endpoint surface.

### F-10 — Current tip CI evidence
**Severity:** P2 / evidence integrity.

The repository connector did not expose a combined status for the captured implementation tip during this pass.

**Rule:** no current-head GREEN claim is made until a workflow result/artifact is bound to the exact final SHA after the audit fixes.

## 4. Documentation drift

The following repository/Notion records are stale relative to the verified 2026-10-09 branch tip:

- `docs/COORDINATION/PREPROD-FIRST-TICKET-HANDOFF-20261003.md` still describes the authoritative Issue producer as open.
- `docs/03-audit/IMMORTAL-IMPLEMENTATION-CLOSURE-STATUS.md` still contains earlier B2/EEV blocker wording.
- `PRE-RICH/docs/B2-AUTHENTICATED-CONTROL-DESIGN-v0.1.md` predates the now-materialized deployment identity/authority wiring.
- Notion `05 — SOURCE REGISTRY` still contains the September GitHub-403/old test snapshot language.
- Notion Control Center still needs the exact 2026-10-09 branch tip and the above audit findings represented as the current operational snapshot.

These documents should not be silently rewritten as normative history. A dated reconciliation delta is the correct mechanism.

## 5. Audit-cycle changes applied

- Corrected the F-02 classification: the dedicated first-user Issue wrapper already forces B2/V3 binding.
- Corrected F-05: exact B2 singleton reference binding means version/nonce are not an unproven independent identity requirement.
- Fixed F-03 by adding `controlStateReference` to the Haskell Issue provider observation contract.
- Added explicit TypeScript typecheck of the authoritative Issue provider boundary to the Direct-USDM conformance workflow.
- Switched the B2 Preprod and Direct-USDM conformance workflows from `npm install` to `npm ci`.
- F-01 remains a deployment blocker for any new V3 carrier deployment, but not a first-user Issue blocker by itself.

## 6. Non-regression boundary

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

### Resolved this cycle

- F-01 source-level diagnostic V3 mint policy restored to one-shot enforcement.
- F-03 provider callback type drift fixed and typechecked in CI.
- F-04 explicit class saleability now enforced in the Issue economic gate.
- F-06 B2 cache key strengthened against toolchain/lockfile drift.
- F-07 Node CI installations switched to lockfile-reproducible `npm ci`.
- V3 ledger probe strengthened with negative cases for seed, token name and mint quantity.

### Still open

- F-08 historical credential rotation/revocation verification.
- F-09 Blockfrost proxy exposure/hardening decision.
- Concrete deployment-specific Kc/Ω evidence and live B2 singleton/adversarial ledger evidence remain outside this code-only pass.
- Current-head CI evidence must be captured against the latest exact SHA; no green result is inferred from previous runs.

## 7. Current audit-cycle status

### Resolved / advanced

- F-01: V3 carrier source restored to secure one-shot policy; negative probe added; artifact rebuild/evidence remains.
- F-03: provider `controlStateReference` type drift fixed; dedicated TypeScript boundary typecheck added.
- F-04: explicit `tcsSaleable` now enforced by `EconomicKernel.classSaleable`; negative Issue vector added.
- F-06: B2/V3 cache fingerprints hardened against source/toolchain/lockfile drift.
- F-07: inspected Node CI workflows switched from `npm install` to `npm ci`.
- F-02: confirmed as generic API hardening only; first-user wrapper already forces B2/V3 binding.
- F-05: no independent defect established because Issue binds the exact B2 singleton UTxO.

### Still open

- F-08 historical credential rotation/revocation verification.
- F-09 Blockfrost proxy exposure/hardening decision.
- Current-head CI/evidence binding for the post-fix SHA.
- Deployment-specific Kc/Ω, live B2 singleton and adversarial ledger evidence.
- Rebuild and exact-SHA verification of the corrected V3 carrier artifact before a new carrier deployment; the V3 fast workflow cache/install path is now hardened too.

**Non-regression:** no V3 economic semantics, Reveal semantics, EEV perimeter, B3/Materios semantics or Beacon 4 status were reopened.

## 2026-10-09 — Post-audit implementation delta

Current branch tip after the audit fixes: `63ca3eb542a85c85cf204c3131cec79c9165e596`.

Implementation commits in this cycle include the provider contract fix, CI reproducibility hardening, explicit class saleability enforcement, secure V3 one-shot mint policy restoration and negative ledger-probe coverage.

No V3 economic semantics, Reveal semantics, EEV perimeter or B3/Beacon semantics were changed.

## 2026-10-09 — Final audit refresh

The V3 fast workflow was additionally aligned with the B2 cache discipline: `npm ci` is used and the cache key now includes the V3 policy source, Plutus cabal files, `.github/actions/setup-plutus/action.yml` and `package-lock.json`.

The repository credential-boundary check scans the current tracked tree for literal provider credentials. It does not, by design, prove revocation of historical secrets; that remains an operational security verification item.

## 2026-10-09 — Deep Issue-path audit refresh

The serrated audit of the live Issue path found and corrected two concrete implementation defects and one reproducibility drift:

- **Provider contract drift fixed:** `Adapter/CARDANO/observation/PreprodAuthoritativeIssueProvider.ts` now declares the exact `controlStateReference` already consumed by its observation callback. Commit: `a9a2613896b2634b6de221cb9fe9c8d3f07717be`.
- **UTxO reference parser bug fixed:** `relayer/issueAdmissionProvider.js` and `relayer/preprodIssueObservationProvider.js` contained a regex literal that matched `\d` literally instead of decimal output indexes. Normal `txHash#0` / `txHash#1` references were therefore rejected. Fixed in commits `acd2b5d1a5a6d92117c2e53ea9e08a11b9f1d4e5` and `65df6516236d62f70c9397611646e3468ed1eb22c`.
- **Root dependency reproducibility extended:** remaining root workflow installs in the audited Preprod/conformance set were aligned to `npm ci`; isolated subproject/global installs were intentionally left unchanged. The B2 conformance workflow was finalized in commit `b1af5d801cd4b9b0d23a28e5139857727894571d`.

### Production wiring finding — IMPORTANT

The repository has a concrete `createPreprodAuthoritativeIssueProvider()` implementation and the canonical Haskell producer boundary, but there is **no current production browser call-site** that instantiates that Preprod provider or passes it to `mintSerialNFTWithAuthoritativeAdmission()`. `dapp.html` loads `src/main.ts`; `src/main.ts` keeps BUY disabled and explicitly states that authoritative admission is required. `src/tickets.ts` still exposes a lower-level legacy `mintSerialNFT()` path, but it is not imported by the current DApp entrypoint.

This is classified as an **integration/closure gap, not an economic-rule defect**. The fail-closed lock is correct. The next executable step is to wire the authenticated server-side/provider path into the intended first-user entrypoint without reintroducing browser-side EEV/ProtectedCapital fabrication or the legacy generic mint path.

### Current-head evidence

Current branch head is `b1af5d801cd4b9b0d23a28e5139857727894571d`. GitHub reports no combined commit statuses for this SHA. The first push-triggered workflow observed for the SHA (`pre-rich-emulator-reveal`, run `37978074095`) completed **failure**; therefore this audit makes **no GREEN claim** for the current head.

### Remaining blockers

- authoritative provider production wiring / first real Issue execution;
- current-head successful CI bound to the exact SHA;
- fresh V3 artifact rebuild + exact-SHA verification before any new V3 deployment;
- live B2 singleton + adversarial ledger evidence;
- deployment-specific Kc/Ω evidence;
- historical credential revocation/rotation verification;
- Blockfrost proxy exposure/hardening decision.

No V3 economic semantics, Reveal semantics, EEV perimeter, B3/Materios semantics or Beacon-4 research status were changed by this refresh.
