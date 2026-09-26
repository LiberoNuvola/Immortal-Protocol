import { readFileSync } from 'node:fs'
import { Blockfrost, Lucid } from 'lucid-cardano'

const artifactPath = 'plutus/out/treasury.plutus.json'
const artifact = JSON.parse(readFileSync(artifactPath, 'utf8'))
if (artifact.type !== 'PlutusScriptV2' || typeof artifact.cborHex !== 'string') {
  throw new Error('Treasury artifact must be a Plutus V2 script with cborHex')
}

const lucid = await Lucid.new(
  new Blockfrost('http://127.0.0.1:8080/api/v1', ''),
  'Preprod',
)
const validator = { type: 'PlutusV2', script: artifact.cborHex }
const scriptHash = lucid.utils.validatorToScriptHash(validator)
const address = lucid.utils.validatorToAddress(validator)

const result = {
  network: 'Preprod',
  artifact: artifactPath,
  artifactSha256: null,
  scriptHash,
  address,
  verifiedOnLedger: false,
  ledgerReference: null,
  note: 'Address is deterministically derived from the exact Treasury validator artifact; ledger verification requires an observed Preprod Treasury UTxO.',
}

console.log(JSON.stringify(result, null, 2))
