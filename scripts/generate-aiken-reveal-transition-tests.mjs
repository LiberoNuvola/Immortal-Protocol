import fs from 'node:fs/promises';

const [fixturePath, outputPath] = process.argv.slice(2);
if (!fixturePath || !outputPath) {
  throw new Error('Usage: node generate-aiken-reveal-transition-tests.mjs <fixture.json> <generated-tests.ak>');
}

const document = JSON.parse(await fs.readFile(fixturePath, 'utf8'));
if (document.schema !== 'pre-rich-reveal-plutus-data-v3') {
  throw new Error('Unsupported fixture schema for transition tests: ' + document.schema);
}

const cases = [
  ['successful_reveal', document.transitionFixtures?.successfulReveal],
  ['zero_payout_loss', document.transitionFixtures?.zeroPayoutLoss],
];
const hex = (value, label) => {
  if (typeof value !== 'string' || !/^(?:[0-9a-f]{2})*$/.test(value)) {
    throw new Error('Malformed hex field: ' + label);
  }
  return value;
};
const integer = (value, label) => {
  if (!Number.isSafeInteger(value)) throw new Error('Malformed integer field: ' + label);
  return value;
};

function prizeDatum(snapshot, label, overrides = {}) {
  if (!snapshot || typeof snapshot !== 'object' || !snapshot.fields) {
    throw new Error('Missing PrizeDatum snapshot: ' + label);
  }
  const v = { ...snapshot.fields, ...overrides };
  const b = (key) => '#"' + hex(v[key], label + '.' + key) + '"';
  const n = (key) => String(integer(v[key], label + '.' + key));
  const target = v.beaconTarget;
  if (!target || typeof target !== 'object') throw new Error('Missing BeaconTarget: ' + label);
  const targetExpr = 'reveal_types.BeaconTarget { '
    + 'network_id: ' + integer(target.networkId, label + '.networkId') + ', '
    + 'round: ' + integer(target.round, label + '.round') + ', '
    + 'mainchain_ref: #"' + hex(target.mainchainRefHex, label + '.mainchainRefHex') + '", '
    + 'version: #"' + hex(target.versionHex, label + '.versionHex') + '" '
    + '}';
  const statuses = new Set(['Pending', 'Revealed', 'Claimed']);
  const beaconStatuses = new Set(['BeaconPending', 'BeaconReady']);
  if (!statuses.has(v.status) || !beaconStatuses.has(v.beaconStatus)) {
    throw new Error('Unknown datum status: ' + label);
  }
  return 'reveal_types.PrizeDatum { '
    + 'ticket_policy: ' + b('ticketPolicyHex') + ', '
    + 'ticket_name: ' + b('ticketNameHex') + ', '
    + 'player_commitment: ' + b('playerCommitmentHex') + ', '
    + 'price_usdm: ' + n('priceUsdm') + ', '
    + 'commitment: ' + b('commitmentHex') + ', '
    + 'game_version: ' + b('gameVersionHex') + ', '
    + 'ticket_nonce: ' + n('ticketNonce') + ', '
    + 'prize_amount: ' + n('prizeAmount') + ', '
    + 'payment_policy: ' + b('paymentPolicyHex') + ', '
    + 'payment_name: ' + b('paymentNameHex') + ', '
    + 'status: reveal_types.' + v.status + ', '
    + 'result: ' + b('resultHex') + ', '
    + 'prize_tier: ' + n('prizeTier') + ', '
    + 'beacon_target: ' + targetExpr + ', '
    + 'beacon_status: reveal_types.' + v.beaconStatus + ', '
    + 'beacon_value: ' + b('beaconValueHex') + ', '
    + 'mc_hash: ' + b('mcHashHex') + ', '
    + 'materios_context: ' + b('materiosContextHex') + ', '
    + 'prize_pool_hash: ' + b('prizePoolHashHex') + ', '
    + 'issued_at: ' + n('issuedAt') + ', '
    + 'expires_at: ' + n('expiresAt') + ', '
    + 'row1_tier: ' + n('row1Tier') + ', '
    + 'row2_tier: ' + n('row2Tier')
    + ' }';
}

function poolState(snapshot, label, overrides = {}) {
  if (!snapshot || typeof snapshot !== 'object' || !snapshot.fields) {
    throw new Error('Missing B1PrizePool datum snapshot: ' + label);
  }
  const v = { ...snapshot.fields, ...overrides };
  const n = (key) => String(integer(v[key], label + '.' + key));
  return 'RevealPoolState { '
    + 'total_liquidity: ' + n('totalLiquidity') + ', '
    + 'pending_liabilities: ' + n('pendingLiabilities') + ', '
    + 'unresolved_reserve: ' + n('unresolvedReserve') + ', '
    + 'unresolved_ticket_count: ' + n('unresolvedTicketCount') + ', '
    + 'locked_jackpot: ' + n('lockedJackpot') + ', '
    + 'jackpot_threshold: ' + n('jackpotThreshold') + ', '
    + 'suspended_classes: ' + n('suspendedClasses') + ', '
    + 'prize_hash: #"' + hex(v.prizeHashHex, label + '.prizeHashHex') + '" '
    + '}';
}

function test(name, expression) {
  return 'test ' + name + '() {\n  ' + expression + '\n}\n';
}

const table = 'PrizeTable { tier_1: 2, tier_2: 5, tier_3: 10, tier_4: 200, tier_5: 1000 }';
const generatedTests = [];

for (const [name, item] of cases) {
  if (!item || item.name !== name) throw new Error('Missing canonical transition fixture: ' + name);
  const secret = hex(item.playerSecretHex, name + '.playerSecretHex');
  if (secret.length !== 8) throw new Error('Expected four-byte canonical secret in ' + name);
  const expectedOwnHash = hex(item.expectedOwnPrizeScriptHashHex, name + '.expectedOwnPrizeScriptHashHex');
  const input = prizeDatum(item.inputPrizeDatum, name + '.input');
  const output = prizeDatum(item.outputPrizeDatum, name + '.output');
  const changedNonce = prizeDatum(item.outputPrizeDatum, name + '.changedNonce', {
    ticketNonce: integer(item.outputPrizeDatum.fields.ticketNonce, name + '.ticketNonce') + 1,
  });
  const changedResult = prizeDatum(item.outputPrizeDatum, name + '.changedResult', { resultHex: '' });
  const before = poolState(item.poolBefore, name + '.poolBefore');
  const after = poolState(item.poolAfter, name + '.poolAfter');
  const changedLiability = poolState(item.poolAfter, name + '.changedLiability', {
    pendingLiabilities: integer(item.poolAfter.fields.pendingLiabilities, name + '.pendingLiabilities') + 1,
  });
  const changedPoolHash = poolState(item.poolAfter, name + '.changedPoolHash', { prizeHashHex: 'ff' });
  const expiry = integer(item.inputPrizeDatum.fields.expiresAt, name + '.expiresAt');
  const invocation = (outputExpr, secretExpr, boundExpr, poolAfterExpr) =>
    'reveal_transition.reveal_state_transition_is_valid('
    + table + ', ' + input + ', ' + outputExpr + ', ' + secretExpr + ', '
    + boundExpr + ', ' + before + ', ' + poolAfterExpr + ', #"' + expectedOwnHash + '")';

  generatedTests.push(test(
    'haskell_transition_' + name + '_state_predicate_accepts',
    invocation(output, '#"' + secret + '"', 'Some(' + expiry + ')', after),
  ));
  generatedTests.push(test(
    'haskell_transition_' + name + '_rejects_wrong_secret',
    '!' + invocation(output, '#"00000000"', 'Some(' + expiry + ')', after),
  ));
  generatedTests.push(test(
    'haskell_transition_' + name + '_rejects_expired_bound',
    '!' + invocation(output, '#"' + secret + '"', 'Some(' + (expiry + 1) + ')', after),
  ));
  generatedTests.push(test(
    'haskell_transition_' + name + '_rejects_changed_identity',
    '!' + invocation(changedNonce, '#"' + secret + '"', 'Some(' + expiry + ')', after),
  ));
  generatedTests.push(test(
    'haskell_transition_' + name + '_rejects_wrong_result',
    '!' + invocation(changedResult, '#"' + secret + '"', 'Some(' + expiry + ')', after),
  ));
  generatedTests.push(test(
    'haskell_transition_' + name + '_rejects_wrong_pool_liability',
    '!' + invocation(output, '#"' + secret + '"', 'Some(' + expiry + ')', changedLiability),
  ));
  generatedTests.push(test(
    'haskell_transition_' + name + '_rejects_wrong_pool_prize_hash',
    '!' + invocation(output, '#"' + secret + '"', 'Some(' + expiry + ')', changedPoolHash),
  ));
}

let source = await fs.readFile(outputPath, 'utf8');
const contextImport = 'use immortal/reveal_context_guards.{RevealPoolState, expire_window_open, reveal_pool_transition_is_valid, reveal_window_open}';
if (!source.includes(contextImport)) throw new Error('Generated Aiken fixture import anchor not found');
if (!source.includes('use immortal/reveal_transition') && !source.includes('use immortal/reveal_types')) {
  source = source.replace(
    contextImport,
    contextImport + '\nuse immortal/reveal_transition\nuse immortal/reveal_types',
  );
} else if (!source.includes('use immortal/reveal_transition') || !source.includes('use immortal/reveal_types')) {
  throw new Error('Generated Aiken fixture imports are partially installed; refusing duplicate or ambiguous mutation');
}
const endAnchor = 'test haskell_crypto_player_commitment() {';
if (!source.includes(endAnchor)) throw new Error('Generated Aiken test insertion point not found');
if (source.includes('test haskell_transition_successful_reveal_state_predicate_accepts()')) {
  throw new Error('Reveal state-transition tests already present; refusing duplicate append');
}
source = source.replace(endAnchor, generatedTests.join('\n') + '\n' + endAnchor);
await fs.writeFile(outputPath, source, 'utf8');
console.log('Generated 14 Aiken state-transition tests from canonical Haskell winning/loss snapshots (2 accepts, 12 negative twins).');
