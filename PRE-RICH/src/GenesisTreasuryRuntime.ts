import {
  admitGenesisTreasury,
  type GenesisTreasuryAdmission,
  type GenesisTreasuryObservation,
} from './GenesisTreasuryAdmission'
import { observeGenesisTreasuryState } from '../../src/genesisTreasuryObservation'

/**
 * Runtime composition for PRE-GENESIS admission.
 *
 * Observation and admission remain separate: this function only composes them.
 * It does not perform the on-chain Genesis transition and must not be used as
 * evidence of on-chain enforcement.
 */
export async function observeAndAdmitGenesisTreasury(input: {
  lucid: any
  treasuryAddress: string
  oracleStateAddress: string
  prePolicyId: string
  preAssetNameHex: string
  oracleStatePolicyId: string
  oracleStateTokenNameHex: string
  oraclePublisherPkh: string
  nowMs?: bigint
}): Promise<GenesisTreasuryAdmission> {
  const observation: GenesisTreasuryObservation =
    await observeGenesisTreasuryState(input)

  return admitGenesisTreasury(
    observation,
    input.treasuryAddress,
    input.prePolicyId,
    input.preAssetNameHex,
    input.oraclePublisherPkh,
  )
}
