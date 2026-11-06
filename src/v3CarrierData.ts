import { Constr, Data } from 'lucid-cardano'

import type {
  AuthoritativeIssueAdmissionWitness,
  IssueV3CandidateState,
} from './preRichIssueAdmissionBridge'

function constr(index: number, fields: Data[] = []): Constr<Data> {
  return new Constr(index, fields)
}

function unsignedInteger(value: string, label: string): bigint {
  if (typeof value !== 'string' || !/^(0|[1-9][0-9]*)$/.test(value)) {
    throw new Error(label + ' must be a canonical non-negative integer string')
  }
  return BigInt(value)
}

function utf8Hex(value: string, label: string): string {
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(label + ' must be non-empty')
  }
  return Array.from(new TextEncoder().encode(value))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}

const JACKPOT_STATUS_INDEX = {
  inactive: 0,
  locked: 1,
  payable: 2,
  closed: 3,
} as const

/**
 * Encode the exact four-field JackpotState data constructor.
 *
 * JackpotState is:
 *   JackpotState(lockedAmount, threshold, status, cycle)
 *
 * Its status is a nested nullary constructor in declaration order.
 */
function jackpotToConstr(
  jackpot: IssueV3CandidateState['jackpot'],
): Constr<Data> {
  const statusIndex = JACKPOT_STATUS_INDEX[jackpot.status]
  if (statusIndex === undefined) {
    throw new Error('Authoritative Issue candidate V3 jackpot status is invalid')
  }

  return constr(0, [
    unsignedInteger(jackpot.lockedAmount, 'jackpot.lockedAmount'),
    unsignedInteger(jackpot.threshold, 'jackpot.threshold'),
    constr(statusIndex),
    unsignedInteger(jackpot.cycle, 'jackpot.cycle'),
  ])
}

/** Serialize the complete candidate V3 state with the canonical Plutus shape. */
export function issueCandidateStateToConstr(
  state: IssueV3CandidateState,
): Constr<Data> {
  if (!state || !Array.isArray(state.classes) || state.classes.length !== 8) {
    throw new Error('Authoritative Issue candidate V3 state must contain exactly 8 classes')
  }

  const classes = state.classes.map((entry, index) => {
    if (unsignedInteger(entry.classId, 'classId') !== BigInt(index)) {
      throw new Error('Authoritative Issue candidate V3 class IDs are not canonical')
    }
    if (typeof entry.saleable !== 'boolean') {
      throw new Error('Authoritative Issue candidate V3 class saleable flag is invalid')
    }
    return constr(0, [
      BigInt(entry.classId),
      unsignedInteger(entry.issued, 'class.issued'),
      unsignedInteger(entry.unresolved, 'class.unresolved'),
      unsignedInteger(entry.exposure, 'class.exposure'),
      unsignedInteger(entry.cap, 'class.cap'),
      constr(entry.saleable ? 1 : 0),
    ])
  })

  const currentActiveClass = unsignedInteger(
    state.control.currentActiveClass,
    'control.currentActiveClass',
  )
  const highestClassEverActivated = unsignedInteger(
    state.control.highestClassEverActivated,
    'control.highestClassEverActivated',
  )
  if (
    currentActiveClass >= 8n ||
    highestClassEverActivated >= 8n ||
    highestClassEverActivated < currentActiveClass
  ) {
    throw new Error('Authoritative Issue candidate V3 control state is invalid')
  }

  return constr(0, [
    unsignedInteger(state.crystallizedLiabilities, 'crystallizedLiabilities'),
    unsignedInteger(state.unresolvedReserve, 'unresolvedReserve'),
    unsignedInteger(state.unresolvedTicketCount, 'unresolvedTicketCount'),
    unsignedInteger(state.safetyCapital, 'safetyCapital'),
    unsignedInteger(state.reserveProtection, 'reserveProtection'),
    unsignedInteger(state.mandatoryFutureCosts, 'mandatoryFutureCosts'),
    classes,
    constr(0, [
      currentActiveClass,
      highestClassEverActivated,
    ]),
    jackpotToConstr(state.jackpot),
  ])
}

export function buildIssueCarrierDatum(
  stateVersion: bigint,
  candidateState: IssueV3CandidateState,
): Constr<Data> {
  if (typeof stateVersion !== 'bigint' || stateVersion < 0n) {
    throw new Error('V3 carrier state version must be a non-negative bigint')
  }
  return constr(0, [
    stateVersion + 1n,
    issueCandidateStateToConstr(candidateState),
  ])
}

type IssueCarrierActionInput = Pick<
  AuthoritativeIssueAdmissionWitness,
  | 'actionClass'
  | 'decisionReference'
  | 'authoritativeObservationReference'
  | 'stateHash'
  | 'actionFingerprint'
  | 'postStateHash'
  | 'carrierAuthoritySignature'
>

/**
 * PlutusData string values are hex-encoded bytes in Lucid.
 *
 * The Haskell producer and on-chain canonicalV3StateHash expose digests as
 * 64-character ASCII hex strings. Encode those strings as UTF-8 bytes (128
 * hex characters for the PlutusData representation), rather than passing the
 * digest hex directly (which would encode only the 32 digest bytes).
 *
 * The Ed25519 signature is different: it is already 64 raw bytes represented
 * as 128 hex characters, so it must not be UTF-8 encoded.
 */
export function buildIssueCarrierAction(
  admission: IssueCarrierActionInput,
): Constr<Data> {
  if (admission.actionClass !== 'Issue') {
    throw new Error('V3 carrier action class must be Issue')
  }

  const digestFields = [
    ['stateHash', admission.stateHash],
    ['actionFingerprint', admission.actionFingerprint],
    ['postStateHash', admission.postStateHash],
  ] as const
  for (const [name, value] of digestFields) {
    if (typeof value !== 'string' || !/^[0-9a-f]{64}$/.test(value)) {
      throw new Error(name + ' must be a lowercase 32-byte hexadecimal digest')
    }
  }

  const signature = admission.carrierAuthoritySignature
  if (typeof signature !== 'string' || !/^[0-9a-fA-F]{128}$/.test(signature)) {
    throw new Error('V3 carrier authority signature must encode exactly 64 raw bytes')
  }

  return constr(0, [
    utf8Hex(admission.actionClass, 'actionClass'),
    utf8Hex(admission.decisionReference, 'decisionReference'),
    utf8Hex(
      admission.authoritativeObservationReference,
      'authoritativeObservationReference',
    ),
    utf8Hex(admission.stateHash, 'stateHash'),
    utf8Hex(admission.actionFingerprint, 'actionFingerprint'),
    utf8Hex(admission.postStateHash, 'postStateHash'),
    signature.toLowerCase(),
  ])
}
