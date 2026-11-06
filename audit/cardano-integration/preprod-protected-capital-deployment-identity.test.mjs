import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import { digestJson } from './eev-approval-integrity.mjs'
import { loadProtectedCapitalDeploymentIdentity } from './preprod-protected-capital-deployment-identity.mjs'


const BECH32_CHARSET = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l'
const BECH32_GENERATORS = [0x3b6a57b2, 0x26508e6d, 0x1ea119fa, 0x3d4233dd, 0x2a1462b3]

function polymod(values) {
  let checksum = 1
  for (const value of values) {
    const top = checksum >>> 25
    checksum = ((checksum & 0x1ffffff) << 5) ^ value
    for (let i = 0; i < BECH32_GENERATORS.length; i += 1) {
      if (((top >>> i) & 1) !== 0) checksum ^= BECH32_GENERATORS[i]
    }
  }
  return checksum >>> 0
}

function expandHrp(hrp) {
  return [
    ...Array.from(hrp, character => character.charCodeAt(0) >>> 5),
    0,
    ...Array.from(hrp, character => character.charCodeAt(0) & 31),
  ]
}

function convertBits(data, fromBits, toBits, pad) {
  let accumulator = 0
  let bits = 0
  const result = []
  const maxValue = (1 << toBits) - 1
  for (const value of data) {
    if (value < 0 || (value >>> fromBits) !== 0) throw new Error('invalid convertBits input')
    accumulator = (accumulator << fromBits) | value
    bits += fromBits
    while (bits >= toBits) {
      bits -= toBits
      result.push((accumulator >>> bits) & maxValue)
    }
  }
  if (pad) {
    if (bits > 0) result.push((accumulator << (toBits - bits)) & maxValue)
  } else if (bits >= fromBits || ((accumulator << (toBits - bits)) & maxValue) !== 0) {
    throw new Error('invalid convertBits padding')
  }
  return result
}

function encodePreprodAddress(addressType, paymentHash, stakeHash = null, networkId = 0) {
  const payload = [
    (addressType << 4) | networkId,
    ...Buffer.from(paymentHash, 'hex'),
    ...(stakeHash ? Buffer.from(stakeHash, 'hex') : []),
  ]
  const data = convertBits(payload, 8, 5, true)
  const values = [...expandHrp('addr_test'), ...data, 0, 0, 0, 0, 0, 0]
  const checksum = polymod(values) ^ 1
  const check = Array.from({ length: 6 }, (_, index) => (checksum >>> (5 * (5 - index))) & 31)
  return 'addr_test1' + [...data, ...check].map(value => BECH32_CHARSET[value]).join('')
}

function manifestWithHash(value) {
  const result = { ...value }
  result.evidenceHash = digestJson(result)
  return result
}

function baseManifests() {
  const oraclePublisherAddress = encodePreprodAddress(0, 'b'.repeat(56), 'c'.repeat(56))
  const prizeValidatorAddress = encodePreprodAddress(7, '4'.repeat(56))
  const b1PrizePoolAddress = encodePreprodAddress(7, '5'.repeat(56))
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
      address: oraclePublisherAddress,
      utxo: 'c'.repeat(64) + '#0',
    },
    datumSemantics: { timestampMs: '1000', maxAgeMs: '60000' },
  })

  const deployment = manifestWithHash({
    schema: 'IMMORTAL-PREPROD-DIRECT-USDM-DEPLOYMENT-v0.1',
    status: 'DEPLOYED',
    network: 'cardano-preprod',
    profileCandidate: 'PRE-RICH-EEV-USDM-DIRECT-V1',
    walletAddress: oraclePublisherAddress,
    oracleConfiguration: {
      statePolicyId: 'a'.repeat(56),
      stateTokenNameHex: '01',
      publisherPkh: 'b'.repeat(56),
      address: oraclePublisherAddress,
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
      prizeAddress: prizeValidatorAddress,
      b1PrizePoolAddress,
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

    assert.equal(identity.sourceMode, 'DEPLOYMENT_MANIFESTS_HASH_CHECKED')
    assert.equal(identity.manifestIntegrity, 'SELF_HASH_MATCH_NOT_SIGNATURE_AUTHENTICATION')
    assert.equal(identity.manifestAuthorityCryptographicallyVerified, false)
    assert.equal(identity.oraclePublisherPkh, 'b'.repeat(56))
    assert.equal(identity.oracleStatePolicyId, 'a'.repeat(56))
    assert.equal(identity.poolTokenUnit, 'd'.repeat(56) + '504f4f4c')
    assert.equal(identity.topology.prizeHash, '4'.repeat(56))
    assert.equal(identity.topology.ticketPolicyId, '6'.repeat(56))
    assert.deepEqual(identity.addressBindings, {
      network: 'cardano-preprod',
      prizeValidator: {
        addressType: 7,
        paymentCredentialHash: '4'.repeat(56),
        matchesDeploymentHash: true,
      },
      b1PrizePool: {
        addressType: 7,
        paymentCredentialHash: '5'.repeat(56),
        matchesDeploymentHash: true,
      },
      oraclePublisher: {
        addressType: 0,
        paymentCredentialHash: 'b'.repeat(56),
        matchesConfiguredPublisherPkh: true,
      },
      scope: 'BECH32_ADDRESS_PAYMENT_CREDENTIAL_BINDING_ONLY_NOT_BYTECODE_REDERIVATION_OR_MANIFEST_AUTHENTICATION',
    })
  })


  it('rejects a B1 Pool address whose payment script hash differs from deployment topology', async () => {
    const { deployment, oracleState } = baseManifests()
    deployment.topology.b1PrizePoolAddress = encodePreprodAddress(7, 'f'.repeat(56))
    deployment.evidenceHash = digestJson((({ evidenceHash, ...payload }) => payload)(deployment))

    await assert.rejects(
      () => loadFrom(deployment, oracleState),
      /PREPROD_B1_POOL_ADDRESS_PAYMENT_CREDENTIAL_HASH_MISMATCH/,
    )
  })

  it('rejects a PrizeValidator address whose payment script hash differs from deployment topology', async () => {
    const { deployment, oracleState } = baseManifests()
    deployment.topology.prizeAddress = encodePreprodAddress(7, 'f'.repeat(56))
    deployment.evidenceHash = digestJson((({ evidenceHash, ...payload }) => payload)(deployment))

    await assert.rejects(
      () => loadFrom(deployment, oracleState),
      /PREPROD_PRIZE_VALIDATOR_ADDRESS_PAYMENT_CREDENTIAL_HASH_MISMATCH/,
    )
  })

  it('rejects an Oracle wallet address whose payment key hash differs from the configured publisher', async () => {
    const { deployment, oracleState } = baseManifests()
    const otherAddress = encodePreprodAddress(0, 'f'.repeat(56), 'c'.repeat(56))
    oracleState.oracleState.address = otherAddress
    deployment.walletAddress = otherAddress
    deployment.oracleConfiguration.address = otherAddress
    oracleState.evidenceHash = digestJson((({ evidenceHash, ...payload }) => payload)(oracleState))
    deployment.evidenceHash = digestJson((({ evidenceHash, ...payload }) => payload)(deployment))

    await assert.rejects(
      () => loadFrom(deployment, oracleState),
      /PREPROD_ORACLE_PUBLISHER_ADDRESS_PAYMENT_CREDENTIAL_HASH_MISMATCH/,
    )
  })

  it('rejects a mainnet address even if its payment hash matches the deployment', async () => {
    const { deployment, oracleState } = baseManifests()
    deployment.topology.b1PrizePoolAddress = encodePreprodAddress(7, '5'.repeat(56), null, 1)
    deployment.evidenceHash = digestJson((({ evidenceHash, ...payload }) => payload)(deployment))

    await assert.rejects(
      () => loadFrom(deployment, oracleState),
      /PREPROD_B1_POOL_ADDRESS_NETWORK_ID_NOT_PREPROD/,
    )
  })

  it('rejects an address with the wrong payment credential kind', async () => {
    const { deployment, oracleState } = baseManifests()
    deployment.topology.b1PrizePoolAddress = encodePreprodAddress(6, '5'.repeat(56))
    deployment.evidenceHash = digestJson((({ evidenceHash, ...payload }) => payload)(deployment))

    await assert.rejects(
      () => loadFrom(deployment, oracleState),
      /PREPROD_B1_POOL_ADDRESS_PAYMENT_CREDENTIAL_KIND_MISMATCH/,
    )
  })

  it('rejects a corrupted Bech32 checksum before trusting the address credential', async () => {
    const { deployment, oracleState } = baseManifests()
    const valid = deployment.topology.b1PrizePoolAddress
    deployment.topology.b1PrizePoolAddress = valid.slice(0, -1) + (valid.endsWith('q') ? 'p' : 'q')
    deployment.evidenceHash = digestJson((({ evidenceHash, ...payload }) => payload)(deployment))

    await assert.rejects(
      () => loadFrom(deployment, oracleState),
      /PREPROD_B1_POOL_ADDRESS_BECH32_CHECKSUM_INVALID/,
    )
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
