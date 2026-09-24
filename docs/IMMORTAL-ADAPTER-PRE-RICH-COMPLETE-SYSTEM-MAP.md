# IMMORTAL → Cardano Adapter → PRE-RICH — Complete System Map

## 1. Scopo e status

Questo documento fornisce la mappa end-to-end del sistema, collegando i tre livelli documentali principali e il ledger Cardano. È un documento integrativo di orientamento: non sostituisce le costituzioni, i kernel economici, le specifiche normative o i documenti di conformance dei singoli componenti.

Il principio fondamentale è la separazione delle responsabilità:

- **IMMORTAL** definisce la semantica economica universale e l'ammissibilità delle transizioni.
- **Cardano Adapter** traduce, realizza, osserva e trasporta evidenza sul confine con Cardano.
- **PRE-RICH** specializza IMMORTAL in una specifica applicazione di gioco e definisce le proprie regole applicative.
- **Cardano ledger** esegue effettivamente transazioni e script secondo le proprie regole.

Una decisione applicativa non può diventare automaticamente una decisione economica, e una capacità tecnica del ledger non può diventare automaticamente un'autorizzazione economica.

## 2. Modello dello stack

```text
┌─────────────────────────────────────────────────────────────┐
│ IMMORTAL                                                   │
│ Universal economic semantics / normative kernel            │
│ State • Obligations • ProtectedCapital • EEV • Ω           │
│ post-state safety • viability • atomicity • expiry         │
└──────────────────────────────┬──────────────────────────────┘
                               │ economic admissibility
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ PRE-RICH                                                    │
│ Application specialization                                  │
│ USDM • classes • Classic-6 • ticket lifecycle • jackpot     │
│ genesis profile • beacon model • application governance    │
└──────────────────────────────┬──────────────────────────────┘
                               │ application intent
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ CARDANO ADAPTER                                              │
│ Translation • realization • observation • evidence           │
│ UTxO • datum • redeemer • assets • tx construction           │
│ feasibility • execution • refinement • settlement mechanics │
└──────────────────────────────┬──────────────────────────────┘
                               │ concrete transaction
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ CARDANO LEDGER                                               │
│ Actual UTxO state transition and script execution            │
└──────────────────────────────┬──────────────────────────────┘
                               │ observed execution/evidence
                               └───────────────► back upward
```

Il flusso non è quindi soltanto top-down. L'evidenza prodotta dal livello di esecuzione ritorna verso i livelli superiori per la verifica e la conformance.

## 3. Responsabilità normative

### IMMORTAL

IMMORTAL è il livello chain-agnostic. È responsabile della semantica economica comune: stato canonico, obbligazioni, esposizioni irrisolte, capitale protetto, EEV, EffectiveLiquidity, vincoli di sicurezza sullo stato successivo, viability, derivazioni deterministiche, atomicità, finalità dell'expiry, distinzione tra stato corrente e stato storico e confini di governance e liveness.

IMMORTAL non conosce Cardano, UTxO, datum CBOR o una specifica lotteria.

### Cardano Adapter

L'Adapter è il confine di realizzazione. Gestisce UTxO, input/output, datum e redeemer, native asset, validity intervals, reference inputs, costruzione e sottomissione delle transazioni, osservazione del ledger, normalizzazione dell'evidenza e traduzione tra fatti osservabili e strutture usate per la conformance.

L'Adapter può determinare se un'azione richiesta è concretamente realizzabile su Cardano e può produrre una prova di ciò che è stato osservato o eseguito. Non può però decidere che un'azione economicamente vietata diventi valida.

### PRE-RICH

PRE-RICH è l'applicazione. Specializza i concetti universali di IMMORTAL con il profilo Classic-6, il token/unità USDM, la price ladder, le classi, la distribuzione dei payout, il ciclo di vita del ticket, Jackpot, Genesis e il modello applicativo del Beacon.

PRE-RICH non modifica la costituzione economica universale di IMMORTAL.

## 4. Circuito di autorità e verifica

Il percorso corretto è:

```text
IMMORTAL defines admissibility
        ↓
PRE-RICH specializes the application action
        ↓
Adapter derives a concrete realization
        ↓
Cardano executes
        ↓
Adapter observes execution and evidence
        ↓
IMMORTAL / application revalidate the resulting state
```

Il ritorno dell'evidenza è essenziale. Una transazione costruita correttamente non equivale a una transazione confermata; una transazione confermata non equivale automaticamente a una prova completa di conformance economica.

## 5. Ciclo di vita PRE-RICH attraverso lo stack

Il ciclo completo può essere letto come segue:

1. L'utente produce un intento applicativo PRE-RICH.
2. PRE-RICH valida i prerequisiti applicativi.
3. IMMORTAL valuta l'azione rispetto allo stato canonico, alle obbligazioni e ai vincoli di sicurezza.
4. L'Adapter cerca una realizzazione concreta su Cardano.
5. Cardano esegue la transazione.
6. L'Adapter osserva e normalizza il risultato.
7. L'evidenza viene associata alla transizione e sottoposta ai controlli di conformance.
8. PRE-RICH aggiorna lo stato applicativo solo sulla base di fatti verificati.

Questo schema vale per Sale, Commit, Reveal, Claim, Expire e le transizioni Genesis, con le rispettive evidenze e regole.

## 6. Sale: emissione di un ticket

Il Sale è un esempio chiaro della separazione dei livelli.

```text
PRE-RICH intent
  ├─ ticket parameters
  ├─ class / price
  └─ treasury payment requirement
          ↓
IMMORTAL admissibility
  ├─ obligations
  ├─ protected capital
  ├─ post-state safety
  └─ viability
          ↓
Adapter realization
  ├─ UTxO selection
  ├─ datum / redeemer
  ├─ asset movement
  └─ transaction construction
          ↓
Cardano ledger
          ↓
observed transition
          ↓
revalidation / evidence
```

La vendita non deve essere interpretata come semplice minting NFT: economicamente entra nello stato anche l'esposizione che il ticket introduce, secondo le regole canoniche applicabili.

## 7. Commit e Beacon

Il Commit introduce la dipendenza dall'evidenza necessaria per una successiva Reveal.

PRE-RICH definisce il ruolo applicativo del Commit e del Beacon. IMMORTAL fornisce i principi universali relativi a determinismo, stato, obbligazioni, transizioni atomiche e conformance. L'Adapter trasporta e osserva gli elementi necessari sul confine blockchain.

Per il Beacon, la provenienza dell'autorità è un problema distinto dalla semplice codifica del risultato. Il modello B1 attuale e il percorso B3/Materios appartengono al livello applicativo/evidence stack; non devono essere trasformati in una nuova autorità economica IMMORTAL.

## 8. Reveal

Il Reveal attraversa più prove e più responsabilità:

```text
finalized source state / Beacon evidence
              ↓
Adapter evidence transport / verification boundary
              ↓
PRE-RICH result derivation
              ↓
IMMORTAL economic evaluation
              ↓
Cardano Reveal realization
              ↓
ledger execution
              ↓
observed transition + conformance evidence
```

Per il percorso B3, la catena concettuale è:

```text
Materios authority selection
        ↓
GRANDPA / finality provenance
        ↓
finalized source state
        ↓
evidence / proof boundary
        ↓
canonical Beacon
        ↓
ticket seed
        ↓
20,000-outcome mapping
        ↓
PRE-RICH GameRules
        ↓
payout determination
```

Il selettore reale Materios non deve essere copiato in TypeScript per rendere il proof path artificialmente eseguibile. Finché la provenienza finale B3 non è completamente verificata, il sistema deve rimanere fail-closed rispetto all'autorità non provata.

## 9. Crystallization

La crystallization è il confine in cui un risultato applicativo verificato diventa un diritto economico persistente secondo le regole applicabili.

IMMORTAL fornisce la semantica generale di passaggio da esposizione/risultato a stato economico canonico. PRE-RICH specifica quali risultati del gioco producono quali payout e come il ticket viene classificato. L'Adapter realizza l'azione sul ledger e ne osserva l'esito.

Un risultato non ancora autenticato o non sufficientemente provato non deve essere trasformato in un diritto economico semplicemente perché un client lo dichiara.

## 10. Claim e Settlement

Il Claim utilizza un diritto già cristallizzato.

```text
crystallized PRE-RICH right
        ↓
IMMORTAL admissibility of claim transition
        ↓
Adapter settlement realization
        ↓
Cardano asset/value movement
        ↓
observed settlement
```

La rappresentazione delle unità deve preservare l'importo economico esatto. Per PRE-RICH, la conformance documenta che 1 USDM corrisponde a 100 subunità e che, ad esempio, 2.5 USDM è rappresentato da 250 subunità.

Claim non è Burn: l'identità del ticket e il diritto sottostante devono essere trattati secondo la specifica applicativa e senza cancellare retroattivamente la semantica del diritto.

## 11. Expiry

Expiry è una regola universale di finalità economica, mentre la durata precisa è un parametro del profilo applicativo.

IMMORTAL stabilisce che, dopo l'expiry, non possono nascere nuovi diritti reclamabili dalla transizione scaduta, non può riapparire una liability estinta e un late reveal non può ricreare un diritto economico che non esiste più.

PRE-RICH definisce il profilo temporale concreto del ticket. L'Adapter realizza l'expiry su Cardano e ne fornisce evidenza. Il ledger conferma la transizione concreta.

## 12. Economic boundary: universale vs applicativo

| Tema | IMMORTAL | PRE-RICH | Adapter |
| --- | --- | --- | --- |
| Economic admissibility | Normativa | Specializza | Trasporta/realizza |
| Obligations | Definisce semantica | Istanzia per ticket/game | Osserva e dimostra |
| ProtectedCapital | Universale | Applica al proprio stato | Fornisce fatti di esecuzione |
| RawSurplus | Regola universale | Usa per la propria economia | Non decide il surplus |
| Price ladder | Non specifica il gioco | 1/2/3/5/10/25/50/100 USDM | Realizza quantità |
| Classic-6 | Non appartiene al kernel | Regola applicativa | Esegue/osserva |
| Jackpot | Vincoli universali di sicurezza | Politica applicativa | Realizzazione e prova |
| Beacon | Non è autorità costituzionale | Profilo applicativo | Trasporto/verifica evidenza |
| Cardano UTxO | Ignoto | Vincolato dall'app | Responsabilità diretta |
| Governance applicativa | Confine costituzionale | Regole PRE-RICH | Supporto tecnico |

## 13. Canonical economic baseline di PRE-RICH

Il profilo PRE-RICH corrente usa i parametri canonici applicativi già documentati:

- KA = 8, KC = 4, KD = 4.
- Price ladder: 1 / 2 / 3 / 5 / 10 / 25 / 50 / 100 USDM.
- Genesis = 1 USDM.
- Verified PRE Treasury bootstrap >= 4000 USDM.
- Maximum normal payout = 500 × P.
- Liability-first accounting.
- ProtectedCapital.
- RawSurplus = max(0, EEV - ProtectedCapital).
- HighestClassEverActivated monotonic.
- Class contraction 100 → 50 → 25 → 10 → 5 → 3 → 2 → 1 → HALT.

Il modello storico 75/10/10/5 non fa parte dell'economia canonica corrente.

## 14. Classic-6 e integrità economica

PRE-RICH Classic-6 usa due righe indipendenti, ciascuna campionata uniformemente su 20.000 esiti. Il mapping del draw accetta valori a 16 bit sotto 60.000 e applica modulo 20.000; poiché 60.000 = 3 × 20.000, il mapping mantiene l'uniformità.

Le probabilità e i payout delle classi applicative sono definiti nelle specifiche PRE-RICH. IMMORTAL non deve duplicare questa distribuzione: verifica invece che la transizione risultante sia compatibile con i vincoli economici universali.

## 15. Jackpot

PRE-RICH applica una politica di jackpot derivata dallo stato:

- attivazione deterministica derivata dallo stato;
- payout integrale dell'attuale locked balance esattamente una volta;
- nessuna percentuale fissa arbitraria di allocazione;
- funding limitato dal gap minimo necessario rispetto al floor applicabile;
- il surplus residuo rimane RawSurplus;
- il jackpot non modifica la distribuzione normale Classic-6.

IMMORTAL fornisce i vincoli universali, incluso che NewJackpot non superi RawSurplus e che il payout del jackpot non superi LockedJackpotLiquidity.

## 16. Genesis

Genesis attraversa il confine in modo esplicito:

```text
verified PRE Treasury observation
        ↓
PRE-RICH Genesis predicate
        ↓
eligible PRE_GENESIS state
        ↓
IMMORTAL economic admissibility
        ↓
Adapter realization
        ↓
Cardano transition
        ↓
revalidation
        ↓
PRE_GENESIS → GENESIS
```

Il valore verificato del PRE Treasury deve essere almeno 4000 USDM secondo il profilo PRE-RICH. Il bootstrap non viene automaticamente considerato liquidità del PrizePool.

Il punto ancora dipendente dall'evidence stack è l'autenticazione della corretta observation binding e la prova della reale transizione sul ledger.

## 17. Evidence come dimensione trasversale

Il sistema deve essere letto su tre dimensioni indipendenti:

1. **Semantic conformance** — il significato della transizione corrisponde alle regole normative.
2. **Implementation conformance** — il codice realizza davvero quel significato.
3. **Evidence conformance** — esistono prove verificabili dei fatti osservati e dell'esecuzione.

Una green CI non chiude automaticamente tutte e tre le dimensioni.

## 18. P2.8 nel modello complessivo

P2.8 appartiene al percorso Adapter/evidence e serve a rendere verificabile il confine tra una concreta transazione Cardano e l'esecuzione typed Ledger-native.

Il runner deve usare:

- exact Reveal CBOR;
- exact consumed UTxOs;
- exact protocol parameters;
- authentic EpochInfo derivata dall'evidenza Yaci;
- exact SystemStart;
- Ledger-native transaction evaluation;
- report typed completo per redeemer, con execution units, logs e failure data;
- fail-closed in presenza di contesto typed mancante o ambiguo.

Il valore architetturale di P2.8 non è creare una nuova regola economica, ma aumentare la qualità dell'evidence/refinement loop.

## 19. Classificazione dei fallimenti

Il sistema deve distinguere almeno questi casi:

| Situazione | Classificazione |
| --- | --- |
| Adapter costruisce una transazione ma IMMORTAL la respinge | Economic rejection |
| IMMORTAL ammette l'azione ma Cardano non la realizza | Technical realization failure |
| Cardano conferma la transazione ma la prova di equivalenza è incompleta | Observed execution + conformance gap |
| Beacon/evidence è mancante o ambiguo | Fail-closed / safe stall |
| Script esegue ma l'economic post-state non è dimostrato | Execution evidence incompleta |

Queste categorie impediscono di confondere un problema economico con un problema di tooling o con una lacuna probatoria.

## 20. Governance e liveness

La governance economica resta nel perimetro definito dalle fonti normative di IMMORTAL e dalle regole applicative di PRE-RICH.

Liveness può fornire meccanismi per permettere al sistema di progredire, ma non può creare nuova autorità economica.

Il confine è importante: un operatore, relayer, publisher, frontend o Adapter non può introdurre discrezionalmente un payout, una liability o una modifica dello stato economico che il protocollo non autorizza.

## 21. Source map

### IMMORTAL

- `IMMORTAL/docs/CONSTITUTION.md`
- `IMMORTAL/docs/ECONOMIC-KERNEL.md`
- `IMMORTAL/docs/ECONOMIC-ALGORITHM.md`
- `IMMORTAL/docs/ARCHITECTURE.md`
- `IMMORTAL/docs/CONFORMANCE.md`
- `IMMORTAL/docs/ECONOMIC-GATE-CARDANO-CONFORMANCE-MATRIX.md`
- `IMMORTAL/docs/V3-CARDANO-SEMANTIC-EQUIVALENCE.md`
- `IMMORTAL/docs/IMMORTAL-COMPLETE-SYSTEM-SPECIFICATION.md`

### Cardano Adapter

- `Adapter/CARDANO/docs/ADAPTER-SPECIFICATION.md`
- `Adapter/CARDANO/docs/CARDANO-ADAPTER-COMPLETE-SYSTEM-SPECIFICATION.md`
- `Adapter/CARDANO/runtime/CardanoExecutionAdapter.ts`
- `Adapter/CARDANO/runtime/EconomicAdmission.ts`
- `Adapter/CARDANO/serialization/CanonicalEconomicState.ts`
- `Adapter/CARDANO/observation/CanonicalTransitionEvidence.ts`
- `Adapter/CARDANO/observation/CardanoObservedTransitionEvidence.ts`
- `Adapter/CARDANO/observation/EconomicAdmissionTransitionBinding.ts`
- `Adapter/CARDANO/observation/EconomicObservation.ts`
- `Adapter/CARDANO/observation/ExecutableLiquidityObservation.ts`

### PRE-RICH

- `PRE-RICH/docs/CONSTITUTION.md`
- `PRE-RICH/docs/APPLICATION-SPECIFICATION.md`
- `PRE-RICH/docs/ECONOMIC-ALGORITHM.md`
- `PRE-RICH/docs/GAME-ECONOMY.md`
- `PRE-RICH/docs/CONFORMANCE.md`
- `PRE-RICH/docs/B3-BEACON-CONFORMANCE-INVESTIGATION.md`
- `PRE-RICH/docs/PRE-GENESIS-GENESIS-TRANSITION-CONFORMANCE.md`
- `PRE-RICH/docs/PAYOUT-UNIT-CONFORMANCE.md`
- `PRE-RICH/docs/PRE-RICH-COMPLETE-SYSTEM-SPECIFICATION.md`

### Materios / B3 evidence

- `poc/materios-grandpa/verifier.ts`
- `poc/materios-grandpa/verifier-b3-03b.ts`
- `poc/materios-grandpa/authority-transition.ts`
- `poc/materios-grandpa/ancestry.ts`
- upstream Materios authority-selection implementation and vectors remain the reference for the actual selector.

## 22. Reader path

Per comprendere il sistema senza perdere il confine tra livelli, il percorso consigliato è:

1. leggere questo documento come mappa;
2. leggere `IMMORTAL/docs/IMMORTAL-COMPLETE-SYSTEM-SPECIFICATION.md` per il modello universale;
3. leggere `Adapter/CARDANO/docs/CARDANO-ADAPTER-COMPLETE-SYSTEM-SPECIFICATION.md` per il confine di realizzazione;
4. leggere `PRE-RICH/docs/PRE-RICH-COMPLETE-SYSTEM-SPECIFICATION.md` per il funzionamento applicativo completo;
5. scendere poi alla fonte normativa specifica che governa il punto di interesse;
6. verificare l'implementazione concreta;
7. verificare infine la conformance/evidence associata.

## 23. Regola di non contaminazione

Un cambiamento a PRE-RICH non deve modificare implicitamente il kernel economico IMMORTAL.

Un cambiamento nell'Adapter non deve introdurre una nuova regola economica per rendere realizzabile una transazione.

Un limite tecnico Cardano non deve essere reinterpretato come una nuova regola universale di IMMORTAL.

Una prova B3 incompleta non deve essere sostituita da un'implementazione locale che simuli l'autorità mancante.

Questa disciplina mantiene il sistema verificabile e permette di distinguere con precisione semantica, implementazione ed evidenza.

## 24. Stato documentale

Questo documento è una mappa integrativa del sistema corrente. Non chiude automaticamente gli elementi che le fonti normative classificano ancora come OPEN, inclusi i punti in cui mancano prove complete di equivalenza, finalità o provenance.

Lo scopo è rendere esplicito il percorso:

**IMMORTAL → economic admissibility → PRE-RICH specialization → Cardano Adapter realization → Cardano execution → observed evidence → revalidation.**

Questo è il modello di riferimento per leggere insieme i tre sistemi senza confondere autorità economica, specializzazione applicativa e capacità tecnica del ledger.