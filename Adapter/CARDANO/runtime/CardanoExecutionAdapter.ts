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
  }
}
