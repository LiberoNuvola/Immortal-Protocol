# USDM Issuer-of-Record and Redemption Qualification — Research Note

**Date:** 2026-10-31  
**Branch:** `work/immortal-green-closure`  
**Classification:** `PUBLIC_TERMS_REVIEW_NOT_ISSUER_OR_TOKEN_PROVENANCE_VERIFICATION`

## Executive finding

The current public NBX USDM Terms distinguish two legally and economically separate issuance obligations that must not be collapsed into one generic “USDM is redeemable at par” assumption:

- Within the EEA, Norwegian Block Exchange AS (NBX) issues **NBX-issued USDM**, backed by the EU NBX USDM Reserve.
- Outside the EEA, Moneta Digital LLC separately issues **Moneta-issued USDM**, backed by the Moneta USDM Reserve.
- The terms explicitly state there is no cross-liability or cross-coverage between those reserves.

Official source: [NBX USDM Terms, updated 17 July 2026](https://nbx.com/en/usdm-terms), especially §§1.1, 1.6.1 and 1.6.3.3.

## Redemption distinction

The terms state:

1. NBX-issued USDM holders can request redemption at par through NBX, subject to issuer-of-record verification, account establishment, identity verification, KYC/AML/CTF, sanctions screening and applicable terms/law.
2. Moneta-issued USDM is redeemable under Moneta's own terms and regulatory framework. NBX may facilitate redemption but is not obliged to do so.
3. For Moneta-issued USDM, NBX's stated “no transfer, no redemption” rule requires corresponding cleared USD to be received from Moneta / Moneta's reserve before NBX executes, funds or settles redemption from the EU NBX Reserve.

This means the existence of a public redemption route is not enough to establish that every token carrying the same visible Cardano asset identity has the same issuer, reserve claim, or redemption counterparty.

## Critical implication for IMMORTAL

The exact Cardano policy ID and asset name establish a native-asset identity, but **must not be treated by themselves as proof of issuer-of-record or redemption entitlement**.

Before a redemption route can be used as a USD/USDM valuation reference, the evidence package would need to establish at minimum:

- the issuer-of-record classification applicable to the observed token / holder / issuance;
- how that classification is verified from authoritative issuer records and, where applicable, Cardano issuance provenance;
- the relevant issuer's operative terms and redemption process at the valuation time;
- eligibility, jurisdiction, KYC/AML, sanctions and account constraints;
- settlement currency, fees, cut-offs, delays, minimums and operational availability;
- whether the path is direct redemption or an intermediary-facilitated route, with counterparty and prefunding dependencies;
- independent evidence of cleared USD settlement / completed redemption, where a realized redemption price is claimed.

The current public terms are evidence of the contractual distinction and conditions, **not** proof that a particular UTxO or holder's tokens have been classified as NBX-issued or Moneta-issued, nor proof of a currently executable redemption.

## Cross-check against public issuer material

- [NBX USDM page](https://nbx.com/en/usdm) identifies NBX as EU issuer and links its EU whitepaper and terms. It describes NBX minting/redemption in the EU and daily reserve reporting.
- [Moneta USDM product page](https://moneta.global/products/usdm/) describes Moneta's USDM and reserve transparency.
- [Cardano stablecoins overview](https://cardano.org/stablecoins/) describes USDM as issued by Moneta and reserve-backed; it does not replace issuer-of-record verification for a specific token holding.

Issuer marketing and ecosystem descriptions must not override the more specific operative terms or establish a holder's legal claim.

## Qualification status

- Public issuer distinction: **IDENTIFIED**.
- Contractual redemption conditions: **DOCUMENTED**.
- On-chain issuer-of-record binding for the observed Mainnet USDM asset: **NOT ESTABLISHED**.
- Holder-specific redemption eligibility: **NOT ESTABLISHED**.
- Live, executable redemption / cleared USD evidence: **NOT ESTABLISHED**.
- USD/USDM source qualification under Option B: **NOT QUALIFIED**.
- EEV approval / first Issue: **UNCHANGED — BLOCKED**.

## Next read-only research gate

1. Obtain and inspect the NBX EU whitepaper (including machine-readable XHTML/iXBRL) and the corresponding Moneta operative terms / whitepaper.
2. Identify authoritative issuer-of-record evidence and whether it is represented in mint/issuance transactions, token policy configuration, registry data, or issuer-maintained records.
3. Verify the exact current Mainnet USDM policy and asset against official issuer documentation, while keeping issuer identity separate from token identity.
4. Determine whether any public, machine-readable redemption quote / status endpoint exists. If none exists, document the limitation; do not substitute reserve NAV, oracle reserve attestation, DEX spot, or marketing claims.
5. Keep the two issuer obligations and reserve pools separate in all evidence and valuation models.

## Scope guard

No assumptions of universal 1 USDM = 1 USD; no reserve NAV treated as unit price; no token identity substitution; no new economic coefficients or thresholds; no Oracle schema, `OracleQuote`, `Economic.totalUsdmValue`, MintPolicy, Kernel, V3, Reveal, Materios, EEV or R1/Kc changes. No issuer contact, account creation, KYC, redemption request, transaction, signature, deployment or approval was performed.
