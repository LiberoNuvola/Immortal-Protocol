# PRE-RICH — Preprod PRE Materialization Gate v0.1

**Date:** 2026-09-26  
**Scope:** PRE-RICH / Preprod deployment only  
**Status:** OPEN — deployment/materialization witness required

## Purpose

Define the exact evidence required before a Preprod UTxO carrying the canonical PRE-RICH asset may be used by the Genesis Treasury admission path.

This document does not mint, define, or authorize a new PRE asset.

## Canonical PRE identity

The repository currently identifies PRE-RICH as:

- policy ID: `1b29fda97d0fd321398c5b7b3285fdaadd519a0d002932853311f02c`
- asset name: `5052452d52494348`
- unit: `1b29fda97d0fd321398c5b7b3285fdaadd519a0d002932853311f02c5052452d52494348`

The Genesis admission path requires an observed canonical Treasury PRE quantity whose independently verified value is at least 4,000 USDM.

## Evidence audit

The current repository/Notion corpus establishes:

1. PRE identity and Genesis threshold are application/provenance facts already represented in the current implementation.
2. Treasury observation/admission validates an observed PRE-bearing UTxO; it does not mint PRE.
3. Existing Yaci Genesis traces are explicitly test/non-production fixtures and cannot establish production deployment identity.
4. Historical Gate 41 evidence concerns the canonical Mainnet PRE/Snek asset and does not prove that the same asset exists on Preprod.
5. No authoritative Preprod minting or distribution transaction for the canonical PRE identity has been established in the current evidence corpus.
6. No repository path currently provides a verified Preprod transfer/mint witness that can be promoted to the canonical deployment path.

## Required closure packet

The gate may close only when the following are preserved:

- exact Preprod transaction hash;
- exact input/output UTxO references;
- exact network = Preprod;
- exact policy ID and asset name above;
- observed PRE quantity;
- transaction CBOR or equivalent witness-capable artifact;
- source/provider and acquisition timestamp;
- if minted on Preprod, the exact minting policy source/parameters and resulting policy ID;
- if transferred, the provenance of the sending PRE UTxO and proof that it carries the exact canonical asset;
- exact destination Treasury UTxO;
- independent re-query showing the PRE-bearing Treasury UTxO still exists;
- binding to the Genesis Treasury observation packet.

## Fail-closed rules

Until that packet exists:

- do not create a second guessed PRE policy and call it canonical;
- do not use a synthetic/Yaci PRE asset as production Genesis evidence;
- do not require the first Lace/CIP-30 user to possess PRE merely to enter the application;
- do not treat the Mainnet PRE policy reference in `src/config.ts` as proof of Preprod existence;
- do not declare Genesis eligibility from Treasury ADA alone;
- do not promote a documentation statement such as "Treasury contains PRE" to ledger evidence.

## Intended execution chain

Once the materialization witness exists:

`canonical PRE Preprod UTxO → protocol Treasury → verified Oracle → Genesis admission → Genesis/V3 state → Lace/CIP-30 first-user Issue`

The first-user wallet remains a user signing boundary. PRE Treasury bootstrap and user wallet funding are separate concerns.

## Non-contamination rule

This gate is deployment/provenance infrastructure only.

It must not:

- modify IMMORTAL universal economic semantics;
- import B3/Materios mechanisms into the economic kernel;
- invent a new PRE-RICH economic parameter;
- convert historical Mainnet evidence into a Preprod claim.

## Closure criterion

**CLOSED** only after a real Preprod ledger witness satisfies the complete packet above and is bound to the already-implemented Treasury observation/admission code.

**Current status: OPEN — canonical Preprod PRE materialization witness absent.**
