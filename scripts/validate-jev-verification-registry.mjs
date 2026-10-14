#!/usr/bin/env node
import fs from "node:fs/promises";

const allowedContexts = new Set(["unit-test", "static-analysis", "emulator", "devnet", "preprod", "mainnet"]);
const allowedResults = new Set(["PASS", "FAIL", "BLOCKED", "NOT_RUN"]);
const allowedEvidenceKinds = new Set(["workflow-run", "log", "artifact", "commit", "onchain-observation", "metric", "test-report", "other"]);
const isObject = (v) => v !== null && typeof v === "object" && !Array.isArray(v);
const isUri = (v) => {
  if (typeof v !== "string") return false;
  try { const u = new URL(v); return Boolean(u.protocol && u.host); } catch { return false; }
};
const errors = [];
const fail = (path, message) => errors.push(path + ": " + message);

export function validateRegistry(registry) {
  errors.length = 0;
  if (!isObject(registry)) return ["$: must be an object"];
  if (registry.schema !== "immortal.jev-verification-registry.v1") fail("$.schema", "unsupported schema");
  if (registry.registryVersion !== "0.1") fail("$.registryVersion", "must be 0.1");
  if (typeof registry.generatedAt !== "string" || Number.isNaN(Date.parse(registry.generatedAt))) fail("$.generatedAt", "must be a date-time string");

  const subject = registry.subject;
  if (!isObject(subject)) {
    fail("$.subject", "must be an object");
  } else {
    if (typeof subject.repository !== "string" || subject.repository.length < 3) fail("$.subject.repository", "required repository name");
    if (typeof subject.commitSha !== "string" || !/^[0-9a-f]{40}$/.test(subject.commitSha)) fail("$.subject.commitSha", "must be a 40-character lowercase commit SHA");
    if (typeof subject.ref !== "string" || !subject.ref) fail("$.subject.ref", "required ref");
    if (!allowedContexts.has(subject.executionContext)) fail("$.subject.executionContext", "unknown execution context");
    if (subject.workflowRunUrl != null && !isUri(subject.workflowRunUrl)) fail("$.subject.workflowRunUrl", "must be a URI or null");
    if (subject.workflowRunId != null && typeof subject.workflowRunId !== "string") fail("$.subject.workflowRunId", "must be a string or null");
    if (subject.runAttempt != null && (!Number.isInteger(subject.runAttempt) || subject.runAttempt < 1)) fail("$.subject.runAttempt", "must be a positive integer or null");
  }

  if (!Array.isArray(registry.checks) || registry.checks.length < 1) {
    fail("$.checks", "must contain at least one check");
  } else {
    const seen = new Set();
    registry.checks.forEach((check, i) => {
      const p = "$.checks[" + i + "]";
      if (!isObject(check)) { fail(p, "must be an object"); return; }
      if (typeof check.checkId !== "string" || !/^[A-Z0-9][A-Z0-9._:-]{1,127}$/.test(check.checkId)) fail(p + ".checkId", "invalid stable check ID");
      else if (seen.has(check.checkId)) fail(p + ".checkId", "duplicate check ID");
      else seen.add(check.checkId);
      if (typeof check.requirementRef !== "string" || !check.requirementRef.trim()) fail(p + ".requirementRef", "must identify an existing requirement/Gate");
      if (!allowedResults.has(check.result)) fail(p + ".result", "unknown result");
      if (!Array.isArray(check.evidenceRefs)) fail(p + ".evidenceRefs", "must be an array");
      else {
        check.evidenceRefs.forEach((ref, j) => {
          const ep = p + ".evidenceRefs[" + j + "]";
          if (!isObject(ref)) { fail(ep, "must be an object"); return; }
          if (!allowedEvidenceKinds.has(ref.kind)) fail(ep + ".kind", "unknown evidence kind");
          if (!isUri(ref.uri)) fail(ep + ".uri", "must be an absolute URI");
          if (ref.sha256 != null && (typeof ref.sha256 !== "string" || !/^(sha256:)?[0-9a-f]{64}$/.test(ref.sha256))) fail(ep + ".sha256", "must be a SHA-256 digest");
        });
        if ((check.result === "PASS" || check.result === "FAIL") && check.evidenceRefs.length === 0) {
          fail(p + ".evidenceRefs", check.result + " requires at least one evidence reference");
        }
      }
      if (!Array.isArray(check.limitations) || check.limitations.some((x) => typeof x !== "string")) fail(p + ".limitations", "must be an array of strings (state what this check does not prove)");
      if (check.relatedCheckIds != null && (!Array.isArray(check.relatedCheckIds) || check.relatedCheckIds.some((x) => typeof x !== "string"))) fail(p + ".relatedCheckIds", "must be an array of strings");
    });
  }
  if (registry.overallResult != null && !allowedResults.has(registry.overallResult)) fail("$.overallResult", "unknown result");
  if (registry.notes != null && (!Array.isArray(registry.notes) || registry.notes.some((x) => typeof x !== "string"))) fail("$.notes", "must be an array of strings");
  return [...errors];
}

if (process.argv[1] && new URL(import.meta.url).pathname === process.argv[1]) {
  const file = process.argv[2];
  if (!file) {
    console.error("Usage: node scripts/validate-jev-verification-registry.mjs <registry.json>");
    process.exit(2);
  }
  try {
    const parsed = JSON.parse(await fs.readFile(file, "utf8"));
    const problems = validateRegistry(parsed);
    if (problems.length) {
      console.error("JEV verification registry INVALID:");
      for (const problem of problems) console.error("- " + problem);
      process.exit(1);
    }
    console.log("JEV verification registry VALID.");
  } catch (error) {
    console.error("Could not validate JEV registry: " + (error instanceof Error ? error.message : String(error)));
    process.exit(1);
  }
}
