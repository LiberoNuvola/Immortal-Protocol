import {
  assertEconomicAdmission,
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
    async submit(tx: unknown): Promise<CardanoSubmissionReceipt> {
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
    ): Promise<CardanoSubmissionReceipt> {
      assertEconomicAdmission(admission, inputReferences)
      return this.submit(tx)
    },
  }
}
