# Agent C — Evidence Reuse Manifest (scoped) — 2026-10-24

**Branch:** work/immortal-green-closure  
**Source revision when inventory began:** 2869177b6fc9338dfec17df7c5ca5683e2af8c4a  
**Purpose:** prevent repeated work and prevent evidence from crossing the claim/trust boundary it actually supports. This is a scoped coordination catalog, not an exhaustive repository-wide artifact inventory or normative authority.

## Manifest rules

A reusable evidence item must retain immutable source/subject SHA, workflow run ID and attempt when applicable, artifact ID and digest when available, schema/toolchain when known, exact claim it supports, limitations, and status at this review. A workflow result without an artifact digest is not silently treated as a cryptographic evidence packet. A matching generated/frontend file blob proves committed-file identity, not a fresh build or live deployment identity.

## Exact run and artifact records

| ID | Immutable subject | Source | Run/attempt | Artifact digest | Supported claim | Limitations / reuse classification |
|---|---|---|---|---|---|---|
| EC-B3B-001 | Materios Receipt 0x09f6bec6aff0c3b90c08848cebd4f8ccfd87ce6a1d187baf9fabd914feb22f44, block #2409483 0x6ee0dde8e6d7d1a4ecb599cbaa34ab4064b13e0c6f683948fbbf263ad81fff28 | IMMORTAL B3 source 11fae8a1f030bcbe177eab6ee2ae99a96f080ca6; workflow checkout on work/b3-materios-provenance-evidence | [Run #39933665986](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39933665986), attempt 1 (artifact metadata) | ZIP sha256:2c78c35352fdce044049cbe50a000702ae1705b6430f26a61dcb02e4e825c26a; internal JSON evidence_sha256=f596953cb94b0a1a92c02fa63c759d707340591b82aa23a7fe45c65bba15fb73; raw JSON sha256:10d96b214ff267c096e99acb597d532b8d9cdd94017f2fc9876d91eaac77e5fb | Artifact bytes, declared evidence digest, read-proof/block hash alignment, StateRoot binding fields and 10-node count are structurally consistent. Prior run records native B3-B verification PASS. | Latest recheck recomputed ZIP and internal JSON digests and structural bindings; native verifier was NOT_RUN in this pass. Artifact has receipt.certification.signers=0. Does not prove GRANDPA finality, authority transition, certificate signer authenticity, Cardano L1 anchor, or overall B3. Reuse only as scoped B3-B storage evidence. |
| EC-CI-001 | IMMORTAL code-bearing SHA e3dbacc7da4d7488c1bd9ba11df80bdbcc377267 | IMMORTAL repo source, code-bearing commit | [Cardano Adapter Sale Conformance #4617](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40068561581), attempt 1 | No artifact digest recorded for test logs | economic-conformance and frontend-build success; logs include 99 Vitest tests across 13 files, separate adapter conformance, observation/relayer tests, 25 admission/provider tests and frontend build. | CI evidence for exact SHA only. Does not prove universal on-chain gate reachability, EEV authenticity, current ledger state, or deployment. |
| EC-CI-002 | IMMORTAL code-bearing SHA e3dbacc7da4d7488c1bd9ba11df80bdbcc377267 | IMMORTAL repo source, code-bearing commit | [Protocol Declaration Conformance #3438](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40068561563), attempt 1 | No artifact digest recorded for test logs | Four test files / 16 tests and npx tsc --noEmit passed. | Test/conformance result, not a proof of deployed contract state. |
| EC-CI-003 | IMMORTAL coordination HEAD 2869177b6fc9338dfec17df7c5ca5683e2af8c4a | Push after documentation-only checkpoint append; code-bearing ancestry includes e3dbacc7... | [Sale Conformance #40069293383](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40069293383), attempt 1 | No artifact digest recorded | economic-conformance and frontend-build jobs SUCCESS on this exact branch SHA. | Reproves CI at the exact documentation-updated HEAD, but its green status remains scoped to these jobs only. |
| EC-CI-004 | IMMORTAL coordination HEAD 2869177b6fc9338dfec17df7c5ca5683e2af8c4a | Push after documentation-only checkpoint append | [Protocol Declaration Conformance #40069293378](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40069293378), attempt 1 | No artifact digest recorded | Declaration conformance job SUCCESS. | Exact-SHA test/build claim only. |
| EC-CI-005 | IMMORTAL coordination HEAD 2869177b6fc9338dfec17df7c5ca5683e2af8c4a | Push after documentation-only checkpoint append | [IMMORTAL Portability Conformance #40069293381](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40069293381), attempt 1 | No artifact digest recorded | Portability conformance job SUCCESS. | Does not on its own prove all adapters operational or a full universality theorem. |
| EC-CI-006 | IMMORTAL coordination HEAD 2869177b6fc9338dfec17df7c5ca5683e2af8c4a | Push after documentation-only checkpoint append | [Algorithmic Governability Adversarial Lab #40069293389](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40069293389), attempt 1 | No artifact digest recorded | no-result-dependent-authority job SUCCESS. | Specific adversarial check only; not broad security or liveness certification. |
| EC-CI-007 | IMMORTAL coordination HEAD 2869177b6fc9338dfec17df7c5ca5683e2af8c4a | Push after documentation-only checkpoint append | [Documentation Link Check #40069293379](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40069293379), attempt 1 | No artifact digest recorded | Documentation link check SUCCESS. | Link validity only; not a protocol conformance result. |
| EC-C0-001 | Materios upstream source 7d5c36e7dcd60824d84353e93df5d4a03c9c6c30 | Four explorer/verifier blobs listed in §10.30/§10.34 | Source review only | No execution artifact | Supports identifying the index fast-path and missing-manifest/event fail-open code paths. | Review proposal only; not a live-deployment fingerprint or vulnerability exploitation evidence. |
| EC-C0-002 | Proposed patch base Materios 7d5c36e7dcd60824d84353e93df5d4a03c9c6c30 | IMMORTAL patch blob b098dd2ba46b8651f38870a49dec1e574773d9b8 and note blob 3a54c940fff47dd09267f1de388c8635c4b0af42 | Not run | Patch SHA is Git blob identity, not a test artifact | Captures a minimally scoped fail-closed proposal and regression test intent. | git apply --check, pytest, UI tests, and upstream CI are NOT_RUN. Hunk-count check is text-structure only. Do not present as applied or passed. |
| EC-JEV-001 | JEV scheduled autonomy claim | Notion Control Plane page 3e2c4454-d6d5-819c-bec1-c6edede714b3 plus actual scheduler state snapshot at 2026-10-24 | Task last run 2026-10-19T07:42:01.461468Z; presently disabled | No two-run evidence packet | Establishes a discrepancy: the Notion page describes hourly automation as enabled, while actual task state reports is_enabled=false and the stored prompt authorizes only release/public-main-curated-2026-09-24. | This is a blocker record, not proof of autonomous execution. Do not activate or retarget the automation without a separate explicit action. |

## Current generated script-file identity checks

On the reviewed green code ref, these pairs were fetched from GitHub; the blob SHA matched within each pair and the extracted cborHex byte lengths matched:

| Pair (generated plutus/out / frontend src/plutusScripts) | Common blob SHA | CBOR bytes |
|---|---|---:|
| Treasury | 3c8d0645b1351f9ea801387a5fb71d2b06c3393c | 1,548 |
| CounterValidator | 82dc4fded76346a4e033cca596019c07df67e83e | 1,525 |
| B1PrizePool factory | 9efbac15e5dbf8ed5c2133ce0c6068c2c43c8de6 | 7,543 |
| MintPolicy factory | cd202e0db1507aecdec4747e3fe74b9af1298754 | 5,190 |
| PrizeValidator factory | 183ebe92b31924aa19799dff8ec687b9b9bb9a22 | 9,760 |
| BeaconRegistry | 8f10cb99254257071c1c9d7e253aa840b7acaed8 | 2,395 |

**Limit:** pairwise blob identity is a committed-file comparison, not a fresh cabal build/script export, not a live script-hash check, and not a proof that every old address/script is unreachable.

## Status and next action

**C14 = PARTIAL.** This catalog makes the cited evidence reusable with explicit target and scope. It is not yet a complete repo-wide inventory of all artifacts or a machine-enforced cache/freshness policy.

Next action: derive a machine-readable evidence index from all existing CI/workflow artifact records, validate its schema and add stale/mismatched-source negative regression tests on a CI-capable runner. Do not reuse any record beyond its stated claim or trust boundary.
