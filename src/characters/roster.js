/* I personaggi giocabili: nome, colore della scheda, modello 3D e potere.
   model e' l'indice in buildHuman (styled.js). Mirko non e' giocabile: e' il modello 6. */
export const POWERS = {
  aim:    { k: 'aim',    n: 'Precisione',          d: 'Mira assistita, danno ×1,5 e spari più veloce', dur: 6,  cd: 22 },
  heal:   { k: 'heal',   n: 'Cura',                d: 'Recuperi 60 di vita',                           dur: 0,  cd: 28 },
  speed:  { k: 'speed',  n: 'Velocità e forza',    d: 'Corri quasi il doppio e fai quasi il doppio dei danni',                         dur: 6,  cd: 18 },
  shield: { k: 'shield', n: 'Scudo',               d: 'Non subisci danni',                             dur: 6,  cd: 24 },
  ammo:   { k: 'ammo',   n: 'Munizioni infinite',  d: 'Spari senza ricaricare',                        dur: 8,  cd: 24 },
  call:   { k: 'call',   n: 'Chiama Mirko',        d: 'Mirko arriva e combatte al tuo fianco',          dur: 12, cd: 35 },
  coins:  { k: 'coins',  n: 'Monete doppie',       d: 'Le monete che guadagni valgono il doppio',      dur: 12, cd: 30 },
  double: { k: 'double', n: 'Doppio colpo',        d: 'Ogni colpo ne spara due',                       dur: 8,  cd: 24 },
  blast:  { k: 'blast',  n: "Onda d'urto",         d: 'Respinge e ferisce tutti i nemici vicini',      dur: 0,  cd: 20 },
  rage:   { k: 'rage',   n: 'Furia',               d: 'Ogni colpo fa il doppio dei danni',             dur: 9,  cd: 22 },
  albanesi: { k: 'albanesi', n: 'Amici albanesi',  d: 'Arrivano due amici albanesi con l\'AK-47: sparano a raffica ai Mammutones (non al boss)', dur: 6, cd: 34 },
  fischio:  { k: 'fischio',  n: 'Fischio',         d: 'Fischia con le dita: tutti i nemici vicini restano congelati per qualche secondo', dur: 0, cd: 24 },
  lenti:    { k: 'lenti',    n: 'Proiettili lenti', d: 'Per qualche secondo ogni nemico che colpisci rallenta tantissimo', dur: 9, cd: 22 },
  matto:       { k: 'matto',       n: 'Da matto',        d: 'Il potere più inutile del gioco: Libe fa una cavolata da matto e perdi la partita', dur: 0, cd: 5 },
  pipistrelli: { k: 'pipistrelli', n: 'Pipistrelli',     d: 'Il re dei vampiri evoca tre pipistrelli che mordono i nemici più vicini', dur: 11, cd: 26 },
  esplosivi:   { k: 'esplosivi',   n: 'Colpi esplosivi', d: 'Ogni colpo fa una piccola esplosione e fa ×1,5 di danno, con qualsiasi arma', dur: 9, cd: 24 },
  sigarette:   { k: 'sigarette',   n: 'Sigarette',       d: 'Mentre spara, Pika lancia pacchetti di sigarette di contrabbando che fanno molto male', dur: 9, cd: 24 },
  collare:  { k: 'collare',  n: 'Collare',          d: 'I Mammutones vicini a Napo diventano suoi alleati e combattono al posto suo (non i boss)', dur: 10, cd: 30 },
  algerino: { k: 'algerino', n: "L'Algerino",       d: 'Per qualche secondo tutti i nemici hanno la vita dimezzata: ogni colpo vale doppio', dur: 7, cd: 26 },
  gratis:   { k: 'gratis',   n: 'Arma gratis',      d: 'La prossima arma che compri al muro non la paghi', dur: 0, cd: 45 },
  freeze: { k: 'freeze', n: 'Rallentatore',        d: 'Tutti i nemici rallentano quasi fino a fermarsi',     dur: 7,  cd: 26 },
};
export const ROSTER = [
  { name: 'Nathan Mascheroni', short: 'Nathan', c: '#5ab0ff', sprite: 0, model: 0, power: 'aim' },
  { name: 'Dado',              short: 'Dado',   c: '#5fd38a', sprite: 1, model: 1, power: 'heal' },
  { name: 'Nico',              short: 'Nico',   c: '#4f8cf0', sprite: 2, model: 2, power: 'speed' },
  { name: 'Slime',             short: 'Slime',  c: '#f2b93b', sprite: 3, model: 3, power: 'shield' },
  { name: 'Leonardo Ceriotti', short: 'Leo',    c: '#a8d14f', sprite: 4, model: 4, power: 'ammo', unlock: 'loris' },
  { name: 'Ponta',             short: 'Ponta',  c: '#ff7a6a', sprite: 5, model: 5, power: 'call' },
  { name: 'Jacopo Castiglioni',short: 'Jacopo', c: '#c07ae8', sprite: 7, model: 7, power: 'double', unlock: 'fab' },
  { name: 'Corti',             short: 'Corti',  c: '#e8c35a', sprite: 8, model: 8, power: 'coins', unlock: 'corti' },
  /* arrivano dal mondo 2, l'Happy Shopping */
  { name: 'Tefalin',           short: 'Tefalin', c: '#ff6a7a', sprite: 9,  model: 9,  power: 'albanesi', world: 2 },
  { name: 'Diego Margarito',   short: 'Diego',  c: '#f2a63b', sprite: 11, model: 11, power: 'fischio', world: 2 },
  { name: 'Debe',              short: 'Debe',   c: '#7ad0ff', sprite: 10, model: 10, power: 'lenti', unlock: 'hs', world: 2 },
  /* arrivano dal mondo 3, il Tribunale: si liberano nel garage di Pika (poteri provvisori) */
  { name: 'Leodessi',        short: 'Leodessi', c: '#9aa0ff', sprite: 12, model: 14, power: 'rage', world: 3 },
  { name: 'Libe il matto',   short: 'Libe', c: '#d8c08a', sprite: 13, model: 15, power: 'matto', world: 3 },
  { name: 'Bulegato',        short: 'Bulegato', c: '#c0303a', sprite: 14, model: 16, power: 'pipistrelli', world: 3 },
  { name: 'Castelluccio',    short: 'Castelluccio', c: '#8ad0a0', sprite: 15, model: 17, power: 'esplosivi', world: 3 },
  { name: 'Pika',            short: 'Pika', c: '#e8c060', sprite: 16, model: 18, power: 'sigarette', world: 3 },
  /* arrivano dal mondo 4, il centro di Busto: Napo e Ali si liberano ai bar, DJ Gianfra in Sardegna */
  { name: 'Napo',            short: 'Napo', c: '#6ac0a0', sprite: 17, model: 20, power: 'collare', world: 4, unlock: 'bar' },
  { name: 'Ali Debbah',      short: 'Ali', c: '#c0a0ff', sprite: 18, model: 21, power: 'algerino', world: 4, unlock: 'bar' },
  { name: 'DJ Gianfra',      short: 'Gianfra', c: '#5ad0ff', sprite: 19, model: 22, power: 'gratis', world: 4, unlock: 'busto' },
];
export const DAMIANO_MODEL = 12;
export const LIBE_MODEL = 15;
export const MIRKO_MODEL = 6;
