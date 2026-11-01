#!/usr/bin/env node
/**
 * Read-only USDCx burn -> IOG withdrawal-history lookup.
 *
 * Resolves all payment addresses for one public Cardano stake credential via
 * Koios POST /account_addresses, then queries the observed IOG Portal GET
 * endpoint for each payment address and selects ONLY the two exact burn hashes.
 *
 * This is an evidence probe, not an official/versioned IOG integration.
 * No wallet, signature, transaction, POST to IOG, or state mutation.
 */
import { createHash } from 'node:crypto'
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'

export const STAKE_ADDRESS = 'stake1u8ue3etyhp2lrru2xmxd7cuslcqkaqlakd4863sfjhwrflcx9y5xp'
export const TARGET_BURNS = Object.freeze([
  '45f0cb262133e8e1de17845ba15a431af74b8fb7d7cc9c2fbafc39255150ba99',
  '4e02f10062efee431f20bece5faaa53e6f96e02c74b8cdb5d0878ec0c7c4ef9d',
])
export const KOIOS_BASE = 'https://api.koios.rest/api/v1'
export const IOG_BASE = 'https://production-docker.usdcx.aws.iohkdev.io'
const MAX_RESPONSE_BYTES = 1_000_000
const MAX_PAYMENT_ADDRESSES = 500

function sha256(text) {
  return createHash('sha256').update(text, 'utf8').digest('hex')
}

async function readJsonBounded(response, label) {
  if (!response.ok) throw new Error(label + '_HTTP_' + response.status)
  const body = await response.text()
  if (Buffer.byteLength(body, 'utf8') > MAX_RESPONSE_BYTES) throw new Error(label + '_RESPONSE_TOO_LARGE')
  try { return { value: JSON.parse(body), body } } catch { throw new Error(label + '_INVALID_JSON') }
}

export async function resolvePaymentAddresses(stakeAddress, fetchFn = fetch) {
  if (typeof stakeAddress !== 'string' || !stakeAddress.startsWith('stake1')) {
    throw new Error('STAKE_ADDRESS_INVALID_MAINNET')
  }
  const response = await fetchFn(KOIOS_BASE + '/account_addresses', {
    method: 'POST',
    headers: { accept: 'application/json', 'content-type': 'application/json' },
    body: JSON.stringify({
      _stake_addresses: [stakeAddress],
      _first_only: false,
      _empty: true,
    }),
    signal: AbortSignal.timeout(20_000),
    redirect: 'error',
  })
  const { value, body } = await readJsonBounded(response, 'KOIOS_ACCOUNT_ADDRESSES')
  if (!Array.isArray(value)) throw new Error('KOIOS_ACCOUNT_ADDRESSES_SHAPE_INVALID')
  const account = value.find((row) => row && row.stake_address === stakeAddress)
  if (!account || !Array.isArray(account.addresses)) throw new Error('KOIOS_STAKE_ACCOUNT_NOT_RETURNED')
  const addresses = [...new Set(account.addresses)]
  if (addresses.length > MAX_PAYMENT_ADDRESSES) throw new Error('KOIOS_PAYMENT_ADDRESS_COUNT_LIMIT')
  for (const address of addresses) {
    if (typeof address !== 'string' || !address.startsWith('addr1')) {
      throw new Error('KOIOS_PAYMENT_ADDRESS_INVALID')
    }
  }
  return { addresses, responseSha256: sha256(body) }
}

export async function queryIogAddress(address, fetchFn = fetch) {
  if (typeof address !== 'string' || !address.startsWith('addr1')) throw new Error('IOG_PAYMENT_ADDRESS_INVALID')
  const url = IOG_BASE + '/withdrawal-history/' + encodeURIComponent(address)
  const response = await fetchFn(url, {
    method: 'GET',
    headers: { accept: 'application/json' },
    signal: AbortSignal.timeout(15_000),
    redirect: 'error',
  })
  const { value, body } = await readJsonBounded(response, 'IOG_WITHDRAWAL_HISTORY')
  if (!Array.isArray(value)) throw new Error('IOG_HISTORY_SHAPE_INVALID')
  const matches = value.filter((row) =>
    row && typeof row.cardanoBurnTxHash === 'string' &&
    TARGET_BURNS.includes(row.cardanoBurnTxHash.replace(/^0x/i, '').toLowerCase())
  )
  return {
    address,
    responseSha256: sha256(body),
    rowsReturned: value.length,
    matches: matches.map((row) => ({
      burnTxHash: row.cardanoBurnTxHash.replace(/^0x/i, '').toLowerCase(),
      amountRaw: typeof row.amount === 'string' ? row.amount : null,
      status: typeof row.status === 'string' ? row.status : null,
      ethereumTxHash: typeof row.ethereumTxHash === 'string' ? row.ethereumTxHash : null,
      confirmations: Number.isSafeInteger(row.confirmations) ? row.confirmations : null,
      createdAt: typeof row.createdAt === 'string' ? row.createdAt : null,
      lastError: typeof row.lastError === 'string' ? row.lastError.slice(0, 200) : null,
    })),
  }
}

export async function runProbe({ stakeAddress = STAKE_ADDRESS, fetchFn = fetch, now = () => new Date() } = {}) {
  const startedAt = now().toISOString()
  const resolved = await resolvePaymentAddresses(stakeAddress, fetchFn)
  const addressResults = []
  // Serial requests keep the observed, undocumented Portal endpoint load low.
  for (const address of resolved.addresses) {
    addressResults.push(await queryIogAddress(address, fetchFn))
  }
  const matches = addressResults.flatMap((result) =>
    result.matches.map((row) => ({ ...row, paymentAddress: result.address }))
  )
  const found = new Set(matches.map((row) => row.burnTxHash))
  const completedAt = now().toISOString()
  return {
    schema: 'immortal-usdcx-burn-iog-history-probe-readonly-v1',
    classification: 'READ_ONLY_PROVIDER_CORRELATION_NOT_RESERVE_OR_REDEMPTION_PROOF',
    network: 'cardano-mainnet',
    stakeAddress,
    targetBurnHashes: [...TARGET_BURNS],
    source: {
      koiosEndpoint: KOIOS_BASE + '/account_addresses',
      iogEndpointTemplate: IOG_BASE + '/withdrawal-history/{paymentAddress}',
      koiosResponseSha256: resolved.responseSha256,
    },
    startedAt,
    completedAt,
    paymentAddressCount: resolved.addresses.length,
    addressesQueried: addressResults,
    exactBurnMatches: matches,
    targetDisposition: TARGET_BURNS.map((burnTxHash) => ({
      burnTxHash,
      status: found.has(burnTxHash) ? 'IOG_ROW_FOUND_REQUIRES_INDEPENDENT_ETHEREUM_CREDIT_CHECK' : 'NO_EXACT_IOG_ROW_FOUND_FOR_RESOLVED_ADDRESSES',
    })),
    limitations: [
      'Koios account_addresses is a public indexer view and may not enumerate every historical payment address in all circumstances.',
      'IOG withdrawal-history is an observed Portal backend route, not a published/versioned third-party API contract.',
      'An IOG status or Ethereum hash is an operator claim; independently verify exact native USDC recipient credit on canonical Ethereum before treating a release as complete.',
      'No match does not prove no withdrawal; no balance, backing ratio, redemption, or under-collateralization conclusion is made.',
      'The probe is read-only: no wallet, signature, transaction, IOG POST, or state-changing request.',
    ],
  }
}

async function main() {
  const args = process.argv.slice(2)
  const outIndex = args.indexOf('--out')
  const outPath = resolve(outIndex >= 0 && args[outIndex + 1] ? args[outIndex + 1] : 'audit/oracles/usdcx-450k-iog-withdrawal-probe.json')
  const result = await runProbe()
  const serialized = JSON.stringify(result, null, 2) + '\n'
  await mkdir(dirname(outPath), { recursive: true })
  await writeFile(outPath, serialized, { mode: 0o600 })
  console.log(JSON.stringify({
    output: outPath,
    paymentAddressCount: result.paymentAddressCount,
    exactBurnMatches: result.exactBurnMatches.length,
    targetDisposition: result.targetDisposition,
    sha256: sha256(serialized),
  }, null, 2))
}

if (process.argv[1] && import.meta.url === new URL('file://' + resolve(process.argv[1])).href) {
  main().catch((error) => {
    console.error(JSON.stringify({ error: error?.message ?? 'UNKNOWN_ERROR' }))
    process.exitCode = 1
  })
}
