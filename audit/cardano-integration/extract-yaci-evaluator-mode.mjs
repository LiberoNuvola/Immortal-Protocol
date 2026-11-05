export function extractYaciEvaluatorMode(log) {
  if (typeof log !== 'string') return 'NOT_RECORDED'

  const match = log.match(/Yaci Store tx evaluator mode:\s*([a-z]+)/i)
  return match ? match[1].toLowerCase() : 'NOT_RECORDED'
}
