import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

import { openPreSnapshotJournal } from './preSnapshotJournal.mjs'
import { comparePreSnapshotKupoEndpoint } from './preSnapshotKupoHttp.mjs'

function fail(code) {
  throw Object.assign(new Error(code), { code })
}

export async function runPreSnapshotKupoAudit(config) {
  if (!config || typeof config !== 'object' || Array.isArray(config)) {
    fail('KUPO_AUDIT_CONFIG_REQUIRED')
  }
  if (typeof config.journalDirectory !== 'string' || config.journalDirectory.length === 0) {
    fail('KUPO_AUDIT_JOURNAL_DIRECTORY_REQUIRED')
  }
  if (typeof config.kupoBaseUrl !== 'string' || config.kupoBaseUrl.length === 0) {
    fail('KUPO_AUDIT_ENDPOINT_REQUIRED')
  }

  const journal = await openPreSnapshotJournal({
    directory: resolve(config.journalDirectory)
  })
  try {
    const state = await journal.getState()
    return await comparePreSnapshotKupoEndpoint({
      state,
      baseUrl: config.kupoBaseUrl,
      expectedNetworkId: config.networkId,
      expectedAsset: config.asset,
      expectedPoint: config.expectedPoint
    })
  } finally {
    await journal.close()
  }
}

async function main() {
  const configPath = process.argv[2]
  if (!configPath) {
    fail('USAGE: node preSnapshotKupoAudit.mjs <kupo-audit-config.json>')
  }
  const config = JSON.parse(await readFile(resolve(configPath), 'utf8'))
  const report = await runPreSnapshotKupoAudit(config)
  process.stdout.write(JSON.stringify(report, null, 2) + '\n')
  if (report.status !== 'PASS') process.exitCode = 1
}

if (process.argv[1] &&
    pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  main().catch(error => {
    process.stderr.write((error.code || 'KUPO_AUDIT_ERROR') + ': ' + error.message + '\n')
    process.exitCode = 1
  })
}
