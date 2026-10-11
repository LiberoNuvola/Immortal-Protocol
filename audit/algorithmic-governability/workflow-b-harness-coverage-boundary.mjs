#!/usr/bin/env node

import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const assert = (condition, message) => {
  if (!condition) throw new Error('FAIL: ' + message)
  console.log('PASS: ' + message)
}

const root = process.cwd()
const harnessDir = join(root, 'audit', 'algorithmic-governability')
const workflowPath = join(root, '.github', 'workflows', 'workflow-b-boundary-conformance.yml')

const harnesses = readdirSync(harnessDir)
  .filter((name) => name.endsWith('.mjs'))
  .sort()

const workflow = readFileSync(workflowPath, 'utf8')
const registered = [...workflow.matchAll(/run:\s*node\s+audit\/algorithmic-governability\/([^\s]+)/g)]
  .map((match) => match[1])

const counts = new Map()
for (const name of registered) counts.set(name, (counts.get(name) ?? 0) + 1)

const missing = harnesses.filter((name) => !counts.has(name))
const duplicated = [...counts.entries()].filter(([, count]) => count !== 1)
const dangling = registered.filter((name) => !harnesses.includes(name))

assert(missing.length === 0, 'every algorithmic-governability harness is registered in Workflow B')
assert(duplicated.length === 0, 'every Workflow B Node harness is registered exactly once')
assert(dangling.length === 0, 'Workflow B registers no missing harness path')

console.log(
  'Workflow B harness coverage: ' +
  harnesses.length +
  ' files / ' +
  registered.length +
  ' registered steps',
)
