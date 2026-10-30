/**
 * Capture one real Materios committee execution proof and verify it with the
 * existing independent Rust verifier. RPC data remains untrusted evidence:
 * this script does not authenticate GRANDPA finality or canonical runtime
 * deployment. Those are explicitly left OPEN in the resulting attestation.
 */
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { blake2b } from '@noble/hashes/blake2.js'

import { MateriosRpc, collectCommitteeExecutionEvidence } from './rpc.js'
import {
  executionProofPacketId,
  validateMateriosExecutionProofPacket,
  verifyOnChainSelectionInputsCommitment,
  verifyRuntimeCodeBinding,
  type MateriosAuthoritySelectionPath,
  type MateriosExecutionProofPacket,
} from './executionProof.js'
import { buildCalculateCommitteeCallData, MATERIOS_COMMITTEE_RUNTIME_API } from './runtimeApi.js'

const here = dirname(fileURLToPath(import.meta.url))
const repositoryRoot = resolve(here, '../../..')
const outputDirectory = join(here, '..', 'out', 'b3c')

function requiredEnv(name: string): string {
  const value = process.env[name]?.trim()
  if (!value) throw new Error(`required environment variable ${name} is missing`)
  return value
}

function requireHash(value: string, field: string): string {
  if (!/^0x[0-9a-f]{64}$/i.test(value)) {
    throw new Error(`${field} must be a 32-byte 0x-prefixed hash`)
  }
  return value.toLowerCase()
}

function bytesFromHex(value: string, field: string): Buffer {
  if (typeof value !== 'string' || !/^0x(?:[0-9a-f]{2})*$/i.test(value)) {
    throw new Error(`${field} must be even-length 0x-prefixed hex`)
  }
  return Buffer.from(value.slice(2), 'hex')
}

function sha256Hex(bytes: Uint8Array): string {
  return createHash('sha256').update(bytes).digest('hex')
}

function blake2_256Hex(bytes: Uint8Array): string {
  return '0x' + Buffer.from(blake2b(bytes, { dkLen: 32 })).toString('hex')
}

function serializeBigInts(value: unknown): string {
  return JSON.stringify(
    value,
    (_key, entry: unknown) => typeof entry === 'bigint' ? entry.toString() : entry,
    2,
  ) + '\n'
}

function writeHexFile(name: string, value: string): string {
  const path = join(outputDirectory, name)
  writeFileSync(path, value.replace(/^0x/i, '').toLowerCase() + '\n', 'utf8')
  return path
}

function writeBytesFile(name: string, value: Uint8Array): string {
  const path = join(outputDirectory, name)
  writeFileSync(path, value)
  return path
}

function buildSelectionPath(): MateriosAuthoritySelectionPath {
  const kind = requiredEnv('MATERIOS_B3_SELECTION_PATH_KIND')
  const evidenceHash = requireHash(
    requiredEnv('MATERIOS_B3_SELECTION_PATH_EVIDENCE_HASH'),
    'MATERIOS_B3_SELECTION_PATH_EVIDENCE_HASH',
  )

  if (kind === 'normal') {
    return { kind, evidenceHash }
  }
  if (kind === 'pinned') {
    const until = BigInt(requiredEnv('MATERIOS_B3_SELECTION_PATH_UNTIL_EPOCH'))
    if (until < 0n) throw new Error('selection path until epoch must be non-negative')
    return { kind, evidenceHash, untilEpoch: until }
  }
  throw new Error('MATERIOS_B3_SELECTION_PATH_KIND must be normal or pinned')
}

function runNativeVerifier(files: string[]): string {
  const manifest = join(repositoryRoot, 'poc', 'materios-execution-verifier', 'Cargo.toml')
  const args = [
    'run',
    '--manifest-path',
    manifest,
    '--bin',
    'verify-execution-proof',
    '--',
    ...files,
  ]

  try {
    return execFileSync('cargo', args, {
      cwd: repositoryRoot,
      encoding: 'utf8',
      maxBuffer: 16 * 1024 * 1024,
      stdio: ['ignore', 'pipe', 'pipe'],
    })
  } catch (error) {
    const failure = error as { stdout?: Buffer | string; stderr?: Buffer | string; message?: string }
    const stdout = failure.stdout?.toString() ?? ''
    const stderr = failure.stderr?.toString() ?? ''
    throw new Error(
      `existing Rust execution verifier failed.\n${stderr}\n${stdout}\n${failure.message ?? ''}`,
    )
  }
}

async function main(): Promise<void> {
  const rpcEndpoint =
    process.env.MATERIOS_RPC?.trim() ||
    'https://materios.fluxpointstudios.com/preprod-rpc'
  const chainId =
    process.env.MATERIOS_CHAIN_ID?.trim() ||
    'materios_preprod_v6'
  const rpc = new MateriosRpc(rpcEndpoint)

  const authoritySelectionInputsHex = requiredEnv('MATERIOS_B3_AUTHORITY_SELECTION_INPUTS_HEX').toLowerCase()
  const sidechainEpoch = BigInt(requiredEnv('MATERIOS_B3_SIDECHAIN_EPOCH'))
  const cardanoEpochNonceHex = requiredEnv('MATERIOS_B3_CARDANO_EPOCH_NONCE_HEX').toLowerCase()
  const genesisUtxoHex = requiredEnv('MATERIOS_B3_GENESIS_UTXO_HEX').toLowerCase()
  const authorityCommitment = requireHash(
    requiredEnv('MATERIOS_B3_AUTHORITY_COMMITMENT'),
    'MATERIOS_B3_AUTHORITY_COMMITMENT',
  )
  const selectionPath = buildSelectionPath()

  // Resolve the exact target committee-transition block. It may be older than
  // the current finalized head, but it must be at or below that head and map
  // back to the same hash at its height according to the RPC.
  const latestFinalizedHash = await rpc.getFinalizedHead()
  const latestFinalizedHeader = await rpc.getHeader(latestFinalizedHash)
  const targetBlockHash = requireHash(
    process.env.MATERIOS_B3_BLOCK_HASH?.trim() || latestFinalizedHash,
    'MATERIOS_B3_BLOCK_HASH',
  )
  const [targetHeader, genesisHashRaw] = await Promise.all([
    rpc.getHeader(targetBlockHash),
    rpc.call<unknown>('chain_getBlockHash', ['0x0']),
  ])
  const latestFinalizedNumber = BigInt(latestFinalizedHeader.number)
  const targetBlockNumber = BigInt(targetHeader.number)
  if (targetBlockNumber > latestFinalizedNumber) {
    throw new Error('target execution-proof block is above the RPC-reported finalized head')
  }

  const canonicalHashAtTargetHeight = await rpc.call<unknown>(
    'chain_getBlockHash',
    [targetHeader.number],
  )
  if (
    typeof canonicalHashAtTargetHeight !== 'string' ||
    canonicalHashAtTargetHeight.toLowerCase() !== targetBlockHash
  ) {
    throw new Error('target block hash does not match chain_getBlockHash at its height')
  }
  if (typeof genesisHashRaw !== 'string') {
    throw new Error('chain_getBlockHash(0) did not return a genesis hash')
  }
  const genesisHash = requireHash(genesisHashRaw, 'genesis hash')

  const callDataHex = buildCalculateCommitteeCallData(
    authoritySelectionInputsHex,
    sidechainEpoch,
  )

  // The exact same target hash is passed to the block/header/runtime/proof
  // reads. The RPC method is transport only; the Rust crate performs the
  // cryptographic StorageProof + runtime execution check below.
  const [selectionCommitment, evidence] = await Promise.all([
    rpc.getSelectionInputsCommitment(targetBlockHash),
    collectCommitteeExecutionEvidence(rpc, {
      finalizedBlockHash: targetBlockHash,
      callDataHex,
    }),
  ])

  const runtimeWasm = bytesFromHex(evidence.runtimeCodeHex, 'runtime WASM')
  const runtimeCodeHash = blake2_256Hex(runtimeWasm)

  const packet: MateriosExecutionProofPacket = {
    schemaVersion: 'materios-execution-proof-v2',
    chainId,
    genesisHash,
    blockHash: targetBlockHash,
    blockNumber: targetBlockNumber,
    stateRoot: evidence.header.stateRoot,
    runtime: {
      specName: evidence.execution.runtime.specName,
      implName: evidence.execution.runtime.implName,
      specVersion: evidence.execution.runtime.specVersion,
      implVersion: evidence.execution.runtime.implVersion,
      codeHash: runtimeCodeHash,
    },
    runtimeApiMethod: MATERIOS_COMMITTEE_RUNTIME_API,
    authoritySelectionInputsHex,
    selectionInputsHash: selectionCommitment.selectionInputsHash,
    callDataHex,
    resultHex: evidence.execution.resultHex,
    proofScaleHex: evidence.execution.proofScaleHex,
    sidechainEpoch,
    cardanoEpochNonceHex,
    genesisUtxoHex,
    selectionPath,
    authorityCommitment,
  }

  validateMateriosExecutionProofPacket(packet)
  verifyOnChainSelectionInputsCommitment(packet, selectionCommitment.selectionInputsHash)
  verifyRuntimeCodeBinding(packet, evidence.runtimeCodeHex)

  mkdirSync(outputDirectory, { recursive: true })

  const packetJson = serializeBigInts(packet)
  const packetPath = join(outputDirectory, 'MateriosB3CExecutionProofPacket.json')
  writeFileSync(packetPath, packetJson, 'utf8')

  const stateRootPath = writeHexFile('state-root.hex', packet.stateRoot)
  const proofScalePath = writeHexFile('proof-scale.hex', packet.proofScaleHex)
  const runtimeWasmPath = writeBytesFile('runtime.wasm', runtimeWasm)
  const runtimeCodeHashPath = writeHexFile('expected-runtime-code-hash.hex', packet.runtime.codeHash)
  const methodPath = join(outputDirectory, 'runtime-method.txt')
  writeFileSync(methodPath, packet.runtimeApiMethod + '\n', 'utf8')
  const callDataPath = writeHexFile('call-data.hex', packet.callDataHex)
  const expectedResultPath = writeHexFile('expected-result.hex', packet.resultHex)

  const nativeOutput = runNativeVerifier([
    stateRootPath,
    proofScalePath,
    runtimeWasmPath,
    runtimeCodeHashPath,
    methodPath,
    callDataPath,
    expectedResultPath,
  ])

  const verifiedMarker = 'B3_C_EXECUTION_PROOF_VERIFIED=true'
  if (!nativeOutput.split(/\r?\n/).includes(verifiedMarker)) {
    throw new Error('Rust verifier did not emit the exact B3-C success marker')
  }
  const resultLine = nativeOutput
    .split(/\r?\n/)
    .find((line) => line.startsWith('B3_C_VERIFIED_RESULT_HEX='))
  if (
    !resultLine ||
    resultLine.slice('B3_C_VERIFIED_RESULT_HEX='.length).toLowerCase() !== packet.resultHex.toLowerCase()
  ) {
    throw new Error('Rust verifier output does not match the TypeScript packet result')
  }

  const packetBytes = Buffer.from(packetJson, 'utf8')
  const proofBytes = bytesFromHex(packet.proofScaleHex, 'proofScaleHex')
  const callDataBytes = bytesFromHex(packet.callDataHex, 'callDataHex')
  const resultBytes = bytesFromHex(packet.resultHex, 'resultHex')
  const now = new Date().toISOString()
  const attestation = {
    schemaVersion: 'materios-b3c-execution-attestation-v1',
    status: 'EXECUTION_PROOF_VERIFIED_ONLY',
    capturedAt: now,
    source: {
      rpcEndpoint,
      chainId,
      rpcReportedLatestFinalizedHash: latestFinalizedHash,
      rpcReportedLatestFinalizedNumber: latestFinalizedNumber.toString(),
    },
    checkpoint: {
      blockHash: packet.blockHash,
      blockNumber: packet.blockNumber.toString(),
      stateRoot: packet.stateRoot,
      rpcCanonicalHashAtHeight: 'MATCH',
      cryptographicFinality: 'OPEN_NOT_VERIFIED_BY_THIS_PIPELINE',
      canonicality: 'OPEN_PENDING_INDEPENDENT_GRANDPA_VERIFICATION',
    },
    execution: {
      status: 'PASS',
      packetSchema: packet.schemaVersion,
      packetId: executionProofPacketId(packet),
      packetSha256: sha256Hex(packetBytes),
      method: packet.runtimeApiMethod,
      callDataSha256: sha256Hex(callDataBytes),
      resultSha256: sha256Hex(resultBytes),
      proofScaleSha256: sha256Hex(proofBytes),
      rustVerifier: 'poc/materios-execution-verifier::verify_execution_proof',
      rustVerifierOutput: nativeOutput.trim().split(/\r?\n/),
      reproducedResultMatchesPacketResult: true,
    },
    bindings: {
      blockHashToHeaderStateRoot: 'EXTRACTED_FROM_SAME_RPC_TARGET_HASH',
      targetBlockAtOrBelowRpcFinalizedHead: true,
      targetBlockHashAtHeight: 'MATCHED_BY_RPC',
      selectionInputsToOnChainSetCommitment: 'MATCHED_FROM_TARGET_BLOCK_EXTRINSIC',
      runtimeWasmToDeclaredBlake2_256: 'MATCHED',
      exactRuntimeMethodAndCallData: 'VERIFIED_BY_RUST_EXECUTION_PROOF',
      exactExecutionResult: 'REPRODUCED_BY_RUST_AND_MATCHED',
    },
    explicitlyOpen: {
      blockHeaderAndStateRootAuthentication: 'OPEN',
      grandpaFinalityAndAuthorityTransition: 'OPEN',
      canonicalDeployedRuntimeAndSourceBuildCorrespondence: 'OPEN',
      authoritySelectionSemanticsAndEnactment: 'OPEN',
      fullB3CheckpointComposition: 'OPEN',
    },
    artifactDigests: {
      packetSha256: sha256Hex(packetBytes),
      runtimeWasmSha256: sha256Hex(runtimeWasm),
      proofScaleSha256: sha256Hex(proofBytes),
      stateRootTextSha256: sha256Hex(Buffer.from(packet.stateRoot, 'utf8')),
      callDataSha256: sha256Hex(callDataBytes),
      resultSha256: sha256Hex(resultBytes),
    },
    nonClaim: 'This attestation proves the native execution-proof check against the supplied stateRoot and WASM bytes only. It does not authenticate the header, finality, canonicality, runtime deployment, or the authority transition.',
  }

  const attestationPath = join(outputDirectory, 'MateriosB3CExecutionProofAttestation.json')
  writeFileSync(attestationPath, JSON.stringify(attestation, null, 2) + '\n', 'utf8')

  console.log('B3-C native execution proof: PASS')
  console.log('Packet ID:', executionProofPacketId(packet))
  console.log('Target block:', packet.blockNumber.toString(), packet.blockHash)
  console.log('State root:', packet.stateRoot)
  console.log('On-chain selection input commitment: MATCH')
  console.log('Rust reproduced result: MATCH')
  console.log('Finality / canonicality / runtime deployment provenance: OPEN')
  console.log('Attestation:', attestationPath)
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack ?? error.message : String(error))
  process.exitCode = 1
})
