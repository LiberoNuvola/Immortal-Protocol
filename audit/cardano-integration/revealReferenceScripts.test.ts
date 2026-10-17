/**
 * Deterministic, ledger-free checks of the Reveal reference-script path.
 *
 * Everything here runs against the pinned @lucid-evolution/lucid build and the
 * real PrizeValidator / B1PrizePool scripts from src/plutusScripts. Only the
 * provider is mocked (UTxO set, protocol parameters, constant execution units).
 * Assertions are made on decoded transaction CBOR, never on log strings.
 *
 * What this does NOT prove: ledger acceptance or script execution. That is the
 * job of the Yaci/Ogmios Reveal trace.
 */
import { describe, expect, it } from 'vitest'
import {
  CML,
  Constr,
  Data,
  Lucid,
  PROTOCOL_PARAMETERS_DEFAULT,
  generateSeedPhrase,
  getAddressDetails,
  validatorToAddress,
  validatorToScriptHash,
  type Provider,
  type Script,
  type UTxO,
} from '@lucid-evolution/lucid'

import { buildScriptsFromLucid } from '../../src/loadValidator'
import { defaultPrizeTable } from '../../src/gameRules'
import {
  assertRevealUsesReferenceScripts,
  bindPublishedReferenceScript,
} from './revealReferenceScripts'

const MAX_TX_SIZE = 16_384
const POLICY = 'aa'.repeat(28)
const KEY_HASH = 'bb'.repeat(28)

const prizeRedeemer = Data.to(1n)
const poolRedeemer = Data.to(2n)
const postPrizeDatum = Data.to(new Constr(0, [3n]))
const postPoolDatum = Data.to(new Constr(0, [4n]))

function legacyToEvolution(script: { type: string; script: string }): Script {
  return { type: script.type, script: script.script } as Script
}

const legacyScripts: any = buildScriptsFromLucid(
  {
    utils: {
      validatorToScriptHash: validatorToScriptHash as any,
      mintingPolicyToId: (() => POLICY) as any,
      validatorToAddress: ((s: Script) => validatorToAddress('Preprod', s)) as any,
    },
  } as any,
  defaultPrizeTable,
  KEY_HASH,
  POLICY,
  '4f52',
  POLICY,
  '504f4f4c',
)
const prizeScript = legacyToEvolution(legacyScripts.prizeValidator)
const poolScript = legacyToEvolution(legacyScripts.b1PrizePool)
const prizeAddress = validatorToAddress('Preprod', prizeScript)
const poolAddress = validatorToAddress('Preprod', poolScript)

const scriptBytes = (script: Script) => script.script.length / 2

function utxo(fill: string, index: number, address: string, extra: Partial<UTxO> = {}): UTxO {
  return {
    txHash: fill.repeat(32),
    outputIndex: index,
    address,
    assets: { lovelace: 50_000_000n },
    ...extra,
  }
}

function redeemerCount(txCbor: string): number {
  const redeemers: any = CML.Transaction.from_cbor_hex(txCbor).witness_set().redeemers()
  if (!redeemers) return 0
  const legacy = redeemers.as_arr_legacy_redeemer?.()
  if (legacy) return Number(legacy.len())
  return Number(redeemers.as_map_redeemer_key_to_redeemer_val().len())
}

type Mode = 'refs' | 'noScriptRef' | 'swappedScriptRef' | 'attachOnly' | 'noScriptRefAttach'

async function world(maxTxSize = MAX_TX_SIZE) {
  const utxosByAddress = new Map<string, UTxO[]>()
  const provider = {
    getProtocolParameters: async () => ({ ...PROTOCOL_PARAMETERS_DEFAULT, maxTxSize }),
    getUtxos: async (address: any) => utxosByAddress.get(address as string) ?? [],
    getUtxosWithUnit: async () => [],
    getUtxoByUnit: async () => {
      throw new Error('not supported')
    },
    getUtxosByOutRef: async () => [],
    getDelegation: async () => ({ poolId: null, rewards: 0n }),
    getDatum: async () => {
      throw new Error('not supported')
    },
    awaitTx: async () => true,
    submitTx: async () => '00'.repeat(32),
    // Constant execution units: this suite checks transaction shape, not script execution.
    evaluateTx: async (tx: string) =>
      Array.from({ length: redeemerCount(tx) }, (_, i) => ({
        redeemer_tag: 'spend',
        redeemer_index: i,
        ex_units: { mem: 1_000_000, steps: 500_000_000 },
      })),
  } as unknown as Provider

  const seed = generateSeedPhrase()
  const lucid = await Lucid(provider, 'Preprod')
  lucid.selectWallet.fromSeed(seed)
  const walletAddress = await lucid.wallet().address()
  const referenceLucid = await Lucid(provider, 'Preprod')
  referenceLucid.selectWallet.fromSeed(seed, { accountIndex: 1 })
  const referenceAddress = await referenceLucid.wallet().address()
  expect(referenceAddress).not.toBe(walletAddress)

  const prizeUtxo = utxo('01', 0, prizeAddress, { datum: Data.to(new Constr(0, [])) })
  const poolUtxo = utxo('02', 0, poolAddress, { datum: Data.to(new Constr(0, [])) })
  utxosByAddress.set(walletAddress, [utxo('05', 0, walletAddress, { assets: { lovelace: 100_000_000n } })])
  utxosByAddress.set(prizeAddress, [prizeUtxo])
  utxosByAddress.set(poolAddress, [poolUtxo])

  /** Build a real publication transaction and return it with the UTxO it creates. */
  async function publish(script: Script) {
    const tx: any = await lucid
      .newTx()
      .pay.ToAddressWithData(referenceAddress, undefined, { lovelace: 2_000_000n }, script)
      .complete({ localUPLCEval: false })
    const cbor: string = tx.toCBOR()
    const body = CML.Transaction.from_cbor_hex(cbor).body()
    const outputs = body.outputs()
    let scriptOutputIndex = -1
    for (let i = 0; i < Number(outputs.len()); i++) {
      if (outputs.get(i).script_ref()) scriptOutputIndex = i
    }
    expect(scriptOutputIndex).toBeGreaterThanOrEqual(0)
    const output = outputs.get(scriptOutputIndex)
    return {
      cbor,
      utxo: utxo('00', scriptOutputIndex, referenceAddress, {
        txHash: CML.hash_transaction(body).to_hex(),
        assets: { lovelace: BigInt(output.amount().coin()) },
        scriptRef: script,
      }),
    }
  }

  const prizePublication = await publish(prizeScript)
  const poolPublication = await publish(poolScript)

  function bound() {
    return {
      prize: bindPublishedReferenceScript({
        purpose: 'PrizeValidator',
        publishedTxCbor: prizePublication.cbor,
        expectedScript: prizeScript,
        referenceAddress,
        utxo: prizePublication.utxo,
      }),
      pool: bindPublishedReferenceScript({
        purpose: 'B1PrizePool',
        publishedTxCbor: poolPublication.cbor,
        expectedScript: poolScript,
        referenceAddress,
        utxo: poolPublication.utxo,
      }),
    }
  }

  /** Same builder shape as audit/cardano-integration/reveal-ledger-trace.ts. */
  async function buildReveal(mode: Mode): Promise<string> {
    const { prize, pool } = bound()
    const withoutScriptRef = (u: UTxO): UTxO => {
      const { scriptRef: _drop, ...rest } = u
      return rest
    }
    let refs: UTxO[]
    switch (mode) {
      case 'refs':
        refs = [prize, pool]
        break
      case 'noScriptRef':
      case 'noScriptRefAttach':
        refs = [withoutScriptRef(prize), withoutScriptRef(pool)]
        break
      case 'swappedScriptRef':
        // Prize reference output claims to carry the pool script: PrizeValidator is then unresolved.
        refs = [{ ...prize, scriptRef: poolScript }, pool]
        break
      case 'attachOnly':
        refs = []
        break
    }
    let builder = lucid.newTx()
    if (refs.length > 0) builder = builder.readFrom(refs)
    if (mode === 'attachOnly' || mode === 'noScriptRefAttach') {
      builder = builder.attach.SpendingValidator(prizeScript).attach.SpendingValidator(poolScript)
    }
    const tx: any = await builder
      .collectFrom([prizeUtxo], prizeRedeemer)
      .collectFrom([poolUtxo], poolRedeemer)
      .pay.ToContract(prizeAddress, { kind: 'inline', value: postPrizeDatum }, { lovelace: 50_000_000n })
      .pay.ToContract(poolAddress, { kind: 'inline', value: postPoolDatum }, { lovelace: 50_000_000n })
      .addSigner(walletAddress)
      .complete({ localUPLCEval: false })
    return tx.toCBOR()
  }

  const expectation = (references: Array<{ txHash: string; index: number }>, size = MAX_TX_SIZE) => ({
    maxTxSize: size,
    references,
    spends: [
      { txHash: prizeUtxo.txHash, index: prizeUtxo.outputIndex, redeemerCbor: prizeRedeemer },
      { txHash: poolUtxo.txHash, index: poolUtxo.outputIndex, redeemerCbor: poolRedeemer },
    ],
    outputs: [
      { address: prizeAddress, inlineDatumCbor: postPrizeDatum },
      { address: poolAddress, inlineDatumCbor: postPoolDatum },
    ],
  })

  return {
    prizePublication,
    poolPublication,
    prizeUtxo,
    poolUtxo,
    referenceAddress,
    bound,
    buildReveal,
    expectation,
  }
}

describe('Reveal reference-script path (pinned Lucid, real validators)', () => {
  it('documents the structural problem: the two validators only fit together by reference', () => {
    const total = scriptBytes(prizeScript) + scriptBytes(poolScript)
    expect(total).toBeGreaterThan(MAX_TX_SIZE)
    expect(scriptBytes(prizeScript)).toBeLessThan(MAX_TX_SIZE)
    expect(scriptBytes(poolScript)).toBeLessThan(MAX_TX_SIZE)
  })

  it('binds each reference UTxO to its exact published output and expected script hash', async () => {
    const w = await world()
    const { prize, pool } = w.bound()
    expect(validatorToScriptHash(prize.scriptRef as Script)).toBe(validatorToScriptHash(prizeScript))
    expect(validatorToScriptHash(pool.scriptRef as Script)).toBe(validatorToScriptHash(poolScript))
    expect(validatorToScriptHash(prize.scriptRef as Script)).not.toBe(validatorToScriptHash(pool.scriptRef as Script))
  })

  it('selects reference-script witnesses, matches each spending purpose, and fits the size limit', async () => {
    const w = await world()
    const { prize, pool } = w.bound()
    const cbor = await w.buildReveal('refs')

    const evidence = assertRevealUsesReferenceScripts(
      cbor,
      w.expectation([
        { txHash: prize.txHash, index: prize.outputIndex },
        { txHash: pool.txHash, index: pool.outputIndex },
      ]),
    )

    // Actual serialized CBOR size, measured on the built transaction.
    expect(cbor.length / 2).toBe(evidence.bytes)
    expect(evidence.bytes).toBeLessThanOrEqual(MAX_TX_SIZE)
    // No validator bytes are embedded anywhere in the witness set or the transaction.
    expect(evidence.embeddedScriptTotal).toBe(0)
    expect(cbor).not.toContain(prizeScript.script)
    expect(cbor).not.toContain(poolScript.script)

    // Each spending input's script credential is served by the reference UTxO of the same identity.
    const credentialHash = (address: string) => getAddressDetails(address).paymentCredential?.hash
    expect(credentialHash(w.prizeUtxo.address)).toBe(validatorToScriptHash(prize.scriptRef as Script))
    expect(credentialHash(w.poolUtxo.address)).toBe(validatorToScriptHash(pool.scriptRef as Script))
    expect(evidence.referenceInputs).toEqual(
      [`${prize.txHash}#${prize.outputIndex}`, `${pool.txHash}#${pool.outputIndex}`].sort(),
    )
    expect(evidence.redeemers).toHaveLength(2)
  })

  it('reproduces the original failure when scripts are attached instead of referenced', async () => {
    const w = await world()
    // Lucid's own guard must still fire: nothing disables or relaxes it.
    await expect(w.buildReveal('attachOnly')).rejects.toThrow(/Max transaction size of 16384 exceeded/)
  })

  it('fails closed when reference UTxOs do not carry the spending validators', async () => {
    const w = await world()
    await expect(w.buildReveal('noScriptRef')).rejects.toThrow(/MISSING_SCRIPT/)
    await expect(w.buildReveal('swappedScriptRef')).rejects.toThrow(/MISSING_SCRIPT/)
    // Without a usable reference, attaching the scripts must hit the size guard, never succeed silently.
    await expect(w.buildReveal('noScriptRefAttach')).rejects.toThrow(/Max transaction size of 16384 exceeded/)
  })

  it('rejects publication bindings that do not match the accepted publishing transaction', async () => {
    const w = await world()
    const base = {
      purpose: 'PrizeValidator' as const,
      publishedTxCbor: w.prizePublication.cbor,
      expectedScript: prizeScript,
      referenceAddress: w.referenceAddress,
      utxo: w.prizePublication.utxo,
    }
    expect(() => bindPublishedReferenceScript(base)).not.toThrow()
    expect(() => bindPublishedReferenceScript({ ...base, publishedTxCbor: 'zz' })).toThrow(/invalid publishing transaction CBOR/)
    expect(() => bindPublishedReferenceScript({ ...base, utxo: { ...base.utxo, txHash: '11'.repeat(32) } })).toThrow(
      /not an output of the publishing transaction/,
    )
    expect(() => bindPublishedReferenceScript({ ...base, utxo: { ...base.utxo, outputIndex: 99 } })).toThrow(
      /outside the publishing transaction/,
    )
    // The change output carries no script.
    expect(() =>
      bindPublishedReferenceScript({ ...base, utxo: { ...base.utxo, outputIndex: base.utxo.outputIndex === 0 ? 1 : 0 } }),
    ).toThrow(/reference script hash mismatch/)
    // Pool script offered as the Prize validator.
    expect(() => bindPublishedReferenceScript({ ...base, expectedScript: poolScript })).toThrow(/reference script hash mismatch/)
    expect(() => bindPublishedReferenceScript({ ...base, referenceAddress: prizeAddress })).toThrow(/reference address mismatch/)
    // A provider scriptRef that contradicts the published bytes is never trusted.
    expect(() => bindPublishedReferenceScript({ ...base, utxo: { ...base.utxo, scriptRef: poolScript } })).toThrow(
      /provider scriptRef contradicts/,
    )
  })

  it('rejects a Reveal transaction that embeds validators, mismatches references, or drifts from its semantics', async () => {
    // Relaxed provider limit only so that an embedded-script transaction can be built for inspection.
    const relaxed = await world(100_000)
    const embedded = await relaxed.buildReveal('attachOnly')
    const refsOfPublication = [
      { txHash: relaxed.prizePublication.utxo.txHash, index: relaxed.prizePublication.utxo.outputIndex },
      { txHash: relaxed.poolPublication.utxo.txHash, index: relaxed.poolPublication.utxo.outputIndex },
    ]
    expect(embedded.length / 2).toBeGreaterThan(MAX_TX_SIZE)
    expect(() => assertRevealUsesReferenceScripts(embedded, relaxed.expectation(refsOfPublication))).toThrow(/exceeds maxTxSize/)

    // Reference inputs present but without usable scripts: Lucid embeds them. Even when the size
    // limit is relaxed, the witness-set check must still reject the embedded validators.
    const referencedButEmbedded = await relaxed.buildReveal('noScriptRefAttach')
    expect(() =>
      assertRevealUsesReferenceScripts(referencedButEmbedded, relaxed.expectation(refsOfPublication, 100_000)),
    ).toThrow(/embeds Plutus validator bytes/)

    const w = await world()
    const refs = [
      { txHash: w.prizePublication.utxo.txHash, index: w.prizePublication.utxo.outputIndex },
      { txHash: w.poolPublication.utxo.txHash, index: w.poolPublication.utxo.outputIndex },
    ]
    const good = await w.buildReveal('refs')
    expect(() => assertRevealUsesReferenceScripts(good, w.expectation(refs))).not.toThrow()
    expect(() => assertRevealUsesReferenceScripts(good, w.expectation(refs.slice(0, 1)))).toThrow(/reference inputs mismatch/)
    expect(() => assertRevealUsesReferenceScripts(good, w.expectation(refs, 100))).toThrow(/exceeds maxTxSize/)
    expect(() =>
      assertRevealUsesReferenceScripts(good, {
        ...w.expectation(refs),
        spends: w.expectation(refs).spends.map((s, i) => (i === 0 ? { ...s, redeemerCbor: Data.to(9n) } : s)),
      }),
    ).toThrow(/unexpected spending redeemer/)
    expect(() =>
      assertRevealUsesReferenceScripts(good, {
        ...w.expectation(refs),
        outputs: [{ address: prizeAddress, inlineDatumCbor: Data.to(new Constr(0, [99n])) }],
      }),
    ).toThrow(/continuing output missing or datum mismatch/)
  })
})
