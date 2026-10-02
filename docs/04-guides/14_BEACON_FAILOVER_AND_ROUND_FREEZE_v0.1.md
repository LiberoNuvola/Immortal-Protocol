# Beacon Failover and Round Freeze v0.1

## Objective

PRE-RICH has three Beacon trust modes:

1. B3 — VERIFIED (default)
2. B2 — ATTESTED
3. B1 — AUTHORIZED

A lower mode may be selected only when the stronger mode is unavailable before the round is committed.

## Selection

For a new round:

B3 -> B2 -> B1

A mode is eligible only when its own evidence verifier has produced a valid, round-bound evidence object.

There is no fallback to an unverified raw API value.

## Round freeze

The selected mode and Beacon value become immutable before ticket commitments.

B3 available
  -> round selects B3
  -> commitments
  -> B3 temporarily disappears
  -> existing round remains B3

For a future round:

B3 unavailable
  -> B2 available? yes -> B2
  -> otherwise B1 available? yes -> B1
  -> otherwise HALT / no new round

A temporary B3 outage must never turn an already committed B3 round into B2 or B1.

## Trust boundary

The selector is not an authority. It consumes only:

- B3 proof-verifier output;
- B2 committee-attestation verifier output;
- B1 authorized-publisher verifier output.

It cannot turn an API response into a Beacon.

## Public declaration

The frontend must expose the selected mode, evidence reference, and observation age.

## Security property

Failover changes the trust assumption only for new rounds. It never changes the trust assumption of an existing round.

This is availability fallback, not silent trust-model mutation.
