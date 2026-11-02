import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import { digestJson } from './eev-approval-integrity.mjs'
import { loadProtectedCapitalDeploymentIdentity } from './preprod-protected-capital-deployment-identity.mjs'

function manifestWithHash(value) {
  const result = { ...value }
  result.evidenceHash = digestJson(result)
  return result
}

function baseManifests() {
  const oracleState = manifestWithHash({
    schema: 'IMMORTAL-PREPROD-ORACLE-STATE-DEPLOYMENT-v0.1',
    status: 'MATERIALIZED',
    network: 'cardano-preprod',
    authorityKind: 'DEPLOYMENT_WALLET_SIGNED',
    oracleState: {
      policyId: 'a'.repeat(56),
      tokenNameHex: '01',
      unit: 'a'.repeat(56) + '01',
      publisherPkh: 'b'.repeat(56),
      address: 'addr_test_oracle_wallet',
      utxo: 'c'.repeat(64) + '#0',
    },
    datumSemantics: { timestampMs: '1000', maxAgeMs: '60000' },
  })

  const deployment = manifestWithHash({
    schema: 'IMMORTAL-PREPROD-DIRECT-USDM-DEPLOYMENT-v0.1',
    status: 'DEPLOYED',
    network: 'cardano-preprod',
    profileCandidate: 'PRE-RICH-EEV-USDM-DIRECT-V1',
    walletAddress: 'addr_test_oracle_wallet',
    oracleConfiguration: {
      statePolicyId: 'a'.repeat(56),
      stateTokenNameHex: '01',
      publisherPkh: 'b'.repeat(56),
      address: 'addr_test_oracle_wallet',
      unit: 'a'.repeat(56) + '01',
      utxo: 'c'.repeat(64) + '#0',
      authorityKind: 'DEPLOYMENT_WALLET_SIGNED',
    },
    assets: {
      poolTokenPolicyId: 'd'.repeat(56),
      poolTokenNameHex: '504f4f4c',
      poolUnit: 'd'.repeat(56) + '504f4f4c',
      directUsdmUnit: 'e'.repeat(56) + '01',
    },
    topology: {
      counterHash: '1'.repeat(56),
      registryHash: '2'.repeat(56),
      treasuryHash: '3'.repeat(56),
      prizeHash: '4'.repeat(56),
      b1PrizePoolHash: '5'.repeat(56),
      ticketPolicyId: '6'.repeat(56),
      prizeAddress: 'addr_test_prize',
      b1PrizePoolAddress: 'addr_test_pool',
    },
    utxos: { pool: '7'.repeat(64) + '#0' },
  })

  return { deployment, oracleState }
}

async function loadFrom(deployment, oracleState) {
  const entries = new Map([
    ['/evidence/direct.json', JSON.stringify(deployment)],
    ['/evidence/oracle.json', JSON.stringify(oracleState)],
  ])
  return loadProtectedCapitalDeploymentIdentity({
    deploymentManifestPath: '/evidence/direct.json',
    oracleStateManifestPath: '/evidence/oracle.json',
    readFileImpl: async (path) => {
      if (!entries.has(path)) throw new Error('not found')
      return entries.get(path)
    },
  })
}

describe('Preprod ProtectedCapital deployment identity manifest boundary', () => {
  it('loads and cross-checks signed-by-digest identity manifests without secrets', async () => {
    const { deployment, oracleState } = baseManifests()
    const identity = await loadFrom(deployment, oracleState)

    assert.equal(identity.sourceMode, 'VERIFIED_DEPLOYMENT_MANIFESTS')
    assert.equal(identity.oraclePublisherPkh, 'b'.repeat(56))
    assert.equal(identity.oracleStatePolicyId, 'a'.repeat(56))
    assert.equal(identity.poolTokenUnit, 'd'.repeat(56) + '504f4f4c')
    assert.equal(identity.topology.prizeHash, '4'.repeat(56))
    assert.equal(identity.topology.ticketPolicyId, '6'.repeat(56))
  })

  it('rejects a deployment manifest whose evidence hash no longer matches content', async () => {
    const { deployment, oracleState } = baseManifests()
    deployment.topology.prizeAddress = 'addr_test_substituted'

    await assert.rejects(
      () => loadFrom(deployment, oracleState),
      /PREPROD_DIRECT_USDM_DEPLOYMENT\.evidenceHash does not match/,
    )
  })

  it('rejects mismatched Oracle State publisher or identity across the two manifests', async () => {
    const { deployment, oracleState } = baseManifests()
    oracleState.oracleState.publisherPkh = 'f'.repeat(56)
    oracleState.evidenceHash = digestJson((({ evidenceHash, ...body }) => body)(oracleState))

    await assert.rejects(
      () => loadFrom(deployment, oracleState),
      /PREPROD_ORACLE_STATE_DEPLOYMENT\.evidenceHash does not match|DIRECT_USDM_AND_ORACLE_STATE_MANIFEST_IDENTITY_MISMATCH/,
    )
  })

  it('rejects a non-Preprod or non-deployed manifest', async () => {
    const { deployment, oracleState } = baseManifests()
    deployment.status = 'BOOTSTRAP_CANDIDATE'
    deployment.evidenceHash = digestJson((({ evidenceHash, ...body }) => body)(deployment))

    await assert.rejects(
      () => loadFrom(deployment, oracleState),
      /PREPROD_DIRECT_USDM_DEPLOYMENT_STATUS_NOT_DEPLOYED/,
    )
  })

  it('rejects a Pool singleton unit that disagrees with its policy/name', async () => {
    const { deployment, oracleState } = baseManifests()
    deployment.assets.poolUnit = 'd'.repeat(56) + '504f4f4d'
    deployment.evidenceHash = digestJson((({ evidenceHash, ...body }) => body)(deployment))

    await assert.rejects(
      () => loadFrom(deployment, oracleState),
      /B1_POOL_TOKEN_UNIT_DOES_NOT_MATCH_POLICY_AND_NAME/,
    )
  })

  it('rejects an oracle state unit that disagrees with its exact policy/name', async () => {
    const { deployment, oracleState } = baseManifests()
    oracleState.oracleState.unit = 'a'.repeat(56) + '02'
    oracleState.evidenceHash = digestJson((({ evidenceHash, ...body }) => body)(oracleState))

    await assert.rejects(
      () => loadFrom(deployment, oracleState),
      /ORACLE_STATE_UNIT_DOES_NOT_MATCH_POLICY_AND_NAME/,
    )
  })
})
