import { describe, expect, it } from 'vitest'
import type { IssueIntent } from '../../IMMORTAL/intent/IssueIntent'
import {
  createAuthoritativeIssueAdmissionProvider,
} from '../authoritativeIssueAdmissionProducer'

describe('IMMORTAL Issue intent boundary', () => {
  it('passes the intent coordinates unchanged to the authoritative producer', async () => {
    const intent: IssueIntent = {
      action: 'Issue',
      classId: 3n,
      price: 5n,
    }

    let received: Record<string, unknown> | undefined

    const provider = createAuthoritativeIssueAdmissionProvider(
      async (context) => {
        received = context
        throw new Error('probe-stop')
      },
      {
        classId: intent.classId,
        priceReferenceUnits: intent.price,
        currentActiveClass: 3n,
        highestClassEverActivated: 3n,
        issued: 0n,
        cap: 10n,
      },
    )

    await expect(
      provider({
        ...intent,
        counterInputReference: 'counter#0',
        controlStateReference: 'control#0',
        poolInputReference: 'pool#0',
        liquiditySourceReferences: ['pool#0'],
      }),
    ).rejects.toThrow('probe-stop')

    expect(received).toMatchObject({
      action: 'Issue',
      classId: 3n,
      price: 5n,
      counterInputReference: 'counter#0',
      controlStateReference: 'control#0',
      poolInputReference: 'pool#0',
      liquiditySourceReferences: ['pool#0'],
    })
  })
})
