/* I personaggi giocabili: nome, colore della scheda, modello 3D e potere.
   model e' l'indice in buildHuman (styled.js). Mirko non e' giocabile: e' il modello 6. */
export const POWERS = {
  aim:    { k: 'aim',    n: 'Precisione',          d: 'Mira assistita, danno ×1,5 e spari più veloce', dur: 6,  cd: 22 },
  heal:   { k: 'heal',   n: 'Cura',                d: 'Recuperi 60 di vita',                           dur: 0,  cd: 28 },
  speed:  { k: 'speed',  n: 'Velocità',            d: 'Corri quasi il doppio',                         dur: 6,  cd: 18 },
  shield: { k: 'shield', n: 'Scudo',               d: 'Non subisci danni',                             dur: 6,  cd: 24 },
  ammo:   { k: 'ammo',   n: 'Munizioni infinite',  d: 'Spari senza ricaricare',                        dur: 8,  cd: 24 },
  call:   { k: 'call',   n: 'Chiama Mirko',        d: 'Mirko arriva e combatte al tuo fianco',          dur: 12, cd: 35 },
  coins:  { k: 'coins',  n: 'Monete doppie',       d: 'Le monete che guadagni valgono il doppio',      dur: 12, cd: 30 },
  double: { k: 'double', n: 'Doppio colpo',        d: 'Ogni colpo ne spara due',                       dur: 8,  cd: 24 },
};
export const ROSTER = [
  { name: 'Nathan Mascheroni', short: 'Nathan', c: '#5ab0ff', sprite: 0, model: 0, power: 'aim' },
  { name: 'Dado',              short: 'Dado',   c: '#5fd38a', sprite: 1, model: 1, power: 'heal' },
  { name: 'Nico',              short: 'Nico',   c: '#4f8cf0', sprite: 2, model: 2, power: 'speed' },
  { name: 'Slime',             short: 'Slime',  c: '#f2b93b', sprite: 3, model: 3, power: 'shield' },
  { name: 'Leonardo Ceriotti', short: 'Leo',    c: '#a8d14f', sprite: 4, model: 4, power: 'ammo', unlock: 'loris' },
  { name: 'Ponta',             short: 'Ponta',  c: '#ff7a6a', sprite: 5, model: 5, power: 'call' },
  { name: 'Jacopo Castiglioni',short: 'Jacopo', c: '#c07ae8', sprite: 7, model: 7, power: 'double', unlock: 'fab' },
  { name: 'Corti',             short: 'Corti',  c: '#e8c35a', sprite: 8, model: 8, power: 'coins' },
];
export const MIRKO_MODEL = 6;
