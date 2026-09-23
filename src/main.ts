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
      <button id="buy">Buy Tickets</button>
      <button id="claim">Claim Prize</button>
    </div>

    <div id="wallet-info"><span id="wallet-balance">Balance: Not connected</span></div>

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
let connected = false
connectBtn?.addEventListener('click', async () => {
  if (connected) {
    await wallet.disconnect()
    connected = false
    connectBtn.textContent = 'Connect Wallet'
    status('Disconnected')
    return
  }
  try {
    const res = await wallet.connect()
    connected = true
    connectBtn.textContent = 'Disconnect'
    const bal = await ui.refreshBalance().catch(() => '—')
    ui.updateWalletUI(true, res.address, bal)
    status('Connected: ' + res.address)
  } catch (e: any) {
    status('Connect error: ' + (e.message || e))
  }
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
