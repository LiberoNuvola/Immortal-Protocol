#!/usr/bin/env node
/**
 * Read-only MCP bridge for Mitsuro -> public IMMORTAL JEV/GitHub evidence.
 * No GitHub token, filesystem access, subprocesses, or mutating API calls.
 */
const OWNER = "LiberoNuvola";
const REPO = "Immortal-Protocol";
const BRANCH = "work/immortal-green-closure";
const API = "https://api.github.com";
const MAX_OUTPUT_CHARS = 24000;
export const ALLOWED_FILES = [
  "audit/jev/registry-run-1718-attempt-2.json",
  "scripts/validate-jev-verification-registry.mjs",
  "scripts/build-jev-operational-prompt.mjs",
  ".github/workflows/jev-verification-registry.yml",
  ".github/workflows/jev-materios-live-ingress.yml"
];
export const tools = [
  { name: "get_branch_head", description: "Read IMMORTAL work branch HEAD. Read-only.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false } },
  { name: "get_ci_status", description: "Read recent Actions runs, optionally filtered to an exact commit SHA. Never triggers or reruns workflows.",
    inputSchema: { type: "object", properties: { commitSha: { type: "string", pattern: "^[0-9a-f]{40}$" } }, additionalProperties: false } },
  { name: "read_jev_registry", description: "Read the historical JEV registry fixture; not a current certification.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false } },
  { name: "read_allowed_file", description: "Read a small allowlisted JEV file from the work branch; no arbitrary paths.",
    inputSchema: { type: "object", properties: { path: { type: "string", enum: ALLOWED_FILES } }, required: ["path"], additionalProperties: false } }
];

async function githubGet(path, fetchImpl = fetch) {
  const response = await fetchImpl(API + path, {
    method: "GET",
    headers: { Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28", "User-Agent": "IMMORTAL-Mitsuro-ReadOnly-MCP" },
    signal: AbortSignal.timeout(10000)
  });
  if (!response.ok) throw new Error(`GitHub read failed: HTTP ${response.status}`);
  return response.json();
}
function decodeContent(result) {
  if (result.encoding !== "base64" || typeof result.content !== "string") throw new Error("Unexpected GitHub file encoding");
  return Buffer.from(result.content.replace(/\n/g, ""), "base64").toString("utf8");
}
export async function callTool(name, args = {}, fetchImpl = fetch) {
  if (!args || typeof args !== "object" || Array.isArray(args)) throw new Error("arguments must be an object");
  switch (name) {
    case "get_branch_head": {
      const data = await githubGet(`/repos/${OWNER}/${REPO}/git/ref/heads/${BRANCH}`, fetchImpl);
      return { branch: BRANCH, commitSha: data?.object?.sha ?? null, readOnly: true };
    }
    case "get_ci_status": {
      if (args.commitSha !== undefined && !/^[0-9a-f]{40}$/.test(args.commitSha)) throw new Error("commitSha must be a full lowercase 40-character SHA");
      const q = new URLSearchParams({ branch: BRANCH, per_page: "100" });
      const data = await githubGet(`/repos/${OWNER}/${REPO}/actions/runs?${q}`, fetchImpl);
      const runs = (data.workflow_runs ?? []).filter(r => !args.commitSha || r.head_sha === args.commitSha).slice(0, 20).map(r => ({
        name: r.name, runNumber: r.run_number, runId: r.id, commitSha: r.head_sha,
        status: r.status, conclusion: r.conclusion, updatedAt: r.updated_at, url: r.html_url
      }));
      return { branch: BRANCH, requestedCommitSha: args.commitSha ?? null, runs, note: "Read-only status query; no workflow was triggered." };
    }
    case "read_jev_registry": {
      const data = await githubGet(`/repos/${OWNER}/${REPO}/contents/audit/jev/registry-run-1718-attempt-2.json?ref=${BRANCH}`, fetchImpl);
      const registry = JSON.parse(decodeContent(data));
      return {
        path: "audit/jev/registry-run-1718-attempt-2.json", blobSha: data.sha,
        schema: registry.schema, generatedAt: registry.generatedAt, subject: registry.subject,
        overallResult: registry.overallResult,
        checks: (registry.checks ?? []).map(c => ({ checkId: c.checkId, result: c.result, evidenceRefs: c.evidenceRefs, limitations: c.limitations })),
        notes: registry.notes,
        limitation: "Historical fixture only. Recheck linked evidence; not a current protocol certification."
      };
    }
    case "read_allowed_file": {
      if (typeof args.path !== "string" || !ALLOWED_FILES.includes(args.path)) throw new Error("path is not allowlisted");
      const encodedPath = args.path.split("/").map(encodeURIComponent).join("/");
      const data = await githubGet(`/repos/${OWNER}/${REPO}/contents/${encodedPath}?ref=${BRANCH}`, fetchImpl);
      const content = decodeContent(data);
      return { path: args.path, blobSha: data.sha, content: content.slice(0, MAX_OUTPUT_CHARS), truncated: content.length > MAX_OUTPUT_CHARS };
    }
    default: throw new Error("unknown tool");
  }
}
const responseLine = (id, result, error) => JSON.stringify(error
  ? { jsonrpc: "2.0", id, error: { code: -32000, message: String(error.message ?? error) } }
  : { jsonrpc: "2.0", id, result });
export async function handleMessage(message, write = line => process.stdout.write(line + "\n")) {
  if (message?.jsonrpc !== "2.0") return;
  const { id, method, params = {} } = message;
  if (method === "notifications/initialized" || method === "notifications/cancelled") return;
  if (method === "initialize") {
    if (id !== undefined) write(responseLine(id, { protocolVersion: params.protocolVersion ?? "2024-11-05", capabilities: { tools: {} }, serverInfo: { name: "immortal-jev-readonly", version: "0.1.0" } }));
  } else if (method === "ping") {
    if (id !== undefined) write(responseLine(id, {}));
  } else if (method === "tools/list") {
    if (id !== undefined) write(responseLine(id, { tools }));
  } else if (method === "tools/call") {
    try {
      const result = await callTool(params.name, params.arguments ?? {});
      if (id !== undefined) write(responseLine(id, { content: [{ type: "text", text: JSON.stringify(result, null, 2) }], isError: false }));
    } catch (error) {
      if (id !== undefined) write(responseLine(id, { content: [{ type: "text", text: String(error.message ?? error) }], isError: true }));
    }
  } else if (id !== undefined) write(responseLine(id, undefined, new Error("method not supported")));
}
if (process.argv[1] && new URL(import.meta.url).pathname === process.argv[1]) {
  let buffer = "";
  process.stdin.setEncoding("utf8");
  process.stdin.on("data", chunk => {
    buffer += chunk;
    let nl;
    while ((nl = buffer.indexOf("\n")) !== -1) {
      const line = buffer.slice(0, nl).trim(); buffer = buffer.slice(nl + 1);
      if (!line) continue;
      try { void handleMessage(JSON.parse(line)); }
      catch { process.stdout.write(JSON.stringify({ jsonrpc: "2.0", id: null, error: { code: -32700, message: "Parse error" } }) + "\n"); }
    }
  });
}
