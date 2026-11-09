#!/usr/bin/env node

import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { reconcileTreasuryJournalSnapshots } from './treasury-receipt-journal.mjs'

async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, 'utf8'))
}

async function writeJson(filePath, value) {
  await mkdir(path.dirname(filePath), { recursive: true })
  await writeFile(filePath, JSON.stringify(value, null, 2) + '\n', 'utf8')
}

const args = process.argv.slice(2)
if (args[0] === '--baseline') {
  if (args.length !== 3) throw new Error('USAGE: reconcile-treasury-journal-snapshots.mjs --baseline CURRENT OUTPUT')
  const current = await readJson(args[1])
  if (current?.schema !== 'PRE-RICH-TREASURY-TICKET-SALE-RECEIPT-JOURNAL-v1' ||
      !current?.observation?.snapshotTip ||
      !Array.isArray(current.receiptEvents) ||
      !current.treasuryCustody) {
    throw new Error('TREASURY_RECONCILE_BASELINE_SNAPSHOT_INVALID')
  }
  const result = {
    schema: 'PRE-RICH-TREASURY-CROSS-SNAPSHOT-RECONCILIATION-v1',
    disposition: 'BASELINE_ONLY_NO_PRIOR_RETAINED_OBSERVATION',
    previousSnapshot: null,
    currentSnapshot: {
      blockHeight: Number(current.observation.snapshotTip.blockHeight),
      blockHash: String(current.observation.snapshotTip.hash),
    },
    currentReceiptCount: current.receiptEvents.length,
    currentCustody: current.treasuryCustody,
    evidenceQuality: {
      continuityFromPriorObservationEstablished: false,
      ledgerFinalityEstablished: false,
      categoryPostingPerformed: false,
      spendAuthorizationGranted: false,
    },
    limitations: [
      'No prior successful Treasury observation artifact was available to compare. This run establishes a baseline only.',
      'The snapshot is indexed observation evidence, not a ledger-finality certificate.',
      'No category posting, valuation, EEV claim or spend authority is inferred.',
    ],
  }
  await writeJson(args[2], result)
  console.log(JSON.stringify(result, null, 2))
} else {
  if (args.length !== 3) throw new Error('USAGE: reconcile-treasury-journal-snapshots.mjs PREVIOUS CURRENT OUTPUT')
  const previous = await readJson(args[0])
  const current = await readJson(args[1])
  const result = reconcileTreasuryJournalSnapshots({ previous, current })
  result.inputProvenance = {
    previousObservationRunId: process.env.PREVIOUS_OBSERVATION_RUN_ID ?? null,
    previousObservationHeadSha: process.env.PREVIOUS_OBSERVATION_HEAD_SHA ?? null,
    previousObservationArtifactName: process.env.PREVIOUS_OBSERVATION_ARTIFACT_NAME ?? null,
    previousObservationArtifactDigest: process.env.PREVIOUS_OBSERVATION_ARTIFACT_DIGEST ?? null,
  }
  await writeJson(args[2], result)
  console.log(JSON.stringify(result, null, 2))
}
