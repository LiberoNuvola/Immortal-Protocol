/**
 * Explicit Beacon trust-mode selection.
 * B3 VERIFIED -> B2 ATTESTED -> B1 AUTHORIZED.
 *
 * Selection happens before commitments. A lower mode is never silently
 * substituted for a higher mode inside an already-started round.
 */
export type BeaconTrustMode =
  | 'B3_VERIFIED'
  | 'B2_ATTESTED'
  | 'B1_AUTHORIZED'

export type BeaconEvidence = {
  readonly mode: BeaconTrustMode
  readonly roundId: string
  readonly beacon: string
  readonly evidenceRef: string
  readonly verifiedAt: string
}

export type BeaconAvailability = {
  readonly b3?: BeaconEvidence
  readonly b2?: BeaconEvidence
  readonly b1?: BeaconEvidence
}

const PRIORITY: readonly BeaconTrustMode[] = [
  'B3_VERIFIED',
  'B2_ATTESTED',
  'B1_AUTHORIZED',
]

function validEvidence(
  evidence: BeaconEvidence | undefined,
  roundId: string,
): evidence is BeaconEvidence {
  return Boolean(
    evidence &&
    evidence.roundId === roundId &&
    evidence.beacon.length > 0 &&
    evidence.evidenceRef.length > 0 &&
    evidence.verifiedAt.length > 0,
  )
}

/** Select the strongest verified mode available for a new round. */
export function selectBeaconMode(
  roundId: string,
  availability: BeaconAvailability,
): BeaconEvidence {
  const candidates: Record<BeaconTrustMode, BeaconEvidence | undefined> = {
    B3_VERIFIED: availability.b3,
    B2_ATTESTED: availability.b2,
    B1_AUTHORIZED: availability.b1,
  }

  for (const mode of PRIORITY) {
    const evidence = candidates[mode]
    if (validEvidence(evidence, roundId)) return evidence
  }

  throw new Error(
    'No verified Beacon trust mode is available for round ' + roundId,
  )
}

/**
 * A committed round cannot silently change trust mode or Beacon value.
 */
export function assertFrozenBeaconMode(
  frozen: BeaconEvidence,
  observed: BeaconEvidence,
): void {
  if (
    frozen.roundId !== observed.roundId ||
    frozen.mode !== observed.mode ||
    frozen.beacon !== observed.beacon
  ) {
    throw new Error(
      'Beacon trust mode/value changed after round commitment',
    )
  }
}

export function beaconModeLabel(
  mode: BeaconTrustMode,
): string {
  switch (mode) {
    case 'B3_VERIFIED':
      return 'B3 — VERIFIED'
    case 'B2_ATTESTED':
      return 'B2 — ATTESTED'
    case 'B1_AUTHORIZED':
      return 'B1 — AUTHORIZED'
  }
}
