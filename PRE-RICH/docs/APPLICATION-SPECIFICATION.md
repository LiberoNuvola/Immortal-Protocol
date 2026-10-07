# PRE-RICH Application Specification

## 1. Scope

Defines the concrete PRE-RICH Scratch & Win specialization of IMMORTAL.

## 2. Application semantics

PRE-RICH defines the application denomination, ticket lifecycle, class ladder, result model, Treasury, PrizePool, Jackpot and application settlement policy.

## 3. Ticket classes

```text
1 / 2 / 3 / 5 / 10 / 25 / 50 / 100 USDM
```

Genesis is `1 USDM`; Genesis bootstrap requires verified PRE Treasury value `>= 4000 USDM`.

## 4. Result authority

The player must not supply authoritative:

- symbols;
- tier;
- payout;
- winner status.

These are derived from validated ticket context, commitment/secret and the active result/evidence mechanism.

In serialized lifecycle payloads, `symbolVector`, `prizeTier`, payout and winner status are **DERIVED RESULT** data. Their presence in a payload does not make them an authority-bearing input.

## 5. Lifecycle and expiry

```text
purchase/commit
→ reveal
→ deterministic result
→ crystallization where winning
→ claim
```

Claim is a single-use settlement of an already established right.

```text
CLAIM ≠ BURN
```

Expiry is final. After expiry there is no claim, no new liability and no resurrection; a late reveal cannot create claimability and the expired payment commitment dissolves. Ticket expiry is PRE-RICH profile policy. V1 crystallizes a deterministic horizon from the verified issuance-state snapshot using `preRichExpiryPolicyV1`. The explicit PRE-RICH V1 bounds are `MIN = 2 hours` and `MAX = 300 days`; these are application parameters, not IMMORTAL constants. Within those bounds, the horizon contracts as unresolved-reserve pressure rises.

## 6. Ticket identity and transfer

Tickets are transferable. Transfer preserves ticket identity, commitment, round, game configuration and future result. The economic right follows the ticket and cannot be duplicated by transfer.

A claimed ticket may remain as a historical collectible. Voluntary burn provides no refund, bonus or additional economic right.

## 7. Economic transitions

A sale couples:

```text
ticket mint + Treasury payment + unresolved-ticket reservation
```

The transition must be economically atomic or equivalent.

Reveal derives the result and, if winning, crystallizes an immutable payout. Claim settles the crystallized amount once.

## 8. Settlement

PRE-RICH denominates prizes in USDM. Supported alternative settlement assets require validated conversion preserving the frozen USDM economic value. Asset support is application policy; Cardano-specific mechanics belong to the Cardano Adapter.

## 9. Jackpot

The Jackpot is separate, protected and locked.

```text
NewJackpot <= RawSurplus
JackpotPayout <= LockedJackpotLiquidity
```

Jackpot selection is cryptographically verifiable and non-discretionary. Payout mode is OPEN-01. Future allocation policy is OPEN-03 only if actually required.

## 10. Beacon trust model

B1 is the current authorized-publisher application trust model. B3 is a stronger publisher-independent canonicality target. B3 must not be claimed as implemented without its required verification evidence.

## 11. First-Class Adaptive Mechanisms

PRE-RICH exposes several application-level mechanisms explicitly. They operate only within the economic and safety envelope supplied by IMMORTAL.

### AWRA — Adaptive Win Rate Algorithm

AWRA adapts winning-rate / payout behaviour using application-level policy and available residual headroom.

The current repository restores and reproduces the historical static candidate transformation against the current Classic-6 distribution and retains the historical dynamic risk-envelope lineage.

The exact final optimizer/objective, numeric `alpha`, fixed budget fraction, cadence, risk ceiling and dynamic selector are **not canonical**.

AWRA cannot:

- consume protected capital or mandatory obligations;
- bypass the Economic Gate;
- bypass viability or `A_safe`;
- define its own authority or evidence source;
- promote a historical candidate into normative policy.

### Treasury Allocation Policy

Treasury allocation is application policy over residual value. Historical fixed percentage schemes such as `75/10/10/5` are non-canonical.

### Adaptive Asset / Liquidation Policy

PRE-RICH may choose among application asset-management actions such as:

```text
HOLD / SALE / LIQUIDATE / REBALANCE
```

The action must first satisfy economic feasibility and the IMMORTAL safe-action boundary. No universal asset-ranking rule is implied.

### Mechanism boundary

```text
IMMORTAL Economic Gate / Viability
                ↓
             A_safe
                ↓
       PRE-RICH mechanism
                ↓
          Adapter execution
```

## 11. Governance boundary

PRE-RICH governance cannot override IMMORTAL invariants, assign individual economic outcomes, alter crystallized payouts or create privileged personal economic entitlement.
