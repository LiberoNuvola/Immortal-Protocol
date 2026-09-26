/**
 * One-time Preprod deployment of the V3 economic-state carrier singleton.
 *
 * Local/admin boundary only: DEPLOYER_MNEMONIC is never used by the browser.
 * The policy identity is derived from an explicitly selected seed UTxO.
 * The initial datum is supplied explicitly; this helper never invents state.
 *
 * Required:
 *   BLOCKFROST_PROJECT_ID
 *   DEPLOYER_MNEMONIC
 *   V3_CARRIER_TOKEN_NAME_HEX
 *   V3_CARRIER_INITIAL_DATUM_CBOR
 *
 * Optional:
 *   V3_CARRIER_SEED_TX_HASH
 *   V3_CARRIER_SEED_OUTPUT_INDEX
 *   V3_CARRIER_LOVELACE (default 3000000)
 */
import 'dotenv/config'
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { applyParamsToScript, Data, Lucid, type Script, type UTxO } from 'lucid-cardano'

type ScriptEnvelope = { type: string; cborHex: string }

const required = (name: string): string => {
  const value = process.env[name]?.trim()
  if (!value) throw new Error(name + ' is required')
  return value
}

function loadArtifact(path: string, label: string): ScriptEnvelope {
  const envelope = JSON.parse(readFileSync(path, 'utf8')) as ScriptEnvelope
  if (envelope.type !== 'PlutusScriptV2' || !/^[0-9a-f]+$/i.test(envelope.cborHex)) {
    throw new Error('invalid ' + label + ' artifact')
  }
  return envelope
}

type PlutusConstr = { index: number; fields: unknown[] }

const isConstr = (value: unknown): value is PlutusConstr =>
  typeof value === 'object' && value !== null &&
  typeof (value as { index?: unknown }).index === 'number' &&
  Array.isArray((value as { fields?: unknown }).fields)

const asInteger = (value: unknown, label: string): bigint => {
  if (typeof value !== 'bigint') throw new Error(label + ' must be a Plutus integer')
  return value
}

const asBool = (value: unknown, label: string): boolean => {
  if (!isConstr(value) || value.fields.length !== 0 || (value.index !== 0 && value.index !== 1)) {
    throw new Error(label + ' must be a Plutus Bool')
  }
  return value.index === 0
}

function validateInitialV3Datum(initialDatumCbor: string): void {
  const datum = Data.from(initialDatumCbor) as unknown
  if (!isConstr(datum) || datum.index !== 0 || datum.fields.length !== 2) {
    throw new Error('V3 initial datum must be V3EconomicStateDatum constructor 0 with version + state')
  }
  asInteger(datum.fields[0], 'stateVersion')
  const state = datum.fields[1]
  if (!isConstr(state) || state.index !== 0 || state.fields.length !== 9) {
    throw new Error('V3 initial datum must contain the complete EconomicStateV3 shape')
  }
  const aggregate = state.fields.slice(0, 6).map((value, index) =>
    asInteger(value, 'V3 aggregate field ' + index),
  )
  if (aggregate.some((value) => value < 0n)) {
    throw new Error('V3 initial economic fields must be non-negative')
  }

  const classes = state.fields[6]
  if (!Array.isArray(classes) || classes.length !== 8) {
    throw new Error('V3 initial datum must contain exactly 8 canonical classes')
  }
  const prices = [1n, 2n, 3n, 5n, 10n, 25n, 50n, 100n]
  let exposureSum = 0n
  let unresolvedSum = 0n
  classes.forEach((entry, index) => {
    if (!isConstr(entry) || entry.index !== 0 || entry.fields.length !== 6) {
      throw new Error('V3 class ' + index + ' has an invalid constructor shape')
    }
    const classId = asInteger(entry.fields[0], 'class ' + index + ' id')
    const issued = asInteger(entry.fields[1], 'class ' + index + ' issued')
    const unresolved = asInteger(entry.fields[2], 'class ' + index + ' unresolved')
    const exposure = asInteger(entry.fields[3], 'class ' + index + ' exposure')
    const cap = asInteger(entry.fields[4], 'class ' + index + ' cap')
    asBool(entry.fields[5], 'class ' + index + ' saleable')
    if (classId !== BigInt(index)) throw new Error('V3 classes must have canonical IDs 0..7')
    if (issued < 0n || unresolved < 0n || exposure < 0n || cap < 0n || unresolved > issued) {
      throw new Error('V3 class ' + index + ' violates non-negative/unresolved bounds')
    }
    if (exposure !== prices[index] * unresolved) {
      throw new Error('V3 class ' + index + ' exposure does not match its canonical price')
    }
    exposureSum += exposure
    unresolvedSum += unresolved
  })
  if (asInteger(state.fields[1], 'unresolved reserve') !== exposureSum) {
    throw new Error('V3 unresolved reserve does not equal canonical class exposure sum')
  }
  if (asInteger(state.fields[2], 'unresolved ticket count') !== unresolvedSum) {
    throw new Error('V3 unresolved ticket count does not equal canonical class count sum')
  }

  const control = state.fields[7]
  if (!isConstr(control) || control.index !== 0 || control.fields.length !== 2) {
    throw new Error('V3 control state has invalid constructor shape')
  }
  const active = asInteger(control.fields[0], 'current active class')
  const highest = asInteger(control.fields[1], 'highest activated class')
  if (active < 0n || active >= 8n || highest < active || highest >= 8n) {
    throw new Error('V3 control state violates canonical class bounds')
  }
  const activeClass = classes[Number(active)] as PlutusConstr
  const activeCap = asInteger(activeClass.fields[4], 'active class cap')
  if (activeCap <= asInteger(activeClass.fields[1], 'active class issued')) {
    throw new Error('V3 current active class must remain saleable under its declared cap')
  }
  if (!asBool(activeClass.fields[5], 'active class saleable')) {
    throw new Error('V3 current active class must be explicitly saleable')
  }

  const jackpot = state.fields[8]
  if (!isConstr(jackpot) || jackpot.index !== 0 || jackpot.fields.length !== 4) {
    throw new Error('V3 Jackpot state has invalid constructor shape')
  }
  if (asInteger(jackpot.fields[0], 'Jackpot locked amount') < 0n ||
      asInteger(jackpot.fields[1], 'Jackpot threshold') < 0n ||
      asInteger(jackpot.fields[3], 'Jackpot cycle') < 0n) {
    throw new Error('V3 Jackpot state must be non-negative')
  }
  const status = jackpot.fields[2]
  if (!isConstr(status) || status.fields.length !== 0 || status.index < 0 || status.index > 3) {
    throw new Error('V3 Jackpot status must be one of inactive/locked/payable/closed')
  }
}

function selectedSeed(
  utxos: UTxO[],
  txHash: string | undefined,
  outputIndex: number | undefined,
): UTxO {
  const matches = utxos.filter((u) =>
    (!txHash || u.txHash === txHash) &&
    (outputIndex === undefined || u.outputIndex === outputIndex),
  )
  if (matches.length !== 1) {
    throw new Error(
      'V3 carrier deployment requires exactly one explicit seed UTxO; ' +
      'set V3_CARRIER_SEED_TX_HASH and V3_CARRIER_SEED_OUTPUT_INDEX',
    )
  }
  return matches[0]
}

async function main() {
  const projectId = required('BLOCKFROST_PROJECT_ID')
  const mnemonic = required('DEPLOYER_MNEMONIC')
  const tokenNameHex = required('V3_CARRIER_TOKEN_NAME_HEX').toLowerCase()
  const initialDatumCbor = required('V3_CARRIER_INITIAL_DATUM_CBOR')

  if (!/^[0-9a-f]+$/i.test(tokenNameHex)) {
    throw new Error('V3_CARRIER_TOKEN_NAME_HEX must be hexadecimal')
  }
  validateInitialV3Datum(initialDatumCbor)

  const lucid = await Lucid.new(
    { kind: 'Blockfrost', url: 'https://cardano-preprod.blockfrost.io/api/v0', projectId },
    'Preprod',
  )
  lucid.selectWalletFromSeed(mnemonic)

  const signerAddress = await lucid.wallet.address()
  const seedTxHash = process.env.V3_CARRIER_SEED_TX_HASH?.trim()
  const seedIndexRaw = process.env.V3_CARRIER_SEED_OUTPUT_INDEX?.trim()
  const seedIndex = seedIndexRaw === undefined || seedIndexRaw === '' ? undefined : Number(seedIndexRaw)
  if (seedIndex !== undefined && (!Number.isInteger(seedIndex) || seedIndex < 0)) {
    throw new Error('V3_CARRIER_SEED_OUTPUT_INDEX must be a non-negative integer')
  }

  const seed = selectedSeed(await lucid.wallet.getUtxos(), seedTxHash, seedIndex)

  const policyFactory = loadArtifact(
    'plutus/out/v3EconomicStateCarrierMintPolicy.plutus.json',
    'V3 carrier mint policy',
  )
  const carrierFactory = loadArtifact(
    'plutus/out/v3EconomicStateCarrier.plutus.json',
    'V3 carrier validator',
  )

  const mintPolicy: Script = {
    type: 'PlutusV2',
    script: applyParamsToScript(policyFactory.cborHex, [
      { txHash: seed.txHash, outputIndex: BigInt(seed.outputIndex) },
      tokenNameHex,
    ]),
  }
  const policyId = lucid.utils.mintingPolicyToId(mintPolicy)
  const carrierUnit = policyId + tokenNameHex

  const carrierValidator: Script = {
    type: 'PlutusV2',
    script: applyParamsToScript(carrierFactory.cborHex, [policyId, tokenNameHex]),
  }
  const carrierAddress = lucid.utils.validatorToAddress(carrierValidator)

  const lovelace = BigInt(process.env.V3_CARRIER_LOVELACE ?? '3000000')
  if (lovelace <= 0n) throw new Error('V3_CARRIER_LOVELACE must be positive')

  const tx = await lucid
    .newTx()
    .collectFrom([seed])
    .mintAssets({ [carrierUnit]: 1n }, Data.void())
    .attachMintingPolicy(mintPolicy)
    .payToContract(carrierAddress, { inline: initialDatumCbor }, { lovelace, [carrierUnit]: 1n })
    .complete()

  const signed = await tx.sign().complete()
  const txHash = await signed.submit()
  await lucid.awaitTx(txHash)

  const matches = (await lucid.utxosAt(carrierAddress))
    .filter((u) => (u.assets[carrierUnit] ?? 0n) === 1n)
  if (matches.length !== 1) {
    throw new Error('submitted deployment but exact V3 singleton UTxO was not observed')
  }

  const carrier = matches[0]
  const evidence = {
    deployment: 'V3-ECONOMIC-STATE-CARRIER-PREPROD-001',
    network: 'Preprod',
    seedRef: seed.txHash + '#' + seed.outputIndex,
    policyId,
    carrierTokenNameHex: tokenNameHex,
    carrierUnit,
    carrierScriptAddress: carrierAddress,
    deploymentTransactionRef: 'cardano:tx/' + txHash,
    carrierStateReference: 'cardano:tx/' + carrier.txHash + '#' + carrier.outputIndex,
    carrierLovelace: lovelace.toString(),
    initialDatumCbor,
    initialDatumExplicit: true,
    signerAddress,
  }

  mkdirSync('audit/preprod-issue', { recursive: true })
  writeFileSync(
    'audit/preprod-issue/v3-carrier-deployment.json',
    JSON.stringify(evidence, null, 2) + '\n',
  )
  console.log(JSON.stringify(evidence, null, 2))
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
