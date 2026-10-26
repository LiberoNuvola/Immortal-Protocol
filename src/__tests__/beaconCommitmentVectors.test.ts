import { describe, expect, it } from 'vitest'
import {
  deriveGameRoundCommitment,
  encodeBeaconTarget,
  fromHex,
  ticketCommitment,
  toHex,
} from '../beacon'

/**
 * Golden vectors for the EXISTING legacy encoding/domains only.
 *
 * These fixtures protect the current TypeScript implementation against
 * accidental drift. They do not claim on-chain authentication of the
 * round commitment and do not define a future schema or migration.
 */
describe('legacy Beacon commitment golden vectors', () => {
  it('encodes BeaconTarget with the established field order', () => {
    const encoded = encodeBeaconTarget({
      networkId: 1,
      round: 381,
      mainchainRef: fromHex('aabbcc'),
      version: new TextEncoder().encode('v1'),
    })

    expect(toHex(encoded)).toBe('31313333383133aabbcc327631')
  })

  it('derives the existing GameRoundCommitment deterministically', async () => {
    const digest = await deriveGameRoundCommitment(
      fromHex('010203'),
      381,
      fromHex('000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f'),
      new TextEncoder().encode('v1'),
    )

    expect(toHex(digest)).toBe(
      '319820630ca9c2e09d872270d8cc090dd264b1e0c0f43be2bb5bd4a5971a4e74',
    )
  })

  it('derives the existing V2 ticket commitment over the encoded target', async () => {
    const digest = await ticketCommitment(
      fromHex('01020304'),
      fromHex('202122232425262728292a2b2c2d2e2f303132333435363738393a3b3c3d3e3f'),
      new TextEncoder().encode('v1'),
      7,
      250,
      fromHex('31313333383133aabbcc327631'),
    )

    expect(toHex(digest)).toBe(
      '018c2f8b435091e59ad1a4db011e9d41536bdcd1bac141c69fc42f74f329dd0b',
    )
  })
})
