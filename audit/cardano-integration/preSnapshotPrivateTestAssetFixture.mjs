import { spawnSync } from 'node:child_process'
import {
  chmod,
  mkdir,
  readFile,
  readdir,
  stat,
  writeFile
} from 'node:fs/promises'
import { join, relative, resolve, sep } from 'node:path'
import { pathToFileURL } from 'node:url'
import { createHash } from 'node:crypto'

const REQUIRED_PRIVATE_MAGIC = 4242
const FIXTURE_ASSET_NAME = Buffer.from('M1TEST', 'ascii').toString('hex')
const FIXTURE_QUANTITY = 100n
const MIN_INPUT_LOVELACE = 8_000_000n
const MIN_TOKEN_OUTPUT_LOVELACE = 3_000_000n
const WORKFLOW_FORMAT = 'immortal-m1-local-test-asset-v1'

function fail(code, message = code) {
  throw Object.assign(new Error(message), { code })
}

function hashFileBytes(value) {
  return createHash('sha256').update(value).digest('hex')
}

function pathIsInside(parent, child) {
  const rel = relative(parent, child)
  return rel !== '' && rel !== '..' && !rel.startsWith('..' + sep)
}

/**
 * This fixture is intentionally bound to the documented local WSL devnet
 * (magic 4242) and its node1 Unix socket. It is not a general Cardano wallet
 * or a Preprod/Mainnet transaction helper.
 */
export function validatePrivateTestFixtureConfig(config) {
  if (!config || typeof config !== 'object' || Array.isArray(config)) {
    fail('M1_FIXTURE_CONFIG_REQUIRED')
  }
  if (config.networkMagic !== REQUIRED_PRIVATE_MAGIC) {
    fail('M1_FIXTURE_PRIVATE_TESTNET_MAGIC_REQUIRED')
  }
  if (typeof config.testnetRoot !== 'string' || config.testnetRoot.trim().length === 0) {
    fail('M1_FIXTURE_TESTNET_ROOT_REQUIRED')
  }
  const testnetRoot = resolve(config.testnetRoot)
  const nodeSocketPath = resolve(config.nodeSocketPath ?? join(testnetRoot, 'socket', 'node1', 'sock'))
  const expectedSocket = resolve(testnetRoot, 'socket', 'node1', 'sock')
  if (nodeSocketPath !== expectedSocket) fail('M1_FIXTURE_NODE1_SOCKET_REQUIRED')

  const nodeConfigPath = resolve(config.nodeConfigPath ?? join(testnetRoot, 'configuration.yaml'))
  if (nodeConfigPath !== resolve(testnetRoot, 'configuration.yaml')) {
    fail('M1_FIXTURE_NODE_CONFIG_OUTSIDE_PRIVATE_TESTNET')
  }

  const walletIndex = config.walletIndex ?? 1
  if (walletIndex !== 1) fail('M1_FIXTURE_ONLY_GENERATED_UTXO_WALLET_1_SUPPORTED')
  const walletDirectory = resolve(testnetRoot, 'utxo-keys', 'utxo1')
  const workDirectory = resolve(config.workDirectory ?? join(testnetRoot, 'm1-fixtures', 'pre-token'))
  const requiredWorkPrefix = resolve(testnetRoot, 'm1-fixtures')
  if (!pathIsInside(requiredWorkPrefix, workDirectory)) {
    fail('M1_FIXTURE_WORKDIR_MUST_BE_PRIVATE_TESTNET_LOCAL')
  }

  const cardanoCli = typeof config.cardanoCli === 'string' && config.cardanoCli.length > 0
    ? config.cardanoCli
    : 'cardano-cli'

  return Object.freeze({
    networkMagic: REQUIRED_PRIVATE_MAGIC,
    testnetRoot,
    nodeSocketPath,
    nodeConfigPath,
    walletIndex,
    walletDirectory,
    walletSigningKey: join(walletDirectory, 'utxo.skey'),
    walletVerificationKey: join(walletDirectory, 'utxo.vkey'),
    walletAddressFile: join(walletDirectory, 'utxo.addr'),
    workDirectory,
    cardanoCli,
    tokenAmount: FIXTURE_QUANTITY.toString(),
    tokenNameAscii: 'M1TEST',
    tokenNameHex: FIXTURE_ASSET_NAME
  })
}

export function selectLargestFundedUtxo(utxoDocument, minLovelace = MIN_INPUT_LOVELACE) {
  if (!utxoDocument || typeof utxoDocument !== 'object' || Array.isArray(utxoDocument)) {
    fail('M1_FIXTURE_UTXO_DOCUMENT_INVALID')
  }
  const candidates = []
  for (const [reference, output] of Object.entries(utxoDocument)) {
    if (!/^[0-9a-f]{64}#[0-9]+$/.test(reference)) continue
    const raw = output?.value?.lovelace
    if (!(typeof raw === 'string' && /^\d+$/.test(raw)) &&
        !(typeof raw === 'number' && Number.isSafeInteger(raw) && raw >= 0)) continue
    const lovelace = BigInt(raw)
    if (lovelace >= minLovelace) candidates.push({ reference, lovelace })
  }
  candidates.sort((a, b) => a.lovelace > b.lovelace ? -1 : a.lovelace < b.lovelace ? 1 : 0)
  if (candidates.length === 0) fail('M1_FIXTURE_NO_FUNDED_TEST_UTXO')
  return Object.freeze({
    reference: candidates[0].reference,
    lovelace: candidates[0].lovelace.toString()
  })
}

export function sumFixtureAssetQuantity(utxoDocument, assetUnit) {
  if (!utxoDocument || typeof utxoDocument !== 'object' || Array.isArray(utxoDocument)) {
    fail('M1_FIXTURE_UTXO_DOCUMENT_INVALID')
  }
  if (typeof assetUnit !== 'string' || !/^[0-9a-f]{56}\.[0-9a-f]{2,64}$/.test(assetUnit)) {
    fail('M1_FIXTURE_ASSET_UNIT_INVALID')
  }
  let total = 0n
  for (const output of Object.values(utxoDocument)) {
    const quantity = output?.value?.[assetUnit]
    if (quantity === undefined) continue
    if (!(typeof quantity === 'string' && /^(0|[1-9][0-9]*)$/.test(quantity)) &&
        !(typeof quantity === 'number' && Number.isSafeInteger(quantity) && quantity >= 0)) {
      fail('M1_FIXTURE_ASSET_QUANTITY_INVALID')
    }
    total += BigInt(quantity)
  }
  return total.toString()
}

function cli(config, args, label) {
  const result = spawnSync(config.cardanoCli, args, {
    encoding: 'utf8',
    env: {
      ...process.env,
      CARDANO_NODE_SOCKET_PATH: config.nodeSocketPath,
      CARDANO_NODE_NETWORK_ID: String(config.networkMagic)
    },
    timeout: 180_000,
    maxBuffer: 32 * 1024 * 1024,
    windowsHide: true
  })
  if (result.error) fail('M1_FIXTURE_CLI_EXEC_FAILED:' + label, result.error.message)
  if (result.status !== 0) {
    const details = String(result.stderr || result.stdout || '').trim().slice(-4000)
    fail('M1_FIXTURE_CLI_FAILED:' + label, details || ('exit status ' + result.status))
  }
  return String(result.stdout ?? '').trim()
}

async function assertPrivateRuntime(config) {
  if (process.platform !== 'linux') fail('M1_FIXTURE_REQUIRES_WSL_LINUX')
  const socket = await stat(config.nodeSocketPath).catch(error => {
    fail('M1_FIXTURE_NODE_SOCKET_UNAVAILABLE', error.message)
  })
  if (!socket.isSocket()) fail('M1_FIXTURE_NODE_SOCKET_NOT_UNIX_SOCKET')
  await stat(config.nodeConfigPath).catch(error => fail('M1_FIXTURE_NODE_CONFIG_MISSING', error.message))
  for (const file of [
    config.walletSigningKey,
    config.walletVerificationKey,
    config.walletAddressFile
  ]) {
    await stat(file).catch(error => fail('M1_FIXTURE_GENERATED_WALLET_FILE_MISSING:' + file, error.message))
  }
  const version = cli(config, ['version'], 'version')
  if (!/11\.0\.1/.test(version)) {
    fail('M1_FIXTURE_CARDANO_CLI_VERSION_MISMATCH', 'Expected cardano-cli 11.0.1; got: ' + version)
  }
  return version
}

async function readWalletAddress(config) {
  const address = (await readFile(config.walletAddressFile, 'utf8')).trim()
  if (!address.startsWith('addr_test1')) fail('M1_FIXTURE_EXPECTED_TESTNET_PAYMENT_ADDRESS')
  return address
}

async function queryWalletUtxos(config, address) {
  const output = cli(config, [
    'latest', 'query', 'utxo',
    '--address', address,
    '--cardano-mode'
  ], 'query-utxo')
  let document
  try { document = JSON.parse(output) } catch (_) {
    fail('M1_FIXTURE_QUERY_UTXO_INVALID_JSON')
  }
  return document
}

async function prepare(config) {
  await assertPrivateRuntime(config)
  await mkdir(config.workDirectory, { recursive: true })
  await chmod(config.workDirectory, 0o700)
  const existing = await readdir(config.workDirectory)
  if (existing.length > 0) fail('M1_FIXTURE_WORKDIR_NOT_EMPTY')

  const address = await readWalletAddress(config)
  const utxos = await queryWalletUtxos(config, address)
  const fundingInput = selectLargestFundedUtxo(utxos)
  const keyFile = join(config.workDirectory, 'policy.skey')
  const verificationKeyFile = join(config.workDirectory, 'policy.vkey')
  const scriptFile = join(config.workDirectory, 'policy.json')
  const unsignedBodyFile = join(config.workDirectory, 'mint.body')

  cli(config, [
    'latest', 'address', 'key-gen',
    '--normal-key',
    '--verification-key-file', verificationKeyFile,
    '--signing-key-file', keyFile
  ], 'generate-ephemeral-native-policy-key')

  const keyHash = cli(config, [
    'latest', 'address', 'key-hash',
    '--payment-verification-key-file', verificationKeyFile
  ], 'derive-ephemeral-policy-key-hash')
  if (!/^[0-9a-f]{56}$/.test(keyHash)) fail('M1_FIXTURE_POLICY_KEY_HASH_INVALID')

  const policy = {
    scripts: [{ keyHash, type: 'sig' }],
    type: 'all'
  }
  await writeFile(scriptFile, JSON.stringify(policy, null, 2) + '\n', { mode: 0o600 })

  const policyId = cli(config, [
    'latest', 'transaction', 'policyid',
    '--script-file', scriptFile
  ], 'derive-test-policy-id')
  if (!/^[0-9a-f]{56}$/.test(policyId)) fail('M1_FIXTURE_POLICY_ID_INVALID')

  const assetUnit = policyId + '.' + config.tokenNameHex
  const mintValue = config.tokenAmount + ' ' + assetUnit
  const txOut = address + '+' + MIN_TOKEN_OUTPUT_LOVELACE.toString() + '+' + mintValue

  cli(config, [
    'latest', 'transaction', 'build',
    '--change-address', address,
    '--tx-in', fundingInput.reference,
    '--tx-out', txOut,
    '--mint', mintValue,
    '--mint-script-file', scriptFile,
    '--out-file', unsignedBodyFile
  ], 'build-unsigned-local-test-asset-transaction')

  const bodyBytes = await readFile(unsignedBodyFile)
  const manifest = {
    format: WORKFLOW_FORMAT,
    networkMagic: config.networkMagic,
    cliVersion: cli(config, ['version'], 'version'),
    tokenNameAscii: config.tokenNameAscii,
    tokenNameHex: config.tokenNameHex,
    tokenAmount: config.tokenAmount,
    policyId,
    assetUnit,
    fundingInput: fundingInput.reference,
    fundingInputLovelace: fundingInput.lovelace,
    walletAddress: address,
    files: {
      walletSigningKey: config.walletSigningKey,
      walletVerificationKey: config.walletVerificationKey,
      policySigningKey: keyFile,
      policyVerificationKey: verificationKeyFile,
      policyScript: scriptFile,
      unsignedBody: unsignedBodyFile
    },
    unsignedBodySha256: hashFileBytes(bodyBytes)
  }
  await writeFile(
    join(config.workDirectory, 'prepared.json'),
    JSON.stringify(manifest, null, 2) + '\n',
    { mode: 0o600 }
  )

  return Object.freeze({
    status: 'PREPARED_UNSIGNED',
    networkMagic: config.networkMagic,
    assetUnit,
    tokenAmount: config.tokenAmount,
    fundingInput: fundingInput.reference,
    workDirectory: config.workDirectory,
    unsignedBodySha256: manifest.unsignedBodySha256,
    signingOrSubmissionPerformed: false
  })
}

async function loadPrepared(config) {
  const manifestPath = join(config.workDirectory, 'prepared.json')
  let manifest
  try { manifest = JSON.parse(await readFile(manifestPath, 'utf8')) } catch (_) {
    fail('M1_FIXTURE_PREPARED_MANIFEST_MISSING_OR_INVALID')
  }
  if (manifest.format !== WORKFLOW_FORMAT ||
      manifest.networkMagic !== REQUIRED_PRIVATE_MAGIC ||
      manifest.tokenNameHex !== config.tokenNameHex ||
      manifest.tokenAmount !== config.tokenAmount ||
      !/^[0-9a-f]{56}$/.test(manifest.policyId) ||
      manifest.assetUnit !== manifest.policyId + '.' + manifest.tokenNameHex) {
    fail('M1_FIXTURE_PREPARED_MANIFEST_MISMATCH')
  }
  const expectedFiles = {
    walletSigningKey: config.walletSigningKey,
    walletVerificationKey: config.walletVerificationKey,
    policySigningKey: join(config.workDirectory, 'policy.skey'),
    policyVerificationKey: join(config.workDirectory, 'policy.vkey'),
    policyScript: join(config.workDirectory, 'policy.json'),
    unsignedBody: join(config.workDirectory, 'mint.body')
  }
  for (const [name, expectedPath] of Object.entries(expectedFiles)) {
    if (resolve(manifest.files?.[name] ?? '') !== resolve(expectedPath)) {
      fail('M1_FIXTURE_PREPARED_FILE_PATH_MISMATCH:' + name)
    }
  }
  const bodyPath = manifest.files?.unsignedBody
  if (typeof bodyPath !== 'string' || resolve(bodyPath) !== resolve(config.workDirectory, 'mint.body')) {
    fail('M1_FIXTURE_UNSIGNED_BODY_PATH_MISMATCH')
  }
  const bodyBytes = await readFile(bodyPath)
  if (hashFileBytes(bodyBytes) !== manifest.unsignedBodySha256) {
    fail('M1_FIXTURE_UNSIGNED_BODY_DIGEST_MISMATCH')
  }
  const currentPolicyId = cli(config, [
    'latest', 'transaction', 'policyid',
    '--script-file', manifest.files.policyScript
  ], 'revalidate-policy-id')
  if (currentPolicyId !== manifest.policyId) fail('M1_FIXTURE_POLICY_ID_CHANGED')
  return manifest
}

async function submit(config) {
  await assertPrivateRuntime(config)
  if (process.env.IMMORTAL_M1_ALLOW_LOCAL_TESTNET_SUBMIT !== 'YES') {
    fail(
      'M1_FIXTURE_SUBMIT_OPT_IN_REQUIRED',
      'Set IMMORTAL_M1_ALLOW_LOCAL_TESTNET_SUBMIT=YES only after verifying this is the isolated local magic-4242 testnet.'
    )
  }
  const manifest = await loadPrepared(config)
  const submittedPath = join(config.workDirectory, 'submitted.json')
  // Write a durable one-shot marker before signing. If the process stops midway,
  // the marker deliberately blocks replay until a human inspects the local node.
  const attempt = {
    status: 'SUBMISSION_ATTEMPT_STARTED',
    networkMagic: REQUIRED_PRIVATE_MAGIC,
    assetUnit: manifest.assetUnit,
    tokenAmount: manifest.tokenAmount,
    startedAt: new Date().toISOString()
  }
  try {
    await writeFile(submittedPath, JSON.stringify(attempt, null, 2), {
      mode: 0o600,
      flag: 'wx'
    })
  } catch (error) {
    if (error.code === 'EEXIST') {
      fail('M1_FIXTURE_ALREADY_SUBMITTED_OR_ATTEMPTED', 'A one-shot marker already exists; inspect the local ledger before any manual recovery.')
    }
    throw error
  }
  const signedTx = join(config.workDirectory, 'mint.signed')
  cli(config, [
    'latest', 'transaction', 'sign',
    '--tx-body-file', manifest.files.unsignedBody,
    '--signing-key-file', manifest.files.walletSigningKey,
    '--signing-key-file', manifest.files.policySigningKey,
    '--out-file', signedTx
  ], 'sign-local-test-asset-transaction')
  const txId = cli(config, [
    'latest', 'transaction', 'txid',
    '--tx-file', signedTx
  ], 'derive-local-fixture-transaction-id')
  if (!/^[0-9a-f]{64}$/.test(txId)) fail('M1_FIXTURE_TXID_INVALID')
  await writeFile(submittedPath, JSON.stringify({
    ...attempt,
    status: 'SIGNED_READY_TO_SUBMIT',
    txId
  }, null, 2) + '\\n', { mode: 0o600 })

  cli(config, [
    'latest', 'transaction', 'submit',
    '--tx-file', signedTx,
    '--testnet-magic', String(REQUIRED_PRIVATE_MAGIC)
  ], 'submit-local-test-asset-transaction')

  const submitted = {
    status: 'SUBMITTED_PRIVATE_TESTNET',
    networkMagic: REQUIRED_PRIVATE_MAGIC,
    txId,
    policyId: manifest.policyId,
    assetUnit: manifest.assetUnit,
    tokenAmount: manifest.tokenAmount,
    submittedAt: new Date().toISOString()
  }
  await writeFile(
    submittedPath,
    JSON.stringify(submitted, null, 2) + '\n',
    { mode: 0o600 }
  )
  return Object.freeze(submitted)
}

async function verify(config) {
  await assertPrivateRuntime(config)
  const manifest = await loadPrepared(config)
  const address = await readWalletAddress(config)
  const utxos = await queryWalletUtxos(config, address)
  const found = sumFixtureAssetQuantity(utxos, manifest.assetUnit)
  const expected = BigInt(manifest.tokenAmount)
  const observed = BigInt(found)
  return Object.freeze({
    status: observed >= expected ? 'PASS_NON_ZERO_LOCAL_TEST_ASSET' : 'WAITING_FOR_LOCAL_TEST_ASSET',
    networkMagic: REQUIRED_PRIVATE_MAGIC,
    assetUnit: manifest.assetUnit,
    expectedQuantity: expected.toString(),
    observedQuantity: observed.toString(),
    address
  })
}

async function main() {
  const mode = process.argv[2]
  const configPath = process.argv[3]
  if (!['--prepare', '--submit-local-private-testnet', '--verify'].includes(mode) || !configPath) {
    fail(
      'USAGE',
      'node preSnapshotPrivateTestAssetFixture.mjs --prepare|--submit-local-private-testnet|--verify <local-config.json>'
    )
  }
  const raw = JSON.parse(await readFile(resolve(configPath), 'utf8'))
  const config = validatePrivateTestFixtureConfig(raw)
  const result = mode === '--prepare'
    ? await prepare(config)
    : mode === '--submit-local-private-testnet'
      ? await submit(config)
      : await verify(config)
  process.stdout.write(JSON.stringify(result, null, 2) + '\n')
  if (result.status.startsWith('WAITING')) process.exitCode = 2
}

if (process.argv[1] &&
    pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  main().catch(error => {
    process.stderr.write((error.code ?? 'M1_FIXTURE_ERROR') + ': ' + error.message + '\n')
    process.exitCode = 1
  })
}
