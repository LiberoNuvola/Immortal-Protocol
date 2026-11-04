# IMMORTAL Application Registry & Integration Boundary

**Status:** living ecosystem registry  
**Updated:** 4 November 2026  
**Canonical catalogue:** `web/ecosystem.html`

## Purpose

The IMMORTAL portal lists independent applications built for, or being integrated with, the IMMORTAL ecosystem. A catalogue entry is a navigation and discovery record. It is **not** by itself proof of protocol conformance, deployment qualification, economic authorization, or production readiness.

## Architectural rule

```text
IMMORTAL
  universal economic semantics, invariants, obligations and EXP boundaries
      |
      +-- application-specific adapters and interfaces
              |
              +-- PRE-RICH (first application; Cardano)
              |
              +-- Arb Agent (separate wallet companion; experimental)
```

- IMMORTAL remains the source of universal economic semantics and applicable normative constraints.
- Adapters translate protocol requirements into concrete execution environments; they do not acquire economic authority by doing so.
- Applications specialize their own workflows and policy within their application boundary.
- Applications are peers in the ecosystem, not parent/child dependencies. PRE-RICH is not a dependency or feature of Arb Agent, and Arb Agent does not implement PRE-RICH policy.
- The portal is a directory and public information surface. It must not become a shared wallet execution context.

## Application entries

### PRE-RICH

- **Role:** first application in the IMMORTAL ecosystem; Scratch & Win application.
- **Execution environment:** Cardano, through the Cardano adapter.
- **Policy boundary:** PRE-RICH owns its application-specific game mechanics; these must not be promoted into universal IMMORTAL constants.
- **Portal entry:** `web/ecosystem.html` → PRE-RICH DApp; `web/index.html` → Launch PRE-RICH DApp.
- **Status representation:** current application; public DApp entry exists. This registry does not upgrade any open Preprod, conformance, or deployment gate.

### Arb Agent

- **Role:** independent Wallet Intelligence & Execution Companion.
- **Source repository:** [PRE-RICH-AEP-Arb-Agent](https://github.com/LiberoNuvola/PRE-RICH-AEP-Arb-Agent/tree/Immortal-Protocol), branch `Immortal-Protocol`.
- **Application boundary:** wallet-context observation and decision-support workflows. It is not a PRE-RICH feature and does not own or redefine IMMORTAL economic semantics.
- **Initial qualification scope:** W1 read-only CIP-30 provider observation.
- **Custody and authority:** private keys remain in the wallet; signing requires wallet-controlled user consent. The initial W1 scope does not sign or submit transactions and does not automate actuation.
- **Current integration status:** experimental registration only. Runtime publication, dedicated origin verification, wallet conformance and any broader execution capability remain open.
- **Portal entry:** source repository only until a dedicated runtime origin has been deployed and qualified. Do not add an iframe or a guessed launch URL.

## Origin and wallet security boundary

- The public IMMORTAL portal and an application that requests a CIP-30 wallet connection must not be treated as interchangeable origins.
- Do not use a GitHub Pages project path as an origin-isolation boundary: different paths under the same hostname remain the same web origin.
- Arb Agent must be launched only from its eventual verified, dedicated HTTPS origin. The final hostname must be recorded and checked before enabling wallet connection.
- Do not place wallet-provider discovery, `window.cardano` access, `enable()`, or signing code in the IMMORTAL catalogue page.
- The browser extension is only a launcher. It must point to the exact verified Arb Agent host after deployment; until then it remains a safe placeholder.
- Wallet signing and custody stay with the wallet. The portal and Arb Agent do not collect seed phrases or private keys.

## Required fields for future application registrations

Every new application entry should declare:

1. Name, source repository, maintained branch and version/commit.
2. Application purpose and explicitly excluded responsibilities.
3. IMMORTAL semantic/EXP surfaces consumed, with evidence rather than assumptions.
4. Adapter and external interface dependencies.
5. Custody, authorization, signing and execution boundaries.
6. Conformance, deployment and evidence status, separately.
7. Verified runtime origin and launch target, or an explicit statement that no launch is available.

The site must keep **application registration**, **protocol conformance**, **deployment qualification**, and **permission to actuate** as separate claims.
