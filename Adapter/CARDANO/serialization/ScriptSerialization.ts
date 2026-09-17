import {
  applyParamsToScript,
  type Data,
  type Script,
} from 'lucid-cardano'

export type ScriptEnvelope = {
  type: string
  description?: string
  cborHex: string
}

export function toLucidScript(
  env: ScriptEnvelope,
): Script {
  if (!env || typeof env.cborHex !== 'string' || env.cborHex.length === 0) {
    throw new Error('Invalid Cardano script envelope')
  }

  return {
    type: 'PlutusV2',
    script: env.cborHex,
  }
}

export function applyScriptParams(
  cborHex: string,
  params: Data[],
): string {
  if (!cborHex) {
    throw new Error('Cannot parameterize an empty script')
  }

  return applyParamsToScript(cborHex, params)
}
