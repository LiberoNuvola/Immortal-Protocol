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

type CmlInputLike = {
  transaction_id: () => { to_hex: () => string }
  index: () => number | bigint
}

type CmlInputListLike = {
  len: () => number
  get: (index: number) => CmlInputLike
}

type CompletedLucidTransactionLike = {
  toTransaction: () => {
    body: () => {
      inputs: () => CmlInputListLike
    }
  }
}

function canonicalInputReference(value: string): string {
  const match = /^([0-9a-f]{64})#(0|[1-9][0-9]*)$/i.exec(value)
  if (!match) {
    throw new Error(`Invalid Cardano input reference: ${value}`)
  }
  return `${match[1].toLowerCase()}#${match[2]}`
}

/**
 * Read spending inputs from the completed Lucid transaction body, not from
 * the caller's parallel reference list. The adapter fails closed if the
 * completed transaction does not expose the documented CML transaction API.
 */
function readCompletedTransactionInputs(tx: unknown): readonly string[] {
  if (!tx || typeof tx !== 'object' || !('toTransaction' in tx)) {
    throw new Error('Economic submission requires a completed Lucid transaction with toTransaction()')
  }
  const candidate = tx as CompletedLucidTransactionLike
  if (typeof candidate.toTransaction !== 'function') {
    throw new Error('Economic submission requires a completed Lucid transaction with toTransaction()')
  }

  let inputs: CmlInputListLike
  try {
    inputs = candidate.toTransaction().body().inputs()
  } catch {
    throw new Error('Unable to inspect actual inputs in completed Lucid transaction body')
  }
  if (!inputs || typeof inputs.len !== 'function' || typeof inputs.get !== 'function') {
    throw new Error('Completed Lucid transaction body has no inspectable input collection')
  }

  const references: string[] = []
  for (let i = 0; i < inputs.len(); i += 1) {
    const input = inputs.get(i)
    const txHash = input.transaction_id().to_hex()
    const outputIndex = input.index()
    if (!/^[0-9a-f]{64}$/i.test(txHash)) {
      throw new Error('Completed transaction contains a malformed input transaction id')
    }
    if (
      (typeof outputIndex !== 'number' && typeof outputIndex !== 'bigint') ||
      !Number.isSafeInteger(Number(outputIndex)) ||
      Number(outputIndex) < 0
    ) {
      throw new Error('Completed transaction contains a malformed input output index')
    }
    references.push(canonicalInputReference(`${txHash}#${outputIndex}`))
  }
  if (new Set(references).size !== references.length) {
    throw new Error('Completed transaction contains duplicate spending input references')
  }
  return references
}

function assertAdmissionInputsAreInTransaction(
  tx: unknown,
  declaredInputReferences: readonly string[],
): void {
  const actual = new Set(readCompletedTransactionInputs(tx))
  const declared = declaredInputReferences.map(canonicalInputReference)
  if (new Set(declared).size !== declared.length) {
    throw new Error('Economic admission input references contain duplicates')
  }
  const missing = declared.filter((reference) => !actual.has(reference))
  if (missing.length > 0) {
    throw new Error(
      `Economic admission input references are not all present in the actual transaction body: ${missing.join(', ')}`,
    )
  }
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
     * The declared protocol inputs are checked against the completed Lucid
     * transaction body before signing. Wallet/fee inputs selected by Lucid
     * may also appear in the body; this check requires every admission-bound
     * input to be present but does not yet classify additional inputs.
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
      assertAdmissionInputsAreInTransaction(tx, inputReferences)
      return this.submitInfrastructure(tx)
    },
  }
}
