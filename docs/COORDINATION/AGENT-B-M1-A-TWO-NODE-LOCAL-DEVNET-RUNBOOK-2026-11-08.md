# M1-A — Runbook devnet Cardano locale a due nodi + Kupo

**Data:** 8 novembre 2026  
**Stato:** procedura documentata; non ancora eseguita su macchine locali.  
**Scopo:** qualificare il plumbing dell'indicizzatore di un native asset (PRE-like) su due processi Cardano separati, ciascuno con il proprio Ogmios e Kupo, allo stesso punto ledger fissato dall'operatore.

## 1. Confini e risultato atteso

Questo runbook avvia un private testnet locale, non una rete pubblica e non Preprod. La prova ha quattro risultati distinti:

1. due processi cardano-node raggiungono lo stesso header point;
2. due istanze Ogmios espongono ChainSync indipendente per ciascun socket;
3. i due indici WAL M1-A ricostruiscono lo stesso snapshot dell'asset di test al punto fissato;
4. due istanze Kupo, sincronizzate fino allo stesso punto, concordano con ciascun indice M1-A sugli output non spesi dell'asset di test.

Il risultato PASS significa soltanto che queste repliche locali concordano sui dati osservati. Non prova indipendenza tra operatori, correttezza del software cardano-node, autenticità del bootstrap, identità dei titolari PRE o trustlessness assoluta. I due pool node creati dallo stesso cardano-testnet condividono genesis e ambiente operativo.

La procedura base non esegue automaticamente alcuna transazione. La sezione 6.1 descrive una fixture nativa *esclusivamente di test* opzionale, confinata al private testnet magic 4242 e richiamabile soltanto con doppia conferma. Non esegue mai mint/Issue PRE-RICH, firma con chiavi IMMORTAL o PRE-RICH, transazioni Preprod/Mainnet, deploy di validator/policy di produzione o modifiche ai parametri di governance. Di conseguenza, nella modalità attuale è un *zero-state plumbing smoke test*: il nuovo private testnet non contiene il token PRE di Preprod/Mainnet e non genera output non-zero dell'asset. Un PASS con supply zero dimostra soltanto che nodi, Ogmios, WAL e Kupo concordano su un insieme vuoto; non è una prova della distribuzione PRE reale né una qualificazione completa del comportamento non-zero.

## 2. Stack fissato

| Componente | Versione | Motivazione |
|---|---:|---|
| cardano-node + cardano-cli + cardano-testnet | 11.0.1 | Stesso release bundle; il progetto dichiara non supportato il mix di binari da release differenti |
| Ogmios | 7.0.0 | Release testata con cardano-node 11.0.1 |
| Kupo | 2.12.0 | Matrice upstream: node 11.0.* e Ogmios 7.* |
| Node.js | 22 | Uguale al workflow M1-A |
| M1-A | HEAD del branch corrente | Reducer, Ogmios v7, WAL, dual runner e Kupo parity |

Fonti upstream da ricontrollare prima dell'installazione:
- Cardano node 11.0.1: https://github.com/IntersectMBO/cardano-node/releases/tag/11.0.1
- Cardano node installazione e requisiti: https://developers.cardano.org/docs/get-started/cardano-node/installing-cardano-node/
- Ogmios v7.0.0 e matrice di compatibilità: https://github.com/CardanoSolutions/ogmios/releases/tag/v7.0.0
- Kupo v2.12.0 e matrice di compatibilità: https://github.com/CardanoSolutions/kupo/releases/tag/v2.12
- Kupo API 2.12.0: https://github.com/CardanoSolutions/kupo/blob/v2.12.0/docs/api/v2.12.0.yaml
- Introduzione testnet Cardano: https://testnets.cardano.org/cardano-testnets/getting-started

Il profilo di risorse del node upstream indica come ordine di grandezza per un testnet 2 core, 4 GB RAM e circa 20 GB di spazio libero; il carico reale dipenderà dal numero di blocchi, dal WAL e dai due database Kupo. Non usare queste cifre come benchmark di produzione.

## 3. Ambiente WSL2

Usare Linux x86_64/amd64 dentro WSL2. Tenere node database, socket, WAL e SQLite Kupo sul filesystem Linux ext4 della home WSL, non sotto /mnt/c o /mnt/e.

Aprire una shell WSL:

~~~bash
mkdir -p "$HOME/immortal-m1"/{archives,unpack,bin,state,config}
export M1="$HOME/immortal-m1"
export BIN="$M1/bin"
export STATE="$M1/state"
export NET="$STATE/cardano-testnet"
~~~

Il magic 4242 qui sotto è un esempio per una rete privata isolata: verificare che non sia già usato nell'ambiente locale. Non è un network magic di IMMORTAL, Preprod o Mainnet.

## 4. Scaricare e verificare i binari

Scaricare il bundle Linux amd64 da ciascuna release upstream:

~~~bash
cd "$M1/archives"

curl -fL -o cardano-node-11.0.1-linux-amd64.tar.gz \
  https://github.com/IntersectMBO/cardano-node/releases/download/11.0.1/cardano-node-11.0.1-linux-amd64.tar.gz
curl -fL -o cardano-node-11.0.1-sha256sums.txt \
  https://github.com/IntersectMBO/cardano-node/releases/download/11.0.1/cardano-node-11.0.1-sha256sums.txt
grep 'cardano-node-11.0.1-linux-amd64.tar.gz' cardano-node-11.0.1-sha256sums.txt | sha256sum -c -

curl -fL -o ogmios-v7.0.0-x86_64-linux.zip \
  https://github.com/CardanoSolutions/ogmios/releases/download/v7.0.0/ogmios-v7.0.0-x86_64-linux.zip

curl -fL -o kupo-v2.12.0-x86_64-linux.zip \
  https://github.com/CardanoSolutions/kupo/releases/download/v2.12/kupo-v2.12.0-x86_64-linux.zip
~~~

Il release bundle Cardano pubblica il file SHA256. Per Ogmios e Kupo registrare anche gli hash locali degli archivi e le versioni dichiarate dai binari; non confondere un hash calcolato localmente con un checksum upstream firmato.

Estrarre in directory separate:

~~~bash
mkdir -p "$M1/unpack/node" "$M1/unpack/ogmios" "$M1/unpack/kupo"
tar -xzf "$M1/archives/cardano-node-11.0.1-linux-amd64.tar.gz" -C "$M1/unpack/node"
unzip -q "$M1/archives/ogmios-v7.0.0-x86_64-linux.zip" -d "$M1/unpack/ogmios"
unzip -q "$M1/archives/kupo-v2.12.0-x86_64-linux.zip" -d "$M1/unpack/kupo"

find "$M1/unpack/node" -type f \( -name cardano-node -o -name cardano-cli -o -name cardano-testnet \)
find "$M1/unpack/ogmios" -type f -name ogmios
find "$M1/unpack/kupo" -type f -name kupo
~~~

Copiare i binari individuati nella directory BIN, senza sostituire un binario mancante con uno di un'altra release:

~~~bash
cp "$(find "$M1/unpack/node" -type f -name cardano-node | head -n 1)" "$BIN/"
cp "$(find "$M1/unpack/node" -type f -name cardano-cli | head -n 1)" "$BIN/"
cp "$(find "$M1/unpack/node" -type f -name cardano-testnet | head -n 1)" "$BIN/"
cp "$(find "$M1/unpack/ogmios" -type f -name ogmios | head -n 1)" "$BIN/"
cp "$(find "$M1/unpack/kupo" -type f -name kupo | head -n 1)" "$BIN/"
chmod 0755 "$BIN"/*
export PATH="$BIN:$PATH"

cardano-node --version
cardano-cli version
cardano-testnet version
ogmios --version
kupo --version
~~~

Verificare che node, CLI e cardano-testnet riportino tutti la release 11.0.1 e annotare gli output completi insieme agli SHA256 degli archivi.

## 5. Creare il private testnet con due pool node

Il subcomando create-env della release 11.0.1 supporta --num-pool-nodes, --testnet-magic e --output. Due pool node generano due processi producer con configurazioni e socket distinti.

~~~bash
export MAGIC=4242
export NET="$STATE/cardano-testnet"

cardano-testnet create-env \
  --num-pool-nodes 2 \
  --testnet-magic "$MAGIC" \
  --output "$NET"
~~~

Non usare l'opzione di ambiente temporaneo: il percorso deve restare stabile per poter essere referenziato da Ogmios e Kupo.

Percorsi generati da cardano-testnet 11.0.1:
- Config comune: $NET/configuration.yaml
- Socket node 1: $NET/socket/node1/sock
- Socket node 2: $NET/socket/node2/sock
- Dati node 1: $NET/node-data/node1
- Dati node 2: $NET/node-data/node2
- Port file node 1: $NET/node-data/node1/port
- Port file node 2: $NET/node-data/node2/port

Avviare la rete in un terminale WSL dedicato e lasciarlo aperto:

~~~bash
cardano-testnet cardano --node-env "$NET"
~~~

La procedura avvia e mantiene i processi fino a Ctrl+C. Non avviare Ogmios prima che entrambi i socket esistano.

In un secondo terminale WSL, impostare di nuovo le variabili M1, STATE, NET, BIN e MAGIC; verificare:

~~~bash
test -S "$NET/socket/node1/sock"
test -S "$NET/socket/node2/sock"
test -f "$NET/configuration.yaml"
test -f "$NET/node-data/node1/port"
test -f "$NET/node-data/node2/port"

cardano-cli query tip --testnet-magic "$MAGIC" --socket-path "$NET/socket/node1/sock"
cardano-cli query tip --testnet-magic "$MAGIC" --socket-path "$NET/socket/node2/sock"
~~~

Se i tip differiscono, attendere. Non scegliere il punto target osservando un solo nodo.

## 6. Avviare due Ogmios separati

Ogmios v7 espone i flag node-socket, node-config, host e port. Avviare ciascuna istanza in un terminale differente.

Terminale Ogmios A:

~~~bash
ogmios \
  --node-socket "$NET/socket/node1/sock" \
  --node-config "$NET/configuration.yaml" \
  --host 127.0.0.1 --port 1337
~~~

Terminale Ogmios B:

~~~bash
ogmios \
  --node-socket "$NET/socket/node2/sock" \
  --node-config "$NET/configuration.yaml" \
  --host 127.0.0.1 --port 1338
~~~

Controllare le due porte con l'endpoint health di ciascuna istanza. Verificare che non siano stati accidentalmente avviati due Ogmios sullo stesso socket.


## 6.1. (Opzionale) Creare una fixture native asset non-zero, solo su magic 4242

Questa fase consente di esercitare davvero il percorso UTxO non-zero. Crea un token locale chiamato `M1TEST`, quantità 100, con una native mint policy mono-firma effimera. Non è il token PRE di produzione, non usa policy ID o chiavi IMMORTAL/PRE-RICH e non può essere presentato come prova della distribuzione PRE su Preprod/Mainnet.

Il helper è `audit/cardano-integration/preSnapshotPrivateTestAssetFixture.mjs`. Accetta soltanto:
- Linux/WSL2;
- `cardano-cli 11.0.1`;
- network magic esattamente `4242`;
- il socket Unix esatto `$NET/socket/node1/sock` e config `$NET/configuration.yaml`;
- il wallet `utxo1` generato da `cardano-testnet`;
- workdir sotto `$NET/m1-fixtures/`.

Creare una configurazione locale, non versionata:

~~~bash
cat > "$STATE/m1-private-asset-fixture.json" <<EOF
{
  "networkMagic": 4242,
  "testnetRoot": "$NET",
  "nodeSocketPath": "$NET/socket/node1/sock",
  "nodeConfigPath": "$NET/configuration.yaml",
  "walletIndex": 1,
  "workDirectory": "$NET/m1-fixtures/pre-token",
  "cardanoCli": "$BIN/cardano-cli"
}
EOF
~~~

Dalla root del repository, preparare la policy effimera e il transaction body non firmato:

~~~bash
node audit/cardano-integration/preSnapshotPrivateTestAssetFixture.mjs \
  --prepare "$STATE/m1-private-asset-fixture.json"
~~~

Questa fase genera chiavi di policy locali e costruisce il body, ma **non firma e non invia**. I file restano nel workdir privato con permessi restrittivi. Verificare l'output `PREPARED_UNSIGNED`, il policy ID e l'asset unit. Non copiare le chiavi in repository, log pubblici o artifact GitHub.

La fase successiva firma con il solo wallet genesis locale `utxo1` e la chiave effimera della policy, quindi invia la transazione al socket node1 della rete privata. È un'operazione on-chain locale, separata e intenzionale: prima di eseguirla controllare di nuovo che il terminale sia quello del private testnet magic 4242 e che i due nodi siano quelli creati dal runbook.

~~~bash
IMMORTAL_M1_ALLOW_LOCAL_TESTNET_SUBMIT=YES \
node audit/cardano-integration/preSnapshotPrivateTestAssetFixture.mjs \
  --submit-local-private-testnet "$STATE/m1-private-asset-fixture.json"
~~~

Il doppio consenso (flag di modalità + variabile d'ambiente) è obbligatorio. Il helper scrive un marker one-shot prima della firma; se il processo si interrompe durante la firma o il submit, non ripetere il comando alla cieca. Ispezionare prima il file `submitted.json`, il txid se già registrato e il ledger locale. Il marker blocca intenzionalmente un secondo tentativo.

Attendere che la transazione sia inclusa e che il token compaia nel wallet `utxo1`; verificare in sola lettura:

~~~bash
node audit/cardano-integration/preSnapshotPrivateTestAssetFixture.mjs \
  --verify "$STATE/m1-private-asset-fixture.json"
~~~

Il risultato accettato è `PASS_NON_ZERO_LOCAL_TEST_ASSET`, con quantità osservata almeno 100. In caso di `WAITING_FOR_LOCAL_TEST_ASSET`, attendere altri blocchi e ripetere soltanto `--verify`.

Estrarre policy e asset name per i due Kupo, senza trascriverli a mano:

~~~bash
FIXTURE="$NET/m1-fixtures/pre-token/prepared.json"
POLICY_ID=$(jq -r '.policyId' "$FIXTURE")
ASSET_NAME_HEX=$(jq -r '.tokenNameHex' "$FIXTURE")
ASSET_UNIT=$(jq -r '.assetUnit' "$FIXTURE")
printf 'local test asset: %s\n' "$ASSET_UNIT"
~~~

Solo dopo che entrambi i node hanno incluso la fixture e concordano sul tip, fissare il punto della sezione 7. Kupo A/B partono poi da `origin` e si fermano al punto concordato: in questo modo includono la transazione M1TEST. Il `initialUtxos` del runner resta vuoto se la fixture è stata creata *dopo* origin. Il report è una prova non-zero del plumbing su un native asset privato, non del PRE reale.

Per una prova di puro wiring a supply zero, fermarsi dopo `--prepare` e non eseguire `--submit-local-private-testnet`. In quel caso il Kupo audit può restituire un match vuoto; etichettare l'esito come zero-state smoke test, mai come non-zero PRE conformance.


## 7. Fissare un unico punto ledger

Ripetere le query tip finché entrambi i processi riportano lo stesso slot, block e hash. Lo script sotto estrae i campi JSON restituiti dalla CLI; se uno dei due nodi è indietro, ripetere la verifica più tardi:

~~~bash
cardano-cli query tip --testnet-magic "$MAGIC" --socket-path "$NET/socket/node1/sock" > "$STATE/tip-a.json"
cardano-cli query tip --testnet-magic "$MAGIC" --socket-path "$NET/socket/node2/sock" > "$STATE/tip-b.json"

jq -e '.slot == input.slot and .block == input.block and .hash == input.hash' \
  "$STATE/tip-a.json" "$STATE/tip-b.json"
~~~

Se jq restituisce false, non procedere. Una volta uguali, fissare i valori:

~~~bash
SLOT=$(jq -r '.slot' "$STATE/tip-a.json")
BLOCK=$(jq -r '.block' "$STATE/tip-a.json")
HASH=$(jq -r '.hash' "$STATE/tip-a.json")
POINT="$SLOT.$HASH"
printf 'slot=%s block=%s hash=%s\n' "$SLOT" "$BLOCK" "$HASH"
~~~

Annotare e conservare entrambi i JSON tip. Il punto diventa immutabile per questa prova: non aggiornarlo a un tip più recente a metà esecuzione. Il block number è necessario al reducer M1-A; Kupo checkpoint API riporta slot e header hash, non block number, quindi il valore block deriva dalla query tip concordante dei due node.

## 8. Avviare due Kupo indipendenti, senza pruning

Per questo private testnet servono i valori dell'asset di test locale creato in sezione 6.1 (se si sceglie la modalità non-zero), oppure della policy di test derivata in modalità prepare per uno smoke test a supply zero. Usare sempre policy ID e asset name hex ricavati dal file locale `prepared.json`, non quelli del PRE di produzione.

Non inserire qui il policy ID PRE di Preprod/Mainnet aspettandoti che esista nel nuovo genesis: questo ambiente è una chain privata nuova e non contiene la storia o gli UTxO del token di produzione. Non usare un ticker o il nome testuale del token al posto dell'asset name hex; non inventare o derivare il policy ID da una descrizione.

Il pattern Kupo per l'asset esatto è POLICY_ID.ASSET_NAME_HEX. Kupo 2.12 supporta --since origin e --until POINT, inclusivo. L'opzione --prune-utxo è facoltativa e deve essere omessa: vogliamo poter verificare gli output spesi e non avere una perdita informativa introdotta dal pruning. Usare due workdir separati.

Terminale Kupo A:

~~~bash
kupo \
  --node-socket "$NET/socket/node1/sock" \
  --node-config "$NET/configuration.yaml" \
  --workdir "$STATE/kupo-node-a" \
  --host 127.0.0.1 --port 1442 \
  --since origin --until "$POINT" \
  --match "$POLICY_ID.$ASSET_NAME_HEX"
~~~

Terminale Kupo B:

~~~bash
kupo \
  --node-socket "$NET/socket/node2/sock" \
  --node-config "$NET/configuration.yaml" \
  --workdir "$STATE/kupo-node-b" \
  --host 127.0.0.1 --port 1443 \
  --since origin --until "$POINT" \
  --match "$POLICY_ID.$ASSET_NAME_HEX"
~~~

Non aggiungere --prune-utxo. Verificare che i due database Kupo abbiano entrambi raggiunto il checkpoint stretto:

~~~bash
curl -fS "http://127.0.0.1:1442/checkpoints/$SLOT?strict"
curl -fS "http://127.0.0.1:1443/checkpoints/$SLOT?strict"
~~~

Entrambi devono restituire slot_no uguale a SLOT e header_hash uguale a HASH. Una risposta null, un checkpoint precedente o un hash diverso non è accettabile.

## 9. Configurare il runner M1-A a due repliche

La configurazione deve contenere il network label usato dal reducer, policy ID dell'asset di test, asset name, anchor point e il medesimo expectedPoint. L'esempio presuppone che il punto di bootstrap sia origin e che sia stato verificato che il genesis creato da cardano-testnet non contenga l'asset di test: soltanto in quel caso initialUtxos è vuoto. Se l'asset è già presente al punto di bootstrap, inserire l'intero set UTxO iniziale validato, non un sottoinsieme. Con il runbook corrente e senza una transazione locale di test, la lista rimane vuota per tutta la prova.

Creare un file locale non versionato, per esempio $STATE/dual-runner.json:

~~~json
{
  "networkId": "cardano-private-testnet-magic-4242",
  "asset": {
    "policyIdHex": "<policy-id-policy-test-locale-56-hex>",
    "assetNameHex": "<asset-name-test-locale-hex>"
  },
  "anchorPoint": {
    "slot": 0,
    "blockNo": 0,
    "hash": "0000000000000000000000000000000000000000000000000000000000000000"
  },
  "expectedPoint": {
    "slot": 0,
    "blockNo": 0,
    "hash": "<sostituire-con-slot-block-hash-concordanti>"
  },
  "initialUtxos": [],
  "timeoutMs": 120000,
  "pollIntervalMs": 250,
  "replicas": [
    {
      "id": "node-a",
      "nodeInstanceId": "cardano-node-1-local",
      "url": "ws://127.0.0.1:1337",
      "journalDirectory": "<percorso-assoluto>/state/wal-node-a"
    },
    {
      "id": "node-b",
      "nodeInstanceId": "cardano-node-2-local",
      "url": "ws://127.0.0.1:1338",
      "journalDirectory": "<percorso-assoluto>/state/wal-node-b"
    }
  ]
}
~~~

Sostituire ogni placeholder con valori verificati. expectedPoint deve contenere slot, block number e hash concordanti; il valore 0 mostrato sopra è solo una struttura d'esempio, non il punto da usare automaticamente. Le directory WAL devono essere distinte da quelle Kupo e non già bloccate da altri processi.

Preparare le due dipendenze runtime nella directory temporanea come fa la CI, dalla root repository:

~~~bash
DEPS="$STATE/m1-a-node-deps"
mkdir -p "$DEPS"
npm install --prefix "$DEPS" --no-save --no-audit --no-fund \
  ws@8.18.3 @cardanosolutions/json-bigint@1.0.1
ln -s "$DEPS/node_modules" audit/cardano-integration/node_modules
~~~

Eseguire il runner:

~~~bash
cd audit/cardano-integration
node preSnapshotDualReplicaRunner.mjs "$STATE/dual-runner.json"
~~~

Il risultato deve essere PASS, con REPLICA_SNAPSHOT_EXACT_MATCH e digest uguali. WAITING significa che almeno un indice non ha ancora raggiunto il punto o che non è stata stabilita la sessione; FAIL richiede analisi. Non trasformare WAITING/FAIL in PASS modificando il punto o sostituendo il bootstrap senza nuova evidenza.

## 10. Confrontare ciascun WAL con il proprio Kupo

Il client HTTP M1-A interroga:
- GET /checkpoints/{slot}?strict;
- GET /matches/{policy}.{assetName}?unspent;
- Accept: application/json;asset-quantity=string.

Il comparatore richiede checkpoint slot/hash esatti, esclude output spesi, decodifica gli indirizzi Cardano, verifica i riferimenti UTxO, usa quantità BigInt e confronta canonical bytes e digest. Gli endpoint sono limitati a HTTP loopback.

Creare due config locali, sempre non versionate. Kupo A:

~~~json
{
  "journalDirectory": "<percorso-assoluto>/state/wal-node-a",
  "kupoBaseUrl": "http://127.0.0.1:1442",
  "networkId": "cardano-private-testnet-magic-4242",
  "asset": {
    "policyIdHex": "<policy-id-esatto-56-hex>",
    "assetNameHex": "<asset-name-esatto-hex>"
  },
  "expectedPoint": {
    "slot": 0,
    "blockNo": 0,
    "hash": "<slot-block-hash-concordanti>"
  }
}
~~~

Kupo B usa la stessa identica rete, asset e expectedPoint, ma journalDirectory della replica B e kupoBaseUrl http://127.0.0.1:1443.

Eseguire due audit distinti:

~~~bash
node preSnapshotKupoAudit.mjs "$STATE/kupo-audit-a.json"
node preSnapshotKupoAudit.mjs "$STATE/kupo-audit-b.json"
~~~

Entrambi devono restituire PASS / KUPO_SNAPSHOT_EXACT_MATCH. Il rapporto registra digest, Merkle-sum root, quantità totale, leaf count e numero di UTxO. Conservare report completi, risposte strict checkpoint, tip JSON dei due node e versioni dei binari.

Questo passaggio carica in memoria la risposta completa /matches per l'asset: è destinato al test locale e non è ancora uno strumento streaming/large-scale da produzione. Nel caso non-zero, il match atteso è il token M1TEST della fixture privata; non è un PRE-RICH ticket.

## 11. Cosa costituisce evidenza valida

Il pacchetto M1-A per una singola esecuzione deve contenere:
1. versioni e SHA256 degli archivi/binari;
2. configuration.yaml e genesis effettivamente usati, con i segreti rimossi;
3. output cardano-cli query tip di entrambi i nodi, stesso slot/block/hash;
4. log e porte Ogmios A/B, con socket di origine verificati;
5. comando e configurazione Kupo A/B, database workdir separati, --prune-utxo assente;
6. risposte /checkpoints/{slot}?strict di entrambe le istanze;
7. configurazione dual runner e report PASS completo;
8. configurazioni Kupo audit e due report PASS completi;
9. hash SHA256 di ciascun report e log;
10. misure di memoria, disco, durata bootstrap, tempo di catch-up, replay dopo arresto e rollback;
11. se si è eseguita la fixture non-zero: `prepared.json`, policy ID/asset unit, txid, report `--verify` e output osservabile sui due nodi (senza includere le chiavi).

Non includere private keys, signing keys, seed, mnemonic, token segreti o credenziali. Le cartelle state, gli archivi e le configurazioni locali non devono essere committati.

## 12. Sequenza arresto e recupero

Arrestare nell'ordine: due processi Kupo, due Ogmios, cardano-testnet (Ctrl+C nel terminale del testnet). Non cancellare i workdir Kupo o WAL tra una ripartenza e l'altra se si sta testando il recovery. Riavviare cardano-testnet con lo stesso node environment e poi le stesse istanze Ogmios/Kupo.

Se una replica perde il proprio storico locale, non copiarle il journal dell'altra: i due WAL sono evidenze separate. Se un lock WAL è illeggibile o non verificabile, non cancellarlo automaticamente; seguire la procedura manuale documentata nel codice.

Per la prova di rollback, usare una finestra di test dedicata e conservare i log prima/dopo il rollback. Non forzare rollback su un punto che non sia presente nella history retained; il comportamento corretto è fail-closed.

## 13. Limiti e gate successivi

Anche due Kupo concordanti non certificano che il bootstrap iniziale fosse completo o che il network label corrisponda al network identity Cardano. La provenienza del bootstrap, l'esclusione Byron/validazione CBOR dell'indirizzo, l'eligibility PRE e la mappatura credenziali restano gate distinti. Il test a due pool nello stesso testnet locale non è una prova contro un operatore o un host malevolo.

**Limite asset non-zero:** il private testnet appena creato non contiene il PRE token di produzione. La sezione 6.1 ora documenta un helper per una fixture M1TEST esclusivamente locale, con chiavi effimere e doppia conferma per il submit su magic 4242. Il codice e i test della guardia sono presenti, ma la fixture non è stata preparata, firmata o inviata da questo lavoro. Anche dopo un PASS non-zero, la prova riguarda soltanto il plumbing di un native asset su una chain privata; non certifica la distribuzione PRE reale. Per i saldi PRE di produzione servirà una distinta prova read-only contro la rete pubblica corretta e l'identità PRE policy/name già governata.

M1-A live acceptance rimane OPEN fino a quando questa procedura non viene effettivamente eseguita e accompagnata da evidenze runtime indipendenti. M1-C Mithril e M2 Plutus non sono iniziati. Il primo Ticket PRE-RICH su Preprod resta sul percorso separato Issue #37 / EEV / R1 / Kc / Ω.

## 14. Fonti di configurazione upstream verificate

- cardano-node 11.0.1: cardano-testnet create-env usa --num-pool-nodes, --testnet-magic, --output; cardano-testnet cardano --node-env avvia l'ambiente salvato. Default era Conway. Path del node, socket, config e port file provengono dal modulo Cardano.Node.Testnet.Paths del tag 11.0.1.
- Ogmios v7.0.0: --node-socket, --node-config, --host, --port; default host 127.0.0.1 e port 1337. La release dichiara compatibilità cardano-node==11.0.1.
- Kupo v2.12.0: --node-socket, --node-config, --workdir, --host, --port, --since, --until, --match, --prune-utxo. --until accetta punto o slot; --since accetta origin/tip/punto; --prune-utxo è opt-in e in questo runbook viene omesso. API strict checkpoint e query unspent provengono da OpenAPI v2.12.0.
