export function plutusConstr(value, label) {
  if (!value || typeof value !== 'object' ||
      !Number.isInteger(value.constructor) || !Array.isArray(value.fields)) {
    throw new Error('ORCFAX_INVALID_CONSTR:' + label)
  }
  return value
}

export function plutusBytes(value, label) {
  if (!value || typeof value !== 'object' || typeof value.bytes !== 'string' ||
      !/^(?:[0-9a-f]{2})*$/i.test(value.bytes)) {
    throw new Error('ORCFAX_INVALID_BYTES:' + label)
  }
  return value.bytes.toLowerCase()
}

export function plutusInt(value, label) {
  const raw = value && typeof value === 'object' && value.int !== undefined ? value.int : value
  if (!(typeof raw === 'string' || typeof raw === 'number' || typeof raw === 'bigint') ||
      !/^-?\d+$/.test(String(raw))) {
    throw new Error('ORCFAX_INVALID_INT:' + label)
  }
  return BigInt(raw)
}

export function decodeFspDatum(value) {
  const fsScriptHash = plutusBytes(value, 'FSP_DATUM_FS_SCRIPT_HASH')
  if (fsScriptHash.length !== 56) throw new Error('ORCFAX_FS_SCRIPT_HASH_LENGTH_INVALID')
  return { fsScriptHash }
}

export function decodeFsDatum(value) {
  const root = plutusConstr(value, 'Datum')
  if (root.constructor !== 0 || root.fields.length !== 2) {
    throw new Error('ORCFAX_DATUM_SHAPE_UNSUPPORTED')
  }
  const statement = plutusConstr(root.fields[0], 'Statement')
  if (statement.constructor !== 0 || statement.fields.length !== 3) {
    throw new Error('ORCFAX_STATEMENT_SHAPE_UNSUPPORTED')
  }
  const feedIdHex = plutusBytes(statement.fields[0], 'feed_id')
  const feedId = Buffer.from(feedIdHex, 'hex').toString('utf8')
  if (!feedId || !Buffer.from(feedId, 'utf8').equals(Buffer.from(feedIdHex, 'hex'))) {
    throw new Error('ORCFAX_FEED_ID_UTF8_INVALID')
  }
  const createdAtMs = plutusInt(statement.fields[1], 'created_at')
  const body = plutusConstr(statement.fields[2], 'Rational')
  if (body.constructor !== 0 || body.fields.length !== 2) {
    throw new Error('ORCFAX_RATIONAL_SHAPE_UNSUPPORTED')
  }
  const numerator = plutusInt(body.fields[0], 'Rational.num')
  const denominator = plutusInt(body.fields[1], 'Rational.denom')
  if (numerator <= 0n || denominator <= 0n) {
    throw new Error('ORCFAX_RATIONAL_NONPOSITIVE')
  }
  return {
    feedId,
    feedIdHex,
    createdAtMs,
    numerator,
    denominator,
    context: root.fields[1],
  }
}
