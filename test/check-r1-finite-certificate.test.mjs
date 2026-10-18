import test from 'node:test';
import assert from 'node:assert/strict';
import { verifyR1 } from '../scripts/check-r1-finite-certificate.mjs';

const sha = 'a'.repeat(64);
function validModel() {
  return {
    schemaVersion: 'immortal-r1-finite-model-v1',
    profile: { id: 'test-profile', version: '1' },
    model: { id: 'test-finite-model', version: '1' },
    certificate: { id: 'test-cert', version: '1', initialStateId: 's0', witnessByState: { s0: 'authorized-test-action' } },
    states: [{
      id: 's0', source: { kind: 'ledger', reference: 'testnet:txid#0', revision: 'slot:42', digest: sha },
      inventory: { sourceRef: 'fixture inventory source', digest: sha, assetIds: ['asset-1'], commitmentIds: ['liability-1'] },
      assets: [{ id: 'asset-1', cell: 'A1', amount: '100' }],
      commitments: [{ id: 'liability-1', cell: 'L1', amount: '10' }],
      protectedCapitalAddons: { safetyCapital: '0', reserveProtection: '0', mandatoryFutureCosts: '0', additionalProtectedCapital: '0' }
    }],
    actions: [{ id: 'authorized-test-action', availableIn: ['s0'], acceptedIn: ['s0'] }],
    environment: {
      perimeterId: 'test-perimeter',
      sourceRefs: ['test-env-source'],
      events: [{ id: 'real-event', sourceRef: 'test-env-source' }],
      materiality: [{ state: 's0', action: 'authorized-test-action', eventIds: ['real-event'], sourceRef: 'test-materiality-source' }]
    },
    omega: { id: 'test-omega', sourceRefs: ['test-omega-source'], events: [{ id: 'abstract-event', sourceRef: 'test-omega-source' }] },
    transitions: [
      { state: 's0', action: 'authorized-test-action', event: 'real-event', successor: 's0' },
      { state: 's0', action: 'authorized-test-action', event: 'abstract-event', successor: 's0' }
    ]
  };
}

test('accepts a closed finite model and derives buffer/chi', () => {
  const result = verifyR1(validModel());
  assert.equal(result.ok, true, JSON.stringify(result.errors));
  assert.deepEqual(result.certifiedStates, ['s0']);
  assert.equal(result.states[0].eev, '100');
  assert.equal(result.states[0].protectedCapital, '10');
  assert.equal(result.states[0].buffer, '90');
});

test('rejects empty Ω rather than accepting vacuous closure', () => {
  const model = validModel(); model.omega.events = [];
  const result = verifyR1(model);
  assert.equal(result.ok, false);
  assert.match(result.errors.join('\n'), /empty Ω/);
});

test('rejects an environment successor not covered by Ω', () => {
  const model = validModel();
  const unsafe = structuredClone(model.states[0]);
  unsafe.id = 'unsafe'; unsafe.assets[0].amount = '1'; unsafe.source.reference = 'testnet:txid#1';
  model.states.push(unsafe);
  model.transitions.find(row => row.event === 'abstract-event').successor = 'unsafe';
  const result = verifyR1(model);
  assert.equal(result.ok, false);
  assert.match(result.errors.join('\n'), /Ω under-approximates Env/);
});

test('rejects a witness that is unavailable or not accepted', () => {
  const model = validModel(); model.actions[0].acceptedIn = [];
  const result = verifyR1(model);
  assert.equal(result.ok, false);
  assert.match(result.errors.join('\n'), /VC4/);
});

test('rejects a successor outside derived chi', () => {
  const model = validModel();
  const unsafe = structuredClone(model.states[0]);
  unsafe.id = 'unsafe'; unsafe.assets[0].amount = '1'; unsafe.source.reference = 'testnet:txid#1';
  model.states.push(unsafe);
  model.omega.events.push({ id: 'abstract-unsafe', sourceRef: 'test-omega-source-2' });
  model.transitions.push({ state:'s0', action:'authorized-test-action', event:'abstract-unsafe', successor:'unsafe' });
  const result = verifyR1(model);
  assert.equal(result.ok, false);
  assert.match(result.errors.join('\n'), /VC3 counterexample/);
});

test('rejects caller-supplied universal booleans', () => {
  const model = validModel(); model.allOmegaSuccessorsInCertifiedKernel = true;
  const result = verifyR1(model);
  assert.equal(result.ok, false);
  assert.match(result.errors.join('\n'), /caller-asserted certification result is forbidden/);
});

test('rejects synthetic S0 metadata', () => {
  const model = validModel(); model.states[0].source.kind = 'fixture';
  const result = verifyR1(model);
  assert.equal(result.ok, false);
  assert.match(result.errors.join('\n'), /require ledger or authoritative-model provenance/);
});

test('rejects missing materiality declarations instead of assuming omitted events are impossible', () => {
  const model = validModel(); model.environment.materiality = [];
  const result = verifyR1(model);
  assert.equal(result.ok, false);
  assert.match(result.errors.join('\n'), /materiality not declared/);
});
