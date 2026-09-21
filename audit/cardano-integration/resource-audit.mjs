import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

const artifactPaths = [
  'src/plutusScripts/prizeValidatorFactory.plutus.json',
  'src/plutusScripts/b1PrizePoolFactory.plutus.json',
]

const rows = artifactPaths.map((path) => {
  const json = JSON.parse(readFileSync(path, 'utf8'))
  const cborHex = json.cborHex ?? ''
  if (!/^[0-9a-f]*$/i.test(cborHex) || cborHex.length % 2 !== 0) {
    throw new Error(`Invalid cborHex in ${path}`)
  }
  return {
    type: 'plutus-script',
    path,
    jsonBytes: Buffer.byteLength(JSON.stringify(json)),
    scriptBytes: cborHex.length / 2,
  }
})

const evidenceDir = 'audit/yaci-evidence'
if (existsSync(evidenceDir)) {
  for (const name of readdirSync(evidenceDir)) {
    const path = join(evidenceDir, name)
    if (!name.endsWith('.json')) continue
    try {
      const json = JSON.parse(readFileSync(path, 'utf8'))
      if (json.txCbor) {
        const cbor = Buffer.from(json.txCbor, 'hex')
        rows.push({
          type: 'transaction-cbor',
          path,
          txBytes: cbor.length,
          txHexChars: json.txCbor.length,
          txHash: json.txHash ?? null,
        })
      }
    } catch {
      // Evidence files unrelated to transaction CBOR are ignored.
    }
  }
}

const maxTxSize = 16 * 1024
const report = {
  purpose: 'IMMORTAL Cardano resource audit',
  maxTxSizeAssumptionBytes: maxTxSize,
  measured: rows,
  note: 'Transaction size is measured from serialized CBOR when real transaction evidence is present; script size is measured from compiled Plutus cborHex. ExUnits and final fee require evaluated script transactions and protocol parameters.',
}

console.log(JSON.stringify(report, null, 2))
