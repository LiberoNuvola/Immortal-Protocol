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
  /**
   * Optional direct adapter port. The application currently uses legacy
   * lucid-cardano, whose signing/submission API is TxComplete.sign().complete()
   * and TxSigned.submit(), rather than top-level lucid.signTx/submitTx.
   */
  signTx?: (tx: unknown) => Promise<unknown>
  submitTx?: (signedTx: unknown) => Promise<string>
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
  index: () => number | bigint | { to_str: () => string }
}

type CmlInputListLike = {
  len: () => number
  get: (index: number) => CmlInputLike
}

type CmlTransactionLike = {
  body: () => {
    inputs: () => CmlInputListLike
  }
  /** Exact serialization of this CML transaction, used only for in-flight integrity. */
  to_bytes: () => Uint8Array
}

type CompletedLucidTransactionLike = {
  /** Lucid Evolution completed transaction API. */
  toTransaction?: () => CmlTransactionLike
  /** lucid-cardano@0.10.11 exposes its completed CML transaction publicly. */
  txComplete?: CmlTransactionLike
  /** lucid-cardano@0.10.11 signing API. */
  sign?: () => { complete: () => Promise<unknown> }
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
 * the caller's parallel reference list. Both supported transaction shapes
 * expose the same CML body: Evolution through toTransaction(), legacy Lucid
 * through its TxComplete.txComplete property.
 */
function readCompletedTransactionInputs(tx: unknown): readonly string[] {
  if (!tx || typeof tx !== 'object') {
    throw new Error('Economic submission requires a completed Lucid transaction')
  }
  const candidate = tx as CompletedLucidTransactionLike
  let transaction: CmlTransactionLike | undefined
  try {
    transaction =
      typeof candidate.toTransaction === 'function'
        ? candidate.toTransaction()
        : candidate.txComplete
  } catch {
    throw new Error('Unable to access completed Lucid transaction body')
  }
  if (!transaction || typeof transaction.body !== 'function') {
    throw new Error(
      'Economic submission requires a completed Lucid transaction with toTransaction() or txComplete',
    )
  }

  let inputs: CmlInputListLike
  try {
    inputs = transaction.body().inputs()
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
    const rawOutputIndex = input.index()
    if (!/^[0-9a-f]{64}$/i.test(txHash)) {
      throw new Error('Completed transaction contains a malformed input transaction id')
    }
    let outputIndex: number
    if (typeof rawOutputIndex === 'number' || typeof rawOutputIndex === 'bigint') {
      outputIndex = Number(rawOutputIndex)
    } else if (
      rawOutputIndex &&
      typeof rawOutputIndex === 'object' &&
      typeof rawOutputIndex.to_str === 'function'
    ) {
      const encodedIndex = rawOutputIndex.to_str()
      if (!/^(0|[1-9][0-9]*)$/.test(encodedIndex)) {
        throw new Error('Completed transaction contains a malformed input output index')
      }
      outputIndex = Number(encodedIndex)
    } else {
      throw new Error('Completed transaction contains a malformed input output index')
    }
    if (!Number.isSafeInteger(outputIndex) || outputIndex < 0) {
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
): Promise<readonly string[]> {
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
  if (additionalInputs.length === 0) return actualInputs

  const walletReferences = await readConnectedWalletInputReferences(lucid)
  const unclassified = additionalInputs.filter((reference) => !walletReferences.has(reference))
  if (unclassified.length > 0) {
    throw new Error(
      `Additional completed transaction inputs are not verified as connected-wallet UTxOs: ${unclassified.join(', ')}`,
    )
  }
  return actualInputs
}

function readCompletedTransactionBytes(tx: unknown): Uint8Array {
  if (!tx || typeof tx !== 'object') {
    throw new Error('Economic submission requires a completed Lucid transaction')
  }
  const candidate = tx as CompletedLucidTransactionLike
  let transaction: CmlTransactionLike | undefined
  try {
    transaction =
      typeof candidate.toTransaction === 'function'
        ? candidate.toTransaction()
        : candidate.txComplete
  } catch {
    throw new Error('Unable to access completed Lucid transaction for integrity snapshot')
  }
  if (!transaction || typeof transaction.to_bytes !== 'function') {
    throw new Error('Completed Lucid transaction does not expose exact CML bytes')
  }
  const bytes = transaction.to_bytes()
  if (!(bytes instanceof Uint8Array)) {
    throw new Error('Completed Lucid transaction returned malformed CML bytes')
  }
  return Uint8Array.from(bytes)
}

function assertCompletedInputReferencesUnchanged(
  tx: unknown,
  validatedReferences: readonly string[],
  validatedTransactionBytes: Uint8Array,
): void {
  const currentReferences = readCompletedTransactionInputs(tx)
  if (
    currentReferences.length !== validatedReferences.length ||
    currentReferences.some((reference, index) => reference !== validatedReferences[index])
  ) {
    throw new Error('Completed transaction spending inputs changed after economic admission validation')
  }

  // Compare the exact serialized CML transaction, not a canonicalized hash or
  // an economic action fingerprint. This closes re-binding/mutation of other
  // body fields during the asynchronous wallet UTxO classification.
  const currentBytes = readCompletedTransactionBytes(tx)
  if (
    currentBytes.length !== validatedTransactionBytes.length ||
    currentBytes.some((byte, index) => byte !== validatedTransactionBytes[index])
  ) {
    throw new Error('Completed transaction bytes changed after economic admission validation')
  }
}

async function signCompletedTransaction(
  lucid: CardanoLucidExecutionPort,
  tx: unknown,
): Promise<unknown> {
  if (typeof lucid.signTx === 'function') {
    return lucid.signTx(tx)
  }

  if (tx && typeof tx === 'object') {
    const candidate = tx as CompletedLucidTransactionLike
    if (typeof candidate.sign === 'function') {
      const signingBuilder = candidate.sign()
      if (signingBuilder && typeof signingBuilder.complete === 'function') {
        return signingBuilder.complete()
      }
    }
  }

  throw new Error('Cardano signing port is unavailable for the supplied Lucid transaction')
}

async function submitSignedTransaction(
  lucid: CardanoLucidExecutionPort,
  signedTx: unknown,
): Promise<string> {
  if (typeof lucid.submitTx === 'function') {
    return lucid.submitTx(signedTx)
  }

  if (
    signedTx &&
    typeof signedTx === 'object' &&
    'submit' in signedTx &&
    typeof signedTx.submit === 'function'
  ) {
    return signedTx.submit()
  }

  throw new Error('Cardano submission port is unavailable for the supplied signed transaction')
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
      const signedTx = await signCompletedTransaction(lucid, tx)
      const transactionRef = await submitSignedTransaction(lucid, signedTx)
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
      // Capture exact CML transaction serialization before any asynchronous
      // wallet classification. This is an integrity guard only; it is not an
      // economic action fingerprint or a semantic authorization profile.
      const validatedTransactionBytes = readCompletedTransactionBytes(tx)
      const validatedInputReferences =
        await assertAdmissionInputsAreClassified(tx, inputReferences, lucid)
      // The wallet UTxO lookup above is asynchronous. Re-read inputs and exact
      // transaction bytes immediately before invoking the signing port.
      assertCompletedInputReferencesUnchanged(
        tx,
        validatedInputReferences,
        validatedTransactionBytes,
      )
      return this.submitInfrastructure(tx)
    },
  }
}
