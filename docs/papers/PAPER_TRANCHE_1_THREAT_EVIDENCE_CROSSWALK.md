# Paper Tranche 1 — Threat-to-Evidence Crosswalk

**Status:** Working reconciliation; not a security certification or release sign-off.  
**Workstream:** A — V1 + Paper Tranche 1.  
**Branch:** `work/immortal-green-closure`.  
**Purpose:** map TM-01–TM-12 to the strongest currently grounded normative anchor, implementation locus, evidence class and residual limitation. Where an exact locus or deployment witness is not yet verified, this crosswalk marks it OPEN rather than inferring closure.

## Evidence classes used here

- **NORMATIVE:** source states the rule; does not prove implementation conformance.
- **MATHEMATICAL BASELINE:** verification corpus records a theorem/result; does not instantiate a deployment.
- **BOUNDED TEST:** exact test/run only; no generalization beyond its predicate and inputs.
- **PREPROD / LEDGER WITNESS:** must be supported by a qualifying observed/submitted transaction and complete context; currently not established for native Reveal.
- **OPEN:** source/code/evidence mapping or required witness remains unresolved.

## Threat crosswalk

| Threat | Normative / argument anchor | Implementation locus currently grounded | Evidence available | Residual limitation / release treatment |
|---|---|---|---|---|
| TM-01 — omitted liability/commitment class | `PRE-RICH/docs/GAME-ECONOMY.md` §2 (liability-first accounting and protected obligations); `docs/03-audit/VERIFICATION_STATUS.md` conservation-gap results | `IMMORTAL/kernel/EconomicKernel.hs`: `effectivePool`, `protectedCapital`, `rawSurplus`, `solvencyInvariant`, `conservationInvariant` | Normative source + mathematical baseline; source inspection | **OPEN** for profile-specific obligation exhaustiveness. Internal conservation alone cannot establish that every commitment class was included. |
| TM-02 — stale, incomplete or misidentified valuation | `PRE-RICH/docs/GAME-ECONOMY.md` §1–2; EEV profile requirements must be read with the qualification evidence, not inferred from `poolUsdmValue` | `IMMORTAL/kernel/EconomicKernel.hs`: EEV enters `effectivePool` and `rawSurplus`; the exact production EEV producer locus must be pinned in the release snapshot | Normative accounting + source-level formula | **OPEN** for a complete qualified-UTxO witness: exact asset identity, amount, slot/time, observation/source references and verification references. No liquidation value or oracle conversion may be silently substituted for direct USDM. |
| TM-03 — signature treated as truth/canonicality | Threat-model §3.2–3.3; current B1 Authorized Publisher assumption | Exact publisher/beacon implementation locus not certified by this crosswalk | Trust assumption documented; no B3 canonicality claim | **OPEN** for independent canonicality/finality evidence. A signature authenticates origin only to the extent of the signed message and key trust; it does not independently prove truth, completeness or canonicality. |
| TM-04 — frontend/relayer action or evidence substitution | `PRE-RICH/docs/GAME-ECONOMY.md` as normative application baseline; refinement obligations in `docs/03-audit/RESIDUAL_OBLIGATION_REGISTER.md` §R2–R3 | `PRE-RICH/src/PreRichClaimRefinement.ts`: `validateClaimRefinementEvidence`; `src/__tests__/differentialActionReplay.test.ts`; `src/__tests__/immortal-cardano-adapter-conformance.test.ts` | Bounded refinement and adapter tests | **OPEN** for whole-production-path coverage and RF1–RF11 implementation conformance. Existing tests support only their exercised predicates and fixtures. |
| TM-05 — settlement differs from frozen prize | `PRE-RICH/docs/GAME-ECONOMY.md` §3 (payout crystallization/immutability) | `PRE-RICH/src/PreRichClaimRefinement.ts`: exact settlement-to-frozen-prize equality | GitHub Actions run [39454356498](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39454356498), source commit `9ad8ccd7e1dd1d6a9c9846106fcdf836f58a06ea`; 4 tests passed, including 250-versus-249 subunit rejection | **BOUNDED TEST ONLY.** Not a complete Claim proof, production-path execution, or native-ledger witness. |
| TM-06 — adapter/serialization divergence | `docs/02-certification/P2.8-LEDGER-EVALUATION-DOSSIER.md` specifies required native-evaluation context; V3 refinement boundary is described in the traceability matrix | `IMMORTAL/conformance/RefinementV3.hs`; `src/__tests__/immortal-cardano-adapter-conformance.test.ts`; `.github/workflows/immortal-preprod-ledger-evidence.yml` | Bounded projection/adapter tests and a defined evidence workflow | **OPEN** until exact production transaction CBOR, hash, consumed UTxOs, scripts/hashes, era-specific parameters, timing context, evaluator version and result are recorded. Workflow existence is not a witness. |
| TM-07 — devnet/emulator result promoted to ledger evidence | `docs/02-certification/P2.8-LEDGER-EVALUATION-DOSSIER.md`; paper packet §6 “Native-ledger witness gate” | `.github/workflows/immortal-preprod-ledger-evidence.yml` | Evidence taxonomy and workflow specification | **OPEN.** Native Reveal ledger witness remains OPEN. No Yaci, fixture or unit-test result substitutes for the required native-ledger evaluation. |
| TM-08 — beacon claimed permissionless/deployed without witness | Threat-model §3.3; B1 Authorized Publisher trust boundary | Exact B1/B3 deployed artifact and transaction witness not pinned by this paper crosswalk | Architecture and trust assumption only | **OPEN.** Do not claim B3 deployment, permissionless canonicality or stronger randomness guarantees without version-specific evidence and deployment witness. |
| TM-09 — actor/substrate unavailability blocks progress | `docs/03-audit/VERIFICATION_STATUS.md`: T-NOLIVE / T-STALL-ATTRIB; threat-model §3.5 | No concrete availability/recovery implementation locus is certified here | Mathematical safety/liveness distinction | **OPEN** for operational availability, recovery and end-to-end progress. Safe stall is not successful completion. |
| TM-10 — historical run/moving branch treated as reproducible release | `docs/papers/PAPER_TRANCHE_1_REPRODUCIBILITY_PACKET.md` §§1, 5–7; evidence manifest snapshot fields | `docs/papers/evidence/PAPER_TRANCHE_1_EVIDENCE_MANIFEST.json` | Historical snapshot and later documentation edits separately identified | **OPEN** until one named release snapshot/archive binds manuscript, matrix, packet, source/test loci, logs, checksums and artifacts. A branch name is not a frozen publication identity. |
| TM-11 — internal tests represented as external audit | Manuscript non-claims; threat-model §6; release audit §2 | Controlled-rejection test and its workflow | Bounded test evidence only | **NOT AN AUDIT.** No independent security audit or mainnet-readiness claim is supported. Keep this explicit in abstract, conclusion and release metadata. |
| TM-12 — component argument generalized to system composition | `docs/03-audit/VERIFICATION_STATUS.md`: conditional composition result T-COMP-GATE; `docs/03-audit/RESIDUAL_OBLIGATION_REGISTER.md` | `IMMORTAL/conformance/RefinementV3.hs` is a component refinement locus, not proof of arbitrary composition | Mathematical baseline + component boundary source | **OPEN** for joint-action closure, concrete mapping and multi-system deployment evidence. B3/B4/generalization remain ongoing; do not present as achieved in Paper Tranche 1. |

## Release audit decisions

1. This crosswalk is a **source map**, not proof that all controls are implemented or all residual obligations discharged.
2. The source `PRE-RICH/docs/GAME-ECONOMY.md` has Git blob `41f69f7c7e7d31a776a92dcd942a3098848947fb` in the reviewed snapshot. Re-pin all source blobs to the eventual release commit before submission.
3. The controlled-rejection run is a bounded unit-test result. Preserve its exact commit, artifact hash and retention deadline; archive logs/artifact before expiry.
4. The native Reveal ledger witness, profile-specific obligation exhaustiveness, complete EEV qualification witness, production-path conformance, B3 deployment/canonicality, liveness evidence and composition evidence remain **OPEN** where marked above.
5. The crosswalk adds no protocol rule, coefficient, authority, or economic policy. It is a publication evidence-classification artifact only.

## Reproduction and maintenance

- Review against the exact branch snapshot named in the release audit.
- If an implementation locus changes, update the source pin and evidence class rather than treating a path name as proof.
- Before release freeze, verify every normative anchor and code path at the final commit and reconcile this document with the traceability matrix, evidence manifest and release audit.
