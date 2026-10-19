/* Zona 4: il seminterrato. Parcheggio sotterraneo al buio, locale tecnico con il quadro elettrico
   e la tana dei ratti di Fab La Rue. Sta "lontano" (x 60..110) e ci si arriva con la scala mobile. */
import * as THREE from 'three';
import { scene, solid } from '../render/engine.js';
import { M, rbox, mesh, ctex, texMat, plane, rnd, setSeed } from './kit.js';
import { makeCar, cart } from './parking.js';

export const BASE = { x1: 60, x2: 110, z1: -30, z2: 10, ceil: 3.4 };
export const inBasement = p => p.x > 55;
export const BASE_START = { x: 66, z: 4, yaw: Math.PI * 0.75 };
export const BASE_ESCALATOR = { x: 63.5, z: 7.5 };
export const PANEL = { x: 61.2, z: -27.5 };
export const LAIR = { x: 103, z: -23 };
export const BASE_SPAWNS = [[107, -27], [99, -17], [107, 6], [88, -28], [76, 8], [104, -12]];

const concrete = ctex(256, 256, (g, w, h) => {
  g.fillStyle = '#4a4c52'; g.fillRect(0, 0, w, h); setSeed(51);
  for (let i = 0; i < 9000; i++) { const c = rnd(); g.fillStyle = c < 0.5 ? '#43454b' : c < 0.85 ? '#53555b' : '#3a3c40'; g.fillRect(rnd() * w, rnd() * h, 1 + rnd() * 2, 1 + rnd() * 2); }
  for (let k = 0; k < 6; k++) { g.fillStyle = 'rgba(30,25,20,.25)'; g.beginPath(); g.ellipse(rnd() * w, rnd() * h, 10 + rnd() * 30, 6 + rnd() * 18, rnd() * 3, 0, Math.PI * 2); g.fill(); }
}, 12, 10);
const floor = plane(50, 40, texMat(concrete, { roughness: 0.8 }), scene, [85, 0.01, -10], [-Math.PI / 2, 0, 0]); floor.receiveShadow = true;
plane(50, 40, M('#2a2b30', { roughness: 0.95 }), scene, [85, BASE.ceil, -10], [Math.PI / 2, 0, 0]);
const wallM = M('#5a5c62', { roughness: 0.95 });
function wall(x, z, w, d) { const m = mesh(new THREE.BoxGeometry(w, BASE.ceil + 0.2, d), wallM, scene, [x, BASE.ceil / 2, z]); m.receiveShadow = true; solid(x, z, w, d, m, 7); }
wall(85, -30.25, 50.5, 0.5); wall(85, 10.25, 50.5, 0.5); wall(59.75, -10, 0.5, 40.5); wall(110.25, -10, 0.5, 40.5);
/* strisce gialle e nere alla base dei muri */
const hazard = ctex(64, 16, (g) => { for (let x = -16; x < 64; x += 16) { g.fillStyle = '#f2c14e'; g.beginPath(); g.moveTo(x, 16); g.lineTo(x + 8, 0); g.lineTo(x + 16, 0); g.lineTo(x + 8, 16); g.fill(); } }, 40, 1);
const hzM = texMat(hazard, { roughness: 0.7, transparent: true });
plane(50, 0.4, hzM, scene, [85, 0.25, -29.99]); plane(50, 0.4, hzM, scene, [85, 0.25, 9.99], [0, Math.PI, 0]);
/* pilastri */
const pillarM = M('#8a8780', { roughness: 0.9 }), bandM = M('#f2c14e', { roughness: 0.6 });
for (let x = 68; x <= 104; x += 9) for (const z of [-20, -6, 4]) {
  if (x > 92 && z === -20) continue;
  mesh(rbox(0.8, BASE.ceil, 0.8, 0.06), pillarM, scene, [x, BASE.ceil / 2, z]); mesh(rbox(0.84, 0.3, 0.84, 0.05), bandM, scene, [x, 1.2, z]);
  solid(x, z, 0.85, 0.85, null);
}
/* strisce dei posti auto */
const lineM = M('#b8b2a6', { roughness: 0.8 });
for (let x = 64; x <= 106; x += 3) { plane(0.1, 5, lineM, scene, [x, 0.015, -12.5], [-Math.PI / 2, 0, 0]); plane(0.1, 5, lineM, scene, [x, 0.015, 7], [-Math.PI / 2, 0, 0]); }
/* macchine abbandonate */
setSeed(57);
[[65.5, -12.5], [71.5, -12.2], [80.5, -12.8], [86.5, -12.4], [77.5, 7], [95.5, 7.2], [101.5, 6.8]].forEach(([x, z], k) => makeCar(x, z, (k % 2 ? 0 : Math.PI) + (rnd() - 0.5) * 0.2, ['#5b6370', '#3f7fc0', '#bfc4ca', '#2e2826'][k % 4], k % 3 === 0));
cart(scene, 74, -3, 0.4, true); cart(scene, 90, -9, 2); cart(scene, 98, -2, 1, true);
/* pozzanghere */
const puddleM = M('#28343c', { roughness: 0.05, metalness: 0.6 });
for (const [x, z, r] of [[78, -4, 2.2], [92, 0, 1.6], [70, -22, 1.8], [96, -14, 2.5]]) { const p = mesh(new THREE.CircleGeometry(r, 24), puddleM, scene, [x, 0.02, z], [-Math.PI / 2, 0, 0]); p.scale.set(1, 0.6, 1); }
/* neon al soffitto e luci fredde */
const tubeOn = M('#e8f4ff', { emissive: '#cfe8ff', emissiveIntensity: 1 }), tubeOff = M('#3a3c40');
setSeed(61);
for (let x = 64; x <= 106; x += 7) for (const z of [-24, -13, -1, 7]) mesh(rbox(1.6, 0.06, 0.14, 0.03), rnd() < 0.3 ? tubeOff : tubeOn, scene, [x, BASE.ceil - 0.04, z]);
export const baseLights = [];
for (const [x, z, f] of [[70, -2, 0], [86, -14, 1], [100, 2, 0], [104, -24, 1]]) {
  const l = new THREE.PointLight(f && x > 100 ? '#ff8a6a' : '#cfe4ff', 1.2, 22, 1.6); l.position.set(x, BASE.ceil - 0.3, z); scene.add(l); baseLights.push({ l, f, base: 1.2 });
}
/* locale tecnico con il quadro elettrico */
const roomM = M('#6a6c72', { roughness: 0.9 });
const r1 = mesh(new THREE.BoxGeometry(0.3, BASE.ceil, 7), roomM, scene, [70, BASE.ceil / 2, -26.5]); solid(70, -26.5, 0.3, 7, r1, 7);
const r2 = mesh(new THREE.BoxGeometry(6.5, BASE.ceil, 0.3), roomM, scene, [63.25, BASE.ceil / 2, -23]); solid(63.25, -23, 6.5, 0.3, r2, 7);
export const panel = new THREE.Group();
mesh(rbox(1.6, 1.8, 0.4, 0.05), M('#d8b040', { roughness: 0.5, metalness: 0.3 }), panel, [0, 1.3, 0]);
mesh(rbox(1.3, 1.4, 0.05, 0.02), M('#2a2c30'), panel, [0, 1.3, 0.21]);
export const panelLed = mesh(new THREE.SphereGeometry(0.06, 8, 6), new THREE.MeshBasicMaterial({ color: '#ff3030' }), panel, [0.45, 1.85, 0.24]);
mesh(rbox(0.12, 0.4, 0.08, 0.02), M('#c0302a'), panel, [-0.3, 1.2, 0.26]);
panel.position.set(PANEL.x, 0, PANEL.z); panel.rotation.y = Math.PI / 2; scene.add(panel);
plane(3, 0.6, new THREE.MeshStandardMaterial({ map: ctex(512, 96, (g, w, h) => { g.fillStyle = '#c0302a'; g.fillRect(0, 0, w, h); g.fillStyle = '#fff'; g.font = '700 54px Arial'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('LOCALE TECNICO', w / 2, h / 2); }) }), scene, [66, 2.8, -22.84]);
/* tana dei ratti: muro sfondato, terra, grate, il trono di Fab */
const dirt = M('#3a2e26', { roughness: 1 }), dirtD = M('#2a201a', { roughness: 1 });
mesh(new THREE.CircleGeometry(9, 28), dirt, scene, [103, 0.02, -22], [-Math.PI / 2, 0, 0]).receiveShadow = true;
setSeed(71);
for (let i = 0; i < 26; i++) mesh(new THREE.DodecahedronGeometry(0.3 + rnd() * 0.5, 0), i % 2 ? dirtD : M('#6a6c72', { roughness: 0.95 }), scene, [98 + rnd() * 11, 0.15, -29 + rnd() * 13], [rnd() * 3, rnd() * 3, 0]);
for (const [x, z] of [[97, -26], [106, -18], [100, -15]]) { mesh(rbox(1.2, 0.05, 1.2, 0.02), M('#1a1b1f'), scene, [x, 0.03, z]); for (let k = 0; k < 4; k++) mesh(rbox(1.1, 0.06, 0.08, 0.02), M('#5b636d', { metalness: 0.6 }), scene, [x, 0.06, z - 0.45 + k * 0.3]); }
const crate = M('#8a6a40', { roughness: 0.8 }), gold = M('#e8b83a', { roughness: 0.25, metalness: 0.85 });
for (const [x, y, z, s] of [[106, 0.5, -27, 1], [107.2, 0.5, -26, 1], [106.6, 1.5, -26.5, 1], [108, 0.4, -24.5, 0.8]]) mesh(rbox(s, s, s, 0.05), crate, scene, [x, y, z]);
mesh(rbox(1.4, 1.6, 1, 0.1), M('#5a1a2a', { roughness: 0.6 }), scene, [LAIR.x + 3, 0.8, LAIR.z - 3.5]); mesh(rbox(1.6, 0.3, 1.2, 0.1), gold, scene, [LAIR.x + 3, 1.7, LAIR.z - 3.5]);
solid(106.8, -26.2, 2.6, 2.4); solid(LAIR.x + 3, LAIR.z - 3.5, 1.6, 1.2);
/* scala mobile in arrivo dal negozio */
mesh(rbox(3, 0.1, 5, 0.04), M('#1a1b1f'), scene, [63.5, 0.05, 7.5]);
for (const sx of [-1.2, 1.2]) mesh(rbox(0.22, 1.1, 5, 0.06), M('#7a828c', { metalness: 0.5, roughness: 0.4 }), scene, [63.5 + sx, 0.55, 7.5]);
plane(2.6, 0.5, new THREE.MeshStandardMaterial({ map: ctex(512, 96, (g, w, h) => { g.fillStyle = '#2a5aa8'; g.fillRect(0, 0, w, h); g.fillStyle = '#fff'; g.font = '700 56px Arial'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('NEGOZIO ↑', w / 2, h / 2); }) }), scene, [63.5, 2.7, 10]).rotation.y = Math.PI;

export function updateBasement(t, power) {
  for (const s of baseLights) if (s.f && !power) { const on = Math.sin(t * 19) + Math.sin(t * 5.1) > -0.4; s.l.intensity = on ? s.base : 0.08; } else s.l.intensity = s.base * (power ? 1.3 : 1);
}
