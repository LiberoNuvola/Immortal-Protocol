import test from 'node:test'
import assert from 'node:assert/strict'
import {
  USDCX_POLICY,USDCX_NAME,USDCX_UNIT,REMOTE_TOKEN_ID,CARDANO_DOMAIN,USDC,TRANSFER_TOPIC,ZERO_TOPIC,
  decimalAtomic,decimalDisplay,decodeCircleInfo,decodeExpectedBalance,decodeKoiosHistory,balanceOfData,decodeUsdcMintLogs,
} from './probeCircleCardanoUsdcxReserveReadOnly.mjs'

const contract='0x8888888199b2df864bf678259607d6d5ebb4e3ce'

test('binds the exact Cardano remote-domain USDCx identifier and source contract',()=>{
 const x=decodeCircleInfo({
  remoteDomains:[{chain:'Cardano',network:'Mainnet',domain:CARDANO_DOMAIN,tokens:[{
   remoteToken:'USDCx',associatedNativeToken:'USDC',remoteTokenIdentifier:REMOTE_TOKEN_ID
  }]}],
  sourceDomains:[{chain:'Ethereum',network:'Mainnet',domain:0,contractAddress:contract,tokens:['USDC']}]
 })
 assert.equal(x.remoteDomain,10004)
 assert.equal(x.remoteTokenIdentifierMatches,true)
 assert.equal(x.ethereumMainnetSourceContracts[0].contractAddress,contract)
 assert.equal(USDCX_UNIT,USDCX_POLICY+USDCX_NAME)
})

test('does not accept a ticker-only or wrong remote-domain token',()=>{
 assert.throws(()=>decodeCircleInfo({
  remoteDomains:[{domain:10004,tokens:[{remoteToken:'USDM',associatedNativeToken:'USDC'}]}],
  sourceDomains:[{chain:'Ethereum',network:'Mainnet',contractAddress:contract,tokens:['USDC']}]
 }),/MAPPING_MISSING/)
})

test('parses expected balance using exact token decimals',()=>{
 const x=decodeExpectedBalance({balances:[{token:'USDC',balance:'39925160.413646'}]})
 assert.equal(x.expectedBalanceAtomic,'39925160413646')
 assert.equal(x.expectedBalanceUsdc,'39925160.413646')
 assert.equal(decimalAtomic('1.25'),'1250000')
 assert.equal(decimalDisplay(1250000n),'1.250000')
 assert.throws(()=>decimalAtomic('1.0000001'),/PRECISION/)
})

test('derives net USDCx supply from exact mint and burn event quantities',()=>{
 const x=decodeKoiosHistory([{
  policy_id:USDCX_POLICY,asset_name:USDCX_NAME,
  minting_txs:[{tx_hash:'a'.repeat(64),quantity:'1500000',block_time:10}],
  burning_txs:[{tx_hash:'b'.repeat(64),quantity:'-250000',block_time:20}],
 }])
 assert.equal(x.netSupplyAtomic,'1250000')
 assert.equal(x.netSupplyUsdcx,'1.250000')
 assert.equal(x.mintEventCount,1)
 assert.equal(x.burnEventCount,1)
 assert.equal(x.latestEvent.kind,'BURN')
})

test('rejects incomplete or ambiguous history rows',()=>{
 assert.throws(()=>decodeKoiosHistory([]),/NOT_UNIQUE/)
 assert.throws(()=>decodeKoiosHistory([{
  policy_id:USDCX_POLICY,asset_name:USDCX_NAME,
  minting_txs:[{tx_hash:'a'.repeat(64),quantity:'10'}],
  burning_txs:[{tx_hash:'a'.repeat(64),quantity:'-1'}],
 }]),/DUPLICATE_TX/)
})

test('builds ERC20 balanceOf calldata for the source contract',()=>{
 const data=balanceOfData(contract)
 assert.equal(data.slice(0,10),'0x70a08231')
 assert.equal(data.length,74)
 assert.equal(data.slice(-40),contract.slice(2).toLowerCase())
})

test('only counts native USDC mint Transfer events from the zero address',()=>{
 const tx='0x'+'c'.repeat(64)
 const receipt={transactionHash:tx,status:'0x1',logs:[{
  address:USDC,
  topics:[TRANSFER_TOPIC,ZERO_TOPIC,'0x'+'0'.repeat(24)+'1'.repeat(40)],
  data:'0x'+(449998n*1000000n).toString(16),
 },{
  address:'0x'+'f'.repeat(40),
  topics:[TRANSFER_TOPIC,ZERO_TOPIC,'0x'+'0'.repeat(64)],data:'0x1'
 }]}
 const x=decodeUsdcMintLogs(receipt,tx)
 assert.equal(x.status,'USDC_MINT_LOGS_FOUND')
 assert.equal(x.mints.length,1)
 assert.equal(x.mints[0].amountUsdc,'449998.000000')
 assert.throws(()=>decodeUsdcMintLogs(receipt,'0x'+'d'.repeat(64)),/TX_HASH_MISMATCH/)
})
