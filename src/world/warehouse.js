/* Zona 5 e 6: il magazzino dietro il negozio, i tre generatori da accendere e l'ufficio della zona controllo */
import * as THREE from 'three';
import { scene, solid } from '../render/engine.js';
import { M, rbox, mesh, ctex, texMat, plane, rnd, setSeed } from './kit.js';
import { cart } from './parking.js';

export const WARE = { x1: -12, x2: 40, z1: -70, z2: -44.5, ceil: 8 };
export const inWare = p => p.z < -44.5 && p.x > WARE.x1 && p.x < WARE.x2;
export const WARE_SPAWNS = [[-10, -68], [20, -69], [-10, -48], [10, -60]];
export const OFFICE = { x1: 28, x2: 40, z1: -70, z2: -61 };
export const inOffice = p => p.x > OFFICE.x1 && p.z < OFFICE.z2;
export const OFFICE_DOOR = { x: 31, z: -61 };
export const LORIS_SPOT = { x: 35, z: -66 };

const concrete = ctex(256, 256, (g, w, h) => {
  g.fillStyle = '#6a6862'; g.fillRect(0, 0, w, h); setSeed(81);
  for (let i = 0; i < 9000; i++) { const c = rnd(); g.fillStyle = c < 0.5 ? '#625f5a' : c < 0.85 ? '#73706a' : '#56544f'; g.fillRect(rnd() * w, rnd() * h, 1 + rnd() * 2, 1 + rnd() * 2); }
  g.fillStyle = '#f2c14e'; g.fillRect(0, 124, w, 6);
}, 12, 6);
plane(52, 25.5, texMat(concrete, { roughness: 0.85 }), scene, [14, 0.012, -57.25], [-Math.PI / 2, 0, 0]).receiveShadow = true;
plane(52, 25.5, M('#3a3c42', { roughness: 0.95 }), scene, [14, WARE.ceil, -57.25], [Math.PI / 2, 0, 0]);
const wallM = M('#8a8a86', { roughness: 0.95 });
function wall(x, z, w, d, h = WARE.ceil + 0.3) { const m = mesh(new THREE.BoxGeometry(w, h, d), wallM, scene, [x, h / 2, z]); m.receiveShadow = true; solid(x, z, w, d, m, 7); return m; }
wall(14, -70.25, 52.5, 0.5); wall(-12.25, -57.25, 0.5, 26); wall(40.25, -57.25, 0.5, 26);
/* il muro tra negozio e magazzino visto da dietro, sopra i 7 metri del negozio */
mesh(new THREE.BoxGeometry(52.5, 1.5, 0.5), wallM, scene, [14, 7.6, -44.25]);
mesh(rbox(52, 0.4, 26, 0.05), M('#5a5650', { roughness: 0.95 }), scene, [14, WARE.ceil + 0.4, -57.25]).castShadow = true;
/* luci */
const lampOn = M('#fff6e0', { emissive: '#fff0d0', emissiveIntensity: 1 });
for (let x = -6; x <= 34; x += 8) for (const z of [-50, -58, -66]) mesh(rbox(0.6, 0.15, 2, 0.05), lampOn, scene, [x, WARE.ceil - 0.1, z]);
export const wareLights = [];
for (const [x, z, f] of [[0, -52, 0], [16, -60, 1], [30, -52, 0]]) { const l = new THREE.PointLight('#ffeacc', 1.2, 30, 1.5); l.position.set(x, WARE.ceil - 0.6, z); scene.add(l); wareLights.push({ l, f }); }

/* scaffalature alte con bancali e scatoloni (una mesh istanziata per le scatole) */
const upright = M('#e07a2c', { roughness: 0.5, metalness: 0.3 }), beam = M('#2e5aa8', { roughness: 0.5, metalness: 0.3 }), pallet = M('#a87a4a', { roughness: 0.8 });
const boxes = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial({ roughness: 0.8 }), 600); let bi = 0;
const d3 = new THREE.Object3D(), col = new THREE.Color(); const BOXC = ['#b88a5a', '#c89a6a', '#a87a4a', '#d8b080', '#e8e0d0', '#6a8ab0'];
setSeed(83);
function rack(x0, z, len) {
  for (let x = x0; x <= x0 + len; x += 3.2) for (const dz of [-0.55, 0.55]) mesh(rbox(0.12, 6, 0.12, 0.02), upright, scene, [x, 3, z + dz]);
  for (const y of [0.15, 2.1, 4.1]) {
    for (const dz of [-0.55, 0.55]) mesh(rbox(len, 0.14, 0.1, 0.02), beam, scene, [x0 + len / 2, y, z + dz]);
    for (let x = x0 + 0.8; x < x0 + len - 0.5; x += 1.6) {
      if (rnd() < 0.15) continue; mesh(rbox(1.3, 0.12, 1.1, 0.02), pallet, scene, [x, y + 0.13, z]);
      const n = 1 + Math.floor(rnd() * 3); for (let k = 0; k < n; k++) { const s = 0.45 + rnd() * 0.25; d3.position.set(x + (rnd() - 0.5) * 0.6, y + 0.2 + s / 2 + k * s, z + (rnd() - 0.5) * 0.4); d3.rotation.set(0, rnd() * 0.3, 0); d3.scale.set(s * 1.2, s, s); d3.updateMatrix(); boxes.setMatrixAt(bi, d3.matrix); boxes.setColorAt(bi, col.set(BOXC[bi % BOXC.length])); bi++; }
    }
  }
  solid(x0 + len / 2, z, len + 0.3, 1.3, null);
}
rack(-9, -48.5, 22); rack(-9, -55, 22); rack(-9, -61.5, 22);
/* scatoloni caduti */
for (let k = 0; k < 40; k++) { const s = 0.4 + rnd() * 0.3; d3.position.set(-10 + rnd() * 36, s / 2, -46 - rnd() * 22); d3.rotation.set(rnd() * 0.5, rnd() * 3, rnd() * 0.5); d3.scale.set(s * 1.2, s, s); d3.updateMatrix(); boxes.setMatrixAt(bi, d3.matrix); boxes.setColorAt(bi, col.set(BOXC[k % BOXC.length])); bi++; }
boxes.count = bi; boxes.castShadow = true; boxes.receiveShadow = true; scene.add(boxes);
/* celle frigo */
const coldM = M('#e6eef2', { roughness: 0.4, metalness: 0.2 }), coldD = M('#9aa8b2', { roughness: 0.4, metalness: 0.4 });
for (const z of [-48, -54]) { mesh(rbox(6, 4, 5, 0.1), coldM, scene, [18, 2, z]); for (let k = 0; k < 6; k++) mesh(rbox(0.05, 3.9, 4.9, 0.01), coldD, scene, [15.1 + k, 2, z]); mesh(rbox(0.12, 2.6, 1.8, 0.04), coldD, scene, [14.95, 1.3, z]); solid(18, z, 6.1, 5.1, null); }
/* muletto */
const fl = new THREE.Group(); const yel = M('#f2c14e', { roughness: 0.5 }), blk = M('#1e1e22', { roughness: 0.6 });
mesh(rbox(1.2, 1, 2, 0.15), yel, fl, [0, 0.8, 0]); mesh(rbox(1.1, 1, 1, 0.1), M('#2a2c30', { roughness: 0.3, transparent: true, opacity: 0.6 }), fl, [0, 1.8, -0.2]);
for (const sx of [-0.5, 0.5]) { mesh(rbox(0.1, 3, 0.12, 0.02), blk, fl, [sx, 1.6, 1.05]); mesh(rbox(0.12, 0.06, 1.2, 0.02), blk, fl, [sx * 0.6, 0.12, 1.65]); }
for (const sx of [-0.62, 0.62]) for (const sz of [-0.6, 0.6]) mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.25, 14), blk, fl, [sx, 0.3, sz], [0, 0, Math.PI / 2]);
fl.position.set(24, 0, -57); fl.rotation.y = 0.6; scene.add(fl); solid(24, -57, 2.2, 2.6, null);
cart(scene, 6, -66, 0.8, true); cart(scene, 26, -48, 2);
/* cartello */
plane(6, 1.1, new THREE.MeshStandardMaterial({ map: ctex(512, 96, (g, w, h) => { g.fillStyle = '#2a2c30'; g.fillRect(0, 0, w, h); g.fillStyle = '#f2c14e'; g.font = '900 64px Arial Black,Arial'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('MAGAZZINO', w / 2, h / 2); }) }), scene, [24, 5.5, -44.51], [0, Math.PI, 0]);

/* tre generatori da pagare */
export const GENERATORS = [{ x: -9.5, z: -67, n: 1 }, { x: 13, z: -67, n: 2 }, { x: 26, z: -46.5, n: 3 }].map(g => {
  const G = new THREE.Group();
  mesh(rbox(1.8, 1.4, 1.1, 0.1), M('#4a5058', { roughness: 0.5, metalness: 0.5 }), G, [0, 0.7, 0]);
  mesh(rbox(1.84, 0.2, 1.14, 0.04), texMat(ctex(64, 16, (c) => { for (let x = 0; x < 64; x += 16) { c.fillStyle = '#f2c14e'; c.fillRect(x, 0, 8, 16); c.fillStyle = '#1a1a1a'; c.fillRect(x + 8, 0, 8, 16); } }, 2, 1)), G, [0, 1.2, 0]);
  for (let k = 0; k < 4; k++) mesh(rbox(0.06, 0.8, 1.0, 0.02), M('#2a2e34'), G, [-0.6 + k * 0.4, 0.7, 0], null, [1, 1, 1]);
  const led = mesh(new THREE.SphereGeometry(0.08, 8, 6), new THREE.MeshBasicMaterial({ color: '#ff3030' }), G, [0.7, 1.5, 0.4]);
  const num = plane(0.6, 0.6, new THREE.MeshBasicMaterial({ map: ctex(64, 64, (c) => { c.fillStyle = '#1a1a1a'; c.fillRect(0, 0, 64, 64); c.fillStyle = '#f2c14e'; c.font = '900 48px Arial'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(String(g.n), 32, 34); }) }), G, [-0.4, 1.0, 0.56]);
  G.position.set(g.x, 0, g.z); scene.add(G); solid(g.x, g.z, 1.9, 1.2, null);
  return { ...g, led, on: false };
});

/* ufficio della zona controllo: vetrate, monitor, la porta si apre con i tre generatori accesi */
const glass = M('#9cc8dc', { roughness: 0.05, transparent: true, opacity: 0.35 }), frame = M('#5b636d', { roughness: 0.4, metalness: 0.5 });
mesh(rbox(9, 1.1, 0.25, 0.04), frame, scene, [35.5, 0.55, -61]); mesh(rbox(9, 2.6, 0.08, 0.02), glass, scene, [35.5, 2.4, -61]); solid(35.5, -61, 9, 0.3, null);
mesh(rbox(0.25, 1.1, 9, 0.04), frame, scene, [28, 0.55, -65.5]); mesh(rbox(0.08, 2.6, 9, 0.02), glass, scene, [28, 2.4, -65.5]); solid(28, -66, 0.3, 8, null);
mesh(rbox(12, 0.2, 9, 0.04), frame, scene, [34, 3.8, -65.5]);
export const officeDoor = new THREE.Group();
mesh(rbox(2.6, 3.6, 0.15, 0.04), M('#3a3e44', { roughness: 0.4, metalness: 0.6 }), officeDoor, [0, 1.8, 0]);
mesh(rbox(1.2, 0.5, 0.17, 0.03), M('#c0302a'), officeDoor, [0, 2.4, 0]);
officeDoor.position.set(29.5, 0, -61); scene.add(officeDoor);
export const officeDoorSolid = solid(29.5, -61, 2.8, 0.4, officeDoor.children[0], 7);
mesh(rbox(1.6, 1.2, 0.3, 0.04), frame, scene, [28.7, 3.0, -61]);
for (const [x, z] of [[32, -64], [36, -64], [34, -68.5]]) { mesh(rbox(2.2, 0.08, 1, 0.02), M('#7a5a40', { roughness: 0.6 }), scene, [x, 0.95, z]); for (const sx of [-1, 1]) mesh(rbox(0.08, 0.95, 0.9, 0.02), frame, scene, [x + sx, 0.47, z]); mesh(rbox(0.7, 0.45, 0.05, 0.02), M('#5ad0ff', { emissive: '#2a90c0', emissiveIntensity: 0.9 }), scene, [x, 1.3, z - 0.3]); solid(x, z, 2.3, 1.1, null); }
for (let k = 0; k < 6; k++) mesh(rbox(1.1, 0.7, 0.06, 0.02), M('#5ad0ff', { emissive: '#2a90c0', emissiveIntensity: 0.7 }), scene, [30.5 + k * 1.5, 2.6, -69.95]);
plane(5, 0.7, new THREE.MeshStandardMaterial({ map: ctex(512, 72, (g, w, h) => { g.fillStyle = '#c0302a'; g.fillRect(0, 0, w, h); g.fillStyle = '#fff'; g.font = '700 46px Arial'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('ZONA CONTROLLO', w / 2, h / 2); }) }), scene, [34, 4.4, -60.86]);

export function updateWare(t) { for (const s of wareLights) if (s.f) s.l.intensity = Math.sin(t * 17) + Math.sin(t * 4.3) > -0.7 ? 1.2 : 0.1; }
