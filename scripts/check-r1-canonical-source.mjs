#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { readFileSync, existsSync } from 'node:fs';
import { resolve, join } from 'node:path';

const EXPECTED = {
  'IMMORTAL/kernel/EconomicTransitionV3.hs': '62c2980a821cdcfc33a33e15a09617256ab8753c',
  'IMMORTAL/state/EconomicStateV3.hs': 'e80ecd167fa7c473f211302eb70af444356b2b91',
  'IMMORTAL/kernel/EconomicKernel.hs': '14dcc841ae5c055d522facfa60af4787132f27c3',
  'IMMORTAL/state/UniversalEconomicState.hs': 'f89fe04c8aad8ca9c5e544fa9c145a38d157826f',
  'IMMORTAL/kernel/UniversalEconomicKernel.hs': 'cd304c26c5ae9795cf5a1c4f8ca5cf9a8bf65785',
  'IMMORTAL/kernel/EconomicGate.hs': '8b8a06b4af1e2b5f4bac4f5faaa24f279d551127'
};

export function gitBlobSha(content) {
  const bytes = Buffer.isBuffer(content) ? content : Buffer.from(content, 'utf8');
  return createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex');
}

export function extractActionConstructors(source) {
  const match = source.match(/data\\s+V3Action\\s*([\\s\\S]*?)(?=\\n\\{-#|\\n\\n)/);
  if (!match) throw new Error('V3Action declaration not found');
  return [...match[1].matchAll(/(?:^|\\n)\\s*[=|]\\s*(Issue|Reveal|Claim|Expire)\\b/g)].map(m => m[1]);
}

export function extractRecordFields(source, typeName, prefix) {
  const escaped = typeName.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&');
  const match = source.match(new RegExp(`data\\\\s+${escaped}\\\\s*=\\\\s*${escaped}\\\\s*\\\\{([\\\\s\\\\S]*?)\\\\n\\\\s*\\\\}`));
  if (!match) throw new Error(`${typeName} record declaration not found`);
  return [...match[1].matchAll(new RegExp(`(?:^|\\\\n)\\\\s*,?\\\\s*(${prefix}\\\\w+)\\\\s*::\\\\s*([^\\\\n]+)`, 'g'))]
    .map(m => ({ name: m[1], type: m[2].trim() }));
}

function fieldsOfFunction(source, signature, endMarker) {
  const start = source.indexOf(signature);
  if (start < 0) throw new Error(`missing function signature: ${signature}`);
  const end = source.indexOf(endMarker, start);
  if (end < 0) throw new Error(`missing function boundary: ${endMarker}`);
  return source.slice(start, end);
}

export function extractCanonicalContract(sources) {
  const transition = sources['IMMORTAL/kernel/EconomicTransitionV3.hs'];
  const v3State = sources['IMMORTAL/state/EconomicStateV3.hs'];
  const v3Kernel = sources['IMMORTAL/kernel/EconomicKernel.hs'];
  const universalState = sources['IMMORTAL/state/UniversalEconomicState.hs'];
  const universalKernel = sources['IMMORTAL/kernel/UniversalEconomicKernel.hs'];
  const gate = sources['IMMORTAL/kernel/EconomicGate.hs'];
  const actions = extractActionConstructors(transition);
  const v3Fields = extractRecordFields(v3State, 'V3EconomicState', 'v3');
  const universalFields = extractRecordFields(universalState, 'UniversalEconomicState', 'ues');
  const v3Pc = fieldsOfFunction(v3Kernel, 'protectedCapital ::', '{-# INLINABLE rawSurplus #-}');
  const universalPc = fieldsOfFunction(universalKernel, 'protectedCapital ::', '{-# INLINABLE rawSurplus #-}');
  if (actions.join(',') !== 'Issue,Reveal,Claim,Expire') {
    throw new Error(`unexpected V3 action constructors: ${actions.join(',')}`);
  }
  const expectedV3Fields = [
    'v3CrystallizedLiabilities','v3UnresolvedReserve','v3UnresolvedTicketCount',
    'v3SafetyCapital','v3ReserveProtection','v3MandatoryFutureCosts',
    'v3Classes','v3Control','v3Jackpot'
  ];
  const expectedUniversalFields = [
    'uesCrystallizedLiabilities','uesUnresolvedReserve','uesUnresolvedTicketCount',
    'uesWorstCaseExposure','uesSafetyCapital','uesReserveProtection',
    'uesMandatoryFutureCosts','uesAdditionalProtectedCapital'
  ];
  if (v3Fields.map(f => f.name).join(',') !== expectedV3Fields.join(',')) {
    throw new Error('V3EconomicState field set/order drifted; review mapping before changing the baseline');
  }
  if (universalFields.map(f => f.name).join(',') !== expectedUniversalFields.join(',')) {
    throw new Error('UniversalEconomicState field set/order drifted; review mapping before changing the baseline');
  }
  const requiredV3Pc = ['v3CrystallizedLiabilities','worstCaseExposure','v3SafetyCapital','v3ReserveProtection','v3MandatoryFutureCosts','jsLockedAmount'];
  const requiredUniversalPc = ['uesCrystallizedLiabilities','uesWorstCaseExposure','uesSafetyCapital','uesReserveProtection','uesMandatoryFutureCosts','uesAdditionalProtectedCapital'];
  for (const term of requiredV3Pc) if (!v3Pc.includes(term)) throw new Error(`V3 protected-capital function missing ${term}`);
  for (const term of requiredUniversalPc) if (!universalPc.includes(term)) throw new Error(`universal protected-capital function missing ${term}`);
  return {
    v3Actions: actions,
    v3StateFields: v3Fields,
    universalStateFields: universalFields,
    v3ProtectedCapitalTerms: requiredV3Pc,
    universalProtectedCapitalTerms: requiredUniversalPc,
    gateHasCallerSuppliedOmegaClosureFlag: /allOmegaSuccessorsInCertifiedKernel/.test(gate),
    projectionPresentOnDestination: existsSync(join(process.cwd(), 'PRE-RICH/onchain/PreRichEconomicProjection.hs')),
    mappingConclusion: 'STRUCTURAL_CONTRACT_ONLY; no source projection is present on the authorized branch, and this check does not establish semantic equivalence or deployment conformance'
  };
}

export function verifySourceRoot(root) {
  const sources = {};
  const bindings = [];
  const errors = [];
  for (const [path, expectedBlobSha] of Object.entries(EXPECTED)) {
    const fullPath = resolve(root, path);
    if (!existsSync(fullPath)) {
      errors.push(`${path}: missing`);
      continue;
    }
    const bytes = readFileSync(fullPath);
    const actualBlobSha = gitBlobSha(bytes);
    bindings.push({ path, expectedBlobSha, actualBlobSha, matched: actualBlobSha === expectedBlobSha });
    if (actualBlobSha !== expectedBlobSha) errors.push(`${path}: source blob drift (expected ${expectedBlobSha}, got ${actualBlobSha})`);
    sources[path] = bytes.toString('utf8');
  }
  let contract = null;
  if (errors.length === 0) {
    try { contract = extractCanonicalContract(sources); }
    catch (e) { errors.push(e.message); }
  }
  return {
    ok: errors.length === 0,
    classification: errors.length === 0 ? 'MECHANICAL_EVIDENCE_SOURCE_SNAPSHOT_MATCHED' : 'SOURCE_BINDING_FAILED',
    branchBaseline: 'release/public-main-curated-2026-09-24',
    baselineCommit: 'f787be061cfcf5c9a1d832d43be1c75a3d913384',
    bindings,
    contract,
    errors,
    limitations: [
      'Git blob identity binds exact source snapshots, not the current checkout to a remote branch ref.',
      'A matched source snapshot is not a proof of semantic equivalence between V3 and the universal kernel.',
      'The checker does not authenticate EEV, inventory completeness, Accept, Ω, S0, or adapter observations.',
      'The current authorized branch has no PRE-RICH economic projection module; no complete V3-to-universal mapping is asserted.'
    ]
  };
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(new URL(import.meta.url).pathname)) {
  const root = process.argv[2] ? resolve(process.argv[2]) : process.cwd();
  const result = verifySourceRoot(root);
  process.stdout.write(JSON.stringify(result, null, 2) + '\\n');
  if (!result.ok) process.exitCode = 1;
}
