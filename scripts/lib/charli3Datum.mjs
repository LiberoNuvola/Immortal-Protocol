export function plutusConstr(value, label) {
  if (!value || typeof value !== 'object' || !Number.isInteger(value.constructor) || !Array.isArray(value.fields)) {
    throw new Error('CHARLI3_INVALID_CONSTR:' + label)
  }
  return value
}

function plutusMap(value, label) {
  if (!value || typeof value !== 'object' || !Array.isArray(value.map)) {
    throw new Error('CHARLI3_INVALID_MAP:' + label)
  }
  const result = new Map()
  for (const entry of value.map) {
    const key = entry?.k?.int
    if (key === undefined || !/^-?\d+$/.test(String(key))) throw new Error('CHARLI3_MAP_KEY_INVALID:' + label)
    const numericKey = Number(key)
    if (!Number.isSafeInteger(numericKey) || result.has(numericKey)) throw new Error('CHARLI3_MAP_KEY_DUPLICATE_OR_UNSAFE:' + label)
    result.set(numericKey, entry.v)
  }
  return result
}

function integer(value, label) {
  const raw = value && typeof value === 'object' ? value.int : undefined
  if (raw === undefined || !/^-?\d+$/.test(String(raw))) throw new Error('CHARLI3_INTEGER_INVALID:' + label)
  return BigInt(raw)
}

function bytes(value, label) {
  if (!value || typeof value !== 'object' || typeof value.bytes !== 'string' || !/^(?:[0-9a-f]{2})*$/i.test(value.bytes)) {
    throw new Error('CHARLI3_BYTES_INVALID:' + label)
  }
  return value.bytes.toLowerCase()
}

function textBytes(value, label) {
  const hex = bytes(value, label)
  const raw = Buffer.from(hex, 'hex')
  const text = raw.toString('utf8')
  if (!Buffer.from(text, 'utf8').equals(raw)) throw new Error('CHARLI3_UTF8_INVALID:' + label)
  return text
}

export function decodeCharli3Datum(value) {
  const root = plutusConstr(value, 'oracle_datum')
  if (root.constructor !== 0 || root.fields.length < 1 || root.fields.length > 3) {
    throw new Error('CHARLI3_ORACLE_DATUM_SHAPE_UNSUPPORTED')
  }
  let shared = new Map()
  let extended = null
  const priceMaps = []
  for (const [index, fieldValue] of root.fields.entries()) {
    const field = plutusConstr(fieldValue, 'oracle_datum_field_' + index)
    if (field.constructor === 0) {
      if (field.fields.length !== 1) throw new Error('CHARLI3_SHARED_DATA_SHAPE_UNSUPPORTED')
      shared = plutusMap(field.fields[0], 'shared_data')
    } else if (field.constructor === 2) {
      if (field.fields.length !== 1) throw new Error('CHARLI3_PRICE_DATA_SHAPE_UNSUPPORTED')
      const local = plutusMap(field.fields[0], 'price_data')
      const merged = new Map(shared)
      for (const [k, v] of local) merged.set(k, v)
      priceMaps.push(merged)
    } else if (field.constructor === 1) {
      if (field.fields.length !== 1) throw new Error('CHARLI3_EXTENDED_DATA_SHAPE_UNSUPPORTED')
      extended = plutusMap(field.fields[0], 'extended_data')
    } else {
      throw new Error('CHARLI3_ORACLE_FIELD_CONSTRUCTOR_UNSUPPORTED:' + field.constructor)
    }
  }
  if (priceMaps.length === 0) throw new Error('CHARLI3_PRICE_DATA_MISSING')
  const prices = priceMaps.map((map, index) => {
    const required = [0, 1, 2, 3]
    for (const key of required) if (!map.has(key)) throw new Error('CHARLI3_PRICE_MAP_REQUIRED_FIELD_MISSING:' + key)
    return {
      index,
      priceRaw: integer(map.get(0), 'price').toString(),
      timestampMs: integer(map.get(1), 'timestamp').toString(),
      expiryMs: integer(map.get(2), 'expiry').toString(),
      precision: Number(integer(map.get(3), 'precision')),
      baseIdHex: map.has(4) ? bytes(map.get(4), 'base_id') : null,
      quoteIdHex: map.has(5) ? bytes(map.get(5), 'quote_id') : null,
      baseSymbol: map.has(6) ? textBytes(map.get(6), 'base_symbol') : null,
      quoteSymbol: map.has(7) ? textBytes(map.get(7), 'quote_symbol') : null,
      baseName: map.has(8) ? textBytes(map.get(8), 'base_name') : null,
      quoteName: map.has(9) ? textBytes(map.get(9), 'quote_name') : null,
    }
  })
  const extendedData = extended ? {
    oracleProviderId: extended.has(0) ? integer(extended.get(0), 'oracle_provider_id').toString() : null,
    dataSourceCount: extended.has(1) ? integer(extended.get(1), 'data_source_count').toString() : null,
    dataSignatoriesCount: extended.has(2) ? integer(extended.get(2), 'data_signatories_count').toString() : null,
    oracleProviderSignatureHex: extended.has(3) ? bytes(extended.get(3), 'oracle_provider_signature') : null,
  } : null
  return { prices, extendedData }
}
