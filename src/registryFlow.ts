/**
 * Light bridge off-chain:
 *
 *   canonical GameRoundCommitment
 *             ↓
 *        BeaconPending
 *             ↓
 *      Materios receipt
 *             ↓
 *      authorized relayer
 *             ↓
 *        BeaconReady
 *
 * The canonical round identity is established before publication
 * of the external Materios receipt.
 *
 * GameRoundCommitment is computed and checked off-chain before
 * publication, but the current seven-field BeaconRegistryDatum
 * does NOT store it and the current BeaconRegistry validator does
 * NOT authenticate it. This distinction is intentional until an
 * authorized schema change closes the representation gap.
 */

import { signAndSubmitTx } from './txHelpers'

import {
  deriveBeacon,
  deriveGameRoundCommitment,
  type BeaconTarget,
  toHex,
} from './beacon'

export type RegistryPublishParams = {
  lucid: any
  registryAddress: string
  registryValidator: { type: 'PlutusV2'; script: string }

  /** Current registry UTxO (Pending). */
  registryUtxo: any

  target: BeaconTarget
  roundId: number

  /**
   * Canonical game identity.
   *
   * Must already be fixed when the BeaconPending UTxO is created.
   */
  gameId: Uint8Array

  /**
   * Canonical game configuration hash.
   *
   * Must already be fixed when the BeaconPending UTxO is created.
   */
  configHash: Uint8Array

  /**
   * Canonical protocol version used by GameRoundCommitment.
   *
   * This must match target.version.
   */
  protocolVersion: Uint8Array

  /**
   * Canonical GameRoundCommitment hash.
   *
   * This must match deriveGameRoundCommitment(
   *   gameId,
   *   roundId,
   *   configHash,
   *   protocolVersion
   * ).
   */
  gameRoundCommitment: Uint8Array

  /**
   * Materios-derived receipt commitment/hash.
   *
   * This is not the canonical round identity.
   * It is published by the authorized relayer after the round
   * has already been anchored.
   */
  mcHash: Uint8Array

  /**
   * Canonical Materios context/receipt commitment bytes.
   */
  materiosContext: Uint8Array

  /**
   * Authorized relayer public-key hash.
   *
   * Must match the PubKeyHash embedded in the Pending registry datum.
   */
  relayerPkh: string

  /** Inline datum builder — must match BeaconRegistryDatum. */
  buildPendingDatum: (d: Record<string, unknown>) => any

  /** Inline datum builder — must match BeaconRegistryDatum. */
  buildReadyDatum: (d: Record<string, unknown>) => any

  /**
   * Redeemer:
   * RegistryPublish mcHash materiosContext
   */
  buildPublishRedeemer: (
    mcHash: Uint8Array,
    ctx: Uint8Array,
  ) => any
}

/**
 * Publish the beacon for an already anchored round.
 *
 * The canonical GameRoundCommitment is validated from the supplied
 * round inputs. The current on-chain Pending registry datum does not
 * carry this commitment, so any optional decoded commitment field
 * below is treated only as an off-chain consistency check.
 *
 * The transaction must be signed by the relayer identified by
 * brRelayerPkh in the Pending registry datum.
 */
export async function publishRoundBeacon(
  p: RegistryPublishParams,
): Promise<string> {
  if (p.roundId !== p.target.round) {
    throw new Error('roundId !== target.round')
  }

  if (p.roundId < 0) {
    throw new Error('roundId must be >= 0')
  }

  if (p.gameId.length === 0) {
    throw new Error('gameId is empty')
  }

  if (p.configHash.length === 0) {
    throw new Error('configHash is empty')
  }

  if (p.protocolVersion.length === 0) {
    throw new Error('protocolVersion is empty')
  }

  if (p.target.version.length === 0) {
    throw new Error('target.version is empty')
  }

  if (toHex(p.protocolVersion) !== toHex(p.target.version)) {
    throw new Error('protocolVersion !== target.version')
  }

  if (p.gameRoundCommitment.length === 0) {
    throw new Error('gameRoundCommitment is empty')
  }

  const expectedCommitment =
    await deriveGameRoundCommitment(
      p.gameId,
      p.roundId,
      p.configHash,
      p.protocolVersion,
    )

  if (toHex(p.gameRoundCommitment) !== toHex(expectedCommitment)) {
    throw new Error(
      'gameRoundCommitment does not match canonical round data',
    )
  }

  if (p.mcHash.length === 0) {
    throw new Error('mcHash is empty')
  }

  if (p.materiosContext.length === 0) {
    throw new Error('materiosContext is empty')
  }

  /*
   * The current canonical Pending datum does not contain
   * GameRoundCommitment. If a caller exposes an enriched/decoded
   * auxiliary object with that field, validate it only as an
   * off-chain consistency check; this does not make the field
   * authenticated on-chain.
   */
  if (p.registryUtxo?.datum) {
    const pending = p.registryUtxo.datum

    if (
      pending.brRound !== undefined &&
      Number(pending.brRound) !== p.roundId
    ) {
      throw new Error(
        'Pending registry datum round does not match roundId',
      )
    }

    if (
      pending.brGameRoundCommitment !== undefined
    ) {
      const pendingCommitment =
        pending.brGameRoundCommitment

      if (
        pendingCommitment.grcGameId !== undefined &&
        toHex(pendingCommitment.grcGameId) !== toHex(p.gameId)
      ) {
        throw new Error(
          'Pending registry gameId does not match canonical gameId',
        )
      }

      if (
        pendingCommitment.grcRound !== undefined &&
        Number(pendingCommitment.grcRound) !== p.roundId
      ) {
        throw new Error(
          'Pending registry commitment round does not match roundId',
        )
      }

      if (
        pendingCommitment.grcConfigHash !== undefined &&
        toHex(pendingCommitment.grcConfigHash) !== toHex(p.configHash)
      ) {
        throw new Error(
          'Pending registry configHash does not match canonical configHash',
        )
      }

      if (
        pendingCommitment.grcProtocolVersion !== undefined &&
        toHex(pendingCommitment.grcProtocolVersion) !==
          toHex(p.protocolVersion)
      ) {
        throw new Error(
          'Pending registry protocolVersion does not match canonical protocolVersion',
        )
      }

      if (
        pendingCommitment.grcCommitmentHash !== undefined &&
        toHex(pendingCommitment.grcCommitmentHash) !==
          toHex(p.gameRoundCommitment)
      ) {
        throw new Error(
          'Pending registry commitment hash does not match canonical commitment',
        )
      }
    }
  }

  const R = await deriveBeacon(
    p.target.networkId,
    p.target.round,
    p.target.mainchainRef,
    p.mcHash,
    p.materiosContext,
    p.target.version,
  )

  /*
   * IMPORTANT:
   *
   * The canonical on-chain BeaconRegistryDatum currently has seven
   * fields and does not contain GameRoundCommitment. Keep the
   * commitment as supplied round context for the off-chain builder
   * only; the current on-chain validator does not authenticate it.
   */
  const readyDatum = p.buildReadyDatum({
    brRound: p.roundId,
    brTarget: p.target,
    brStatus: 'BeaconReady',
    brBeaconValue: R,
    brMcHash: p.mcHash,
    brMateriosContext: p.materiosContext,
    brRelayerPkh: p.relayerPkh,

    brGameRoundCommitment: {
      grcGameId: p.gameId,
      grcRound: p.roundId,
      grcConfigHash: p.configHash,
      grcProtocolVersion: p.protocolVersion,
      grcCommitmentHash: p.gameRoundCommitment,
    },
  })

  const redeemer = p.buildPublishRedeemer(
    p.mcHash,
    p.materiosContext,
  )

  const tx = await p.lucid
    .newTx()
    .collectFrom(
      [p.registryUtxo],
      redeemer,
    )
    .attachSpendingValidator(
      p.registryValidator,
    )
    .payToContract(
      p.registryAddress,
      { inline: readyDatum },
      p.registryUtxo.assets,
    )
    .complete()

  /*
   * The wallet/provider used here must be the authorized relayer wallet.
   * The on-chain validator checks its PubKeyHash in txInfoSignatories.
   */
  return signAndSubmitTx(p.lucid, tx)
}

export async function previewBeacon(
  target: BeaconTarget,
  mcHash: Uint8Array,
  materiosContext: Uint8Array,
): Promise<{
  rHex: string
  r: Uint8Array
}> {
  if (mcHash.length === 0) {
    throw new Error('mcHash is empty')
  }

  if (materiosContext.length === 0) {
    throw new Error('materiosContext is empty')
  }

  const r = await deriveBeacon(
    target.networkId,
    target.round,
    target.mainchainRef,
    mcHash,
    materiosContext,
    target.version,
  )

  return {
    r,
    rHex: toHex(r),
  }
}
