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
  assert.equal(r.profileComponentCount, 17);
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
