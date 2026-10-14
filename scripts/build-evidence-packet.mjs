#!/usr/bin/env node
/**
 * Build a provenance-bound, secret-redacted evidence packet from a workflow
 * evidence directory. Uses only Node.js built-ins.
 *
 * Usage:
 *   node scripts/build-evidence-packet.mjs <input-dir> <output-dir>
 *
 * The input directory is never modified. Text files are copied with
 * key/token-like material redacted; non-text files are copied byte-for-byte.
 * packet.json records hashes of every copied evidence file (excluding itself).
 */
import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

const [inputArg, outputArg] = process.argv.slice(2);
if (!inputArg || !outputArg) {
  console.error("Usage: node scripts/build-evidence-packet.mjs <input-dir> <output-dir>");
  process.exit(2);
}
const inputRoot = path.resolve(inputArg);
const outputRoot = path.resolve(outputArg);
if (inputRoot === outputRoot || outputRoot.startsWith(inputRoot + path.sep)) {
  console.error("Output directory must not be the input directory or a child of it.");
  process.exit(2);
}

const sha256 = (buf) => crypto.createHash("sha256").update(buf).digest("hex");
const secretPatterns = [
  /\b(?:ed25519e_sk1|addr_sk1|stake_sk1|payment_sk1|stake_xsk1|addr_xsk1|root_xsk1)[a-z0-9]+/gi,
  /\b(?:xprv|private[_ -]?key)\s*[:=]\s*[^\s,;]+/gi,
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----[\s\S]*?-----END (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/gi,
  /\b(?:gh[pousr]_[A-Za-z0-9_]{20,}|github_pat_[A-Za-z0-9_]{20,})\b/g,
];
const textExtensions = new Set([
  ".txt", ".log", ".json", ".jsonl", ".yaml", ".yml", ".toml", ".md",
  ".csv", ".tsv", ".xml", ".html", ".js", ".mjs", ".ts", ".hs", ".conf",
  ".properties", ".sh", ".env", ".sql", ".cborhex",
]);
const files = [];

async function walk(dir, relative = "") {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  entries.sort((a, b) => a.name.localeCompare(b.name));
  for (const entry of entries) {
    if (entry.name === ".git" || entry.name === "node_modules") continue;
    const abs = path.join(dir, entry.name);
    const rel = path.posix.join(relative, entry.name);
    if (entry.isSymbolicLink()) {
      throw new Error(`Refusing to package symbolic link: ${rel}`);
    }
    if (entry.isDirectory()) {
      await walk(abs, rel);
      continue;
    }
    if (!entry.isFile()) continue;
    const raw = await fs.readFile(abs);
    const ext = path.extname(entry.name).toLowerCase();
    let output = raw;
    let redactions = 0;
    if (textExtensions.has(ext) || !raw.includes(0)) {
      let text = raw.toString("utf8");
      for (const pattern of secretPatterns) {
        text = text.replace(pattern, (match) => {
          redactions += 1;
          return "[REDACTED_SECRET]";
        });
      }
      output = Buffer.from(text, "utf8");
    }
    const dest = path.join(outputRoot, rel);
    await fs.mkdir(path.dirname(dest), { recursive: true });
    await fs.writeFile(dest, output, { mode: 0o600 });
    files.push({
      path: rel,
      sizeBytes: output.byteLength,
      sha256: sha256(output),
      redactions,
    });
  }
}

try {
  const stat = await fs.stat(inputRoot);
  if (!stat.isDirectory()) throw new Error("Input path is not a directory.");
  await fs.rm(outputRoot, { recursive: true, force: true });
  await fs.mkdir(outputRoot, { recursive: true, mode: 0o700 });
  await walk(inputRoot);
  files.sort((a, b) => a.path.localeCompare(b.path));

  const packet = {
    schema: "immortal.evidence-packet.v1",
    createdAt: new Date().toISOString(),
    source: {
      repository: process.env.GITHUB_REPOSITORY ?? null,
      workflow: process.env.GITHUB_WORKFLOW ?? null,
      workflowRef: process.env.GITHUB_REF ?? null,
      commitSha: process.env.GITHUB_SHA ?? null,
      runId: process.env.GITHUB_RUN_ID ?? null,
      runAttempt: process.env.GITHUB_RUN_ATTEMPT ?? null,
      eventName: process.env.GITHUB_EVENT_NAME ?? null,
      evidenceDirectory: path.basename(inputRoot),
    },
    policy: {
      inputModified: false,
      secretRedaction: "best-effort-pattern-based; not a substitute for secret scanning",
      hash: "SHA-256 over the exact packaged bytes",
      packetHashNote: "packet.json is not self-hashed; verify its integrity via the GitHub artifact digest",
    },
    fileCount: files.length,
    redactionCount: files.reduce((sum, f) => sum + f.redactions, 0),
    files,
  };
  await fs.writeFile(path.join(outputRoot, "packet.json"), JSON.stringify(packet, null, 2) + "\n", { mode: 0o600 });
  console.log(`Evidence packet prepared: ${files.length} files; ${packet.redactionCount} redaction(s).`);
} catch (error) {
  console.error(`Evidence packet preparation failed: ${error.message}`);
  process.exit(1);
}
