import assert from 'node:assert/strict'
import { sanitizeEvaluationDiagnosticText } from './sanitize-yaci-evaluation-error.mjs'

const longHex = 'ab'.repeat(80)
const address = 'addr1' + 'q'.repeat(45)
const privateKey = 'ed25519e_sk' + 'A'.repeat(110)

assert.equal(
  sanitizeEvaluationDiagnosticText('EvaluateTransaction fails: ' + longHex),
  'EvaluateTransaction fails: [HEX_REDACTED]',
  'long hex/CBOR-like material must be redacted',
)
assert.equal(
  sanitizeEvaluationDiagnosticText('invalid context for ' + address),
  'invalid context for [ADDRESS_REDACTED]',
  'Cardano addresses must be redacted',
)
assert.equal(
  sanitizeEvaluationDiagnosticText('bad key ' + privateKey),
  'bad key [REDACTED_PRIVATE_KEY]',
  'private key tokens must be redacted',
)
assert.equal(
  sanitizeEvaluationDiagnosticText('Yaci evaluator rejected transaction'),
  'Yaci evaluator rejected transaction',
  'useful bounded diagnostic text should remain',
)
assert.equal(
  sanitizeEvaluationDiagnosticText('x'.repeat(500), 80)?.length,
  80,
  'diagnostic text must be bounded',
)
assert.equal(sanitizeEvaluationDiagnosticText(undefined), null)
process.stdout.write('YACI_EVALUATION_ERROR_SANITIZER_TESTS=PASS\n')
