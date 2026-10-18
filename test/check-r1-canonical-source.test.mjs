import test from 'node:test';
import assert from 'node:assert/strict';
import { extractActionConstructors, extractRecordFields, gitBlobSha } from '../scripts/check-r1-canonical-source.mjs';

test('extracts the four existing normative V3 action constructors', () => {
  const source = `data V3Action
  = Issue TicketClass Integer
  | Reveal TicketClass Integer
  | Claim Integer
  | Expire TicketClass

{-# INLINABLE transition #-}`;
  assert.deepEqual(extractActionConstructors(source), ['Issue', 'Reveal', 'Claim', 'Expire']);
});

test('detects an invented action instead of silently ignoring it', () => {
  const source = `data V3Action
  = Issue TicketClass Integer
  | Reveal TicketClass Integer
  | Claim Integer
  | Expire TicketClass
  | NoOp

{-# INLINABLE transition #-}`;
  assert.deepEqual(extractActionConstructors(source), ['Issue', 'Reveal', 'Claim', 'Expire', 'NoOp']);
  assert.notDeepEqual(extractActionConstructors(source), ['Issue', 'Reveal', 'Claim', 'Expire']);
});

test('extracts typed fields from a canonical record', () => {
  const source = `data UniversalEconomicState = UniversalEconomicState
  { uesCrystallizedLiabilities :: Integer
  , uesUnresolvedReserve :: Integer
  , uesAdditionalProtectedCapital :: Integer
  }`;
  assert.deepEqual(extractRecordFields(source, 'UniversalEconomicState', 'ues'), [
    { name: 'uesCrystallizedLiabilities', type: 'Integer' },
    { name: 'uesUnresolvedReserve', type: 'Integer' },
    { name: 'uesAdditionalProtectedCapital', type: 'Integer' }
  ]);
});

test('computes the Git blob SHA-1, including Git object framing', () => {
  assert.equal(gitBlobSha('test'), '30d74d258442c7c65512eafab474568dd706c430');
});
