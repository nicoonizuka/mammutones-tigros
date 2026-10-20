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
  deagle:  { n: 'Desert Eagle', dmg: 1000, rate: 0.5, mag: 1, res: 0, spread: 0, auto: false, pel: 1, reload: 0.5, sound: 2, pierce: 1, noPack: 1 },
  katana:  { n: 'Katana',  dmg: 150, rate: 0.5, mag: 1, res: 0, spread: 0, auto: false, pel: 1, reload: 0, sound: 0, melee: 1, range: 3.0, noPack: 1 },
  bazooka: { n: 'Bazooka', dmg: 260, rate: 1.3, mag: 1, res: 9, spread: 0, auto: false, pel: 1, reload: 1.8, sound: 2, explode: 4.5 },
  pistauto: { n: 'Pistola automatica', dmg: 15, rate: 0.075, mag: 20, res: 160, spread: 0.032, auto: true, pel: 1, reload: 1.5, sound: 0 },
  pompauto: { n: 'Fucile a pompa automatico', dmg: 22, rate: 0.26, mag: 12, res: 120, spread: 0.07, auto: true, pel: 7, reload: 2.8, sound: 1 },
  mitragliatore: { n: 'Mitragliatore', dmg: 38, rate: 0.072, mag: 80, res: 560, spread: 0.028, auto: true, pel: 1, reload: 3.4, sound: 0 },
  minigun: { n: 'Minigun', dmg: 46, rate: 0.042, mag: 200, res: 800, spread: 0.04, auto: true, pel: 1, reload: 4.5, sound: 0 },
  mitra:   { n: 'Mitra',   dmg: 22, rate: 0.1,  mag: 30, res: 150, spread: 0.03, auto: true, pel: 1, reload: 2.0, sound: 0 },
  /* mondo 4, il centro di Busto: ogni arma nuova e' piu' forte di quelle prima */
  ar:      { n: 'AR',      dmg: 55, rate: 0.085, mag: 30, res: 240, spread: 0.016, auto: true, pel: 1, reload: 2.0, sound: 0 },
  granate: { n: 'Granate', dmg: 420, rate: 0.9, mag: 1, res: 9, spread: 0, auto: false, pel: 1, reload: 0.6, sound: 2, thrown: 1, explode: 5.5 },
  cecchino: { n: 'Cecchino dorato', dmg: 700, rate: 1.0, mag: 12, res: 48, spread: 0, auto: false, pel: 1, reload: 2.8, sound: 2, pierce: 1 },
};
export const HEADSHOT = 2;

/* armi da comprare al muro: la prima volta compri l'arma, dopo compri le munizioni */
export const WALL_BUYS = [
  { id: 'pistola', cost: 400, ammoCost: 200, x: -4.5, z: -13.9, rot: 0, zone: 'parcheggio' },
  { id: 'fucile', cost: 750, ammoCost: 350, x: -25.5, z: -13.9, rot: 0, zone: 'gazebo' },
  { id: 'mitra', cost: 1600, ammoCost: 800, x: -11.9, z: -31, rot: Math.PI / 2, zone: 'negozio' },
  { id: 'pompa', cost: 2500, ammoCost: 1200, x: 60.0, z: -8, rot: Math.PI / 2, zone: 'seminterrato' },
  { id: 'ak47', cost: 5000, ammoCost: 2500, x: -12.0, z: -58.2, rot: Math.PI / 2, zone: 'magazzino' },
  { id: 'deagle', cost: 3000, ammoCost: 1500, x: 38, z: -69.95, rot: 0, zone: 'controllo' },
];

/* ---------- NEMICI ----------
   hp: vita all'ondata 1, spd: metri al secondo, dmg: danno di un colpo, atkCd: secondi tra due colpi
   reward: monete per l'uccisione (prima dei moltiplicatori di zona) */
export const ENEMIES = {
  base:    { n: 'Mammutones',         hp: 100, spd: 2.0, dmg: 6,  atkCd: 1.2, reward: 50,  radius: 0.45 },
  cornuto: { n: 'Mammutones Cornuto', hp: 80,  spd: 3.8, dmg: 7,  atkCd: 1.0, reward: 70,  radius: 0.45 },
  ratto:   { n: 'Ratto',              hp: 30,  spd: 4.8, dmg: 3,  atkCd: 0.8, reward: 25,  radius: 0.3 },
  furia:   { n: 'Mammutones Furia',   hp: 45,  spd: 6.0, dmg: 22, atkCd: 1.1, reward: 90,  radius: 0.4 },
  orco:    { n: 'Sgherro di Pierre (tubo)', hp: 220, spd: 2.7, dmg: 15, atkCd: 1.1, reward: 120, radius: 0.55 },
  orcone:  { n: 'Sgherro di Pierre (palo)', hp: 340, spd: 2.15, dmg: 22, atkCd: 1.4, reward: 160, radius: 0.6 },
  fachiro: { n: 'Ratto Fachiro',      hp: 120, spd: 4.2, dmg: 10, atkCd: 0.9, reward: 70,  radius: 0.5 },
  impossessato: { n: 'Mammutones Impossessato', hp: 260, spd: 2.6, dmg: 14, atkCd: 1.1, reward: 120, radius: 0.5 },
  grosso:  { n: 'Mammutones Grosso',  hp: 380, spd: 1.4, dmg: 14, atkCd: 1.5, reward: 160, radius: 0.62 },
  /* mondo 4 */
  sgherrone: { n: 'Sgherro potenziato', hp: 480, spd: 2.6, dmg: 26, atkCd: 1.2, reward: 220, radius: 0.62 },
  capra:   { n: 'Capra Mammutones',   hp: 170, spd: 6.4, dmg: 20, atkCd: 0.8, reward: 140, radius: 0.5 },
};

/* ---------- ZONE ----------
   Ogni zona aperta alza la difficolta' (vita e danno dei nemici) e il guadagno.
   types: quali Mammutones possono uscire quando quella e' la zona piu' avanzata aperta */
export const ZONES = [
  { id: 'parcheggio', n: 'Parcheggio',        cost: 0,    hp: 1.0,  dmg: 1.0,  coins: 1.0, types: { base: 1 } },
  { id: 'gazebo',     n: 'Gazebo Buongusto',  cost: 1000, hp: 1.1,  dmg: 1.1,  coins: 1.15, types: { base: 1 } },
  { id: 'negozio',    n: 'Negozio',           cost: 1750, hp: 1.25, dmg: 1.2,  coins: 1.35, types: { base: 0.7, cornuto: 0.3 } },
  { id: 'seminterrato', n: 'Seminterrato',    cost: 3000, hp: 1.45, dmg: 1.35, coins: 1.6, types: { base: 0.55, cornuto: 0.3, grosso: 0.15 } },
  { id: 'magazzino',  n: 'Magazzino',         cost: 5000, hp: 1.7,  dmg: 1.5,  coins: 1.9, types: { base: 0.35, cornuto: 0.25, grosso: 0.15, furia: 0.25 } },
  { id: 'controllo',  n: 'Zona controllo',    cost: 0,    hp: 1.9,  dmg: 1.6,  coins: 2.2, types: { base: 0.3, cornuto: 0.25, grosso: 0.15, furia: 0.3 } },
  /* mondo 2, Happy Shopping: parte piu' facile dello scontro con Loris e sale piano piano */
  { id: 'hs-parcheggio', n: 'Parcheggio Happy Shopping', cost: 0, hp: 1.2, dmg: 1.15, coins: 1.3, types: { base: 0.7, cornuto: 0.3 } },
  { id: 'hs-negozio', n: 'Negozio Happy Shopping', cost: 1000, hp: 1.4, dmg: 1.3, coins: 1.55, types: { base: 0.45, cornuto: 0.3, grosso: 0.15, furia: 0.1 } },
  /* mondo 3: il Tribunale */
  { id: 'tr-parcheggio', n: 'Parcheggio del Tribunale', cost: 0, hp: 1.5, dmg: 1.35, coins: 1.7, types: { base: 0.3, cornuto: 0.2, grosso: 0.1, impossessato: 0.1, ratto: 0.12, fachiro: 0.18 } },
  { id: 'tr-piazza', n: 'Piazza dei tavolini', cost: 0, hp: 1.65, dmg: 1.45, coins: 1.9, types: { orco: 0.35, orcone: 0.2, base: 0.2, impossessato: 0.25 } },
  { id: 'tr-garage', n: 'Garage di Pika', cost: 0, hp: 1.8, dmg: 1.55, coins: 2.1, types: { ratto: 0.3, fachiro: 0.35, impossessato: 0.35 } },
  { id: 'tr-casa', n: 'Casa di Pika', cost: 0, hp: 1.95, dmg: 1.65, coins: 2.3, types: { impossessato: 0.5, orco: 0.25, orcone: 0.25 } },
  /* mondo 4: il centro di Busto, infestato. Gli sgherri potenziati escono solo dopo qualche ondata */
  { id: 'bu-fontana', n: 'Piazza Garibaldi', cost: 0, hp: 1.9, dmg: 1.6, coins: 2.3, types: { base: 0.22, cornuto: 0.14, furia: 0.12, grosso: 0.1, impossessato: 0.14, orco: 0.18, orcone: 0.1 } },
  { id: 'bu-mac', n: 'Il Mac', cost: 0, hp: 2.05, dmg: 1.7, coins: 2.5, types: { base: 0.15, cornuto: 0.15, furia: 0.15, impossessato: 0.15, orco: 0.15, orcone: 0.1, sgherrone: 0.15 } },
  { id: 'bu-bar', n: 'La zona dei bar', cost: 0, hp: 2.2, dmg: 1.8, coins: 2.7, types: { orco: 0.22, orcone: 0.18, sgherrone: 0.25, furia: 0.15, impossessato: 0.2 } },
  { id: 'bu-chiesa', n: 'Piazza San Giovanni', cost: 0, hp: 2.35, dmg: 1.9, coins: 2.9, types: { capra: 0.3, furia: 0.2, impossessato: 0.2, grosso: 0.1, sgherrone: 0.2 } },
  { id: 'bu-catacombe', n: 'Le catacombe', cost: 0, hp: 2.45, dmg: 1.95, coins: 3.0, types: { capra: 0.3, base: 0.2, furia: 0.2, impossessato: 0.2, grosso: 0.1 } },
  { id: 'bu-sardegna', n: 'Sardegna, il regno dei Mammutones', cost: 0, hp: 2.6, dmg: 2.0, coins: 3.2, types: { capra: 0.45, furia: 0.2, base: 0.15, impossessato: 0.2 } },
];
/* indice in ZONES della prima zona del mondo 2 */
export const HS_ZONE0 = 6;

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

export const ENEMY_DMG = 1.2;   // tutti i nemici fanno il 20% di danno in piu'
export function enemyStats(type, wave, zoneIdx) {
  const E = ENEMIES[type], Z = ZONES[Math.min(zoneIdx, ZONES.length - 1)];
  return {
    hp: Math.round(E.hp * (1 + WAVES.hpGrowth * (wave - 1)) * Z.hp),
    dmg: E.dmg * Z.dmg * ENEMY_DMG,
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
export const BOSS_FAB = { n: 'Fab La Rue', hp: 2000, spd: 2.4, dmg: 16, atkCd: 1.4, reward: 1500, summonEvery: 9, summonCount: 2, wave: 8 };
export const BOSS_LORIS = { n: 'Loris Busato', hp: 12000, spd: 3.3, dmg: 26, atkCd: 1.25, reward: 5000, summonEvery: 10, wave: 15 };
/* il Capo dell'Happy Shopping: lento, tantissima vita, botte pesanti e ogni tanto carica a testa bassa */
export const BOSS_CAPO = { n: "Il Capo dell'Happy Shopping", hp: 6000, spd: 1.9, dmg: 30, atkCd: 1.5, reward: 3000, summonEvery: 12, wave: 7,
  charge: { every: 7, wind: 0.9, dur: 1.2, mult: 4.2, dmg: 45 } };
export const HS_START_COINS = 900;
export const GENERATOR_COST = 2000;
/* inventario: pacchi di munizioni da portare con se' e zaino per alzare il massimo di munizioni */
export const INVENTORY = { packCost: 600, packMax: 3, bags: [{ cost: 1500, mult: 1.5 }, { cost: 3500, mult: 2 }] };
/* nel seminterrato una parte dei nemici sono ratti */
export const RAT_SHARE = 0.45;

/* ---------- VITA CHE SI RICARICA ---------- */
export const REGEN = { delay: 5, perSec: 6 };   // dopo 5 s senza colpi la vita torna su di 6 al secondo

/* ---------- MODALITA' SANDBOX ---------- */
export const SANDBOX = { coins: 40000 };        // tutto aperto, corrente e generatori accesi, boss appena entri

/* ---------- MONDO 3: IL TRIBUNALE ---------- */
export const TR_ZONE0 = 8;
export const TR_START_COINS = 1500;
export const TR_FAB_WAVE = 5;
export const TR_GARAGE_COST = 7000;  // serve anche la chiave che lascia Fabio Regaglia
export const TR_POWER_COST = 9000;   // riattivare la corrente per l'ascensore   // Fab La Rue blocca la strada dal round 5
export const BOSS_WELL = { n: 'Pierre', hp: 6500, spd: 2.5, dmg: 26, atkCd: 1.2, reward: 3500, summonEvery: 9, wave: 6 };
export const BOSS_FABIO = { n: 'Fabio Regaglia', hp: 11000, spd: 1.9, dmg: 42, atkCd: 1.8, reward: 5000, summonEvery: 14, wave: 10 };
export const BOSS_PIKA = { n: 'Pika', hp: 9000, hpGarage: 5000, spd: 2.7, dmg: 24, atkCd: 1.1, reward: 7000, summonEvery: 11, throwEvery: 2.2, throwDmg: 16 };

/* ---------- CASSA DELLE ARMI (una per mappa, in una zona avanzata) ---------- */
export const BOX_COST = 6500;
export const BOX_POOL = [ { id: 'fucile', w: 10 }, { id: 'pompa', w: 10 }, { id: 'mitra', w: 10 }, { id: 'pistauto', w: 10 }, { id: 'ak47', w: 9 }, { id: 'deagle', w: 6 },
  { id: 'pompauto', w: 8 }, { id: 'bazooka', w: 6 }, { id: 'mitragliatore', w: 5 }, { id: 'katana', w: 5 }, { id: 'minigun', w: 3 } ];
/* ---------- BOTTIGLIE: ogni tanto ne compare una, bevendola perdi un po' di vita ma hai un potere per poco ---------- */
export const BOTTLE = { every: [45, 75], hpCost: 15, dur: 15 };
export const BOTTLE_FX = [
  { k: 'ammo', n: 'Munizioni infinite', w: 25 }, { k: 'head', n: 'Solo colpi in testa', w: 22 }, { k: 'saldi', n: 'Saldi: tutto a metà prezzo', w: 20 },
  { k: 'coins', n: 'Soldi doppi', w: 20 }, { k: 'spada', n: 'Ottieni la spada', w: 9 }, { k: 'insta', n: 'Un colpo, un morto (tranne i boss)', w: 4 } ];
/* ---------- STAMINA ---------- */
export const STAMINA = { drain: 0.24, regen: 0.18, min: 0.25 };   // circa 4 secondi di corsa, poi devi riprendere fiato

/* ---------- MONDO 4: IL CENTRO DI BUSTO ---------- */
export const BU_ZONE0 = 12;
export const BU_START_COINS = 2500;
export const BU_SGHERRONI_WAVE = 4;                 // da qui escono gli sgherri potenziati
export const BU_COSTS = { mac: 8000, bar: 10000, chiesa: 12000, portale: 20000 };
export const BU_CATA_KILLS = 12;                    // Mammutones da uccidere nelle catacombe prima del rituale
/* Pierre per l'ultima volta (fontana, round 5), Corti maledetto (Mac, round 10), i cugini Progni (bar, round 15),
   Loris in chiesa (round 18) e Loris gigante, il Re dei Mammutones, in Sardegna */
export const BOSS_PIERRE4 = { n: 'Pierre', hp: 9500, spd: 2.7, dmg: 30, atkCd: 1.15, reward: 4500, summonEvery: 9, wave: 5 };
export const BOSS_CORTI = { n: 'Corti', hp: 15000, spd: 1.8, dmg: 38, atkCd: 1.6, reward: 6000, summonEvery: 13, wave: 10, throwEvery: 2.1, throwDmg: 16 };
export const BOSS_PROGNI = { n: 'I cugini Progni', hp: 9000, spd: 2.9, dmg: 30, atkCd: 1.1, reward: 5000, summonEvery: 10, wave: 15 };
export const BOSS_LORIS4 = { n: 'Loris Busato', hp: 18000, spd: 3.4, dmg: 32, atkCd: 1.2, reward: 8000, summonEvery: 10, wave: 18 };
export const BOSS_RE = { n: 'Loris, il Re dei Mammutones', hp: 36000, spd: 3.3, dmg: 44, atkCd: 1.5, reward: 15000, summonEvery: 9, throwEvery: 2.6, throwDmg: 28, stompEvery: 5, stompDmg: 34 };
