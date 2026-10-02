/**
 * PRE-RICH observation adapter for the public Protocol Declaration layer.
 *
 * This adapter reads the canonical Prize UTxO through the existing game-flow
 * observation boundary. It does not submit transactions and does not invent
 * economic state. LifeState and OperationalStatus remain explicit inputs until
 * a deployment-specific authoritative source for those dimensions is closed.
 */

import type { UTxO } from 'lucid-cardano'

import {
  findPrizeUtxo,
  observePrizeLifecycle,
  type ObservedPrizeLifecycle,
} from './gameFlow'
import {
  activityFromObservedLifecycle,
  type BeaconDeclaration,
  type LifeState,
  type OperationalStatus,
  type ProtocolDeclaration,
} from './protocolDeclaration'

export type PreRichProtocolDeclarationObservation = {
  lucid: any
  prizeAddress: string
  ticketPolicyId: string
  ticketAssetNameHex: string
  lifeState: LifeState
  operationalStatus: OperationalStatus
  beacon?: BeaconDeclaration
  scope?: string
}

export type ObservedPrizeDeclaration = {
  declaration: ProtocolDeclaration
  prizeUtxo: UTxO
  lifecycle: ObservedPrizeLifecycle
}

/**
 * Observe one canonical PRE-RICH Prize UTxO and expose only its verified
 * lifecycle as public activity.
 *
 * Missing or ambiguous Prize state fails closed. No UI intent, wallet action,
 * relayer request, economic calculation, or guessed beacon mode is accepted.
 */
export async function observePreRichProtocolDeclaration(
  input: PreRichProtocolDeclarationObservation,
): Promise<ObservedPrizeDeclaration> {
  const prizeUtxo = await findPrizeUtxo(
    input.lucid,
    input.prizeAddress,
    input.ticketPolicyId,
    input.ticketAssetNameHex,
  )

  if (!prizeUtxo) {
    throw new Error('PRE-RICH canonical Prize UTxO not found')
  }

  const lifecycle = observePrizeLifecycle(prizeUtxo)
  const observedAt = new Date().toISOString()
  const txHash = typeof prizeUtxo.txHash === 'string' ? prizeUtxo.txHash : ''
  const outputIndex = Number(prizeUtxo.outputIndex)

  if (!txHash || !Number.isInteger(outputIndex) || outputIndex < 0) {
    throw new Error('PRE-RICH observed Prize UTxO has no canonical transaction reference')
  }

  const evidenceRef = `cardano:tx/${txHash}#${outputIndex}`
  const declaration: ProtocolDeclaration = {
    protocolId: 'PRE-RICH',
    lifeState: input.lifeState,
    currentActivity: activityFromObservedLifecycle(lifecycle),
    operationalStatus: input.operationalStatus,
    ...(input.beacon ? { beacon: input.beacon } : {}),
    observedAt,
    evidence: [
      {
        evidenceRef,
        canonicalStateRef: evidenceRef,
        observedAt,
        source: 'cardano-prize-utxo',
        scope: input.scope ?? 'current-prize',
      },
    ],
  }

  return { declaration, prizeUtxo, lifecycle }
}
