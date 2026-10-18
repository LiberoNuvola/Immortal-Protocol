/**
 * Native Yaci test of the isolated Aiken Plutus V3 Reveal candidate.
 *
 * Creates throwaway inline-datum fixtures, executes one positive Reveal on the
 * local Conway ledger, and submits a wrong-secret twin which must be rejected
 * by the ledger. A tiny test-only pool validator is embedded as the second
 * spending witness. This is not the production B1PrizePool validator.
 *
 * This does not migrate the Haskell Plutus V2 validator or modify the V3
 * carrier. The deployment gate remains closed until full differential parity,
 * resource measurements and the V2/V3 compatibility review are complete.
 */
import {
  CML,
  Constr,
  Data,
  Blockfrost,
  Lucid,
  getAddressDetails,
  scriptFromNative,
  mintingPolicyToId,
  validatorToScriptHash,
  validatorToAddress,
  applyParamsToScript as evolutionApplyParamsToScript,
  type Script,
  type UTxO,
} from '@lucid-evolution/lucid'
import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'

import {
  deriveBeacon,
  deriveSymbolsSeed,
  deriveTicketSeed,
  encodeBeaconTarget,
  field,
  fromHex,
  playerCommitment,
  sha256,
  ticketCommitment,
  toHex,
} from '../../src/beacon'
import {
  defaultPrizeTable,
  generateSymbols,
  classifyRowTier,
  classifyTier,
  rowPayoutTotal,
} from '../../src/gameRules'

const API = process.env.YACI_STORE_API ?? 'http://127.0.0.1:8080/api/v1'
const WALLET_FILE = '/tmp/immortal-yaci-test-wallet.json'
const BLUEPRINT_PATH = 'poc/aiken-reveal-parity/plutus.json'
const PUBLICATION_PATH = 'audit/yaci-evidence/aiken-reference-script-publication.json'
const EVIDENCE_PATH = 'audit/yaci-evidence/aiken-reveal-ledger.json'
const REVEAL_TITLE = 'reveal.pre_rich_reveal.spend'
const POOL_TITLE_SUFFIX = '.pool_stub.spend'

const PRICE_USDM = 100n
const TICKET_NAME_HEX = '52462d5245414c2d52455645414c'
const MAINCHAIN_REF = new Uint8Array(32)
const MATERIOS_CONTEXT = new Uint8Array(32)
const MC_HASH = fromHex('11'.repeat(32))
const GAME_VERSION = new TextEncoder().encode('V1')
const GOOD_SECRET = fromHex('01'.repeat(32))
const WRONG_SECRET = fromHex('02'.repeat(32))
const FIXTURE_LOVELACE = 5_000_000n
const FIXTURE_LIQUIDITY = 1_000_000n
const FIXTURE_RESERVE = 100_000n
const ORACLE_STATE_TOKEN_NAME_HEX = '4f5241434c45' // ORACLE

type NativeScript = { type: 'sig'; keyHash: string } | {
  type: 'all'
  scripts: NativeScript[]
}

function nativePolicy(keyHash: string): Script {
  return scriptFromNative({
    type: 'all',
    scripts: [{ type: 'sig', keyHash }],
  } as NativeScript)
}

const fail = (message: string): never => { throw new Error(message) }
const bytes = (hex: string): number => {
  const normalized = hex.replace(/^0x/i, '')
  if (!normalized || normalized.length % 2 !== 0 || !/^[0-9a-f]+$/i.test(normalized)) {
    return fail('Expected valid hexadecimal CBOR/bytes')
  }
  return normalized.length / 2
}
const c = (index: number, fields: any[] = []): Constr => new Constr(index, fields)
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))
const ref = (u: UTxO) => u.txHash.toLowerCase() + '#' + u.outputIndex

async function waitFor<T>(read: () => Promise<T>, predicate: (value: T) => boolean, label: string): Promise<T> {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    const value = await read()
    if (predicate(value)) return value
    await wait(1_000)
  }
  throw new Error('Timed out waiting for ' + label)
}

function poolDatum(prizeHash: string, pendingLiabilities: bigint, unresolvedReserve: bigint, unresolvedCount: bigint) {
  return c(0, [
    FIXTURE_LIQUIDITY,
    pendingLiabilities,
    unresolvedReserve,
    unresolvedCount,
    0n,
    10_000n,
    0n,
    prizeHash,
  ])
}

function prizeDatum(
  poolHash: string,
  playerCommitmentHex: string,
  commitmentHex: string,
  beaconHex: string,
  issuedAt: bigint,
  expiresAt: bigint,
  ticketNonce: bigint,
  status: 'pending' | 'revealed',
  resultHex = '',
  payout = 0n,
  prizeTier = 0,
  row1Tier = 0,
  row2Tier = 0,
) {
  return c(0, [
    '00'.repeat(28), // fixture ticket policy; no economic claim is inferred from this value
    TICKET_NAME_HEX,
    playerCommitmentHex,
    PRICE_USDM,
    commitmentHex,
    toHex(GAME_VERSION),
    ticketNonce,
    payout,
    '',
    '',
    c(status === 'pending' ? 0 : 1),
    resultHex,
    BigInt(prizeTier),
    c(0, [0n, 0n, toHex(MAINCHAIN_REF), toHex(GAME_VERSION)]),
    c(1), // BeaconReady
    beaconHex,
    toHex(MC_HASH),
    toHex(MATERIOS_CONTEXT),
    poolHash,
    issuedAt,
    expiresAt,
    BigInt(row1Tier),
    BigInt(row2Tier),
  ])
}

function inputIndicesFor(cbor: string, refs: Array<{ txHash: string; outputIndex: number }>) {
  const tx = CML.Transaction.from_cbor_hex(cbor.replace(/^0x/i, ''))
  const inputs = tx.body().inputs()
  const wanted = new Set(refs.map((r) => r.txHash.toLowerCase() + '#' + r.outputIndex))
  const found: number[] = []
  for (let i = 0; i < Number(inputs.len()); i += 1) {
    const input = inputs.get(i)
    const key = input.transaction_id().to_hex().toLowerCase() + '#' + Number(input.index())
    if (wanted.has(key)) found.push(i)
  }
  return found
}

function embeddedScriptCounts(cbor: string) {
  const tx = CML.Transaction.from_cbor_hex(cbor.replace(/^0x/i, ''))
  const ws: any = tx.witness_set()
  const count = (method: string) => {
    const collection = ws[method]?.()
    return collection == null ? 0 : Number(collection.len())
  }
  return {
    plutus_v1: count('plutus_v1_scripts'),
    plutus_v2: count('plutus_v2_scripts'),
    plutus_v3: count('plutus_v3_scripts'),
  }
}

const wallet = JSON.parse(readFileSync(WALLET_FILE, 'utf8')) as { seed?: string }
if (!wallet.seed) fail('Yaci CI wallet seed missing')
const provider = new Blockfrost(API, '')
const latestResponse = await fetch(API + '/blocks/latest')
if (!latestResponse.ok) fail('Yaci latest-block query failed: HTTP ' + latestResponse.status)
const latestBlock = await latestResponse.json() as { slot?: number; time?: number }
if (!Number.isSafeInteger(latestBlock.slot) || (latestBlock.slot ?? -1) < 0 ||
    !Number.isSafeInteger(latestBlock.time) || (latestBlock.time ?? 0) <= 0) {
  fail('Yaci latest block lacks a valid slot/time: ' + JSON.stringify(latestBlock))
}
const slotConfig = { zeroTime: latestBlock.time! * 1000, zeroSlot: latestBlock.slot!, slotLength: 1000 }
const lucid = await Lucid(provider, 'Preprod', { slotConfig })
lucid.selectWallet.fromSeed(wallet.seed)

const blueprint = JSON.parse(readFileSync(BLUEPRINT_PATH, 'utf8')) as {
  preamble?: { plutusVersion?: string }
  validators?: Array<{ title?: string; compiledCode?: string; hash?: string }>
}
if (blueprint.preamble?.plutusVersion !== 'v3') fail('Aiken native Reveal probe requires a V3 blueprint')
const revealEntries = (blueprint.validators ?? []).filter((entry) => entry.title === REVEAL_TITLE)
const poolEntries = (blueprint.validators ?? []).filter((entry) => entry.title?.endsWith(POOL_TITLE_SUFFIX))
if (revealEntries.length !== 1) fail('Expected exactly one ' + REVEAL_TITLE + ' blueprint entry')
if (poolEntries.length !== 1) fail('Expected exactly one test-only pool stub spend entry')
const revealEntry = revealEntries[0]
const poolEntry = poolEntries[0]
if (!revealEntry.compiledCode || !revealEntry.hash || !poolEntry.compiledCode || !poolEntry.hash) {
  fail('Aiken Reveal or pool-stub compiledCode/hash is missing')
}
const unparameterizedRevealScript: Script = { type: 'PlutusV3', script: revealEntry.compiledCode }
const poolScript: Script = { type: 'PlutusV3', script: poolEntry.compiledCode }
const blueprintRevealHash = validatorToScriptHash(unparameterizedRevealScript).toLowerCase()
const poolHash = validatorToScriptHash(poolScript).toLowerCase()
if (blueprintRevealHash !== revealEntry.hash.toLowerCase()) fail('Reveal blueprint/Lucid unparameterized hash mismatch')
if (poolHash !== poolEntry.hash.toLowerCase()) fail('Pool stub blueprint/Lucid script hash mismatch')
const signingAddress = await lucid.wallet().address()
const keyHash = getAddressDetails(signingAddress).paymentCredential?.hash
if (!keyHash) fail('CI test wallet has no payment key hash')
const fixtureOracleStatePolicyId = mintingPolicyToId(nativePolicy(keyHash))
const revealScript: Script = {
  type: 'PlutusV3',
  script: evolutionApplyParamsToScript(
    revealEntry.compiledCode,
    [fixtureOracleStatePolicyId, ORACLE_STATE_TOKEN_NAME_HEX, keyHash],
  ),
}
const revealHash = validatorToScriptHash(revealScript).toLowerCase()

const publication = JSON.parse(readFileSync(PUBLICATION_PATH, 'utf8')) as {
  schema?: string
  validatorHash?: string
  publicationTransactionId?: string
  referenceUtxo?: { txHash?: string; outputIndex?: number; address?: string; scriptHash?: string }
  protocolMaxTxSize?: number
  nativeLedger?: { submission?: string }
}
if (publication.schema !== 'immortal-aiken-reference-script-publication-v1' ||
    publication.nativeLedger?.submission !== 'accepted' ||
    !publication.publicationTransactionId || !publication.referenceUtxo?.address ||
    !Number.isSafeInteger(publication.referenceUtxo.outputIndex) ||
    publication.validatorHash?.toLowerCase() !== revealHash ||
    publication.referenceUtxo.scriptHash?.toLowerCase() !== revealHash ||
    publication.referenceUtxo.txHash?.toLowerCase() !== publication.publicationTransactionId.toLowerCase()) {
  fail('Prior Aiken Reveal reference-script publication evidence is not bound to this blueprint')
}
const candidateReferenceUtxos = await lucid.utxosAt(publication.referenceUtxo.address)
const providerReferenceUtxo = candidateReferenceUtxos.find((utxo) =>
  utxo.txHash.toLowerCase() === publication.publicationTransactionId!.toLowerCase() &&
  utxo.outputIndex === publication.referenceUtxo!.outputIndex,
)
if (!providerReferenceUtxo) fail('The accepted Aiken Reveal reference UTxO is not present on Yaci')
const revealReferenceInput: UTxO = { ...providerReferenceUtxo, scriptRef: revealScript }
if (validatorToScriptHash(revealReferenceInput.scriptRef as Script).toLowerCase() !== revealHash) {
  fail('Resolved reference UTxO is not bound to the compiled Aiken Reveal script')
}

const protocolParameters = await provider.getProtocolParameters()
const maxTxSize = Number(protocolParameters.maxTxSize)
if (!Number.isSafeInteger(maxTxSize) || maxTxSize <= 0) fail('Yaci protocol maxTxSize is unavailable')
// Lucid Evolution 0.6.5 exposes address derivation as a top-level helper,
 // unlike the legacy lucid.utils facade.
const revealAddress = validatorToAddress('Preprod', revealScript)
const poolAddress = validatorToAddress('Preprod', poolScript)
const walletAddress = await lucid.wallet().address()
const now = BigInt(Date.now())
const issuedAt = now
const expiresAt = now + 3_600_000n
const validTo = Number(now + 120_000n)

async function prepareFixture(ticketNonce: bigint, poolHash: string, revealHashValue: string, issuedAt: bigint, expiresAt: bigint) {
  const beaconValue = await deriveBeacon(0, 0, MAINCHAIN_REF, MC_HASH, MATERIOS_CONTEXT, GAME_VERSION)
  const playerCommitmentHex = toHex(await playerCommitment(0, Number(ticketNonce), GOOD_SECRET))
  const commitmentHex = toHex(await ticketCommitment(
    fromHex(TICKET_NAME_HEX),
    fromHex(playerCommitmentHex),
    GAME_VERSION,
    Number(ticketNonce),
    Number(PRICE_USDM),
    encodeBeaconTarget({ networkId: 0, round: 0, mainchainRef: MAINCHAIN_REF, version: GAME_VERSION }),
  ))
  const ticketSeed = await deriveTicketSeed(0, Number(ticketNonce), GOOD_SECRET, beaconValue, GAME_VERSION)
  const symbolsSeed = await deriveSymbolsSeed(ticketSeed)
  const symbols = await generateSymbols(symbolsSeed)
  const digest = await sha256(symbolsSeed)
  const expectedResult = await sha256(new Uint8Array([...field(digest), ...field(symbols)]))
  const row1Tier = classifyRowTier(symbols.slice(0, 3))
  const row2Tier = classifyRowTier(symbols.slice(3, 6))
  const prizeTier = classifyTier(symbols)
  const payout = BigInt(rowPayoutTotal(defaultPrizeTable, row1Tier, row2Tier, Number(PRICE_USDM)))
  return {
    ticketNonce,
    beaconValue,
    playerCommitmentHex,
    commitmentHex,
    symbols,
    expectedResult,
    row1Tier,
    row2Tier,
    prizeTier,
    payout,
    pendingPrizeDatum: prizeDatum(
      poolHash, playerCommitmentHex, commitmentHex, toHex(beaconValue), issuedAt, expiresAt,
      ticketNonce, 'pending',
    ),
    revealedPrizeDatum: prizeDatum(
      poolHash, playerCommitmentHex, commitmentHex, toHex(beaconValue), issuedAt, expiresAt,
      ticketNonce, 'revealed', toHex(expectedResult), payout, prizeTier, row1Tier, row2Tier,
    ),
    pendingPoolDatum: poolDatum(revealHashValue, 0n, FIXTURE_RESERVE, 1n),
    revealedPoolDatum: poolDatum(revealHashValue, payout, 0n, 0n),
  }
}
const lossFixture = await prepareFixture(1n, poolHash, revealHash, issuedAt, expiresAt)
// Deterministic vector under the existing canonical seed algorithm: nonce 7
// yields tier 1 on both rows; this is a test fixture, not an economic parameter.
const winningFixture = await prepareFixture(7n, poolHash, revealHash, issuedAt, expiresAt)
if (lossFixture.payout !== 0n) fail('Loss fixture nonce unexpectedly produced a prize payout')
if (winningFixture.payout <= 0n) fail('Winning fixture nonce did not produce a positive payout')

console.log(JSON.stringify({
  aikenRevealDiag: 'fixture-plan',
  validatorHash: revealHash,
  poolStubHash: poolHash,
  referenceScriptBytes: bytes(revealScript.script),
  poolStubBytes: bytes(poolScript.script),
  maxTxSize,
  network: 'local-yaci-conway',
  fixtureDisclaimer: 'synthetic test-only datum and lovelace; not a production ticket, pool, USDM balance, or deployment',
  loss: {
    ticketNonce: lossFixture.ticketNonce.toString(),
    payout: lossFixture.payout.toString(),
    prizeTier: lossFixture.prizeTier,
    row1Tier: lossFixture.row1Tier,
    row2Tier: lossFixture.row2Tier,
    symbols: toHex(lossFixture.symbols),
    resultHex: toHex(lossFixture.expectedResult),
  },
  winning: {
    ticketNonce: winningFixture.ticketNonce.toString(),
    payout: winningFixture.payout.toString(),
    prizeTier: winningFixture.prizeTier,
    row1Tier: winningFixture.row1Tier,
    row2Tier: winningFixture.row2Tier,
    symbols: toHex(winningFixture.symbols),
    resultHex: toHex(winningFixture.expectedResult),
  },
}, null, 2))

if (winningFixture.payout !== 200n || winningFixture.row1Tier !== 1 || winningFixture.row2Tier !== 1) {
  fail('Winning fixture diverged from the fixed canonical tier-1/tier-1 payout vector')
}

// Three independent Prize/Pool pairs: valid loss, valid non-zero payout, wrong-secret negative twin.
const bootstrap = await lucid.newTx()
  .pay.ToContract(revealAddress, { kind: 'inline', value: Data.to(lossFixture.pendingPrizeDatum) }, { lovelace: FIXTURE_LOVELACE })
  .pay.ToContract(revealAddress, { kind: 'inline', value: Data.to(winningFixture.pendingPrizeDatum) }, { lovelace: FIXTURE_LOVELACE })
  .pay.ToContract(revealAddress, { kind: 'inline', value: Data.to(lossFixture.pendingPrizeDatum) }, { lovelace: FIXTURE_LOVELACE })
  .pay.ToContract(poolAddress, { kind: 'inline', value: Data.to(lossFixture.pendingPoolDatum) }, { lovelace: FIXTURE_LOVELACE })
  .pay.ToContract(poolAddress, { kind: 'inline', value: Data.to(winningFixture.pendingPoolDatum) }, { lovelace: FIXTURE_LOVELACE })
  .pay.ToContract(poolAddress, { kind: 'inline', value: Data.to(lossFixture.pendingPoolDatum) }, { lovelace: FIXTURE_LOVELACE })
  .addSigner(walletAddress)
  .complete({ localUPLCEval: false })
const bootstrapSigned = await bootstrap.sign.withWallet().complete({ localUPLCEval: false })
const bootstrapHash = await bootstrapSigned.submit()
await lucid.awaitTx(bootstrapHash)

const prizeFixtures = await waitFor(
  () => lucid.utxosAt(revealAddress),
  (items) => items.filter((u) => u.txHash.toLowerCase() === bootstrapHash.toLowerCase()).length >= 3,
  'three Aiken Reveal fixture UTxOs',
)
const poolFixtures = await waitFor(
  () => lucid.utxosAt(poolAddress),
  (items) => items.filter((u) => u.txHash.toLowerCase() === bootstrapHash.toLowerCase()).length >= 3,
  'three Aiken pool-stub fixture UTxOs',
)
const prizes = prizeFixtures.filter((u) => u.txHash.toLowerCase() === bootstrapHash.toLowerCase()).sort((a,b) => a.outputIndex-b.outputIndex)
const pools = poolFixtures.filter((u) => u.txHash.toLowerCase() === bootstrapHash.toLowerCase()).sort((a,b) => a.outputIndex-b.outputIndex)
if (prizes.length !== 3 || pools.length !== 3) {
  fail('Could not resolve exactly three independent Prize/Pool fixture pairs')
}

async function buildReveal(prizeUtxo: UTxO, poolUtxo: UTxO, secret: Uint8Array, fixture: Awaited<ReturnType<typeof prepareFixture>>) {
  return lucid.newTx()
    .readFrom([revealReferenceInput])
    .collectFrom([prizeUtxo], Data.to(c(1, [toHex(secret)])))
    .collectFrom([poolUtxo], Data.to(c(0)))
    .attach.SpendingValidator(poolScript)
    .pay.ToContract(revealAddress, { kind: 'inline', value: Data.to(fixture.revealedPrizeDatum) }, { lovelace: prizeUtxo.assets.lovelace ?? FIXTURE_LOVELACE })
    .pay.ToContract(poolAddress, { kind: 'inline', value: Data.to(fixture.revealedPoolDatum) }, { lovelace: poolUtxo.assets.lovelace ?? FIXTURE_LOVELACE })
    .addSigner(walletAddress)
    .validTo(validTo)
    .complete({ localUPLCEval: false })
}

async function submitValidReveal(
  prizeUtxo: UTxO,
  poolUtxo: UTxO,
  fixture: Awaited<ReturnType<typeof prepareFixture>>,
  caseLabel: string,
) {
  const valid = await buildReveal(prizeUtxo, poolUtxo, GOOD_SECRET, fixture)
  const unsignedCbor = valid.toCBOR()
  const unsignedBytes = bytes(unsignedCbor)
  if (unsignedBytes > maxTxSize) fail(caseLabel + ' unsigned Reveal tx exceeds maxTxSize: ' + unsignedBytes + ' > ' + maxTxSize)
  const unsignedTx = CML.Transaction.from_cbor_hex(unsignedCbor)
  const scriptCounts = embeddedScriptCounts(unsignedCbor)
  const actualReferences = unsignedTx.body().reference_inputs?.()
  let sawRevealReference = false
  if (actualReferences) {
    for (let i=0;i<Number(actualReferences.len());i+=1) {
      const input=actualReferences.get(i)
      if (input.transaction_id().to_hex().toLowerCase() === publication.publicationTransactionId.toLowerCase() &&
          Number(input.index()) === publication.referenceUtxo.outputIndex) sawRevealReference = true
    }
  }
  if (!sawRevealReference) fail(caseLabel + ' CBOR omits the qualified Reveal reference input')
  if (scriptCounts.plutus_v1 !== 0 || scriptCounts.plutus_v2 !== 0 || scriptCounts.plutus_v3 !== 1) {
    fail(caseLabel + ' expected only the test-only pool stub in embedded PlutusV3 witnesses, got ' + JSON.stringify(scriptCounts))
  }
  const cborTx = CML.Transaction.from_cbor_hex(unsignedCbor)
  const rs: any = cborTx.witness_set().redeemers()
  const redeemers: Array<{tag:number;index:number;mem:string;steps:string}>=[]
  const legacy=rs?.as_arr_legacy_redeemer?.()
  if(legacy) for(let i=0;i<legacy.len();i+=1){const x=legacy.get(i);redeemers.push({tag:Number(x.tag()),index:Number(x.index()),mem:x.ex_units().mem().toString(),steps:x.ex_units().steps().toString()})}
  const map=rs?.as_map_redeemer_key_to_redeemer_val?.()
  if(map){const keys=map.keys();for(let i=0;i<keys.len();i+=1){const k=keys.get(i);const x=map.get(k);if(x)redeemers.push({tag:Number(k.tag()),index:Number(k.index()),mem:x.ex_units().mem().toString(),steps:x.ex_units().steps().toString()})}}
  const signed = await valid.sign.withWallet().complete({ localUPLCEval: false })
  const signedCbor = signed.toCBOR()
  const signedBytes = bytes(signedCbor)
  if (signedBytes > maxTxSize) fail(caseLabel + ' signed Reveal exceeds maxTxSize: ' + signedBytes + ' > ' + maxTxSize)
  const txHash = await signed.submit()
  await lucid.awaitTx(txHash)
  const postPrize = await waitFor(
    () => lucid.utxosAt(revealAddress),
    (items) => items.some((u) => u.txHash.toLowerCase() === txHash.toLowerCase()),
    caseLabel + ' accepted Prize output',
  )
  const postPool = await waitFor(
    () => lucid.utxosAt(poolAddress),
    (items) => items.some((u) => u.txHash.toLowerCase() === txHash.toLowerCase()),
    caseLabel + ' updated Pool output',
  )
  if (!postPrize.some((u) => u.txHash.toLowerCase() === txHash.toLowerCase()) ||
      !postPool.some((u) => u.txHash.toLowerCase() === txHash.toLowerCase())) {
    fail(caseLabel + ' did not materialize both continuing outputs')
  }
  return {
    outcome: 'accepted_by_native_ledger',
    case: caseLabel,
    transactionId: txHash,
    ticketNonce: fixture.ticketNonce.toString(),
    payout: fixture.payout.toString(),
    prizeTier: fixture.prizeTier,
    row1Tier: fixture.row1Tier,
    row2Tier: fixture.row2Tier,
    symbols: toHex(fixture.symbols),
    unsignedTransactionBytes: unsignedBytes,
    signedTransactionBytes: signedBytes,
    maxTxSize,
    embeddedScriptCounts: scriptCounts,
    revealReference: ref(revealReferenceInput),
    spentPrize: ref(prizeUtxo),
    spentPool: ref(poolUtxo),
    continuingPrizeObserved: true,
    continuingPoolObserved: true,
    executionUnits: redeemers,
  }
}

let positiveResult: Record<string, unknown> = { outcome: 'failure' }
let winningResult: Record<string, unknown> = { outcome: 'failure' }
try {
  positiveResult = await submitValidReveal(prizes[0], pools[0], lossFixture, 'valid_zero_payout_loss')
} catch (error) {
  positiveResult = { outcome: 'failure', error: (error instanceof Error ? error.message : String(error)).slice(0, 1800) }
}
try {
  winningResult = await submitValidReveal(prizes[1], pools[1], winningFixture, 'valid_nonzero_payout_win')
} catch (error) {
  winningResult = { outcome: 'failure', error: (error instanceof Error ? error.message : String(error)).slice(0, 1800) }
}

// Make the wrong-secret twin pass through transaction construction so the
// actual Conway ledger, rather than a TypeScript predicate, makes the decision.
// The diagnostic ExUnits below are a temporary in-limit budget only for this
// negative test. They are NOT cost-model evidence and never modify protocol parameters.
let negativeResult: Record<string, unknown> = { outcome: 'not_tested' }
let negativeStage = 'build'
let negativeOutcomeForJev = 'failure'
try {
  // Lucid Evolution's Blockfrost adapter returns maxTxSize/cost models here but
  // can omit the execution-unit ceilings. Read the active local Yaci Store
  // protocol-parameter endpoint directly instead of guessing or hardcoding limits.
  const rawParamsResponse = await fetch(API + '/epochs/latest/parameters')
  if (!rawParamsResponse.ok) {
    fail('Cannot read active Yaci protocol parameters for the negative twin: HTTP ' + rawParamsResponse.status)
  }
  const rawParams = await rawParamsResponse.json() as Record<string, any>
  const maxEx = (protocolParameters as any).maxTxExecutionUnits ??
    (protocolParameters as any).maxTxExUnits ??
    rawParams.maxTxExecutionUnits ??
    rawParams.maxTxExUnits ??
    {}
  const firstPositiveFinite = (...values: unknown[]) => {
    for (const value of values) {
      const parsed = typeof value === 'number' ? value :
        typeof value === 'string' && value.trim() ? Number(value) : NaN
      if (Number.isFinite(parsed) && parsed > 0 && Number.isSafeInteger(parsed)) return parsed
    }
    return NaN
  }
  const maxMem = firstPositiveFinite(
    maxEx.memory, maxEx.mem, maxEx.maxMemory,
    rawParams.max_tx_ex_mem, rawParams.maxTxExMem, rawParams.max_tx_execution_memory,
  )
  const maxSteps = firstPositiveFinite(
    maxEx.steps, maxEx.maxSteps,
    rawParams.max_tx_ex_steps, rawParams.maxTxExSteps, rawParams.max_tx_execution_steps,
  )
  if (!Number.isFinite(maxMem) || !Number.isFinite(maxSteps) || maxMem <= 0 || maxSteps <= 0) {
    fail('Cannot construct an in-limit diagnostic ExUnits budget from active Yaci protocol parameters; keys=' +
      Object.keys(rawParams).sort().join(','))
  }
  const mockMem = Math.floor(maxMem * 0.45)
  const mockSteps = Math.floor(maxSteps * 0.45)
  const evaluateProvider = provider as Blockfrost & { evaluateTx: (tx: string) => Promise<any[]> }
  const originalEvaluateTx = evaluateProvider.evaluateTx.bind(provider)
  evaluateProvider.evaluateTx = async (tx: string) => {
    const indices = inputIndicesFor(tx, [
      { txHash: prizes[2].txHash, outputIndex: prizes[2].outputIndex },
      { txHash: pools[2].txHash, outputIndex: pools[2].outputIndex },
    ])
    if (indices.length !== 2) fail('Could not locate both script input indices for the negative twin')
    return indices.map((redeemer_index) => ({
      redeemer_tag: 'spend',
      redeemer_index,
      ex_units: { mem: mockMem, steps: mockSteps },
    }))
  }
  try {
    const negative = await buildReveal(prizes[2], pools[2], WRONG_SECRET, lossFixture)
    const unsignedCbor = negative.toCBOR()
    const size = bytes(unsignedCbor)
    if (size > maxTxSize) fail('Wrong-secret twin exceeds maxTxSize: ' + size + ' > ' + maxTxSize)
    const signed = await negative.sign.withWallet().complete({ localUPLCEval: false })
    const signedCbor = signed.toCBOR()
    negativeStage = 'submit'
    const txHash = await signed.submit()
    await lucid.awaitTx(txHash)
    negativeResult = {
      outcome: 'unexpectedly_accepted',
      transactionId: txHash,
      signedTransactionBytes: bytes(signedCbor),
      maxTxSize,
    }
    negativeOutcomeForJev = 'failure'
  } catch (error) {
    const message = (error instanceof Error ? error.message : String(error)).slice(0, 2500)
    const ledgerRejected = negativeStage === 'submit' &&
      /validationtagmismatch|plutusfailure|txsubmiterror|utxofailure|script.*fail|validation.*fail|transaction rejected/i.test(message)
    negativeOutcomeForJev = ledgerRejected ? 'success' : 'failure'
    negativeResult = {
      outcome: ledgerRejected ? 'rejected_by_native_ledger' : 'rejected_before_native_ledger_submission',
      stage: negativeStage,
      error: message,
      diagnosticExUnits: { perScriptMemory: mockMem, perScriptSteps: mockSteps, maxTxMemory: maxMem, maxTxSteps: maxSteps, source: API + '/epochs/latest/parameters' },
      limitation: 'Diagnostic ExUnits were supplied only to construct the intentional invalid twin; no cost-model or successful-negative execution-cost claim is made.',
    }
  } finally {
    evaluateProvider.evaluateTx = originalEvaluateTx
  }
} catch (error) {
  negativeOutcomeForJev = 'failure'
  negativeResult = { outcome: 'failure', stage: negativeStage, error: (error instanceof Error ? error.message : String(error)).slice(0, 1800) }
}

const overall = positiveResult.outcome === 'accepted_by_native_ledger' &&
  winningResult.outcome === 'accepted_by_native_ledger' &&
  negativeResult.outcome === 'rejected_by_native_ledger' ? 'PASS' : 'FAIL'
const report = {
  schema: 'immortal-aiken-reveal-ledger-probe-v1',
  workflowStage: 'isolated-aiken-v3-ledger-loss-win-and-negative-twins',
  network: 'local-yaci-conway',
  validator: {
    title: REVEAL_TITLE,
    languageVersion: 'v3',
    hash: revealHash,
    compiledScriptBytes: bytes(revealScript.script),
    publicationTransactionId: publication.publicationTransactionId,
    publicationReferenceUtxo: ref(revealReferenceInput),
  },
  testOnlyPoolStub: { hash: poolHash, compiledScriptBytes: bytes(poolScript.script), productionValidator: false },
  fixture: {
    bootstrapTransactionId: bootstrapHash,
    priceUsdmSubunits: PRICE_USDM.toString(),
    lovelacePerFixtureUtxo: FIXTURE_LOVELACE.toString(),
    totalLiquidityDatumSubunits: FIXTURE_LIQUIDITY.toString(),
    initialReserveDatumSubunits: FIXTURE_RESERVE.toString(),
    inputDatumEncoding: 'inline',
    outputDatumEncoding: 'inline',
    syntheticOnly: true,
    fixtureCases: {
      lossTicketNonce: lossFixture.ticketNonce.toString(),
      lossPayoutSubunits: lossFixture.payout.toString(),
      winningTicketNonce: winningFixture.ticketNonce.toString(),
      winningPayoutSubunits: winningFixture.payout.toString(),
      negativeTwinUsesLossFixture: true,
    },
  },
  protocol: {
    maxTxSize,
    executionUnitsForPositive: 'measured by Yaci/Lucid transaction build',
    negativeTwinExecutionUnits: 'diagnostic in-limit budget only; not resource qualification',
  },
  positive: positiveResult,
  winning: winningResult,
  negative: negativeResult,
  overallResult: overall,
  productionMigration: 'NOT_AUTHORIZED',
  deploymentGateClosed: true,
  limitations: [
    'This is an isolated Aiken Plutus V3 fixture, not the production Haskell Plutus V2 validator.',
    'It covers a zero-payout loss and one deterministic tier-1/tier-1 non-zero-payout vector; it is not full differential test coverage.',
    'The PrizePool validator is a test-only always-true stub; this does not qualify the production B1PrizePool validator.',
    'Fixture datum values and lovelace are synthetic and must not be represented as qualified USDM or an issued production ticket.',
    'A negative twin counts as a native-ledger rejection only if the submission stage is reached and the ledger rejects the transaction.',
    'The diagnostic ExUnits budget used for the negative twin is not execution-cost evidence.',
    'Full Haskell/Aiken differential equivalence, all datum/redeemer states, active V2/V3 compatibility, and complete production transaction resource limits remain open.',
  ],
}
writeFileSync(EVIDENCE_PATH, JSON.stringify(report, null, 2) + '\n')

if (process.env.GITHUB_OUTPUT) {
  const jevPositive = positiveResult.outcome === 'accepted_by_native_ledger' ? 'success' : 'failure'
  const jevWinning = winningResult.outcome === 'accepted_by_native_ledger' ? 'success' : 'failure'
  const jevNegative = negativeOutcomeForJev
  writeFileSync(process.env.GITHUB_OUTPUT, [
    'positive_outcome=' + jevPositive,
    'winning_outcome=' + jevWinning,
    'negative_outcome=' + jevNegative,
    'overall_result=' + overall,
  ].join('\n') + '\n', { flag: 'a' })
}
console.log(JSON.stringify({ aikenRevealDiag: 'ledger-positive-negative-result', ...report }, null, 2))
if (overall !== 'PASS') process.exitCode = 1
