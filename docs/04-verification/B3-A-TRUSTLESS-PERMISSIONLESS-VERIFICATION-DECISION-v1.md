# B3-A — Trustless and Permissionless Verification Decision v1

Status: **ARCHITECTURE DECISION / IMPLEMENTATION AND LIVE EVIDENCE OPEN**

Branch: `work/b3-materios-provenance-evidence`

## Decision

Choose a **source-agnostic, genesis-rooted GRANDPA light-client verification path**. Do not introduce a trusted committee, signer quorum chosen by IMMORTAL, hosted oracle, or operator attestation as a substitute for consensus proofs.

Any party may fetch, transport, cache, or submit candidate evidence. The evidence source is untrusted. IMMORTAL accepts it only after deterministic verification against the configured Materios chain identity and genesis hash, with authority-set history authenticated by the chain's own consensus/runtime evidence.

This decision selects a trust model and work direction. It does **not** claim that the current public Materios RPC provides the missing witnesses or that B3-A is closed.

## Trust model

The minimal fixed trust anchor is the intended chain identity/genesis hash (plus the verifier implementation and its pinned protocol/runtime compatibility). Do not bootstrap from a current authority list, a recent RPC-reported finalized head, an explorer label, or a signed checkpoint from a named operator.

Starting from genesis, the verifier must authenticate the initial authority state and verify the sequence of GRANDPA justifications, ancestry, and every required authority-set transition in order. A warp-sync/finality-proof format may compress transport, but it must preserve the same cryptographic checks and the full transition chain needed to authenticate the target set. No transition may be skipped merely because an endpoint reports a later set.

For the Materios-specific authority-selection boundary, preserve the existing requirements: exact canonical selection-input commitment, runtime identity/code hash, exact runtime call/result bytes, native execution proof, activation block binding, and successful crossing of `VerifiedAuthoritySetTransition`. A GRANDPA justification alone does not prove that a custom committee was correctly selected.

## Evidence-source policy

- Treat every RPC, archive, explorer, peer, mirror, artifact host, and submitter as an untrusted data-availability source.
- Permit multiple independent sources to provide the same proof; source agreement is diagnostic only, never the trust criterion.
- Verify the proof locally with the existing verifier before accepting any claim.
- If no source can supply a required witness, report **UNAVAILABLE / OPEN**. Never replace missing evidence with a boolean, signature from a hand-picked committee, drand output, storage proof alone, current authority set, or ordinary runtime `state_call`.
- Keep the existing Materios receipt/storage-proof path as B3-B. Keep drand as a separate randomness primitive; neither is evidence of Materios finality.
- Do not require users to operate a Materios node as an architectural assumption. A third party may publish evidence, but cannot be trusted to validate it correctly.

## Implementation sequence

1. **Inventory and reuse existing verifiers.** Keep `poc/materios-grandpa` finality, ancestry, authority-state and transition boundaries as the normative implementation. Identify any gaps between the verifier and Substrate's standard warp/finality proof semantics before changing code.
2. **Genesis-rooted bootstrap.** Specify the exact chain/genesis identity and a reproducible procedure for deriving the initial trusted authority state from canonical genesis data. No silently pinned recent checkpoint or manually accepted current set.
3. **Ordered authority history.** Verify each authority-set transition and its activation evidence in sequence. Reject skipped set IDs, mismatched identities, missing ancestry, replay, wrong runtime identity, and proof/result/call digest mismatch.
4. **Source-agnostic acquisition.** Search for and support any compatible proof publisher/archive/peer protocol, without trusting the publisher. The current known Materios public RPC surface lacks the standard GRANDPA proof RPC; do not repeat endpoint scans already recorded as negative evidence.
5. **Native execution proof.** Obtain the exact Materios runtime execution-proof packet needed for the custom authority-selection boundary. An ordinary runtime API response is insufficient. If no public producer exists, record this as an availability blocker; do not claim the trust model is satisfied.
6. **Differential and adversarial tests.** Test valid real witnesses plus mutated target hash/number, state root, set ID, authority identity, ancestry, runtime code, call bytes, result, proof bytes, and packet digest. Synthetic fixtures test code paths only, never live evidence.
7. **Acceptance.** B3-A can become GREEN only after a real, immutable evidence packet passes the full verifier from the agreed genesis trust anchor through finality and the Materios authority transition. Record the exact source artifact, hashes, verifier revision, and reproducible test result.

## Explicitly rejected shortcuts

- Trusting an operator, oracle, hosted RPC, or hand-selected threshold of signers.
- Treating `chain_getFinalizedHead`, `roundState`, a block hash, or a receipt as a finality proof.
- Treating a storage proof as proof of finality.
- Using drand as a substitute for consensus finality or authority provenance.
- Trusting the current authority set to authenticate its own history.
- Reimplementing Materios' selector in IMMORTAL.
- Changing V3, Reveal semantics, PRE-RICH economics, or Materios selector semantics to bypass missing evidence.
- Marking B3-A/B3 overall GREEN before live proof verification.

## Feasibility caveat

Permissionless verification does not guarantee permissionless *availability*. If Materios does not publish finality and native execution witnesses and no compatible peer/archive exposes them, IMMORTAL can remain correctly fail-closed while B3-A stays OPEN. The next engineering task is to validate genesis bootstrap and proof-format compatibility, then exhaust viable untrusted acquisition transports—not to weaken verification.

## References

- Substrate GRANDPA finality-proof transport and authority-set changes: https://polkadot.js.org/docs/substrate/rpc/
- Polkadot SDK finality proof implementation: https://paritytech.github.io/polkadot-sdk/master/src/sc_consensus_grandpa/finality_proof.rs.html
- Polkadot light-client rationale: https://docs.polkadot.com/reference/tools/light-clients/
- IMMORTAL composition contract: `docs/04-verification/MATERIOS-B3-COMPOSITION-TEST-CONTRACT-v1.md`
- IMMORTAL acquisition handoff: `docs/04-verification/MATERIOS-B3-OPERATOR-EVIDENCE-ACQUISITION-HANDOFF-v1.md`

This document is a decision and work contract, not a proof, deployment approval, or claim of B3 closure.

- Materios genesis bootstrap source register: `docs/04-verification/MATERIOS-GENESIS-BOOTSTRAP-EVIDENCE-REGISTER-v1.md`


## Initial implementation gap found during decision review

A source review of `poc/materios-grandpa/src/authority.ts` shows that `TrustedAuthorityState` currently has no dedicated genesis-bootstrap constructor or opaque provenance brand. `validateAuthorityState()` validates structure; it does not establish that the initial set came from the canonical genesis configuration. The transition constructor protects later transitions, but the initial trust boundary is still caller-supplied.

Therefore, **the existing verifier must not yet be described as end-to-end genesis-rooted**. The next implementation task is to define a canonical, versioned genesis trust manifest for the exact Materios network and a narrowly scoped bootstrap boundary that validates the manifest's chain ID, genesis hash, genesis authority set and initial set ID. The manifest's values must be recovered from pinned, authoritative chain-spec material and independently cross-checked; do not invent or infer them from a current RPC response. Only the bootstrap boundary should create the initial trusted-state type, and subsequent states must continue to come from verified transitions.

Until the exact canonical genesis data and this API boundary are implemented and tested, B3-A remains OPEN even if a valid later GRANDPA proof is obtained.
