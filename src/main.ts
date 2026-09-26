import './style.css'
import wallet from './wallet'
import ui from './ui'
import { loadCertifiedTicketState } from './gameFlow'
import { mountCertifiedTicket3D } from './ticket3d'
import adSlots, {
  AD_SLOT_PACKAGES,
  calculateAdTotalUsd,
  formatUsd,
  getExpiryDateFromPackage,
  getPackageById,
} from './adSlots'

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <div class="app-shell">
    <h1>PreRich - Dev UI</h1>

    <div class="toolbar">
      <button id="connect">Connect Wallet</button>
      <button id="change-wallet" hidden>Change Wallet</button>
      <button id="buy">Buy Tickets</button>
      <button id="claim">Claim Prize</button>
    </div>

    <div id="wallet-info" class="wallet-panel">
      <div class="wallet-panel__identity">
        <span id="wallet-icon" class="wallet-icon" aria-hidden="true">◌</span>
        <span>
          <strong id="wallet-name">Wallet not connected</strong>
          <small id="wallet-address">Connect a CIP-30 wallet to continue.</small>
        </span>
      </div>
      <span id="wallet-balance">Balance: —</span>
    </div>
    <div id="wallet-picker" class="wallet-picker" hidden>
      <div class="wallet-picker__backdrop"></div>
      <section class="wallet-picker__dialog" role="dialog" aria-modal="true" aria-labelledby="wallet-picker-title">
        <button id="wallet-picker-close" class="wallet-picker__close" aria-label="Close">×</button>
        <span class="eyebrow">CIP-30</span>
        <h2 id="wallet-picker-title">Choose your wallet</h2>
        <p>Connect an injected Cardano wallet. Your wallet keeps custody of your keys and approves every transaction.</p>
        <div id="wallet-options" class="wallet-options"></div>
        <small class="wallet-picker__hint">Preprod only · no seed phrase or private key is requested.</small>
      </section>
    </div>

    <section class="card">
      <h2>Your certified ticket</h2>
      <p>Only an observed and identity-certified PrizeDatum can be rendered here.</p>
      <div id="ticket-3d"><div class="slot-status">No canonical ticket loaded.</div></div>
    </section>

    <section class="card">
      <h2>Ad slot pricing</h2>
      <p>Low-entry pricing with fixed packages and automatic expiry.</p>
      <div id="slot-packages" class="slot-packages"></div>
      <div id="slot-status" class="slot-status">No slot selected.</div>
    </section>

    <div id="status"></div>
  </div>
`

const status = (msg: string) => { const el = document.getElementById('status'); if (el) el.textContent = msg }
const slotStatus = (msg: string) => { const el = document.getElementById('slot-status'); if (el) el.textContent = msg }

const renderAdPackages = () => {
  const container = document.getElementById('slot-packages')
  if (!container) return

  container.innerHTML = AD_SLOT_PACKAGES.map((pkg) => {
    const total = calculateAdTotalUsd(pkg.id)
    const expiry = getExpiryDateFromPackage(pkg.id)
    return `
      <button class="slot-package" data-package-id="${pkg.id}">
        <span class="slot-package__title">${pkg.label}</span>
        <span class="slot-package__meta">${pkg.hours}h · ${formatUsd(total)}</span>
        <span class="slot-package__meta">Auto-expiry: ${expiry.toLocaleString()}</span>
      </button>
    `
  }).join('')

  container.querySelectorAll<HTMLButtonElement>('.slot-package').forEach((button) => {
    button.addEventListener('click', () => {
      const packageId = button.dataset.packageId as any
      const pkg = getPackageById(packageId)
      const total = calculateAdTotalUsd(pkg.id)
      const expiry = getExpiryDateFromPackage(pkg.id)
      slotStatus(`${pkg.label}: ${formatUsd(total)} · slot stays active until ${expiry.toLocaleString()}`)
      status(`Selected ad package: ${pkg.label} (${formatUsd(total)})`)
    })
  })
}

renderAdPackages()

const ticket3dContainer = document.getElementById('ticket-3d')
let lastTicketAssetId: string | null = null

const renderLastCertifiedTicket = async () => {
  if (!ticket3dContainer || !lastTicketAssetId) return
  try {
    const certified = await loadCertifiedTicketState({ assetId: lastTicketAssetId })
    mountCertifiedTicket3D(ticket3dContainer, certified, {
      onRequestCanonicalRefresh: async () => {
        await renderLastCertifiedTicket()
      },
    })
    status('Certified ticket state loaded from the canonical PrizeDatum.')
  } catch (e: any) {
    if (ticket3dContainer) {
      ticket3dContainer.innerHTML = '<div class="slot-status">Canonical ticket state unavailable.</div>'
    }
    status('3D ticket refresh error: ' + (e.message || e))
  }
}

const connectBtn = document.getElementById('connect') as HTMLButtonElement | null
const changeWalletBtn = document.getElementById('change-wallet') as HTMLButtonElement | null
const walletPicker = document.getElementById('wallet-picker') as HTMLElement | null
const walletOptions = document.getElementById('wallet-options') as HTMLElement | null
const walletPickerClose = document.getElementById('wallet-picker-close') as HTMLButtonElement | null
const walletNameEl = document.getElementById('wallet-name') as HTMLElement | null
const walletAddressEl = document.getElementById('wallet-address') as HTMLElement | null
const walletIconEl = document.getElementById('wallet-icon') as HTMLElement | null
let connected = false

function shortAddress(address: string) {
  return address.length > 18 ? address.slice(0, 10) + '…' + address.slice(-8) : address
}

function openWalletPicker() {
  if (!walletPicker || !walletOptions) return
  const options = wallet.discover()
  walletOptions.innerHTML = ''
  if (!options.length) {
    walletOptions.innerHTML = '<div class="wallet-empty">No CIP-30 wallet detected. Install a Cardano wallet extension and reload this page.</div>'
  } else {
    for (const option of options) {
      const button = document.createElement('button')
      button.className = 'wallet-option'
      button.type = 'button'
      const icon = document.createElement('img')
      icon.className = 'wallet-option__icon'
      icon.alt = ''
      icon.src = option.icon || ''
      icon.hidden = !option.icon
      const fallback = document.createElement('span')
      fallback.className = 'wallet-option__fallback'
      fallback.textContent = '◌'
      fallback.hidden = !!option.icon
      const label = document.createElement('span')
      label.className = 'wallet-option__label'
      label.textContent = option.name
      const meta = document.createElement('small')
      meta.textContent = option.apiVersion ? 'CIP-30 · API ' + option.apiVersion : 'CIP-30 wallet'
      button.append(icon, fallback, label, meta)
      button.addEventListener('click', async () => {
        try {
          closeWalletPicker()
          const res = await wallet.connect(option.id)
          connected = true
          connectBtn!.textContent = 'Disconnect'
          if (changeWalletBtn) changeWalletBtn.hidden = false
          if (walletNameEl) walletNameEl.textContent = res.walletName
          if (walletAddressEl) walletAddressEl.textContent = shortAddress(res.address)
          if (walletIconEl) {
            walletIconEl.textContent = ''
            if (option.icon) {
              const img = document.createElement('img')
              img.src = option.icon
              img.alt = ''
              walletIconEl.appendChild(img)
            } else walletIconEl.textContent = '◌'
          }
          const bal = await ui.refreshBalance().catch(() => '—')
          ui.updateWalletUI(true, res.address, bal)
          status('Connected to ' + res.walletName)
        } catch (e: any) {
          status('Wallet connection error: ' + (e.message || e))
        }
      })
      walletOptions.appendChild(button)
    }
  }
  walletPicker.hidden = false
}

function closeWalletPicker() {
  if (walletPicker) walletPicker.hidden = true
}

connectBtn?.addEventListener('click', async () => {
  if (connected) {
    await wallet.disconnect()
    connected = false
    connectBtn.textContent = 'Connect Wallet'
    if (changeWalletBtn) changeWalletBtn.hidden = true
    if (walletNameEl) walletNameEl.textContent = 'Wallet not connected'
    if (walletAddressEl) walletAddressEl.textContent = 'Connect a CIP-30 wallet to continue.'
    if (walletIconEl) walletIconEl.textContent = '◌'
    status('Disconnected')
    return
  }
  openWalletPicker()
})

changeWalletBtn?.addEventListener('click', openWalletPicker)
walletPickerClose?.addEventListener('click', closeWalletPicker)
walletPicker?.querySelector('.wallet-picker__backdrop')?.addEventListener('click', closeWalletPicker)

wallet.on('accountChanged', async (session) => {
  if (!session) return
  connected = true
  if (walletAddressEl) walletAddressEl.textContent = shortAddress(session.address)
  const bal = await ui.refreshBalance().catch(() => '—')
  ui.updateWalletUI(true, session.address, bal)
  status('Wallet account changed')
})

wallet.on('networkChanged', () => {
  status('Wallet network changed. PRE-RICH remains locked to Preprod.')
})

wallet.on('disconnect', () => {
  connected = false
  if (connectBtn) connectBtn.textContent = 'Connect Wallet'
  if (changeWalletBtn) changeWalletBtn.hidden = true
})

document.getElementById('claim')?.addEventListener('click', async () => {
  status('Claim unavailable: authoritative Economic Gate admission is required.')
})

document.getElementById('buy')?.addEventListener('click', async () => {
  // The UI has no authoritative Economic Gate producer yet. Do not synthesize
  // a witness merely to make the Buy button executable.
  status('Purchase unavailable: authoritative Economic Gate admission is required.')
})

export default adSlots
