import type { CertifiedTicketState } from '../PRE-RICH/src/PreRichCertifiedTicket'
import { PRE_RICH_CANONICAL_PRICES } from '../PRE-RICH/src/PreRichCardanoObservationProjection'
import { defaultPrizeTable, prizeAmountForTier } from './gameRules'

type Ticket3DOptions = {
  onRequestCanonicalRefresh?: () => void | Promise<void>
}

const ARTWORK_BASE = '/assets/pre-rich/'
const SYMBOL_BASE = ARTWORK_BASE + 'symbols/'
export function escapeHtml(value:string):string{
  return value
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;')
    .replace(/'/g,'&#39;')
}

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