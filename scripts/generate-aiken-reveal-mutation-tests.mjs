import fs from 'node:fs/promises';
import { hex, integer, prizeDatum, poolDatum, poolState } from './lib/aiken-datum-exprs.mjs';

// Generates a standalone Aiken test module from the `mutationEvaluations`
// section of the Haskell fixture. Expected decisions come from the compiled
// Plutus V2 validator run (actualAccepted); this script never decides them.
//
// Each case yields two tests:
//   * <name>_transition  : reveal_state_transition_is_valid (pure predicate)
//   * <name>_transaction : reveal_transaction_is_valid on a typed transaction
// Reject cases use `fail`, which passes on either a False result or a script
// abort (an `expect` failure), since both reject the transaction on-chain.

const [fixturePath, outputPath] = process.argv.slice(2);
if (!fixturePath || !outputPath) {
  throw new Error('Usage: node generate-aiken-reveal-mutation-tests.mjs <fixture.json> <generated-mutation-tests.ak>');
}

const document = JSON.parse(await fs.readFile(fixturePath, 'utf8'));
const section = document.mutationEvaluations;
if (!section || section.schema !== 'pre-rich-reveal-mutation-cases-v1') {
  throw new Error('Missing or unsupported mutationEvaluations schema');
}
if (!Array.isArray(section.cases) || section.cases.length === 0) {
  throw new Error('mutationEvaluations.cases must be a non-empty array');
}
const ownHash = hex(section.baseOwnPrizeScriptHashHex, 'baseOwnPrizeScriptHashHex');
const poolHash = hex(section.basePoolScriptHashHex, 'basePoolScriptHashHex');

const identifier = (name) => {
  if (typeof name !== 'string' || !/^[a-z0-9_]+$/.test(name)) throw new Error('Unsafe case name: ' + name);
  return name;
};
const table = 'PrizeTable { tier_1: 2, tier_2: 5, tier_3: 10, tier_4: 200, tier_5: 1000 }';

const seen = new Set();
const tests = [];
const summary = { accept: 0, reject: 0, characterization: 0 };

for (const item of section.cases) {
  const name = identifier(item.name);
  if (seen.has(name)) throw new Error('Duplicate case name: ' + name);
  seen.add(name);
  if (typeof item.actualAccepted !== 'boolean' || typeof item.expectedAccepted !== 'boolean') {
    throw new Error('Missing decision booleans: ' + name);
  }
  if (item.actualAccepted !== item.expectedAccepted) {
    throw new Error('Haskell expected/actual disagree for ' + name + '; refusing to generate from a failing producer run');
  }
  const accepted = item.actualAccepted;
  summary[accepted ? 'accept' : 'reject'] += 1;
  if (item.characterization === true) summary.characterization += 1;

  const secret = hex(item.playerSecretHex, name + '.playerSecretHex');
  const upper = integer(item.upperBound, name + '.upperBound');
  const input = prizeDatum(item.inputPrizeDatum, name + '.input');
  const output = prizeDatum(item.outputPrizeDatum, name + '.output');
  const poolBeforeDatum = poolDatum(item.poolBefore, name + '.poolBefore');
  const poolAfterDatum = poolDatum(item.poolAfter, name + '.poolAfter');
  const poolBeforeState = poolState(item.poolBefore, name + '.poolBefore');
  const poolAfterState = poolState(item.poolAfter, name + '.poolAfter');
  const expiry = integer(item.inputPrizeDatum.fields.expiresAt, name + '.expiresAt');
  const header = (suffix) => 'test mut_' + name + '_' + suffix + '()' + (accepted ? '' : ' fail') + ' {';
  const label = '// ' + (item.group ?? 'case') + (item.characterization === true ? ' [characterization]' : '')
    + ' -> ' + (accepted ? 'accept' : 'reject');

  tests.push([
    label,
    header('transition'),
    '  reveal_transition.reveal_state_transition_is_valid(',
    '    ' + table + ',',
    '    ' + input + ',',
    '    ' + output + ',',
    '    #"' + secret + '",',
    '    Some(' + upper + '),',
    '    ' + poolBeforeState + ',',
    '    ' + poolAfterState + ',',
    '    #"' + ownHash + '",',
    '  )',
    '}',
    '',
    header('transaction'),
    '  let own_ref = transaction.OutputReference { transaction_id: transaction.placeholder.id, output_index: 0 }',
    '  let own_value = assets.from_lovelace(5_000_000)',
    '  let pool_value = assets.from_lovelace(10_000_000)',
    '  let tx =',
    '    transaction.Transaction {',
    '      ..transaction.placeholder,',
    '      inputs: [',
    '        transaction.Input {',
    '          output_reference: own_ref,',
    '          output: transaction.Output {',
    '            address: address.from_script(#"' + ownHash + '"),',
    '            value: own_value,',
    '            datum: transaction.InlineDatum(' + input + '),',
    '            reference_script: None,',
    '          },',
    '        },',
    '        transaction.Input {',
    '          output_reference: transaction.OutputReference { transaction_id: transaction.placeholder.id, output_index: 1 },',
    '          output: transaction.Output {',
    '            address: address.from_script(#"' + poolHash + '"),',
    '            value: pool_value,',
    '            datum: transaction.InlineDatum(' + poolBeforeDatum + '),',
    '            reference_script: None,',
    '          },',
    '        },',
    '      ],',
    '      outputs: [',
    '        transaction.Output {',
    '          address: address.from_script(#"' + ownHash + '"),',
    '          value: own_value,',
    '          datum: transaction.InlineDatum(' + output + '),',
    '          reference_script: None,',
    '        },',
    '        transaction.Output {',
    '          address: address.from_script(#"' + poolHash + '"),',
    '          value: pool_value,',
    '          datum: transaction.InlineDatum(' + poolAfterDatum + '),',
    '          reference_script: None,',
    '        },',
    '      ],',
    '      validity_range: interval.between(' + (expiry - 8000) + ', ' + upper + '),',
    '    }',
    '  reveal_transaction.reveal_transaction_is_valid(tx, own_ref, ' + input + ', #"' + secret + '")',
    '}',
    '',
  ].join('\n'));
}

const source = [
  '// GENERATED by scripts/generate-aiken-reveal-mutation-tests.mjs. Do not edit.',
  '// Expected decisions are the compiled Plutus V2 validator results recorded in',
  '// the Haskell fixture (mutationEvaluations). Cases: ' + section.cases.length
    + ' (accept ' + summary.accept + ', reject ' + summary.reject
    + ', characterization ' + summary.characterization + ').',
  '',
  'use aiken/interval',
  'use cardano/address',
  'use cardano/assets',
  'use cardano/transaction',
  'use immortal/reveal_context_guards.{RevealPoolState}',
  'use immortal/reveal_rules.{PrizeTable}',
  'use immortal/reveal_transaction',
  'use immortal/reveal_transition',
  'use immortal/reveal_types',
  '',
  tests.join('\n'),
].join('\n');

await fs.writeFile(outputPath, source, 'utf8');
console.log('Generated ' + tests.length * 2 + ' mutation tests from ' + section.cases.length
  + ' Haskell CEK cases (accept ' + summary.accept + ', reject ' + summary.reject
  + ', characterization ' + summary.characterization + ').');
