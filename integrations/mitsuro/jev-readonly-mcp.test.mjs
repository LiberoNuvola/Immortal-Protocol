import test from "node:test";
import assert from "node:assert/strict";
import { callTool, handleMessage, tools } from "./jev-readonly-mcp.mjs";
const sha = "e1d396a37d2abb3a6a1acb50dff56ad52942696a";
function fakeFetch(data, requests = []) {
  return async (url, options) => {
    requests.push({ url: String(url), method: options.method });
    assert.equal(options.method, "GET");
    assert.equal(new URL(url).hostname, "api.github.com");
    return { ok: true, status: 200, json: async () => data };
  };
}
test("tool surface has four read-only tools with closed schemas", () => {
  assert.deepEqual(tools.map(t => t.name), ["get_branch_head", "get_ci_status", "read_jev_registry", "read_allowed_file"]);
  assert.ok(tools.every(t => t.inputSchema.additionalProperties === false));
});
test("branch head reads branch and SHA", async () => {
  const out = await callTool("get_branch_head", {}, fakeFetch({ object: { sha } }));
  assert.equal(out.commitSha, sha);
  assert.equal(out.branch, "work/immortal-green-closure");
});
test("CI status filters by exact SHA and performs GET only", async () => {
  const requests = [];
  const out = await callTool("get_ci_status", { commitSha: sha }, fakeFetch({ workflow_runs: [
    { name: "expected", head_sha: sha, id: 1, run_number: 4, status: "completed", conclusion: "success", updated_at: "2026-10-24T00:00:00Z", html_url: "https://github.com/run/1" },
    { name: "other", head_sha: "a".repeat(40), id: 2 }
  ] }, requests));
  assert.equal(out.runs.length, 1);
  assert.equal(out.runs[0].name, "expected");
  assert.equal(requests.length, 1);
  assert.match(requests[0].url, /actions\/runs/);
});
test("rejects arbitrary file path before network access", async () => {
  let called = false;
  await assert.rejects(() => callTool("read_allowed_file", { path: "../../.env" }, async () => { called = true; throw Error("network must not be called"); }), /not allowlisted/);
  assert.equal(called, false);
});
test("initialize and tools/list use JSON-RPC", async () => {
  const lines = [];
  await handleMessage({ jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "2024-11-05" } }, s => lines.push(JSON.parse(s)));
  await handleMessage({ jsonrpc: "2.0", id: 2, method: "tools/list" }, s => lines.push(JSON.parse(s)));
  assert.equal(lines[0].result.serverInfo.name, "immortal-jev-readonly");
  assert.equal(lines[1].result.tools.length, 4);
});
