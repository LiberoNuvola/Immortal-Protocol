import './style.css'
import wallet from './wallet'
import { PRE_POLICY_ID, PRE_ASSET_NAME_HEX, TREASURY_ADDRESS, BLOCKFROST_PROJECT_ID } from './config'

const unit = PRE_POLICY_ID + PRE_ASSET_NAME_HEX
const $ = (id:string) => document.getElementById(id)
const set = (id:string, value:string) => { const el=$(id); if(el) el.textContent=value }
const mark = (name:string, ok:boolean, detail?:string) => {
  const el = $(`check-${name}`)
  if (el) { el.textContent = ok ? 'OBSERVED' : (detail || 'OPEN'); el.classList.toggle('journey-ok', ok) }
  const row = document.querySelector(`[data-check="${name}"]`)
  row?.classList.toggle('verified', ok)
}

async function checkReadiness() {
  set('first-user-status','Connecting to the configured Preprod observation path…')
  try {
    const session = await wallet.connect()
    mark('wallet', true)
    const lucid = wallet.getLucid()
    const networkOk = session.network === 'Preprod'
    mark('network', networkOk, 'CHECK OPEN')
    let pre = 0n
    if (lucid) {
      const utxos = await lucid.utxosAt(session.address)
      for (const u of utxos) pre += BigInt(u.assets?.[unit] ?? 0n)
    }
    mark('pre', true, 'OBSERVED')
    set('check-pre', pre > 0n ? `OBSERVED · ${pre.toString()} PRE` : 'OBSERVED · 0 PRE')
    if (TREASURY_ADDRESS && lucid) {
      const treasury = await lucid.utxosAt(TREASURY_ADDRESS)
      let treasuryPre = 0n
      for (const u of treasury) treasuryPre += BigInt(u.assets?.[unit] ?? 0n)
      mark('treasury', true)
      set('check-treasury', `OBSERVED · ${treasuryPre.toString()} PRE`)
    } else {
      mark('treasury', false, 'CONFIGURATION OPEN')
    }
    set('first-user-status', `Runtime observation completed · Issue admission producer remains OPEN · provider ${BLOCKFROST_PROJECT_ID ? 'configured' : 'not configured'} · ${new Date().toISOString()}`)
  } catch (error) {
    set('first-user-status', error instanceof Error ? error.message : String(error))
    mark('wallet', false, 'OPEN')
  }
}

document.addEventListener('DOMContentLoaded', () => {
  $('check-first-user')?.addEventListener('click', () => { void checkReadiness() })
})