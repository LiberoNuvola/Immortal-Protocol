const http = require('node:http')
const { Blockfrost, Lucid } = require('lucid-cardano')

const ROUTE = '/issue-admission'

function requiredAny(...names) {
  for (const name of names) {
    const value = process.env[name]?.trim()
    if (value) return value
  }
  throw new Error(names.join(' or ') + ' is required')
}

function parseBigInt(value, field) {
  if (value === undefined || value === null || value === '') {
    return undefined
  }
  try {
    return BigInt(String(value))
  } catch {
    throw new Error(field + ' must be an integer')
  }
}

function exactRef(value, field) {
  const ref = String(value ?? '').trim()
  if (!/^[0-9a-fA-F]{64}#[0-9]+$/.test(ref)) {
    throw new Error(field + ' must be an exact txHash#outputIndex reference')
  }
  return ref
}

function requiredInteger(value, field, min, max) {
  let n
  try {
    n = BigInt(String(value))
  } catch {
    throw new Error(field + ' must be an integer')
  }
  if (n < BigInt(min) || n > BigInt(max)) {
    throw new Error(field + ' is outside the supported Issue coordinate range')
  }
  return n
}

function jsonReplacer(_key, value) {
  return typeof value === 'bigint'
    ? { __immortalBigInt: value.toString() }
    : value
}

async function readJsonBody(req, maxBytes) {
  const chunks = []
  let size = 0

  for await (const chunk of req) {
    size += chunk.length
    if (size > maxBytes) {
      throw new Error('Issue admission request is too large')
    }
    chunks.push(chunk)
  }

  const raw = Buffer.concat(chunks).toString('utf8')
  if (!raw.trim()) throw new Error('Issue admission request body is empty')
  try {
    return JSON.parse(raw)
  } catch {
    throw new Error('Issue admission request body is invalid JSON')
  }
}

function writeJson(res, statusCode, body, origin) {
  res.statusCode = statusCode
  res.setHeader('content-type', 'application/json; charset=utf-8')
  res.setHeader('cache-control', 'no-store')
  if (origin) {
    res.setHeader('access-control-allow-origin', origin)
    res.setHeader('vary', 'Origin')
  }
  res.end(JSON.stringify(body, jsonReplacer))
}

function validateRequest(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new Error('Issue admission request must be an object')
  }

  const classId = requiredInteger(body.classId, 'classId', 0, 7)
  const price = parseBigInt(body.price, 'price')
  if (price === undefined || price <= 0n) {
    throw new Error('price must be a positive integer')
  }

  const counterInputReference = exactRef(
    body.counterInputReference,
    'counterInputReference',
  )
  const controlStateReference = exactRef(
    body.controlStateReference,
    'controlStateReference',
  )
  const poolInputReference = exactRef(
    body.poolInputReference,
    'poolInputReference',
  )
  const carrierStateReference = exactRef(
    body.carrierStateReference,
    'carrierStateReference',
  )

  if (
    !Array.isArray(body.liquiditySourceReferences) ||
    body.liquiditySourceReferences.length === 0
  ) {
    throw new Error('liquiditySourceReferences must be a non-empty array')
  }

  const liquiditySourceReferences =
    body.liquiditySourceReferences.map((value, index) =>
      exactRef(value, 'liquiditySourceReferences[' + index + ']'),
    )

  if (!liquiditySourceReferences.includes(poolInputReference)) {
    throw new Error('Pool input must be included in liquiditySourceReferences')
  }

  return {
    counterInputReference,
    controlStateReference,
    poolInputReference,
    carrierStateReference,
    liquiditySourceReferences,
    classId,
    price,
    ...(parseBigInt(body.poolUsdmValue, 'poolUsdmValue') === undefined
      ? {}
      : { poolUsdmValue: parseBigInt(body.poolUsdmValue, 'poolUsdmValue') }),
  }
}

async function createProvider() {
  const { createPreprodAuthoritativeIssueProvider } = await import(
    '../Adapter/CARDANO/observation/PreprodAuthoritativeIssueProvider.ts'
  )

  const projectId = requiredAny(
    'BLOCKFROST_PROJECT_ID',
    'VITE_BLOCKFROST_PROJECT_ID',
  )
  const authorityUrl = requiredAny(
    'ISSUE_AUTHORITY_SOURCE_URL',
    'ISSUE_AUTHORITY_URL',
  )
  const authorityPublicKeyPem = requiredAny('ISSUE_AUTHORITY_PUBLIC_KEY')
  const directUsdmUnit = requiredAny(
    'DIRECT_USDM_UNIT',
    'PREPROD_TUSDM_UNIT',
  )
  const counterAddress = requiredAny(
    'COUNTER_SCRIPT_ADDRESS',
    'VITE_COUNTER_SCRIPT_ADDRESS',
  )
  const b1PrizePoolAddress = requiredAny(
    'B1_PRIZE_POOL_ADDRESS',
    'VITE_B1_PRIZE_POOL_ADDRESS',
  )
  const poolTokenPolicyId = requiredAny(
    'B1_POOL_TOKEN_POLICY_ID',
    'VITE_B1_POOL_TOKEN_POLICY_ID',
  )
  const poolTokenNameHex = requiredAny(
    'B1_POOL_TOKEN_NAME_HEX',
    'VITE_B1_POOL_TOKEN_NAME_HEX',
  )
  const carrierAddress = requiredAny('V3_CARRIER_ADDRESS', 'VITE_V3_CARRIER_ADDRESS')
  const carrierPolicyId = requiredAny(
    'V3_CARRIER_POLICY_ID',
    'VITE_V3_CARRIER_POLICY_ID',
  )
  const carrierTokenNameHex = requiredAny(
    'V3_CARRIER_TOKEN_NAME_HEX',
    'VITE_V3_CARRIER_TOKEN_NAME_HEX',
  )
  const controlAddress = requiredAny(
    'B2_CONTROL_ADDRESS',
    'VITE_B2_CONTROL_ADDRESS',
  )
  const controlPolicyId = requiredAny(
    'B2_CONTROL_POLICY_ID',
    'VITE_B2_CONTROL_POLICY_ID',
  )
  const controlTokenNameHex = requiredAny(
    'B2_CONTROL_TOKEN_NAME_HEX',
    'VITE_B2_CONTROL_TOKEN_NAME_HEX',
  )

  const provider = new Blockfrost(
    process.env.BLOCKFROST_PREPROD_URL ||
      'https://cardano-preprod.blockfrost.io/api/v0',
    projectId,
  )
  const lucid = await Lucid.new(provider, 'Preprod')

  const command = process.env.ISSUE_ADMISSION_COMMAND?.trim() || 'cabal'
  let args = ['run', 'issue-admission', '--', '--json']
  if (process.env.ISSUE_ADMISSION_ARGS_JSON?.trim()) {
    const parsed = JSON.parse(process.env.ISSUE_ADMISSION_ARGS_JSON)
    if (!Array.isArray(parsed) || parsed.some((value) => typeof value !== 'string')) {
      throw new Error('ISSUE_ADMISSION_ARGS_JSON must be an array of strings')
    }
    args = parsed
  }

  return createPreprodAuthoritativeIssueProvider({
    lucid,
    deployment: {
      counterAddress,
      b1PrizePoolAddress,
      poolTokenUnit: poolTokenPolicyId + poolTokenNameHex,
      carrierAddress,
      carrierPolicyId,
      carrierTokenNameHex,
      controlAddress,
      controlPolicyId,
      controlTokenNameHex,
    },
    authorityUrl,
    authorityPublicKeyPem,
    directUsdmUnit,
    command,
    args,
  })
}

async function start() {
  const allowedOrigin = requiredAny('ISSUE_AUTHORITY_CORS_ORIGIN')
  if (allowedOrigin === '*') {
    throw new Error('ISSUE_AUTHORITY_CORS_ORIGIN must be an exact origin, not *')
  }

  const port = Number(process.env.ISSUE_AUTHORITY_PORT || 8787)
  if (!Number.isInteger(port) || port <= 0 || port > 65535) {
    throw new Error('ISSUE_AUTHORITY_PORT must be a valid TCP port')
  }

  const maxBodyBytes = Number(process.env.ISSUE_AUTHORITY_MAX_BODY_BYTES || 262144)
  if (!Number.isInteger(maxBodyBytes) || maxBodyBytes <= 0) {
    throw new Error('ISSUE_AUTHORITY_MAX_BODY_BYTES must be a positive integer')
  }

  const provider = await createProvider()

  const server = http.createServer(async (req, res) => {
    const origin = req.headers.origin

    if (origin && origin !== allowedOrigin) {
      writeJson(res, 403, { error: 'Origin is not authorized' })
      return
    }

    if (req.method === 'OPTIONS' && req.url === ROUTE) {
      if (origin !== allowedOrigin) {
        writeJson(res, 403, { error: 'Origin is not authorized' })
        return
      }
      res.statusCode = 204
      res.setHeader('access-control-allow-origin', allowedOrigin)
      res.setHeader('access-control-allow-methods', 'POST, OPTIONS')
      res.setHeader('access-control-allow-headers', 'content-type')
      res.setHeader('cache-control', 'no-store')
      res.end()
      return
    }

    if (req.method === 'GET' && req.url === '/healthz') {
      writeJson(res, 200, { status: 'ready', service: 'pre-rich-issue-authority' }, origin)
      return
    }

    if (req.method !== 'POST' || req.url !== ROUTE) {
      writeJson(res, 404, { error: 'Not found' }, origin)
      return
    }

    if (origin !== allowedOrigin) {
      writeJson(res, 403, { error: 'Origin is not authorized' })
      return
    }

    try {
      const body = await readJsonBody(req, maxBodyBytes)
      const inputs = validateRequest(body)
      const witness = await provider(inputs)
      writeJson(res, 200, { witness }, allowedOrigin)
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      writeJson(res, 409, { error: message }, allowedOrigin)
    }
  })

  server.listen(port, () => {
    console.log(
      JSON.stringify({
        service: 'pre-rich-issue-authority',
        route: ROUTE,
        port,
        allowedOrigin,
        network: 'cardano-preprod',
      }),
    )
  })
}

start().catch((error) => {
  console.error(error)
  process.exit(1)
})
