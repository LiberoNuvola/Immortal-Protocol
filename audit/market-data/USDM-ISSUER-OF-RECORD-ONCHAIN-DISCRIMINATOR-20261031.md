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


## 4. Additional primary-source inconsistency identified

A Moneta-authored article dated 6 May 2026 states that USDM is issued by Moneta Digital LLC and that every USDM token in circulation was minted by Moneta's Cardano-native smart contract. It repeats the same policy ID, asset name and fingerprint.

Source: https://moneta.global/learn/usdm-core-fundamentals/

This statement is not readily reconcilable with NBX's 17 July 2026 Terms, which state that NBX issues a separate NBX-issued USDM obligation within the EEA, distinct from Moneta-issued USDM outside the EEA. NBX's USDM page also links an EU issuer whitepaper updated 24 September 2026.

This is now classified as a **PRIMARY-SOURCE ISSUER-SCOPE CONFLICT / UNRESOLVED**, not merely an absent public mapping. The evidence reviewed does not establish whether:
- NBX's EEA issuance uses the same minting policy and asset identity with a different reserve/liability attribution;
- NBX's issuance is a distribution/redemption arrangement while Moneta remains the sole on-chain minter;
- there is a mint-transaction, issuance-batch, address, or other ledger-level discriminator; or
- the Moneta article's “every token” statement predates or does not account for the NBX EU issuer arrangement.

Do not choose among these interpretations without authoritative evidence. The September 2026 NBX EU issuer whitepaper and a reproducible mint-history analysis are required next. Cardano token-security documentation confirms that a policy ID identifies the minting policy, and transfers do not execute that policy; it does not establish legal reserve liability or holder-specific issuer status.

Additional sources:
- Moneta-authored USDM Core article (6 May 2026): https://moneta.global/learn/usdm-core-fundamentals/
- NBX USDM page, including 24 September 2026 EU issuer whitepaper links: https://nbx.com/en/usdm
- Cardano Developer Portal, Token Security: https://developers.cardano.org/docs/developers/curriculum/smart-contracts/security/vulnerabilities/token-security/

Updated status:
- Public issuer narratives consistent with one another: **NO — CONFLICT**
- Deterministic on-chain issuer-of-record binding: **NOT ESTABLISHED**
- Option B: **NOT QUALIFIED for reserve/redemption inference**
- EEV / first Issue: **UNCHANGED — BLOCKED**.


---

## 5. Follow-up: NBX H1 2026 report narrows the apparent issuer conflict

The primary NBX H1 2026 report (published 18 September 2026 through the Oslo Børs disclosure channel) states explicitly:
- NBX is the **sole issuer of USDM within the EEA**; Moneta Digital LLC separately issues USDM outside the EEA.
- NBX continued to mint and redeem NBX-issued USDM during H1 2026.
- NBX-issued USDM reserves are held in USD with Sparebanken Norge and an Amundi USD money market fund; the reserve value is reported daily on Cardano by Charli3.
- At 30 June 2026, NBX reported USD 3,879,541 of safeguarded assets and USD 3,865,909 of corresponding NBX-issued USDM redemption liability, presented gross and not offset.
- The CEO's report states that the NBX whitepaper had been filed with Finanstilsynet in summer 2025 and that registration was still in process at the H1 reporting date.

Primary issuer report (49-page H1 report, published 18 September 2026):
https://storage.mfn.se/c/aHR0cHM6Ly9hcGkzLm9zbG9ib3JzLm5vL3YxL25ld3NyZWFkZXIvYXR0YWNobWVudD9tZXNzYWdlSWQ9NjgyNzI1JmF0dGFjaG1lbnRJZD0zMzM2MTA/nbx-h1report-2026.pdf?news-id=b8befff0-b652-5b30-8d95-7bc796bf8612

Relevant report passages:
- Issuer distinction and reserve reporting: pages 8–9 (PDF pages 8–9).
- Safeguarded reserve and redemption liability: Note 5, PDF page 44.
- NBX whitepaper registration still in process at H1 reporting date: CEO letter, PDF page 4.

The NBX public explainer separately states that mint/burn data and total supply are stored on-chain in a special "counter UTXO", and describes NBX as EEA issuer and Moneta as US issuer:
https://nbx.com/en/whatisusdm

### Corrected interpretation of the earlier source conflict

The Moneta article's statement that every USDM token was minted by Moneta's Cardano-native smart contract is not sufficient to contradict NBX's separately documented legal issuance and reserve obligations. It may describe technical contract ownership/operation rather than the legal issuer-of-record for every issuance. The inspected sources do not settle that distinction. Accordingly, the previous classification is refined:

- Legal issuer split by jurisdiction: **CORROBORATED by NBX Terms, NBX H1 report, and NBX's own explainer**.
- Moneta technical minting-contract role vs NBX EEA legal issuance: **NOT RECONCILED**.
- Exact on-chain mechanism for distinguishing NBX-issued from Moneta-issued quantities: **NOT ESTABLISHED**.
- NBX aggregate reserve/liability disclosure at 30 June 2026: **DOCUMENTED**, but historical and aggregate; H1 report financial statements are interim/unaudited and do not prove current reserve value or backing of any particular UTxO.
- Holder-specific issuer-of-record / redemption eligibility: **NOT ESTABLISHED**.

The reported difference between safeguarded assets and redemption liability is USD 13,632 at 30 June 2026. This is only arithmetic on NBX's aggregate reported figures; it is not a haircut, buffer, protocol parameter, available liquidity calculation, or evidence for any particular pool/UTxO.

### Next reproducible evidence gate

1. Obtain and parse the NBX EU Issuer whitepaper dated 24 September 2026 (PDF and XHTML/iXBRL). The official page exposes both links, but direct retrieval failed in this inspection environment:
   https://nbx.com/en/usdm
2. Resolve the "counter UTxO" from authoritative NBX/Moneta documentation: policy ID, asset name, script/address, datum schema, update rules, and how the counter represents total supply and burns.
3. Read the counter UTxO and complete mint/burn transaction history from independent Cardano ledger sources; preserve transaction hashes, slots, block numbers, output references, datum CBOR/hash and raw evidence.
4. Determine whether mint/burn events encode issuer identity, or whether NBX/Moneta maintain a separate authenticated off-chain issuance registry required to assign issuer-of-record.
5. Reconcile issuance totals with the issuer's own reporting periods and reserve/liability figures. Do not treat a matching aggregate total as holder-level provenance.

No policy ID alone, address clustering, geographic inference, or market data may substitute for an authenticated issuer mapping.

Updated status:
- Legal EEA/US issuer split: **CORROBORATED**
- Technical minter/operator attribution: **OPEN**
- Per-issuance / per-holding issuer discriminator: **OPEN**
- Current reserve qualification / holder redemption proof: **NOT ESTABLISHED**
- Option B remains observational only; EEV / first Issue remains blocked.


---

## 6. Follow-up: public counter-UTxO claim, exact asset policy, and explorer inventory

### 6.1 NBX EU issuer whitepaper link verified; payload not retrievable here

The current NBX USDM page identifies an "USDM EU Issuer" whitepaper updated 24 September 2026 and exposes both PDF and machine-readable XHTML/iXBRL links. The links resolve to a PDF and a ZIP archive on the site's CDN, but both payloads returned non-retryable retrieval errors in this inspection environment. The archive filename identifies LEI `5493004WNVZP9EMYI834` and a 15 September 2026 document build; the page itself labels the whitepaper as updated 24 September 2026.

Source page: https://nbx.com/en/usdm
PDF link: https://cdn.prod.website-files.com/6152dfaed2ce58d94ef37b88/6ab4e90ceb46558d48fc093a_USDM%20White%20Paper%20-%20Modified%20version%202026-09-24.pdf
XHTML/iXBRL ZIP: https://cdn.prod.website-files.com/6152dfaed2ce58d94ef37b88/6ab4e9329383c7b9695de62d_WhitePaper-USDM-5493004WNVZP9EMYI834-NO-260915122610-en.zip

No content-level claims are made about either inaccessible file.

### 6.2 NBX explainer identifies the counter UTxO concept, not its locator or issuer fields

NBX's public "What is USDM?" explainer says:
- USDM is minted as a Cardano native token using a multisignature smart contract and oracle attestation system.
- minting is governed by an oracle system;
- mint/burn data and total supply are stored on-chain in a special "counter UTxO".

Source: https://nbx.com/en/whatisusdm

The explainer does not publish the counter UTxO address, script hash, datum schema, datum CBOR, update rules, or whether the counter distinguishes NBX and Moneta issuance. Thus this remains a documented lead, not a reproducible chain locator.

### 6.3 Exact asset identity implies one policy identity, not two independent policy IDs

Moneta's official policy page and developer docs publish:
- Policy ID: `c48cbb3d5e57ed56e276bc45f99ab39abe94e6cd7ac39fb402da47ad`
- Asset name: `0014df105553444d`
- fingerprint: `asset12ffdj8kk2w485sr7a5ekmjjdyecz8ps2cm5zed`

Cardano's developer documentation explains that a token's policy ID is the hash of its minting-policy script; mint and burn transactions execute that policy. Therefore, the exact same policy ID cannot represent two different minting-policy scripts. It does not, however, identify the legal entity controlling or operating the script, nor does it establish reserve liability. If NBX-issued and Moneta-issued USDM share this exact asset identity, their legal separation must be implemented through some common-policy governance/authorization arrangement and/or transaction-level or off-chain issuer attribution, not by separate policy IDs.

Potential on-chain evidence fields to inspect (not yet verified as present): mint transaction redeemer, spending inputs (including counter UTxO), reference inputs, output datum, transaction metadata, signer witnesses, and any oracle-attestation reference. A transaction's signers or addresses alone must not be treated as issuer attribution absent an issuer-authenticated mapping.

Sources:
- https://moneta.global/policy-id/
- https://moneta.global/developers/
- https://developers.cardano.org/docs/developers/curriculum/native-tokens/minting-policies/
- https://developers.cardano.org/docs/developers/curriculum/smart-contracts/security/vulnerabilities/token-security/

### 6.4 Explorer inventory as discovery evidence only

Cardanoscan's USDM asset page, inspected 31 October 2026, displayed:
- creation time: 17 March 2024 00:21:21 UTC;
- total supply: approximately 11.52 million USDM;
- 423 mint transactions;
- 975,336+ total asset transactions.

Source: https://cardanoscan.io/token/c48cbb3d5e57ed56e276bc45f99ab39abe94e6cd7ac39fb402da47ad0014df105553444d

These are explorer-indexed, time-sensitive figures, not an independently reconstructed mint/burn ledger. They provide a bounded starting inventory for subsequent transaction enumeration. They do not identify the counter UTxO or issuer-of-record for any issuance.

### 6.5 Correct technical inference

The single policy ID is a strong technical constraint:
- We should not expect separate NBX and Moneta minting policy IDs for the same exact USDM asset.
- If the legal issuers share the same asset identity, issuer differentiation (if represented on-chain) must be encoded in transaction context or a shared counter/registry, or be supplied by an authenticated off-chain issuance record.
- Because a Cardano minting policy executes with a redeemer and transaction context (not a datum), the counter's spending datum and transaction references are candidate evidence surfaces to inspect, but their issuer semantics must be proven from the actual deployed policy and authoritative issuer documentation.

No script, counter address, datum schema, redeemer semantics, issuer-specific mint classification, or on-chain history has been established by this section.

Updated status:
- NBX EU issuer whitepaper links: **IDENTIFIED; FILE CONTENT NOT RETRIEVED**
- Counter UTxO concept: **DOCUMENTED BY NBX**
- Counter UTxO locator/schema: **NOT ESTABLISHED**
- Exact token policy ID / asset name: **CONFIRMED**
- Same-policy legal issuer separation mechanism: **OPEN**
- Cardanoscan mint count (423): **INDEXER DISCOVERY LEAD ONLY**
- Per-issuance/per-holding issuer discriminator: **NOT ESTABLISHED**
- Current reserve qualification / holder redemption proof: **NOT ESTABLISHED**
- Option B remains observational only; EEV / first Issue remains blocked.


---

## 7. Major evidence update: NBX EU whitepaper retrieved and parsed

The official NBX page labels the EU issuer whitepaper as updated 24 September 2026 and links both PDF and XHTML/iXBRL ZIP. The PDF was successfully retrieved and parsed through an independent document extraction path. The XHTML/iXBRL ZIP remains unavailable in this inspection environment.

Official landing page: https://nbx.com/en/usdm
PDF: https://cdn.prod.website-files.com/6152dfaed2ce58d94ef37b88/6ab4e90ceb46558d48fc093a_USDM%20White%20Paper%20-%20Modified%20version%202026-09-24.pdf
XHTML/iXBRL ZIP: https://cdn.prod.website-files.com/6152dfaed2ce58c94ef37b88/6ab4e9329383c7b9695de62d_WhitePaper-USDM-5493004WNVZP9EMYI834-NO-260915122610-en.zip

The PDF's cover identifies it as a draft/modified version notified to Finanstilsynet on 24 September 2026 and explicitly states that it has not been approved by any competent authority in an EU Member State. This is an issuer-authored disclosure, not regulatory approval.

### 7.1 Legal issuer / technical operator model now reconciled

The whitepaper states:
- NBX is the sole legal issuer of USDM within the EEA; Moneta is the separate legal issuer outside the EEA.
- NBX and Moneta are parallel, legally and economically distinct issuers, not co-issuers of the same liability.
- Moneta developed USDM and owns the smart contracts used for minting and burning. NBX relies on Moneta's participation in the shared smart contracts.
- For NBX issuance, NBX constructs and signs a mint transaction, sends it to Moneta, and Moneta applies the required co-signature and delivers the minted USDM to NBX's registered Cardano address. NBX transfers matching USD into the EU NBX USDM Reserve and sends transfer evidence to Moneta.
- The whitepaper says the Moneta co-signing/contract role is an operational dependency and does not make Moneta the legal issuer or reserve-liability bearer for NBX-issued USDM.

This resolves the earlier apparent conflict at the legal/technical role level: one shared Moneta-owned/co-controlled minting contract can serve two parallel legal issuers. The asset does not need separate policy IDs for each issuer.

### 7.2 Counter UTxO: what it stores, and what it does not establish

Section 3.2 says the counter UTxO datum stores total USDM outstanding. Mint and burn transactions spend the counter UTxO and add/subtract the minted/burned amount. It also describes controller-NFT authorization, reserve-oracle checks, a no-USDM-input condition for minting, a specified destination address, and protocol lockdown protection.

Crucially, the whitepaper does **not** state that the counter datum itself stores issuer-specific balances. Instead, issuer attribution is described separately in Sections 3.1 and 4.4 as a source-attribution methodology based on:
- internal issuance controls;
- the relevant mint transactions; and
- subsequent on-chain transaction history.

The whitepaper says NBX may attribute a UTxO wholly to NBX, wholly to Moneta, or in defined shares to both. If attribution cannot be conclusively established, redemption of the unresolved portion is deferred until attribution is established or corresponding settled Moneta funds have been received. This means the counter UTxO is a global supply counter, not (on the evidence disclosed) a self-contained issuer-provenance register.

### 7.3 NBX mint path

Section 4.3 describes two NBX customer paths:
1. NBX may draw NBX-issued/NBX-attributable USDM from its internal liquidity pool; this does not change total supply or the reserve.
2. If pool liquidity is insufficient, NBX initiates on-chain minting after transferring corresponding USD into the EU NBX USDM Reserve and obtaining reserve verification. NBX constructs/signs the transaction and Moneta co-signs it under the shared contract, then USDM is delivered to NBX's registered Cardano address.

This creates a plausible on-chain starting point for NBX-origin lots (the registered NBX address), but the whitepaper does not publish that address or the complete attribution algorithm. Do not infer the address from a transaction explorer without issuer-authenticated binding.

### 7.4 Redemption and mixed-origin UTxOs

Section 4.4 states that NBX determines issuer attribution by reference to relevant mint transactions and subsequent on-chain transaction history. A UTxO can be fully NBX-attributable, fully Moneta-attributable, or split into defined shares. For mixed-origin UTxOs, NBX redeems the NBX share from the EU NBX Reserve and the Moneta share only after cleared Moneta funds have arrived. Unresolved shares are deferred.

Section 5.1 states that subsequent holders inherit the redemption right applicable to the issuer attribution of the USDM they hold, subject to eligibility, issuer-attribution verification and AML checks. It also says NBX is not generally obliged to track or determine provenance of holder balances except where required for issuer-attribution verification, redemption, AML/CFT or applicable law.

Implication: a third-party DEX/AMM observer cannot assume that a pooled USDM balance is fully NBX-attributable, fully Moneta-attributable, or readily redeemable. A public price or aggregate supply number cannot establish the issuer composition of a specific pool UTxO.

### 7.5 On-chain exemplar: counter continuation matches a USDM mint

Cardanoscan's transaction detail for:
https://cardanoscan.io/transaction/f3f62b62dc7b3a4dc6036b6e7810719597d246d7df70c92253fed6f14f7e4e4d?tab=tokenmint

shows a mainnet transaction labelled "USDM Mint", timestamp 11 March 2026 00:45:39 UTC, block 13,143,082, minting 25,050.000000 USDM.

The same transaction:
- consumes a UTxO at counter-script address `addr1wxwgnqps79qf8h4dnvrfr5w9qsepkycqr0rtj7802n7uueqshn6tg` carrying one `USDM_COUNT` singleton and datum hash `d27836d660b1140d986db27ab9344e93a88d3f50c93ec6aced53edcdd623092e`;
- recreates the singleton at the same address in output #1 with datum hash `e80fb60dd9af1d73748189bf32146583249bdd2458fb94a4ff9fd5c69abdca93`;
- the datum CBOR shown by the explorer changes from `d879821b00000e760a10c140d87980` to `d879821b00000e7bdf296bc0d87980`.

The first integer in those CBOR data decodes to 15,900,137.8 and 15,925,187.8 respectively (USDM units after dividing by 1,000,000), a delta of exactly 25,050.0 USDM. This is a single reproducible exemplar that the counter datum tracks aggregate outstanding supply and advances by the mint amount. It does **not** identify the issuer-attributed share of that mint.

### 7.6 Historical counter locator from DeFiLlama adapter — not current-state proof

A DeFiLlama adapter commit dated 18 October 2024 identifies the counter NFT asset ID as:
`e319d8e6629ff7991c8ae4f8aec2e0f10463ebdf29b57d26d34914f65553444d5f434f554e54`
(policy `e319d8e6629ff7991c8ae4f8aec2e0f10463ebdf29b57d26d34914f6`, asset name `5553444d5f434f554e54` = `USDM_COUNT`), and a then-used counter address:
`addr1wyl82v9qy06hsz50hqqdy0u6xw9hdewy7twjahgek2tpp7c0qajez`.

The March 2026 Cardanoscan exemplar above shows the singleton at a different address (`addr1wxwgn...`). The 2024 adapter address must therefore be treated as historical/possibly superseded, not a current locator. A full continuity trace and current singleton UTxO still need to be established.

Source commit: https://github.com/DefiLlama/DefiLlama-Adapters/commit/730af7bbfc6858103a1ab3a8fae612a70220d7aa
Current adapter file: https://raw.githubusercontent.com/DefiLlama/DefiLlama-Adapters/master/projects/moneta/index.js

### 7.7 Open technical evidence gaps after this discovery

1. Retrieve and inspect the machine-readable XHTML/iXBRL archive (PDF content is now available).
2. Identify the current `USDM_COUNT` singleton UTxO and reconstruct its full successor chain from the latest indexed block.
3. Retrieve the deployed minting policy, count validator and controller NFT policy; verify script hashes against the deployed policy IDs and the whitepaper's described rules.
4. Reconstruct all mainnet USDM mint/burn events and join each to its counter input/output, redeemer, transaction metadata, controller-NFT evidence and destination address.
5. Obtain the exact NBX registered Cardano address and Moneta issuance destination(s) from issuer-authenticated documentation or the whitepaper's machine-readable attachments/issuer record.
6. Obtain NBX's actual source-attribution methodology (algorithm, handling of merges/splits, rounding, missing history and DEX pool commingling) or an issuer-authenticated attribution feed. The whitepaper names the methodology but does not publish enough detail to reproduce it.
7. Test a mixed-origin path end-to-end using transaction history and compare the reconstructed shares with an issuer-authenticated reference. No inferred address clustering or FIFO assumption is acceptable.

Updated status:
- Official NBX EU whitepaper PDF: **RETRIEVED AND PARSED; draft, not regulatory-approved**
- Legal issuer split: **DOCUMENTED**
- Shared minting-contract ownership/co-control by Moneta; NBX operational dependency: **DOCUMENTED**
- Counter UTxO aggregate supply role: **DOCUMENTED AND ONE MAINNET MINT DELTA RECONCILED**
- Historical counter singleton identity/address: **IDENTIFIED; address changed by March 2026**
- Current counter singleton UTxO: **NOT YET ESTABLISHED**
- Issuer attribution method: **DESCRIBED AT HIGH LEVEL; NOT REPRODUCIBLE FROM PUBLIC MATERIALS**
- Per-UTxO issuer share for arbitrary pool balances: **NOT ESTABLISHED**
- Holder redemption eligibility / current reserve qualification: **NOT ESTABLISHED**
- Option B remains observational only; EEV / first Issue remains blocked.
