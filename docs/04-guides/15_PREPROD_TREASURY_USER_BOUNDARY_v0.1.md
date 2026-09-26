# PREPROD TREASURY — USER / PROTOCOL BOUNDARY v0.1

**Status:** OPERATIONAL SURFACE / NON-NORMATIVE DEPLOYMENT GUIDE

## Purpose

Preprod must expose a real protocol-controlled Treasury script address while ordinary users continue to transact from their own CIP-30 wallets.

The user's wallet is **not** the Treasury.

## Current boundary

The repository contains a Plutus Treasury validator and the PRE-RICH B1 sale path pays the configured Treasury script address atomically with ticket issuance.

The existing Treasury validator is a **legacy B1 distribution mechanism** with percentage fields. It MUST NOT be presented as the Genesis activation authority.

Genesis admission remains a separate application-specific observation problem:

`canonical Treasury state → PRE identity/quantity → verified Oracle state → verified PRE value → Genesis predicate`

## User flow

1. Connect a normal Preprod wallet (for example the user's DEMETER wallet).
2. Derive the Treasury address from the published Treasury validator.
3. Inspect Treasury UTxOs.
4. If required, sign a deposit from the user wallet to the Treasury script.
5. The resulting Treasury UTxO is protocol-controlled; the user's signing key never becomes the Treasury key.
6. Ticket purchases use the configured Treasury address as the protocol payment destination.

## Provider security

`VITE_BLOCKFROST_PROJECT_ID` is local runtime configuration only. It MUST NOT be committed, placed in frontend source, or embedded in public repository history.

For a public frontend deployment, use a server-side/proxy provider boundary rather than exposing a provider secret to the browser.

## Genesis warning

A funded Treasury does not by itself prove Genesis eligibility. The canonical bootstrap condition remains verified PRE Treasury value `>= 4000 USDM`, using the existing authenticated Oracle semantics and a canonical Treasury observation. No second oracle or legacy percentage rule may be used.