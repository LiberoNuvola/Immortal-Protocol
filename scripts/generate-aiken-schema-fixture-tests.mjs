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
use immortal/reveal_rules.{PrizeTable, classify_row_tier, row_payout_total}

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
`;
await fs.mkdir(path.dirname(outputPath), { recursive: true });
await fs.writeFile(outputPath, source, 'utf8');
console.log('Generated seven Aiken serialization parity tests, five row-tier differential tests, five prize amount differential tests, and four payout differential tests from canonical Haskell fixtures.');
