# Red Team — Legacy Treasury T1 / Non-ADA Drain

Status: FINDING CONFIRMED AT VALIDATOR LOGIC; CURRENT RELAYER PATH FAIL-CLOSED  
Branch: `work/immortal-green-closure`  
Date: 2026-10-10

## Finding

The legacy `plutus/Treasury.hs` validator authorizes `Distribute` using only the ADA/lovelace balance of its own input.

The validator:
- derives `totalIn` with `valueLovelace`;
- computes four ADA minima with integer percentage division;
- checks that an output to each configured protocol ScriptHash contains at least the required ADA amount;
- does not enforce full multi-asset conservation or constrain non-ADA assets to protocol-controlled destinations;
- does not require a continuing Treasury output.

Therefore, if a Treasury UTxO contains non-ADA assets, an attacker able to spend that UTxO through the legacy `Distribute` surface can satisfy all four ADA payout checks while routing the remaining non-ADA assets to an arbitrary output.

## Severity

- ADA-only Treasury: the rounding remainder from four percentage floors is bounded to at most 3 lovelace when the percentages sum to 10000.
- Multi-asset Treasury: potentially HIGH, because non-ADA assets are outside the validator's accounting checks and can be moved by the spending transaction.

This distinction corrects the earlier claim that the generic remainder itself was a critical ADA drain.

## Reachability

The current relayer implementation is fail-closed and does not sign/submit the legacy distribution transaction. The current code explicitly marks the worker observation-only pending an authoritative EconomicAdmission path.

However, `plutus/Treasury.hs` and the compiled Treasury artifacts remain in the repository. The release boundary must therefore treat this as a legacy on-chain surface until deployment/reachability is conclusively isolated.

## Why this is not being patched into a new Treasury economy

The repository's own Treasury coordination documents classify the four-way percentage mechanism as legacy/application-specific and prohibit promoting it into universal IMMORTAL economics.

The safe closure path is:
1. release-isolate/deactivate legacy `TreasuryAction = Distribute` from supported production flows;
2. retain the finding and negative evidence in the red-team register;
3. only reactivate a Treasury spending path after an authoritative economic transition and explicit asset-conservation semantics are defined by the source of truth.

## Adversarial witness

Assume a Treasury input contains:
- ADA sufficient to reach `tdThreshold`;
- PRE or another non-ADA asset.

Construct `Distribute` outputs containing:
- exactly the four minimum ADA amounts required by the datum percentages;
- an additional attacker-controlled output containing the remaining non-ADA asset value.

The legacy validator has no predicate that rejects the attacker output, because its payout checks inspect only lovelace.

## Required closure evidence

A release-grade closure requires both:
- proof that no supported production path can spend a live Treasury UTxO with `Distribute`; and
- a regression/ledger test that prevents accidental reactivation of this legacy spending surface.

No ProtectedCapital, RawSurplus, ProtocolUsageFee, V3, B2, EEV, Reveal, or B3 semantic change is implied by this finding.
