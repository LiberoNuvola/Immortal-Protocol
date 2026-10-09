import type {
  AuthoritativeIssueAdmissionProvider,
  AuthoritativeIssueAdmissionWitness,
} from './preRichIssueAdmissionBridge'

function reviveBigInt(_key: string, value: unknown): unknown {
  if (
    value &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    '__immortalBigInt' in value
  ) {
    const raw = (value as { __immortalBigInt?: unknown }).__immortalBigInt
    if (typeof raw !== 'string' || !/^-?\d+$/.test(raw)) {
      throw new Error('Invalid bigint transport value')
    }
    return BigInt(raw)
  }
  return value
}

export function createRemoteAuthoritativeIssueAdmissionProvider(
  endpoint: string,
): AuthoritativeIssueAdmissionProvider {
  if (!endpoint.trim()) {
    throw new Error('Issue admission endpoint is required')
  }

  return async (inputs) => {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
      },
      body: JSON.stringify(inputs, (_key, value) =>
        typeof value === 'bigint'
          ? value.toString()
          : value,
      ),
      cache: 'no-store',
    })

    if (!response.ok) {
      let detail = 'authoritative Issue admission endpoint returned HTTP ' + response.status
      try {
        const body = (await response.json()) as { error?: unknown }
        if (typeof body.error === 'string' && body.error.trim()) {
          detail += ': ' + body.error
        }
      } catch {
        // Preserve the HTTP failure when the response is not JSON.
      }
      throw new Error(detail)
    }

    const payload = JSON.parse(
      await response.text(),
      reviveBigInt,
    ) as {
      witness?: AuthoritativeIssueAdmissionWitness
    }

    if (!payload.witness || payload.witness.admitted !== true) {
      throw new Error('authoritative Issue admission endpoint returned no admitted witness')
    }

    return payload.witness
  }
}
