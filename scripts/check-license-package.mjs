import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

function fail(message) {
  console.error(`LICENSE PACKAGE CHECK: FAIL — ${message}`)
  process.exit(1)
}

function mustContain(path, needle) {
  if (!existsSync(path)) fail(`missing ${path}`)
  const text = readFileSync(path, 'utf8')
  if (!text.includes(needle)) fail(`${path} does not contain ${needle}`)
}

mustContain('LICENSE', 'Mozilla Public License')
mustContain('LICENSE-DOCS.md', 'SPDX-License-Identifier: CC-BY-4.0')
for (const path of [
  'License_doc/LICENSING-MATRIX.md',
  'License_doc/NOTICE-THIRDPARTY.md',
  'License_doc/BRAND-AND-TRADEMARKS.md',
  'License_doc/RELEASE-CHECKLIST.md',
]) {
  if (!existsSync(path)) fail(`missing ${path}`)
}
mustContain('README.md', '## License')

function walk(root) {
  const out = []
  for (const name of readdirSync(root)) {
    if (name === '.git' || name === 'node_modules') continue
    const p = join(root, name)
    const st = statSync(p)
    if (st.isDirectory()) out.push(...walk(p))
    else out.push(p)
  }
  return out
}

const stale = []
for (const file of walk('License_doc')) {
  if (!file.endsWith('.md')) continue
  const text = readFileSync(file, 'utf8')
  if (/\bLicence\/(?:Licence|LICENSING-MATRIX|NOTICE-THIRDPARTY|BRAND-AND-TRADEMARKS)/.test(text)) stale.push(file)
}
if (stale.length) fail(`stale Licence/ path references: ${stale.join(', ')}`)
if (existsSync('Licence')) fail('obsolete Licence/ directory remains in release tree')

console.log('LICENSE PACKAGE CHECK: PASS')
console.log('Root MPL-2.0, documentation CC-BY-4.0, repository matrices/notices/brand/release checklist, README license pointer and stale-path hygiene verified.')
