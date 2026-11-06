import { readFile, writeFile } from 'node:fs/promises'
import {
  assertArtifactEvidenceHash,
  digestJson,
} from './eev-approval-integrity.mjs'

function required(value, field) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(field + '_REQUIRED')
  }
  return value.trim()
}

function same(actual, expected, code) {
  if (actual !== expected) throw new Error(code)
}

function readObject(value, field) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(field + '_MUST_BE_OBJECT')
  }
  return value
}

/**
 * Validate the archived deployment approval and its explicit
 * LIVE_UTXO_REVALIDATION condition against a fresh, read-only Koios census.
 *
 * This does not create/renew approval, authenticate the original GitHub
 * environment reviewer beyond the archived workflow provenance, or authorize
 * an Issue. The caller must still revalidate the exact out-reference at
 * admission time and consume that exact input in the Issue transaction.
 */
export function buildApprovalLiveRevalidation({
  historicalApprovedQualification,
  historicalQualification,
  historicalSourceSet,
  historicalDeployment,
  historicalOracleState,
  currentQualification,
  currentSourceSet,
  currentDeployment,
  currentOracleState,
  currentCensus,
  workflowRunId,
  workflowCommit,
  observedAt = new Date().toISOString(),
}) {
  const approved = readObject(historicalApprovedQualification, 'HISTORICAL_APPROVED_QUALIFICATION')
  const originalQualification = readObject(historicalQualification, 'HISTORICAL_QUALIFICATION')
  const oldSource = readObject(historicalSourceSet, 'HISTORICAL_SOURCE_SET')
  const oldDeployment = readObject(historicalDeployment, 'HISTORICAL_DEPLOYMENT')
  const oldOracle = readObject(historicalOracleState, 'HISTORICAL_ORACLE_STATE')
  const freshQualification = readObject(currentQualification, 'CURRENT_QUALIFICATION')
  const freshSource = readObject(currentSourceSet, 'CURRENT_SOURCE_SET')
  const freshDeployment = readObject(currentDeployment, 'CURRENT_DEPLOYMENT')
  const freshOracle = readObject(currentOracleState, 'CURRENT_ORACLE_STATE')
  const census = readObject(currentCensus, 'CURRENT_PROTECTED_CAPITAL_CENSUS')

  const historicalApproval = readObject(approved.deploymentApproval, 'HISTORICAL_DEPLOYMENT_APPROVAL')
  const approvalGovernance = readObject(approved.governance, 'HISTORICAL_APPROVAL_GOVERNANCE')

  const oldQualificationHash = assertArtifactEvidenceHash(originalQualification, 'historicalQualification')
  const oldSourceHash = assertArtifactEvidenceHash(oldSource, 'historicalSourceSet')
  const oldDeploymentHash = assertArtifactEvidenceHash(oldDeployment, 'historicalDeployment')
  const oldOracleHash = assertArtifactEvidenceHash(oldOracle, 'historicalOracleState')
  const approvedQualificationHash = assertArtifactEvidenceHash(approved, 'historicalApprovedQualification')

  if (originalQualification.status !== 'qualified' || originalQualification.deploymentApproval !== null) {
    throw new Error('HISTORICAL_PRE_APPROVAL_QUALIFICATION_INVALID')
  }
  if (approved.status !== 'qualified' || historicalApproval.status !== 'DEPLOYMENT_APPROVED') {
    throw new Error('HISTORICAL_DEPLOYMENT_APPROVAL_NOT_PRESENT')
  }
  if (historicalApproval.profileVersion !== 'PRE-RICH-EEV-USDM-DIRECT-V1') {
    throw new Error('HISTORICAL_APPROVAL_PROFILE_MISMATCH')
  }
  if (historicalApproval.validUntilOrRevalidationRule !== 'LIVE_UTXO_REVALIDATION') {
    throw new Error('HISTORICAL_APPROVAL_REVALIDATION_RULE_UNSUPPORTED')
  }
  if (approvalGovernance.deploymentApprovalStatus !== 'DEPLOYMENT_APPROVED') {
    throw new Error('HISTORICAL_APPROVAL_GOVERNANCE_STATUS_MISMATCH')
  }
  same(historicalApproval.qualificationEvidenceHash, oldQualificationHash, 'HISTORICAL_QUALIFICATION_HASH_MISMATCH')
  same(approvalGovernance.approvalInputQualificationHash, oldQualificationHash, 'HISTORICAL_GOVERNANCE_QUALIFICATION_HASH_MISMATCH')
  same(approvalGovernance.approvalInputSourceSetHash, oldSourceHash, 'HISTORICAL_SOURCE_SET_HASH_MISMATCH')
  same(approvalGovernance.approvalInputDeploymentHash, oldDeploymentHash, 'HISTORICAL_DEPLOYMENT_HASH_MISMATCH')
  same(approvalGovernance.approvalInputOracleStateHash, oldOracleHash, 'HISTORICAL_ORACLE_HASH_MISMATCH')
  same(approvalGovernance.approvalEvidenceHash, historicalApproval.evidenceHash, 'HISTORICAL_APPROVAL_EVIDENCE_REFERENCE_MISMATCH')

  const candidateOutRef = required(oldSource.source?.b1PrizePoolUtxo, 'HISTORICAL_POOL_OUTREF')
  const candidateId = 'PRE-RICH-EEV-USDM-DIRECT-V1:' + candidateOutRef
  const sourceSetId = oldSource.schema + ':' + oldSourceHash
  same(historicalApproval.candidateId, candidateId, 'HISTORICAL_APPROVAL_CANDIDATE_ID_MISMATCH')
  same(historicalApproval.sourceSetId, sourceSetId, 'HISTORICAL_APPROVAL_SOURCE_SET_ID_MISMATCH')
  same(approved.sourceReference, 'cardano:preprod/utxo/' + candidateOutRef, 'HISTORICAL_APPROVAL_SOURCE_REFERENCE_MISMATCH')
  same(oldSource.freshness?.model, 'LIVE_UTXO_REVALIDATION', 'HISTORICAL_SOURCE_FRESHNESS_MODEL_MISMATCH')

  // Reconstruct the exact approval snapshot hashed by the original approval
  // workflow. A valid-looking hash string alone is not sufficient.
  const approvalReference = required(approvalGovernance.approvalReference, 'HISTORICAL_APPROVAL_REFERENCE')
  const runMatch = approvalReference.match(/^github-actions:environment\/PREPROD-EEV-APPROVAL\/run\/(\d+)$/)
  if (!runMatch) throw new Error('HISTORICAL_APPROVAL_REFERENCE_FORMAT_INVALID')
  const approvalSnapshot = {
    action: 'APPROVE_PREPROD_EEV',
    actor: required(approvalGovernance.approvalActor, 'HISTORICAL_APPROVAL_ACTOR'),
    runId: runMatch[1],
    workflowCommit: required(approvalGovernance.approvalWorkflowCommit, 'HISTORICAL_APPROVAL_WORKFLOW_COMMIT'),
    profileVersion: historicalApproval.profileVersion,
    candidateId: historicalApproval.candidateId,
    sourceSetId: historicalApproval.sourceSetId,
    qualificationEvidenceHash: historicalApproval.qualificationEvidenceHash,
    sourceSetEvidenceHash: oldSourceHash,
    deploymentEvidenceHash: oldDeploymentHash,
    oracleEvidenceHash: oldOracleHash,
    sourceReference: approved.sourceReference,
    directUsdmUnit: oldSource.source?.directUsdmUnit,
    poolInputReference: candidateOutRef,
    freshnessModel: oldSource.freshness?.model,
    derivationVersion: oldSource.derivation?.version,
  }
  const reconstructedApprovalHash = digestJson(approvalSnapshot)
  same(reconstructedApprovalHash, historicalApproval.evidenceHash, 'HISTORICAL_APPROVAL_SNAPSHOT_HASH_MISMATCH')

  // The old and new qualification refer to the same deployment candidate,
  // but the current read-only run must produce fresh source artifacts.
  if (freshQualification.status !== 'qualified' || freshQualification.deploymentApproval !== null) {
    throw new Error('CURRENT_QUALIFICATION_NOT_READ_ONLY_QUALIFIED')
  }
  const currentQualificationHash = assertArtifactEvidenceHash(freshQualification, 'currentQualification')
  const currentSourceHash = assertArtifactEvidenceHash(freshSource, 'currentSourceSet')
  assertArtifactEvidenceHash(freshDeployment, 'currentDeployment')
  assertArtifactEvidenceHash(freshOracle, 'currentOracleState')
  assertArtifactEvidenceHash(census, 'currentProtectedCapitalCensus')

  same(freshQualification.profileVersion, historicalApproval.profileVersion, 'CURRENT_QUALIFICATION_PROFILE_MISMATCH')
  same(freshQualification.sourceSet?.sourceEvidenceHash, currentSourceHash, 'CURRENT_QUALIFICATION_SOURCE_HASH_MISMATCH')
  same(freshQualification.sourceSet?.poolInputReference, freshSource.source?.b1PrizePoolUtxo, 'CURRENT_QUALIFICATION_POOL_REFERENCE_MISMATCH')
  same(freshQualification.sourceSet?.directUsdmUnit, freshSource.source?.directUsdmUnit, 'CURRENT_QUALIFICATION_ASSET_MISMATCH')
  same(freshQualification.sourceReference, 'cardano:preprod/utxo/' + candidateOutRef, 'CURRENT_QUALIFICATION_SOURCE_REFERENCE_MISMATCH')

  // Compare immutable candidate identity and physical inventory under the
  // explicitly approved live-UTxO rule.
  same(freshSource.network, 'cardano-preprod', 'CURRENT_SOURCE_NETWORK_MISMATCH')
  same(freshSource.status, 'OBSERVED_NOT_QUALIFIED', 'CURRENT_SOURCE_STATUS_UNEXPECTED')
  same(freshSource.freshness?.model, 'LIVE_UTXO_REVALIDATION', 'CURRENT_SOURCE_NOT_LIVE_REVALIDATED')
  same(freshSource.derivation?.version, oldSource.derivation?.version, 'CURRENT_DERIVATION_VERSION_MISMATCH')
  same(freshSource.derivation?.rounding, 'FLOOR', 'CURRENT_DERIVATION_ROUNDING_MISMATCH')
  same(freshSource.source?.kind, 'CARDANO_LIVE_UTXO', 'CURRENT_SOURCE_KIND_MISMATCH')
  same(freshSource.source?.b1PrizePoolUtxo, candidateOutRef, 'LIVE_POOL_OUTREF_CHANGED')
  same(freshSource.source?.b1PrizePoolAddress, oldSource.source?.b1PrizePoolAddress, 'LIVE_POOL_ADDRESS_CHANGED')
  same(freshSource.source?.poolSingletonUnit, oldSource.source?.poolSingletonUnit, 'LIVE_POOL_SINGLETON_UNIT_CHANGED')
  same(freshSource.source?.directUsdmUnit, oldSource.source?.directUsdmUnit, 'LIVE_DIRECT_USDM_UNIT_CHANGED')
  same(freshSource.derivation?.atomicQuantity, oldSource.derivation?.atomicQuantity, 'LIVE_POOL_PHYSICAL_QUANTITY_CHANGED')
  same(freshSource.derivation?.verifiedUsdmSubunits, oldSource.derivation?.verifiedUsdmSubunits, 'LIVE_POOL_USDM_SUBUNITS_CHANGED')

  // Current deployment and Oracle State must still be the same configured
  // identities; the Oracle's datum freshness is reported but not used to
  // qualify the Direct-USDM EEV profile.
  same(freshDeployment.evidenceHash, oldDeployment.evidenceHash, 'CURRENT_DEPLOYMENT_IDENTITY_CHANGED')
  same(freshOracle.network, 'cardano-preprod', 'CURRENT_ORACLE_NETWORK_MISMATCH')
  same(freshOracle.status, 'MATERIALIZED', 'CURRENT_ORACLE_STATE_NOT_MATERIALIZED')
  same(freshOracle.oracleState?.policyId, oldOracle.oracleState?.policyId, 'CURRENT_ORACLE_POLICY_CHANGED')
  same(freshOracle.oracleState?.tokenNameHex, oldOracle.oracleState?.tokenNameHex, 'CURRENT_ORACLE_TOKEN_NAME_CHANGED')
  same(freshOracle.oracleState?.publisherPkh, oldOracle.oracleState?.publisherPkh, 'CURRENT_ORACLE_PUBLISHER_CHANGED')
  same(freshOracle.oracleState?.address, oldOracle.oracleState?.address, 'CURRENT_ORACLE_ADDRESS_CHANGED')
  same(freshOracle.oracleState?.utxo, oldOracle.oracleState?.utxo, 'CURRENT_ORACLE_UTXO_CHANGED')

  same(census.network, 'Preprod', 'CENSUS_NETWORK_MISMATCH')
  same(census.deploymentIdentity?.addressBindings?.network, 'cardano-preprod', 'CENSUS_ADDRESS_BINDING_NETWORK_MISSING')
  if (census.deploymentIdentity?.addressBindings?.b1PrizePool?.matchesDeploymentHash !== true ||
      census.deploymentIdentity?.addressBindings?.prizeValidator?.matchesDeploymentHash !== true ||
      census.deploymentIdentity?.addressBindings?.oraclePublisher?.matchesConfiguredPublisherPkh !== true) {
    throw new Error('CENSUS_ADDRESS_PAYMENT_CREDENTIAL_BINDING_FAILED')
  }
  const sourceManifest = readObject(census.sourceManifest, 'CENSUS_SOURCE_MANIFEST')
  if (sourceManifest.tipUnchangedAcrossScan !== true ||
      sourceManifest.paginationTotalsExactlyReconciled !== true ||
      sourceManifest.datumBytesAvailableForAll !== true ||
      sourceManifest.datumHashComparisonsVerified !== true ||
      sourceManifest.datumHashMismatchCount !== 0) {
    throw new Error('CENSUS_SOURCE_CONSISTENCY_CHECK_FAILED')
  }
  same(sourceManifest.addresses?.b1PrizePool?.totalCount, 1, 'CENSUS_POOL_UTXO_COUNT_NOT_ONE')
  same(sourceManifest.addresses?.b1PrizePool?.returnedCount, 1, 'CENSUS_POOL_RETURNED_COUNT_NOT_ONE')
  same(sourceManifest.addresses?.prizeValidator?.totalCount, 0, 'CENSUS_PRIZE_VALIDATOR_NOT_EMPTY_AT_SNAPSHOT')

  const livePoolRows = census.rawSource?.b1PrizePoolUtxos
  if (!Array.isArray(livePoolRows) || livePoolRows.length !== 1) {
    throw new Error('CENSUS_RAW_POOL_ROW_COUNT_NOT_ONE')
  }
  const livePool = readObject(livePoolRows[0], 'CENSUS_LIVE_POOL_ROW')
  same(livePool.utxo_reference, candidateOutRef, 'CENSUS_LIVE_POOL_OUTREF_MISMATCH')
  same(livePool.address, oldSource.source?.b1PrizePoolAddress, 'CENSUS_LIVE_POOL_ADDRESS_MISMATCH')
  same(livePool.is_spent, false, 'CENSUS_POOL_OUTPUT_ALREADY_SPENT')
  same(livePool.payment_cred, census.topology?.b1PrizePoolHash, 'CENSUS_POOL_PAYMENT_CREDENTIAL_MISMATCH')
  if (!Array.isArray(livePool.asset_list)) throw new Error('CENSUS_POOL_ASSET_LIST_MISSING')
  const usdmAssets = livePool.asset_list.filter(item =>
    item.policy_id + item.asset_name === oldSource.source.directUsdmUnit
  )
  if (usdmAssets.length !== 1) throw new Error('CENSUS_DIRECT_USDM_ASSET_NOT_UNIQUE')
  same(String(usdmAssets[0].quantity), oldSource.derivation.atomicQuantity, 'CENSUS_DIRECT_USDM_PHYSICAL_QUANTITY_MISMATCH')
  const singletonAssets = livePool.asset_list.filter(item =>
    item.policy_id + item.asset_name === oldSource.source.poolSingletonUnit
  )
  if (singletonAssets.length !== 1 || String(singletonAssets[0].quantity) !== '1') {
    throw new Error('CENSUS_POOL_SINGLETON_NOT_UNIQUE')
  }
  if (livePool.datum_source !== 'INLINE' || livePool.datum_hash_verification !== 'BLAKE2B_256_MATCH' ||
      livePool.datum_hash_content_verified !== true || typeof livePool.datum_bytes !== 'string') {
    throw new Error('CENSUS_POOL_DATUM_NOT_VERIFIED')
  }
  same(census.ledger?.source?.poolUtxoReference, candidateOutRef, 'CENSUS_LEDGER_POOL_OUTREF_MISMATCH')
  same(census.sourceManifest.snapshot?.hash, freshSource.chainTip?.hash, 'CENSUS_AND_SOURCE_TIP_HASH_MISMATCH')
  same(census.sourceManifest.snapshot?.slot, freshSource.chainTip?.abs_slot, 'CENSUS_AND_SOURCE_TIP_SLOT_MISMATCH')

  const approvalValidFrom = required(historicalApproval.validFrom, 'HISTORICAL_APPROVAL_VALID_FROM')
  const approvalAgeMsAtObservation = Date.parse(observedAt) - Date.parse(approvalValidFrom)
  if (!Number.isFinite(approvalAgeMsAtObservation) || approvalAgeMsAtObservation < 0) {
    throw new Error('APPROVAL_OBSERVATION_TIME_INVALID')
  }

  return {
    schema: 'PRE-RICH-EEV-APPROVAL-LIVE-REVALIDATION-v0.1',
    status: 'HISTORICAL_APPROVAL_REVALIDATED_EXACT_LIVE_SOURCE',
    network: 'cardano-preprod',
    profileVersion: historicalApproval.profileVersion,
    candidateId,
    historicalApproval: {
      status: historicalApproval.status,
      approvalReference,
      approvalActor: approvalGovernance.approvalActor,
      approvalRunId: runMatch[1],
      approvalWorkflowCommit: approvalGovernance.approvalWorkflowCommit,
      validFrom: approvalValidFrom,
      revalidationRule: historicalApproval.validUntilOrRevalidationRule,
      evidenceHash: historicalApproval.evidenceHash,
      reconstructedEvidenceHash: reconstructedApprovalHash,
      evidenceHashVerified: true,
      approvedQualificationEvidenceHash: oldQualificationHash,
      approvedSourceSetEvidenceHash: oldSourceHash,
      deploymentEvidenceHash: oldDeploymentHash,
      oracleStateEvidenceHash: oldOracleHash,
      approvedQualificationArtifactEvidenceHash: approvedQualificationHash,
    },
    liveRevalidation: {
      observedAt,
      workflowRunId: required(workflowRunId, 'GITHUB_RUN_ID'),
      workflowCommit: required(workflowCommit, 'GITHUB_SHA'),
      currentQualificationEvidenceHash: currentQualificationHash,
      currentSourceSetEvidenceHash: currentSourceHash,
      currentPoolOutReference: candidateOutRef,
      historicalPoolOutReference: oldSource.source.b1PrizePoolUtxo,
      exactOutReferenceUnchanged: true,
      directUsdmUnit: freshSource.source.directUsdmUnit,
      physicalAtomicQuantity: freshSource.derivation.atomicQuantity,
      verifiedUsdmSubunits: freshSource.derivation.verifiedUsdmSubunits,
      derivationVersion: freshSource.derivation.version,
      rounding: freshSource.derivation.rounding,
      sourceSnapshotReference: freshSource.chainTip?.hash
        ? 'koios-preprod:' + freshSource.chainTip.abs_slot + ':' + freshSource.chainTip.hash
        : null,
      datumHash: livePool.datum_hash,
      datumHashVerification: livePool.datum_hash_verification,
      datumBytesSha256: census.ledger?.source?.poolDatumDigest ?? null,
      b1PoolAddressPaymentHash: census.deploymentIdentity.addressBindings.b1PrizePool.paymentCredentialHash,
      prizeValidatorAddressPaymentHash: census.deploymentIdentity.addressBindings.prizeValidator.paymentCredentialHash,
      oraclePublisherPaymentKeyHash: census.deploymentIdentity.addressBindings.oraclePublisher.paymentCredentialHash,
      poolOutputUnspentAtObservation: true,
      censusTipStable: true,
      censusPaginationReconciled: true,
      querySnapshotPinned: sourceManifest.providerSnapshotPinned === true,
      providerAttestationVerified: sourceManifest.providerAttestationVerified === true,
    },
    separateBlockers: {
      oracleStateFreshForOneHourWindow: freshOracle.observation?.withinMaxAge === true,
      protectedCapitalFullyQualified: census.qualifications?.fullProtectedCapitalQualified === true,
      sourceCompletenessAuthorityVerified: census.qualifications?.sourceCompletenessAuthorityVerified === true,
      r7L6EmptinessProven: census.qualifications?.r7L6EmptinessProven === true,
      l2LifecycleProven: census.qualifications?.l2LifecycleProven === true,
      deploymentManifestAuthorityCryptographicallyVerified: census.qualifications?.deploymentManifestAuthorityCryptographicallyVerified === true,
    },
    decision: {
      historicalApprovalRecordAndExactCandidateRevalidated: true,
      newApprovalCreated: false,
      approvalReissued: false,
      issueAdmissionAuthorized: false,
      admissionTimeExactOutReferenceRevalidationStillRequired: true,
      issueTransactionMustConsumeExactPoolOutReference: true,
      scope: 'HISTORICAL_EEV_APPROVAL_AND_LIVE_POOL_CANDIDATE_ONLY_NOT_FULL_PROTECTED_CAPITAL_OR_ISSUE_ADMISSION',
    },
  }
}

const paths = {
  historicalApprovedQualification: process.env.PREPROD_HISTORICAL_APPROVED_QUALIFICATION,
  historicalQualification: process.env.PREPROD_HISTORICAL_QUALIFICATION,
  historicalSourceSet: process.env.PREPROD_HISTORICAL_SOURCE_SET,
  historicalDeployment: process.env.PREPROD_HISTORICAL_DEPLOYMENT_MANIFEST,
  historicalOracleState: process.env.PREPROD_HISTORICAL_ORACLE_STATE_MANIFEST,
  currentQualification: process.env.PREPROD_CURRENT_QUALIFICATION,
  currentSourceSet: process.env.PREPROD_CURRENT_SOURCE_SET,
  currentDeployment: process.env.PREPROD_CURRENT_DEPLOYMENT_MANIFEST,
  currentOracleState: process.env.PREPROD_CURRENT_ORACLE_STATE_MANIFEST,
  currentCensus: process.env.PREPROD_CURRENT_PROTECTED_CAPITAL_CENSUS,
  output: process.env.PREPROD_APPROVAL_REVALIDATION_OUTPUT,
}

async function readJson(path, field) {
  const filePath = required(path, field + '_PATH')
  try {
    return JSON.parse(await readFile(filePath, 'utf8'))
  } catch (error) {
    throw new Error(field + '_READ_OR_JSON_FAILED:' + (error instanceof Error ? error.message : String(error)))
  }
}

const input = {}
for (const [key, path] of Object.entries(paths)) {
  if (key === 'output') continue
  input[key] = await readJson(path, key)
}
const result = buildApprovalLiveRevalidation({
  ...input,
  workflowRunId: process.env.GITHUB_RUN_ID,
  workflowCommit: process.env.GITHUB_SHA,
})
await writeFile(required(paths.output, 'PREPROD_APPROVAL_REVALIDATION_OUTPUT'), JSON.stringify(result, null, 2) + '\n')
console.log(JSON.stringify(result, null, 2))
