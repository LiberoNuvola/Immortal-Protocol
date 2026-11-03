#!/usr/bin/env node

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const read = (path) => readFileSync(resolve(process.cwd(), path), 'utf8')
const assert = (condition, message) => {
  if (!condition) throw new Error('FAIL: ' + message)
  console.log('PASS: ' + message)
}

/*
 * EXP-06 / EXP-12 — trust-root and issuer-lifecycle boundary audit.
 *
 * This is a source-level conformance guard for the existing PRE-RICH Issue
 * authority consumer. It does not create keys, choose a trust root, define a
 * rotation policy, or introduce an authority registry.
 *
 * Its purpose is to make the existing trust anchor and the unimplemented
 * lifecycle explicit so later generalization cannot silently infer them.
 */

const signed = read('relayer/signedIssueAuthority.js')
const server = read('relayer/issueAuthorityServer.js')
const provider = read('Adapter/CARDANO/observation/PreprodAuthoritativeIssueProvider.ts')
const deploy = read('scripts/deployV3Carrier.mts')
const carrier = read('PRE-RICH/onchain/V3EconomicStateCarrier.hs')
const loader = read('src/v3CarrierScript.ts')
const signatureTests = read('relayer/signedIssueAuthority.test.js')
const gov27 = read('docs/01-formal-records/governance/GOV-27-AUTHORIZATION-EVIDENCE-RULESET.md')
const govAuthorization = read('IMMORTAL/governance/GovernanceAuthorization.hs')
const rulesetRegistry = read('IMMORTAL/governance/RulesetRegistry.hs')
const materiosAuthority = read('poc/materios-grandpa/src/authority.ts')
const materiosTransition = read('poc/materios-grandpa/src/authority-transition.ts')
const b2Committee = read('services/beacon-b2-verifier/server.mjs')

const start = signed.indexOf('function verifySignedIssueAuthorityEnvelope')
const end = signed.indexOf('async function fetchSignedIssueAuthority', start)
if (start < 0 || end < 0) throw new Error('FAIL: cannot isolate signed authority verifier')
const verifier = signed.slice(start, end)

assert(
  server.includes("requiredAny('ISSUE_AUTHORITY_PUBLIC_KEY')") &&
    server.includes('authorityPublicKeyPem') &&
    provider.includes('publicKeyPem: options.authorityPublicKeyPem'),
  'the Issue consumer receives one externally configured verification public key',
)

assert(
  (verifier.match(/crypto\.verify\(/g) ?? []).length === 2 &&
    verifier.includes('publicKeyPem,') &&
    verifier.includes('Buffer.from(carrierBindingSignature, \'hex\')') &&
    verifier.includes('crypto.verify(null, signedBytes, publicKeyPem, signatureBytes)'),
  'the same configured Ed25519 public key verifies the full authority payload and the carrier-binding signature',
)

assert(
  deploy.includes("required('ISSUE_AUTHORITY_PUBLIC_KEY')") &&
    deploy.includes("createPublicKey(issueAuthorityPublicKeyPem)") &&
    deploy.includes("issueAuthorityJwk.crv !== 'Ed25519'") &&
    deploy.includes('authorityPublicKeyHex])') &&
    deploy.includes("validatorToAddress('Preprod', carrierValidator)"),
  'V3 deployment validates the configured key as Ed25519 and embeds its raw bytes in the parameterized carrier validator',
)

assert(
  carrier.includes('bindingAuthorityValid :: BuiltinByteString -> V3EconomicStateAction -> Bool') &&
    carrier.includes('verifyEd25519Signature') &&
    carrier.includes('authorityPublicKey') &&
    carrier.includes('canonicalCarrierBindingMessage action'),
  'the V3 carrier validates the decision-binding signature against its deployment-parameterized authority key',
)

assert(
  loader.includes('options.expectedCarrierAddress') &&
    loader.includes('derivedAddress !== options.expectedCarrierAddress') &&
    loader.includes('applyScriptParams(envelope.cborHex'),
  'the runtime carrier loader rejects a factory artifact that derives a different configured carrier address',
)

assert(
  verifier.includes("payload.schema !== 'PRE-RICH-SIGNED-ISSUE-AUTHORITY-V1'") &&
    verifier.includes("payload.authorityVersion !== '1'") &&
    verifier.includes("payload.actionClass !== 'Issue'"),
  'the current signed payload version is fixed to the PRE-RICH Issue v1 contract',
)

const lifecycleClaims = [
  'issuerId',
  'keyId',
  'kid',
  'appraisalPolicyId',
  'audience',
  'notBefore',
  'expiresAt',
  'revocationReference',
  'supersedes',
]
for (const field of lifecycleClaims) {
  assert(
    !verifier.includes('payload.' + field),
    'the current verifier does not bind a signed ' + field + ' claim',
  )
}

assert(
  !verifier.includes('keyRegistry') &&
    !verifier.includes('resolveVerificationKey') &&
    !verifier.includes('revokedKeys'),
  'the Issue verifier has no in-process trust-anchor registry, key resolver or revocation lookup',
)

assert(
  signed.includes('currentObservedAt: Date.now()') &&
    verifier.includes('currentObservedAt - observedAt > freshnessWindow'),
  'freshness is checked against the Issue verifier host clock, not a separately attested time source',
)

assert(
  signatureTests.includes("crypto.generateKeyPairSync('ed25519')"),
  'the existing verifier test generates ephemeral Ed25519 fixtures and is not a production signer or key-custody proof',
)

assert(
  gov27.includes('This is a structural gate only') &&
    gov27.includes('cryptographic authenticity of evidence references') &&
    govAuthorization.includes('not (null (evidenceRefs e))'),
  'GOV-27 evidence references remain structural and do not authenticate an Issue signer or appraisal source',
)

assert(
  rulesetRegistry.includes('type RulesetRegistry = [RulesetDefinition]') &&
    !rulesetRegistry.includes('AuthorityKey') &&
    !rulesetRegistry.includes('IssuerKey'),
  'the existing governance RulesetRegistry is not an issuer-key registry',
)

assert(
  materiosAuthority.includes('trust: "untrusted-evidence"') &&
    materiosAuthority.includes('status: "unverified"') &&
    materiosAuthority.includes('trustedAuthorityStateFromVerifiedTransition') &&
    materiosAuthority.includes('VerifiedAuthoritySetTransition'),
  'Materios separates untrusted authority-set evidence from trusted state created only after verified transition',
)

assert(
  materiosTransition.includes('AuthoritySetTransitionProofVerifier') &&
    materiosTransition.includes('proofVerifier.verify') &&
    materiosTransition.includes('statement.toSetId !==') &&
    materiosTransition.includes('statement.fromSetId + 1n') &&
    materiosTransition.includes('activationBlock'),
  'Materios provides a reusable authority-transition pattern with chain/set continuity and activation binding',
)

assert(
  materiosTransition.includes('The current repository does not yet provide such an implementation') &&
    materiosTransition.includes('callers must therefore supply one explicitly'),
  'Materios authority-transition pattern is not misrepresented as a completed cryptographic proof verifier',
)

assert(
  b2Committee.includes('B2_COMMITTEE_JSON') &&
    b2Committee.includes('B2_THRESHOLD') &&
    b2Committee.includes('member.id') &&
    b2Committee.includes('unknown committee member') &&
    b2Committee.includes('duplicate member attestation'),
  'B2 committee verifier has explicit member identities and threshold checks but remains a separate application-specific mechanism',
)

console.log('ISSUE_TRUST_ANCHOR=EXTERNAL_CONFIGURED_KEY')
console.log('V3_CARRIER_KEY_PIN=DEPLOYMENT_PARAMETER')
console.log('ISSUER_ID_AND_KEY_ID_BINDING=OPEN')
console.log('KEY_ROTATION_AND_REVOCATION=OPEN')
console.log('APPRAISAL_POLICY_AND_AUDIENCE_BINDING=OPEN')
console.log('PRODUCTION_KEY_CUSTODY_AND_SIGNER_DEPLOYMENT=NOT_VERIFIED')
console.log('MATERIOS_AUTHORITY_PATTERN=REUSE_TRANSITION_BOUNDARY_ONLY')
console.log('MATERIOS_CRYPTO_PROOF_VERIFIER=INTERFACE_ONLY')
console.log('B2_COMMITTEE=SEPARATE_APPLICATION_MECHANISM_NOT_ISSUE_TRUST_ROOT')
console.log('RESULT=ISSUE_SPECIFIC_TRUST_ROOT_REUSE_WITH_LIFECYCLE_GAP')
