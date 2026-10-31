import test from "node:test";
import assert from "node:assert/strict";
import { classifyEntitlement } from "./pythEntitlementAudit.mjs";

test("classifies entitled Moneta NAV and ADA/USD feeds without changing their meaning", () => {
  const result = classifyEntitlement([
    {
      pyth_lazer_id: 3326,
      symbol: "Crypto.NAV.USDM/RESERVES",
      name: "US DOLLAR MONETA / RESERVES",
      asset_type: "nav",
      instrument_type: "nav",
      state: "stable",
      min_channel: "fixed_rate@200ms",
      exponent: -8,
      groups: [],
    },
    {
      pyth_lazer_id: 16,
      symbol: "Crypto.ADA/USD",
      asset_type: "crypto",
      instrument_type: "spot",
      state: "stable",
      min_channel: "fixed_rate@200ms",
    },
    {
      pyth_lazer_id: 609,
      symbol: "Crypto.USDM/USD",
      name: "MOUNTAIN PROTOCOL USD / US DOLLAR",
      state: "inactive",
    },
  ]);

  assert.equal(result.feed_3326_status, "LISTED_IN_ENTITLED_CATALOG");
  assert.equal(result.feed_3326.instrument_type, "nav");
  assert.equal(result.feed_16_status, "LISTED_IN_ENTITLED_CATALOG");
  assert.equal(result.relevant_feeds.length, 3);
});

test("does not infer entitlement when the requested feed is absent", () => {
  const result = classifyEntitlement([
    { pyth_lazer_id: 609, symbol: "Crypto.USDM/USD", state: "inactive" },
  ]);
  assert.equal(result.feed_3326_status, "NOT_LISTED_IN_ENTITLED_CATALOG");
  assert.equal(result.feed_16_status, "NOT_LISTED_IN_ENTITLED_CATALOG");
});
