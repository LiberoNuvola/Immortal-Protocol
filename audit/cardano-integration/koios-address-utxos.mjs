const DEFAULT_PAGE_SIZE = 1000
const DEFAULT_MAX_PAGES = 100

/**
 * Fetch every UTxO for one address using Koios limit/offset pagination.
 * Fail closed on malformed responses, duplicate rows across pages, and
 * a pagination sequence that does not terminate within maxPages.
 */
export async function fetchAllAddressUtxos({
  baseUrl,
  address,
  fetchImpl = fetch,
  pageSize = DEFAULT_PAGE_SIZE,
  maxPages = DEFAULT_MAX_PAGES,
}) {
  if (typeof baseUrl !== 'string' || !baseUrl.trim()) {
    throw new Error('KOIOS_BASE_URL_INVALID')
  }
  if (typeof address !== 'string' || !address.trim()) {
    throw new Error('KOIOS_ADDRESS_INVALID')
  }
  if (!Number.isInteger(pageSize) || pageSize < 1 || pageSize > 1000) {
    throw new Error('KOIOS_PAGE_SIZE_INVALID')
  }
  if (!Number.isInteger(maxPages) || maxPages < 1) {
    throw new Error('KOIOS_MAX_PAGES_INVALID')
  }

  const rows = []
  const seenOutRefs = new Set()
  let pagesFetched = 0

  for (let page = 0; page < maxPages; page += 1) {
    const offset = page * pageSize
    const url = new URL(baseUrl.replace(/\/+$/, '') + '/address_utxos')
    url.searchParams.set('offset', String(offset))
    url.searchParams.set('limit', String(pageSize))
    url.searchParams.set('order', 'tx_hash.asc,tx_index.asc')

    const response = await fetchImpl(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ _addresses: [address] }),
    })
    if (!response.ok) {
      throw new Error('KOIOS_ADDRESS_UTXOS_HTTP_' + response.status)
    }

    const pageRows = await response.json()
    if (!Array.isArray(pageRows)) {
      throw new Error('KOIOS_ADDRESS_UTXOS_INVALID_RESPONSE')
    }
    pagesFetched += 1

    for (const row of pageRows) {
      if (!row || typeof row !== 'object' || typeof row.tx_hash !== 'string' || row.tx_index == null) {
        throw new Error('KOIOS_ADDRESS_UTXO_ROW_INVALID')
      }
      if (row.address !== address) {
        throw new Error('KOIOS_RETURNED_UTXO_FOR_UNEXPECTED_ADDRESS')
      }
      const outRef = String(row.tx_hash) + '#' + String(row.tx_index)
      if (seenOutRefs.has(outRef)) {
        throw new Error('KOIOS_ADDRESS_UTXOS_DUPLICATE_OUTREF')
      }
      seenOutRefs.add(outRef)
      rows.push(row)
    }

    if (pageRows.length < pageSize) {
      return { rows, pagesFetched, pageSize, complete: true }
    }
  }

  throw new Error('KOIOS_ADDRESS_UTXOS_PAGINATION_LIMIT_REACHED')
}
