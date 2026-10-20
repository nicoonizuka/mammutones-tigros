/* Bilanciamento: armi, nemici, monete, zone e ondate.
   Tutti i numeri del gioco stanno qui, cosi' si cambiano in un posto solo.
   La spiegazione completa e' in docs/legenda.md */

/* ---------- ARMI ----------
   dmg: danno per colpo al corpo (la testa fa x2)
   rate: secondi minimi tra un colpo e l'altro
   mag: colpi nel caricatore, res: colpi di riserva massimi */
export const WEAPONS = {
  pistola: { n: 'Pistola', dmg: 25, rate: 0.24, mag: 8, res: 64, spread: 0.012, auto: false, pel: 1, reload: 1.3, sound: 0 },
  fucile:  { n: 'Fucile',  dmg: 60, rate: 0.6,  mag: 5, res: 35, spread: 0.004, auto: false, pel: 1, reload: 2.0, sound: 2 },
  pompa:   { n: 'Fucile a pompa', dmg: 30, rate: 0.85, mag: 6, res: 36, spread: 0.075, auto: false, pel: 8, reload: 2.6, sound: 1 },
  ak47:    { n: 'AK-47',   dmg: 40, rate: 0.095, mag: 30, res: 210, spread: 0.02, auto: true, pel: 1, reload: 2.2, sound: 0 },
  deagle:  { n: 'Desert Eagle', dmg: 2500, rate: 0.5, mag: 1, res: 0, spread: 0, auto: false, pel: 1, reload: 0.5, sound: 2, pierce: 1, noPack: 1 },
  mitra:   { n: 'Mitra',   dmg: 22, rate: 0.1,  mag: 30, res: 150, spread: 0.03, auto: true, pel: 1, reload: 2.0, sound: 0 },
};
export const HEADSHOT = 2;

/* armi da comprare al muro: la prima volta compri l'arma, dopo compri le munizioni */
export const WALL_BUYS = [
  { id: 'fucile', cost: 500, ammoCost: 250, x: -4.5, z: -13.9, rot: 0, zone: 'parcheggio' },
  { id: 'mitra', cost: 1200, ammoCost: 600, x: -11.9, z: -31, rot: Math.PI / 2, zone: 'negozio' },
  { id: 'pompa', cost: 1500, ammoCost: 750, x: 60.0, z: -8, rot: Math.PI / 2, zone: 'seminterrato' },
  { id: 'ak47', cost: 3000, ammoCost: 1500, x: -12.0, z: -58.2, rot: Math.PI / 2, zone: 'magazzino' },
  { id: 'deagle', cost: 1500, ammoCost: 800, x: 38, z: -69.95, rot: 0, zone: 'controllo' },
];

/* ---------- NEMICI ----------
   hp: vita all'ondata 1, spd: metri al secondo, dmg: danno di un colpo, atkCd: secondi tra due colpi
   reward: monete per l'uccisione (prima dei moltiplicatori di zona) */
export const ENEMIES = {
  base:    { n: 'Mammutones',         hp: 100, spd: 2.0, dmg: 6,  atkCd: 1.2, reward: 50,  radius: 0.45 },
  cornuto: { n: 'Mammutones Cornuto', hp: 80,  spd: 3.8, dmg: 7,  atkCd: 1.0, reward: 70,  radius: 0.45 },
  ratto:   { n: 'Ratto',              hp: 30,  spd: 4.8, dmg: 3,  atkCd: 0.8, reward: 25,  radius: 0.3 },
  furia:   { n: 'Mammutones Furia',   hp: 45,  spd: 6.0, dmg: 22, atkCd: 1.1, reward: 90,  radius: 0.4 },
  grosso:  { n: 'Mammutones Grosso',  hp: 380, spd: 1.4, dmg: 14, atkCd: 1.5, reward: 160, radius: 0.62 },
};

/* ---------- ZONE ----------
   Ogni zona aperta alza la difficolta' (vita e danno dei nemici) e il guadagno.
   types: quali Mammutones possono uscire quando quella e' la zona piu' avanzata aperta */
export const ZONES = [
  { id: 'parcheggio', n: 'Parcheggio',        cost: 0,    hp: 1.0,  dmg: 1.0,  coins: 1.0, types: { base: 1 } },
  { id: 'gazebo',     n: 'Gazebo Buongusto',  cost: 750,  hp: 1.1,  dmg: 1.1,  coins: 1.15, types: { base: 1 } },
  { id: 'negozio',    n: 'Negozio',           cost: 1250, hp: 1.25, dmg: 1.2,  coins: 1.35, types: { base: 0.7, cornuto: 0.3 } },
  { id: 'seminterrato', n: 'Seminterrato',    cost: 2000, hp: 1.45, dmg: 1.35, coins: 1.6, types: { base: 0.55, cornuto: 0.3, grosso: 0.15 } },
  { id: 'magazzino',  n: 'Magazzino',         cost: 3000, hp: 1.7,  dmg: 1.5,  coins: 1.9, types: { base: 0.35, cornuto: 0.25, grosso: 0.15, furia: 0.25 } },
  { id: 'controllo',  n: 'Zona controllo',    cost: 0,    hp: 1.9,  dmg: 1.6,  coins: 2.2, types: { base: 0.3, cornuto: 0.25, grosso: 0.15, furia: 0.3 } },
];

/* ---------- MONETE ---------- */
export const ECONOMY = {
  start: 750,        // monete all'inizio
  hit: 10,           // ogni colpo a segno
  headKill: 40,      // in piu' se lo uccidi con un colpo in testa
  waveClear: 50,     // per ogni ondata superata, moltiplicato per il numero dell'ondata fino a 10
};

/* ---------- ONDATE ---------- */
export const WAVES = {
  count: w => 3 + w * 2,                         // Mammutones totali nell'ondata
  maxAlive: w => Math.min(5 + w, 12),            // quanti insieme al massimo
  spawnEvery: w => Math.max(0.6, 1.6 - w * 0.08),// secondi tra un'uscita e l'altra
  hpGrowth: 0.06,                                // +8% di vita per ogni ondata
  speedGrowth: 0.02,                             // +2% di velocita' per ondata (massimo +30%)
  break: 7,                                      // secondi di pausa tra le ondate
};

/* ---------- OGGETTI LASCIATI DAI NEMICI ---------- */
export const DROPS = {
  chance: 0.14,
  table: [ { k: 'cura', w: 0.35, heal: 35 }, { k: 'munizioni', w: 0.4 }, { k: 'armatura', w: 0.25, armor: 25 } ],
  maxArmor: 50,
};

export function enemyStats(type, wave, zoneIdx) {
  const E = ENEMIES[type], Z = ZONES[Math.min(zoneIdx, ZONES.length - 1)];
  return {
    hp: Math.round(E.hp * (1 + WAVES.hpGrowth * (wave - 1)) * Z.hp),
    dmg: E.dmg * Z.dmg,
    spd: E.spd * (1 + Math.min(0.3, WAVES.speedGrowth * (wave - 1))),
    reward: Math.round(E.reward * Z.coins),
  };
}
export function pickType(zoneIdx) {
  const t = ZONES[zoneIdx].types; let r = Math.random();
  for (const k in t) { r -= t[k]; if (r <= 0) return k; }
  return 'base';
}

/* ---------- BOSS ---------- */
export const BOSS_FAB = { n: 'Fab La Rue', hp: 3000, spd: 2.5, dmg: 22, atkCd: 1.3, reward: 1500, summonEvery: 7, summonCount: 3, wave: 8 };
export const BOSS_LORIS = { n: 'Loris Busato', hp: 12000, spd: 2.6, dmg: 32, atkCd: 1.2, reward: 5000, summonEvery: 9, wave: 15 };
export const GENERATOR_COST = 1000;
/* inventario: pacchi di munizioni da portare con se' e zaino per alzare il massimo di munizioni */
export const INVENTORY = { packCost: 400, packMax: 3, bags: [{ cost: 800, mult: 1.5 }, { cost: 2000, mult: 2 }] };
/* nel seminterrato una parte dei nemici sono ratti */
export const RAT_SHARE = 0.45;

/* ---------- VITA CHE SI RICARICA ---------- */
export const REGEN = { delay: 5, perSec: 6 };   // dopo 5 s senza colpi la vita torna su di 6 al secondo

/* ---------- MODALITA' SANDBOX ---------- */
export const SANDBOX = { coins: 25000 };        // tutto aperto, corrente e generatori accesi, boss appena entri
