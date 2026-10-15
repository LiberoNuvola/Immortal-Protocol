import assert from "node:assert/strict";
import { buildEvidenceBlocks, registerEvidenceInNotion } from "./register-evidence-in-notion.mjs";

const baseEnv = {
  NOTION_API_KEY: "test-token",
  NOTION_EVIDENCE_PAGE_ID: "page-test-id",
  GITHUB_REPOSITORY: "LiberoNuvola/Immortal-Protocol",
  GITHUB_WORKFLOW: "IMMORTAL Cardano Integration Lab",
  GITHUB_REF: "refs/heads/work/immortal-green-closure",
  GITHUB_SHA: "0123456789abcdef",
  GITHUB_RUN_ID: "123456",
  GITHUB_RUN_NUMBER: "1714",
  GITHUB_RUN_ATTEMPT: "1",
  GITHUB_EVENT_NAME: "push",
  RUN_URL: "https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/123456",
  ARTIFACT_URL: "https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/123456/artifacts/789",
  ARTIFACT_DIGEST: "sha256:abc123",
  LAB_JOB_STATUS: "failure",
};

const blocks = buildEvidenceBlocks(baseEnv);
assert.equal(blocks.length, 6);
assert.equal(blocks[0].type, "heading_3");
assert.match(JSON.stringify(blocks), /1714/);
assert.match(JSON.stringify(blocks), /0123456789abcdef/);
assert.match(JSON.stringify(blocks), /sha256:abc123/);
assert.match(JSON.stringify(blocks), /does not imply that the Integration Lab passed/);

const promptBlocks = buildEvidenceBlocks(baseEnv, "JEV OPERATIONAL PROMPT\nInspect run evidence; do not infer root cause.");
assert.equal(promptBlocks.length, 8);
assert.match(JSON.stringify(promptBlocks), /JEV operational prompt — run #1714/);
assert.match(JSON.stringify(promptBlocks), /do not infer root cause/);
assert.ok(promptBlocks.every((block) => JSON.stringify(block).length < 5000));

let called = false;
const success = await registerEvidenceInNotion({
  env: { ...baseEnv },
  log: () => {},
  fetchImpl: async (url, options) => {
    called = true;
    assert.equal(url, "https://api.notion.com/v1/blocks/page-test-id/children");
    assert.equal(options.method, "PATCH");
    assert.equal(options.headers.Authorization, "Bearer test-token");
    assert.equal(options.headers["Notion-Version"], "2022-06-28");
    const sent = JSON.parse(options.body);
    assert.equal(sent.children.length, 6);
    return {
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ results: sent.children.map((_, i) => ({ id: String(i) })) }),
    };
  },
});
assert.equal(called, true);
assert.deepEqual(success, { skipped: false, blockCount: 6, promptRegistered: false });

const promptResult = await registerEvidenceInNotion({
  env: { ...baseEnv, JEV_OPERATIONAL_PROMPT: "Inspect run evidence; do not infer root cause." },
  log: () => {},
  fetchImpl: async (_url, options) => {
    const sent = JSON.parse(options.body);
    assert.equal(sent.children.length, 8);
    assert.match(JSON.stringify(sent.children), /do not infer root cause/);
    return {
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ results: sent.children.map((_, i) => ({ id: String(i) })) }),
    };
  },
});
assert.deepEqual(promptResult, { skipped: false, blockCount: 8, promptRegistered: true });

let skipLogged = "";
const skipped = await registerEvidenceInNotion({
  env: { ...baseEnv, NOTION_API_KEY: "" },
  log: (message) => { skipLogged = message; },
  fetchImpl: async () => { throw new Error("fetch must not run without a token"); },
});
assert.deepEqual(skipped, { skipped: true });
assert.match(skipLogged, /skipped/);

await assert.rejects(
  async () => buildEvidenceBlocks({ ...baseEnv, ARTIFACT_DIGEST: "" }),
  /Missing required run\/artifact provenance/,
);

await assert.rejects(
  async () => registerEvidenceInNotion({
    env: baseEnv,
    log: () => {},
    fetchImpl: async () => ({ ok: false, status: 403, text: async () => "forbidden" }),
  }),
  /HTTP 403: forbidden/,
);

console.log("Notion evidence ledger tests passed.");
