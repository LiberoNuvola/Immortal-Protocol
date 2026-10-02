# IMMORTAL → PRE-RICH Preprod Conformance Dossier

**Status:** VERIFIED for live observation and executable boundary conformance; end-to-end ledger equivalence remains gated by a real submitted Preprod transaction witness.

## Scope

This dossier binds the normative IMMORTAL V3 economic transition semantics to the PRE-RICH Reveal boundary and to live Cardano Preprod observation. It deliberately does not promote the local Yaci laboratory into a Preprod claim.

## Verified evidence

- IMMORTAL V3 → Universal transition differential evidence exists for Issue, Reveal, Claim and Expire, including protected-capital deltas and fail-closed mismatch cases.
- PRE-RICH Reveal boundary test: **4/4 passed** in the successful Preprod workflow.
- Live Demeter/Ogmios v7 Preprod context was observed successfully.
- Live Preprod wallet UTxO observation was successful in the same workflow session.
- The Preprod binding packet was generated and SHA-256 bound to the exact source snapshot and live observation.
- Security Credential Boundary checks are currently succeeding after removal of the previously hardcoded provider credential.

## Canonical successful Preprod run

Run `36221378619` / run `44`, head `ae4fcc020dff326e8a3ea75c0e07e380a5451bc6`.

The workflow completed successfully through:
1. Demeter credential validation.
2. Preprod address validation.
3. Ogmios context acquisition.
4. Live wallet UTxO acquisition.
5. IMMORTAL → PRE-RICH Reveal boundary conformance, 4/4.
6. Binding packet generation.
7. Evidence artifact upload.

A prior successful run `36220479492` also produced the first fully verified binding packet after the newline-writer repair.

## Interpretation

The observed evidence supports the statement:

> For the exercised Reveal boundary cases, PRE-RICH preserves the canonical IMMORTAL transition semantics without an observed rule substitution, while the Cardano observation layer is provenance-bound to live Preprod.

It does **not** support the stronger statement that every possible production Cardano execution is equivalent to the IMMORTAL kernel.

## Remaining gate

The final missing witness is an already-submitted **real Cardano Preprod transaction hash** for the production Reveal path. No private signing key is placed in CI.

Once a real transaction hash is supplied, the new workflow `.github/workflows/immortal-preprod-ledger-evidence.yml` materializes:
- exact transaction CBOR,
- exact consumed UTxOs,
- protocol parameters for the transaction epoch,
- era/epoch timing from Demeter/Ogmios,
- network SystemStart,
and invokes the native `cardano-ledger` evaluator.

## Non-regression boundary

No change in this cycle modifies:
- canonical economic constants,
- payout multiplier,
- liability-first accounting,
- ProtectedCapital,
- expiry finality,
- jackpot protection,
- IMMORTAL authority hierarchy,
- Cardano transaction-size limits.
