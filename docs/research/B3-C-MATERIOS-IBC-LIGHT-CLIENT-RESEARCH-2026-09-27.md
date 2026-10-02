# B3-C Materios ↔ IBC Light-Client Research — 2026-09-27

**Semantic status:** RESEARCH / NON-NORMATIVE.
**Purpose:** evaluate whether IBC-style light-client verification can provide a useful Materios→Cosmos proof boundary without modifying existing Materios B3 research.

## 1. Research question
Can a Cosmos destination verify Materios finality/state evidence directly, without trusting a named publisher or relayer for the truth of that evidence?

## 2. Candidate boundary
Materios consensus → finalized checkpoint/header → IBC-compatible light-client verification → verified remote consensus/state → Cosmos economic transition.

The relayer transports evidence; it is not the authority for that evidence.

## 3. Production-reference finding
Current ibc-go source/documentation confirms that its Wasm light-client module can host light-client algorithms as Wasm contracts, and its documentation explicitly describes a GRANDPA light-client example. The requirements documentation also identifies support for GRANDPA light clients and Cosmos↔Substrate connections.

This is evidence that the verification-logic category is production-oriented and architecturally available in the IBC stack. It does NOT establish that Materios is already compatible with that client, nor that a Materios deployment can be certified through IBC.

Repository references checked:
- cosmos/ibc-go light-client module documentation;
- cosmos/ibc-go Wasm light-client concepts;
- cosmos/ibc-go ICS-08 requirements / roadmap references to GRANDPA.

## 4. Required demonstrations
1. source consensus/finality authenticity;
2. validator-set transition authenticity;
3. exact checkpoint/header binding;
4. state/storage proof authenticity where required;
5. destination client-state transition correctness;
6. rejection of stale, conflicting, replayed and malformed evidence.

Only after these are established can the construction be considered for a B3-class remote-state/finality boundary.

## 5. Non-goals
This research does not prove unbiased randomness, canonical Beacon semantics, IMMORTAL economic correctness, CosmWasm correctness, relayer liveness or absence of governance/upgrade risk.

## 6. Materios non-contamination firewall
This research MUST NOT change Materios consensus, reimplement the authoritative selector in IMMORTAL, invent a canonical anchor-id rule, weaken the GRANDPA/finality boundary, promote an SDK convention to canonical B3, or select IBC merely for deployment convenience.

## 7. Compatibility questions
Q1 — Can the required Materios GRANDPA/finality evidence be represented and verified by the available IBC GRANDPA/Wasm light-client architecture without an external publisher?
Q2 — How are Materios authority-set transitions represented, authenticated and advanced?
Q3 — What exact finalized checkpoint/header is accepted?
Q4 — What state/storage proof is required for an economic claim and how is it checked against the authenticated state root?
Q5 — How are client updates, upgrades, misbehaviour and expiry handled?
Q6 — Does invalid evidence fail closed while relayer absence affects only liveness?
Q7 — What are execution/storage costs versus the succinct-proof path under B3-C research?

## 8. Experiment order
1. Freeze the exact Materios evidence packet using the existing real-fixture contract.
2. Identify the exact GRANDPA/light-client compatibility boundary.
3. Reuse a real Materios finality fixture when available; do not synthesize a consensus model.
4. Determine the minimum authenticated state proof.
5. Build a standalone verifier experiment outside IMMORTAL if needed.
6. Test stale/replay/conflicting-root/authority-transition cases.
7. Measure execution and state costs.
8. Compare the resulting proof boundary with existing succinct-proof research.

## 9. Current classification
OPEN RESEARCH. The new evidence closes only the question 'does the IBC stack contain a GRANDPA/Wasm light-client verification path?' It does not close Materios compatibility, B3 conformance, Cosmos implementation, or proof economics.