/* Mammutones al Tigros - avvio, giocatore, nemici, armi, HUD e loop */
import * as THREE from 'three';
import './style.css';
import './app.js';
import { ROSTER, POWERS, MIRKO_MODEL, DAMIANO_MODEL } from './characters/roster.js';
import { CH as SPRITES } from './characters/sprites.js';
import { pad, pollPad, BTN } from './input/gamepad.js';
import { isTouch, touch, initTouch, takeLook } from './input/touch.js';
const SPR = SPRITES.map(c => c.fn());
import { loadHD, preloadHD, hdOn, setHD } from './characters/hd.js';
import { buildHuman, buildEnemy, buildWeapon, buildFabBoss, buildLoris, buildCapo, buildWell, buildFabio, buildPikaBoss, buildCortiBoss, buildProgno, buildLorisRe } from './characters/styled.js';
import { TX, TRB, CASA, GARAGE, inCasa, inGarage, trRegion, TR_ORDER, TR_GATE, TR_GDOOR, TR_START, FAB_SPOT3, WELL_SPOT, FABIO_SPOT, PIKA_SPOT_G, PIKA_SPOT_C, LIFT, CASA_START, TR_SPAWNS, TR_BUYS, trGate, trGateSolid, trGDoor, trGDoorSolid, CAGES, liftLed, updateTR, trFx, TR_PANEL, trPanelLed, PAUL, paulM } from './world/tribunale.js';
import { hemi } from './render/engine.js';
import { makeSky, setSky, updateSky } from './render/sky.js';
import { OX, HSB, HSTORE, inHSStore, HS_DOOR, HS_START, CAPO_SPOT, HS_SPAWNS_OUT, HS_SPAWNS_IN, HS_BUYS, hsDoor, hsDoorSolid, DAMIANO, updateHS, applyWorldLook } from './world/happyshopping.js';
import { mat, box, sign } from './render/textures.js';
import { renderer, scene, camera, solids, blockers, solid, BOUNDS, bakeStatic, sun } from './render/engine.js';
import { BX, BUB, MACIN, CHIESA, inMac, inChiesa, buRegion, BU_LOW, BU_START, updateBU, buAnim, BU_BUYS, BU_SPAWNS, BU_DOORS, buGT, buMacDoor, buMacSolid, buBarGate, buPiazzaGate, buChurchDoor, buChurchSolid, buHole, buSeal, CATA, inCata, CATA_START, PORTAL, BELLS, setTablet, setPortal, SARD, inSard, SARD_START, RE_SPOT, updateSheep } from './world/busto.js';
import { gzBar, gzSolids } from './world/parking.js';
import { STORE, DOOR, inStore, STORE_SPAWNS, storeDoor, doorSolid, updateStore, ESCALATOR, WAREHOUSE_DOOR, wareDoor, wareDoorSolid } from './world/store.js';
import { audio, tone, shotSound, click, reloadSound, bell, pickS, buy, denied, hurt } from './audio.js';
import { WEAPONS, HEADSHOT, WALL_BUYS, ZONES, ECONOMY, WAVES, DROPS, enemyStats, pickType, ENEMIES, BOSS_FAB, RAT_SHARE, BOSS_LORIS, GENERATOR_COST, INVENTORY, REGEN, SANDBOX, BOSS_CAPO, HS_ZONE0, HS_START_COINS, TR_ZONE0, TR_START_COINS, TR_FAB_WAVE, BOX_COST, BOX_POOL, BOTTLE, BOTTLE_FX, STAMINA, TR_GARAGE_COST, TR_POWER_COST, BOSS_WELL, BOSS_FABIO, BOSS_PIKA, BU_ZONE0, BU_START_COINS, BU_SGHERRONI_WAVE, BU_COSTS, BU_CATA_KILLS, BOSS_PIERRE4, BOSS_CORTI, BOSS_PROGNI, BOSS_LORIS4, BOSS_RE } from './config/balance.js';
import { inOffice, WARE, inWare, WARE_SPAWNS, GENERATORS, officeDoor, officeDoorSolid, OFFICE_DOOR, LORIS_SPOT, updateWare } from './world/warehouse.js';
import './world/basement.js';
import { BASE, inBasement, BASE_START, BASE_ESCALATOR, PANEL, LAIR, BASE_SPAWNS, panelLed, updateBasement } from './world/basement.js';
import { initFx, muzzleFlash, updateFx, shake } from './render/fx.js';

const $ = id => document.getElementById(id);
const V3 = THREE.Vector3;

/* ===================== STATO ===================== */
let P, charIdx = 0, pModel, state = 'menu', enemies = [], drops = [], tracers = [], sparks = [];
let lastUnlock = null, mode = 'adv', quiet = false, sinceHit = 99, god = false, stickDir = 0;
let sprintToggle = false, menuIdx = 0, boss = null, fabDead = false, lorisDead = false, power = false, packs = 0, bag = 0;
/* world 1 = Tigros, world 2 = Happy Shopping */
let world = 1, pickWorld = 1, capoDead = false, rings = [];
/* mondo 3 = Tribunale */
let wellDead = false, fabioDead = false, pikaFled = false, pikaDead = false, lorisScene = false, casaT = 0, hostile = [], hasKey = false, trPower = false, trKey = null;
/* mondo 4 = centro di Busto: chi e' battuto, cosa e' aperto, il talismano, il rituale */
let bu = {}; let seenBU = false;
const BU_ORDER = { bfontana: 0, bmacin: 1, bbar: 2, bpiazza: 3, bchiesa: 3, bcata: 4, bsard: 5 };
const bagMult = () => (bag ? INVENTORY.bags[bag - 1].mult : 1);
const maxRes = w => (WEAPONS[w.id].noPack ? 0 : Math.round(WEAPONS[w.id].res * bagMult()));
const region = p => (world === 4 ? buRegion(p) : world === 3 ? trRegion(p) : world === 2 ? (inHSStore(p) ? 'hsin' : 'hsout') : inBasement(p) ? 'base' : inWare(p) ? 'ware' : inStore(p) ? 'store' : 'out');
const zoneIdx = () => (world === 3 ? TR_ZONE0 + zone : world === 2 ? HS_ZONE0 + zone : zone);
let wave = 0, toSpawn = 0, spawnT = 0, breakT = 0, alive = 0, kills = 0, coins = ECONOMY.start, mirko = null, zone = 0, time = 0;
const keys = {}; let yaw = Math.PI, pitch = -0.12, mouseDown = false, fireT = 0, locked = false, rDrag = false, everLocked = false;
const SPAWN = {
  parcheggio: [[-30, 28], [0, 28.5], [30, 28], [38.5, 12], [-38.5, 20], [38.5, -4], [-38.5, 0]],
  gazebo: [[-34, -12.5], [-16, -13]],
};
const gzOpen = () => zone >= 1;

/* ===================== GIOCATORE E ARMI ===================== */
function newWeapon(id) { const W = WEAPONS[id]; return { ...W, id, ammo: W.mag, res: W.res }; }
/* ---------- prima persona: arma davanti alla camera ---------- */
let fp = false; try { fp = localStorage.getItem('mt_fp') === '1'; } catch (_) {}
/* l'arma in prima persona sta in una scena a parte disegnata sopra a tutto: cosi' non entra mai nei muri */
const vmScene = new THREE.Scene(), vmRoot = new THREE.Group(), vm = new THREE.Group(); vmScene.add(vmRoot); vmRoot.add(vm); let vmKick = 0;
vmScene.add(new THREE.HemisphereLight('#fff4e0', '#5a5048', 1.1)); { const dl = new THREE.DirectionalLight('#ffffff', 1.4); dl.position.set(1, 2, 1.5); vmScene.add(dl); }
const skinM = new THREE.MeshStandardMaterial({ color: '#e0b48e', roughness: 0.7 });
function buildVM() {
  while (vm.children.length) vm.remove(vm.children[0]);
  if (!P) return; const g = buildWeapon(P.weapons[P.cur].id); g.rotation.y = Math.PI; vm.add(g); vm.userData.gun = g;
  const hand = new THREE.Mesh(new THREE.SphereGeometry(0.045, 10, 8), skinM); hand.position.set(0, -0.06, 0.02); vm.add(hand);
  vm.traverse(o => { if (o.isMesh) { o.castShadow = false; o.renderOrder = 10; } });
}
function hdLabel() { $('hdbtn').textContent = hdOn ? 'Grafica: realistica' : 'Grafica: classica'; }
function setFP(on) { fp = on; try { localStorage.setItem('mt_fp', on ? '1' : '0'); } catch (_) {} if (state === 'play') feed(on ? 'Visuale in prima persona' : 'Visuale in terza persona'); }
function equip() {
  buildVM();
  const hd = pModel.userData.hd;
  if (hd) { const g = buildWeapon(P.weapons[P.cur].id); g.traverse(o => { if (o.isMesh) o.castShadow = true; }); hd.attachGun(g, P.weapons[P.cur].id); pModel.userData.gun = g; return; }
  const A = pModel.userData.P.armR, hand = A.userData.hand;
  if (pModel.userData.gun) A.remove(pModel.userData.gun);
  const g = buildWeapon(P.weapons[P.cur].id); g.position.copy(hand.position); g.position.y -= 0.02; g.rotation.x = Math.PI / 2;
  g.traverse(o => { if (o.isMesh) o.castShadow = true; });
  A.add(g); pModel.userData.gun = g;
}
function newPlayer(i) {
  P = { pos: new V3(4, 0, -2), vy: 0, hp: 100, ar: 0, weapons: [newWeapon('pistola')], cur: 0, reloadT: 0, pw: POWERS[ROSTER[i].power], pwT: 0, pwCd: 0, hurtT: 0, walk: 0, stam: 1, tired: false };
  yaw = 0; pitch = -0.1; applyModel(i);
}
function applyModel(i) {
  if (pModel) scene.remove(pModel);
  pModel = buildHuman(ROSTER[i].model); pModel.position.copy(P.pos); scene.add(pModel); equip();
  /* modello realistico: si carica in background e prende il posto di quello a blocchi */
  const id = ROSTER[i].hd, tok = ++hdTok;
  if (hdOn && id) { if (P.pw.k === 'call') preloadHD('mirko');
    loadHD(id).then(h => { if (tok !== hdTok || !P) return; const old = pModel; scene.remove(old); pModel = h.root; pModel.position.copy(old.position); pModel.rotation.copy(old.rotation); scene.add(pModel); equip(); })
      .catch(e => console.warn('modello HD non caricato', id, e)); }
}
let hdTok = 0;
function switchWeapon(k) { if (!P.weapons[k] || k === P.cur) return; P.cur = k; P.reloadT = 0; equip(); }

/* ===================== NEMICI ===================== */
/* in sandbox la difficolta' dipende da dove sei, in avventura dalla zona piu' avanzata aperta */
function diffZone() { if (world === 4) return BU_ZONE0 + (P ? BU_ORDER[buRegion(P.pos)] : 0); if (world === 3) return TR_ZONE0 + (P ? TR_ORDER[trRegion(P.pos)] : zone); if (world === 2) return HS_ZONE0 + (mode === 'sandbox' && P ? (inHSStore(P.pos) ? 1 : 0) : zone); if (mode !== 'sandbox' || !P) return zone; const r = region(P.pos); return r === 'base' ? 3 : r === 'ware' ? (inOffice(P.pos) ? 5 : 4) : r === 'store' ? 2 : 1; }
function spawnPoints() {
  if (world === 4) return BU_SPAWNS[P ? buRegion(P.pos) : 'bfontana'];
  if (world === 3) return TR_SPAWNS[P ? trRegion(P.pos) : 'trpark'];
  if (world === 2) { if (mode === 'sandbox' && P) return inHSStore(P.pos) ? HS_SPAWNS_IN : HS_SPAWNS_OUT; return zone >= 1 ? HS_SPAWNS_OUT.concat(HS_SPAWNS_IN) : HS_SPAWNS_OUT; }
  if (mode === 'sandbox' && P && !inBasement(P.pos)) { const r = region(P.pos); return r === 'ware' ? WARE_SPAWNS : r === 'store' ? STORE_SPAWNS : SPAWN.parcheggio.concat(SPAWN.gazebo); } if (P && inBasement(P.pos)) return BASE_SPAWNS; let pts = SPAWN.parcheggio; if (gzOpen()) pts = pts.concat(SPAWN.gazebo); if (zone >= 2) pts = pts.concat(STORE_SPAWNS, STORE_SPAWNS); if (zone >= 4) pts = pts.concat(WARE_SPAWNS, WARE_SPAWNS, WARE_SPAWNS); return pts; }
function spawnEnemy(forceType, at) {
  const pts = spawnPoints(); const p = at || pts[Math.floor(Math.random() * pts.length)];
  const down = world !== 4 && P && inBasement(P.pos);
  let type = forceType || (down && Math.random() < RAT_SHARE ? 'ratto' : pickType(diffZone()));
  if (world === 4 && !forceType && type === 'sgherrone' && wave < BU_SGHERRONI_WAVE) type = 'orco'; const st = enemyStats(type, wave, diffZone());
  const m = buildEnemy(type); m.position.set(p[0] + (Math.random() - 0.5) * 2, 0, p[1] + (Math.random() - 0.5) * 2); scene.add(m);
  const e = { m, type, hp: st.hp, max: st.hp, dmg: st.dmg, reward: st.reward, atkCd: ENEMIES[type].atkCd, spd: st.spd * (0.9 + Math.random() * 0.2), atk: 0.6, dead: 0, stuck: 0, side: 0, walk: Math.random() * 6, r: 0.45 * m.scale.x, kick: 0 };
  m.userData.hit.body.userData.enemy = e; m.userData.hit.head.userData.enemy = e; m.userData.hit.head.userData.head = true;
  enemies.push(e); alive++; if (type !== 'ratto') bell(); return e;
}
/* tutti i boss: dati, modello, dove escono, nome sulla barra, chi chiamano */
const BOSSK = {
  fab: { B: BOSS_FAB, build: buildFabBoss, at: () => (world === 3 ? FAB_SPOT3 : LAIR), r: 0.55, name: 'Fab La Rue · Re dei ratti', minions: ['ratto', 'ratto', 'ratto'], call: 'Fab chiama i ratti!',
         title: 'Fab La Rue!', sub: () => (world === 3 ? 'Ti aspettava: blocca la strada per il Tribunale' : 'Il re dei ratti esce dalla tana') },
  loris: { B: BOSS_LORIS, build: buildLoris, at: () => LORIS_SPOT, r: 0.65, name: 'Loris Busato · Capo dei Mammutones', minions: ['furia', 'furia', 'base', 'base'], call: 'Loris chiama i Mammutones!', title: 'Loris Busato!', sub: () => 'Il capo dei Mammutones esce dall\'ufficio' },
  capo: { B: BOSS_CAPO, build: buildCapo, at: () => CAPO_SPOT, r: 0.85, name: 'Il Capo · Padrone dell\'Happy Shopping', minions: ['cornuto', 'base', 'base'], call: 'Il Capo chiama i Mammutones dal magazzino!', title: 'Il Capo!', sub: () => 'Esce dal magazzino: occhio quando abbassa la testa e carica' },
  well: { B: BOSS_WELL, build: buildWell, at: () => WELL_SPOT, r: 0.6, name: 'Pierre · Capo degli sgherri', minions: ['orco', 'orco', 'orcone'], call: 'Pierre chiama i suoi sgherri!', title: 'Pierre!', sub: () => 'Arriva ai tavolini con i suoi sgherri' },
  fabio: { B: BOSS_FABIO, build: buildFabio, at: () => FABIO_SPOT, r: 0.75, name: 'Fabio Regaglia · Il gigante maledetto', minions: ['impossessato', 'orco'], call: 'Fabio Regaglia chiama rinforzi!', title: 'Fabio Regaglia!', sub: () => 'Il gigante di 2 metri e mezzo, maledetto e corazzato' },
  pierre4: { B: BOSS_PIERRE4, build: buildWell, at: () => ({ x: BX, z: -1 }), r: 0.6, name: 'Pierre · Per l\'ultima volta', minions: ['orco', 'orcone', 'sgherrone'], call: 'Pierre chiama i suoi sgherri!', title: 'Pierre!', sub: () => 'È tornato alla fontana con gli sgherri: stavolta è l\'ultima' },
  corti: { B: BOSS_CORTI, build: buildCortiBoss, at: () => ({ x: BX + 44, z: 12 }), r: 0.9, name: 'Corti · Sotto la maledizione', minions: ['base', 'furia', 'cornuto'], call: 'Corti chiama i Mammutones dalla cucina!', title: 'Corti!', sub: () => (bu.gt ? '«Hai rigato la mia GT?! Adesso sono cavoli tuoi!»' : '«Oh, mi raccomando… la mia GT non l\'hai toccata, vero? Non l\'hai graffiata?»') },
  progni: { B: BOSS_PROGNI, build: () => buildProgno(0), at: () => ({ x: BX - 3, z: -96 }), r: 0.6, name: 'I cugini Progni', minions: ['sgherrone', 'sgherrone', 'orco'], call: 'I Progni chiamano gli sgherri potenziati!', title: 'I cugini Progni!', sub: () => 'Due soldati biondi con la cresta: escono insieme dal bar' },
  loris4: { B: BOSS_LORIS4, build: buildLoris, at: () => ({ x: BX, z: -178 }), r: 0.65, name: 'Loris Busato · In chiesa', minions: ['capra', 'capra', 'furia'], call: 'Loris chiama le capre Mammutones!', title: 'Loris Busato!', sub: () => 'Ti aspettava davanti all\'altare' },
  re: { B: BOSS_RE, build: buildLorisRe, at: () => RE_SPOT, r: 1.4, name: 'Loris · Il Re dei Mammutones', minions: ['capra', 'capra', 'furia', 'impossessato'], call: 'Il Re chiama il suo esercito!', title: 'Il Re dei Mammutones!', sub: () => 'Loris nella forma finale. È il momento di finirla' },
  pika: { B: BOSS_PIKA, build: buildPikaBoss, at: () => (P && inCasa(P.pos) ? PIKA_SPOT_C : PIKA_SPOT_G), r: 0.5, name: 'Pika · Governatore del Tribunale (sotto maleficio)', minions: ['fachiro', 'impossessato'], call: 'Pika chiama i suoi!', title: 'Pika!', sub: () => (P && inCasa(P.pos) ? 'Il maleficio di Loris lo controlla: liberalo!' : 'Il governatore del Tribunale, impossessato. Ti lancia le sigarette da lontano') },
};
function spawnBoss(kind = 'fab') {
  const K = BOSSK[kind], B = K.B, m = K.build(), at = K.at(); m.position.set(at.x, 0, at.z); scene.add(m);
  const phase = kind === 'pika' ? (inCasa(P.pos) ? 2 : 1) : 0;
  const base = kind === 'pika' && phase === 1 ? B.hpGarage : B.hp;
  const tough = kind === 'fab' && world === 3 ? 2.6 : 1; /* al Tribunale Fab La Rue e' molto piu' forte */
  const hp = Math.round(base * tough * (1 + (kind === 'fab' ? 0.04 : 0.03) * wave));
  boss = { m, kind, capo: kind === 'capo', phase, type: 'boss', boss: 1, hp, max: hp, dmg: B.dmg * (tough > 1 ? 1.5 : 1), reward: B.reward * tough, atkCd: B.atkCd, spd: B.spd * (tough > 1 ? 1.15 : 1), atk: 1, dead: 0, stuck: 0, side: 0, walk: 0, r: K.r, kick: 0, summon: B.summonEvery, ch: null, chCd: 4, throwT: 2 };
  m.userData.hit.body.userData.enemy = boss; m.userData.hit.head.userData.enemy = boss; m.userData.hit.head.userData.head = true;
  enemies.push(boss); alive++; $('boss').hidden = false; $('bossn').textContent = K.name;
  if (kind === 'progni') { const m2 = buildProgno(1); m2.position.set(at.x + 6, 0, at.z); scene.add(m2);
    const tw = { m: m2, kind: 'progni', type: 'boss', twin: 1, hp, max: hp, dmg: B.dmg, reward: B.reward, atkCd: B.atkCd, spd: B.spd * 1.05, atk: 1, dead: 0, stuck: 0, side: 0, walk: 0, r: K.r, kick: 0 };
    m2.userData.hit.body.userData.enemy = tw; m2.userData.hit.head.userData.enemy = tw; m2.userData.hit.head.userData.head = true; enemies.push(tw); alive++; boss.twinRef = tw; }
  banner(K.title, K.sub()); tone(110, 0.8, 'sawtooth', 0.08, 60);
}
function goDown() {
  despawnOther(true); P.pos.set(BASE_START.x, 0, BASE_START.z); yaw = BASE_START.yaw;
  if (!fabDead) banner('Seminterrato', wave >= BOSS_FAB.wave ? 'Senti dei ratti nel buio…' : 'Fab La Rue uscirà all\'ondata ' + BOSS_FAB.wave);
}
function goUp() { despawnOther(false); P.pos.set(37.6, 0, -22.2); yaw = 0; }
function despawnOther(down) {
  for (const e of enemies) { if (e.dead || e.boss) continue; if (inBasement(e.m.position) !== down) { scene.remove(e.m); e.gone = 1; alive--; toSpawn++; } }
  enemies = enemies.filter(e => !e.gone);
}
/* oggetti bassi: se ci sei sopra non ti spingono via, ci stai in piedi */
function groundY(pos) { let g = 0; for (const s of solids) { if (s.off || !s.top) continue; if (pos.x > s.x1 - 0.15 && pos.x < s.x2 + 0.15 && pos.z > s.z1 - 0.15 && pos.z < s.z2 + 0.15 && pos.y >= s.top - 0.35 && s.top > g) g = s.top; } return g; }
const onGround = () => P.vy === 0 && P.pos.y <= groundY(P.pos) + 0.02;
function collide(pos, r, extra, y) {
  const Bd = world === 4 ? (inSard(pos) ? SARD : inCata(pos) ? CATA : BUB) : world === 3 ? (inCasa(pos) ? CASA : TRB) : world === 2 ? HSB : inBasement(pos) ? BASE : BOUNDS;
  pos.x = Math.max(Bd.x1 + r, Math.min(Bd.x2 - r, pos.x)); pos.z = Math.max(Bd.z1 + r, Math.min(Bd.z2 - r, pos.z));
  for (const s of solids) {
    if (s.off) continue; if (y !== undefined && s.top && y >= s.top - 0.1) continue;
    if (pos.x + r > s.x1 && pos.x - r < s.x2 && pos.z + r > s.z1 && pos.z - r < s.z2) {
      const dx1 = s.x2 - (pos.x - r), dx2 = (pos.x + r) - s.x1, dz1 = s.z2 - (pos.z - r), dz2 = (pos.z + r) - s.z1; const m = Math.min(dx1, dx2, dz1, dz2);
      if (m === dx1) pos.x += dx1; else if (m === dx2) pos.x -= dx2; else if (m === dz1) pos.z += dz1; else pos.z -= dz2;
    }
  }
  if (world === 1 && !gzOpen() && !extra && pos.x < -12 + r && pos.z < -6 + r) { if (-6 + r - pos.z < -12 + r - pos.x) pos.z = -6 + r; else pos.x = -12 + r; }
}
function animLimbs(m, phase, amp) { const p = m.userData.P; const s = Math.sin(phase) * amp; p.legL.rotation.x = s; p.legR.rotation.x = -s; if (p.armL) p.armL.rotation.x = -s * 0.8; }

/* ===================== SPARO ===================== */
const ray = new THREE.Raycaster(); const tracerM = new THREE.LineBasicMaterial({ color: '#ffe08a' });
const sparkG = new THREE.SphereGeometry(0.07, 6, 4), sparkM = new THREE.MeshBasicMaterial({ color: '#ffd27a' }), bloodM = new THREE.MeshBasicMaterial({ color: '#c0392b' });
function muzzle() { if (fp) { vmRoot.position.copy(camera.position); vmRoot.quaternion.copy(camera.quaternion); vmRoot.updateMatrixWorld(true); } const g = fp && vm.userData.gun ? vm.userData.gun : pModel.userData.gun; const v = g.userData.muzzle.clone(); g.localToWorld(v); return v; }
function hitTargets() { const t = blockers(); for (const e of enemies) if (!e.dead && !(e.ally > 0)) t.push(e.m.userData.hit.head, e.m.userData.hit.body); return t; }
function shoot() {
  const w = P.weapons[P.cur]; if (P.reloadT > 0) return;
  if (w.melee) { slash(w); return; }
  const inf = infAmmo();
  if (w.ammo <= 0 && !inf) { if (w.res > 0) startReload(); else click(); return; }
  if (!inf) w.ammo--;
  if (w.thrown) { throwGrenade(w); return; }
  const aimPow = P.pwT > 0 && P.pw.k === 'aim';
  fireT = w.rate * (aimPow ? 0.6 : 1); shotSound(w.sound); muzzleFlash(muzzle()); shake(w.pel > 1 ? 0.18 : w.dmg > 50 ? 0.12 : 0.04);
  const camDir = new V3(); camera.getWorldDirection(camDir); let assist = null;
  if (aimPow) { let best = 0.17; for (const e of enemies) { if (e.dead) continue; const hp = e.m.userData.hit.head.getWorldPosition(new V3()); const a = hp.clone().sub(camera.position).normalize().angleTo(camDir); if (a < best) { best = a; assist = hp; } } }
  if (!assist && isTouch) { let best = 0.075; for (const e of enemies) { if (e.dead) continue; const hp = e.m.userData.hit.body.getWorldPosition(new V3()); const a = hp.clone().sub(camera.position).normalize().angleTo(camDir); if (a < best) { best = a; assist = hp; } } }
  if (!assist) {
    let bd = 2.6; const pf = new V3(-Math.sin(yaw), 0, -Math.cos(yaw));
    for (const e of enemies) { if (e.dead) continue; const to = e.m.position.clone().sub(P.pos); to.y = 0; const d = to.length(); if (d < bd && to.normalize().dot(pf) > 0.55) { bd = d; assist = e.m.userData.hit.body.getWorldPosition(new V3()); } }
  }
  let anyHit = false; const targets = hitTargets();
  const dbl = P.pwT > 0 && P.pw.k === 'double'; const pellets = w.pel * (dbl ? 2 : 1);
  for (let k = 0; k < pellets; k++) {
    let dir;
    if (assist) { dir = assist.clone().sub(camera.position).normalize(); if (k > 0) { dir.x += (Math.random() - 0.5) * 0.02; dir.y += (Math.random() - 0.5) * 0.02; dir.normalize(); } }
    else { const sp = w.spread + (dbl && k > 0 ? 0.012 : 0); dir = camDir.clone(); dir.x += (Math.random() - 0.5) * sp * 2; dir.y += (Math.random() - 0.5) * sp * 2; dir.z += (Math.random() - 0.5) * sp * 2; dir.normalize(); }
    ray.set(camera.position, dir); ray.far = 90;
    const hits = ray.intersectObjects(targets, false);
    let end = camera.position.clone().add(dir.clone().multiplyScalar(60)); const hitE = new Set();
    for (const h of hits) {
      const e = h.object.userData.enemy; if (!e) { end = h.point; spark(h.point, false); break; }
      if (e.dead || hitE.has(e)) continue; hitE.add(e);
      const head = !!h.object.userData.head || buffK('head'); const mult = (head ? HEADSHOT : 1) * (aimPow ? 1.5 : 1) * (P.pwT > 0 && P.pw.k === 'rage' ? 2 : 1) * (P.pwT > 0 && P.pw.k === 'speed' ? 1.8 : 1);
      if (P.pwT > 0 && P.pw.k === 'lenti') e.slowT = 3.5;
      const boom = P.pwT > 0 && P.pw.k === 'esplosivi';
      if (!w.explode) damageEnemy(e, w.dmg * mult * (boom ? 1.5 : 1), head); if (boom) explode(h.point, 1.7, w.dmg * 1.5, true, e); anyHit = true; end = h.point; spark(h.point, true); if (!w.pierce) break;
    }
    if (!anyHit && P.pwT > 0 && P.pw.k === 'esplosivi' && hits.length && !hits[0].object.userData.enemy) explode(end, 1.7, w.dmg * 1.5, true);
    if (w.explode) { explode(end, w.explode, w.dmg * (P.pwT > 0 && P.pw.k === 'rage' ? 2 : 1)); anyHit = true; }
    tracer(muzzle(), end);
  }
  if (anyHit) { $('cross').classList.add('hit'); setTimeout(() => $('cross').classList.remove('hit'), 90); }
  pModel.userData.P.armR.rotation.x -= 0.25; P.shotT = time; if (pModel.userData.hd) pModel.userData.hd.recoil(w.dmg > 50 || w.pel > 1 ? 0.9 : 0.45); vmKick = Math.min(1, vmKick + (w.dmg > 50 || w.pel > 1 ? 1 : 0.45));
}
/* katana: colpisce tutti i nemici davanti a te entro pochi metri */
function slash(w) {
  fireT = w.rate; tone(900, 0.07, 'sawtooth', 0.05, 200); shake(0.06);
  const pf = new V3(-Math.sin(yaw), 0, -Math.cos(yaw)); let n = 0; const mult = (P.pwT > 0 && P.pw.k === 'rage' ? 2 : 1) * (P.pwT > 0 && P.pw.k === 'speed' ? 1.8 : 1);
  for (const e of enemies) { if (e.dead) continue; const to = e.m.position.clone().sub(P.pos); to.y = 0; const d = to.length();
    if (d < w.range + (e.r || 0.4) && (d < 0.8 || to.normalize().dot(pf) > 0.3)) { damageEnemy(e, w.dmg * mult, false); spark(e.m.userData.hit.body.getWorldPosition(new V3()), true); n++; } }
  if (n) { $('cross').classList.add('hit'); setTimeout(() => $('cross').classList.remove('hit'), 90); }
  if (pModel.userData.hd) pModel.userData.hd.slash();
  const A = pModel.userData.P.armR; A.rotation.x -= 1.1; A.rotation.z = 0.8; setTimeout(() => { A.rotation.z = 0; }, 160);
}
/* bazooka: esplosione con danno ad area */
const boomM = new THREE.MeshBasicMaterial({ color: '#ff9a3a', transparent: true, opacity: 0.85, depthWrite: false });
function explode(p, R, dmg, small, skip) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 12), boomM.clone()); m.position.copy(p); scene.add(m); let t = 0;
  const step = () => { t += 0.016; m.scale.setScalar(0.5 + t * R * 6); m.material.opacity = Math.max(0, 0.85 - t * 2.6); if (t < 0.33) requestAnimationFrame(step); else { scene.remove(m); m.geometry.dispose(); m.material.dispose(); } }; step();
  if (small) tone(140, 0.12, 'square', 0.03, 60); else { tone(70, 0.6, 'sawtooth', 0.12, 30); shake(0.4); }
  if (dmg > 0) for (const e of enemies) { if (e.dead || e === skip || e.ally > 0) continue; const c = e.m.position.clone(); c.y = Math.min(Math.max(p.y, 0), 1.6); const d = c.distanceTo(p); if (d < R + (e.r || 0.4)) damageEnemy(e, dmg * (1 - 0.5 * Math.min(1, d / R)), false); }
}
function tracer(a, b) { const g = new THREE.BufferGeometry().setFromPoints([a, b]); const l = new THREE.Line(g, tracerM); scene.add(l); tracers.push({ l, t: 0.06 }); }
function spark(p, blood) { const m = new THREE.Mesh(sparkG, blood ? bloodM : sparkM); m.position.copy(p); scene.add(m); sparks.push({ m, t: 0.18 }); }
function earn(n) { coins += n * (P && P.pwT > 0 && P.pw.k === 'coins' ? 2 : 1) * (buffK('coins') ? 2 : 1); }
function damageEnemy(e, d, head) {
  if (e.flee) return;
  if (buffK('insta') && !e.boss && !e.twin) d = Math.max(d, e.hp + 1);
  if (P && P.pwT > 0 && P.pw.k === 'algerino') d *= 2;
  if (e.boss && e.kind === 'pika' && e.phase === 1 && e.hp - d <= e.max * 0.5) { e.hp = e.max * 0.5; pikaFlee(e); return; }
  e.hp -= d; earn(ECONOMY.hit); e.kick = 0.18;
  if (e.hp <= 0 && !e.dead) {
    e.dead = 1; e.deadT = 0; earn(e.reward + (head ? ECONOMY.headKill : 0)); kills++; alive--;
    if (world === 4 && inCata(e.m.position)) bu.cataKills = (bu.cataKills || 0) + 1;
    if (e.twin) banner('Un cugino Progni è a terra!', 'Manca l\'altro');
    if (head && !e.boss) feed('Colpo in testa +' + (e.reward + ECONOMY.headKill));
    if (e.boss) bossDown();
    if (Math.random() < DROPS.chance) dropItem(e.m.position.clone());
  }
}
function bossDown() {
  const kind = boss && boss.kind, bpos = boss && boss.m.position.clone(); boss = null; $('boss').hidden = true;
  if (world === 3) { trBossDown(kind, bpos); return; }
  if (world === 4) { buBossDown(kind, bpos); return; }
  if (kind === 'loris' && mode === 'sandbox') { lorisDead = true; banner('Loris Busato è sconfitto!', 'Esci dall\'ufficio e rientra per sfidarlo di nuovo'); return; }
  if (kind === 'loris') { lorisDead = true; lastUnlock = unlockChar('loris'); banner('Loris Busato è sconfitto!', 'Il Tigros è salvo');
    setTimeout(() => rescue(4, 'Leo', 'Finalmente! Loris mi aveva chiuso in ufficio. Grazie raga, siete dei grandi!', bpos), 1800); setTimeout(victory, 7600); return; }
  if (kind === 'capo') {
    capoDead = true;
    if (mode === 'sandbox') { banner('Il Capo è sconfitto!', 'Esci dal negozio e rientra per sfidarlo di nuovo'); return; }
    lastUnlock = unlockChar('hs'); setTimeout(victory, 2500); banner('Il Capo è sconfitto!', 'L\'Happy Shopping è libero'); return;
  }
  fabDead = true; const nu = unlockChar('fab'); if (kind === 'fab') setTimeout(() => rescue(7, 'Jacopo', 'Grazie raga! Fab mi teneva chiuso nelle fogne. Ci vediamo fuori!', bpos), 1500);
  banner('Fab La Rue è sconfitto!', nu ? 'Hai sbloccato ' + nu.short + '! Ora riaccendi la corrente nel locale tecnico' : 'I ratti scappano: riaccendi la corrente nel locale tecnico');
  for (const e of enemies) if (!e.dead && e.type === 'ratto') { e.dead = 1; e.deadT = 0; alive--; }
}
function startReload() { const w = P.weapons[P.cur]; if (P.reloadT > 0 || w.ammo >= w.mag || w.res <= 0) return; P.reloadT = w.reload; reloadSound(); if (pModel.userData.hd) pModel.userData.hd.reload(w.reload); }

/* ===================== OGGETTI ===================== */
const DROPLOOK = { cura: { c: '#ff4a5a', n: 'Cura' }, munizioni: { c: '#f2c14e', n: 'Munizioni' }, armatura: { c: '#5ab0ff', n: 'Armatura' } };
/* oggetti lasciati dai nemici: cuore per la vita, munizioni vere, scudo per l'armatura */
const heartShape = (() => { const s = new THREE.Shape(); s.moveTo(0, -0.22); s.bezierCurveTo(-0.05, -0.12, -0.26, -0.02, -0.24, 0.1); s.bezierCurveTo(-0.22, 0.24, -0.04, 0.26, 0, 0.13); s.bezierCurveTo(0.04, 0.26, 0.22, 0.24, 0.24, 0.1); s.bezierCurveTo(0.26, -0.02, 0.05, -0.12, 0, -0.22); return s; })();
const shieldShape = (() => { const s = new THREE.Shape(); s.moveTo(0, 0.24); s.lineTo(0.2, 0.17); s.lineTo(0.18, -0.04); s.quadraticCurveTo(0.12, -0.18, 0, -0.26); s.quadraticCurveTo(-0.12, -0.18, -0.18, -0.04); s.lineTo(-0.2, 0.17); s.closePath(); return s; })();
function dropMesh(k) {
  const g = new THREE.Group();
  if (k === 'cura') { const m = new THREE.Mesh(new THREE.ExtrudeGeometry(heartShape, { depth: 0.1, bevelEnabled: true, bevelSize: 0.03, bevelThickness: 0.03, bevelSegments: 2 }), new THREE.MeshStandardMaterial({ color: '#e8283a', emissive: '#a01020', emissiveIntensity: 0.6, roughness: 0.35 })); m.position.z = -0.05; g.add(m); }
  else if (k === 'armatura') { const m = new THREE.Mesh(new THREE.ExtrudeGeometry(shieldShape, { depth: 0.07, bevelEnabled: true, bevelSize: 0.02, bevelThickness: 0.02, bevelSegments: 2 }), new THREE.MeshStandardMaterial({ color: '#3a7ad8', emissive: '#1a3a8a', emissiveIntensity: 0.5, roughness: 0.3, metalness: 0.5 })); m.position.z = -0.035; g.add(m);
    const st = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.32, 0.12), new THREE.MeshStandardMaterial({ color: '#e8eef8', roughness: 0.4 })); g.add(st); const st2 = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.06, 0.12), st.material); st2.position.y = 0.05; g.add(st2); }
  else { const brass = new THREE.MeshStandardMaterial({ color: '#d8a83a', emissive: '#6a4a00', emissiveIntensity: 0.4, roughness: 0.25, metalness: 0.9 }), tip = new THREE.MeshStandardMaterial({ color: '#c8703a', roughness: 0.3, metalness: 0.8 });
    for (let i = -1; i <= 1; i++) { const c = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.26, 12), brass); c.position.set(i * 0.11, 0, 0); g.add(c); const t = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.12, 12), tip); t.position.set(i * 0.11, 0.19, 0); g.add(t); } }
  const halo = new THREE.Mesh(new THREE.SphereGeometry(0.42, 12, 8), new THREE.MeshBasicMaterial({ color: DROPLOOK[k].c, transparent: true, opacity: 0.14, depthWrite: false })); g.add(halo);
  g.scale.setScalar(1.25); return g;
}
function dropItem(pos) {
  let r = Math.random(), it = DROPS.table[0]; for (const x of DROPS.table) { r -= x.w; if (r <= 0) { it = x; break; } }
  const m = dropMesh(it.k); m.position.set(pos.x, 0.6, pos.z); scene.add(m); drops.push({ m, it, t: 25 });
}
function pickup(d) {
  const it = d.it;
  if (it.k === 'cura') P.hp = Math.min(100, P.hp + it.heal);
  else if (it.k === 'armatura') P.ar = Math.min(DROPS.maxArmor, P.ar + it.armor);
  else P.weapons.forEach(w => { w.res = Math.min(maxRes(w), w.res + w.mag * 2); });
  feed('+ ' + DROPLOOK[it.k].n); pickS();
}

/* ---------- armi al muro ---------- */
const ALL_BUYS = WALL_BUYS.concat(HS_BUYS, TR_BUYS, BU_BUYS);
const wallMeshes = ALL_BUYS.map(wb => {
  const G = new THREE.Group();
  const chalk = new THREE.Mesh(new THREE.PlaneGeometry(1.9, 0.9), new THREE.MeshBasicMaterial({ map: sign(WEAPONS[wb.id].n.toUpperCase(), '700 30px Arial,sans-serif', '#f4f0e0', 190, 90), transparent: true, opacity: 0.9 }));
  chalk.position.set(0, -0.55, 0.02); G.add(chalk);
  const frame = box(2.1, 1.0, 0.05, mat('#3a2a20')); frame.position.set(0, 0, -0.01); G.add(frame);
  const gun = buildWeapon(wb.id); gun.rotation.y = Math.PI / 2; gun.position.set(-0.05, 0.05, 0.08); gun.scale.setScalar(1.8); G.add(gun);
  const r = wb.rot || 0; G.rotation.y = r; G.position.set(wb.x + Math.sin(r) * 0.08, 2.1, wb.z + Math.cos(r) * 0.08); scene.add(G); return G;
});

/* ---------- punti interattivi ---------- */
const INTER = [
  ...ALL_BUYS.map(wb => ({
    x: wb.x + Math.sin(wb.rot || 0) * 1.2, z: wb.z + Math.cos(wb.rot || 0) * 1.2, r: 2.4,
    gun: wb.id,
    label: () => P && WEAPONS[wb.id].melee && P.weapons.some(w => w.id === wb.id) ? null : P && P.weapons.some(w => w.id === wb.id) ? `<b>E</b> Munizioni ${WEAPONS[wb.id].n} · <b>${wb.ammoCost}</b>` : P && P.freeGun ? `<b>E</b> Prendi ${WEAPONS[wb.id].n} · <b style="color:#7aff8a">GRATIS</b>` : `<b>E</b> Compra ${WEAPONS[wb.id].n} · <b>${wb.cost}</b>`,
    cost: () => P.weapons.some(w => w.id === wb.id) ? wb.ammoCost : wb.cost,
    act: () => {
      const have = P.weapons.findIndex(w => w.id === wb.id);
      if (have >= 0) { const w = P.weapons[have]; w.res = maxRes(w); w.ammo = w.mag; feed(WEAPONS[wb.id].noPack ? 'Colpo ricaricato' : 'Munizioni piene'); return; }
      if (P.weapons.length < 2) { P.weapons.push(newWeapon(wb.id)); switchWeapon(1); } else { P.weapons[P.cur] = newWeapon(wb.id); equip(); }
      feed('Hai comprato: ' + WEAPONS[wb.id].n);
    },
  })),
  { x: -18, z: -5.4, r: 3, label: () => gzOpen() ? null : `<b>E</b> Apri il gazebo Buongusto · <b>${ZONES[1].cost}</b>`, cost: () => ZONES[1].cost, act: () => openZone(1) },
  { x: -11.4, z: -10, r: 2.4, label: () => gzOpen() ? null : `<b>E</b> Apri il gazebo Buongusto · <b>${ZONES[1].cost}</b>`, cost: () => ZONES[1].cost, act: () => openZone(1) },
  { x: DOOR.x, z: -12.8, r: 3, label: () => zone >= 2 ? null : zone < 1 ? 'Per entrare nel negozio apri prima il gazebo Buongusto' : `<b>E</b> Apri il negozio · <b>${ZONES[2].cost}</b>`, cost: () => zone === 1 ? ZONES[2].cost : 0, act: () => openZone(2) },
  { x: ESCALATOR.x, z: -22.8, r: 2.6, label: () => zone >= 3 ? '<b>E</b> Scendi nel seminterrato' : `<b>E</b> Apri il seminterrato · <b>${ZONES[3].cost}</b>`, cost: () => zone >= 3 ? 0 : ZONES[3].cost, free: () => zone >= 3, act: () => { if (zone < 3) openZone(3); goDown(); } },
  { x: BASE_ESCALATOR.x, z: BASE_ESCALATOR.z - 1.5, r: 2.6, label: () => '<b>E</b> Torna su nel negozio', cost: () => 0, free: () => true, act: goUp },
  { x: PANEL.x + 1.4, z: PANEL.z, r: 2.4, label: () => power ? 'La corrente è accesa' : fabDead ? '<b>E</b> Riaccendi la corrente' : 'Il quadro non risponde: prima sconfiggi Fab La Rue', cost: () => 0, free: () => fabDead && !power, act: () => { power = true; panelLed.material.color.set('#3aff6a'); banner('Corrente riaccesa!', 'Ora puoi aprire il magazzino'); } },
  { x: WAREHOUSE_DOOR.x, z: -42.6, r: 2.6, label: () => zone >= 4 ? null : power ? `<b>E</b> Apri il magazzino · <b>${ZONES[4].cost}</b>` : 'Il magazzino è chiuso: serve la corrente del seminterrato', cost: () => (power && zone < 4 ? ZONES[4].cost : 0), act: () => openZone(4) },
  ...GENERATORS.map(g => ({ x: g.x, z: g.z + 1.3, r: 2.4, label: () => g.on ? `Generatore ${g.n} acceso` : `<b>E</b> Accendi il generatore ${g.n} · <b>${GENERATOR_COST}</b>`, cost: () => (g.on ? 0 : GENERATOR_COST), act: () => {
    g.on = true; g.led.material.color.set('#3aff6a'); const n = GENERATORS.filter(x => x.on).length;
    if (n < 3) banner('Generatore ' + g.n + ' acceso', n + ' su 3'); else openZone(5);
  } })),
  { x: OFFICE_DOOR.x - 1.5, z: OFFICE_DOOR.z + 1.2, r: 2.4, label: () => zone >= 5 ? null : `Ufficio chiuso: accendi i 3 generatori (${GENERATORS.filter(x => x.on).length}/3)`, cost: () => 0 },
  { x: 34, z: 17.2, r: 2.6, label: () => 'La rampa per il seminterrato è bloccata, per ora', cost: () => 0 },
  /* mondo 2 */
  { x: HS_DOOR.x, z: 1.7, r: 3, label: () => world !== 2 || zone >= 1 ? null : `<b>E</b> Apri l'Happy Shopping · <b>${ZONES[HS_ZONE0 + 1].cost}</b>`, cost: () => (zone < 1 ? ZONES[HS_ZONE0 + 1].cost : 0), act: () => openHS() },
  ...CAGES.map(c => ({ x: c.x, z: c.z + 1.9, r: 2.3, label: () => world === 3 && !c.freed && (zone >= 2 || mode === 'sandbox') ? `<b>E</b> Libera ${c.name}` : null, cost: () => 0, free: () => true, act: () => freeCage(c) })),
  { x: LIFT.x, z: LIFT.z + 1.8, r: 2.4, label: () => world === 3 && inGarage(P.pos) ? (mode === 'sandbox' || (trPower && CAGES.every(c => c.freed)) ? '<b>E</b> Sali a casa di Pika' : !trPower ? 'Ascensore senza corrente: riattivala dal quadro elettrico' : 'Prima libera Leodessi, Castelluccio e Bulegato') : null, cost: () => 0, free: () => mode === 'sandbox' || (trPower && CAGES.every(c => c.freed)), act: goCasa },
  { x: TR_PANEL.x + 1.2, z: TR_PANEL.z, r: 2.4, label: () => world === 3 && inGarage(P.pos) && !trPower ? (pikaFled || (boss && boss.flee) ? `<b>E</b> Riattiva la corrente · <b>${TR_POWER_COST}</b>` : 'Il quadro è bloccato: prima affronta Pika') : null, cost: () => (pikaFled || (boss && boss.flee) ? TR_POWER_COST : 0), act: () => { trPower = true; trPanelLed.material.color.set('#3aff6a'); openLift(); if (zone < 3) zone = 3; banner('Corrente riattivata!', CAGES.every(c => c.freed) ? 'L\'ascensore per la casa di Pika funziona' : 'Libera gli amici e poi prendi l\'ascensore'); } },
  { x: TR_GDOOR.x, z: TR_GDOOR.z + 1.8, r: 3, label: () => world === 3 && zone < 2 && P.pos.z > TR_GDOOR.z ? (hasKey ? `<b>E</b> Apri il garage di Pika · <b>${TR_GARAGE_COST}</b>` : 'Il garage è chiuso a chiave: la chiave ce l\'ha Fabio Regaglia') : null, cost: () => (hasKey ? TR_GARAGE_COST : 0), act: () => { zone = 2; openGarage(); banner('Garage di Pika', 'Gli amici sono nelle gabbie in fondo… e Pika ti aspetta'); } },
  { x: TX + 97.5, z: -1.4, r: 2.4, label: () => world === 3 && inCasa(P.pos) ? '<b>E</b> Torna giù nel garage' : null, cost: () => 0, free: () => true, act: goGarage },
  { x: PAUL.x - 1.4, z: PAUL.z, r: 2.6, label: () => world === 3 ? '<b>E</b> Parla con Paul' : null, cost: () => 0, free: () => true, act: () => { const L = PAUL_LINES; let k; do { k = Math.floor(Math.random() * L.length); } while (k === paulLast); paulLast = k; banner('Paul', '«' + L[k] + '»'); tone(600, 0.08, 'triangle', 0.04, 760); } },
  /* mondo 4: porte, barricate, sigillo, campanacci, portale, la GT di Corti */
  { x: BX + 32.6, z: 11, r: 2.8, label: () => world === 4 && !bu.mac && !inMac(P.pos) ? (bu.pierre || mode === 'sandbox' ? `<b>E</b> Apri il Mac · <b>${BU_COSTS.mac}</b>` : 'Il Mac è chiuso: prima sconfiggi Pierre alla fontana (round ' + BOSS_PIERRE4.wave + ')') : null, cost: () => (bu.pierre ? BU_COSTS.mac : 0), act: openMac },
  { x: BX, z: -50.4, r: 3.6, label: () => world === 4 && !bu.bar && P.pos.z > -52 ? (bu.corti || mode === 'sandbox' ? `<b>E</b> Apri la strada per i bar · <b>${BU_COSTS.bar}</b>` : 'Strada chiusa: prima libera Corti al Mac') : null, cost: () => (bu.corti ? BU_COSTS.bar : 0), act: openBar },
  { x: BX, z: -102.4, r: 3.6, label: () => world === 4 && !bu.piazza && P.pos.z > -104 ? 'Zona rossa: i cugini Progni la tengono chiusa (round ' + BOSS_PROGNI.wave + ')' : null, cost: () => 0 },
  { x: BX, z: -148.6, r: 3, label: () => world === 4 && !bu.chiesa && P.pos.z > -150.5 ? `<b>E</b> Apri la chiesa · <b>${BU_COSTS.chiesa}</b>` : null, cost: () => BU_COSTS.chiesa, act: openChiesa },
  { x: BX, z: -180.6, r: 2.6, label: () => world === 4 && inChiesa(P.pos) ? (bu.seal ? '<b>E</b> Scendi nelle catacombe' : bu.tal >= 2 || mode === 'sandbox' ? '<b>E</b> Unisci il talismano e apri il sigillo' : 'Il sigillo dei Mammutones: serve il talismano intero (' + (bu.tal || 0) + '/2)') : null, cost: () => 0, free: () => !!bu.seal || bu.tal >= 2 || mode === 'sandbox', act: () => { if (!bu.seal) openSeal(); else goCata(); } },
  { x: BX + 300, z: 2.2, r: 2.4, label: () => world === 4 && inCata(P.pos) ? '<b>E</b> Risali in chiesa' : null, cost: () => 0, free: () => true, act: () => { buTeleport({ x: BX, z: -179.5 }, Math.PI); } },
  ...BELLS.map((b, i) => ({ x: b.x, z: b.z + (b.z > -15 ? 1.2 : 1.2), r: 2.2, label: () => world === 4 && inCata(P.pos) && !bu.ritual ? ((bu.cataKills || 0) < BU_CATA_KILLS && mode !== 'sandbox' ? `Il campanaccio ${b.n} non suona: prima elimina i Mammutones (${bu.cataKills || 0}/${BU_CATA_KILLS})` : `<b>E</b> Suona il campanaccio ${b.n}`) : null, cost: () => 0, free: () => (bu.cataKills || 0) >= BU_CATA_KILLS || mode === 'sandbox', act: () => ringBell(i) })),
  { x: PORTAL.x, z: PORTAL.z + 2.4, r: 2.8, label: () => world === 4 && inCata(P.pos) ? (!bu.ritual ? 'Il portale è spento: serve il rituale dei campanacci' : bu.portal ? '<b>E</b> Entra nel portale' : `<b>E</b> Attiva il portale · <b>${BU_COSTS.portale}</b>`) : null, cost: () => (bu.ritual && !bu.portal ? BU_COSTS.portale : 0), free: () => !!bu.portal || (bu.ritual && mode === 'sandbox'), act: () => { if (!bu.portal) { bu.portal = 1; setPortal(2); banner('Il portale si apre!', 'Dall\'altra parte c\'è il regno dei Mammutones'); tone(200, 1, 'sine', 0.08, 900); } else goSard(); } },
  { x: BX + 600, z: 53.6, r: 2.4, label: () => world === 4 && inSard(P.pos) && !boss ? '<b>E</b> Torna nelle catacombe' : null, cost: () => 0, free: () => true, act: () => buTeleport({ x: PORTAL.x, z: PORTAL.z + 3 }, 0) },
  { get x() { return buGT.position.x + 1.6; }, get z() { return buGT.position.z; }, r: 2.4, label: () => world === 4 && !bu.gt ? '<b>E</b> Riga la GT di Corti' : null, cost: () => 0, free: () => true, act: () => { bu.gt = 1; buGT.userData.scratch.visible = true; tone(2200, 0.5, 'sawtooth', 0.03, 500); banner('Hai rigato la GT di Corti…', bu.corti ? 'Meglio che non lo scopra mai' : 'Speriamo che non se ne accorga'); } },
  ...[1, 2, 3, 4].map(w => ({ get x() { return BOX_SPOTS[w].x; }, get z() { return BOX_SPOTS[w].z + 1.2; }, r: 2.2, label: () => world === w && !(boxes3d[w] && boxes3d[w].busy > 0) ? `<b>E</b> Cassa delle armi · arma a caso · <b>${BOX_COST}</b>` : null, cost: () => BOX_COST, act: openBox })),
  { get x() { return bottle ? bottle.x : 1e5; }, get z() { return bottle ? bottle.z : 1e5; }, r: 1.8, label: () => bottle ? '<b>E</b> Bevi la bottiglia misteriosa <small>(-' + BOTTLE.hpCost + ' vita)</small>' : null, cost: () => 0, free: () => true, act: drinkBottle },
  { x: DAMIANO.x, z: DAMIANO.z, r: 2.4, label: () => world === 2 ? '<b>E</b> Parla con Damiano' : null, cost: () => 0, free: () => true, act: () => { const L = DAMIANO_LINES; let k; do { k = Math.floor(Math.random() * L.length); } while (L.length > 1 && k === damLast); damLast = k; banner('Damiano Ducaj', '«' + L[k] + '»'); tone(520, 0.08, 'triangle', 0.04, 700); } },
];
function openHS() {
  if (zone >= 1) return; zone = 1; scene.remove(hsDoor); hsDoorSolid.off = 1;
  if (!quiet) banner('Happy Shopping aperto', 'Tra gli scaffali trovi il mitra e il fucile a pompa · il Capo arriva all\'ondata ' + BOSS_CAPO.wave);
}
function openZone(i) {
  if (zone >= i) return; zone = i; const banner = quiet ? () => {} : bannerFn; const feed = quiet ? () => {} : feedFn;
  if (i === 1) { scene.remove(gzBar); gzSolids.forEach(s => (s.off = 1)); banner('Gazebo aperto', 'Il fucile è appeso al muro sotto la tettoia'); }
  if (i === 2) { scene.remove(storeDoor); doorSolid.off = 1; banner('Negozio aperto', 'Attenti ai Mammutones Cornuti tra le corsie'); }
  if (i === 3) feed('Seminterrato aperto');
  if (i === 4) { scene.remove(wareDoor); wareDoorSolid.off = 1; banner('Magazzino aperto', 'Attento ai Mammutones Furia: veloci e cattivi'); }
  if (i === 5) { scene.remove(officeDoor); officeDoorSolid.off = 1; banner('Zona controllo aperta', 'Loris Busato arriverà all\'ondata ' + BOSS_LORIS.wave); }
}
let nearI = null;
function useInter() {
  if (!nearI || !nearI.label()) return; if (nearI.free && nearI.free()) { nearI.act(); buy(); return; }
  if (nearI.gun && P.freeGun && !P.weapons.some(w => w.id === nearI.gun)) { P.freeGun = false; nearI.act(); buy(); banner('DJ Gianfra offre!', WEAPONS[nearI.gun].n + ' gratis'); return; } let c = nearI.cost(); if (!c) return; if (buffK('saldi')) c = Math.ceil(c / 2);
  if (coins < c) { feed('Ti servono ' + c + ' monete'); denied(); return; }
  coins -= c; nearI.act(); buy();
}

/* frasi di Damiano nella Mercedes: una a caso ogni volta */
const DAMIANO_LINES = ['Oh raga, stasera andiamo all\'oceano', 'Il mio Mercedes è il più veloce di tutti', 'Bel casino qua a Busto… stasera cosa facciamo?', 'Raga, stasera cosa si fa?', 'Vieni a lavorare in DHL'];
let damLast = -1;
const PAUL_LINES = ['Raga, avete una J?', 'Raga, qualcuno sta bene?', 'Bro, hai una siga?'];
let paulLast = -1;

/* ===================== SCENE: L'AMICO LIBERATO ESCE, RINGRAZIA E SE NE VA ===================== */
function bubbleTex(name, txt) {
  const c = document.createElement('canvas'); c.width = 512; c.height = 220; const g = c.getContext('2d');
  g.fillStyle = '#fffdf4'; g.strokeStyle = '#12161c'; g.lineWidth = 8; g.beginPath(); g.roundRect(8, 8, 496, 168, 28); g.fill(); g.stroke();
  g.beginPath(); g.moveTo(230, 172); g.lineTo(256, 212); g.lineTo(282, 172); g.fill(); g.stroke(); g.fillStyle = '#fffdf4'; g.fillRect(228, 166, 56, 10);
  g.fillStyle = '#c0302a'; g.font = '700 30px Arial,sans-serif'; g.fillText(name, 32, 52);
  g.fillStyle = '#12161c'; g.font = '26px Arial,sans-serif'; const words = txt.split(' '); let line = '', y = 92;
  for (const w of words) { const t = line ? line + ' ' + w : w; if (g.measureText(t).width > 440) { g.fillText(line, 32, y); line = w; y += 32; } else line = t; } g.fillText(line, 32, y);
  const tx = new THREE.CanvasTexture(c); tx.encoding = THREE.sRGBEncoding; return tx;
}
let rescues = [];
function rescue(model, name, txt, at, o = {}) {
  if (state !== 'play' || !P) return;
  const m = o.build ? o.build() : buildHuman(model); let from = P.pos.clone().add(new V3(-Math.sin(yaw) * 4, 0, -Math.cos(yaw) * 4)); if (at) { const v = at.clone().sub(P.pos); v.y = 0; const L = v.length(); if (L > 0.5) from = P.pos.clone().addScaledVector(v.normalize(), Math.min(L, 5)); } from.y = 0; collide(from, 0.4, 1); m.position.copy(from); scene.add(m);
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: bubbleTex(name, txt), depthTest: false, transparent: true, toneMapped: false })); sp.scale.set(2.6, 1.12, 1); sp.position.y = (m.userData.height || 1.8) + 0.9; sp.renderOrder = 20; m.add(sp);
  if (o.build && at) { m.position.copy(at); }
  rescues.push({ m, t: 0, life: o.life || 5.5, to: o.to || null, s0: m.scale.x }); banner(o.title || name + ' è libero!', o.sub || 'Ti viene a ringraziare'); bell();
}
function updRescues(dt) {
  for (const r of rescues) {
    r.t += dt; const m = r.m; const to = (r.to || P.pos).clone().sub(m.position); to.y = 0; const d = to.length(); const stop = r.to ? 0.2 : 2.4;
    m.rotation.y = Math.atan2(to.x, to.z);
    if (r.t < r.life - 1 && d > stop) { m.position.addScaledVector(to.normalize(), Math.min(d - stop, 4 * dt)); collide(m.position, 0.4, 1); r.walk = (r.walk || 0) + dt * 9; animLimbs(m, r.walk, 0.55); }
    else if (r.t < r.life - 1) { m.userData.P.armR.rotation.x = -2.6 + Math.sin(r.t * 9) * 0.4; }
    if (r.t > r.life - 1) { const k = Math.max(0.001, r.life - r.t); m.scale.setScalar(r.s0 * k); m.position.y += dt * 1.5; }
    if (r.t >= r.life) { scene.remove(m); r.gone = 1; }
  }
  rescues = rescues.filter(r => !r.gone);
}

/* ===================== MONDO 3: IL TRIBUNALE ===================== */
function G3add(o) { if (!o.parent) { o.visible = true; } o.visible = true; }
function openGate() { trGate.visible = false; trGateSolid.off = 1; }
function openGarage() { trGDoor.visible = false; trGDoorSolid.off = 1; }
function openLift() { liftLed.material.color.set('#3aff6a'); }
function openTR() { openGate(); openGarage(); openLift(); hasKey = true; trPower = true; trPanelLed.material.color.set('#3aff6a'); zone = 3; }
/* chi sta nella zona sbagliata sparisce quando prendi l'ascensore (come nel seminterrato) */
function despawnTR(toCasa) { for (const e of enemies) { if (e.dead || e.boss) continue; if (inCasa(e.m.position) !== toCasa) { scene.remove(e.m); e.gone = 1; alive--; toSpawn++; } } enemies = enemies.filter(e => !e.gone); }
function endFlee(msg) {
  if (!boss || !boss.flee) return; scene.remove(boss.m); boss.gone = 1; boss.dead = 1; alive--; enemies = enemies.filter(e => e !== boss); boss = null; $('boss').hidden = true;
  pikaFled = true; if (msg) banner('Pika è scappato in casa', 'Riattiva la corrente dal quadro e libera gli amici, poi prendi l\'ascensore');
}
function goCasa() { if (boss) boss.flee = 1; endFlee(false); despawnTR(true); P.pos.set(CASA_START.x, 0, CASA_START.z); yaw = CASA_START.yaw; banner('Casa di Pika', 'Qualcuno ti aspetta…'); }
function goGarage() { despawnTR(false); P.pos.set(LIFT.x, 0, LIFT.z + 2.4); yaw = 0; }
const CAGE_LINES = { Leodessi: 'Raga, finalmente! Pika ci teneva chiusi qui da giorni.', Castelluccio: 'Grazie! Pika non è cattivo, è il maleficio. Dobbiamo salvarlo.', Bulegato: 'Il re dei vampiri vi ringrazia. Andiamo a prendere Pika.' };
function dropKey(at) {
  const g = new THREE.Group(); const gold = new THREE.MeshStandardMaterial({ color: '#e8c040', roughness: 0.25, metalness: 0.9, emissive: '#6a4a00', emissiveIntensity: 0.6 });
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.045, 8, 16), gold); g.add(ring); const st = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.42, 0.04), gold); st.position.y = -0.34; g.add(st);
  for (const y of [-0.46, -0.36]) { const t = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.05, 0.04), gold); t.position.set(0.06, y, 0); g.add(t); }
  const halo = new THREE.Mesh(new THREE.SphereGeometry(0.5, 12, 8), new THREE.MeshBasicMaterial({ color: '#ffd25e', transparent: true, opacity: 0.18, depthWrite: false })); g.add(halo);
  const p = at ? at.clone() : P.pos.clone(); g.position.set(p.x, 0.8, p.z); scene.add(g); trKey = g;
}
function freeCage(c) {
  c.freed = true; c.bars.visible = false; c.solid.off = 1; c.who.visible = false;
  rescue(c.model, c.name, CAGE_LINES[c.name], new V3(c.x, 0, c.z));
  if (CAGES.every(k => k.freed)) setTimeout(() => { if (state === 'play' && world === 3) banner('Tutti liberi!', 'Ma qualcuno sta scendendo dalle scale…'); }, 5200);
}
function pikaFlee(e) { e.flee = 1; e.fleeT = 3.5; banner('Pika scappa!', 'Sale in casa con l\'ascensore: seguilo'); tone(200, 0.5, 'triangle', 0.06, 600); }
function trBossDown(kind, at) {
  const rats = () => { for (const e of enemies) if (!e.dead && (e.type === 'ratto' || e.type === 'fachiro')) { e.dead = 1; e.deadT = 0; alive--; } };
  if (kind === 'fab') { fabDead = true; rats(); if (mode === 'adv' && zone < 1) { zone = 1; openGate(); } banner('Fab La Rue è sconfitto per sempre!', 'La strada è libera: vai verso i tavolini del Tribunale'); return; }
  if (kind === 'well') { wellDead = true; banner('Pierre scappa!', 'Gli sgherri restano… e dai tavolini si alza un gigante'); return; }
  if (kind === 'fabio') { fabioDead = true; if (mode === 'adv' && !hasKey) dropKey(at); banner('Fabio Regaglia è a terra!', mode === 'adv' ? 'Ha lasciato cadere la chiave del garage: raccoglila' : 'Il gigante è sconfitto'); return; }
  if (kind === 'pika') { pikaDead = true;
    for (const e of enemies) if (!e.dead) { e.dead = 1; e.deadT = 0; alive--; }
    setTimeout(() => rescue(18, 'Pika', 'Raga… non ero io. Era il maleficio di Loris. Grazie per avermi liberato!', at), 1600);
    if (mode === 'sandbox') { banner('Pika è libero!', 'Esci di casa e rientra per sfidarlo di nuovo'); return; }
    unlocks.tr = 1; try { localStorage.setItem('mt_unlocks', JSON.stringify(unlocks)); } catch (_) {} renderPick();
    lastUnlock = { name: 'Leodessi, Castelluccio, Bulegato, Libe il matto e Pika' };
    banner('Pika è libero dal maleficio!', 'Il Tribunale è vostro'); setTimeout(victory, 7600);
  }
}
/* scena nella casa di Pika: c'e' Loris che gli ha fatto il maleficio, poi scappa dalla finestra */
function casaScene() {
  if (lorisScene) return; lorisScene = true; casaT = 4.8;
  rescue(null, 'Loris Busato', 'Il maleficio è fatto: ora Pika è mio. Ci rivediamo, ragazzi!', new V3(TX + 114, 0, -12), { build: buildLoris, to: new V3(TX + 116, 0, -15.2), life: 4.6, title: 'Loris Busato!', sub: 'Era lui dietro al maleficio' });
}
/* pacchetti di sigarette lanciati da Pika: atterrano dove eri, se ti sposti li schivi */
function pikaThrow(e) {
  const g = new THREE.Group(); const box = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.22, 0.07), packM[0]); g.add(box); const top = new THREE.Mesh(new THREE.BoxGeometry(0.162, 0.08, 0.072), packM[1]); top.position.y = 0.08; g.add(top);
  const from = e.m.position.clone(); from.y += 1.6; g.position.copy(from); scene.add(g); const to = P.pos.clone(); to.y = 0.4;
  hostile.push({ m: g, from, to, t: 0, T: 0.55 + from.distanceTo(to) * 0.03 }); tone(500, 0.08, 'triangle', 0.04, 260);
  const A = e.m.userData.P.armL; A.rotation.x = -2.6; setTimeout(() => { A.rotation.x = 0; }, 180);
}
/* proiettili dei boss: i pacchetti di Pika (piccola esplosione) e le campane di Loris (solo chi viene preso) */
const bellM = new THREE.MeshStandardMaterial({ color: '#c8a03a', roughness: 0.3, metalness: 0.85 });
function lorisThrow(e) {
  const g = new THREE.Group(); const b = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.16, 0.22, 12, 1, true), bellM); g.add(b); const top = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), bellM); top.position.y = 0.11; g.add(top);
  const from = e.m.position.clone(); from.y += 2.2; g.position.copy(from); scene.add(g); const to = P.pos.clone(); to.y = 0.7;
  hostile.push({ m: g, from, to, t: 0, T: 0.5 + from.distanceTo(to) * 0.025, bell: 1, arc: 1.2 }); bell(); const A = e.m.userData.P.armR; A.rotation.x = -2.8; setTimeout(() => { A.rotation.x = 0; }, 180);
}
function updHostile(dt) {
  if (boss && boss.kind === 'corti' && !boss.dead) { boss.throwT -= dt; const d = boss.m.position.distanceTo(P.pos); if (boss.throwT <= 0 && d > 3.5 && d < 24) { boss.throwT = BOSS_CORTI.throwEvery * (0.8 + Math.random() * 0.4); cortiThrow(boss); } }
  if (boss && boss.kind === 're' && !boss.dead) { boss.throwT -= dt; const d = boss.m.position.distanceTo(P.pos); if (boss.throwT <= 0 && d > 5 && d < 34) { boss.throwT = BOSS_RE.throwEvery * (0.8 + Math.random() * 0.4); reThrow(boss); }
    boss.stompT = (boss.stompT === undefined ? 3 : boss.stompT) - dt; if (boss.stompT <= 0 && d < 6) { boss.stompT = BOSS_RE.stompEvery; const c = boss.m.position.clone(); c.y = 0.4; explode(c, 5.5, 0, false); if (d < 5.5) hit(BOSS_RE.stompDmg * ZONES[diffZone()].dmg); banner('Il Re batte i piedi!', ''); } }
  if (boss && (boss.kind === 'loris' || boss.kind === 'loris4') && !boss.dead) { boss.throwT -= dt; const d = boss.m.position.distanceTo(P.pos); if (boss.throwT <= 0 && d > 4 && d < 26) { boss.throwT = 2.4 + Math.random() * 1.2; lorisThrow(boss); } }
  for (const h of hostile) {
    h.t += dt; const k = Math.min(1, h.t / h.T); h.m.position.lerpVectors(h.from, h.to, k); h.m.position.y += Math.sin(k * Math.PI) * (h.arc || 1.6); h.m.rotation.x += dt * 12; h.m.rotation.z += dt * 8;
    if (k >= 1) {
      const dd = Math.hypot(P.pos.x - h.to.x, P.pos.z - h.to.z);
      if (h.bell) { if (dd < 1.0) { hit(18 * ZONES[diffZone()].dmg); spark(h.to, false); } tone(900, 0.15, 'triangle', 0.05, 400); }
      else if (h.burger) { if (dd < 1.15) { hit(BOSS_CORTI.throwDmg * ZONES[diffZone()].dmg); feed('Ti ha preso un panino!'); } spark(h.to, false); tone(300, 0.1, 'triangle', 0.04, 160); }
      else if (h.big) { explode(h.to, 2.4, 0, true); if (dd < 2.4) hit(BOSS_RE.throwDmg * ZONES[diffZone()].dmg); }
      else { explode(h.to, 1.3, 0, true); if (dd < 1.4) hit(BOSS_PIKA.throwDmg * ZONES[diffZone()].dmg); }
      scene.remove(h.m); h.gone = 1;
    }
  }
  hostile = hostile.filter(h => !h.gone);
}
function updTR(dt) {
  const r = trRegion(P.pos);
  /* il parcheggio coperto e' buio */
  const hk = r === 'trpark' ? 0.32 : r === 'trgarage' ? 0.45 : r === 'trcasa' ? 0.5 : 0.9; hemi.intensity += (hk - hemi.intensity) * Math.min(1, dt * 3);
  if (trKey) { trKey.rotation.y += dt * 2.5; trKey.position.y = 0.8 + Math.sin(time * 4) * 0.12; if (Math.hypot(P.pos.x - trKey.position.x, P.pos.z - trKey.position.z) < 1.6) { scene.remove(trKey); trKey = null; hasKey = true; pickS(); banner('Hai la chiave del garage!', 'Aprilo davanti alla saracinesca · ' + TR_GARAGE_COST + ' monete'); } }
  if (mode === 'sandbox') {
    if (r !== 'trpark') fabDead = false; if (r !== 'trpiazza') { wellDead = false; fabioDead = false; } if (r !== 'trgarage') pikaFled = false; if (r !== 'trcasa') { pikaDead = false; lorisScene = false; }
    if (!boss) { if (r === 'trpark' && !fabDead) spawnBoss('fab'); else if (r === 'trpiazza' && !wellDead) spawnBoss('well'); else if (r === 'trpiazza' && !fabioDead) spawnBoss('fabio');
      else if (r === 'trgarage' && !pikaFled) spawnBoss('pika'); else if (r === 'trcasa' && !pikaDead) casaScene(); }
  } else if (!boss) {
    if (!fabDead && r === 'trpark' && wave >= TR_FAB_WAVE) spawnBoss('fab');
    else if (zone >= 1 && !wellDead && r === 'trpiazza' && wave >= BOSS_WELL.wave) spawnBoss('well');
    else if (zone >= 1 && wellDead && !fabioDead && r === 'trpiazza' && wave >= BOSS_FABIO.wave) spawnBoss('fabio');
    else if (zone >= 2 && !pikaFled && r === 'trgarage') spawnBoss('pika');
    else if (!pikaDead && r === 'trcasa') casaScene();
  }
  if (casaT > 0) { casaT -= dt; if (casaT <= 0 && !boss && !pikaDead && inCasa(P.pos)) spawnBoss('pika'); }
  /* Pika: lancia le sigarette da lontano; nel garage a meta' vita scappa verso l'ascensore */
  if (boss && boss.kind === 'pika' && !boss.dead) {
    if (boss.flee) { boss.fleeT -= dt; if (boss.fleeT <= 0 || boss.m.position.distanceTo(new V3(LIFT.x, 0, LIFT.z)) < 1.6) endFlee(true); }
    else { boss.throwT -= dt; const d = boss.m.position.distanceTo(P.pos); if (boss.throwT <= 0 && d < 24 && d > 2.5) { boss.throwT = BOSS_PIKA.throwEvery * (0.8 + Math.random() * 0.4); pikaThrow(boss); } }
  }
}

/* ===================== BOTTIGLIE MISTERIOSE ===================== */
let skyRef = null;
let buff = null, bottle = null, bottleT = 30;
const buffK = k => !!(buff && buff.k === k);
const infAmmo = () => (P && P.pwT > 0 && P.pw.k === 'ammo') || buffK('ammo');
const BOTTLE_SPOTS = {
  1: [[-20, 15], [10, 18], [25, 2], [-4, -26], [22, -36], [80, -15], [96, -4], [0, -52], [20, -62]],
  2: [[-20, 20], [10, 15], [22, 28], [-14, -16], [16, -22], [-4, -27]].map(([x, z]) => [OX + x, z]),
  3: [[-20, 20], [16, 28], [-10, -10], [18, -16], [-20, -26], [22, -44], [110, -6]].map(([x, z]) => [TX + x, z]),
  4: [[-20, 15], [18, 30], [0, -25], [-5, -75], [5, -92], [-25, -125], [25, -135], [24, 10], [42, 12], [0, -170], [290, -20], [580, 20], [620, -30]].map(([x, z]) => [BX + x, z]),
};
const bottleGlass = new THREE.MeshStandardMaterial({ color: '#9ae0c0', roughness: 0.05, metalness: 0.2, transparent: true, opacity: 0.55 });
const bottleLiq = new THREE.MeshStandardMaterial({ color: '#b04aff', emissive: '#7a20d0', emissiveIntensity: 0.9, roughness: 0.2 });
function spawnBottle() {
  const reg = region(P.pos), spots = (BOTTLE_SPOTS[world] || []).filter(([x, z]) => region(new V3(x, 0, z)) === reg && Math.hypot(x - P.pos.x, z - P.pos.z) > 6);
  if (!spots.length) return; const [x, z] = spots[Math.floor(Math.random() * spots.length)];
  const g = new THREE.Group(); g.add(new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.12, 0.34, 14), bottleGlass)); const liq = new THREE.Mesh(new THREE.CylinderGeometry(0.095, 0.105, 0.24, 14), bottleLiq); liq.position.y = -0.04; g.add(liq);
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.08, 0.16, 12), bottleGlass); neck.position.y = 0.25; g.add(neck); const cork = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.06, 10), new THREE.MeshStandardMaterial({ color: '#8a5a30' })); cork.position.y = 0.35; g.add(cork);
  g.add(new THREE.Mesh(new THREE.SphereGeometry(0.5, 12, 8), new THREE.MeshBasicMaterial({ color: '#c070ff', transparent: true, opacity: 0.16, depthWrite: false })));
  g.scale.setScalar(1.4); g.position.set(x, 0.75, z); scene.add(g); bottle = { m: g, x, z, t: 40 }; feed('È comparsa una bottiglia misteriosa…');
}
function drinkBottle() {
  if (!bottle) return; scene.remove(bottle.m); bottle = null; bottleT = BOTTLE.every[0] + Math.random() * (BOTTLE.every[1] - BOTTLE.every[0]);
  P.hp = Math.max(1, P.hp - BOTTLE.hpCost); hurt();
  let r = Math.random() * BOTTLE_FX.reduce((a, f) => a + f.w, 0), fx = BOTTLE_FX[0]; for (const f of BOTTLE_FX) { r -= f.w; if (r <= 0) { fx = f; break; } }
  if (fx.k === 'spada') { giveWeapon('katana'); banner('Hai bevuto la bottiglia…', 'Ti è comparsa in mano la spada!'); return; }
  buff = { k: fx.k, n: fx.n, t: BOTTLE.dur }; banner('Hai bevuto la bottiglia…', fx.n + ' per ' + BOTTLE.dur + ' secondi'); tone(700, 0.4, 'sine', 0.06, 1400);
}
function updBottle(dt) {
  if (buff) { buff.t -= dt; if (buff.t <= 0) { feed('L\'effetto della bottiglia è finito'); buff = null; } }
  if (bottle) { bottle.t -= dt; bottle.m.rotation.y += dt * 1.5; bottle.m.position.y = 0.75 + Math.sin(time * 3) * 0.1; if (bottle.t <= 0) { scene.remove(bottle.m); bottle = null; bottleT = 20; } }
  else { bottleT -= dt; if (bottleT <= 0) { bottleT = 15; spawnBottle(); } }
}
function giveWeapon(id) {
  const have = P.weapons.findIndex(w => w.id === id);
  if (have >= 0) { const w = P.weapons[have]; w.res = maxRes(w); w.ammo = w.mag; switchWeapon(have); return; }
  if (P.weapons.length < 2) { P.weapons.push(newWeapon(id)); switchWeapon(1); } else { P.weapons[P.cur] = newWeapon(id); equip(); }
}
/* ===================== CASSA DELLE ARMI (una per mappa) ===================== */
const BOX_SPOTS = { 1: { x: 33, z: -51.5 }, 2: { x: OX + 14, z: -24 }, 3: { x: TX + 28, z: -46 }, 4: { x: BX - 24, z: -147 } };
const boxes3d = {};
function makeBoxModel(w) {
  const at = BOX_SPOTS[w], g = new THREE.Group(); g.position.set(at.x, 0, at.z);
  const wood = new THREE.MeshStandardMaterial({ color: '#6a4426', roughness: 0.75 }), band = new THREE.MeshStandardMaterial({ color: '#c8a03a', roughness: 0.3, metalness: 0.85 });
  const base = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.75, 0.9), wood); base.position.y = 0.38; g.add(base);
  for (const x of [-0.75, 0, 0.75]) { const b = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.78, 0.94), band); b.position.set(x, 0.38, 0); g.add(b); }
  const lid = new THREE.Group(); lid.position.set(0, 0.76, -0.45); g.add(lid); const lm = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.16, 0.9), wood); lm.position.set(0, 0.08, 0.45); lid.add(lm);
  const qt = document.createElement('canvas'); qt.width = 256; qt.height = 128; const q = qt.getContext('2d'); q.fillStyle = '#2a1a0e'; q.fillRect(0, 0, 256, 128); q.fillStyle = '#ffd25e'; q.font = '900 96px Arial Black,Arial'; q.textAlign = 'center'; q.textBaseline = 'middle'; q.fillText('? ? ?', 128, 66);
  const qtex = new THREE.CanvasTexture(qt); qtex.encoding = THREE.sRGBEncoding;
  const face = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.5), new THREE.MeshStandardMaterial({ map: qtex, emissive: '#ffffff', emissiveMap: qtex, emissiveIntensity: 0.5 })); face.position.set(0, 0.4, 0.46); g.add(face);
  const glow = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.85, 3.5, 16, 1, true), new THREE.MeshBasicMaterial({ color: '#ffd25e', transparent: true, opacity: 0.09, depthWrite: false, side: THREE.DoubleSide })); glow.position.y = 1.8; g.add(glow);
  const show = new THREE.Group(); show.position.y = 1.35; g.add(show);
  scene.add(g); solid(at.x, at.z, 1.9, 1.0, null, 0, 0.92);
  return { g, lid, show, glow, busy: 0, cycle: 0, pick: null };
}
for (const w of [1, 2, 3, 4]) boxes3d[w] = makeBoxModel(w);
function openBox() {
  const B = boxes3d[world]; if (!B || B.busy > 0) return;
  let r = Math.random() * BOX_POOL.reduce((a, x) => a + x.w, 0), pick = BOX_POOL[0].id; for (const x of BOX_POOL) { r -= x.w; if (r <= 0) { pick = x.id; break; } }
  B.busy = 2.2; B.pick = pick; B.cycle = 0; tone(300, 0.6, 'triangle', 0.05, 900);
}
function updBox(dt) {
  const B = boxes3d[world]; if (!B) return; B.glow.material.opacity = 0.07 + Math.sin(time * 3) * 0.03;
  if (B.busy > 0) {
    B.busy -= dt; B.lid.rotation.x = Math.max(-1.6, B.lid.rotation.x - dt * 5); B.cycle -= dt; B.show.rotation.y += dt * 4;
    if (B.cycle <= 0 && B.busy > 0.5) { B.cycle = 0.12; while (B.show.children.length) B.show.remove(B.show.children[0]); const id = BOX_POOL[Math.floor(Math.random() * BOX_POOL.length)].id; const gm = buildWeapon(id); gm.scale.setScalar(2.2); B.show.add(gm); click(); }
    if (B.busy <= 0.5 && B.pick) { while (B.show.children.length) B.show.remove(B.show.children[0]); const gm = buildWeapon(B.pick); gm.scale.setScalar(2.4); B.show.add(gm); giveWeapon(B.pick); banner('Cassa delle armi', 'Ti è uscito: ' + WEAPONS[B.pick].n + (B.pick === 'minigun' ? ' · l\'arma più forte del gioco!' : '')); buy(); B.pick = null; }
    if (B.busy <= 0) { while (B.show.children.length) B.show.remove(B.show.children[0]); }
  } else B.lid.rotation.x = Math.min(0, B.lid.rotation.x + dt * 3);
}

/* ===================== MONDO 4: IL CENTRO DI BUSTO ===================== */
function buSeq() { const a = [0, 1, 2, 3]; for (let i = 3; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
function resetBU() {
  bu = { tal: 0, cataKills: 0, seq: buSeq(), step: 0, look: 4, reT: 0 };
  buMacDoor.visible = true; buMacSolid.off = 0; buBarGate.g.visible = true; buBarGate.solid.off = 0; buPiazzaGate.g.visible = true; buPiazzaGate.solid.off = 0;
  buChurchDoor.visible = true; buChurchSolid.off = 0; buSeal.visible = true; buHole.visible = false; setPortal(0); buGT.userData.scratch.visible = false;
  BELLS.forEach(b => { b.glow.material.opacity = 0; }); setTablet(bu.seq, 0); nades.forEach(n => scene.remove(n.m)); nades = [];
}
function openMac() { bu.mac = 1; buMacDoor.visible = false; buMacSolid.off = 1; if (!quiet) banner('Il Mac è aperto', 'Dentro ci sono le granate e il mitragliatore · Corti arriva al round ' + BOSS_CORTI.wave); }
function openBar() { bu.bar = 1; buBarGate.g.visible = false; buBarGate.solid.off = 1; if (!quiet) banner('La zona dei bar', 'Napo è prigioniero dei cugini Progni · escono al round ' + BOSS_PROGNI.wave); }
function openPiazza() { bu.piazza = 1; buPiazzaGate.g.visible = false; buPiazzaGate.solid.off = 1; }
function openChiesa() { bu.chiesa = 1; buChurchDoor.visible = false; buChurchSolid.off = 1; if (!quiet) banner('La basilica di San Giovanni', 'Dentro c\'è la minigun · Loris ti aspetta al round ' + BOSS_LORIS4.wave); }
function openSeal() { bu.seal = 1; buSeal.visible = false; buHole.visible = true; shake(0.4); tone(60, 1.2, 'sawtooth', 0.1, 30); banner('Il sigillo si apre!', 'Sotto la chiesa ci sono le catacombe: scendi'); }
function openAllBU() { quiet = true; openMac(); openBar(); openPiazza(); openChiesa(); quiet = false; bu.tal = 2; }
/* cambio di zona (catacombe, Sardegna): i nemici rimasti indietro spariscono */
function buTeleport(to, yawTo) {
  for (const e of enemies) { if (e.dead || (e.boss && !e.flee)) continue; scene.remove(e.m); e.gone = 1; alive--; toSpawn++; } enemies = enemies.filter(e => !e.gone);
  if (boss && mode === 'sandbox') { scene.remove(boss.m); enemies = enemies.filter(e => e !== boss); alive--; boss = null; $('boss').hidden = true; }
  P.pos.set(to.x, 0, to.z); P.vy = 0; yaw = yawTo !== undefined ? yawTo : (to.yaw || 0);
}
function goCata() { buTeleport(CATA_START); banner('Le catacombe', bu.ritual ? 'Il portale ti aspetta in fondo' : 'Elimina i Mammutones, poi suona i campanacci nell\'ordine scritto sulla tavola'); }
function goSard() { buTeleport(SARD_START); if (!bu.sard) { bu.sard = 1; bu.reT = 6; } tone(180, 1.4, 'sine', 0.08, 1200); banner('La Sardegna', 'Il regno dei Mammutones. Loris ti aspetta tra i nuraghi…'); }
function ringBell(i) {
  const b = BELLS[i]; b.ring = 1.2; bell(); tone(520 + i * 120, 0.5, 'triangle', 0.07, 300 + i * 80);
  if (bu.seq[bu.step] === i) { bu.step++; b.glow.material.opacity = 0.35; setTablet(bu.seq, bu.step);
    if (bu.step === 4) { bu.ritual = 1; setPortal(1); banner('Il rituale è compiuto!', 'Ora attiva il portale in fondo · ' + BU_COSTS.portale + ' monete'); } else feed('Giusto! ' + bu.step + '/4'); }
  else { bu.step = 0; bu.seq = buSeq(); setTablet(bu.seq, 0); BELLS.forEach(x => (x.glow.material.opacity = 0)); banner('Ordine sbagliato!', 'I campanacci svegliano i Mammutones… la tavola cambia');
    for (let k = 0; k < 4; k++) spawnEnemy(k % 2 ? 'capra' : 'furia', [b.x + (Math.random() - 0.5) * 4, b.z + 2]); }
}
function buBossDown(kind, at) {
  if (kind === 'progni') { const tw = enemies.find(e => e.twin && !e.dead); if (tw) { tw.twin = 0; tw.boss = 1; boss = tw; boss.summon = BOSS_PROGNI.summonEvery; $('boss').hidden = false; $('bossn').textContent = 'Progni · l\'ultimo cugino'; banner('Un cugino Progni è a terra!', 'Manca l\'altro: è furioso'); return; } }
  if (mode === 'sandbox') { bu[kind === 'pierre4' ? 'pierre' : kind === 'loris4' ? 'loris' : kind] = 1; if (kind === 'loris4') bu.tal = 2; if (kind === 'progni') openPiazza(); banner(BOSSK[kind].title.replace('!', '') + ' è sconfitto!', 'Esci dalla zona e rientra per sfidarlo di nuovo'); return; }
  if (kind === 'pierre4') { bu.pierre = 1; banner('Pierre è sconfitto per sempre!', 'Adesso puoi aprire il Mac · ' + BU_COSTS.mac + ' monete'); return; }
  if (kind === 'corti') {
    bu.corti = 1; bu.tal = Math.max(bu.tal, 1); const c = unlockChar('corti');
    setTimeout(() => rescue(8, 'Corti', 'Raga… avevo una fame da maledizione. Grazie! Tenete, era nel mio panino: metà del talismano.', at), 1200);
    banner('Corti è libero dalla maledizione!', (c ? 'Hai sbloccato Corti · ' : '') + 'Ti dà la prima metà del talismano');
    setTimeout(() => { if (state !== 'play' || world !== 4) return; rescue(null, 'Loris Busato', 'Bravi… ma non basta. Vi aspetto alla chiesa: lì finisce tutto.', new V3(BX + 27, 0, 11), { build: buildLoris, to: new V3(BX + 8, 0, -40), life: 5.2, title: 'Loris Busato!', sub: 'Vi aspetta alla chiesa · apri la strada per i bar (' + BU_COSTS.bar + ')' }); }, 7200);
    return;
  }
  if (kind === 'progni') {
    bu.progni = 1; openPiazza(); const c = unlockChar('bar'); if (c) lastUnlock = { name: 'Napo e Ali Debbah' };
    setTimeout(() => rescue(20, 'Napo', 'Grazie raga! I Progni ci tenevano legati dietro al bancone del bar.', at), 1400);
    setTimeout(() => rescue(21, 'Ali Debbah', 'Fratelli, siete arrivati! Andiamo a prendere Loris in chiesa.', at), 4200);
    banner('I cugini Progni sono a terra!', (c ? 'Hai sbloccato Napo e Ali Debbah · ' : '') + 'La strada per piazza San Giovanni è libera'); return;
  }
  if (kind === 'loris4') {
    bu.loris = 1; bu.tal = 2;
    rescue(null, 'Loris Busato', 'Non è finita! Il mio regno vi aspetta sotto la chiesa…', at, { build: buildLoris, to: new V3(BX, 0, -182.5), life: 3.6, title: 'Loris scappa nelle catacombe!', sub: 'Ti lascia l\'altra metà del talismano: uniscile sul sigillo' }); return;
  }
  if (kind === 're') {
    bu.re = 1; for (const e of enemies) if (!e.dead) { e.dead = 1; e.deadT = 0; alive--; }
    const c = unlockChar('busto'); lastUnlock = { name: c ? 'DJ Gianfra' + (unlocks.bar ? '' : '') : 'tutto il centro di Busto' };
    setTimeout(() => rescue(22, 'DJ Gianfra', 'Raga, finalmente! Loris mi aveva portato qui a fare la musica per il suo regno. Adesso si festeggia a Busto!', at), 1600);
    banner('Il Re dei Mammutones è sconfitto!', 'Busto è salva'); setTimeout(victory, 8200);
  }
}
function updBU4(dt) {
  const reg = buRegion(P.pos);
  sun.position.set(P.pos.x - 35, 62, P.pos.z + 40); sun.target.position.set(P.pos.x, 0, P.pos.z); sun.target.updateMatrixWorld();
  const look = inSard(P.pos) ? 5 : inCata(P.pos) ? 6 : 4; if (look !== bu.look) { bu.look = look; applyLook(look); }
  const hk = reg === 'bcata' ? 0.9 : reg === 'bmacin' || reg === 'bchiesa' ? 0.75 : look === 5 ? 1.05 : 0.95; hemi.intensity += (hk - hemi.intensity) * Math.min(1, dt * 3);
  if (reg === 'bsard') updateSheep(dt, P.pos.x, P.pos.z);
  if (bu.reT > 0) bu.reT -= dt;
  if (boss) return;
  if (mode === 'sandbox') {
    if (reg !== 'bfontana') bu.pierre = 0; if (reg !== 'bmacin') bu.corti = 0; if (reg !== 'bbar') bu.progni = 0; if (reg !== 'bchiesa') bu.loris = 0; if (reg !== 'bsard') bu.re = 0;
    if (reg === 'bfontana' && !bu.pierre) spawnBoss('pierre4'); else if (reg === 'bmacin' && !bu.corti) spawnBoss('corti'); else if (reg === 'bbar' && !bu.progni) spawnBoss('progni');
    else if (reg === 'bchiesa' && !bu.loris) spawnBoss('loris4'); else if (reg === 'bsard' && !bu.re && bu.reT <= 0) spawnBoss('re');
    return;
  }
  if (!bu.pierre && reg === 'bfontana' && wave >= BOSS_PIERRE4.wave) spawnBoss('pierre4');
  else if (bu.mac && !bu.corti && reg === 'bmacin' && wave >= BOSS_CORTI.wave) spawnBoss('corti');
  else if (bu.bar && !bu.progni && reg === 'bbar' && wave >= BOSS_PROGNI.wave) spawnBoss('progni');
  else if (bu.chiesa && !bu.loris && reg === 'bchiesa' && wave >= BOSS_LORIS4.wave) spawnBoss('loris4');
  else if (bu.sard && !bu.re && reg === 'bsard' && bu.reT <= 0) spawnBoss('re');
}
/* panini di Corti e campanacci giganti del Re */
const bunM = new THREE.MeshStandardMaterial({ color: '#d8963a', roughness: 0.6 }), meatM = new THREE.MeshStandardMaterial({ color: '#5a2e1a', roughness: 0.8 });
function cortiThrow(e) {
  const g = new THREE.Group(); const t = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 8), bunM); t.scale.set(1, 0.6, 1); t.position.y = 0.06; g.add(t); g.add(new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.06, 12), meatM)); const b = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.06, 12), bunM); b.position.y = -0.06; g.add(b);
  const from = e.m.position.clone(); from.y += 2.6; g.position.copy(from); scene.add(g); const to = P.pos.clone(); to.y = 0.8;
  hostile.push({ m: g, from, to, t: 0, T: 0.45 + from.distanceTo(to) * 0.028, burger: 1, arc: 1.4 }); tone(400, 0.08, 'triangle', 0.04, 220);
  const A = e.m.userData.P.armL; A.rotation.x = -2.6; setTimeout(() => { A.rotation.x = 0; }, 200);
}
function reThrow(e) {
  const g = new THREE.Group(); const b = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.5, 0.7, 14, 1, true), bellM); g.add(b); const top = new THREE.Mesh(new THREE.SphereGeometry(0.2, 10, 8), bellM); top.position.y = 0.35; g.add(top);
  const from = e.m.position.clone(); from.y += 6; g.position.copy(from); scene.add(g); const to = P.pos.clone(); to.y = 0.5;
  hostile.push({ m: g, from, to, t: 0, T: 0.7 + from.distanceTo(to) * 0.025, big: 1, arc: 3 }); bell(); tone(120, 0.4, 'sawtooth', 0.06, 70);
}
/* granate: si lanciano dove guardi, esplodono quando cadono */
let nades = [];
function throwGrenade(w) {
  fireT = w.rate; tone(500, 0.08, 'triangle', 0.04, 260);
  const camDir = new V3(); camera.getWorldDirection(camDir); ray.set(camera.position, camDir); ray.far = 34;
  const hits = ray.intersectObjects(hitTargets(), false); let to = hits.length ? hits[0].point.clone() : camera.position.clone().add(camDir.clone().multiplyScalar(24));
  to.y = Math.max(0.2, Math.min(to.y, 2)); const from = muzzle();
  const m = buildWeapon('granate'); m.scale.setScalar(2); m.position.copy(from); scene.add(m);
  nades.push({ m, from, to, t: 0, T: 0.35 + from.distanceTo(to) * 0.03, dmg: w.dmg * (P.pwT > 0 && (P.pw.k === 'rage' || P.pw.k === 'speed') ? (P.pw.k === 'rage' ? 2 : 1.8) : 1), R: w.explode });
  pModel.userData.P.armR.rotation.x -= 1.0; if (pModel.userData.hd) pModel.userData.hd.throw();
}
function updNades(dt) {
  for (const n of nades) { n.t += dt; const k = Math.min(1, n.t / n.T); n.m.position.lerpVectors(n.from, n.to, k); n.m.position.y += Math.sin(k * Math.PI) * 2.2; n.m.rotation.x += dt * 10;
    if (k >= 1) { scene.remove(n.m); n.gone = 1; explode(n.to, n.R, n.dmg); } }
  nades = nades.filter(n => !n.gone);
}
/* il collare di Napo: i Mammutones vicini diventano alleati */
const collarM = new THREE.MeshBasicMaterial({ color: '#4aff9a' });
function collare() {
  const list = enemies.filter(e => !e.dead && !e.boss && !e.twin && e.m.position.distanceTo(P.pos) < 11).sort((a, b) => a.m.position.distanceTo(P.pos) - b.m.position.distanceTo(P.pos)).slice(0, 6);
  for (const e of list) { e.ally = P.pw.dur; const c = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.06, 6, 16), collarM); c.rotation.x = Math.PI / 2; c.position.y = (e.m.userData.height || 1.8) / e.m.scale.x * 0.78; e.m.add(c); e.collar = c; }
  banner('Il collare di Napo!', list.length ? list.length + ' nemici combattono per te' : 'Nessuno abbastanza vicino'); tone(800, 0.4, 'square', 0.04, 1600);
}
function updAlly(e, dt) {
  const m = e.m; e.ally -= dt; if (e.ally <= 0) { e.dead = 1; e.deadT = 0; alive--; if (e.collar) e.collar.visible = false; return; }
  let tgt = null, bd = 30; for (const o of enemies) { if (o === e || o.dead || o.ally > 0) continue; const d = o.m.position.distanceTo(m.position); if (d < bd) { bd = d; tgt = o; } }
  const goal = tgt ? tgt.m.position : P.pos.clone().add(new V3(2, 0, 2)); const to = goal.clone().sub(m.position); to.y = 0; const dist = to.length(); m.rotation.y = Math.atan2(to.x, to.z);
  if (dist > 1.3 + (tgt ? tgt.r || 0.4 : 1)) { m.position.addScaledVector(to.normalize(), e.spd * 1.15 * dt); collide(m.position, e.r, 1); e.walk += dt * e.spd * 2.2; animLimbs(m, e.walk, 0.55); }
  else if (tgt) { e.atk -= dt; m.userData.P.armR.rotation.x = -1.4 + Math.sin(time * 12) * 0.4; if (e.atk <= 0) { e.atk = e.atkCd * 0.7; damageEnemy(tgt, e.dmg * 3 + 30, false); spark(tgt.m.userData.hit.body.getWorldPosition(new V3()), true); } }
}

/* ===================== PIPISTRELLI DI BULEGATO ===================== */
let bats = [];
const batM = new THREE.MeshStandardMaterial({ color: '#1a1420', roughness: 0.6, side: THREE.DoubleSide }), batEye = new THREE.MeshBasicMaterial({ color: '#ff3040' });
function makeBat() {
  const g = new THREE.Group(); const body = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 8), batM); body.scale.set(0.8, 0.8, 1.2); g.add(body);
  for (const sd of [-1, 1]) { const e = new THREE.Mesh(new THREE.SphereGeometry(0.022, 6, 4), batEye); e.position.set(sd * 0.04, 0.03, 0.11); g.add(e);
    const ear = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.08, 4), batM); ear.position.set(sd * 0.05, 0.12, 0.02); g.add(ear); }
  const wings = []; for (const sd of [-1, 1]) { const w = new THREE.Group(); w.position.x = sd * 0.08; const sh = new THREE.Shape(); sh.moveTo(0, 0); sh.lineTo(sd * 0.42, 0.12); sh.lineTo(sd * 0.36, -0.04); sh.lineTo(sd * 0.24, 0.02); sh.lineTo(sd * 0.16, -0.08); sh.lineTo(0, -0.04);
    const wm = new THREE.Mesh(new THREE.ShapeGeometry(sh), batM); wm.rotation.x = -Math.PI / 2; w.add(wm); g.add(w); wings.push(w); }
  g.userData.wings = wings; return g;
}
function callBats() {
  bats.forEach(b => scene.remove(b.m)); bats = [];
  for (let k = 0; k < 3; k++) { const m = makeBat(); m.position.copy(P.pos).add(new V3(Math.cos(k * 2.1) * 1.2, 1.8, Math.sin(k * 2.1) * 1.2)); scene.add(m); bats.push({ m, k, t: P.pw.dur, cd: k * 0.15, flap: k }); }
  banner('I pipistrelli del re dei vampiri!', 'Bulegato evoca tre pipistrelli'); tone(1800, 0.3, 'square', 0.04, 900);
}
function updBats(dt) {
  for (const b of bats) {
    b.t -= dt; const m = b.m; b.flap += dt * 22; m.userData.wings.forEach((w, i) => (w.rotation.z = Math.sin(b.flap) * 0.9 * (i ? -1 : 1)));
    if (b.t <= 0) { m.scale.multiplyScalar(0.9); m.position.y += dt * 3; if (m.scale.x < 0.05) { scene.remove(m); b.gone = 1; } continue; }
    let tgt = null, bd = 22; for (const e of enemies) { if (e.dead) continue; const d = e.m.position.distanceTo(P.pos); if (d < bd) { bd = d; tgt = e; } }
    b.cd -= dt; let goal;
    if (tgt) { goal = tgt.m.userData.hit.head.getWorldPosition(new V3()); goal.y -= 0.1; }
    else goal = P.pos.clone().add(new V3(Math.cos(time * 2 + b.k * 2.1) * 1.4, 1.9, Math.sin(time * 2 + b.k * 2.1) * 1.4));
    const to = goal.clone().sub(m.position); const d = to.length();
    if (tgt && d < 0.7 && b.cd <= 0) { b.cd = 0.35; damageEnemy(tgt, tgt.boss ? 16 : 32, false); spark(goal, true); m.position.add(to.clone().normalize().multiplyScalar(-1.2)); m.position.y += 0.4; }
    else if (d > 0.05) { m.position.addScaledVector(to.normalize(), Math.min(d, 10 * dt)); }
    m.lookAt(goal);
  }
  if (bats.length && bats.every(b => b.gone)) bats = [];
}
/* ===================== SIGARETTE DI PIKA ===================== */
let cigs = [], cigT = 0;
const packM = [new THREE.MeshStandardMaterial({ color: '#f2f2ee', roughness: 0.5 }), new THREE.MeshStandardMaterial({ color: '#c8302a', roughness: 0.5 })];
function updCigs(dt) {
  if (P && P.pwT > 0 && P.pw.k === 'sigarette') {
    cigT -= dt;
    if (cigT <= 0) { let tgt = null, bd = 24; for (const e of enemies) { if (e.dead) continue; const d = e.m.position.distanceTo(P.pos); if (d < bd) { bd = d; tgt = e; } }
      if (tgt) { cigT = 0.42; const g = new THREE.Group(); const box = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.2, 0.06), packM[0]); g.add(box); const top = new THREE.Mesh(new THREE.BoxGeometry(0.142, 0.07, 0.062), packM[1]); top.position.y = 0.07; g.add(top);
        g.position.copy(P.pos); g.position.y += 1.4; scene.add(g); cigs.push({ m: g, from: g.position.clone(), tgt, t: 0, T: 0.25 + bd * 0.025 }); tone(600, 0.06, 'triangle', 0.03, 300);
        const A = pModel.userData.P.armL; A.rotation.x = -2.4; setTimeout(() => { A.rotation.x = 0; }, 150); } else cigT = 0.15; }
  }
  for (const c of cigs) {
    c.t += dt; const k = Math.min(1, c.t / c.T); const to = c.tgt.m.userData.hit.body.getWorldPosition(new V3());
    c.m.position.lerpVectors(c.from, to, k); c.m.position.y += Math.sin(k * Math.PI) * 1.2; c.m.rotation.x += dt * 14; c.m.rotation.z += dt * 9;
    if (k >= 1) { if (!c.tgt.dead) damageEnemy(c.tgt, 80, false); explode(to, 1.4, 40, true, c.tgt); spark(to, true); scene.remove(c.m); c.gone = 1; }
  }
  cigs = cigs.filter(c => !c.gone);
}
/* ===================== LIBE IL MATTO: IL POTERE INUTILE ===================== */
function libeMatto() {
  banner('Libe il matto…', 'ha avuto un\'idea. Una pessima idea.'); tone(300, 0.4, 'triangle', 0.05, 900);
  setTimeout(() => { if (state !== 'play') return; const p = P.pos.clone(); p.y += 0.6; explode(p, 2.2, 0); P.hp = 0;
    gameOver('Libe il <span>matto</span>', 'Libe ha usato il suo potere. Era il potere più inutile del gioco: ha acceso la miccia, si è girato a guardare… e boom. Hai perso.'); }, 1500);
}

/* ===================== AMICI ALBANESI DI TEFALIN ===================== */
let albanesi = [];
const redBand = new THREE.MeshStandardMaterial({ color: '#d8202a', roughness: 0.6 });
function callAlbanesi() {
  albanesi.forEach(a => scene.remove(a.m)); albanesi = [];
  for (const s of [-1, 1]) {
    const m = buildHuman(DAMIANO_MODEL); m.position.copy(P.pos).add(new V3(1.6 * s, 0, 1.4)); scene.add(m);
    const hb = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.045, 8, 20), redBand); hb.rotation.x = Math.PI / 2; hb.position.y = 1.78; m.add(hb);
    const A = m.userData.P.armR; const g = buildWeapon('ak47'); g.position.copy(A.userData.hand.position); g.rotation.x = Math.PI / 2; A.add(g);
    albanesi.push({ m, s, t: P.pw.dur, fire: Math.random() * 0.1, walk: 0 });
  }
  banner('Arrivano gli albanesi!', 'Due amici di Tefalin con l\'AK-47: smitragliano tutto per qualche secondo');
}
function updAlbanesi(dt) {
  for (const a of albanesi) {
    if (a.gone) continue; a.t -= dt; const m = a.m; if (a.t <= 0) { scene.remove(m); a.gone = 1; continue; }
    let target = null, bd = 24; for (const e of enemies) { if (e.dead || e.boss) continue; const d = e.m.position.distanceTo(m.position); if (d < bd) { bd = d; target = e; } }
    const want = P.pos.clone().add(new V3(Math.sin(time * 0.6 + a.s * 1.6) * 2.6, 0, Math.cos(time * 0.6 + a.s * 1.6) * 2.6)); const mv = want.sub(m.position); mv.y = 0; const dist = mv.length();
    if (dist > 1) { mv.normalize().multiplyScalar(Math.min(dist, 6.5 * dt)); m.position.add(mv); a.walk += dt * 9; animLimbs(m, a.walk, 0.6); }
    collide(m.position, 0.4, 1);
    if (target) {
      const d = target.m.position.clone().sub(m.position); m.rotation.y = Math.atan2(d.x, d.z); m.userData.P.armR.rotation.x = -1.5;
      a.fire -= dt;
      if (a.fire <= 0) { a.fire = 0.11; const s = m.position.clone(); s.y = 1.35; const b = target.m.userData.hit.body.getWorldPosition(new V3()); tracer(s, b); spark(b, true); damageEnemy(target, 18, false); shotSound(0, 0.25); }
    }
  }
  if (albanesi.length && albanesi.every(a => a.gone)) { albanesi = []; feed('Gli albanesi se ne vanno'); }
}
/* fischio di Diego: congela tutti i nemici vicini (il boss solo per poco) */
const iceM = new THREE.MeshBasicMaterial({ color: '#9ae4ff', transparent: true, opacity: 0.35, depthWrite: false });
function fischio() {
  tone(2400, 0.5, 'sine', 0.09, 2900); setTimeout(() => tone(2900, 0.35, 'sine', 0.07, 2200), 120);
  let n = 0; for (const e of enemies) { if (e.dead) continue; if (e.m.position.distanceTo(P.pos) > 20) continue;
    e.frozen = e.boss ? 1.5 : 4.5; n++;
    if (!e.ice) { e.ice = new THREE.Mesh(new THREE.SphereGeometry(0.75, 12, 10), iceM); e.ice.position.y = 1; e.ice.scale.set(1, 1.5, 1); e.m.add(e.ice); } }
  banner('Fischio di Diego!', n ? n + ' nemici congelati' : 'Nessuno a portata di fischio');
}

/* ===================== MIRKO ===================== */
function callMirko() {
  if (mirko) scene.remove(mirko.m);
  const m = buildHuman(MIRKO_MODEL); m.position.copy(P.pos).add(new V3(1.5, 0, 1.5)); scene.add(m);
  const A = m.userData.P.armR; const g = buildWeapon('pistola'); g.position.copy(A.userData.hand.position); g.rotation.x = Math.PI / 2; A.add(g);
  mirko = { m, t: P.pw.dur, fire: 0, walk: 0 }; banner('Arriva Mirko!', 'Spara ai Mammutones per qualche secondo');
  if (hdOn) { const me = mirko; loadHD('mirko').then(h => { if (mirko !== me) return; h.root.position.copy(me.m.position); scene.remove(me.m); scene.add(h.root); me.m = h.root;
    const g = buildWeapon('pistola'); g.traverse(o => { if (o.isMesh) o.castShadow = true; }); h.attachGun(g, 'pistola'); }).catch(() => {}); }
}
function updMirko(dt) {
  if (!mirko) return; mirko.t -= dt; const m = mirko.m;
  if (mirko.t <= 0) { scene.remove(m); mirko = null; feed('Mirko se ne va'); return; }
  let target = null, bd = 22; for (const e of enemies) { if (e.dead) continue; const d = e.m.position.distanceTo(m.position); if (d < bd) { bd = d; target = e; } }
  const want = P.pos.clone().add(new V3(Math.sin(time * 0.5) * 2.2, 0, Math.cos(time * 0.5) * 2.2)); const mv = want.sub(m.position); mv.y = 0; const dist = mv.length();
  const hd = m.userData.hd, walking = dist > 1;
  if (walking) { mv.normalize(); if (hd && !target) m.rotation.y = Math.atan2(mv.x, mv.z); mv.multiplyScalar(Math.min(dist, 6 * dt)); m.position.add(mv); mirko.walk += dt * 9; if (!hd) animLimbs(m, mirko.walk, 0.6); }
  collide(m.position, 0.4, 1);
  if (hd) { const dir = target ? target.m.position.clone().sub(m.position).setY(0).normalize() : new V3(Math.sin(m.rotation.y), 0, Math.cos(m.rotation.y));
    const fdir = new V3(Math.sin(m.rotation.y), 0, Math.cos(m.rotation.y)), rdir = new V3(-fdir.z, 0, fdir.x), mn = walking ? mv.clone().normalize() : new V3();
    hd.update(dt, { moving: walking, running: !target, speed: 6, f: walking ? mn.dot(fdir) : 0, side: walking ? mn.dot(rdir) : 0, shooting: !!target, dir, pitch: 0 }); }
  if (target) {
    const d = target.m.position.clone().sub(m.position); m.rotation.y = Math.atan2(d.x, d.z); m.userData.P.armR.rotation.x = -1.5;
    mirko.fire -= dt;
    if (mirko.fire <= 0) { mirko.fire = 0.3; const a = m.position.clone(); a.y = 1.35; const b = target.m.userData.hit.body.getWorldPosition(new V3()); tracer(a, b); spark(b, true); damageEnemy(target, 30, false); shotSound(0, 0.4); }
  }
}

/* ===================== INPUT ===================== */
const cv = renderer.domElement;
function lock() { if (isTouch) return; try { const r = cv.requestPointerLock(); if (r && r.catch) r.catch(() => {}); } catch (_) {} }
addEventListener('keydown', e => {
  keys[e.code] = true;
  if (state === 'inv') { if (e.code === 'Tab' || e.code === 'KeyI' || e.code === 'Escape') { e.preventDefault(); closeInv(); } return; }
  if (state !== 'play') return;
  if (e.code === 'KeyR') startReload(); if (e.code === 'KeyE') useInter(); if (e.code === 'KeyQ') usePower(); if (e.code === 'KeyH') usePack();
  if (e.code === 'Tab' || e.code === 'KeyI') { e.preventDefault(); openInv(); return; }
  if (e.code === 'Digit1') switchWeapon(0); if (e.code === 'Digit2') switchWeapon(1);
  if (e.code === 'KeyP') pauseGame();
  if (e.code === 'KeyV') setFP(!fp);
  if (e.code === 'Space' && onGround()) P.vy = 6.9;
  if (['Space', 'ArrowUp', 'ArrowDown'].includes(e.code)) e.preventDefault();
});
addEventListener('keyup', e => { keys[e.code] = false; });
addEventListener('wheel', () => { if (state === 'play' && P.weapons.length > 1) switchWeapon(1 - P.cur); }, { passive: true });
cv.addEventListener('mousedown', e => {
  audio(); if (state !== 'play') return; if (!locked) lock();
  if (e.button === 0) { mouseDown = true; if (fireT <= 0) shoot(); } if (e.button === 2) rDrag = true;
});
addEventListener('mouseup', e => { if (e.button === 0) mouseDown = false; if (e.button === 2) rDrag = false; });
cv.addEventListener('contextmenu', e => e.preventDefault());
addEventListener('mousemove', e => { if (state !== 'play') return; if (locked || rDrag || mouseDown) { yaw -= e.movementX * 0.0026; pitch -= e.movementY * 0.0022; pitch = Math.max(-1.1, Math.min(0.9, pitch)); } });
document.addEventListener('pointerlockchange', () => { locked = document.pointerLockElement === cv; if (!locked && state === 'play' && everLocked) pauseGame(); if (locked) everLocked = true; });
const shieldMesh = new THREE.Mesh(new THREE.SphereGeometry(1.25, 16, 10), new THREE.MeshBasicMaterial({ color: '#f2b93b', transparent: true, opacity: 0.22 })); shieldMesh.visible = false; scene.add(shieldMesh);
function usePower() {
  if (P.pwCd > 0) return; const pw = P.pw; P.pwCd = pw.cd;
  if (pw.k === 'heal') { P.hp = Math.min(100, P.hp + 60); feed('Dado si cura'); pickS(); }
  else if (pw.k === 'call') callMirko();
  else if (pw.k === 'blast') blast();
  else if (pw.k === 'albanesi') callAlbanesi();
  else if (pw.k === 'fischio') fischio();
  else if (pw.k === 'pipistrelli') callBats();
  else if (pw.k === 'matto') { libeMatto(); return; }
  else if (pw.k === 'collare') { collare(); P.pwT = pw.dur; }
  else if (pw.k === 'gratis') { P.freeGun = true; banner('DJ Gianfra', 'La prossima arma che compri al muro è gratis'); tone(900, 0.3, 'triangle', 0.05, 1400); }
  else { P.pwT = pw.dur; feed(pw.n + '!'); }
  if (pw.k === 'shield') shieldMesh.visible = true;
  if (pModel.userData.hd) pModel.userData.hd.power(P.moving);
}

/* onda d'urto di Tefalin: ferisce e spinge via tutti i nemici vicini */
function blast() {
  const R = 7; for (const e of enemies) {
    if (e.dead) continue; const d = e.m.position.clone().sub(P.pos); d.y = 0; const l = d.length(); if (l > R) continue;
    damageEnemy(e, (e.boss ? 260 : 170) * (1 - l / (R * 1.6)), false); e.kick = 0.45;
    if (!e.boss && l > 0.01) { e.m.position.addScaledVector(d.normalize(), 4 * (1 - l / R) + 0.6); collide(e.m.position, e.r, 1); }
  }
  const ring = new THREE.Mesh(new THREE.TorusGeometry(1, 0.12, 8, 40), new THREE.MeshBasicMaterial({ color: '#ff8aa0', transparent: true, opacity: 0.85 }));
  ring.rotation.x = Math.PI / 2; ring.position.set(P.pos.x, 0.6, P.pos.z); scene.add(ring); rings.push({ m: ring, t: 0 });
  shake(0.3); tone(70, 0.45, 'sawtooth', 0.09, 30); feed("Onda d'urto!");
}

/* ===================== HUD ===================== */
/* ===================== INVENTARIO ===================== */
function openInv() { if (state !== 'play') return; state = 'inv'; try { document.exitPointerLock(); } catch (_) {} mouseDown = false; renderInv(); $('inv').hidden = false; }
function closeInv() { $('inv').hidden = true; state = 'play'; last = performance.now(); lock(); }
function usePack() { if (!packs) { feed('Non hai pacchi di munizioni'); denied(); return; } const w = P.weapons[P.cur]; if (WEAPONS[w.id].noPack) { feed(WEAPONS[w.id].melee ? 'La katana non ha bisogno di munizioni' : WEAPONS[w.id].n + ' si ricarica solo al muro'); return; } packs--; w.res = maxRes(w); w.ammo = w.mag; feed('Pacco usato: munizioni piene'); pickS(); }
function renderInv() {
  const nb = INVENTORY.bags[bag];
  $('invw').innerHTML = P.weapons.map(w => `<div class="iw"><b>${w.n}</b><span>${w.ammo} nel caricatore · ${w.res} / ${maxRes(w)} di riserva</span></div>`).join('');
  $('invinfo').textContent = `Monete ${coins} · Pacchi di munizioni ${packs}/${INVENTORY.packMax} · Zaino livello ${bag} (munizioni massime ×${bagMult()})`;
  $('buyPack').innerHTML = `Compra pacco munizioni<small>${INVENTORY.packCost} monete · ne porti fino a ${INVENTORY.packMax}</small>`; $('buyPack').disabled = packs >= INVENTORY.packMax;
  $('usePack').innerHTML = `Usa un pacco<small>riempie l'arma in mano · tasto H o ↑ sul controller</small>`; $('usePack').disabled = !packs;
  $('buyBag').innerHTML = nb ? `Zaino più grande<small>${nb.cost} monete · munizioni massime ×${nb.mult}</small>` : 'Zaino al massimo<small>non puoi ingrandirlo ancora</small>'; $('buyBag').disabled = !nb;
}
function invBuy(kind) {
  if (kind === 'pack') { if (packs >= INVENTORY.packMax) return; if (coins < INVENTORY.packCost) { denied(); return; } coins -= INVENTORY.packCost; packs++; buy(); }
  if (kind === 'bag') { const nb = INVENTORY.bags[bag]; if (!nb) return; if (coins < nb.cost) { denied(); return; } coins -= nb.cost; bag++; buy(); }
  if (kind === 'use') usePack();
  renderInv();
}
function feed(t) { const d = document.createElement('div'); d.textContent = t; $('feed').prepend(d); setTimeout(() => d.remove(), 2600); while ($('feed').children.length > 5) $('feed').lastChild.remove(); }
let bannerT = 0; const bannerFn = (t, s) => banner(t, s); const feedFn = t => feed(t); function banner(t, s) { $('banner').innerHTML = t + (s ? `<small>${s}</small>` : ''); $('banner').hidden = false; bannerT = 2.6; }
function hud() {
  $('wave').innerHTML = wave + '<small>Ondata · ' + ZONES[world >= 3 ? diffZone() : zoneIdx()].n + (world === 4 && bu.tal ? ' · talismano ' + bu.tal + '/2' : '') + '</small>'; $('coins').textContent = coins;
  $('hpb').style.width = P.hp + '%'; $('hpt').textContent = Math.ceil(P.hp); $('arb').style.width = (P.ar / DROPS.maxArmor * 100) + '%';
  const w = P.weapons[P.cur]; const inf = infAmmo(); $('wname').textContent = w.n + (P.reloadT > 0 ? ' · ricarica…' : '');
  $('ammo').innerHTML = w.melee ? '⚔' : inf ? '∞' : `${w.ammo}<small> / ${w.res}</small>`;
  $('slots').innerHTML = P.weapons.map((x, i) => `<span class="${i === P.cur ? 'on' : ''}">${i + 1} ${x.n}</span>`).join('') + `<span>Pacchi ${packs} · H</span>`;
  const on = P.pwT > 0 || (P.pw.k === 'call' && mirko); $('pw').classList.toggle('on', !!on);
  $('pwb').style.width = (on ? (P.pw.k === 'call' && mirko ? mirko.t : P.pwT) / P.pw.dur * 100 : (1 - P.pwCd / P.pw.cd) * 100) + '%';
  const lbl = nearI && nearI.label(); $('prompt').hidden = !lbl; if (lbl) $('prompt').innerHTML = lbl + (buffK('saldi') && /<b>\d/.test(lbl) ? ' <small style="color:#7aff8a">· SALDI -50%</small>' : '');
  $('stb').style.width = (P.stam * 100) + '%'; $('stb').parentNode.classList.toggle('tired', P.tired);
  $('buff').hidden = !buff; if (buff) $('buff').innerHTML = '🍾 ' + buff.n + ' <b>' + Math.ceil(buff.t) + 's</b>';
}

/* ===================== LOOP ===================== */
let last = performance.now();
function loop(t) {
  requestAnimationFrame(loop); const dt = Math.min(window.__dtMax || 0.05, (t - last) / 1000); last = t;
  pollPad(); if (pad.connected) padMenus(dt);
  if (touchUI) { const show = state === 'play'; if (touchUI.hidden === show) touchUI.hidden = !show; if (!show) { touch.fire = false; touch.mx = touch.my = 0; } }
  if (state === 'play') { time += dt; update(dt); }
  if (state === 'dead' && pModel && pModel.userData.hd) pModel.userData.hd.update(dt, { dir: new V3(-Math.sin(yaw), 0, -Math.cos(yaw)) });
  else { time += dt * 0.3; if (state === 'menu') vm.visible = false; if (state === 'menu') { if (world === 4) { camera.position.set(BX + Math.sin(time * 0.2) * 30, 15, 36 + Math.cos(time * 0.2) * 6); camera.lookAt(BX, 5, 2); } else if (world === 3) { camera.position.set(TX + Math.sin(time * 0.2) * 28, 12, 24 + Math.cos(time * 0.2) * 6); camera.lookAt(TX, 4, -14); } else if (world === 2) { camera.position.set(OX + Math.sin(time * 0.2) * 26, 11, 24 + Math.cos(time * 0.2) * 5); camera.lookAt(OX - 4, 3, 0); } else { camera.position.set(Math.sin(time * 0.2) * 30, 14, 20 + Math.cos(time * 0.2) * 6); camera.lookAt(0, 2, -8); } } }
  updateSky(sky, camera, dt); renderer.render(scene, camera);
  if (vm.visible && state === 'play') { vmRoot.position.copy(camera.position); vmRoot.quaternion.copy(camera.quaternion); const ac = renderer.autoClear; renderer.autoClear = false; renderer.clearDepth(); renderer.render(vmScene, camera); renderer.autoClear = ac; }
}
function update(dt) {
  /* ondate */
  if (toSpawn > 0) { spawnT -= dt; if (spawnT <= 0 && alive < WAVES.maxAlive(wave) + (world === 4 && inSard(P.pos) ? 4 : 0)) { spawnEnemy(); toSpawn--; spawnT = WAVES.spawnEvery(wave); } }
  else if (alive <= 0) {
    if (breakT <= 0) { breakT = WAVES.break; if (wave > 0) { const b = ECONOMY.waveClear * Math.min(wave, 10); coins += b; banner('Ondata ' + wave + ' superata', '+' + b + ' monete · prossima ondata tra poco'); } }
    breakT -= dt; if (breakT <= 0) startWave();
  }
  /* poteri */
  if (P.pwCd > 0) P.pwCd = Math.max(0, P.pwCd - dt);
  if (P.pwT > 0) { P.pwT -= dt; if (P.pwT <= 0) { P.pwT = 0; shieldMesh.visible = false; } }
  /* movimento */
  const fwd = new V3(-Math.sin(yaw), 0, -Math.cos(yaw)), right = new V3(Math.cos(yaw), 0, -Math.sin(yaw));
  if (keys.ArrowLeft) yaw += dt * 2.2; if (keys.ArrowRight) yaw -= dt * 2.2;
  const mv = new V3(); if (keys.KeyW) mv.add(fwd); if (keys.KeyS) mv.sub(fwd); if (keys.KeyD) mv.add(right); if (keys.KeyA) mv.sub(right);
  let padSprint = false;
  if (isTouch) { mv.addScaledVector(fwd, -touch.my).addScaledVector(right, touch.mx); if (touch.sprint) padSprint = true;
    const [lx, ly] = takeLook(); yaw -= lx * 0.0058; pitch = Math.max(-1.1, Math.min(0.9, pitch - ly * 0.0046)); }
  if (pad.connected) {
    mv.addScaledVector(fwd, -pad.ly).addScaledVector(right, pad.lx);
    yaw -= pad.rx * 2.6 * dt; pitch = Math.max(-1.1, Math.min(0.9, pitch - pad.ry * 1.9 * dt));
    if (pad.pressed[11]) setFP(!fp);
    if (pad.pressed[BTN.L3]) sprintToggle = !sprintToggle; if (Math.hypot(pad.lx, pad.ly) < 0.2) sprintToggle = false; padSprint = sprintToggle;
    if (pad.pressed[BTN.UP]) usePack(); if (pad.pressed[8] || pad.pressed[16] || pad.pressed[17]) { openInv(); return; }
    if (pad.pressed[BTN.SQUARE]) startReload(); if (pad.pressed[BTN.CIRCLE]) useInter(); if (pad.pressed[BTN.L1] || pad.pressed[BTN.R1]) usePower();
    if (pad.pressed[BTN.TRIANGLE] && P.weapons.length > 1) switchWeapon(1 - P.cur);
    if (pad.pressed[BTN.X] && onGround()) P.vy = 6.9; if (pad.pressed[BTN.OPTIONS]) { pauseGame(); return; }
    if (pad.pressed[BTN.R2] && fireT <= 0) shoot();
  }
  const moving = mv.lengthSq() > 0.0001; const wantRun = (keys.ShiftLeft || keys.ShiftRight || padSprint) && moving;
  if (P.tired && P.stam >= STAMINA.min) P.tired = false;
  const running = wantRun && !P.tired && P.stam > 0;
  if (running) { P.stam = Math.max(0, P.stam - STAMINA.drain * dt); if (P.stam <= 0) { P.tired = true; feed('Sei senza fiato!'); } } else P.stam = Math.min(1, P.stam + STAMINA.regen * dt * (moving ? 0.7 : 1));
  let spd = running ? 7.2 : 4.8; if (P.pwT > 0 && P.pw.k === 'speed') spd *= 1.9;
  if (moving) { if (mv.lengthSq() > 1) mv.normalize(); mv.multiplyScalar(spd * dt); P.pos.add(mv); P.walk += dt * spd * 1.9; }
  collide(P.pos, 0.4, false, P.pos.y); const gY = groundY(P.pos);
  P.vy -= 18 * dt; P.pos.y = Math.max(gY, P.pos.y + P.vy * dt); if (P.pos.y <= gY + 0.0001) { P.pos.y = gY; if (P.vy < 0) P.vy = 0; }
  pModel.position.copy(P.pos); pModel.rotation.y = yaw + Math.PI; animLimbs(pModel, P.walk, moving ? 0.6 : 0);
  const PP = pModel.userData.P;
  PP.armR.rotation.x += (-1.45 - pitch * 0.9 + (moving ? Math.sin(P.walk * 2) * 0.05 : 0) - PP.armR.rotation.x) * Math.min(1, dt * 14); PP.armR.rotation.z = 0.05;
  if (P.weapons[P.cur].id === 'fucile') { PP.armL.rotation.x = -1.3 - pitch * 0.9; PP.armL.rotation.z = -0.55; } else PP.armL.rotation.z = 0;
  PP.torso.scale.y = 1 + Math.sin(time * 2.2) * 0.01;
  shieldMesh.position.set(P.pos.x, P.pos.y + 1, P.pos.z);
  /* camera in terza persona */
  const d = new V3(-Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch), -Math.cos(yaw) * Math.cos(pitch));
  if (pModel.userData.hd) { const hd = pModel.userData.hd, mn = moving ? mv.clone().normalize() : mv;
    P.moving = moving; hd.update(dt, { moving, running, speed: spd, f: mn.dot(fwd), side: mn.dot(right), air: P.pos.y > gY + 0.08, reloadT: P.reloadT, shooting: time - (P.shotT || -9) < 0.6, pitch, dir: d, fast: P.pwT > 0 && P.pw.k === 'speed' }); }
  const head = P.pos.clone(); head.y += pModel.userData.hd ? 1.78 : pModel.userData.height * 0.92;
  const cam = head.clone().sub(d.clone().multiplyScalar(3.4)).add(right.clone().multiplyScalar(0.85)); cam.y = Math.max(0.4, cam.y + 0.15);
  if (world === 4) { const A = inMac(P.pos) ? MACIN : inChiesa(P.pos) ? CHIESA : inCata(P.pos) ? CATA : null;
    if (A) { cam.x = Math.max(A.x1 + 0.4, Math.min(A.x2 - 0.4, cam.x)); cam.z = Math.max(A.z1 + 0.4, Math.min(A.z2 - 0.4, cam.z)); cam.y = Math.min(A.ceil - 0.3, cam.y); }
    else { const Bb = inSard(P.pos) ? SARD : BUB; cam.x = Math.max(Bb.x1 + 0.6, Math.min(Bb.x2 - 0.6, cam.x)); cam.z = Math.max(Bb.z1 + 0.6, Math.min(Bb.z2 - 0.6, cam.z));
      for (const L of BU_LOW) if (P.pos.x > L.x1 && P.pos.x < L.x2 && P.pos.z > L.z1 && P.pos.z < L.z2) cam.y = Math.min(L.ceil - 0.3, cam.y); } }
  else if (world === 3) { const A = inCasa(P.pos) ? CASA : inGarage(P.pos) ? GARAGE : null;
    if (A) { cam.x = Math.max(A.x1 + 0.4, Math.min(A.x2 - 0.4, cam.x)); cam.z = Math.max(A.z1 + 0.4, Math.min(A.z2 - 0.4, cam.z)); cam.y = Math.min(A.ceil - 0.3, cam.y); }
    else { cam.x = Math.max(TRB.x1 + 0.6, Math.min(TRB.x2 - 0.6, cam.x)); cam.z = Math.max(-29.4, Math.min(TRB.z2 - 0.6, cam.z));
      if (cam.z > 6.4 && P.pos.z > 6) cam.y = Math.min(3.9, cam.y); else if (cam.z < -19.8 && cam.x < TX + 4.5) cam.y = Math.min(4.15, cam.y); } }
  else if (world === 2) { if (inHSStore(P.pos)) { cam.x = Math.max(HSTORE.x1 + 0.4, Math.min(HSTORE.x2 - 0.4, cam.x)); cam.z = Math.max(HSTORE.z1 + 0.4, Math.min(HSTORE.z2 - 0.3, cam.z)); cam.y = Math.min(HSTORE.ceil - 0.4, cam.y); } else { cam.x = Math.max(HSB.x1 + 0.6, Math.min(HSB.x2 - 0.6, cam.x)); cam.z = Math.max(0.7, Math.min(HSB.z2 - 0.6, cam.z)); } }
  else if (inBasement(P.pos)) { cam.x = Math.max(BASE.x1 + 0.4, Math.min(BASE.x2 - 0.4, cam.x)); cam.z = Math.max(BASE.z1 + 0.4, Math.min(BASE.z2 - 0.4, cam.z)); cam.y = Math.min(BASE.ceil - 0.3, cam.y); }
  else if (inWare(P.pos)) { cam.x = Math.max(WARE.x1 + 0.4, Math.min(WARE.x2 - 0.4, cam.x)); cam.z = Math.max(WARE.z1 + 0.4, cam.z); cam.y = Math.min(WARE.ceil - 0.4, cam.y); }
  else if (inStore(P.pos)) { cam.x = Math.max(STORE.x1 + 0.4, Math.min(STORE.x2 - 0.4, cam.x)); cam.z = Math.max(STORE.z1 + 0.4, Math.min(STORE.z2 - 0.3, cam.z)); cam.y = Math.min(STORE.ceil - 0.4, cam.y); }
  else { cam.x = Math.max(-39.5, Math.min(39.5, cam.x)); cam.z = Math.max(-13.6, Math.min(29.5, cam.z)); }
  if (fp) { cam.copy(P.pos); cam.y += pModel.userData.height * 0.9; }
  pModel.visible = !fp; vm.visible = fp;
  if (fp) { vmKick = Math.max(0, vmKick - dt * 6); const bob = moving ? Math.sin(P.walk * 2) * 0.012 : 0; vm.position.set(0.16, -0.15 + bob, -0.36 + vmKick * 0.08); vm.scale.setScalar(0.62); vm.rotation.set(vmKick * 0.25 + (P.reloadT > 0 ? -0.6 : 0), 0, 0); }
  camera.position.copy(cam); camera.lookAt(cam.clone().add(d)); updateFx(dt, camera, P.pos, world === 4 ? inCata(P.pos) : inBasement(P.pos));
  /* sparo */
  fireT -= dt; const w = P.weapons[P.cur]; if ((mouseDown || pad.fire || touch.fire) && w.auto && fireT <= 0) shoot();
  if (P.reloadT > 0) { P.reloadT -= dt; if (P.reloadT <= 0) { const n = Math.min(w.mag - w.ammo, w.res); w.ammo += n; w.res -= n; P.reloadT = 0; } }
  else if (w.ammo === 0 && w.res > 0 && !infAmmo()) startReload();
  /* nemici */
  const slow0 = P.pwT > 0 && P.pw.k === 'freeze' ? 0.15 : 1;
  for (const e of enemies) {
    const m = e.m, EP = m.userData.P;
    if (e.frozen > 0) e.frozen -= dt; if (e.slowT > 0) e.slowT -= dt;
    const slow = slow0 * (e.frozen > 0 ? 0 : 1) * (e.slowT > 0 ? 0.35 : 1);
    if (e.ice) e.ice.visible = e.frozen > 0;
    if (!e.dead && e.capo && updCapo(e, dt * slow)) continue;
    if (e.dead) { e.deadT += dt; m.rotation.x = Math.min(1.5, e.deadT * 4); m.position.y = -Math.max(0, e.deadT - 1.2) * 0.8; if (e.deadT > 2.6) { scene.remove(m); e.gone = 1; } continue; }
    if (e.ally > 0) { updAlly(e, dt); continue; }
    e.kick = Math.max(0, e.kick - dt); EP.torso.rotation.x = -e.kick * 1.4;
    EP.bells.forEach((b, k) => { b.rotation.x = Math.sin(time * 6 + k + e.walk) * 0.3; });
    let goal = P.pos; const er = region(m.position), pr = region(P.pos);
    if (e.flee) goal = new V3(LIFT.x, 0, LIFT.z);
    else if (world === 3) { if (er !== pr && er !== 'trcasa' && pr !== 'trcasa') { const a = TR_ORDER[er], b = TR_ORDER[pr], D = (a < b ? a : a - 1) === 0 ? TR_GATE : TR_GDOOR;
      const ds = Math.sign(m.position.z - D.z) || 1, gx = Math.max(D.x - D.w / 2 + 1, Math.min(D.x + D.w / 2 - 1, m.position.x)), aligned = Math.abs(m.position.x - D.x) < D.w / 2 - 0.7 && Math.abs(m.position.z - D.z) < 2.6;
      goal = new V3(gx, 0, aligned ? D.z - ds * 2.4 : D.z + ds * 2.2); } }
    else if (world === 4) { const iM = er === 'bmacin', pM = pr === 'bmacin', iC = er === 'bchiesa', pC = pr === 'bchiesa';
      if (iM !== pM) { const D = BU_DOORS.mac, ds = iM ? 1 : -1, gz = Math.max(D.z - 1.2, Math.min(D.z + 1.2, m.position.z)), al = Math.abs(m.position.z - D.z) < 1.4 && Math.abs(m.position.x - D.x) < 2.6; goal = new V3(al ? D.x - ds * 2.4 : D.x + ds * 2.2, 0, gz); }
      else if (iC !== pC) { const D = BU_DOORS.chiesa, ds = iC ? -1 : 1, gx = Math.max(D.x - 2, Math.min(D.x + 2, m.position.x)), al = Math.abs(m.position.x - D.x) < 2.3 && Math.abs(m.position.z - D.z) < 2.6; goal = new V3(gx, 0, al ? D.z - ds * 2.4 : D.z + ds * 2.2); } }
    else if (world === 2) { if (er !== pr) { /* prima davanti alla porta dalla propria parte, poi dall'altra */ const ds = er === 'hsout' ? 1 : -1, gx = Math.max(HS_DOOR.x - 1.6, Math.min(HS_DOOR.x + 1.6, m.position.x)), aligned = Math.abs(m.position.x - HS_DOOR.x) < HS_DOOR.w / 2 - 0.7 && Math.abs(m.position.z) < 2.6; goal = new V3(gx, 0, aligned ? -ds * 2.4 : ds * 2.2); } }
    else if (pr !== 'base' && er !== pr) {
      const viaShop = er === 'out' || (er === 'store' && pr === 'out');
      if (viaShop) goal = new V3(Math.max(DOOR.x - 2.6, Math.min(DOOR.x + 2.6, m.position.x)), 0, er === 'out' ? DOOR.z - 1.4 : DOOR.z + 1.4);
      else goal = new V3(Math.max(36.3, Math.min(38.7, m.position.x)), 0, er === 'ware' ? WAREHOUSE_DOOR.z + 1.4 : WAREHOUSE_DOOR.z - 1.4);
    }
    const to = goal.clone().sub(m.position); to.y = 0; const dist = goal === P.pos ? to.length() : 99; m.rotation.y = Math.atan2(to.x, to.z);
    if (dist > 1.15 * m.scale.x + (P.pos.y > 0.25 ? 1.75 : 0)) {
      to.normalize();
      if (e.side) { const s = new V3(to.z, 0, -to.x).multiplyScalar(e.side); to.add(s).normalize(); e.sideT -= dt; if (e.sideT <= 0) e.side = 0; }
      const before = m.position.clone(); m.position.add(to.multiplyScalar(e.spd * dt * slow * (e.kick > 0 ? 0.3 : 1)));
      for (const o of enemies) { if (o === e || o.dead) continue; const dd = m.position.clone().sub(o.m.position); dd.y = 0; const l = dd.length(); if (l < 0.85 && l > 0) m.position.add(dd.multiplyScalar((0.85 - l) / l * 0.5)); }
      collide(m.position, e.r, 1); const moved = m.position.distanceTo(before);
      if (moved < e.spd * dt * slow * 0.3) { e.stuck += dt; if (e.stuck > 0.4) { e.side = Math.random() < 0.5 ? 1 : -1; e.sideT = 1.2; e.stuck = 0; } } else e.stuck = 0;
      e.walk += dt * e.spd * 2.2; animLimbs(m, e.walk, 0.55); EP.armR.rotation.x = -Math.sin(e.walk) * 0.45;
    } else {
      e.atk -= dt * slow; EP.armR.rotation.x = -1.4 + Math.sin(time * 12) * 0.4; EP.armL.rotation.x = -1.4 - Math.sin(time * 12) * 0.4;
      if (e.atk <= 0) { e.atk = e.atkCd; hit(e.dmg); }
    }
  }
  enemies = enemies.filter(e => !e.gone);
  /* oggetti ed effetti */
  for (const dr of drops) { dr.t -= dt; dr.m.rotation.y += dt * 2; dr.m.position.y = 0.6 + Math.sin(time * 4) * 0.1; if (dr.m.position.distanceTo(new V3(P.pos.x, 0.5, P.pos.z)) < 1.3) { pickup(dr); dr.t = 0; } if (dr.t <= 0) scene.remove(dr.m); }
  drops = drops.filter(dr => dr.t > 0);
  tracers.forEach(x => { x.t -= dt; if (x.t <= 0) { scene.remove(x.l); x.l.geometry.dispose(); } }); tracers = tracers.filter(x => x.t > 0);
  sparks.forEach(x => { x.t -= dt; x.m.scale.setScalar(1 + (0.18 - x.t) * 6); if (x.t <= 0) scene.remove(x.m); }); sparks = sparks.filter(x => x.t > 0);
  updMirko(dt); updAlbanesi(dt); updRescues(dt); updBats(dt); updCigs(dt); updHostile(dt); updBox(dt); updBottle(dt); updNades(dt);
  for (const r of rings) { r.t += dt; const k = 1 + r.t * 26; r.m.scale.set(k, k, 1); r.m.material.opacity = Math.max(0, 0.85 - r.t * 2.6); if (r.t > 0.33) { scene.remove(r.m); r.m.geometry.dispose(); r.gone = 1; } }
  rings = rings.filter(r => !r.gone);
  if (world === 4) { updateBU(time, dt); updBU4(dt); }
  else if (world === 3) { updateTR(time); updTR(dt); }
  else if (world === 2) { updateHS(time);
    if (mode === 'sandbox') { if (!inHSStore(P.pos)) capoDead = false; if (!boss && !capoDead && inHSStore(P.pos)) spawnBoss('capo'); }
    else if (!boss && !capoDead && zone >= 1 && wave >= BOSS_CAPO.wave) spawnBoss('capo');
  } else { updateStore(time); updateBasement(time, power); updateWare(time);
  if (mode === 'sandbox') {
    if (!inBasement(P.pos)) fabDead = false; if (!inOffice(P.pos)) lorisDead = false;
    if (!boss && !fabDead && inBasement(P.pos)) spawnBoss('fab');
    if (!boss && !lorisDead && inOffice(P.pos)) spawnBoss('loris');
  } else {
    if (!boss && !fabDead && zone >= 3 && wave >= BOSS_FAB.wave && inBasement(P.pos)) spawnBoss('fab');
    if (!boss && !lorisDead && zone >= 5 && wave >= BOSS_LORIS.wave && !inBasement(P.pos)) spawnBoss('loris');
  } }
  /* vita che si ricarica dopo qualche secondo senza colpi */
  sinceHit += dt; if (sinceHit > REGEN.delay && P.hp < 100) P.hp = Math.min(100, P.hp + REGEN.perSec * dt);
  if (boss && !boss.dead && !boss.flee) { boss.summon -= dt; if (boss.summon <= 0) { const K = BOSSK[boss.kind]; boss.summon = K.B.summonEvery;
      const list = boss.kind === 'pika' && boss.phase === 2 ? ['impossessato', 'orcone'] : boss.kind === 'fab' && world === 3 ? ['ratto', 'ratto', 'fachiro', 'impossessato'] : K.minions; list.forEach(t => spawnEnemy(t, [boss.m.position.x + (Math.random() - 0.5) * 3, boss.m.position.z + (Math.random() - 0.5) * 3])); feed(K.call); }
    const tw = boss.twinRef && !boss.twinRef.dead ? boss.twinRef : null; $('bossb').style.width = Math.max(0, (boss.hp + (tw ? tw.hp : 0)) / (boss.max + (tw ? tw.max : 0)) * 100) + '%'; }
  nearI = null; for (const i of INTER) { if (Math.hypot(P.pos.x - i.x, P.pos.z - i.z) < i.r && i.label()) { nearI = i; break; } }
  if (bannerT > 0) { bannerT -= dt; if (bannerT <= 0) $('banner').hidden = true; }
  P.hurtT = Math.max(0, P.hurtT - dt); $('dmg').style.boxShadow = `inset 0 0 120px 30px rgba(220,30,30,${Math.min(0.65, P.hurtT * 1.4)})`;
  hud();
}
/* il Capo: ogni tanto si ferma, si carica (diventa rosso) e corre dritto verso dove eri. Se ti prende fa malissimo */
const capoRed = new THREE.MeshBasicMaterial({ color: '#ff3a2a', transparent: true, opacity: 0.35 });
function updCapo(e, dt) {
  const m = e.m, C = BOSS_CAPO.charge;
  if (!e.ch) {
    e.chCd -= dt; const to = P.pos.clone().sub(m.position); to.y = 0; const d = to.length();
    if (e.chCd <= 0 && d > 3.5 && d < 26 && region(m.position) === region(P.pos)) {
      e.ch = { ph: 'wind', t: C.wind, dir: to.normalize(), hit: 0 }; m.rotation.y = Math.atan2(e.ch.dir.x, e.ch.dir.z);
      if (!e.glow) { e.glow = new THREE.Mesh(new THREE.SphereGeometry(1.4, 14, 10), capoRed); e.glow.position.y = 1.5; e.glow.scale.set(1, 1.6, 1); m.add(e.glow); }
      e.glow.visible = true; tone(90, 0.6, 'sawtooth', 0.07, 50); feed('Il Capo sta per caricare!'); return true;
    }
    return false;
  }
  const ch = e.ch, EP = m.userData.P; ch.t -= dt;
  if (ch.ph === 'wind') {
    EP.torso.rotation.x = 0.45; EP.armL.rotation.x = EP.armR.rotation.x = 0.6; m.position.x += (Math.random() - 0.5) * 0.04;
    if (ch.t <= 0) { ch.ph = 'run'; ch.t = C.dur; shake(0.2); }
    return true;
  }
  const before = m.position.clone(); m.position.addScaledVector(ch.dir, e.spd * C.mult * dt); collide(m.position, e.r, 1);
  e.walk += dt * 22; animLimbs(m, e.walk, 0.9); EP.torso.rotation.x = 0.35;
  if (!ch.hit && m.position.distanceTo(P.pos) < 1.9) { ch.hit = 1; hit(C.dmg * ZONES[diffZone()].dmg); shake(0.35); P.pos.addScaledVector(ch.dir, 2.5); collide(P.pos, 0.4); }
  for (const o of enemies) if (o !== e && !o.dead && !o.boss && o.m.position.distanceTo(m.position) < 1.6) { o.m.position.addScaledVector(ch.dir, 0.4); }
  if (ch.t <= 0 || m.position.distanceTo(before) < e.spd * C.mult * dt * 0.25) {
    if (ch.t > 0) { e.kick = 0.6; shake(0.25); tone(60, 0.3, 'square', 0.08, 30); feed('Il Capo sbatte contro il muro!'); }
    e.ch = null; e.chCd = C.every * (0.8 + Math.random() * 0.4); e.glow.visible = false; EP.torso.rotation.x = 0;
  }
  return true;
}
function hit(dmg) {
  if (mode === 'sandbox' && god) { tone(1200, 0.04, 'square', 0.02); return; }
  if (P.pwT > 0 && P.pw.k === 'shield') { tone(1200, 0.05, 'square', 0.03); return; }
  if (P.ar > 0) { const a = Math.min(P.ar, dmg * 0.7); P.ar -= a; dmg -= a; }
  P.hp -= dmg; P.hurtT = 0.5; sinceHit = 0; hurt(); if (pModel.userData.hd) pModel.userData.hd.hurt(); shake(0.15); if (P.hp <= 0) { P.hp = 0; gameOver(); }
}
function startWave() { wave++; toSpawn = WAVES.count(wave); spawnT = 0.5; banner('Ondata ' + wave, wave === 1 ? 'Arrivano i Mammutones' : ''); }

/* ===================== STATI ===================== */
function resetWorld() {
  enemies.forEach(e => scene.remove(e.m)); drops.forEach(d => scene.remove(d.m)); enemies = []; drops = [];
  alive = 0; toSpawn = 0; wave = 0; kills = 0; coins = ECONOMY.start; breakT = 3;
  if (mirko) { scene.remove(mirko.m); mirko = null; } albanesi.forEach(a => scene.remove(a.m)); albanesi = []; rescues.forEach(r => scene.remove(r.m)); rescues = []; bats.forEach(b => scene.remove(b.m)); bats = []; cigs.forEach(c => scene.remove(c.m)); cigs = [];
  if (boss) { scene.remove(boss.m); } boss = null; fabDead = false; lorisDead = false; power = false; packs = 0; bag = 0; panelLed.material.color.set('#ff3030'); $('boss').hidden = true;
  GENERATORS.forEach(g => { g.on = false; g.led.material.color.set('#ff3030'); });
  if (world === 1) { if (zone >= 4) { scene.add(wareDoor); wareDoorSolid.off = 0; } if (zone >= 5) { scene.add(officeDoor); officeDoorSolid.off = 0; }
    if (zone >= 1) { scene.add(gzBar); gzSolids.forEach(s => (s.off = 0)); } if (zone >= 2) { scene.add(storeDoor); doorSolid.off = 0; } }
  if (hsDoorSolid.off) { scene.add(hsDoor); hsDoorSolid.off = 0; }
  capoDead = false; rings.forEach(r => scene.remove(r.m)); rings = [];
  if (trGateSolid.off) { G3add(trGate); trGateSolid.off = 0; } if (trGDoorSolid.off) { G3add(trGDoor); trGDoorSolid.off = 0; } liftLed.material.color.set('#ff3030');
  CAGES.forEach(c => { c.freed = false; c.bars.visible = true; c.who.visible = true; c.solid.off = 0; });
  wellDead = fabioDead = pikaFled = pikaDead = lorisScene = hasKey = trPower = false; if (trKey) { scene.remove(trKey); trKey = null; } trPanelLed.material.color.set('#ff3030'); casaT = 0; hostile.forEach(h => scene.remove(h.m)); hostile = []; buff = null; if (bottle) { scene.remove(bottle.m); bottle = null; } bottleT = 35;
  zone = 0; shieldMesh.visible = false; resetBU();
}
function fullscreen() { const d = document.documentElement; if (!document.fullscreenElement && d.requestFullscreen) d.requestFullscreen().catch(() => {}); }
addEventListener('keydown', e => { if (e.code === 'KeyF') { if (document.fullscreenElement) document.exitFullscreen().catch(() => {}); else fullscreen(); } });
let seenHS = false, seenTR = false;
function startGame(i) {
  if (pickWorld === 3 && mode === 'adv' && !seenTR) { seenTR = true; $('sel').hidden = true; showTale('trIntro1', 'Avanti', () => showTale('trIntro2', 'Scendi dalla macchina', () => startGame(i))); return; }
  if (pickWorld === 4 && mode === 'adv' && !seenBU) { seenBU = true; $('sel').hidden = true; showTale('buIntro', 'Scendi in piazza Garibaldi', () => startGame(i)); return; }
  if (pickWorld === 2 && mode === 'adv' && !seenHS) { seenHS = true; $('sel').hidden = true; showTale('hsIntro', 'Entra nel parcheggio', () => startGame(i)); return; }
  fullscreen();
  charIdx = i; resetWorld(); world = pickWorld; applyLook(world); newPlayer(i);
  if (world === 2) { P.pos.set(HS_START.x, 0, HS_START.z); yaw = HS_START.yaw; coins = HS_START_COINS; }
  if (world === 3) { P.pos.set(TR_START.x, 0, TR_START.z); yaw = TR_START.yaw; coins = TR_START_COINS; }
  if (world === 4) { P.pos.set(BU_START.x, 0, BU_START.z); yaw = BU_START.yaw; coins = BU_START_COINS; } state = 'play'; ['sel', 'dead', 'pause', 'tale'].forEach(id => ($(id).hidden = true)); $('hud').hidden = false;
  $('pname').textContent = ROSTER[i].name; $('pwn').textContent = P.pw.n;
  const wc = $('who'); const sp = SPR[ROSTER[i].sprite]; const g = wc.getContext('2d'); g.clearRect(0, 0, 17, 16);
  for (let y = 0; y < 16; y++) for (let x = 0; x < 17; x++) { const c = sp.g[sp.top - 3 + y] && sp.g[sp.top - 3 + y][14 + x]; if (c && !String(c).startsWith('rgba')) { g.fillStyle = c; g.fillRect(x, y, 1, 1); } }
  sinceHit = 99;
  if (world === 4) {
    if (mode === 'sandbox') { openAllBU(); coins = SANDBOX.coins; lock(); banner('Sandbox · Centro di Busto', 'Tutto aperto: ogni zona ha il suo boss, il sigillo della chiesa porta alle catacombe'); audio(); return; }
    lock(); banner('Il centro di Busto', 'Pierre ti aspetta alla fontana al round ' + BOSS_PIERRE4.wave); audio(); return;
  }
  if (world === 3) {
    if (mode === 'sandbox') { openTR(); coins = SANDBOX.coins; lock(); banner('Sandbox · Tribunale', 'Ogni zona ha il suo boss: entra e sfidalo'); audio(); return; }
    lock(); banner('Il Tribunale di Busto', 'Fab La Rue blocca la strada: arriva al round ' + TR_FAB_WAVE); audio(); return;
  }
  if (world === 2) {
    if (mode === 'sandbox') { quiet = true; openHS(); quiet = false; coins = SANDBOX.coins; lock(); banner('Sandbox · Happy Shopping', 'Tutto aperto: entra nel negozio per sfidare il Capo'); audio(); return; }
    lock(); banner('Happy Shopping', 'Tefalin e Diego sono qui · difendi il parcheggio, poi apri il negozio'); audio(); return;
  }
  if (mode === 'sandbox') {
    quiet = true; for (let z = 1; z <= 5; z++) openZone(z); quiet = false; coins = SANDBOX.coins; power = true; panelLed.material.color.set('#3aff6a');
    GENERATORS.forEach(g => { g.on = true; g.led.material.color.set('#3aff6a'); });
    lock(); banner('Sandbox', 'Tutto aperto: entra nella tana di Fab o nell\'ufficio di Loris per sfidarli'); audio(); return;
  }
  lock(); banner('Sopravvivi al parcheggio', 'Al muro del Tigros trovi le munizioni della pistola'); audio();
}
function pauseGame() { if (state !== 'play') return; state = 'pause'; $('pause').hidden = false; mouseDown = false; }
function resume() { state = 'play'; $('pause').hidden = true; last = performance.now(); lock(); }
function gameOver(title, msg) {
  if (pModel && pModel.userData.hd) { pModel.userData.hd.die(); pModel.userData.hd.update(0.001, { dir: new V3(0, 0, -1) }); }
  state = 'dead'; try { document.exitPointerLock(); } catch (_) {}
  $('hud').hidden = true; $('dead').hidden = false; $('deadtitle').innerHTML = title || 'Ti hanno <span>preso</span>';
  $('deadmsg').textContent = msg ? msg : world === 4 ? `${ROSTER[charIdx].name} è caduto nel centro di Busto (${ZONES[diffZone()].n}). Loris ride dal campanile.` : world === 3 ? `${ROSTER[charIdx].name} è caduto al Tribunale (${ZONES[diffZone()].n}). Pika ride dal balcone.` : world === 2 ? `${ROSTER[charIdx].name} è caduto all'Happy Shopping (${ZONES[zoneIdx()].n}). Il Capo ride dietro le casse.` : `${ROSTER[charIdx].name} è caduto al Tigros (${ZONES[zone].n}). Loris Busato ride da qualche parte nel magazzino.`;
  $('deadstats').innerHTML = `<div>${wave}<small>Ondata raggiunta</small></div><div>${kills}<small>Mammutones abbattuti</small></div>`;
}
function victory() {
  if (state !== 'play') return; state = 'dead'; try { document.exitPointerLock(); } catch (_) {}
  $('hud').hidden = true; showEnding(true);
}
/* finale: complimenti, i boss scappano, poi la mappa del mondo */
function showEnding(real, wf) {
  if (!real) { const ww = wf || pickWorld; if (state !== 'play' && world !== ww) { world = ww; applyLook(ww); } }
  $('endNext').hidden = !(real && world < 3 && mode === 'adv'); $('endNext').firstChild.textContent = world === 2 ? 'Vai al Tribunale' : 'Vai all\'Happy Shopping'; $('endNext').lastChild.textContent = world === 2 ? 'in macchina con Libe il matto' : 'ricomincia dal mondo 2';
  $('endCont').hidden = !real; $('endCont').firstChild.textContent = world === 4 ? 'Resta in Sardegna' : world === 3 ? 'Resta al Tribunale' : world === 2 ? 'Resta all\'Happy Shopping' : 'Resta al Tigros';
  ['sel', 'dead', 'pause', 'world', 'tale'].forEach(id => ($(id).hidden = true));
  $('endstats').innerHTML = real ? `<div>${wave}<small>Ondate</small></div><div>${kills}<small>Mammutones abbattuti</small></div><div>${coins}<small>Monete rimaste</small></div>` : '';
  const who = real ? ROSTER[charIdx].name + ' e il gruppo' : 'Il gruppo';
  const ww = real ? world : wf || pickWorld, w2 = ww === 2;
  $('endkick').textContent = 'Mappa ' + ww + ' completata';
  $('endtitle').innerHTML = ww === 4 ? 'Busto è <span>salva</span>!' : ww === 3 ? 'Pika è <span>libero</span>!' : w2 ? 'Bravo, hai sconfitto <span>il Capo</span>!' : 'Complimenti, hai liberato <span>il Tigros</span>!';
  $('endtext').innerHTML = ww === 4
    ? `<p><b>${who}</b> ha liberato il centro di Busto. Pierre è sconfitto per sempre, i cugini Progni sono a terra e Corti è tornato quello di sempre (anche se continua a chiedere della sua GT).</p>
       <p>Ai bar avete liberato <b>Napo</b> e <b>Ali Debbah</b>. Con le due metà del talismano avete aperto le catacombe sotto San Giovanni e il portale vi ha portati in <b>Sardegna</b>, il regno dei Mammutones.</p>
       <p>Lì, tra i nuraghi e le pecore, <b>Loris Busato</b> si è trasformato nel Re dei Mammutones. L'avete battuto. Dalla consolle è saltato fuori <b>DJ Gianfra</b>: stasera si festeggia in piazza Garibaldi. Busto Arsizio è di nuovo vostra. Fine del primo capitolo.</p>`
    : ww === 3
    ? `<p><b>${who}</b> ha liberato il Tribunale. Fab La Rue è sconfitto per sempre, Pierre è scappato con quello che resta dei suoi sgherri e Fabio Regaglia è tornato in sé.</p>
       <p>Nel garage avete liberato <b>Leodessi</b>, <b>Castelluccio</b> e <b>Bulegato</b>. E sopra, a casa sua, il maleficio di Loris si è spezzato: <b>Pika</b> è di nuovo lui, e chiede scusa a tutti con un pacchetto di sigarette in mano.</p>
       <p>Ma Loris Busato è scappato dalla finestra. Il gruppo adesso è al completo, e c'è un'ultima tappa: il <b>centro di Busto</b>.</p>`
    : w2
    ? `<p><b>${who}</b> ha messo al tappeto il Capo in mezzo ai jeans piegati. Dietro le casse c'era <b>Debe</b>, costretto a lavorare lì giorno e notte: adesso è libero e si unisce al gruppo insieme a <b>Tefalin</b> e <b>Diego</b>.</p>
       <p>Nel cassetto della cassa principale, sotto una pila di scontrini, c'era una lettera:</p>
       <div class="letter">«Gli altri vostri amici non sono spariti. Sono tenuti in segreto nel <b>garage di Pika</b>, al <b>Tribunale</b>. Se volete liberare Busto Arsizio, dovete andare a prendere anche loro.»</div>
       <p>Adesso raduna tutti gli amici e preparatevi: si va al <b>Tribunale</b>. Damiano ha già acceso la Mercedes.</p>`
    : `<p><b>${who}</b> ha ripreso il supermercato: la corrente è tornata, i generatori ronzano e stasera i tavolini del Buongusto sono di nuovo vostri.</p>
       <p>Ma quando il fumo si è diradato, nell'ufficio della zona controllo non c'era nessuno. La maschera nera di <b>Loris Busato</b> era a terra, spaccata a metà. Dal tombino del seminterrato si sentiva solo uno squittio che si allontanava: <b>Fab La Rue</b> è scappato con i suoi ratti.</p>
       <p>Non sono stati sconfitti davvero: <b>torneranno</b>. Ma per ora il Tigros è vostro. Fuori, però, Busto Arsizio è ancora nel caos: prossima tappa l'<b>Happy Shopping</b>, dove vi aspettano Tefalin e Diego.</p>`;
  $('endunlock').hidden = !(real && lastUnlock); if (real && lastUnlock) $('endunlock').textContent = 'Hai sbloccato ' + lastUnlock.name + '!' + (world === 1 ? ' E da adesso puoi giocare anche con Tefalin e Diego.' : ''); lastUnlock = null;
  $('ending').hidden = false; menuIdx = 0;
}
function applyLook(w) { applyWorldLook(w); if (skyRef) setSky(skyRef, w); }
function showWorld() {
  $('ending').hidden = true; $('sel').hidden = true; $('world').hidden = false; menuIdx = 0;
  const open = hsOpen(), done = !!unlocks.hs;
  $('hsNode').setAttribute('class', 'node ' + (open ? 'free' : 'locked')); if (open) $('hsFog').removeAttribute('filter'); else $('hsFog').setAttribute('filter', 'url(#fog)');
  $('hsLbl').setAttribute('class', 'lbl' + (open ? '' : ' dim')); $('hsRect').setAttribute('stroke', open ? '#7ad0ff' : '#3a3f48'); $('hsQ').style.display = open ? 'none' : '';
  $('hsSub').textContent = done ? 'Liberato · Debe è libero' : open ? 'Disponibile · Tefalin e Diego ti aspettano' : 'Bloccato · finisci prima il Tigros';
  showPlace(place || pickWorld);
}
/* mappa: scegli un luogo e vedi le sue cose (intro, finale, gioca) */
let place = 0;
const PLACES = {
  1: { n: 'Tigros', open: () => true, state: () => unlocks.loris ? 'Liberato · Loris e Fab sono scappati' : 'Disponibile · Mondo 1',
       t: 'Il supermercato di Busto preso da Loris Busato e dai Mammutones. Sei zone: parcheggio, gazebo Buongusto, negozio, seminterrato con Fab La Rue, magazzino e l\'ufficio di Loris.' },
  2: { n: 'Happy Shopping', open: () => hsOpen() || mode === 'sandbox', state: () => unlocks.hs ? 'Liberato · Debe è libero' : hsOpen() ? 'Disponibile · Mondo 2' : mode === 'sandbox' ? 'Disponibile in Sandbox · in Avventura batti prima Loris' : 'Bloccato · in Avventura batti prima Loris',
       t: 'Il bazar di Sant\'Edoardo. Parcheggio e negozio, Tefalin e Diego da ritrovare, il Capo da sconfiggere per liberare Debe.' },
  3: { n: 'Tribunale di Busto', open: () => !!unlocks.hs || mode === 'sandbox', state: () => unlocks.tr ? 'Liberato · Pika è libero dal maleficio' : unlocks.hs ? 'Disponibile · Mondo 3' : mode === 'sandbox' ? 'Disponibile in Sandbox · in Avventura finisci prima l\'Happy Shopping' : 'Bloccato · finisci prima l\'Happy Shopping',
       t: 'Leodessi, Castelluccio e Bulegato sono prigionieri nel garage di Pika. Ci porta Libe il matto, con Damiano. Parcheggio con Fab La Rue, piazza dei tavolini con Pierre e Fabio Regaglia, i garage e la casa di Pika.' },
  4: { n: 'Il centro di Busto', open: () => !!unlocks.tr || mode === 'sandbox', state: () => unlocks.busto ? 'Liberato · Busto è salva' : unlocks.tr ? 'Disponibile · Mondo 4' : mode === 'sandbox' ? 'Disponibile in Sandbox · in Avventura finisci prima il Tribunale' : 'Bloccato · finisci prima il Tribunale',
       t: 'L\'ultima tappa del primo capitolo. Pierre alla fontana, Corti maledetto al Mac, i cugini Progni ai bar con Napo e Ali prigionieri, Loris in chiesa. Sotto la chiesa le catacombe, e il portale per la Sardegna, il regno dei Mammutones.' },
};
function showPlace(k) {
  place = k; const Q = PLACES[k];
  document.querySelectorAll('[data-place]').forEach(b => { const on = +b.dataset.place === k; b.setAttribute('aria-pressed', on ? 'true' : 'false'); });
  document.querySelectorAll('[data-node]').forEach(n => n.classList.toggle('sel', +n.dataset.node === k));
  $('plName').textContent = Q.n; $('plState').textContent = Q.state(); $('plState').classList.toggle('lock', !Q.open()); $('plText').textContent = Q.t;
  $('plPlay').hidden = !Q.open(); $('plIntro').hidden = k > 4; $('plEnd').hidden = k > 4;
}
document.querySelectorAll('[data-place]').forEach(b => b.addEventListener('click', () => showPlace(+b.dataset.place)));
document.querySelectorAll('[data-node]').forEach(n => n.addEventListener('click', () => showPlace(+n.dataset.node)));
const hsOpen = () => !!unlocks.loris || !!unlocks.hs;
function toMenu() { state = 'menu'; resetWorld(); world = pickWorld; applyLook(world); if (pModel) { scene.remove(pModel); pModel = null; } ['dead', 'pause', 'ending', 'world', 'tale'].forEach(id => ($(id).hidden = true)); $('hud').hidden = true; $('sel').hidden = false; }
$('buyPack').onclick = () => invBuy('pack'); $('usePack').onclick = () => invBuy('use'); $('buyBag').onclick = () => invBuy('bag'); $('closeInv').onclick = closeInv;
$('hdbtn').onclick = () => { setHD(!hdOn); hdLabel(); if (P) applyModel(charIdx); }; hdLabel();
$('resume').onclick = resume; $('quit').onclick = toMenu; $('again').onclick = () => startGame(charIdx); $('change').onclick = toMenu;

/* navigazione dei menu col controller: frecce o levetta per scegliere, X per confermare */
/* navigazione dei menu col controller: frecce o levetta per spostarsi (tenendo premuto scorre), X conferma, Cerchio indietro */
let lastVis = null, holdDir = '', holdT = 0, padEl = null;
function padMenus(dt) {
  const vis = ['story', 'tale', 'ending', 'world', 'sel', 'pause', 'dead', 'inv'].find(id => !$(id).hidden);
  if (!vis) { lastVis = null; if (padEl) { padEl.classList.remove('padfocus'); padEl = null; } return; }
  if (vis === 'inv' && (pad.pressed[BTN.CIRCLE] || pad.pressed[8] || pad.pressed[17])) { closeInv(); return; }
  if (pad.pressed[BTN.CIRCLE]) { if (vis === 'pause') { resume(); return; } if (vis === 'world') { $('worldBack').click(); return; } }
  if (vis === 'pause' && pad.pressed[BTN.OPTIONS]) { resume(); return; }
  const btns = [...$(vis).querySelectorAll('button')].filter(b => !b.hidden && b.offsetParent !== null); if (!btns.length) return;
  let cur = padEl ? btns.indexOf(padEl) : -1;
  if (vis !== lastVis) { lastVis = vis; cur = 0; }
  else if (cur < 0) cur = Math.min(menuIdx, btns.length - 1);
  /* direzione: frecce oppure levetta sinistra (conta l'asse piu' spinto) */
  let dx = pad.held[BTN.RIGHT] ? 1 : pad.held[BTN.LEFT] ? -1 : 0, dy = pad.held[BTN.DOWN] ? 1 : pad.held[BTN.UP] ? -1 : 0;
  if (!dx && !dy && Math.hypot(pad.lx, pad.ly) > 0.5) { if (Math.abs(pad.lx) > Math.abs(pad.ly)) dx = Math.sign(pad.lx); else dy = Math.sign(pad.ly); }
  const dir = dx + ',' + dy; let move = false;
  if (dir !== holdDir) { holdDir = dir; holdT = 0.38; move = !!(dx || dy); }
  else if (dx || dy) { holdT -= dt; if (holdT <= 0) { holdT = 0.13; move = true; } }
  if (move) {
    /* va al pulsante piu' vicino nella direzione scelta (funziona anche con le schede in griglia) */
    const r0 = btns[cur].getBoundingClientRect(), c0x = r0.left + r0.width / 2, c0y = r0.top + r0.height / 2;
    let best = -1, bs = Infinity;
    btns.forEach((b, k) => { if (k === cur) return; const r = b.getBoundingClientRect(), vx = r.left + r.width / 2 - c0x, vy = r.top + r.height / 2 - c0y;
      const along = dx ? vx * dx : vy * dy, across = dx ? Math.abs(vy) : Math.abs(vx); if (along <= 4) return;
      const sc = along + across * 2.2; if (sc < bs) { bs = sc; best = k; } });
    if (best >= 0) cur = best;
  }
  const el = btns[cur];
  if (el !== padEl) { if (padEl) padEl.classList.remove('padfocus'); padEl = el; el.classList.add('padfocus'); el.focus({ preventScroll: true }); el.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' }); }
  menuIdx = cur;
  /* X: preme il pulsante e resta su quello (se la schermata non cambia) */
  if (pad.pressed[BTN.X]) { el.click(); }
}
addEventListener('gamepadconnected', () => { feedSafe('Controller collegato'); });
function feedSafe(t) { if (state === 'play') feed(t); }

/* storia e modalita' */
document.querySelectorAll('[data-mode]').forEach(b => b.addEventListener('click', () => { mode = b.dataset.mode; document.querySelectorAll('[data-mode]').forEach(x => x.setAttribute('aria-pressed', x === b ? 'true' : 'false')); $('modeinfo').textContent = mode === 'sandbox' ? 'Sandbox: tutto aperto da subito, 40000 monete, i boss escono appena entri nella loro zona.' : 'Avventura: apri la mappa zona per zona. Al Tigros Fab La Rue arriva all\'ondata 8, Loris Busato alla 15.'; $('godBtn').hidden = mode !== 'sandbox'; setWorld(pickWorld); renderPick(); }));
$('godBtn').onclick = () => { god = !god; $('godBtn').setAttribute('aria-pressed', god ? 'true' : 'false'); $('godBtn').firstChild.textContent = god ? 'Invincibile: sì' : 'Invincibile: no'; };
/* racconti: intro e finali di ogni mondo, si rivedono anche dalla mappa */
let taleDone = null;
function showTale(id, btn, done) { $('taleBody').innerHTML = $(id).innerHTML; $('taleGo').textContent = btn; taleDone = done; ['sel', 'world', 'ending'].forEach(k => ($(k).hidden = true)); $('tale').hidden = false; menuIdx = 0; }
$('taleGo').onclick = () => { $('tale').hidden = true; const d = taleDone; taleDone = null; if (d) d(); };
const backToMap = () => { $('world').hidden = false; menuIdx = 0; if (state === 'menu' && world !== pickWorld) { world = pickWorld; applyLook(world); } };
$('plIntro').onclick = () => { if (place === 4) showTale('buIntro', 'Torna alla mappa', backToMap); else if (place === 3) showTale('trIntro1', 'Avanti', () => showTale('trIntro2', 'Torna alla mappa', backToMap)); else if (place === 2) showTale('hsIntro', 'Torna alla mappa', backToMap); else { $('world').hidden = true; $('story').hidden = false; storyBack = true; } };
$('plEnd').onclick = () => { showEnding(false, place); endBack = true; };
$('plPlay').onclick = () => { const k = place; toMenu(); setWorld(k); };
let storyBack = false, endBack = false;
$('previewEnd').onclick = () => { place = pickWorld; showWorld(); }; $('toWorld').onclick = () => { endBack = false; showWorld(); };
/* dopo il boss finale: continuare con le ondate infinite o passare al mondo dopo */
$('endCont').onclick = () => { $('ending').hidden = true; state = 'play'; $('hud').hidden = false; last = performance.now(); lock(); banner('Ondate infinite', 'Resisti finché ce la fai'); };
$('endNext').onclick = () => { const c = charIdx, nw = world + 1; toMenu(); setWorld(nw); startGame(ROSTER[c] && !isLocked(ROSTER[c]) ? c : 0); }; $('worldBack').onclick = toMenu;
function setWorld(w) {
  pickWorld = w; document.querySelectorAll('[data-world]').forEach(x => { const on = +x.dataset.world === w; x.setAttribute('aria-pressed', on ? 'true' : 'false'); x.classList.toggle('ghost', !on); });
  $('w2btn').classList.toggle('locked', !hsOpen()); $('w2sub').textContent = hsOpen() ? 'il Capo del bazar' : 'in Avventura: finisci il Tigros';
  const wi = $('worldinfo'); wi.hidden = w === 1;
  if ($('w3btn')) { $('w3btn').classList.toggle('locked', !unlocks.hs); $('w3sub').textContent = unlocks.hs ? 'Pika e il maleficio' : 'in Avventura: finisci l\'Happy Shopping'; }
  if (w === 3) wi.textContent = unlocks.hs || mode === 'sandbox' ? 'Tribunale: parcheggio con Fab La Rue (round ' + TR_FAB_WAVE + '), piazza dei tavolini con Pierre (round ' + BOSS_WELL.wave + ') e Fabio Regaglia (round ' + BOSS_FABIO.wave + '), garage e casa di Pika.' : 'In Avventura il Tribunale si apre dopo aver finito l\'Happy Shopping. In Sandbox puoi provarlo subito.';
  if ($('w4btn')) { $('w4btn').classList.toggle('locked', !unlocks.tr); $('w4sub').textContent = unlocks.tr ? 'il Re dei Mammutones' : 'in Avventura: finisci il Tribunale'; }
  if (w === 4) wi.textContent = unlocks.tr || mode === 'sandbox' ? 'Centro di Busto: Pierre alla fontana (round ' + BOSS_PIERRE4.wave + '), Corti al Mac (round ' + BOSS_CORTI.wave + '), i cugini Progni ai bar (round ' + BOSS_PROGNI.wave + '), Loris in chiesa (round ' + BOSS_LORIS4.wave + '), poi catacombe e Sardegna.' : 'In Avventura il centro di Busto si apre dopo aver finito il Tribunale. In Sandbox puoi provarlo subito.';
  if (w === 2) wi.textContent = hsOpen() || mode === 'sandbox' ? 'Happy Shopping: parcheggio e negozio, il Capo arriva all\'ondata ' + BOSS_CAPO.wave + '. Debe si sblocca battendolo.' : 'In Avventura l\'Happy Shopping si apre dopo aver battuto Loris Busato. In Sandbox puoi provarlo subito.';
  if (state === 'menu') { world = w; applyLook(w); }
}
document.querySelectorAll('[data-world]').forEach(b => b.addEventListener('click', () => setWorld(+b.dataset.world)));
$('storyGo').onclick = () => { $('story').hidden = true; if (storyBack) { storyBack = false; backToMap(); return; } $('sel').hidden = false; menuIdx = 0; };
/* invito: condivide il link del gioco (su telefono si apre la condivisione, su PC si copia) */
const GAME_URL = 'https://mammutones-tigros.vercel.app';
const INVITE_TXT = 'Gioca con me a Mammutones al Tigros! Busto è nel caos: scegli il tuo personaggio e riprenditi il Tigros. Si gioca dal computer, col controller della Play o dal telefono (in orizzontale).';
function toast(t) { const el = $('toast'); el.textContent = t; el.hidden = false; clearTimeout(toast.t); toast.t = setTimeout(() => (el.hidden = true), 4000); }
$('invite').onclick = async () => {
  try { if (navigator.share) { await navigator.share({ title: 'Mammutones al Tigros', text: INVITE_TXT, url: GAME_URL }); return; } } catch (_) {}
  try { await navigator.clipboard.writeText(INVITE_TXT + ' ' + GAME_URL); toast('Link copiato! Incollalo su WhatsApp: ' + GAME_URL); } catch (_) { toast('Manda questo link ai tuoi amici: ' + GAME_URL); }
};
$('storyAgain').onclick = () => { $('sel').hidden = true; $('story').hidden = false; };

/* schermata di scelta: ritratti in pixel art */
/* personaggi da sbloccare: Jacopo battendo Fab La Rue, Leo finendo la storia (solo in Avventura) */
const UNLOCK_TXT = { fab: 'Sconfiggi Fab La Rue nel seminterrato', loris: 'Finisci la storia: sconfiggi Loris Busato', hs: 'Finisci l\'Happy Shopping: sconfiggi il Capo', corti: 'È sotto una maledizione: liberalo al Mac del centro di Busto (mondo 4)', bar: 'Prigioniero dei cugini Progni: liberalo ai bar del centro di Busto (mondo 4)', busto: 'Finisci il centro di Busto: sconfiggi il Re dei Mammutones in Sardegna' };
let unlocks = {}; try { unlocks = JSON.parse(localStorage.getItem('mt_unlocks') || '{}') || {}; } catch (_) {}
/* Tefalin, Diego e Debe vengono dall'Happy Shopping: in Avventura servono Loris battuto (e Debe il Capo), in Sandbox sempre disponibili */
const isLocked = c => { if (c.world >= 2 && mode === 'sandbox') return false; if (c.world === 4) return !unlocks[c.unlock]; if (c.world === 3) return !unlocks.tr; if (c.world === 2 && !unlocks.loris) return true; return !!c.unlock && !unlocks[c.unlock]; };
const lockTxt = c => c.world === 4 ? UNLOCK_TXT[c.unlock] : c.world === 3 ? 'Si sblocca finendo il Tribunale (mondo 3). In Sandbox puoi già provarlo' : c.world === 2 && !unlocks.loris ? 'Viene dall\'Happy Shopping: sconfiggi prima Loris Busato' : UNLOCK_TXT[c.unlock];
function unlockChar(k) {
  if (mode !== 'adv' || unlocks[k]) return null; unlocks[k] = 1; try { localStorage.setItem('mt_unlocks', JSON.stringify(unlocks)); } catch (_) {}
  renderPick(); const c = ROSTER.find(r => r.unlock === k); return c;
}
const LOCK_SVG = '<svg class="lk" viewBox="0 0 16 16" aria-hidden="true"><path d="M5 7V5a3 3 0 0 1 6 0v2" fill="none" stroke="#ffd25e" stroke-width="2"/><rect x="3" y="7" width="10" height="8" fill="#ffd25e"/><rect x="7" y="9" width="2" height="4" fill="#12161c"/></svg>';
function renderPick() {
  $('pick').innerHTML = '';
  ROSTER.forEach((c, i) => {
    const lock = isLocked(c);
    const b = document.createElement('button'); b.type = 'button'; b.className = 'pc' + (lock ? ' locked' : ''); b.style.setProperty('--c', c.c);
    const can = document.createElement('canvas'); SPR[c.sprite].draw(can, 3); b.append(can);
    b.insertAdjacentHTML('beforeend', `<b>${c.short}</b><span>${POWERS[c.power].n}</span>` + (lock ? LOCK_SVG + `<em>${lockTxt(c)}</em>` : ''));
    b.title = lock ? 'Bloccato: ' + lockTxt(c) : POWERS[c.power].d;
    b.onclick = () => {
      const w2lock = (pickWorld === 2 && mode === 'adv' && !hsOpen()) || (pickWorld === 3 && mode === 'adv' && !unlocks.hs) || (pickWorld === 4 && mode === 'adv' && !unlocks.tr);
      if (isLocked(c) || w2lock) { b.classList.remove('nope'); void b.offsetWidth; b.classList.add('nope'); tone(160, 0.12, 'square', 0.04); if (w2lock) $('worldinfo').hidden = false; return; } startGame(i); };
    $('pick').append(b);
  });
}
renderPick();
/* telefono: comandi touch, grafica piu' leggera */
const touchUI = initTouch({
  fire: () => { if (state === 'play' && fireT <= 0) shoot(); }, jump: () => { if (state === 'play' && onGround()) P.vy = 6.9; },
  reload: () => state === 'play' && startReload(), power: () => state === 'play' && usePower(), use: () => state === 'play' && useInter(),
  swap: () => { if (state === 'play' && P.weapons.length > 1) switchWeapon(1 - P.cur); }, inv: () => state === 'play' && openInv(),
  view: () => setFP(!fp), pause: () => pauseGame(),
});
if (isTouch) {
  document.body.classList.add('touch');
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.25) * 0.85); renderer.shadowMap.enabled = false;
  scene.traverse(o => { if (o.isDirectionalLight) o.castShadow = false; });
  dispatchEvent(new Event('resize'));
}

/* unisce la scenografia ferma (lasciando fuori porte, barriere e scudo) */
initFx(scene);
const sky = makeSky(scene); setSky(sky, 1); skyRef = sky;
bakeStatic(scene, [storeDoor, gzBar, shieldMesh, panelLed, wareDoor, officeDoor, hsDoor, trGate, trGDoor, liftLed, trFx, trPanelLed, paulM, ...CAGES.map(c => c.group), ...GENERATORS.map(g => g.led), ...buAnim, buSeal]);
applyLook(1); setWorld(1);

/* per i test automatici e il debug dalla console */
window.__game = { cam: camera, scene, get pModel() { return pModel; }, setState(s) { state = s; }, solids, models: () => rescues.map(r => r.m), rescue: (m, n, t) => rescue(m, n, t), hurtEnemy: (e, d) => damageEnemy(e, d, false), setWorld, get world() { return world; }, unlock(k) { unlocks[k] = 1; renderPick(); }, set god(v) { god = v; }, usePower, spawnBoss: k => spawnBoss(k), openZone: i => openZone(i), get GEN() { return GENERATORS; }, set power(v) { power = v; }, get boss() { return boss; }, get info() { return renderer.info.render; }, get P() { return P; }, get enemies() { return enemies; }, get coins() { return coins; }, set coins(v) { coins = v; }, get wave() { return wave; }, spawnEnemy, shoot, useInter, startGame, get zone() { return zone; }, setAim(y, p) { yaw = y; pitch = p; }, get yaw() { return yaw; }, spawnBottle, drinkBottle, get bottle() { return bottle; }, get buff() { return buff; }, setBuff(k) { buff = { k, n: k, t: 15 }; }, openBox, get boxes() { return boxes3d; }, get keys() { return keys; }, get hostile() { return hostile; }, get bu() { return bu; }, buTeleport, openSeal, ringBell, goSard, goCata, get unlocks() { return unlocks; } };
requestAnimationFrame(loop);
