import './style.css'
import wallet from './wallet'
import ui from './ui'
import { loadCertifiedTicketState } from './gameFlow'
import { mountCertifiedTicket3D } from './ticket3d'
import { TICKET_POLICY_ID } from './config'
import adSlots, {
  AD_SLOT_PACKAGES,
  calculateAdTotalUsd,
  formatUsd,
  getExpiryDateFromPackage,
  getPackageById,
} from './adSlots'

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <div class="app-shell dapp-shell prerich-game-shell">
    <header class="dapp-header">
      <div class="dapp-brand-lockup prerich-brand">
        <div class="prerich-logo">PRE<span>-</span>RICH</div>
        <div>
          <span class="dapp-kicker">PRE-RICH · SCRATCH & WIN</span>
          <h1>Scratch. Reveal. Win.</h1>
          <div class="dapp-product-line"><strong>POWERED BY IMMORTAL</strong><span>Cardano · Preprod</span></div>
          <p>A meme-token scratch ticket backed by verifiable on-chain rules. Play first; open the verification drawer whenever you want to inspect what happened.</p>
        </div>
      </div>
      <div class="dapp-header__actions">
        <span class="network-pill">CARDANO · PREPROD</span>
        <button id="connect" class="primary-action">Connect Wallet</button>
        <button id="change-wallet" class="secondary-action" hidden>Change Wallet</button>
      </div>
    </header>

    <section class="game-hero dapp-card">
      <div class="game-hero__copy">
        <span class="hero-badge">PRE-RICH · LIVE TEST ENVIRONMENT</span>
        <h2>Pick a class. Buy a ticket. Scratch to reveal.</h2>
        <p>The winning outcome is not exposed by the interface before the canonical reveal transition. The game experience stays simple; the evidence remains inspectable.</p>
        <div class="game-hero__actions">
          <a class="secondary-action" href="#play">How it works</a>
          <button id="open-verify" class="secondary-action" type="button">Verify everything</button>
        </div>
      </div>
      <div class="game-hero__art" aria-hidden="true">
        <div class="coin-stack"><span></span><span></span><span></span></div>
        <div class="scratch-preview"><b>PRE-RICH</b><small>SCRATCH & WIN</small></div>
      </div>
    </section>

    <section class="dapp-grid" id="play">
      <article class="dapp-card wallet-card">
        <div class="dapp-card__head"><span class="dapp-label">01 · IDENTITY</span><span id="wallet-state-badge" class="state-badge">NOT CONNECTED</span></div>
        <div class="wallet-panel">
          <div class="wallet-panel__identity"><span id="wallet-icon" class="wallet-icon" aria-hidden="true">◌</span><span><strong id="wallet-name">Wallet not connected</strong><small id="wallet-address">Connect a CIP-30 wallet to continue.</small></span></div>
          <span id="wallet-balance">Balance: —</span>
        </div>
        <p class="microcopy">CIP-30 keeps signing authority in the user's wallet. The DApp never asks for a seed phrase or private key.</p>
      </article>

      <article class="dapp-card readiness-card">
        <div class="dapp-card__head"><span class="dapp-label">02 · GAME READINESS</span><span class="state-badge observing">READY TO OBSERVE</span></div>
        <div class="readiness-list">
          <div><span>Network</span><b>Preprod</b></div>
          <div><span>Wallet</span><b id="readiness-wallet">Not connected</b></div>
          <div><span>Economic admission</span><b>Producer required</b></div>
          <div><span>Submission</span><b>Wallet → Cardano Adapter</b></div>
        </div>
        <div class="gate-note"><strong>FAIR PLAY BOUNDARY</strong><span>The browser never invents economic admission. A ticket can be issued only when the authoritative economic boundary approves it.</span></div>
      </article>
    </section>

    <section class="lifecycle-card game-lifecycle">
      <div class="dapp-card__head"><span class="dapp-label">HOW YOUR TICKET WORKS</span><a href="/first-user.html">Technical path →</a></div>
      <div class="lifecycle">
        <div class="lifecycle-step active"><span>01</span><b>BUY</b><small>Wallet signature</small></div><i>→</i>
        <div class="lifecycle-step"><span>02</span><b>GET TICKET</b><small>NFT in wallet</small></div><i>→</i>
        <div class="lifecycle-step"><span>03</span><b>SYNC</b><small>Finality</small></div><i>→</i>
        <div class="lifecycle-step"><span>04</span><b>SCRATCH</b><small>Reveal</small></div><i>→</i>
        <div class="lifecycle-step"><span>05</span><b>CLAIM</b><small>Winner only</small></div>
      </div>
    </section>

    <section class="dapp-grid">
      <article class="dapp-card ticket-card my-ticket-card">
        <div class="dapp-card__head"><span class="dapp-label">MY TICKET</span><span class="state-badge">ON-CHAIN</span></div>
        <p>Your PRE-RICH NFT is the ticket. The visual surface is only the game interface; the canonical state lives on Cardano.</p>
        <div id="ticket-3d"><div class="slot-status">No canonical ticket loaded.</div></div>
      </article>

      <article class="dapp-card class-card">
        <div class="dapp-card__head"><span class="dapp-label">TICKET CLASSES</span><span class="state-badge observing">CHOOSE YOUR ENTRY</span></div>
        <p>Higher classes use the same game lifecycle with a different ticket denomination defined by PRE-RICH.</p>
      </article>
      <div class="class-explain">
        <div><b>1 USDM</b><small>Genesis · first entry</small></div>
        <div><b>2–10 USDM</b><small>Progressive classes</small></div>
        <div><b>25–100 USDM</b><small>Higher denominations</small></div>
      </div>
    </section>

    <section class="purchase-console dapp-card">
      <div class="dapp-card__head"><span class="dapp-label">PLAY · BUY YOUR TICKET</span><span id="issue-gate-state" class="state-badge">GATE LOCKED</span></div>
      <div class="purchase-console__grid">
        <div>
          <span class="dapp-label">SELECTED CLASS</span>
          <h2 id="selected-class">Genesis / 1 USDM</h2>
          <p id="selected-class-note">Choose the ticket you want. The final purchase remains subject to the authoritative PRE-RICH economic gate.</p>
          <div class="price-ladder" id="price-ladder">
            <button type="button" data-price="1" class="price-choice selected" aria-pressed="true">1</button>
            <button type="button" data-price="2" class="price-choice" aria-pressed="false">2</button>
            <button type="button" data-price="3" class="price-choice" aria-pressed="false">3</button>
            <button type="button" data-price="5" class="price-choice" aria-pressed="false">5</button>
            <button type="button" data-price="10" class="price-choice" aria-pressed="false">10</button>
            <button type="button" data-price="25" class="price-choice" aria-pressed="false">25</button>
            <button type="button" data-price="50" class="price-choice" aria-pressed="false">50</button>
            <button type="button" data-price="100" class="price-choice" aria-pressed="false">100</button>
          </div>
        </div>
        <div class="admission-checklist game-checklist">
          <div><span>Selected ticket</span><b id="game-class">GENESIS · 1 USDM</b></div>
          <div><span>Prize eligibility</span><b id="game-eligibility">AWAITING OBSERVATION</b></div>
          <div><span>Economic admission</span><b id="gate-check">LOCKED</b></div>
          <div><span>Wallet signature</span><b id="game-signature">REQUIRED</b></div>
        </div>
      </div>
      <div class="purchase-console__footer">
        <span>Play surface: simple.</span>
        <span>Verification surface: complete.</span>
      </div>
    </section>

    <section class="transaction-preview dapp-card verify-panel" id="verify-panel">
      <div class="dapp-card__head">
        <span class="dapp-label">VERIFY EVERYTHING</span>
        <span id="preview-state" class="state-badge">NOT READY</span>
      </div>
      <div class="preview-intro">
        <div>
          <h2>Everything the game knows — and nothing it invents.</h2>
          <p>Open this panel when you want the engineering view: observed state, admission, transaction construction and canonical evidence.</p>
        </div>
        <div class="preview-warning">PLAYER ACTION STILL REQUIRES WALLET SIGNATURE</div>
      </div>
      <div class="preview-grid">
        <div class="preview-section">
          <span class="dapp-label">ECONOMIC REQUEST</span>
          <div class="preview-row"><span>Application</span><b>PRE-RICH</b></div>
          <div class="preview-row"><span>Class</span><b id="preview-class">Genesis</b></div>
          <div class="preview-row"><span>Economic price</span><b id="preview-price">1 USDM</b></div>
          <div class="preview-row"><span>Action</span><b>ISSUE</b></div>
        </div>
        <div class="preview-section">
          <span class="dapp-label">OBSERVED / REQUIRED</span>
          <div class="preview-row"><span>Wallet</span><b id="preview-wallet">NOT CONNECTED</b></div>
          <div class="preview-row"><span>Network</span><b>PREPROD</b></div>
          <div class="preview-row"><span>Treasury</span><b>DEPLOYMENT OBSERVATION</b></div>
          <div class="preview-row"><span>Economic admission</span><b id="preview-admission">REQUIRED</b></div>
        </div>
        <div class="preview-section">
          <span class="dapp-label">ATOMIC TRANSITION</span>
          <ul class="preview-list">
            <li>Counter continuation</li>
            <li>Ticket NFT → buyer</li>
            <li>PrizeDatum → canonical pool binding</li>
            <li>Pool continuation</li>
            <li>Treasury payment</li>
          </ul>
        </div>
      </div>
      <div class="preview-footer">
        <span id="preview-message">Connect a Preprod wallet. Authoritative admission is still required.</span>
        <button id="preview-sign" class="primary-action" disabled>Sign transaction</button>
      </div>
    </section>

    <section class="dapp-actions game-actions">
      <button id="buy" class="primary-action game-buy" disabled>Buy Ticket — connect wallet</button>
      <button id="claim" class="secondary-action game-claim" disabled>Claim Prize — winner only</button>
    </section>

    <div id="wallet-picker" class="wallet-picker" hidden>
      <div class="wallet-picker__backdrop"></div>
      <section class="wallet-picker__dialog" role="dialog" aria-modal="true" aria-labelledby="wallet-picker-title">
        <button id="wallet-picker-close" class="wallet-picker__close" aria-label="Close">×</button>
        <span class="eyebrow">CIP-30</span><h2 id="wallet-picker-title">Choose your wallet</h2>
        <p>Connect an injected Cardano wallet. Your wallet keeps custody of your keys and approves every transaction.</p>
        <div id="wallet-options" class="wallet-options"></div>
        <small class="wallet-picker__hint">Preprod only · no seed phrase or private key is requested.</small>
      </section>
    </div>
    <section class="how-to-play dapp-card">
      <div class="dapp-card__head"><span class="dapp-label">HOW TO PLAY</span><span class="state-badge observing">PRE-RICH</span></div>
      <div class="how-to-play__grid"><div><b>1 · CONNECT</b><span>Use a CIP-30 Cardano wallet.</span></div><div><b>2 · CHOOSE</b><span>Pick the ticket class you want.</span></div><div><b>3 · BUY</b><span>Approve the transaction in your wallet.</span></div><div><b>4 · SCRATCH</b><span>Reveal only after the canonical lifecycle allows it.</span></div><div><b>5 · WIN</b><span>Claim a verified payout when your ticket is a winner.</span></div></div>
      <details class="fairness-note"><summary>Why cannot the game show the prize immediately?</summary><p>The interface does not decide or display a winning result before the protocol's reveal/finality path. That keeps the game visual separate from the source of truth.</p></details>
    </section>
    <section id="status" class="dapp-status">Ready. Connect a Preprod wallet to play PRE-RICH.</section>
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

let selectedIssuePrice = 1
const issueClassNames: Record<number, string> = {1:'Genesis',2:'Class 2',3:'Class 3',5:'Class 4',10:'Class 5',25:'Class 6',50:'Class 7',100:'Class 8'}

const syncPreview = () => {
  const name = issueClassNames[selectedIssuePrice] || 'Application class'
  const connectedWallet = connected ? 'CONNECTED' : 'NOT CONNECTED'
  const ready = connected
  const setText = (id: string, value: string) => { const el = document.getElementById(id); if (el) el.textContent = value }
  setText('preview-class', name)
  setText('preview-price', selectedIssuePrice + ' USDM')
  setText('preview-wallet', connectedWallet)
  setText('preview-admission', 'REQUIRED')
  setText('preview-message', ready
    ? 'Wallet connected. Preview is ready, but authoritative Economic Gate admission is still required before signing.'
    : 'Connect a Preprod wallet. Authoritative admission is still required.')
  const state = document.getElementById('preview-state')
  if (state) state.textContent = ready ? 'AWAITING ADMISSION' : 'NOT READY'
  const sign = document.getElementById('preview-sign') as HTMLButtonElement | null
  if (sign) sign.disabled = true
}

document.querySelectorAll<HTMLButtonElement>('.price-choice').forEach((button) => {
  button.addEventListener('click', () => {
    selectedIssuePrice = Number(button.dataset.price || 1)
    document.querySelectorAll('.price-choice').forEach((b) => b.classList.remove('selected'))
    button.classList.add('selected')
    document.querySelectorAll<HTMLButtonElement>('.price-choice').forEach((b) => b.setAttribute('aria-pressed', String(b === button)))
    const name = issueClassNames[selectedIssuePrice] || 'Application class'
    const title = document.getElementById('selected-class')
    if (title) title.textContent = name + ' / ' + selectedIssuePrice + ' USDM'
    syncPreview()
    status('Selected ' + name + '. Selection is not economic admission.')
  })
})

const ticket3dContainer = document.getElementById('ticket-3d')
let lastTicketAssetId: string | null = null

const observeWalletTicket = async () => {
  if (!ticket3dContainer || !connected) return
  try {
    const lucid = wallet.getLucid()
    if (!lucid) throw new Error('Wallet session unavailable')
    if (!TICKET_POLICY_ID) {
      ticket3dContainer.innerHTML = '<div class="slot-status">Ticket policy is not configured for this environment.</div>'
      return
    }
    const utxos = await lucid.wallet.getUtxos()
    const ticketUnits = new Set<string>()
    for (const utxo of utxos) {
      for (const [unit, quantity] of Object.entries(utxo.assets ?? {})) {
        if (quantity === 1n && unit.startsWith(TICKET_POLICY_ID) && unit.length > 56) {
          ticketUnits.add(unit)
        }
      }
    }
    if (ticketUnits.size === 0) {
      lastTicketAssetId = null
      ticket3dContainer.innerHTML = '<div class="slot-status">No PRE-RICH ticket NFT observed in this wallet.</div>'
      return
    }
    if (ticketUnits.size > 1) {
      lastTicketAssetId = null
      ticket3dContainer.innerHTML = '<div class="slot-status">Multiple PRE-RICH ticket NFTs observed. Select a single ticket before canonical rendering.</div>'
      status('Multiple ticket NFTs observed; canonical ticket rendering is intentionally paused.')
      return
    }
    lastTicketAssetId = [...ticketUnits][0]
    await renderLastCertifiedTicket()
  } catch (e: any) {
    ticket3dContainer.innerHTML = '<div class="slot-status">Ticket observation unavailable.</div>'
    status('Ticket observation error: ' + (e.message || e))
  }
}

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
          document.getElementById('wallet-state-badge')!.textContent = 'CONNECTED'
          document.getElementById('readiness-wallet')!.textContent = res.walletName
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
          syncPreview()
          await observeWalletTicket()
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
    syncPreview()
    status('Disconnected')
    return
  }
  openWalletPicker()
})

document.getElementById('open-verify')?.addEventListener('click', () => {
  document.getElementById('verify-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
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
  document.getElementById('wallet-state-badge')!.textContent = 'CONNECTED'
  document.getElementById('readiness-wallet')!.textContent = 'Connected wallet'
  syncPreview()
  await observeWalletTicket()
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
