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
