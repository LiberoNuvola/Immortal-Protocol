# B3 Beacon Conformance Investigation

Status: OPEN — cryptographic/operational conformance
Branch: `work/immortal-green-closure`

## Scope

B3 is not a new economic rule. It is the stronger publisher-independent randomness/canonicality target for PRE-RICH.

B1 currently retains an authorized-publisher trust assumption.

## Verified current beacon path

`plutus/Beacon.hs` defines distinct domains for:

- Beacon derivation;
- player commitment;
- game derivation;
- symbol derivation;
- game-round commitment;
- ticket commitment.

The ticket commitment binds ticket identity, player commitment, game version, nonce, price and beacon target.

`deriveBeacon` deterministically hashes:

```
networkId
roundId
mainchainRef
mcHash
materiosContext
version
```

under the Beacon domain.

The code explicitly states that `deriveBeacon` does not prove authenticity of the external hash/context.

## Current B1 registry trust boundary

`plutus/BeaconRegistry.hs` verifies:

- pending registry state;
- designated relayer signature;
- non-empty mcHash;
- non-empty Materios context;
- singleton registry input;
- exact target preservation;
- exact derived beacon value;
- exact context/hash preservation.

The registry therefore provides deterministic integrity and authorized publication, but it does **not** independently authenticate the external Materios receipt.

## B3 closure questions

| Question | Current evidence | Status |
|---|---|---|
| Canonical randomness source | Beacon derivation identified | OPEN |
| External-source authenticity | Explicitly not proven by deriveBeacon | OPEN |
| Publisher independence | Relayer signature currently required | OPEN |
| Domain separation | Explicit domains present | PARTIAL/POSITIVE |
| Target binding | Included in ticket commitment | POSITIVE |
| Deterministic replay | Derivation functions deterministic | OPEN evidence |
| Bias resistance | Depends on downstream outcome mapping | OPEN |
| Rejection sampling | Must be checked in actual mapping implementation | OPEN |
| 20,000-domain mapping | Mathematical model exists; implementation parity required | OPEN |
| Fail-closed on missing/invalid beacon | Must be verified across validators | OPEN |
| Jackpot randomness domain separation | Must be verified separately | OPEN |

## Important non-reopening rule

The frozen PRE-RICH economic distribution is not reopened by this investigation.

The investigation concerns whether verified randomness is transformed into the already-adopted outcome distribution without:

- operator discretion;
- modulo bias;
- ambiguous encoding;
- cross-domain collisions;
- replay ambiguity;
- publisher-controlled outcome selection.

## Required next evidence

1. Locate the actual outcome-mapping implementation on the current branch.
2. Trace Beacon → ticket seed → symbols/outcome.
3. Compare Plutus and TypeScript derivation byte-for-byte.
4. Verify rejection sampling and accepted domain.
5. Verify exact target distribution.
6. Verify deterministic replay vectors.
7. Verify failure behavior when Beacon evidence is absent, malformed or inconsistent.
8. Separately inspect Jackpot randomness so it cannot consume the normal-game domain accidentally.

## Current closure statement

**B1 deterministic beacon derivation: PRESENT.**

**B1 authorized publication boundary: PRESENT.**

**B3 publisher-independent canonical randomness: NOT YET PROVEN.**
