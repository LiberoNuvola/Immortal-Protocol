# Agent A — R1 signed-authority vs proof-verification boundary

**Date:** 2026-11-15  
**Branch:** work/immortal-green-closure  
**Classification:** READ-ONLY SECURITY / CERTIFICATION-BOUNDARY AUDIT — NON-NORMATIVE; NO IMPLEMENTATION  
**Scope:** Determine exactly what the current Preprod signed Issue-authority path proves about R1/Kc/Ω and what remains an asserted-but-unverified proof obligation.

## 1. Executive finding

The current provider is stronger than a browser-supplied collection of booleans: it verifies an external signed authority envelope, binds it to exact live Cardano observations, requires the Haskell Issue decision to match the authority-signed state/action/post-state digests, checks ProtectedCapital component arithmetic, and binds the viability-certificate references to the same carrier, state hash, EEV snapshot and ProtectedCapital source.

However, this is **not yet independent verification of R1/Kc/Ω**. The current verifier validates the shape and cross-reference consistency of VC1–VC6 and E1–E10 (non-empty references and 32-byte digest formatting) but does not fetch/verify their proof contents, evaluate the characteristic predicate, derive the witness selector, enumerate or authenticate the deployment's complete Ω perimeter, or establish that every accepted successor lies in the certified kernel.

The allOmegaSuccessorsCertified field is cryptographically signed as an authority assertion and is passed through the Haskell decision. It is not independently derived from a verified Ω proof by the inspected adapter/kernel code. A valid signature establishes attribution and payload integrity under the configured key; it does not, by itself, establish the truth or completeness of the signed Ω claim.

**Disposition:** signed-authority transport and input binding are implemented; deployment-bound R1/Kc/Ω proof verification remains OPEN. First Preprod Issue remains NO-GO, also independently blocked by Agent B's B1 Registry identity P0 finding.

## 2. What the current path does establish

### 2.1 Exact live-state and EEV binding

PreprodAuthoritativeIssueProvider.ts:
- observes the exact configured B1 Pool out-reference through the Direct-USDM observation path;
- requires the exact approved tUSDM asset basket and compares the physical direct-USDM observation with the B1 datum's total-liquidity accounting field;
- observes and uniquely selects the V3 carrier and B2 control singleton;
- reconciles B1 and V3 accounting aggregates before requesting the external authority;
- requires the returned authority Pool value, preEEV, candidateEEV and timestamp to match the live direct-USDM observation.

The reader converts signed USDM sub-units to IMMORTAL reference units only by exact division; non-integral values fail closed.

### 2.2 Signed decision and state/action binding

relayer/signedIssueAuthority.js:
- verifies the canonicalized authority payload signature with the configured public key;
- separately verifies a carrier-binding signature over action class, decision reference, observation reference, state hash, action fingerprint and post-state hash;
- checks the signed payload against the exact Counter, B2 control, Pool, carrier, class, price and observation references;
- validates freshness against a current evaluation time and a positive freshness window.

HaskellIssueAdmissionProvider.ts independently runs the Haskell producer and requires its state hash, action fingerprint and post-state hash to match the authority-signed digests. It also compares action coordinates, EEV inputs, executable liquidity and ProtectedCapital components against the observed authority envelope before creating the adapter witness.

These are meaningful anti-substitution and attribution controls. They do not alone prove that the economic model or successor set is complete.

## 3. What remains a signed assertion rather than a verified proof

### 3.1 Viability-certificate validation

The current validateViabilityCertificate requires:
- id/version/model/characteristic-predicate/witness-selector/bounds references;
- a 32-byte digest for the certificate;
- VC1–VC6 records, each with a non-empty reference and 32-byte digest;
- E1–E10 records, each with a non-empty reference and 32-byte digest;
- deployment bindings for network, carrier reference, state hash, EEV snapshot and ProtectedCapital source.

It does not:
- retrieve the referenced proof/evidence artifacts;
- recompute their content digests;
- verify their proof-system statements or proof witnesses;
- check that the stated characteristic predicate and witness selector implement the intended R1 invariant;
- construct or validate a complete action inventory A(S);
- prove that the deployment's Ω is complete or soundly over-approximated;
- verify that every successor admitted by all relevant validators, governance and external-state transitions remains in Kc.

Consequently a correctly signed envelope can bind a set of well-formed proof references without the current adapter establishing the truth of those proofs.

### 3.2 Ω boolean

The signed authority payload requires allOmegaSuccessorsCertified === true. The Haskell adapter then checks that the Haskell command emits the same boolean as its input and that it is true. This proves equality of the two values, not an independent derivation of Ω completeness.

The Haskell EconomicGate.viabilityGate is explicitly a two-boolean conjunction: safePostState && allOmegaSuccessorsInCertifiedKernel. Its source comment says the predicate does not manufacture the CK1–CK8 certificate. PreRichEconomicAdmission receives this boolean as an input; it does not enumerate Ω or validate the certificate artifacts.

### 3.3 Lifecycle QNE helper

PreRichLifecycleTransition.qneAcrossOmega:
- rejects an empty witness list;
- checks each supplied witness's margin non-erosion;
- checks non-negative EEV/ProtectedCapital;
- requires lowRepresentationPreserved and lowSafe.

The list itself and both flags are supplied data. The helper's own comment assigns the caller responsibility for proving that the list is a sound over-approximation of authoritative deployment Ω. The existing lifecycle test uses synthetic witnesses constructed in the test file; it validates the predicate's behavior, not deployment completeness or authenticated runtime execution.

## 4. Test-evidence boundary

plutus/test/EconomicAdmissionTest.hs exercises successful/negative gate composition using synthetic values and explicit True/False evidence inputs. It demonstrates that the kernel rejects a false flag; it does not demonstrate that the production provider can derive the truth of a true allOmegaSuccessorsCertified flag.

plutus/test/PreRichLifecycleTransitionTest.hs constructs synthetic LifecycleOmegaWitness records and tests the QNE helper, including rejection of an empty or adverse supplied list. It does not authenticate the list, its members, the lifecycle singleton or a Cardano transaction.

These tests are valid unit/conformance evidence for their bounded predicates. They must not be promoted to proof verification or deployment certification.

## 5. Exact closure required

Before R1/Kc can be marked certified, one deployment-bound package must provide and independently validate:
1. the complete state tuple and exact Preprod starting-state references;
2. the complete accepted action inventory, including V3, every B1 PrizePool constructor, ticket NFT burn/ownership changes, expiry, lifecycle and relevant external-state transitions;
3. the exact characteristic predicate and total witness selector;
4. an authenticated Ω perimeter or sound over-approximation, including concurrent Pool spends, UTxO replacement, external truth/Oracle shocks, staleness, expiry/time and failure modes;
5. executable proof/evidence artifacts for VC1–VC6 and E1–E10, with their actual contents verified against their digests and deployment bindings;
6. transaction/ledger evidence tying the proof model to the deployed validators and singleton identities;
7. a reviewable proof that all admitted transitions preserve membership in the same Kc, while Issue remains separately admitted only when its exact post-state can absorb the full 500× obligation.

No certificate format, proof system, coefficient, RiskMode, action restriction, new B1 redeemer or validator rule is selected by this audit.

## 6. Final disposition

| Boundary | Result |
|---|---|
| External authority envelope signature | Implemented / verifier present |
| Exact Pool, carrier, B2 and Issue-input binding | Implemented at the inspected adapter boundary |
| Haskell decision equality with signed pre/action/post digests | Implemented |
| VC1–VC6 / E1–E10 proof-content verification | **Not established** |
| Ω completeness / sound over-approximation | **Not established** |
| Lifecycle QNE transaction and deployment binding | **Not established** |
| R1/Kc deployment certification | **OPEN** |
| First real Preprod Issue | **NO-GO** |

**Non-effects:** no source, test, validator, datum/redeemer ABI, workflow, wallet, signature, transaction, deployment or ledger state changed or executed by this audit.
