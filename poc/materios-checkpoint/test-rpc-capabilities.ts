import { strict as assert } from "node:assert";
import { test } from "node:test";

import {
  summarizeRpcMethodCatalogue,
  TARGET_RPC_METHODS,
} from "./src/probe-rpc-capabilities.ts";

test("RPC method catalogue reports only exact advertised names", () => {
  const result = summarizeRpcMethodCatalogue({
    version: 1,
    methods: [
      "rpc_methods",
      "chain_getFinalizedHead",
      "state_getReadProof",
      "state_getReadProof",
      "grandpa_subscribeJustifications",
    ],
  });

  assert.equal(result.status, "available");
  if (result.status !== "available") throw new Error("expected valid catalogue");
  assert.equal(result.methodCount, 4);
  assert.equal(result.targets.chain_getFinalizedHead, "listed");
  assert.equal(result.targets.state_getReadProof, "listed");
  assert.equal(result.targets.grandpa_subscribeJustifications, "listed");
  assert.equal(result.targets.grandpa_unsubscribeJustifications, "not-listed");
  assert.equal(result.targets.materios_b3_calculateCommitteeProof, "not-listed");
  assert.equal(TARGET_RPC_METHODS.includes("grandpa_proveFinality"), true);
  assert.equal(TARGET_RPC_METHODS.includes("grandpa_subscribeJustifications"), true);
});

test("missing or malformed method lists remain unknown, never unavailable", () => {
  for (const value of [null, [], {}, { methods: "chain_getFinalizedHead" }, { methods: [1] }]) {
    const result = summarizeRpcMethodCatalogue(value);
    assert.equal(result.status, "malformed");
    if (result.status !== "malformed") throw new Error("expected malformed catalogue");
    assert.equal(result.targets.chain_getFinalizedHead, "unknown");
    assert.match(result.reason, /rpc_methods/);
  }
});
