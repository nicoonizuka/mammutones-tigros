/* Mammutones al Tigros - avvio, giocatore, nemici, armi, HUD e loop */
import * as THREE from 'three';
import './style.css';
import { ROSTER, POWERS, MIRKO_MODEL } from './characters/roster.js';
import { buildHuman, buildMammutones, buildWeapon } from './characters/styled.js';
import { mat, box, sign } from './render/textures.js';
import { renderer, scene, camera, solids, blockers, solid, BOUNDS } from './render/engine.js';
import { gzBar, gzSolids } from './world/parking.js';
import { audio, tone, shotSound, click, reloadSound, bell, pickS, buy, denied, hurt } from './audio.js';
import { WEAPONS, HEADSHOT, WALL_BUYS, ZONES, ECONOMY, WAVES, DROPS, enemyStats, pickType } from './config/balance.js';

const $ = id => document.getElementById(id);
const V3 = THREE.Vector3;

/* ===================== STATO ===================== */
let P, charIdx = 0, pModel, state = 'menu', enemies = [], drops = [], tracers = [], sparks = [];
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
function spawnPoints() { let pts = SPAWN.parcheggio; if (gzOpen()) pts = pts.concat(SPAWN.gazebo); return pts; }
function spawnEnemy() {
  const pts = spawnPoints(); const p = pts[Math.floor(Math.random() * pts.length)];
  const type = pickType(zone); const st = enemyStats(type, wave, zone);
  const m = buildMammutones(type); m.position.set(p[0] + (Math.random() - 0.5) * 2, 0, p[1] + (Math.random() - 0.5) * 2); scene.add(m);
  const e = { m, type, hp: st.hp, max: st.hp, dmg: st.dmg, reward: st.reward, atkCd: 1.2, spd: st.spd * (0.9 + Math.random() * 0.2), atk: 0.6, dead: 0, stuck: 0, side: 0, walk: Math.random() * 6, r: 0.45 * m.scale.x, kick: 0 };
  m.userData.hit.body.userData.enemy = e; m.userData.hit.head.userData.enemy = e; m.userData.hit.head.userData.head = true;
  enemies.push(e); alive++; bell();
}
function collide(pos, r, extra) {
  pos.x = Math.max(BOUNDS.x1 + r, Math.min(BOUNDS.x2 - r, pos.x)); pos.z = Math.max(BOUNDS.z1 + r, Math.min(BOUNDS.z2 - r, pos.z));
  for (const s of solids) {
    if (s.off) continue;
    if (pos.x + r > s.x1 && pos.x - r < s.x2 && pos.z + r > s.z1 && pos.z - r < s.z2) {
      const dx1 = s.x2 - (pos.x - r), dx2 = (pos.x + r) - s.x1, dz1 = s.z2 - (pos.z - r), dz2 = (pos.z + r) - s.z1; const m = Math.min(dx1, dx2, dz1, dz2);
      if (m === dx1) pos.x += dx1; else if (m === dx2) pos.x -= dx2; else if (m === dz1) pos.z += dz1; else pos.z -= dz2;
    }
  }
  if (!gzOpen() && !extra && pos.x < -12 + r && pos.z < -6 + r) { if (-6 + r - pos.z < -12 + r - pos.x) pos.z = -6 + r; else pos.x = -12 + r; }
}
function animLimbs(m, phase, amp) { const p = m.userData.P; const s = Math.sin(phase) * amp; p.legL.rotation.x = s; p.legR.rotation.x = -s; if (p.armL) p.armL.rotation.x = -s * 0.8; }

/* ===================== SPARO ===================== */
const ray = new THREE.Raycaster(); const tracerM = new THREE.LineBasicMaterial({ color: '#ffe08a' });
const sparkG = new THREE.SphereGeometry(0.07, 6, 4), sparkM = new THREE.MeshBasicMaterial({ color: '#ffd27a' }), bloodM = new THREE.MeshBasicMaterial({ color: '#c0392b' });
function muzzle() { const g = pModel.userData.gun; const v = g.userData.muzzle.clone(); g.localToWorld(v); return v; }
function hitTargets() { const t = [...blockers]; for (const e of enemies) if (!e.dead) t.push(e.m.userData.hit.head, e.m.userData.hit.body); return t; }
function shoot() {
  const w = P.weapons[P.cur]; if (P.reloadT > 0) return;
  const inf = P.pwT > 0 && P.pw.k === 'ammo';
  if (w.ammo <= 0 && !inf) { if (w.res > 0) startReload(); else click(); return; }
  if (!inf) w.ammo--;
  const aimPow = P.pwT > 0 && P.pw.k === 'aim';
  fireT = w.rate * (aimPow ? 0.6 : 1); shotSound(w.sound);
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
      const head = !!h.object.userData.head; const mult = (head ? HEADSHOT : 1) * (aimPow ? 1.5 : 1);
      damageEnemy(e, w.dmg * mult, head); anyHit = true; end = h.point; spark(h.point, true); if (!w.pierce) break;
    }
    tracer(muzzle(), end);
  }
  if (anyHit) { $('cross').classList.add('hit'); setTimeout(() => $('cross').classList.remove('hit'), 90); }
  pModel.userData.P.armR.rotation.x -= 0.25;
}
function tracer(a, b) { const g = new THREE.BufferGeometry().setFromPoints([a, b]); const l = new THREE.Line(g, tracerM); scene.add(l); tracers.push({ l, t: 0.06 }); }
function spark(p, blood) { const m = new THREE.Mesh(sparkG, blood ? bloodM : sparkM); m.position.copy(p); scene.add(m); sparks.push({ m, t: 0.18 }); }
function earn(n) { coins += n * (P && P.pwT > 0 && P.pw.k === 'coins' ? 2 : 1); }
function damageEnemy(e, d, head) {
  e.hp -= d; earn(ECONOMY.hit); e.kick = 0.18;
  if (e.hp <= 0 && !e.dead) {
    e.dead = 1; e.deadT = 0; earn(e.reward + (head ? ECONOMY.headKill : 0)); kills++; alive--;
    if (head) feed('Colpo in testa +' + (e.reward + ECONOMY.headKill));
    if (Math.random() < DROPS.chance) dropItem(e.m.position.clone());
  }
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
  else P.weapons.forEach(w => { w.res = Math.min(WEAPONS[w.id].res, w.res + w.mag * 2); });
  feed('+ ' + DROPLOOK[it.k].n); pickS();
}

/* ---------- armi al muro ---------- */
const wallMeshes = WALL_BUYS.map(wb => {
  const G = new THREE.Group();
  const chalk = new THREE.Mesh(new THREE.PlaneGeometry(1.9, 0.9), new THREE.MeshBasicMaterial({ map: sign(WEAPONS[wb.id].n.toUpperCase(), '700 30px Arial,sans-serif', '#f4f0e0', 190, 90), transparent: true, opacity: 0.9 }));
  chalk.position.set(0, -0.55, 0.02); G.add(chalk);
  const frame = box(2.1, 1.0, 0.05, mat('#3a2a20')); frame.position.set(0, 0, -0.01); G.add(frame);
  const gun = buildWeapon(wb.id); gun.rotation.y = Math.PI / 2; gun.position.set(-0.05, 0.05, 0.08); gun.scale.setScalar(1.8); G.add(gun);
  G.position.set(wb.x, 2.1, wb.z + 0.08); scene.add(G); return G;
});

/* ---------- punti interattivi ---------- */
const INTER = [
  ...WALL_BUYS.map(wb => ({
    x: wb.x, z: wb.z + 1.2, r: 2.4,
    label: () => P && P.weapons.some(w => w.id === wb.id) ? `<b>E</b> Munizioni ${WEAPONS[wb.id].n} · <b>${wb.ammoCost}</b>` : `<b>E</b> Compra ${WEAPONS[wb.id].n} · <b>${wb.cost}</b>`,
    cost: () => P.weapons.some(w => w.id === wb.id) ? wb.ammoCost : wb.cost,
    act: () => {
      const have = P.weapons.findIndex(w => w.id === wb.id);
      if (have >= 0) { const w = P.weapons[have]; w.res = WEAPONS[wb.id].res; w.ammo = w.mag; feed('Munizioni piene'); return; }
      if (P.weapons.length < 2) { P.weapons.push(newWeapon(wb.id)); switchWeapon(1); } else { P.weapons[P.cur] = newWeapon(wb.id); equip(); }
      feed('Hai comprato: ' + WEAPONS[wb.id].n);
    },
  })),
  { x: -18, z: -5.4, r: 3, label: () => gzOpen() ? null : `<b>E</b> Apri il gazebo Buongusto · <b>${ZONES[1].cost}</b>`, cost: () => ZONES[1].cost, act: () => openZone(1) },
  { x: -11.4, z: -10, r: 2.4, label: () => gzOpen() ? null : `<b>E</b> Apri il gazebo Buongusto · <b>${ZONES[1].cost}</b>`, cost: () => ZONES[1].cost, act: () => openZone(1) },
  { x: 8, z: -12.6, r: 2.6, label: () => 'Il negozio si apre nella prossima versione', cost: () => 0 },
  { x: 34, z: 17.2, r: 2.6, label: () => 'La rampa per il seminterrato è bloccata, per ora', cost: () => 0 },
];
function openZone(i) {
  if (zone >= i) return; zone = i;
  if (i === 1) { scene.remove(gzBar); gzSolids.forEach(s => (s.off = 1)); banner('Gazebo aperto', 'I Mammutones ora escono anche da qui'); }
}
let nearI = null;
function useInter() {
  if (!nearI) return; const c = nearI.cost(); if (!c || !nearI.label()) return;
  if (coins < c) { feed('Ti servono ' + c + ' monete'); denied(); return; }
  coins -= c; nearI.act(); buy();
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
  keys[e.code] = true; if (state !== 'play') return;
  if (e.code === 'KeyR') startReload(); if (e.code === 'KeyE') useInter(); if (e.code === 'KeyQ') usePower();
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
  else { P.pwT = pw.dur; feed(pw.n + '!'); }
  if (pw.k === 'shield') shieldMesh.visible = true;
}

/* ===================== HUD ===================== */
function feed(t) { const d = document.createElement('div'); d.textContent = t; $('feed').prepend(d); setTimeout(() => d.remove(), 2600); while ($('feed').children.length > 5) $('feed').lastChild.remove(); }
let bannerT = 0; function banner(t, s) { $('banner').innerHTML = t + (s ? `<small>${s}</small>` : ''); $('banner').hidden = false; bannerT = 2.6; }
function hud() {
  $('wave').innerHTML = wave + '<small>Ondata · ' + ZONES[zone].n + '</small>'; $('coins').textContent = coins;
  $('hpb').style.width = P.hp + '%'; $('hpt').textContent = Math.ceil(P.hp); $('arb').style.width = (P.ar / DROPS.maxArmor * 100) + '%';
  const w = P.weapons[P.cur]; const inf = P.pwT > 0 && P.pw.k === 'ammo'; $('wname').textContent = w.n + (P.reloadT > 0 ? ' · ricarica…' : '');
  $('ammo').innerHTML = inf ? '∞' : `${w.ammo}<small> / ${w.res}</small>`;
  $('slots').innerHTML = P.weapons.map((x, i) => `<span class="${i === P.cur ? 'on' : ''}">${i + 1} ${x.n}</span>`).join('');
  const on = P.pwT > 0 || (P.pw.k === 'call' && mirko); $('pw').classList.toggle('on', !!on);
  $('pwb').style.width = (on ? (P.pw.k === 'call' && mirko ? mirko.t : P.pwT) / P.pw.dur * 100 : (1 - P.pwCd / P.pw.cd) * 100) + '%';
  const lbl = nearI && nearI.label(); $('prompt').hidden = !lbl; if (lbl) $('prompt').innerHTML = lbl;
}

/* ===================== LOOP ===================== */
let last = performance.now();
function loop(t) {
  requestAnimationFrame(loop); const dt = Math.min(0.05, (t - last) / 1000); last = t;
  if (state === 'play') { time += dt; update(dt); }
  else { time += dt * 0.3; if (state === 'menu') { camera.position.set(Math.sin(time * 0.2) * 30, 14, 20 + Math.cos(time * 0.2) * 6); camera.lookAt(0, 2, -8); } }
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
  const moving = mv.lengthSq() > 0; let spd = keys.ShiftLeft || keys.ShiftRight ? 7.2 : 4.8; if (P.pwT > 0 && P.pw.k === 'speed') spd *= 1.9;
  if (moving) { mv.normalize().multiplyScalar(spd * dt); P.pos.add(mv); P.walk += dt * spd * 1.9; }
  P.vy -= 18 * dt; P.pos.y = Math.max(0, P.pos.y + P.vy * dt); if (P.pos.y === 0) P.vy = 0;
  collide(P.pos, 0.4);
  pModel.position.copy(P.pos); pModel.rotation.y = yaw + Math.PI; animLimbs(pModel, P.walk, moving ? 0.6 : 0);
  const PP = pModel.userData.P;
  PP.armR.rotation.x += (-1.45 - pitch * 0.9 - PP.armR.rotation.x) * Math.min(1, dt * 14); PP.armR.rotation.z = 0.05;
  if (P.weapons[P.cur].id === 'fucile') { PP.armL.rotation.x = -1.3 - pitch * 0.9; PP.armL.rotation.z = -0.55; } else PP.armL.rotation.z = 0;
  PP.torso.scale.y = 1 + Math.sin(time * 2.2) * 0.01;
  shieldMesh.position.set(P.pos.x, P.pos.y + 1, P.pos.z);
  /* camera in terza persona */
  const d = new V3(-Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch), -Math.cos(yaw) * Math.cos(pitch));
  const head = P.pos.clone(); head.y += pModel.userData.height * 0.92;
  const cam = head.clone().sub(d.clone().multiplyScalar(3.4)).add(right.clone().multiplyScalar(0.85)); cam.y = Math.max(0.4, cam.y + 0.15);
  cam.x = Math.max(-39.5, Math.min(39.5, cam.x)); cam.z = Math.max(-13.6, Math.min(29.5, cam.z));
  camera.position.copy(cam); camera.lookAt(cam.clone().add(d));
  /* sparo */
  fireT -= dt; const w = P.weapons[P.cur]; if (mouseDown && w.auto && fireT <= 0) shoot();
  if (P.reloadT > 0) { P.reloadT -= dt; if (P.reloadT <= 0) { const n = Math.min(w.mag - w.ammo, w.res); w.ammo += n; w.res -= n; P.reloadT = 0; } }
  else if (w.ammo === 0 && w.res > 0 && !(P.pwT > 0 && P.pw.k === 'ammo')) startReload();
  /* nemici */
  for (const e of enemies) {
    const m = e.m, EP = m.userData.P;
    if (e.dead) { e.deadT += dt; m.rotation.x = Math.min(1.5, e.deadT * 4); m.position.y = -Math.max(0, e.deadT - 1.2) * 0.8; if (e.deadT > 2.6) { scene.remove(m); e.gone = 1; } continue; }
    e.kick = Math.max(0, e.kick - dt); EP.torso.rotation.x = -e.kick * 1.4;
    EP.bells.forEach((b, k) => { b.rotation.x = Math.sin(time * 6 + k + e.walk) * 0.3; });
    const to = P.pos.clone().sub(m.position); to.y = 0; const dist = to.length(); m.rotation.y = Math.atan2(to.x, to.z);
    if (dist > 1.15 * m.scale.x) {
      to.normalize();
      if (e.side) { const s = new V3(to.z, 0, -to.x).multiplyScalar(e.side); to.add(s).normalize(); e.sideT -= dt; if (e.sideT <= 0) e.side = 0; }
      const before = m.position.clone(); m.position.add(to.multiplyScalar(e.spd * dt * (e.kick > 0 ? 0.3 : 1)));
      for (const o of enemies) { if (o === e || o.dead) continue; const dd = m.position.clone().sub(o.m.position); dd.y = 0; const l = dd.length(); if (l < 0.85 && l > 0) m.position.add(dd.multiplyScalar((0.85 - l) / l * 0.5)); }
      collide(m.position, e.r, 1); const moved = m.position.distanceTo(before);
      if (moved < e.spd * dt * 0.3) { e.stuck += dt; if (e.stuck > 0.4) { e.side = Math.random() < 0.5 ? 1 : -1; e.sideT = 1.2; e.stuck = 0; } } else e.stuck = 0;
      e.walk += dt * e.spd * 2.2; animLimbs(m, e.walk, 0.55); EP.armR.rotation.x = -Math.sin(e.walk) * 0.45;
    } else {
      e.atk -= dt; EP.armR.rotation.x = -1.4 + Math.sin(time * 12) * 0.4; EP.armL.rotation.x = -1.4 - Math.sin(time * 12) * 0.4;
      if (e.atk <= 0) { e.atk = e.atkCd; hit(e.dmg); }
    }
  }
  enemies = enemies.filter(e => !e.gone);
  /* oggetti ed effetti */
  for (const dr of drops) { dr.t -= dt; dr.m.rotation.y += dt * 2; dr.m.position.y = 0.5 + Math.sin(time * 4) * 0.1; if (dr.m.position.distanceTo(new V3(P.pos.x, 0.5, P.pos.z)) < 1.3) { pickup(dr); dr.t = 0; } if (dr.t <= 0) scene.remove(dr.m); }
  drops = drops.filter(dr => dr.t > 0);
  tracers.forEach(x => { x.t -= dt; if (x.t <= 0) { scene.remove(x.l); x.l.geometry.dispose(); } }); tracers = tracers.filter(x => x.t > 0);
  sparks.forEach(x => { x.t -= dt; x.m.scale.setScalar(1 + (0.18 - x.t) * 6); if (x.t <= 0) scene.remove(x.m); }); sparks = sparks.filter(x => x.t > 0);
  updMirko(dt);
  nearI = null; for (const i of INTER) { if (Math.hypot(P.pos.x - i.x, P.pos.z - i.z) < i.r && i.label()) { nearI = i; break; } }
  if (bannerT > 0) { bannerT -= dt; if (bannerT <= 0) $('banner').hidden = true; }
  P.hurtT = Math.max(0, P.hurtT - dt); $('dmg').style.boxShadow = `inset 0 0 120px 30px rgba(220,30,30,${Math.min(0.65, P.hurtT * 1.4)})`;
  hud();
}
function hit(dmg) {
  if (P.pwT > 0 && P.pw.k === 'shield') { tone(1200, 0.05, 'square', 0.03); return; }
  if (P.ar > 0) { const a = Math.min(P.ar, dmg * 0.7); P.ar -= a; dmg -= a; }
  P.hp -= dmg; P.hurtT = 0.5; hurt(); if (P.hp <= 0) { P.hp = 0; gameOver(); }
}
function startWave() { wave++; toSpawn = WAVES.count(wave); spawnT = 0.5; banner('Ondata ' + wave, wave === 1 ? 'Arrivano i Mammutones' : ''); }

/* ===================== STATI ===================== */
function resetWorld() {
  enemies.forEach(e => scene.remove(e.m)); drops.forEach(d => scene.remove(d.m)); enemies = []; drops = [];
  alive = 0; toSpawn = 0; wave = 0; kills = 0; coins = ECONOMY.start; breakT = 3;
  if (mirko) { scene.remove(mirko.m); mirko = null; }
  if (zone >= 1) { scene.add(gzBar); gzSolids.forEach(s => (s.off = 0)); } zone = 0; shieldMesh.visible = false;
}
function startGame(i) {
  charIdx = i; resetWorld(); newPlayer(i); state = 'play'; ['sel', 'dead', 'pause'].forEach(id => ($(id).hidden = true)); $('hud').hidden = false;
  $('pname').textContent = ROSTER[i].name; $('pwn').textContent = P.pw.n;
  const wc = $('who'); wc.width = 128; wc.height = 128; wc.style.imageRendering = 'auto'; const g = wc.getContext('2d'); g.clearRect(0, 0, 128, 128); if (FACES[i]) g.drawImage(FACES[i], 0, 0, 128, 128);
  lock(); banner('Sopravvivi al parcheggio', 'Il fucile è appeso al muro del Tigros'); audio();
}
function pauseGame() { if (state !== 'play') return; state = 'pause'; $('pause').hidden = false; mouseDown = false; }
function resume() { state = 'play'; $('pause').hidden = true; last = performance.now(); lock(); }
function gameOver() {
  state = 'dead'; try { document.exitPointerLock(); } catch (_) {}
  $('hud').hidden = true; $('dead').hidden = false;
  $('deadmsg').textContent = `${ROSTER[charIdx].name} è caduto al Tigros (${ZONES[zone].n}). Loris Busato ride da qualche parte nel magazzino.`;
  $('deadstats').innerHTML = `<div>${wave}<small>Ondata raggiunta</small></div><div>${kills}<small>Mammutones abbattuti</small></div>`;
}
function toMenu() { state = 'menu'; resetWorld(); if (pModel) { scene.remove(pModel); pModel = null; } ['dead', 'pause'].forEach(id => ($(id).hidden = true)); $('hud').hidden = true; $('sel').hidden = false; }
$('resume').onclick = resume; $('quit').onclick = toMenu; $('again').onclick = () => startGame(charIdx); $('change').onclick = toMenu;

/* schermata di scelta: ritratti 3D renderizzati una volta all'avvio */
const FACES = [];
function portraits() {
  const pr = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
  pr.outputEncoding = THREE.sRGBEncoding; pr.toneMapping = THREE.ACESFilmicToneMapping; pr.setPixelRatio(1);
  const ps = new THREE.Scene(); ps.add(new THREE.HemisphereLight('#ffe2c8', '#4a3a40', 1.1));
  const l = new THREE.DirectionalLight('#ffd8a8', 2.2); l.position.set(-1.5, 3, 3); ps.add(l);
  const rimL = new THREE.DirectionalLight('#9ab8ff', 1.2); rimL.position.set(2, 2, -3); ps.add(rimL);
  const pc = new THREE.PerspectiveCamera(30, 1, 0.1, 20);
  const shots = ROSTER.map((c, i) => {
    const m = buildHuman(c.model); m.rotation.y = 0.35; ps.add(m); const h = m.userData.height;
    pr.setSize(220, 300); pc.aspect = 220 / 300; pc.updateProjectionMatrix(); pc.position.set(0.4, h * 0.6, h * 1.55); pc.lookAt(0, h * 0.52, 0); pr.render(ps, pc);
    const body = pr.domElement.toDataURL();
    pr.setSize(128, 128); pc.aspect = 1; pc.updateProjectionMatrix(); pc.position.set(0.12, h * 0.93, 0.85); pc.lookAt(0, h * 0.91, 0); pr.render(ps, pc);
    const face = new Image(); face.src = pr.domElement.toDataURL(); FACES[i] = face;
    ps.remove(m); return body;
  });
  pr.dispose(); return shots;
}
const BODIES = portraits();
ROSTER.forEach((c, i) => {
  const b = document.createElement('button'); b.type = 'button'; b.className = 'pc'; b.style.setProperty('--c', c.c);
  const img = document.createElement('img'); img.src = BODIES[i]; img.alt = ''; b.append(img);
  b.insertAdjacentHTML('beforeend', `<b>${c.short}</b><span>${POWERS[c.power].n}</span>`); b.title = POWERS[c.power].d; b.onclick = () => startGame(i); $('pick').append(b);
});
if (matchMedia('(pointer:coarse)').matches) $('touchwarn').hidden = false;

/* per i test automatici e il debug dalla console */
window.__game = { get P() { return P; }, get enemies() { return enemies; }, get coins() { return coins; }, set coins(v) { coins = v; }, get wave() { return wave; }, spawnEnemy, shoot, useInter, startGame, get zone() { return zone; }, setAim(y, p) { yaw = y; pitch = p; } };
requestAnimationFrame(loop);
