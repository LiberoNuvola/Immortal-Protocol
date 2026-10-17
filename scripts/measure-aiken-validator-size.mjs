#!/usr/bin/env node
import fs from "node:fs/promises";
import crypto from "node:crypto";

const [configPath, blueprintPath, outputPath] = process.argv.slice(2);
if (!configPath || !blueprintPath || !outputPath) {
  throw new Error("Usage: node measure-aiken-validator-size.mjs <aiken.toml> <plutus.json> <output.json>");
}

const TX_SIZE_LIMIT_BYTES = 16_384;
const config = await fs.readFile(configPath, "utf8");
const targetMatch = config.match(/^\s*plutus\s*=\s*["'](v[0-9]+)["']\s*$/m);
if (!targetMatch) throw new Error("Could not determine Plutus target from aiken.toml");
const targetLanguageVersion = targetMatch[1];

const blueprint = JSON.parse(await fs.readFile(blueprintPath, "utf8"));
if (!Array.isArray(blueprint.validators)) {
  throw new Error("plutus.json must contain a validators array");
}
const matches = blueprint.validators.filter((validator) =>
  typeof validator?.title === "string"
  && /(^|\.)pre_rich_reveal(\.|$)/.test(validator.title)
);
if (matches.length !== 1) {
  throw new Error(`Expected exactly one pre_rich_reveal validator in plutus.json; found ${matches.length}`);
}

const measured = matches.map((validator) => {
  const code = validator.compiledCode;
  if (typeof code !== "string" || code.length === 0 || code.length % 2 !== 0 || !/^[0-9a-f]+$/i.test(code)) {
    throw new Error(`Validator ${validator.title} has missing or malformed compiledCode hex`);
  }
  const bytes = Buffer.from(code, "hex");
  return {
    title: validator.title,
    validatorHash: typeof validator.hash === "string" ? validator.hash : null,
    compiledScriptBytesLowerBound: bytes.length,
    compiledCodeSha256: crypto.createHash("sha256").update(bytes).digest("hex"),
    sizeRelationToTransactionLimit: bytes.length >= TX_SIZE_LIMIT_BYTES
      ? "impossible_to_fit_in_any_transaction"
      : "below_limit_but_full_transaction_unmeasured",
  };
});

const impossible = measured.some((item) => item.compiledScriptBytesLowerBound >= TX_SIZE_LIMIT_BYTES);
const report = {
  schema: "immortal-aiken-script-size-lower-bound-v1",
  targetLanguageVersion,
  transactionSizeLimitBytes: TX_SIZE_LIMIT_BYTES,
  validators: measured,
  measurement: "compiledCode byte length; a lower bound for a transaction carrying this reference script, not a complete transaction measurement",
  fullTransactionSize: "NOT_MEASURED",
  cpuAndMemory: "NOT_MEASURED",
  nativeLedgerAcceptance: "NOT_TESTED_BY_THIS_REPORT",
  result: impossible ? "IMPOSSIBLE_UNDER_TRANSACTION_SIZE_LIMIT" : "LOWER_BOUND_BELOW_LIMIT_FULL_DEPLOYABILITY_UNPROVEN",
  deploymentGateClosed: true,
  limitations: [
    "This report does not measure CBOR transaction envelope overhead or Lucid serialization.",
    "Below-limit script bytes do not prove that reference-script publication or Reveal execution fits the 16,384-byte transaction limit.",
    "The current Aiken prototype targets Plutus V3 while the production Haskell Reveal validator targets Plutus V2; this report does not resolve compatibility.",
  ],
};
await fs.writeFile(outputPath, JSON.stringify(report, null, 2) + "\n");
console.log(JSON.stringify(report, null, 2));
if (impossible) process.exitCode = 1;
