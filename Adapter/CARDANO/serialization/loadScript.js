const fs = require('fs')

function loadScript(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8')
  const env = JSON.parse(raw)

  if (!env || typeof env.cborHex !== 'string' || env.cborHex.length === 0) {
    throw new Error(`Invalid script envelope at ${filePath}`)
  }

  if (env.type && env.type !== 'PlutusV2') {
    throw new Error(`Unsupported script type at ${filePath}: ${env.type}`)
  }

  return {
    type: 'PlutusV2',
    script: env.cborHex,
  }
}

module.exports = {
  loadScript,
}
