export function sanitizeEvaluationDiagnosticText(value, maxLength = 320) {
  if (typeof value !== 'string') return null

  const sanitized = value
    .replace(/(?:0x)?[0-9a-f]{64,}/gi, '[HEX_REDACTED]')
    .replace(/\b(?:addr|stake)1[0-9a-z]{20,}\b/gi, '[ADDRESS_REDACTED]')
    .replace(/\bed25519e_sk[0-9A-Za-z]+\b/g, '[REDACTED_PRIVATE_KEY]')
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength)

  return sanitized || null
}
