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
use aiken/builtin.{b_data, constr_data, int_data, serialise_data}

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
    int_data(0),
    int_data(42),
    b_data(#"010203"),
    b_data(#"7631"),
  ])) == #"${fixtures['BeaconTarget']}"
}

test pending_prize_datum_serialisation_matches_haskell_fixture() {
  serialise_data(constr_data(0, [
    b_data(#"a1"),
    b_data(#"01"),
    b_data(#"02"),
    int_data(100),
    b_data(#"03"),
    b_data(#"636c61737369632d362d7631"),
    int_data(7),
    int_data(0),
    b_data(#"04"),
    b_data(#"05"),
    constr_data(0, []),
    b_data(#""),
    int_data(0),
    constr_data(0, [
      int_data(0),
      int_data(42),
      b_data(#"010203"),
      b_data(#"7631"),
    ]),
    constr_data(1, []),
    b_data(#"06"),
    b_data(#"07"),
    b_data(#"08"),
    b_data(#"09"),
    int_data(1000),
    int_data(9000),
    int_data(0),
    int_data(0),
  ])) == #"${fixtures['PrizeDatum.pending']}"
}

test b1_prize_pool_datum_serialisation_matches_haskell_fixture() {
  serialise_data(constr_data(0, [
    int_data(100000),
    int_data(1000),
    int_data(500),
    int_data(8),
    int_data(2000),
    int_data(5000),
    int_data(0),
    b_data(#"06"),
  ])) == #"${fixtures['B1PrizePoolDatum']}"
}
`;
await fs.mkdir(path.dirname(outputPath), { recursive: true });
await fs.writeFile(outputPath, source, 'utf8');
console.log('Generated seven Aiken serialization parity tests from canonical Haskell fixtures (four actions and three datum shapes).');
