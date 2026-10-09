import { describe, expect, it } from 'vitest'
import { Constr, Data, type UTxO } from 'lucid-cardano'
import { observePreprodB2Control } from '../../Adapter/CARDANO/observation/PreprodB2ControlObservation'

const policyId = 'a'.repeat(56)
const tokenNameHex = 'b'.repeat(64)
const unit = policyId + tokenNameHex
const address = 'addr_test1_b2_control'

function datum(
  current = 0n,
  highest = 0n,
  stateVersion = 0n,
  transitionNonce = 0n,
  policy = policyId,
  token = tokenNameHex,
): string {
  return Data.to(
    new Constr(0, [
      current,
      highest,
      stateVersion,
      transitionNonce,
      policy,
      token,
    ]),
  )
}

function lucidWith(utxos: UTxO[]) {
  return {
    utxosAt: async (_address: string): Promise<UTxO[]> => utxos,
  }
}

function singletonUtxo(
  options: {
    current?: bigint
    highest?: bigint
    stateVersion?: bigint
    transitionNonce?: bigint
    policy?: string
    token?: string
    quantity?: bigint
    txHash?: string
    outputIndex?: number
    includeDatum?: boolean
  } = {},
) {
  const txHash = options.txHash ?? 'c'.repeat(64)
  const outputIndex = options.outputIndex ?? 0
  const quantity = options.quantity ?? 1n
  const policy = options.policy ?? policyId
  const token = options.token ?? tokenNameHex

  return {
    txHash,
    outputIndex,
    address,
    assets: {
      [unit]: quantity,
      ...(policy === policyId && token === tokenNameHex
        ? {}
        : {
            [policy + token]: 1n,
          }),
    },
    ...(options.includeDatum === false
      ? {}
      : {
          datum: datum(
            options.current,
            options.highest,
            options.stateVersion,
            options.transitionNonce,
            policy,
            token,
          ),
        }),
  }
}

describe('PRE-RICH B2 authenticated control observation', () => {
  it('accepts exactly one correctly bound singleton UTxO', async () => {
    const observed = await observePreprodB2Control(
      lucidWith([singletonUtxo()]),
      {
        address,
        policyId,
        tokenNameHex,
      },
    )

    expect(observed.currentActiveClass).toBe(0n)
    expect(observed.highestClassEverActivated).toBe(0n)
    expect(observed.stateVersion).toBe(0n)
    expect(observed.transitionNonce).toBe(0n)
    expect(observed.stateReference).toBe('c'.repeat(64) + '#0')
  })

  it('fails closed on duplicate control UTxOs', async () => {
    await expect(
      observePreprodB2Control(
        lucidWith([
          singletonUtxo({ outputIndex: 0 }),
          singletonUtxo({ outputIndex: 1 }),
        ]),
        { address, policyId, tokenNameHex },
      ),
    ).rejects.toThrow('must exist exactly once')
  })

  it('fails closed when the singleton is absent', async () => {
    await expect(
      observePreprodB2Control(
        lucidWith([
          singletonUtxo({ quantity: 2n }),
        ]),
        { address, policyId, tokenNameHex },
      ),
    ).rejects.toThrow('must exist exactly once')
  })

  it('fails closed when the inline datum is absent', async () => {
    await expect(
      observePreprodB2Control(
        lucidWith([
          singletonUtxo({ includeDatum: false }),
        ]),
        { address, policyId, tokenNameHex },
      ),
    ).rejects.toThrow('must carry an inline datum')
  })

  it('fails closed on policy binding mismatch', async () => {
    await expect(
      observePreprodB2Control(
        lucidWith([
          singletonUtxo({ policy: 'd'.repeat(56), token: tokenNameHex }),
        ]),
        { address, policyId, tokenNameHex },
      ),
    ).rejects.toThrow('policy binding mismatch')
  })

  it('fails closed when current class exceeds historical highest', async () => {
    await expect(
      observePreprodB2Control(
        lucidWith([
          singletonUtxo({ current: 3n, highest: 2n }),
        ]),
        { address, policyId, tokenNameHex },
      ),
    ).rejects.toThrow('class bounds are invalid')
  })

  it('accepts monotonic versioned state within the declared bounds', async () => {
    const observed = await observePreprodB2Control(
      lucidWith([
        singletonUtxo({
          current: 2n,
          highest: 5n,
          stateVersion: 7n,
          transitionNonce: 9n,
        }),
      ]),
      { address, policyId, tokenNameHex },
    )

    expect(observed.currentActiveClass).toBe(2n)
    expect(observed.highestClassEverActivated).toBe(5n)
    expect(observed.stateVersion).toBe(7n)
    expect(observed.transitionNonce).toBe(9n)
  })
})
