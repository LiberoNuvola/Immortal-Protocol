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
const source = `// GENERATED IN CI from canonical Haskell Plutus Data fixtures.
// Do not hand-edit or commit this file; the workflow recreates it per run.
use aiken/builtin.{b_data, constr_data, i_data, serialise_data}

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
    b_data(#[1, 2, 3]),
    b_data(#[118, 49]),
  ])) == #"${fixtures['BeaconTarget']}"
}

test pending_prize_datum_serialisation_matches_haskell_fixture() {
  serialise_data(constr_data(0, [
    b_data(#[161]),
    b_data(#[1]),
    b_data(#[2]),
    i_data(100),
    b_data(#[3]),
    b_data(#"636c61737369632d362d7631"),
    i_data(7),
    i_data(0),
    b_data(#[4]),
    b_data(#[5]),
    constr_data(0, []),
    b_data(#""),
    i_data(0),
    constr_data(0, [
      i_data(0),
      i_data(42),
      b_data(#[1, 2, 3]),
      b_data(#[118, 49]),
    ]),
    constr_data(1, []),
    b_data(#[6]),
    b_data(#[7]),
    b_data(#[8]),
    b_data(#[9]),
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
    b_data(#[6]),
  ])) == #"${fixtures['B1PrizePoolDatum']}"
}
`;
await fs.mkdir(path.dirname(outputPath), { recursive: true });
await fs.writeFile(outputPath, source, 'utf8');
console.log('Generated seven Aiken serialization parity tests from canonical Haskell fixtures (four actions and three datum shapes).');
