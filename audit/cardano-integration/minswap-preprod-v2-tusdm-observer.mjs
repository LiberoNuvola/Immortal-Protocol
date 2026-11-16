import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { sha3_256 } from "@noble/hashes/sha3";
import { Data } from "lucid-cardano";

export const PREPROD_KOIOS = "https://preprod.koios.rest/api/v1";
export const MIN_SWAP_V2 = Object.freeze({
  sdkRepository: "https://github.com/minswap/sdk",
  sdkCommit: "ee95d4317414ae1fe2cdc40549e14a1e185dcf59",
  poolPaymentScriptHash: "d6ba9b7509eac866288ff5072d2a18205ac56f744bc82dcd808cb8fe",
  poolAuthPolicyId: "d6aae2059baee188f74917493cf7637e679cd219bdfbbf4dcbeb1d0b",
  poolAuthTokenName: "4d5350",
  lpPolicyId: "d6aae2059baee188f74917493cf7637e679cd219bdfbbf4dcbeb1d0b",
  minPoolAdaLovelace: 4500000n,
  decimals: 6,
});
export const TUSDM_CANDIDATES = Object.freeze([
  Object.freeze({
    label: "PRE_RICH_APPROVED_TUSDM",
    policyId: "e675b46e4d2242c991a8932a99db3044e80515ae14b4c4ccf6b3f4c9",
    tokenName: "0014df10745553444d",
  }),
  Object.freeze({
    label: "MASUMI_TUSDM",
    policyId: "16a55b2a349361ff88c03788f93e1e966e5d689605d044fef722ddde",
    tokenName: "0014df10745553444d",
  }),
]);

const PAGE_SIZE = 500;
const MAX_PAGES = 20;
const AUTH_UNIT = MIN_SWAP_V2.poolAuthPolicyId + MIN_SWAP_V2.poolAuthTokenName;

function assertHex(value, label, exactLength) {
  if (
    typeof value !== "string" ||
    !/^(?:[0-9a-f]{2})+$/.test(value) ||
    (exactLength !== undefined && value.length !== exactLength)
  ) {
    throw new Error(label + "_INVALID_HEX");
  }
}

function sha3Hex(hex) {
  if (typeof hex !== "string" || hex.length % 2 !== 0 || !/^[0-9a-f]*$/.test(hex)) {
    throw new Error("SHA3_INPUT_INVALID_HEX");
  }
  return Buffer.from(sha3_256(Buffer.from(hex, "hex"))).toString("hex");
}

export function computeMinswapV2LpUnit(policyId, tokenName) {
  assertHex(policyId, "TOKEN_POLICY_ID", 56);
  assertHex(tokenName, "TOKEN_NAME");
  const assets = [
    { policyId: "", tokenName: "" },
    { policyId: policyId.toLowerCase(), tokenName: tokenName.toLowerCase() },
  ];
  assets.sort((a, b) => {
    const left = a.policyId + a.tokenName;
    const right = b.policyId + b.tokenName;
    return left < right ? -1 : left > right ? 1 : 0;
  });
  const hashA = sha3Hex(assets[0].policyId + assets[0].tokenName);
  const hashB = sha3Hex(assets[1].policyId + assets[1].tokenName);
  return MIN_SWAP_V2.lpPolicyId + sha3Hex(hashA + hashB);
}

function getAssetQuantity(row, unit) {
  if (!Array.isArray(row.asset_list)) return null;
  const matches = row.asset_list.filter((item) => {
    const itemUnit = String(item.policy_id ?? "").toLowerCase() +
      String(item.asset_name ?? "").toLowerCase();
    return itemUnit === unit.toLowerCase();
  });
  if (matches.length > 1) throw new Error("UTXO_DUPLICATE_ASSET_UNIT:" + unit);
  if (matches.length === 0) return 0n;
  const raw = String(matches[0].quantity ?? "");
  if (!/^-?\d+$/.test(raw)) throw new Error("UTXO_ASSET_QUANTITY_INVALID:" + unit);
  return BigInt(raw);
}

function getPaymentCredential(row) {
  const value = row.payment_cred ?? row.payment_addr?.cred ?? "";
  return String(value).toLowerCase();
}

function decimalRatio(numerator, denominator, places = 12) {
  if (denominator <= 0n) throw new Error("PRICE_DENOMINATOR_NOT_POSITIVE");
  const whole = numerator / denominator;
  let remainder = numerator % denominator;
  let decimals = "";
  for (let i = 0; i < places; i += 1) {
    remainder *= 10n;
    decimals += String(remainder / denominator);
    remainder %= denominator;
  }
  return whole.toString() + "." + decimals;
}


export function decodePoolV2DatumAssetUnits(inlineDatum) {
  const raw =
    typeof inlineDatum === "string"
      ? inlineDatum
      : inlineDatum && typeof inlineDatum.bytes === "string"
        ? inlineDatum.bytes
        : null;
  if (!raw || !/^(?:[0-9a-f]{2})+$/i.test(raw)) {
    throw new Error("MIN_SWAP_POOL_INLINE_DATUM_CBOR_MISSING");
  }
  const root = Data.from(raw.toLowerCase());
  if (!root || root.index !== 0 || !Array.isArray(root.fields) || root.fields.length !== 10) {
    throw new Error("MIN_SWAP_POOL_DATUM_SHAPE_INVALID");
  }
  function assetUnit(value, field) {
    if (!value || value.index !== 0 || !Array.isArray(value.fields) || value.fields.length !== 2) {
      throw new Error("MIN_SWAP_POOL_DATUM_" + field + "_INVALID");
    }
    const policyId = value.fields[0];
    const tokenName = value.fields[1];
    if (typeof policyId !== "string" || typeof tokenName !== "string") {
      throw new Error("MIN_SWAP_POOL_DATUM_" + field + "_INVALID");
    }
    if (policyId === "" && tokenName === "") return "lovelace";
    assertHex(policyId.toLowerCase(), "MIN_SWAP_POOL_DATUM_POLICY_ID", 56);
    assertHex(tokenName.toLowerCase(), "MIN_SWAP_POOL_DATUM_TOKEN_NAME");
    return policyId.toLowerCase() + tokenName.toLowerCase();
  }
  const reserveA = root.fields[4];
  const reserveB = root.fields[5];
  if (typeof reserveA !== "bigint" || typeof reserveB !== "bigint" || reserveA <= 0n || reserveB <= 0n) {
    throw new Error("MIN_SWAP_POOL_DATUM_RESERVES_INVALID");
  }
  return {
    assetA: assetUnit(root.fields[1], "ASSET_A"),
    assetB: assetUnit(root.fields[2], "ASSET_B"),
    totalLiquidity: typeof root.fields[3] === "bigint" ? root.fields[3].toString() : null,
    reserveA: reserveA.toString(),
    reserveB: reserveB.toString(),
    feeANumerator: typeof root.fields[6] === "bigint" ? root.fields[6].toString() : null,
    feeBNumerator: typeof root.fields[7] === "bigint" ? root.fields[7].toString() : null,
  };
}

export function classifyMinswapV2PoolRows(rows) {
  if (!Array.isArray(rows)) throw new Error("KOIOS_ASSET_UTXOS_NOT_ARRAY");
  const onPoolScript = rows.filter((row) =>
    getPaymentCredential(row) === MIN_SWAP_V2.poolPaymentScriptHash
  );
  const authenticatedPools = [];
  const decodeErrors = [];
  const pairMap = new Map();
  const tUsdmLikePools = [];
  let authenticatedPoolUtxoCount = 0;
  for (const row of onPoolScript) {
    if (!Array.isArray(row.asset_list)) {
      throw new Error("MIN_SWAP_POOL_UTXO_ASSET_LIST_MISSING");
    }
    const authQuantity = getAssetQuantity(row, AUTH_UNIT);
    if (authQuantity !== 1n) continue;
    authenticatedPoolUtxoCount += 1;
    if (!row.inline_datum) {
      decodeErrors.push({ outRef: String(row.tx_hash) + "#" + String(row.tx_index), reason: "INLINE_DATUM_MISSING" });
      continue;
    }

    let poolDatum;
    try {
      poolDatum = decodePoolV2DatumAssetUnits(row.inline_datum);
      const pairUnits = [poolDatum.assetA, poolDatum.assetB].sort();
      const pairKey = pairUnits.join("|");
      const summary = pairMap.get(pairKey) ?? {
        assetA: pairUnits[0],
        assetB: pairUnits[1],
        poolCount: 0,
        sampleOutRef: String(row.tx_hash) + "#" + String(row.tx_index),
      };
      summary.poolCount += 1;
      pairMap.set(pairKey, summary);
      const nonAdaUnit =
        poolDatum.assetA === "lovelace" ? poolDatum.assetB :
        poolDatum.assetB === "lovelace" ? poolDatum.assetA : null;
      if (nonAdaUnit && nonAdaUnit.endsWith("0014df10745553444d")) {
        const policyId = nonAdaUnit.slice(0, 56);
        const tokenName = nonAdaUnit.slice(56);
        const quantity = getAssetQuantity(row, nonAdaUnit);
        if (quantity !== null && quantity > 0n) {
          const lovelace = BigInt(String(row.value ?? "0"));
          if (lovelace > MIN_SWAP_V2.minPoolAdaLovelace) {
            const valueAdaReserve = lovelace - MIN_SWAP_V2.minPoolAdaLovelace;
            const datumTokenReserve = poolDatum.assetA === nonAdaUnit
              ? BigInt(poolDatum.reserveA) : BigInt(poolDatum.reserveB);
            const datumAdaReserve = poolDatum.assetA === "lovelace"
              ? BigInt(poolDatum.reserveA) : BigInt(poolDatum.reserveB);
            tUsdmLikePools.push({
              exactUnit: nonAdaUnit,
              policyId,
              tokenNameHex: tokenName,
              tokenNameAscii: Buffer.from(tokenName, "hex").toString("utf8").replace(/[^\x20-\x7e]/g, "·"),
              lpUnit: computeMinswapV2LpUnit(policyId, tokenName),
              outRef: String(row.tx_hash) + "#" + String(row.tx_index),
              address: String(row.address ?? ""),
              poolAuthenticationUnit: AUTH_UNIT,
              poolAuthenticationQuantity: authQuantity.toString(),
              quantityAtomic: quantity.toString(),
              lovelaceIncludingMinPoolAda: lovelace.toString(),
              adaReserveLovelace: valueAdaReserve.toString(),
              datumAdaReserve: datumAdaReserve.toString(),
              datumTokenReserve: datumTokenReserve.toString(),
              adaPerTokenValue: decimalRatio(valueAdaReserve, quantity),
              adaPerTokenDatum: decimalRatio(datumAdaReserve, datumTokenReserve),
              datumValueReservesMatch: datumTokenReserve === quantity && datumAdaReserve === valueAdaReserve,
              datumAssetA: poolDatum.assetA,
              datumAssetB: poolDatum.assetB,
              feeANumerator: poolDatum.feeANumerator,
              feeBNumerator: poolDatum.feeBNumerator,
              blockHeight: row.block_height ?? null,
              blockTime: row.block_time ?? null,
              datumHash: row.datum_hash ?? null,
              inlineDatumByteLength: (
                typeof row.inline_datum === "string" ? row.inline_datum : String(row.inline_datum.bytes ?? "")
              ).length / 2,
            });
          }
        }
      }
    } catch (error) {
      decodeErrors.push({
        outRef: String(row.tx_hash) + "#" + String(row.tx_index),
        reason: String(error?.message ?? error),
      });
      continue;
    }

    for (const token of TUSDM_CANDIDATES) {
      const tokenUnit = token.policyId + token.tokenName;
      const pair = [poolDatum.assetA, poolDatum.assetB];
      if (!pair.includes("lovelace") || !pair.includes(tokenUnit)) continue;
      const tokenQuantity = getAssetQuantity(row, tokenUnit);
      if (tokenQuantity === null || tokenQuantity <= 0n) continue;
      const lpUnit = computeMinswapV2LpUnit(token.policyId, token.tokenName);

      const lovelace = BigInt(String(row.value ?? "0"));
      if (lovelace <= MIN_SWAP_V2.minPoolAdaLovelace) continue;
      const valueAdaReserve = lovelace - MIN_SWAP_V2.minPoolAdaLovelace;
      const inlineDatumBytes =
        typeof row.inline_datum === "string"
          ? row.inline_datum
          : String(row.inline_datum.bytes ?? "");
      const datumDigest = createHash("sha256").update(inlineDatumBytes, "utf8").digest("hex");
      const datumTokenReserve = poolDatum.assetA === tokenUnit
        ? BigInt(poolDatum.reserveA)
        : BigInt(poolDatum.reserveB);
      const datumAdaReserve = poolDatum.assetA === "lovelace"
        ? BigInt(poolDatum.reserveA)
        : BigInt(poolDatum.reserveB);

      authenticatedPools.push({
        candidate: token.label,
        exactTokenUnit: tokenUnit,
        exactLpUnit: lpUnit,
        outRef: String(row.tx_hash) + "#" + String(row.tx_index),
        address: String(row.address ?? ""),
        paymentCredential: getPaymentCredential(row),
        poolAuthenticationUnit: AUTH_UNIT,
        poolAuthenticationQuantity: authQuantity.toString(),
        tusdmQuantityAtomic: tokenQuantity.toString(),
        lovelaceIncludingMinPoolAda: lovelace.toString(),
        minPoolAdaLovelace: MIN_SWAP_V2.minPoolAdaLovelace.toString(),
        adaReserveLovelace: valueAdaReserve.toString(),
        adaPerTusdmValue: decimalRatio(valueAdaReserve, tokenQuantity),
        datumAdaReserve: datumAdaReserve.toString(),
        datumTusdmReserve: datumTokenReserve.toString(),
        adaPerTusdmDatum: decimalRatio(datumAdaReserve, datumTokenReserve),
        datumValueReservesMatch:
          datumTokenReserve === tokenQuantity && datumAdaReserve === valueAdaReserve,
        datumAssetA: poolDatum.assetA,
        datumAssetB: poolDatum.assetB,
        datumTotalLiquidity: poolDatum.totalLiquidity,
        feeANumerator: poolDatum.feeANumerator,
        feeBNumerator: poolDatum.feeBNumerator,
        blockHeight: row.block_height ?? null,
        blockTime: row.block_time ?? null,
        datumHash: row.datum_hash ?? null,
        inlineDatumPresent: true,
        inlineDatumByteLength: inlineDatumBytes.length / 2,
        inlineDatumSha256: datumDigest,
      });
    }
  }
  return {
    poolScriptUtxoCount: onPoolScript.length,
    authenticatedPoolUtxoCount,
    datumDecodeErrorCount: decodeErrors.length,
    datumDecodeErrorSamples: decodeErrors.slice(0, 10),
    observedDatumPairs: [...pairMap.values()].sort((a, b) => b.poolCount - a.poolCount),
    tUsdmLikePools,
    matches: authenticatedPools,
  };
}

async function fetchJson(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    signal: AbortSignal.timeout(30000),
    headers: {
      accept: "application/json",
      ...(options.headers ?? {}),
    },
  });
  const body = await response.text();
  if (!response.ok) {
    throw new Error("KOIOS_HTTP_" + response.status + ":" + body.slice(0, 500));
  }
  let json;
  try {
    json = JSON.parse(body);
  } catch {
    throw new Error("KOIOS_INVALID_JSON");
  }
  return { json, headers: response.headers };
}

async function fetchAssetInfo(unit) {
  const policyId = unit.slice(0, 56);
  const assetName = unit.slice(56);
  const params = new URLSearchParams({ _asset_policy: policyId, _asset_name: assetName });
  const result = await fetchJson(PREPROD_KOIOS + "/asset_info?" + params.toString());
  return Array.isArray(result.json) ? result.json[0] ?? null : result.json ?? null;
}

async function fetchCurrentTip() {
  const result = await fetchJson(PREPROD_KOIOS + "/tip");
  const tip = Array.isArray(result.json) ? result.json[0] : result.json;
  if (!tip || !Number.isSafeInteger(Number(tip.abs_slot ?? tip.absolute_slot))) {
    throw new Error("KOIOS_PREPROD_TIP_INVALID");
  }
  return tip;
}

async function fetchAllAuthTokenUtxos() {
  const rows = [];
  let offset = 0;
  let expectedTotal = null;
  let pages = 0;
  while (pages < MAX_PAGES) {
    const end = offset + PAGE_SIZE - 1;
    const url =
      PREPROD_KOIOS +
      "/asset_utxos?offset=" + offset +
      "&limit=" + PAGE_SIZE;
    const result = await fetchJson(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "Range-Unit": "items",
        Range: offset + "-" + end,
        Prefer: "count=exact",
      },
      body: JSON.stringify({
        _asset_list: [[MIN_SWAP_V2.poolAuthPolicyId, MIN_SWAP_V2.poolAuthTokenName]],
        _extended: true,
      }),
    });
    const page = result.json;
    if (!Array.isArray(page)) throw new Error("KOIOS_ASSET_UTXOS_NOT_ARRAY");
    const contentRange = result.headers.get("content-range");
    if (!contentRange) throw new Error("KOIOS_CONTENT_RANGE_MISSING");
    if (contentRange === "*/0" && offset === 0 && page.length === 0) {
      return { rows: [], pages: 1, total: 0, contentRange };
    }
    const rangeMatch = /^(\d+)-(\d+)\/(\d+)$/.exec(contentRange);
    if (!rangeMatch) throw new Error("KOIOS_CONTENT_RANGE_INVALID:" + contentRange);
    const start = Number(rangeMatch[1]);
    const finish = Number(rangeMatch[2]);
    const total = Number(rangeMatch[3]);
    if (start !== offset || finish - start + 1 !== page.length) {
      throw new Error("KOIOS_PAGE_RANGE_MISMATCH");
    }
    if (expectedTotal !== null && total !== expectedTotal) {
      throw new Error("KOIOS_RESULT_COUNT_CHANGED_DURING_SCAN");
    }
    expectedTotal = total;
    rows.push(...page);
    offset += page.length;
    pages += 1;
    if (offset >= expectedTotal) {
      return {
        rows,
        pages,
        total: expectedTotal,
        contentRange,
      };
    }
    if (page.length === 0) throw new Error("KOIOS_PAGINATION_STALLED");
  }
  throw new Error("KOIOS_PAGINATION_PAGE_LIMIT_EXCEEDED");
}

async function main() {
  const tip = await fetchCurrentTip();
  const observation = await fetchAllAuthTokenUtxos();
  const classification = classifyMinswapV2PoolRows(observation.rows);
  const byCandidate = Object.fromEntries(
    TUSDM_CANDIDATES.map((candidate) => [
      candidate.label,
      classification.matches.filter((match) => match.candidate === candidate.label),
    ])
  );
  const similarAssetUnits = [...new Set(classification.tUsdmLikePools.map((pool) => pool.exactUnit))];
  const similarAssetInfo = await Promise.all(similarAssetUnits.map(async (unit) => {
    try {
      const info = await fetchAssetInfo(unit);
      if (!info) return { unit, status: "NO_ASSET_INFO_ROW" };
      return {
        unit,
        policyId: info.policy_id ?? unit.slice(0, 56),
        assetName: info.asset_name ?? unit.slice(56),
        assetNameAscii: info.asset_name_ascii ?? null,
        fingerprint: info.fingerprint ?? null,
        mintingTxHash: info.minting_tx_hash ?? null,
        totalSupply: info.total_supply ?? null,
        mintCount: info.mint_cnt ?? null,
        burnCount: info.burn_cnt ?? null,
        creationTime: info.creation_time ?? null,
        tokenRegistryMetadata: info.token_registry_metadata ? {
          name: info.token_registry_metadata.name ?? null,
          ticker: info.token_registry_metadata.ticker ?? null,
          description: info.token_registry_metadata.description ?? null,
          url: info.token_registry_metadata.url ?? null,
          decimals: info.token_registry_metadata.decimals ?? null,
        } : null,
        latestMintMetadata: info.minting_tx_metadata ?? null,
      };
    } catch (error) {
      return { unit, status: "ASSET_INFO_QUERY_FAILED", error: String(error?.message ?? error) };
    }
  }));

  let status = "NO_EXACT_TUSDM_ADA_POOL_FOUND";
  if (byCandidate.PRE_RICH_APPROVED_TUSDM.length > 0 &&
      byCandidate.MASUMI_TUSDM.length > 0) {
    status = "BOTH_TUSDM_POLICIES_HAVE_MIN_SWAP_V2_POOL_UTXOS";
  } else if (byCandidate.PRE_RICH_APPROVED_TUSDM.length > 0) {
    status = "PRE_RICH_APPROVED_E675_TUSDM_POOL_CONFIRMED";
  } else if (byCandidate.MASUMI_TUSDM.length > 0) {
    status = "ONLY_MASUMI_16A55_TUSDM_POOL_CONFIRMED";
  }

  const evidence = {
    schema: "PRE-RICH-MINSWAP-PREPROD-V2-TUSDM-POOL-OBSERVATION-v0.1",
    status,
    network: "cardano-preprod",
    provider: "Koios",
    source: {
      api: PREPROD_KOIOS,
      query: "POST /asset_utxos for the official Minswap V2 pool authentication asset",
      minswapSdkRepository: MIN_SWAP_V2.sdkRepository,
      minswapSdkCommit: MIN_SWAP_V2.sdkCommit,
      minswapV2PoolPaymentScriptHash: MIN_SWAP_V2.poolPaymentScriptHash,
      minswapV2PoolAuthenticationUnit: AUTH_UNIT,
      minswapV2LpPolicyId: MIN_SWAP_V2.lpPolicyId,
      lpAssetDerivation: "SHA3-256(SHA3-256(assetA) || SHA3-256(assetB)); exact implementation cross-checked against Minswap SDK PoolV2.computeLPAssetName",
    },
    candidates: TUSDM_CANDIDATES.map((candidate) => ({
      label: candidate.label,
      unit: candidate.policyId + candidate.tokenName,
      lpUnit: computeMinswapV2LpUnit(candidate.policyId, candidate.tokenName),
      poolCount: byCandidate[candidate.label].length,
    })),
    query: {
      authAssetUtxoCount: observation.total,
      pagesRead: observation.pages,
      finalContentRange: observation.contentRange ?? null,
      poolScriptUtxoCount: classification.poolScriptUtxoCount,
      authenticatedPoolUtxoCount: classification.authenticatedPoolUtxoCount,
      datumDecodeErrorCount: classification.datumDecodeErrorCount,
      distinctDatumPairCount: classification.observedDatumPairs.length,
      tUsdmLikePoolCount: classification.tUsdmLikePools.length,
    },
    observedDatumPairs: classification.observedDatumPairs,
    tUsdmLikePools: classification.tUsdmLikePools,
    tUsdmLikeAssetInfo: similarAssetInfo,
    pools: classification.matches,
    chainTip: {
      slot: Number(tip.abs_slot ?? tip.absolute_slot),
      blockHeight: Number(tip.block_no),
      blockHash: tip.hash ?? null,
      blockTime: tip.block_time ?? null,
    },
    observedAt: new Date().toISOString(),
    limitations: [
      "This is a read-only current UTxO observation, not an independent oracle or market-manipulation assessment.",
      "A discovered Preprod tUSDM/ADA pool supplies a test-network exchange ratio only; it does not establish USD/USDM parity or a production price source.",
      "A match for policy 16a55... is Masumi tUSDM, not PRE-RICH's approved e675... asset.",
      "The output's exact policy/name and Minswap V2 pool authentication identity are matched; no transaction, wallet or signer was used.",
    ],
  };

  const outputPath =
    process.env.MIN_SWAP_EVIDENCE_OUTPUT ??
    "audit/preprod-evidence/minswap-preprod-v2-tusdm-pool-observation.json";
  await mkdir(resolve(outputPath, ".."), { recursive: true });
  await writeFile(outputPath, JSON.stringify(evidence, null, 2) + "\n");
  console.log(JSON.stringify({
    status: evidence.status,
    authAssetUtxos: evidence.query.authAssetUtxoCount,
    minswapV2PoolScriptUtxos: evidence.query.poolScriptUtxoCount,
    authenticatedPoolUtxos: evidence.query.authenticatedPoolUtxoCount,
    e675Matches: byCandidate.PRE_RICH_APPROVED_TUSDM.length,
    masumi16a55Matches: byCandidate.MASUMI_TUSDM.length,
    evidenceFile: outputPath,
    chainTip: evidence.chainTip,
  }, null, 2));
}

const invokedPath = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href : null;
if (invokedPath && import.meta.url === invokedPath) {
  main().catch((error) => {
    console.error(error?.stack ?? String(error));
    process.exitCode = 1;
  });
}
