const fs = require('fs')

function loadScript(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8')
  const env = JSON.parse(raw)

  if (!env || typeof env.cborHex !== 'string') {
    throw new Error(`Invalid script envelope at ${filePath}`)
  }

  return {
    type: 'PlutusV2',
    script: env.cborHex,
  }
}

module.exports = {
  loadScript,
}