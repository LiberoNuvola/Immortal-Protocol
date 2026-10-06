import type { CertifiedTicketState } from '../PRE-RICH/src/PreRichCertifiedTicket'
import { PRE_RICH_CANONICAL_PRICES } from '../PRE-RICH/src/PreRichCardanoObservationProjection'
import { defaultPrizeTable, prizeAmountForTier } from './gameRules'

type Ticket3DOptions = {
  onRequestCanonicalRefresh?: () => void | Promise<void>
}

const ARTWORK_BASE = '/assets/pre-rich/'
const SYMBOL_BASE = ARTWORK_BASE + 'symbols/'
const SYMBOLS: Record<number, { key:string; label:string }> = {
  1:{key:'stella',label:'STELLA'},
  2:{key:'cuore',label:'CUORE'},
  3:{key:'quadrif',label:'QUADRIFOGLIO'},
  4:{key:'alloro',label:'ALLORO'},
  5:{key:'coppa',label:'COPPA'},
}
const STYLE_ID='pre-rich-ticket-v2-styles'
const CSS=[
".pr-ticket3d{width:100%;color:#f6f1df}",
".pr-ticket3d__viewport{width:100%;overflow-x:auto;padding:10px 2px 16px;scrollbar-width:thin}",
".pr-ticket3d__stage{width:100%;min-width:640px;max-width:1180px;margin:0 auto;perspective:1800px}",
".pr-ticket3d__card{position:relative;width:100%;aspect-ratio:3.15/1;min-height:204px;transform-style:preserve-3d;transition:transform .55s cubic-bezier(.2,.75,.2,1)}",
".pr-ticket3d__face{position:absolute;inset:0;backface-visibility:hidden;border-radius:18px;overflow:hidden;box-shadow:0 28px 60px rgba(0,0,0,.42),0 0 0 1px rgba(255,215,126,.4),inset 0 0 0 2px rgba(255,255,255,.16)}",
".pr-ticket3d__front{background:#caa65a}",
".pr-ticket3d__back{transform:rotateY(180deg);background:radial-gradient(circle at 15% 20%,rgba(255,255,255,.65),transparent 25%),linear-gradient(135deg,#efe3bd,#caa86c 55%,#f3e7c7);color:#2a2418}",
".pr-ticket3d__face:after{content:'';position:absolute;inset:0;pointer-events:none;box-shadow:inset 0 0 34px rgba(0,0,0,.36),inset 0 0 0 1px rgba(255,239,180,.48);border-radius:18px}",
".pr-ticket3d__artwork{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center;filter:saturate(1.04) contrast(1.03) brightness(1.02)}",
".pr-ticket3d__front-shade{position:absolute;inset:0;background:linear-gradient(90deg,transparent 0 56%,rgba(79,42,5,.09) 72%,rgba(79,42,5,.16) 100%);pointer-events:none}",
".pr-ticket3d__game{position:absolute;top:4%;right:1%;width:35%;height:92%;padding:2% 1.7% 1.4%;box-sizing:border-box;border-radius:15px;background:linear-gradient(145deg,rgba(249,224,152,.92),rgba(188,137,41,.72));border:1px solid rgba(91,50,5,.52);box-shadow:0 12px 26px rgba(40,18,0,.25),inset 0 0 0 1px rgba(255,255,255,.4)}",
".pr-ticket3d__game:before{content:'';position:absolute;inset:0;border-radius:15px;pointer-events:none;background:repeating-linear-gradient(115deg,rgba(255,255,255,.08) 0 1px,transparent 1px 8px);opacity:.34}",
".pr-ticket3d__statusline{position:relative;z-index:1;display:flex;justify-content:space-between;gap:8px;align-items:center;margin-bottom:5px;font-size:8px;font-weight:900;letter-spacing:.09em;text-transform:uppercase;color:#4a2d08}",
".pr-ticket3d__verified{padding:3px 6px;border-radius:999px;background:rgba(29,93,42,.92);color:#f0f8d6;font-size:7px;letter-spacing:.06em}",
".pr-ticket3d__row{position:relative;z-index:1;display:grid;gap:3px}",
".pr-ticket3d__row+.pr-ticket3d__row{margin-top:4px}",
".pr-ticket3d__row-title{font-size:6px;font-weight:900;letter-spacing:.1em;color:#563907;text-transform:uppercase}",
".pr-ticket3d__cells{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:5px}",
".pr-scratch-box{position:relative;aspect-ratio:1.45;border-radius:7px;overflow:hidden;background:linear-gradient(145deg,#f4f4f2,#bfc0bf);border:2px solid #8f6a1d;box-shadow:0 4px 10px rgba(67,35,0,.23),inset 0 0 0 1px rgba(255,255,255,.75)}",
".pr-scratch-box__reveal{position:absolute;inset:0;display:grid;place-items:center;text-align:center;background:radial-gradient(circle at 50% 35%,#fffdf1,#dccb91 72%,#b79243);color:#241a0a}",
".pr-scratch-box__reveal img{width:43%;height:43%;object-fit:contain;filter:drop-shadow(0 4px 5px rgba(0,0,0,.25))}",
".pr-scratch-box__reveal b{font-size:8px;line-height:1.1}",
".pr-scratch-box__pending{font-size:8px;font-weight:900;letter-spacing:.06em;text-transform:uppercase;opacity:.55}",
".pr-scratch-canvas{position:absolute;inset:0;width:100%;height:100%;cursor:crosshair;touch-action:none}",
".pr-scratch-box--locked .pr-scratch-canvas{cursor:not-allowed}",
".pr-ticket3d__caption{min-height:13px;margin-top:2px;display:flex;align-items:center;justify-content:center;gap:3px;font-size:6px;font-weight:900;letter-spacing:.04em;color:#5a3d0f;text-transform:uppercase}",
".pr-ticket3d__caption img{width:12px;height:12px;object-fit:contain}",
".pr-ticket3d__meta{position:absolute;left:1.3%;right:37%;bottom:3.1%;display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:4px}",
".pr-ticket3d__badge{min-width:0;padding:4px 5px;border-radius:7px;text-align:center;background:linear-gradient(145deg,#fff1bb,#d6aa4a);color:#2c1f0b;border:1px solid rgba(91,55,9,.55);box-shadow:0 3px 7px rgba(48,27,0,.18),inset 0 0 0 1px rgba(255,255,255,.55)}",
".pr-ticket3d__badge small{display:block;font-size:5px;letter-spacing:.08em;font-weight:900;opacity:.66;text-transform:uppercase}",
".pr-ticket3d__badge b{display:block;margin-top:1px;font-size:8px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}",
".pr-ticket3d__back-inner{position:absolute;inset:0;padding:2.4% 2.8%;display:grid;grid-template-columns:1.05fr 1fr 1.08fr;grid-template-rows:auto 1fr 1fr;gap:8px}",
".pr-ticket3d__back-brand{grid-column:1/-1;display:flex;align-items:center;gap:8px;padding-bottom:5px;border-bottom:1px solid rgba(87,58,13,.25)}",
".pr-ticket3d__back-brand img{width:30px;height:30px;object-fit:contain}",
".pr-ticket3d__back-brand b{display:block;font-family:Georgia,serif;font-size:15px;letter-spacing:.04em}",
".pr-ticket3d__back-brand span{font-size:6px;letter-spacing:.12em;text-transform:uppercase;opacity:.65}",
".pr-ticket3d__panel{min-width:0;padding:7px;border:1px solid rgba(116,77,18,.28);border-radius:9px;background:rgba(255,248,220,.46);box-shadow:inset 0 0 0 1px rgba(255,255,255,.35)}",
".pr-ticket3d__panel h4{margin:0 0 5px;font-size:7px;letter-spacing:.09em;text-transform:uppercase;color:#674915}",
".pr-ticket3d__kv{display:grid;grid-template-columns:auto 1fr;gap:3px 6px;font-size:6.5px;line-height:1.25}",
".pr-ticket3d__kv span{opacity:.58}",
".pr-ticket3d__kv b{text-align:right;word-break:break-word}",
".pr-ticket3d__legend{display:grid;gap:3px}",
".pr-ticket3d__legend-item{display:grid;grid-template-columns:15px 1fr auto;gap:4px;align-items:center;font-size:6.5px}",
".pr-ticket3d__legend-item img{width:14px;height:14px;object-fit:contain}",
".pr-ticket3d__legend-item b{white-space:nowrap;font-size:6.5px}",
".pr-ticket3d__cert{grid-column:1/3}",
".pr-ticket3d__status-panel{grid-column:3}",
".pr-ticket3d__reveal{margin-top:5px;padding-top:5px;border-top:1px solid rgba(116,77,18,.18)}",
".pr-ticket3d__reveal strong{display:block;font-size:7px;color:#3d671e}",
".pr-ticket3d__result-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:3px;margin-top:4px}",
".pr-ticket3d__result-grid span{padding:3px 4px;border-radius:5px;background:rgba(103,72,16,.08);font-size:6px}",
".pr-ticket3d__controls{display:flex;justify-content:center;flex-wrap:wrap;gap:6px;margin-top:7px}",
".pr-ticket3d__controls button{border:1px solid rgba(255,215,126,.24);background:rgba(255,255,255,.06);color:inherit;border-radius:999px;padding:7px 10px;cursor:pointer;font-size:10px;font-weight:800}",
".pr-ticket3d__controls button:hover{background:rgba(255,255,255,.11)}",
".pr-ticket3d__hint{text-align:center;margin:3px auto 0;max-width:820px;font-size:9px;line-height:1.45;opacity:.58}",
"@media(max-width:720px){.pr-ticket3d__stage{min-width:620px}}"
].join('')

function ensureStyles(){
  if(document.getElementById(STYLE_ID)) return
  const style=document.createElement('style')
  style.id=STYLE_ID
  style.textContent=CSS
  document.head.appendChild(style)
}
function formatUsdm(subunits:bigint):string{
  const whole=subunits/100n
  const fraction=subunits%100n
  return fraction===0n?whole.toString():whole.toString()+'.'+fraction.toString().padStart(2,'0').replace(/0$/,'')
}
function formatDate(value:bigint):string{
  const d=new Date(Number(value))
  return Number.isFinite(d.getTime())?d.toISOString().replace('T',' ').replace('.000Z',' UTC'):'unknown'
}
function shortHex(value:string,size=14):string{
  const clean=value.replace(/^0x/i,'')
  if(clean.length<=size) return clean.toUpperCase()
  return clean.slice(0,Math.max(4,size-5)).toUpperCase()+'…'+clean.slice(-4).toUpperCase()
}
function classIdForPrice(priceSubunits:bigint):number|null{
  const index=PRE_RICH_CANONICAL_PRICES.findIndex((price)=>price*100n===priceSubunits)
  return index>=0?index:null
}
function artworkIndex(assetName:string):number{
  const clean=assetName.replace(/[^0-9a-f]/gi,'').slice(0,8)
  const value=clean?Number.parseInt(clean,16):0
  return Number.isFinite(value)?(value%5)+1:1
}
function symbolForTier(tier:bigint):{key:string;label:string}|null{
  return SYMBOLS[Number(tier)]??null
}
function payoutLabel(tier:number,priceSubunits:bigint):string{
  if(tier<=0)return 'NO WIN'
  const amountSubunits=BigInt(prizeAmountForTier(defaultPrizeTable,tier,Number(priceSubunits)))
  const oneUsdm=BigInt(prizeAmountForTier(defaultPrizeTable,tier,100))
  const multiplier=Number(oneUsdm)/100
  return multiplier.toString().replace(/\.0$/,'')+'×P · '+formatUsdm(amountSubunits)+' USDM'
}
function addKv(target:HTMLElement,label:string,value:string){
  const row=document.createElement('div'); row.className='pr-ticket3d__kv'
  const a=document.createElement('span'); a.textContent=label
  const b=document.createElement('b'); b.textContent=value
  row.append(a,b); target.appendChild(row)
}
function makePanel(title:string,className=''){
  const el=document.createElement('section'); el.className='pr-ticket3d__panel'+(className?' '+className:'')
  const h=document.createElement('h4'); h.textContent=title; el.appendChild(h); return el
}
function drawScratchSurface(canvas:HTMLCanvasElement,logo:HTMLImageElement|null){
  const ctx=canvas.getContext('2d'); if(!ctx)return
  ctx.globalCompositeOperation='source-over'
  const g=ctx.createLinearGradient(0,0,canvas.width,canvas.height)
  g.addColorStop(0,'#ececeb'); g.addColorStop(.45,'#c7c8c7'); g.addColorStop(1,'#989a99')
  ctx.fillStyle=g; ctx.fillRect(0,0,canvas.width,canvas.height)
  ctx.strokeStyle='rgba(255,255,255,.32)'; ctx.lineWidth=2; ctx.strokeRect(8,8,canvas.width-16,canvas.height-16)
  if(logo&&logo.complete&&logo.naturalWidth>0){
    const cx=canvas.width/2,cy=canvas.height/2,rx=canvas.width*.31,ry=canvas.height*.43
    ctx.save(); ctx.beginPath(); ctx.ellipse(cx,cy,rx,ry,0,0,Math.PI*2); ctx.clip()
    const scale=Math.min((rx*2)/logo.naturalWidth,(ry*2)/logo.naturalHeight)
    const w=logo.naturalWidth*scale,h=logo.naturalHeight*scale
    ctx.drawImage(logo,cx-w/2,cy-h/2,w,h); ctx.restore()
  }else{
    ctx.fillStyle='rgba(22,22,20,.42)'; ctx.font='900 34px Georgia,serif'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText('PRE-RICH',canvas.width/2,canvas.height/2)
  }
}
function buildScratchCell(state:CertifiedTicketState,index:number,logo:HTMLImageElement|null,canScratch:boolean){
  const cell=document.createElement('div'); cell.className='pr-ticket3d__cell'
  const box=document.createElement('div'); box.className='pr-scratch-box'+(canScratch?'':' pr-scratch-box--locked')
  const reveal=document.createElement('div'); reveal.className='pr-scratch-box__reveal'
  const rowTier=index<3?state.row1Tier:state.row2Tier
  if(state.status==='Pending'){
    const hidden=document.createElement('span'); hidden.className='pr-scratch-box__pending'; hidden.textContent='Outcome hidden'; reveal.appendChild(hidden)
  }else if(rowTier>0n){
    const symbol=symbolForTier(rowTier)
    if(symbol){const img=document.createElement('img');img.src=SYMBOL_BASE+symbol.key+'.png';img.alt=symbol.label;reveal.appendChild(img)}
  }else{
    const miss=document.createElement('b'); miss.textContent='NO MATCH'; reveal.appendChild(miss)
  }
  const canvas=document.createElement('canvas');canvas.className='pr-scratch-canvas';canvas.width=600;canvas.height=360
  drawScratchSurface(canvas,logo);box.append(reveal,canvas)
  const caption=document.createElement('div');caption.className='pr-ticket3d__caption'
  if(state.status==='Pending') caption.textContent='HIDDEN'
  else if(rowTier>0n){
    const symbol=symbolForTier(rowTier)
    if(symbol){const img=document.createElement('img');img.src=SYMBOL_BASE+symbol.key+'.png';img.alt='';const label=document.createElement('span');label.textContent=symbol.label;caption.append(img,label)}
  }else caption.textContent='NO MATCH'
  cell.append(box,caption)
  if(canScratch){
    const scratchAt=(event:PointerEvent)=>{
      const ctx=canvas.getContext('2d');if(!ctx)return
      const rect=canvas.getBoundingClientRect(),sx=canvas.width/rect.width,sy=canvas.height/rect.height
      ctx.save();ctx.globalCompositeOperation='destination-out';ctx.beginPath();ctx.arc((event.clientX-rect.left)*sx,(event.clientY-rect.top)*sy,30,0,Math.PI*2);ctx.fill();ctx.restore()
    }
    canvas.addEventListener('pointerdown',(event)=>{event.stopPropagation();canvas.setPointerCapture(event.pointerId);scratchAt(event)})
    canvas.addEventListener('pointermove',(event)=>{event.stopPropagation();if(event.buttons)scratchAt(event)})
    canvas.addEventListener('pointerup',(event)=>event.stopPropagation())
    canvas.addEventListener('pointercancel',(event)=>event.stopPropagation())
  }
  return cell
}
export function mountCertifiedTicket3D(container:HTMLElement,state:CertifiedTicketState,options:Ticket3DOptions={}){
  ensureStyles();container.replaceChildren();container.classList.add('pr-ticket3d')
  const viewport=document.createElement('div');viewport.className='pr-ticket3d__viewport'
  const stage=document.createElement('div');stage.className='pr-ticket3d__stage'
  const card=document.createElement('div');card.className='pr-ticket3d__card'
  const front=document.createElement('div');front.className='pr-ticket3d__face pr-ticket3d__front'
  const back=document.createElement('div');back.className='pr-ticket3d__face pr-ticket3d__back'
  const art=document.createElement('img');const artNo=artworkIndex(state.identity.assetName)
  art.src=ARTWORK_BASE+'ticket'+artNo+'.jpg';art.alt='PRE-RICH ticket artwork '+artNo;art.className='pr-ticket3d__artwork';front.appendChild(art)
  const shade=document.createElement('div');shade.className='pr-ticket3d__front-shade';front.appendChild(shade)
  const game=document.createElement('section');game.className='pr-ticket3d__game'
  const statusLine=document.createElement('div');statusLine.className='pr-ticket3d__statusline'
  const statusText=document.createElement('span');statusText.textContent=state.status==='Pending'?'ISSUED · VERIFIED · AWAITING REVEAL':state.status==='Claimed'?'REVEALED · PAYOUT CLAIMED':'REVEALED · VERIFIED'
  const verified=document.createElement('span');verified.className='pr-ticket3d__verified';verified.textContent='NFT VERIFIED';statusLine.append(statusText,verified);game.appendChild(statusLine)
  const logo=document.createElement('img');logo.src=ARTWORK_BASE+'prerich-symbol.svg';logo.alt='PRE-RICH symbol';logo.style.position='fixed';logo.style.width='1px';logo.style.height='1px';logo.style.opacity='0';logo.style.pointerEvents='none';logo.style.left='-10px';logo.style.top='-10px';document.body.appendChild(logo)
  const buildRows=async()=>{
    await new Promise<void>((resolve)=>{if(logo.complete&&logo.naturalWidth>0){resolve();return}logo.onload=()=>resolve();logo.onerror=()=>resolve()})
    for(const start of [0,3]){
      const row=document.createElement('div');row.className='pr-ticket3d__row'
      const title=document.createElement('div');title.className='pr-ticket3d__row-title';title.textContent=start===0?'ROW 1':'ROW 2'
      const cells=document.createElement('div');cells.className='pr-ticket3d__cells'
      for(let j=0;j<3;j++)cells.appendChild(buildScratchCell(state,start+j,logo,state.status!=='Pending'))
      row.append(title,cells);game.appendChild(row)
    }
  }
  const priceText=formatUsdm(state.priceUsdm)+' USDM';const classId=classIdForPrice(state.priceUsdm)
  const meta=document.createElement('div');meta.className='pr-ticket3d__meta'
  for(const [label,value] of [['CLASS',classId===null?'—':String(classId)],['PRICE',priceText],['SERIAL',shortHex(state.identity.assetName,12)],['TICKET #',state.ticketNonce.toString()]]){
    const badge=document.createElement('div');badge.className='pr-ticket3d__badge';const small=document.createElement('small');small.textContent=label;const strong=document.createElement('b');strong.textContent=value;badge.append(small,strong);meta.appendChild(badge)
  }
  front.append(game,meta)

  const backInner=document.createElement('div');backInner.className='pr-ticket3d__back-inner'
  const brand=document.createElement('div');brand.className='pr-ticket3d__back-brand'
  const brandLogo=document.createElement('img');brandLogo.src=ARTWORK_BASE+'prerich-symbol.svg';brandLogo.alt='PRE-RICH'
  const brandText=document.createElement('div');const brandName=document.createElement('b');brandName.textContent='PRE-RICH';const brandSub=document.createElement('span');brandSub.textContent='DIGITAL SCRATCH TICKET NFT';brandText.append(brandName,brandSub);brand.append(brandLogo,brandText);backInner.appendChild(brand)

  const info=makePanel('TICKET INFORMATION')
  addKv(info,'Class',classId===null?'Unknown':'CLASS '+classId);addKv(info,'Ticket price (P)',priceText)
  addKv(info,'Serial',shortHex(state.identity.assetName,18));addKv(info,'Ticket #',state.ticketNonce.toString())
  addKv(info,'Issued',formatDate(state.issuedAt));addKv(info,'Expires',formatDate(state.expiresAt));backInner.appendChild(info)

  const legend=makePanel('CLASS '+(classId===null?'—':classId)+' · WINNING SYMBOLS')
  const legendWrap=document.createElement('div');legendWrap.className='pr-ticket3d__legend'
  for(const tier of [1,2,3,4,5]){
    const symbol=SYMBOLS[tier];const item=document.createElement('div');item.className='pr-ticket3d__legend-item'
    const img=document.createElement('img');img.src=SYMBOL_BASE+symbol.key+'.png';img.alt=symbol.label
    const name=document.createElement('span');name.textContent=symbol.label
    const payout=document.createElement('b');payout.textContent=payoutLabel(tier,state.priceUsdm)
    item.append(img,name,payout);legendWrap.appendChild(item)
  }
  legend.appendChild(legendWrap);backInner.appendChild(legend)

  const cert=makePanel('MATERIOS · CERTIFICATION','pr-ticket3d__cert')
  addKv(cert,'NFT identity',shortHex(state.identity.policyId,14)+'.'+shortHex(state.identity.assetName,10))
  addKv(cert,'Materios context',shortHex(state.materiosContext,18))
  addKv(cert,'Canonical ref',state.verificationReference?shortHex(state.verificationReference,22):'not attached')
  if(state.status!=='Pending'){
    const reveal=document.createElement('div');reveal.className='pr-ticket3d__reveal'
    const rtitle=document.createElement('strong');rtitle.textContent='REVEAL CERTIFICATE · VERIFIED';reveal.appendChild(rtitle)
    const rg=document.createElement('div');rg.className='pr-ticket3d__result-grid'
    for(const [label,value] of [['Row 1',state.row1Tier.toString()],['Row 2',state.row2Tier.toString()],['Payout',formatUsdm(state.prizeAmount)+' USDM'],['Result',shortHex(state.result,16)]]){
      const s=document.createElement('span');s.textContent=label+': '+value;rg.appendChild(s)
    }
    reveal.appendChild(rg);cert.appendChild(reveal)
  }
  backInner.appendChild(cert)

  const statusPanel=makePanel('TICKET STATUS','pr-ticket3d__status-panel')
  addKv(statusPanel,'State',state.status==='Pending'?'ISSUED · VERIFIED':state.status==='Revealed'?'REVEALED':'REVEALED · CLAIMED')
  addKv(statusPanel,'Payout',state.status==='Pending'?'Not yet revealed':formatUsdm(state.prizeAmount)+' USDM')
  addKv(statusPanel,'Terminal',state.status==='Claimed'?'CLAIMED':state.status==='Revealed'?'NOT CLAIMED':'OPEN')
  backInner.appendChild(statusPanel)

  back.appendChild(backInner);card.append(front,back);stage.appendChild(card);viewport.appendChild(stage);container.appendChild(viewport)

  let rotX=0,rotY=0,zoom=1,dragging=false,lastX=0,lastY=0
  const render=()=>{card.style.transform='scale('+zoom+') rotateX('+rotX+'deg) rotateY('+rotY+'deg)'}
  const setSide=(side:'front'|'back')=>{rotX=0;rotY=side==='back'?180:0;render()}
  const begin=(x:number,y:number)=>{dragging=true;lastX=x;lastY=y}
  const move=(x:number,y:number)=>{if(!dragging)return;rotY+=(x-lastX)*.45;rotX=Math.max(-28,Math.min(28,rotX-(y-lastY)*.38));lastX=x;lastY=y;render()}
  const end=()=>{dragging=false}
  stage.addEventListener('pointerdown',(e)=>{stage.setPointerCapture(e.pointerId);begin(e.clientX,e.clientY)})
  stage.addEventListener('pointermove',(e)=>move(e.clientX,e.clientY));stage.addEventListener('pointerup',end);stage.addEventListener('pointercancel',end)
  stage.addEventListener('wheel',(e)=>{e.preventDefault();zoom=Math.max(.78,Math.min(1.35,zoom+(e.deltaY<0?.05:-.05)));render()},{passive:false})
  const controls=document.createElement('div');controls.className='pr-ticket3d__controls'
  const f=document.createElement('button');f.textContent='Front';f.onclick=()=>setSide('front')
  const b=document.createElement('button');b.textContent='Back';b.onclick=()=>setSide('back')
  const r=document.createElement('button');r.textContent='Reset';r.onclick=()=>{rotX=0;rotY=0;zoom=1;render()}
  const refresh=document.createElement('button');refresh.textContent='Refresh canonical state';refresh.onclick=()=>options.onRequestCanonicalRefresh?.()
  controls.append(f,b,r,refresh);container.appendChild(controls)
  const hint=document.createElement('div');hint.className='pr-ticket3d__hint';hint.textContent=state.status==='Pending'
    ?'This NFT is issued and verified, but its outcome is still hidden. Scratch is locked until canonical Reveal.'
    :'Reveal is canonical. Scratch uncovers the verified result; the renderer never authorizes Reveal, Claim or Expire.'
  container.appendChild(hint)
  render();void buildRows()
  return ()=>{logo.remove();container.replaceChildren()}
}
