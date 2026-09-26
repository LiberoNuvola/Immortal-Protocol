import { Constr, Data } from 'lucid-cardano'
import wallet from './wallet'
import { treasuryValidator } from './loadValidator'
import { PRE_POLICY_ID, PRE_ASSET_NAME_HEX } from './config'

const $ = (id:string) => document.getElementById(id)!
const status = (m:string) => { $('status').textContent = 'Status: ' + m }
let treasuryAddress = ''

function treasuryDatum() {
  const zero = '00'.repeat(28)
  return new Constr(0, [0n, zero, zero, zero, zero, 2500n, 2500n, 2500n, 2500n])
}

async function derive() {
  const lucid = wallet.getLucid()
  if (!lucid) return
  treasuryAddress = lucid.utils.validatorToAddress(treasuryValidator)
  $('address').textContent = treasuryAddress
}

async function refresh() {
  const lucid = wallet.getLucid()
  if (!lucid || !treasuryAddress) return
  const utxos = await lucid.utxosAt(treasuryAddress)
  const unit = PRE_POLICY_ID + PRE_ASSET_NAME_HEX
  const total = utxos.reduce((n:any,u:any)=>n + BigInt(u.assets?.[unit] ?? 0n),0n)
  $('pre').textContent = total.toString() + ' PRE · ' + utxos.length + ' UTxO(s)'
}

$('connect').addEventListener('click', async () => {
  try {
    const r = await wallet.connect()
    $('wallet').textContent = r.walletName + ' · ' + r.address
    await derive(); await refresh(); status('Connected to Preprod. Treasury address derived from the script.')
  } catch(e:any) { status(e?.message || String(e)) }
})
$('refresh').addEventListener('click', async () => { try { await refresh(); status('On-chain Treasury state refreshed.') } catch(e:any){status(e?.message||String(e))} })
$('copy').addEventListener('click', async () => { if(treasuryAddress) { await navigator.clipboard.writeText(treasuryAddress); status('Treasury address copied.') } })

async function deposit(assets:any) {
  const lucid = wallet.getLucid(); if (!lucid || !treasuryAddress) throw new Error('Connect the user wallet first.')
  const tx = lucid.newTx().payToContract(treasuryAddress,{inline:Data.to(treasuryDatum())},assets).addSigner(await lucid.wallet.address()).validFrom(Date.now()-30000).validTo(Date.now()+300000)
  const signed = await (await tx.complete()).sign().complete()
  const hash = await signed.submit(); await lucid.awaitTx(hash); return hash
}
$('depositPre').addEventListener('click', async()=>{try{const n=BigInt(($('preAmount') as HTMLInputElement).value);if(n<=0n)throw new Error('PRE amount must be positive.');const h=await deposit({lovelace:3000000n,[PRE_POLICY_ID+PRE_ASSET_NAME_HEX]:n});status('PRE deposit confirmed: '+h);await refresh()}catch(e:any){status(e?.message||String(e))}})
$('depositAda').addEventListener('click', async()=>{try{const n=BigInt(($('adaAmount') as HTMLInputElement).value);if(n<2n)throw new Error('Use at least 2 ADA for this Preprod deposit.');const h=await deposit({lovelace:n*1000000n});status('ADA deposit confirmed: '+h);await refresh()}catch(e:any){status(e?.message||String(e))}})
