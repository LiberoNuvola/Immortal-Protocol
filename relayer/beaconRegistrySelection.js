'use strict'

/**
 * Select at most one qualified Pending Registry UTxO per canonical target
 * round. The datum decoder is injected so this module remains pure and can
 * be tested without Lucid, a wallet, a provider, or a Cardano runtime.
 */
function selectPendingRegistryCandidates(utxos, decodeRegistryDatum) {
  if (!Array.isArray(utxos)) {
    throw new TypeError('Registry UTxOs must be an array')
  }
  if (typeof decodeRegistryDatum !== 'function') {
    throw new TypeError('decodeRegistryDatum must be a function')
  }

  const byTargetRound = new Map()
  const rejected = []

  for (const utxo of utxos) {
    let datum
    try {
      datum = decodeRegistryDatum(utxo)
    } catch {
      rejected.push({ utxo, reason: 'DATUM_DECODE_FAILED' })
      continue
    }

    if (!datum) {
      rejected.push({ utxo, reason: 'UNDECODABLE_DATUM' })
      continue
    }

    if (datum.status !== 0) {
      rejected.push({ utxo, reason: 'NOT_PENDING' })
      continue
    }

    if (
      typeof datum.round !== 'bigint' ||
      typeof datum.target?.round !== 'bigint'
    ) {
      rejected.push({ utxo, reason: 'INVALID_ROUND_FIELDS' })
      continue
    }

    if (datum.round !== datum.target.round) {
      rejected.push({
        utxo,
        reason: 'BR_ROUND_TARGET_ROUND_MISMATCH',
      })
      continue
    }

    const round = datum.target.round.toString()
    const entries = byTargetRound.get(round) || []
    entries.push({ utxo, datum })
    byTargetRound.set(round, entries)
  }

  const selected = []
  const duplicates = []

  for (const [round, entries] of byTargetRound) {
    if (entries.length === 1) {
      selected.push({
        round,
        utxo: entries[0].utxo,
        datum: entries[0].datum,
      })
      continue
    }

    duplicates.push({
      round,
      count: entries.length,
    })
  }

  return { selected, duplicates, rejected }
}

module.exports = {
  selectPendingRegistryCandidates,
}
