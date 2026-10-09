import type { Script } from 'lucid-cardano'
import { applyScriptParams } from '../Adapter/CARDANO/serialization/ScriptSerialization'

export type V3CarrierFactoryEnvelope = {
  type: string
  cborHex: string
}

export async function loadV3CarrierValidatorFromDeployment(
  lucid: {
    utils: {
      validatorToAddress: (script: Script) => string
    }
  },
  options: {
    factoryUrl: string
    carrierPolicyId: string
    carrierTokenNameHex: string
    expectedCarrierAddress: string
  },
): Promise<Script> {
  if (!options.factoryUrl.trim()) {
    throw new Error('V3 carrier factory URL is required')
  }
  if (!options.carrierPolicyId.trim()) {
    throw new Error('V3 carrier policy ID is required')
  }
  if (!options.carrierTokenNameHex.trim()) {
    throw new Error('V3 carrier token name is required')
  }
  if (!options.expectedCarrierAddress.trim()) {
    throw new Error('V3 carrier address is required')
  }

  const response = await fetch(options.factoryUrl, {
    method: 'GET',
    headers: { accept: 'application/json' },
    cache: 'no-store',
  })
  if (!response.ok) {
    throw new Error('V3 carrier factory returned HTTP ' + response.status)
  }

  const envelope = (await response.json()) as V3CarrierFactoryEnvelope
  if (
    envelope.type !== 'PlutusScriptV2' ||
    typeof envelope.cborHex !== 'string' ||
    !/^[0-9a-fA-F]+$/.test(envelope.cborHex) ||
    envelope.cborHex.length === 0
  ) {
    throw new Error('V3 carrier factory artifact is invalid')
  }

  const script: Script = {
    type: 'PlutusV2',
    script: applyScriptParams(envelope.cborHex, [
      options.carrierPolicyId,
      options.carrierTokenNameHex,
    ]),
  }

  const derivedAddress = lucid.utils.validatorToAddress(script)
  if (derivedAddress !== options.expectedCarrierAddress) {
    throw new Error(
      'V3 carrier factory does not reconstruct the configured carrier address',
    )
  }

  return script
}
