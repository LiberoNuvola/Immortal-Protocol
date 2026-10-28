import {
  assertEconomicAdmission,
  type EconomicActionClass,
  type EconomicAdmissionWitness,
} from './EconomicAdmission'
import { assertAuthoritativeIssueAdmissionWitness } from './AuthoritativeIssueAdmission'

type WalletInputUtxoLike = {
  txHash: string
  outputIndex: number
  address?: string
}

type LucidWalletPort = {
  getUtxos?: () => Promise<readonly WalletInputUtxoLike[]>
}

export type CardanoLucidExecutionPort = {
  signTx(tx: unknown): Promise<unknown>
  submitTx(signedTx: unknown): Promise<string>
  /**
   * Optional only for transactions with additional spending inputs. Legacy
   * Lucid exposes wallet as an object; Lucid Evolution exposes wallet() as a
   * getter. Additional inputs must be found in this selected wallet's UTxO
   * list or the economic submission fails closed.
   */
  wallet?: LucidWalletPort | (() => LucidWalletPort)
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

function canonicalWalletUtxoReference(utxo: WalletInputUtxoLike): string {
  if (!utxo || typeof utxo !== 'object') {
    throw new Error('Connected wallet returned a malformed UTxO record')
  }
  if (
    typeof utxo.txHash !== 'string' ||
    !/^[0-9a-f]{64}$/i.test(utxo.txHash) ||
    !Number.isSafeInteger(utxo.outputIndex) ||
    utxo.outputIndex < 0
  ) {
    throw new Error('Connected wallet returned a malformed UTxO reference')
  }
  return canonicalInputReference(`${utxo.txHash}#${utxo.outputIndex}`)
}

async function readConnectedWalletInputReferences(
  lucid: CardanoLucidExecutionPort,
): Promise<ReadonlySet<string>> {
  const walletCandidate = lucid.wallet
  const wallet =
    typeof walletCandidate === 'function'
      ? walletCandidate.call(lucid)
      : walletCandidate

  if (!wallet || typeof wallet.getUtxos !== 'function') {
    throw new Error(
      'Cannot classify additional economic transaction inputs: connected wallet UTxO listing is unavailable',
    )
  }

  let utxos: readonly WalletInputUtxoLike[]
  try {
    utxos = await wallet.getUtxos()
  } catch {
    throw new Error(
      'Cannot classify additional economic transaction inputs: connected wallet UTxO listing failed',
    )
  }
  if (!Array.isArray(utxos)) {
    throw new Error(
      'Cannot classify additional economic transaction inputs: connected wallet returned a malformed UTxO list',
    )
  }

  const references = new Set<string>()
  for (const utxo of utxos) {
    const reference = canonicalWalletUtxoReference(utxo)
    if (references.has(reference)) {
      throw new Error('Connected wallet returned duplicate UTxO references')
    }
    references.add(reference)
  }
  return references
}

async function assertAdmissionInputsAreClassified(
  tx: unknown,
  declaredInputReferences: readonly string[],
  lucid: CardanoLucidExecutionPort,
): Promise<void> {
  const actualInputs = readCompletedTransactionInputs(tx)
  const actual = new Set(actualInputs)
  const declared = declaredInputReferences.map(canonicalInputReference)
  if (new Set(declared).size !== declared.length) {
    throw new Error('Economic admission input references contain duplicates')
  }

  const declaredSet = new Set(declared)
  const missing = declared.filter((reference) => !actual.has(reference))
  if (missing.length > 0) {
    throw new Error(
      `Economic admission input references are not all present in the actual transaction body: ${missing.join(', ')}`,
    )
  }

  const additionalInputs = actualInputs.filter((reference) => !declaredSet.has(reference))
  if (additionalInputs.length === 0) return

  const walletReferences = await readConnectedWalletInputReferences(lucid)
  const unclassified = additionalInputs.filter((reference) => !walletReferences.has(reference))
  if (unclassified.length > 0) {
    throw new Error(
      `Additional completed transaction inputs are not verified as connected-wallet UTxOs: ${unclassified.join(', ')}`,
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
     * Declared protocol inputs are checked against the completed Lucid body
     * before signing. Additional spending inputs are allowed only when the
     * selected wallet's UTxO listing independently contains each exact ref;
     * unclassified extras fail closed. This is input classification only: it
     * does not yet bind the full output/datum/redeemer/validity map to intent.
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
      if (expectedActionClass === 'Issue') {
        assertAuthoritativeIssueAdmissionWitness(admission)
      }
      await assertAdmissionInputsAreClassified(tx, inputReferences, lucid)
      return this.submitInfrastructure(tx)
    },
  }
}
