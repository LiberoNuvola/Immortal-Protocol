import test from 'node:test';
import assert from 'node:assert/strict';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { auditInventory, loadInventoryInputs } from '../scripts/check-r1-economic-inventory.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const baseline = loadInventoryInputs(root);
const registry = () => structuredClone(baseline.registry);
const sources = () => ({...baseline.sources});

test('validates pinned R7 ontology and register while explicitly not closing PA2/PA7', () => {
  const r = auditInventory(registry(), sources());
  assert.equal(r.ok, true, r.errors.join('\n'));
  assert.equal(r.closureEligible, false);
  assert.equal(r.classification, 'MECHANICAL_EVIDENCE_REGISTER_VALID_BUT_PROFILE_CLOSURE_UNPROVEN');
  assert.equal(r.canonicalCellCount, 11);
  assert.equal(r.profileComponentCount, 32);
  assert.equal(r.sourceCatalogCount, 30);
  assert.equal(r.requiredSourceSurfaceCount, 15);
  assert.equal(r.registeredSourceSurfaceCount, 15);
  assert.ok(r.unresolvedObligations.includes('PA2'));
  assert.ok(r.unresolvedObligations.includes('PA7'));
});
test('rejects missing canonical cell', () => {
  const x=registry(); x.canonicalCells=x.canonicalCells.filter(c=>c.id!=='L3');
  const r=auditInventory(x,sources()); assert.equal(r.ok,false);
  assert.match(r.errors.join('\n'),/expected every R7 cell exactly once/);
});
test('rejects duplicate canonical cell', () => {
  const x=registry(); x.canonicalCells.push(structuredClone(x.canonicalCells[0]));
  const r=auditInventory(x,sources()); assert.equal(r.ok,false);
  assert.match(r.errors.join('\n'),/duplicate A1/);
});
test('rejects missing discovered component', () => {
  const x=registry(); x.profileComponents=x.profileComponents.filter(c=>c.id!=='mandatory-future-costs');
  const r=auditInventory(x,sources()); assert.equal(r.ok,false);
  assert.match(r.errors.join('\n'),/missing discovered entries: mandatory-future-costs/);
});
test('rejects duplicate accounting key as possible double count', () => {
  const x=registry(); x.profileComponents[1].accountingKey=x.profileComponents[0].accountingKey;
  const r=auditInventory(x,sources()); assert.equal(r.ok,false);
  assert.match(r.errors.join('\n'),/possible double count/);
});
test('rejects component without source anchors', () => {
  const x=registry(); x.profileComponents[0].sourceAnchors=[];
  const r=auditInventory(x,sources()); assert.equal(r.ok,false);
  assert.match(r.errors.join('\n'),/missing canonical source anchors/);
});
test('rejects source anchor not present in pinned source', () => {
  const x=registry(); x.profileComponents[0].sourceAnchors[0].includes='invented normative definition';
  const r=auditInventory(x,sources()); assert.equal(r.ok,false);
  assert.match(r.errors.join('\n'),/source anchor not found/);
});
test('rejects component without accounting rule', () => {
  const x=registry(); x.profileComponents[0].accountingRule=' ';
  const r=auditInventory(x,sources()); assert.equal(r.ok,false);
  assert.match(r.errors.join('\n'),/missing accountingRule/);
});
test('rejects normative source drift', () => {
  const s=sources(); s.R7 += '\n<!-- unreviewed drift -->\n';
  const r=auditInventory(registry(),s); assert.equal(r.ok,false);
  assert.match(r.errors.join('\n'),/source R7: blob drift/);
});
test('rejects premature PA2/PA7 promotion', () => {
  const x=registry(); x.profileCompleteness.status='COMPLETE';
  x.profileCompleteness.unresolvedObligations=x.profileCompleteness.unresolvedObligations.filter(v=>!['PA2','PA7'].includes(v));
  const r=auditInventory(x,sources()); assert.equal(r.ok,false);
  assert.match(r.errors.join('\n'),/PA2\/PA7 cannot be promoted/);
  assert.equal(r.closureEligible,false);
});
test('rejects mapped status when open obligations remain', () => {
  const x=registry(); x.profileComponents[0].mappingStatus='mapped';
  const r=auditInventory(x,sources()); assert.equal(r.ok,false);
  assert.match(r.errors.join('\n'),/cannot claim mapped while cell or obligations remain unresolved/);
});
test('requires normative A4/L3 source for unresolved contingency', () => {
  const x=registry(); const c=x.profileComponents.find(v=>v.id==='contingency-a4-l3');
  c.sourceAnchors=c.sourceAnchors.filter(a=>a.sourceId!=='R7');
  const r=auditInventory(x,sources()); assert.equal(r.ok,false);
  assert.match(r.errors.join('\n'),/unresolved contingency must cite normative A4\/L3 relation/);
});
test('keeps historical ledger and RawSurplus outside the partition cells', () => {
  const x=registry(); x.derivedBoundary.isPartitionCell=true;
  const r=auditInventory(x,sources()); assert.equal(r.ok,false);
  assert.match(r.errors.join('\n'),/RawSurplus must not be a partition cell/);
});

test('rejects omission of an independently required application transition surface', () => {
  const x=registry(); x.sourceCoverage=x.sourceCoverage.filter(s=>s.id!=='jackpot-payout-mode');
  const r=auditInventory(x,sources()); assert.equal(r.ok,false);
  assert.match(r.errors.join('\n'),/missing required source surfaces:.*jackpot-payout-mode/);
});
test('rejects source surface detached from its component mapping', () => {
  const x=registry(); x.sourceCoverage.find(s=>s.id==='sale-coupling').componentIds=[];
  const r=auditInventory(x,sources()); assert.equal(r.ok,false);
  assert.match(r.errors.join('\n'),/sale-coupling: component mapping differs/);
});
test('rejects omitted component referenced by normative source surface', () => {
  const x=registry(); x.profileComponents=x.profileComponents.filter(c=>c.id!=='ticket-sale-mint-payment-reservation');
  const r=auditInventory(x,sources()); assert.equal(r.ok,false);
  assert.match(r.errors.join('\n'),/linked component missing from register: ticket-sale-mint-payment-reservation/);
});
test('rejects drift in the PRE-RICH application transition implementation', () => {
  const s=sources(); s.REVEAL_REFINEMENT += '\n// unreviewed change\n';
  const r=auditInventory(registry(),s); assert.equal(r.ok,false);
  assert.match(r.errors.join('\n'),/source REVEAL_REFINEMENT: blob drift/);
});
test('does not promote a source coverage checklist into PA2/PA7 closure', () => {
  const x=registry(); x.auditBoundary.independentReview='complete';
  const r=auditInventory(x,sources()); assert.equal(r.ok,true,r.errors.join('\n'));
  assert.equal(r.closureEligible,false);
});

test('rejects missing source provenance row', () => {
  const x=registry(); x.sourceCatalog.sources=x.sourceCatalog.sources.filter(s=>s.id!=='PRE_RICH_ADMISSION_HS');
  const r=auditInventory(x,sources()); assert.equal(r.ok,false);
  assert.match(r.errors.join('\n'),/sourceCatalog: missing pinned source rows:.*PRE_RICH_ADMISSION_HS/);
});
test('rejects source provenance with a mismatched blob hash', () => {
  const x=registry(); x.sourceCatalog.sources.find(s=>s.id==='R7').blobSha='0'.repeat(40);
  const r=auditInventory(x,sources()); assert.equal(r.ok,false);
  assert.match(r.errors.join('\n'),/sourceCatalog.R7: path\/blob hash differs/);
});
test('rejects source provenance that assigns no authority/relation', () => {
  const x=registry(); const row=x.sourceCatalog.sources.find(s=>s.id==='PRE_RICH_ADMISSION_HS');
  row.authority='trust me'; row.relation='';
  const r=auditInventory(x,sources()); assert.equal(r.ok,false);
  assert.match(r.errors.join('\n'),/invalid authority classification/);
  assert.match(r.errors.join('\n'),/missing relation to inventory audit/);
});
