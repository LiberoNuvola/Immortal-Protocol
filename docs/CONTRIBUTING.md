# Contributing to PRE-RICH

> **Scope:** PRE-RICH application contribution guidance. It does not create universal IMMORTAL semantics; universal authority remains under `00-normative/`.

Thank you for contributing to PRE-RICH.

PRE-RICH is an open protocol/framework. **Scratch & Win is its first concrete implementation, not the whole protocol.**

## Before contributing

Read these documents first:

1. [`README.md`](../README.md)
2. [`ROADMAP.md`](ROADMAP.md)
3. [`IMMORTAL Constitution`](00-normative/01_CONSTITUTION_FINAL.md)
4. [`PRE-RICH Game Economy`](../PRE-RICH/docs/GAME-ECONOMY.md)
5. [`PRE-RICH Complete System Specification`](../PRE-RICH/docs/PRE-RICH-COMPLETE-SYSTEM-SPECIFICATION.md)
6. [`IMMORTAL normative specifications`](00-normative/) and [`PRE-RICH Economic Algorithm`](../PRE-RICH/docs/ECONOMIC-ALGORITHM.md)
7. [`IMMORTAL Conformance Specification`](00-normative/07_CONFORMANCE_SPECIFICATION_FINAL.md), [`PRE-RICH Conformance`](../PRE-RICH/docs/CONFORMANCE.md) and [`Constitution & Conformance Gap Matrix`](03-audit/CONSTITUTION-GAP-MATRIX.md)
8. [`Cardano Adapter specification`](../Adapter/CARDANO/docs/CARDANO-ADAPTER-COMPLETE-SYSTEM-SPECIFICATION.md)

The repository deliberately distinguishes documented, implemented, verified, experimental and target states.

## Contribution principles

- Prefer extending PRE-RICH itself over creating disconnected reimplementations.
- Preserve **Constitution → Specifications → Implementation → Tests / Proofs**.
- Do not silently change normative economic policy in implementation code.
- Do not promote candidate, simulation or experimental parameters to normative status without an explicit decision.
- Preserve the distinction between B1 Authorized Publisher and the B3 publisher-independent target.
- Keep changes reviewable and reproducible.
- Treat implementation gaps as implementation work, not as permission to redefine the protocol.

## Economic and protocol changes

Before changing normative economic rules:

- identify the affected normative source;
- identify the relevant decision-register entry;
- explain whether the change is normative, implementation-only, experimental or documentation-only;
- update affected specifications and conformance documentation together when appropriate;
- do not use implementation changes to implicitly settle an OPEN policy choice.

The current frozen economic baseline includes KA=8, KC=4, KD=4. The hysteresis semantic principle is CLOSED; remaining quantitative validation is implementation/evidence work.

The previously open application-policy items are closed in the current PRE-RICH baseline. Jackpot payout mode is full current locked-balance payout exactly once; Jackpot funding has no fixed allocation rate; and expiry uses the state-derived `preRichExpiryPolicyV1` mechanism, with V1 bounds of 2 hours minimum / 300 days maximum as application parameters. Remaining work is implementation/conformance/evidence unless a new explicit policy decision is adopted.

## Development

```bash
npm install
npm run dev
npm run build
npm run test:predeploy
```

These commands do not constitute complete protocol conformance or validator-level verification.

## Pull requests

A useful pull request should contain:

- concise explanation of the change;
- motivation and affected protocol area;
- relevant documentation updates;
- commands/tests actually run;
- known limitations or evidence gaps;
- explicit disclosure when a change is experimental or target-only.

Keep unrelated refactors out of focused protocol changes where practical.

## Documentation changes

Documentation is part of protocol auditability.

- preserve the normative source hierarchy;
- update cross-references and relative links;
- avoid duplicate competing sources of truth;
- distinguish historical material from current policy;
- do not claim implementation conformance without evidence.

## Security

Do not disclose a suspected vulnerability in a public issue. Follow [`SECURITY.md`](SECURITY.md) for private reporting guidance.

## License

The project license is finalized separately from this contribution guide. Contributions will be subject to the repository license in force when they are accepted.
