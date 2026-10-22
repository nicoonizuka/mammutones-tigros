# Legenda: armi, monete, nemici e zone

Tutti i numeri qui sotto stanno in `src/config/balance.js`: per cambiare il bilanciamento basta modificare quel file.

L'idea di fondo: il gioco è **facile all'inizio** e diventa più difficile **man mano che apri le zone**, non solo con il passare delle ondate.

## Armi

| Arma | Dove si trova | Danno corpo | Danno testa | Caricatore | Riserva | Cadenza | Ricarica |
|---|---|---|---|---|---|---|---|
| Pistola | arma di partenza (munizioni al muro del Tigros, parcheggio) | 25 | 50 | 8 | 64 | 1 colpo ogni 0,24 s | 1,3 s |
| Fucile | appeso al muro sotto la tettoia del gazebo Buongusto | 60 | 120 | 5 | 35 | 1 colpo ogni 0,6 s, niente raffica | 2,0 s |
| Fucile a pompa | al muro del seminterrato | 30 × 8 pallini | 60 × 8 | 6 | 36 | 1 colpo ogni 0,85 s | 2,6 s |
| Mitra | al muro dell'ortofrutta, negozio | 22 | 44 | 30 | 150 | raffica, 10 colpi al secondo | 2,0 s |
| AK-47 | al muro del magazzino | 40 | 80 | 30 | 210 | raffica, circa 10 colpi al secondo | 2,2 s |
| Desert Eagle | al muro della zona controllo | 1000 | 2000 | 1 | 0 | un solo colpo, poi va ripagato al muro | — |

La Desert Eagle ha un colpo solo che attraversa i nemici e abbatte quasi tutti in un colpo (a Loris toglie 1000, 2000 in testa); per ricaricarla torni al muro e paghi di nuovo.

### Comprare al muro

| Arma | Prima volta (compri l'arma) | Volte dopo (munizioni piene) |
|---|---|---|
| Pistola | 300 (se l'avevi cambiata) | 150 |
| Fucile | 500 | 250 |
| Mitra | 1200 | 600 |
| Fucile a pompa | 1500 | 750 |
| AK-47 | 3000 | 1500 |
| Desert Eagle | 1500 | 800 per ogni colpo |

Puoi portare **due armi**. Se ne hai già due, quella nuova prende il posto di quella che hai in mano.

### Quanti colpi servono per abbattere un Mammutones

Mammutones normale nel parcheggio:

| Ondata | Vita | Pistola (corpo / testa) | Fucile (corpo / testa) |
|---|---|---|---|
| 1 | 100 | 4 / 2 | 2 / 1 |
| 5 | 132 | 6 / 3 | 3 / 2 |
| 10 | 172 | 7 / 4 | 3 / 2 |
| 10, gazebo aperto | 189 | 8 / 4 | 4 / 2 |

## Monete

| Azione | Monete |
|---|---|
| Inizio partita | 750 (Sandbox: 25000) |
| Ogni colpo a segno | +10 |
| Uccisione | ricompensa del nemico × moltiplicatore della zona |
| Uccisione con colpo in testa | +40 in più |
| Ondata superata | +50 × numero dell'ondata (al massimo +500) |

## Nemici

| Nemico | Vita base | Velocità | Danno per colpo | Ricompensa | Da quale zona |
|---|---|---|---|---|---|
| Mammutones | 100 | 2,0 m/s | 6 ogni 1,2 s | 50 | Parcheggio |
| Mammutones Cornuto | 80 | 3,8 m/s | 7 ogni 1,0 s | 70 | Negozio |
| Mammutones Furia | 45 | 6,0 m/s | 22 ogni 1,1 s | 90 | Magazzino: pochissima vita, velocissimo, colpisce fortissimo |
| Ratto | 30 | 4,8 m/s | 3 ogni 0,8 s | 25 | Seminterrato (45% dei nemici lì sotto) |
| Mammutones Grosso | 380 | 1,4 m/s | 14 ogni 1,5 s | 160 | Seminterrato |

A ogni ondata la vita sale dell'**6%** e la velocità del **2%**, fino a un massimo di +30%.

## Zone

La zona più avanzata che hai aperto decide quanto sono forti i nemici e quanto rendono.

| Zona | Costo | Vita nemici | Danno nemici | Monete | Nemici che escono |
|---|---|---|---|---|---|
| Parcheggio | — | ×1,0 | ×1,0 | ×1,0 | solo Mammutones |
| Gazebo Buongusto | 750 | ×1,1 | ×1,1 | ×1,15 | solo Mammutones |
| Negozio | 1250 | ×1,25 | ×1,2 | ×1,35 | 70% normali, 30% Cornuti |
| Seminterrato | 2000 | ×1,45 | ×1,35 | ×1,6 | 55% normali, 30% Cornuti, 15% Grossi |
| Magazzino | 3000, dopo la corrente | ×1,7 | ×1,5 | ×1,9 | 35% normali, 25% Cornuti, 15% Grossi, 25% Furia |
| Zona controllo | 3 generatori da 1000 | ×1,9 | ×1,6 | ×2,2 | 30% normali, 25% Cornuti, 15% Grossi, 30% Furia |

## Ondate

| Valore | Formula |
|---|---|
| Mammutones per ondata | 3 + 2 × ondata |
| Quanti insieme al massimo | 5 + ondata, fino a 12 |
| Tempo tra un'uscita e l'altra | 1,6 s che scende fino a 0,6 s |
| Pausa tra le ondate | 7 s |

## Vita, armatura e oggetti

- La vita è **una sola** (100). Dopo **5 secondi** senza essere colpito torna su da sola, **6 al secondo**.
- Quando un Mammutones muore, c'è il **14%** di probabilità che lasci un oggetto:
  - **cura** (35%): +35 di vita
  - **munizioni** (40%): +2 caricatori per ogni arma
  - **armatura** (25%): +25, fino a 50; assorbe il 70% del danno finché dura

## Poteri

| Personaggio | Potere | Durata | Ricarica |
|---|---|---|---|
| Nathan Mascheroni | Precisione: mira assistita, danno ×1,5, spara più veloce | 6 s | 22 s |
| Dado | Cura: +60 di vita | subito | 28 s |
| Nico | Velocità: corre quasi il doppio | 6 s | 18 s |
| Slime | Scudo: non subisce danni | 6 s | 24 s |
| Leonardo Ceriotti | Munizioni infinite | 8 s | 24 s |
| Ponta | Chiama Mirko: spara al suo fianco, 30 di danno per colpo | 12 s | 35 s |
| Jacopo Castiglioni | Doppio colpo: ogni colpo ne spara due, consumando un solo proiettile | 8 s | 24 s |
| Corti | Monete doppie: tutte le monete guadagnate valgono il doppio | 12 s | 30 s |

## Boss: Fab La Rue

| Valore | |
|---|---|
| Dove | tana dei ratti, in fondo al seminterrato |
| Quando | dall'ondata 8, quando sei nel seminterrato |
| Vita | 2000, +4% per ogni ondata già passata |
| Danno | 16 ogni 1,4 s |
| Speciale | ogni 9 secondi chiama 2 ratti |
| Ricompensa | 1500 monete |

Quando lo sconfiggi i ratti scappano e puoi riaccendere la corrente dal quadro elettrico nel locale tecnico. La corrente servirà ad aprire il magazzino.

## Boss finale: Loris Busato

| Valore | |
|---|---|
| Dove | l'ufficio della zona controllo, in fondo al magazzino |
| Come ci arrivi | apri il magazzino (3000, serve la corrente), poi accendi i 3 generatori (1000 l'uno) |
| Quando | dall'ondata 15, con l'ufficio aperto |
| Vita | 12000, +3% per ogni ondata già passata |
| Danno | 26 ogni 1,25 s |
| Speciale | ogni 10 secondi chiama 2 Mammutones Furia e 2 normali |
| Ricompensa | 5000 monete e il finale: Loris e Fab scappano e si apre la mappa del mondo |

## Inventario

Si apre con **Tab** o **I** (sul controller: tasto Share o touchpad).

| Cosa | Costo | Effetto |
|---|---|---|
| Pacco di munizioni | 400 | ne porti fino a 3; con **H** (freccia su sul controller) riempie subito l'arma in mano |
| Zaino livello 1 | 800 | munizioni di riserva massime ×1,5 |
| Zaino livello 2 | 2000 | munizioni di riserva massime ×2 |

## Modalità

| Modalità | Come funziona |
|---|---|
| Avventura | il percorso normale: apri le zone una alla volta, Fab La Rue arriva dall'ondata 8 nel seminterrato, Loris Busato dall'ondata 15; sconfiggere Loris è la vittoria |
| Sandbox | tutte le zone aperte, corrente e generatori già accesi, 25000 monete. I nemici e la loro forza dipendono da dove ti trovi. Fab esce appena scendi nel seminterrato, Loris appena entri nel suo ufficio; se esci e rientri, il boss torna. Non c'è una fine. Con il pulsante **Invincibile** i nemici non ti fanno danno |

## Finale e mappa del mondo

Quando sconfiggi Loris Busato compare la schermata "Complimenti, hai liberato il Tigros!". Loris e Fab La Rue in realtà scappano e torneranno più avanti. I Mammutones sono il problema del Tigros: il resto di Busto è nel caos per altri motivi, con nemici diversi. Poi si apre la mappa di Busto Arsizio: il Tigros è la prima mappa, le altre sono bloccate, con il nome visibile ma l'immagine oscurata (Tribunale di Busto, Happy Shopping, il centro di Busto) e arriveranno con nuovi nemici e nuovi boss.

Nella versione di prova il finale e la mappa si vedono anche senza giocare, col pulsante **Finale e mappa** nella schermata dei personaggi.

## Idee per i prossimi mondi

- Ogni mondo ha cattivi e boss diversi.
- Ogni mondo ha personaggi nuovi da sbloccare; anche i personaggi iniziali del Tigros potranno cambiare.
- La difficoltà sale piano piano da un mondo all'altro: l'inizio del mondo successivo è più difficile dell'inizio del Tigros, ma non quanto la sfida con Loris.

## Personaggi sbloccabili

| Personaggio | Potere | Come si sblocca |
|---|---|---|
| Nathan, Dado, Nico, Slime, Ponta, Corti | vedi sopra | disponibili da subito |
| Jacopo Castiglioni | Doppio colpo | sconfiggi Fab La Rue nel seminterrato (in Avventura) |
| Leonardo Ceriotti | Munizioni infinite | finisci la storia sconfiggendo Loris Busato nell'ufficio (in Avventura) |
| Altri personaggi | — | arriveranno con i prossimi mondi |

I personaggi bloccati si vedono nella schermata di scelta, oscurati e con il lucchetto. Lo sblocco resta salvato nel browser.


## Mondo 2: Happy Shopping

| Zona | Costo | Vita nemici | Danno nemici | Monete |
|---|---|---|---|---|
| Parcheggio Happy Shopping | 0 | ×1,2 | ×1,15 | ×1,3 |
| Negozio Happy Shopping | 1000 | ×1,4 | ×1,3 | ×1,55 |

Si parte con 900 monete. Il mondo 2 parte più facile della fine del Tigros e sale piano piano.

**Il Capo** (ondata 7): 6000 di vita, lento (1,9 m/s), 30 di danno a colpo. Ogni 7 secondi circa si ferma quasi un secondo, diventa rosso e carica dritto a velocità ×4,2: se ti prende fa 45 di danno (per il moltiplicatore della zona) e ti spinge via. Ogni 12 secondi chiama tre Mammutones. Battendolo in Avventura sblocchi Debe.

## Aggiornamento: armi del mondo 2, prezzi più alti, storie

### Armi nuove all'Happy Shopping

| Arma | Dove | Costo | Danno | Note |
|---|---|---|---|---|
| Pistola automatica | muro in fondo al parcheggio dell'Happy Shopping | 1200 (munizioni 600) | 15 a colpo, 13 colpi al secondo | raffica come il mitra ma più debole; caricatore da 20, riserva 160 |
| Bazooka | muro in fondo al negozio dell'Happy Shopping | 5000 (ricarica 3000) | 600 al centro, metà al bordo | 10 colpi in tutto, esplode con danno ad area (raggio 4,5 m) |

### Prezzi del Tigros (più alti)

| Cosa | Prima | Adesso |
|---|---|---|
| Munizioni pistola / pistola | 150 / 300 | 200 / 400 |
| Fucile | 500 | 750 |
| Mitra | 1200 | 1600 |
| Fucile a pompa | 1500 | 2500 |
| AK-47 | 3000 | 5000 |
| Desert Eagle (e ogni colpo) | 1500 / 800 | 3000 / 1500 |
| Gazebo · Negozio · Seminterrato · Magazzino | 750 · 1250 · 2000 · 3000 | 1000 · 1750 · 3000 · 5000 |
| Generatori (l'uno) | 1000 | 2000 |
| Pacco munizioni · Zaino 1 · Zaino 2 | 400 · 800 · 2000 | 600 · 1500 · 3500 |
| Monete iniziali in Sandbox | 25000 | 40000 |

### Personaggi del mondo 2

Tefalin, Diego e Debe vengono dall'Happy Shopping. In Avventura si usano solo dopo aver sconfitto Loris Busato (Debe in più va liberato battendo il Capo). In Sandbox sono sempre disponibili.

### Storie

All'inizio dell'Happy Shopping in Avventura c'è la sua intro. Il finale dice che hai sconfitto il Capo e liberato Debe, e mostra la lettera: gli altri amici sono tenuti in segreto nel garage di Pika, al Tribunale. Dalla mappa del mondo si rivedono intro e finale del Tigros e dell'Happy Shopping.

### Poteri dei personaggi del mondo 2

| Personaggio | Potere | Durata / ricarica |
|---|---|---|
| Tefalin | Amici albanesi: arrivano due amici con l'AK-47 che sparano a raffica (26 danni a colpo, 9 colpi al secondo ciascuno). Non attaccano il boss | 8 s · 32 s |
| Diego Margarito | Fischio: tutti i nemici entro 20 m restano congelati 4,5 s (il boss 1,5 s) | subito · 24 s |
| Debe | Proiettili lenti: per 9 s ogni nemico che colpisci va a un terzo della velocità per 3,5 s | 9 s · 22 s |

Onda d'urto e Furia restano nel gioco, pronti per i personaggi dei prossimi mondi.

### Dopo il boss finale

In Avventura, quando sconfiggi Loris compare il finale del Tigros con due scelte: **Vai all'Happy Shopping** (parti dal mondo 2 con lo stesso personaggio, dopo l'intro) oppure **Resta al Tigros** (le ondate continuano all'infinito). Lo stesso vale dopo il Capo: puoi restare all'Happy Shopping.

La katana è tolta per ora (troppo forte): il codice resta nel gioco per usarla più avanti.

### Visuale

Con **V** (o **R3** sul controller) passi dalla terza alla prima persona e viceversa. La scelta resta salvata nel browser.

### Scene degli amici liberati

In Avventura (e anche in Sandbox, per vederle) quando batti **Fab La Rue** esce **Jacopo**, ti viene incontro con il fumetto "Grazie raga! Fab mi teneva chiuso nelle fogne…" e poi sparisce. Quando batti **Loris** arriva **Leo** a ringraziarti, e subito dopo compare il finale del Tigros con la scelta tra Happy Shopping e ondate infinite.

### Mappa del mondo

Dal menu, **Mappa del mondo** apre la mappa di Busto. Scegli un luogo (pulsanti sotto la mappa o clic sull'edificio) e vedi il suo stato, la sua intro e il suo finale, e puoi andarci a giocare.

## Mondo 3: il Tribunale

Si apre in Avventura dopo aver finito l'Happy Shopping (in Sandbox subito). Si parte con l'intro: il viaggio in macchina con **Libe il matto** e **Damiano**, e il racconto di Libe. Monete iniziali: 1500.

| Area | Com'è | Boss / evento |
|---|---|---|
| 1 · Parcheggio coperto | un piano solo, buio, colonne di cemento con la fascia gialla e nera, neon che sfarfallano | **Fab La Rue** dal round 5, sconfitto per sempre: la barricata di macchine in fiamme sparisce |
| 2 · Strada e Tribunale | strada con le macchine in fiamme; il Tribunale è marroncino con la struttura in vetro e i portici con i tavolini sotto | **Pierre** dal round 6 con gli sgherri; poi **Fabio Regaglia** dal round 10, che lascia cadere la **chiave del garage** |
| 3 · Garage di Pika (di lato al Tribunale) | si apre con la chiave **e** pagando **7000** | appena entri arriva **Pika**: a metà vita scappa in casa. Poi riattivi la corrente dal quadro (**9000**) e liberi Leodessi, Castelluccio e Bulegato dalle gabbie |
| 4 · Casa di Pika | con l'ascensore, solo con la corrente accesa e gli amici liberi | c'è **Loris**, che scappa dalla finestra; poi la sfida finale con **Pika** |

### Armi del Tribunale

| Arma | Dove | Costo (ricarica) | Danno | Caricatore / riserva |
|---|---|---|---|---|
| Fucile a pompa automatico | parcheggio, muro est | 6000 (3000) | 7 pallini da 22, raffica | 12 / 120 |
| Mitragliatore | sotto i portici, vetrata del Tribunale | 12000 (6000) | 38, 14 colpi al secondo | **80** / 560: l'arma più forte del gioco |
| Pistola, AK-47, bazooka | parcheggio, piazza, garage | come prima | | |

### Nemici nuovi

| Nemico | Vita | Velocità | Danno | Monete | Note |
|---|---|---|---|---|---|
| Sgherro di Pierre (tubo) | 220 | 2,7 | 15 | 120 | tipo tosto e grosso, vestiti stracciati, pelle dal rosa al marrone scuro |
| Sgherro di Pierre (palo) | 340 | 2,15 | 22 | 160 | più grosso e lento |
| Ratto fachiro | 120 | 4,2 | 10 | 70 | mezzo ratto e mezzo fachiro: scuro, pieno di denti, chiodi sulla schiena |
| Mammutones Impossessato | 260 | 2,6 | 14 | 120 | persone possedute dai Mammutones: verdi, più alti, con le corna e gli occhi verdi |

### Boss

| Boss | Vita | Danno | Speciale |
|---|---|---|---|
| Fab La Rue (parcheggio) | 2000 | 16 | chiama i ratti |
| Pierre | 6500 | 26 | ogni 9 s chiama 2 sgherri col tubo e 1 col palo |
| Fabio Regaglia | 11000 | 42 | gigante corazzato con la lancia, lento; chiama Impossessati e sgherri |
| Pika (garage) | 5000 | 24 | lancia pacchetti di sigarette da lontano (16 danni, si schivano spostandosi); a metà vita scappa |
| Pika (casa) | 9000 | 24 | come sopra, fino alla fine |

### Personaggi del Tribunale

In Avventura si sbloccano al Tribunale (prossimamente); in **Sandbox** sono già giocabili. I poteri sono più forti di quelli dei mondi prima.

| Personaggio | Altezza | Aspetto | Potere |
|---|---|---|---|
| Leodessi | 1,78 m | ricci scuri morbidi con la frangia, felpa grigia con la zip | **Furia**: ogni colpo fa il doppio dei danni (9 s, ricarica 22 s) |
| Libe il matto | 1,74 m | capelli spettinati, camicia beige aperta sulla maglietta bianca | **Da matto**: il potere più inutile del gioco. Libe fa una cavolata, tutto esplode e perdi la partita (anche da invincibile) |
| Bulegato | 1,91 m | il re dei vampiri: pelle pallida, occhi rossi, canini, mantello nero e rosso, ricci scuri | **Pipistrelli**: tre pipistrelli per 11 s mordono il nemico più vicino (32 danni a morso, 16 sui boss) |
| Castelluccio | 1,88 m | alto e magro, capelli corti mossi con i lati sfumati, maglietta bianca aderente | **Colpi esplosivi**: per 9 s ogni colpo, con qualsiasi arma, fa ×1,5 di danno e una piccola esplosione (raggio 1,7 m, ×1,5) |
| Pika | 1,75 m | ricci biondo scuro voluminosi, canottiera bianca, sorriso largo | **Sigarette**: per 9 s, mentre spari, lanci pacchetti di sigarette di contrabbando al nemico più vicino (80 danni + piccola esplosione). Da boss li lancerà contro di te |

Il bazooka ora fa **260** danni al centro (prima 600), con lo stesso raggio di 4,5 m.

## Aggiornamento 1.1: cassa, bottiglie, stamina

### Saltare sugli oggetti
Carrelli, tavolini, cestoni, bancali, cassette e scaffali caduti si possono scavalcare con un salto e ci si può stare sopra. Non sono posti sicuri: da lassù i mob ti colpiscono lo stesso, anzi arrivano un po' più lontano.

### Cassa delle armi (una per mappa)
| Mappa | Dove |
|---|---|
| Tigros | in fondo al magazzino, vicino all'ufficio di Loris |
| Happy Shopping | in fondo al negozio |
| Tribunale | dentro il garage |

Costa **6500** monete, si può usare quante volte vuoi. Dà un'arma a caso fra tutte quelle dei tre mondi, katana compresa. Se hai già quell'arma, te la ricarica tutta.

**Minigun**: l'arma più forte del gioco, esce solo dalla cassa ed è la più rara. 200 colpi per caricatore, 46 danni a colpo, ricarica lunga (4,5 s).

### Bottiglie misteriose
Ogni 45-75 secondi può comparire una bottiglia viola luminosa nella zona in cui ti trovi. Sparisce dopo 40 secondi. Berla costa **15 di vita** e attiva per 15 secondi un potere a caso:

| Potere | Quanto è raro |
|---|---|
| Munizioni infinite | comune |
| Solo headshot (ogni colpo vale come alla testa) | comune |
| Saldi: armi, porte e acquisti a metà prezzo | comune |
| Soldi doppi | comune |
| La spada (ti dà la katana) | raro |
| Insta-kill su tutti tranne i boss | rarissimo |

### Altre modifiche
- **Stamina**: la corsa consuma la barra verde sotto l'armatura. Se la svuoti diventa gialla e devi aspettare che si ricarichi un po' prima di correre di nuovo.
- **Mob**: fanno il 20% di danno in più.
- **Loris**: più veloce, e ogni 2-3 secondi ti lancia una campana da lontano (18 danni se ti prende, nessun danno ad area).
- **Nico**: il potere ora è "Velocità e forza": corri più veloce e fai quasi il doppio del danno (x1,8).
- **Tefalin**: gli albanesi durano 6 secondi e fanno meno danno.
- **Oggetti dei nemici**: la vita è un cuore rosso, le munizioni sono proiettili veri, l'armatura è uno scudo blu.
- **Cielo** nuovo in tutti e tre i mondi: tramonto sul Tigros, giorno con nuvole all'Happy Shopping, cielo coperto al Tribunale.

## Mondo 4: il centro di Busto (fine del capitolo 1)
In Avventura si apre dopo aver finito il Tribunale. Si parte con 2500 monete. Il centro è infestato: Mammutones di ogni tipo e sgherri già dalla prima ondata.

### Il percorso
| Zona | Cosa succede | Per andare avanti |
|---|---|---|
| Piazza Garibaldi (la fontana) | Round 5: **Pierre**, per l'ultima volta | — |
| Il Mac (torre grigia, a destra della fontana) | Round 10: **Corti** maledetto, enorme. Lancia panini da lontano e mena da vicino. Battuto, si sblocca e ti dà la prima metà del talismano. Poi compare Loris per un attimo | Aprire il Mac: **8000** (dopo Pierre) |
| La zona dei bar (corso XX Settembre) | Round 15: i **cugini Progni**, due soldati biondi con la cresta, insieme. Evocano gli sgherri potenziati. Battuti tutti e due liberi **Napo** e **Ali Debbah** | Strada per i bar: **10000** (dopo Corti) |
| Piazza San Giovanni e la basilica | Round 18: **Loris Busato** in chiesa. Battuto scappa nelle catacombe e ti lascia l'altra metà del talismano | Si sblocca battendo i Progni; aprire la chiesa: **12000** |
| Le catacombe | Elimina 12 Mammutones, poi suona i 4 campanacci nell'ordine scritto sulla tavola di pietra (se sbagli, l'ordine cambia e arrivano nemici). Poi attiva il portale | Sigillo in chiesa: col talismano intero. Portale: **20000** |
| La Sardegna | Colline, nuraghi, ulivi, pecore e tantissimi Mammutones e capre. Dopo pochi secondi arriva **Loris, il Re dei Mammutones**: gigante, lancia campanacci enormi (danno ad area) e batte i piedi se gli sei vicino. Battuto, esce **DJ Gianfra** e Busto è salva | — |

### Nemici nuovi
| Nemico | Vita | Velocità | Danno | Dove |
|---|---|---|---|---|
| Sgherro potenziato | 480 | 2,6 | 26 | in tutta la città, dall'ondata 4 |
| Capra Mammutones | 170 | 6,4 | 20 | chiesa, catacombe, Sardegna |

### Armi del centro di Busto
| Arma | Dove | Prezzo | Note |
|---|---|---|---|
| AR | fontana | 7000 | AK potenziato, 30 colpi, 55 di danno |
| Granate | dentro il Mac | 9000 | 10 granate, si lanciano dove guardi, esplosione grande (420) |
| Cecchino dorato | zona dei bar | 14000 | 12 colpi, 700 di danno, passa attraverso |
| Minigun | dentro la chiesa | 25000 | l'arma più forte, resta anche nella cassa |
Alla fontana ci sono anche pistola, mitra, fucile a pompa, AK-47 e pompa automatico; al Mac il mitragliatore; ai bar bazooka e Desert Eagle. Niente katana al muro. La cassa delle armi del mondo 4 è in piazza San Giovanni, accanto alla facciata.

### Personaggi nuovi
| Personaggio | Altezza | Potere | Come si sblocca |
|---|---|---|---|
| Napo | 1,85 m | **Collare**: fino a 6 nemici vicini diventano suoi alleati per 10 secondi e combattono per lui | battendo i Progni |
| Ali Debbah | 1,69 m | **L'Algerino**: per 7 secondi tutti i nemici hanno la vita dimezzata (ogni colpo vale doppio) | battendo i Progni |
| DJ Gianfra | 1,88 m | **Arma gratis**: la prossima arma che compri al muro non la paghi (ricarica 45 s) | finendo la Sardegna |
| Corti | 1,88 m | Monete doppie | battendolo al Mac |

### Easter egg
La Golf GT di Corti è parcheggiata davanti al Mac: premendo E la righi. Se lo fai prima dello scontro, Corti se ne accorge e invece di «la mia GT non l'hai toccata, vero?» ti dice «Hai rigato la mia GT?! Adesso sono cavoli tuoi!».

## Aggiornamento: grafica realistica
- Tutti i personaggi giocabili, Mirko e gli 11 nemici normali hanno il modello realistico (fatto con Meshy). Nel menu di pausa, "Grafica", si torna ai modelli classici.
- I nemici hanno camminate, corse, attacchi e morti diverse per tipo; gli sgherri attaccano col tubo e col palo; i ratti e il ratto fachiro mordono con uno scatto in avanti e quando muoiono cadono di lato.
- Si può installare come app (Android, PC, iPhone con "Aggiungi alla schermata Home").

### Personaggio nuovo
| Personaggio | Altezza | Potere | Come si sblocca |
|---|---|---|---|
| Mattia | 1,90 m | **Dono del Messina**: tutti i nemici entro 10 metri muoiono all'istante, tranne i boss (ricarica 50 s) | finendo il gioco: sconfiggi il Re dei Mammutones in Sardegna |
