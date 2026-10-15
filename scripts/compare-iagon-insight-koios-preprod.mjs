import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';

const required = (name) => {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`MISSING_REQUIRED_ENV:${name}`);
  return value;
};
const sha256 = (value) => createHash('sha256').update(value).digest('hex');
const safeIntegerString = (value, label) => {
  const text = String(value);
  if (!/^(0|[1-9][0-9]*)$/.test(text)) throw new Error(`INVALID_INTEGER:${label}`);
  return text;
};
const normalizeUnit = (value) => String(value).toLowerCase();
const normalizeAssets = (entries, label) => {
  const out = {};
  for (const [unit, quantity] of Object.entries(entries ?? {})) {
    const key = normalizeUnit(unit);
    if (typeof quantity === 'number' && !Number.isSafeInteger(quantity)) {
      throw new Error(`UNSAFE_NUMERIC_ASSET_QUANTITY:${label}:${key}`);
    }
    out[key] = safeIntegerString(quantity, `${label}:${key}`);
  }
  return Object.fromEntries(Object.entries(out).sort(([a], [b]) => a.localeCompare(b)));
};
const normalizeInsightUtxo = (u) => {
  if (!u || typeof u.transaction_id !== 'string' || !Number.isInteger(Number(u.output_index))) {
    throw new Error('INSIGHT_UTXO_REFERENCE_MALFORMED');
  }
  const lovelace = u.value?.lovelace;
  if (typeof lovelace === 'number' && !Number.isSafeInteger(lovelace)) {
    throw new Error('INSIGHT_LOVELACE_NOT_SAFE_INTEGER');
  }
  const assets = normalizeAssets(u.value?.assets ?? {}, 'insight');
  assets.lovelace = safeIntegerString(lovelace, 'insight:lovelace');
  return {
    ref: `${u.transaction_id.toLowerCase()}#${Number(u.output_index)}`,
    address: u.address,
    assets: Object.fromEntries(Object.entries(assets).sort(([a], [b]) => a.localeCompare(b))),
    datumHash: u.datum_hash ?? null,
    scriptHash: u.script_hash ?? null,
    slot: u.created_at?.slot_no == null ? null : String(u.created_at.slot_no),
  };
};
const normalizeKoiosUtxo = (u) => {
  if (!u || typeof u.tx_hash !== 'string' || !Number.isInteger(Number(u.tx_index))) {
    throw new Error('KOIOS_UTXO_REFERENCE_MALFORMED');
  }
  const assets = { lovelace: safeIntegerString(u.value, 'koios:lovelace') };
  for (const a of Array.isArray(u.asset_list) ? u.asset_list : []) {
    const policy = String(a.policy_id ?? '').toLowerCase();
    const name = String(a.asset_name ?? '').toLowerCase();
    if (!/^[0-9a-f]{56}$/.test(policy) || !/^[0-9a-f]{0,64}$/.test(name)) {
      throw new Error('KOIOS_ASSET_UNIT_MALFORMED');
    }
    assets[policy + name] = safeIntegerString(a.quantity, `koios:${policy + name}`);
  }
  return {
    ref: `${u.tx_hash.toLowerCase()}#${Number(u.tx_index)}`,
    address: u.address,
    assets: Object.fromEntries(Object.entries(assets).sort(([a], [b]) => a.localeCompare(b))),
    datumHash: u.datum_hash ?? null,
    scriptHash: typeof u.reference_script === 'string' ? u.reference_script : null,
    slot: null,
  };
};
async function getJson(url, options = {}) {
  const response = await fetch(url, options);
  const text = await response.text();
  if (!response.ok) throw new Error(`HTTP_${response.status}:${url}:${text.slice(0, 400)}`);
  let json;
  try { json = JSON.parse(text); } catch { throw new Error(`INVALID_JSON:${url}`); }
  return { json, text, status: response.status };
}
const main = async () => {
  const address = required('B1_POOL_ADDRESS');
  const poolUnit = required('POOL_TOKEN_UNIT').toLowerCase();
  const usdmUnit = required('USDM_ASSET_UNIT').toLowerCase();
  const apiKey = required('IAGON_INSIGHT_API_KEY');
  if (!/^[0-9a-f]{56,120}$/.test(poolUnit) || !/^[0-9a-f]{56,120}$/.test(usdmUnit)) {
    throw new Error('ASSET_UNITS_MUST_BE_POLICY_ID_PLUS_HEX_ASSET_NAME');
  }
  const insightUrl = 'https://api.fireblocks.partners.iagon.com/v1/utxos/address/' + encodeURIComponent(address);
  const koiosUrl = 'https://preprod.koios.rest/api/v1/address_utxos';
  const [insight, koios] = await Promise.all([
    getJson(insightUrl, { headers: { Authorization: `Bearer ${apiKey}`, Accept: 'application/json' } }),
    getJson(koiosUrl, {
      method: 'POST',
      headers: { 'content-type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ _addresses: [address], _extended: true }),
    }),
  ]);
  if (insight.json?.success !== true || !Array.isArray(insight.json?.data)) {
    throw new Error('INSIGHT_RESPONSE_SHAPE_INVALID');
  }
  if (!Array.isArray(koios.json)) throw new Error('KOIOS_RESPONSE_SHAPE_INVALID');

  const a = insight.json.data.map(normalizeInsightUtxo).sort((x, y) => x.ref.localeCompare(y.ref));
  const b = koios.json.map(normalizeKoiosUtxo).sort((x, y) => x.ref.localeCompare(y.ref));
  const mapA = new Map(a.map(x => [x.ref, x]));
  const mapB = new Map(b.map(x => [x.ref, x]));
  const refs = [...new Set([...mapA.keys(), ...mapB.keys()])].sort();
  const differences = [];
  for (const ref of refs) {
    const x = mapA.get(ref), y = mapB.get(ref);
    if (!x || !y) {
      differences.push({ ref, type: !x ? 'MISSING_FROM_INSIGHT' : 'MISSING_FROM_KOIOS' });
      continue;
    }
    if (JSON.stringify(x.assets) !== JSON.stringify(y.assets)) {
      differences.push({ ref, type: 'ASSET_VALUE_MISMATCH', insight: x.assets, koios: y.assets });
    }
    if (x.datumHash !== y.datumHash) differences.push({ ref, type: 'DATUM_HASH_MISMATCH', insight: x.datumHash, koios: y.datumHash });
  }
  const poolA = a.filter(x => x.assets[poolUnit] === '1');
  const poolB = b.filter(x => x.assets[poolUnit] === '1');
  const poolRefsMatch = poolA.length === 1 && poolB.length === 1 && poolA[0].ref === poolB[0].ref;
  const pool = poolRefsMatch ? { ref: poolA[0].ref, insight: poolA[0], koios: poolB[0] } : null;
  const usdmQuantity = poolRefsMatch ? {
    insight: poolA[0].assets[usdmUnit] ?? '0',
    koios: poolB[0].assets[usdmUnit] ?? '0',
  } : null;
  const usdmMatch = usdmQuantity !== null && usdmQuantity.insight === usdmQuantity.koios;
  const exactMatch = differences.length === 0 && a.length === b.length && poolRefsMatch && usdmMatch;
  const rawBundle = {
    insight: { status: insight.status, url: insightUrl, body: insight.json },
    koios: { status: koios.status, url: koiosUrl, body: koios.json },
  };
  const rawText = JSON.stringify(rawBundle, null, 2) + '\n';
  const report = {
    schema: 'IMMORTAL-IAGON-INSIGHT-KOIOS-COMPARISON-V1',
    generatedAt: new Date().toISOString(),
    network: 'cardano-preprod',
    address,
    poolTokenUnit: poolUnit,
    usdmAssetUnit: usdmUnit,
    providers: {
      insight: { url: insightUrl, rawResponseSha256: sha256(JSON.stringify(insight.json)) },
      koios: { url: koiosUrl, rawResponseSha256: sha256(JSON.stringify(koios.json)) },
    },
    counts: { insight: a.length, koios: b.length },
    poolSingleton: { insightMatches: poolA.length, koiosMatches: poolB.length, sameOutRef: poolRefsMatch },
    usdmRawQuantity: usdmQuantity,
    differences,
    result: exactMatch ? 'PASS_EXACT_MATCH' : 'INCONCLUSIVE_OR_MISMATCH',
    limitations: [
      'Provider responses are observations, not cryptographic proof of ledger canonicality.',
      'Insight response numeric fields are rejected if they exceed JavaScript safe-integer precision.',
      'This comparison does not qualify EEV or authorize Issue.',
      'Slot values are recorded only where exposed by the provider response; this report does not certify finality.',
    ],
  };
  await mkdir('artifacts/iagon-insight-koios', { recursive: true });
  await writeFile('artifacts/iagon-insight-koios/raw-responses.json', rawText, { flag: 'wx' });
  await writeFile('artifacts/iagon-insight-koios/comparison-report.json', JSON.stringify(report, null, 2) + '\n', { flag: 'wx' });
  const manifest = {
    schema: 'JEV-EVIDENCE-INGRESS-MANIFEST-V1',
    repository: process.env.GITHUB_REPOSITORY ?? null,
    commitSha: process.env.GITHUB_SHA ?? null,
    workflowRunId: process.env.GITHUB_RUN_ID ?? null,
    runAttempt: process.env.GITHUB_RUN_ATTEMPT ?? null,
    source: 'Iagon Insight + Koios Preprod UTxO comparison',
    reportSha256: sha256(JSON.stringify(report, null, 2) + '\n'),
    rawResponsesSha256: sha256(rawText),
    result: report.result,
  };
  await writeFile('artifacts/iagon-insight-koios/jev-ingress-manifest.json', JSON.stringify(manifest, null, 2) + '\n', { flag: 'wx' });
  console.log(JSON.stringify({ result: report.result, counts: report.counts, poolSingleton: report.poolSingleton, usdmRawQuantity: report.usdmRawQuantity, differences: differences.length }, null, 2));
  if (!exactMatch) process.exitCode = 2;
};
main().catch(error => {
  console.error(error instanceof Error ? error.stack : String(error));
  process.exitCode = 1;
});
