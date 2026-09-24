import {
  assertEconomicAdmission,
  type EconomicActionClass,
  type EconomicAdmissionWitness,
} from './EconomicAdmission'

export type CardanoLucidExecutionPort = {
  signTx(tx: unknown): Promise<unknown>
  submitTx(signedTx: unknown): Promise<string>
}

export type CardanoSubmissionReceipt = {
  transactionRef: string
}

/** Chain-execution boundary for the Cardano adapter. */
export function createCardanoExecutionAdapter(
  lucid: CardanoLucidExecutionPort,
) {
  return {
    /**
     * Generic infrastructure submission. This path is reserved for
     * non-economic infrastructure transitions (for example BeaconRegistry).
     * Economically material transitions must use submitEconomic().
     */
    async submitInfrastructure(tx: unknown): Promise<CardanoSubmissionReceipt> {
      const signedTx = await lucid.signTx(tx)
      const transactionRef = await lucid.submitTx(signedTx)
      if (!transactionRef.trim()) {
        throw new Error('Cardano submission returned an empty transaction reference')
      }
      return { transactionRef }
    },

    /**
     * Economic submission boundary.
     *
     * Unlike the generic adapter path, this path requires an explicit
     * Economic Gate admission witness. The adapter consumes the witness but
     * does not manufacture or reinterpret economic truth.
     */
    async submitEconomic(
      tx: unknown,
      admission: EconomicAdmissionWitness | undefined,
      inputReferences: readonly string[],
      liquiditySourceReferences: readonly string[],
      expectedActionClass?: EconomicActionClass,
    ): Promise<CardanoSubmissionReceipt> {
      assertEconomicAdmission(
        admission,
        inputReferences,
        liquiditySourceReferences,
        expectedActionClass,
      )
      return this.submitInfrastructure(tx)
    },
  }
}
