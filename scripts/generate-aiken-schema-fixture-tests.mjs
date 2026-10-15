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
  'PrizeAction.SyncBeacon',
  'PrizeAction.Reveal',
  'PrizeAction.Claim',
  'PrizeAction.Expire',
];
for (const key of required) {
  if (typeof fixtures[key] !== 'string' || !/^(?:[0-9a-f]{2})+$/.test(fixtures[key])) {
    throw new Error(`Missing or malformed canonical fixture: ${key}`);
  }
}

// These Aiken Data values mirror only the constructor-level representation of
// PrizeAction. Expected CBOR is always sourced from the canonical Haskell run.
const source = `// GENERATED IN CI from canonical Haskell Plutus Data fixtures.
// Do not hand-edit or commit this file; the workflow recreates it per run.
use aiken/builtin.{b_data, constr_data, serialise_data}

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
`;
await fs.mkdir(path.dirname(outputPath), { recursive: true });
await fs.writeFile(outputPath, source, 'utf8');
console.log('Generated four Aiken serialization parity tests from canonical Haskell action fixtures.');
