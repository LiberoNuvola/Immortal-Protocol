import assert from 'node:assert/strict'
import { sanitizeYaciLog } from './sanitize-yaci-log.mjs'

const syntheticPrivateKey = 'ed25519e_sk' + 'A'.repeat(110)
const syntheticMnemonic = 'alpha beta gamma delta epsilon zeta eta theta iota kappa lambda mu nu xi omicron pi rho sigma tau upsilon phi chi psi omega'
const fixture = [
  '\u001b[1;36mPayment Key\u001b[0m : ' + syntheticPrivateKey,
  '\u001b[1;36mMnemonic:\u001b[0m ' + syntheticMnemonic,
  '\u001b[1;36mStaking Key\u001b[0m : ' + syntheticPrivateKey,
  'unlabelled=' + syntheticPrivateKey,
  'YACI_STORE_READY=1',
].join('\n')

const sanitized = sanitizeYaciLog(fixture)
assert.equal(sanitized.includes(syntheticPrivateKey), false, 'private-key token must not survive sanitization')
assert.equal(sanitized.includes(syntheticMnemonic), false, 'mnemonic phrase must not survive sanitization')
assert.equal((sanitized.match(/\[REDACTED_SIGNING_KEY\]/g) ?? []).length, 2, 'labelled payment/staking keys must be redacted')
assert.equal((sanitized.match(/\[REDACTED_PRIVATE_KEY\]/g) ?? []).length, 1, 'unlabelled private-key token must be redacted')
assert.equal((sanitized.match(/\[REDACTED_MNEMONIC\]/g) ?? []).length, 1, 'mnemonic must be redacted')
assert.equal(sanitized.includes('YACI_STORE_READY=1'), true, 'non-sensitive diagnostic text should remain')
assert.equal(/\u001B\[/.test(sanitized), false, 'ANSI control sequences should be removed before sanitization')
process.stdout.write('YACI_LOG_SANITIZER_SYNTHETIC_TESTS=PASS\n')
