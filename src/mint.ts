/**
 * Mint seriale + Prize UTxO Pending + Treasury payment +
 * B1PrizePool TicketIssued in UNA SOLA transazione.
 *
 * B1 / C-02:
 *
 *   Buyer
 *     |
 *     +---- payment ----------------------> Treasury
 *     |
 *     +---- Ticket NFT -------------------> Buyer
 *
 *   Counter
 *     n ----------------------------------> n + 1
 *
 *   PrizeValidator
 *     (no input) --------------------------> Pending PrizeDatum
 *
 *   B1PrizePool
 *     state -------------------------------> state'
 *       unresolvedReserve += priceUsdm
 *       unresolvedTicketCount += 1
 *
 * The MintPolicy and B1PrizePool validator both enforce
 * the atomic sale invariant on-chain.
 *
 * PrizeDatum:
 *   pdPrizePoolHash binds the ticket to the exact B1PrizePool
 *   instance used by this transaction.
 *
 * Current B1 launch settlement:
 *   1 ADA = 1,000,000 lovelace
 *
 * This is the current Preprod settlement amount and is NOT the
 * USDM economic valuation. The canonical economic price remains
 * pdPriceUsdm.
 */

import {
  Constr,
  Data,
  type Script,
  type UTxO,
} from 'lucid-cardano'

import wallet from './wallet'
import { createCardanoExecutionAdapter } from '../Adapter/CARDANO/runtime/CardanoExecutionAdapter'
import type { EconomicAdmissionWitness } from '../Adapter/CARDANO/runtime/EconomicAdmission'
import {
  obtainAuthoritativeIssueAdmission,
  assertIssueCarrierBindingWitness,
  type AuthoritativeIssueAdmissionProvider,
} from './preRichIssueAdmissionBridge'
import {
  buildScriptsFromLucid,
  counterValidator,
} from './loadValidator'

import {
  ORACLE_PUBLISHER_PKH,
  RELAYER_PKH,
  TICKET_PAYMENT_LOVELACE,
  TREASURY_ADDRESS,
  V3_CARRIER_ADDRESS,
  V3_CARRIER_POLICY_ID,
  V3_CARRIER_TOKEN_NAME_HEX,
  V3_CARRIER_SCRIPT_CBOR,
} from './config'

import {
  type BeaconTarget,
  playerCommitment,
  ticketCommitment,
  encodeBeaconTarget,
  randomPlayerSecret,
  toHex,
  utf8,
} from './beacon'

import {
  defaultPrizeTable,
  type PrizeTable,
} from './gameRules'

import {
  crystallizeTicketExpiry,
  type PreRichExpiryIssuanceState,
  type PreRichExpiryPolicy,
} from '../PRE-RICH/src/PreRichExpiryPolicy'
import {
  issueClassSaleable,
  type IssueRefinementEvidence,
} from '../PRE-RICH/src/PreRichIssueEvidence'

const MIN_ADA_COUNTER = 2_000_000n
const MIN_ADA_PRIZE = 2_000_000n

const DEFAULT_NETWORK_ID = 0
const DEFAULT_ROUND_ID = 0
const DEFAULT_GAME_VERSION = 'V1'

/**
 * 1 USDM = 100 sub-units.
 */
const DEFAULT_PRICE_USDM = 100

// ============================================================
// Generic Data helpers
// ============================================================

function constr(
  index: number,
  fields: Data[] = [],
): Constr<Data> {
  return new Constr(index, fields)
}

function strToHex(value: string): string {
  return Array.from(
    new TextEncoder().encode(value),
  )
    .map((byte) =>
      byte
        .toString(16)
        .padStart(2, '0'),
    )
    .join('')
}