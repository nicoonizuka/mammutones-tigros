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
    sprites.js          disegni pixel art dei 6 amici e di Mirko
    data.js             capelli, poteri, sprite pronti
    models.js           modelli 3D a blocchi di amici e Mammutones
  render/
    engine.js           renderer, scena, luci, camera, collisioni
    textures.js         texture pixel, materiali, cubi, insegne
  world/
    parking.js          zona 1 (parcheggio) e zona 2 (gazebo Buongusto)
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

## Percorso previsto

1. Parcheggio (fatto)
2. Gazebo Buongusto (fatto, si apre a 750)
3. Negozio: corsie, ortofrutta, sushi, casse
4. Seminterrato: parcheggio sotterraneo, ratti e boss Fab La Rue, riaccendere la corrente
5. Magazzino: celle frigo, scaffali, muletto
6. Zona controllo: boss finale Loris Busato

## Note

- Le foto di riferimento degli amici stanno in `reference/`, che è escluso da Git perché il repository è pubblico.
- Three.js è fissato alla versione 0.128.0.
