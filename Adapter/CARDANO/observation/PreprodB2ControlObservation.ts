import { Constr, Data, type UTxO } from 'lucid-cardano'

export type PreprodB2ControlState = {
  readonly currentActiveClass: bigint
  readonly highestClassEverActivated: bigint
  readonly stateVersion: bigint
  readonly transitionNonce: bigint
  readonly controlPolicy: string
  readonly controlTokenNameHex: string
  readonly stateReference: string
}

function exactRef(utxo: UTxO): string {
  return utxo.txHash + '#' + utxo.outputIndex
}

function asConstr(value: Data): Constr<any> {
  const candidate = value as unknown as Constr<any>
  if (!candidate || typeof candidate !== 'object' || !Array.isArray(candidate.fields)) {
    throw new Error('B2 control datum is not a constructor datum')
  }
  return candidate
}

function asBigInt(value: unknown, field: string): bigint {
  if (typeof value === 'bigint') return value
  if (typeof value === 'number' && Number.isInteger(value)) return BigInt(value)
  if (typeof value === 'string' && /^-?\d+$/.test(value)) return BigInt(value)
  throw new Error('B2 control datum ' + field + ' is not an integer')
}

function asHex(value: unknown, field: string): string {
  if (typeof value !== 'string' || !/^[0-9a-f]*$/i.test(value)) {
    throw new Error('B2 control datum ' + field + ' is not hex')
  }
  return value.toLowerCase()
}

function decodeControlDatum(
  datumCbor: string,
  expectedPolicyId: string,
  expectedTokenNameHex: string,
): Omit<PreprodB2ControlState, 'stateReference'> {
  const decoded = asConstr(Data.from(datumCbor))
  if (decoded.index !== 0 || decoded.fields.length !== 6) {
    throw new Error(
      'B2 control datum must be constructor 0 with exactly six fields',
    )
  }

  const currentActiveClass = asBigInt(
    decoded.fields[0],
    'currentActiveClass',
  )
  const highestClassEverActivated = asBigInt(
    decoded.fields[1],
    'highestClassEverActivated',
  )
  const stateVersion = asBigInt(decoded.fields[2], 'stateVersion')
  const transitionNonce = asBigInt(
    decoded.fields[3],
    'transitionNonce',
  )
  const controlPolicy = asHex(decoded.fields[4], 'controlPolicy')
  const controlTokenNameHex = asHex(
    decoded.fields[5],
    'controlTokenName',
  )

  if (
    currentActiveClass < 0n ||
    highestClassEverActivated < 0n ||
    currentActiveClass > highestClassEverActivated ||
    highestClassEverActivated > 7n
  ) {
    throw new Error('B2 control class bounds are invalid')
  }
  if (stateVersion < 0n || transitionNonce < 0n) {
    throw new Error('B2 control version/nonce are invalid')
  }
  if (controlPolicy !== expectedPolicyId.toLowerCase()) {
    throw new Error('B2 control policy binding mismatch')
  }
  if (controlTokenNameHex !== expectedTokenNameHex.toLowerCase()) {
    throw new Error('B2 control token-name binding mismatch')
  }

  return {
    currentActiveClass,
    highestClassEverActivated,
    stateVersion,
    transitionNonce,
    controlPolicy,
    controlTokenNameHex,
  }
}

/**
 * Re-query the exact authenticated singleton at deployment identity.
 *
 * This function deliberately fails closed on:
 * - missing/duplicate singleton;
 * - missing inline datum;
 * - malformed datum;
 * - policy/token mismatch;
 * - class bounds violations.
 *
 * It never accepts a caller-supplied CurrentActiveClass as authority.
 */
export async function observePreprodB2Control(
  lucid: {
    utxosAt: (address: string) => Promise<UTxO[]>
  },
  options: {
    address: string
    policyId: string
    tokenNameHex: string
  },
): Promise<PreprodB2ControlState> {
  if (!options.address || !options.policyId || !options.tokenNameHex) {
    throw new Error('B2 control singleton identity is not configured')
  }

  const unit =
    options.policyId.toLowerCase() +
    options.tokenNameHex.toLowerCase()

  const matches = (await lucid.utxosAt(options.address)).filter(
    (utxo) => (utxo.assets[unit] ?? 0n) === 1n,
  )

  if (matches.length !== 1) {
    throw new Error(
      'B2 control singleton must exist exactly once at the configured address',
    )
  }

  const utxo = matches[0]
  const datumCbor = utxo.datum
  if (!datumCbor) {
    throw new Error('B2 control singleton must carry an inline datum')
  }

  return {
    ...decodeControlDatum(
      datumCbor,
      options.policyId,
      options.tokenNameHex,
    ),
    stateReference: exactRef(utxo),
  }
}
