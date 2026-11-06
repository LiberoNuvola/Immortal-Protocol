import { describe, expect, it } from 'vitest'
import { Data } from '../../node_modules/lucid-cardano/esm/mod.js'

import {
  buildIssueCarrierAction,
  buildIssueCarrierDatum,
} from '../v3CarrierData'
import { observeEconomicStateCarrier } from '../preprodEconomicStateObservation'
import type {
  AuthoritativeIssueAdmissionWitness,
  IssueV3CandidateState,
} from '../preRichIssueAdmissionBridge'

function fieldsOf(value: unknown): unknown[] {
  if (!value || typeof value !== 'object' || !Array.isArray((value as { fields?: unknown[] }).fields)) {
    throw new Error('expected a Plutus constructor')
  }
  return (value as { fields: unknown[] }).fields
}

function hexToText(value: unknown): string {
  if (typeof value !== 'string' || value.length % 2 !== 0 || !/^[0-9a-f]+$/i.test(value)) {
    throw new Error('expected hex-encoded Plutus bytes')
  }
  const bytes = new Uint8Array(value.match(/.{2}/g)!.map((byte) => Number.parseInt(byte, 16)))
  return new TextDecoder().decode(bytes)
}

const candidateState: IssueV3CandidateState = {
  crystallizedLiabilities: '12',
  unresolvedReserve: '0',
  unresolvedTicketCount: '0',
  safetyCapital: '25',
  reserveProtection: '30',
  mandatoryFutureCosts: '40',
  classes: Array.from({ length: 8 }, (_, index) => ({
    classId: String(index),
    issued: '0',
    unresolved: '0',
    exposure: '0',
    cap: '10',
    saleable: index === 0,
  })),
  control: {
    currentActiveClass: '0',
    highestClassEverActivated: '0',
  },
  jackpot: {
    lockedAmount: '7777',
    threshold: '12345',
    status: 'payable',
    cycle: '9',
  },
}

const carrierIdentity = {
  carrierAddress: 'addr_test1carrier',
  carrierPolicyId: 'aa'.repeat(28),
  carrierTokenNameHex: '5354415445',
}

describe('V3 Issue carrier Plutus-data serialization', () => {
  it('round-trips the exact four-field Jackpot state through the production observer', async () => {
    const datum = Data.to(buildIssueCarrierDatum(4n, candidateState))
    const unit = carrierIdentity.carrierPolicyId + carrierIdentity.carrierTokenNameHex
    const observed = await observeEconomicStateCarrier({
      lucid: {
        utxosAt: async () => [{
          txHash: '11'.repeat(32),
          outputIndex: 0,
          assets: { [unit]: 1n },
          datum,
        }],
      },
      decodeDatum: (raw) => Data.from(raw),
      ...carrierIdentity,
    })

    expect(observed.stateVersion).toBe(5n)
    expect(observed.state.jackpot).toEqual({
      lockedAmount: 7777n,
      threshold: 12345n,
      status: 'payable',
      cycle: 9n,
    })
    expect(observed.state.crystallizedLiabilities).toBe(12n)
    expect(observed.state.safetyCapital).toBe(25n)
    expect(observed.state.reserveProtection).toBe(30n)
    expect(observed.state.mandatoryFutureCosts).toBe(40n)
  })

  it('encodes the three 64-character digest strings as 64 ASCII bytes each', () => {
    const admission = {
      actionClass: 'Issue' as const,
      decisionReference: 'decision:issue:001',
      authoritativeObservationReference: 'observation:issue:001',
      stateHash: '11'.repeat(32),
      actionFingerprint: '22'.repeat(32),
      postStateHash: '33'.repeat(32),
      carrierAuthoritySignature: '44'.repeat(64),
    } as unknown as AuthoritativeIssueAdmissionWitness

    const encoded = Data.to(buildIssueCarrierAction(admission))
    const redeemer = fieldsOf(Data.from(encoded))

    expect(redeemer).toHaveLength(7)
    expect(hexToText(redeemer[0])).toBe('Issue')
    expect(hexToText(redeemer[1])).toBe('decision:issue:001')
    expect(hexToText(redeemer[2])).toBe('observation:issue:001')

    for (const [index, expected] of [
      [3, admission.stateHash],
      [4, admission.actionFingerprint],
      [5, admission.postStateHash],
    ] as const) {
      expect(hexToText(redeemer[index])).toBe(expected)
      expect((redeemer[index] as string).length / 2).toBe(64)
    }

    expect(redeemer[6]).toBe(admission.carrierAuthoritySignature)
    expect((redeemer[6] as string).length / 2).toBe(64)
  })

  it('rejects malformed digest and signature widths before building a redeemer', () => {
    const admission = {
      actionClass: 'Issue' as const,
      decisionReference: 'decision:issue:001',
      authoritativeObservationReference: 'observation:issue:001',
      stateHash: '11'.repeat(32),
      actionFingerprint: '22'.repeat(32),
      postStateHash: '33'.repeat(32),
      carrierAuthoritySignature: '44'.repeat(64),
    } as unknown as AuthoritativeIssueAdmissionWitness

    expect(() => buildIssueCarrierAction({
      ...admission,
      stateHash: '11'.repeat(31),
    })).toThrow('stateHash must be a lowercase 32-byte hexadecimal digest')

    expect(() => buildIssueCarrierAction({
      ...admission,
      carrierAuthoritySignature: '44'.repeat(63),
    })).toThrow('V3 carrier authority signature must encode exactly 64 raw bytes')
  })

  it('rejects malformed Jackpot scalar values rather than dropping the fields', () => {
    const malformed: IssueV3CandidateState = {
      ...candidateState,
      jackpot: {
        ...candidateState.jackpot,
        cycle: '-1',
      },
    }
    expect(() => buildIssueCarrierDatum(4n, malformed)).toThrow(
      'jackpot.cycle must be a canonical non-negative integer string',
    )
  })

  it('documents the four-field Jackpot constructor shape directly', () => {
    const datum = Data.from(Data.to(buildIssueCarrierDatum(0n, candidateState)))
    const root = fieldsOf(datum)
    const state = fieldsOf(root[1])
    const jackpot = fieldsOf(state[8])

    expect(jackpot).toHaveLength(4)
    expect(jackpot[0]).toBe(7777n)
    expect(jackpot[1]).toBe(12345n)
    expect(fieldsOf(jackpot[2])).toHaveLength(0)
    expect(jackpot[3]).toBe(9n)
  })
})
