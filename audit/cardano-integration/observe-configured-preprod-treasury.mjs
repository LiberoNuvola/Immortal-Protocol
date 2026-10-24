import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { dirname } from 'node:path'
import { Emulator, Lucid } from 'lucid-cardano'
import { fetchAllAddressUtxos } from './koios-address-utxos.mjs'

const KOIOS = process.env.KOIOS_PREPROD_URL ?? 'https://preprod.koios.rest/api/v1'
const CONFIGURED_ADDRESS = process.env.PREPROD_TREASURY_ADDRESS?.trim()
const EXPECTED_SCRIPT_HASH = process.env.PREPROD_TREASURY_SCRIPT_HASH?.trim().toLowerCase()
const OUTPUT_PATH = process.env.TREASURY_OBSERVATION_OUTPUT ?? 'audit/preprod-evidence/configured-treasury-observation.json'
const ARTIFACT_PATH = 'src/plutusScripts/treasury.plutus.json'
const TUSDM_POLICY_ID = 'e675b46e4d2242c991a8932a99db3044e80515ae14b4c4ccf6b3f4c9'
const TUSDM_ASSET_NAME_HEX = '0014df10745553444d'
const TUSDM_UNIT = TUSDM_POLICY_ID + TUSDM_ASSET_NAME_HEX

function required(value, name) {
  if (!value) throw new Error('CONFIGURATION_MISSING: ' + name)
  return value
}

required(CONFIGURED_ADDRESS, 'PREPROD_TREASURY_ADDRESS')
if (!/^addr_test1[0-9a-z]+$/.test(CONFIGURED_ADDRESS)) {
  throw new Error('CONFIGURATION_INVALID: Treasury address is not a Cardano Preprod address')
}

const artifactText = await readFile(ARTIFACT_PATH, 'utf8')
const artifact = JSON.parse(artifactText)
if (artifact?.type !== 'PlutusScriptV2' || typeof artifact.cborHex !== 'string' || artifact.cborHex.length === 0) {
  throw new Error('CANONICAL_ARTIFACT_INVALID: Treasury artifact must be a non-empty PlutusScriptV2 envelope')
}
const artifactSha256 = createHash('sha256').update(artifactText).digest('hex')
const treasuryScript = { type: 'PlutusV2', script: artifact.cborHex }
const lucid = await Lucid.new(new Emulator([]), 'Preprod')
const derivedScriptHash = lucid.utils.validatorToScriptHash(treasuryScript).toLowerCase()
const derivedAddress = lucid.utils.validatorToAddress(treasuryScript)

if (CONFIGURED_ADDRESS !== derivedAddress) {
  throw new Error('IDENTITY_MISMATCH: PREPROD_TREASURY_ADDRESS differs from the address derived from ' + ARTIFACT_PATH)
}
if (EXPECTED_SCRIPT_HASH && EXPECTED_SCRIPT_HASH !== derivedScriptHash) {
  throw new Error('IDENTITY_MISMATCH: PREPROD_TREASURY_SCRIPT_HASH differs from the script hash derived from ' + ARTIFACT_PATH)
}

const observation = await fetchAllAddressUtxos({
  baseUrl: KOIOS,
  address: derivedAddress,
})
const { rows, pagesFetched, pageSize, complete } = observation
if (!complete) throw new Error('KOIOS_ADDRESS_UTXOS_INCOMPLETE_OBSERVATION')

const utxos = rows.map(row => {
  const assets = Object.fromEntries((row.asset_list ?? []).map(asset => [
    String(asset.policy_id).toLowerCase() + String(asset.asset_name ?? '').toLowerCase(),
    String(asset.quantity),
  ]))
  return {
    outRef: String(row.tx_hash) + '#' + String(row.tx_index),
    lovelace: String(row.value),
    canonicalTusdmAtomic: assets[TUSDM_UNIT] ?? '0',
    assets: Object.entries(assets).map(([unit, quantity]) => ({ unit, quantity })),
  }
})
const totalTusdm = utxos.reduce((sum, utxo) => sum + BigInt(utxo.canonicalTusdmAtomic), 0n)
const evidence = {
  schema: 'IMMORTAL-CONFIGURED-PREPROD-TREASURY-OBSERVATION-v3',
  observedAt: new Date().toISOString(),
  network: 'cardano-preprod',
  identity: {
    configuredAddress: CONFIGURED_ADDRESS,
    derivedAddress,
    derivedScriptHash,
    sourceArtifact: ARTIFACT_PATH,
    sourceArtifactSha256: artifactSha256,
    configuredAddressMatchesDerivedAddress: true,
    optionalConfiguredScriptHashMatches: EXPECTED_SCRIPT_HASH ? true : null,
  },
  source: {
    provider: 'Koios',
    endpoint: 'POST /address_utxos',
    returnedRows: rows.length,
    pagesFetched,
    pageSize,
    paginationComplete: complete,
  },
  assetIdentity: { canonicalTusdmUnit: TUSDM_UNIT, policyId: TUSDM_POLICY_ID, assetNameHex: TUSDM_ASSET_NAME_HEX },
  totals: {
    utxoCount: utxos.length,
    lovelace: utxos.reduce((sum, u) => sum + BigInt(u.lovelace), 0n).toString(),
    canonicalTusdmAtomic: totalTusdm.toString(),
  },
  utxos,
  qualification: {
    repositoryArtifactIdentityChecked: true,
    configuredAddressMatchesDerivedAddress: true,
    ledgerObservationObtained: true,
    paginationCompletenessChecked: true,
    authorizedReleaseProven: false,
    canonicalTreasuryDeploymentProven: false,
    liquidationRouteVerified: false,
    swapExecuted: false,
    qneProven: false,
  },
  limitations: [
    'The address and script hash are derived from the Treasury artifact committed at the observed workflow commit.',
    'Pagination uses a stable tx_hash/tx_index ordering and continues until a response contains fewer rows than the requested page size; duplicate output references and non-terminating pagination fail closed.',
    'Koios pagination is not an atomic ledger snapshot; chain changes during the observation can still affect cross-page consistency.',
    'This does not independently prove that the artifact belongs to an authorized release or that the configured deployment is the current canonical protocol deployment.',
    'Balances do not prove a DEX route, execution proceeds, minimum-output protection, execution costs, or QNE.',
  ],
}
evidence.evidenceHash = createHash('sha256').update(JSON.stringify(evidence)).digest('hex')
await mkdir(dirname(OUTPUT_PATH), { recursive: true })
await writeFile(OUTPUT_PATH, JSON.stringify(evidence, null, 2) + '\n')
console.log(JSON.stringify({
  status: 'OBSERVED',
  address: derivedAddress,
  scriptHash: derivedScriptHash,
  sourceArtifact: ARTIFACT_PATH,
  sourceArtifactSha256: artifactSha256,
  utxoCount: utxos.length,
  pagesFetched,
  pageSize,
  paginationComplete: complete,
  canonicalTusdmAtomic: totalTusdm.toString(),
  evidenceHash: evidence.evidenceHash,
  output: OUTPUT_PATH,
}, null, 2))
