#!/usr/bin/env node

// NON-NORMATIVE repository-process gate.
// Runs trusted base-branch code against PR metadata and changed-file inventory.
// It does not prove semantic non-interference and does not configure GitHub rules.
import assert from 'node:assert/strict'
import { appendFile, readFile } from 'node:fs/promises'

const ALLOWED_CLASSES = new Set(['A', 'B', 'C', 'D', 'E'])
const ALLOWED_LAYERS = new Set(['UNIVERSAL', 'ADAPTER', 'APPLICATION', 'PROCESS', 'AUDIT'])
const CHALLENGE_HOLD_LABELS = new Set([
  'governance/challenged',
  'governance/escalated',
  'governance/security-hold',
  'governance/security-escalated',
  'governance/upheld',
])
const REQUIRED_FIELDS = [
  'Layer',
  'Class',
  'Normative status',
  'Purpose and claimed effect',
  'Affected files / areas',
  'Invariants, predicates, interfaces, or evidence contracts touched',
  'Explicitly unchanged boundaries',
  'Reproduction command(s)',
  'Required CI workflow/run links',
  'Test/vector names and results',
  'Evidence-bound commit SHA',
  'Residual-obligation impact',
  'Compatibility / migration impact',
  'Provenance of generated or copied material',
  'Known limitations and untested claims',
  'Why this PR qualifies for class A/B/C/D/E',
]

// These areas form the contribution gate's own control plane, or are known normative
// surfaces. They require the existing stronger path, regardless of a PR's self-label.
const CONTROL_PLANE_PATTERNS = [
  /^\.github\/workflows\//i,
  /^\.github\/(?:CODEOWNERS|dependabot\.yml)$/i,
  /^CONTRIBUTING\.md$/i,
  /(^|\/)AGENTS\.md$/i,
  /^\.github\/PULL_REQUEST_TEMPLATE\.md$/i,
  /^CODEOWNERS$/i,
  /^scripts\/contribution-evidence-gate\.mjs$/i,
  /^audit\/algorithmic-governability\//i,
  /^docs\/04-guides\/(?:PUBLIC-CONTRIBUTION-WORKFLOW|GITHUB-AUTO-MERGE-INTEGRATION)\.md$/i,
  /(^|\/)docs\/00-normative\//i,
  /(^|\/)(?:conformance|conformance-vectors|test-vectors|test_vectors)(\/|$)/i,
  /^docs\/(?:01-contracts|02-certification|architecture)\//i,
  /^docs\/01-formal-records\/governance\//i,
  /^docs\/COORDINATION\/GOV-/i,
  /^IMMORTAL\/(?:kernel|docs)\//i,
  /^PRE-RICH\/docs\//i,
  /^Adapter\/[^/]+\/docs\//i,
  /^docs\/archive\/legacy\/(?:Game-Economy|Economic-Algorithm)[^/]*\.md$/i,
  /(^|\/)[^/]*(?:NORMATIVE|CONFORMANCE)[^/]*$/i,
  /(^|\/)[^/]*(?:ECONOMIC[-_](?:KERNEL|MODEL|ALGORITHM)|STATE[-_]?TRANSITION|INVARIANTS[-_]?CONSERVATION)[^/]*$/i,
  /^PRE-RICH\/docs\/GAME-ECONOMY\.md$/i,
  /^SECURITY\.md$/i,
  /(^|\/)[^/]*CONSTITUTION[^/]*$/i,
  /(^|\/)[^/]*ECONOMIC_KERNEL[^/]*$/i,
  /(^|\/)[^/]*STATE_TRANSITION_SPECIFICATION[^/]*$/i,
  /(^|\/)[^/]*INVARIANTS_CONSERVATION[^/]*$/i,
  /(^|\/)[^/]*CONFORMANCE_SPECIFICATION[^/]*$/i,
  /(^|\/)[^/]*UPGRADE_AND_KERNEL_MIGRATION[^/]*$/i,
  /(^|\/)(?:EconomicKernel|CanonicalEconomicState)\.(?:hs|tsx?|jsx?)$/i,
]

const isControlPlane = (path) => CONTROL_PLANE_PATTERNS.some((pattern) => pattern.test(path))

const withoutCodeFences = (body) => body.replace(/```[\s\S]*?```/g, '')

const extractDeclaration = (body) => {
  const clean = withoutCodeFences(String(body ?? ''))
  const heading = /^###\s+Evidence-Gated Contribution Declaration\s*$/im
  const match = heading.exec(clean)
  if (!match) return null
  const afterHeading = clean.slice(match.index + match[0].length)
  const nextHeading = /^#{1,3}\s+[^\n]+$/m.exec(afterHeading)
  return (nextHeading ? afterHeading.slice(0, nextHeading.index) : afterHeading).trim()
}

const fieldValue = (declaration, fieldName) => {
  const lines = declaration.split(/\r?\n/)
  const escaped = fieldName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const pattern = new RegExp('^(\\s*)-\\s+' + escaped + ':\\s*(.*)$', 'i')
  const start = lines.findIndex((line) => pattern.test(line))
  if (start < 0) return null
  const firstMatch = lines[start].match(pattern)
  const indent = firstMatch[1].length
  const values = firstMatch[2].trim() ? [firstMatch[2].trim()] : []
  for (let index = start + 1; index < lines.length; index += 1) {
    const line = lines[index]
    const bullet = line.match(/^(\s*)-\s+[^:]+:\s*(.*)$/)
    if (bullet && bullet[1].length <= indent) break
    if (bullet && bullet[1].length === indent) break
    if (line.trim()) values.push(line.trim().replace(/^-\s+/, ''))
  }
  return values.join(' ').trim()
}

const isPlaceholder = (value) => {
  if (typeof value !== 'string' || value.trim().length === 0) return true
  const text = value.trim()
  return /^\[[^\]]*\]$/.test(text) ||
    /\b(?:TODO|TBD|FILL\s*ME|INSERT\s+(?:HERE|LINK|VALUE)|CHOOSE\s+ONE)\b/i.test(text) ||
    /^(?:\.\.\.|<[^>]+>)$/.test(text)
}

const parseLayer = (value) => {
  if (typeof value !== 'string') return false
  const parts = value.split('/').map((part) => part.trim().toUpperCase())
  return parts.length > 0 && parts.every((part) => ALLOWED_LAYERS.has(part))
}

const parseClasses = (value) => {
  if (typeof value !== 'string') return null
  const normalized = value.trim().toUpperCase()
  if (!/^[A-E](?:\s*(?:,|\+)\s*[A-E])*$/.test(normalized)) return null
  return [...new Set(normalized.match(/[A-E]/g))]
}

const isTestPath = (path) =>
  /(^|\/)(?:__tests__|tests?|test-vectors|test_vectors|conformance|fixtures|vectors)(\/|$)/i.test(path) ||
  /\.(?:test|spec)\.[a-z0-9]+$/i.test(path)

const isEligiblePathForClass = (path, klass) => {
  const markdown = /\.(?:md|mdx)$/i.test(path)
  switch (klass) {
    case 'A':
      return /^(?:README\.md|docs\/(?:README|EXECUTIVE-SUMMARY)\.md)$/i.test(path)
    case 'B':
      return (/^audit\/(?!algorithmic-governability\/).+\.(?:mjs|cjs|js|ts|tsx|py|sh|json|ya?ml|md)$/i.test(path) ||
        /^scripts\/(?:check|audit|verify|validate|replay|collect|extract|diagnose|report|evidence|boundary)[a-z0-9_-]*\.(?:mjs|cjs|js|ts|tsx|py|sh)$/i.test(path))
    case 'C':
      return isTestPath(path)
    case 'D':
      return /^(?:CONTRIBUTING|ROADMAP)\.md$/i.test(path) ||
        /^docs\/04-guides\/.+\.mdx?$/i.test(path) ||
        /^\.github\/(?:ISSUE_TEMPLATE\/|PULL_REQUEST_TEMPLATE\.md$)/i.test(path)
    case 'E':
      return /(^|\/)(?:RESIDUAL[_-]OBLIGATION(?:[_-]REGISTER)?|residual-obligations?)[^/]*\.(?:md|json|ya?ml)$/i.test(path)
    default:
      return false
  }
}

const classifyPullRequest = ({ body, files, headSha, labels = [], challengeHistoryLabels = [] }) => {
  const changed = [...new Set((files ?? []).map((file) => String(file).replace(/\\/g, '/')))]
    .sort()
  if (changed.length === 0) {
    return { decision: 'INCOMPLETE', eligible: false, reasons: ['Changed-file inventory is empty or unavailable.'], files: changed, headSha }
  }
  const normalizedLabels = [...new Set(labels.map((label) => String(label).trim().toLowerCase()).filter(Boolean))]
  const activeHolds = normalizedLabels.filter((label) => CHALLENGE_HOLD_LABELS.has(label))
  if (activeHolds.length > 0) {
    return {
      decision: 'CHALLENGE_BLOCKED',
      eligible: false,
      reasons: ['An active governance challenge/security hold label blocks merging until an authorized, recorded disposition clears it.'],
      challengeLabels: activeHolds,
      files: changed,
      headSha,
    }
  }
  const clearLabels = normalizedLabels.filter((label) => label.startsWith('governance/challenge-cleared'))
  const historicalChallenges = [...new Set(challengeHistoryLabels.map((label) => String(label).trim().toLowerCase()).filter((label) => CHALLENGE_HOLD_LABELS.has(label)))]
  if (historicalChallenges.length > 0 && clearLabels.length === 0) {
    return {
      decision: 'CHALLENGE_BLOCKED',
      eligible: false,
      reasons: ['A governance challenge/security hold was previously applied to this PR. Removing the active label alone does not clear it; a recorded disposition and current-head governance/challenge-cleared-<head-12> label are required.'],
      challengeLabels: historicalChallenges,
      files: changed,
      headSha,
    }
  }
  if (clearLabels.length > 0) {
    const expectedClearLabel = 'governance/challenge-cleared-' + String(headSha ?? '').slice(0, 12).toLowerCase()
    if (clearLabels.length !== 1 || clearLabels[0] !== expectedClearLabel || !/^[0-9a-f]{12}$/.test(String(headSha ?? '').slice(0, 12))) {
      return {
        decision: 'STALE_CHALLENGE_DISPOSITION',
        eligible: false,
        reasons: ['Challenge clearance label must be unique and bound to the current head using its first 12 hexadecimal characters; a changed head requires fresh disposition.'],
        challengeLabels: clearLabels,
        files: changed,
        headSha,
      }
    }
  }

  const controlFiles = changed.filter(isControlPlane)
  if (controlFiles.length > 0) {
    const strongReviewLabels = normalizedLabels.filter((label) => label.startsWith('governance/strong-review-cleared-'))
    const expectedStrongReviewLabel = 'governance/strong-review-cleared-' + String(headSha ?? '').slice(0, 12).toLowerCase()
    const strongReviewCleared = strongReviewLabels.length === 1 &&
      strongReviewLabels[0] === expectedStrongReviewLabel &&
      /^[0-9a-f]{12}$/.test(String(headSha ?? '').slice(0, 12))
    if (!strongReviewCleared) {
      return {
        decision: 'STRONGER_REVIEW_REQUIRED',
        eligible: false,
        reasons: [
          'Changes to normative surfaces or the contribution-governance control plane cannot use the reduced path.',
          'An authorized maintainer must complete stronger review and apply exactly governance/strong-review-cleared-<current-head-12> after the required human review; the required GitHub approval remains independent.',
        ],
        controlFiles,
        files: changed,
        headSha,
      }
    }
    return {
      decision: 'STRONGER_REVIEW_CLEARED',
      eligible: true,
      reducedPathEligible: false,
      reasons: [
        'An authorized maintainer recorded stronger-review clearance for the current head.',
        'This PR is not classified as eligible for the reduced path.',
        'Required GitHub review and all other required CI checks remain mandatory.',
      ],
      controlFiles,
      files: changed,
      headSha,
    }
  }

  const declaration = extractDeclaration(body)
  if (!declaration) {
    return { decision: 'INCOMPLETE', eligible: false, reasons: ['Missing a non-code-fenced “Evidence-Gated Contribution Declaration” section.'], files: changed, headSha }
  }

  const values = Object.fromEntries(REQUIRED_FIELDS.map((field) => [field, fieldValue(declaration, field)]))
  const missing = REQUIRED_FIELDS.filter((field) => isPlaceholder(values[field]))
  if (missing.length > 0) {
    return { decision: 'INCOMPLETE', eligible: false, reasons: ['Missing or placeholder declaration fields: ' + missing.join(', ')], files: changed, headSha }
  }
  const evidenceHeadSha = String(values['Evidence-bound commit SHA'] ?? '').replace(/[`'"]/g, '').trim()
  if (!headSha || evidenceHeadSha !== headSha) {
    return { decision: 'STALE_EVIDENCE', eligible: false, reasons: ['Evidence-bound commit SHA must exactly match the current pull-request head; update the declaration and refresh evidence after each commit.'], files: changed, headSha }
  }

  const classes = parseClasses(values.Class)
  if (!classes || classes.length === 0) {
    return { decision: 'STRONGER_REVIEW_REQUIRED', eligible: false, reasons: ['Class must be declared as one or more of A–E, separated by commas or plus signs.'], files: changed, headSha }
  }
  if (!parseLayer(values.Layer)) {
    return { decision: 'INCOMPLETE', eligible: false, reasons: ['Layer must be one or more of Universal, Adapter, Application, Process, Audit.'], files: changed, headSha }
  }
  if (!/^non[- ]normative\b/i.test((values['Normative status'] ?? '').trim())) {
    return { decision: 'STRONGER_REVIEW_REQUIRED', eligible: false, reasons: ['Normative or uncertain changes require stronger review.'], files: changed, headSha }
  }
  const residual = (values['Residual-obligation impact'] ?? '').trim()
  if (!/^(?:none\b|updated\b|unresolved\b|n\/a\b)/i.test(residual)) {
    return { decision: 'INCOMPLETE', eligible: false, reasons: ['Residual-obligation impact must be declared as None, Updated, Unresolved, or N/A with a reason.'], files: changed, headSha }
  }
  const incompatible = changed.filter((path) => !classes.some((klass) => isEligiblePathForClass(path, klass)))
  if (incompatible.length > 0) {
    return {
      decision: 'STRONGER_REVIEW_REQUIRED',
      eligible: false,
      reasons: ['One or more changed paths are outside the declared class scope; production or unknown paths must not enter the reduced Auto-merge path.'],
      incompatibleFiles: incompatible,
      files: changed,
      headSha,
      classes,
    }
  }

  return {
    decision: 'ELIGIBLE_FOR_REDUCED_PATH',
    eligible: true,
    reasons: [
      'Declared class(es) and required fields are present.',
      'Each changed file matches at least one declared class A–E path boundary.',
      'Known normative/control-plane paths are not changed.',
      'This is a process-eligibility result only; required reviews and independent CI checks remain mandatory.',
    ],
    files: changed,
    headSha,
    classes,
  }
}

const emitResult = async (result) => {
  const lines = [
    '# Contribution evidence gate',
    '',
    '**Decision:** ' + result.decision,
    '',
    'Head commit: ' + (result.headSha ?? 'unknown'),
    '',
    ...result.reasons.map((reason) => '- ' + reason),
    '',
    '## Changed files',
    ...result.files.map((file) => '- ' + file),
  ]
  if (result.controlFiles?.length) {
    lines.push('', '## Stronger-review paths', ...result.controlFiles.map((file) => '- ' + file))
  }
  if (result.incompatibleFiles?.length) {
    lines.push('', '## Paths outside declared class scope', ...result.incompatibleFiles.map((file) => '- ' + file))
  }
  if (result.challengeLabels?.length) {
    lines.push('', '## Governance challenge labels', ...result.challengeLabels.map((label) => '- ' + label))
  }
  const summaryPath = process.env.GITHUB_STEP_SUMMARY
  if (summaryPath) await appendFile(summaryPath, lines.join('\n') + '\n')
  for (const line of lines) console.log(line)
}

const githubRequest = async (url, token) => {
  const response = await fetch(url, {
    headers: {
      accept: 'application/vnd.github+json',
      authorization: 'Bearer ' + token,
      'x-github-api-version': '2022-11-28',
    },
  })
  if (!response.ok) throw new Error('GitHub API returned ' + response.status + ' for ' + url + ': ' + (await response.text()).slice(0, 400))
  return response.json()
}

const fetchChangedFiles = async (apiUrl, repository, number, token) => {
  const files = []
  for (let page = 1; page <= 30; page += 1) {
    const batch = await githubRequest(
      apiUrl + '/repos/' + repository + '/pulls/' + number + '/files?per_page=100&page=' + page,
      token,
    )
    if (!Array.isArray(batch)) throw new Error('GitHub returned an invalid pull-request file inventory.')
    files.push(...batch.map((file) => file.filename))
    if (batch.length < 100) return files
  }
  throw new Error('Pull-request file inventory exceeded the 3,000-file safety limit; fail closed.')
}

const fetchChallengeLabelHistory = async (apiUrl, repository, number, token) => {
  const labels = new Set()
  for (let page = 1; page <= 30; page += 1) {
    const batch = await githubRequest(
      apiUrl + '/repos/' + repository + '/issues/' + number + '/events?per_page=100&page=' + page,
      token,
    )
    if (!Array.isArray(batch)) throw new Error('GitHub returned an invalid issue-event inventory for governance challenge history.')
    for (const event of batch) {
      const label = String(event?.label?.name ?? '').trim().toLowerCase()
      if ((event?.event === 'labeled' || event?.event === 'unlabeled') && CHALLENGE_HOLD_LABELS.has(label)) {
        labels.add(label)
      }
    }
    if (batch.length < 100) return [...labels]
  }
  throw new Error('Governance challenge-event history exceeded the 3,000-event safety limit; fail closed.')
}
const eventSnapshotIsCurrent = (eventPR, livePR) => Boolean(
  eventPR?.head?.sha &&
  eventPR?.base?.sha &&
  livePR?.head?.sha &&
  livePR?.base?.sha &&
  livePR.head.sha === eventPR.head.sha &&
  livePR.base.sha === eventPR.base.sha,
)
const selfTest = () => {
  const body = [
    '### Evidence-Gated Contribution Declaration',
    '- Layer: Audit',
    '- Class: B',
    '- Normative status: Non-normative',
    '- Purpose and claimed effect: Test the contribution process gate.',
    '- Affected files / areas: New audit script.',
    '- Invariants, predicates, interfaces, or evidence contracts touched: No normative predicates changed.',
    '- Explicitly unchanged boundaries: Constitution, kernel, Safe, Omega, T, obligation partition.',
    '- Evidence:',
    '  - Reproduction command(s): node scripts/contribution-evidence-gate.mjs --self-test',
    '  - Required CI workflow/run links: Workflow B',
    '  - Test/vector names and results: gate fixture tests',
    '  - Evidence-bound commit SHA: abc123',
    '- Residual-obligation impact: None',
    '- Compatibility / migration impact: None; no public interface changed.',
    '- Provenance of generated or copied material: Original contribution.',
    '- Known limitations and untested claims: Model test only.',
    '- Why this PR qualifies for class A/B/C/D/E: Non-normative test harness and declared invariants.',
  ].join('\n')
  const pass = classifyPullRequest({ body, files: ['audit/example-boundary.mjs'], headSha: 'abc123' })
  assert.equal(pass.decision, 'ELIGIBLE_FOR_REDUCED_PATH')
  assert.equal(pass.eligible, true)

  const eventHead = 'a'.repeat(40)
  const eventBase = 'b'.repeat(40)
  assert.equal(eventSnapshotIsCurrent(
    { head: { sha: eventHead }, base: { sha: eventBase } },
    { head: { sha: eventHead }, base: { sha: eventBase } },
  ), true)
  assert.equal(eventSnapshotIsCurrent(
    { head: { sha: eventHead }, base: { sha: eventBase } },
    { head: { sha: 'c'.repeat(40) }, base: { sha: eventBase } },
  ), false, 'head changes must stale the event')
  assert.equal(eventSnapshotIsCurrent(
    { head: { sha: eventHead }, base: { sha: eventBase } },
    { head: { sha: eventHead }, base: { sha: 'd'.repeat(40) } },
  ), false, 'base policy changes must stale the event')
  assert.equal(eventSnapshotIsCurrent(
    { head: { sha: eventHead } },
    { head: { sha: eventHead } },
  ), false, 'missing base SHA must fail closed')

  const normative = classifyPullRequest({ body, files: ['docs/00-normative/01_CONSTITUTION_FINAL.md'], headSha: 'abc123' })
  assert.equal(normative.decision, 'STRONGER_REVIEW_REQUIRED')
  assert.equal(normative.eligible, false)

  const control = classifyPullRequest({ body, files: ['.github/workflows/contribution-evidence-gate.yml'], headSha: 'abc123' })
  assert.equal(control.decision, 'STRONGER_REVIEW_REQUIRED')
  assert.equal(control.eligible, false)

  for (const path of ['CONTRIBUTING.md', '.github/PULL_REQUEST_TEMPLATE.md']) {
    const routed = classifyPullRequest({ body, files: [path], headSha: 'abc123' })
    assert.equal(routed.decision, 'STRONGER_REVIEW_REQUIRED', path)
    assert.equal(routed.eligible, false, path)
  }

  // Route authoritative specifications even when their filenames lack narrow keywords.
  for (const path of [
    'IMMORTAL/docs/ECONOMIC-KERNEL.md',
    'IMMORTAL/kernel/EconomicTransitionV3.hs',
    'docs/01-contracts/13_LIVENESS_AND_PROGRESS_SPECIFICATION.md',
    'docs/02-certification/CONCRETE_KERNEL_CERTIFICATION_SPECIFICATION.md',
    'PRE-RICH/docs/APPLICATION-SPECIFICATION.md',
    'Adapter/CARDANO/docs/ADAPTER-SPECIFICATION.md',
    'docs/archive/legacy/Game-Economy.md',
    'docs/research/PROTOCOL-USAGE-FEE-G1-NORMATIVE-RECONCILIATION-B3-v1.md',
    'docs/01-formal-records/governance/GOV-28-FULL-GOVERNANCE-CONFORMANCE.md',
    'docs/architecture/CAES-CONFORMANCE-MATRIX.md',
    'Adapter/BITCOIN/docs/RGB-IMMORTAL-CONFORMANCE-NOTE.md',
    'IMMORTAL/conformance/GoldenVectors.hs',
    'Adapter/REFERENCE/conformance/immortal-portability-vectors.v1.json',
    'PRE-RICH/tests/conformance/B6-PC05-monetary-scale.conformance.test.ts',
  ]) {
    const routed = classifyPullRequest({ body, files: [path], headSha: 'abc123' })
    assert.equal(routed.decision, 'STRONGER_REVIEW_REQUIRED', path)
    assert.equal(routed.eligible, false, path)
  }

  const strongHead = 'abcdef1234567890abcdef1234567890abcdef12'
  const strongReviewCleared = classifyPullRequest({
    body,
    files: ['docs/00-normative/01_CONSTITUTION_FINAL.md'],
    headSha: strongHead,
    labels: ['governance/strong-review-cleared-abcdef123456'],
  })
  assert.equal(strongReviewCleared.decision, 'STRONGER_REVIEW_CLEARED')
  assert.equal(strongReviewCleared.eligible, true)
  assert.equal(strongReviewCleared.reducedPathEligible, false)

  const staleStrongReview = classifyPullRequest({
    body,
    files: ['docs/00-normative/01_CONSTITUTION_FINAL.md'],
    headSha: strongHead,
    labels: ['governance/strong-review-cleared-123456abcdef'],
  })
  assert.equal(staleStrongReview.decision, 'STRONGER_REVIEW_REQUIRED')
  assert.equal(staleStrongReview.eligible, false)

  const activeChallengeOnControlPlane = classifyPullRequest({
    body,
    files: ['.github/workflows/contribution-evidence-gate.yml'],
    headSha: strongHead,
    labels: ['governance/security-hold', 'governance/strong-review-cleared-abcdef123456'],
  })
  assert.equal(activeChallengeOnControlPlane.decision, 'CHALLENGE_BLOCKED')
  assert.equal(activeChallengeOnControlPlane.eligible, false)

  const missing = classifyPullRequest({ body: 'Just a PR', files: ['docs/04-guides/reader.md'], headSha: 'abc123' })
  assert.equal(missing.decision, 'INCOMPLETE')
  assert.equal(missing.eligible, false)

  const template = classifyPullRequest({
    body: body.replace('- Class: B', '- Class: [A | B | C | D | E]'),
    files: ['audit/example-boundary.mjs'],
    headSha: 'abc123',
  })
  assert.equal(template.decision, 'INCOMPLETE')
  assert.equal(template.eligible, false)

  const wrongLayer = classifyPullRequest({
    body: body.replace('- Layer: Audit', '- Layer: Any'),
    files: ['audit/example-boundary.mjs'],
    headSha: 'abc123',
  })
  assert.equal(wrongLayer.decision, 'INCOMPLETE')
  assert.equal(wrongLayer.eligible, false)
  const staleEvidence = classifyPullRequest({
    body: body.replace('Evidence-bound commit SHA: abc123', 'Evidence-bound commit SHA: oldsha'),
    files: ['audit/example-boundary.mjs'],
    headSha: 'abc123',
  })
  assert.equal(staleEvidence.decision, 'STALE_EVIDENCE')
  assert.equal(staleEvidence.eligible, false)


  const productionCodeUnderTestClass = classifyPullRequest({
    body: body.replace('- Class: B', '- Class: C'),
    files: ['src/economic-transition.ts'],
    headSha: 'abc123',
  })
  assert.equal(productionCodeUnderTestClass.decision, 'STRONGER_REVIEW_REQUIRED')
  assert.equal(productionCodeUnderTestClass.eligible, false)

  const mixedClasses = classifyPullRequest({
    body: body.replace('- Class: B', '- Class: A, C'),
    files: ['README.md', 'src/__tests__/reader.test.ts'],
    headSha: 'abc123',
  })
  assert.equal(mixedClasses.decision, 'ELIGIBLE_FOR_REDUCED_PATH')
  assert.equal(mixedClasses.eligible, true)

  const narrowDocsPass = classifyPullRequest({
    body: body.replace('- Class: B', '- Class: A'),
    files: ['docs/EXECUTIVE-SUMMARY.md'],
    headSha: 'abc123',
  })
  assert.equal(narrowDocsPass.decision, 'ELIGIBLE_FOR_REDUCED_PATH')
  assert.equal(narrowDocsPass.eligible, true)

  const unclassifiedDocs = classifyPullRequest({
    body: body.replace('- Class: B', '- Class: A'),
    files: ['docs/research/unclassified-economic-boundary.md'],
    headSha: 'abc123',
  })
  assert.equal(unclassifiedDocs.decision, 'STRONGER_REVIEW_REQUIRED')
  assert.equal(unclassifiedDocs.eligible, false)

  const agentInstructions = classifyPullRequest({
    body: body.replace('- Class: B', '- Class: A'),
    files: ['AGENTS.md'],
    headSha: 'abc123',
  })
  assert.equal(agentInstructions.decision, 'STRONGER_REVIEW_REQUIRED')
  assert.equal(agentInstructions.eligible, false)

  const policyLab = classifyPullRequest({
    body,
    files: ['audit/algorithmic-governability/no-result-dependent-authority.mjs'],
    headSha: 'abc123',
  })
  assert.equal(policyLab.decision, 'STRONGER_REVIEW_REQUIRED')
  assert.equal(policyLab.eligible, false)

  const residualRecord = classifyPullRequest({
    body: body.replace('- Class: B', '- Class: E'),
    files: ['docs/03-audit/RESIDUAL_OBLIGATION_REGISTER.md'],
    headSha: 'abc123',
  })
  assert.equal(residualRecord.decision, 'ELIGIBLE_FOR_REDUCED_PATH')
  assert.equal(residualRecord.eligible, true)

  const activeChallenge = classifyPullRequest({
    body,
    files: ['audit/example-boundary.mjs'],
    headSha: 'abc123',
    labels: ['governance/security-hold'],
  })
  assert.equal(activeChallenge.decision, 'CHALLENGE_BLOCKED')
  assert.equal(activeChallenge.eligible, false)

  const boundHead = 'abcdef1234567890abcdef1234567890abcdef12'
  const boundBody = body.replace('Evidence-bound commit SHA: abc123', 'Evidence-bound commit SHA: ' + boundHead)
  const clearedChallenge = classifyPullRequest({
    body: boundBody,
    files: ['audit/example-boundary.mjs'],
    headSha: boundHead,
    labels: ['governance/challenge-cleared-abcdef123456'],
    challengeHistoryLabels: ['governance/security-hold'],
  })
  assert.equal(clearedChallenge.decision, 'ELIGIBLE_FOR_REDUCED_PATH')
  assert.equal(clearedChallenge.eligible, true)

  const removedHoldWithoutDisposition = classifyPullRequest({
    body: boundBody,
    files: ['audit/example-boundary.mjs'],
    headSha: boundHead,
    labels: [],
    challengeHistoryLabels: ['governance/security-hold'],
  })
  assert.equal(removedHoldWithoutDisposition.decision, 'CHALLENGE_BLOCKED')
  assert.equal(removedHoldWithoutDisposition.eligible, false)

  const staleHistoryClearance = classifyPullRequest({
    body: boundBody,
    files: ['audit/example-boundary.mjs'],
    headSha: '123456abcdef7890abcdef1234567890abcdef12',
    labels: ['governance/challenge-cleared-abcdef123456'],
    challengeHistoryLabels: ['governance/security-hold'],
  })
  assert.equal(staleHistoryClearance.decision, 'STALE_CHALLENGE_DISPOSITION')
  assert.equal(staleHistoryClearance.eligible, false)

  const staleChallengeClearance = classifyPullRequest({
    body: boundBody.replace('Evidence-bound commit SHA: ' + boundHead, 'Evidence-bound commit SHA: abcdef1234567890abcdef1234567890abcdef12'),
    files: ['audit/example-boundary.mjs'],
    headSha: '123456abcdef7890abcdef1234567890abcdef12',
    labels: ['governance/challenge-cleared-abcdef123456'],
  })
  assert.equal(staleChallengeClearance.decision, 'STALE_CHALLENGE_DISPOSITION')
  assert.equal(staleChallengeClearance.eligible, false)

  console.log('PASS: complete declaration qualifies only within class-specific path boundaries')
  console.log('PASS: normative/control-plane changes require head-bound stronger-review clearance')
  console.log('PASS: active challenges block both reduced and stronger-review paths')
  console.log('PASS: absent declarations and template placeholders fail closed')
  console.log('PASS: production code cannot be relabeled as test-only')
  console.log('PASS: mixed classes cover every changed file')
  console.log('ALL CONTRIBUTION EVIDENCE GATE SELF-TESTS PASSED')
}

const main = async () => {
  if (process.argv.includes('--self-test')) return selfTest()

  const eventPath = process.env.GITHUB_EVENT_PATH
  const repository = process.env.GITHUB_REPOSITORY
  const token = process.env.GITHUB_TOKEN
  const apiUrl = process.env.GITHUB_API_URL ?? 'https://api.github.com'
  if (!eventPath || !repository || !token) throw new Error('Missing GitHub event path, repository, or read-only API token.')

  const event = JSON.parse(await readFile(eventPath, 'utf8'))
  const eventPR = event.pull_request
  if (!eventPR?.number || !eventPR?.head?.sha) throw new Error('This gate requires a pull_request event.')
  const prUrl = apiUrl + '/repos/' + repository + '/pulls/' + eventPR.number
  const livePR = await githubRequest(prUrl, token)
  if (!eventSnapshotIsCurrent(eventPR, livePR)) {
    const staleReasons = []
    if (!eventPR.head?.sha || livePR.head?.sha !== eventPR.head.sha) {
      staleReasons.push('The pull request head changed after this event was emitted. Wait for reevaluation against the current head.')
    }
    if (!eventPR.base?.sha || livePR.base?.sha !== eventPR.base.sha) {
      staleReasons.push('The pull request base/policy SHA changed or is missing after this event was emitted. Wait for reevaluation against the current target policy.')
    }
    staleReasons.push('Stale or incompletely bound event snapshots fail closed.')
    const stale = {
      decision: 'STALE_EVENT',
      eligible: false,
      reasons: staleReasons,
      files: [],
      headSha: eventPR.head.sha,
    }
    await emitResult(stale)
    process.exitCode = 1
    return
  }

  const files = await fetchChangedFiles(apiUrl, repository, eventPR.number, token)
  const challengeHistoryLabels = await fetchChallengeLabelHistory(apiUrl, repository, eventPR.number, token)
  const result = classifyPullRequest({ body: livePR.body, files, headSha: livePR.head.sha, labels: (livePR.labels ?? []).map((label) => label.name), challengeHistoryLabels })
  await emitResult(result)
  if (!result.eligible) process.exitCode = 1
}

main().catch(async (error) => {
  console.error('FAIL-CLOSED: contribution evidence gate could not complete:', error?.message ?? error)
  const summaryPath = process.env.GITHUB_STEP_SUMMARY
  if (summaryPath) {
    await appendFile(summaryPath,
      '# Contribution evidence gate\n\n**Decision:** FAIL_CLOSED\n\n' +
      String(error?.message ?? error) + '\n')
  }
  process.exitCode = 1
})
