#!/usr/bin/env node

const repository = process.env.GITHUB_REPOSITORY
const token = process.env.GH_TOKEN
const runId = String(process.env.GITHUB_RUN_ID ?? '')
const branch = process.env.GITHUB_REF_NAME ?? 'work/immortal-green-closure'
const apiRoot = process.env.GITHUB_API_URL ?? 'https://api.github.com'

if (!repository || !token || !runId) {
  throw new Error('TREASURY_PRIOR_OBSERVATION_GITHUB_CONTEXT_MISSING')
}

async function githubJson(path) {
  const response = await fetch(apiRoot + path, {
    headers: {
      accept: 'application/vnd.github+json',
      authorization: 'Bearer ' + token,
      'x-github-api-version': '2022-11-28',
    },
  })
  if (!response.ok) throw new Error('GITHUB_API_HTTP_' + response.status + ':' + path)
  return response.json()
}

const workflowPath = 'preprod-treasury-receipt-observation.yml'
const runsResponse = await githubJson(
  '/repos/' + repository + '/actions/workflows/' + workflowPath +
  '/runs?branch=' + encodeURIComponent(branch) + '&status=completed&per_page=100'
)
const priorRuns = (runsResponse.workflow_runs ?? [])
  .filter((run) => String(run.id) !== runId && run.conclusion === 'success')
  .sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)))

let selected = null
for (const run of priorRuns) {
  const artifactsResponse = await githubJson(
    '/repos/' + repository + '/actions/runs/' + run.id + '/artifacts?per_page=100'
  )
  const artifact = (artifactsResponse.artifacts ?? [])
    .filter((item) => !item.expired && String(item.name ?? '').startsWith('preprod-treasury-receipt-journal-'))
    .sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)))[0]
  if (artifact) {
    selected = { run, artifact }
    break
  }
}

const output = selected ? {
  found: 'true',
  run_id: String(selected.run.id),
  head_sha: selected.run.head_sha,
  artifact_name: selected.artifact.name,
  artifact_digest: selected.artifact.digest ?? '',
} : {
  found: 'false',
  run_id: '',
  head_sha: '',
  artifact_name: '',
  artifact_digest: '',
}
for (const [key, value] of Object.entries(output)) {
  if (/[\r\n]/.test(String(value))) throw new Error('TREASURY_PRIOR_OBSERVATION_OUTPUT_INVALID')
  console.log(key + '=' + value)
}
console.log(JSON.stringify({
  priorSuccessfulObservationFound: Boolean(selected),
  priorRunId: selected?.run.id ?? null,
  priorHeadSha: selected?.run.head_sha ?? null,
  priorArtifactId: selected?.artifact.id ?? null,
  priorArtifactDigest: selected?.artifact.digest ?? null,
}, null, 2))
