import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const REGISTRY_PATH = 'docs/workflow-c/R1-ECONOMIC-INVENTORY-REGISTER-2026-10-18.json';
export const SOURCE_PINS = Object.freeze({
  R1_SPEC: { path: 'docs/02-certification/CONCRETE_KERNEL_CERTIFICATION_SPECIFICATION.md', sha: '32b54c73f6676467d197e8f6635155e4752cc17e' },
  R7: { path: 'docs/02-certification/ACCOUNTING_PARTITION_AND_CONSERVATION_CERTIFICATION.md', sha: '9ebe7c55fb5de26aa9c8e1d0f17e466c91855c3e' },
  EEV: { path: 'docs/02-certification/EEV_ORACLE_AND_VALUATION_CONTRACT.md', sha: '292a2adb4137209f02e5a55477a5eef676d974e9' },
  OMEGA: { path: 'docs/02-certification/OMEGA_COMPLETENESS_AND_PERIMETER_SPECIFICATION.md', sha: '17a30c6db680987c615ee334d6cf0cb2adbc5db0' },
  GAME_ECONOMY: { path: 'PRE-RICH/docs/GAME-ECONOMY.md', sha: '3431169896aea420e7f8bff3c1932abed2c358ac' },
  V3_PROFILE: { path: 'IMMORTAL/state/EconomicProfile.hs', sha: 'e4eccd67bec97543b802aa15ff1b2719c9c18bde' },
  V3_STATE: { path: 'IMMORTAL/state/EconomicStateV3.hs', sha: 'e80ecd167fa7c473f211302eb70af444356b2b91' },
  V3_KERNEL: { path: 'IMMORTAL/kernel/EconomicKernel.hs', sha: '14dcc841ae5c055d522facfa60af4787132f27c3' },
  UNIVERSAL_STATE: { path: 'IMMORTAL/state/UniversalEconomicState.hs', sha: 'f89fe04c8aad8ca9c5e544fa9c145a38d157826f' },
  UNIVERSAL_KERNEL: { path: 'IMMORTAL/kernel/UniversalEconomicKernel.hs', sha: 'cd304c26c5ae9795cf5a1c4f8ca5cf9a8bf65785' },
  IMMORTAL_CONSTITUTION: { path: 'IMMORTAL/docs/CONSTITUTION.md', sha: '8c8c0436eac027ccd89139308cc375f74386e8bf' },
  PRE_RICH_CONSTITUTION: { path: 'PRE-RICH/docs/CONSTITUTION.md', sha: '009ac8f86eb9be7f3be3a27b93cbb9ba6b772483' },
  PRE_RICH_ALGORITHM: { path: 'PRE-RICH/docs/ECONOMIC-ALGORITHM.md', sha: '6b8cf1ba59c6cbd588011a14eae46464b13b3277' },
  APPLICATION_SPEC: { path: 'PRE-RICH/docs/APPLICATION-SPECIFICATION.md', sha: '341e62ef277833e044d7655b89e7b2da1a19b4ab' },
  PRE_RICH_PROFILE: { path: 'PRE-RICH/profile/PreRichEconomicProfile.hs', sha: '17487e50226a63061dfbf8500130a947bf5df62c' },
  V3_TRANSITION: { path: 'IMMORTAL/kernel/EconomicTransitionV3.hs', sha: '62c2980a821cdcfc33a33e15a09617256ab8753c' },
  PRE_RICH_PROJECTION_HS: { path: 'PRE-RICH/profile/PreRichEconomicProjection.hs', sha: '22cf16232594a0e7f6c52749feaf8bf0ea6e5b13' },
  PRE_RICH_ADMISSION_HS: { path: 'PRE-RICH/profile/PreRichEconomicAdmission.hs', sha: 'd8360b608f3bb32b7c74000de3ca3b5e3a907a9a' },
  ISSUE_EVIDENCE: { path: 'PRE-RICH/profile/PreRichIssueEvidence.ts', sha: '6029300879c08e56630a3a0172fef61a5e483f22' },
  ISSUE_REFINEMENT: { path: 'PRE-RICH/profile/PreRichIssueRefinement.ts', sha: '2cb717101adc65899e8cf14b8c390fcdec2ebe6c' },
  REVEAL_REFINEMENT: { path: 'PRE-RICH/profile/PreRichRevealRefinement.ts', sha: 'c68f3861ea98bff426dddac5eb38b3349bbe180d' },
  CLAIM_REFINEMENT: { path: 'PRE-RICH/profile/PreRichClaimRefinement.ts', sha: '93813d3f15bbf32f32c870d401e8a5b95822ca15' },
  EXPIRE_REFINEMENT: { path: 'PRE-RICH/profile/PreRichExpireRefinement.ts', sha: '72598762a7a9d29d5a1ecc1a4d475c0121f4cde8' },
  EXPIRY_POLICY: { path: 'PRE-RICH/profile/PreRichExpiryPolicy.ts', sha: '883a47dfc4823ac65c9bbfb9b0354d7719e905c5' },
  JACKPOT_POLICY: { path: 'PRE-RICH/profile/PreRichJackpotPolicy.ts', sha: '6c74d63da6f19584b8d89f5c92ccd4ae3be15786' },
  CARDANO_PROJECTION: { path: 'PRE-RICH/profile/PreRichCardanoObservationProjection.ts', sha: 'de8911d112187d61f781d893cbfd32b7a4372ef6' },
  ADAPTER_SPEC: { path: 'Adapter/CARDANO/docs/ADAPTER-SPECIFICATION.md', sha: '8b409e4c41ef909e1ac3cd1fe4312544d0091c88' },
  EXEC_LIQUIDITY: { path: 'Adapter/CARDANO/observation/ExecutableLiquidityObservation.ts', sha: 'f7add943fe56d19c031f2672a6d27a267d8ca970' },
  CERTIFIED_TICKET: { path: 'PRE-RICH/profile/PreRichCertifiedTicket.ts', sha: '3781a07282b3fc4fdc74975f3520a7a9b0a8b4e9' },
  GENESIS_TRANSITION: { path: 'PRE-RICH/docs/PRE-GENESIS-GENESIS-TRANSITION-CONFORMANCE.md', sha: 'c95fcec801cdf54613a455ec008a936c3ec83524' }
});
const CELL_IDS = ['A1','A2','A3','A4','A5','L1','L2','L3','L4','L5','L6'];
const COMPONENT_IDS = [
  'qualified-usdm-prizepool-utxo','crystallized-winning-liabilities',
  'unresolved-ticket-worst-case-exposure','unresolved-ticket-statistical-reserve',
  'safety-capital','reserve-protection','mandatory-future-costs','jackpot-locked-balance',
  'class-issuance-control-state','jackpot-lifecycle-state','contingency-a4-l3',
  'historical-monotone-facts','unrepresented-exposure-l6','car-conditional-allocation',
  'expiry-ticket-identity','effective-pool-vs-buffer','nonqualified-assets-outside-eev',
  'ticket-sale-mint-payment-reservation',
  'classic6-result-and-payout-distribution',
  'frozen-winning-payout',
  'claim-settlement-single-use',
  'expiry-policy-crystallized-at-issuance',
  'ticket-identity-transfer-no-duplication',
  'jackpot-funding-gap-and-lock',
  'jackpot-payout-to-crystallized-liability',
  'treasury-genesis-prizepool-separation',
  'settlement-conversion-and-units',
  'adapter-executable-liquidity-observation',
  'class-cap-saleability-control',
  'caller-asserted-admission-premises',
  'cardano-min-utxo-and-execution-costs',
  'ticket-lifecycle-observation-coverage'
];
const VALID_CELLS = new Set([...CELL_IDS, 'H']);
const REQUIRED_SOURCE_SURFACES = Object.freeze([
  { id: 'sale-coupling', sourceId: 'APPLICATION_SPEC', anchor: "ticket mint + Treasury payment + unresolved-ticket reservation", componentIds: ["ticket-sale-mint-payment-reservation"] },
  { id: 'classic6-two-row-result', sourceId: 'GAME_ECONOMY', anchor: "The current PRE-RICH game is **Classic-6 with two independent rows**.", componentIds: ["classic6-result-and-payout-distribution"] },
  { id: 'frozen-winning-payout', sourceId: 'REVEAL_REFINEMENT', anchor: "reveal must create the exact crystallised payout liability", componentIds: ["frozen-winning-payout"] },
  { id: 'claim-single-use', sourceId: 'CLAIM_REFINEMENT', anchor: "claim must reduce pending liability by the exact payout", componentIds: ["claim-settlement-single-use"] },
  { id: 'expiry-crystallization', sourceId: 'EXPIRY_POLICY', anchor: "expiresAt: issuedAt + first", componentIds: ["expiry-policy-crystallized-at-issuance","ticket-identity-transfer-no-duplication"] },
  { id: 'ticket-transfer-identity', sourceId: 'APPLICATION_SPEC', anchor: "Tickets are transferable. Transfer preserves ticket identity, commitment, round, game configuration and future result.", componentIds: ["ticket-identity-transfer-no-duplication"] },
  { id: 'jackpot-funding-gap', sourceId: 'JACKPOT_POLICY', anchor: "const need = floor > input.lockedJackpot ? floor - input.lockedJackpot : 0n", componentIds: ["jackpot-funding-gap-and-lock"] },
  { id: 'jackpot-payout-mode', sourceId: 'GAME_ECONOMY', anchor: "The current PRE-RICH payout mode is **full current locked-balance payout exactly once**.", componentIds: ["jackpot-payout-to-crystallized-liability"] },
  { id: 'treasury-prizepool-separation', sourceId: 'GENESIS_TRANSITION', anchor: "the Genesis bootstrap is **not automatically PrizePool liquidity**", componentIds: ["treasury-genesis-prizepool-separation"] },
  { id: 'settlement-value-preservation', sourceId: 'GAME_ECONOMY', anchor: "verified conversion preserves the frozen USDM economic value", componentIds: ["settlement-conversion-and-units"] },
  { id: 'executable-liquidity-observation', sourceId: 'EXEC_LIQUIDITY', anchor: "declared executable liquidity does not match observed spendable UTxOs", componentIds: ["adapter-executable-liquidity-observation"] },
  { id: 'class-cap-and-saleability', sourceId: 'ISSUE_EVIDENCE', anchor: "evidence.issued < evidence.cap", componentIds: ["class-cap-saleability-control"] },
  { id: 'admission-asserted-premises', sourceId: 'PRE_RICH_ADMISSION_HS', anchor: "allOmegaSuccessorsInCertifiedKernel", componentIds: ["caller-asserted-admission-premises"] },
  { id: 'cardano-cost-boundary', sourceId: 'GAME_ECONOMY', anchor: "minimum-UTxO treatment", componentIds: ["cardano-min-utxo-and-execution-costs"] },
  { id: 'ticket-observed-status-domain', sourceId: 'CARDANO_PROJECTION', anchor: "export type ObservedTicketStatus = 'Pending' | 'BeaconReady'", componentIds: ["ticket-lifecycle-observation-coverage"] }
]);

const norm = value => String(value).replaceAll(String.fromCharCode(96), '').replaceAll('**', '').replace(/\s+/g, ' ').trim();
const sameSet = (actual, expected) => actual.length === expected.length &&
  new Set(actual).size === actual.length && expected.every(item => actual.includes(item));

export function gitBlobSha(content) {
  const bytes = Buffer.isBuffer(content) ? content : Buffer.from(content, 'utf8');
  return createHash('sha1').update(Buffer.concat([Buffer.from('blob ' + bytes.length + '\0'), bytes])).digest('hex');
}

export function auditInventory(registry, sources) {
  const errors = [];
  const add = message => errors.push(message);
  if (!registry || typeof registry !== 'object') {
    return { ok:false, closureEligible:false, classification:'MECHANICAL_EVIDENCE_REGISTER_INVALID', errors:['registry: expected object'] };
  }
  if (registry.schema !== 'immortal-r1-economic-inventory-register-v1') add('schema: unsupported or missing');
  if (registry.scope !== 'PRE-RICH-EEV-USDM-DIRECT-V1') add('scope: expected PRE-RICH-EEV-USDM-DIRECT-V1');
  if (registry.profileCompleteness?.status !== 'UNPROVEN_PA2_PA7') add('profileCompleteness.status: PA2/PA7 cannot be promoted without reviewed evidence');
  const unresolved = registry.profileCompleteness?.unresolvedObligations;
  if (!Array.isArray(unresolved) || !unresolved.includes('PA2') || !unresolved.includes('PA7')) add('profileCompleteness: PA2 and PA7 must remain explicit');

  for (const [id, pin] of Object.entries(SOURCE_PINS)) {
    const source = sources?.[id];
    if (typeof source !== 'string') {
      add('source ' + id + ': missing (' + pin.path + ')');
    } else {
      const actual = gitBlobSha(source);
      if (actual !== pin.sha) add('source ' + id + ': blob drift; review semantic changes before updating pins; expected ' + pin.sha + ', got ' + actual);
    }
  }

  const r7 = sources?.R7;
  const extracted = [];
  if (typeof r7 === 'string') {
    const re = /^\|\s*\*\*(A[1-5]|L[1-6])\*\*\s*\|\s*([^|]+)\|/gm;
    for (const match of r7.matchAll(re)) extracted.push({ id:match[1], label:norm(match[2]) });
    if (!sameSet(extracted.map(x => x.id), CELL_IDS)) add('R7 canonical cell table does not contain exactly A1-A5 and L1-L6');
    if (!r7.includes('Historical quantities') || !r7.includes('ledger ' + String.fromCharCode(96) + 'ℌ' + String.fromCharCode(96))) add('R7 historical ledger ℌ definition missing');
    if (!r7.includes('RawSurplus(S) = max(0, EEV(S) − ProtectedCapital(S))')) add('R7 RawSurplus derived boundary definition missing');
  }

  const cells = registry.canonicalCells;
  if (!Array.isArray(cells)) {
    add('canonicalCells: expected array');
  } else {
    const ids = cells.map(c => c?.id);
    if (!sameSet(ids, CELL_IDS)) add('canonicalCells: expected every R7 cell exactly once; got ' + ids.join(','));
    for (const id of new Set(ids.filter((v,i) => ids.indexOf(v) !== i))) add('canonicalCells: duplicate ' + id);
    for (const cell of cells) {
      if (!cell || !CELL_IDS.includes(cell.id)) continue;
      const sourceCell = extracted.find(x => x.id === cell.id);
      if (sourceCell && norm(cell.label) !== sourceCell.label) add('canonicalCells.' + cell.id + ': label differs from pinned R7 source');
      if (!['asset','liability'].includes(cell.side)) add('canonicalCells.' + cell.id + ': invalid side');
      for (const field of ['eevTreatment','protectedCapitalTreatment','transitionTreatment']) {
        if (typeof cell[field] !== 'string' || !cell[field].trim()) add('canonicalCells.' + cell.id + ': missing ' + field);
      }
    }
  }
  if (registry.historicalLedger?.id !== 'H' || registry.historicalLedger?.separateFromAssetAndLiabilityCells !== true) add('historicalLedger: H/ℌ must be separate from A1-A5 and L1-L6');
  if (registry.derivedBoundary?.id !== 'RawSurplus' || registry.derivedBoundary?.isPartitionCell !== false) add('derivedBoundary: RawSurplus must not be a partition cell');

  const components = registry.profileComponents;
  if (!Array.isArray(components)) {
    add('profileComponents: expected array');
  } else {
    const ids = components.map(c => c?.id);
    if (!sameSet(ids, COMPONENT_IDS)) {
      const missing = COMPONENT_IDS.filter(id => !ids.includes(id));
      const extra = ids.filter(id => !COMPONENT_IDS.includes(id));
      if (missing.length) add('profileComponents: missing discovered entries: ' + missing.join(','));
      if (extra.length) add('profileComponents: unreviewed entries: ' + extra.join(','));
      if (new Set(ids).size !== ids.length) add('profileComponents: duplicate component identifiers');
    }
    for (const id of new Set(ids.filter((v,i) => ids.indexOf(v) !== i))) add('profileComponents: duplicate component id ' + id);
    const keys = components.map(c => c?.accountingKey);
    for (const key of new Set(keys.filter((v,i) => typeof v === 'string' && keys.indexOf(v) !== i))) add('profileComponents: duplicate accountingKey ' + key + ' (possible double count)');

    for (const c of components) {
      if (!c || typeof c !== 'object') { add('profileComponents: malformed row'); continue; }
      if (typeof c.accountingKey !== 'string' || !c.accountingKey.trim()) add('component ' + c.id + ': missing accountingKey');
      for (const field of ['accountingRule','eevTreatment','protectedCapitalTreatment','bufferTreatment']) {
        if (typeof c[field] !== 'string' || !c[field].trim()) add('component ' + c.id + ': missing ' + field);
      }
      if (c.r7Cell !== null && !VALID_CELLS.has(c.r7Cell)) add('component ' + c.id + ': invalid r7Cell ' + c.r7Cell);
      if (!['mapped','partial','unmapped','not_applicable'].includes(c.mappingStatus)) add('component ' + c.id + ': invalid mappingStatus');
      if (!Array.isArray(c.v3Fields) || !Array.isArray(c.universalFields)) add('component ' + c.id + ': v3Fields/universalFields must be explicit arrays');
      if (!Array.isArray(c.openObligations)) add('component ' + c.id + ': openObligations must be explicit');
      if (c.mappingStatus === 'mapped' && (c.r7Cell === null || (Array.isArray(c.openObligations) && c.openObligations.length))) add('component ' + c.id + ': cannot claim mapped while cell or obligations remain unresolved');
      if (!Array.isArray(c.sourceAnchors) || !c.sourceAnchors.length) {
        add('component ' + c.id + ': missing canonical source anchors');
      } else {
        for (const anchor of c.sourceAnchors) {
          const source = sources?.[anchor?.sourceId];
          if (typeof source !== 'string') add('component ' + c.id + ': unknown/unavailable source ' + anchor?.sourceId);
          else if (typeof anchor.includes !== 'string' || !anchor.includes.trim() || !source.includes(anchor.includes)) add('component ' + c.id + ': source anchor not found in ' + anchor.sourceId + ': ' + anchor.includes);
        }
      }
      if (!['not_applicable','unresolved','defined_by_normative_source'].includes(c.contingencyStatus)) add('component ' + c.id + ': invalid contingencyStatus');
      if (c.id === 'contingency-a4-l3' && c.contingencyStatus === 'unresolved' && !c.sourceAnchors?.some(a => a.sourceId === 'R7' && a.includes.includes('A4'))) add('component ' + c.id + ': unresolved contingency must cite normative A4/L3 relation');
    }
  }


  const coverage = registry.sourceCoverage;
  if (!Array.isArray(coverage)) {
    add('sourceCoverage: expected independently curated source-surface checklist');
  } else {
    const coverageIds = coverage.map(s => s?.id);
    const requiredIds = REQUIRED_SOURCE_SURFACES.map(s => s.id);
    if (!sameSet(coverageIds, requiredIds)) {
      const missing = requiredIds.filter(id => !coverageIds.includes(id));
      const extra = coverageIds.filter(id => !requiredIds.includes(id));
      if (missing.length) add('sourceCoverage: missing required source surfaces: ' + missing.join(','));
      if (extra.length) add('sourceCoverage: unreviewed source surfaces: ' + extra.join(','));
      if (new Set(coverageIds).size !== coverageIds.length) add('sourceCoverage: duplicate surface identifiers');
    }
    for (const surface of REQUIRED_SOURCE_SURFACES) {
      const row = coverage.find(s => s?.id === surface.id);
      if (!row) continue;
      if (row.sourceId !== surface.sourceId || row.anchor !== surface.anchor) add('sourceCoverage.' + surface.id + ': source binding differs from reviewed requirement');
      const source = sources?.[surface.sourceId];
      if (typeof source !== 'string' || !source.includes(surface.anchor)) add('sourceCoverage.' + surface.id + ': required source anchor missing from ' + surface.sourceId);
      const linked = Array.isArray(row.componentIds) ? row.componentIds : [];
      if (!sameSet(linked, surface.componentIds)) add('sourceCoverage.' + surface.id + ': component mapping differs from reviewed requirement');
      for (const componentId of surface.componentIds) {
        if (!Array.isArray(components) || !components.some(c => c?.id === componentId)) add('sourceCoverage.' + surface.id + ': linked component missing from register: ' + componentId);
      }
    }
  }

  return {
    ok:errors.length === 0,
    closureEligible:false,
    classification:errors.length ? 'MECHANICAL_EVIDENCE_REGISTER_INVALID' : 'MECHANICAL_EVIDENCE_REGISTER_VALID_BUT_PROFILE_CLOSURE_UNPROVEN',
    sourcePins:Object.fromEntries(Object.entries(SOURCE_PINS).map(([id,p]) => [id,{path:p.path,expectedBlobSha:p.sha,actualBlobSha:typeof sources?.[id] === 'string' ? gitBlobSha(sources[id]) : null}])),
    canonicalCellCount:Array.isArray(cells) ? cells.length : 0,
    profileComponentCount:Array.isArray(components) ? components.length : 0,
    requiredSourceSurfaceCount:REQUIRED_SOURCE_SURFACES.length,
    registeredSourceSurfaceCount:Array.isArray(registry.sourceCoverage) ? registry.sourceCoverage.length : 0,
    unresolvedObligations:Array.isArray(unresolved) ? unresolved : [],
    errors
  };
}

export function loadInventoryInputs(root = process.cwd()) {
  const registry = JSON.parse(readFileSync(resolve(root, REGISTRY_PATH), 'utf8'));
  const sources = {};
  for (const [id,pin] of Object.entries(SOURCE_PINS)) {
    const path = resolve(root, pin.path);
    if (existsSync(path)) sources[id] = readFileSync(path, 'utf8');
  }
  return {registry,sources};
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  try {
    const {registry,sources} = loadInventoryInputs(resolve(process.argv[2] || process.cwd()));
    const result = auditInventory(registry,sources);
    process.stdout.write(JSON.stringify(result,null,2) + '\n');
    if (!result.ok) process.exitCode = 1;
  } catch (error) {
    process.stderr.write('inventory audit failed closed: ' + error.message + '\n');
    process.exitCode = 1;
  }
}
