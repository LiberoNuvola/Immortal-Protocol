#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const SCHEMA = 'immortal-r1-finite-model-v1';
const FORBIDDEN_ASSERTIONS = new Set([
  'safe', 'rep', 'chi', 'isCertified', 'omegaComplete',
  'allOmegaSuccessorsInCertifiedKernel', 'vc1', 'vc2', 'vc3', 'vc4', 'vc5', 'vc6'
]);
const checkerSource = readFileSync(fileURLToPath(import.meta.url));
const checkerDigest = createHash('sha256').update(checkerSource).digest('hex');

function fail(message) { throw new Error(message); }
function obj(v, path) { if (!v || typeof v !== 'object' || Array.isArray(v)) fail(`${path}: expected object`); return v; }
function arr(v, path) { if (!Array.isArray(v)) fail(`${path}: expected array`); return v; }
function str(v, path) { if (typeof v !== 'string' || !v.trim()) fail(`${path}: expected non-empty string`); return v; }
function integer(v, path) {
  if (typeof v !== 'string' || !/^(0|[1-9][0-9]*)$/.test(v)) fail(`${path}: expected non-negative decimal integer string`);
  return BigInt(v);
}
function digest(v, path) { str(v, path); if (!/^[a-f0-9]{64}$/.test(v)) fail(`${path}: expected lowercase SHA-256 hex`); }
function uniqueStrings(values, path) {
  arr(values, path);
  const out = values.map((v, i) => str(v, `${path}[${i}]`));
  if (new Set(out).size !== out.length) fail(`${path}: duplicate values`);
  return out;
}
function hasForbiddenAssertions(value, path = '$') {
  if (!value || typeof value !== 'object') return;
  for (const [key, child] of Object.entries(value)) {
    if (FORBIDDEN_ASSERTIONS.has(key)) fail(`${path}.${key}: caller-asserted certification result is forbidden; provide canonical model inputs`);
    hasForbiddenAssertions(child, `${path}.${key}`);
  }
}
function canonical(value) {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (value && typeof value === 'object') return `{${Object.keys(value).sort().map(k => `${JSON.stringify(k)}:${canonical(value[k])}`).join(',')}}`;
  return JSON.stringify(value);
}
function setEquals(a, b) { return a.size === b.size && [...a].every(x => b.has(x)); }
function tupleKey(...xs) { return JSON.stringify(xs); }
function requireRef(v, path) { str(v, path); }

export function verifyR1(model) {
  const errors = [];
  const check = (fn) => { try { fn(); } catch (e) { errors.push(e.message); } };
  try { obj(model, '$'); hasForbiddenAssertions(model); } catch (e) {
    return result(false, [e.message], model, null);
  }

  check(() => {
    if (model.schemaVersion !== SCHEMA) fail(`$.schemaVersion: expected ${SCHEMA}`);
    obj(model.profile, '$.profile'); str(model.profile.id, '$.profile.id'); str(model.profile.version, '$.profile.version');
    obj(model.model, '$.model'); str(model.model.id, '$.model.id'); str(model.model.version, '$.model.version');
    obj(model.certificate, '$.certificate'); str(model.certificate.id, '$.certificate.id'); str(model.certificate.version, '$.certificate.version');
  });
  if (errors.length) return result(false, errors, model, null);

  const states = new Map();
  const stateIds = new Set();
  const computed = new Map();
  check(() => {
    for (const [i, raw] of arr(model.states, '$.states').entries()) {
      const p = `$.states[${i}]`; obj(raw, p); const id = str(raw.id, `${p}.id`);
      if (states.has(id)) fail(`${p}.id: duplicate state ${id}`);
      const source = obj(raw.source, `${p}.source`);
      if (!['ledger', 'authoritative-model'].includes(source.kind)) fail(`${p}.source.kind: canonical states require ledger or authoritative-model provenance`);
      requireRef(source.reference, `${p}.source.reference`); requireRef(source.revision, `${p}.source.revision`); digest(source.digest, `${p}.source.digest`);
      const inv = obj(raw.inventory, `${p}.inventory`); requireRef(inv.sourceRef, `${p}.inventory.sourceRef`); digest(inv.digest, `${p}.inventory.digest`);
      const expectedAssets = new Set(uniqueStrings(inv.assetIds, `${p}.inventory.assetIds`));
      const expectedCommitments = new Set(uniqueStrings(inv.commitmentIds, `${p}.inventory.commitmentIds`));
      const assets = arr(raw.assets, `${p}.assets`); const commitments = arr(raw.commitments, `${p}.commitments`);
      const seenAssetIds = new Set(); const seenCommitmentIds = new Set(); const allIds = new Set();
      let eev = 0n; let protectedCapital = 0n; let unrepresentable = false;
      for (const [j, asset] of assets.entries()) {
        const ap = `${p}.assets[${j}]`; obj(asset, ap); const aid = str(asset.id, `${ap}.id`);
        if (seenAssetIds.has(aid)) fail(`${ap}.id: duplicate asset id ${aid}`);
        seenAssetIds.add(aid); allIds.add(aid);
        if (!['A1','A2','A3','A4','A5'].includes(asset.cell)) fail(`${ap}.cell: invalid R7 asset cell`);
        const amount = integer(asset.amount, `${ap}.amount`);
        if (asset.cell === 'A1' || asset.cell === 'A2') eev += amount;
      }
      for (const [j, item] of commitments.entries()) {
        const cp = `${p}.commitments[${j}]`; obj(item, cp); const cid = str(item.id, `${cp}.id`);
        if (seenCommitmentIds.has(cid)) fail(`${cp}.id: duplicate commitment id ${cid}`);
        if (allIds.has(cid)) fail(`${cp}.id: cross-side duplicate without explicit R7 contingency refinement`);
        seenCommitmentIds.add(cid); allIds.add(cid);
        if (!['L1','L2','L3','L4','L5','L6'].includes(item.cell)) fail(`${cp}.cell: invalid R7 liability cell`);
        const amount = integer(item.amount, `${cp}.amount`);
        if (['L1','L2','L3'].includes(item.cell)) protectedCapital += amount;
        if (item.cell === 'L6') unrepresentable = true;
      }
      if (!setEquals(expectedAssets, seenAssetIds)) fail(`${p}.inventory.assetIds: inventory does not exactly match asset partition`);
      if (!setEquals(expectedCommitments, seenCommitmentIds)) fail(`${p}.inventory.commitmentIds: inventory does not exactly match commitment partition`);
      const add = obj(raw.protectedCapitalAddons, `${p}.protectedCapitalAddons`);
      for (const field of ['safetyCapital','reserveProtection','mandatoryFutureCosts','additionalProtectedCapital']) protectedCapital += integer(add[field], `${p}.protectedCapitalAddons.${field}`);
      const buffer = eev - protectedCapital;
      const rep = !unrepresentable && setEquals(expectedAssets, seenAssetIds) && setEquals(expectedCommitments, seenCommitmentIds);
      const chi = rep && buffer >= 0n;
      states.set(id, raw); stateIds.add(id); computed.set(id, { eev, protectedCapital, buffer, rep, chi });
    }
    if (states.size === 0) fail('$.states: empty state domain');
  });
  if (errors.length) return result(false, errors, model, computed);

  const actions = new Map();
  check(() => {
    for (const [i, raw] of arr(model.actions, '$.actions').entries()) {
      const p = `$.actions[${i}]`; obj(raw, p); const id = str(raw.id, `${p}.id`);
      if (actions.has(id)) fail(`${p}.id: duplicate action ${id}`);
      const availableIn = uniqueStrings(raw.availableIn, `${p}.availableIn`);
      const acceptedIn = uniqueStrings(raw.acceptedIn, `${p}.acceptedIn`);
      for (const s of [...availableIn, ...acceptedIn]) if (!stateIds.has(s)) fail(`${p}: unknown state ${s}`);
      actions.set(id, { ...raw, availableIn: new Set(availableIn), acceptedIn: new Set(acceptedIn) });
    }
    if (actions.size === 0) fail('$.actions: empty action domain');
  });
  if (errors.length) return result(false, errors, model, computed);

  const env = model.environment;
  const omega = model.omega;
  const transitions = new Map();
  const allEventIds = new Set();
  const envEventIds = new Set();
  const omegaEventIds = new Set();
  check(() => {
    obj(env, '$.environment'); str(env.perimeterId, '$.environment.perimeterId');
    const refs = uniqueStrings(env.sourceRefs, '$.environment.sourceRefs'); if (!refs.length) fail('$.environment.sourceRefs: empty perimeter evidence');
    for (const [i, event] of arr(env.events, '$.environment.events').entries()) {
      const p = `$.environment.events[${i}]`; obj(event, p); const id = str(event.id, `${p}.id`);
      if (allEventIds.has(id)) fail(`${p}.id: duplicate event id`); allEventIds.add(id); envEventIds.add(id); requireRef(event.sourceRef, `${p}.sourceRef`);
    }
    obj(omega, '$.omega'); str(omega.id, '$.omega.id');
    const omegaRefs = uniqueStrings(omega.sourceRefs, '$.omega.sourceRefs'); if (!omegaRefs.length) fail('$.omega.sourceRefs: empty Ω evidence');
    for (const [i, event] of arr(omega.events, '$.omega.events').entries()) {
      const p = `$.omega.events[${i}]`; obj(event, p); const id = str(event.id, `${p}.id`);
      if (allEventIds.has(id)) fail(`${p}.id: event ids must be globally unique across Env and Ω`); allEventIds.add(id); omegaEventIds.add(id); requireRef(event.sourceRef, `${p}.sourceRef`);
    }
    if (!envEventIds.size) fail('$.environment.events: empty real-perimeter event domain');
    if (!omegaEventIds.size) fail('$.omega.events: empty Ω (vacuous closure is forbidden)');
    for (const [i, row] of arr(model.transitions, '$.transitions').entries()) {
      const p = `$.transitions[${i}]`; obj(row, p);
      const s = str(row.state, `${p}.state`), a = str(row.action, `${p}.action`), e = str(row.event, `${p}.event`), t = str(row.successor, `${p}.successor`);
      if (!stateIds.has(s) || !stateIds.has(t)) fail(`${p}: unknown state/successor`);
      if (!actions.has(a)) fail(`${p}: unknown action ${a}`);
      if (!allEventIds.has(e)) fail(`${p}: event ${e} is not declared in Env or Ω`);
      if (!actions.get(a).availableIn.has(s)) fail(`${p}: transition uses action ${a} unavailable in ${s}`);
      const key = tupleKey(s,a,e); if (transitions.has(key)) fail(`${p}: T is not functional for state/action/event`);
      transitions.set(key, { state:s, action:a, event:e, successor:t });
    }
    const materialityPairs = new Set();
    const materialityEventUse = new Set();
    for (const [i, row] of arr(env.materiality, '$.environment.materiality').entries()) {
      const p = `$.environment.materiality[${i}]`; obj(row, p);
      const s = str(row.state, `${p}.state`), a = str(row.action, `${p}.action`);
      requireRef(row.sourceRef, `${p}.sourceRef`);
      if (!stateIds.has(s) || !actions.has(a) || !actions.get(a).availableIn.has(s)) fail(`${p}: materiality row does not name an available state/action pair`);
      const pair = tupleKey(s,a); if (materialityPairs.has(pair)) fail(`${p}: duplicate materiality declaration for state/action pair`); materialityPairs.add(pair);
      const eventIds = uniqueStrings(row.eventIds, `${p}.eventIds`);
      for (const e of eventIds) {
        if (!envEventIds.has(e)) fail(`${p}: material event ${e} is not declared in Env`);
        if (!transitions.has(tupleKey(s,a,e))) fail(`${p}: material Env event ${e} has no derived T successor for (${s}, ${a})`);
        materialityEventUse.add(e);
      }
    }
    for (const [aid, action] of actions) for (const sid of action.availableIn) {
      if (!materialityPairs.has(tupleKey(sid,aid))) fail(`Env materiality not declared for available pair (${sid}, ${aid})`);
      const rows = [...transitions.values()].filter(r => r.state === sid && r.action === aid && omegaEventIds.has(r.event));
      if (!rows.length) fail(`Ω empty for available pair (${sid}, ${aid}); refusing vacuous VC3/VC5`);
    }
    for (const e of envEventIds) if (!materialityEventUse.has(e)) fail(`Env event ${e} is never declared material for any available state/action pair`);
    for (const row of transitions.values()) if (envEventIds.has(row.event) && !materialityPairs.has(tupleKey(row.state,row.action))) fail(`Env transition (${row.state}, ${row.action}, ${row.event}) lacks a materiality declaration`);
    for (const row of transitions.values()) if (envEventIds.has(row.event)) {
      const covered = [...transitions.values()].some(o => o.state === row.state && o.action === row.action && omegaEventIds.has(o.event) && o.successor === row.successor);
      if (!covered) fail(`Ω under-approximates Env at (${row.state}, ${row.action}, successor ${row.successor})`);
    }
    for (const id of envEventIds) if (![...transitions.values()].some(r => r.event === id)) fail(`Env event ${id} induces no transition`);
    for (const id of omegaEventIds) if (![...transitions.values()].some(r => r.event === id)) fail(`Ω event ${id} induces no transition`);
  });
  if (errors.length) return result(false, errors, model, computed);

  const cert = model.certificate;
  const kc = new Set([...computed.entries()].filter(([, v]) => v.chi).map(([id]) => id));
  const chiStates = new Set([...computed.entries()].filter(([, v]) => v.chi).map(([id]) => id));
  check(() => {
    obj(cert.witnessByState, '$.certificate.witnessByState');
    const witnessStates = new Set(Object.keys(cert.witnessByState));
    if (!setEquals(witnessStates, chiStates)) fail('VC3: witness selector must have exactly one entry for every derived χ=1 state and no others');
    for (const sid of kc) {
      const aid = str(cert.witnessByState[sid], `$.certificate.witnessByState.${sid}`);
      const action = actions.get(aid); if (!action) fail(`VC3: unknown witness action ${aid} at ${sid}`);
      if (!action.availableIn.has(sid)) fail(`VC3: witness ${aid} unavailable at ${sid}`);
      if (!action.acceptedIn.has(sid)) fail(`VC4: witness ${aid} not accepted at ${sid}`);
      const successors = [...transitions.values()].filter(r => r.state === sid && r.action === aid && omegaEventIds.has(r.event));
      if (!successors.length) fail(`VC3: empty Ω successors for witness (${sid}, ${aid})`);
      for (const r of successors) if (!kc.has(r.successor)) fail(`VC3 counterexample: ${sid} --${aid}/${r.event}--> ${r.successor} is outside χ=1`);
    }
    const s0 = str(cert.initialStateId, '$.certificate.initialStateId');
    if (!states.has(s0)) fail(`VC6: unknown initial state ${s0}`);
    if (!kc.has(s0)) fail(`VC6: χ(S0)=0 for ${s0}`);
    if (states.get(s0).source.kind !== 'ledger') fail('VC6: S0 must be ledger-derived; synthetic/fixture/model states cannot be promoted to deployment S0');
  });
  return result(errors.length === 0, errors, model, computed, { kc, envEventIds, omegaEventIds });
}

function result(ok, errors, model, computed, detail = {}) {
  const inputDigest = createHash('sha256').update(canonical(model ?? null)).digest('hex');
  const stateSummary = computed ? [...computed.entries()].map(([id,v]) => ({
    id, eev: String(v.eev), protectedCapital: String(v.protectedCapital), buffer: String(v.buffer), Rep: v.rep, chi: v.chi
  })) : [];
  return {
    schemaVersion: 'immortal-r1-checker-result-v1',
    ok,
    status: ok ? 'FINITE_MODEL_CERTIFICATE_VALID_RELATIVE_TO_DECLARED_INPUTS' : 'REJECTED',
    checker: { id: 'immortal-r1-finite-certificate-checker', version: '0.1.0', sha256: checkerDigest },
    profile: model?.profile ? { id: model.profile.id, version: model.profile.version } : null,
    model: model?.model ? { id: model.model.id, version: model.model.version } : null,
    certificate: model?.certificate ? { id: model.certificate.id, version: model.certificate.version } : null,
    inputSha256: inputDigest,
    certifiedStates: detail.kc ? [...detail.kc].sort() : stateSummary.filter(s=>s.chi).map(s=>s.id).sort(),
    states: stateSummary,
    derivedOmegaEventCount: detail.omegaEventIds?.size ?? 0,
    declaredPerimeterEventCount: detail.envEventIds?.size ?? 0,
    checks: {
      VC1: ok ? 'PASS_FOR_DECLARED_FINITE_PREDICATE' : 'FAIL_OR_UNVERIFIED',
      VC2: ok ? 'PASS_FOR_DERIVED_REP_AND_BUFFER_RULE' : 'FAIL_OR_UNVERIFIED',
      VC3: ok ? 'PASS_FOR_ENUMERATED_TRANSITION_RELATION_AND_OMEGA' : 'FAIL_OR_UNVERIFIED',
      VC4: ok ? 'PASS_FOR_DECLARED_ACCEPT_RELATION' : 'FAIL_OR_UNVERIFIED',
      VC5: ok ? 'PASS_RELATIVE_TO_DECLARED_ENV_SUCCESSORS_ONLY' : 'FAIL_OR_UNVERIFIED',
      VC6: ok ? 'PASS_FOR_LEDGER_REFERENCED_S0_METADATA; AUTHENTICITY NOT VERIFIED' : 'FAIL_OR_UNVERIFIED'
    },
    limitations: [
      'This checks only the finite model and provenance metadata supplied as input; it does not authenticate external sources or prove that the declared Env covers reality.',
      'A PASS is not a mathematical proof of the real deployment, adapter conformance, implementation refinement, or governance approval.',
      'The model must be source-grounded: availableIn, acceptedIn, transition rows and Env/Ω event evidence are model inputs, not proof that deployed code implements them.'
    ],
    errors
  };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const path = process.argv[2];
  if (!path) { console.error('Usage: node scripts/check-r1-finite-certificate.mjs <model.json>'); process.exit(2); }
  try {
    const model = JSON.parse(readFileSync(path, 'utf8'));
    const output = verifyR1(model);
    process.stdout.write(`${JSON.stringify(output, null, 2)}\n`);
    if (!output.ok) process.exitCode = 1;
  } catch (error) {
    process.stdout.write(`${JSON.stringify({ schemaVersion:'immortal-r1-checker-result-v1', ok:false, status:'REJECTED', errors:[error.message] }, null, 2)}\n`);
    process.exitCode = 1;
  }
}
