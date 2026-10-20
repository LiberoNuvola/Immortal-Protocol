# B3 public evidence and external randomness route — 2026-10-20

**Branch:** `work/b3-materios-provenance-evidence`  
**Status:** DECISION RECORD / IMPLEMENTATION NOT YET QUALIFIED  
**Scope:** public Materios evidence interfaces and a separate public randomness candidate. This document does not change B1/B3 semantics, the Materios service, or the PRE-RICH outcome mapping.

## Executive decision

Keep the two evidence problems separate:

1. **Materios remote-state/receipt evidence:** continue using the existing public RPC, Firehose/events, receipt and storage-proof path. The live workflow has demonstrated a native storage proof independently verified against a captured state root. This is not proof of GRANDPA finality, authenticated authority-set transitions, or publisher-independent canonicality.
2. **Beacon randomness:** evaluate drand's public League of Entropy beacon as a *candidate randomness source only*. Its public API and documented verification model are available, but no Cardano/Plutus integration, on-chain cost, round-selection policy, or IMMORTAL conformance fixture has yet been demonstrated. It is not promoted to an approved source by this note.

Do not try to make a randomness signature stand in for a Materios finality proof. Do not treat a Materios receipt or storage proof as proof that an externally supplied randomness value is authentic.

## Evidence inventory

| Evidence surface | What the current evidence supports | What it does not support |
|---|---|---|
| Public Materios RPC: `/rpc`, `/preprod-rpc` | Finalized-head/header extraction; RPC transport for block/storage queries | A verified GRANDPA finality proof, given the tested public responses |
| Public Materios Firehose: `/api/firehose/stream` | A public event/stream source used by the existing capture workflow | Finality unless the emitted evidence itself contains a verifiable proof and authenticated authority transition |
| Public Materios events: `/preprod-events` | Public event access used by the existing capture workflow | Consensus finality or canonicality merely because an event was returned |
| Native storage read proof | Run #74 independently verified the proof against the captured state root; B3-B storage-proof path PASS | Authenticity of the state root/checkpoint, unless separately bound to verified finality |
| GRANDPA justification/proof | The run #74 scan found no attached justification across the tested 768-block window on the two public RPC endpoints; finality-proof RPC unavailable | This does not establish that Materios consensus lacks finality; only that the tested public surfaces did not supply the required proof |
| Receipt/anchor path | Can carry a receipt/content commitment through the existing integration path | By itself, not a publisher-independent proof of receipt truth or canonicality |

### Source run

IMMORTAL workflow run #74:  
https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39456195906

Captured B3-B receipt: `0xa5e2ccaacb5965a57422ece5c887b62b4458c0c7f0ebd034f4353b2c929e7454`.

The run reported 10 proof nodes and 3,033 SCALE proof bytes, and uploaded artifact `materios-b3b-live-storage-proof` (artifact ID `12281211833`). The artifact proves the storage-read proof path for that capture; it does not close B3-A.

## Public randomness candidate: drand / League of Entropy

Official technical references:
- Overview and developer guide: https://docs.drand.love/developer/
- Cryptographic design: https://docs.drand.love/docs/cryptography/
- Public HTTP API: https://docs.drand.love/developer/http-api/
- Exact-round API: https://docs.drand.love/developer/API-v2/v-2-beacons-beacon-id-rounds-round/

The official documentation describes a distributed beacon based on threshold BLS signatures and exposes public API relays. The signature is independently verifiable against the configured network public key; clients are explicitly advised to verify beacon values rather than trust the HTTP response.

### Executable off-chain PoC — first passing CI run

The branch now contains `poc/drand-beacon-verifier/` and workflow:

https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39464768309

Run conclusion: **SUCCESS** on commit `a4197151b9d1e4f68fbffc26e4e65ecb490c820a`.

The workflow ran three tests:
1. Positive verification of fixed historical Quicknet round 42 using `drand-client@1.4.2`, with the chain identity pinned and signature verification enabled.
2. Rejection of a beacon response whose round does not match the requested round.
3. Rejection of a genuine, well-formed signature from the adjacent round after its derived randomness is recomputed, so the test exercises the signature's round binding rather than only malformed-byte detection.

The workflow also captured verified-round evidence as artifact `immortal-drand-verified-beacon`, artifact ID `12283924010`, SHA-256 `b8fd5d426d14ee3352126e2a33df9800f435db3b435cf21e8ff4258bb36d1059`.

This closes only the initial **off-chain verifier PoC**. It does not establish a production round-selection rule, on-chain Cardano verification, Plutus cost feasibility, ticket/game binding, or Materios finality. The candidate remains **NOT APPROVED** and B3 randomness remains **OPEN**.

### Cardano primitive compatibility — partial positive finding

Official Cardano documentation confirms that Plutus V3 exposes BLS12-381 G1/G2 point operations, hash-to-group with an explicit caller-supplied domain-separation tag (DST), Miller loops and final pairing verification. The Aiken/Cardano developer guide documents these builtins and the Plutus V3 availability of CIP-0381:
- https://cips.cardano.org/cip/CIP-0381
- https://developers.cardano.org/docs/developers/curriculum/smart-contracts/advanced/bls-primitives/
- https://github.com/drand/drand-client/blob/master/lib/beacon-verification.ts

The pinned Quicknet scheme in the off-chain PoC is `bls-unchained-g1-rfc9380`. Its verifier hashes the big-endian 8-byte round with SHA-256, hashes that result to G1 using the exact DST `BLS_SIG_BLS12381G1_XMD:SHA-256_SSWU_RO_NUL_`, and verifies the pairing against the pinned G2 public key. Plutus's hash-to-group builtin accepts a supplied DST, so the documented primitive interface appears capable of expressing the same scheme. This is a **primitive-compatibility finding**, not proof of byte-for-byte implementation parity or affordable execution cost.

An isolated Aiken V3 draft has been added at `poc/drand-beacon-verifier/cardano/`, but the first build attempts exited non-zero without a diagnostic in the captured GitHub Actions log. It is therefore explicitly **not compiler-qualified**, is excluded from the passing off-chain CI gate, and must not be treated as a working on-chain verifier. The passing JavaScript workflow remains the only executable conformance evidence at this point.

The next gate is:
1. resolve Aiken compilation and produce a reproducible Plutus V3 artifact;
2. test the exact same fixed Quicknet signature, public key and round in the Aiken verifier and the official JS verifier;
3. measure CPU/memory execution units and transaction size on the target Cardano protocol parameters;
4. keep the external randomness candidate OPEN until these checks and the production round/ticket binding are complete.

### Candidate fit

- **Useful for:** an externally verifiable randomness input, provided IMMORTAL fixes the beacon network, public-key/chain-hash identity, scheme, round-selection rule, and verification procedure.
- **Not useful for:** proving Materios receipt authenticity, state-root authenticity, GRANDPA finality, or authority-set transitions.
- **Not yet established:** whether the required BLS verification can be implemented and afforded in the current Cardano/Plutus execution envelope, whether verification should be on-chain or in a separately trusted boundary, and how the selected round is bound to a ticket/game without allowing round shopping or outcome manipulation.

### Mandatory safeguards before any promotion

1. **Freeze the beacon identity.** Pin the exact network/chain hash, scheme, public key and expected signature format in a versioned profile. Do not trust a mutable alias alone.
2. **Freeze round selection before the value is known.** Derive the target round from a committed protocol rule (for example, a precommitted target time/round); do not let the publisher or player choose among already-revealed rounds.
3. **Verify, do not merely fetch.** Independently verify the signature and any chained-round relation required by the selected scheme. HTTP TLS or agreement between relays is not a cryptographic verification substitute.
4. **Bind the round to the game/ticket.** Commit the network identity, round, target, protocol version and verified randomness into the existing domain-separated beacon/ticket commitment. Preserve the current outcome mapping and rejection-sampling rules.
5. **Prove Cardano feasibility.** Produce an executable verification prototype and measure transaction size, CPU/memory execution units, script cost and resulting transaction constraints. If full verification is not performed on-chain, state the residual trust assumption explicitly; do not call that publisher-independent B3.
6. **Test adversarial cases.** Reject wrong network/key, malformed or invalid signatures, wrong round, stale/replayed values, unavailable round, conflicting inputs, and attempts to change the round after the ticket commitment.
7. **Keep finality separate.** A successful drand verification only authenticates the selected beacon value under the pinned drand scheme/key assumptions. It does not close Materios B3-A or authenticate Materios-derived context.

## Decision matrix

| Route | Publicly actionable now? | Can close Materios B3-A? | Can potentially provide randomness? | Decision |
|---|---:|---:|---:|---|
| Existing Materios receipt + storage proof | Yes | No, not with current captured evidence | No | Continue as B3-B evidence only |
| Materios GRANDPA proof via current tested RPCs | No usable proof observed | Not yet | No | Keep B3-A OPEN; do not repeat the same scan without a changed source/evidence condition |
| Third-party GRANDPA proof publisher | Not identified with a real fixture | Potentially, if proof and authority transitions are authenticated | No, unless separately specified | Research only until a public source and live fixture exist |
| drand public beacon | Public APIs exist | No | Potentially, after independent verification and Cardano feasibility tests | Candidate; not approved / not yet integrated |
| Current authorized-publisher B1 | Existing boundary | No | Uses current authorized publication assumptions | Honest fallback; must not be labelled publisher-independent B3 |

## Next executable work

1. Add a bounded **public-source capability probe** for the already-configured Materios receipt/Firehose/events interfaces, if the existing capture code does not already emit a machine-readable capability inventory. Record endpoint, request, response class, proof material present, and verifier result; never infer finality from event availability.
2. Build a separate **drand round verification PoC** using an official client/library or a documented independent verifier. Pin a specific network identity and fixed round fixture; include both positive and negative vectors. This is off-chain conformance first, not yet a Cardano deployment.
3. Measure whether the selected signature scheme can be verified within the actual Cardano script constraints. If not, record the exact residual trust boundary and keep B3 publisher-independent randomness OPEN.
4. Continue to leave Materios B3-A OPEN unless a public source supplies a real GRANDPA proof plus authenticated authority-set/transition evidence. Do not patch Materios, operate a private node, weaken the verifier, or change the already-implemented PRE-RICH outcome mapping to conceal the gap.

## Closure criteria

- **Materios B3-A:** a real proof fixture; independent decoding; checkpoint hash/number binding; verified signatures, quorum and ancestry; authenticated authority-set transition provenance; and linkage to the relevant selection/enactment transition.
- **External randomness:** pinned network/key/scheme; fixed round-selection rule; independent signature verification; game/ticket binding; negative tests; Cardano cost/size measurements; and an explicit trust statement for every off-chain component.
- **Overall B3:** both remote-state/canonicality and randomness claims must be satisfied if both are part of the promised B3 property. Closing one does not close the other.
