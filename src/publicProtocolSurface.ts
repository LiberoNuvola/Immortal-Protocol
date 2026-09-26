/**
 * Public Protocol Surface
 *
 * Presentation-only adapter for the IMMORTAL Protocol Declaration layer.
 *
 * IMPORTANT:
 * - It consumes an already-authoritative ProtocolDeclaration.
 * - It does not infer activity from UI intent.
 * - It does not infer Beacon trust mode.
 * - It does not calculate economic health.
 * - It cannot mutate protocol state.
 *
 * This module is deliberately small so the frontend agent can compose it
 * into any shell without coupling presentation to the economic kernel.
 */

import type {
  ProtocolDeclaration,
  ProtocolActivityDeclaration,
} from './protocolDeclaration'

export type ProtocolDeclarationView = {
  protocolId: string
  lifeState: string
  currentActivity: string
  activitySubject: string | null
  operationalStatus: string
  beacon: string
  observedAt: string
  evidence: Array<{
    source: string
    scope: string
    canonicalStateRef: string
    evidenceRef: string
    observedAt: string
  }>
}

function subjectText(activity: ProtocolActivityDeclaration): string | null {
  if (!activity.subject) return null

  switch (activity.subject.kind) {
    case 'CLASS':
      return `Class ${activity.subject.classId}`
    case 'ASSET':
      return activity.subject.assetRef
    case 'ROUND':
      return activity.subject.roundId
  }
}

export function buildProtocolDeclarationView(
  declaration: ProtocolDeclaration,
): ProtocolDeclarationView {
  return {
    protocolId: declaration.protocolId,
    lifeState: declaration.lifeState,
    currentActivity: declaration.currentActivity.kind,
    activitySubject: subjectText(declaration.currentActivity),
    operationalStatus: declaration.operationalStatus,
    beacon: declaration.beacon
      ? `${declaration.beacon.mode} · ${declaration.beacon.version}`
      : 'UNDECLARED',
    observedAt: declaration.observedAt,
    evidence: declaration.evidence.map((evidence) => ({
      source: evidence.source,
      scope: evidence.scope,
      canonicalStateRef: evidence.canonicalStateRef,
      evidenceRef: evidence.evidenceRef,
      observedAt: evidence.observedAt,
    })),
  }
}

/**
 * Mounts an already-authoritative declaration into a DOM container.
 *
 * All values are assigned with textContent; evidence is therefore never
 * interpreted as HTML by the public surface.
 */
export function mountProtocolDeclaration(
  container: HTMLElement,
  declaration: ProtocolDeclaration,
): void {
  const view = buildProtocolDeclarationView(declaration)

  container.replaceChildren()

  const root = document.createElement('section')
  root.className = 'protocol-declaration'
  root.setAttribute('aria-label', 'Protocol declaration')

  const heading = document.createElement('h2')
  heading.textContent = view.protocolId
  root.appendChild(heading)

  const fields: Array<[string, string]> = [
    ['Life State', view.lifeState],
    ['Current Activity', view.activitySubject
      ? `${view.currentActivity} · ${view.activitySubject}`
      : view.currentActivity],
    ['Operational Status', view.operationalStatus],
    ['Beacon', view.beacon],
    ['Observed At', view.observedAt],
  ]

  for (const [label, value] of fields) {
    const row = document.createElement('div')
    row.className = 'protocol-declaration__row'

    const key = document.createElement('span')
    key.className = 'protocol-declaration__label'
    key.textContent = label

    const val = document.createElement('span')
    val.className = 'protocol-declaration__value'
    val.textContent = value

    row.append(key, val)
    root.appendChild(row)
  }

  const evidenceHeading = document.createElement('h3')
  evidenceHeading.textContent = 'Evidence'
  root.appendChild(evidenceHeading)

  const evidenceList = document.createElement('ul')
  evidenceList.className = 'protocol-declaration__evidence'

  for (const evidence of view.evidence) {
    const item = document.createElement('li')
    item.textContent =
      `${evidence.source} · ${evidence.scope} · ${evidence.evidenceRef}`
    item.title = evidence.canonicalStateRef
    evidenceList.appendChild(item)
  }

  root.appendChild(evidenceList)
  container.appendChild(root)
}
