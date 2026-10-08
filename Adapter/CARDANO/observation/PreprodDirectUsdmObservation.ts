import type { UTxO } from 'lucid-cardano'
import {
  observeDirectUsdmEev,
} from './DirectUsdmEev'

export type PreprodDirectUsdmObservation = {
  observationReference: string
  observedAt: bigint
  poolInputReference: string
  poolUsdmValue: bigint
  liquiditySourceReferences: readonly string[]
}

function exactReference(utxo: UTxO): string {
  if (
    !utxo ||
    typeof utxo.txHash !== 'string' ||
    !/^[0-9a-fA-F]{64}$/.test(utxo.txHash) ||
    !Number.isInteger(utxo.outputIndex) ||
    utxo.outputIndex < 0
  ) {
    throw new Error('Pool UTxO has no exact Cardano reference')
  }
  return utxo.txHash + '#' + utxo.outputIndex
}

export async function observePreprodDirectUsdmPool({
  lucid,
  poolAddress,
  poolInputReference,
  poolTokenUnit,
  directUsdmUnit,
  observationReference,
  observedAt = BigInt(Date.now()),
}: {
  lucid: {
    utxosAt(address: string): Promise<UTxO[]>
  }
  poolAddress: string
  poolInputReference: string
  poolTokenUnit: string
  directUsdmUnit: string
  observationReference: string
  observedAt?: bigint
}): Promise<PreprodDirectUsdmObservation> {
  if (!lucid) throw new Error('lucid is required')
  if (!poolAddress || !poolAddress.startsWith('addr_test')) {
    throw new Error('poolAddress must be a Preprod address')
  }
  if (!/^[0-9a-fA-F]{64}#\\d+$/.test(poolInputReference)) {
    throw new Error('poolInputReference must be an exact txHash#outputIndex reference')
  }
  if (!/^[0-9a-fA-F]{56,}$/.test(poolTokenUnit)) {
    throw new Error('poolTokenUnit must be a valid native-asset unit')
  }
  if (!/^[0-9a-fA-F]{56,}$/.test(directUsdmUnit)) {
    throw new Error('directUsdmUnit must be a valid native-asset unit')
  }
  if (!observationReference) {
    throw new Error('observationReference is required')
  }
  if (typeof observedAt !== 'bigint' || observedAt < 0n) {
    throw new Error('observedAt must be a non-negative bigint')
  }

  const utxos = await lucid.utxosAt(poolAddress)
  const matches = utxos.filter(
    utxo => exactReference(utxo) === poolInputReference,
  )

  if (matches.length !== 1) {
    throw new Error(
      'exact B1 PrizePool input is no longer live; direct-USDM observation is stale',
    )
  }

  const pool = matches[0]
  if ((pool.assets?.[poolTokenUnit] ?? 0n) !== 1n) {
    throw new Error(
      'exact Pool UTxO does not contain the expected singleton authority token',
    )
  }

  const direct = observeDirectUsdmEev({
    assets: pool.assets,
    expectedUnit: directUsdmUnit,
  })

  return {
    observationReference,
    observedAt,
    poolInputReference,
    poolUsdmValue: direct.eevUsdmSubunits,
    liquiditySourceReferences: [poolInputReference],
  }
}
