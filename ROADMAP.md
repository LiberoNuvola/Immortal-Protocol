# IMMORTAL Roadmap

**Status:** Experimental / Open Source / Research & Development  
**Baseline:** September 2026

The roadmap is organized by layer. A milestone in one layer must not silently redefine another.

## 1. Universal IMMORTAL

### Foundation — current

- [x] Constitution
- [x] Universal economic model
- [x] Economic kernel and fixed-point model
- [x] State-transition specification
- [x] Conservation/invariant specification
- [x] Conformance specification
- [x] Formal proof register
- [x] Adversarial/game-theoretic analysis
- [x] Certification contracts
- [x] Audit and residual-obligation registers
- [x] Public documentation architecture

### Next

- [ ] Consolidate canonical cross-links
- [ ] Expand machine-readable conformance vectors
- [ ] Complete implementation-level conformance evidence
- [ ] Establish reproducible certification workflow
- [ ] Formalize additional composition and upgrade evidence

## 2. Adapter layer

### Cardano — current

- [x] Adapter boundary specification
- [x] Canonical economic-state representation
- [x] Observation and serialization primitives
- [ ] Complete adapter conformance evidence
- [ ] Reproducible adapter test vectors
- [ ] Deployment-specific evidence

### Future adapters

New chains or execution environments may be added without changing IMMORTAL semantics, provided they satisfy the adapter conformance contract.

## 3. Application layer

### PRE-RICH — current

- [x] Application constitution
- [x] Application specification
- [x] Application economic algorithm
- [x] Application game economy
- [ ] Complete implementation conformance
- [ ] Complete deployment evidence
- [ ] Independent security review

### Future applications

Additional applications may specialize IMMORTAL with their own economic policy, assets, lifecycle and governance, subject to explicit application-level specifications.

## 4. Governance and open-source process

- [x] Governance workflow defined
- [x] Anti-oligarchy principles recorded
- [x] Governance/evidence distinction recorded
- [x] Licensing baseline recorded
- [ ] Final repository-wide SPDX/provenance audit
- [ ] Public contribution workflow hardened
- [ ] Reproducible release process

## 5. Verification gates

A claim should advance through:

```text
DESIGN
  ↓
FORMALIZATION
  ↓
PROOF / MODEL
  ↓
IMPLEMENTATION
  ↓
CONFORMANCE EVIDENCE
  ↓
INDEPENDENT REVIEW
  ↓
DEPLOYMENT EVIDENCE
```

Publishing documentation is not equivalent to passing the final deployment gate.

## 6. Experimental declaration

IMMORTAL is intentionally presented as experimental.

There is no claim that the repository has a permanent team, a privileged operator, a guaranteed service provider or a unilateral owner of the protocol's economic semantics.

The project can evolve through open contribution, review, forks and competing implementations.
