import { test } from 'node:test'
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { projectCardanoToImmortalV3 } from '../../PRE-RICH/src/PreRichCardanoObservationProjection'

function runReferenceGolden(): string[] {
  const output = execFileSync('cabal', ['run', 'exe:reference-adapter-golden'], { cwd: 'plutus', encoding: 'utf8' })
    .trim().split(/\r?\n/)
  assert.equal(output[0], 'REFERENCE_V1')
  assert.equal(output.length, 4)
  return output.slice(1)
}

function normalizeCardano(state: ReturnType<typeof projectCardanoToImmortalV3>): string {
  const classes = state.classes.map((c) => [c.classId, c.issued, c.unresolved, c.exposure, c.cap, c.saleable].join(':')).join('|')
  return [state.crystallizedLiabilities, state.unresolvedReserve, state.unresolvedTicketCount, state.safetyCapital, state.reserveProtection, state.mandatoryFutureCosts, state.control.currentActiveClass, state.control.highestClassEverActivated, classes].join(',')
}

const authoritativeClasses = Array.from({ length: 8 }, (_, classId) => ({ classId: BigInt(classId), issued: 0n, cap: 10n, saleable: true }))

test('Reference Adapter ↔ Cardano projection differential: canonical Issue → Reveal', () => {
  const [referenceInitial, referenceIssue, referenceReveal] = runReferenceGolden()
  const initialInput = {
    safetyCapital: 0n, reserveProtection: 0n, mandatoryFutureCosts: 0n,
    currentActiveClass: 0n, highestClassEverActivated: 0n,
    pool: { pendingLiabilitiesUsdm: 0n, unresolvedReserveUsdm: 0n, unresolvedTicketCount: 0n, lockedJackpotUsdm: 0n, jackpotThresholdUsdm: 10_000n },
    tickets: [], authoritativeClasses,
  }
  const issueInput = {
    ...initialInput,
    pool: { ...initialInput.pool, unresolvedReserveUsdm: 100n, unresolvedTicketCount: 1n },
    tickets: [{ ticketId: 'reference-0', priceUsdm: 100n, status: 'Pending' as const }],
    authoritativeClasses: authoritativeClasses.map((c) => c.classId === 0n ? { ...c, issued: 1n } : c),
  }
  const revealInput = {
    ...issueInput,
    pool: { ...issueInput.pool, pendingLiabilitiesUsdm: 50_000n, unresolvedReserveUsdm: 0n, unresolvedTicketCount: 0n },
    tickets: [],
  }
  assert.equal(normalizeCardano(projectCardanoToImmortalV3(initialInput)), referenceInitial)
  assert.equal(normalizeCardano(projectCardanoToImmortalV3(issueInput)), referenceIssue)
  assert.equal(normalizeCardano(projectCardanoToImmortalV3(revealInput)), referenceReveal)
})
