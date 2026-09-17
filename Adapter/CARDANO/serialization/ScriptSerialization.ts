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
  return {
    type: 'PlutusV2',
    script: env.cborHex,
  }
}

export function applyScriptParams(
  cborHex: string,
  params: Data[],
): string {
  return applyParamsToScript(
    cborHex,
    params,
  )
}