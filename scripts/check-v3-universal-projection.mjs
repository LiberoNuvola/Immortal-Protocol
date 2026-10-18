#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

export const SOURCE_BLOBS = {
  'IMMORTAL/state/EconomicProfile.hs': 'e4eccd67bec97543b802aa15ff1b2719c9c18bde',
  'IMMORTAL/state/EconomicStateV3.hs': 'e80ecd167fa7c473f211302eb70af444356b2b91',
  'IMMORTAL/kernel/EconomicTransitionV3.hs': '62c2980a821cdcfc33a33e15a09617256ab8753c',
  'IMMORTAL/kernel/EconomicKernel.hs': '14dcc841ae5c055d522facfa60af4787132f27c3',
  'IMMORTAL/state/UniversalEconomicState.hs': 'f89fe04c8aad8ca9c5e544fa9c145a38d157826f',
  'IMMORTAL/kernel/UniversalEconomicKernel.hs': 'cd304c26c5ae9795cf5a1c4f8ca5cf9a8bf65785'
};

const EXPECTED_ACTIONS = ['Issue', 'Reveal', 'Claim', 'Expire'];
const V3_FIELDS = [
  'v3CrystallizedLiabilities','v3UnresolvedReserve','v3UnresolvedTicketCount',
  'v3SafetyCapital','v3ReserveProtection','v3MandatoryFutureCosts',
  'v3Classes','v3Control','v3Jackpot'
];
const UNIVERSAL_FIELDS = [
  'uesCrystallizedLiabilities','uesUnresolvedReserve','uesUnresolvedTicketCount',
  'uesWorstCaseExposure','uesSafetyCapital','uesReserveProtection',
  'uesMandatoryFutureCosts','uesAdditionalProtectedCapital'
];

export function gitBlobSha(content) {
  const bytes = Buffer.isBuffer(content) ? content : Buffer.from(content, 'utf8');
  return createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex');
}
const isInt = n => typeof n === 'string' && /^-?(0|[1-9][0-9]*)$/.test(n);
const bi = (n, path) => {
  if (!isInt(n)) throw new Error(`${path}: expected canonical decimal string`);
  return BigInt(n);
};
const nonnegative = (n, path) => {
  const v = bi(n, path);
  if (v < 0n) throw new Error(`${path}: must be non-negative`);
  return v;
};
const sameSetExactly = (expected, actual, label) => {
  const seen = new Set();
  for (const x of actual) {
    if (seen.has(x)) throw new Error(`${label}: duplicate class ${x}`);
    seen.add(x);
    if (!expected.has(x)) throw new Error(`${label}: unknown/out-of-profile class ${x}`);
  }
  for (const x of expected) if (!seen.has(x)) throw new Error(`${label}: missing canonical class ${x}`);
};

export function projectV3ToUniversal(model) {
  if (!model || typeof model !== 'object') throw new Error('model: expected object');
  const { profile, state, eev } = model;
  if (!profile || !state) throw new Error('profile and state are required');
  if (!Array.isArray(profile.classPrices) || profile.classPrices.length === 0) throw new Error('profile.classPrices: must be non-empty');
  if (!isInt(profile.version) || bi(profile.version, 'profile.version') <= 0n) throw new Error('profile.version: must be positive');
  const multiplier = nonnegative(profile.maxNormalPayoutMultiplier, 'profile.maxNormalPayoutMultiplier');
  const prices = new Map();
  for (const [i, row] of profile.classPrices.entries()) {
    const id = bi(row?.classId, `profile.classPrices[${i}].classId`);
    const price = nonnegative(row?.price, `profile.classPrices[${i}].price`);
    if (id < 0n) throw new Error(`profile.classPrices[${i}].classId: must be non-negative`);
    if (price <= 0n) throw new Error(`profile.classPrices[${i}].price: must be positive`);
    const key = id.toString();
    if (prices.has(key)) throw new Error(`profile.classPrices: duplicate class ${key}`);
    prices.set(key, price);
  }

  const scalarFields = [
    'crystallizedLiabilities','unresolvedReserve','unresolvedTicketCount',
    'safetyCapital','reserveProtection','mandatoryFutureCosts'
  ];
  const scalar = {};
  for (const field of scalarFields) scalar[field] = nonnegative(state[field], `state.${field}`);
  const lockedJackpot = nonnegative(state.jackpot?.lockedAmount, 'state.jackpot.lockedAmount');
  const status = state.jackpot?.status;
  if (!['JackpotInactive','JackpotLocked','JackpotPayable','JackpotClosed'].includes(status)) {
    throw new Error('state.jackpot.status: unknown canonical JackpotStatus');
  }
  nonnegative(state.jackpot?.threshold, 'state.jackpot.threshold');
  nonnegative(state.jackpot?.cycle, 'state.jackpot.cycle');

  if (!Array.isArray(state.classes)) throw new Error('state.classes: expected array');
  const actualIds = state.classes.map((c, i) => {
    const id = bi(c?.classId, `state.classes[${i}].classId`);
    return id.toString();
  });
  sameSetExactly(new Set([...prices.keys()]), actualIds, 'state.classes/profile');

  const control = state.control;
  if (!control) throw new Error('state.control: required');
  const active = bi(control.currentActiveClass, 'state.control.currentActiveClass').toString();
  const highest = bi(control.highestClassEverActivated, 'state.control.highestClassEverActivated').toString();
  if (!prices.has(active) || !prices.has(highest)) throw new Error('state.control: active/highest class must belong to canonical profile');
  if (BigInt(active) > BigInt(highest)) throw new Error('state.control: current active class exceeds highest ever activated class');

  let derivedReserve = 0n;
  let derivedCount = 0n;
  let totalClassExposure = 0n;
  for (const [i, c] of state.classes.entries()) {
    const path = `state.classes[${i}]`;
    const id = bi(c.classId, `${path}.classId`).toString();
    const issued = nonnegative(c.issued, `${path}.issued`);
    const unresolved = nonnegative(c.unresolved, `${path}.unresolved`);
    const recordedExposure = nonnegative(c.exposure, `${path}.exposure`);
    nonnegative(c.cap, `${path}.cap`);
    if (typeof c.saleable !== 'boolean') throw new Error(`${path}.saleable: expected boolean`);
    const canonicalPrice = prices.get(id);
    const expectedExposure = canonicalPrice * unresolved;
    if (recordedExposure !== expectedExposure) {
      throw new Error(`${path}.exposure: expected canonical price × unresolved (${expectedExposure}), got ${recordedExposure}`);
    }
    // issued and saleable are preserved as source fields but do not contribute
    // to the current universal economic aggregate; cap is an Issue precondition.
    void issued;
    derivedReserve += canonicalPrice * unresolved;
    derivedCount += unresolved;
    totalClassExposure += canonicalPrice * unresolved;
  }

  if (derivedReserve !== scalar.unresolvedReserve) {
    throw new Error(`state.unresolvedReserve: class-derived total ${derivedReserve} does not match state total ${scalar.unresolvedReserve}`);
  }
  if (derivedCount !== scalar.unresolvedTicketCount) {
    throw new Error(`state.unresolvedTicketCount: class-derived total ${derivedCount} does not match state total ${scalar.unresolvedTicketCount}`);
  }
  const worstCaseExposure = multiplier * totalClassExposure;
  const v3ProtectedCapital =
    scalar.crystallizedLiabilities + worstCaseExposure + scalar.safetyCapital +
    scalar.reserveProtection + scalar.mandatoryFutureCosts + lockedJackpot;
  const universal = {
    crystallizedLiabilities: scalar.crystallizedLiabilities.toString(),
    unresolvedReserve: scalar.unresolvedReserve.toString(),
    unresolvedTicketCount: scalar.unresolvedTicketCount.toString(),
    worstCaseExposure: worstCaseExposure.toString(),
    safetyCapital: scalar.safetyCapital.toString(),
    reserveProtection: scalar.reserveProtection.toString(),
    mandatoryFutureCosts: scalar.mandatoryFutureCosts.toString(),
    additionalProtectedCapital: lockedJackpot.toString()
  };
  const universalProtectedCapital =
    bi(universal.crystallizedLiabilities, 'universal.crystallizedLiabilities') +
    bi(universal.worstCaseExposure, 'universal.worstCaseExposure') +
    bi(universal.safetyCapital, 'universal.safetyCapital') +
    bi(universal.reserveProtection, 'universal.reserveProtection') +
    bi(universal.mandatoryFutureCosts, 'universal.mandatoryFutureCosts') +
    bi(universal.additionalProtectedCapital, 'universal.additionalProtectedCapital');
  if (v3ProtectedCapital !== universalProtectedCapital) {
    throw new Error('projection mismatch: V3 and universal ProtectedCapital differ');
  }
  const eevValue = nonnegative(eev, 'eev');
  const buffer = eevValue - v3ProtectedCapital;
  return {
    schema: 'immortal-v3-universal-projection-v1',
    classification: 'FINITE_PROJECTION_VALID_RELATIVE_TO_DECLARED_PROFILE_AND_STATE',
    profileVersion: profile.version,
    canonicalClassIds: [...prices.keys()],
    projected: Object.fromEntries(Object.entries(universal).map(([k, v]) => [k, v])),
    v3ProtectedCapital: v3ProtectedCapital.toString(),
    universalProtectedCapital: universalProtectedCapital.toString(),
    buffer: buffer.toString(),
    rawSurplus: (buffer > 0n ? buffer : 0n).toString(),
    solvent: eevValue >= v3ProtectedCapital,
    eevProvenance: 'INPUT_ONLY_NOT_AUTHENTICATED',
    invariants: {
      exactCanonicalClassSet: true,
      noDuplicateOrUnknownClasses: true,
      classExposureMatchesCanonicalPriceTimesUnresolved: true,
      reserveAndCountMatchClassSums: true,
      jackpotMappedExactlyOnceToAdditionalProtectedCapital: true,
      protectedCapitalBoundaryEquivalent: true
    },
    nonMappedV3Fields: {
      control: 'Validated for profile membership and active <= highest, but not represented in UniversalEconomicState.',
      classIssuedCapSaleable: 'Checked for shape/non-negativity only; application admission semantics are not projected.',
      jackpotStatusThresholdCycle: 'Validated structurally but not represented in UniversalEconomicState; only lockedAmount affects ProtectedCapital.'
    },
    limitations: [
      'This is a finite projection check, not a proof that the supplied state or profile is authoritative.',
      'EEV is supplied separately and is not authenticated or derived from a pool/oracle.',
      'No deployment/adapter conformance, Accept equivalence, Omega completeness, or S0 authenticity is established.',
      'The universal state omits control history, class issuance/cap/saleability, and Jackpot lifecycle fields by design; this check does not prove application behavior equivalence.'
    ]
  };
}

export function verifySourceSnapshot(root) {
  const files = [];
  const errors = [];
  for (const [path, expected] of Object.entries(SOURCE_BLOBS)) {
    const full = resolve(root, path);
    if (!existsSync(full)) {
      errors.push(`${path}: missing`);
      continue;
    }
    const actual = gitBlobSha(readFileSync(full));
    files.push({ path, expected, actual, matched: actual === expected });
    if (actual !== expected) errors.push(`${path}: source drift; review projection contract before updating pin`);
  }
  return {
    ok: errors.length === 0,
    classification: errors.length ? 'SOURCE_BINDING_FAILED' : 'MECHANICAL_EVIDENCE_SOURCE_SNAPSHOT_MATCHED',
    files,
    errors,
    limitations: [
      'Hash pins identify exact Git blob contents; they do not authenticate the remote ref or runtime deployment.',
      'Source snapshot matching does not prove semantic equivalence beyond the explicit checks in this script.'
    ]
  };
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(new URL(import.meta.url).pathname)) {
  const [rootArg, modelArg] = process.argv.slice(2);
  const root = resolve(rootArg || process.cwd());
  const source = verifySourceSnapshot(root);
  if (!source.ok) {
    process.stdout.write(JSON.stringify({ source, projection: null }, null, 2) + '\n');
    process.exitCode = 1;
  } else if (modelArg) {
    try {
      const projection = projectV3ToUniversal(JSON.parse(readFileSync(resolve(modelArg), 'utf8')));
      process.stdout.write(JSON.stringify({ source, projection }, null, 2) + '\n');
    } catch (error) {
      process.stdout.write(JSON.stringify({ source, projection: null, error: error.message }, null, 2) + '\n');
      process.exitCode = 1;
    }
  } else {
    process.stdout.write(JSON.stringify({
      source,
      projection: null,
      message: 'Provide a model JSON path to check a declared finite projection; no deployment certificate is produced.'
    }, null, 2) + '\n');
  }
}
