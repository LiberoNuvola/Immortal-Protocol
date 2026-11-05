Relayer (legacy reference scaffold)
===================================

**Treasury distribution is currently DISABLED / FAIL-CLOSED.** This README preserves the historical reference behavior for audit only; it is not an operational instruction to distribute Treasury funds.

The service still contains the BeaconRegistry publication surface. The Treasury worker now observes the configured Treasury UTxOs and returns without building, signing or submitting a distribution transaction. Distribution requires a separately defined canonical EconomicAdmission path and current PRE-RICH policy/conformance.

## Setup

- Copy `.env.example` to `.env` and configure the values required by the service.
- Install dependencies with `npm install` in the project root.
- The configured Treasury address must match the validator-derived deployment identity.

## Run

```bash
npm run relayer
```

Running the service does **not** enable Treasury distribution.

## Historical threshold and split — non-authoritative

The former reference implementation recorded:

- threshold: 25 ADA (`25_000_000` lovelace);
- after a historical relayer reward, distribution: 50% Prize, 30% Stake, 19.5% Reserve;
- historical relayer reward: 0.5% of Treasury, minimum 0.2 ADA.

These values are **LEGACY / NON-CANONICAL**. In particular:

- 25 ADA is not verified as the currently adopted PRE-RICH batch target;
- the percentage split is not a current allocation policy;
- the values must not be combined with the older historical 75/10/10/5 proposal;
- neither the threshold nor the split grants a relayer spending authority.

The current Treasury worker is intentionally fail-closed pending canonical EconomicAdmission. Do not re-enable direct signing/submission or revive the percentage calculator.

## Architectural boundary

PRE-RICH uses one protocol-controlled Treasury with internal accounting categories. Internal category reclassification is not a physical asset transfer. The batch target, when adopted, is relevant to eligible physical settlements/outflows; it does not delay receipt recognition, due claims, mandatory payments or safety-required PrizePool funding.

The current category-ledger and target boundary are documented in [PRE-RICH Treasury Category Ledger Operational Specification, §11.14](../docs/research/PRE-RICH-TREASURY-CATEGORY-LEDGER-OPERATIONAL-SPEC-2026-11-04.md).

## Beacon and claim boundaries

- The relayer does not decide ticket results, prize tiers, payouts or beacon values.
- Claim validation remains independent from the relayer.
- External observations and receipt/journal data are evidence inputs, not spending authority.
- The relayer must not infer a ticket outcome from a browser-provided value.
