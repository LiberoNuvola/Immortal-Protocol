#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { validateRegistry } from "./validate-jev-verification-registry.mjs";

const CONTEXTS = new Set(["unit-test", "static-analysis", "emulator", "devnet", "preprod", "mainnet"]);
const OUTCOMES = new Set(["success", "failure", "cancelled", "skipped", "unknown"]);
const RESULT_BY_OUTCOME = Object.freeze({ success: "PASS", failure: "FAIL", cancelled: "BLOCKED", skipped: "NOT_RUN", unknown: "BLOCKED" });
const isObject = (v) => v !== null && typeof v === "object" && !Array.isArray(v);
const isUri = (v) => { if (typeof v !== "string") return false; try { const u = new URL(v); return Boolean(u.protocol && u.host); } catch { return false; } };
const fail = (p, m) => { throw new Error(p + ": " + m); };

/**
 * Classify the native Cardano-ledger semantic report, never the runner's process
 * exit code. A report containing only typed Plutus ValidationFailure entries is
 * a genuine validator failure. MissingScript, ContextError, missing ExUnits,
 * malformed output, and any other unresolved ledger failure remain BLOCKED.
 */
export function classifyLedgerEvaluation(report) {
  if (!Array.isArray(report) || report.length === 0) return "unknown";
  if (report.some((entry) => !isObject(entry) || !["success", "failure"].includes(entry.status))) return "unknown";

  const failures = report.filter((entry) => entry.status === "failure");
  const successes = report.filter((entry) => entry.status === "success");

  if (successes.some((entry) => !isObject(entry.ex_units) || Object.keys(entry.ex_units).length === 0)) {
    return "unknown";
  }
  if (failures.length === 0) return "success";
  if (failures.some((entry) => typeof entry.failure !== "string" || !/^ValidationFailure\b/.test(entry.failure))) {
    return "unknown";
  }
  return "failure";
}

/**
 * Generate a registry from explicit GitHub Actions step outcomes.
 * Does not query APIs, scrape arbitrary logs, infer transaction metrics, or certify protocol-wide GREEN.
 */
export function generateRegistry(input) {
  if (!isObject(input)) fail("$", "input must be an object");
  const m = input.metadata;
  if (!isObject(m)) fail("$.metadata", "metadata object is required");
  for (const field of ["repository", "commitSha", "ref", "executionContext"]) {
    if (typeof m[field] !== "string" || !m[field].trim()) fail("$.metadata." + field, "required non-empty string");
  }
  if (!/^[0-9a-f]{40}$/.test(m.commitSha)) fail("$.metadata.commitSha", "must be a 40-character lowercase SHA");
  if (!CONTEXTS.has(m.executionContext)) fail("$.metadata.executionContext", "unknown execution context");
  if (m.workflowRunId != null && typeof m.workflowRunId !== "string") fail("$.metadata.workflowRunId", "must be string or null");
  if (m.workflowRunUrl != null && !isUri(m.workflowRunUrl)) fail("$.metadata.workflowRunUrl", "must be an absolute URI or null");
  if (m.runAttempt != null && (!Number.isInteger(m.runAttempt) || m.runAttempt < 1)) fail("$.metadata.runAttempt", "must be a positive integer or null");
  const generatedAt = m.generatedAt ?? new Date().toISOString();
  if (typeof generatedAt !== "string" || Number.isNaN(Date.parse(generatedAt))) fail("$.metadata.generatedAt", "must be a date-time string");
  if (!Array.isArray(input.checks) || input.checks.length === 0) fail("$.checks", "at least one check is required");

  const seen = new Set();
  const checks = input.checks.map((s, i) => {
    const p = "$.checks[" + i + "]";
    if (!isObject(s)) fail(p, "check must be an object");
    if (typeof s.checkId !== "string" || !/^[A-Z0-9][A-Z0-9._:-]{1,127}$/.test(s.checkId)) fail(p + ".checkId", "invalid stable check ID");
    if (seen.has(s.checkId)) fail(p + ".checkId", "duplicate check ID");
    seen.add(s.checkId);
    if (typeof s.requirementRef !== "string" || !s.requirementRef.trim()) fail(p + ".requirementRef", "requirementRef is required");
    if (!OUTCOMES.has(s.stepOutcome)) fail(p + ".stepOutcome", "must be one of: " + [...OUTCOMES].join(", "));
    if (!Array.isArray(s.evidenceRefs)) fail(p + ".evidenceRefs", "must be an array");
    if (!Array.isArray(s.limitations) || s.limitations.some((x) => typeof x !== "string")) fail(p + ".limitations", "must be an array of strings");
    const result = RESULT_BY_OUTCOME[s.stepOutcome];
    if ((result === "PASS" || result === "FAIL") && s.evidenceRefs.length === 0) fail(p + ".evidenceRefs", result + " outcome requires explicit evidence references");
    const out = { checkId: s.checkId, requirementRef: s.requirementRef, result, evidenceRefs: s.evidenceRefs, limitations: s.limitations };
    if (Object.hasOwn(s, "observedValue")) out.observedValue = s.observedValue;
    if (Object.hasOwn(s, "expectedValue")) out.expectedValue = s.expectedValue;
    if (s.relatedCheckIds != null) out.relatedCheckIds = s.relatedCheckIds;
    return out;
  });

  const rank = { PASS: 0, NOT_RUN: 1, BLOCKED: 2, FAIL: 3 };
  const overallResult = checks.reduce((worst, check) => rank[check.result] > rank[worst] ? check.result : worst, "PASS");
  const registry = {
    schema: "immortal.jev-verification-registry.v1",
    registryVersion: "0.1",
    generatedAt,
    subject: {
      repository: m.repository, commitSha: m.commitSha, ref: m.ref,
      workflowRunId: m.workflowRunId ?? null, workflowRunUrl: m.workflowRunUrl ?? null,
      runAttempt: m.runAttempt ?? null, executionContext: m.executionContext
    },
    checks, overallResult,
    notes: [
      "Generated from explicit workflow step outcomes; no protocol-wide certification is implied.",
      "Execution context limits the scope of every observation."
    ]
  };
  const problems = validateRegistry(registry);
  if (problems.length) fail("generated registry", problems.join("; "));
  return registry;
}

async function main() {
  const [inputArg, outputArg] = process.argv.slice(2);
  if (!inputArg || !outputArg) {
    console.error("Usage: node scripts/jev-verification-registry-generator.mjs <input.json> <output.json>");
    process.exit(2);
  }
  try {
    const input = JSON.parse(await fs.readFile(path.resolve(inputArg), "utf8"));
    const registry = generateRegistry(input);
    const destination = path.resolve(outputArg);
    await fs.mkdir(path.dirname(destination), { recursive: true });
    await fs.writeFile(destination, JSON.stringify(registry, null, 2) + "\n", { flag: "w" });
    console.log("JEV registry generated and validated: " + destination);
  } catch (error) {
    console.error("JEV registry generation failed: " + (error instanceof Error ? error.message : String(error)));
    process.exit(1);
  }
}
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) await main();
