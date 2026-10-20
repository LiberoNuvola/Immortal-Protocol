# B3 Materios Provenance — Evidence Maturity Audit

**Date:** 2026-10-20  
**Destination branch:** `work/immortal-green-closure` (documentation only)  
**Scope:** B3 Materios storage/finality provenance, generalized derivation, profile composition, AG-01 governance conformance, and drand candidate verification.  
**Decision:** B3 remains OPEN. Do not merge branches or promote architectural contracts into empirical claims.

## Executive result

The reviewed evidence is materially stronger than architecture prose alone, but it is not one indivisible “B3 proof.” It consists of distinct evidence classes with different limits:

- **B3-B storage proof:** a live Materios storage-read proof was captured and verified by a native Rust verifier against the captured state root. The associated CI job succeeded. This establishes the bounded storage-proof path for that capture, not the authenticity/finality of the state root.
- **B3-A finality and authority provenance:** the real-GRANDPA witness job failed. Both tested public RPC endpoints returned a finalized head but no attached justification; the 768-block scan ended with `NO_REAL_GRANDPA_JUSTIFICATION_FOUND_IN_DENSE_SCAN`. This is a limitation of the tested public surfaces/window, not evidence that Materios consensus has no finality.
- **drand:** the off-chain JavaScript verifier workflow passed three positive/adversarial tests and emitted a digest-pinned artifact. The isolated Aiken/Plutus V3 draft did not compile successfully in the captured attempt. The randomness candidate is not approved and has no qualified on-chain or ticket-binding result.
- **Generalized Derivation Contract and EXP-04:** explicitly non-normative, research/prototype-ready boundaries. They specify design constraints but do not establish universal implementation conformance.
- **AG-01:** bounded Haskell conformance vectors passed in a dedicated run; full AG-01..AG-10 closure, independent replay, and deployed governance remain open.
- **Cross-adapter generality and deployment conformance:** not established by the evidence reviewed here.

The correct scientific statement is that IMMORTAL is developing an explicit, claim-bounded provenance and conformance method. The current evidence does **not** support a claim of publisher-independent Materios canonicality, fully qualified on-chain randomness, deployed authority transition, or empirical chain neutrality.

## Evidence grading model

| Grade | Evidence class | What it can support | What it cannot support by itself |
|---|---|---|---|
| E0 | Architecture / normative or research contract | A declared requirement, boundary, assumption or closure criterion | Implementation or execution claims |
| E1 | Executable unit/conformance test | The tested property for the test inputs and implementation version | Whole-program correctness, independent reproduction or deployment |
| E2 | CI workflow result and retained artifact | Reproducible record of a particular job/run, subject to artifact content and provenance | Truth of claims not checked by the job; a green job does not automatically mean external certification |
| E3 | Live source observation | What the endpoint returned at that time | Cryptographic authenticity, canonicality or finality |
| E4 | Independently verified cryptographic proof | The exact proof statement checked against the exact supplied trust anchor | Authenticity of the trust anchor unless separately established |
| E5 | Authenticated finality/authority chain | Canonicality/finality within the verifier's stated consensus assumptions and validated authority history | Application-level semantics or deployed economic safety |
| E6 | Deployment conformance | Behavior of the qualified target deployment under pinned environment/version and accepted evidence | Universal portability beyond that deployment |

Grades are not a single additive score. In particular, E4 storage verification against an unauthenticated root cannot be relabelled E5 finality; a deployment result cannot be inferred from E1 or E2.

## Claim-by-claim maturity

### B3-B — Materios storage proof

**Classification: E2 + E3 + bounded E4; PASS for the narrow storage-read claim.**

- Workflow: [run 39456195906](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39456195906)
- Run checkout commit: `06080f8cfd02afdd48d8751a428da17adf9737f3`
- Jobs `live-storage-proof`, `verifier`, and `finalized-state-capture`: SUCCESS.
- Proof artifact: [artifact 12281211833 — materios-b3b-live-storage-proof](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39456195906/artifacts/12281211833)
- Artifact SHA-256: `df953a86e27bf8ec0e01aaa589fbaa01d367897848d468e388b5341ca1bd7706`
- Separate finalized-state capture artifact: [12281231617](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39456195906/artifacts/12281231617), SHA-256 `7057de5b8231231f54bea51dc17b3443d4a7ac24752e12e505d1c85572d8733c`.
- Reported proof: 10 nodes and 3,033 SCALE proof bytes; captured B3-B receipt `0xa5e2ccaacb5965a57422ece5c887b62b4458c0c7f0ebd034f4353b2c929e7454`.

**Proves:** the captured storage read is consistent with the supplied/captured state root under the native verifier.

**Does not prove:** the state root was authenticated by consensus; the checkpoint is canonical; GRANDPA finality or authority-set transitions are valid; an application selection/enactment transition was authorized; or Cardano Reveal executed successfully.

### B3-A — GRANDPA finality and authority provenance

**Classification: E3 observation; E5 NOT PRESENT; FAIL/OPEN for the required live witness.**

- Same workflow: [run 39456195906](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39456195906)
- Job `real-grandpa-witness`: FAILURE at “Capture and verify real Materios GRANDPA witness.”
- Both `https://materios.fluxpointstudios.com/rpc` and `https://materios.fluxpointstudios.com/preprod-rpc` returned the same observed finalized-head hash, `0xb3e3c04168e408fab78892c3653b0b022bbd195cfe0ea52417ba0856a9e63517`, with `justificationsKind=null` and no justification count.
- The configured 768-block scan ended with `NO_REAL_GRANDPA_JUSTIFICATION_FOUND_IN_DENSE_SCAN`; the expected witness artifact was not produced.

**Interpretation:** the tested endpoints and scan did not supply a usable proof fixture. Do not infer that Materios consensus itself lacks finality. Do not mark B3-A complete. The next attempt must change the evidence condition—e.g. a real public proof source or a captured valid justification plus authenticated authority transition—not simply rerun the same scan and count it as progress.

Required for closure: real proof fixture; independent decoding; block hash/number and checkpoint binding; signature/quorum/ancestry verification; authenticated authority-set transition provenance; and linkage to the relevant selection/enactment transition.

### External randomness candidate — drand

**Classification: E1 + E2 for an off-chain verifier PoC; on-chain/deployment maturity absent.**

- Workflow: [run 39464768309](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39464768309)
- Commit: `a4197151b9d1e4f68fbffc26e4e65ecb490c820a`
- Workflow conclusion: SUCCESS; three tests covered fixed historical Quicknet round 42, a requested/returned round mismatch, and an adjacent genuine signature/round-binding adversarial case.
- Artifact: [12283924010 — immortal-drand-verified-beacon](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39464768309/artifacts/12283924010)
- SHA-256: `b8fd5d426d14ee3352126e2a33df9800f435db3b435cf21e8ff4258bb36d1059`.

**Proves:** the pinned JavaScript verifier accepted the fixed positive fixture and rejected the recorded negative cases in that workflow.

**Does not prove:** a production round-selection rule; on-chain Cardano/Plutus verification; feasible CPU/memory units or transaction size; ticket/game binding; resistance to round-shopping in the deployed protocol; Materios finality; or an approved randomness source.

The isolated Aiken V3 verifier is explicitly not compiler-qualified after non-zero build attempts. Keep it out of the passing evidence claim. Drand remains **candidate / NOT APPROVED** until byte-for-byte cross-verifier parity, target cost measurements, a frozen round-selection rule, and domain-separated ticket binding are evidenced.

### Generalized Derivation Contract

**Classification: E0 — OPEN RESEARCH / PROTOTYPE-READY.**

Source: [GENERALIZED-DERIVATION-CONTRACT-v1.md](https://github.com/LiberoNuvola/Immortal-Protocol/blob/work/b3-materios-provenance-evidence/docs/research/GENERALIZED-DERIVATION-CONTRACT-v1.md), blob `8bdf8c208f933a6548bb738453a1dd347c3c0708`.

The contract defines `Explore → CandidateSet → Certify → ADMISSIBLE / REJECTED / UNVERIFIABLE → Adopt`, with adoption separate from candidate generation/certification. It declares fail-closed behavior, versioned rules, evidence binding, search coverage transparency and non-sovereignty invariants.

**Maturity:** useful architecture boundary. This document alone is not evidence that every executable path enforces those constraints, that multiple function families use the same machinery, or that a candidate cannot mutate its authorizing rule space. Promotion requires executable adversarial vectors and traceable evidence for multiple function families.

### EXP-04 — Composition of profiles

**Classification: E0 — RESEARCH BOUNDARY READY / COMPOSITION SEMANTICS OPEN.**

Source: [EXP-04-COMPOSITION-OF-PROFILES-BOUNDARY-v1.md](https://github.com/LiberoNuvola/Immortal-Protocol/blob/work/b3-materios-provenance-evidence/docs/research/EXP-04-COMPOSITION-OF-PROFILES-BOUNDARY-v1.md), blob `49240a7ac83c1b3c1c37fc1277f04dd8fdb68e50`.

The document specifies identity/version preservation, ownership of composed parameters, collision detection, no silent precedence and deterministic reconstruction. It explicitly leaves composition semantics open, including shared capital and precedence.

**Maturity:** these are research constraints, not production composition semantics. The document describes a bounded harness, but the evidence reviewed in this audit does not independently establish a current passing workflow/artifact for that harness. Do not mark EXP-04 executable closure solely from the document.

### AG-01 — Algorithmic governability

**Classification: E1 + E2 for bounded vectors; full governance closure OPEN.**

Source: [AG-01-EXECUTABLE-CONFORMANCE-MATRIX-v1.md](https://github.com/LiberoNuvola/Immortal-Protocol/blob/work/b3-materios-provenance-evidence/docs/research/AG-01-EXECUTABLE-CONFORMANCE-MATRIX-v1.md), blob `b21388dca371a7c0e8dd4bff68dabbf8adebc7bb`.

The source records dedicated Haskell conformance run #5 as SUCCESS: [run 39020146220](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39020146220), commit `57f186ed6c8f80437d4c76f5afd0c9147b992e67`. The reported targeted vectors cover AG-02 gate weakening, AG-03 environment timestamp/review timing, and AG-09 application-profile scoping; the AG-01 matrix also records bounded negative vectors for actor mismatch, mutated/unregistered ruleset, predecessor mismatch, collapsed lifecycle, missing evidence and adoption bypass.

**Proves:** those particular tests passed against the implementation at the pinned commit.

**Does not prove:** closure of AG-01..AG-10, independent canonical replay, full external provenance, complete authority semantics, or deployed governance. The matrix itself explicitly keeps those open.

### Live observations, receipts and event ingress

**Classification: E3 unless accompanied by a separately verified proof.**

A finalized-head response, Firehose stream item, events endpoint response, receipt or anchor is an observation/commitment. It is not automatically a consensus proof. The default-branch JEV ingress workflow description itself says the ingress records an observation only; it does not independently establish GRANDPA finality, storage proofs or canonicality. Keep these labels separate in paper tables and evidence manifests.

### Deployment and multi-adapter conformance

**Classification: E6 NOT ESTABLISHED by the reviewed B3 evidence.**

No reviewed artifact establishes a deployed IMMORTAL selection→enactment path authenticated by B3-A finality and authority transitions. The storage proof and drand PoC do not demonstrate a qualified Cardano on-chain verifier. The generalized contract requires semantic equivalence across multiple adapters for the same certified inputs and rule version, but no such cross-adapter equivalence result was identified in this audit.

Do not claim “empirically chain-agnostic.” Safe wording: “designed for chain neutrality; multi-adapter semantic equivalence remains an open conformance obligation.”

## Evidence ledger

| Claim | Best current evidence | Status | Next closure condition |
|---|---|---|---|
| B3-B storage-read proof | Run 39456195906, artifact 12281211833, digest pinned | **PASS, narrow scope** | Authenticate root via valid B3-A path |
| B3-A GRANDPA finality | Run 39456195906; real-witness job failed, no artifact | **OPEN / BLOCKED** | Valid proof fixture + authority transition verification |
| drand off-chain signature verification | Run 39464768309, artifact 12283924010, digest pinned | **PASS, PoC only** | Cross-verifier parity, cost/size, round rule, ticket binding |
| Generalized derivation boundary | E0 research contract | **OPEN RESEARCH** | Multi-family adversarial executable conformance |
| EXP-04 profile composition | E0 boundary; semantics explicitly open | **OPEN RESEARCH** | Freeze semantics only through authorized decision, then executable vectors |
| AG-01 governance | Run 39020146220, commit 57f186e… | **PARTIAL PASS** | Independent replay + provenance + full AG-01..AG-10 closure |
| Receipt / RPC / Firehose observations | Live endpoint outputs and receipt artifacts | **OBSERVATION ONLY** | Do not promote without the appropriate proof verifier |
| Deployment / cross-adapter equivalence | No qualifying evidence identified here | **NOT ESTABLISHED** | Pinned deployment conformance and shared vectors across materially different adapters |

## Recommended sequence

1. **Close the evidence classification, not the protocol:** use the grades above in the B3 evidence manifest and any paper references; preserve exact run IDs, commit SHAs, artifact IDs and digests.
2. **B3-A first:** seek a genuinely different public proof source or valid real justification plus authority-transition evidence. The current public RPC scan is exhausted for the tested 768-block window.
3. **Keep B3-B useful but bounded:** retain the verified storage proof as a storage-integrity result relative to its supplied root; do not call it finality.
4. **Keep drand separate:** do not use randomness verification as a substitute for Materios provenance. Qualify Aiken/Plutus only after reproducible compilation, shared fixture parity and cost/size evidence.
5. **Keep architecture contracts OPEN:** generalized derivation and EXP-04 stay non-normative until executable evidence closes their specific obligations.
6. **Keep branches separate:** this audit is documentation-only on `work/immortal-green-closure`. No merge, cherry-pick, branch creation, or changes to V3, Reveal semantics, or economic rules.

## Limitations of this audit

This is a targeted maturity audit of the named documents and runs, not a complete code review of every B3 path. For EXP-04, this review did not independently fetch a dedicated harness workflow/artifact; its executable status is therefore deliberately left unverified rather than inferred. Artifact digests are the GitHub Actions artifact digests returned by the repository API; the report does not claim a fresh independent re-hash of downloaded ZIP contents.
