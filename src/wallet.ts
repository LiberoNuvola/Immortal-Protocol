import { Blockfrost, Lucid, type Network } from 'lucid-cardano'
import { BLOCKFROST_PREPROD_URL, BLOCKFROST_PROJECT_ID } from './config'

declare global {
  interface Window {
    cardano?: Record<string, Cip30Provider>
  }
}

export type Cip30Provider = {
  enable: () => Promise<any>
  name?: string
  icon?: string
  apiVersion?: string
  isEnabled?: () => Promise<boolean>
}

export type WalletOption = {
  id: string
  name: string
  icon?: string
  apiVersion?: string
}

export type WalletSession = {
  lucid: any
  address: string
  walletName: string
  walletId: string
  apiVersion?: string
  network: Network
}

export type WalletEvent = 'connect' | 'disconnect' | 'accountChanged' | 'networkChanged'

type Listener = (session: WalletSession | null) => void

const STORAGE_KEY = 'immortal.wallet.v1'
let lucidInstance: any = null
let connectedWallet: WalletOption | null = null
let connectedApi: any = null
let currentNetwork: Network = 'Preprod'
const listeners: Record<WalletEvent, Set<Listener>> = {
  connect: new Set(),
  disconnect: new Set(),
  accountChanged: new Set(),
  networkChanged: new Set(),
}

function emit(event: WalletEvent, session: WalletSession | null) {
  for (const listener of listeners[event]) {
    try { listener(session) } catch (error) { console.warn('wallet listener failed', error) }
  }
}

function provider(id: string): Cip30Provider {
  const value = window.cardano?.[id]
  if (!value?.enable) throw new Error(`Wallet provider unavailable: ${id}`)
  return value
}

function displayName(id: string, value: Cip30Provider): string {
  if (value.name?.trim()) return value.name.trim()
  return id.charAt(0).toUpperCase() + id.slice(1)
}

function sessionSnapshot(): WalletSession | null {
  if (!lucidInstance || !connectedWallet) return null
  return {
    lucid: lucidInstance,
    address: '',
    walletName: connectedWallet.name,
    walletId: connectedWallet.id,
    apiVersion: connectedWallet.apiVersion,
    network: currentNetwork,
  }
}

function savePreference(id: string) {
  try { localStorage.setItem(STORAGE_KEY, id) } catch {}
}

function preferredWalletId(): string | null {
  try { return localStorage.getItem(STORAGE_KEY) } catch { return null }
}

export function discover(): WalletOption[] {
  const providers = window.cardano ?? {}
  return Object.entries(providers)
    .filter(([, value]) => !!value?.enable)
    .map(([id, value]) => ({
      id,
      name: displayName(id, value),
      icon: value.icon,
      apiVersion: value.apiVersion,
    }))
    .sort((a, b) => a.name.localeCompare(b.name))
}

export function preferredWallet(): string | null {
  return preferredWalletId()
}

export async function connect(walletId?: string, network: Network = 'Preprod'): Promise<WalletSession> {
  if (!BLOCKFROST_PROJECT_ID) {
    throw new Error('Preprod provider is not configured. Set VITE_BLOCKFROST_PROJECT_ID locally; never commit the key.')
  }

  const options = discover()
  if (!options.length) throw new Error('No CIP-30 Cardano wallet was detected.')
  const selectedId = walletId ?? preferredWalletId() ?? (options.length === 1 ? options[0].id : null)
  if (!selectedId) throw new Error('Select a Cardano wallet before connecting.')

  const selected = options.find(option => option.id === selectedId)
  if (!selected) throw new Error(`Selected wallet is no longer available: ${selectedId}`)

  const api = await provider(selected.id).enable()
  const lucid = await Lucid.new(
    new Blockfrost(BLOCKFROST_PREPROD_URL, BLOCKFROST_PROJECT_ID),
    network,
  )
  lucid.selectWallet(api)

  lucidInstance = lucid
  connectedApi = api
  connectedWallet = selected
  currentNetwork = network
  savePreference(selected.id)

  const address = await lucid.wallet.address()
  const session: WalletSession = {
    lucid,
    address,
    walletName: selected.name,
    walletId: selected.id,
    apiVersion: selected.apiVersion,
    network,
  }

  bindCip30Events(api)
  emit('connect', session)
  return session
}

function bindCip30Events(api: any) {
  if (typeof api?.onAccountChange === 'function') {
    api.onAccountChange(async () => {
      if (!lucidInstance || !connectedWallet) return
      try {
        const address = await lucidInstance.wallet.address()
        emit('accountChanged', { ...sessionSnapshot()!, address })
      } catch {}
    })
  }

  if (typeof api?.onNetworkChange === 'function') {
    api.onNetworkChange(async (networkId: number) => {
      // Cardano network IDs: 0 = testnet, 1 = mainnet.
      // The application is deliberately Preprod-only here.
      if (networkId !== 0) {
        await disconnect()
        return
      }
      if (lucidInstance && connectedWallet) {
        const address = await lucidInstance.wallet.address()
        emit('networkChanged', { ...sessionSnapshot()!, address })
      }
    })
  }
}

export function on(event: WalletEvent, listener: Listener): () => void {
  listeners[event].add(listener)
  return () => listeners[event].delete(listener)
}

export async function disconnect() {
  const old = sessionSnapshot()
  lucidInstance = null
  connectedApi = null
  connectedWallet = null
  emit('disconnect', old)
}

export function getLucid() {
  return lucidInstance
}

export function getApi() {
  return connectedApi
}

export async function getAddress(): Promise<string> {
  if (!lucidInstance) throw new Error('Wallet not connected')
  return await lucidInstance.wallet.address()
}

export function isConnected() {
  return !!lucidInstance
}

export function connectedName() {
  return connectedWallet?.name ?? null
}

export function connectedId() {
  return connectedWallet?.id ?? null
}

export default {
  discover,
  preferredWallet,
  connect,
  disconnect,
  on,
  getLucid,
  getApi,
  getAddress,
  isConnected,
  connectedName,
  connectedId,
}
