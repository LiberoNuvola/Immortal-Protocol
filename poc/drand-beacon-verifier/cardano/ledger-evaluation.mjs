import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { Blockfrost, CML, Constr, Data, Lucid, validatorToAddress } from '@lucid-evolution/lucid'

const API = process.env.YACI_STORE_API ?? 'http://127.0.0.1:8080/api/v1'
const NETWORK = 'Preprod'
const SEED = 'test test test test test test test test test test test test test test test test test test test test test test test sauce'
const ROUND = 42n
const SIGNATURE = '95a9f9f5b231b7714de1553105d8ffdf3dcda24cfdb1e689319bccf79a9c8ce430a91b811fbfaf763900bc998b5d686a'
const PUBLIC_KEY = '83cf0f2896adee7eb8b5f01fcad3912212c437e0073e911fb90022d3e760183c8c4b450b6a0a6c3ac6a5776a2d1064510d1fec758c921cc22b0e17e63aaf4bcb5ed66304de9cf809bd274ca73bab4af5a6e9c76a4bc09e76eae8991ef5ece45a'
const OUT = 'out/DrandPlutusLedgerEvidence.json'
const ADA_LOCK = 30_000_000n
const ADA_RETURN = 25_000_000n

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

async function waitFor(fn, predicate, label, attempts = 45) {
  for (let i = 0; i < attempts; i += 1) {
    const value = await fn()
    if (predicate(value)) return value
    await delay(1_000)
  }
  throw new Error('Timed out waiting for ' + label)
}

function txDescription(cborHex) {
  const tx = CML.Transaction.from_cbor_hex(cborHex)
  const body = tx.body()
  const rows = []
  const redeemers = tx.witness_set().redeemers()
  const legacy = redeemers?.as_arr_legacy_redeemer()
  if (legacy) {
    for (let i = 0; i < legacy.len(); i += 1) {
      const r = legacy.get(i)
      rows.push({
        tag: Number(r.tag()),
        index: Number(r.index()),
        memory: r.ex_units().mem().toString(),
        steps: r.ex_units().steps().toString(),
      })
    }
  }
  const map = redeemers?.as_map_redeemer_key_to_redeemer_val()
  if (map) {
    const keys = map.keys()
    for (let i = 0; i < keys.len(); i += 1) {
      const key = keys.get(i)
      const val = map.get(key)
      if (val) rows.push({
        tag: Number(key.tag()),
        index: Number(key.index()),
        memory: val.ex_units().mem().toString(),
        steps: val.ex_units().steps().toString(),
      })
    }
  }
  return {
    txHash: CML.hash_transaction(body).to_hex(),
    serializedBytes: Buffer.from(cborHex, 'hex').length,
    feeLovelace: body.fee().toString(),
    redeemerExecutionUnits: rows,
  }
}

async function evaluateWithYaci(cborHex) {
  try {
    const response = await fetch(API + '/utils/txs/evaluate/utxos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cbor: cborHex.startsWith('0x') ? cborHex.slice(2) : cborHex }),
    })
    const raw = await response.text()
    let payload
    try {
      payload = JSON.parse(raw)
    } catch {
      return { status: 'UNAVAILABLE', httpStatus: response.status, response: raw.slice(0, 2000) }
    }
    const results = payload?.result?.EvaluationResult
    if (!response.ok || payload?.fault || !results) {
      return {
        status: 'UNAVAILABLE',
        httpStatus: response.status,
        fault: payload?.fault ?? null,
        message: payload?.message ?? null,
        response: raw.slice(0, 2000),
      }
    }
    return {
      status: 'PASS',
      redeemers: Object.entries(results).map(([pointer, budget]) => {
        const [tag, index] = pointer.split(':')
        return { tag, index: Number(index), memory: Number(budget.memory), steps: Number(budget.steps) }
      }),
    }
  } catch (error) {
    return { status: 'UNAVAILABLE', error: String(error).slice(0, 2000) }
  }
}

await mkdir('out', { recursive: true })
const provider = new Blockfrost(API, '')
const protocolParameters = await provider.getProtocolParameters()
const lucid = await Lucid(provider, NETWORK)
lucid.selectWallet.fromSeed(SEED)

const walletAddress = await lucid.wallet().address()
const walletUtxos = await lucid.wallet().getUtxos()
const walletBalance = walletUtxos.reduce((total, utxo) => total + BigInt(utxo.assets.lovelace ?? 0n), 0n)
if (walletUtxos.length === 0 || walletBalance < ADA_LOCK + 5_000_000n) {
  throw new Error('Yaci test wallet not sufficiently funded: utxos=' + walletUtxos.length + ', lovelace=' + walletBalance)
}

const blueprint = JSON.parse(await readFile('plutus.json', 'utf8'))
const validatorCandidates = blueprint.validators?.filter((entry) => typeof entry.compiledCode === 'string') ?? []
const validatorEntry =
  validatorCandidates.find((entry) =>
    entry.datum?.purpose === 'spend' ||
    (typeof entry.title === 'string' && entry.title.endsWith('drand_beacon_verifier.spend')),
  ) ??
  (validatorCandidates.length === 1 ? validatorCandidates[0] : undefined)
if (!validatorEntry) {
  throw new Error('Aiken blueprint contains no unambiguous spend validator with compiledCode: ' +
    JSON.stringify(validatorCandidates.map((entry) => ({ title: entry.title, purpose: entry.datum?.purpose }))))
}
const script = { type: 'PlutusV3', script: validatorEntry.compiledCode }
const scriptAddress = validatorToAddress(NETWORK, script)
const protocolLimits = protocolParameters.maxTxExecutionUnits ?? {}
const protocolMaximum = {
  memory: Number(protocolLimits.memory ?? protocolLimits.mem ?? NaN),
  steps: Number(protocolLimits.steps ?? NaN),
  maxTxSize: Number(protocolParameters.maxTxSize ?? NaN),
}

const evidence = {
  schema: 'IMMORTAL-DRAND-PLUTUS-LEDGER-EVIDENCE-V1',
  status: 'IN_PROGRESS',
  environment: 'local-yaci-devnet',
  networkAdapter: 'Yaci Store Blockfrost-compatible API',
  aikenCompiler: blueprint.preamble?.compiler?.version ?? 'unknown',
  plutusVersion: blueprint.preamble?.plutusVersion ?? 'unknown',
  validatorTitle: validatorEntry.title ?? 'unknown',
  validatorHash: validatorEntry.hash ?? null,
  scriptAddress,
  vector: {
    profile: 'IMMORTAL-DRAND-QUICKNET-V1-POC',
    round: Number(ROUND),
    signatureSha256: createHash('sha256').update(Buffer.from(SIGNATURE, 'hex')).digest('hex'),
    publicKeySha256: createHash('sha256').update(Buffer.from(PUBLIC_KEY, 'hex')).digest('hex'),
    vectorSource: 'same captured Quicknet round-42 vector used by off-chain verifier and Aiken checks',
  },
  protocolParameters: {
    protocolVersion: protocolParameters.protocolVersion ?? null,
    maxTxSize: Number.isFinite(protocolMaximum.maxTxSize) ? protocolMaximum.maxTxSize : null,
    maxTxExecutionUnits: {
      memory: Number.isFinite(protocolMaximum.memory) ? protocolMaximum.memory : null,
      steps: Number.isFinite(protocolMaximum.steps) ? protocolMaximum.steps : null,
    },
  },
  wallet: { address: walletAddress, utxoCount: walletUtxos.length, balanceLovelace: walletBalance.toString() },
  lockTransaction: null,
  spendTransaction: null,
  yaciEvaluation: null,
  caveats: [
    'Only local Yaci devnet is used; no Preprod/mainnet funds or production scripts are touched.',
    'Ledger confirmation, not Aiken tests or evaluator output alone, is the positive acceptance signal.',
    'Execution-unit and transaction-size results are environment-specific and do not approve production round selection or PRE-RICH integration.',
  ],
}

try {
  const lockTx = await lucid
    .newTx()
    .pay.ToAddress(scriptAddress, { lovelace: ADA_LOCK })
    .complete({ localUPLCEval: true })
  const lockSigned = await lockTx.sign.withWallet().complete({ localUPLCEval: true })
  const lockCbor = lockSigned.toCBOR()
  const lockHash = await lockSigned.submit()
  await lucid.awaitTx(lockHash)
  const lockedUtxos = await waitFor(
    () => lucid.utxosAt(scriptAddress),
    (xs) => xs.some((utxo) => BigInt(utxo.assets.lovelace ?? 0n) === ADA_LOCK),
    'script-address UTxO',
  )
  const lockedUtxo = lockedUtxos.find((utxo) => BigInt(utxo.assets.lovelace ?? 0n) === ADA_LOCK)
  if (!lockedUtxo) throw new Error('Submitted lock transaction did not produce the expected script UTxO')

  evidence.lockTransaction = {
    txHash: lockHash,
    serializedBytes: Buffer.from(lockCbor, 'hex').length,
    lockedUtxo: lockedUtxo.txHash + '#' + lockedUtxo.outputIndex,
    lockedLovelace: ADA_LOCK.toString(),
  }

  const redeemer = Data.to(new Constr(0, [ROUND, SIGNATURE, PUBLIC_KEY]))
  const spendTx = await lucid
    .newTx()
    .collectFrom([lockedUtxo], redeemer)
    .attach.SpendingValidator(script)
    .pay.ToAddress(walletAddress, { lovelace: ADA_RETURN })
    .complete({ localUPLCEval: true })
  const signedSpend = await spendTx.sign.withWallet().complete({ localUPLCEval: true })
  const spendCbor = signedSpend.toCBOR()
  const description = txDescription(spendCbor)
  const yaciEvaluation = await evaluateWithYaci(spendCbor)

  const spendHash = await signedSpend.submit()
  await lucid.awaitTx(spendHash)
  const walletOutputs = await waitFor(
    () => lucid.utxosAt(walletAddress),
    (xs) => xs.some((utxo) => utxo.txHash === spendHash),
    'wallet output of verified spend transaction',
  )
  const scriptOutputs = await lucid.utxosAt(scriptAddress)
  const originalScriptInputRemains = scriptOutputs.some(
    (utxo) => utxo.txHash === lockedUtxo.txHash && utxo.outputIndex === lockedUtxo.outputIndex,
  )
  if (originalScriptInputRemains) throw new Error('Valid script input remains unspent after the confirmed spend')
  if (!walletOutputs.some((utxo) => utxo.txHash === spendHash)) {
    throw new Error('Confirmed spend has no indexed wallet output')
  }

  const spendBudget = description.redeemerExecutionUnits.reduce(
    (acc, budget) => ({
      memory: acc.memory + Number(budget.memory),
      steps: acc.steps + Number(budget.steps),
    }),
    { memory: 0, steps: 0 },
  )
  const withinProtocolMaximum =
    Number.isFinite(protocolMaximum.memory) && Number.isFinite(protocolMaximum.steps)
      ? spendBudget.memory <= protocolMaximum.memory && spendBudget.steps <= protocolMaximum.steps
      : null

  evidence.spendTransaction = {
    result: 'LEDGER_ACCEPTED',
    txHash: spendHash,
    ...description,
    assignedExecutionUnitsTotal: spendBudget,
    withinProtocolMaximum,
    originalScriptInputConsumed: true,
    walletOutputIndexed: true,
    returnedLovelace: ADA_RETURN.toString(),
  }
  evidence.yaciEvaluation = yaciEvaluation
  evidence.status = 'PASS'
  evidence.acceptanceClaim = 'A confirmed local Yaci ledger transaction spent the script UTxO using the real captured Quicknet round-42 signature under the compiled Plutus V3 validator.'
  evidence.nonClaims = [
    'Does not prove Materios GRANDPA finality or provenance.',
    'Does not select or freeze a production drand round schedule.',
    'Does not establish Preprod/mainnet execution-unit headroom without recording and validating their active protocol parameters.',
    'Does not integrate the validator into PRE-RICH.',
  ]
  await writeFile(OUT, JSON.stringify(evidence, null, 2) + '\n')
  console.log(JSON.stringify({
    status: evidence.status,
    evidencePath: OUT,
    lockTransaction: evidence.lockTransaction,
    spendTransaction: evidence.spendTransaction,
    yaciEvaluation,
    protocolParameters: evidence.protocolParameters,
  }, null, 2))
} catch (error) {
  evidence.status = 'FAIL'
  evidence.failure = String(error)
  await writeFile(OUT, JSON.stringify(evidence, null, 2) + '\n')
  throw error
}
