#!/usr/bin/env node

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const root = process.cwd()
const read = (path) => readFileSync(resolve(root, path), 'utf8')
const assert = (condition, message) => {
  if (!condition) throw new Error('FAIL: ' + message)
  console.log('PASS: ' + message)
}
const count = (source, pattern) => (source.match(pattern) ?? []).length

/*
 * EXP-06 / EXP-12 — existing-contract binding audit.
 *
 * This guard verifies that the already-implemented PRE-RICH Issue path
 * composes its external Ed25519 authority verifier, Haskell digest
 * recomputation, economic-admission witness and transition-evidence binding.
 *
 * It deliberately does not define a generic appraisal envelope, verifier
 * registry, trust-root lifecycle, evidence status machine or authority model.
 * Its positive result is scoped to the PRE-RICH Issue consumer only.
 */

const provider = read('Adapter/CARDANO/observation/PreprodAuthoritativeIssueProvider.ts')
const signedAuthority = read('relayer/signedIssueAuthority.js')
const haskellProvider = read('Adapter/CARDANO/observation/HaskellIssueAdmissionProvider.ts')
const transitionBinding = read('Adapter/CARDANO/observation/EconomicAdmissionTransitionBinding.ts')
const transitionEvidence = read('Adapter/CARDANO/observation/CanonicalTransitionEvidence.ts')
const gate = read('IMMORTAL/kernel/EconomicGate.hs')
const governanceAuthorization = read('IMMORTAL/governance/GovernanceAuthorization.hs')
const gov27 = read('docs/01-formal-records/governance/GOV-27-AUTHORIZATION-EVIDENCE-RULESET.md')
const caesTest = read('src/__tests__/caes-transition-closure.test.ts')

assert(
  provider.includes('fetchSignedIssueAuthority') &&
    provider.includes('baseUrl: options.authorityUrl') &&
    provider.includes('publicKeyPem: options.authorityPublicKeyPem'),
  'PRE-RICH Issue provider obtains the external signed authority using its configured public verification key',
)

assert(
  count(signedAuthority, /crypto\.verify\(/g) === 2 &&
    signedAuthority.includes("Buffer.from(canonicalize(payload), 'utf8')") &&
    signedAuthority.includes("Buffer.from(carrierBindingMessage, 'utf8')"),
  'signed Issue authority verifies both the canonical payload signature and the separate carrier-binding signature',
)

for (const field of [
  'counterInputReference',
  'controlStateReference',
  'poolInputReference',
  'carrierStateReference',
  'observationReference',
  'decisionReference',
]) {
  assert(
    signedAuthority.includes("'" + field + "'"),
    'signed Issue authority binds the exact ' + field,
  )
}

for (const digest of ['stateHash', 'actionFingerprint', 'postStateHash']) {
  assert(
    signedAuthority.includes('payload' + digest[0].toUpperCase() + digest.slice(1)) ||
      signedAuthority.includes("'" + digest + "'"),
    'signed Issue authority includes ' + digest + ' in its signed binding',
  )
}

assert(
  signedAuthority.includes('expected.currentObservedAt') &&
    signedAuthority.includes('currentObservedAt - observedAt > freshnessWindow'),
  'signed Issue authority checks observation freshness against an externally supplied evaluation time',
)

assert(
  signedAuthority.includes('approvalInputSourceSetHash !== sourceSetEvidenceHash') &&
    signedAuthority.includes('approvalQualificationEvidenceHash !== approvalInputQualificationHash') &&
    signedAuthority.includes('approvalEvidenceHash !== governanceApprovalEvidenceHash'),
  'EEV deployment approval remains bound to its qualification and exact source-set digests',
)

assert(
  ['EV1', 'EV2', 'EV3', 'EV4', 'EV5', 'EV6', 'EV7'].every((key) =>
    signedAuthority.includes("'" + key + "'"),
  ),
  'signed Issue verifier requires the complete existing EV1–EV7 evidence set',
)

assert(
  haskellProvider.includes('assertHaskellDecisionMatchesAuthorityBinding') &&
    haskellProvider.includes("['stateHash', 'actionFingerprint', 'postStateHash']") &&
    haskellProvider.includes('signed.toLowerCase() !== computed.toLowerCase()'),
  'Haskell Issue decision independently recomputes and matches all three authority-signed digests',
)

assert(
  ['actionClass', 'actionFingerprint', 'preStateFingerprint', 'postStateFingerprint'].every((field) =>
    transitionBinding.includes('evidence.' + field),
  ) &&
    transitionBinding.includes('admission.stateHash !== evidence.preStateFingerprint') &&
    transitionBinding.includes('admission.postStateHash !== evidence.postStateFingerprint'),
  'economic admission is cross-bound to canonical action and pre/post state evidence',
)

assert(
  transitionEvidence.includes('This is not an economic authority') &&
    transitionEvidence.includes('does not validate the transition itself') &&
    !transitionEvidence.includes('crypto.verify('),
  'canonical transition evidence remains evidence-only and is not mistaken for an authority verifier',
)

assert(
  caesTest.includes('assertEconomicAdmissionMatchesCanonicalEvidence') &&
    caesTest.includes('adapter.submitEconomic') &&
    caesTest.includes('not.toHaveBeenCalled()'),
  'existing CAES regression tests bind admission before Cardano signing and reject divergent transition evidence',
)

assert(
  gate.includes('The record is an interface, not an authority declaration') &&
    gate.includes('does not manufacture truth, freshness or obligation coverage') &&
    gate.includes('egiObligationsComplete input'),
  'IMMORTAL EconomicGate continues to consume caller-bound conditions without manufacturing their verification',
)

assert(
  governanceAuthorization.includes('not (null (evidenceRefs e))') &&
    gov27.includes('This is a structural gate only') &&
    gov27.includes('does not claim that the referenced evidence') &&
    gov27.includes('cryptographic authenticity of evidence references'),
  'GOV-27 evidence references remain a governance structural gate, not a universal cryptographic evidence verifier',
)

console.log('ISSUE_SIGNED_BINDING=EXISTS_FOR_PRE_RICH_ISSUE')
console.log('GENERIC_EXP_06_AUTHENTICATED_APPRAISAL=OPEN')
console.log('GENERIC_EXP_12_AUTHORITY_LIFECYCLE=OPEN')
console.log('RESULT=REUSE_BOUNDARY_CONFORMANT_NOT_UNIVERSALLY_CERTIFIED')
