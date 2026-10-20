# Paper Tranche 1 — Release Audit

**Audit date:** 2026-10-20  
**Workstream:** A — V1 + Paper Tranche 1  
**Branch:** `work/immortal-green-closure`  
**Status:** REVIEW SNAPSHOT RECORDED; NOT READY TO SUBMIT

## 1. Current source and evidence anchors

- Review snapshot: commit `2be7c4616d427021a2e5ab67719fab4d05ee50e2`, tree `5c62b74d37198d7f0313a805bcee990afed47db3`.
- Current evidence manifest: `docs/papers/evidence/PAPER_TRANCHE_1_EVIDENCE_MANIFEST.json`; it separately records post-snapshot documentation edits. Its current blob is not contained in the earlier review snapshot.
- Controlled-rejection workflow: [run 39454356498](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39454356498), source commit `9ad8ccd7e1dd1d6a9c9846106fcdf836f58a06ea`, successful; one Vitest file and four tests passed.
- Controlled-rejection artifact: [artifact 12278239769](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39454356498/artifacts/12278239769), SHA-256 `34201119240fde4aabe0af4afcc26837be7fe42366417f76f9c53cce7d398de7`, retention expires 2027-01-18.
- The test is specifically a 250-versus-249 subunit settlement mismatch rejection. Evidence class is bounded unit test only.

## 2. Current manuscript package

| Artifact | Current role | Status |
|---|---|---|
| `IMMORTAL_EVIDENCE_BOUNDED_ECONOMIC_SAFETY_DRAFT.md` | Manuscript | Draft; novelty and citations need final review |
| `PAPER_TRANCHE_1_TRACEABILITY.md` | Claim-to-evidence map C1–C8 | Updated; not all implementation evidence closed |
| `PAPER_TRANCHE_1_REPRODUCIBILITY_PACKET.md` | Reproduction records and release obligations | P3 partial; not release-frozen |
| `PAPER_TRANCHE_1_THREAT_MODEL.md` | Trust boundaries and threat register TM-01–TM-12 | Structured supporting analysis; not certification |
| `evidence/PAPER_TRANCHE_1_EVIDENCE_MANIFEST.json` | Machine-readable evidence and source identities | Provisional; records historical snapshot and later documentation edits |

## 3. Gate assessment

| Gate | Assessment | Required next action |
|---|---|---|
| P1 — claims, assumptions, properties and non-guarantees | Partially established | Final line-by-line check against the mathematical status and residual obligation register; preserve non-claims |
| P2 — specification → argument → code → test → deployment evidence | Matrix exists, some paths remain partial | Bind every positive implementation claim to exact source and test; keep historical evidence labelled |
| P3 — reproducibility packet | **OPEN** | Archive artifact and full logs before retention expiry; make one named submission snapshot/archive; verify every cited artifact and checksum |
| P4 — threat model | Threat model plus threat-to-evidence crosswalk recorded | Final release-snapshot verification still required for every normative/code blob; open mappings remain explicitly open |
| P5 — related work | **OPEN** | Full-text, systematic comparison across viability/safety games, oracle trust/economics, on-chain liability/solvency accounting, assurance cases and evidence pipelines |
| Native Reveal ledger witness | **OPEN** | Obtain exact qualifying production-path submitted transaction and evaluate it with the native Cardano ledger under complete context; do not substitute the unit test |
| Dependency audit | **OPEN** | Triage 7 npm audit findings (2 moderate, 3 high, 2 critical) separately; no automatic fixes were applied |

## 4. Required release-freeze procedure

1. Choose one exact source commit or create a deterministic source archive. Do not cite the moving branch as the publication identity.
2. Record the exact blob IDs for the manuscript, matrix, packet, threat model, manifest, all cited normative files and any code/test sources used in the claims.
3. Keep Git blob IDs distinct from SHA-256 hashes of raw file bytes. Compute raw-byte SHA-256 checksums for the final bundle and evidence artifacts when available.
4. Archive the successful workflow artifact and complete logs before 2027-01-18; verify the downloaded bytes against the recorded artifact hash if the artifact is downloaded.
5. Re-run the publication claim audit: every statement must have a claim ID, assumptions, evidence class, exact source snapshot and an explicit boundary on what it does not establish.
6. Check bibliographic metadata and read the full text for all key comparators. The current comparison is selective and does not establish novelty.
7. Do not call the packet complete while the native Reveal witness is absent if the manuscript makes any claim that requires it.
8. Record a final decision: submit as a carefully scoped research-progress paper with the native-ledger limitation explicit, or defer any claim dependent on that witness. The decision must be reflected consistently in manuscript, matrix, packet and manifest.

## 5. Non-claims that must remain

This audit does not establish full implementation conformance, complete economic solvency for a live deployment, native-ledger Reveal success, B3 deployment, universal safety, liveness, external independent security audit, or mainnet readiness. The successful controlled-rejection test must not be used as a proxy for any of these.

