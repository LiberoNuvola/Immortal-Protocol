import assert from 'node:assert/strict'
import { extractYaciEvaluatorMode } from './extract-yaci-evaluator-mode.mjs'

assert.equal(
  extractYaciEvaluatorMode('💡 Yaci Store tx evaluator mode: ogmios'),
  'ogmios',
  'the actual Yaci evaluator mode must be extracted from the startup log',
)
assert.equal(
  extractYaciEvaluatorMode('Yaci Store tx evaluator mode: Scalus'),
  'scalus',
  'evaluator mode extraction should normalize case',
)
assert.equal(
  extractYaciEvaluatorMode('Yaci Store startup complete'),
  'NOT_RECORDED',
  'missing evaluator mode must remain explicitly unrecorded',
)
assert.equal(
  extractYaciEvaluatorMode(undefined),
  'NOT_RECORDED',
  'invalid log input must fail closed',
)
process.stdout.write('YACI_EVALUATOR_MODE_EXTRACTION_TESTS=PASS\n')
