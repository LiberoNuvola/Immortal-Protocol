# IMMORTAL Ecosystem Entry Point v0.1

**Status:** DESIGN / IMPLEMENTED  
**Scope:** public web entry point

## Purpose

The IMMORTAL public web surface uses an **Ecosystem** entry point rather than presenting PRE-RICH as if it were the protocol itself.

The entry point separates:

- **IMMORTAL** — chain-neutral protocol and economic constitution.
- **Adapter** — concrete execution and observation boundary.
- **Applications** — concrete systems built on the protocol.
- **Execution environment** — the ledger or runtime used by an application.

## Current entry points

| Surface | Role |
|---|---|
| `/` | IMMORTAL Ecosystem launcher |
| `/dapp.html` | PRE-RICH application entry point |

The ecosystem launcher is intentionally lightweight and must not become an economic authority.

## Launch contract

Each application entry should expose, at minimum:

1. application identity;
2. execution environment;
3. operational status wording that does not overclaim certification;
4. a direct launch action;
5. a clear separation between protocol semantics and application-specific rules.

The current PRE-RICH launcher identifies itself as a Cardano Preprod application and links directly to `/dapp.html`.

## Trust boundary

The launcher:

- does not create transactions;
- does not construct economic witnesses;
- does not infer economic health;
- does not replace the authenticated application or Cardano adapter;
- does not present B1 as B3;
- does not claim production certification.

It is a navigation and public-observability surface.

## Ecosystem growth

Additional applications may be added as separate cards/entry points without changing IMMORTAL semantics.

Application-specific economics remain owned by the application/profile layer. The launcher may describe those applications, but it must not turn their parameters into universal IMMORTAL rules.

## Relationship to protocol declarations

The launcher is distinct from the **Protocol Declaration Layer**.

The declaration layer exposes observed protocol activity and evidence. The ecosystem launcher provides navigation and application discovery. A future implementation may consume declaration data, but the launcher must not fabricate lifecycle or economic state from UI intent.
