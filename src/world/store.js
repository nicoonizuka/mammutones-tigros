/* Zona 3: l'edificio del Tigros (facciata, Buongusto) e l'interno del negozio in versione apocalittica */
import * as THREE from 'three';
import { scene, solid } from '../render/engine.js';
import { M, rbox, mesh, sph, ctex, texMat, label, plane, TEX, rnd, setSeed } from './kit.js';
import { cart } from './parking.js';

/* confini interni del negozio */
export const STORE = { x1: -12, x2: 40, z1: -44, z2: -14.5, ceil: 6 };
export const DOOR = { x: 8, z: -14.25, w: 8 };
export const inStore = p => p.z < -14.4 && p.x > STORE.x1 && p.x < STORE.x2;
export const STORE_SPAWNS = [[38, -40.5], [-10, -40.5], [2, -40.5], [34, -19.5], [-10, -30]];

const brick = TEX.brick(); brick.wrapS = brick.wrapT = THREE.RepeatWrapping;
const brickM = (rx, ry) => { const t = brick.clone(); t.needsUpdate = true; t.repeat.set(rx, ry); return texMat(t, { roughness: 0.9 }); };
const paint = M('#e4ded2', { roughness: 0.95 });
function wall(x, z, w, d, h = 7, inside = null) {
  const m = mesh(new THREE.BoxGeometry(w, h, d), brickM(Math.max(w, d) / 3, h / 3), scene, [x, h / 2, z]); m.castShadow = true; m.receiveShadow = true;
  solid(x, z, w, d, m); return m;
}

/* ---------- guscio dell'edificio ---------- */
/* blocco Buongusto (chiuso) a sinistra */
const bg = mesh(new THREE.BoxGeometry(28, 8, 30), brickM(9, 3), scene, [-26, 4, -29]); bg.castShadow = bg.receiveShadow = true; solid(-26, -29, 28, 30, bg);
for (let x = -38; x < -14; x += 4) mesh(rbox(3.4, 2.6, 0.15, 0.05), M('#4f7d92', { roughness: 0.1, metalness: 0.3 }), scene, [x + 2, 1.6, -13.95]);
plane(10, 2, new THREE.MeshStandardMaterial({ map: label('Buongusto', { font: 'italic 700 92px Georgia,serif', w: 512, h: 128 }), transparent: true, roughness: 0.5 }), scene, [-24, 6.4, -13.92]);
/* muri del negozio */
wall(-4, -14.25, 16, 0.5); wall(26, -14.25, 28, 0.5);
mesh(new THREE.BoxGeometry(8, 3, 0.5), brickM(3, 1), scene, [8, 5.5, -14.25]).castShadow = true;
wall(14, -44.25, 52.5, 0.5); wall(40.25, -29, 0.5, 30.5);
const roof = mesh(new THREE.BoxGeometry(53, 0.4, 31), M('#6a625a', { roughness: 0.95 }), scene, [14, 7.2, -29.2]); roof.castShadow = true;
/* insegna e ingresso */
plane(12, 3, new THREE.MeshStandardMaterial({ map: label('TIGROS'), transparent: true, roughness: 0.5 }), scene, [8, 5.6, -13.98]);
export const storeDoor = new THREE.Group();
mesh(rbox(8, 3.8, 0.14, 0.03), M('#7fb2c8', { roughness: 0.06, metalness: 0.2, transparent: true, opacity: 0.7 }), storeDoor, [0, 1.9, 0]);
for (const x of [-3.2, -1.1, 1.1, 3.2]) mesh(rbox(1.3, 0.3, 0.17, 0.04), M('#f2c14e', { roughness: 0.5 }), storeDoor, [x, 2.15, 0]);
mesh(rbox(0.06, 3.8, 0.18, 0.02), M('#dcdcdc', { metalness: 0.6, roughness: 0.3 }), storeDoor, [0, 1.9, 0]);
storeDoor.position.set(DOOR.x, 0, DOOR.z); scene.add(storeDoor);
mesh(rbox(8.4, 0.3, 0.6, 0.06), M('#dcdcdc', { metalness: 0.6, roughness: 0.3 }), scene, [8, 3.95, -14.2]);
export const doorSolid = solid(DOOR.x, DOOR.z, DOOR.w, 0.5, storeDoor.children[0]);

/* ---------- interno ---------- */
const tiles = TEX.tiles(); tiles.wrapS = tiles.wrapT = THREE.RepeatWrapping; tiles.repeat.set(26, 15);
const floor = plane(52, 30, texMat(tiles, { roughness: 0.55 }), scene, [14, 0.012, -29.25], [-Math.PI / 2, 0, 0]); floor.receiveShadow = true;
plane(52, 30, M('#3a3a40', { roughness: 0.9 }), scene, [14, 6, -29.25], [Math.PI / 2, 0, 0]);
/* pareti interne dipinte */
plane(52, 6, paint, scene, [14, 3, -43.99]); plane(30, 6, paint, scene, [39.99, 3, -29.25], [0, -Math.PI / 2, 0]);
plane(30, 6, paint, scene, [-11.99, 3, -29.25], [0, Math.PI / 2, 0]);
for (const [x, w] of [[-4, 16], [26, 28]]) plane(w, 6, paint, scene, [x, 3, -14.51], [0, Math.PI, 0]);
/* luci a soffitto */
const panelM = M('#fff8e8', { emissive: '#fff4d8', emissiveIntensity: 0.9 }), panelOff = M('#55555c');
setSeed(8);
for (let x = -8; x <= 36; x += 6) for (let z = -18; z >= -42; z -= 6) mesh(rbox(1.8, 0.06, 0.5, 0.02), rnd() < 0.25 ? panelOff : panelM, scene, [x, 5.96, z]);
export const storeLights = [];
for (const [x, z, f] of [[2, -24, 0], [16, -32, 1], [30, -26, 0]]) {
  const l = new THREE.PointLight('#ffe8c8', 1.1, 34, 1.5); l.position.set(x, 5.3, z); scene.add(l); storeLights.push({ l, f, base: 1.1 });
}
/* cartelli dei reparti */
function deptSign(text, bgc, x, z, w, rotY = 0) {
  plane(w, 1.1, new THREE.MeshStandardMaterial({ map: label(text, { font: '700 64px Arial,sans-serif', bg: bgc, w: 512, h: 96, shadow: null }), roughness: 0.6 }), scene, [x, 4.4, z], [0, rotY, 0]);
}
deptSign('Gastronomia', '#2e5aa8', -2, -43.95, 9); deptSign('Macelleria', '#b23a30', 15, -43.95, 8); deptSign('Banco fresco', '#3d7a3a', 29, -43.95, 8);
deptSign('Ortofrutta', '#4a6a2a', -11.95, -21, 7, Math.PI / 2);

/* ortofrutta: banchi di legno con la frutta */
const wood = M('#9a6c40', { roughness: 0.7 }), woodD = M('#7a5230', { roughness: 0.75 });
const FRUIT = ['#e84b3c', '#f2c14e', '#6cc28a', '#f08a3c', '#b0d84a', '#d94b8a', '#8a3a5a', '#f4e04a'];
const fruitG = new THREE.SphereGeometry(0.075, 8, 6), fruitM = new THREE.MeshStandardMaterial({ roughness: 0.55 });
const fruits = new THREE.InstancedMesh(fruitG, fruitM, 4 * 220 + 60); let fi = 0; const d3 = new THREE.Object3D(), col = new THREE.Color();
setSeed(12);
for (const [x, z] of [[-7.5, -19.5], [-1.8, -19.5], [-7.5, -24.5], [-1.8, -24.5]]) {
  mesh(rbox(4.6, 0.85, 1.9, 0.08), wood, scene, [x, 0.43, z]); mesh(rbox(4.8, 0.08, 2.1, 0.03), woodD, scene, [x, 0.88, z]); solid(x, z, 4.7, 2);
  for (let k = 0; k < 220; k++) {
    if (rnd() < 0.25) continue; const zone = Math.floor(k / 28); const c = FRUIT[zone % FRUIT.length];
    d3.position.set(x - 2.15 + (k % 28) * 0.155 + (rnd() - 0.5) * 0.04, 0.98 + (rnd() * 0.08), z - 0.8 + Math.floor(k / 28) * 0.21); d3.scale.setScalar(0.8 + rnd() * 0.5); d3.updateMatrix();
    fruits.setMatrixAt(fi, d3.matrix); fruits.setColorAt(fi, col.set(c)); fi++;
  }
}
for (let k = 0; k < 60; k++) { d3.position.set(-10 + rnd() * 12, 0.07, -17 + -rnd() * 10); d3.scale.setScalar(1); d3.updateMatrix(); fruits.setMatrixAt(fi, d3.matrix); fruits.setColorAt(fi, col.set(FRUIT[k % 8])); fi++; }
fruits.count = fi; fruits.castShadow = true; scene.add(fruits);
cart(scene, -4.5, -27.5, 0.5, true); cart(scene, 3, -21, -0.3);

/* sushi */
mesh(rbox(3.2, 1.3, 2.2, 0.08), M('#1e1c22', { roughness: 0.5 }), scene, [-6, 0.65, -34]); solid(-6, -34, 3.3, 2.3);
mesh(rbox(3, 0.35, 2, 0.06), M('#cfe6ee', { roughness: 0.05, transparent: true, opacity: 0.45 }), scene, [-6, 1.5, -34]);
for (let k = 0; k < 10; k++) mesh(rbox(0.22, 0.08, 0.16, 0.03), M(k % 2 ? '#f4f0e6' : '#e84b3c'), scene, [-7.2 + (k % 5) * 0.55, 1.36, -34.5 + Math.floor(k / 5) * 0.8]);
plane(2.8, 0.7, new THREE.MeshStandardMaterial({ map: label('SUSHI DAILY', { font: '900 70px Arial Black,Arial', bg: '#1e1c22', color: '#f4f0e6', w: 512, h: 128, shadow: null }), roughness: 0.5 }), scene, [-6, 2.4, -32.85]);
mesh(rbox(3.2, 0.06, 2.2, 0.03), M('#1e1c22'), scene, [-6, 2.9, -34]); for (const sx of [-1.5, 1.5]) for (const sz of [-1, 1]) mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.6, 6), M('#1e1c22'), scene, [-6 + sx, 2.1, -34 + sz]);

/* corsie: scaffali con i prodotti (una sola mesh istanziata per tutti i prodotti) */
const shelfM = M('#6f7680', { roughness: 0.45, metalness: 0.45 }), shelfD = M('#4e545c', { roughness: 0.5, metalness: 0.4 });
const PROD = ['#e85d5d', '#4f9de0', '#f2c14e', '#6cc28a', '#b07ad9', '#f08a3c', '#f4f0e6', '#d94b4b', '#3a6ab0', '#e8d8b0'];
const prodG = new THREE.BoxGeometry(0.22, 0.3, 0.22), prodM = new THREE.MeshStandardMaterial({ roughness: 0.6 });
const prods = new THREE.InstancedMesh(prodG, prodM, 3200); let pi = 0;
function addProd(x, y, z, ry, s, c) { d3.position.set(x, y, z); d3.rotation.set(0, ry, 0); d3.scale.set(s, s * (0.7 + rnd() * 0.6), s); d3.updateMatrix(); prods.setMatrixAt(pi, d3.matrix); prods.setColorAt(pi, col.set(c)); pi++; d3.rotation.set(0, 0, 0); }
function shelfUnit(x, fallen) {
  const G = new THREE.Group(), L = 14, Hh = 2.3;
  mesh(rbox(0.12, Hh, L, 0.02), shelfD, G, [0, Hh / 2, 0]);
  for (let lv = 0; lv < 5; lv++) mesh(rbox(1.1, 0.05, L, 0.015), shelfM, G, [0, 0.12 + lv * 0.52, 0]);
  for (const sz of [-L / 2, L / 2]) mesh(rbox(1.1, Hh, 0.08, 0.02), shelfD, G, [0, Hh / 2, sz]);
  G.position.set(x, 0, -29); scene.add(G);
  G.traverse(m => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } });
  if (fallen) { G.rotation.z = -Math.PI / 2 + 0.06; G.position.y = 0.55; G.position.x = x + 1.1; solid(x + 1.15, -29, 2.4, 14, G.children[0]);
    for (let k = 0; k < 120; k++) addProd(x + 2.6 + rnd() * 2.4, 0.11, -36 + rnd() * 14, rnd() * 3, 0.9, PROD[k % PROD.length]); return; }
  solid(x, -29, 1.15, 14.2, G.children[0]);
  const prodColor = PROD[Math.floor(rnd() * PROD.length)];
  for (let lv = 0; lv < 4; lv++) for (const side of [-1, 1]) for (let k = 0; k < 44; k++) {
    if (rnd() < 0.3) continue; const c = rnd() < 0.7 ? prodColor : PROD[Math.floor(rnd() * PROD.length)];
    addProd(x + side * 0.3, 0.3 + lv * 0.52, -29 - L / 2 + 0.25 + k * 0.31, 0, 1, c);
  }
  for (let k = 0; k < 14; k++) addProd(x + (rnd() < 0.5 ? -1 : 1) * (0.9 + rnd() * 0.8), 0.11, -36 + rnd() * 14, rnd() * 3, 1, PROD[k % PROD.length]);
}
setSeed(21);
[6, 10, 14, 18, 22, 26, 30].forEach(x => shelfUnit(x, x === 22));
prods.count = pi; prods.castShadow = true; prods.receiveShadow = true; scene.add(prods);
/* cartelli gialli dei prezzi appesi */
const price = label('1,00 €', { font: '900 120px Arial Black,Arial', bg: '#f2c14e', color: '#c0302a', w: 256, h: 192, shadow: null });
const priceM = new THREE.MeshStandardMaterial({ map: price, roughness: 0.6, side: THREE.DoubleSide }), stringM = M('#222');
for (let k = 0; k < 14; k++) { const x = -8 + rnd() * 44, z = -18 - rnd() * 22; const p = plane(0.9, 0.68, priceM, scene, [x, 4.6, z], [0, rnd() * Math.PI, (rnd() < 0.2 ? 0.6 : 0)]); mesh(new THREE.CylinderGeometry(0.006, 0.006, 1.1, 4), stringM, scene, [x, 5.45, z]); }

/* casse */
const belt = M('#26282e', { roughness: 0.6 }), cassa = M('#9aa3ad', { roughness: 0.4, metalness: 0.4 });
for (const x of [17, 21, 25, 29, 33]) {
  mesh(rbox(0.95, 0.9, 3.1, 0.06), cassa, scene, [x, 0.45, -18.2]); mesh(rbox(0.75, 0.04, 2.2, 0.02), belt, scene, [x, 0.92, -17.8]);
  mesh(rbox(0.45, 0.3, 0.35, 0.04), M('#2a2c30'), scene, [x + 0.15, 1.1, -19.3]); mesh(rbox(0.3, 0.2, 0.03, 0.01), M('#5ad0ff', { emissive: '#2a90c0', emissiveIntensity: 0.6 }), scene, [x + 0.15, 1.35, -19.12]);
  mesh(new THREE.CylinderGeometry(0.04, 0.04, 2.4, 6), cassa, scene, [x - 0.4, 1.2, -19.6]); mesh(rbox(0.4, 0.3, 0.06, 0.02), M('#e84b3c'), scene, [x - 0.4, 2.5, -19.6]);
  solid(x, -18.2, 1.05, 3.2);
}
cart(scene, 23, -21, 1.2); cart(scene, 31, -16.5, 0.4, true);

/* banchi in fondo: gastronomia, macelleria, banco fresco */
for (const [x0, x1, c, food] of [[-11, 8, '#2e5aa8', ['#e8c890', '#d89a6a', '#f4e8c8']], [8.5, 22, '#b23a30', ['#c0453a', '#e08a7a', '#a8302a']], [22.5, 36, '#3d7a3a', ['#f4f0e6', '#f2d070', '#8ac0e0']]]) {
  const len = x1 - x0, cx = (x0 + x1) / 2;
  mesh(rbox(len, 0.95, 1.4, 0.06), M(c, { roughness: 0.6 }), scene, [cx, 0.48, -42.9]);
  mesh(rbox(len, 0.06, 1.3, 0.02), M('#e8e8e4', { roughness: 0.4 }), scene, [cx, 0.98, -42.9]);
  mesh(rbox(len - 0.2, 0.5, 0.06, 0.02), M('#cfe6ee', { roughness: 0.05, transparent: true, opacity: 0.35 }), scene, [cx, 1.28, -42.25], [-0.35, 0, 0]);
  for (let k = 0; k < len * 2; k++) if (rnd() > 0.35) mesh(rbox(0.32, 0.1, 0.4, 0.04), M(food[k % 3], { roughness: 0.6 }), scene, [x0 + 0.3 + k * 0.5, 1.06, -43.1 + (k % 2) * 0.4]);
  solid(cx, -42.9, len, 1.5);
}
/* scala mobile per il seminterrato (chiusa per ora) */
export const ESCALATOR = { x: 37.6, z: -29 };
mesh(rbox(3.6, 0.1, 10, 0.04), M('#1a1b1f'), scene, [37.6, 0.03, -29]);
for (let k = 0; k < 14; k++) mesh(rbox(1.5, 0.05, 0.25, 0.01), M('#3a3d44', { metalness: 0.6, roughness: 0.4 }), scene, [37.6, 0.07, -24.5 - k * 0.65]);
for (const sx of [-1.3, 1.3]) { mesh(rbox(0.25, 1.1, 10, 0.08), M('#7a828c', { metalness: 0.5, roughness: 0.4 }), scene, [37.6 + sx, 0.55, -29]); mesh(rbox(0.3, 0.08, 10.2, 0.04), M('#111'), scene, [37.6 + sx, 1.14, -29]); }
const tape = ctex(64, 16, (g) => { for (let x = 0; x < 64; x += 16) { g.fillStyle = '#f2c14e'; g.fillRect(x, 0, 8, 16); g.fillStyle = '#1a1a1a'; g.fillRect(x + 8, 0, 8, 16); } }, 3, 1);
mesh(rbox(3.4, 0.25, 0.08, 0.03), texMat(tape, { roughness: 0.6 }), scene, [37.6, 0.9, -23.8]);
solid(37.6, -29, 3.6, 10.2);
/* porte del magazzino (chiuse per ora) */
export const WAREHOUSE_DOOR = { x: 37.5, z: -43.7 };
const strip = M('#cfe3ec', { roughness: 0.2, transparent: true, opacity: 0.55, side: THREE.DoubleSide });
for (let k = 0; k < 10; k++) plane(0.32, 3.2, strip, scene, [36.1 + k * 0.31, 1.6, -43.95 + (k % 2) * 0.02]);
mesh(rbox(3.6, 0.3, 0.3, 0.05), M('#5b636d'), scene, [37.5, 3.3, -43.9]);
/* detriti e carrelli dentro */
const deb = [M('#c8c0b0'), M('#8a837b'), M('#a87a4a'), M('#f4f0e6')];
for (let i = 0; i < 70; i++) mesh(rbox(0.1 + rnd() * 0.35, 0.02 + rnd() * 0.06, 0.1 + rnd() * 0.35, 0.01), deb[i % 4], scene, [-10 + rnd() * 48, 0.04, -16 - rnd() * 26], [0, rnd() * 3, 0]);
cart(scene, 12, -38, 2.2, true); cart(scene, 34, -36, 0.8);

/* luci che sfarfallano */
export function updateStore(t) {
  for (const s of storeLights) if (s.f) { const on = Math.sin(t * 23) + Math.sin(t * 7.3) > -0.6; s.l.intensity = on ? s.base : 0.1; }
}
