#!/usr/bin/env node

import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { reconcileTicketSalesToProtectedCapital } from './treasury-protected-capital-reconciliation.mjs'

async function readEvidence(filePath, label) {
  const bytes = await readFile(filePath)
  let value
  try {
    value = JSON.parse(bytes.toString('utf8'))
  } catch {
    throw new Error(label + '_JSON_INVALID')
  }
  return {
    value,
    sha256: createHash('sha256').update(bytes).digest('hex'),
  }
}

const args = process.argv.slice(2)
if (args.length !== 3) {
  throw new Error('USAGE: reconcile-treasury-protected-capital.mjs TREASURY_JOURNAL CENSUS_ARTIFACT OUTPUT')
}

const [journalPath, censusPath, outputPath] = args
const [journalEvidence, censusEvidence] = await Promise.all([
  readEvidence(journalPath, 'TREASURY_JOURNAL'),
  readEvidence(censusPath, 'PROTECTED_CAPITAL_CENSUS'),
])
const journal = journalEvidence.value
const census = censusEvidence.value

if (census?.schema !== 'IMMORTAL-PREPROD-PROTECTED-CAPITAL-CENSUS-V1') {
  throw new Error('PROTECTED_CAPITAL_CENSUS_SCHEMA_INVALID')
}
if (census.providerReadOnly !== true || census.transactionSubmissionAttempted !== false) {
  throw new Error('PROTECTED_CAPITAL_CENSUS_READ_ONLY_PROVENANCE_INVALID')
}
if (!census.ledger || !census.sourceManifest) {
  throw new Error('PROTECTED_CAPITAL_CENSUS_EVIDENCE_INCOMPLETE')
}

const crosswalk = reconcileTicketSalesToProtectedCapital({ journal, ledger: census.ledger })
const output = {
  ...crosswalk,
  inputEvidence: {
    treasuryJournal: {
      sha256: journalEvidence.sha256,
      network: journal.network,
      snapshotTip: journal.observation?.snapshotTip ?? null,
      ticketPolicyId: journal.ticketPolicyId,
    },
    protectedCapitalCensus: {
      sha256: censusEvidence.sha256,
      snapshotReference: census.ledger.source.snapshotReference,
      sourceManifestDigest: census.ledger.source.sourceManifestDigest,
      observedSlot: String(census.ledger.source.observedSlot),
      ticketPolicyId: census.ledger.source.ticketPolicyId,
      providerId: census.ledger.source.providerId,
    },
  },
  createdAt: new Date().toISOString(),
}

await mkdir(path.dirname(outputPath), { recursive: true })
await writeFile(outputPath, JSON.stringify(output, (_, value) =>
  typeof value === 'bigint' ? value.toString() : value, 2) + '\n', 'utf8')
const crosswalkRunStatus =
  output.qualification.populationDisposition === 'EMPTY_INPUT_POPULATIONS' &&
  Array.isArray(output.qualification.blockers) &&
  output.qualification.blockers.length === 0
    ? 'EMPTY_INPUT_POPULATIONS'
    : output.qualification.populationDisposition === 'NONEMPTY_ONE_TO_ONE_MATCH' &&
      output.qualification.identityCrosswalkComplete === true
      ? 'NONEMPTY_ONE_TO_ONE_MATCH'
      : 'IDENTITY_CROSSWALK_BLOCKED'

console.log(JSON.stringify({
  output: outputPath,
  schema: output.schema,
  status: crosswalkRunStatus,
  qualification: output.qualification,
  counts: output.counts,
  inputEvidence: output.inputEvidence,
}, null, 2))

if (crosswalkRunStatus === 'IDENTITY_CROSSWALK_BLOCKED') process.exitCode = 2
