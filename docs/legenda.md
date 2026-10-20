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
| Desert Eagle | al muro della zona controllo | 2500 | 5000 | 1 | 0 | un solo colpo, poi va ripagato al muro | — |

La Desert Eagle ha un colpo solo che attraversa i nemici e abbatte chiunque tranne Loris; per ricaricarla torni al muro e paghi di nuovo.

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
| Speciale | ogni 11 secondi chiama 2 ratti |
| Ricompensa | 1500 monete |

Quando lo sconfiggi i ratti scappano e puoi riaccendere la corrente dal quadro elettrico nel locale tecnico. La corrente servirà ad aprire il magazzino.

## Boss finale: Loris Busato

| Valore | |
|---|---|
| Dove | l'ufficio della zona controllo, in fondo al magazzino |
| Come ci arrivi | apri il magazzino (3000, serve la corrente), poi accendi i 3 generatori (1000 l'uno) |
| Quando | dall'ondata 15, con l'ufficio aperto |
| Vita | 8000, +3% per ogni ondata già passata |
| Danno | 24 ogni 1,3 s |
| Speciale | ogni 11 secondi chiama 2 Mammutones Furia e 2 normali |
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
| Sandbox | tutte le zone aperte, corrente e generatori già accesi, 25000 monete. I nemici e la loro forza dipendono da dove ti trovi. Fab esce appena scendi nel seminterrato, Loris appena entri nel suo ufficio; se esci e rientri, il boss torna. Non c'è una fine |

## Finale e mappa del mondo

Quando sconfiggi Loris Busato compare la schermata "Complimenti, hai liberato il Tigros!". Loris e Fab La Rue in realtà scappano e torneranno più avanti. Poi si apre la mappa di Busto Arsizio: il Tigros è la prima mappa, le altre sono oscurate (Tribunale di Busto, Happy Shopping, il centro col Mac) e arriveranno con nuovi nemici e nuovi boss.

Nella versione di prova il finale e la mappa si vedono anche senza giocare, col pulsante **Finale e mappa** nella schermata dei personaggi.
