import { describe, expect, it } from 'vitest'
import { Constr, Data, type UTxO } from 'lucid-cardano'
import { observePrizeLifecycle } from '../gameFlow'

function prizeUtxo(status: number, beaconStatus: number): UTxO {
  const fields: unknown[] = Array.from({ length: 23 }, () => 0n)
  fields[10] = new Constr(status, [])
  fields[14] = new Constr(beaconStatus, [])
  return {
    txHash: 'a'.repeat(64),
    outputIndex: 0,
    address: 'addr_test1vr',
    assets: { lovelace: 2_000_000n },
    datum: Data.to(new Constr(0, fields as any)),
    datumHash: undefined,
    scriptRef: undefined,
  } as UTxO
}

describe('observed PRE-RICH prize lifecycle', () => {
  it('maps Pending + BeaconPending to ISSUING', () => {
    expect(observePrizeLifecycle(prizeUtxo(0, 0))).toBe('ISSUING')
  })

  it('maps Pending + BeaconReady to AWAITING_FINALITY', () => {
    expect(observePrizeLifecycle(prizeUtxo(0, 1))).toBe('AWAITING_FINALITY')
  })

  it('maps Revealed to SETTLING', () => {
    expect(observePrizeLifecycle(prizeUtxo(1, 1))).toBe('SETTLING')
  })

  it('maps Claimed to IDLE', () => {
    expect(observePrizeLifecycle(prizeUtxo(2, 1))).toBe('IDLE')
  })

  it('fails closed on an unsupported lifecycle', () => {
    expect(() => observePrizeLifecycle(prizeUtxo(3, 1))).toThrow()
  })
})
