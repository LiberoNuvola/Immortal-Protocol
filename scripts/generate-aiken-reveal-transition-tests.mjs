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


function poolDatum(snapshot, label, overrides = {}) {
  if (!snapshot || typeof snapshot !== 'object' || !snapshot.fields) {
    throw new Error('Missing B1PrizePool datum snapshot: ' + label);
  }
  const v = { ...snapshot.fields, ...overrides };
  const n = (key) => String(integer(v[key], label + '.' + key));
  return 'reveal_types.B1PrizePoolDatum { '
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

const contextHelpers = [
  [
    'fn context_tx_with_inputs(tx: transaction.Transaction, inputs: List<transaction.Input>) -> transaction.Transaction {',
    '  transaction.Transaction {',
    '    inputs, reference_inputs: tx.reference_inputs, outputs: tx.outputs,',
    '    fee: tx.fee, mint: tx.mint, certificates: tx.certificates, withdrawals: tx.withdrawals,',
    '    validity_range: tx.validity_range, extra_signatories: tx.extra_signatories,',
    '    redeemers: tx.redeemers, datums: tx.datums, id: tx.id, votes: tx.votes,',
    '    proposal_procedures: tx.proposal_procedures, current_treasury_amount: tx.current_treasury_amount,',
    '    treasury_donation: tx.treasury_donation,',
    '  }',
    '}',
  ].join('\n'),
  [
    'fn context_tx_with_outputs(tx: transaction.Transaction, outputs: List<transaction.Output>) -> transaction.Transaction {',
    '  transaction.Transaction {',
    '    inputs: tx.inputs, reference_inputs: tx.reference_inputs, outputs,',
    '    fee: tx.fee, mint: tx.mint, certificates: tx.certificates, withdrawals: tx.withdrawals,',
    '    validity_range: tx.validity_range, extra_signatories: tx.extra_signatories,',
    '    redeemers: tx.redeemers, datums: tx.datums, id: tx.id, votes: tx.votes,',
    '    proposal_procedures: tx.proposal_procedures, current_treasury_amount: tx.current_treasury_amount,',
    '    treasury_donation: tx.treasury_donation,',
    '  }',
    '}',
  ].join('\n'),
];
const contextTests = [];
for (const [name, item] of cases) {
  const secret = hex(item.playerSecretHex, name + '.playerSecretHex');
  const ownHash = hex(item.expectedOwnPrizeScriptHashHex, name + '.expectedOwnPrizeScriptHashHex');
  const input = prizeDatum(item.inputPrizeDatum, name + '.contextInput');
  const output = prizeDatum(item.outputPrizeDatum, name + '.contextOutput');
  const before = poolDatum(item.poolBefore, name + '.contextPoolBefore');
  const after = poolDatum(item.poolAfter, name + '.contextPoolAfter');
  const changedPoolAccounting = poolDatum(item.poolAfter, name + '.contextChangedPoolAccounting', {
    pendingLiabilities: integer(item.poolAfter.fields.pendingLiabilities, name + '.pendingLiabilities') + 1,
  });
  const poolHash = hex(item.inputPrizeDatum.fields.prizePoolHashHex, name + '.contextPoolHash');
  const expiry = integer(item.inputPrizeDatum.fields.expiresAt, name + '.contextExpiry');
  const prefix = 'haskell_context_' + name;
  contextHelpers.push([
    'fn ' + prefix + '_input_datum() -> reveal_types.PrizeDatum {',
    '  ' + input,
    '}',
    'fn ' + prefix + '_output_datum() -> reveal_types.PrizeDatum {',
    '  ' + output,
    '}',
    'fn ' + prefix + '_pool_before() -> reveal_types.B1PrizePoolDatum {',
    '  ' + before,
    '}',
    'fn ' + prefix + '_pool_after() -> reveal_types.B1PrizePoolDatum {',
    '  ' + after,
    '}',
    'fn ' + prefix + '_own_ref() -> transaction.OutputReference {',
    '  transaction.OutputReference { transaction_id: transaction.placeholder.id, output_index: 0 }',
    '}',
    'fn ' + prefix + '_prize_output(datum: reveal_types.PrizeDatum, value: assets.Value) -> transaction.Output {',
    '  transaction.Output {',
    '    address: address.from_script(#"' + ownHash + '"),',
    '    value, datum: transaction.InlineDatum(datum), reference_script: None,',
    '  }',
    '}',
    'fn ' + prefix + '_pool_output(datum: reveal_types.B1PrizePoolDatum, value: assets.Value) -> transaction.Output {',
    '  transaction.Output {',
    '    address: address.from_script(#"' + poolHash + '"),',
    '    value, datum: transaction.InlineDatum(datum), reference_script: None,',
    '  }',
    '}',
    'fn ' + prefix + '_tx() -> transaction.Transaction {',
    '  let own_ref = ' + prefix + '_own_ref()',
    '  let own_value = assets.from_lovelace(5_000_000)',
    '  let pool_value = assets.from_lovelace(10_000_000)',
    '  let input_datum = ' + prefix + '_input_datum()',
    '  let pool_before = ' + prefix + '_pool_before()',
    '  transaction.Transaction {',
    '    inputs: [',
    '      transaction.Input {',
    '        output_reference: own_ref,',
    '        output: transaction.Output {',
    '          address: address.from_script(#"' + ownHash + '"),',
    '          value: own_value, datum: transaction.InlineDatum(input_datum), reference_script: None,',
    '        },',
    '      },',
    '      transaction.Input {',
    '        output_reference: transaction.OutputReference { transaction_id: transaction.placeholder.id, output_index: 1 },',
    '        output: transaction.Output {',
    '          address: address.from_script(#"' + poolHash + '"),',
    '          value: pool_value, datum: transaction.InlineDatum(pool_before), reference_script: None,',
    '        },',
    '      },',
    '    ],',
    '    reference_inputs: [],',
    '    outputs: [',
    '      ' + prefix + '_prize_output(' + prefix + '_output_datum(), own_value),',
    '      ' + prefix + '_pool_output(' + prefix + '_pool_after(), pool_value),',
    '    ],',
    '    fee: 0, mint: assets.zero, certificates: [], withdrawals: [],',
    '    validity_range: interval.between(0, ' + expiry + '),',
    '    extra_signatories: [], redeemers: [], datums: transaction.placeholder.datums,',
    '    id: transaction.placeholder.id, votes: [], proposal_procedures: [],',
    '    current_treasury_amount: None, treasury_donation: None,',
    '  }',
    '}',
  ].join('\n'));
  const invoke = (txExpr, secretExpr) =>
    'reveal_transaction.reveal_transaction_is_valid(' + txExpr + ', ' + prefix + '_own_ref(), '
      + prefix + '_input_datum(), ' + secretExpr + ')';
  contextTests.push(test(prefix + '_complete_context_accepts_canonical_fixture',
    invoke(prefix + '_tx()', '#"' + secret + '"')));
  contextTests.push(test(prefix + '_complete_context_rejects_wrong_secret',
    '!' + invoke(prefix + '_tx()', '#"00000000"')));
  contextTests.push(test(prefix + '_complete_context_rejects_missing_pool_output',
    '{\n  let tx = ' + prefix + '_tx()\n  let damaged = transaction.Transaction { inputs: tx.inputs, reference_inputs: tx.reference_inputs, outputs: list.take(tx.outputs, 1), fee: tx.fee, mint: tx.mint, certificates: tx.certificates, withdrawals: tx.withdrawals, validity_range: tx.validity_range, extra_signatories: tx.extra_signatories, redeemers: tx.redeemers, datums: tx.datums, id: tx.id, votes: tx.votes, proposal_procedures: tx.proposal_procedures, current_treasury_amount: tx.current_treasury_amount, treasury_donation: tx.treasury_donation }\n  !'
      + invoke('damaged', '#"' + secret + '"') + '\n}'));
  contextTests.push(test(prefix + '_complete_context_rejects_duplicate_pool_input',
    '{\n  let tx = ' + prefix + '_tx()\n  let damaged = context_tx_with_inputs(tx, list.concat(tx.inputs, list.drop(tx.inputs, 1)))\n  !'
      + invoke('damaged', '#"' + secret + '"') + '\n}'));
  contextTests.push(test(prefix + '_complete_context_rejects_missing_pool_input',
    '{\n  let tx = ' + prefix + '_tx()\n  let damaged = context_tx_with_inputs(tx, list.take(tx.inputs, 1))\n  !'
      + invoke('damaged', '#"' + secret + '"') + '\n}'));
  contextTests.push(test(prefix + '_complete_context_rejects_duplicate_pool_output',
    '{\n  let tx = ' + prefix + '_tx()\n  let damaged = context_tx_with_outputs(tx, list.concat(tx.outputs, list.drop(tx.outputs, 1)))\n  !'
      + invoke('damaged', '#"' + secret + '"') + '\n}'));
  contextTests.push(test(prefix + '_complete_context_rejects_duplicate_prize_output',
    '{\n  let tx = ' + prefix + '_tx()\n  let damaged = context_tx_with_outputs(tx, ['
      + prefix + '_prize_output(' + prefix + '_output_datum(), assets.from_lovelace(5_000_000)), '
      + prefix + '_prize_output(' + prefix + '_output_datum(), assets.from_lovelace(5_000_000)), '
      + prefix + '_pool_output(' + prefix + '_pool_after(), assets.from_lovelace(10_000_000))])\n  !'
      + invoke('damaged', '#"' + secret + '"') + '\n}'));
  contextTests.push(test(prefix + '_complete_context_rejects_changed_pool_accounting',
    '{\n  let tx = ' + prefix + '_tx()\n  let damaged = context_tx_with_outputs(tx, ['
      + prefix + '_prize_output(' + prefix + '_output_datum(), assets.from_lovelace(5_000_000)), '
      + prefix + '_pool_output(' + changedPoolAccounting + ', assets.from_lovelace(10_000_000))])\n  !'
      + invoke('damaged', '#"' + secret + '"') + '\n}'));
  contextTests.push(test(prefix + '_complete_context_rejects_missing_own_input',
    '{\n  let tx = ' + prefix + '_tx()\n  let damaged = context_tx_with_inputs(tx, list.drop(tx.inputs, 1))\n  !'
      + invoke('damaged', '#"' + secret + '"') + '\n}'));
  contextTests.push(test(prefix + '_complete_context_rejects_duplicate_own_input',
    '{\n  let tx = ' + prefix + '_tx()\n  let damaged = context_tx_with_inputs(tx, list.concat(tx.inputs, list.take(tx.inputs, 1)))\n  !'
      + invoke('damaged', '#"' + secret + '"') + '\n}'));
  contextTests.push(test(prefix + '_complete_context_rejects_changed_prize_value',
    '{\n  let tx = ' + prefix + '_tx()\n  let damaged = context_tx_with_outputs(tx, ['
      + prefix + '_prize_output(' + prefix + '_output_datum(), assets.from_lovelace(5_000_001)), '
      + prefix + '_pool_output(' + prefix + '_pool_after(), assets.from_lovelace(10_000_000))])\n  !'
      + invoke('damaged', '#"' + secret + '"') + '\n}'));
  contextTests.push(test(prefix + '_complete_context_rejects_changed_prize_result',
    '{\n  let tx = ' + prefix + '_tx()\n  let changed_datum = reveal_types.PrizeDatum { ..' + prefix + '_output_datum(), result: #"" }\n  let damaged = context_tx_with_outputs(tx, ['
      + prefix + '_prize_output(changed_datum, assets.from_lovelace(5_000_000)), '
      + prefix + '_pool_output(' + prefix + '_pool_after(), assets.from_lovelace(10_000_000))])\n  !'
      + invoke('damaged', '#"' + secret + '"') + '\n}'));
}

let source = await fs.readFile(outputPath, 'utf8');
const contextImport = 'use immortal/reveal_context_guards.{RevealPoolState, expire_window_open, reveal_pool_transition_is_valid, reveal_window_open}';
const fullContextImports = [
  'use aiken/collection/list',
  'use aiken/interval',
  'use cardano/address as address',
  'use cardano/assets as assets',
  'use cardano/transaction',
  'use cardano/transaction.{Transaction}',
  'use immortal/reveal_types',
  'use immortal/reveal_transaction',
];

if (!source.includes(contextImport)) throw new Error('Generated Aiken fixture import anchor not found');
for (const importLine of ['use immortal/reveal_transition', 'use immortal/reveal_types']) {
  if (!source.includes(importLine)) {
    source = source.replace(contextImport, contextImport + '\n' + importLine);
  }
}
const endAnchor = 'test haskell_crypto_player_commitment() {';
if (!source.includes(endAnchor)) throw new Error('Generated Aiken test insertion point not found');
if (source.includes('test haskell_transition_successful_reveal_state_predicate_accepts()')) {
  throw new Error('Reveal state-transition tests already present; refusing duplicate append');
}
for (const importLine of fullContextImports) {
  if (!source.includes(importLine)) source = source.replace(contextImport, contextImport + '\n' + importLine);
}
if (source.includes('haskell_context_successful_reveal_tx()')) {
  throw new Error('Complete transaction-context tests already present; refusing duplicate append');
}
source = source.replace(endAnchor, generatedTests.join('\n') + '\n' + endAnchor);
source += '\n' + contextHelpers.join('\n') + '\n' + contextTests.join('\n');
await fs.writeFile(outputPath, source, 'utf8');
console.log('Generated 14 pure state-transition tests plus 24 complete typed-transaction-context tests from canonical Haskell winning/loss snapshots.');
