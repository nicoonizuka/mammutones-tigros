# Mammutones al Tigros

Sparatutto 3D a blocchi in stile COD Zombies, ambientato al Tigros di Busto Arsizio.
Loris Busato e la sua armata di Mammutones hanno invaso il supermercato: scegli uno dei sei amici e sopravvivi.

## Avvio in locale

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

## Struttura

```
src/
  main.js               avvio, giocatore, nemici, armi, interazioni, HUD, loop
  style.css             stile di HUD e schermate
  audio.js              suoni sintetizzati (WebAudio)
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
```

## Personaggi e poteri

| Personaggio | Potere |
|---|---|
| Nathan Mascheroni | Precisione: mira assistita, colpi più rapidi e forti |
| Dado | Cura: +60 di vita |
| Nico | Velocità: corre quasi il doppio |
| Slime | Scudo: immune ai colpi per qualche secondo |
| Leonardo Ceriotti | Munizioni infinite |
| Ponta | Chiama Mirko, che combatte al suo fianco |
| Jacopo Castiglioni | Doppio colpo: ogni colpo ne spara due |
| Corti | Monete doppie per qualche secondo |

## Percorso previsto

1. Parcheggio (fatto)
2. Gazebo Buongusto (fatto, si apre a 750)
3. Negozio (fatto, si apre a 1250 dopo il gazebo): corsie, ortofrutta, sushi, casse, mitra al muro
4. Seminterrato: parcheggio sotterraneo, ratti e boss Fab La Rue, riaccendere la corrente
5. Magazzino: celle frigo, scaffali, muletto
6. Zona controllo: boss finale Loris Busato

## Bilanciamento

La legenda completa di armi, monete, nemici e zone è in [docs/legenda.md](docs/legenda.md).

## Note

- Le foto di riferimento degli amici stanno in `reference/`, che è escluso da Git perché il repository è pubblico.
- Three.js è fissato alla versione 0.149.0.
