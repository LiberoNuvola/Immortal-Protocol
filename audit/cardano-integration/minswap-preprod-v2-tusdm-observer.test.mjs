import test from "node:test";
import { Constr, Data } from "lucid-cardano";
import assert from "node:assert/strict";
import {
  MIN_SWAP_V2,
  TUSDM_CANDIDATES,
  classifyMinswapV2PoolRows,
  decodePoolV2DatumAssetUnits,
  computeMinswapV2LpUnit,
} from "./minswap-preprod-v2-tusdm-observer.mjs";

const E675 = TUSDM_CANDIDATES[0];
const MASUMI = TUSDM_CANDIDATES[1];
const AUTH_UNIT = MIN_SWAP_V2.poolAuthPolicyId + MIN_SWAP_V2.poolAuthTokenName;

function fixture(token, tokenQuantity = "1000000") {
  const lpUnit = computeMinswapV2LpUnit(token.policyId, token.tokenName);
  const tokenUnit = token.policyId + token.tokenName;
  const datum = new Constr(0, [
    new Constr(0, []),
    new Constr(0, ["", ""]),
    new Constr(0, [token.policyId, token.tokenName]),
    1_000_000n,
    5_500_000n,
    1_000_000n,
    30n,
    30n,
    new Constr(1, []),
    new Constr(0, []),
  ]);
  return {
    tx_hash: "a".repeat(64),
    tx_index: 0,
    address: "addr_test1_pool_fixture",
    payment_cred: MIN_SWAP_V2.poolPaymentScriptHash,
    value: "10000000",
    block_height: 123,
    block_time: 1700000000,
    inline_datum: { bytes: Data.to(datum) },
    asset_list: [
      { policy_id: MIN_SWAP_V2.poolAuthPolicyId, asset_name: MIN_SWAP_V2.poolAuthTokenName, quantity: "1" },
      { policy_id: token.policyId, asset_name: token.tokenName, quantity: tokenQuantity },
      // LP tokens are user-held; the Pool UTxO is not required to carry them.
    ],
  };
}

test("Minswap SHA3-256 LP pair identity is fixed for PRE-RICH e675 tUSDM/ADA", () => {
  assert.equal(
    computeMinswapV2LpUnit(E675.policyId, E675.tokenName),
    "d6aae2059baee188f74917493cf7637e679cd219bdfbbf4dcbeb1d0b0588872bdae51b478556cbcd2ba87ed1f9d4e2b4713c77d8e4fa8d9cebcebe19",
  );
});

test("Masumi tUSDM has a different Minswap V2 LP identity from PRE-RICH e675", () => {
  const e675Lp = computeMinswapV2LpUnit(E675.policyId, E675.tokenName);
  const masumiLp = computeMinswapV2LpUnit(MASUMI.policyId, MASUMI.tokenName);
  assert.notEqual(e675Lp, masumiLp);
  assert.equal(
    masumiLp,
    "d6aae2059baee188f74917493cf7637e679cd219bdfbbf4dcbeb1d0b04c959a67d91376b25886e66ed86604cbb5cb9885ce0c48195ed64cb0e59306d",
  );
});

test("only the exact e675 token plus its derived LP asset qualifies as PRE-RICH tUSDM/ADA", () => {
  const result = classifyMinswapV2PoolRows([fixture(E675)]);
  assert.equal(result.poolScriptUtxoCount, 1);
  assert.equal(result.authenticatedPoolUtxoCount, 1);
  assert.equal(result.matches.length, 1);
  assert.equal(result.matches[0].candidate, "PRE_RICH_APPROVED_TUSDM");
  assert.equal(result.matches[0].tusdmQuantityAtomic, "1000000");
  assert.equal(result.matches[0].adaReserveLovelace, "5500000");
  assert.equal(result.matches[0].adaPerTusdmValue, "5.500000000000");
  assert.equal(result.matches[0].adaPerTusdmDatum, "5.500000000000");
  assert.equal(result.matches[0].datumValueReservesMatch, true);
});

test("a Masumi 16a55 tUSDM pool is never classified as the PRE-RICH e675 asset", () => {
  const result = classifyMinswapV2PoolRows([fixture(MASUMI)]);
  assert.equal(result.matches.length, 1);
  assert.equal(result.matches[0].candidate, "MASUMI_TUSDM");
});

test("lookalike payment credentials, missing auth tokens and wrong datum pairs are rejected", () => {
  const wrongScript = fixture(E675);
  wrongScript.payment_cred = "f".repeat(56);

  const missingAuth = fixture(E675);
  missingAuth.asset_list[0].quantity = "2";

  const wrongPair = fixture(E675);
  wrongPair.inline_datum = { bytes: Data.to(new Constr(0, [
    new Constr(0, []), new Constr(0, ["", ""]),
    new Constr(0, ["f".repeat(56), E675.tokenName]),
    1_000_000n, 5_500_000n, 1_000_000n, 30n, 30n,
    new Constr(1, []), new Constr(0, []),
  ])) };

  const result = classifyMinswapV2PoolRows([wrongScript, missingAuth, wrongPair]);
  assert.equal(result.poolScriptUtxoCount, 2);
  assert.equal(result.authenticatedPoolUtxoCount, 1);
  assert.equal(result.matches.length, 0);
});
