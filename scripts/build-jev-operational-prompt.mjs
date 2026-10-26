#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

const RESULTS = new Set(["PASS", "FAIL", "BLOCKED", "NOT_RUN", "INCONCLUSIVE"]);

export function buildOperationalPrompt(registry) {
  if (!registry || typeof registry !== "object" || Array.isArray(registry)) {
    throw new Error("registry must be an object");
  }
  const subject = registry.subject;
  if (!subject || typeof subject !== "object") throw new Error("registry.subject is required");
  for (const key of ["repository", "commitSha", "ref", "executionContext"]) {
    if (typeof subject[key] !== "string" || !subject[key].trim()) {
      throw new Error("registry.subject." + key + " is required");
    }
  }
  if (!Array.isArray(registry.checks) || registry.checks.length === 0) {
    throw new Error("registry.checks must be a non-empty array");
  }
  for (const [index, check] of registry.checks.entries()) {
    if (!check || typeof check.checkId !== "string" || !RESULTS.has(check.result)) {
      throw new Error("registry.checks[" + index + "] has an invalid checkId/result");
    }
    if (!Array.isArray(check.evidenceRefs) || !Array.isArray(check.limitations)) {
      throw new Error("registry.checks[" + index + "] must include evidenceRefs and limitations arrays");
    }
  }

  const failures = registry.checks.filter((c) => c.result !== "PASS");
  const checksText = registry.checks.map((c) => {
    // This workflow usually attaches every scoped check to the same run URL.
    // Show that URL in the header once and abbreviate only exact repeats here;
    // distinct artifact/log URLs stay visible.
    const refs = c.evidenceRefs.map((e) => {
      const uri = typeof e === "string" ? e : (e.uri || e.path || JSON.stringify(e));
      return subject.workflowRunUrl && uri === subject.workflowRunUrl ? "this run" : uri;
    }).join(", ") || "no evidence reference";
    const limits = c.limitations.join("; ") || "none recorded";
    return `- ${c.checkId} ${c.result} | refs ${refs} | limits ${limits}`;
  }).join("\n");
  const run = subject.workflowRunUrl || subject.workflowRunId || "not supplied";
  const prompt = [
    "JEV OPERATIONAL PROMPT — generated from a validated verification registry",
    `Repository: ${subject.repository}`,
    `Branch/ref: ${subject.ref}`,
    `Commit: ${subject.commitSha}`,
    `Run: ${run}; attempt: ${subject.runAttempt ?? "unknown"}; context: ${subject.executionContext}`,
    `Registry overall result: ${registry.overallResult || "not supplied"}`,
    "",
    "Observed checks:",
    checksText,
    "",
    "Freshness guard: this prompt is a run-scoped observation, not an instruction to trust stale state. Before acting, compare its commit/ref/run against the current branch HEAD and the newest relevant GitHub Actions runs.",
    "Notion page insertion order is not execution recency: use GitHub run timestamps and commit ancestry. If this prompt is stale, record the mismatch, inspect the newest matching registry/log/artifact, and act from that current evidence.",
    "Task: continue the authorized JEV automation/evidence work from these observations. Inspect the referenced run/log/artifact before drawing conclusions. If a check is not PASS, classify what the evidence actually establishes and identify the smallest next JEV-side action; do not infer root cause from status alone. If all checks are PASS, verify whether the JEV end-to-end acceptance criteria are actually met and make no unnecessary changes.",
    "",
    "Required loop: inspect current repository and Notion state; make at most one bounded, authorized change in JEV/evidence/automation surfaces; run focused tests; verify the actual workflow result; register the exact commit/run/status/evidence and limitations in the existing Notion ledger; leave a clear next action for the next scheduled ChatGPT execution.",
    "",
    "Hard boundaries: do not work on Materios while it is paused; do not start other branches before JEV end-to-end autonomy is verified; do not create branches; do not modify IMMORTAL, Cardano Adapter, or DApp cores, economic/normative rules, Reveal semantics, or V3 semantics; do not deploy, mint, spend, or submit on-chain transactions. Do not claim PASS without observed evidence. Escalate only for a material decision or an unavoidable permission/credential blocker.",
    "",
    `Registry check summary: ${failures.length} check(s) are not PASS. This registry is scoped evidence and does not certify protocol-wide GREEN.`
  ].join("\n") + "\n";
  if (prompt.length > 7000) throw new Error("generated operational prompt exceeds 7000 characters; refusing to truncate safety boundaries");
  return prompt;
}

async function main() {
  const [inputArg, outputArg] = process.argv.slice(2);
  if (!inputArg || !outputArg) {
    console.error("Usage: node scripts/build-jev-operational-prompt.mjs <registry.json> <prompt.md>");
    process.exit(2);
  }
  try {
    const registry = JSON.parse(await fs.readFile(path.resolve(inputArg), "utf8"));
    const prompt = buildOperationalPrompt(registry);
    const destination = path.resolve(outputArg);
    await fs.mkdir(path.dirname(destination), { recursive: true });
    await fs.writeFile(destination, prompt, "utf8");
    console.log("JEV operational prompt generated from validated registry: " + destination);
  } catch (error) {
    console.error("JEV operational prompt generation failed: " + (error instanceof Error ? error.message : String(error)));
    process.exit(1);
  }
}
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) await main();
