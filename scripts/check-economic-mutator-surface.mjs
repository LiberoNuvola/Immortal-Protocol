import { existsSync, readFileSync } from 'node:fs'

function mustFile(path){
  if(!existsSync(path)) fail(`missing required surface ${path}`)
  return readFileSync(path,'utf8')
}
function mustContain(source,path,needle){
  if(!source.includes(needle)) fail(`${path} missing ${needle}`)
}
function mustRegex(source,path,re,label){
  if(!re.test(source)) fail(`${path} missing ${label}`)
}
function fail(message){
  console.error(`ECONOMIC MUTATOR SURFACE: FAIL — ${message}`)
  process.exit(1)
}

const kernel=mustFile('IMMORTAL/kernel/EconomicTransitionV3.hs')
const game=mustFile('src/gameFlow.ts')
const mint=mustFile('src/mint.ts')
const adapter=mustFile('Adapter/CARDANO/runtime/CardanoExecutionAdapter.ts')
const admission=mustFile('Adapter/CARDANO/runtime/EconomicAdmission.ts')
const negative=mustFile('src/__tests__/rf8-submission-boundary.test.ts')
const issue=mustFile('src/__tests__/preRichIssueRefinement.test.ts')
const reveal=mustFile('src/__tests__/preRichRevealRefinement.test.ts')
const claim=mustFile('src/__tests__/preRichClaimRefinement.test.ts')
const expire=mustFile('src/__tests__/preRichExpireRefinement.test.ts')

for(const action of ['Issue','Reveal','Claim','Expire']) mustContain(kernel,'IMMORTAL/kernel/EconomicTransitionV3.hs',action)
for(const fn of ['revealPrize','claimPrize','expirePrize']) mustContain(game,'src/gameFlow.ts',`export async function ${fn}`)
mustContain(mint,'src/mint.ts','export async function mintSerialNFT')
mustContain(mint,'src/mint.ts','.submitEconomic')
mustRegex(game,'src/gameFlow.ts',/signAndSubmitEconomicTx[\s\S]*?'Reveal'/,'Reveal economic submission path')
mustRegex(mint,'src/mint.ts',/\.submitEconomic\([\s\S]*?'Issue'/,'Issue economic submission path')
mustRegex(game,'src/gameFlow.ts',/signAndSubmitEconomicTx[\s\S]*?'Claim'/,'Claim economic submission path')
mustRegex(game,'src/gameFlow.ts',/signAndSubmitEconomicTx[\s\S]*?'Expire'/,'Expire economic submission path')
mustContain(adapter,'Adapter/CARDANO/runtime/CardanoExecutionAdapter.ts','submitEconomic')
mustContain(adapter,'Adapter/CARDANO/runtime/CardanoExecutionAdapter.ts','assertEconomicAdmission')
mustContain(admission,'Adapter/CARDANO/runtime/EconomicAdmission.ts','assertExecutableLiquidityBoundToInputs')
mustContain(negative,'src/__tests__/rf8-submission-boundary.test.ts','economic submission path')
for(const [path,source,needle] of [
  ['src/__tests__/preRichIssueRefinement.test.ts',issue,'refinement'],
  ['src/__tests__/preRichRevealRefinement.test.ts',reveal,'reveal payout'],
  ['src/__tests__/preRichClaimRefinement.test.ts',claim,'exact claim'],
  ['src/__tests__/preRichExpireRefinement.test.ts',expire,'refinesAggregateExpire'],
]) mustContain(source,path,needle)
for(const [path,source,pattern,label] of [
  ['src/__tests__/preRichIssueRefinement.test.ts',issue,/reject|Throw/i,'negative twin'],
  ['src/__tests__/preRichRevealRefinement.test.ts',reveal,/reject|Throw/i,'negative twin'],
  ['src/__tests__/preRichClaimRefinement.test.ts',claim,/reject|Throw/i,'negative twin'],
  ['src/__tests__/preRichExpireRefinement.test.ts',expire,/reject|Throw/i,'negative twin'],
]) mustRegex(source,path,pattern,label)

console.log('ECONOMIC MUTATOR SURFACE: PASS')
console.log('Covered economic actions: Issue, Reveal, Claim, Expire')
console.log('Each action has a kernel definition, current production execution path, EconomicAdmission boundary, refinement test and negative evidence surface.')
