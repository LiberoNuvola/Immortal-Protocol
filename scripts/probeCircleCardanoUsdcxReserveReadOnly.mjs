#!/usr/bin/env node
/**
 * Read-only Circle xReserve / Cardano USDCx reconciliation snapshot.
 * No wallet, signature, burn, withdrawal, transaction submission, approval,
 * deployment, Oracle update, or protocol integration. HTTP POSTs are limited
 * to read-only Koios account resolution and Ethereum JSON-RPC query methods.
 *
 * Circle /balances is an EXPECTED balance based on deposits. The xReserve
 * contract's balanceOfNativeCollateral(USDC, remoteDomain) view is used to
 * read the domain-specific available collateral from GatewayWallet's
 * RemoteDomainDepositor accounting. The GatewayWallet ERC20 balance remains
 * aggregate and is not allocated to Cardano alone. No USD/USDM price is inferred.
 */
import { createHash } from 'node:crypto'
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import {
  STAKE_ADDRESS, resolvePaymentAddresses, queryIogAddress,
} from './probeUsdcx450kIogWithdrawalsReadOnly.mjs'

export const CIRCLE = 'https://xreserve-api.circle.com'
export const KOIOS = 'https://api.koios.rest/api/v1'
export const ETH_RPC = 'https://ethereum-rpc.publicnode.com'
export const CARDANO_DOMAIN = 10004
export const USDCX_POLICY = '1f3aec8bfe7ea4fe14c5f121e2a92e301afe414147860d557cac7e34'
export const USDCX_NAME = '5553444378'
export const USDCX_UNIT = USDCX_POLICY + USDCX_NAME
export const REMOTE_TOKEN_ID = '0x9ea9794d33dbcef3f77718e903816e877ab2577f4d7ee653638f1f60fc671dd6'
export const USDC = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'
export const TRANSFER_TOPIC = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef'
export const ZERO_TOPIC = '0x' + '0'.repeat(64)
const MAX_BYTES = 12_000_000
const TIMEOUT = 30_000

const sha256 = (value) => createHash('sha256').update(value).digest('hex')

async function parseResponse(response, label) {
  const body = await response.text()
  if (Buffer.byteLength(body, 'utf8') > MAX_BYTES) throw new Error(label + '_TOO_LARGE')
  if (!response.ok) throw new Error(label + '_HTTP_' + response.status)
  let value
  try { value = JSON.parse(body) } catch { throw new Error(label + '_INVALID_JSON') }
  return {
    value, meta: {
      httpStatus: response.status,
      httpDate: response.headers?.get?.('date') ?? null,
      contentRange: response.headers?.get?.('content-range') ?? null,
      responseBytes: Buffer.byteLength(body, 'utf8'),
      responseSha256: sha256(body),
    },
  }
}

async function getJson(url, label, fetchFn) {
  const response = await fetchFn(url, {
    method: 'GET', headers: { accept: 'application/json' },
    signal: AbortSignal.timeout(TIMEOUT), redirect: 'error',
  })
  return parseResponse(response, label)
}

async function rpc(method, params, fetchFn) {
  const response = await fetchFn(ETH_RPC, {
    method: 'POST',
    headers: { accept: 'application/json', 'content-type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
    signal: AbortSignal.timeout(TIMEOUT), redirect: 'error',
  })
  const { value, meta } = await parseResponse(response, 'ETH_RPC_' + method)
  if (value.error || !Object.prototype.hasOwnProperty.call(value, 'result')) {
    throw new Error('ETH_RPC_' + method + '_INVALID_RESULT')
  }
  return { result: value.result, meta }
}

export function decimalAtomic(value, decimals = 6) {
  if (typeof value !== 'string' || !/^\d+(?:\.\d+)?$/.test(value)) {
    throw new Error('DECIMAL_STRING_INVALID')
  }
  const [whole, fraction = ''] = value.split('.')
  if (fraction.length > decimals) throw new Error('DECIMAL_PRECISION_EXCEEDED')
  return (BigInt(whole) * 10n ** BigInt(decimals) +
    BigInt((fraction + '0'.repeat(decimals)).slice(0, decimals) || '0'))
}

export function decimalDisplay(value, decimals = 6) {
  const n = BigInt(value), scale = 10n ** BigInt(decimals)
  return (n / scale).toString() + '.' + (n % scale).toString().padStart(decimals, '0')
}

export function decodeCircleInfo(info) {
  if (!Array.isArray(info?.remoteDomains) || !Array.isArray(info?.sourceDomains)) {
    throw new Error('CIRCLE_INFO_SHAPE_INVALID')
  }
  const remote = info.remoteDomains.find(x => Number(x?.domain) === CARDANO_DOMAIN)
  const token = (remote?.tokens ?? []).find(x =>
    x?.remoteToken === 'USDCx' && x?.associatedNativeToken === 'USDC')
  if (!remote || !token) throw new Error('CIRCLE_CARDANO_USDCX_MAPPING_MISSING')
  const sourceContracts = [...new Map(info.sourceDomains
    .filter(x => String(x?.chain).toLowerCase() === 'ethereum' &&
      String(x?.network).toLowerCase() === 'mainnet' &&
      Array.isArray(x?.tokens) && x.tokens.includes('USDC') &&
      /^0x[0-9a-f]{40}$/i.test(x?.contractAddress ?? ''))
    .map(x => [x.contractAddress.toLowerCase(), {
      domain: Number(x.domain), contractAddress: x.contractAddress, tokens: x.tokens,
    }])).values()]
  return {
    remoteDomain: Number(remote.domain),
    remoteChain: remote.chain ?? null,
    remoteNetwork: remote.network ?? null,
    remoteToken: token.remoteToken,
    associatedNativeToken: token.associatedNativeToken,
    remoteTokenIdentifier: token.remoteTokenIdentifier ?? null,
    remoteTokenIdentifierMatches:
      String(token.remoteTokenIdentifier ?? '').toLowerCase() === REMOTE_TOKEN_ID.toLowerCase(),
    ethereumMainnetSourceContracts: sourceContracts,
  }
}

export function decodeExpectedBalance(payload) {
  const rows = (payload?.balances ?? []).filter(x => x?.token === 'USDC')
  if (rows.length !== 1) throw new Error('CIRCLE_USDC_BALANCE_CARDINALITY_INVALID')
  const atomic = decimalAtomic(rows[0].balance, 6)
  return {
    rawBalance: rows[0].balance,
    expectedBalanceAtomic: atomic.toString(),
    expectedBalanceUsdc: decimalDisplay(atomic),
    classification: 'EXPECTED_DOMAIN_BALANCE_NOT_DIRECT_RESERVE_READ',
  }
}

export function decodeKoiosHistory(payload) {
  if (!Array.isArray(payload)) throw new Error('KOIOS_HISTORY_SHAPE_INVALID')
  const rows = payload.filter(x =>
    String(x?.policy_id ?? '').toLowerCase() === USDCX_POLICY &&
    String(x?.asset_name ?? '').toLowerCase() === USDCX_NAME)
  if (rows.length !== 1) throw new Error('KOIOS_EXACT_USDCX_HISTORY_NOT_UNIQUE')
  // Koios /asset_history represents both mint and burn operations in the
  // single minting_txs array; burns are signed negative quantities. There is
  // no separate burning_txs array in the documented response schema.
  const events = rows[0].minting_txs
  if (!Array.isArray(events)) throw new Error('KOIOS_MINTING_TXS_ARRAY_MISSING')
  const seen = new Set()
  const parsed = events.map(x => {
    if (typeof x?.tx_hash !== 'string' || !/^[0-9a-f]{64}$/i.test(x.tx_hash) ||
        typeof x?.quantity !== 'string' || !/^-?\d+$/.test(x.quantity)) {
      throw new Error('KOIOS_HISTORY_EVENT_INVALID')
    }
    const hash = x.tx_hash.toLowerCase()
    if (seen.has(hash)) throw new Error('KOIOS_HISTORY_DUPLICATE_TX')
    seen.add(hash)
    return {
      hash,
      quantity: BigInt(x.quantity),
      blockTime: Number.isSafeInteger(Number(x.block_time)) ? Number(x.block_time) : null,
    }
  })
  const mintEvents = parsed.filter(x => x.quantity > 0n)
  const burnEvents = parsed.filter(x => x.quantity < 0n)
  const minted = mintEvents.reduce((s, x) => s + x.quantity, 0n)
  const burned = burnEvents.reduce((s, x) => s - x.quantity, 0n)
  if (burned > minted) throw new Error('KOIOS_NET_SUPPLY_NEGATIVE')
  const all = parsed.filter(x => x.blockTime !== null).sort((a,b) => b.blockTime - a.blockTime)
  const latest = all[0]
  return {
    unit: USDCX_UNIT, decimals: 6,
    totalEventCount: parsed.length,
    mintEventCount: mintEvents.length, burnEventCount: burnEvents.length,
    grossMintedAtomic: minted.toString(), grossBurnedAtomic: burned.toString(),
    netSupplyAtomic: (minted-burned).toString(),
    netSupplyUsdcx: decimalDisplay(minted-burned),
    latestEvent: latest ? {
      txHash:latest.hash, kind:latest.quantity < 0n ? 'BURN' : 'MINT',
      blockTime:latest.blockTime, quantityAtomic:latest.quantity.toString(),
    } : null,
    completeness: 'RETURNED_KOIOS_HISTORY_ONLY_NOT_INDEPENDENTLY_CERTIFIED',
  }
}

function word(value) {
  return BigInt(value).toString(16).padStart(64, '0')
}

export function balanceOfData(address) {
  if (typeof address !== 'string' || !/^0x[0-9a-f]{40}$/i.test(address)) {
    throw new Error('TOKEN_HOLDER_ADDRESS_INVALID')
  }
  return '0x70a08231' + address.slice(2).toLowerCase().padStart(64, '0')
}

export function gatewayWalletCallData() {
  return '0x131b4c0e'
}

export function remoteDomainDepositorCallData(remoteDomain = CARDANO_DOMAIN) {
  return '0xfc31b97c' + word(remoteDomain)
}

export function remoteTokenCallData(remoteDomain, localToken = USDC) {
  if (typeof localToken !== 'string' || !/^0x[0-9a-f]{40}$/i.test(localToken)) {
    throw new Error('LOCAL_TOKEN_ADDRESS_INVALID')
  }
  return '0xb3467549' + word(remoteDomain) + localToken.slice(2).toLowerCase().padStart(64, '0')
}

export function balanceOfNativeCollateralCallData(localToken = USDC, remoteDomain = CARDANO_DOMAIN) {
  if (typeof localToken !== 'string' || !/^0x[0-9a-f]{40}$/i.test(localToken)) {
    throw new Error('LOCAL_TOKEN_ADDRESS_INVALID')
  }
  return '0xc47cf5ef' + localToken.slice(2).toLowerCase().padStart(64, '0') + word(remoteDomain)
}

export function decodeAddressResult(value, label) {
  if (typeof value !== 'string' || !/^0x[0-9a-f]{64}$/i.test(value)) {
    throw new Error(label + '_ABI_ADDRESS_INVALID')
  }
  const address = '0x' + value.slice(-40)
  if (/^0x0{40}$/i.test(address)) throw new Error(label + '_ABI_ADDRESS_ZERO')
  return address
}

export function decodeBytes32Result(value, label) {
  if (typeof value !== 'string' || !/^0x[0-9a-f]{64}$/i.test(value)) {
    throw new Error(label + '_ABI_BYTES32_INVALID')
  }
  return value.toLowerCase()
}

export function decodeUint256Result(value, label) {
  if (typeof value !== 'string' || !/^0x[0-9a-f]+$/i.test(value)) {
    throw new Error(label + '_ABI_UINT256_INVALID')
  }
  return BigInt(value)
}

export function decodeUsdcMintLogs(receipt, txHash) {
  if (!receipt || String(receipt.transactionHash ?? '').toLowerCase() !== txHash.toLowerCase()) {
    throw new Error('ETH_RECEIPT_TX_HASH_MISMATCH')
  }
  if (receipt.status !== '0x1') return {status:'TX_NOT_SUCCESS',mints:[]}
  const mints = (receipt.logs ?? []).filter(log =>
    String(log.address ?? '').toLowerCase() === USDC.toLowerCase() &&
    String(log.topics?.[0] ?? '').toLowerCase() === TRANSFER_TOPIC &&
    String(log.topics?.[1] ?? '').toLowerCase() === ZERO_TOPIC
  ).map(log => {
    if (!/^0x[0-9a-f]{64}$/i.test(log.topics?.[2] ?? '') ||
        !/^0x[0-9a-f]+$/i.test(log.data ?? '')) throw new Error('ETH_USDC_MINT_LOG_INVALID')
    const atomic = BigInt(log.data)
    return {recipient:'0x'+log.topics[2].slice(-40),amountAtomic:atomic.toString(),amountUsdc:decimalDisplay(atomic)}
  })
  return {status:mints.length ? 'USDC_MINT_LOGS_FOUND' : 'NO_USDC_MINT_LOG',mints}
}

async function capture(fn) {
  try { return {status:'OBSERVED',...(await fn())} }
  catch (e) { return {status:'SOURCE_UNAVAILABLE_OR_INVALID',error:e?.message ?? 'UNKNOWN_ERROR'} }
}

async function observeCardanoDomainCollateral(xReserveAddress, rpcFetchFn) {
  const chainId = await rpc('eth_chainId', [], rpcFetchFn)
  if (chainId.result !== '0x1') throw new Error('ETHEREUM_CHAIN_ID_NOT_MAINNET')
  const blockNumber = await rpc('eth_blockNumber', [], rpcFetchFn)
  const code = await rpc('eth_getCode', [xReserveAddress, blockNumber.result], rpcFetchFn)
  if (typeof code.result !== 'string' || code.result === '0x' || /^0x0*$/i.test(code.result)) {
    throw new Error('XRESERVE_PROXY_NO_CODE')
  }

  const gatewayWalletResult = await rpc('eth_call', [
    {to:xReserveAddress,data:gatewayWalletCallData()}, blockNumber.result,
  ], rpcFetchFn)
  const gatewayWallet = decodeAddressResult(gatewayWalletResult.result, 'GATEWAY_WALLET')

  const depositorResult = await rpc('eth_call', [
    {to:xReserveAddress,data:remoteDomainDepositorCallData(CARDANO_DOMAIN)}, blockNumber.result,
  ], rpcFetchFn)
  const remoteDomainDepositor = decodeAddressResult(depositorResult.result, 'REMOTE_DOMAIN_DEPOSITOR')

  const tokenResult = await rpc('eth_call', [
    {to:xReserveAddress,data:remoteTokenCallData(CARDANO_DOMAIN,USDC)}, blockNumber.result,
  ], rpcFetchFn)
  const remoteTokenIdentifier = decodeBytes32Result(tokenResult.result, 'REMOTE_TOKEN')
  if (remoteTokenIdentifier !== REMOTE_TOKEN_ID.toLowerCase()) {
    throw new Error('XRESERVE_CARDANO_REMOTE_TOKEN_IDENTITY_MISMATCH')
  }

  const collateralResult = await rpc('eth_call', [
    {to:xReserveAddress,data:balanceOfNativeCollateralCallData(USDC,CARDANO_DOMAIN)},
    blockNumber.result,
  ], rpcFetchFn)
  const domainAvailableAtomic = decodeUint256Result(collateralResult.result, 'DOMAIN_COLLATERAL')

  const aggregateBalanceResult = await rpc('eth_call', [
    {to:USDC,data:balanceOfData(gatewayWallet)}, blockNumber.result,
  ], rpcFetchFn)
  const aggregateGatewayWalletAtomic = decodeUint256Result(aggregateBalanceResult.result, 'GATEWAY_WALLET_USDC_BALANCE')

  const block = await rpc('eth_getBlockByNumber', [blockNumber.result,false], rpcFetchFn)
  return {
    xReserveAddress,
    gatewayWallet,
    remoteDomainDepositor,
    remoteDomain:CARDANO_DOMAIN,
    localToken:USDC,
    remoteTokenIdentifier,
    remoteTokenIdentityMatches:true,
    xReserveBlockNumber:blockNumber.result,
    xReserveBlockHash:block.result?.hash ?? null,
    xReserveBlockTimestamp:block.result?.timestamp ?? null,
    domainAvailableCollateralAtomic:domainAvailableAtomic.toString(),
    domainAvailableCollateralUsdc:decimalDisplay(domainAvailableAtomic),
    gatewayWalletAggregateUsdcAtomic:aggregateGatewayWalletAtomic.toString(),
    gatewayWalletAggregateUsdc:decimalDisplay(aggregateGatewayWalletAtomic),
    scope:'XRESERVE_BALANCE_OF_NATIVE_COLLATERAL_FOR_CARDANO_DOMAIN_PLUS_AGGREGATE_GATEWAY_WALLET_CONTEXT',
    semantics:'xReserve.balanceOfNativeCollateral delegates to GatewayWallet.availableBalance(localToken, RemoteDomainDepositor[remoteDomain])',
  }
}

async function observeReceipt(txHash, rpcFetchFn) {
  const receipt = await rpc('eth_getTransactionReceipt',[txHash],rpcFetchFn)
  if (receipt.result === null) return {txHash,status:'RECEIPT_NOT_FOUND'}
  const decoded = decodeUsdcMintLogs(receipt.result,txHash)
  return {txHash,blockNumber:receipt.result.blockNumber,...decoded}
}

export async function runProbe({fetchFn=fetch,rpcFetchFn=fetch,now=()=>new Date(),stakeAddress=STAKE_ADDRESS}={}) {
  const startedAt=now().toISOString()
  const tipBefore=await capture(async()=>{
    const {value,meta}=await getJson(KOIOS+'/tip','KOIOS_TIP_BEFORE',fetchFn)
    return {tip:Array.isArray(value)?value[0]:value,meta,observedAt:now().toISOString()}
  })
  const circleInfo=await capture(async()=>{
    const {value,meta}=await getJson(CIRCLE+'/v1/info','CIRCLE_INFO',fetchFn)
    return {...decodeCircleInfo(value),meta,observedAt:now().toISOString()}
  })
  const circleBalance=await capture(async()=>{
    const {value,meta}=await getJson(CIRCLE+'/v1/balances/'+CARDANO_DOMAIN,'CIRCLE_EXPECTED_BALANCE',fetchFn)
    return {...decodeExpectedBalance(value),meta,observedAt:now().toISOString()}
  })
  const koiosHistory=await capture(async()=>{
    const url=KOIOS+'/asset_history?_asset_policy='+USDCX_POLICY+'&_asset_name='+USDCX_NAME
    const {value,meta}=await getJson(url,'KOIOS_ASSET_HISTORY',fetchFn)
    return {...decodeKoiosHistory(value),meta,observedAt:now().toISOString()}
  })
  const domainCollateral=[]
  if(circleInfo.status==='OBSERVED') for(const source of circleInfo.ethereumMainnetSourceContracts) {
    domainCollateral.push(await capture(()=>observeCardanoDomainCollateral(source.contractAddress,rpcFetchFn)))
  }
  const iog=await capture(async()=>{
    const resolved=await resolvePaymentAddresses(stakeAddress,fetchFn)
    const rows=[]
    for(const address of resolved.addresses) rows.push(await queryIogAddress(address,fetchFn))
    return {stakeAddress,paymentAddressCount:resolved.addresses.length,addressResolutionSha256:resolved.responseSha256,
      addressesQueried:rows,exactBurnMatches:rows.flatMap(x=>x.matches.map(m=>({...m,paymentAddress:x.address}))),
      observedAt:now().toISOString()}
  })
  const receipts=[]
  if(iog.status==='OBSERVED') {
    const hashes=[...new Set(iog.exactBurnMatches.map(x=>x.ethereumTxHash).filter(Boolean))]
    for(const hash of hashes) receipts.push(await capture(()=>observeReceipt(hash,rpcFetchFn)))
  }
  const tipAfter=await capture(async()=>{
    const {value,meta}=await getJson(KOIOS+'/tip','KOIOS_TIP_AFTER',fetchFn)
    return {tip:Array.isArray(value)?value[0]:value,meta,observedAt:now().toISOString()}
  })
  const expected=circleBalance.status==='OBSERVED'?BigInt(circleBalance.expectedBalanceAtomic):null
  const supply=koiosHistory.status==='OBSERVED'?BigInt(koiosHistory.netSupplyAtomic):null
  const availableBalances=domainCollateral.filter(x=>x.status==='OBSERVED')
    .map(x=>BigInt(x.domainAvailableCollateralAtomic))
  const available=availableBalances.length?availableBalances.reduce((a,b)=>a+b,0n):null
  const gatewayBalances=domainCollateral.filter(x=>x.status==='OBSERVED')
    .map(x=>BigInt(x.gatewayWalletAggregateUsdcAtomic))
  const gatewayAggregate=gatewayBalances.length?gatewayBalances.reduce((a,b)=>a+b,0n):null
  const out={
    schema:'IMMORTAL-CIRCLE-CARDANO-USDCX-RESERVE-READONLY-v1',
    classification:'READ_ONLY_CROSS_SOURCE_RECONCILIATION_NOT_RESERVE_ORACLE_QUALIFICATION',
    startedAt,completedAt:now().toISOString(),
    network:{cardano:'mainnet',ethereum:'mainnet',cardanoRemoteDomain:CARDANO_DOMAIN},
    sources:{tipBefore,circleInfo,circleExpectedBalance:circleBalance,koiosAssetHistory:koiosHistory,
      ethereumCardanoDomainCollateral:domainCollateral,iogWithdrawalHistory:iog,ethereumReceipts:receipts,tipAfter},
    reconciliation:{
      circleExpectedUsdcAtomic:expected?.toString()??null,
      koiosNetUsdcxSupplyAtomic:supply?.toString()??null,
      expectedMinusNetSupplyAtomic:expected===null||supply===null?null:(expected-supply).toString(),
      xReserveCardanoAvailableCollateralAtomic:available?.toString()??null,
      xReserveCardanoAvailableCollateralUsdc:available===null?null:decimalDisplay(available),
      expectedMinusDomainAvailableAtomic:expected===null||available===null?null:(expected-available).toString(),
      gatewayWalletAggregateUsdcAtomic:gatewayAggregate?.toString()??null,
      classification:'CIRCLE_EXPECTED_BALANCE_VS_XRESERVE_DOMAIN_AVAILABLE_BALANCE; GATEWAY_WALLET_TOKEN_BALANCE_IS_AGGREGATE; NOT_A_COVERAGE_OR_REDEMPTION_QUALIFICATION',
    },
    limitations:[
      'Circle /v1/balances/{remoteDomain} is an expected balance based on deposits, not a direct reserve-contract read.',
      'The GatewayWallet ERC20 USDC balance is aggregate; the xReserve balanceOfNativeCollateral view is the domain-specific available balance.',
      'Koios asset_history is an indexer-returned mint/burn history; completeness and atomicity with other sources are not certified.',
      'IOG withdrawal-history is an observed Portal backend GET route, not a published/versioned third-party API contract.',
      'IOG finalized status is independently checked against exact Ethereum USDC mint Transfer logs when an Ethereum transaction hash exists.',
      'No USD/USDM price, USDCx/USD peg, redemption entitlement, collateral ratio, or under-collateralization conclusion is inferred.',
      'No wallet, signature, burn, withdrawal request, transaction submission, approval, deployment, or Oracle update is performed.',
    ],
  }
  return out
}

async function main() {
  const args=process.argv.slice(2), i=args.indexOf('--out')
  const outPath=resolve(i>=0&&args[i+1]?args[i+1]:'audit/oracles/circle-cardano-usdcx-reserve-readonly.json')
  const value=await runProbe()
  const serialized=JSON.stringify(value,null,2)+'\n'
  await mkdir(dirname(outPath),{recursive:true})
  await writeFile(outPath,serialized,{mode:0o600})
  console.log(JSON.stringify({
    output:outPath,
    circleInfo:value.sources.circleInfo.status,
    expectedBalance:value.sources.circleExpectedBalance.status,
    koiosHistory:value.sources.koiosAssetHistory.status,
    domainCollateralCount:value.sources.ethereumCardanoDomainCollateral.filter(x=>x.status==='OBSERVED').length,
    iogMatches:value.sources.iogWithdrawalHistory.exactBurnMatches?.length??0,
    receiptChecks:value.sources.ethereumReceipts.length,
    reconciliation:value.reconciliation,
    sha256:sha256(serialized),
  },null,2))
}

if(process.argv[1]&&import.meta.url===new URL('file://'+resolve(process.argv[1])).href) {
  main().catch(error=>{console.error(JSON.stringify({error:error?.message??'UNKNOWN_ERROR'}));process.exitCode=1})
}
