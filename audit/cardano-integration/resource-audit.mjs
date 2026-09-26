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

function readObservedMaxTxSize() {
  if (!existsSync(evidenceDir)) return null
  for (const name of readdirSync(evidenceDir)) {
    if (!name.endsWith('.json')) continue
    try {
      const json = JSON.parse(readFileSync(join(evidenceDir, name), 'utf8'))
      const candidate =
        json.maxTxSize ??
        json.maxTxSizeBytes ??
        json.protocolParameters?.maxTxSize ??
        json.protocolParameters?.maxTxSizeBytes
      if (Number.isInteger(candidate) && candidate > 0) return candidate
    } catch {
      // Ignore non-protocol evidence JSON.
    }
  }
  return null
}

const observedMaxTxSize = readObservedMaxTxSize()
const report = {
  purpose: 'IMMORTAL Cardano resource audit',
  maxTxSizeBytes: observedMaxTxSize,
  maxTxSizeSource: observedMaxTxSize === null ? 'not-present-in-evidence' : 'observed-protocol-parameters',
  measured: rows,
  note: 'Transaction size is measured from serialized CBOR when real transaction evidence is present; the report never substitutes a hardcoded protocol limit when observed protocol parameters are available. Script size is measured from compiled Plutus cborHex. ExUnits and final fee require evaluated script transactions and protocol parameters.',
}

console.log(JSON.stringify(report, null, 2))
