import test from 'node:test';
import assert from 'node:assert/strict';
import { projectV3ToUniversal, gitBlobSha, verifySourceSnapshot } from '../scripts/check-v3-universal-projection.mjs';

function model() {
  return {
    profile: {
      version: '1',
      maxNormalPayoutMultiplier: '500',
      classPrices: [{classId:'0',price:'1'},{classId:'1',price:'2'},{classId:'2',price:'3'}]
    },
    state: {
      crystallizedLiabilities:'10', unresolvedReserve:'8', unresolvedTicketCount:'3',
      safetyCapital:'5', reserveProtection:'6', mandatoryFutureCosts:'7',
      classes:[
        {classId:'0',issued:'4',unresolved:'2',exposure:'2',cap:'100',saleable:true},
        {classId:'1',issued:'3',unresolved:'1',exposure:'2',cap:'100',saleable:true},
        {classId:'2',issued:'2',unresolved:'0',exposure:'0',cap:'100',saleable:false}
      ],
      control:{currentActiveClass:'1',highestClassEverActivated:'2'},
      jackpot:{lockedAmount:'11',threshold:'50',status:'JackpotLocked',cycle:'2'}
    },
    eev:'1600'
  };
}
const clone = x => JSON.parse(JSON.stringify(x));

test('projects exact canonical classes and maps Jackpot exactly once', () => {
  const out = projectV3ToUniversal(model());
  assert.equal(out.projected.worstCaseExposure, '2000');
  assert.equal(out.projected.additionalProtectedCapital, '11');
  assert.equal(out.v3ProtectedCapital, out.universalProtectedCapital);
  assert.equal(out.buffer, '-439');
  assert.equal(out.invariants.exactCanonicalClassSet, true);
});

test('rejects a missing canonical class', () => {
  const m = model(); m.state.classes.pop();
  assert.throws(() => projectV3ToUniversal(m), /missing canonical class/);
});

test('rejects duplicate classes', () => {
  const m = model(); m.state.classes[2].classId = '1';
  assert.throws(() => projectV3ToUniversal(m), /duplicate class/);
});

test('rejects unknown/out-of-profile classes', () => {
  const m = model(); m.state.classes[2].classId = '9';
  assert.throws(() => projectV3ToUniversal(m), /unknown\/out-of-profile class/);
});

test('rejects incoherent profiles with duplicate class IDs', () => {
  const m = model(); m.profile.classPrices.push({classId:'1',price:'8'});
  assert.throws(() => projectV3ToUniversal(m), /duplicate class/);
});

test('rejects class exposure inconsistent with canonical price × unresolved count', () => {
  const m = model(); m.state.classes[1].exposure = '99';
  assert.throws(() => projectV3ToUniversal(m), /exposure: expected canonical price/);
});

test('rejects aggregate reserve that hides a class omission or mismatch', () => {
  const m = model(); m.state.unresolvedReserve = '7';
  assert.throws(() => projectV3ToUniversal(m), /class-derived total/);
});

test('rejects unresolved ticket-count mismatch', () => {
  const m = model(); m.state.unresolvedTicketCount = '4';
  assert.throws(() => projectV3ToUniversal(m), /class-derived total/);
});

test('rejects a profile with a non-positive price', () => {
  const m = model(); m.profile.classPrices[0].price = '0';
  assert.throws(() => projectV3ToUniversal(m), /must be positive/);
});

test('rejects invalid control history', () => {
  const m = model(); m.state.control.currentActiveClass = '2'; m.state.control.highestClassEverActivated = '1';
  assert.throws(() => projectV3ToUniversal(m), /exceeds highest/);
});

test('rejects negative Jackpot locked amount instead of dropping it', () => {
  const m = model(); m.state.jackpot.lockedAmount = '-1';
  assert.throws(() => projectV3ToUniversal(m), /must be non-negative/);
});

test('Git blob SHA uses object framing', () => {
  assert.equal(gitBlobSha('test'), '30d74d258442c7c65512eafab474568dd706c430');
});
