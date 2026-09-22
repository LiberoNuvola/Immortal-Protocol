/**
 * Cardano Lab compatibility probe.
 *
 * Purpose: verify that the current Yaci protocol parameters, including
 * post-upgrade Plutus cost-model vectors, can be consumed by Lucid Evolution.
 *
 * This is diagnostic only: it does not alter protocol semantics or submit a
 * transaction. It exists to separate the legacy-Lucid runtime blocker from
 * the underlying Yaci/Cardano environment before migrating the real trace.
 */

import { Blockfrost, Lucid } from '@lucid-evolution/lucid'

const API = 'http://127.0.0.1:8080/api/v1'
const SEED =
  'test test test test test test test test test test test test test test test test test test test test test test test sauce'

const provider = new Blockfrost(API, '')
const protocolParameters = await provider.getProtocolParameters()

const costModelLengths = Object.fromEntries(
  Object.entries(protocolParameters.costModels ?? {}).map(([key, value]) => [
    key,
    Array.isArray(value) ? value.length : typeof value,
  ]),
)

console.log(JSON.stringify({
  probe: 'lucid-evolution-yaci-cost-model-compatibility',
  costModelLengths,
}, null, 2))

const lucid = await Lucid(provider, 'Preprod')
lucid.selectWallet.fromSeed(SEED)

const address = await lucid.wallet().address()

console.log(JSON.stringify({
  initialized: true,
  address,
  costModelLengths,
}, null, 2))
