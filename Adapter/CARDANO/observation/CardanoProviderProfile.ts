import { sha256 } from '@noble/hashes/sha256'
import { bytesToHex, utf8ToBytes } from '@noble/hashes/utils'

/**
 * Non-normative Cardano infrastructure evidence contract.
 *
 * These records qualify the quality/provenance of provider observations for a
 * named purpose. They do not grant chain, protocol, economic, or application
 * authority and they do not replace ledger validation.
 */

export const CARDANO_PROVIDER_CAPABILITIES = [
  'address-utxos',
  'utxo-by-reference',
  'datum-by-hash',
  'asset-addresses',
  'transaction-by-hash',
  'chain-tip',
  'protocol-parameters',
  'transaction-submit',
  'transaction-status',
  'delegation-account',
] as const

export type CardanoProviderCapability =
  (typeof CARDANO_PROVIDER_CAPABILITIES)[number]

export type CardanoProviderMode = 'hosted' | 'direct' | 'community' | 'composite'

export type CardanoNetworkBinding = {
  networkId: string
  networkMagic: number
  genesisHash?: string
}

export type CardanoProviderCapabilityDeclaration = {
  capability: CardanoProviderCapability
  support: 'supported' | 'unsupported'
  reason?: string
}

/**
 * Identifies the actual upstream selected for a capability. endpointId is a
 * stable, non-secret label; it is not an endpoint URL or credential.
 * independenceGroup is an operator-declared canonical upstream/failure-domain
 * identifier used to avoid counting aliases as independent sources.
 */
export type CardanoProviderCapabilitySource = {
  capability: CardanoProviderCapability
  upstreamId: string
  operatorId: string
  endpointId: string
  independenceGroup: string
}

export type CardanoProviderProfile = {
  profileId: string
  serviceId: string
  operatorId: string
  mode: CardanoProviderMode
  endpointUrl: string
  apiVersion: string
  clientVersion: string
  network: CardanoNetworkBinding
  capabilities: readonly CardanoProviderCapabilityDeclaration[]
  capabilitySources: readonly CardanoProviderCapabilitySource[]
}

export type CardanoProviderResultClass =
  | 'complete'
  | 'empty'
  | 'partial'
  | 'unavailable'
  | 'malformed'
  | 'stale'
  | 'unsupported'
  | 'disagreement'

export type CardanoProviderFailureKind =
  | 'timeout'
  | 'rate-limit'
  | 'transport'
  | 'provider-error'
  | 'malformed-response'
  | 'incomplete-collection'
  | 'page-gap'
  | 'cursor-gap'
  | 'cursor-cycle'
  | 'stale-response'
  | 'provider-disagreement'

export type CardanoProviderFailure = {
  kind: CardanoProviderFailureKind
  retrySafety: 'safe' | 'unsafe' | 'unknown'
  httpStatus?: number
}

export type CardanoProviderChainPoint = {
  slot: number
  blockNo: number
  blockHash: string
}

export type CardanoProviderIndexerWatermark = {
  kind: 'slot' | 'block' | 'timestamp'
  value: string
  observedAt: string
  freshness: 'current' | 'stale' | 'unknown'
}

export type CardanoProviderCoverageSegment = {
  ordinal: number
  page?: number
  /** Hash of the opaque cursor token; raw cursor values are not stored. */
  cursorInDigest?: string | null
  /** Hash of the opaque cursor token; null means the provider reported end. */
  cursorOutDigest?: string | null
  /** Canonical half-open boundaries for a range partition. */
  rangeFrom?: string
  rangeTo?: string
  itemCount: number
  /** SHA-256 of this segment's ordered normalized item stream. */
  itemDigest: string
  /** SHA-256 of the unmodified response bytes for this segment. */
  rawResponseDigest: string
}

export type CardanoProviderCollectionCoverage = {
  mode: 'none' | 'page' | 'cursor' | 'range'
  requestedInterval?: { from: string; to: string }
  terminalCondition: 'provider-end' | 'range-complete' | 'not-applicable' | 'not-reached'
  segments: readonly CardanoProviderCoverageSegment[]
  itemCount: number
  /** SHA-256 digest-of-digests over the ordered segment item digests. */
  itemsDigest: string
  /** SHA-256 digest of the complete ordered coverage manifest. */
  coverageDigest: string
}

export type CardanoProviderObservation = {
  observationId: string
  profileId: string
  capability: CardanoProviderCapability
  request: {
    method: 'GET' | 'POST'
    /** Relative route only; query parameters are represented by parametersDigest. */
    route: string
    parametersDigest: string
    scope: string
  }
  /** The actual upstream used for this operation, not a configured fallback. */
  source: CardanoProviderCapabilitySource
  startedAt: string
  completedAt: string
  rawResponseDigest?: string | null
  resultClass: CardanoProviderResultClass
  coverage: CardanoProviderCollectionCoverage
  chainTipBefore?: CardanoProviderChainPoint | null
  chainTipAfter?: CardanoProviderChainPoint | null
  chainChange: 'stable' | 'advanced' | 'rollback' | 'reorg' | 'unknown'
  /** Kept separate from the node/chain tip; indexer freshness is not inferred from tip equality. */
  indexerWatermark?: CardanoProviderIndexerWatermark | null
  failure?: CardanoProviderFailure
  /**
   * Inclusion/confirmation is a provider observation only. Protocol finality
   * is deliberately never asserted by this v0.1 contract.
   */
  transactionLifecycle?: {
    inclusion: 'unknown' | 'mempool' | 'included' | 'confirmed'
    confirmations?: number
    protocolFinality: 'not-assessed'
  }
}

export type ProviderQualificationStatus =
  | 'qualified'
  | 'not-qualified'
  | 'insufficient-evidence'
  | 'disputed'
  | 'expired'

export type ProviderQualificationDecision = {
  decisionId: string
  profileId: string
  /** Qualification is intentionally evidence-only and purpose-scoped. */
  scope: 'provider-evidence-only'
  purposeId: string
  purposeVersion: string
  rulesetVersion: string
  status: ProviderQualificationStatus
  capabilities: readonly CardanoProviderCapability[]
  evidenceReferences: readonly {
    reference: string
    digest: string
  }[]
  actor: {
    kind: 'human' | 'process'
    id: string
  }
  decidedAt: string
  validUntil?: string
  limitations: readonly string[]
}

function nonEmpty(value: string, name: string): void {
  if (typeof value !== 'string' || !value.trim() || /[\u0000-\u001f]/.test(value)) {
    throw new Error(name + ' must be a non-empty printable string')
  }
}

function nonNegativeInteger(value: number, name: string): void {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new Error(name + ' must be a non-negative safe integer')
  }
}

function digest(value: string, name: string): void {
  if (!/^[0-9a-f]{64}$/i.test(value)) {
    throw new Error(name + ' must be a 32-byte SHA-256 hex digest')
  }
}

function timestamp(value: string, name: string): number {
  nonEmpty(value, name)
  const parsed = Date.parse(value)
  if (!Number.isFinite(parsed)) throw new Error(name + ' must be a valid timestamp')
  return parsed
}

function validateEndpointUrl(value: string): void {
  nonEmpty(value, 'endpointUrl')
  let parsed: URL
  try {
    parsed = new URL(value)
  } catch {
    throw new Error('endpointUrl must be an absolute URL')
  }
  const localHttp =
    parsed.protocol === 'http:' &&
    (parsed.hostname === 'localhost' ||
      parsed.hostname === '127.0.0.1' ||
      parsed.hostname === '[::1]')
  if (parsed.protocol !== 'https:' && !localHttp) {
    throw new Error('endpointUrl must use HTTPS (HTTP is allowed only for loopback)')
  }
  if (parsed.username || parsed.password || parsed.search || parsed.hash) {
    throw new Error('endpointUrl must not contain credentials, query parameters, or a fragment')
  }
}

function supportedDeclaration(
  profile: CardanoProviderProfile,
  capability: CardanoProviderCapability,
): CardanoProviderCapabilityDeclaration {
  const declaration = profile.capabilities.find(item => item.capability === capability)
  if (!declaration) throw new Error('provider capability is not declared: ' + capability)
  return declaration
}

function stableJson(value: unknown): string {
  return JSON.stringify(value)
}

function sha256Hex(value: string): string {
  return bytesToHex(sha256(utf8ToBytes(value)))
}

/**
 * The top-level digest commits to the ordered per-segment digests and coverage
 * metadata. It is a digest-of-digests, not a substitute for retaining the raw
 * response or normalized items referenced by each segment.
 */
export function computeCardanoProviderCoverageDigests(
  coverage: Pick<
    CardanoProviderCollectionCoverage,
    'mode' | 'requestedInterval' | 'terminalCondition' | 'segments' | 'itemCount'
  >,
): { itemsDigest: string; coverageDigest: string } {
  const itemsManifest = coverage.segments.map(segment => ({
    ordinal: segment.ordinal,
    itemCount: segment.itemCount,
    itemDigest: segment.itemDigest.toLowerCase(),
  }))
  return {
    itemsDigest: sha256Hex(stableJson(itemsManifest)),
    coverageDigest: sha256Hex(stableJson({
      mode: coverage.mode,
      requestedInterval: coverage.requestedInterval ?? null,
      terminalCondition: coverage.terminalCondition,
      itemCount: coverage.itemCount,
      segments: coverage.segments.map(segment => ({
        ordinal: segment.ordinal,
        page: segment.page ?? null,
        cursorInDigest: segment.cursorInDigest ?? null,
        cursorOutDigest: segment.cursorOutDigest ?? null,
        rangeFrom: segment.rangeFrom ?? null,
        rangeTo: segment.rangeTo ?? null,
        itemCount: segment.itemCount,
        itemDigest: segment.itemDigest.toLowerCase(),
        rawResponseDigest: segment.rawResponseDigest.toLowerCase(),
      })),
    })),
  }
}

export function validateCardanoProviderProfile(profile: CardanoProviderProfile): void {
  nonEmpty(profile.profileId, 'profileId')
  nonEmpty(profile.serviceId, 'serviceId')
  nonEmpty(profile.operatorId, 'operatorId')
  nonEmpty(profile.apiVersion, 'apiVersion')
  nonEmpty(profile.clientVersion, 'clientVersion')
  validateEndpointUrl(profile.endpointUrl)

  if (!['hosted', 'direct', 'community', 'composite'].includes(profile.mode)) {
    throw new Error('unsupported Cardano provider mode')
  }
  nonEmpty(profile.network.networkId, 'network.networkId')
  nonNegativeInteger(profile.network.networkMagic, 'network.networkMagic')
  if (profile.network.genesisHash !== undefined) {
    digest(profile.network.genesisHash, 'network.genesisHash')
  }

  const declarations = new Map<CardanoProviderCapability, CardanoProviderCapabilityDeclaration>()
  for (const declaration of profile.capabilities) {
    if (!CARDANO_PROVIDER_CAPABILITIES.includes(declaration.capability)) {
      throw new Error('unknown provider capability')
    }
    if (declarations.has(declaration.capability)) {
      throw new Error('duplicate provider capability: ' + declaration.capability)
    }
    if (declaration.support === 'unsupported') {
      nonEmpty(declaration.reason ?? '', 'unsupported capability reason')
    } else if (declaration.support !== 'supported') {
      throw new Error('invalid provider capability support state')
    }
    declarations.set(declaration.capability, declaration)
  }
  for (const capability of CARDANO_PROVIDER_CAPABILITIES) {
    if (!declarations.has(capability)) {
      throw new Error('provider capability must be explicit: ' + capability)
    }
  }

  const sourceKeys = new Set<string>()
  for (const source of profile.capabilitySources) {
    nonEmpty(source.upstreamId, 'source.upstreamId')
    nonEmpty(source.operatorId, 'source.operatorId')
    nonEmpty(source.endpointId, 'source.endpointId')
    nonEmpty(source.independenceGroup, 'source.independenceGroup')
    const declaration = declarations.get(source.capability)
    if (!declaration || declaration.support !== 'supported') {
      throw new Error('unsupported capability must not declare an upstream source')
    }
    const key = [source.capability, source.upstreamId, source.endpointId].join('|')
    if (sourceKeys.has(key)) throw new Error('duplicate capability source')
    sourceKeys.add(key)
  }

  for (const [capability, declaration] of declarations) {
    const sourceCount = profile.capabilitySources.filter(
      source => source.capability === capability,
    ).length
    if (declaration.support === 'supported' && sourceCount === 0) {
      throw new Error('supported capability has no declared source: ' + capability)
    }
    if (declaration.support === 'unsupported' && sourceCount !== 0) {
      throw new Error('unsupported capability has a declared source: ' + capability)
    }
  }

  if (profile.mode !== 'composite') {
    const sources = profile.capabilitySources
    if (
      new Set(sources.map(source => source.upstreamId)).size > 1 ||
      new Set(sources.map(source => source.operatorId)).size > 1 ||
      new Set(sources.map(source => source.independenceGroup)).size > 1
    ) {
      throw new Error('non-composite profile cannot route capabilities across different upstreams')
    }
  } else if (new Set(profile.capabilitySources.map(source => source.upstreamId)).size < 2) {
    throw new Error('composite profile must identify at least two distinct upstreams')
  }
}

/**
 * Conservative source-independence test. A shared upstream, operator, or
 * declared failure-domain group is not counted as independent.
 */
export function areCardanoProviderSourcesIndependent(
  left: CardanoProviderCapabilitySource,
  right: CardanoProviderCapabilitySource,
): boolean {
  return (
    left.upstreamId !== right.upstreamId &&
    left.operatorId !== right.operatorId &&
    left.independenceGroup !== right.independenceGroup
  )
}

function validateCoverage(
  coverage: CardanoProviderCollectionCoverage,
  resultClass: CardanoProviderResultClass,
): void {
  nonNegativeInteger(coverage.itemCount, 'coverage.itemCount')
  digest(coverage.itemsDigest, 'coverage.itemsDigest')
  digest(coverage.coverageDigest, 'coverage.coverageDigest')

  if (coverage.requestedInterval) {
    nonEmpty(coverage.requestedInterval.from, 'coverage.requestedInterval.from')
    nonEmpty(coverage.requestedInterval.to, 'coverage.requestedInterval.to')
    if (coverage.requestedInterval.from >= coverage.requestedInterval.to) {
      throw new Error('requested interval must be a non-empty half-open range')
    }
  }

  let segmentCount = 0
  for (let index = 0; index < coverage.segments.length; index += 1) {
    const segment = coverage.segments[index]
    if (segment.ordinal !== index) throw new Error('coverage segment ordinals must be contiguous from zero')
    nonNegativeInteger(segment.itemCount, 'coverage segment itemCount')
    digest(segment.itemDigest, 'coverage segment itemDigest')
    digest(segment.rawResponseDigest, 'coverage segment rawResponseDigest')
    segmentCount += segment.itemCount
  }
  if (segmentCount !== coverage.itemCount) {
    throw new Error('coverage item count does not match the segment count total')
  }

  const calculated = computeCardanoProviderCoverageDigests(coverage)
  if (calculated.itemsDigest !== coverage.itemsDigest.toLowerCase()) {
    throw new Error('coverage item digest manifest mismatch')
  }
  if (calculated.coverageDigest !== coverage.coverageDigest.toLowerCase()) {
    throw new Error('coverage digest manifest mismatch')
  }

  if (coverage.mode === 'none') {
    if (
      coverage.segments.length !== 1 ||
      coverage.terminalCondition !== 'not-applicable' ||
      coverage.requestedInterval !== undefined
    ) {
      throw new Error('non-paginated coverage requires one segment and not-applicable terminal condition')
    }
    const segment = coverage.segments[0]
    if (
      segment.page !== undefined ||
      segment.cursorInDigest !== undefined ||
      segment.cursorOutDigest !== undefined ||
      segment.rangeFrom !== undefined ||
      segment.rangeTo !== undefined
    ) {
      throw new Error('non-paginated coverage cannot carry page, cursor, or range markers')
    }
  } else if (coverage.mode === 'page') {
    if (!coverage.segments.length) throw new Error('page coverage requires at least one page')
    if (!['provider-end', 'not-reached'].includes(coverage.terminalCondition)) {
      throw new Error('page coverage requires provider-end or not-reached terminal condition')
    }
    let previousPage: number | undefined
    for (const segment of coverage.segments) {
      if (!Number.isSafeInteger(segment.page) || (segment.page ?? -1) < 0) {
        throw new Error('page coverage requires a non-negative page number for every segment')
      }
      if (previousPage !== undefined && segment.page !== previousPage + 1) {
        throw new Error('page coverage contains a missing or out-of-order page')
      }
      if (
        segment.cursorInDigest !== undefined ||
        segment.cursorOutDigest !== undefined ||
        segment.rangeFrom !== undefined ||
        segment.rangeTo !== undefined
      ) throw new Error('page coverage contains markers for another pagination mode')
      previousPage = segment.page
    }
  } else if (coverage.mode === 'cursor') {
    if (!coverage.segments.length) throw new Error('cursor coverage requires at least one segment')
    if (!['provider-end', 'not-reached'].includes(coverage.terminalCondition)) {
      throw new Error('cursor coverage requires provider-end or not-reached terminal condition')
    }
    const seen = new Set<string>()
    for (let index = 0; index < coverage.segments.length; index += 1) {
      const segment = coverage.segments[index]
      if (segment.page !== undefined || segment.rangeFrom !== undefined || segment.rangeTo !== undefined) {
        throw new Error('cursor coverage contains markers for another pagination mode')
      }
      const input = segment.cursorInDigest
      const output = segment.cursorOutDigest
      if (index === 0 ? input !== null : input !== coverage.segments[index - 1].cursorOutDigest) {
        throw new Error('cursor coverage has a missing or mismatched cursor link')
      }
      if (input !== null) {
        if (!input) throw new Error('cursor input digest cannot be empty')
        if (seen.has(input)) throw new Error('cursor coverage contains a duplicate cursor')
        seen.add(input)
      }
      if (output !== null) {
        if (!output) throw new Error('cursor output digest cannot be empty')
        if (seen.has(output)) throw new Error('cursor coverage contains a cursor cycle')
        seen.add(output)
      }
    }
    const finalCursor = coverage.segments[coverage.segments.length - 1].cursorOutDigest
    if (coverage.terminalCondition === 'provider-end' && finalCursor !== null) {
      throw new Error('provider-end cursor coverage must end with a null cursor')
    }
    if (coverage.terminalCondition === 'not-reached' && finalCursor === null) {
      throw new Error('not-reached cursor coverage must retain an unresolved cursor')
    }
  } else if (coverage.mode === 'range') {
    const requested = coverage.requestedInterval
    if (!requested || !coverage.segments.length) {
      throw new Error('range coverage requires a requested interval and at least one segment')
    }
    if (!['range-complete', 'not-reached'].includes(coverage.terminalCondition)) {
      throw new Error('range coverage requires range-complete or not-reached terminal condition')
    }
    let previousTo: string | undefined
    for (const segment of coverage.segments) {
      nonEmpty(segment.rangeFrom ?? '', 'range segment rangeFrom')
      nonEmpty(segment.rangeTo ?? '', 'range segment rangeTo')
      if (segment.page !== undefined || segment.cursorInDigest !== undefined || segment.cursorOutDigest !== undefined) {
        throw new Error('range coverage contains markers for another pagination mode')
      }
      if ((segment.rangeFrom ?? '') >= (segment.rangeTo ?? '')) {
        throw new Error('range segment must be a non-empty half-open interval')
      }
      if (previousTo !== undefined && segment.rangeFrom !== previousTo) {
        throw new Error('range coverage contains a gap or overlap')
      }
      previousTo = segment.rangeTo
    }
    if (
      coverage.segments[0].rangeFrom !== requested.from ||
      (coverage.terminalCondition === 'range-complete' &&
        coverage.segments[coverage.segments.length - 1].rangeTo !== requested.to) ||
      (coverage.terminalCondition === 'not-reached' &&
        (coverage.segments[coverage.segments.length - 1].rangeTo ?? '') >= requested.to)
    ) {
      throw new Error('range segments do not match the declared requested interval/terminal condition')
    }
  } else {
    throw new Error('unknown collection coverage mode')
  }

  const complete =
    coverage.terminalCondition === 'provider-end' ||
    coverage.terminalCondition === 'range-complete' ||
    coverage.terminalCondition === 'not-applicable'
  if (resultClass === 'complete' && (!complete || coverage.itemCount === 0)) {
    throw new Error('complete result requires non-empty data and a reached terminal condition')
  }
  if (resultClass === 'empty' && (!complete || coverage.itemCount !== 0)) {
    throw new Error('empty result requires zero items and a reached terminal condition')
  }
  if (resultClass === 'partial' && coverage.terminalCondition !== 'not-reached') {
    throw new Error('partial result must retain an unreached terminal condition')
  }
}

function validateChainPoint(point: CardanoProviderChainPoint, name: string): void {
  nonNegativeInteger(point.slot, name + '.slot')
  nonNegativeInteger(point.blockNo, name + '.blockNo')
  digest(point.blockHash, name + '.blockHash')
}

export function validateCardanoProviderObservation(
  observation: CardanoProviderObservation,
  profile: CardanoProviderProfile,
): void {
  validateCardanoProviderProfile(profile)
  nonEmpty(observation.observationId, 'observationId')
  if (observation.profileId !== profile.profileId) {
    throw new Error('observation profile binding mismatch')
  }

  const declaration = supportedDeclaration(profile, observation.capability)
  nonEmpty(observation.request.scope, 'request.scope')
  nonEmpty(observation.request.route, 'request.route')
  if (
    !observation.request.route.startsWith('/') ||
    observation.request.route.includes('?') ||
    observation.request.route.includes('#') ||
    observation.request.route.split('/').some(segment => segment === '..')
  ) {
    throw new Error('request route must be a safe relative path without query or traversal')
  }
  digest(observation.request.parametersDigest, 'request.parametersDigest')
  if (
    (observation.capability === 'transaction-submit') !==
    (observation.request.method === 'POST')
  ) {
    throw new Error('only transaction-submit may use POST; provider reads must use GET')
  }

  if (declaration.support === 'unsupported') {
    if (observation.resultClass !== 'unsupported') {
      throw new Error('profile declares this capability unsupported')
    }
  } else {
    const sourceMatches = profile.capabilitySources.some(source =>
      source.capability === observation.capability &&
      source.upstreamId === observation.source.upstreamId &&
      source.operatorId === observation.source.operatorId &&
      source.endpointId === observation.source.endpointId &&
      source.independenceGroup === observation.source.independenceGroup,
    )
    if (!sourceMatches) {
      throw new Error('observation upstream is not declared for this capability')
    }
  }

  if (observation.resultClass !== 'unsupported') {
    nonEmpty(observation.source.upstreamId, 'source.upstreamId')
    nonEmpty(observation.source.operatorId, 'source.operatorId')
    nonEmpty(observation.source.endpointId, 'source.endpointId')
    nonEmpty(observation.source.independenceGroup, 'source.independenceGroup')
  }
  const started = timestamp(observation.startedAt, 'startedAt')
  const completed = timestamp(observation.completedAt, 'completedAt')
  if (completed < started) throw new Error('completedAt cannot precede startedAt')

  if (observation.rawResponseDigest != null) {
    digest(observation.rawResponseDigest, 'rawResponseDigest')
  }
  if (
    ['complete', 'empty', 'partial', 'malformed', 'stale', 'disagreement'].includes(
      observation.resultClass,
    ) &&
    !observation.rawResponseDigest
  ) {
    throw new Error('a received provider response requires a raw response digest')
  }

  validateCoverage(observation.coverage, observation.resultClass)

  if ((observation.chainTipBefore == null) !== (observation.chainTipAfter == null)) {
    throw new Error('chain tip before/after must both be present or both be absent')
  }
  if (observation.chainTipBefore && observation.chainTipAfter) {
    validateChainPoint(observation.chainTipBefore, 'chainTipBefore')
    validateChainPoint(observation.chainTipAfter, 'chainTipAfter')
    const before = observation.chainTipBefore
    const after = observation.chainTipAfter
    if (
      (after.slot < before.slot || after.blockNo < before.blockNo) &&
      observation.chainChange !== 'rollback'
    ) {
      throw new Error('a decreasing chain tip must be classified as rollback')
    }
    if (
      after.blockNo === before.blockNo &&
      after.blockHash !== before.blockHash &&
      observation.chainChange !== 'reorg'
    ) {
      throw new Error('a changed block hash at the same height must be classified as reorg')
    }
    if (
      after.slot === before.slot &&
      after.blockNo === before.blockNo &&
      after.blockHash === before.blockHash &&
      observation.chainChange !== 'stable'
    ) {
      throw new Error('an unchanged chain tip must be classified as stable')
    }
  } else if (observation.chainChange !== 'unknown') {
    throw new Error('chain change must be unknown when before/after tips are unavailable')
  }

  if (observation.indexerWatermark) {
    const watermark = observation.indexerWatermark
    nonEmpty(watermark.value, 'indexerWatermark.value')
    timestamp(watermark.observedAt, 'indexerWatermark.observedAt')
    if (watermark.freshness === 'stale' && observation.resultClass !== 'stale') {
      throw new Error('a stale indexer watermark cannot produce a non-stale result')
    }
  }
  if (
    observation.resultClass === 'stale' &&
    observation.indexerWatermark?.freshness !== 'stale' &&
    observation.failure?.kind !== 'stale-response'
  ) {
    throw new Error('stale result requires a stale watermark or stale-response classification')
  }

  if (observation.resultClass === 'unavailable') {
    if (!observation.failure || !['timeout', 'rate-limit', 'transport', 'provider-error'].includes(observation.failure.kind)) {
      throw new Error('unavailable result requires timeout, rate-limit, transport, or provider-error classification')
    }
  } else if (observation.resultClass === 'malformed') {
    if (observation.failure?.kind !== 'malformed-response') {
      throw new Error('malformed result requires malformed-response classification')
    }
  } else if (observation.resultClass === 'partial') {
    if (!observation.failure || !['incomplete-collection', 'page-gap', 'cursor-gap', 'cursor-cycle', 'timeout', 'rate-limit'].includes(observation.failure.kind)) {
      throw new Error('partial result requires an explicit incomplete-collection/failure classification')
    }
  } else if (observation.resultClass === 'disagreement') {
    if (observation.failure?.kind !== 'provider-disagreement') {
      throw new Error('disagreement result requires provider-disagreement classification')
    }
  } else if (
    observation.resultClass === 'stale' &&
    observation.failure &&
    observation.failure.kind !== 'stale-response'
  ) {
    throw new Error('stale result has an incompatible failure classification')
  }
  if (observation.failure) {
    if (!['safe', 'unsafe', 'unknown'].includes(observation.failure.retrySafety)) {
      throw new Error('failure retrySafety must be explicit')
    }
    if (
      observation.failure.httpStatus !== undefined &&
      (!Number.isInteger(observation.failure.httpStatus) ||
        observation.failure.httpStatus < 100 ||
        observation.failure.httpStatus > 599)
    ) {
      throw new Error('failure HTTP status is invalid')
    }
  }

  if (observation.resultClass === 'unsupported' && declaration.support !== 'unsupported') {
    throw new Error('unsupported result conflicts with a supported profile capability')
  }
  if (observation.transactionLifecycle) {
    const lifecycle = observation.transactionLifecycle
    if (lifecycle.protocolFinality !== 'not-assessed') {
      throw new Error('provider confirmation cannot assert protocol finality')
    }
    if (
      lifecycle.confirmations !== undefined &&
      (!Number.isSafeInteger(lifecycle.confirmations) || lifecycle.confirmations < 0)
    ) {
      throw new Error('confirmation count must be a non-negative safe integer')
    }
  }
}

export function validateProviderQualificationDecision(
  decision: ProviderQualificationDecision,
): void {
  nonEmpty(decision.decisionId, 'decisionId')
  nonEmpty(decision.profileId, 'profileId')
  nonEmpty(decision.purposeId, 'purposeId')
  nonEmpty(decision.purposeVersion, 'purposeVersion')
  nonEmpty(decision.rulesetVersion, 'rulesetVersion')
  if (decision.scope !== 'provider-evidence-only') {
    throw new Error('provider qualification scope must remain provider-evidence-only')
  }
  timestamp(decision.decidedAt, 'decidedAt')
  if (decision.validUntil !== undefined) {
    if (timestamp(decision.validUntil, 'validUntil') <= timestamp(decision.decidedAt, 'decidedAt')) {
      throw new Error('validUntil must be later than decidedAt')
    }
  }
  if (!decision.capabilities.length) {
    throw new Error('qualification must name at least one capability')
  }
  const uniqueCapabilities = new Set(decision.capabilities)
  if (
    uniqueCapabilities.size !== decision.capabilities.length ||
    decision.capabilities.some(capability => !CARDANO_PROVIDER_CAPABILITIES.includes(capability))
  ) {
    throw new Error('qualification capabilities must be known and unique')
  }
  if (!decision.evidenceReferences.length) {
    throw new Error('qualification requires at least one evidence reference')
  }
  for (const evidence of decision.evidenceReferences) {
    nonEmpty(evidence.reference, 'evidence.reference')
    digest(evidence.digest, 'evidence.digest')
  }
  if (!['human', 'process'].includes(decision.actor.kind)) {
    throw new Error('qualification decision actor kind is invalid')
  }
  nonEmpty(decision.actor.id, 'actor.id')
  if (!Array.isArray(decision.limitations)) {
    throw new Error('qualification limitations must be an explicit array')
  }
}

export function assertProviderQualificationForPurpose(
  decision: ProviderQualificationDecision,
  expected: { profileId: string; purposeId: string; purposeVersion: string },
): void {
  validateProviderQualificationDecision(decision)
  if (decision.profileId !== expected.profileId) {
    throw new Error('provider qualification profile mismatch')
  }
  if (
    decision.purposeId !== expected.purposeId ||
    decision.purposeVersion !== expected.purposeVersion
  ) {
    throw new Error('provider qualification purpose mismatch')
  }
  if (decision.status !== 'qualified') {
    throw new Error('provider evidence is not qualified for this purpose')
  }
}
