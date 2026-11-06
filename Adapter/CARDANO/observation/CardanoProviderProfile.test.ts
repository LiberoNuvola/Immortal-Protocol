import { describe, expect, it } from 'vitest'
import {
  CARDANO_PROVIDER_CAPABILITIES,
  areCardanoProviderSourcesIndependent,
  assertProviderQualificationForPurpose,
  computeCardanoProviderCoverageDigests,
  validateCardanoProviderObservation,
  validateCardanoProviderProfile,
  validateProviderQualificationDecision,
  type CardanoProviderCapability,
  type CardanoProviderCapabilitySource,
  type CardanoProviderCollectionCoverage,
  type CardanoProviderCoverageSegment,
  type CardanoProviderObservation,
  type CardanoProviderProfile,
  type ProviderQualificationDecision,
} from './CardanoProviderProfile'

const H1 = '11'.repeat(32)
const H2 = '22'.repeat(32)
const H3 = '33'.repeat(32)
const H4 = '44'.repeat(32)
const NOW = '2026-11-06T20:00:00.000Z'

const primarySource: CardanoProviderCapabilitySource = {
  capability: 'address-utxos',
  upstreamId: 'koios-preprod-indexer',
  operatorId: 'koios-operator',
  endpointId: 'koios-preprod-rest',
  independenceGroup: 'koios-preprod-indexer-cluster',
}

function sourceFor(capability: CardanoProviderCapability): CardanoProviderCapabilitySource {
  return { ...primarySource, capability }
}

function makeProfile(overrides: Partial<CardanoProviderProfile> = {}): CardanoProviderProfile {
  const capabilities = CARDANO_PROVIDER_CAPABILITIES.map(capability => ({
    capability,
    support: capability === 'delegation-account' ? 'unsupported' as const : 'supported' as const,
    ...(capability === 'delegation-account'
      ? { reason: 'This provider profile does not expose authoritative delegation-account data.' }
      : {}),
  }))
  const capabilitySources = capabilities
    .filter(item => item.support === 'supported')
    .map(item => sourceFor(item.capability))
  return {
    profileId: 'koios-preprod-v1',
    serviceId: 'koios',
    operatorId: 'koios-operator',
    mode: 'hosted',
    endpointUrl: 'https://preprod.koios.rest/api/v1',
    apiVersion: 'koios-api-v1',
    clientVersion: 'immortal-observer-test-1',
    network: { networkId: 'preprod', networkMagic: 1 },
    capabilities,
    capabilitySources,
    ...overrides,
  }
}

function segment(
  overrides: Partial<CardanoProviderCoverageSegment> = {},
): CardanoProviderCoverageSegment {
  return {
    ordinal: 0,
    itemCount: 1,
    itemDigest: H1,
    rawResponseDigest: H2,
    ...overrides,
  }
}

function makeCoverage(
  overrides: Partial<CardanoProviderCollectionCoverage> = {},
): CardanoProviderCollectionCoverage {
  const initial = {
    mode: 'none' as const,
    terminalCondition: 'not-applicable' as const,
    segments: [segment()],
    itemCount: 1,
    ...overrides,
  }
  return {
    ...initial,
    ...computeCardanoProviderCoverageDigests(initial),
  }
}

function makeObservation(
  overrides: Partial<CardanoProviderObservation> = {},
): CardanoProviderObservation {
  return {
    observationId: 'obs-001',
    profileId: 'koios-preprod-v1',
    capability: 'address-utxos',
    request: {
      method: 'GET',
      route: '/addresses/addr_test1fixture/utxos',
      parametersDigest: H3,
      scope: 'all UTxOs at the exact fixture address',
    },
    source: sourceFor('address-utxos'),
    startedAt: NOW,
    completedAt: '2026-11-06T20:00:01.000Z',
    rawResponseDigest: H4,
    resultClass: 'complete',
    coverage: makeCoverage(),
    chainTipBefore: { slot: 100, blockNo: 10, blockHash: H1 },
    chainTipAfter: { slot: 100, blockNo: 10, blockHash: H1 },
    chainChange: 'stable',
    indexerWatermark: {
      kind: 'slot',
      value: '100',
      observedAt: '2026-11-06T20:00:00.500Z',
      freshness: 'current',
    },
    ...overrides,
  }
}

function makeDecision(
  overrides: Partial<ProviderQualificationDecision> = {},
): ProviderQualificationDecision {
  return {
    decisionId: 'qualification-001',
    profileId: 'koios-preprod-v1',
    scope: 'provider-evidence-only',
    purposeId: 'cardano-read-observation-fixture',
    purposeVersion: 'v1',
    rulesetVersion: 'provider-qualification-v0.1',
    status: 'qualified',
    capabilities: ['address-utxos', 'chain-tip'],
    evidenceReferences: [{ reference: 'evidence://fixture/001', digest: H1 }],
    actor: { kind: 'process', id: 'provider-qualification-ci' },
    decidedAt: NOW,
    validUntil: '2026-11-07T20:00:00.000Z',
    limitations: ['Fixture qualification only; no economic or protocol authority.'],
    ...overrides,
  }
}

describe('Cardano provider profile contract', () => {
  it('accepts an explicit network-bound profile with every capability declared', () => {
    expect(() => validateCardanoProviderProfile(makeProfile())).not.toThrow()
  })

  it('rejects an omitted capability instead of silently treating it as supported', () => {
    const profile = makeProfile({
      capabilities: makeProfile().capabilities.filter(
        item => item.capability !== 'transaction-status',
      ),
    })
    expect(() => validateCardanoProviderProfile(profile)).toThrow(
      'provider capability must be explicit: transaction-status',
    )
  })

  it('rejects duplicate capability declarations', () => {
    const profile = makeProfile()
    expect(() => validateCardanoProviderProfile({
      ...profile,
      capabilities: [...profile.capabilities, profile.capabilities[0]],
    })).toThrow('duplicate provider capability')
  })

  it('requires a reason and forbids upstreams for unsupported capabilities', () => {
    const profile = makeProfile()
    const capabilities = profile.capabilities.map(item =>
      item.capability === 'delegation-account' ? { ...item, reason: '' } : item,
    )
    expect(() => validateCardanoProviderProfile({ ...profile, capabilities }))
      .toThrow('unsupported capability reason')

    const withFalseSource = {
      ...profile,
      capabilitySources: [
        ...profile.capabilitySources,
        sourceFor('delegation-account'),
      ],
    }
    expect(() => validateCardanoProviderProfile(withFalseSource))
      .toThrow('unsupported capability must not declare an upstream source')
  })

  it('rejects endpoint credentials, query strings and fragments', () => {
    for (const endpointUrl of [
      'https://user:secret@example.test/api',
      'https://provider.example/api?project_id=secret',
      'https://provider.example/api#fragment',
    ]) {
      expect(() => validateCardanoProviderProfile(makeProfile({ endpointUrl })))
        .toThrow('endpointUrl must not contain credentials, query parameters, or a fragment')
    }
  })

  it('allows HTTP only for a loopback development endpoint', () => {
    expect(() => validateCardanoProviderProfile(
      makeProfile({ endpointUrl: 'http://localhost:3000/koios' }),
    )).not.toThrow()
    expect(() => validateCardanoProviderProfile(
      makeProfile({ endpointUrl: 'http://provider.example/api' }),
    )).toThrow('endpointUrl must use HTTPS')
  })

  it('requires composite profiles to identify multiple actual upstreams', () => {
    expect(() => validateCardanoProviderProfile(makeProfile({ mode: 'composite' })))
      .toThrow('composite profile must identify at least two distinct upstreams')
    const profile = makeProfile()
    const compositeSources = profile.capabilitySources.map(source => ({ ...source }))
    compositeSources[0] = {
      ...compositeSources[0],
      upstreamId: 'ogmios-node-preprod',
      operatorId: 'node-operator',
      endpointId: 'ogmios-preprod',
      independenceGroup: 'ogmios-node-cluster',
    }
    expect(() => validateCardanoProviderProfile({
      ...profile,
      mode: 'composite',
      capabilitySources: compositeSources,
    })).not.toThrow()
  })

  it('does not count aliases, shared operators or a shared failure domain as independent', () => {
    const alias = {
      ...primarySource,
      endpointId: 'second-dns-alias',
    }
    const sameOperator = {
      ...primarySource,
      upstreamId: 'different-upstream',
      endpointId: 'different-endpoint',
      independenceGroup: 'different-group',
    }
    const independent = {
      ...primarySource,
      upstreamId: 'ogmios-node',
      operatorId: 'independent-operator',
      endpointId: 'ogmios',
      independenceGroup: 'ogmios-node-cluster',
    }
    expect(areCardanoProviderSourcesIndependent(primarySource, alias)).toBe(false)
    expect(areCardanoProviderSourcesIndependent(primarySource, sameOperator)).toBe(false)
    expect(areCardanoProviderSourcesIndependent(primarySource, independent)).toBe(true)
  })
})

describe('Cardano provider observation contract', () => {
  it('accepts an observation whose actual upstream is declared for that capability', () => {
    expect(() => validateCardanoProviderObservation(
      makeObservation(),
      makeProfile(),
    )).not.toThrow()
  })

  it('rejects an observation bound to a different provider profile', () => {
    expect(() => validateCardanoProviderObservation(
      makeObservation({ profileId: 'other-profile' }),
      makeProfile(),
    )).toThrow('observation profile binding mismatch')
  })

  it('rejects an unregistered failover or upstream substitution', () => {
    const observation = makeObservation({
      source: { ...sourceFor('address-utxos'), upstreamId: 'silent-fallback' },
    })
    expect(() => validateCardanoProviderObservation(observation, makeProfile()))
      .toThrow('observation upstream is not declared for this capability')
  })

  it('rejects query strings, traversal and encoded traversal in request routes', () => {
    for (const route of [
      '/addresses/x/utxos?page=2',
      '/addresses/../utxos',
      '/addresses/%2e%2e/utxos',
      '/addresses/' + String.fromCharCode(92) + 'evil/utxos',
      '//other-host/utxos',
    ]) {
      expect(() => validateCardanoProviderObservation(
        makeObservation({ request: { ...makeObservation().request, route } }),
        makeProfile(),
      )).toThrow('request route must be a safe relative path without query or traversal')
    }
  })

  it('allows POST only for the declared transaction-submit capability', () => {
    expect(() => validateCardanoProviderObservation(
      makeObservation({ request: { ...makeObservation().request, method: 'POST' } }),
      makeProfile(),
    )).toThrow('only transaction-submit may use POST')
  })

  it('distinguishes a genuinely empty completed collection from an unavailable response', () => {
    const emptyCoverage = makeCoverage({
      segments: [segment({ itemCount: 0, itemDigest: H1 })],
      itemCount: 0,
    })
    expect(() => validateCardanoProviderObservation(
      makeObservation({ resultClass: 'empty', coverage: emptyCoverage }),
      makeProfile(),
    )).not.toThrow()

    const unavailableCoverage = makeCoverage({
      terminalCondition: 'not-reached',
      segments: [],
      itemCount: 0,
    })
    expect(() => validateCardanoProviderObservation(
      makeObservation({
        resultClass: 'unavailable',
        rawResponseDigest: null,
        coverage: unavailableCoverage,
        failure: { kind: 'timeout', retrySafety: 'safe' },
      }),
      makeProfile(),
    )).not.toThrow()
  })

  it('does not normalize a malformed provider response into an empty result', () => {
    const malformed = makeObservation({
      resultClass: 'malformed',
      failure: { kind: 'malformed-response', retrySafety: 'unknown', httpStatus: 200 },
    })
    expect(() => validateCardanoProviderObservation(malformed, makeProfile())).not.toThrow()
    expect(() => validateCardanoProviderObservation({
      ...malformed,
      resultClass: 'empty',
      failure: undefined,
    }, makeProfile())).toThrow('empty result requires zero items')
  })

  it('accepts complete page coverage only when page numbers are contiguous', () => {
    const segments = [
      segment({ ordinal: 0, page: 1, itemCount: 1, itemDigest: H1, rawResponseDigest: H2 }),
      segment({ ordinal: 1, page: 2, itemCount: 2, itemDigest: H3, rawResponseDigest: H4 }),
    ]
    const coverage = makeCoverage({
      mode: 'page',
      terminalCondition: 'provider-end',
      segments,
      itemCount: 3,
    })
    expect(() => validateCardanoProviderObservation(
      makeObservation({ coverage }),
      makeProfile(),
    )).not.toThrow()

    const gapCoverage = makeCoverage({
      mode: 'page',
      terminalCondition: 'provider-end',
      segments: [segments[0], { ...segments[1], page: 3 }],
      itemCount: 3,
    })
    expect(() => validateCardanoProviderObservation(
      makeObservation({ coverage: gapCoverage }),
      makeProfile(),
    )).toThrow('page coverage contains a missing or out-of-order page')
  })

  it('accepts cursor chains without storing raw cursors and rejects cursor cycles', () => {
    const segments = [
      segment({
        ordinal: 0,
        cursorInDigest: null,
        cursorOutDigest: H1,
        itemDigest: H2,
        rawResponseDigest: H3,
      }),
      segment({
        ordinal: 1,
        cursorInDigest: H1,
        cursorOutDigest: null,
        itemDigest: H3,
        rawResponseDigest: H4,
      }),
    ]
    const coverage = makeCoverage({
      mode: 'cursor',
      terminalCondition: 'provider-end',
      segments,
      itemCount: 2,
    })
    expect(() => validateCardanoProviderObservation(
      makeObservation({ coverage }),
      makeProfile(),
    )).not.toThrow()

    const cycleCoverage = makeCoverage({
      mode: 'cursor',
      terminalCondition: 'not-reached',
      segments: [
        segments[0],
        { ...segments[1], cursorOutDigest: H1 },
      ],
      itemCount: 2,
    })
    expect(() => validateCardanoProviderObservation(
      makeObservation({
        resultClass: 'partial',
        coverage: cycleCoverage,
        failure: { kind: 'cursor-cycle', retrySafety: 'unknown' },
      }),
      makeProfile(),
    )).toThrow('cursor coverage contains a cursor cycle')
  })

  it('requires range partitions to be contiguous and cover the requested interval', () => {
    const segments = [
      segment({ ordinal: 0, rangeFrom: 'slot:100', rangeTo: 'slot:200' }),
      segment({ ordinal: 1, rangeFrom: 'slot:200', rangeTo: 'slot:300', itemDigest: H3 }),
    ]
    const coverage = makeCoverage({
      mode: 'range',
      requestedInterval: { from: 'slot:100', to: 'slot:300' },
      terminalCondition: 'range-complete',
      segments,
      itemCount: 2,
    })
    expect(() => validateCardanoProviderObservation(
      makeObservation({ coverage }),
      makeProfile(),
    )).not.toThrow()

    const gapCoverage = makeCoverage({
      mode: 'range',
      requestedInterval: { from: 'slot:100', to: 'slot:300' },
      terminalCondition: 'range-complete',
      segments: [
        segments[0],
        { ...segments[1], rangeFrom: 'slot:250' },
      ],
      itemCount: 2,
    })
    expect(() => validateCardanoProviderObservation(
      makeObservation({ coverage: gapCoverage }),
      makeProfile(),
    )).toThrow('range coverage contains a gap or overlap')
  })

  it('recomputes coverage manifests and rejects item-count/digest mismatches', () => {
    const coverage = makeCoverage()
    expect(() => validateCardanoProviderObservation(
      makeObservation({ coverage: { ...coverage, itemCount: 2 } }),
      makeProfile(),
    )).toThrow('coverage item count does not match the segment count total')
    expect(() => validateCardanoProviderObservation(
      makeObservation({ coverage: { ...coverage, itemsDigest: H4 } }),
      makeProfile(),
    )).toThrow('coverage item digest manifest mismatch')
  })

  it('keeps chain tip consistency separate from a stale indexer watermark', () => {
    const stale = makeObservation({
      resultClass: 'stale',
      indexerWatermark: {
        kind: 'slot',
        value: '90',
        observedAt: NOW,
        freshness: 'stale',
      },
    })
    expect(() => validateCardanoProviderObservation(stale, makeProfile())).not.toThrow()
  })

  it('requires explicit rollback and reorg classifications', () => {
    const rollback = makeObservation({
      chainTipBefore: { slot: 200, blockNo: 20, blockHash: H1 },
      chainTipAfter: { slot: 100, blockNo: 10, blockHash: H2 },
      chainChange: 'stable',
    })
    expect(() => validateCardanoProviderObservation(rollback, makeProfile()))
      .toThrow('a decreasing chain tip must be classified as rollback')

    const reorg = makeObservation({
      chainTipBefore: { slot: 100, blockNo: 10, blockHash: H1 },
      chainTipAfter: { slot: 100, blockNo: 10, blockHash: H2 },
      chainChange: 'advanced',
    })
    expect(() => validateCardanoProviderObservation(reorg, makeProfile()))
      .toThrow('a changed block hash at the same height must be classified as reorg')
  })

  it('keeps unsupported capabilities distinct from empty results', () => {
    const coverage = makeCoverage({
      terminalCondition: 'not-reached',
      segments: [],
      itemCount: 0,
    })
    const unsupported = makeObservation({
      capability: 'delegation-account',
      source: {
        capability: 'delegation-account',
        upstreamId: '',
        operatorId: '',
        endpointId: '',
        independenceGroup: '',
      },
      resultClass: 'unsupported',
      rawResponseDigest: null,
      coverage,
      chainTipBefore: null,
      chainTipAfter: null,
      chainChange: 'unknown',
      indexerWatermark: null,
    })
    expect(() => validateCardanoProviderObservation(unsupported, makeProfile())).not.toThrow()
  })

  it('never labels provider confirmations as protocol finality', () => {
    const observation = makeObservation({
      capability: 'transaction-status',
      request: {
        method: 'GET',
        route: '/txs/' + H1 + '/status',
        parametersDigest: H3,
        scope: 'transaction status for fixture transaction',
      },
      source: sourceFor('transaction-status'),
      transactionLifecycle: {
        inclusion: 'confirmed',
        confirmations: 12,
        protocolFinality: 'not-assessed',
      },
    })
    expect(() => validateCardanoProviderObservation(observation, makeProfile())).not.toThrow()
    expect(() => validateCardanoProviderObservation({
      ...observation,
      transactionLifecycle: {
        inclusion: 'confirmed',
        confirmations: 12,
        protocolFinality: 'final',
      } as unknown as CardanoProviderObservation['transactionLifecycle'],
    }, makeProfile())).toThrow('provider confirmation cannot assert protocol finality')
  })
})

describe('purpose-scoped provider qualification', () => {
  it('accepts a named evidence-only qualification decision', () => {
    expect(() => validateProviderQualificationDecision(makeDecision())).not.toThrow()
    expect(() => assertProviderQualificationForPurpose(makeDecision(), {
      profileId: 'koios-preprod-v1',
      purposeId: 'cardano-read-observation-fixture',
      purposeVersion: 'v1',
    })).not.toThrow()
  })

  it('does not promote a qualification from another purpose or profile', () => {
    expect(() => assertProviderQualificationForPurpose(makeDecision(), {
      profileId: 'koios-preprod-v1',
      purposeId: 'pre-rich-eev',
      purposeVersion: 'v1',
    })).toThrow('provider qualification purpose mismatch')

    expect(() => assertProviderQualificationForPurpose(makeDecision(), {
      profileId: 'other-profile',
      purposeId: 'cardano-read-observation-fixture',
      purposeVersion: 'v1',
    })).toThrow('provider qualification profile mismatch')
  })

  it('does not treat insufficient evidence as a qualification', () => {
    expect(() => assertProviderQualificationForPurpose(
      makeDecision({ status: 'insufficient-evidence' }),
      {
        profileId: 'koios-preprod-v1',
        purposeId: 'cardano-read-observation-fixture',
        purposeVersion: 'v1',
      },
    )).toThrow('provider evidence is not qualified for this purpose')
  })

  it('requires evidence digests, ruleset identity and an evidence-only scope', () => {
    expect(() => validateProviderQualificationDecision(
      makeDecision({ evidenceReferences: [] }),
    )).toThrow('qualification requires at least one evidence reference')
    expect(() => validateProviderQualificationDecision(
      makeDecision({ scope: 'economic-authority' as unknown as 'provider-evidence-only' }),
    )).toThrow('provider qualification scope must remain provider-evidence-only')
  })
})
