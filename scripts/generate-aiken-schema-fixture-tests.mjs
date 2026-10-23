import fs from 'node:fs/promises';
import path from 'node:path';

const [fixturePath, outputPath] = process.argv.slice(2);
if (!fixturePath || !outputPath) {
  throw new Error('Usage: node generate-aiken-schema-fixture-tests.mjs <fixture.json> <output.ak>');
}
const document = JSON.parse(await fs.readFile(fixturePath, 'utf8'));
if (document.schema !== 'pre-rich-reveal-plutus-data-v3') {
  throw new Error(`Unsupported fixture schema: ${document.schema}`);
}
const fixtures = document.fixtures ?? {};
const poolActionFixtures = [
  ['FundTreasury', 'B1PrizePoolAction.FundTreasury', 'reveal_types.FundTreasury'],
  ['TicketIssued', 'B1PrizePoolAction.TicketIssued', 'reveal_types.TicketIssued(100)'],
  ['TicketRevealed', 'B1PrizePoolAction.TicketRevealed', 'reveal_types.TicketRevealed(100)'],
  ['TicketClaimed', 'B1PrizePoolAction.TicketClaimed', 'reveal_types.TicketClaimed(250)'],
  ['TicketExpired', 'B1PrizePoolAction.TicketExpired', 'reveal_types.TicketExpired'],
];
for (const [, key] of poolActionFixtures) {
  if (typeof fixtures[key] !== 'string' || !/^(?:[0-9a-f]{2})+$/.test(fixtures[key])) {
    throw new Error('Missing or malformed canonical Haskell action fixture: ' + key);
  }
}
const poolActionTests = poolActionFixtures.map(([name, key, expr]) =>
  '\ntest b1_pool_action_' + name + '_serialisation_matches_haskell_fixture() {\n'
  + '  serialise_data(' + expr + ') == #"' + fixtures[key] + '"\n}\n'
).join(String.fromCharCode(10));
const semanticFixtures = document.semanticFixtures ?? {};
const rowTierCases = semanticFixtures.rowTierCases;
if (!Array.isArray(rowTierCases) || rowTierCases.length !== 5) {
  throw new Error('Expected exactly five canonical Haskell row-tier fixtures');
}
for (const [index, item] of rowTierCases.entries()) {
  if (!item || typeof item.name !== 'string' || !/^[a-z0-9_]+$/.test(item.name)
      || typeof item.rowHex !== 'string' || !/^(?:[0-9a-f]{2})+$/.test(item.rowHex)
      || !Number.isInteger(item.expectedTier)) {
    throw new Error('Malformed semantic row-tier fixture at index ' + index);
  }
}
const rowTierTests = rowTierCases.map((item) => '\ntest haskell_semantic_row_tier_' + item.name + '() {\n  classify_row_tier(#"' + item.rowHex + '") == ' + item.expectedTier + '\n}\n').join(String.fromCharCode(10));
const prizeAmountCases = semanticFixtures.prizeAmountCases;
if (!Array.isArray(prizeAmountCases) || prizeAmountCases.length !== 5) {
  throw new Error('Expected exactly five canonical Haskell prize amount fixtures');
}
for (const [index, item] of prizeAmountCases.entries()) {
  if (!item || typeof item.name !== 'string' || !/^[a-z0-9_]+$/.test(item.name)
      || !Number.isInteger(item.tier) || !Number.isInteger(item.priceUsdm)
      || !Number.isInteger(item.expectedAmount)) {
    throw new Error('Malformed prize amount fixture at index ' + index);
  }
}
const prizeAmountTests = prizeAmountCases.map((item) => '\ntest haskell_semantic_prize_amount_' + item.name + '() {\n  prize_amount_for_tier(PrizeTable { tier_1: 2, tier_2: 5, tier_3: 10, tier_4: 200, tier_5: 1000 }, ' + item.tier + ', ' + item.priceUsdm + ') == ' + item.expectedAmount + '\n}\n').join(String.fromCharCode(10));
const payoutCases = semanticFixtures.payoutCases;
if (!Array.isArray(payoutCases) || payoutCases.length !== 4) {
  throw new Error('Expected exactly four canonical Haskell semantic payout fixtures');
}
for (const [index, item] of payoutCases.entries()) {
  if (!item || typeof item.name !== 'string' || !/^[a-z0-9_]+$/.test(item.name)
      || !Number.isInteger(item.row1Tier) || !Number.isInteger(item.row2Tier)
      || !Number.isInteger(item.priceUsdm) || !Number.isInteger(item.expectedPayout)) {
    throw new Error(`Malformed semantic payout fixture at index ${index}`);
  }
}
const semanticTests = payoutCases.map((item) => `
test haskell_semantic_payout_${item.name}() {
  row_payout_total(
    PrizeTable { tier_1: 2, tier_2: 5, tier_3: 10, tier_4: 200, tier_5: 1000 },
    ${item.row1Tier},
    ${item.row2Tier},
    ${item.priceUsdm},
  ) == ${item.expectedPayout}
}
`).join(String.fromCharCode(10));
const symbolsVectorCases = semanticFixtures.symbolsVectorCases;
if (!Array.isArray(symbolsVectorCases) || symbolsVectorCases.length !== 4) {
  throw new Error('Expected exactly four canonical Haskell generated-symbol vectors');
}
for (const [index, item] of symbolsVectorCases.entries()) {
  if (!item || typeof item.name !== 'string' || !/^[a-z0-9_]+$/.test(item.name)
      || typeof item.seedHex !== 'string' || !/^(?:[0-9a-f]{2})+$/.test(item.seedHex)
      || typeof item.symbolsHex !== 'string' || !/^(?:[0-9a-f]{2})+$/.test(item.symbolsHex)
      || !Number.isInteger(item.row1OutcomeIndex) || !Number.isInteger(item.row2OutcomeIndex)
      || !Number.isInteger(item.row1FirstDraw) || item.row1FirstDraw < 0 || item.row1FirstDraw > 65535) {
    throw new Error('Malformed generated-symbol vector at index ' + index);
  }
}
const symbolsVectorTests = symbolsVectorCases.map((item) => `
test haskell_crypto_generated_symbols_${item.name}() {
  generate_symbols(#"${item.seedHex}") == #"${item.symbolsHex}"
}

test haskell_crypto_row_one_outcome_${item.name}() {
  row_outcome_index(#"${item.seedHex}", 1) == ${item.row1OutcomeIndex}
}

test haskell_crypto_row_two_outcome_${item.name}() {
  row_outcome_index(#"${item.seedHex}", 2) == ${item.row2OutcomeIndex}
}
`).join(String.fromCharCode(10));
const rejectionRetry = symbolsVectorCases.find((item) => item.name === 'rejection_retry_seed');
if (!rejectionRetry || rejectionRetry.row1FirstDraw < 60000 || rejectionRetry.row1OutcomeIndex < 0 || rejectionRetry.row1OutcomeIndex >= 20000) {
  throw new Error('Rejection-sampling fixture must prove first draw rejected and subsequent outcome valid');
}
const crypto = document.cryptoFixtures;
const cryptoKeys = [
  'playerSecretHex', 'ticketIdHex', 'mainchainRefHex', 'mcHashHex',
  'materiosContextHex', 'gameVersionHex', 'targetEncodedHex',
  'playerCommitmentHex', 'ticketCommitmentHex', 'beaconHex',
  'ticketSeedHex', 'symbolsSeedHex', 'symbolsHex', 'resultDigestHex',
];
if (!crypto || cryptoKeys.some((key) => typeof crypto[key] !== 'string'
    || !/^(?:[0-9a-f]{2})+$/.test(crypto[key]))) {
  throw new Error('Missing or malformed canonical Haskell crypto fixtures');
}
if (!Number.isInteger(crypto.row1OutcomeIndex) || !Number.isInteger(crypto.row2OutcomeIndex)) {
  throw new Error('Missing or malformed canonical Haskell row outcome fixtures');
}
const required = [
  'PrizeDatum.pending',
  'PrizeStatus.Pending',
  'PrizeStatus.Revealed',
  'PrizeStatus.Claimed',
  'BeaconStatus.BeaconPending',
  'BeaconStatus.BeaconReady',
  'PrizeAction.SyncBeacon',
  'PrizeAction.Reveal',
  'PrizeAction.Claim',
  'PrizeAction.Expire',
  'BeaconTarget',
  'B1PrizePoolDatum',
];
for (const key of required) {
  if (typeof fixtures[key] !== 'string' || !/^(?:[0-9a-f]{2})+$/.test(fixtures[key])) {
    throw new Error(`Missing or malformed canonical fixture: ${key}`);
  }
}


const transitionFixtures = document.transitionFixtures;
if (!transitionFixtures || !transitionFixtures.successfulReveal || !transitionFixtures.zeroPayoutLoss || !transitionFixtures.expiryBoundary) {
  throw new Error('Missing canonical Reveal transition or expiry-boundary fixtures');
}

const hexField = (value, label) => {
  if (typeof value !== 'string' || !/^(?:[0-9a-f]{2})*$/.test(value)) {
    throw new Error('Malformed hex field: ' + label);
  }
  return value;
};
const intField = (value, label) => {
  if (!Number.isSafeInteger(value)) throw new Error('Malformed integer field: ' + label);
  return value;
};
const statusIndex = (value, label) => {
  const indices = { Pending: 0, Revealed: 1, Claimed: 2 };
  if (!(value in indices)) throw new Error('Malformed status field: ' + label);
  return indices[value];
};
const beaconStatusIndex = (value, label) => {
  const indices = { BeaconPending: 0, BeaconReady: 1 };
  if (!(value in indices)) throw new Error('Malformed beacon status field: ' + label);
  return indices[value];
};
function prizeDatumDataExpr(snapshot, label) {
  if (!snapshot || typeof snapshot !== 'object') throw new Error('Missing datum snapshot: ' + label);
  const expectedHex = hexField(snapshot.dataHex, label + '.dataHex');
  const v = snapshot.fields;
  if (!v || typeof v !== 'object') throw new Error('Missing datum fields: ' + label);
  const bytes = (key) => 'b_data(#"' + hexField(v[key], label + '.' + key) + '")';
  const integer = (key) => 'i_data(' + intField(v[key], label + '.' + key) + ')';
  const target = v.beaconTarget;
  if (!target || typeof target !== 'object') throw new Error('Missing beacon target: ' + label);
  const targetExpr = 'constr_data(0, ['
    + 'i_data(' + intField(target.networkId, label + '.networkId') + '), '
    + 'i_data(' + intField(target.round, label + '.round') + '), '
    + 'b_data(#"' + hexField(target.mainchainRefHex, label + '.mainchainRefHex') + '"), '
    + 'b_data(#"' + hexField(target.versionHex, label + '.versionHex') + '")'
    + '])';
  const expr = 'constr_data(0, ['
    + [bytes('ticketPolicyHex'), bytes('ticketNameHex'), bytes('playerCommitmentHex'),
       integer('priceUsdm'), bytes('commitmentHex'), bytes('gameVersionHex'),
       integer('ticketNonce'), integer('prizeAmount'), bytes('paymentPolicyHex'),
       bytes('paymentNameHex'),
       'constr_data(' + statusIndex(v.status, label + '.status') + ', [])',
       bytes('resultHex'), integer('prizeTier'), targetExpr,
       'constr_data(' + beaconStatusIndex(v.beaconStatus, label + '.beaconStatus') + ', [])',
       bytes('beaconValueHex'), bytes('mcHashHex'), bytes('materiosContextHex'),
       bytes('prizePoolHashHex'), integer('issuedAt'), integer('expiresAt'),
       integer('row1Tier'), integer('row2Tier')].join(', ')
    + '])';
  return { expr, expectedHex, fields: v };
}
function poolDatumDataExpr(snapshot, label) {
  if (!snapshot || typeof snapshot !== 'object') throw new Error('Missing pool snapshot: ' + label);
  const expectedHex = hexField(snapshot.dataHex, label + '.dataHex');
  const v = snapshot.fields;
  if (!v || typeof v !== 'object') throw new Error('Missing pool fields: ' + label);
  const integer = (key) => 'i_data(' + intField(v[key], label + '.' + key) + ')';
  const prizeHash = hexField(v.prizeHashHex, label + '.prizeHashHex');
  const expr = 'constr_data(0, ['
    + [integer('totalLiquidity'), integer('pendingLiabilities'), integer('unresolvedReserve'),
       integer('unresolvedTicketCount'), integer('lockedJackpot'), integer('jackpotThreshold'),
       integer('suspendedClasses'), 'b_data(#"' + prizeHash + '")'].join(', ')
    + '])';
  return { expr, expectedHex, fields: v };
}
function poolStateExpr(snapshot, label) {
  const s = poolDatumDataExpr(snapshot, label).fields;
  return 'RevealPoolState { '
    + 'total_liquidity: ' + intField(s.totalLiquidity, label + '.totalLiquidity') + ', '
    + 'pending_liabilities: ' + intField(s.pendingLiabilities, label + '.pendingLiabilities') + ', '
    + 'unresolved_reserve: ' + intField(s.unresolvedReserve, label + '.unresolvedReserve') + ', '
    + 'unresolved_ticket_count: ' + intField(s.unresolvedTicketCount, label + '.unresolvedTicketCount') + ', '
    + 'locked_jackpot: ' + intField(s.lockedJackpot, label + '.lockedJackpot') + ', '
    + 'jackpot_threshold: ' + intField(s.jackpotThreshold, label + '.jackpotThreshold') + ', '
    + 'suspended_classes: ' + intField(s.suspendedClasses, label + '.suspendedClasses') + ', '
    + 'prize_hash: #' + '"' + hexField(s.prizeHashHex, label + '.prizeHashHex') + '"'
    + ' }';
}
const transitionCases = [
  ['successful_reveal', transitionFixtures.successfulReveal, true],
  ['zero_payout_loss', transitionFixtures.zeroPayoutLoss, false],
];
const transitionTests = transitionCases.map(([name, item, shouldWin]) => {
  if (!item || item.name !== name) throw new Error('Malformed transition fixture: ' + name);
  const input = prizeDatumDataExpr(item.inputPrizeDatum, name + '.inputPrizeDatum');
  const output = prizeDatumDataExpr(item.outputPrizeDatum, name + '.outputPrizeDatum');
  const poolBefore = poolDatumDataExpr(item.poolBefore, name + '.poolBefore');
  const poolAfter = poolDatumDataExpr(item.poolAfter, name + '.poolAfter');
  const payout = intField(item.payout, name + '.payout');
  const row1Tier = intField(item.row1Tier, name + '.row1Tier');
  const row2Tier = intField(item.row2Tier, name + '.row2Tier');
  if (input.fields.status !== 'Pending' || output.fields.status !== 'Revealed') {
    throw new Error('Transition fixtures must encode Pending -> Revealed: ' + name);
  }
  if (intField(output.fields.prizeAmount, name + '.output prize amount') !== payout) {
    throw new Error('Transition payout does not equal output datum amount: ' + name);
  }
  if (intField(output.fields.row1Tier, name + '.output row1 tier') !== row1Tier
      || intField(output.fields.row2Tier, name + '.output row2 tier') !== row2Tier) {
    throw new Error('Transition row tiers do not match output datum: ' + name);
  }
  if (shouldWin ? payout <= 0 : payout !== 0) {
    throw new Error('Unexpected payout class for transition fixture: ' + name);
  }
  const expectedPoolScriptHash = hexField(item.expectedPoolScriptHashHex, name + '.expectedPoolScriptHashHex');
  const expectedOwnPrizeScriptHash = hexField(item.expectedOwnPrizeScriptHashHex, name + '.expectedOwnPrizeScriptHashHex');
  if (hexField(input.fields.prizePoolHashHex, name + '.input pool hash') !== expectedPoolScriptHash) {
    throw new Error('Prize datum does not point to the expected PrizePool script hash: ' + name);
  }
  if (hexField(poolBefore.fields.prizeHashHex, name + '.pool prize hash') !== expectedOwnPrizeScriptHash
      || hexField(poolAfter.fields.prizeHashHex, name + '.pool-after prize hash') !== expectedOwnPrizeScriptHash) {
    throw new Error('PrizePool datum does not preserve the expected Prize validator hash: ' + name);
  }
  const table = 'PrizeTable { tier_1: 2, tier_2: 5, tier_3: 10, tier_4: 200, tier_5: 1000 }';
  return [
    `test haskell_transition_${name}_input_datum_serialisation() { serialise_data(${input.expr}) == #"${input.expectedHex}" }`,
    `test haskell_transition_${name}_output_datum_serialisation() { serialise_data(${output.expr}) == #"${output.expectedHex}" }`,
    `test haskell_transition_${name}_pool_before_serialisation() { serialise_data(${poolBefore.expr}) == #"${poolBefore.expectedHex}" }`,
    `test haskell_transition_${name}_pool_after_serialisation() { serialise_data(${poolAfter.expr}) == #"${poolAfter.expectedHex}" }`,
    `test haskell_transition_${name}_payout_matches_canonical_rows() { row_payout_total(${table}, ${row1Tier}, ${row2Tier}, 100) == ${payout} }`,
    `test haskell_transition_${name}_pool_accounting_matches_canonical_snapshots() { reveal_pool_transition_is_valid(${payout}, #"${poolBefore.fields.prizeHashHex}", ${poolStateExpr(item.poolBefore, name + '.poolBefore')}, ${poolStateExpr(item.poolAfter, name + '.poolAfter')}) }`,
  ].join(String.fromCharCode(10));
}).join(String.fromCharCode(10));
const expiry = transitionFixtures.expiryBoundary;
const expiryValue = (key) => intField(expiry[key], 'expiryBoundary.' + key);
if (expiryValue('revealUpperEqual') !== expiryValue('expiresAt')
    || expiryValue('expireLowerEqual') !== expiryValue('expiresAt')) {
  throw new Error('Expiry boundary fixtures must share the exact expiry instant');
}
const expiryTests = `
test haskell_expiry_reveal_accepts_before_boundary() {
  reveal_window_open(${expiryValue('expiresAt')}, Some(${expiryValue('revealUpperBefore')}))
}
test haskell_expiry_reveal_accepts_exact_boundary() {
  reveal_window_open(${expiryValue('expiresAt')}, Some(${expiryValue('revealUpperEqual')}))
}
test haskell_expiry_reveal_rejects_after_boundary() {
  !reveal_window_open(${expiryValue('expiresAt')}, Some(${expiryValue('revealUpperAfter')}))
}
test haskell_expiry_expire_rejects_before_boundary() {
  !expire_window_open(${expiryValue('expiresAt')}, Some(${expiryValue('expireLowerBefore')}))
}
test haskell_expiry_expire_accepts_exact_boundary() {
  expire_window_open(${expiryValue('expiresAt')}, Some(${expiryValue('expireLowerEqual')}))
}
test haskell_expiry_expire_accepts_after_boundary() {
  expire_window_open(${expiryValue('expiresAt')}, Some(${expiryValue('expireLowerAfter')}))
}
`;

// All expected CBOR is generated from canonical Types.hs in this workflow run.
// These expressions mirror only the declared Plutus Data constructor/field
// layout; they do not implement or claim Reveal validator semantic parity.
const source = `// GENERATED IN CI from canonical Haskell Plutus Data and semantic fixtures.
// Do not hand-edit or commit this file; the workflow recreates it per run.
use aiken/builtin.{b_data, constr_data, i_data, serialise_data}
use aiken/crypto
use aiken/primitive/bytearray
use immortal/reveal_rules.{PrizeTable, classify_row_tier, prize_amount_for_tier, row_payout_total}
use immortal/reveal_types
use immortal/beacon.{BeaconTarget, derive_beacon, derive_symbols_seed, derive_ticket_seed, encode_beacon_target, field, player_commitment, ticket_commitment}
use immortal/game_rules.{generate_symbols, row_outcome_index}
use immortal/reveal_context_guards.{RevealPoolState, expire_window_open, reveal_pool_transition_is_valid, reveal_window_open}

test sync_beacon_serialisation_matches_haskell_fixture() {
  serialise_data(reveal_types.SyncBeacon) == #"${fixtures['PrizeAction.SyncBeacon']}"
}

test reveal_secret_serialisation_matches_haskell_fixture() {
  serialise_data(reveal_types.Reveal(#"736563726574")) == #"${fixtures['PrizeAction.Reveal']}"
}

test claim_serialisation_matches_haskell_fixture() {
  serialise_data(reveal_types.Claim) == #"${fixtures['PrizeAction.Claim']}"
}

test expire_serialisation_matches_haskell_fixture() {
  serialise_data(reveal_types.Expire) == #"${fixtures['PrizeAction.Expire']}"
}

test beacon_target_serialisation_matches_haskell_fixture() {
  serialise_data(reveal_types.BeaconTarget {
    network_id: 0,
    round: 42,
    mainchain_ref: #"303130323033",
    version: #"7631",
  }) == #"${fixtures['BeaconTarget']}"
}

test prize_status_pending_serialisation_matches_haskell_fixture() {
  serialise_data(reveal_types.Pending) == #"${fixtures['PrizeStatus.Pending']}"
}

test prize_status_revealed_serialisation_matches_haskell_fixture() {
  serialise_data(reveal_types.Revealed) == #"${fixtures['PrizeStatus.Revealed']}"
}

test prize_status_claimed_serialisation_matches_haskell_fixture() {
  serialise_data(reveal_types.Claimed) == #"${fixtures['PrizeStatus.Claimed']}"
}

test beacon_status_pending_serialisation_matches_haskell_fixture() {
  serialise_data(reveal_types.BeaconPending) == #"${fixtures['BeaconStatus.BeaconPending']}"
}

test beacon_status_ready_serialisation_matches_haskell_fixture() {
  serialise_data(reveal_types.BeaconReady) == #"${fixtures['BeaconStatus.BeaconReady']}"
}

test pending_prize_datum_serialisation_matches_haskell_fixture() {
  serialise_data(reveal_types.PrizeDatum {
    ticket_policy: #"6131",
    ticket_name: #"3031",
    player_commitment: #"3032",
    price_usdm: 100,
    commitment: #"3033",
    game_version: #"636c61737369632d362d7631",
    ticket_nonce: 7,
    prize_amount: 0,
    payment_policy: #"3034",
    payment_name: #"3035",
    status: reveal_types.Pending,
    result: #"",
    prize_tier: 0,
    beacon_target: reveal_types.BeaconTarget {
      network_id: 0,
      round: 42,
      mainchain_ref: #"303130323033",
      version: #"7631",
    },
    beacon_status: reveal_types.BeaconReady,
    beacon_value: #"3036",
    mc_hash: #"3037",
    materios_context: #"3038",
    prize_pool_hash: #"3039",
    issued_at: 1000,
    expires_at: 9000,
    row1_tier: 0,
    row2_tier: 0,
  }) == #"${fixtures['PrizeDatum.pending']}"
}

test b1_prize_pool_datum_serialisation_matches_haskell_fixture() {
  serialise_data(reveal_types.B1PrizePoolDatum {
    total_liquidity: 100000,
    pending_liabilities: 1000,
    unresolved_reserve: 500,
    unresolved_ticket_count: 8,
    locked_jackpot: 2000,
    jackpot_threshold: 5000,
    suspended_classes: 0,
    prize_hash: #"3036",
  }) == #"${fixtures['B1PrizePoolDatum']}"
}

${poolActionTests}

${rowTierTests}
${prizeAmountTests}
${semanticTests}
${symbolsVectorTests}

${transitionTests}

${expiryTests}

test haskell_crypto_player_commitment() {
  player_commitment(42, 7, #"${crypto.playerSecretHex}") == #"${crypto.playerCommitmentHex}"
}

test haskell_crypto_beacon_target_encoding() {
  encode_beacon_target(BeaconTarget {
    network_id: 0,
    round_id: 42,
    mainchain_ref: #"${crypto.mainchainRefHex}",
    version: "v1",
  }) == #"${crypto.targetEncodedHex}"
}

test haskell_crypto_ticket_commitment() {
  let player = player_commitment(42, 7, #"${crypto.playerSecretHex}")
  let target = encode_beacon_target(BeaconTarget {
    network_id: 0,
    round_id: 42,
    mainchain_ref: #"${crypto.mainchainRefHex}",
    version: "v1",
  })
  ticket_commitment(
    #"${crypto.ticketIdHex}",
    player,
    #"${crypto.gameVersionHex}",
    7,
    100,
    target,
  ) == #"${crypto.ticketCommitmentHex}"
}

test haskell_crypto_beacon_derivation() {
  derive_beacon(
    0, 42,
    #"${crypto.mainchainRefHex}",
    #"${crypto.mcHashHex}",
    #"${crypto.materiosContextHex}",
    "v1",
  ) == #"${crypto.beaconHex}"
}

test haskell_crypto_ticket_seed() {
  let beacon = derive_beacon(
    0, 42,
    #"${crypto.mainchainRefHex}",
    #"${crypto.mcHashHex}",
    #"${crypto.materiosContextHex}",
    "v1",
  )
  derive_ticket_seed(42, 7, #"${crypto.playerSecretHex}", beacon, #"${crypto.gameVersionHex}")
    == #"${crypto.ticketSeedHex}"
}

test haskell_crypto_symbols_seed() {
  let beacon = derive_beacon(
    0, 42,
    #"${crypto.mainchainRefHex}",
    #"${crypto.mcHashHex}",
    #"${crypto.materiosContextHex}",
    "v1",
  )
  let ticket_seed = derive_ticket_seed(42, 7, #"${crypto.playerSecretHex}", beacon, #"${crypto.gameVersionHex}")
  derive_symbols_seed(ticket_seed) == #"${crypto.symbolsSeedHex}"
}

test haskell_crypto_generated_symbols() {
  generate_symbols(#"${crypto.symbolsSeedHex}") == #"${crypto.symbolsHex}"
}

test haskell_crypto_row_one_outcome_index() {
  row_outcome_index(#"${crypto.symbolsSeedHex}", 1) == ${crypto.row1OutcomeIndex}
}

test haskell_crypto_row_two_outcome_index() {
  row_outcome_index(#"${crypto.symbolsSeedHex}", 2) == ${crypto.row2OutcomeIndex}
}

test haskell_crypto_result_binding_digest() {
  let symbols_seed = #"${crypto.symbolsSeedHex}"
  let symbols = #"${crypto.symbolsHex}"
  crypto.sha2_256(
    bytearray.concat(
      field(crypto.sha2_256(symbols_seed)),
      field(symbols),
    ),
  ) == #"${crypto.resultDigestHex}"
}
`;
await fs.mkdir(path.dirname(outputPath), { recursive: true });
await fs.writeFile(outputPath, source, 'utf8');
console.log('Generated schema serialization, Haskell-derived win/loss transition snapshots, expiry-boundary vectors, semantic vectors, and crypto differential tests from canonical Haskell fixtures.');
