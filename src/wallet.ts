import { Blockfrost, Lucid } from 'lucid-cardano'
import { BLOCKFROST_PREPROD_URL, BLOCKFROST_PROJECT_ID } from './config'

declare const window: any

let lucidInstance: any = null
let connectedWallet: string | null = null

export type ConnectResult = { lucid: any; address: string; walletName: string }

export async function connect(network = 'Preprod'): Promise<ConnectResult> {
  const providers = window.cardano
  if (!providers) throw new Error('No Cardano wallet extension found.')
  if (!BLOCKFROST_PROJECT_ID) {
    throw new Error('Preprod provider is not configured. Set VITE_BLOCKFROST_PROJECT_ID locally; never commit the key.')
  }
  const keys = Object.keys(providers)
  for (const k of keys) {
    try {
      const prov = providers[k]
      if (!prov?.enable) continue
      const api = await prov.enable()
      const lucid = await Lucid.new(new Blockfrost(BLOCKFROST_PREPROD_URL, BLOCKFROST_PROJECT_ID), network)
      lucid.selectWallet(api)
      lucidInstance = lucid
      connectedWallet = k
      const address = await lucid.wallet.address()
      return { lucid, address, walletName: k }
    } catch (_) {}
  }
  throw new Error('Unable to connect a Cardano wallet on Preprod.')
}

export function getLucid() { return lucidInstance }
export async function disconnect() { lucidInstance = null; connectedWallet = null }
export async function getAddress(): Promise<string> { if (!lucidInstance) throw new Error('Wallet not connected'); return await lucidInstance.wallet.address() }
export function isConnected() { return !!lucidInstance }
export function connectedName() { return connectedWallet }
export default { connect, getLucid, disconnect, getAddress, isConnected, connectedName }
