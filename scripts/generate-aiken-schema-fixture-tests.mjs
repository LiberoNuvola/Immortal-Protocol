import fs from 'node:fs/promises';
import path from 'node:path';

const [fixturePath, outputPath] = process.argv.slice(2);
if (!fixturePath || !outputPath) {
  throw new Error('Usage: node generate-aiken-schema-fixture-tests.mjs <fixture.json> <output.ak>');
}
const document = JSON.parse(await fs.readFile(fixturePath, 'utf8'));
if (document.schema !== 'pre-rich-reveal-plutus-data-v1') {
  throw new Error(`Unsupported fixture schema: ${document.schema}`);
}
const fixtures = document.fixtures ?? {};
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

// All expected CBOR is generated from canonical Types.hs in this workflow run.
// These expressions mirror only the declared Plutus Data constructor/field
// layout; they do not implement or claim Reveal validator semantic parity.
const source = `// GENERATED IN CI from canonical Haskell Plutus Data and semantic fixtures.
// Do not hand-edit or commit this file; the workflow recreates it per run.
use aiken/builtin.{b_data, constr_data, i_data, serialise_data}
use aiken/crypto
use aiken/primitive/bytearray
use immortal/reveal_rules.{PrizeTable, classify_row_tier, prize_amount_for_tier, row_payout_total}
use immortal/beacon.{BeaconTarget, derive_beacon, derive_symbols_seed, derive_ticket_seed, encode_beacon_target, field, player_commitment, ticket_commitment}
use immortal/game_rules.{generate_symbols, row_outcome_index}

test sync_beacon_serialisation_matches_haskell_fixture() {
  serialise_data(constr_data(0, [])) == #"${fixtures['PrizeAction.SyncBeacon']}"
}

test reveal_secret_serialisation_matches_haskell_fixture() {
  serialise_data(constr_data(1, [b_data(#"736563726574")])) == #"${fixtures['PrizeAction.Reveal']}"
}

test claim_serialisation_matches_haskell_fixture() {
  serialise_data(constr_data(2, [])) == #"${fixtures['PrizeAction.Claim']}"
}

test expire_serialisation_matches_haskell_fixture() {
  serialise_data(constr_data(3, [])) == #"${fixtures['PrizeAction.Expire']}"
}

test beacon_target_serialisation_matches_haskell_fixture() {
  serialise_data(constr_data(0, [
    i_data(0),
    i_data(42),
    b_data(#"303130323033"),
    b_data(#[0x76, 0x31]),
  ])) == #"${fixtures['BeaconTarget']}"
}

test pending_prize_datum_serialisation_matches_haskell_fixture() {
  serialise_data(constr_data(0, [
    b_data(#"6131"),
    b_data(#"3031"),
    b_data(#"3032"),
    i_data(100),
    b_data(#"3033"),
    b_data(#"636c61737369632d362d7631"),
    i_data(7),
    i_data(0),
    b_data(#"3034"),
    b_data(#"3035"),
    constr_data(0, []),
    b_data(#""),
    i_data(0),
    constr_data(0, [
      i_data(0),
      i_data(42),
      b_data(#"303130323033"),
      b_data(#[0x76, 0x31]),
    ]),
    constr_data(1, []),
    b_data(#"3036"),
    b_data(#"3037"),
    b_data(#"3038"),
    b_data(#"3039"),
    i_data(1000),
    i_data(9000),
    i_data(0),
    i_data(0),
  ])) == #"${fixtures['PrizeDatum.pending']}"
}

test b1_prize_pool_datum_serialisation_matches_haskell_fixture() {
  serialise_data(constr_data(0, [
    i_data(100000),
    i_data(1000),
    i_data(500),
    i_data(8),
    i_data(2000),
    i_data(5000),
    i_data(0),
    b_data(#"3036"),
  ])) == #"${fixtures['B1PrizePoolDatum']}"
}

${rowTierTests}
${prizeAmountTests}
${semanticTests}
${symbolsVectorTests}

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
console.log('Generated seven serialization, five row-tier, five prize amount, four payout, four symbol-vector sets with outcome-index checks, and ten crypto differential tests from canonical Haskell fixtures.');
