// src/txHelpers.ts
import {
  createCardanoExecutionAdapter,
} from '../Adapter/CARDANO/runtime/CardanoExecutionAdapter'
import type {
  EconomicActionClass,
  EconomicAdmissionWitness,
} from '../Adapter/CARDANO/runtime/EconomicAdmission'

/**
 * Helper leggero per costruire una claim tx.
 * La validazione on-chain resta responsabilità di PrizeValidator.
 */
/**
 * @deprecated Legacy claim builder intentionally disabled.
 *
 * A transaction assembled here could otherwise be handed to the generic
 * infrastructure submitter and bypass the canonical EconomicAdmission path.
 * The supported Claim flow is src/gameFlow.ts/claim.ts with exact settlement
 * evidence and an explicit EconomicAdmission witness.
 */
export async function buildClaimTx(
  lucid: any,
  ticketPolicyId: string,
  ticketAssetName: string,
  prizeUtxo: any,
  recipientAddr: string,
) {
  void lucid
  void ticketPolicyId
  void ticketAssetName
  void prizeUtxo
  void recipientAddr
  throw new Error(
    'Legacy buildClaimTx disabled: use the canonical Claim flow with EconomicAdmission',
  )
}

export async function signAndSubmitTx(lucid: any, tx: any) {
  const adapter = createCardanoExecutionAdapter(lucid)
  const result = await adapter.submitInfrastructure(tx)
  return result.transactionRef
}

export async function signAndSubmitEconomicTx(
  lucid: any,
  tx: any,
  admission: EconomicAdmissionWitness | undefined,
  inputReferences: readonly string[],
  liquiditySourceReferences: readonly string[],
  expectedActionClass?: EconomicActionClass,
) {
  const adapter = createCardanoExecutionAdapter(lucid)
  const result = await adapter.submitEconomic(
    tx,
    admission,
    inputReferences,
    liquiditySourceReferences,
    expectedActionClass,
  )
  return result.transactionRef
}

export function basicAddressValidate(addr: string): boolean {
  return (
    typeof addr === 'string' &&
    (addr.startsWith('addr') ||
      addr.startsWith('Ae2') ||
      addr.startsWith('Ddz'))
  )
}
