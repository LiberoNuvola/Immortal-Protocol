import type { CertifiedTicketState } from '../PRE-RICH/profile/PreRichCertifiedTicket'

export type Ticket3DOptions = {
  onRequestCanonicalRefresh?: () => void | Promise<void>
}

const STYLE_ID = 'pre-rich-ticket-3d-style'

function ensureStyles() {
  if (document.getElementById(STYLE_ID)) return
  const style = document.createElement('style')
  style.id = STYLE_ID
  style.textContent = `
    .pr3d { perspective: 1200px; display: grid; gap: 14px; place-items: center; width: 100%; user-select: none; }
    .pr3d__stage { width: min(720px, 92vw); aspect-ratio: 1.6; position: relative; cursor: grab; touch-action: none; }
    .pr3d__stage:active { cursor: grabbing; }
    .pr3d__card { width: 100%; height: 100%; position: relative; transform-style: preserve-3d; transition: transform 120ms ease-out; }
    .pr3d__face { position: absolute; inset: 0; backface-visibility: hidden; border-radius: 20px; overflow: hidden; box-shadow: 0 18px 45px rgba(0,0,0,.22); border: 1px solid rgba(0,0,0,.12); padding: 24px; box-sizing: border-box; }
    .pr3d__front { background: linear-gradient(135deg,#fdf6d8,#f7e9ab); color: #1c1c1c; }
    .pr3d__back { background: linear-gradient(135deg,#f3f3f3,#d8d8d8); color: #1c1c1c; transform: rotateY(180deg); }
    .pr3d__identity { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: .78rem; opacity: .75; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .pr3d__title { font-size: 1.55rem; font-weight: 800; margin: 4px 0 12px; }
    .pr3d__grid { display: grid; grid-template-columns: repeat(2,minmax(0,1fr)); gap: 10px; }
    .pr3d__field { background: rgba(255,255,255,.58); border-radius: 12px; padding: 10px 12px; }
    .pr3d__field small { display:block; opacity:.65; margin-bottom:4px; }
    .pr3d__field strong { font-size: 1rem; }
    .pr3d__rows { display: flex; gap: 8px; margin-top: 12px; flex-wrap: wrap; }
    .pr3d__row { padding: 7px 10px; border-radius: 999px; background: rgba(0,0,0,.08); font-size: .82rem; }
    .pr3d__status { display: inline-flex; padding: 6px 10px; border-radius: 999px; background: rgba(0,0,0,.08); font-weight: 700; }
    .pr3d__scratch { position: absolute; inset: 0; z-index: 4; width: 100%; height: 100%; }
    .pr3d__actions { display:flex; gap:8px; flex-wrap:wrap; justify-content:center; }
    .pr3d__actions button { border: 0; border-radius: 10px; padding: 9px 13px; cursor: pointer; }
    .pr3d__meta { font-size:.78rem; opacity:.7; max-width:720px; text-align:center; }
  `
  document.head.appendChild(style)
}

function text(value: unknown): string {
  return String(value)
}

export function escapeHtml(value: unknown): string {
  return text(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export function mountCertifiedTicket3D(
  container: HTMLElement,
  state: CertifiedTicketState,
  options: Ticket3DOptions = {},
) {
  ensureStyles()
  container.innerHTML = ''
  container.classList.add('pr3d')

  const stage = document.createElement('div')
  stage.className = 'pr3d__stage'
  const card = document.createElement('div')
  card.className = 'pr3d__card'
  const front = document.createElement('div')
  front.className = 'pr3d__face pr3d__front'
  const back = document.createElement('div')
  back.className = 'pr3d__face pr3d__back'

  const row1 = state.row1Tier === 0n ? 'LOSS' : `ROW 1 · TIER ${escapeHtml(state.row1Tier)}`
  const row2 = state.row2Tier === 0n ? 'LOSS' : `ROW 2 · TIER ${escapeHtml(state.row2Tier)}`
  const resultLabel = state.status === 'Pending'
    ? 'OUTCOME HIDDEN'
    : state.prizeAmount > 0n
      ? `PAYOUT ${text(state.prizeAmount)}`
      : 'REVEALED / NO PAYOUT'

  front.innerHTML = `
    <div class='pr3d__identity'>CERTIFIED TICKET · ${escapeHtml(state.identity.policyId)}.${escapeHtml(state.identity.assetName)}</div>
    <div class='pr3d__title'>PRE-RICH Scratch Ticket</div>
    <div class='pr3d__status'>${escapeHtml(state.status)} · ${escapeHtml(resultLabel)}</div>
    <div class='pr3d__grid' style='margin-top:14px'>
      <div class='pr3d__field'><small>Price</small><strong>${escapeHtml(state.priceUsdm)} USDM sub-units</strong></div>
      <div class='pr3d__field'><small>Ticket nonce</small><strong>${escapeHtml(state.ticketNonce)}</strong></div>
      <div class='pr3d__field'><small>Issued</small><strong>${escapeHtml(new Date(Number(state.issuedAt)).toISOString())}</strong></div>
      <div class='pr3d__field'><small>Expires</small><strong>${escapeHtml(new Date(Number(state.expiresAt)).toISOString())}</strong></div>
    </div>
    <div class='pr3d__rows'><span class='pr3d__row'>${escapeHtml(row1)}</span><span class='pr3d__row'>${escapeHtml(row2)}</span></div>
  `

  back.innerHTML = `
    <div class='pr3d__identity'>CANONICAL RECEIPT</div>
    <div class='pr3d__title'>Ticket Receipt</div>
    <div class='pr3d__grid'>
      <div class='pr3d__field'><small>Policy ID</small><strong>${escapeHtml(state.identity.policyId)}</strong></div>
      <div class='pr3d__field'><small>Asset name</small><strong>${escapeHtml(state.identity.assetName)}</strong></div>
      <div class='pr3d__field'><small>Game version</small><strong>${escapeHtml(state.gameVersion)}</strong></div>
      <div class='pr3d__field'><small>Commitment</small><strong>${escapeHtml(state.commitment.slice(0, 16))}…</strong></div>
      <div class='pr3d__field'><small>Beacon target</small><strong>${escapeHtml(state.beaconTarget)}</strong></div>
      <div class='pr3d__field'><small>Verification</small><strong>${escapeHtml(state.verificationReference ?? 'not attached')}</strong></div>
    </div>
    <div class='pr3d__rows'><span class='pr3d__row'>Row 1: ${escapeHtml(state.row1Tier)}</span><span class='pr3d__row'>Row 2: ${escapeHtml(state.row2Tier)}</span><span class='pr3d__row'>Tier: ${escapeHtml(state.prizeTier)}</span></div>
  `

  const scratch = document.createElement('canvas')
  scratch.className = 'pr3d__scratch'
  scratch.width = 1200
  scratch.height = 750
  const ctx = scratch.getContext('2d')
  if (!ctx) throw new Error('ticket 3D scratch canvas unavailable')
  ctx.fillStyle = '#c6c6c6'
  ctx.fillRect(0,0,scratch.width,scratch.height)
  ctx.globalCompositeOperation = 'destination-out'

  card.append(front, back)
  stage.append(card, scratch)
  container.append(stage)

  let rotX = 0
  let rotY = 0
  let zoom = 1
  let dragging = false
  let lastX = 0
  let lastY = 0

  const render = () => {
    card.style.transform = `scale(${zoom}) rotateX(${rotX}deg) rotateY(${rotY}deg)`
  }
  render()

  const begin = (x:number,y:number) => { dragging=true; lastX=x; lastY=y }
  const move = (x:number,y:number) => {
    if (!dragging) return
    rotY += (x-lastX)*0.45
    rotX = Math.max(-35, Math.min(35, rotX-(y-lastY)*0.45))
    lastX=x; lastY=y; render()
  }
  const end = () => { dragging=false }

  stage.addEventListener('pointerdown',(e)=>{ stage.setPointerCapture(e.pointerId); begin(e.clientX,e.clientY) })
  stage.addEventListener('pointermove',(e)=>move(e.clientX,e.clientY))
  stage.addEventListener('pointerup',end)
  stage.addEventListener('pointercancel',end)
  stage.addEventListener('wheel',(e)=>{ e.preventDefault(); zoom=Math.max(.72,Math.min(1.55,zoom+(e.deltaY<0?.06:-.06))); render() },{passive:false})

  const scratchAt = (e:PointerEvent) => {
    const rect = scratch.getBoundingClientRect()
    const sx = scratch.width / rect.width
    const sy = scratch.height / rect.height
    ctx.beginPath()
    ctx.arc((e.clientX-rect.left)*sx,(e.clientY-rect.top)*sy,72,0,Math.PI*2)
    ctx.fill()
  }
  scratch.addEventListener('pointerdown',(e)=>{ scratch.setPointerCapture(e.pointerId); scratchAt(e) })
  scratch.addEventListener('pointermove',(e)=>{ if (e.buttons) scratchAt(e) })

  const actions = document.createElement('div')
  actions.className = 'pr3d__actions'
  const reset = document.createElement('button')
  reset.textContent = 'Reset view'
  reset.onclick = () => { rotX=0; rotY=0; zoom=1; render() }
  const refresh = document.createElement('button')
  refresh.textContent = 'Refresh canonical state'
  refresh.onclick = () => options.onRequestCanonicalRefresh?.()
  const note = document.createElement('div')
  note.className = 'pr3d__meta'
  note.textContent = '3D interaction is presentation-only. Canonical status changes must come from a newly verified ticket state; the renderer never authorizes Reveal, Claim or Expire.'
  actions.append(reset,refresh)
  container.append(actions,note)

  return () => {
    container.replaceChildren()
  }
}