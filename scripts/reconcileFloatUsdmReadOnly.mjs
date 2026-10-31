#!/usr/bin/env node
/**
 * Float exact-USDM market census vs Koios Minswap V2 and Minswap API.
 * Identity/pair/coverage comparison only; no price, USD conversion or oracle qualification.
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { apiAssetUnit, apiMinswapLpUnit, compareFloatReservesToDatum } from './lib/floatPoolIdentity.mjs'

const USDM = 'c48cbb3d5e57ed56e276bc45f99ab39abe94e6cd7ac39fb402da47ad0014df105553444d'
const FLOAT_USDM = 'c48cbb3d5e57ed56e276bc45f99ab39abe94e6cd7ac39fb402da47ad.0014df105553444d'
const LP_POLICY = 'f5808c2c990d86da54bfc97d89cee6efa20cd8461616359478d96b4c'
const arg = (a, f, d) => { const i=a.indexOf(f); return resolve(i>=0&&a[i+1]?a[i+1]:d) }
const datumUnit = x => String(x?.policyId??'').toLowerCase()+String(x?.assetNameHex??'').toLowerCase()
const floatUnit = x => { const s=String(x??'').toLowerCase(); if(s==='ada.lovelace')return ''; const i=s.indexOf('.'); return i<0?s:s.slice(0,i)+s.slice(i+1) }
const pair = (a,b) => [a,b].sort().join(':')
const read = p => readFile(p,'utf8').then(JSON.parse)

async function main() {
  const a=process.argv.slice(2)
  const [f,o,m]=await Promise.all([
    read(arg(a,'--float','audit/float/float-usdm-readonly.json')),
    read(arg(a,'--onchain','audit/onchain/minswap-v2-usdm-utxos-readonly.json')),
    read(arg(a,'--api','audit/api/minswap-usdm-readonly.json')),
  ])
  const out=arg(a,'--out','audit/oracles/float-usdm-cross-indexer-reconciliation.json')
  if(f.status!=='OBSERVED_EXACT_USDM_CONFIRMED_CHAIN_MARKETS'||f.exactAssetMatches!==true||
     f.providerMeta?.finality!=='confirmed'||f.providerAssetId?.toLowerCase()!==FLOAT_USDM||
     f.decimals!==6||o.network!=='cardano-mainnet'||m.network!=='cardano-mainnet')
    throw new Error('FLOAT_USDM_IDENTITY_FINALITY_OR_NETWORK_UNVERIFIED')
  if(m.exactAsset?.policyId?.toLowerCase()!==USDM.slice(0,56)||m.exactAsset?.assetNameHex?.toLowerCase()!==USDM.slice(56))
    throw new Error('MINSWAP_API_EXACT_ASSET_MISMATCH')

  const venueCounts={}
  const direct=[]
  const floatV2=new Map()
  const duplicateFloat=[]
  for(const x of f.markets??[]){
    const v=String(x.venue??'UNKNOWN'); venueCounts[v]=(venueCounts[v]??0)+1
    const a1=floatUnit(x.assets?.a),b1=floatUnit(x.assets?.b)
    if(pair(a1,b1)===pair('',USDM)) direct.push({id:x.id,venue:v,stale:x.stale===true,reserves:x.reserves??null,fee:x.fee??null})
    if(v==='minswap-v2'){
      const key=String(x.id??'').startsWith('minswap-v2:')?String(x.id).slice('minswap-v2:'.length).toLowerCase():null
      if(!key)continue
      if(floatV2.has(key))duplicateFloat.push(key); else floatV2.set(key,x)
    }
  }
  // Minswap API identifies the LP token by its full policy+asset-name unit.
  // Float's market id suffix and the Koios candidate key are the pool LP name
  // only; join the API record through the full unit on the matched UTxO.
  const apiV2=new Map((m.pools??[]).filter(x=>x.protocol==='MinswapV2')
    .map(x=>[apiMinswapLpUnit(x),x]).filter(([unit])=>unit))
  const chain=new Map(),unqualified=[]
  for(const c of o.candidates??[]){
    const v=c.datumValidation??{},lp=v.lpAsset
    if(v.status!=='MATCH'||!v.datum||!lp){unqualified.push({utxoRef:c.utxoRef,status:v.status??'UNKNOWN',reasons:v.reasons??[]});continue}
    if(String(lp.policyId??'').toLowerCase()!==LP_POLICY){unqualified.push({utxoRef:c.utxoRef,status:'LP_POLICY_MISMATCH',reasons:[]});continue}
    const k=String(lp.assetNameHex??'').toLowerCase()
    if(!chain.has(k))chain.set(k,[])
    chain.get(k).push(c)
  }
  const matches=[],floatOnly=[],chainOnly=[],pairMismatch=[],apiPairMismatch=[],floatReserveMismatch=[],apiPoolNotFound=[]
  let floatReserveExactMatchCount=0,apiPoolFoundCount=0,apiPairMatchCount=0
  for(const [k,x] of floatV2){
    const cs=chain.get(k)
    if(!cs?.length){floatOnly.push({poolKey:k,marketId:x.id});continue}
    for(const c of cs){
      const d=c.datumValidation.datum
      const fp=pair(floatUnit(x.assets?.a),floatUnit(x.assets?.b))
      const cp=pair(datumUnit(d.assetA),datumUnit(d.assetB))
      const lp=v.lpAsset
      const ap=apiV2.get(datumUnit(lp))
      const apair=ap?pair(apiAssetUnit(ap.assetA),apiAssetUnit(ap.assetB)):null
      const reserveMatch=compareFloatReservesToDatum(x,d)
      const row={poolKey:k,lpAssetUnit:datumUnit(lp),utxoRef:c.utxoRef,floatMarketId:x.id,floatStale:x.stale===true,floatPair:fp,onchainPair:cp,apiPair:apair,floatReservesRaw:x.reserves??null,datumReservesRaw:{a:String(d.reserveARaw),b:String(d.reserveBRaw)},floatReservesExactlyMatchDatum:reserveMatch,apiPoolFound:Boolean(ap)}
      if(reserveMatch===true)floatReserveExactMatchCount+=1
      else if(reserveMatch===false)floatReserveMismatch.push(row)
      if(ap)apiPoolFoundCount+=1
      else apiPoolNotFound.push({poolKey:k,lpAssetUnit:datumUnit(lp),floatMarketId:x.id,utxoRef:c.utxoRef})
      if(fp!==cp)pairMismatch.push(row)
      else if(apair&&apair!==cp)apiPairMismatch.push(row)
      else {
        if(apair===cp)apiPairMatchCount+=1
        matches.push(row)
      }
    }
  }
  for(const [k,cs] of chain)if(!floatV2.has(k))for(const c of cs)chainOnly.push({poolKey:k,utxoRef:c.utxoRef})

  const result={
    schema:'immortal-float-usdm-cross-indexer-reconciliation-v1',
    classification:'CROSS_INDEXER_POOL_IDENTITY_AND_PAIR_COVERAGE_NOT_PRICE_OR_ORACLE_QUALIFICATION',
    network:'cardano-mainnet',
    exactAsset:{policyId:USDM.slice(0,56),assetNameHex:USDM.slice(56),decimals:6},
    sources:{
      float:{source:f.source,startedAt:f.startedAt,completedAt:f.completedAt,http:f.http,providerMeta:f.providerMeta,confidence:f.providerConfidence,rawBodySha256:f.rawResponse?.bodySha256??null},
      koios:{provider:o.provider,startedAt:o.startedAt,completedAt:o.completedAt},
      minswapApi:{source:m.source,startedAt:m.startedAt,completedAt:m.completedAt,poolCount:m.poolCount},
    },
    summary:{
      floatUsdmMarkets:(f.markets??[]).length,floatVenueCount:Object.keys(venueCounts).length,floatMarketsByVenue:venueCounts,
      floatDirectAdaUsdm:direct.length,floatDirectAdaUsdmFresh:direct.filter(x=>!x.stale).length,floatDirectAdaUsdmStale:direct.filter(x=>x.stale).length,
      floatMinswapV2:floatV2.size,koiosMinswapV2:chain.size,minswapApiV2:apiV2.size,
      floatKoiosIdentityAndPairMatches:matches.length,floatOnlyVsKoios:floatOnly.length,koiosOnlyVsFloat:chainOnly.length,
      floatReserveExactMatches:floatReserveExactMatchCount,floatReserveMismatches:floatReserveMismatch.length,
      apiPoolFoundCount,apiPoolNotFoundCount:apiPoolNotFound.length,apiPairMatches:apiPairMatchCount,
      floatPairMismatches:pairMismatch.length,apiPairMismatches:apiPairMismatch.length,duplicateFloatKeys:duplicateFloat.length,onchainUnqualified:unqualified.length,
    },
    directAdaUsdmMarkets:direct,matches,floatOnly,chainOnly,pairMismatch,floatReserveMismatch,apiPairMismatch,apiPoolNotFound,duplicateFloat,unqualified,
    limitations:[
      'Float is an additional Cardano market-data indexer associated with Sundae Labs, not a separate DEX venue.',
      'Missing markets are provider coverage differences, not proof that on-chain pools do not exist.',
      'Float reserve equality is checked against the Minswap V2 PoolDatum reserve fields for joined pools; it does not validate executable depth, other DEX venue reserve semantics, or USD conversion.',
      'Stale markets are preserved but not treated as live liquidity.',
      'Only quote=ada data is used; no USDM/USD peg or oracle output is derived.',
      'No wallet, signing, transaction, chain write, oracle refresh, EEV or deployment action occurs.',
    ],
  }
  await mkdir(dirname(out),{recursive:true})
  await writeFile(out,JSON.stringify(result,null,2)+'\n','utf8')
  console.log(JSON.stringify({status:'FLOAT_USDM_CROSS_INDEXER_RECONCILIATION_COMPLETE',output:out,summary:result.summary,completedAt:new Date().toISOString()},null,2))
}
main().catch(e=>{console.error(JSON.stringify({status:'FLOAT_USDM_CROSS_INDEXER_RECONCILIATION_FAILED',error:e instanceof Error?e.message:String(e)},null,2));process.exitCode=1})
