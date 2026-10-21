import './style.css'
import { Data } from 'lucid-cardano'
import wallet from './wallet'
import ui from './ui'
import { loadCertifiedTicketState } from './gameFlow'
import { mountCertifiedTicket3D } from './ticket3d'
import {
  ISSUE_AUTHORITY_ENDPOINT,
  ORACLE_PUBLISHER_PKH,
  ORACLE_STATE_ADDRESS,
  ORACLE_STATE_POLICY_ID,
  ORACLE_STATE_TOKEN_NAME_HEX,
  PRE_POLICY_ID,
  PRE_ASSET_NAME_HEX,
  TICKET_POLICY_ID,
  V3_CARRIER_ADDRESS,
  V3_CARRIER_FACTORY_URL,
  V3_CARRIER_POLICY_ID,
  V3_CARRIER_TOKEN_NAME_HEX,
} from './config'
import { mintSerialNFTWithAuthoritativeAdmission } from './mint'
import {
  CANONICAL_ADA_MIN_UTXO_LOVELACE,
  buildIssueSettlementAssets,
  decodeOraclePriceReferences,
  deriveSingleAssetIssueSettlementQuantities,
} from './issueSettlement'
import { createRemoteAuthoritativeIssueAdmissionProvider } from './remoteAuthoritativeIssueAdmissionProvider'
import { preRichExpiryPolicyV1 } from '../PRE-RICH/src/PreRichExpiryPolicy'
import { observeEconomicStateCarrier } from './preprodEconomicStateObservation'
import { loadV3CarrierValidatorFromDeployment } from './v3CarrierScript'
import type { IssueRefinementEvidence } from '../PRE-RICH/src/PreRichIssueEvidence'
import adSlots, {
  AD_SLOT_PACKAGES,
  calculateAdTotalUsd,
  formatUsd,
  getExpiryDateFromPackage,
  getPackageById,
} from './adSlots'

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <div class="app-shell dapp-shell">
    <header class="dapp-header">
      <div class="dapp-brand-lockup">
        <img class="dapp-immortal-mark" src="./web/assets/immortal-mark.svg" alt="IMMORTAL Protocol">
        <div><span class="dapp-kicker">IMMORTAL / PRE-RICH</span>
        <h1>The application layer.</h1>
        <div class="dapp-product-line"><strong>PRE-RICH</strong><span>powered by IMMORTAL</span></div>
        <p>Connect your Cardano wallet, observe the current Preprod state, and follow the ticket lifecycle. Economic admission remains fail-closed until its authoritative producer is available.</p></div>
      </div>
      <div class="dapp-header__actions">
        <span class="network-pill">CARDANO · PREPROD</span>
        <button id="connect" class="primary-action">Connect Wallet</button>
        <button id="change-wallet" class="secondary-action" hidden>Change Wallet</button>
      </div>
    </header>

    <section class="dapp-grid">
      <article class="dapp-card wallet-card">
        <div class="dapp-card__head"><span class="dapp-label">01 · IDENTITY</span><span id="wallet-state-badge" class="state-badge">NOT CONNECTED</span></div>
        <div class="wallet-panel">
          <div class="wallet-panel__identity"><span id="wallet-icon" class="wallet-icon" aria-hidden="true">◌</span><span><strong id="wallet-name">Wallet not connected</strong><small id="wallet-address">Connect a CIP-30 wallet to continue.</small></span></div>
          <span id="wallet-balance">Balance: —</span>
        </div>
        <p class="microcopy">CIP-30 keeps signing authority in the user's wallet. The DApp never asks for a seed phrase or private key.</p>
      </article>

      <article class="dapp-card readiness-card">
        <div class="dapp-card__head"><span class="dapp-label">02 · EXECUTION READINESS</span><span class="state-badge observing">OBSERVE</span></div>
        <div class="readiness-list">
          <div><span>Network</span><b>Preprod</b></div>
          <div><span>Wallet</span><b id="readiness-wallet">Not connected</b></div>
          <div><span>Economic admission</span><b>Producer required</b></div>
          <div><span>Submission</span><b>Wallet → Cardano Adapter</b></div>
        </div>
        <div class="gate-note"><strong>BUY TICKET IS FAIL-CLOSED</strong><span>No synthetic EEV, ProtectedCapital, viability or admission witness is created in the browser.</span></div>
      </article>
    </section>

    <section class="lifecycle-card">
      <div class="dapp-card__head"><span class="dapp-label">03 · USER JOURNEY</span><a href="/first-user.html">Full first-user path →</a></div>
      <div class="lifecycle">
        <div class="lifecycle-step active"><span>01</span><b>CONNECT</b><small>CIP-30</small></div><i>→</i>
        <div class="lifecycle-step"><span>02</span><b>OBSERVE</b><small>Preprod state</small></div><i>→</i>
        <div class="lifecycle-step locked"><span>03</span><b>ISSUE</b><small>Economic admission</small></div><i>→</i>
        <div class="lifecycle-step locked"><span>04</span><b>REVEAL</b><small>Beacon + scripts</small></div><i>→</i>
        <div class="lifecycle-step locked"><span>05</span><b>EVIDENCE</b><small>Bound witness</small></div>
      </div>
    </section>

    <section class="dapp-grid">
      <article class="dapp-card ticket-card">
        <div class="dapp-card__head"><span class="dapp-label">04 · CERTIFIED TICKET</span><span class="state-badge">WAITING</span></div>
        <p>Only an observed and identity-certified PrizeDatum is rendered as a canonical ticket.</p>
        <div id="ticket-3d"><div class="slot-status">No canonical ticket loaded.</div></div>
      </article>

      <article class="dapp-card ad-card">
        <div class="dapp-card__head"><span class="dapp-label">05 · AD SLOTS</span><span class="state-badge observing">OPTIONAL</span></div>
        <p>Low-entry packages with fixed duration and explicit automatic expiry.</p>
        <div id="slot-packages" class="slot-packages"></div>
        <div id="slot-status" class="slot-status">No slot selected.</div>
      </article>
    </section>

    <section class="purchase-console dapp-card">
      <div class="dapp-card__head"><span class="dapp-label">06 · ISSUE CONSOLE</span><span id="issue-gate-state" class="state-badge">GATE LOCKED</span></div>
      <div class="genesis-note"><strong>GENESIS</strong><span>Automatic activation event — when the verified PRE Treasury reaches the Genesis threshold, Class 1 becomes active at 1 USDM per ticket.</span></div>
      <div class="purchase-console__grid">
        <div>
          <span class="dapp-label">SELECTED CLASS</span>
          <h2 id="selected-class">Class 1 / 1 USDM</h2>
          <p id="selected-class-note">Application price profile. Selection does not constitute economic admission.</p>
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
          <div class="settlement-picker">
            <label for="settlement-asset" class="dapp-label">SETTLEMENT ASSET</label>
            <select id="settlement-asset" class="settlement-asset-select" disabled>
              <option value="">Connect wallet to inspect eligible assets</option>
            </select>
            <p id="settlement-asset-note" class="settlement-asset-note">Ticket accounting remains in USDM. A settlement choice requires fresh authenticated quotes for the payment asset and ADA min-UTxO.</p>
          </div>
        </div>
        <div class="admission-checklist">
          <div><span>Application class</span><b>PROFILE DATA</b></div>
          <div><span>Oracle / EEV</span><b>AUTHORITY REQUIRED</b></div>
          <div><span>Protected capital</span><b>AUTHORITY REQUIRED</b></div>
          <div><span>Executable liquidity</span><b>OBSERVE + VERIFY</b></div>
          <div><span>Economic Gate</span><b id="gate-check">LOCKED</b></div>
        </div>
      </div>
      <div class="purchase-console__footer">
        <span>Browser role: select + observe + request execution.</span>
        <span>Economic role: authoritative producer only.</span>
      </div>
    </section>

    <section class="transaction-preview dapp-card">
      <div class="dapp-card__head">
        <span class="dapp-label">07 · TRANSACTION PREVIEW</span>
        <span id="preview-state" class="state-badge">NOT READY</span>
      </div>
      <div class="preview-intro">
        <div>
          <h2>Review before signing.</h2>
          <p>The preview describes the requested transition. It does not authorize it and it does not replace the authoritative Economic Gate.</p>
        </div>
        <div class="preview-warning">WALLET SIGNATURE REQUIRED</div>
      </div>
      <div class="preview-grid">
        <div class="preview-section">
          <span class="dapp-label">ECONOMIC REQUEST</span>
          <div class="preview-row"><span>Application</span><b>PRE-RICH</b></div>
          <div class="preview-row"><span>Class</span><b id="preview-class">Class 1</b></div>
          <div class="preview-row"><span>Economic price</span><b id="preview-price">1 USDM</b></div>
          <div class="preview-row"><span>Settlement asset</span><b id="preview-settlement">NOT SELECTED</b></div>
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

    <section class="dapp-actions">
      <button id="buy" class="primary-action" disabled>Buy Ticket — admission unavailable</button>
      <button id="claim" class="secondary-action" disabled>Claim Prize — verification required</button>
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
    <div id="status" class="dapp-status">Ready. Connect a Preprod wallet to begin observation.</div>
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

type DAppSettlementOption = {
  unit: string
  label: string
  economicQuantity: bigint
  treasuryAssets: Record<string, bigint>
  balance: bigint
}

let settlementOptions: DAppSettlementOption[] = []
let selectedSettlementUnit: string | null = null
let settlementOptionsLoading = false
let settlementOptionsMessage = 'Connect a Preprod wallet to inspect settlement assets.'
let settlementRefreshSequence = 0

const issueClassNames: Record<number, string> = {1:'Class 1',2:'Class 2',3:'Class 3',5:'Class 4',10:'Class 5',25:'Class 6',50:'Class 7',100:'Class 8'}
const issuePriceToClassId: Record<number, bigint> = {1:0n,2:1n,3:2n,5:3n,10:4n,25:5n,50:6n,100:7n}

function issueExecutionConfigured(): boolean {
  return Boolean(
    ISSUE_AUTHORITY_ENDPOINT &&
    V3_CARRIER_FACTORY_URL &&
    V3_CARRIER_ADDRESS &&
    V3_CARRIER_POLICY_ID &&
    V3_CARRIER_TOKEN_NAME_HEX,
  )
}

function syncIssueButton() {
  const buy = document.getElementById('buy') as HTMLButtonElement | null
  if (!buy) return

  if (!connected) {
    buy.disabled = true
    buy.textContent = 'Buy Ticket — connect wallet'
    return
  }

  if (!issueExecutionConfigured()) {
    buy.disabled = true
    buy.textContent = 'Buy Ticket — deployment wiring unavailable'
    return
  }

  if (settlementOptionsLoading) {
    buy.disabled = true
    buy.textContent = 'Buy Ticket — verifying settlement'
    return
  }

  if (!selectedSettlementUnit || !settlementOptions.some(option => option.unit === selectedSettlementUnit)) {
    buy.disabled = true
    buy.textContent = 'Buy Ticket — choose settlement asset'
    return
  }

  buy.disabled = false
  buy.textContent = 'Buy Ticket — authoritative admission'
}


function assetUnitFromQuote(quote: { assetPolicyHex: string; assetNameHex: string }): string {
  if (quote.assetPolicyHex === '' && quote.assetNameHex === '') return 'lovelace'
  return quote.assetPolicyHex.toLowerCase() + quote.assetNameHex.toLowerCase()
}

function formatLovelace(value: bigint): string {
  const whole = value / 1_000_000n
  const fraction = (value % 1_000_000n).toString().padStart(6, '0').replace(/0+$/, '')
  return fraction ? `${whole}.${fraction}` : whole.toString()
}

function settlementAssetDisplayName(unit: string): string {
  if (unit === 'lovelace') return 'ADA'
  if (unit === (PRE_POLICY_ID + PRE_ASSET_NAME_HEX).toLowerCase()) return 'PRE-RICH'

  const nameHex = unit.slice(56)
  if (nameHex.length > 0 && nameHex.length % 2 === 0 && /^[0-9a-f]+$/i.test(nameHex)) {
    try {
      const bytes = Uint8Array.from(nameHex.match(/../g)!.map(byte => Number.parseInt(byte, 16)))
      const decoded = new TextDecoder('utf-8', { fatal: true }).decode(bytes)
      if (decoded && /^[\x20-\x7e]+$/.test(decoded)) {
        return `${decoded} · ${unit.slice(0, 8)}…`
      }
    } catch {
      // Binary asset names are displayed by their policy prefix below.
    }
  }
  return `Asset ${unit.slice(0, 8)}…${unit.slice(-8)}`
}

function updateSettlementNote(): void {
  const note = document.getElementById('settlement-asset-note')
  const preview = document.getElementById('preview-settlement')
  const selected = settlementOptions.find(option => option.unit === selectedSettlementUnit)
  if (preview) preview.textContent = selected ? selected.label : 'NOT SELECTED'

  if (!note) return
  if (settlementOptionsLoading) {
    note.textContent = 'Reading the authenticated Oracle State and calculating exact quantities in the canonical USDM sub-unit domain…'
    return
  }
  if (!selected) {
    note.textContent = settlementOptionsMessage + ' The final Treasury Value must equal the ticket price under the on-chain oracle conversion.'
    return
  }

  if (selected.unit === 'lovelace') {
    note.textContent =
      `Treasury payment: ${formatLovelace(selected.treasuryAssets.lovelace)} ADA. The amount is derived from the authenticated quote; wallet ADA for other protocol outputs and network fees is separate.`
  } else {
    note.textContent =
      `Treasury payment: ${selected.economicQuantity.toLocaleString('en-US')} ledger units of ${settlementAssetDisplayName(selected.unit)} plus ${formatLovelace(CANONICAL_ADA_MIN_UTXO_LOVELACE)} ADA min-UTxO. A valid ADA quote is required even though the min-UTxO component is excluded from economic value.`
  }
}

function renderSettlementOptions(): void {
  const select = document.getElementById('settlement-asset') as HTMLSelectElement | null
  if (!select) return
  const previous = selectedSettlementUnit
  select.innerHTML = ''
  const placeholder = document.createElement('option')
  placeholder.value = ''
  placeholder.textContent = settlementOptionsLoading
    ? 'Verifying available settlement assets…'
    : settlementOptions.length
      ? 'Choose a payment asset…'
      : 'No eligible settlement asset'
  select.appendChild(placeholder)

  for (const option of settlementOptions) {
    const element = document.createElement('option')
    element.value = option.unit
    element.textContent = option.label
    select.appendChild(element)
  }

  selectedSettlementUnit = previous && settlementOptions.some(option => option.unit === previous)
    ? previous
    : null
  select.value = selectedSettlementUnit ?? ''
  select.disabled = settlementOptionsLoading || settlementOptions.length === 0
  updateSettlementNote()
}

async function refreshSettlementOptions(): Promise<void> {
  const sequence = ++settlementRefreshSequence
  settlementOptionsLoading = true
  settlementOptionsMessage = 'Checking the authenticated Oracle State and wallet balances.'
  renderSettlementOptions()
  syncIssueButton()

  try {
    if (!connected) {
      settlementOptions = []
      settlementOptionsMessage = 'Connect a Preprod wallet to inspect settlement assets.'
      return
    }

    const lucid = wallet.getLucid()
    if (!lucid) throw new Error('Wallet session unavailable')
    if (!ORACLE_STATE_ADDRESS || !ORACLE_STATE_POLICY_ID || !ORACLE_STATE_TOKEN_NAME_HEX) {
      throw new Error('Oracle State singleton identity is not configured')
    }
    if (!ORACLE_PUBLISHER_PKH) throw new Error('Oracle publisher identity is not configured')

    const oracleUnit = ORACLE_STATE_POLICY_ID + ORACLE_STATE_TOKEN_NAME_HEX
    const oracleUtxos: any[] = await lucid.utxosAt(ORACLE_STATE_ADDRESS)
    const oracleMatches = oracleUtxos.filter(utxo => (utxo.assets?.[oracleUnit] ?? 0n) === 1n)
    if (oracleMatches.length !== 1) {
      throw new Error(`Expected exactly one Oracle State singleton UTxO, found ${oracleMatches.length}`)
    }
    const oracleDatum = oracleMatches[0].datum
    if (!oracleDatum) throw new Error('Oracle State singleton has no inline datum')

    const quotes = decodeOraclePriceReferences(oracleDatum)
    const walletUtxos: any[] = await lucid.wallet.getUtxos()
    const holdings = new Map<string, bigint>()
    for (const utxo of walletUtxos) {
      for (const [rawUnit, rawQuantity] of Object.entries(utxo.assets ?? {})) {
        let quantity: bigint
        try { quantity = typeof rawQuantity === 'bigint' ? rawQuantity : BigInt(String(rawQuantity)) }
        catch { continue }
        const unit = rawUnit.toLowerCase()
        holdings.set(unit, (holdings.get(unit) ?? 0n) + quantity)
      }
    }

    const units = new Set<string>(['lovelace'])
    for (const quote of quotes) units.add(assetUnitFromQuote(quote))

    const options: DAppSettlementOption[] = []
    const target = BigInt(selectedIssuePrice * 100)
    const nowMs = BigInt(Date.now())
    const adaBalance = holdings.get('lovelace') ?? 0n

    for (const unit of units) {
      const balance = holdings.get(unit) ?? 0n
      if (balance <= 0n) continue
      try {
        const economicAssetQuantities = deriveSingleAssetIssueSettlementQuantities({
          targetUsdmSubunits: target,
          assetUnit: unit,
          oracleDatum,
          expectedPublisherPkh: ORACLE_PUBLISHER_PKH,
          nowMs,
        })
        const economicQuantity = economicAssetQuantities[unit]
        if (economicQuantity === undefined || economicQuantity <= 0n || economicQuantity > balance) continue

        const treasuryAssets = buildIssueSettlementAssets({
          targetUsdmSubunits: target,
          economicAssetQuantities,
          oracleDatum,
          expectedPublisherPkh: ORACLE_PUBLISHER_PKH,
          nowMs,
        })
        if (treasuryAssets.lovelace > adaBalance) continue

        const assetName = settlementAssetDisplayName(unit)
        const label = unit === 'lovelace'
          ? `ADA · Treasury ${formatLovelace(treasuryAssets.lovelace)} ADA`
          : `${assetName} · ${economicQuantity.toLocaleString('en-US')} ledger units`
        options.push({
          unit,
          label,
          economicQuantity,
          treasuryAssets,
          balance,
        })
      } catch {
        // An asset only appears if every required quote is unique, fresh,
        // publisher-matched, representable at the exact ticket target, and
        // paired with the required ADA min-UTxO quote.
      }
    }

    if (sequence !== settlementRefreshSequence) return
    settlementOptions = options
    if (options.length === 0) {
      settlementOptionsMessage =
        'No eligible option: the wallet needs the exact payment quantity, a fresh publisher-matched quote for that asset, an ADA quote for min-UTxO, and enough ADA to fund the Treasury output.'
    } else {
      settlementOptionsMessage =
        'Only wallet-held assets with unique fresh authenticated quotes and an exact USDM-subunit conversion are listed.'
    }
  } catch (error) {
    if (sequence !== settlementRefreshSequence) return
    settlementOptions = []
    selectedSettlementUnit = null
    settlementOptionsMessage = error instanceof Error
      ? `Settlement options unavailable: ${error.message}`
      : `Settlement options unavailable: ${String(error)}`
  } finally {
    if (sequence === settlementRefreshSequence) {
      settlementOptionsLoading = false
      renderSettlementOptions()
      syncPreview()
      syncIssueButton()
    }
  }
}

const syncPreview = () => {
  const name = issueClassNames[selectedIssuePrice] || 'Application class'
  const connectedWallet = connected ? 'CONNECTED' : 'NOT CONNECTED'
  const ready = connected
  const setText = (id: string, value: string) => { const el = document.getElementById(id); if (el) el.textContent = value }
  setText('preview-class', name)
  setText('preview-price', selectedIssuePrice + ' USDM')
  const selectedSettlement = settlementOptions.find(option => option.unit === selectedSettlementUnit)
  setText('preview-settlement', selectedSettlement ? selectedSettlement.label : 'NOT SELECTED')
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
    void refreshSettlementOptions()
    status('Selected ' + name + '. Selection is not economic admission.')
  })
})

document.getElementById('settlement-asset')?.addEventListener('change', (event) => {
  const select = event.currentTarget as HTMLSelectElement
  selectedSettlementUnit = select.value || null
  updateSettlementNote()
  syncPreview()
  syncIssueButton()
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

syncIssueButton()

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
          await refreshSettlementOptions()
          syncPreview()
          syncIssueButton()
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
    syncIssueButton()
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
  document.getElementById('wallet-state-badge')!.textContent = 'CONNECTED'
  document.getElementById('readiness-wallet')!.textContent = 'Connected wallet'
  await refreshSettlementOptions()
  syncPreview()
  syncIssueButton()
  await observeWalletTicket()
  status('Wallet account changed')
})

wallet.on('networkChanged', () => {
  status('Wallet network changed. PRE-RICH remains locked to Preprod.')
})

wallet.on('disconnect', () => {
  connected = false
  settlementOptions = []
  selectedSettlementUnit = null
  settlementOptionsMessage = 'Connect a Preprod wallet to inspect settlement assets.'
  settlementOptionsLoading = false
  settlementRefreshSequence += 1
  renderSettlementOptions()
  syncPreview()
  syncIssueButton()
  if (connectBtn) connectBtn.textContent = 'Connect Wallet'
  if (changeWalletBtn) changeWalletBtn.hidden = true
})

document.getElementById('claim')?.addEventListener('click', async () => {
  status('Claim unavailable: authoritative Economic Gate admission is required.')
})

document.getElementById('buy')?.addEventListener('click', async () => {
  const buy = document.getElementById('buy') as HTMLButtonElement | null
  if (buy) {
    buy.disabled = true
    buy.textContent = 'Preparing authoritative Issue…'
  }

  try {
    if (!connected) throw new Error('Connect a Preprod wallet first')
    const selectedSettlement = settlementOptions.find(option => option.unit === selectedSettlementUnit)
    if (!selectedSettlement) throw new Error('Choose a wallet-held settlement asset with a valid authenticated quote')
    if (!issueExecutionConfigured()) {
      throw new Error('Authoritative Issue endpoint and V3 carrier factory are not configured')
    }

    const lucid = wallet.getLucid()
    if (!lucid) throw new Error('Wallet session unavailable')

    const classId = issuePriceToClassId[selectedIssuePrice]
    if (classId === undefined) throw new Error('Selected Issue price is not in the canonical PRE-RICH ladder')

    status('Observing the live V3 carrier before requesting admission…')
    const carrier = await observeEconomicStateCarrier({
      lucid,
      carrierAddress: V3_CARRIER_ADDRESS,
      carrierPolicyId: V3_CARRIER_POLICY_ID,
      carrierTokenNameHex: V3_CARRIER_TOKEN_NAME_HEX,
      decodeDatum: (raw: string) => Data.from(raw),
    })

    const liveClass = carrier.state.classes[Number(classId)]
    if (!liveClass) throw new Error('Requested Issue class is absent from the live V3 carrier')

    const issueClassEvidence: IssueRefinementEvidence = {
      classId,
      priceReferenceUnits: BigInt(selectedIssuePrice),
      currentActiveClass: carrier.state.control.currentActiveClass,
      highestClassEverActivated: carrier.state.control.highestClassEverActivated,
      issued: liveClass.issued,
      cap: liveClass.cap,
    }

    if (!liveClass.saleable) {
      throw new Error('Requested Issue class is not saleable in the live V3 state')
    }

    status('Loading the deployment-bound V3 validator factory…')
    const v3CarrierValidator = await loadV3CarrierValidatorFromDeployment(lucid, {
      factoryUrl: V3_CARRIER_FACTORY_URL,
      carrierPolicyId: V3_CARRIER_POLICY_ID,
      carrierTokenNameHex: V3_CARRIER_TOKEN_NAME_HEX,
      expectedCarrierAddress: V3_CARRIER_ADDRESS,
    })

    const provider = createRemoteAuthoritativeIssueAdmissionProvider(
      ISSUE_AUTHORITY_ENDPOINT,
    )

    document.getElementById('issue-gate-state')!.textContent = 'REQUESTING'
    status('Requesting the authoritative Issue witness from the server-side producer…')

    const result = await mintSerialNFTWithAuthoritativeAdmission({
      lucid,
      issueClassEvidence,
      priceUsdm: selectedIssuePrice * 100,
      settlementAssetQuantities: { [selectedSettlement.unit]: selectedSettlement.economicQuantity },
      expiryPolicy: preRichExpiryPolicyV1,
      v3CarrierValidator,
      authoritativeIssueAdmissionProvider: provider,
    })

    document.getElementById('issue-gate-state')!.textContent = 'ADMITTED'
    status('Ticket Issue submitted and confirmed: ' + result.txHash)
    await observeWalletTicket()
  } catch (error) {
    document.getElementById('issue-gate-state')!.textContent = 'LOCKED'
    status('Issue blocked: ' + (error instanceof Error ? error.message : String(error)))
  } finally {
    syncIssueButton()
  }
})

export default adSlots
