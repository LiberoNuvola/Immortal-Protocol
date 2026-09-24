// relayer/loadValidator.js
const path = require('path')
const {
  loadScript: loadScriptFile,
} = require('../Adapter/CARDANO/serialization/loadScript')

function loadScript(relativePath) {
  const fullPath = path.resolve(__dirname, relativePath)
  return loadScriptFile(fullPath)
}

module.exports = {
  loadScript,
  TREASURY_SCRIPT_PATH:
    process.env.TREASURY_SCRIPT_PATH ||
    '../plutus/out/treasury.plutus.json',
}