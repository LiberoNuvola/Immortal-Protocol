const endpointValue = process.env.VITE_ISSUE_AUTHORITY_ENDPOINT?.trim()
if (!endpointValue) {
  console.log('Issue authority is not configured; ticket issuance remains disabled.')
  process.exit(0)
}
const endpoint = new URL(endpointValue)
if (endpoint.protocol !== 'https:' || endpoint.username || endpoint.password || !/\/issue-admission$/.test(endpoint.pathname)) {
  throw new Error('VITE_ISSUE_AUTHORITY_ENDPOINT must be an HTTPS /issue-admission endpoint without embedded credentials')
}
const proxyValue = process.env.VITE_BLOCKFROST_PROXY_URL?.trim()
if (!proxyValue) throw new Error('Issue endpoint configured, but VITE_BLOCKFROST_PROXY_URL is missing')
const proxy = new URL(proxyValue)
if (proxy.protocol !== 'https:' || proxy.username || proxy.password || !/\/blockfrost\/?$/.test(proxy.pathname)) {
  throw new Error('VITE_BLOCKFROST_PROXY_URL must be an HTTPS /blockfrost endpoint without embedded credentials')
}
const required = [
  'VITE_COUNTER_SCRIPT_ADDRESS', 'VITE_TREASURY_ADDRESS', 'VITE_TICKET_POLICY_ID',
  'VITE_RELAYER_PKH', 'VITE_ORACLE_PUBLISHER_PKH', 'VITE_ORACLE_STATE_POLICY_ID',
  'VITE_ORACLE_STATE_TOKEN_NAME_HEX', 'VITE_ORACLE_STATE_ADDRESS',
  'VITE_B1_POOL_TOKEN_POLICY_ID', 'VITE_B1_POOL_TOKEN_NAME_HEX',
  'VITE_V3_CARRIER_ADDRESS', 'VITE_V3_CARRIER_POLICY_ID', 'VITE_V3_CARRIER_TOKEN_NAME_HEX',
  'VITE_B2_CONTROL_ADDRESS', 'VITE_B2_CONTROL_POLICY_ID', 'VITE_B2_CONTROL_TOKEN_NAME_HEX',
  'VITE_PRIZE_VALIDATOR_REFERENCE_ADDRESS', 'VITE_B1_PRIZE_POOL_REFERENCE_ADDRESS',
  'VITE_V3_CARRIER_FACTORY_URL',
]
const missing = required.filter((key) => !process.env[key]?.trim())
if (missing.length) throw new Error('Issue endpoint configured, but required public runtime variables are missing: ' + missing.join(', '))
console.log('Public runtime configuration validated (values redacted).')
