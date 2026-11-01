import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';

const ADDRESS = 'addr1z9cy2gmar6cpn8yymll93lnd7lw96f27kn2p3eq5d4tjr7rshnr04ple6jjfc0cvcmcpcxmsh576v7j2mjk8tw890vespzvgwd';
const USDM_UNIT = 'c48cbb3d5e57ed56e276bc45f99ab39abe94e6cd7ac39fb402da47ad0014df105553444d';
const BASE = 'https://api.koios.rest/api/v1';
const OUT = 'audit/muesliswap-evidence';

async function post(path, body) {
  const response = await fetch(BASE + path, {
    method: 'POST',
    headers: { 'content-type': 'application/json', accept: 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(45000),
  });
  const raw = await response.text();
  if (!response.ok) throw new Error(`KOIOS_${path.slice(1)}_HTTP_${response.status}:${raw.slice(0, 500)}`);
  return { raw, data: JSON.parse(raw), status: response.status };
}

await mkdir(OUT, { recursive: true });
const startedAt = new Date().toISOString();
const manifest = {
  schema: 'IMMORTAL_MUESLISWAP_USDM_UTXO_OBSERVATION_V1',
  network: 'cardano-mainnet',
  endpoint: BASE,
  address: ADDRESS,
  usdmUnit: USDM_UNIT,
  startedAt,
  readOnly: true,
  transactionSubmission: false,
};
try {
  const [tipResult, utxoResult] = await Promise.all([
    post('/tip', {}),
    post('/address_utxos', { _addresses: [ADDRESS], _extended: true }),
  ]);
  if (!Array.isArray(tipResult.data) || tipResult.data.length !== 1) throw new Error('KOIOS_TIP_SHAPE_INVALID');
  if (!Array.isArray(utxoResult.data)) throw new Error('KOIOS_ADDRESS_UTXOS_SHAPE_INVALID');
  const rows = utxoResult.data;
  const candidates = rows.filter(row => (row.asset_list ?? []).some(asset =>
    String(asset.policy_id ?? '').toLowerCase() + String(asset.asset_name ?? '').toLowerCase() === USDM_UNIT
    && BigInt(String(asset.quantity ?? '0')) > 0n
  ));
  const normalized = candidates.map(row => ({
    txHash: row.tx_hash,
    outputIndex: Number(row.tx_index),
    address: row.address,
    lovelace: String(row.value),
    assets: (row.asset_list ?? []).map(asset => ({
      unit: String(asset.policy_id ?? '').toLowerCase() + String(asset.asset_name ?? '').toLowerCase(),
      quantity: String(asset.quantity ?? '0'),
    })),
    datumHash: row.datum_hash ?? null,
    inlineDatumBytes: row.inline_datum?.bytes ?? null,
    inlineDatumHash: row.inline_datum?.hash ?? null,
    blockHeight: row.block_height ?? null,
    blockTime: row.block_time ?? null,
  }));
  manifest.completedAt = new Date().toISOString();
  manifest.tip = tipResult.data[0];
  manifest.addressUtxoCount = rows.length;
  manifest.usdmCandidateCount = candidates.length;
  manifest.usdmCandidates = normalized;
  manifest.responseSha256 = createHash('sha256').update(utxoResult.raw, 'utf8').digest('hex');
  manifest.rawResponseFile = 'address-utxos-response.json';
  await writeFile(`${OUT}/address-utxos-response.json`, utxoResult.raw + '\n');
  await writeFile(`${OUT}/observation.json`, JSON.stringify(manifest, null, 2) + '\n');
  const lines = [
    'MuesliSwap Mainnet USDM UTxO observation',
    `startedAt=${startedAt}`,
    `completedAt=${manifest.completedAt}`,
    `tipSlot=${manifest.tip.abs_slot ?? manifest.tip.absolute_slot ?? 'unknown'}`,
    `tipBlock=${manifest.tip.block_no ?? manifest.tip.block_height ?? 'unknown'}`,
    `addressUtxoCount=${rows.length}`,
    `usdmCandidateCount=${candidates.length}`,
    `responseSha256=${manifest.responseSha256}`,
    'readOnly=true',
    'poolDatumDecoded=false',
  ];
  await writeFile(`${OUT}/summary.txt`, lines.join('\n') + '\n');
  console.log(lines.join('\n'));
  if (candidates.length === 0) console.log('RESULT=NO_CURRENT_USDM_UTXO_AT_TARGET_ADDRESS');
} catch (error) {
  manifest.completedAt = new Date().toISOString();
  manifest.error = String(error?.stack ?? error);
  await writeFile(`${OUT}/observation-error.json`, JSON.stringify(manifest, null, 2) + '\n');
  console.error(manifest.error);
  process.exitCode = 1;
}
