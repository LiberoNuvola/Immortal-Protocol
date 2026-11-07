/**
 * Aiken V3 SyncBeacon transaction-context characterization on ephemeral local Yaci.
 * The Ready-shaped Registry UTxOs are ordinary wallet outputs: Registry validation
 * is not attached or executed during their creation. Acceptance is a security finding.
 */
import { Constr, Data, Lucid, Blockfrost, CML, getAddressDetails, scriptFromNative, mintingPolicyToId, validatorToScriptHash, validatorToAddress, applyParamsToScript as applyParams, type Script, type UTxO } from '@lucid-evolution/lucid'
import { createHash } from 'node:crypto'
import { appendFileSync, readFileSync, writeFileSync } from 'node:fs'

const API='http://127.0.0.1:8080/api/v1'
const WALLET='/tmp/immortal-yaci-test-wallet.json'
const BLUEPRINT='poc/aiken-reveal-parity/plutus.json'
const REGISTRY_ARTIFACT='plutus/out/beaconRegistry.plutus.json'
const EVIDENCE='audit/yaci-evidence/aiken-sync-beacon-ledger-characterization.json'
const ADA=6_000_000n
const EXTRA=2_000_000n
const ROUND=42
const TARGET_REF=Buffer.from('SYNC-BEACON-LOCAL-ROUND-42').toString('hex')
const VERSION=Buffer.from('V1').toString('hex')
const BEACON='aabbccddeeff00112233445566778899'
const MC_HASH='11223344556677889900aabbccddeeff'
const CONTEXT='ffeeddccbbaa00998877665544332211'
type Planned={label:string;address:string;datum:any;index:number;lovelace:bigint}
type TestCase={name:string;prizes:string[];refs:string[];outputs:any[];values:bigint[];walletReturn?:bigint;note:string}
type Outcome={name:string;status:'accepted'|'rejected'|'blocked'|'unconfirmed';txHash:string|null;bytes:number|null;sha256:string|null;inputRefs:string[];registryRefs:string[];inputsPreserved:boolean|null;cborPath:string|null;fallbackExUnits:boolean;detail:string|null}
let policyId=''
let walletPkh=''

const c=(i:number,f:any[]=[]):any=>new Constr(i,f)
const hex=(s:string):string=>Buffer.from(s,'utf8').toString('hex')
const ref=(u:UTxO):string=>u.txHash+'#'+u.outputIndex
const sha=(s:string):string=>createHash('sha256').update(Buffer.from(s.replace(/^0x/i,''),'hex')).digest('hex')
const wait=(ms:number)=>new Promise((r)=>setTimeout(r,ms))
async function waitFor<T>(fn:()=>Promise<T>,test:(x:T)=>boolean,label:string):Promise<T>{
  for(let i=0;i<45;i+=1){const x=await fn();if(test(x))return x;await wait(1000)}
  throw new Error('Timed out waiting for '+label)
}
function target(network=0,round=ROUND):any{return c(0,[BigInt(network),BigInt(round),TARGET_REF,VERSION])}
function prizeDatum(label:string):any{
  return c(0,[policyId,hex('SYNC-'+label),'22'.repeat(32),100n,'33'.repeat(32),VERSION,7n,0n,'44'.repeat(28),hex('USDM'),c(0),'',0n,target(),c(0),'','','',policyId,1000n,9000000n,0n,0n])
}
function registryDatum(v:{brRound?:number;network?:number;targetRound?:number;status?:0|1;beacon?:string}={}):any{
  return c(0,[BigInt(v.brRound??ROUND),target(v.network??0,v.targetRound??ROUND),c(v.status??1),v.beacon??BEACON,MC_HASH,CONTEXT,walletPkh])
}
function synced(input:any,reg:any):any{
  const f=input.fields.slice();f[14]=c(1);f[15]=reg.fields[3];f[16]=reg.fields[4];f[17]=reg.fields[5];return c(0,f)
}
function mutate(input:any,index:number,value:any):any{const f=input.fields.slice();f[index]=value;return c(0,f)}
function spendPointers(cbor:string):Array<{tag:string;index:number}>{
  const tx=CML.Transaction.from_cbor_hex(cbor.replace(/^0x/i,''))
  const set=tx.witness_set().redeemers();if(!set)return[]
  const names:Record<number,string>={0:'spend',1:'mint',2:'certificate',3:'withdrawal',4:'vote',5:'propose'}
  const rows:Array<{tag:string;index:number}>=[]
  const legacy=set.as_arr_legacy_redeemer()
  if(legacy)for(let i=0;i<legacy.len();i+=1){const r=legacy.get(i);rows.push({tag:names[Number(r.tag())]??'unknown',index:Number(r.index())})}
  const map=set.as_map_redeemer_key_to_redeemer_val()
  if(map){const keys=map.keys();for(let i=0;i<keys.len();i+=1){const r=keys.get(i);rows.push({tag:names[Number(r.tag())]??'unknown',index:Number(r.index())})}}
  return [...new Map(rows.map((x)=>[x.tag+':'+x.index,x])).values()].filter((x)=>x.tag==='spend')
}
function ledgerRejection(s:string):boolean{return /HTTP 400|Bad Request|ValidationTagMismatch|PlutusFailure|The PlutusV[123] script failed|script evaluation failed|transaction evaluation failed|phase.?2|validator.*fail/i.test(s)}

const wallet=JSON.parse(readFileSync(WALLET,'utf8')) as {purpose?:string;address?:string;seed?:string}
if(wallet.purpose!=='ephemeral-local-devnet-only'||!wallet.address||!wallet.seed)throw new Error('Refusing wallet not marked ephemeral-local-devnet-only')
const blockResponse=await fetch(API+'/blocks/latest')
if(!blockResponse.ok)throw new Error('Yaci latest block unavailable')
const block=await blockResponse.json() as {slot?:number;time?:number}
if(!Number.isSafeInteger(block.slot)||!Number.isSafeInteger(block.time))throw new Error('Invalid Yaci slot/time anchor')
const slotConfig={zeroTime:block.time!*1000,zeroSlot:block.slot!,slotLength:1000}
const provider=new Blockfrost(API,'') as Blockfrost & {evaluateTx:(tx:string)=>Promise<any[]>}
const lucid=await Lucid(provider,'Preprod',{slotConfig})
lucid.selectWallet.fromSeed(wallet.seed)
const address=await lucid.wallet().address()
if(address!==wallet.address)throw new Error('Ephemeral wallet address mismatch')
walletPkh=getAddressDetails(address).paymentCredential?.hash??''
if(walletPkh.length!==56)throw new Error('Cannot derive ephemeral wallet payment PKH')
const protocol=await provider.getProtocolParameters()
const pResponse=await fetch(API+'/epochs/latest/parameters')
if(!pResponse.ok)throw new Error('Cannot obtain Yaci execution limits')
const active=await pResponse.json() as Record<string,any>
const nested=(active.max_tx_execution_units??active.maxTxExecutionUnits??{}) as Record<string,any>
const norm=((protocol as any).maxTxExecutionUnits??{}) as Record<string,any>
const maxMem=Number(active.max_tx_ex_mem??nested.memory??nested.mem??norm.memory??norm.mem)
const maxSteps=Number(active.max_tx_ex_steps??nested.steps??nested.cpu??norm.steps??norm.cpu)
const maxTxSize=Number((protocol as any).maxTxSize??active.max_tx_size)
if(!Number.isSafeInteger(maxMem)||maxMem<=0||!Number.isSafeInteger(maxSteps)||maxSteps<=0||!Number.isSafeInteger(maxTxSize)||maxTxSize<=0)throw new Error('Invalid Yaci protocol limits')
const native=scriptFromNative({type:'all',scripts:[{type:'sig',keyHash:walletPkh}]})
policyId=mintingPolicyToId(native)

const blueprint=JSON.parse(readFileSync(BLUEPRINT,'utf8')) as {preamble?:{plutusVersion?:string};validators?:Array<{title?:string;compiledCode?:string;hash?:string}>}
if(blueprint.preamble?.plutusVersion!=='v3')throw new Error('Aiken blueprint is not Plutus V3')
const found=(blueprint.validators??[]).filter((x)=>x.title==='reveal.pre_rich_reveal.spend')
if(found.length!==1||!found[0].compiledCode||!found[0].hash)throw new Error('Aiken spend entrypoint missing')
const unparameterized={type:'PlutusV3',script:found[0].compiledCode} as Script
const unparameterizedHash=validatorToScriptHash(unparameterized).toLowerCase()
if(unparameterizedHash!==found[0].hash.toLowerCase())throw new Error('Aiken blueprint hash mismatch')
const artifact=JSON.parse(readFileSync(REGISTRY_ARTIFACT,'utf8')) as {type?:string;cborHex?:string}
if(artifact.type!=='PlutusScriptV2'||!artifact.cborHex)throw new Error('Generated Registry V2 artifact missing')
const registryScript={type:'PlutusV2',script:artifact.cborHex} as Script
const registryHash=validatorToScriptHash(registryScript).toLowerCase()
const registryAddress=validatorToAddress('Preprod',registryScript)
const prizeScript={type:'PlutusV3',script:applyParams(found[0].compiledCode,[registryHash,policyId,'4f5241434c45',walletPkh])} as Script
const prizeHash=validatorToScriptHash(prizeScript).toLowerCase()
const prizeAddress=validatorToAddress('Preprod',prizeScript)
const wrongScript=scriptFromNative({type:'all',scripts:[{type:'sig',keyHash:walletPkh}]})
const wrongAddress=validatorToAddress('Preprod',wrongScript)
if(wrongAddress===registryAddress)throw new Error('Wrong Registry credential not distinct')

const planned:Planned[]=[]
const prizeData=new Map<string,any>()
const registryData=new Map<string,any>()
function add(label:string,addr:string,datum:any,lovelace:bigint):void{planned.push({label,address:addr,datum,index:planned.length,lovelace})}
function addPrize(label:string):void{const d=prizeDatum(label);prizeData.set(label,d);add('prize:'+label,prizeAddress,d,ADA)}
function addRegistry(label:string,d:any,addr=registryAddress):void{registryData.set(label,d);add('registry:'+label,addr,d,ADA)}
const prizeLabels=['fake-ready-positive','missing-registry','wrong-credential','malformed-registry','non-ready-registry','target-mismatch','round-mismatch','empty-beacon','multiple-good-first','multiple-bad-first','duplicate-own-a','duplicate-own-b','duplicate-continuing-output','immutable-identity-mutation','continuing-value-mutation']
for(const label of prizeLabels)addPrize(label)
const good=registryDatum()
const badAfter=registryDatum({network:1})
const badFirst=registryDatum({network:1})
const goodAfter=registryDatum()
const nonReady=registryDatum({status:0})
const roundMismatch=registryDatum({brRound:ROUND-1})
const emptyBeacon=registryDatum({beacon:''})
const malformed=c(0,[BigInt(ROUND)])
addRegistry('good-primary',good)
addRegistry('bad-target-after',badAfter)
addRegistry('bad-target-first',badFirst)
addRegistry('good-after-bad',goodAfter)
addRegistry('non-ready',nonReady)
addRegistry('round-mismatch',roundMismatch)
addRegistry('empty-beacon',emptyBeacon)
addRegistry('malformed',malformed)
addRegistry('wrong-credential',good,wrongAddress)

let boot:any=lucid.newTx()
for(const item of planned)boot=boot.pay.ToContract(item.address,{kind:'inline',value:Data.to(item.datum)},{lovelace:item.lovelace})
const bootUnsigned=await boot.complete({localUPLCEval:false})
const bootSigned=await bootUnsigned.sign.withWallet().complete({localUPLCEval:false})
const bootCbor=bootSigned.toCBOR()
const bootBytes=Buffer.from(bootCbor.replace(/^0x/i,''),'hex').length
if(bootBytes>maxTxSize)throw new Error('Fixture bootstrap exceeds maxTxSize')
const bootHash=await bootSigned.submit()
await lucid.awaitTx(bootHash)
writeFileSync('audit/yaci-evidence/aiken-sync-beacon-bootstrap.cbor',Buffer.from(bootCbor.replace(/^0x/i,''),'hex'))
const nPrize=planned.filter((x)=>x.address===prizeAddress).length
const nReg=planned.filter((x)=>x.address===registryAddress).length
const nWrong=planned.filter((x)=>x.address===wrongAddress).length
const [prizeUtxos,registryUtxos,wrongUtxos]=await Promise.all([
  waitFor(()=>lucid.utxosAt(prizeAddress),(xs)=>xs.filter((x)=>x.txHash===bootHash).length===nPrize,'Prize fixtures'),
  waitFor(()=>lucid.utxosAt(registryAddress),(xs)=>xs.filter((x)=>x.txHash===bootHash).length===nReg,'Registry fixtures'),
  waitFor(()=>lucid.utxosAt(wrongAddress),(xs)=>xs.filter((x)=>x.txHash===bootHash).length===nWrong,'wrong Registry fixture'),
])
const byRef=new Map<string,UTxO>()
for(const u of [...prizeUtxos,...registryUtxos,...wrongUtxos])byRef.set(ref(u),u)
const byLabel=new Map<string,Planned>(planned.map((x)=>[x.label,x]))
function get(label:string):UTxO{
  const p=byLabel.get(label);if(!p)throw new Error('Missing fixture label '+label)
  const u=byRef.get(bootHash+'#'+p.index);if(!u)throw new Error('Missing output '+label)
  return u
}
const prize=(x:string)=>get('prize:'+x)
const registry=(x:string)=>get('registry:'+x)

const fallbacks:Array<Record<string,unknown>>=[]
const evaluations:Array<Record<string,unknown>>=[]
provider.evaluateTx=async(tx:string)=>{
  const cbor=tx.replace(/^0x/i,'')
  const response=await fetch(API+'/utils/txs/evaluate/utxos',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({cbor})})
  const raw=await response.text()
  let data:any
  try{data=JSON.parse(raw)}catch{data={message:raw}}
  if(response.ok&&!data.fault&&data.result?.EvaluationResult){
    const rows=Object.entries(data.result.EvaluationResult).map(([key,value]:[string,any])=>{
      const parts=key.split(':')
      return {redeemer_tag:parts[0],redeemer_index:Number(parts[1]),ex_units:{mem:Math.ceil(Number(value.memory)*1.01),steps:Math.ceil(Number(value.steps)*1.01)}}
    })
    evaluations.push({txSha256:sha(cbor),rows})
    return rows
  }
  const pointers=spendPointers(cbor)
  if(!pointers.length)throw new Error('No spend redeemer to construct diagnostic transaction')
  const budget={mem:Math.floor(maxMem*0.45),steps:Math.floor(maxSteps*0.45)}
  const rows=pointers.map((x)=>({redeemer_tag:x.tag,redeemer_index:x.index,ex_units:{...budget}}))
  fallbacks.push({txSha256:sha(cbor),httpStatus:response.status,evaluatorMessage:String(data.message??raw).slice(0,1000),budget,pointers,submissionRemainsAuthoritative:true})
  return rows
}

const outcomes:Outcome[]=[]
async function run(test:TestCase):Promise<Outcome>{
  const inputs=test.prizes.map(prize)
  const refs=test.refs.map(registry)
  const inputRefs=inputs.map(ref)
  const fallbackStart=fallbacks.length
  let builder:any=lucid.newTx()
  if(refs.length)builder=builder.readFrom(refs)
  builder=builder.collectFrom(inputs,Data.to(c(0))).attach.SpendingValidator(prizeScript)
  for(let i=0;i<test.outputs.length;i+=1){
    builder=builder.pay.ToContract(prizeAddress,{kind:'inline',value:Data.to(test.outputs[i])},{lovelace:test.values[i]})
  }
  if(test.walletReturn&&test.walletReturn>0n)builder=builder.pay.ToAddress(address,{lovelace:test.walletReturn})
  builder=builder.addSigner(address)
  let stage='complete'
  let status:Outcome['status']='blocked'
  let txHash:string|null=null
  let bytes:number|null=null
  let txSha:string|null=null
  let detail:string|null=null
  let cborPath:string|null=null
  let preserved:boolean|null=null
  try{
    const unsigned=await builder.complete({localUPLCEval:false})
    let cbor=unsigned.toCBOR()
    bytes=Buffer.from(cbor.replace(/^0x/i,''),'hex').length
    txSha=sha(cbor)
    cborPath='audit/yaci-evidence/aiken-sync-beacon-'+test.name+'.cbor'
    writeFileSync(cborPath,Buffer.from(cbor.replace(/^0x/i,''),'hex'))
    if(bytes>maxTxSize){status='blocked';detail='Unsigned transaction exceeds maxTxSize: '+bytes+' > '+maxTxSize}
    else{
      stage='sign'
      const signed=await unsigned.sign.withWallet().complete({localUPLCEval:false})
      cbor=signed.toCBOR()
      bytes=Buffer.from(cbor.replace(/^0x/i,''),'hex').length
      txSha=sha(cbor)
      writeFileSync(cborPath,Buffer.from(cbor.replace(/^0x/i,''),'hex'))
      if(bytes>maxTxSize){status='blocked';detail='Signed transaction exceeds maxTxSize: '+bytes+' > '+maxTxSize}
      else{
        stage='submit'
        txHash=await signed.submit()
        stage='confirm'
        const confirmed=await lucid.awaitTx(txHash)
        status=confirmed===false?'unconfirmed':'accepted'
        if(status==='unconfirmed')detail='Submitted tx was not confirmed by Yaci'
      }
    }
  }catch(error){
    const message=error instanceof Error?error.message:String(error)
    detail=message.slice(0,2500)
    status=(stage==='submit'||stage==='confirm')&&ledgerRejection(message)?'rejected':'unconfirmed'
  }
  if(status!=='accepted'){
    const remains=new Set((await lucid.utxosAt(prizeAddress)).map(ref))
    preserved=inputRefs.every((x)=>remains.has(x))
  }
  const result:Outcome={
    name:test.name,status,txHash,bytes,sha256:txSha,inputRefs,registryRefs:refs.map(ref),
    inputsPreserved:preserved,cborPath,fallbackExUnits:fallbacks.length>fallbackStart,detail,
  }
  outcomes.push(result)
  console.log(JSON.stringify({syncBeaconCase:test.name,status,txHash,bytes,inputsPreserved:preserved,detail:detail?detail.slice(0,700):null}))
  return result
}
const out=(p:string,r:any)=>synced(prizeData.get(p),r)
const cases:TestCase[]=[
{name:'fake-ready-ordinary-payment',prizes:['fake-ready-positive'],refs:['good-primary'],outputs:[out('fake-ready-positive',good)],values:[ADA],note:'Unauthenticated Ready-shaped Registry output created by ordinary payment.'},
{name:'missing-registry-reference',prizes:['missing-registry'],refs:[],outputs:[out('missing-registry',good)],values:[ADA],note:'No Registry reference input.'},
{name:'wrong-registry-credential',prizes:['wrong-credential'],refs:['wrong-credential'],outputs:[out('wrong-credential',good)],values:[ADA],note:'Ready datum at wrong script credential.'},
{name:'malformed-registry-datum',prizes:['malformed-registry'],refs:['malformed'],outputs:[out('malformed-registry',good)],values:[ADA],note:'Malformed Registry constructor arity.'},
{name:'non-ready-registry',prizes:['non-ready-registry'],refs:['non-ready'],outputs:[out('non-ready-registry',nonReady)],values:[ADA],note:'Registry datum is Pending, not Ready.'},
{name:'wrong-network-target',prizes:['target-mismatch'],refs:['bad-target-after'],outputs:[out('target-mismatch',badAfter)],values:[ADA],note:'Registry network target mismatch.'},
{name:'round-mismatch',prizes:['round-mismatch'],refs:['round-mismatch'],outputs:[out('round-mismatch',roundMismatch)],values:[ADA],note:'Registry round 41 vs Prize target round 42.'},
{name:'empty-beacon',prizes:['empty-beacon'],refs:['empty-beacon'],outputs:[out('empty-beacon',emptyBeacon)],values:[ADA],note:'Ready-shaped Registry datum has empty Beacon.'},
{name:'multiple-registry-refs-good-first',prizes:['multiple-good-first'],refs:['good-primary','bad-target-after'],outputs:[out('multiple-good-first',good)],values:[ADA],note:'Two Registry refs; lower output index is valid and second conflicts.'},
{name:'multiple-registry-refs-bad-first',prizes:['multiple-bad-first'],refs:['bad-target-first','good-after-bad'],outputs:[out('multiple-bad-first',badFirst)],values:[ADA],note:'Two Registry refs; lower output index conflicts and second is valid.'},
{name:'duplicate-own-prize-inputs',prizes:['duplicate-own-a','duplicate-own-b'],refs:['good-primary'],outputs:[out('duplicate-own-a',good)],values:[ADA*2n],note:'Two own Prize inputs in one transaction.'},
{name:'duplicate-continuing-prize-outputs',prizes:['duplicate-continuing-output'],refs:['good-primary'],outputs:[out('duplicate-continuing-output',good),out('duplicate-continuing-output',good)],values:[ADA,EXTRA],note:'Two continuing outputs at Prize script address.'},
{name:'immutable-commitment-mutation',prizes:['immutable-identity-mutation'],refs:['good-primary'],outputs:[mutate(out('immutable-identity-mutation',good),4,'ff'.repeat(32))],values:[ADA],note:'Continuing Prize commitment changed.'},
{name:'continuing-value-reduction',prizes:['continuing-value-mutation'],refs:['good-primary'],outputs:[out('continuing-value-mutation',good)],values:[ADA-1_000_000n],walletReturn:1_000_000n,note:'One ADA diverted to signer; continuing Prize Value reduced.'},
]
for(const test of cases)await run(test)

function accepted(name:string):boolean|null{
  const x=outcomes.find((o)=>o.name===name);if(!x)return null
  if(x.status==='accepted')return true
  if(x.status==='rejected')return false
  return null
}
function anyAccepted(names:string[]):boolean|null{
  const values=names.map(accepted)
  if(values.some((x)=>x===true))return true
  if(values.every((x)=>x===false))return false
  return null
}
const fakeReady=accepted('fake-ready-ordinary-payment')
const ambiguous=anyAccepted(['multiple-registry-refs-good-first','multiple-registry-refs-bad-first'])
const invalidRegistry=anyAccepted(['wrong-registry-credential','malformed-registry-datum','non-ready-registry','wrong-network-target','round-mismatch','empty-beacon'])
const duplicateStructure=anyAccepted(['duplicate-own-prize-inputs','duplicate-continuing-prize-outputs'])
const immutableMutation=accepted('immutable-commitment-mutation')
const valueMutation=accepted('continuing-value-reduction')
const complete=outcomes.length===cases.length&&outcomes.every((x)=>x.status==='accepted'||x.status==='rejected')
const findings:string[]=[]
if(fakeReady===true)findings.push('UNAUTHENTICATED_READY_REFERENCE_ACCEPTED_BY_AIKEN_SYNCBEACON')
if(ambiguous===true)findings.push('MULTIPLE_MATCHING_REGISTRY_REFERENCES_ACCEPTED')
if(invalidRegistry===true)findings.push('INVALID_OR_UNRELATED_REGISTRY_REFERENCE_ACCEPTED')
if(duplicateStructure===true)findings.push('DUPLICATE_PRIZE_INPUT_OR_CONTINUING_OUTPUT_ACCEPTED')
if(immutableMutation===true)findings.push('IMMUTABLE_PRIZE_IDENTITY_MUTATION_ACCEPTED')
if(valueMutation===true)findings.push('CONTINUING_PRIZE_VALUE_MUTATION_ACCEPTED')
if([fakeReady,ambiguous,invalidRegistry,duplicateStructure,immutableMutation,valueMutation].some((x)=>x===null))findings.push('ONE_OR_MORE_PROPERTIES_UNCONFIRMED')

const fakeReadyPlan=planned.find((x)=>x.label==='registry:good-primary')!
const bootstrapEvidence={txHash:bootHash,bytes:bootBytes,sha256:sha(bootCbor),cborPath:'audit/yaci-evidence/aiken-sync-beacon-bootstrap.cbor',outputs:planned.length}
const evidence={
 schema:'immortal.aiken.sync-beacon.local-yaci-characterization.v1',
 evidenceId:createHash('sha256').update(JSON.stringify({bootHash,prizeHash,registryHash,outcomes:outcomes.map((x)=>[x.name,x.status,x.sha256])})).digest('hex'),
 source:{repository:process.env.GITHUB_REPOSITORY??null,ref:process.env.GITHUB_REF??null,commitSha:process.env.GITHUB_SHA??null,runId:process.env.GITHUB_RUN_ID??null,runUrl:process.env.RUN_URL??null},
 classification:'LOCAL_YACI_SECURITY_CHARACTERIZATION_ONLY_NOT_QUALIFICATION',
 environment:'ephemeral-local-yaci-devnet',walletPurpose:wallet.purpose,walletAddress:address,
 registry:{scriptHash:registryHash,address:registryAddress,fakeReadyCreation:{txHash:bootHash,outputRef:bootHash+'#'+fakeReadyPlan.index,creationMethod:'ordinary-wallet-payment-to-script-credential',registryValidatorAttached:false,registryValidatorExecuted:false,authenticatedProvenance:false,classification:'UNAUTHENTICATED_SYNTHETIC_BEACON_READY_REFERENCE'}},
 aikenCandidate:{plutusVersion:'v3',blueprintTitle:'reveal.pre_rich_reveal.spend',unparameterizedHash,parameterizedScriptHash:prizeHash,scriptBytes:Buffer.from(prizeScript.script,'hex').length,registryScriptHashParameter:registryHash,oracleStatePolicyIdParameter:policyId,oracleStateTokenNameParameter:'4f5241434c45',oraclePublisherParameter:walletPkh,deploymentGateClosed:true},
 protocolLimits:{maxTxSize,maxMem,maxSteps},bootstrap:bootstrapEvidence,outcomes,evaluator:{measurements,fallbacks,note:'Fallback ExUnits only construct adversarial CBOR; signed local-Yaci submission decides acceptance.'},
 properties:{fakeReadyAccepted:fakeReady===null?'unknown':String(fakeReady),multipleRegistryReferencesAccepted:ambiguous===null?'unknown':String(ambiguous),invalidRegistryReferenceAccepted:invalidRegistry===null?'unknown':String(invalidRegistry),duplicateStructureAccepted:duplicateStructure===null?'unknown':String(duplicateStructure),immutableMutationAccepted:immutableMutation===null?'unknown':String(immutableMutation),valueMutationAccepted:valueMutation===null?'unknown':String(valueMutation)},
 securityFindings:findings,
 harness:{complete,caseCount:outcomes.length,expectedCaseCount:cases.length,accepted:outcomes.filter((x)=>x.status==='accepted').length,rejected:outcomes.filter((x)=>x.status==='rejected').length,blockedOrUnconfirmed:outcomes.filter((x)=>x.status==='blocked'||x.status==='unconfirmed').length},
 limitations:[
  'All Registry references are synthetic local-Yaci UTxOs; the direct Ready output is not an authenticated Registry instance.',
  'This characterizes only the isolated Aiken Plutus V3 candidate, not Haskell V2/Aiken parity or production Registry identity.',
  'No Preprod/Mainnet evidence, state token, authenticated initializer, trusted publisher binding or external Materios proof is established.',
  'A security property recorded as accepted is a finding, not a test PASS.',
 ],
}
writeFileSync(EVIDENCE,JSON.stringify(evidence,null,2)+String.fromCharCode(10))
const outputs=[
 'harness_complete='+String(complete),
 'fake_ready_accepted='+(fakeReady===null?'unknown':String(fakeReady)),
 'registry_reference_ambiguity_accepted='+(ambiguous===null?'unknown':String(ambiguous)),
 'invalid_registry_reference_accepted='+(invalidRegistry===null?'unknown':String(invalidRegistry)),
 'duplicate_structure_accepted='+(duplicateStructure===null?'unknown':String(duplicateStructure)),
 'immutable_identity_mutation_accepted='+(immutableMutation===null?'unknown':String(immutableMutation)),
 'continuing_value_mutation_accepted='+(valueMutation===null?'unknown':String(valueMutation)),
]
if(process.env.GITHUB_OUTPUT)appendFileSync(process.env.GITHUB_OUTPUT,outputs.join(String.fromCharCode(10))+String.fromCharCode(10))
console.log(JSON.stringify({aikenSyncBeacon:complete?'CHARACTERIZATION_COMPLETED':'CHARACTERIZATION_INCOMPLETE',evidencePath:EVIDENCE,evidenceId:evidence.evidenceId,caseCount:outcomes.length,harnessComplete:complete,properties:evidence.properties,securityFindings:findings,deploymentGateClosed:true},null,2))
if(!complete)throw new Error('SyncBeacon trace did not produce conclusive local-ledger outcomes for all cases')
