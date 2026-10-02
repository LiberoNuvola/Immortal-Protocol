import './style.css'
import wallet from './wallet'
import { PRE_POLICY_ID, PRE_ASSET_NAME_HEX, TREASURY_ADDRESS, BLOCKFROST_PROJECT_ID } from './config'

const unit = PRE_POLICY_ID + PRE_ASSET_NAME_HEX
const $ = (id:string) => document.getElementById(id)
const set = (id:string, value:string) => { const el=$(id); if(el) el.textContent=value }

async function observe() {
  set('runtime-status','Connecting to the configured Preprod observation path…')
  try {
    const session = await wallet.connect()
    const address = session.address
    set('wallet-network','Preprod')
    set('wallet-address', address)
    set('wallet-state','OBSERVED')

    const lucid = wallet.getLucid()
    let walletPre = 0n
    if (lucid) {
      const utxos = await lucid.utxosAt(address)
      for (const u of utxos) walletPre += BigInt(u.assets?.[unit] ?? 0n)
    }
    set('wallet-pre', walletPre.toString())

    if (TREASURY_ADDRESS && lucid) {
      const treasuryUtxos = await lucid.utxosAt(TREASURY_ADDRESS)
      let treasuryPre = 0n
      for (const u of treasuryUtxos) treasuryPre += BigInt(u.assets?.[unit] ?? 0n)
      set('treasury-address', TREASURY_ADDRESS)
      set('treasury-pre', treasuryPre.toString())
      set('treasury-state','OBSERVED')
    } else {
      set('treasury-state','CONFIGURATION OPEN')
      set('treasury-address','Not configured in this deployment')
    }

    set('provider-state', BLOCKFROST_PROJECT_ID ? 'CONFIGURED' : 'NOT CONFIGURED')
    set('observed-at', new Date().toISOString())
    set('runtime-status','Preprod observation completed from the configured application path.')
  } catch (error) {
    set('wallet-state','OPEN')
    set('runtime-status', error instanceof Error ? error.message : String(error))
  }
}

document.addEventListener('DOMContentLoaded', () => {
  $('observe')?.addEventListener('click', () => { void observe() })
})
