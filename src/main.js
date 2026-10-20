/* Mammutones al Tigros - avvio, giocatore, nemici, armi, HUD e loop */
import * as THREE from 'three';
import './style.css';
import { ROSTER, POWERS, MIRKO_MODEL, DAMIANO_MODEL } from './characters/roster.js';
import { CH as SPRITES } from './characters/sprites.js';
import { pad, pollPad, BTN } from './input/gamepad.js';
const SPR = SPRITES.map(c => c.fn());
import { buildHuman, buildEnemy, buildWeapon, buildFabBoss, buildLoris, buildCapo } from './characters/styled.js';
import { OX, HSB, HSTORE, inHSStore, HS_DOOR, HS_START, CAPO_SPOT, HS_SPAWNS_OUT, HS_SPAWNS_IN, HS_BUYS, hsDoor, hsDoorSolid, DAMIANO, updateHS, applyWorldLook } from './world/happyshopping.js';
import { mat, box, sign } from './render/textures.js';
import { renderer, scene, camera, solids, blockers, solid, BOUNDS, bakeStatic } from './render/engine.js';
import { gzBar, gzSolids } from './world/parking.js';
import { STORE, DOOR, inStore, STORE_SPAWNS, storeDoor, doorSolid, updateStore, ESCALATOR, WAREHOUSE_DOOR, wareDoor, wareDoorSolid } from './world/store.js';
import { audio, tone, shotSound, click, reloadSound, bell, pickS, buy, denied, hurt } from './audio.js';
import { WEAPONS, HEADSHOT, WALL_BUYS, ZONES, ECONOMY, WAVES, DROPS, enemyStats, pickType, ENEMIES, BOSS_FAB, RAT_SHARE, BOSS_LORIS, GENERATOR_COST, INVENTORY, REGEN, SANDBOX, BOSS_CAPO, HS_ZONE0, HS_START_COINS } from './config/balance.js';
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
const bagMult = () => (bag ? INVENTORY.bags[bag - 1].mult : 1);
const maxRes = w => (WEAPONS[w.id].noPack ? 0 : Math.round(WEAPONS[w.id].res * bagMult()));
const region = p => (world === 2 ? (inHSStore(p) ? 'hsin' : 'hsout') : inBasement(p) ? 'base' : inWare(p) ? 'ware' : inStore(p) ? 'store' : 'out');
const zoneIdx = () => (world === 2 ? HS_ZONE0 + zone : zone);
let wave = 0, toSpawn = 0, spawnT = 0, breakT = 0, alive = 0, kills = 0, coins = ECONOMY.start, mirko = null, zone = 0, time = 0;
const keys = {}; let yaw = Math.PI, pitch = -0.12, mouseDown = false, fireT = 0, locked = false, rDrag = false, everLocked = false;
const SPAWN = {
  parcheggio: [[-30, 28], [0, 28.5], [30, 28], [38.5, 12], [-38.5, 20], [38.5, -4], [-38.5, 0]],
  gazebo: [[-34, -12.5], [-16, -13]],
};
const gzOpen = () => zone >= 1;

/* ===================== GIOCATORE E ARMI ===================== */
function newWeapon(id) { const W = WEAPONS[id]; return { ...W, id, ammo: W.mag, res: W.res }; }
function equip() {
  const A = pModel.userData.P.armR, hand = A.userData.hand;
  if (pModel.userData.gun) A.remove(pModel.userData.gun);
  const g = buildWeapon(P.weapons[P.cur].id); g.position.copy(hand.position); g.position.y -= 0.02; g.rotation.x = Math.PI / 2;
  g.traverse(o => { if (o.isMesh) o.castShadow = true; });
  A.add(g); pModel.userData.gun = g;
}
function newPlayer(i) {
  if (pModel) scene.remove(pModel);
  pModel = buildHuman(ROSTER[i].model); scene.add(pModel);
  P = { pos: new V3(4, 0, -2), vy: 0, hp: 100, ar: 0, weapons: [newWeapon('pistola')], cur: 0, reloadT: 0, pw: POWERS[ROSTER[i].power], pwT: 0, pwCd: 0, hurtT: 0, walk: 0 };
  yaw = 0; pitch = -0.1; equip();
}
function switchWeapon(k) { if (!P.weapons[k] || k === P.cur) return; P.cur = k; P.reloadT = 0; equip(); }

/* ===================== NEMICI ===================== */
/* in sandbox la difficolta' dipende da dove sei, in avventura dalla zona piu' avanzata aperta */
function diffZone() { if (world === 2) return HS_ZONE0 + (mode === 'sandbox' && P ? (inHSStore(P.pos) ? 1 : 0) : zone); if (mode !== 'sandbox' || !P) return zone; const r = region(P.pos); return r === 'base' ? 3 : r === 'ware' ? (inOffice(P.pos) ? 5 : 4) : r === 'store' ? 2 : 1; }
function spawnPoints() {
  if (world === 2) { if (mode === 'sandbox' && P) return inHSStore(P.pos) ? HS_SPAWNS_IN : HS_SPAWNS_OUT; return zone >= 1 ? HS_SPAWNS_OUT.concat(HS_SPAWNS_IN) : HS_SPAWNS_OUT; }
  if (mode === 'sandbox' && P && !inBasement(P.pos)) { const r = region(P.pos); return r === 'ware' ? WARE_SPAWNS : r === 'store' ? STORE_SPAWNS : SPAWN.parcheggio.concat(SPAWN.gazebo); } if (P && inBasement(P.pos)) return BASE_SPAWNS; let pts = SPAWN.parcheggio; if (gzOpen()) pts = pts.concat(SPAWN.gazebo); if (zone >= 2) pts = pts.concat(STORE_SPAWNS, STORE_SPAWNS); if (zone >= 4) pts = pts.concat(WARE_SPAWNS, WARE_SPAWNS, WARE_SPAWNS); return pts; }
function spawnEnemy(forceType, at) {
  const pts = spawnPoints(); const p = at || pts[Math.floor(Math.random() * pts.length)];
  const down = P && inBasement(P.pos);
  const type = forceType || (down && Math.random() < RAT_SHARE ? 'ratto' : pickType(diffZone())); const st = enemyStats(type, wave, diffZone());
  const m = buildEnemy(type); m.position.set(p[0] + (Math.random() - 0.5) * 2, 0, p[1] + (Math.random() - 0.5) * 2); scene.add(m);
  const e = { m, type, hp: st.hp, max: st.hp, dmg: st.dmg, reward: st.reward, atkCd: ENEMIES[type].atkCd, spd: st.spd * (0.9 + Math.random() * 0.2), atk: 0.6, dead: 0, stuck: 0, side: 0, walk: Math.random() * 6, r: 0.45 * m.scale.x, kick: 0 };
  m.userData.hit.body.userData.enemy = e; m.userData.hit.head.userData.enemy = e; m.userData.hit.head.userData.head = true;
  enemies.push(e); alive++; if (type !== 'ratto') bell(); return e;
}
function spawnBoss(kind = 'fab') {
  const capo = kind === 'capo';
  const B = kind === 'loris' ? BOSS_LORIS : capo ? BOSS_CAPO : BOSS_FAB;
  const m = kind === 'loris' ? buildLoris() : capo ? buildCapo() : buildFabBoss();
  const at = kind === 'loris' ? LORIS_SPOT : capo ? CAPO_SPOT : LAIR; m.position.set(at.x, 0, at.z); scene.add(m);
  const hp = Math.round(B.hp * (1 + (kind === 'fab' ? 0.04 : 0.03) * wave));
  boss = { m, kind, capo, type: 'boss', boss: 1, hp, max: hp, dmg: B.dmg, reward: B.reward, atkCd: B.atkCd, spd: B.spd, atk: 1, dead: 0, stuck: 0, side: 0, walk: 0, r: kind === 'loris' ? 0.65 : capo ? 0.85 : 0.55, kick: 0, summon: B.summonEvery, ch: null, chCd: 4 };
  m.userData.hit.body.userData.enemy = boss; m.userData.hit.head.userData.enemy = boss; m.userData.hit.head.userData.head = true;
  enemies.push(boss); alive++; $('boss').hidden = false; $('bossn').textContent = kind === 'loris' ? 'Loris Busato · Capo dei Mammutones' : capo ? 'Il Capo · Padrone dell\'Happy Shopping' : 'Fab La Rue · Re dei ratti';
  if (capo) banner('Il Capo!', 'Esce dal magazzino: occhio quando abbassa la testa e carica');
  else banner(kind === 'loris' ? 'Loris Busato!' : 'Fab La Rue!', kind === 'loris' ? 'Il capo dei Mammutones esce dall\'ufficio' : 'Il re dei ratti esce dalla tana'); tone(110, 0.8, 'sawtooth', 0.08, 60);
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
function collide(pos, r, extra) {
  const Bd = world === 2 ? HSB : inBasement(pos) ? BASE : BOUNDS;
  pos.x = Math.max(Bd.x1 + r, Math.min(Bd.x2 - r, pos.x)); pos.z = Math.max(Bd.z1 + r, Math.min(Bd.z2 - r, pos.z));
  for (const s of solids) {
    if (s.off) continue;
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
function muzzle() { const g = pModel.userData.gun; const v = g.userData.muzzle.clone(); g.localToWorld(v); return v; }
function hitTargets() { const t = blockers(); for (const e of enemies) if (!e.dead) t.push(e.m.userData.hit.head, e.m.userData.hit.body); return t; }
function shoot() {
  const w = P.weapons[P.cur]; if (P.reloadT > 0) return;
  if (w.melee) { slash(w); return; }
  const inf = P.pwT > 0 && P.pw.k === 'ammo';
  if (w.ammo <= 0 && !inf) { if (w.res > 0) startReload(); else click(); return; }
  if (!inf) w.ammo--;
  const aimPow = P.pwT > 0 && P.pw.k === 'aim';
  fireT = w.rate * (aimPow ? 0.6 : 1); shotSound(w.sound); muzzleFlash(muzzle()); shake(w.pel > 1 ? 0.18 : w.dmg > 50 ? 0.12 : 0.04);
  const camDir = new V3(); camera.getWorldDirection(camDir); let assist = null;
  if (aimPow) { let best = 0.17; for (const e of enemies) { if (e.dead) continue; const hp = e.m.userData.hit.head.getWorldPosition(new V3()); const a = hp.clone().sub(camera.position).normalize().angleTo(camDir); if (a < best) { best = a; assist = hp; } } }
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
      const head = !!h.object.userData.head; const mult = (head ? HEADSHOT : 1) * (aimPow ? 1.5 : 1) * (P.pwT > 0 && P.pw.k === 'rage' ? 2 : 1);
      if (P.pwT > 0 && P.pw.k === 'lenti') e.slowT = 3.5;
      if (!w.explode) damageEnemy(e, w.dmg * mult, head); anyHit = true; end = h.point; spark(h.point, true); if (!w.pierce) break;
    }
    if (w.explode) { explode(end, w.explode, w.dmg * (P.pwT > 0 && P.pw.k === 'rage' ? 2 : 1)); anyHit = true; }
    tracer(muzzle(), end);
  }
  if (anyHit) { $('cross').classList.add('hit'); setTimeout(() => $('cross').classList.remove('hit'), 90); }
  pModel.userData.P.armR.rotation.x -= 0.25;
}
/* katana: colpisce tutti i nemici davanti a te entro pochi metri */
function slash(w) {
  fireT = w.rate; tone(900, 0.07, 'sawtooth', 0.05, 200); shake(0.06);
  const pf = new V3(-Math.sin(yaw), 0, -Math.cos(yaw)); let n = 0; const mult = P.pwT > 0 && P.pw.k === 'rage' ? 2 : 1;
  for (const e of enemies) { if (e.dead) continue; const to = e.m.position.clone().sub(P.pos); to.y = 0; const d = to.length();
    if (d < w.range + (e.r || 0.4) && (d < 0.8 || to.normalize().dot(pf) > 0.3)) { damageEnemy(e, w.dmg * mult, false); spark(e.m.userData.hit.body.getWorldPosition(new V3()), true); n++; } }
  if (n) { $('cross').classList.add('hit'); setTimeout(() => $('cross').classList.remove('hit'), 90); }
  const A = pModel.userData.P.armR; A.rotation.x -= 1.1; A.rotation.z = 0.8; setTimeout(() => { A.rotation.z = 0; }, 160);
}
/* bazooka: esplosione con danno ad area */
const boomM = new THREE.MeshBasicMaterial({ color: '#ff9a3a', transparent: true, opacity: 0.85, depthWrite: false });
function explode(p, R, dmg) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 12), boomM.clone()); m.position.copy(p); scene.add(m); let t = 0;
  const step = () => { t += 0.016; m.scale.setScalar(0.5 + t * R * 6); m.material.opacity = Math.max(0, 0.85 - t * 2.6); if (t < 0.33) requestAnimationFrame(step); else { scene.remove(m); m.geometry.dispose(); m.material.dispose(); } }; step();
  tone(70, 0.6, 'sawtooth', 0.12, 30); shake(0.4);
  for (const e of enemies) { if (e.dead) continue; const c = e.m.position.clone(); c.y = Math.min(Math.max(p.y, 0), 1.6); const d = c.distanceTo(p); if (d < R + (e.r || 0.4)) damageEnemy(e, dmg * (1 - 0.5 * Math.min(1, d / R)), false); }
}
function tracer(a, b) { const g = new THREE.BufferGeometry().setFromPoints([a, b]); const l = new THREE.Line(g, tracerM); scene.add(l); tracers.push({ l, t: 0.06 }); }
function spark(p, blood) { const m = new THREE.Mesh(sparkG, blood ? bloodM : sparkM); m.position.copy(p); scene.add(m); sparks.push({ m, t: 0.18 }); }
function earn(n) { coins += n * (P && P.pwT > 0 && P.pw.k === 'coins' ? 2 : 1); }
function damageEnemy(e, d, head) {
  e.hp -= d; earn(ECONOMY.hit); e.kick = 0.18;
  if (e.hp <= 0 && !e.dead) {
    e.dead = 1; e.deadT = 0; earn(e.reward + (head ? ECONOMY.headKill : 0)); kills++; alive--;
    if (head && !e.boss) feed('Colpo in testa +' + (e.reward + ECONOMY.headKill));
    if (e.boss) bossDown();
    if (Math.random() < DROPS.chance) dropItem(e.m.position.clone());
  }
}
function bossDown() {
  const kind = boss && boss.kind; boss = null; $('boss').hidden = true;
  if (kind === 'loris' && mode === 'sandbox') { lorisDead = true; banner('Loris Busato è sconfitto!', 'Esci dall\'ufficio e rientra per sfidarlo di nuovo'); return; }
  if (kind === 'loris') { lorisDead = true; lastUnlock = unlockChar('loris'); setTimeout(victory, 2500); banner('Loris Busato è sconfitto!', 'Il Tigros è salvo'); return; }
  if (kind === 'capo') {
    capoDead = true;
    if (mode === 'sandbox') { banner('Il Capo è sconfitto!', 'Esci dal negozio e rientra per sfidarlo di nuovo'); return; }
    lastUnlock = unlockChar('hs'); setTimeout(victory, 2500); banner('Il Capo è sconfitto!', 'L\'Happy Shopping è libero'); return;
  }
  fabDead = true; const nu = unlockChar('fab');
  banner('Fab La Rue è sconfitto!', nu ? 'Hai sbloccato ' + nu.short + '! Ora riaccendi la corrente nel locale tecnico' : 'I ratti scappano: riaccendi la corrente nel locale tecnico');
  for (const e of enemies) if (!e.dead && e.type === 'ratto') { e.dead = 1; e.deadT = 0; alive--; }
}
function startReload() { const w = P.weapons[P.cur]; if (P.reloadT > 0 || w.ammo >= w.mag || w.res <= 0) return; P.reloadT = w.reload; reloadSound(); }

/* ===================== OGGETTI ===================== */
const DROPLOOK = { cura: { c: '#6fd14f', n: 'Cura' }, munizioni: { c: '#f2c14e', n: 'Munizioni' }, armatura: { c: '#5ab0ff', n: 'Armatura' } };
function dropItem(pos) {
  let r = Math.random(), it = DROPS.table[0]; for (const x of DROPS.table) { r -= x.w; if (r <= 0) { it = x; break; } }
  const c = DROPLOOK[it.k].c; const m = box(0.45, 0.45, 0.45, new THREE.MeshLambertMaterial({ color: c, emissive: c, emissiveIntensity: 0.35 }));
  m.position.set(pos.x, 0.5, pos.z); scene.add(m); drops.push({ m, it, t: 25 });
}
function pickup(d) {
  const it = d.it;
  if (it.k === 'cura') P.hp = Math.min(100, P.hp + it.heal);
  else if (it.k === 'armatura') P.ar = Math.min(DROPS.maxArmor, P.ar + it.armor);
  else P.weapons.forEach(w => { w.res = Math.min(maxRes(w), w.res + w.mag * 2); });
  feed('+ ' + DROPLOOK[it.k].n); pickS();
}

/* ---------- armi al muro ---------- */
const ALL_BUYS = WALL_BUYS.concat(HS_BUYS);
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
    label: () => P && WEAPONS[wb.id].melee && P.weapons.some(w => w.id === wb.id) ? null : P && P.weapons.some(w => w.id === wb.id) ? `<b>E</b> Munizioni ${WEAPONS[wb.id].n} · <b>${wb.ammoCost}</b>` : `<b>E</b> Compra ${WEAPONS[wb.id].n} · <b>${wb.cost}</b>`,
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
  { x: DAMIANO.x, z: DAMIANO.z, r: 2.4, label: () => world === 2 ? '<b>E</b> Parla con Damiano' : null, cost: () => 0, free: () => true, act: () => banner('Damiano Ducaj', '«Bel casino qua a Busto, stasera cosa facciamo?»') },
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
  if (!nearI || !nearI.label()) return; if (nearI.free && nearI.free()) { nearI.act(); buy(); return; } const c = nearI.cost(); if (!c) return;
  if (coins < c) { feed('Ti servono ' + c + ' monete'); denied(); return; }
  coins -= c; nearI.act(); buy();
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
      if (a.fire <= 0) { a.fire = 0.11; const s = m.position.clone(); s.y = 1.35; const b = target.m.userData.hit.body.getWorldPosition(new V3()); tracer(s, b); spark(b, true); damageEnemy(target, 26, false); shotSound(0, 0.25); }
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
}
function updMirko(dt) {
  if (!mirko) return; mirko.t -= dt; const m = mirko.m;
  if (mirko.t <= 0) { scene.remove(m); mirko = null; feed('Mirko se ne va'); return; }
  let target = null, bd = 22; for (const e of enemies) { if (e.dead) continue; const d = e.m.position.distanceTo(m.position); if (d < bd) { bd = d; target = e; } }
  const want = P.pos.clone().add(new V3(Math.sin(time * 0.5) * 2.2, 0, Math.cos(time * 0.5) * 2.2)); const mv = want.sub(m.position); mv.y = 0; const dist = mv.length();
  if (dist > 1) { mv.normalize().multiplyScalar(Math.min(dist, 6 * dt)); m.position.add(mv); mirko.walk += dt * 9; animLimbs(m, mirko.walk, 0.6); }
  collide(m.position, 0.4, 1);
  if (target) {
    const d = target.m.position.clone().sub(m.position); m.rotation.y = Math.atan2(d.x, d.z); m.userData.P.armR.rotation.x = -1.5;
    mirko.fire -= dt;
    if (mirko.fire <= 0) { mirko.fire = 0.3; const a = m.position.clone(); a.y = 1.35; const b = target.m.userData.hit.body.getWorldPosition(new V3()); tracer(a, b); spark(b, true); damageEnemy(target, 30, false); shotSound(0, 0.4); }
  }
}

/* ===================== INPUT ===================== */
const cv = renderer.domElement;
function lock() { try { const r = cv.requestPointerLock(); if (r && r.catch) r.catch(() => {}); } catch (_) {} }
addEventListener('keydown', e => {
  keys[e.code] = true;
  if (state === 'inv') { if (e.code === 'Tab' || e.code === 'KeyI' || e.code === 'Escape') { e.preventDefault(); closeInv(); } return; }
  if (state !== 'play') return;
  if (e.code === 'KeyR') startReload(); if (e.code === 'KeyE') useInter(); if (e.code === 'KeyQ') usePower(); if (e.code === 'KeyH') usePack();
  if (e.code === 'Tab' || e.code === 'KeyI') { e.preventDefault(); openInv(); return; }
  if (e.code === 'Digit1') switchWeapon(0); if (e.code === 'Digit2') switchWeapon(1);
  if (e.code === 'KeyP') pauseGame();
  if (e.code === 'Space' && P.pos.y <= 0.001) P.vy = 6.2;
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
  else { P.pwT = pw.dur; feed(pw.n + '!'); }
  if (pw.k === 'shield') shieldMesh.visible = true;
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
  $('wave').innerHTML = wave + '<small>Ondata · ' + ZONES[zoneIdx()].n + '</small>'; $('coins').textContent = coins;
  $('hpb').style.width = P.hp + '%'; $('hpt').textContent = Math.ceil(P.hp); $('arb').style.width = (P.ar / DROPS.maxArmor * 100) + '%';
  const w = P.weapons[P.cur]; const inf = P.pwT > 0 && P.pw.k === 'ammo'; $('wname').textContent = w.n + (P.reloadT > 0 ? ' · ricarica…' : '');
  $('ammo').innerHTML = w.melee ? '⚔' : inf ? '∞' : `${w.ammo}<small> / ${w.res}</small>`;
  $('slots').innerHTML = P.weapons.map((x, i) => `<span class="${i === P.cur ? 'on' : ''}">${i + 1} ${x.n}</span>`).join('') + `<span>Pacchi ${packs} · H</span>`;
  const on = P.pwT > 0 || (P.pw.k === 'call' && mirko); $('pw').classList.toggle('on', !!on);
  $('pwb').style.width = (on ? (P.pw.k === 'call' && mirko ? mirko.t : P.pwT) / P.pw.dur * 100 : (1 - P.pwCd / P.pw.cd) * 100) + '%';
  const lbl = nearI && nearI.label(); $('prompt').hidden = !lbl; if (lbl) $('prompt').innerHTML = lbl;
}

/* ===================== LOOP ===================== */
let last = performance.now();
function loop(t) {
  requestAnimationFrame(loop); const dt = Math.min(0.05, (t - last) / 1000); last = t;
  pollPad(); if (pad.connected) padMenus();
  if (state === 'play') { time += dt; update(dt); }
  else { time += dt * 0.3; if (state === 'menu') { if (world === 2) { camera.position.set(OX + Math.sin(time * 0.2) * 26, 11, 24 + Math.cos(time * 0.2) * 5); camera.lookAt(OX - 4, 3, 0); } else { camera.position.set(Math.sin(time * 0.2) * 30, 14, 20 + Math.cos(time * 0.2) * 6); camera.lookAt(0, 2, -8); } } }
  renderer.render(scene, camera);
}
function update(dt) {
  /* ondate */
  if (toSpawn > 0) { spawnT -= dt; if (spawnT <= 0 && alive < WAVES.maxAlive(wave)) { spawnEnemy(); toSpawn--; spawnT = WAVES.spawnEvery(wave); } }
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
  if (pad.connected) {
    mv.addScaledVector(fwd, -pad.ly).addScaledVector(right, pad.lx);
    yaw -= pad.rx * 2.6 * dt; pitch = Math.max(-1.1, Math.min(0.9, pitch - pad.ry * 1.9 * dt));
    if (pad.pressed[BTN.L3]) sprintToggle = !sprintToggle; if (Math.hypot(pad.lx, pad.ly) < 0.2) sprintToggle = false; padSprint = sprintToggle;
    if (pad.pressed[BTN.UP]) usePack(); if (pad.pressed[8] || pad.pressed[16] || pad.pressed[17]) { openInv(); return; }
    if (pad.pressed[BTN.SQUARE]) startReload(); if (pad.pressed[BTN.CIRCLE]) useInter(); if (pad.pressed[BTN.L1] || pad.pressed[BTN.R1]) usePower();
    if (pad.pressed[BTN.TRIANGLE] && P.weapons.length > 1) switchWeapon(1 - P.cur);
    if (pad.pressed[BTN.X] && P.pos.y <= 0.001) P.vy = 6.2; if (pad.pressed[BTN.OPTIONS]) { pauseGame(); return; }
    if (pad.pressed[BTN.R2] && fireT <= 0) shoot();
  }
  const moving = mv.lengthSq() > 0.0001; let spd = keys.ShiftLeft || keys.ShiftRight || padSprint ? 7.2 : 4.8; if (P.pwT > 0 && P.pw.k === 'speed') spd *= 1.9;
  if (moving) { if (mv.lengthSq() > 1) mv.normalize(); mv.multiplyScalar(spd * dt); P.pos.add(mv); P.walk += dt * spd * 1.9; }
  P.vy -= 18 * dt; P.pos.y = Math.max(0, P.pos.y + P.vy * dt); if (P.pos.y === 0) P.vy = 0;
  collide(P.pos, 0.4);
  pModel.position.copy(P.pos); pModel.rotation.y = yaw + Math.PI; animLimbs(pModel, P.walk, moving ? 0.6 : 0);
  const PP = pModel.userData.P;
  PP.armR.rotation.x += (-1.45 - pitch * 0.9 + (moving ? Math.sin(P.walk * 2) * 0.05 : 0) - PP.armR.rotation.x) * Math.min(1, dt * 14); PP.armR.rotation.z = 0.05;
  if (P.weapons[P.cur].id === 'fucile') { PP.armL.rotation.x = -1.3 - pitch * 0.9; PP.armL.rotation.z = -0.55; } else PP.armL.rotation.z = 0;
  PP.torso.scale.y = 1 + Math.sin(time * 2.2) * 0.01;
  shieldMesh.position.set(P.pos.x, P.pos.y + 1, P.pos.z);
  /* camera in terza persona */
  const d = new V3(-Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch), -Math.cos(yaw) * Math.cos(pitch));
  const head = P.pos.clone(); head.y += pModel.userData.height * 0.92;
  const cam = head.clone().sub(d.clone().multiplyScalar(3.4)).add(right.clone().multiplyScalar(0.85)); cam.y = Math.max(0.4, cam.y + 0.15);
  if (world === 2) { if (inHSStore(P.pos)) { cam.x = Math.max(HSTORE.x1 + 0.4, Math.min(HSTORE.x2 - 0.4, cam.x)); cam.z = Math.max(HSTORE.z1 + 0.4, Math.min(HSTORE.z2 - 0.3, cam.z)); cam.y = Math.min(HSTORE.ceil - 0.4, cam.y); } else { cam.x = Math.max(HSB.x1 + 0.6, Math.min(HSB.x2 - 0.6, cam.x)); cam.z = Math.max(0.7, Math.min(HSB.z2 - 0.6, cam.z)); } }
  else if (inBasement(P.pos)) { cam.x = Math.max(BASE.x1 + 0.4, Math.min(BASE.x2 - 0.4, cam.x)); cam.z = Math.max(BASE.z1 + 0.4, Math.min(BASE.z2 - 0.4, cam.z)); cam.y = Math.min(BASE.ceil - 0.3, cam.y); }
  else if (inWare(P.pos)) { cam.x = Math.max(WARE.x1 + 0.4, Math.min(WARE.x2 - 0.4, cam.x)); cam.z = Math.max(WARE.z1 + 0.4, cam.z); cam.y = Math.min(WARE.ceil - 0.4, cam.y); }
  else if (inStore(P.pos)) { cam.x = Math.max(STORE.x1 + 0.4, Math.min(STORE.x2 - 0.4, cam.x)); cam.z = Math.max(STORE.z1 + 0.4, Math.min(STORE.z2 - 0.3, cam.z)); cam.y = Math.min(STORE.ceil - 0.4, cam.y); }
  else { cam.x = Math.max(-39.5, Math.min(39.5, cam.x)); cam.z = Math.max(-13.6, Math.min(29.5, cam.z)); }
  camera.position.copy(cam); camera.lookAt(cam.clone().add(d)); updateFx(dt, camera, P.pos, inBasement(P.pos));
  /* sparo */
  fireT -= dt; const w = P.weapons[P.cur]; if ((mouseDown || pad.fire) && w.auto && fireT <= 0) shoot();
  if (P.reloadT > 0) { P.reloadT -= dt; if (P.reloadT <= 0) { const n = Math.min(w.mag - w.ammo, w.res); w.ammo += n; w.res -= n; P.reloadT = 0; } }
  else if (w.ammo === 0 && w.res > 0 && !(P.pwT > 0 && P.pw.k === 'ammo')) startReload();
  /* nemici */
  const slow0 = P.pwT > 0 && P.pw.k === 'freeze' ? 0.15 : 1;
  for (const e of enemies) {
    const m = e.m, EP = m.userData.P;
    if (e.frozen > 0) e.frozen -= dt; if (e.slowT > 0) e.slowT -= dt;
    const slow = slow0 * (e.frozen > 0 ? 0 : 1) * (e.slowT > 0 ? 0.35 : 1);
    if (e.ice) e.ice.visible = e.frozen > 0;
    if (!e.dead && e.capo && updCapo(e, dt * slow)) continue;
    if (e.dead) { e.deadT += dt; m.rotation.x = Math.min(1.5, e.deadT * 4); m.position.y = -Math.max(0, e.deadT - 1.2) * 0.8; if (e.deadT > 2.6) { scene.remove(m); e.gone = 1; } continue; }
    e.kick = Math.max(0, e.kick - dt); EP.torso.rotation.x = -e.kick * 1.4;
    EP.bells.forEach((b, k) => { b.rotation.x = Math.sin(time * 6 + k + e.walk) * 0.3; });
    let goal = P.pos; const er = region(m.position), pr = region(P.pos);
    if (world === 2) { if (er !== pr) goal = new V3(Math.max(HS_DOOR.x - 2.2, Math.min(HS_DOOR.x + 2.2, m.position.x)), 0, er === 'hsout' ? 1.6 : -1.6); }
    else if (pr !== 'base' && er !== pr) {
      const viaShop = er === 'out' || (er === 'store' && pr === 'out');
      if (viaShop) goal = new V3(Math.max(DOOR.x - 2.6, Math.min(DOOR.x + 2.6, m.position.x)), 0, er === 'out' ? DOOR.z - 1.4 : DOOR.z + 1.4);
      else goal = new V3(Math.max(36.3, Math.min(38.7, m.position.x)), 0, er === 'ware' ? WAREHOUSE_DOOR.z + 1.4 : WAREHOUSE_DOOR.z - 1.4);
    }
    const to = goal.clone().sub(m.position); to.y = 0; const dist = goal === P.pos ? to.length() : 99; m.rotation.y = Math.atan2(to.x, to.z);
    if (dist > 1.15 * m.scale.x) {
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
  for (const dr of drops) { dr.t -= dt; dr.m.rotation.y += dt * 2; dr.m.position.y = 0.5 + Math.sin(time * 4) * 0.1; if (dr.m.position.distanceTo(new V3(P.pos.x, 0.5, P.pos.z)) < 1.3) { pickup(dr); dr.t = 0; } if (dr.t <= 0) scene.remove(dr.m); }
  drops = drops.filter(dr => dr.t > 0);
  tracers.forEach(x => { x.t -= dt; if (x.t <= 0) { scene.remove(x.l); x.l.geometry.dispose(); } }); tracers = tracers.filter(x => x.t > 0);
  sparks.forEach(x => { x.t -= dt; x.m.scale.setScalar(1 + (0.18 - x.t) * 6); if (x.t <= 0) scene.remove(x.m); }); sparks = sparks.filter(x => x.t > 0);
  updMirko(dt); updAlbanesi(dt);
  for (const r of rings) { r.t += dt; const k = 1 + r.t * 26; r.m.scale.set(k, k, 1); r.m.material.opacity = Math.max(0, 0.85 - r.t * 2.6); if (r.t > 0.33) { scene.remove(r.m); r.m.geometry.dispose(); r.gone = 1; } }
  rings = rings.filter(r => !r.gone);
  if (world === 2) { updateHS(time);
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
  if (boss && !boss.dead) { boss.summon -= dt; if (boss.summon <= 0) { const L = boss.kind === 'loris', C = boss.capo; boss.summon = L ? BOSS_LORIS.summonEvery : C ? BOSS_CAPO.summonEvery : BOSS_FAB.summonEvery;
      const list = L ? ['furia', 'furia', 'base', 'base'] : C ? ['cornuto', 'base', 'base'] : ['ratto', 'ratto', 'ratto']; list.forEach(t => spawnEnemy(t, [boss.m.position.x + (Math.random() - 0.5) * 3, boss.m.position.z + (Math.random() - 0.5) * 3])); feed(L ? 'Loris chiama i Mammutones!' : C ? 'Il Capo chiama i Mammutones dal magazzino!' : 'Fab chiama i ratti!'); }
    $('bossb').style.width = Math.max(0, boss.hp / boss.max * 100) + '%'; }
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
  P.hp -= dmg; P.hurtT = 0.5; sinceHit = 0; hurt(); shake(0.15); if (P.hp <= 0) { P.hp = 0; gameOver(); }
}
function startWave() { wave++; toSpawn = WAVES.count(wave); spawnT = 0.5; banner('Ondata ' + wave, wave === 1 ? 'Arrivano i Mammutones' : ''); }

/* ===================== STATI ===================== */
function resetWorld() {
  enemies.forEach(e => scene.remove(e.m)); drops.forEach(d => scene.remove(d.m)); enemies = []; drops = [];
  alive = 0; toSpawn = 0; wave = 0; kills = 0; coins = ECONOMY.start; breakT = 3;
  if (mirko) { scene.remove(mirko.m); mirko = null; } albanesi.forEach(a => scene.remove(a.m)); albanesi = [];
  if (boss) { scene.remove(boss.m); } boss = null; fabDead = false; lorisDead = false; power = false; packs = 0; bag = 0; panelLed.material.color.set('#ff3030'); $('boss').hidden = true;
  GENERATORS.forEach(g => { g.on = false; g.led.material.color.set('#ff3030'); });
  if (world === 1) { if (zone >= 4) { scene.add(wareDoor); wareDoorSolid.off = 0; } if (zone >= 5) { scene.add(officeDoor); officeDoorSolid.off = 0; }
    if (zone >= 1) { scene.add(gzBar); gzSolids.forEach(s => (s.off = 0)); } if (zone >= 2) { scene.add(storeDoor); doorSolid.off = 0; } }
  if (hsDoorSolid.off) { scene.add(hsDoor); hsDoorSolid.off = 0; }
  capoDead = false; rings.forEach(r => scene.remove(r.m)); rings = [];
  zone = 0; shieldMesh.visible = false;
}
function fullscreen() { const d = document.documentElement; if (!document.fullscreenElement && d.requestFullscreen) d.requestFullscreen().catch(() => {}); }
addEventListener('keydown', e => { if (e.code === 'KeyF') { if (document.fullscreenElement) document.exitFullscreen().catch(() => {}); else fullscreen(); } });
let seenHS = false;
function startGame(i) {
  if (pickWorld === 2 && mode === 'adv' && !seenHS) { seenHS = true; $('sel').hidden = true; showTale('hsIntro', 'Entra nel parcheggio', () => startGame(i)); return; }
  fullscreen();
  charIdx = i; resetWorld(); world = pickWorld; applyWorldLook(world); newPlayer(i);
  if (world === 2) { P.pos.set(HS_START.x, 0, HS_START.z); yaw = HS_START.yaw; coins = HS_START_COINS; } state = 'play'; ['sel', 'dead', 'pause', 'tale'].forEach(id => ($(id).hidden = true)); $('hud').hidden = false;
  $('pname').textContent = ROSTER[i].name; $('pwn').textContent = P.pw.n;
  const wc = $('who'); const sp = SPR[ROSTER[i].sprite]; const g = wc.getContext('2d'); g.clearRect(0, 0, 17, 16);
  for (let y = 0; y < 16; y++) for (let x = 0; x < 17; x++) { const c = sp.g[sp.top - 3 + y] && sp.g[sp.top - 3 + y][14 + x]; if (c && !String(c).startsWith('rgba')) { g.fillStyle = c; g.fillRect(x, y, 1, 1); } }
  sinceHit = 99;
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
function gameOver() {
  state = 'dead'; try { document.exitPointerLock(); } catch (_) {}
  $('hud').hidden = true; $('dead').hidden = false; $('deadtitle').innerHTML = 'Ti hanno <span>preso</span>';
  $('deadmsg').textContent = world === 2 ? `${ROSTER[charIdx].name} è caduto all'Happy Shopping (${ZONES[zoneIdx()].n}). Il Capo ride dietro le casse.` : `${ROSTER[charIdx].name} è caduto al Tigros (${ZONES[zone].n}). Loris Busato ride da qualche parte nel magazzino.`;
  $('deadstats').innerHTML = `<div>${wave}<small>Ondata raggiunta</small></div><div>${kills}<small>Mammutones abbattuti</small></div>`;
}
function victory() {
  if (state !== 'play') return; state = 'dead'; try { document.exitPointerLock(); } catch (_) {}
  $('hud').hidden = true; showEnding(true);
}
/* finale: complimenti, i boss scappano, poi la mappa del mondo */
function showEnding(real, wf) {
  if (!real) { const ww = wf || pickWorld; if (state !== 'play' && world !== ww) { world = ww; applyWorldLook(ww); } }
  $('endNext').hidden = !(real && world === 1 && mode === 'adv'); $('endCont').hidden = !real; $('endCont').firstChild.textContent = world === 2 ? 'Resta all\'Happy Shopping' : 'Resta al Tigros';
  ['sel', 'dead', 'pause', 'world', 'tale'].forEach(id => ($(id).hidden = true));
  $('endstats').innerHTML = real ? `<div>${wave}<small>Ondate</small></div><div>${kills}<small>Mammutones abbattuti</small></div><div>${coins}<small>Monete rimaste</small></div>` : '';
  const who = real ? ROSTER[charIdx].name + ' e il gruppo' : 'Il gruppo';
  const w2 = real ? world === 2 : wf ? wf === 2 : pickWorld === 2;
  $('endkick').textContent = w2 ? 'Mappa 2 completata' : 'Mappa 1 completata';
  $('endtitle').innerHTML = w2 ? 'Bravo, hai sconfitto <span>il Capo</span>!' : 'Complimenti, hai liberato <span>il Tigros</span>!';
  $('endtext').innerHTML = w2
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
function showWorld() {
  $('ending').hidden = true; $('world').hidden = false; menuIdx = 0;
  const open = hsOpen(), done = !!unlocks.hs;
  $('hsNode').setAttribute('class', 'node ' + (open ? 'free' : 'locked')); if (open) $('hsFog').removeAttribute('filter'); else $('hsFog').setAttribute('filter', 'url(#fog)');
  $('hsLbl').setAttribute('class', 'lbl' + (open ? '' : ' dim')); $('hsRect').setAttribute('stroke', open ? '#7ad0ff' : '#3a3f48'); $('hsQ').style.display = open ? 'none' : '';
  $('hsSub').textContent = done ? 'Liberato · il gruppo è al completo' : open ? 'Disponibile · Tefalin e Diego ti aspettano' : 'Bloccato · finisci prima il Tigros';
  $('playHS').hidden = !open;
}
const hsOpen = () => !!unlocks.loris || !!unlocks.hs;
function toMenu() { state = 'menu'; resetWorld(); world = pickWorld; applyWorldLook(world); if (pModel) { scene.remove(pModel); pModel = null; } ['dead', 'pause', 'ending', 'world', 'tale'].forEach(id => ($(id).hidden = true)); $('hud').hidden = true; $('sel').hidden = false; }
$('buyPack').onclick = () => invBuy('pack'); $('usePack').onclick = () => invBuy('use'); $('buyBag').onclick = () => invBuy('bag'); $('closeInv').onclick = closeInv;
$('resume').onclick = resume; $('quit').onclick = toMenu; $('again').onclick = () => startGame(charIdx); $('change').onclick = toMenu;

/* navigazione dei menu col controller: frecce o levetta per scegliere, X per confermare */
let lastVis = null, stickX = 0, stickY = 0;
function padMenus() {
  const vis = ['story', 'tale', 'ending', 'world', 'sel', 'pause', 'dead', 'inv'].find(id => !$(id).hidden); if (!vis) { lastVis = null; return; }
  if (vis === 'inv' && (pad.pressed[BTN.CIRCLE] || pad.pressed[8] || pad.pressed[17])) { closeInv(); return; }
  const btns = [...$(vis).querySelectorAll('button')].filter(b => !b.hidden && b.offsetParent !== null); if (!btns.length) return;
  /* schermata nuova: si riparte dal primo pulsante */
  let cur = btns.indexOf(document.activeElement);
  if (vis !== lastVis) { lastVis = vis; cur = 0; btns[0].focus({ preventScroll: true }); }
  if (cur < 0) cur = Math.min(menuIdx, btns.length - 1);
  /* frecce o levetta sinistra: uno scatto per ogni spinta */
  const sx = pad.lx > 0.55 ? 1 : pad.lx < -0.55 ? -1 : 0, sy = pad.ly > 0.55 ? 1 : pad.ly < -0.55 ? -1 : 0;
  let dx = pad.pressed[BTN.RIGHT] ? 1 : pad.pressed[BTN.LEFT] ? -1 : 0, dy = pad.pressed[BTN.DOWN] ? 1 : pad.pressed[BTN.UP] ? -1 : 0;
  if (!dx && !dy) { if (sx && sx !== stickX && Math.abs(pad.lx) >= Math.abs(pad.ly)) dx = sx; else if (sy && sy !== stickY && Math.abs(pad.ly) > Math.abs(pad.lx)) dy = sy; }
  stickX = Math.abs(pad.lx) < 0.3 ? 0 : sx || stickX; stickY = Math.abs(pad.ly) < 0.3 ? 0 : sy || stickY;
  if (dx || dy) {
    /* va al pulsante piu' vicino nella direzione scelta (funziona anche con le schede in griglia) */
    const r0 = btns[cur].getBoundingClientRect(), c0x = r0.left + r0.width / 2, c0y = r0.top + r0.height / 2;
    let best = -1, bs = Infinity;
    btns.forEach((b, k) => { if (k === cur) return; const r = b.getBoundingClientRect(), vx = r.left + r.width / 2 - c0x, vy = r.top + r.height / 2 - c0y;
      const along = dx ? vx * dx : vy * dy, across = dx ? Math.abs(vy) : Math.abs(vx); if (along <= 4) return;
      const sc = along + across * 2.2; if (sc < bs) { bs = sc; best = k; } });
    if (best < 0) best = (cur + (dx || dy) + btns.length) % btns.length;
    cur = best; btns[cur].focus({ preventScroll: true }); btns[cur].scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }
  menuIdx = cur;
  if (vis === 'pause' && pad.pressed[BTN.OPTIONS]) { resume(); return; }
  if (pad.pressed[BTN.X]) { const b = btns[cur]; lastVis = null; menuIdx = 0; b.click(); }
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
const backToMap = () => { $('world').hidden = false; menuIdx = 0; if (state === 'menu' && world !== pickWorld) { world = pickWorld; applyWorldLook(world); } };
$('mapIntro1').onclick = () => { $('world').hidden = true; $('story').hidden = false; storyBack = true; };
$('mapEnd1').onclick = () => { showEnding(false, 1); endBack = true; };
$('mapIntro2').onclick = () => showTale('hsIntro', 'Torna alla mappa', backToMap);
$('mapEnd2').onclick = () => { showEnding(false, 2); endBack = true; };
let storyBack = false, endBack = false;
$('previewEnd').onclick = () => showEnding(false); $('toWorld').onclick = () => { endBack = false; showWorld(); };
/* dopo il boss finale: continuare con le ondate infinite o passare al mondo dopo */
$('endCont').onclick = () => { $('ending').hidden = true; state = 'play'; $('hud').hidden = false; last = performance.now(); lock(); banner('Ondate infinite', 'Resisti finché ce la fai'); };
$('endNext').onclick = () => { const c = charIdx; toMenu(); setWorld(2); startGame(ROSTER[c] && !isLocked(ROSTER[c]) ? c : 0); }; $('worldBack').onclick = toMenu;
$('playHS').onclick = () => { setWorld(2); toMenu(); };
function setWorld(w) {
  pickWorld = w; document.querySelectorAll('[data-world]').forEach(x => { const on = +x.dataset.world === w; x.setAttribute('aria-pressed', on ? 'true' : 'false'); x.classList.toggle('ghost', !on); });
  $('w2btn').classList.toggle('locked', !hsOpen()); $('w2sub').textContent = hsOpen() ? 'il Capo del bazar' : 'in Avventura: finisci il Tigros';
  const wi = $('worldinfo'); wi.hidden = w !== 2;
  if (w === 2) wi.textContent = hsOpen() || mode === 'sandbox' ? 'Happy Shopping: parcheggio e negozio, il Capo arriva all\'ondata ' + BOSS_CAPO.wave + '. Debe si sblocca battendolo.' : 'In Avventura l\'Happy Shopping si apre dopo aver battuto Loris Busato. In Sandbox puoi provarlo subito.';
  if (state === 'menu') { world = w; applyWorldLook(w); }
}
document.querySelectorAll('[data-world]').forEach(b => b.addEventListener('click', () => setWorld(+b.dataset.world)));
$('storyGo').onclick = () => { $('story').hidden = true; if (storyBack) { storyBack = false; backToMap(); return; } $('sel').hidden = false; menuIdx = 0; };
$('storyAgain').onclick = () => { $('sel').hidden = true; $('story').hidden = false; };

/* schermata di scelta: ritratti in pixel art */
/* personaggi da sbloccare: Jacopo battendo Fab La Rue, Leo finendo la storia (solo in Avventura) */
const UNLOCK_TXT = { fab: 'Sconfiggi Fab La Rue nel seminterrato', loris: 'Finisci la storia: sconfiggi Loris Busato', hs: 'Finisci l\'Happy Shopping: sconfiggi il Capo' };
let unlocks = {}; try { unlocks = JSON.parse(localStorage.getItem('mt_unlocks') || '{}') || {}; } catch (_) {}
/* Tefalin, Diego e Debe vengono dall'Happy Shopping: in Avventura servono Loris battuto (e Debe il Capo), in Sandbox sempre disponibili */
const isLocked = c => { if (c.world === 2) { if (mode === 'sandbox') return false; if (!unlocks.loris) return true; } return !!c.unlock && !unlocks[c.unlock]; };
const lockTxt = c => c.world === 2 && !unlocks.loris ? 'Viene dall\'Happy Shopping: sconfiggi prima Loris Busato' : UNLOCK_TXT[c.unlock];
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
      const w2lock = pickWorld === 2 && mode === 'adv' && !hsOpen();
      if (isLocked(c) || w2lock) { b.classList.remove('nope'); void b.offsetWidth; b.classList.add('nope'); tone(160, 0.12, 'square', 0.04); if (w2lock) $('worldinfo').hidden = false; return; } startGame(i); };
    $('pick').append(b);
  });
}
renderPick();
if (matchMedia('(pointer:coarse)').matches) $('touchwarn').hidden = false;

/* unisce la scenografia ferma (lasciando fuori porte, barriere e scudo) */
initFx(scene);
bakeStatic(scene, [storeDoor, gzBar, shieldMesh, panelLed, wareDoor, officeDoor, hsDoor, ...GENERATORS.map(g => g.led)]);
applyWorldLook(1); setWorld(1);

/* per i test automatici e il debug dalla console */
window.__game = { setWorld, get world() { return world; }, unlock(k) { unlocks[k] = 1; renderPick(); }, set god(v) { god = v; }, usePower, spawnBoss: k => spawnBoss(k), openZone: i => openZone(i), get GEN() { return GENERATORS; }, set power(v) { power = v; }, get boss() { return boss; }, get info() { return renderer.info.render; }, get P() { return P; }, get enemies() { return enemies; }, get coins() { return coins; }, set coins(v) { coins = v; }, get wave() { return wave; }, spawnEnemy, shoot, useInter, startGame, get zone() { return zone; }, setAim(y, p) { yaw = y; pitch = p; } };
requestAnimationFrame(loop);
