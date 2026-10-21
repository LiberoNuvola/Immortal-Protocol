# IMMORTAL drand Beacon Verification PoC

Status: **isolated off-chain + Plutus V3 verification PoC / candidate only**. The Aiken validator now compiles and a real Quicknet round-42 signature passes Aiken's test evaluator, with a wrong-round negative test. This is not yet a submitted Cardano ledger execution, not a selected normative randomness source, and not a Materios finality proof.

## Fixed profile

- Beacon: drand Quicknet
- Chain hash: `52db9ba70e0cc0f6eaf7803dd07447a1f5477735fd3f661792ba94600c84e971`
- Public key: pinned in `verify.mjs`
- Scheme: `bls-unchained-g1-rfc9380`
- Default historical fixture round: `42`
- Verification: official `drand-client@1.4.2` Quicknet client, with signature verification enabled and chain identity pinned.

The client is configured by the published official Quicknet helper and the public v1 relay API. The wrapper independently checks the chain hash, public key, scheme, beacon ID, and exact requested round. It rejects wrong-round responses and verifies the signature rather than trusting the relay response.

## Run

```sh
npm install --no-audit --no-fund
npm test
npm run capture
```

To capture another already-selected round:

```sh
DRAND_ROUND=42 npm run capture
```

Round selection is deliberately an input to the verifier, not chosen by this PoC. A production protocol must commit its round-selection rule before the result is known; merely fetching a fixed historical round does not establish a safe production schedule.

## Tests

1. Positive: fetch and verify pinned Quicknet round 42.
2. Negative: reject a response with a different round.
3. Negative: substitute a genuine, well-formed signature from the adjacent round and recompute its derived randomness, proving verification rejects the wrong signed round rather than only detecting malformed bytes or a randomness/signature mismatch.

The positive test depends on public drand API availability. The negative tests use a real beacon as the base vector and mutate it in memory.

## Trust boundary / non-claims

- Proves only that the fetched beacon is valid under the pinned Quicknet chain identity and drand-client verification rules.
- Does not prove Materios receipt authenticity, storage-root authenticity, GRANDPA finality, or authority-set provenance.
- Demonstrates the Quicknet signature check using Plutus V3 builtins in Aiken's test evaluator, but does not yet prove execution in a submitted Cardano transaction or acceptable CPU/memory budget.
- No changes to PRE-RICH outcome mapping, rejection sampling, ticket commitment, or B1/B3 semantics.
