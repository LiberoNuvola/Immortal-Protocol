import {
  CML,
  validatorToScriptHash,
  type Script,
  type UTxO,
} from '@lucid-evolution/lucid'

export type RevealReferencePurpose = 'PrizeValidator' | 'B1PrizePool'

export type PublishedReferenceScriptBinding = {
  purpose: RevealReferencePurpose
  publishedTxCbor: string
  expectedScript: Script
  referenceAddress: string
  utxo: UTxO
}

export type RevealTxExpectation = {
  maxTxSize: number
  references: Array<{ txHash: string; index: number }>
  spends: Array<{ txHash: string; index: number; redeemerCbor: string }>
  outputs: Array<{ address: string; inlineDatumCbor: string }>
}

type TxOutRef = { txHash: string; index: number }

function normalizeHex(value: string): string {
  return value.replace(/^0x/i, '').toLowerCase()
}

function collectionItems<T = any>(collection: any): T[] {
  if (!collection || typeof collection.len !== 'function' || typeof collection.get !== 'function') {
    return []
  }
  return Array.from({ length: Number(collection.len()) }, (_, index) => collection.get(index) as T)
}

function outRef(input: any): TxOutRef {
  return {
    txHash: input.transaction_id().to_hex().toLowerCase(),
    index: Number(input.index()),
  }
}

function outRefKey(ref: TxOutRef): string {
  return ref.txHash.toLowerCase() + '#' + ref.index
}

function exactRefSet(actual: TxOutRef[], expected: TxOutRef[], label: string): void {
  const actualKeys = actual.map(outRefKey).sort()
  const expectedKeys = expected.map(outRefKey).sort()
  if (actualKeys.length !== expectedKeys.length ||
      actualKeys.some((value, index) => value !== expectedKeys[index])) {
    throw new Error(
      label + ' mismatch: expected ' + JSON.stringify(expectedKeys) +
      ', received ' + JSON.stringify(actualKeys),
    )
  }
}

/**
 * Bind a provider UTxO to the exact output in the accepted publishing
 * transaction. The UTxO's scriptRef field is not treated as proof: the
 * publication transaction CBOR must contain the expected script bytes at the
 * indicated output index and address.
 */
export function bindPublishedReferenceScript(
  binding: PublishedReferenceScriptBinding,
): UTxO {
  const { purpose, publishedTxCbor, expectedScript, referenceAddress, utxo } = binding
  const publishingCbor = normalizeHex(publishedTxCbor)
  if (!publishingCbor || publishingCbor.length % 2 !== 0 || !/^[0-9a-f]+$/.test(publishingCbor)) {
    throw new Error(purpose + ': invalid publishing transaction CBOR')
  }
  if (!Number.isSafeInteger(utxo.outputIndex) || utxo.outputIndex < 0) {
    throw new Error(purpose + ': invalid reference output index')
  }

  const tx = CML.Transaction.from_cbor_hex(publishingCbor)
  const body = tx.body()
  const publishingHash = CML.hash_transaction(body).to_hex().toLowerCase()
  if (publishingHash !== utxo.txHash.toLowerCase()) {
    throw new Error(purpose + ': reference UTxO is not an output of the publishing transaction')
  }

  const outputs = body.outputs()
  if (utxo.outputIndex >= Number(outputs.len())) {
    throw new Error(purpose + ': reference output index is outside the publishing transaction')
  }
  const output = outputs.get(utxo.outputIndex)
  const address = output.address().to_bech32()
  if (address !== referenceAddress) {
    throw new Error(purpose + ': reference output address mismatch')
  }

  const outputCbor = output.to_cbor_hex().toLowerCase()
  const expectedScriptCbor = normalizeHex(expectedScript.script)
  if (!expectedScriptCbor || !outputCbor.includes(expectedScriptCbor)) {
    throw new Error(purpose + ': publishing transaction output has no matching reference script')
  }

  if (utxo.scriptRef) {
    const providerHash = validatorToScriptHash(utxo.scriptRef as Script).toLowerCase()
    const expectedHash = validatorToScriptHash(expectedScript).toLowerCase()
    if (providerHash !== expectedHash) {
      throw new Error(purpose + ': provider scriptRef contradicts the published reference script')
    }
  }

  return {
    ...utxo,
    // Rehydrate script bytes only after validating the exact published CBOR.
    // This is a local Lucid resolution hint, not an assertion that the provider
    // itself authenticated scriptRef.
    scriptRef: expectedScript,
  }
}

function scriptWitnessCounts(witnessSet: any): {
  plutus_v1: number
  plutus_v2: number
  plutus_v3: number
} {
  const count = (method: string): number => {
    const collection = witnessSet[method]?.()
    if (collection == null) return 0
    if (typeof collection.len !== 'function') {
      throw new Error('Cannot inspect serialized Plutus witness collection: ' + method)
    }
    return Number(collection.len())
  }
  return {
    plutus_v1: count('plutus_v1_scripts'),
    plutus_v2: count('plutus_v2_scripts'),
    plutus_v3: count('plutus_v3_scripts'),
  }
}

function redeemerDataCbor(redeemer: any): string {
  const data = redeemer?.data?.()
  if (!data || typeof data.to_cbor_hex !== 'function') {
    throw new Error('Cannot inspect serialized Reveal redeemer data')
  }
  return normalizeHex(data.to_cbor_hex())
}

function serializedRedeemers(witnessSet: any): string[] {
  const redeemers = witnessSet.redeemers()
  if (!redeemers) return []
  const out: string[] = []
  const legacy = redeemers.as_arr_legacy_redeemer?.()
  if (legacy) {
    for (const item of collectionItems(legacy)) out.push(redeemerDataCbor(item))
  }
  const map = redeemers.as_map_redeemer_key_to_redeemer_val?.()
  if (map) {
    const keys = collectionItems(map.keys?.())
    for (const key of keys) {
      const item = map.get(key)
      if (item) out.push(redeemerDataCbor(item))
    }
  }
  return out
}

/**
 * Inspect the final serialized Reveal CBOR—not the builder configuration—and
 * fail closed unless it contains the two qualified reference inputs, the two
 * spending inputs/redeemers and continuing outputs, no embedded Plutus script
 * bytes, and a transaction size within the active ledger limit.
 */
export function assertRevealUsesReferenceScripts(
  transactionCbor: string,
  expected: RevealTxExpectation,
) {
  const cbor = normalizeHex(transactionCbor)
  if (!cbor || cbor.length % 2 !== 0 || !/^[0-9a-f]+$/.test(cbor)) {
    throw new Error('Reveal transaction CBOR is invalid')
  }
  if (!Number.isSafeInteger(expected.maxTxSize) || expected.maxTxSize <= 0) {
    throw new Error('maxTxSize must be a positive integer')
  }

  const bytes = cbor.length / 2
  if (bytes > expected.maxTxSize) {
    throw new Error('Reveal transaction exceeds maxTxSize: ' + bytes + ' > ' + expected.maxTxSize)
  }

  const tx = CML.Transaction.from_cbor_hex(cbor)
  const body = tx.body()
  const actualReferences = collectionItems(body.reference_inputs?.()).map(outRef)
  exactRefSet(actualReferences, expected.references, 'Reveal reference inputs')

  const actualSpends = collectionItems(body.inputs()).map(outRef)
  const expectedSpendRefs = expected.spends.map(({ txHash, index }) => ({ txHash, index }))
  for (const spend of expectedSpendRefs) {
    if (!actualSpends.some((ref) => outRefKey(ref) === outRefKey(spend))) {
      throw new Error('Reveal spending input missing: ' + outRefKey(spend))
    }
  }

  const witnessSet = tx.witness_set()
  const embeddedScriptCounts = scriptWitnessCounts(witnessSet)
  const embeddedScriptTotal = Object.values(embeddedScriptCounts).reduce((sum, count) => sum + count, 0)
  if (embeddedScriptTotal !== 0) {
    throw new Error('Reveal embeds Plutus validator bytes in witness set: ' + JSON.stringify(embeddedScriptCounts))
  }

  const actualRedeemers = serializedRedeemers(witnessSet)
  if (actualRedeemers.length !== expected.spends.length) {
    throw new Error('Reveal redeemer count mismatch: expected ' + expected.spends.length + ', received ' + actualRedeemers.length)
  }
  const unmatchedRedeemers = [...expected.spends]
  for (const actual of actualRedeemers) {
    const index = unmatchedRedeemers.findIndex((item) => normalizeHex(item.redeemerCbor) === actual)
    if (index < 0) {
      throw new Error('Reveal contains an unexpected spending redeemer: ' + actual)
    }
    unmatchedRedeemers.splice(index, 1)
  }
  if (unmatchedRedeemers.length > 0) {
    throw new Error('Reveal is missing one or more expected spending redeemers')
  }

  const actualOutputs = collectionItems(body.outputs())
  for (const expectedOutput of expected.outputs) {
    const datumCbor = normalizeHex(expectedOutput.inlineDatumCbor)
    const found = actualOutputs.some((output) => {
      const address = output.address().to_bech32()
      if (address !== expectedOutput.address) return false
      const encodedOutput = normalizeHex(output.to_cbor_hex())
      return encodedOutput.includes(datumCbor)
    })
    if (!found) {
      throw new Error('Reveal continuing output missing or datum mismatch at ' + expectedOutput.address)
    }
  }

  return {
    bytes,
    maxTxSize: expected.maxTxSize,
    embeddedScriptCounts,
    embeddedScriptTotal,
    referenceInputs: actualReferences.map(outRefKey).sort(),
    spendingInputs: actualSpends.map(outRefKey).sort(),
    redeemers: actualRedeemers,
    checkedOutputs: expected.outputs.map((output) => output.address),
  }
}
