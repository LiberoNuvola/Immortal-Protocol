# IMMORTAL Protocol

**IMMORTAL** is a universal, chain-neutral, application-neutral economic protocol for systems that need explicit economic state, protected obligations, deterministic transitions, safety constraints and auditable evidence.

> **IMMORTAL is the protocol. Cardano is an adapter. PRE-RICH is an application.**

IMMORTAL is an experimental open-source protocol. It is not presented as a company, custodial service, financial product, or finished production system. There is no claim here of a permanent team, privileged operator, or unilateral authority.

## Start here

If you are new:

1. Read the [Executive Summary](docs/EXECUTIVE-SUMMARY.md).
2. Read the [White Paper](WHITEPAPER.md).
3. Read the [Glossary](docs/GLOSSARY.md).
4. See the [architecture](docs/README.md).

If you want the formal model:

- [Constitution](docs/00-normative/01_CONSTITUTION_FINAL.md)
- [Universal Economic Model](docs/00-normative/02_UNIVERSAL_ECONOMIC_MODEL.md)
- [Economic Kernel](docs/00-normative/03_ECONOMIC_KERNEL_FINAL.md)
- [State Transition Specification](docs/00-normative/04_STATE_TRANSITION_SPECIFICATION.md)
- [Invariants and Conservation](docs/00-normative/05_INVARIANTS_CONSERVATION_FINAL.md)
- [Conformance Specification](docs/00-normative/07_CONFORMANCE_SPECIFICATION_FINAL.md)

If you want evidence and audit status:

- [Proof Register](docs/01-formal-records/08_FORMAL_PROOF_REGISTER_FINAL.md)
- [Audit Closure Matrix](docs/01-formal-records/10_FINAL_AUDIT_CLOSURE_MATRIX.md)
- [Verification Status](docs/03-audit/VERIFICATION_STATUS.md)
- [Residual Obligations](docs/03-audit/RESIDUAL_OBLIGATION_REGISTER.md)

## Architecture

```text
                 IMMORTAL
        universal protocol semantics
                    │
                    ▼
             ADAPTER LAYER
          Cardano (current)
                    │
                    ▼
          APPLICATION LAYER
            PRE-RICH (current)
```

The universal layer defines what must be true. The adapter maps those requirements into an execution environment. The application specializes the protocol for a concrete economic system.

Application or chain-specific parameters must not silently become IMMORTAL semantics.

## Verification boundary

A mathematical theorem about the abstract model is not, by itself, a proof that a concrete implementation conforms.

IMMORTAL therefore separates:

**specification → formal result → certification requirement → implementation evidence → deployment evidence**

The repository may contain experimental implementations and proofs-of-concept. Their presence does not automatically make them normative or production-ready.

## Project status

The project is experimental and open source. The current documentation baseline is intended to make the protocol, its assumptions, its evidence boundary and its remaining implementation work inspectable.

**Do your own verification before relying on any implementation.**
