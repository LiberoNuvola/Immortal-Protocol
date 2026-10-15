import { pathToFileURL } from "node:url";
import { readFile } from "node:fs/promises";

const NOTION_VERSION = "2022-06-28";
const DEFAULT_PAGE_ID = "3e2c4454-d6d5-819c-bec1-c6edede714b3";

function richText(content, url) {
  const text = { content };
  if (url) text.link = { url };
  return { type: "text", text };
}

function splitText(value, max = 1800) {
  const chunks = [];
  for (let offset = 0; offset < value.length; offset += max) chunks.push(value.slice(offset, offset + max));
  return chunks.length ? chunks : [""];
}

export function buildEvidenceBlocks(env, operationalPrompt = "") {
  const runId = env.GITHUB_RUN_ID;
  const runUrl = env.RUN_URL;
  const artifactUrl = env.ARTIFACT_URL;
  const artifactDigest = env.ARTIFACT_DIGEST;
  const jobStatus = env.LAB_JOB_STATUS || "unknown";

  if (!runId || !runUrl || !artifactUrl || !artifactDigest) {
    throw new Error("Missing required run/artifact provenance; refusing to register an incomplete evidence entry.");
  }

  const runNumber = env.GITHUB_RUN_NUMBER || runId;
  const commit = env.GITHUB_SHA || "unknown";
  const workflow = env.GITHUB_WORKFLOW || "unknown";
  const branch = env.GITHUB_REF || "unknown";
  const attempt = env.GITHUB_RUN_ATTEMPT || "1";

  const blocks = [
    {
      object: "block",
      type: "heading_3",
      heading_3: { rich_text: [richText("JEV evidence — run #" + runNumber)] },
    },
    {
      object: "block",
      type: "paragraph",
      paragraph: {
        rich_text: [
          richText("Run: "),
          richText(runUrl, runUrl),
          richText(" | job status at registration: " + jobStatus),
        ],
      },
    },
    {
      object: "block",
      type: "paragraph",
      paragraph: {
        rich_text: [
          richText("Workflow: " + workflow + " | ref: " + branch + " | attempt: " + attempt),
        ],
      },
    },
    {
      object: "block",
      type: "paragraph",
      paragraph: {
        rich_text: [
          richText("Commit: "),
          richText(commit, "https://github.com/" + (env.GITHUB_REPOSITORY || "LiberoNuvola/Immortal-Protocol") + "/commit/" + commit),
        ],
      },
    },
    {
      object: "block",
      type: "paragraph",
      paragraph: {
        rich_text: [
          richText("Evidence artifact: "),
          richText(artifactUrl, artifactUrl),
          richText(" | GitHub artifact SHA-256: " + artifactDigest),
        ],
      },
    },
    {
      object: "block",
      type: "paragraph",
      paragraph: {
        rich_text: [
          richText("Interpretation: artifact upload confirms evidence collection only; it does not imply that the Integration Lab passed. Inspect the run conclusion and packet contents separately."),
        ],
      },
    },
  ];

  const prompt = typeof operationalPrompt === "string" ? operationalPrompt.trim() : "";
  if (prompt) {
    blocks.push({
      object: "block",
      type: "heading_3",
      heading_3: { rich_text: [richText("JEV operational prompt — run #" + runNumber)] },
    });
    for (const chunk of splitText(prompt)) {
      blocks.push({
        object: "block",
        type: "paragraph",
        paragraph: { rich_text: [richText(chunk)] },
      });
    }
  }
  return blocks;
}

export async function registerEvidenceInNotion({
  env = process.env,
  fetchImpl = fetch,
  readFileImpl = readFile,
  log = console.log,
} = {}) {
  const token = env.NOTION_API_KEY;
  if (!token) {
    log("Notion evidence ledger registration skipped: NOTION_API_KEY is not configured.");
    return { skipped: true };
  }

  const pageId = env.NOTION_EVIDENCE_PAGE_ID || DEFAULT_PAGE_ID;
  let operationalPrompt = env.JEV_OPERATIONAL_PROMPT || "";
  if (!operationalPrompt && env.JEV_OPERATIONAL_PROMPT_PATH) {
    operationalPrompt = await readFileImpl(env.JEV_OPERATIONAL_PROMPT_PATH, "utf8");
  }
  const blocks = buildEvidenceBlocks(env, operationalPrompt);
  const response = await fetchImpl("https://api.notion.com/v1/blocks/" + pageId + "/children", {
    method: "PATCH",
    headers: {
      Authorization: "Bearer " + token,
      "Content-Type": "application/json",
      "Notion-Version": NOTION_VERSION,
    },
    body: JSON.stringify({ children: blocks }),
  });

  const responseText = await response.text();
  if (!response.ok) {
    throw new Error("Notion evidence ledger update failed with HTTP " + response.status + ": " + responseText.slice(0, 1000));
  }

  let payload;
  try {
    payload = JSON.parse(responseText);
  } catch {
    throw new Error("Notion API returned a non-JSON success response.");
  }

  if (!Array.isArray(payload.results) || payload.results.length !== blocks.length) {
    throw new Error("Notion API response did not confirm all evidence blocks were appended.");
  }

  log("Notion evidence ledger updated with run #" + (env.GITHUB_RUN_NUMBER || env.GITHUB_RUN_ID) + ".");
  return { skipped: false, blockCount: payload.results.length, promptRegistered: Boolean(operationalPrompt.trim()) };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  registerEvidenceInNotion().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
