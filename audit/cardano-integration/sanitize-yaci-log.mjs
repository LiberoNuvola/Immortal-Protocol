import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

const ANSI_CSI = /\u001B\[[0-?]*[ -/]*[@-~]/g

export function sanitizeYaciLog(input) {
  return String(input)
    .replace(ANSI_CSI, '')
    .replace(/(\bMnemonic:[ \t]*)[a-z]+(?:[ \t]+[a-z]+){11,23}/g, '$1[REDACTED_MNEMONIC]')
    .replace(/(\b(?:Payment|Staking) Key[ \t]*:[ \t]*)\S+/gi, '$1[REDACTED_SIGNING_KEY]')
    .replace(/ed25519e_sk[0-9A-Za-z]+/g, '[REDACTED_PRIVATE_KEY]')
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  process.stdout.write(sanitizeYaciLog(readFileSync(0, 'utf8')))
}
