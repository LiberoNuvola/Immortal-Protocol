# B3 Beacon Conformance Investigation

Status: OPEN — cryptographic/operational conformance
Branch: work/immortal-green-closure

## Scope

B3 is not a new economic rule. It is the stronger publisher-independent randomness/canonicality target for PRE-RICH.

B1 currently retains an authorized-publisher trust assumption.

## Verified current beacon path

plutus/Beacon.hs defines distinct domains for Beacon derivation, player commitment, game derivation, symbol derivation, game-round commitment and ticket commitment.

The ticket commitment binds ticket identity, player commitment, game version, nonce, price and beacon target.

deriveBeacon deterministically hashes networkId, roundId, mainchainRef, mcHash, materiosContext and version under the Beacon domain.

The code explicitly states that deriveBeacon does not prove authenticity of the external hash/context.

## Current B1 registry trust boundary

plutus/BeaconRegistry.hs verifies pending registry state, designated relayer signature, non-empty mcHash, non-empty Materios context, singleton registry input, exact target preservation, exact derived beacon value, and exact context/hash preservation.

The registry therefore provides deterministic integrity and authorized publication, but it does not independently authenticate the external Materios receipt.

## B3-B PRE-RICH outcome mapping — current implementation evidence

The current branch contains the complete downstream mapping in both Plutus and TypeScript:

- plutus/GameRules.hs
- src/gameRules.ts

The canonical row domain is 20,000 slots:

0..17499 loss
17500..19199 tier 1
19200..19799 tier 2
19800..19979 tier 3
19980..19998 tier 4
19999 tier 5

This yields the frozen row counts: 17,500 / 1,700 / 600 / 180 / 19 / 1.

### Rejection sampling

Both implementations derive a 16-bit value from the first two digest bytes and accept only u < 60,000, then compute u mod 20,000.

Because 60,000 = 3 × 20,000, every canonical outcome slot has exactly three accepted source values. The reduction is therefore unbiased.

This is a direct implementation match to the mathematical model and resolves the historical 10,000-vs-20,000 ambiguity for the current branch: the current normative implementation uses 20,000.

### Row domain separation

Row 1 and row 2 use the same symbols seed but distinct encoded prefixes [row=1, attempt] and [row=2, attempt] before hashing.

Thus the two row draws are deterministically separated without introducing an operator-selected outcome.

### Plutus / TypeScript parity

The current implementations match on the material construction points inspected: domain-separated seed derivation; row/attempt encoding; 16-bit extraction; 60,000 rejection threshold; modulo-20,000 reduction; outcome interval boundaries; loss-symbol construction; winning triple construction; and two-row concatenation.

This is source-level parity evidence, not yet an independently executed byte-for-byte conformance result.

## Adjacent economic finding — payout units reconciled

The earlier apparent tier-2 truncation was caused by evaluating the function with `priceUsdm = 1` as though the parameter were whole USDM.

The current implementation uses **100 USDM sub-units per USDM** at the Cardano-facing boundary. Genesis is therefore `priceUsdm = 100`.

With the current formula:

```
(baseMultiplier × priceUsdm) / 2
```

the canonical tier-2 payout is:

```
5 × 100 / 2 = 250 sub-units = 2.5 USDM
```

The 500× cap is likewise exact:

```
500 × 100 = 50,000 sub-units = 500 USDM
```

The previous OPEN finding was therefore a unit-interpretation error, not an implementation defect. No economic rule or code change is required.

Remaining evidence is executable Plutus/TypeScript replay parity, economic-state integration and real Cardano settlement evidence.

## Replay vectors

A first language-neutral replay vector set is now stored at `verification/pre-rich-gamerules-v1-vectors.json`. It covers deterministic symbols-seed cases plus every material outcome-interval boundary. This is evidence for the mapping layer; an independent Plutus/TypeScript execution runner is still required before marking mirror conformance closed.

## B3 closure questions

| Question | Current evidence | Status |
|---|---|---|
| Canonical randomness source | Beacon derivation identified | OPEN |
| External-source authenticity | Explicitly not proven by deriveBeacon | OPEN |
| Publisher independence | Relayer signature currently required | OPEN |
| Domain separation | Explicit domains present | POSITIVE |
| Target binding | Included in ticket commitment | POSITIVE |
| Deterministic replay | Derivation functions deterministic; vectors still required | OPEN |
| Bias resistance | 60,000 → 20,000 rejection construction verified | POSITIVE |
| Rejection sampling | Present in Plutus + TypeScript | POSITIVE |
| 20,000-domain mapping | Present in Plutus + TypeScript | POSITIVE |
| Plutus/TypeScript byte-for-byte execution proof | Source parity inspected | OPEN |
| Fail-closed on missing/invalid beacon | Must be verified across validators | OPEN |
| Jackpot randomness domain separation | Must be verified separately | OPEN |

## Required next evidence

1. Produce executable deterministic replay vectors for Beacon → ticket seed → symbols.
2. Compare Plutus and TypeScript outputs over the same vectors.
3. Verify failure behavior when Beacon evidence is absent, malformed or inconsistent.
4. Verify the full validator path cannot substitute an operator-selected outcome.
5. Separately inspect Jackpot randomness so it cannot consume the normal-game domain accidentally.
6. Close the payout-unit issue using the canonical denomination/economic model; do not silently round or truncate a frozen payout.

## Current closure statement

B1 deterministic beacon derivation: PRESENT.

B1 authorized publication boundary: PRESENT.

B3 20,000 outcome mapping and unbiased rejection construction: IMPLEMENTED / SOURCE-LEVEL CONFORMANCE EVIDENCE PRESENT.

B3 publisher-independent canonical randomness: NOT YET PROVEN.

Payout-unit exactness: reconciled; the prior truncation finding was a unit-interpretation false positive. Remaining parity/settlement evidence is tracked separately from Beacon canonicality.