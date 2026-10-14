#!/usr/bin/env node
import fs from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { buildMateriosJevInput } from "./jev-materios-evidence-ingress.mjs";
import { generateRegistry } from "./jev-verification-registry-generator.mjs";

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i++) {
    const key = argv[i];
    if (!key.startsWith("--") || !argv[i + 1] || argv[i + 1].startsWith("--")) {
      throw new Error("Invalid arguments. Use --help for usage.");
    }
    const name = key.slice(2);
    if (Object.hasOwn(args, name)) throw new Error("Duplicate argument: " + key);
    args[name] = argv[++i];
  }
  return args;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    console.log("Usage: node scripts/build-jev-materios-registry.mjs --checkpoint <CanonicalCheckpoint.json> --metadata <metadata.json> --source-uri <absolute-uri> --expected-chain-id <chain-id> --output <registry.json> [--max-age-seconds <integer>]");
    return;
  }
  for (const key of ["checkpoint", "metadata", "source-uri", "expected-chain-id", "output"]) {
    if (!args[key]) throw new Error("Missing required argument --" + key);
  }
  const checkpointBytes = await fs.readFile(args.checkpoint);
  const metadata = JSON.parse(await fs.readFile(args.metadata, "utf8"));
  let maxAgeSeconds = null;
  if (args["max-age-seconds"] != null) {
    if (!/^\d+$/.test(args["max-age-seconds"])) throw new Error("--max-age-seconds must be a non-negative integer");
    maxAgeSeconds = Number(args["max-age-seconds"]);
    if (!Number.isSafeInteger(maxAgeSeconds)) throw new Error("--max-age-seconds is out of range");
  }

  const input = buildMateriosJevInput({
    checkpointBytes,
    sourceUri: args["source-uri"],
    metadata,
    expectedChainId: args["expected-chain-id"],
    maxAgeSeconds
  });
  const registry = generateRegistry(input);
  await fs.writeFile(args.output, JSON.stringify(registry, null, 2) + "\n", { flag: "wx" });
  console.log("JEV Materios registry written:", args.output);
  console.log("Overall result:", registry.overallResult);
  console.log("Check results:");
  for (const check of registry.checks) console.log("-", check.checkId + ":", check.result);
  if (registry.overallResult !== "PASS") process.exitCode = 2;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  main().catch((error) => {
    console.error("JEV Materios registry build failed:", error.message);
    process.exitCode = 1;
  });
}
