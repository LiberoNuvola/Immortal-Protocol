/**
 * T3 — real Yaci ledger boundary trace for B1 TicketIssued.
 *
 * Uses an isolated, explicitly synthetic 1:1 USDM fixture. This exercises
 * the compiled B1PrizePool validator's TicketIssued branch only; it does not
 * claim to exercise production MintPolicy, economic admission, or EEV.
 *
 * Expected result with 400,000 USDM subunits and price=100 subunits:
 *   Issues 1..8 accepted; Issue 9 rejected by the 500x solvency invariant.
 */
import {
  Constr, Data, Lucid, Blockfrost, getAddressDetails, scriptFromNative,
  mintingPolicyToId, validatorToScriptHash, validatorToAddress,
  type Script, type UTxO,
} from '@lucid-evolution/lucid'
import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { buildScriptsFromLucid } from '../../src/loadValidator'
import { defaultPrizeTable } from '../../src/gameRules'

const API = 'http://127.0.0.1:8080/api/v1'
const SEED = 'test test test test test test test test test test test test test test test test test test test test test test test sauce'
const PRICE_USDM = 100n
const LIQUIDITY_USDM = 400_000n
const POOL_TOKEN_NAME_HEX = '504f4f4c'
const ORACLE_TOKEN_NAME_HEX = '4f5241434c45'
const GAME_VERSION = new TextEncoder().encode('V1')
const ZERO32 = new Uint8Array(32)
const OUT = 'audit/yaci-evidence'

function c(index: number, fields: any[] = []): any { return new Constr(index, fields) }
function ref(u: UTxO): string { return u.txHash + '#' + u.outputIndex }
function hashJson(value: unknown): string {
  return createHash('sha256').update(JSON.stringify(value, (_k, v) => typeof v === 'bigint' ? v.toString() : v)).digest('hex')
}
function nativePolicy(keyHash: string): Script {
  return scriptFromNative({ type: 'all', scripts: [{ type: 'sig', keyHash }] } as any)
}
function poolDatum(prizeHash: string, liquidity: bigint, reserve: bigint, count: bigint): any {
  return c(0, [liquidity, 0n, reserve, count, 0n, 10_000n, 0n, prizeHash])
}
const wallet = JSON.parse(readFileSync('/tmp/immortal-yaci-test-wallet.json', 'utf8'))
const provider = new Blockfrost(API, '')
const latest = await (await fetch(API + '/blocks/latest')).json() as { slot: number; time: number }
if (!Number.isSafeInteger(latest.slot) || !Number.isSafeInteger(latest.time)) throw new Error('Yaci latest block lacks slot/time')
const lucid = await Lucid(provider, 'Preprod', { slotConfig: { zeroTime: latest.time * 1000, zeroSlot: latest.slot, slotLength: 1000 } })
lucid.selectWallet.fromSeed(SEED)
const address = await lucid.wallet().address()
const keyHash = getAddressDetails(address).paymentCredential?.hash
if (!keyHash) throw new Error('test wallet has no payment key hash')
const testPolicy = nativePolicy(keyHash)
const testPolicyId = mintingPolicyToId(testPolicy)
const poolUnit = testPolicyId + POOL_TOKEN_NAME_HEX
const liquidityUnit = testPolicyId + '5553444d'
const scripts = buildScriptsFromLucid(
  { ...lucid, utils: { validatorToScriptHash, mintingPolicyToId, validatorToAddress: (script: Script) => validatorToAddress('Preprod', script) } } as any,
  defaultPrizeTable, keyHash, testPolicyId, ORACLE_TOKEN_NAME_HEX, testPolicyId, POOL_TOKEN_NAME_HEX,
)
if (!scripts.b1PrizePoolAddress || !scripts.prizeAddress || !scripts.b1PrizePoolHash) throw new Error('failed to derive B1 script addresses/hashes')

function prizeDatum(ticketNameHex: string, now: bigint): any {
  return c(0, [
    testPolicyId, ticketNameHex, '22'.repeat(32), PRICE_USDM,
    '33'.repeat(32), Buffer.from(GAME_VERSION).toString('hex'), 1n, 0n,
    '', '', c(0), '', 0n, c(0, [0n, 0n, Buffer.from(ZERO32).toString('hex'), Buffer.from(GAME_VERSION).toString('hex')]),
    c(1), '', '44'.repeat(32), Buffer.from(ZERO32).toString('hex'), scripts.b1PrizePoolHash,
    now, now + 86_400_000n, 0n, 0n,
  ])
}
mkdirSync(OUT, { recursive: true })
const now = BigInt(Date.now())
const bootstrap = await lucid.newTx()
  .mintAssets({ [poolUnit]: 1n, [liquidityUnit]: LIQUIDITY_USDM }, Data.void())
  .attach.MintingPolicy(testPolicy)
  .pay.ToContract(scripts.b1PrizePoolAddress, { kind: 'inline', value: Data.to(poolDatum(scripts.prizeHash, LIQUIDITY_USDM, 0n, 0n)) }, { lovelace: 10_000_000n, [poolUnit]: 1n, [liquidityUnit]: LIQUIDITY_USDM })
  .addSigner(address)
  .complete({ localUPLCEval: false })
const bootstrapSigned = await bootstrap.sign.withWallet().complete({ localUPLCEval: false })
const bootstrapHash = await bootstrapSigned.submit()
await lucid.awaitTx(bootstrapHash)
let poolUtxos = await lucid.utxosAt(scripts.b1PrizePoolAddress)
let pool = poolUtxos.find(u => u.assets[poolUnit] === 1n)
if (!pool) throw new Error('bootstrapped singleton Pool UTxO not found')
const initialPoolReference = ref(pool)
const accepted: Array<{ issue: number; txHash: string; poolRef: string; reserve: string; count: string }> = []
for (let issue = 1; issue <= 8; issue++) {
  const nameHex = '54335449434b4554' + issue.toString(16).padStart(2, '0')
  const ticketUnit = testPolicyId + nameHex
  const nextReserve = BigInt(issue) * PRICE_USDM
  const tx = await lucid.newTx()
    .collectFrom([pool], Data.to(c(1, [PRICE_USDM])))
    .attach.SpendingValidator(scripts.b1PrizePool)
    .mintAssets({ [ticketUnit]: 1n }, Data.void())
    .attach.MintingPolicy(testPolicy)
    .pay.ToContract(scripts.b1PrizePoolAddress, { kind: 'inline', value: Data.to(poolDatum(scripts.prizeHash, LIQUIDITY_USDM, nextReserve, BigInt(issue))) }, pool.assets)
    .pay.ToContract(scripts.prizeAddress, { kind: 'inline', value: Data.to(prizeDatum(nameHex, now + BigInt(issue))) }, { lovelace: 3_000_000n, [ticketUnit]: 1n })
    .addSigner(address)
    .complete({ localUPLCEval: false })
  const signed = await tx.sign.withWallet().complete({ localUPLCEval: false })
  const txHash = await signed.submit()
  await lucid.awaitTx(txHash)
  poolUtxos = await lucid.utxosAt(scripts.b1PrizePoolAddress)
  const next = poolUtxos.find(u => u.txHash === txHash && u.assets[poolUnit] === 1n)
  if (!next) throw new Error('Issue ' + issue + ' accepted but continuing Pool output was not observed')
  pool = next
  accepted.push({ issue, txHash, poolRef: ref(pool), reserve: nextReserve.toString(), count: String(issue) })
  console.log(JSON.stringify({ event: 'T3_ISSUE_ACCEPTED', ...accepted[accepted.length - 1] }))
}
if (pool.assets[liquidityUnit] !== LIQUIDITY_USDM) throw new Error('Pool physical fixture liquidity changed unexpectedly')
const ninthNameHex = '54335449434b4554' + '09'
const ninthTicketUnit = testPolicyId + ninthNameHex
let ninthRejected = false
let rejectionStage = ''
let rejectionError = ''
let ninthTxHash: string | null = null
try {
  rejectionStage = 'build'
  const tx = await lucid.newTx()
    .collectFrom([pool], Data.to(c(1, [PRICE_USDM])))
    .attach.SpendingValidator(scripts.b1PrizePool)
    .mintAssets({ [ninthTicketUnit]: 1n }, Data.void())
    .attach.MintingPolicy(testPolicy)
    .pay.ToContract(scripts.b1PrizePoolAddress, { kind: 'inline', value: Data.to(poolDatum(scripts.prizeHash, LIQUIDITY_USDM, 9n * PRICE_USDM, 9n)) }, pool.assets)
    .pay.ToContract(scripts.prizeAddress, { kind: 'inline', value: Data.to(prizeDatum(ninthNameHex, now + 9n)) }, { lovelace: 3_000_000n, [ninthTicketUnit]: 1n })
    .addSigner(address)
    .complete({ localUPLCEval: false })
  rejectionStage = 'sign'
  const signed = await tx.sign.withWallet().complete({ localUPLCEval: false })
  rejectionStage = 'submit'
  ninthTxHash = await signed.submit()
  await lucid.awaitTx(ninthTxHash)
} catch (error) {
  ninthRejected = true
  rejectionError = error instanceof Error ? error.message : String(error)
}
if (!ninthRejected || rejectionStage !== 'submit') {
  throw new Error('T3 inconclusive: ninth Issue was not rejected during ledger submission; stage=' + rejectionStage + '; error=' + rejectionError)
}
const evidence = {
  fixture: 'T3-B1-TICKET-ISSUED-500X-BOUNDARY',
  environment: 'local-yaci-devnet',
  scope: 'B1PrizePool TicketIssued validator only; synthetic 1:1 USDM fixture; production MintPolicy/economic admission not covered',
  bootstrapHash,
  testPolicyId,
  poolUnit,
  liquidityUnit,
  initialPoolReference,
  liquiditySubunits: LIQUIDITY_USDM.toString(),
  priceSubunits: PRICE_USDM.toString(),
  accepted,
  eighthExposureSubunits: (500n * 8n * PRICE_USDM).toString(),
  ninthExposureSubunits: (500n * 9n * PRICE_USDM).toString(),
  ninthRejected,
  rejectionStage,
  rejectionError,
  ninthTxHash,
  finalPoolReference: ref(pool),
  finalPoolAssets: Object.fromEntries(Object.entries(pool.assets).map(([k,v]) => [k, v.toString()])),
  evidenceDigest: hashJson({ bootstrapHash, accepted, ninthRejected, rejectionStage, rejectionError, finalPool: ref(pool) }),
}
writeFileSync(OUT + '/ticket-issued-solvency-boundary.json', JSON.stringify(evidence, null, 2))
console.log(JSON.stringify({ event: 'T3_BOUNDARY_EVIDENCE', ...evidence }, null, 2))
