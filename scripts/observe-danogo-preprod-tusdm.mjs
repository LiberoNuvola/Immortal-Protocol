#!/usr/bin/env node
/** Read-only exact Preprod tUSDM / Danogo CLMM discovery. Never derives a quote or submits. */
import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

export const CONFIG = Object.freeze({
  network: 'cardano-preprod', networkId: 0,
  sdkCommit: '0416dc1f3531ce77eec7664ea3947f192a3aca40',
  poolScriptHash: '04041c3c6ba87b33f2c9eb7f7dbeae3b26003c3e199d438bb99932a2',
  poolScriptOutRef: '2e19cca74e3badcab26aef7574aa1885ba97228a254ca227ba2f79f2b75fd136#0',
  protocolConfigOutRef: '3775af36f485f9c97101ee5b9b360c34f0f8e12186bc9060f358b7fc8ce468a4#0',
  koios: 'https://preprod.koios.rest/api/v1',
});
export const TUSDM = Object.freeze({
  policyId: 'e675b46e4d2242c991a8932a99db3044e80515ae14b4c4ccf6b3f4c9',
  assetNameHex: '0014df10745553444d', decimals: 6,
});
export const TUSDM_UNIT = TUSDM.policyId + TUSDM.assetNameHex;
const LIMIT = 1000, MAX_PAGES = 20, TIMEOUT_MS = 45000;
const CHARSET = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l';
const sha256 = x => createHash('sha256').update(x).digest('hex');
const asInt = (x, n) => { const v = BigInt(x?.int ?? x); if (v < 0n) throw Error(n + '_NEGATIVE'); return v; };
const fields = (x, n) => { if (!x || x.constructor !== 0 || !Array.isArray(x.fields)) throw Error(n + '_CONSTRUCTOR_INVALID'); return x.fields; };
const bytes = (x, n) => { if (typeof x?.bytes !== 'string' || !/^(?:[0-9a-f]{2})*$/i.test(x.bytes)) throw Error(n + '_BYTES_INVALID'); return x.bytes.toLowerCase(); };
function assetClass(x, n) {
  if (!Array.isArray(x?.list) || x.list.length !== 2) throw Error(n + '_ASSET_CLASS_INVALID');
  const p = bytes(x.list[0], n + '_POLICY'), a = bytes(x.list[1], n + '_NAME');
  return { policyId: p, assetNameHex: a, unit: p || a ? p + a : 'lovelace' };
}
function ratio(x, n) {
  const f = fields(x, n); if (f.length !== 2) throw Error(n + '_FIELDS_INVALID');
  const numerator = asInt(f[0], n + '_NUM'), denominator = asInt(f[1], n + '_DEN');
  if (!numerator || !denominator) throw Error(n + '_NONPOSITIVE');
  return { numerator: numerator.toString(), denominator: denominator.toString() };
}
export function parsePoolDatum(x) {
  const f = fields(x, 'DANOGO_POOL_DATUM');
  if (f.length !== 12) throw Error('DANOGO_POOL_DATUM_FIELD_COUNT_INVALID');
  const tokenX = assetClass(f[0], 'TOKEN_X'), tokenY = assetClass(f[1], 'TOKEN_Y');
  if (tokenX.unit === tokenY.unit) throw Error('DANOGO_POOL_IDENTICAL_ASSETS');
  const fee = asInt(f[2], 'LP_FEE_RATE'); if (fee > 10000n) throw Error('DANOGO_LP_FEE_OUT_OF_RANGE');
  const n = (v, label) => asInt(v, label).toString();
  return {
    tokenX, tokenY, lpFeeRate: fee.toString(),
    platformFeeX: n(f[3], 'PLATFORM_FEE_X'), platformFeeY: n(f[4], 'PLATFORM_FEE_Y'),
    totalSwapFee: n(f[5], 'TOTAL_SWAP_FEE'), sqrtLowerPrice: ratio(f[6], 'LOWER_PRICE'),
    sqrtUpperPrice: ratio(f[7], 'UPPER_PRICE'), minXChange: n(f[8], 'MIN_X'),
    minYChange: n(f[9], 'MIN_Y'), circulatingLPToken: n(f[10], 'LP_SUPPLY'),
    lastWithdrawEpoch: n(f[11], 'LAST_EPOCH'),
  };
}
function polymod(vs) {
  const gen = [0x3b6a57b2,0x26508e6d,0x1ea119fa,0x3d4233dd,0x2a1462b3]; let c = 1;
  for (const v of vs) { const top = c >>> 25; c = ((c & 0x1ffffff) << 5) ^ v; for (let i=0;i<5;i++) if ((top >>> i)&1) c ^= gen[i]; }
  return c >>> 0;
}
function convertBits(data, from, to, pad) {
  let acc=0,bits=0,out=[]; const mask=(1<<to)-1;
  for (const v of data) { if(v<0 || (v>>>from)!==0) throw Error('BECH32_RANGE'); acc=(acc<<from)|v; bits+=from; while(bits>=to){bits-=to;out.push((acc>>>bits)&mask);} }
  if(pad&&bits) out.push((acc<<(to-bits))&mask); else if(bits>=from || ((acc<<(to-bits))&mask)!==0) throw Error('BECH32_PADDING');
  return out;
}
export function decodeAddress(address) {
  if (typeof address !== 'string') return null;
  const p=address.lastIndexOf('1'); if(p<1 || p+7>=address.length) return null;
  const hrp=address.slice(0,p), words=[];
  for(const c of address.slice(p+1).toLowerCase()){const n=CHARSET.indexOf(c);if(n<0)return null;words.push(n);}
  const expanded=[...hrp].map(c=>c.charCodeAt(0)>>>5).concat([0],[...hrp].map(c=>c.charCodeAt(0)&31));
  if(polymod(expanded.concat(words))!==1) return null;
  const payload=Buffer.from(convertBits(words.slice(0,-6),5,8,false)); if(payload.length<29)return null;
  const h=payload[0], type=h>>>4;
  return {hrp,networkId:h&15,type,paymentCredential:payload.subarray(1,29).toString('hex'),isScript:[1,3,5,7].includes(type)};
}
const outRef = r => String(r.tx_hash).toLowerCase() + '#' + Number(r.tx_index);
function assetMap(row) {
  const result={lovelace:BigInt(String(row.value??'0'))};
  for(const a of row.asset_list??[]){
    const unit=String(a.policy_id??'').toLowerCase()+String(a.asset_name??'').toLowerCase();
    if(!/^[0-9a-f]{56}(?:[0-9a-f]{0,64})$/.test(unit)||result[unit]!==undefined)throw Error('ASSET_LIST_INVALID_OR_DUPLICATE');
    result[unit]=BigInt(String(a.quantity));
  }
  return result;
}
export function classifyRow(row) {
  const id=outRef(row), credential=String(row.payment_cred??'').toLowerCase(), address=decodeAddress(row.address);
  if(!address||address.hrp!=='addr_test'||address.networkId!==0||address.paymentCredential!==credential)throw Error('ADDRESS_CREDENTIAL_NETWORK_MISMATCH');
  if(!address.isScript)return {status:'NON_SCRIPT_ADDRESS',outRef:id};
  const value=assetMap(row);
  if(credential!==CONFIG.poolScriptHash){
    const hasApprovedTusdm=(value[TUSDM_UNIT]??0n)>0n,hasAda=value.lovelace>0n;
    const hasDatum=!!(row.inline_datum?.bytes||row.inline_datum?.hash||row.datum_hash);
    if(hasApprovedTusdm&&hasAda&&hasDatum)return {
      status:'OTHER_SCRIPT_TUSDM_ADA_UTXO',outRef:id,address:row.address,paymentCredential:credential,
      pair:['lovelace',TUSDM_UNIT],assets:Object.fromEntries(Object.entries(value).map(([k,v])=>[k,v.toString()])),
      datumHash:row.inline_datum?.hash??row.datum_hash??null,
      datumBytesHash:row.inline_datum?.bytes?sha256(Buffer.from(row.inline_datum.bytes,'hex')):null,
      classification:'SCRIPT_UTXO_NOT_CLASSIFIED_AS_POOL',
    };
    return {status:'OTHER_SCRIPT',outRef:id};
  }
  const datum=parsePoolDatum(row.inline_datum?.value);
  if(datum.tokenX.unit!==TUSDM_UNIT&&datum.tokenY.unit!==TUSDM_UNIT)return {status:'OTHER_DANOGO_PAIR',outRef:id,pair:[datum.tokenX.unit,datum.tokenY.unit]};
  const nfts=Object.entries(value).filter(([unit,qty])=>unit.startsWith(CONFIG.poolScriptHash)&&qty===1n);
  if(nfts.length!==1)throw Error('POOL_NFT_SINGLETON_INVALID');
  if((value[datum.tokenX.unit]??0n)<=0n||(value[datum.tokenY.unit]??0n)<=0n)throw Error('PAIR_ASSET_MISSING');
  return {
    status:'EXACT_TUSDM_POOL_CANDIDATE',outRef:id,address:row.address,paymentCredential:credential,
    pair:[datum.tokenX.unit,datum.tokenY.unit],poolNftUnit:nfts[0][0],
    assets:Object.fromEntries(Object.entries(value).map(([k,v])=>[k,v.toString()])),
    datum,datumHash:row.inline_datum?.hash??row.datum_hash??null,
    datumBytesHash:row.inline_datum?.bytes?sha256(Buffer.from(row.inline_datum.bytes,'hex')):null,
  };
}
async function getJson(base,path,{method='GET',body,fetchImpl=fetch}={}) {
  const url=base+path,res=await fetchImpl(url,{method,headers:{accept:'application/json',...(body?{'content-type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(TIMEOUT_MS)});
  const raw=await res.text(),evidence={url,method,status:res.status,date:res.headers.get('date'),bodyBytes:Buffer.byteLength(raw),bodySha256:sha256(raw),...(res.ok?{}:{responseBodyExcerpt:raw.slice(0,3000)})};
  if(!res.ok)throw Object.assign(Error('KOIOS_HTTP_'+res.status),{evidence});
  let json;try{json=JSON.parse(raw);}catch{throw Object.assign(Error('KOIOS_JSON_INVALID'),{evidence});}
  return {json,evidence};
}
async function readTip(base,fetchImpl) {
  const {json,evidence}=await getJson(base,'/tip',{fetchImpl}),r=Array.isArray(json)?json[0]:json;
  const slot=String(r?.abs_slot??r?.absolute_slot??r?.slot??''),hash=String(r?.hash??r?.block_hash??'').toLowerCase();
  if(!/^\d+$/.test(slot)||!/^[0-9a-f]{64}$/.test(hash))throw Error('KOIOS_TIP_INVALID');
  return {tip:{slot,hash,height:String(r.block_no??r.block_height??'')},evidence};
}
async function scanAsset(base,fetchImpl) {
  const rows=[],pages=[];let complete=false;
  for(let offset=0;offset<LIMIT*MAX_PAGES;offset+=LIMIT){
    const {json,evidence}=await getJson(base,'/asset_utxos?limit='+LIMIT+'&offset='+offset,{method:'POST',body:{_asset_list:[[TUSDM.policyId,TUSDM.assetNameHex]],_extended:true},fetchImpl});
    if(!Array.isArray(json))throw Error('ASSET_UTXOS_NOT_ARRAY');
    pages.push({...evidence,rows:json.length,offset});
    for(const row of json){if(!(row.asset_list??[]).some(a=>String(a.policy_id).toLowerCase()+String(a.asset_name).toLowerCase()===TUSDM_UNIT))throw Error('ASSET_QUERY_RETURNED_FOREIGN_ROW');rows.push(row);}
    if(json.length<LIMIT){complete=true;break;}
  }
  if(!complete)throw Error('ASSET_SCAN_LIMIT_REACHED');
  const refs=new Set();for(const row of rows){const k=outRef(row);if(refs.has(k))throw Error('DUPLICATE_OUTREF');refs.add(k);}
  return {rows,pages};
}
async function recheckMany(base,candidates,fetchImpl) {
  const reads=[];
  for(let offset=0;offset<candidates.length;offset+=40){
    const batch=candidates.slice(offset,offset+40);
    const {json,evidence}=await getJson(base,'/utxo_info',{method:'POST',body:{_utxo_refs:batch.map(c=>c.outRef),_extended:true},fetchImpl});
    if(!Array.isArray(json))throw Error('UTXO_INFO_NOT_ARRAY');
    for(const candidate of batch){
      const matches=json.filter(r=>outRef(r)===candidate.outRef);
      if(matches.length!==1){reads.push({status:'BLOCKED_OUTREF_NOT_UNIQUE_LIVE',count:matches.length,evidence});continue;}
      const row=matches[0],v=assetMap(row),assetsMatch=JSON.stringify(Object.entries(candidate.assets).sort())===JSON.stringify(Object.entries(Object.fromEntries(Object.entries(v).map(([k,n])=>[k,n.toString()]))).sort());
      const raw=row.inline_datum?.bytes,datumBytesHash=raw?sha256(Buffer.from(raw,'hex')):null;
      const datumMatch=candidate.datumBytesHash?datumBytesHash===candidate.datumBytesHash:!!candidate.datumHash&&(row.inline_datum?.hash??row.datum_hash)===candidate.datumHash;
      const a=decodeAddress(row.address),credentialMatch=row.address===candidate.address&&String(row.payment_cred).toLowerCase()===candidate.paymentCredential&&a?.paymentCredential===candidate.paymentCredential&&a.networkId===0&&a.isScript;
      const captureDatum = candidate.classification === 'SCRIPT_UTXO_NOT_CLASSIFIED_AS_POOL';
      reads.push({
        status:assetsMatch&&datumMatch&&credentialMatch?'LIVE_EXACT_UTXO_RECHECKED_NOT_PRICE_QUALIFIED':'BLOCKED_SECOND_READ_MISMATCH',
        assetsMatch,datumMatch,credentialMatch:!!credentialMatch,evidence,
        ...(captureDatum ? {
          inlineDatumValue:row.inline_datum?.value??null,
          inlineDatumBytesHex:raw??null,
          inlineDatumHash:row.inline_datum?.hash??row.datum_hash??null,
        } : {}),
      });
    }
  }
  return reads;
}
export async function observe({base=CONFIG.koios,fetchImpl=fetch}={}) {
  const startedAt=new Date().toISOString(),before=await readTip(base,fetchImpl),scan=await scanAsset(base,fetchImpl);
  const candidates=[],otherPairs=[],otherScriptCandidates=[],unqualified=[],otherScriptUnqualified=[];
  for(const row of scan.rows){
    const credential=String(row.payment_cred??'').toLowerCase();
    try{
      const c=classifyRow(row);
      if(c.status==='EXACT_TUSDM_POOL_CANDIDATE')candidates.push(c);
      else if(c.status==='OTHER_DANOGO_PAIR')otherPairs.push(c);
      else if(c.status==='OTHER_SCRIPT_TUSDM_ADA_UTXO')otherScriptCandidates.push(c);
    }catch(e){
      const failure={outRef:outRef(row),paymentCredential:credential,error:e.message};
      if(credential===CONFIG.poolScriptHash)unqualified.push(failure);else otherScriptUnqualified.push(failure);
    }
  }
  const reads=await recheckMany(base,candidates,fetchImpl);
  const otherReads=await recheckMany(base,otherScriptCandidates,fetchImpl);
  const after=await readTip(base,fetchImpl),confirmed=reads.filter(x=>x.status==='LIVE_EXACT_UTXO_RECHECKED_NOT_PRICE_QUALIFIED').length;
  const otherConfirmed=otherReads.filter(x=>x.status==='LIVE_EXACT_UTXO_RECHECKED_NOT_PRICE_QUALIFIED').length;
  const unchanged=before.tip.slot===after.tip.slot&&before.tip.hash===after.tip.hash;
  const status=!candidates.length?(unqualified.length?'DANOGO_SCAN_HAS_UNQUALIFIED_ROWS':'NO_EXACT_DANOGO_PREPROD_TUSDM_POOL_FOUND'):confirmed===candidates.length&&!unqualified.length?'EXACT_DANOGO_PREPROD_TUSDM_POOL_UTXOS_OBSERVED_NOT_PRICE_QUALIFIED':'DANOGO_TUSDM_CANDIDATES_NOT_FULLY_RECHECKED';
  const credentialCounts=Object.entries(otherScriptCandidates.reduce((acc,c)=>{acc[c.paymentCredential]=(acc[c.paymentCredential]??0)+1;return acc;},{})).map(([paymentCredential,count])=>({paymentCredential,count}));
  return {
    schema:'immortal-danogo-preprod-approved-tusdm-discovery-v1',status,
    classification:'READ_ONLY_EXACT_ASSET_SCRIPT_UTXO_DISCOVERY_AND_OUTREF_RECHECK_NOT_PRICE_OR_ORACLE_OR_EEV_QUALIFICATION',
    network:CONFIG.network,asset:TUSDM,source:{provider:'Koios Preprod public API',sdkCommit:CONFIG.sdkCommit,poolScriptHash:CONFIG.poolScriptHash,poolScriptOutRef:CONFIG.poolScriptOutRef,protocolConfigOutRef:CONFIG.protocolConfigOutRef},
    startedAt,completedAt:new Date().toISOString(),tipBefore:before.tip,tipAfter:after.tip,
    snapshotConsistency:{tipUnchanged:unchanged,warning:unchanged?null:'Chain advanced during observation; reads are not an atomic same-slot snapshot'},
    acquisition:{pages:scan.pages,rows:scan.rows.length,paginationComplete:true},
    summary:{danogoCredentialRows:scan.rows.filter(r=>String(r.payment_cred??'').toLowerCase()===CONFIG.poolScriptHash).length,exactDanogoPoolCandidates:candidates.length,danogoIndependentRechecks:reads.length,danogoConfirmedRechecks:confirmed,danogoUnqualifiedRows:unqualified.length,otherDanogoPairs:otherPairs.length,otherScriptTusdmAdaOutputs:otherScriptCandidates.length,otherScriptCredentials:credentialCounts.length,otherScriptIndependentRechecks:otherReads.length,otherScriptConfirmedRechecks:otherConfirmed,otherScriptUnqualifiedRows:otherScriptUnqualified.length},
    danogoCandidates:candidates.map((c,i)=>({...c,secondRead:reads[i]})),otherDanogoPairs:otherPairs,otherScriptCandidates:otherScriptCandidates.map((c,i)=>({...c,secondRead:otherReads[i]})),unqualifiedDanogoRows:unqualified,otherScriptUnqualifiedRows:otherScriptUnqualified,otherScriptCredentialCounts:credentialCounts,
    guardrails:{approvedPreprodAssetOnly:true,mainnetIdentityUsed:false,usdParityAssumed:false,priceProduced:false,oracleQuoteProduced:false,eevQualificationProduced:false,unknownScriptsClassifiedAsPools:false,walletAccessed:false,transactionBuilt:false,signed:false,submitted:false,deploymentAttempted:false},
  };
}
if(process.argv[1]&&resolve(process.argv[1])===resolve(new URL(import.meta.url).pathname)){
  (async()=>{const i=process.argv.indexOf('--out'),out=resolve(i>=0?process.argv[i+1]:'audit/preprod-evidence/danogo-preprod-tusdm-discovery.json');try{const e=await observe();await mkdir(dirname(out),{recursive:true});await writeFile(out,JSON.stringify(e,null,2)+'\n');console.log(JSON.stringify({status:e.status,summary:e.summary,out},null,2));}catch(e){const diagnostic={schema:'immortal-danogo-preprod-approved-tusdm-discovery-v1',status:'DANOGO_READ_ONLY_FAILED_CLOSED',error:e.message,evidence:e.evidence??null,observedAt:new Date().toISOString(),source:{provider:'Koios Preprod public API',sdkCommit:CONFIG.sdkCommit,poolScriptHash:CONFIG.poolScriptHash},guardrails:{walletAccessed:false,transactionBuilt:false,signed:false,submitted:false,priceProduced:false,oracleQuoteProduced:false,eevQualificationProduced:false}};await mkdir(dirname(out),{recursive:true});await writeFile(out,JSON.stringify(diagnostic,null,2)+'\n');console.error(JSON.stringify({...diagnostic,out},null,2));process.exitCode=1;}})();
}
