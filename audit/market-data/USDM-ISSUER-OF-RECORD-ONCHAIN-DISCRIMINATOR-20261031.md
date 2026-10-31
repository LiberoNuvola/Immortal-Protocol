# USDM Issuer-of-Record: On-chain Discriminator Research — 2026-10-31

## Scope

Read-only source qualification for the Cardano Mainnet USDM asset used in the IMMORTAL market-data work. No protocol, oracle, valuation, EEV, R1/Kc, V3, Reveal, or Materios changes. No transactions, signatures, deployments, issuer contact, or redemption attempt.

## Exact asset identity

Moneta's official Policy ID page publishes the following identifiers:

- Policy ID: `c48cbb3d5e57ed56e276bc45f99ab39abe94e6cd7ac39fb402da47ad`
- Asset name (hex): `0014df105553444d`
- Fingerprint: `asset12ffdj8kk2w485sr7a5ekmjjdyecz8ps2cm5zed`

The same full asset identity is used in Moneta's developer documentation. These identifiers establish the Cardano native asset identity; they do not, by themselves, establish the legal issuer-of-record or reserve liability for a particular unit/holding.

## Primary-source findings

### 1. NBX terms distinguish two legal issuance obligations

NBX USDM Terms, updated 17 July 2026, state that:
- Within the EEA, USDM is issued by Norwegian Block Exchange AS (NBX) as NBX-issued USDM.
- Outside the EEA, USDM is issued separately by Moneta Digital LLC as Moneta-issued USDM.
- The two issuance obligations and their reserves are legally/economically distinct, with no cross-liability or cross-coverage.
- NBX says it verifies issuer-of-record before executing a redemption.
- NBX-issued USDM is redeemable at par by eligible holders subject to issuer verification, account/KYC/AML/CTF/sanctions and applicable terms.
- For Moneta-issued USDM, NBX is not obliged to facilitate redemption; if it does, it will not fund/settle until corresponding cleared USD has first been received from Moneta or its reserve.

Primary source: https://nbx.com/en/usdm-terms

### 2. Moneta publishes the exact asset identifiers

Moneta's Policy ID page identifies the exact policy ID, asset name and fingerprint above as its USDM asset. Its developer page repeats the full asset ID and recommends policy-ID filtering for technical integration.

Primary sources:
- https://moneta.global/policy-id/
- https://moneta.global/developers/

### 3. NBX public USDM page links a current whitepaper, but does not publish a machine-readable issuer binding in the page text

NBX's USDM page links both a PDF whitepaper and a machine-readable XHTML/iXBRL whitepaper. The page describes NBX as EU co-issuer and Moneta as the main issuer/rightsholder. The linked machine-readable archive was not retrievable in this inspection environment, so no claim is made about its detailed contents.

Primary source: https://nbx.com/en/usdm

## Key finding

**Issuer-of-record remains unbound to an individual on-chain holding by the public evidence inspected.**

There is an important asymmetry:
- Moneta's public technical documentation maps the exact native asset identity to USDM.
- NBX's current legal terms distinguish NBX-issued and Moneta-issued USDM and require issuer-of-record verification before redemption.
- The public pages inspected do not provide a deterministic, independently verifiable mapping from a Cardano UTxO / token lot / mint transaction to the applicable issuer-of-record and reserve liability.

Therefore, policy ID + asset name + fingerprint are necessary asset-identity checks, but are not sufficient evidence of issuer-of-record, reserve backing, or holder-specific redemption rights. Do not infer issuer solely from the holder's current jurisdiction, wallet location, DEX pool, token metadata, ticker, or a market price.

## What would close this evidence gap

A future evidence-only gate should seek an issuer-published, auditable binding with at least:
1. A precise definition of issuer-of-record for fungible USDM units when the same Cardano asset identity is used.
2. The authoritative on-chain discriminator (e.g. mint transaction / issuance batch / address / registry mapping) and a reproducible way to verify it from Cardano ledger data.
3. A signed or otherwise authenticated issuer statement linking the discriminator to NBX or Moneta and to the corresponding reserve/liability.
4. Rules for subsequent transfers, DEX swaps, pool aggregation, and commingling: whether issuer provenance is preserved, transformed, or lost at the UTxO level.
5. A holder-facing verification process and the applicable redemption route/eligibility terms.

Until then:
- Issuer-of-record binding: **NOT ESTABLISHED**
- Holder-specific redemption eligibility: **NOT ESTABLISHED**
- Live executable redemption / cleared USD: **NOT ESTABLISHED**
- Option B cross-rate as a market observation: remains observational only; it cannot establish par redemption or reserve backing.
- EEV / first Issue qualification: **UNCHANGED — BLOCKED** under existing gates.

## Sources inspected (2026-10-31)

- NBX USDM Terms (17 July 2026): https://nbx.com/en/usdm-terms
- NBX USDM page and whitepaper links: https://nbx.com/en/usdm
- Moneta Policy ID: https://moneta.global/policy-id/
- Moneta developer documentation: https://moneta.global/developers/
- CardanoScan asset page: https://cardanoscan.io/token/c48cbb3d5e57ed56e276bc45f99ab39abe94e6cd7ac39fb402da47ad0014df105553444d

## Change boundary

Documentation/evidence only. No code, schema, policy, oracle, economic constant, transaction, signature, deployment, or on-chain state changed.
