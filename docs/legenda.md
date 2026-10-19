# Legenda: armi, monete, nemici e zone

Tutti i numeri qui sotto stanno in `src/config/balance.js`: per cambiare il bilanciamento basta modificare quel file.

L'idea di fondo: il gioco è **facile all'inizio** e diventa più difficile **man mano che apri le zone**, non solo con il passare delle ondate.

## Armi

| Arma | Dove si trova | Danno corpo | Danno testa | Caricatore | Riserva | Cadenza | Ricarica |
|---|---|---|---|---|---|---|---|
| Pistola | arma di partenza | 25 | 50 | 8 | 64 | 1 colpo ogni 0,24 s | 1,3 s |
| Fucile | appeso al muro del Tigros, parcheggio | 60 | 120 | 5 | 35 | 1 colpo ogni 0,6 s, niente raffica | 2,0 s |
| Mitra | al muro dell'ortofrutta, negozio | 22 | 44 | 30 | 150 | raffica, 10 colpi al secondo | 2,0 s |

Le armi delle zone successive (cassa armi, armi al muro del seminterrato e del magazzino) saranno ancora più forti.

### Comprare al muro

| Arma | Prima volta (compri l'arma) | Volte dopo (munizioni piene) |
|---|---|---|
| Fucile | 500 | 250 |
| Mitra | 1200 | 600 |

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
| Inizio partita | 500 |
| Ogni colpo a segno | +10 |
| Uccisione | ricompensa del nemico × moltiplicatore della zona |
| Uccisione con colpo in testa | +40 in più |
| Ondata superata | +50 × numero dell'ondata (al massimo +500) |

## Nemici

| Nemico | Vita base | Velocità | Danno per colpo | Ricompensa | Da quale zona |
|---|---|---|---|---|---|
| Mammutones | 100 | 2,1 m/s | 8 ogni 1,2 s | 50 | Parcheggio |
| Mammutones Cornuto | 80 | 4,0 m/s | 9 ogni 1,0 s | 70 | Negozio |
| Mammutones Grosso | 420 | 1,4 m/s | 18 ogni 1,5 s | 160 | Seminterrato |

A ogni ondata la vita sale dell'**8%** e la velocità del **2%**, fino a un massimo di +30%.

## Zone

La zona più avanzata che hai aperto decide quanto sono forti i nemici e quanto rendono.

| Zona | Costo | Vita nemici | Danno nemici | Monete | Nemici che escono |
|---|---|---|---|---|---|
| Parcheggio | — | ×1,0 | ×1,0 | ×1,0 | solo Mammutones |
| Gazebo Buongusto | 750 | ×1,1 | ×1,1 | ×1,15 | solo Mammutones |
| Negozio | 1250 | ×1,25 | ×1,2 | ×1,35 | 70% normali, 30% Cornuti |
| Seminterrato | 2000 | ×1,45 | ×1,35 | ×1,6 | 55% normali, 30% Cornuti, 15% Grossi |
| Magazzino | 3000 | ×1,7 | ×1,5 | ×1,9 | 45% normali, 35% Cornuti, 20% Grossi |

## Ondate

| Valore | Formula |
|---|---|
| Mammutones per ondata | 4 + 2 × ondata |
| Quanti insieme al massimo | 6 + ondata, fino a 14 |
| Tempo tra un'uscita e l'altra | 1,6 s che scende fino a 0,6 s |
| Pausa tra le ondate | 7 s |

## Vita, armatura e oggetti

- La vita è **una sola** (100) e non si ricarica da sola.
- Quando un Mammutones muore, c'è il **10%** di probabilità che lasci un oggetto:
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
