# Mammutones al Tigros

Sparatutto 3D a blocchi in stile COD Zombies, ambientato al Tigros di Busto Arsizio.
Loris Busato e la sua armata di Mammutones hanno invaso il supermercato: scegli uno degli amici e riprenditi il supermercato.

All'avvio c'è il prologo con la storia, poi la scelta della modalità:

- **Avventura**: apri il Tigros zona per zona fino a Loris Busato.
- **Sandbox**: tutta la mappa aperta da subito; basta entrare nel seminterrato o nell'ufficio per sfidare Fab La Rue o Loris.

## Giocare sul tuo PC

In Windows: doppio clic su **Gioca.bat**. La prima volta installa quello che serve, poi apre il gioco a schermo intero in Chrome o Edge.

Da terminale: `npm install` la prima volta, poi `npm run gioca`. Serve Node.js (versione LTS).

Durante la partita premi **F** per entrare o uscire dallo schermo intero.

## Avvio per sviluppare

```bash
npm install
npm run dev
```

Poi apri l'indirizzo che compare nel terminale, di solito http://localhost:5173.

## Comandi

| Tasto | Azione |
|---|---|
| W A S D | muoversi |
| Mouse | mirare (se non viene catturato, tieni premuto il tasto destro) |
| Clic sinistro | sparare |
| Q | potere del personaggio |
| R | ricaricare |
| E | comprare / aprire |
| 1 / 2 o rotellina | cambiare arma |
| Shift | correre |
| Spazio | saltare |
| P o Esc | pausa |
| Tab o I | inventario |
| H | usa un pacco di munizioni |
| V | prima / terza persona (col controller: R3) |

Col controller (PlayStation, Xbox): levetta sinistra muovi, destra mira, R2 spara, L1/R1 potere, Quadrato ricarica, Cerchio compra/apri, Triangolo cambia arma, X salta, L3 corri, Options pausa. Nei menu: frecce per scegliere, X per confermare.

## Struttura

```
src/
  main.js               avvio, giocatore, nemici, armi, interazioni, HUD, loop
  style.css             stile di HUD e schermate
  audio.js              suoni sintetizzati (WebAudio)
  input/
    gamepad.js          controller tramite la Gamepad API
  characters/
    roster.js           personaggi giocabili e poteri
    sprites.js          ritratti in pixel art per la scelta del personaggio
    styled.js           modelli 3D modellati di amici, Mirko, Mammutones, Fab La Rue e armi
  render/
    engine.js           renderer, scena, luci, camera, collisioni
    textures.js         texture pixel, materiali, cubi, insegne
  config/
    balance.js          tutti i numeri: armi, nemici, monete, zone, ondate
  world/
    kit.js              materiali, forme e texture comuni
    parking.js          zona 1 (parcheggio) e zona 2 (gazebo Buongusto)
    store.js            edificio del Tigros e zona 3 (negozio)
    basement.js         zona 4 (seminterrato e tana di Fab La Rue)
    warehouse.js        zone 5 e 6 (magazzino, generatori, ufficio di Loris)
    happyshopping.js    mondo 2: parcheggio, negozio, Mercedes di Damiano, luci del mondo
```

## Personaggi e poteri

| Personaggio | Potere |
|---|---|
| Nathan Mascheroni | Precisione: mira assistita, colpi più rapidi e forti |
| Dado | Cura: +60 di vita |
| Nico | Velocità: corre quasi il doppio |
| Slime | Scudo: immune ai colpi per qualche secondo |
| Leonardo Ceriotti | Munizioni infinite (si sblocca finendo la storia) |
| Ponta | Chiama Mirko, che combatte al suo fianco |
| Jacopo Castiglioni | Doppio colpo: ogni colpo ne spara due (si sblocca battendo Fab La Rue) |
| Corti | Monete doppie per qualche secondo |
| Tefalin | Amici albanesi: due amici con l'AK-47 smitragliano i Mammutones (non il boss) |
| Diego Margarito | Fischio: congela tutti i nemici vicini per qualche secondo |
| Debe | Proiettili lenti: i nemici colpiti rallentano tantissimo (si sblocca battendo il Capo dell'Happy Shopping) |

## Percorso previsto

1. Parcheggio (fatto)
2. Gazebo Buongusto (fatto, si apre a 750): fucile al muro sotto la tettoia
3. Negozio (fatto, si apre a 1250 dopo il gazebo): corsie, ortofrutta, sushi, casse, mitra al muro
4. Seminterrato (fatto, 2000 dalla scala mobile): ratti, boss Fab La Rue, fucile a pompa, corrente da riaccendere
5. Magazzino (fatto, 3000 dopo la corrente): scaffali alti, celle frigo, muletto, Mammutones Furia, AK-47
6. Zona controllo (fatto, 3 generatori): Desert Eagle e boss finale Loris Busato all'ondata 15

## Mondo 2: Happy Shopping

Si sceglie dal menu (Mondo 2). In Avventura si apre dopo aver battuto Loris Busato; in Sandbox si prova subito.

1. Parcheggio in autobloccanti: pistola al muro accanto all'ingresso, fucile al muro di cemento in fondo. Nella Mercedes station wagon con l'aquila c'è Damiano: premi E per parlarci.
2. Negozio (1000 monete): bazar con abbigliamento, intimo, scuola e casalinghi. Mitra e fucile a pompa al muro.
3. All'ondata 7 esce dal magazzino il Capo: enorme, lento, picchia forte e ogni tanto si ferma, diventa rosso e carica. Spostati di lato: se sbatte contro uno scaffale resta stordito.

Il codice della mappa è in `src/world/happyshopping.js`, i numeri in `src/config/balance.js` (`BOSS_CAPO`, zone `hs-parcheggio` e `hs-negozio`).

Dopo l'Happy Shopping (prossimamente, già oscurati nella mappa del mondo): Tribunale di Busto, poi il centro di Busto.

## Bilanciamento

La legenda completa di armi, monete, nemici e zone è in [docs/legenda.md](docs/legenda.md).

## Note

- Le foto di riferimento degli amici stanno in `reference/`, che è escluso da Git perché il repository è pubblico.
- Three.js è fissato alla versione 0.149.0.
