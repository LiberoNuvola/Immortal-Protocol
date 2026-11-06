// src/config.ts
// Public browser configuration only. Keep every import.meta.env access static:
// Vite must never receive a dynamic key lookup over its complete environment.
function env(key: string): string {
  switch (key) {
    case 'VITE_COUNTER_SCRIPT_ADDRESS': return import.meta.env?.VITE_COUNTER_SCRIPT_ADDRESS ?? ''
    case 'VITE_TREASURY_ADDRESS': return import.meta.env?.VITE_TREASURY_ADDRESS ?? ''
    case 'VITE_TICKET_POLICY_ID': return import.meta.env?.VITE_TICKET_POLICY_ID ?? ''
    case 'VITE_RELAYER_PKH': return import.meta.env?.VITE_RELAYER_PKH ?? ''
    case 'VITE_ORACLE_PUBLISHER_PKH': return import.meta.env?.VITE_ORACLE_PUBLISHER_PKH ?? ''
    case 'VITE_ORACLE_STATE_POLICY_ID': return import.meta.env?.VITE_ORACLE_STATE_POLICY_ID ?? ''
    case 'VITE_ORACLE_STATE_TOKEN_NAME_HEX': return import.meta.env?.VITE_ORACLE_STATE_TOKEN_NAME_HEX ?? ''
    case 'VITE_ORACLE_STATE_ADDRESS': return import.meta.env?.VITE_ORACLE_STATE_ADDRESS ?? ''
    case 'VITE_B1_POOL_TOKEN_POLICY_ID': return import.meta.env?.VITE_B1_POOL_TOKEN_POLICY_ID ?? ''
    case 'VITE_B1_POOL_TOKEN_NAME_HEX': return import.meta.env?.VITE_B1_POOL_TOKEN_NAME_HEX ?? ''
    case 'VITE_V3_CARRIER_ADDRESS': return import.meta.env?.VITE_V3_CARRIER_ADDRESS ?? ''
    case 'VITE_V3_CARRIER_POLICY_ID': return import.meta.env?.VITE_V3_CARRIER_POLICY_ID ?? ''
    case 'VITE_V3_CARRIER_TOKEN_NAME_HEX': return import.meta.env?.VITE_V3_CARRIER_TOKEN_NAME_HEX ?? ''
    case 'VITE_B2_CONTROL_ADDRESS': return import.meta.env?.VITE_B2_CONTROL_ADDRESS ?? ''
    case 'VITE_B2_CONTROL_POLICY_ID': return import.meta.env?.VITE_B2_CONTROL_POLICY_ID ?? ''
    case 'VITE_B2_CONTROL_TOKEN_NAME_HEX': return import.meta.env?.VITE_B2_CONTROL_TOKEN_NAME_HEX ?? ''
    case 'VITE_PRIZE_VALIDATOR_REFERENCE_ADDRESS': return import.meta.env?.VITE_PRIZE_VALIDATOR_REFERENCE_ADDRESS ?? ''
    case 'VITE_B1_PRIZE_POOL_REFERENCE_ADDRESS': return import.meta.env?.VITE_B1_PRIZE_POOL_REFERENCE_ADDRESS ?? ''
    case 'VITE_BLOCKFROST_PROXY_URL': return import.meta.env?.VITE_BLOCKFROST_PROXY_URL ?? ''
    case 'VITE_ISSUE_AUTHORITY_ENDPOINT': return import.meta.env?.VITE_ISSUE_AUTHORITY_ENDPOINT ?? ''
    case 'VITE_V3_CARRIER_FACTORY_URL': return import.meta.env?.VITE_V3_CARRIER_FACTORY_URL ?? ''
    default: return ''
  }
}
export const NETWORK = 'Preprod' as const
export const GENESIS_TICKET_PRICE_USDM = 100
export const TICKET_PAYMENT_LOVELACE = 1_000_000
export const COUNTER_SCRIPT_ADDRESS = env('VITE_COUNTER_SCRIPT_ADDRESS')
export const TREASURY_ADDRESS = env('VITE_TREASURY_ADDRESS')
export const SALE_ADDRESS = TREASURY_ADDRESS
export const TICKET_POLICY_ID = env('VITE_TICKET_POLICY_ID')
export const PRE_POLICY_ID = '1b29fda97d0fd321398c5b7b3285fdaadd519a0d002932853311f02c'
export const PRE_ASSET_NAME_HEX = '5052452d52494348'
export const RELAYER_PKH = env('VITE_RELAYER_PKH')
export const ORACLE_PUBLISHER_PKH = env('VITE_ORACLE_PUBLISHER_PKH')
export const ORACLE_STATE_POLICY_ID = env('VITE_ORACLE_STATE_POLICY_ID')
export const ORACLE_STATE_TOKEN_NAME_HEX = env('VITE_ORACLE_STATE_TOKEN_NAME_HEX')
export const ORACLE_STATE_ADDRESS = env('VITE_ORACLE_STATE_ADDRESS')
export const B1_POOL_TOKEN_POLICY_ID = env('VITE_B1_POOL_TOKEN_POLICY_ID')
export const B1_POOL_TOKEN_NAME_HEX = env('VITE_B1_POOL_TOKEN_NAME_HEX')
export const V3_CARRIER_ADDRESS = env('VITE_V3_CARRIER_ADDRESS')
export const V3_CARRIER_POLICY_ID = env('VITE_V3_CARRIER_POLICY_ID')
export const V3_CARRIER_TOKEN_NAME_HEX = env('VITE_V3_CARRIER_TOKEN_NAME_HEX')
export const B2_CONTROL_ADDRESS = env('VITE_B2_CONTROL_ADDRESS')
export const B2_CONTROL_POLICY_ID = env('VITE_B2_CONTROL_POLICY_ID')
export const B2_CONTROL_TOKEN_NAME_HEX = env('VITE_B2_CONTROL_TOKEN_NAME_HEX')
export const PRIZE_VALIDATOR_REFERENCE_ADDRESS = env('VITE_PRIZE_VALIDATOR_REFERENCE_ADDRESS')
export const B1_PRIZE_POOL_REFERENCE_ADDRESS = env('VITE_B1_PRIZE_POOL_REFERENCE_ADDRESS')
export const BLOCKFROST_PROXY_URL = env('VITE_BLOCKFROST_PROXY_URL')
export const ISSUE_AUTHORITY_ENDPOINT = env('VITE_ISSUE_AUTHORITY_ENDPOINT')
export const V3_CARRIER_FACTORY_URL = env('VITE_V3_CARRIER_FACTORY_URL')
