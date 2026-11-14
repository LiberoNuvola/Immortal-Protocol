/**
 * Read-only normalizer for the existing Preprod deployment producer artifacts.
 * Emits a provenance gap report only; never emits a C1 identity envelope.
 */
import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'

const INPUTS = Object.freeze({
  directUsdm: process.env.C1_DIRECT_USDM_MANIFEST ?? 'audit/preprod-evidence/preprod-direct-usdm-deployment.json',
  v3Carrier: process.env.C1_V3_CARRIER_MANIFEST ?? 'audit/preprod-issue/v3-carrier-deployment.json',
  b2Control: process.env.C1_B2_CONTROL_MANIFEST ?? 'audit/preprod-issue/b2-control-deployment.json',
})

function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex')
}

async function loadArtifact(path, expected) {
  try {
    const bytes = await readFile(path)
    const parsed = JSON.parse(bytes.toString('utf8'))
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return { status: 'INVALID_OBJECT', path, sha256: sha256(bytes), value: null }
    }
    if (!expected(parsed)) {
      return { status: 'SCHEMA_OR_IDENTITY_MISMATCH', path, sha256: sha256(bytes), value: parsed }
    }
    return { status: 'PRESENT', path, sha256: sha256(bytes), value: parsed }
  } catch (error) {
    return {
      status: error?.code === 'ENOENT' ? 'MISSING' : 'INVALID_OR_UNREADABLE',
      path,
      sha256: null,
      value: null,
      errorCode: error?.code ?? 'PARSE_ERROR',
    }
  }
}

function field(status, value, sourcePath) {
  return {
    status: status === 'PRESENT' && value !== undefined && value !== null && value !== ''
      ? 'PRESENT_IN_SOURCE'
      : status === 'PRESENT' ? 'MISSING_FROM_SOURCE' : 'SOURCE_UNAVAILABLE',
    value: status === 'PRESENT' && value !== undefined && value !== null && value !== ''
      ? value : null,
    sourcePath,
  }
}

function component(source, sourceKey, values) {
  return {
    sourceStatus: source.status,
    sourcePath: source.path,
    sourceSha256: source.sha256,
    sourceIdentity: sourceKey,
    fields: values,
  }
}

export function buildC1ProducerCrosswalk({ directUsdm, v3Carrier, b2Control }) {
  const d = directUsdm.value ?? {}
  const v = v3Carrier.value ?? {}
  const b = b2Control.value ?? {}
  const ds = directUsdm.status
  const vs = v3Carrier.status
  const bs = b2Control.status

  const components = {
    prizeValidator: component(directUsdm, d.schema ?? 'direct-USDM', {
      address: field(ds, d.topology?.prizeAddress, directUsdm.path),
      scriptHash: field(ds, d.topology?.prizeHash, directUsdm.path),
      sourceCommit: field(ds, d.source?.commit, directUsdm.path),
      parameterDigest: field(ds, d.topology?.prizeParameterDigest, directUsdm.path),
      scriptArtifactDigest: field(ds, d.topology?.prizeScriptArtifactDigest, directUsdm.path),
      deploymentId: field(ds, d.deploymentId, directUsdm.path),
      deploymentTxOutRef: field(ds, d.utxos?.prizeValidator, directUsdm.path),
    }),
    b1Pool: component(directUsdm, d.schema ?? 'direct-USDM', {
      address: field(ds, d.topology?.b1PrizePoolAddress, directUsdm.path),
      scriptHash: field(ds, d.topology?.b1PrizePoolHash, directUsdm.path),
      singletonPolicyId: field(ds, d.assets?.poolTokenPolicyId, directUsdm.path),
      singletonTokenNameHex: field(ds, d.assets?.poolTokenNameHex, directUsdm.path),
      sourceCommit: field(ds, d.source?.commit, directUsdm.path),
      parameterDigest: field(ds, d.topology?.b1PoolParameterDigest, directUsdm.path),
      scriptArtifactDigest: field(ds, d.topology?.b1PoolScriptArtifactDigest, directUsdm.path),
      deploymentId: field(ds, d.deploymentId, directUsdm.path),
      deploymentTxOutRef: field(ds, d.utxos?.pool, directUsdm.path),
    }),
    counter: component(directUsdm, d.schema ?? 'direct-USDM', {
      address: field(ds, d.topology?.counterAddress, directUsdm.path),
      scriptHash: field(ds, d.topology?.counterHash, directUsdm.path),
      sourceCommit: field(ds, d.source?.commit, directUsdm.path),
      parameterDigest: field(ds, d.topology?.counterParameterDigest, directUsdm.path),
      scriptArtifactDigest: field(ds, d.topology?.counterScriptArtifactDigest, directUsdm.path),
      deploymentId: field(ds, d.deploymentId, directUsdm.path),
      deploymentTxOutRef: field(ds, d.utxos?.counter, directUsdm.path),
      singletonPolicyId: { status: 'NOT_APPLICABLE_BY_C1_CONTRACT', value: null, sourcePath: directUsdm.path },
      singletonTokenNameHex: { status: 'NOT_APPLICABLE_BY_C1_CONTRACT', value: null, sourcePath: directUsdm.path },
    }),
    v3Carrier: component(v3Carrier, v.deployment ?? 'V3', {
      address: field(vs, v.carrierScriptAddress, v3Carrier.path),
      scriptHash: field(vs, v.carrierScriptHash, v3Carrier.path),
      singletonPolicyId: field(vs, v.policyId, v3Carrier.path),
      singletonTokenNameHex: field(vs, v.carrierTokenNameHex, v3Carrier.path),
      sourceCommit: field(vs, v.sourceCommit, v3Carrier.path),
      parameterDigest: field(vs, v.parameterDigest, v3Carrier.path),
      scriptArtifactDigest: field(vs, v.scriptArtifactDigest, v3Carrier.path),
      deploymentId: field(vs, v.deploymentId, v3Carrier.path),
      deploymentTxOutRef: field(vs, v.carrierStateReference, v3Carrier.path),
      deploymentTransactionRef: field(vs, v.deploymentTransactionRef, v3Carrier.path),
    }),
    b2Control: component(b2Control, b.deployment ?? 'B2', {
      address: field(bs, b.controlScriptAddress, b2Control.path),
      scriptHash: field(bs, b.controlScriptHash, b2Control.path),
      singletonPolicyId: field(bs, b.policyId, b2Control.path),
      singletonTokenNameHex: field(bs, b.controlTokenNameHex, b2Control.path),
      sourceCommit: field(bs, b.sourceCommit, b2Control.path),
      parameterDigest: field(bs, b.parameterDigest, b2Control.path),
      scriptArtifactDigest: field(bs, b.scriptArtifactDigest, b2Control.path),
      deploymentId: field(bs, b.deploymentId, b2Control.path),
      deploymentTxOutRef: field(bs, b.controlStateReference, b2Control.path),
      deploymentTransactionRef: field(bs, b.deploymentTransactionRef, b2Control.path),
    }),
  }

  const missing = []
  for (const [componentId, record] of Object.entries(components)) {
    for (const [fieldName, evidence] of Object.entries(record.fields)) {
      if (evidence.status === 'MISSING_FROM_SOURCE' || evidence.status === 'SOURCE_UNAVAILABLE') {
        missing.push({ componentId, field: fieldName, status: evidence.status })
      }
    }
  }

  const producerIds = {
    directUsdm: d.deploymentId ?? null,
    v3Carrier: v.deployment ?? null,
    b2Control: b.deployment ?? null,
  }
  const sharedGenerationAvailable = Boolean(
    producerIds.directUsdm &&
    producerIds.directUsdm === producerIds.v3Carrier &&
    producerIds.v3Carrier === producerIds.b2Control
  )

  return {
    schema: 'IMMORTAL-PREPROD-C1-PRODUCER-CROSSWALK-REPORT-v0.1',
    mode: 'READ_ONLY_PROVENANCE_GAP_REPORT',
    inputs: {
      directUsdm: { status: ds, path: directUsdm.path, sha256: directUsdm.sha256 },
      v3Carrier: { status: vs, path: v3Carrier.path, sha256: v3Carrier.sha256 },
      b2Control: { status: bs, path: b2Control.path, sha256: b2Control.sha256 },
    },
    components,
    producerIds,
    sharedGenerationAvailable,
    missingFieldCount: missing.length,
    missingFields: missing,
    deploymentAuthorityVerified: false,
    c1QueryableEnvelopeEmitted: false,
    c1Qualified: false,
    blockers: [
      ...(!sharedGenerationAvailable ? ['NO_COMMON_AUTHORIZED_DEPLOYMENT_GENERATION_IN_SOURCE_PRODUCERS'] : []),
      'NO_GOVERNED_GOV_30_TRUST_ROOT_OR_DEPLOYMENT_AUTHORITY_VERIFICATION',
      'NO_INDEPENDENT_SCRIPT_AND_PARAMETER_REDERIVATION_BINDING_FOR_ALL_FIVE_COMPONENTS',
      'COUNTER_MATERIALIZATION_OUT_REF_NOT_PRESENT_IN_DIRECT_USDM_MANIFEST',
      'SOURCE_COMMIT_AND_ARTIFACT_DIGESTS_NOT_EMITTED_BY_CURRENT_PRODUCERS',
    ],
  }
}

async function main() {
  const [directUsdm, v3Carrier, b2Control] = await Promise.all([
    loadArtifact(INPUTS.directUsdm, value => value.schema === 'IMMORTAL-PREPROD-DIRECT-USDM-DEPLOYMENT-v0.1'),
    loadArtifact(INPUTS.v3Carrier, value => value.deployment === 'V3-ECONOMIC-STATE-CARRIER-PREPROD-001'),
    loadArtifact(INPUTS.b2Control, value => value.deployment === 'PRE-RICH-B2-CONTROL-PREPROD-001'),
  ])
  const report = buildC1ProducerCrosswalk({ directUsdm, v3Carrier, b2Control })
  process.stdout.write(JSON.stringify(report, null, 2) + '\\n')
}

if (import.meta.url === new URL(process.argv[1], 'file://' + process.cwd() + '/').href) {
  main().catch(error => {
    process.stderr.write(String(error?.stack ?? error) + '\\n')
    process.exitCode = 1
  })
}
