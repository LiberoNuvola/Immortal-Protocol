# PRE-RICH Payout Unit Conformance Investigation

Status: OPEN — implementation/unit boundary
Branch: work/immortal-green-closure

## Finding

The current PRE-RICH economic baseline requires the 20,000-row distribution:

- 17,500 loss
- 1,700 × 1
- 600 × 2.5
- 180 × 5
- 19 × 100
- 1 × 500

The current Plutus and TypeScript GameRules implementations contain the correct outcome probabilities and the correct payout table shape, but prizeAmountForTier computes:

    floor(baseMultiplier × priceUsdm / 2)

using Integer/number ticket prices expressed as whole USDM values.

At Genesis price = 1 USDM:

    tier 1 = floor(2 × 1 / 2) = 1
    tier 2 = floor(5 × 1 / 2) = 2  <-- canonical value is 2.5
    tier 3 = floor(10 × 1 / 2) = 5
    tier 4 = floor(200 × 1 / 2) = 100
    tier 5 = floor(1000 × 1 / 2) = 500

Therefore the implementation cannot represent the canonical 2.5-USDM payout at a 1-USDM ticket.

## Independent triangulation

Notion current decision material records both the 20,000-slot distribution and the 2.5× tier-2 payout. The current branch GameRules code records the same 20,000-slot probabilities but uses integer arithmetic for payout calculation.

This is a genuine implementation/conformance mismatch, not a test-fixture error and not a reason to weaken the economic invariant.

## Consequence

At Genesis price, the current implementation's row EV is lower than the frozen mathematical model because the 600 tier-2 outcomes are paid as 2 instead of 2.5.

The correction must therefore be made at the denomination/unit boundary, not by changing the frozen probability distribution, payout multipliers, or 500× cap.

## Required closure

Before changing code, establish the canonical payout unit used by PRE-RICH and prove the conversion at every boundary:

    application denomination
        ↓
    exact integer representation
        ↓
    GameRules payout
        ↓
    economic kernel liability
        ↓
    Cardano datum/value
        ↓
    claim settlement

The chosen representation must:

1. represent 2.5 USDM exactly;
2. preserve the 500× maximum exactly;
3. preserve all frozen ticket prices exactly;
4. preserve EV and distribution exactly;
5. avoid floating-point economic authority;
6. remain compatible with the existing exact-USDM settlement rule;
7. have executable Plutus/TypeScript parity evidence.

## Non-goals

- Do not change the 20,000 outcome domain.
- Do not change 17,500 / 1,700 / 600 / 180 / 19 / 1 probabilities.
- Do not change the ticket ladder.
- Do not change the 500× ceiling.
- Do not round 2.5 to 2 or 3.
- Do not introduce a new statistical reserve formula.

## Status

OPEN — unit representation and exact payout conversion must be closed before claiming full GameRules economic conformance.