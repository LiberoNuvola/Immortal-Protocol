#!/usr/bin/env node
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

const file = process.argv[2];
if (!file) {
  console.error("usage: node scripts/verify-issue-decision-vectors.mjs <cabal-test-log>");
  process.exit(2);
}

const log = readFileSync(file, "utf8");
const expected = {
  ISSUE_VECTOR_PRE_STATE_CANONICAL: "0|0|0|0|0|0|0|0|0|0|1|1|0|0|0|0|inactive|0",
  ISSUE_VECTOR_PRE_STATE_SHA256: "f4023fbcd4876200c00daa2c947b0836aa7b25b81b4113c61d034214b6c4e42d",
  ISSUE_VECTOR_CANDIDATE_STATE_CANONICAL: "0|1|1|0|0|0|0|1|1|1|1|1|0|0|0|0|inactive|0",
  ISSUE_VECTOR_POST_STATE_SHA256: "0a456146eff69a6a2f6c86d473ca95cced7eccd523dbb66124a635c7cece2fa6",
  ISSUE_VECTOR_ACTION_CANONICAL: "Issue|0|1",
  ISSUE_VECTOR_ACTION_HASH_PREIMAGE:
    "Issue|0|1|f4023fbcd4876200c00daa2c947b0836aa7b25b81b4113c61d034214b6c4e42d|0a456146eff69a6a2f6c86d473ca95cced7eccd523dbb66124a635c7cece2fa6",
  ISSUE_VECTOR_ACTION_FINGERPRINT: "f075c7d9b87f1f4361cd02f15f67cef55d44e27918516409899b49e89e5b3303",
};

function capture(key) {
  const matches = [...log.matchAll(new RegExp(key + "=([^\\r\\n]*)", "g"))];
  if (matches.length === 0) {
    throw new Error("missing Haskell-produced Issue vector: " + key);
  }
  return matches[matches.length - 1][1].trim();
}

function sha256Char8(value) {
  // Haskell's Data.ByteString.Char8.pack maps the ASCII preimage bytes one-for-one.
  if ([...value].some((character) => character.codePointAt(0) > 0x7f)) {
    throw new Error("Issue vector unexpectedly contains non-ASCII characters");
  }
  return createHash("sha256").update(Buffer.from(value, "latin1")).digest("hex");
}

for (const [key, expectedValue] of Object.entries(expected)) {
  const actual = capture(key);
  if (actual !== expectedValue) {
    throw new Error(key + " golden vector mismatch");
  }
}

const preState = capture("ISSUE_VECTOR_PRE_STATE_CANONICAL");
const preStateHash = capture("ISSUE_VECTOR_PRE_STATE_SHA256");
const candidateState = capture("ISSUE_VECTOR_CANDIDATE_STATE_CANONICAL");
const postStateHash = capture("ISSUE_VECTOR_POST_STATE_SHA256");
const actionCanonical = capture("ISSUE_VECTOR_ACTION_CANONICAL");
const actionPreimage = capture("ISSUE_VECTOR_ACTION_HASH_PREIMAGE");
const actionFingerprint = capture("ISSUE_VECTOR_ACTION_FINGERPRINT");

if (sha256Char8(preState) !== preStateHash) {
  throw new Error("independent SHA-256 verification failed for pre-state");
}
if (sha256Char8(candidateState) !== postStateHash) {
  throw new Error("independent SHA-256 verification failed for candidate state");
}
const expectedPreimage = actionCanonical + "|" + preStateHash + "|" + postStateHash;
if (actionPreimage !== expectedPreimage) {
  throw new Error("Issue action fingerprint preimage does not match canonical components");
}
if (sha256Char8(actionPreimage) !== actionFingerprint) {
  throw new Error("independent SHA-256 verification failed for Issue action fingerprint");
}

console.log(JSON.stringify({
  status: "PASS",
  scope: "one checked-in Haskell Issue-decision golden vector; not an authorization or body-binding proof",
  checks: [
    "Haskell-produced canonical pre-state matches the golden vector",
    "Haskell-produced pre-state digest matches both the golden vector and independent Char8-compatible SHA-256",
    "Haskell-produced candidate state and post-state digest match the golden vector and independent SHA-256",
    "Haskell-produced Issue action preimage binds canonical action, pre-state digest and post-state digest",
    "Haskell-produced Issue action fingerprint matches the golden vector and independent SHA-256",
  ],
}, null, 2));
