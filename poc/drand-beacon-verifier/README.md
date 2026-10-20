# IMMORTAL drand Beacon Verification PoC

Status: **off-chain PoC / candidate only**. This is not a selected normative randomness source, not a Cardano integration, and not a Materios finality proof.

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
- Does not yet prove Cardano/Plutus feasibility or on-chain verification.
- No changes to PRE-RICH outcome mapping, rejection sampling, ticket commitment, or B1/B3 semantics.
