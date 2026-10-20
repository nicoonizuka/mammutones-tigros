/* Mondo 2: l'Happy Shopping di Sant'Edoardo. Parcheggio in autobloccanti e negozio tipo bazar.
   Tutto il mondo sta lontano dal Tigros (x = -400) cosi' le due mappe non si vedono mai. */
import * as THREE from 'three';
import { scene, solid, sun, hemi } from '../render/engine.js';
import { M, rbox, mesh, sph, ctex, texMat, label, plane, rnd, setSeed } from './kit.js';
import { makeCar, cart } from './parking.js';
import { buildHuman } from '../characters/styled.js';
import { DAMIANO_MODEL } from '../characters/roster.js';

export const OX = -400;
const G = new THREE.Group(); G.position.x = OX; scene.add(G);
const S = (x, z, w, d, m, h) => solid(OX + x, z, w, d, m, h);
const flat = m => { m.castShadow = false; m.receiveShadow = true; return m; };

/* confini: il parcheggio davanti (z da 0 a 34) e il negozio dietro (z da -32 a 0) */
export const HSB = { x1: OX - 34, x2: OX + 34, z1: -32, z2: 34 };
export const HSTORE = { x1: OX - 25.6, x2: OX + 25.6, z1: -31.6, z2: -0.3, ceil: 5.4 };
export const inHS = p => p.x < -200;
export const inHSStore = p => p.x < -200 && p.z < -0.1 && p.x > OX - 26 && p.x < OX + 26;
export const HS_DOOR = { x: OX - 5, z: 0, w: 6 };
export const HS_START = { x: OX - 5, z: 9, yaw: 0 };
export const CAPO_SPOT = { x: OX + 9, z: -28.5 };
export const HS_SPAWNS_OUT = [[-32, 32], [-10, 33], [4, 33], [32, 32], [33, 18], [-33, 18], [-33, 5], [33, 5]].map(([x, z]) => [OX + x, z]);
export const HS_SPAWNS_IN = [[-24, -30], [24, -30], [9, -30], [24, -4], [-24, -12]].map(([x, z]) => [OX + x, z]);
/* armi al muro del mondo 2: stesso formato di WALL_BUYS */
export const HS_BUYS = [
  { id: 'pistola', cost: 300, ammoCost: 150, x: OX + 6, z: 0.35, rot: 0, zone: 'hs-parcheggio' },
  { id: 'fucile', cost: 500, ammoCost: 250, x: OX - 20, z: 33.9, rot: Math.PI, zone: 'hs-parcheggio' },
  { id: 'mitra', cost: 1200, ammoCost: 600, x: OX - 25.65, z: -20, rot: Math.PI / 2, zone: 'hs-negozio' },
  { id: 'pompa', cost: 1500, ammoCost: 750, x: OX + 25.65, z: -17, rot: -Math.PI / 2, zone: 'hs-negozio' },
];

/* ---------- cielo: giorno sporco di fumo ---------- */
{
  const t = ctex(4, 256, (g) => { const gr = g.createLinearGradient(0, 0, 0, 256);
    gr.addColorStop(0, '#5f7aa0'); gr.addColorStop(0.4, '#9fb2c6'); gr.addColorStop(0.55, '#d6cbb4'); gr.addColorStop(0.68, '#c9b89c'); gr.addColorStop(1, '#55504a'); g.fillStyle = gr; g.fillRect(0, 0, 4, 256); });
  mesh(new THREE.SphereGeometry(140, 32, 16), new THREE.MeshBasicMaterial({ map: t, side: THREE.BackSide, fog: false }), G);
  const smoke = M('#3a3634', { roughness: 1, transparent: true, opacity: 0.55 });
  for (const [x, z, h] of [[-90, -70, 60], [70, -95, 75], [110, 40, 50]]) for (let k = 0; k < 6; k++) mesh(sph(6 + k * 2.2, 10, 8), smoke, G, [x + k * 3, 6 + k * (h / 6), z - k * 2]);
}

/* ---------- pavimentazione ---------- */
const pavers = ctex(256, 256, (g, w, h) => {
  g.fillStyle = '#8f9091'; g.fillRect(0, 0, w, h); setSeed(91);
  for (let y = 0; y < h; y += 16) for (let x = ((y / 16) % 2) * 16 - 16; x < w; x += 32) { const v = 136 + Math.floor(rnd() * 26); g.fillStyle = `rgb(${v},${v + 1},${v + 3})`; g.fillRect(x + 1, y + 1, 30, 14); }
  g.fillStyle = 'rgba(40,40,40,.25)'; for (let i = 0; i < 60; i++) g.fillRect(rnd() * w, rnd() * h, 2 + rnd() * 14, 1 + rnd() * 3);
}, 18, 9);
flat(plane(68, 34, texMat(pavers, { roughness: 0.95 }), G, [0, 0.005, 17], [-Math.PI / 2, 0, 0]));
/* griglie di metallo lungo la facciata, come nella foto */
const grate = ctex(64, 64, (g, w, h) => { g.fillStyle = '#5a5f66'; g.fillRect(0, 0, w, h); g.fillStyle = '#3a3e44'; for (let x = 0; x < w; x += 6) g.fillRect(x, 0, 2, h); for (let y = 0; y < h; y += 16) g.fillRect(0, y, w, 2); }, 40, 1);
flat(plane(52, 1.2, texMat(grate, { roughness: 0.6, metalness: 0.4 }), G, [0, 0.012, 0.9], [-Math.PI / 2, 0, 0]));
/* segnaletica a terra sbiadita, chiazze e crepe */
const lineM = M('#d8d4c8', { roughness: 0.9, transparent: true, opacity: 0.55 });
for (let x = -30; x <= 30; x += 3.2) { flat(plane(0.1, 5, lineM, G, [x, 0.01, 14], [-Math.PI / 2, 0, 0])); flat(plane(0.1, 5, lineM, G, [x, 0.01, 28.5], [-Math.PI / 2, 0, 0])); }
const yel = M('#e0b030', { roughness: 0.8, transparent: true, opacity: 0.8 });
for (let k = 0; k < 4; k++) flat(plane(0.12, 4, yel, G, [-30.5 + k * 0.6, 0.011, 6], [-Math.PI / 2, 0, -0.6]));
const stain = M('#5a5a58', { roughness: 1, transparent: true, opacity: 0.35 }); setSeed(92);
for (let i = 0; i < 22; i++) flat(mesh(new THREE.CircleGeometry(0.8 + rnd() * 2.2, 14), stain, G, [-30 + rnd() * 60, 0.008 + i * 0.0002, 3 + rnd() * 29], [-Math.PI / 2, 0, 0]));
/* dossi gialli e neri */
const bump = ctex(64, 16, (g) => { for (let x = 0; x < 64; x += 16) { g.fillStyle = '#e8c040'; g.fillRect(x, 0, 8, 16); g.fillStyle = '#1a1a1a'; g.fillRect(x + 8, 0, 8, 16); } }, 14, 1);
for (const z of [7.5, 21]) mesh(rbox(26, 0.08, 0.5, 0.03), texMat(bump, { roughness: 0.7 }), G, [12, 0.04, z]);

/* ---------- recinzione: muro di cemento, siepi, case intorno ---------- */
const conc = ctex(128, 64, (g, w, h) => { g.fillStyle = '#a7a59e'; g.fillRect(0, 0, w, h); setSeed(93); for (let i = 0; i < 900; i++) { g.fillStyle = rnd() < 0.5 ? '#9a9890' : '#b4b2aa'; g.fillRect(rnd() * w, rnd() * h, 1, 1); } g.fillStyle = '#8a8880'; g.fillRect(0, 0, 2, h); g.fillRect(0, h / 2, w, 1); });
function cwall(x, z, w, d) { const t = conc.clone(); t.needsUpdate = true; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(Math.max(w, d) / 2.5, 1); const m = mesh(new THREE.BoxGeometry(w, 2.2, d), texMat(t, { roughness: 0.95 }), G, [x, 1.1, z]); m.castShadow = m.receiveShadow = true; S(x, z, w, d, m); }
cwall(0, 34.25, 69, 0.5); cwall(-34.25, 17, 0.5, 34); cwall(34.25, 17, 0.5, 34);
cwall(-30, 0.1, 8, 0.4); cwall(30, 0.1, 8, 0.4); S(-30, -16, 8, 32); S(30, -16, 8, 32);
const hedge = [M('#3f6a3a', { roughness: 0.95 }), M('#4f7d42', { roughness: 0.95 }), M('#355a32', { roughness: 0.95 })], trunk = M('#5a4030', { roughness: 0.9 });
setSeed(94);
for (let x = -33; x <= 33; x += 1.6) mesh(sph(1.0 + rnd() * 0.4, 8, 6), hedge[Math.floor(rnd() * 3)], G, [x, 2.4 + rnd() * 0.3, 35.2]);
for (let z = 1; z <= 33; z += 1.6) { mesh(sph(1.0 + rnd() * 0.4, 8, 6), hedge[Math.floor(rnd() * 3)], G, [-35.2, 2.4, z]); mesh(sph(1.0 + rnd() * 0.4, 8, 6), hedge[Math.floor(rnd() * 3)], G, [35.2, 2.4, z]); }
for (const [x, z] of [[-38, 10], [-37, 28], [38, 6], [37, 24], [-20, 38], [20, 39], [36, -6]]) { mesh(new THREE.CylinderGeometry(0.2, 0.3, 4, 8), trunk, G, [x, 2, z]); for (let k = 0; k < 4; k++) mesh(new THREE.IcosahedronGeometry(1.8 + rnd() * 0.8, 1), hedge[k % 3], G, [x + (rnd() - 0.5) * 2, 5 + rnd() * 1.6, z + (rnd() - 0.5) * 2]); }
/* palazzine rosa a ovest, capannone di mattoni a sud, case a est */
function building(x, z, w, d, h, col, roofCol, win = '#5a6470', balc) {
  const b = mesh(new THREE.BoxGeometry(w, h, d), M(col, { roughness: 0.95 }), G, [x, h / 2, z]); b.receiveShadow = true;
  mesh(new THREE.BoxGeometry(w + 0.6, 0.5, d + 0.6), M(roofCol, { roughness: 0.9 }), G, [x, h + 0.2, z]);
  const wm = M(win, { roughness: 0.3, metalness: 0.2 }), bm = M('#e8e2d6', { roughness: 0.8 });
  const face = Math.abs(x) > Math.abs(z) ? (x < 0 ? 1 : -1) : 0, fz = face ? 0 : (z > 0 ? -1 : 1);
  for (let y = 1.6; y < h - 0.8; y += 2.8) for (let k = -0.5 * (face ? d : w) + 1.6; k < 0.5 * (face ? d : w) - 1; k += 3) {
    if (face) { mesh(new THREE.BoxGeometry(0.05, 1.2, 1.1), wm, G, [x + face * (w / 2 + 0.03), y, z + k]); if (balc) mesh(new THREE.BoxGeometry(1.0, 0.9, 2.2), bm, G, [x + face * (w / 2 + 0.5), y - 0.5, z + k]); }
    else mesh(new THREE.BoxGeometry(1.1, 1.2, 0.05), wm, G, [x + k, y, z + fz * (d / 2 + 0.03)]);
  }
}
building(-48, 8, 12, 14, 12, '#d9958a', '#9a5a4a', '#6a7480', 1); building(-47, 26, 10, 12, 9, '#e0a294', '#9a5a4a', '#6a7480', 1); building(-46, -10, 10, 14, 10, '#d48a7e', '#9a5a4a', '#6a7480', 1);
{
  const brk = ctex(128, 64, (g, w, h) => { g.fillStyle = '#7a3a2a'; g.fillRect(0, 0, w, h); for (let y = 0; y < h; y += 8) for (let x = ((y / 8) % 2) * 8 - 8; x < w; x += 16) { g.fillStyle = ['#a24a34', '#984430', '#b05a3c'][(x + y) % 3]; g.fillRect(x + 1, y + 1, 14, 6); } }, 10, 2);
  const cap = mesh(new THREE.BoxGeometry(60, 7, 12), texMat(brk, { roughness: 0.95 }), G, [-4, 3.5, 47]); cap.receiveShadow = true;
  const wm = M('#3a4048', { roughness: 0.3, metalness: 0.3 }); for (let x = -32; x < 26; x += 2.4) mesh(new THREE.BoxGeometry(2, 1.6, 0.05), wm, G, [x, 4.6, 40.97]);
  mesh(new THREE.BoxGeometry(60.4, 0.4, 12.4), M('#5a5654'), G, [-4, 7.2, 47]); mesh(new THREE.BoxGeometry(8, 2, 6), M('#8a8680'), G, [-2, 8.4, 47]);
}
building(48, 12, 12, 14, 8, '#e6dccc', '#a2604a'); building(47, 30, 10, 10, 7, '#d8ccb8', '#a2604a'); building(48, -8, 12, 12, 9, '#7a4a3a', '#5a3a2a');

/* ---------- edificio dell'Happy Shopping ---------- */
const block = ctex(128, 128, (g, w, h) => { g.fillStyle = '#c4c3bf'; g.fillRect(0, 0, w, h); setSeed(95); for (let i = 0; i < 2600; i++) { const c = rnd(); g.fillStyle = c < 0.4 ? '#b0afab' : c < 0.8 ? '#d4d3cf' : '#9c9b97'; g.fillRect(rnd() * w, rnd() * h, 1 + rnd() * 2, 1 + rnd() * 2); } g.fillStyle = '#a8a7a3'; for (let y = 0; y < h; y += 32) g.fillRect(0, y, w, 2); for (let y = 0; y < h; y += 32) for (let x = ((y / 32) % 2) * 32; x < w; x += 64) g.fillRect(x, y, 2, 32); });
const blockM = (rx) => { const t = block.clone(); t.needsUpdate = true; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, 2.5); return texMat(t, { roughness: 0.95 }); };
const blue = M('#2f55b0', { roughness: 0.7 }), blueD = M('#22418a', { roughness: 0.7 }), white = M('#eceae4', { roughness: 0.9 });
function bwall(x, z, w, d, h = 6) { const m = mesh(new THREE.BoxGeometry(w, h, d), blockM(Math.max(w, d) / 3), G, [x, h / 2, z]); m.castShadow = m.receiveShadow = true; S(x, z, w, d, m, 7); return m; }
/* facciata con la porta tra x -8 e -2 */
bwall(-17, 0, 18, 0.5); bwall(12, 0, 28, 0.5); mesh(new THREE.BoxGeometry(6, 2.2, 0.5), blockM(2), G, [-5, 4.9, 0]);
bwall(-26, -16, 0.5, 32.5); bwall(26, -16, 0.5, 32.5); bwall(0, -32, 52.5, 0.5);
mesh(new THREE.BoxGeometry(53, 0.4, 32.6), M('#6a6662', { roughness: 0.95 }), G, [0, 6.2, -16]).castShadow = true;
/* fascia blu in basso e pannello blu con l'insegna */
for (const [x, w] of [[-17, 18], [12, 28]]) mesh(rbox(w, 1.1, 0.12, 0.03), blueD, G, [x, 0.55, 0.3]);
for (const z of [-8, -24]) for (const sd of [-1, 1]) mesh(rbox(0.12, 1.1, 14, 0.03), blueD, G, [sd * 26.3, 0.55, z]);
mesh(rbox(30, 2.2, 0.2, 0.05), blue, G, [-5, 5.0, 0.36]);
for (const x of [-20.2, 10.2]) mesh(rbox(0.6, 6.2, 0.3, 0.05), blue, G, [x, 3.1, 0.35]);
{
  const t = ctex(1024, 128, (g, w, h) => { g.fillStyle = '#2f55b0'; g.fillRect(0, 0, w, h); g.textBaseline = 'middle'; g.font = '900 100px Arial Black,Arial,sans-serif';
    const a = 'Happy ', b = 'SHOPPING'; const wa = g.measureText(a).width; g.font = '900 86px Arial Black,Arial,sans-serif'; const wb = g.measureText(b).width; const x0 = (w - wa - wb) / 2;
    g.font = '900 100px Arial Black,Arial,sans-serif'; g.fillStyle = '#0c1e48'; g.fillText(a, x0 + 5, h / 2 + 5); g.fillStyle = '#ffffff'; g.fillText(a, x0, h / 2);
    g.font = '900 86px Arial Black,Arial,sans-serif'; g.fillStyle = '#0c1e48'; g.fillText(b, x0 + wa + 5, h / 2 + 9); g.fillStyle = '#f2643a'; g.fillText(b, x0 + wa, h / 2 + 4); });
  plane(26, 3.2, new THREE.MeshStandardMaterial({ map: t, roughness: 0.5 }), G, [-5, 5.0, 0.47]);
  const strip = ctex(1024, 64, (g, w, h) => { g.fillStyle = '#f4f2ec'; g.fillRect(0, 0, w, h); g.fillStyle = '#2f55b0'; g.font = '700 40px Arial,sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('ABBIGLIAMENTO · CASALINGHI · ARTICOLI · CALZATURE · PELLETTERIA', w / 2, h / 2); });
  plane(26, 0.7, new THREE.MeshStandardMaterial({ map: strip, roughness: 0.6 }), G, [-5, 3.55, 0.47]);
}
/* ringhiera sul tetto */
const rail = M('#c8ccd2', { roughness: 0.3, metalness: 0.7 });
mesh(rbox(52, 0.06, 0.06, 0.02), rail, G, [0, 7.2, 0.1]); for (let x = -26; x <= 26; x += 1.3) mesh(new THREE.CylinderGeometry(0.025, 0.025, 1, 6), rail, G, [x, 6.7, 0.1]);
/* tettoia di vetro e metallo sopra l'ingresso */
mesh(rbox(20, 0.12, 4.6, 0.04), M('#9aa2aa', { roughness: 0.3, metalness: 0.6 }), G, [-7, 3.1, 2.5]);
mesh(rbox(19.4, 0.04, 4.2, 0.01), M('#bfd6e2', { roughness: 0.05, transparent: true, opacity: 0.45 }), G, [-7, 3.18, 2.5]);
for (const x of [-16.6, -10, -4, 2.6]) { mesh(new THREE.CylinderGeometry(0.07, 0.07, 3.1, 10), M('#6a7078', { roughness: 0.4, metalness: 0.6 }), G, [x, 1.55, 4.6]); S(x, 4.6, 0.3, 0.3); }
/* vetrine accanto alla porta */
const glassM = M('#6f9ab0', { roughness: 0.06, metalness: 0.2, transparent: true, opacity: 0.6 });
for (const x of [-13, -10.5]) mesh(rbox(2.2, 2.6, 0.1, 0.02), glassM, G, [x, 1.4, 0.32]);
/* porta d'ingresso: si compra per entrare */
export const hsDoor = new THREE.Group();
mesh(rbox(6, 3.8, 0.14, 0.03), M('#7fb2c8', { roughness: 0.06, metalness: 0.2, transparent: true, opacity: 0.7 }), hsDoor, [0, 1.9, 0]);
for (const x of [-2.2, 0, 2.2]) mesh(rbox(1.5, 0.3, 0.17, 0.04), M('#f2c14e', { roughness: 0.5 }), hsDoor, [x, 2.15, 0]);
mesh(rbox(0.06, 3.8, 0.18, 0.02), M('#dcdcdc', { metalness: 0.6, roughness: 0.3 }), hsDoor, [0, 1.9, 0]);
hsDoor.position.set(HS_DOOR.x, 0, HS_DOOR.z); scene.add(hsDoor);
export const hsDoorSolid = solid(HS_DOOR.x, HS_DOOR.z, HS_DOOR.w, 0.5, hsDoor.children[0]);
/* cassetta arancione, cestini, fioriere di cemento */
mesh(rbox(1.2, 1.9, 0.9, 0.05), M('#e8a020', { roughness: 0.6 }), G, [24.4, 0.95, 1.1]); S(24.4, 1.1, 1.2, 0.9);
for (const x of [-15, -1]) { mesh(new THREE.CylinderGeometry(0.32, 0.28, 0.9, 12), M('#5a5e64', { roughness: 0.6, metalness: 0.3 }), G, [x, 0.45, 3.9]); S(x, 3.9, 0.6, 0.6); }
mesh(rbox(2.4, 0.9, 0.9, 0.05), M('#d4d0c8', { roughness: 0.95 }), G, [6, 0.45, 3.6]); S(6, 3.6, 2.4, 0.9);

/* ---------- casetta dei carrelli e macchine ---------- */
mesh(rbox(6.4, 0.18, 3.2, 0.06), M('#2f55b0', { roughness: 0.6 }), G, [14, 2.6, 32]);
for (const x of [11.1, 16.9]) mesh(new THREE.CylinderGeometry(0.06, 0.06, 2.5, 8), M('#8a929a', { metalness: 0.6, roughness: 0.4 }), G, [x, 1.3, 33.2]);
mesh(rbox(6.2, 2.4, 0.06, 0.02), M('#bfd6e2', { roughness: 0.05, transparent: true, opacity: 0.4 }), G, [14, 1.3, 33.6]);
for (let i = 0; i < 5; i++) cart(G, 11.8 + i * 1.1, 32.2, 0, false, true); S(14, 32.2, 6, 2);
cart(G, -8, 12, 0.9, true, true); S(-8, 12, 1.15, 1.15); cart(G, 20, 9, 2.2, false, true); S(20, 9, 1, 1); cart(G, -22, 4, 1.4, true, true); S(-22, 4, 1.15, 1.15);
const CARC = ['#d23a4a', '#bfc4ca', '#34343e', '#3f7fc0', '#6a6e72'];
setSeed(96);
[[-27, 14], [-12, 14], [-3, 14], [9, 14], [24, 14], [-27, 28.5], [-6, 28.5], [3, 28.5], [24, 28.5], [30, 28.5]].forEach(([x, z], k) => {
  if (rnd() < 0.25) return; makeCar(OX + x, z + rnd() * 0.4, (rnd() < 0.5 ? 0 : Math.PI) + (rnd() - 0.5) * 0.2, CARC[k % CARC.length], rnd() < 0.35);
});
makeCar(OX + 12, 23, Math.PI / 2 + 0.4, '#d23a4a', false); makeCar(OX - 2, 6, Math.PI / 2 - 0.25, '#2e2a28', true);
/* lampioni */
const pole = M('#3d4350', { roughness: 0.5, metalness: 0.5 });
for (const [x, z] of [[-24, 21], [0, 21], [24, 21]]) { mesh(new THREE.CylinderGeometry(0.09, 0.13, 6, 10), pole, G, [x, 3, z]); mesh(rbox(1.2, 0.14, 0.4, 0.06), pole, G, [x + 0.5, 5.95, z]); S(x, z, 0.4, 0.4); }
/* detriti */
const deb = [M('#6b6560'), M('#8a837b'), M('#a87a4a'), M('#d8d0c0'), M('#c84a5a'), M('#3a5ab0')]; setSeed(97);
for (let i = 0; i < 80; i++) mesh(rbox(0.12 + rnd() * 0.4, 0.04 + rnd() * 0.1, 0.12 + rnd() * 0.4, 0.02), deb[i % 6], G, [-32 + rnd() * 64, 0.05, 2 + rnd() * 31], [0, rnd() * 3, 0]);

/* ---------- easter egg: la Mercedes Classe C station wagon "albanese" con Damiano ---------- */
const MERC = { x: -20, z: 22 };
export const DAMIANO = { x: OX + MERC.x + 1.6, z: MERC.z + 0.4 };
{
  const C = new THREE.Group(); C.position.set(MERC.x, 0, MERC.z); G.add(C);
  const silver = M('#c4c8cc', { roughness: 0.3, metalness: 0.65 }), dark = M('#1a1c20', { roughness: 0.4, metalness: 0.4 });
  const tint = M('#2a3a48', { roughness: 0.05, metalness: 0.3, transparent: true, opacity: 0.38 }), tire = M('#121214', { roughness: 0.9 }), rim = M('#a8b0b8', { roughness: 0.25, metalness: 0.85 });
  const body = mesh(rbox(1.84, 0.66, 4.75, 0.24), silver, C, [0, 0.62, 0]);
  mesh(rbox(1.62, 0.56, 3.0, 0.2), tint, C, [0, 1.18, -0.45]);
  mesh(rbox(1.64, 0.08, 2.85, 0.04), silver, C, [0, 1.48, -0.5]);
  for (const sx of [-0.72, 0.72]) mesh(rbox(0.06, 0.06, 2.8, 0.02), M('#d8dce2', { roughness: 0.2, metalness: 0.9 }), C, [sx, 1.54, -0.5]);
  for (const [sx, sz] of [[-0.8, 1.02], [0.8, 1.02], [-0.8, -1.9], [0.8, -1.9]]) mesh(rbox(0.06, 0.58, 0.08, 0.02), silver, C, [sx, 1.18, sz]);
  for (const sx of [-0.88, 0.88]) for (const sz of [-1.5, 1.45]) { mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.26, 18), tire, C, [sx, 0.34, sz], [0, 0, Math.PI / 2]); mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.27, 5), rim, C, [sx, 0.34, sz], [0, 0, Math.PI / 2]); }
  mesh(rbox(1.0, 0.32, 0.06, 0.04), dark, C, [0, 0.66, 2.37]);
  for (const sx of [-0.62, 0.62]) { mesh(rbox(0.42, 0.14, 0.05, 0.04), M('#fff4d0', { emissive: '#fff4d0', emissiveIntensity: 0.25 }), C, [sx, 0.76, 2.36]); mesh(rbox(0.36, 0.16, 0.05, 0.04), M('#b0202a'), C, [sx, 0.8, -2.36]); }
  /* l'aquila a due teste al posto della stella, sulla griglia, sul cofano e dietro */
  const eagle = ctex(128, 128, (g, w) => {
    g.fillStyle = '#c8102e'; g.beginPath(); g.arc(64, 64, 62, 0, Math.PI * 2); g.fill(); g.strokeStyle = '#d8dce2'; g.lineWidth = 6; g.stroke();
    g.fillStyle = '#111'; g.beginPath(); g.ellipse(64, 70, 12, 26, 0, 0, Math.PI * 2); g.fill();
    for (const sd of [-1, 1]) {
      g.beginPath(); g.moveTo(64 + sd * 8, 56); for (let k = 0; k <= 5; k++) { const a = -0.2 - k * 0.22; g.lineTo(64 + sd * (30 + k * 3) * Math.cos(a) * 1.25, 60 + (30 + k * 3) * Math.sin(a)); g.lineTo(64 + sd * (24 + k * 3) * Math.cos(a + 0.1) * 1.2, 66 + (24 + k * 3) * Math.sin(a + 0.1)); } g.lineTo(64 + sd * 10, 82); g.fill();
      g.beginPath(); g.ellipse(64 + sd * 12, 34, 7, 6, 0, 0, Math.PI * 2); g.fill(); g.beginPath(); g.moveTo(64 + sd * 17, 31); g.lineTo(64 + sd * 26, 35); g.lineTo(64 + sd * 17, 38); g.fill();
      g.beginPath(); g.moveTo(64 + sd * 4, 92); g.lineTo(64 + sd * 16, 112); g.lineTo(64 + sd * 2, 100); g.fill();
    }
    g.beginPath(); g.moveTo(56, 94); g.lineTo(64, 116); g.lineTo(72, 94); g.fill();
  });
  const em = new THREE.MeshStandardMaterial({ map: eagle, roughness: 0.3, metalness: 0.2 });
  mesh(new THREE.CircleGeometry(0.15, 24), em, C, [0, 0.68, 2.41]); mesh(new THREE.CircleGeometry(0.11, 24), em, C, [0, 0.96, -2.38], [0, Math.PI, 0]);
  mesh(new THREE.CircleGeometry(0.07, 20), em, C, [0, 0.965, 2.0], [-Math.PI / 2 + 0.2, 0, 0]);
  /* targa */
  const plate = ctex(128, 32, (g, w, h) => { g.fillStyle = '#f2f2f2'; g.fillRect(0, 0, w, h); g.fillStyle = '#2a3a8a'; g.fillRect(0, 0, 14, h); g.fillStyle = '#111'; g.font = '700 22px Arial,sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('AL 044 DD', 70, 17); });
  mesh(new THREE.PlaneGeometry(0.52, 0.12), new THREE.MeshStandardMaterial({ map: plate, roughness: 0.5 }), C, [0, 0.45, 2.42]);
  C.traverse(m => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } });
  S(MERC.x, MERC.z, 1.95, 4.8, body);
  /* Damiano seduto al posto di guida, finestrino giu' */
  const D = buildHuman(DAMIANO_MODEL); const P = D.userData.P;
  P.legL.rotation.x = P.legR.rotation.x = -1.45; P.armL.rotation.x = P.armR.rotation.x = -1.15; P.head.rotation.y = 0.5;
  D.position.set(0.42, -0.42, 0.2); C.add(D);
  /* fumetto sopra la macchina */
  const bub = ctex(256, 128, (g, w, h) => { g.fillStyle = '#ffffff'; g.beginPath(); g.roundRect(6, 6, w - 12, h - 34, 22); g.fill(); g.beginPath(); g.moveTo(90, h - 30); g.lineTo(110, h - 4); g.lineTo(124, h - 30); g.fill(); g.fillStyle = '#111'; g.font = '900 54px Arial Black,Arial,sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('...', w / 2, 46); });
  const bubM = new THREE.SpriteMaterial({ map: bub, transparent: true }); const sp = new THREE.Sprite(bubM); sp.scale.set(1.4, 0.7, 1); sp.position.set(0.4, 2.3, 0.3); C.add(sp);
}

/* ---------- interno: bazar con un po' di tutto ---------- */
const tilesT = ctex(256, 256, (g, w, h) => { g.fillStyle = '#b8b8b6'; g.fillRect(0, 0, w, h); setSeed(98); for (let y = 0; y < h; y += 64) for (let x = 0; x < w; x += 64) { const v = 178 + Math.floor(rnd() * 16); g.fillStyle = `rgb(${v},${v},${v - 2})`; g.fillRect(x + 1, y + 1, 62, 62); } g.fillStyle = 'rgba(70,60,50,.22)'; for (let i = 0; i < 50; i++) g.fillRect(rnd() * w, rnd() * h, 3 + rnd() * 12, 2 + rnd() * 6); }, 26, 16);
flat(plane(52, 32, texMat(tilesT, { roughness: 0.5 }), G, [0, 0.012, -16], [-Math.PI / 2, 0, 0]));
plane(52, 32, M('#e8e8e6', { roughness: 0.95 }), G, [0, 5.4, -16], [Math.PI / 2, 0, 0]);
const paint = M('#d8d6d0', { roughness: 0.95 });
plane(51.4, 5.4, paint, G, [0, 2.7, -31.74]); plane(31.4, 5.4, paint, G, [-25.74, 2.7, -16], [0, Math.PI / 2, 0]); plane(31.4, 5.4, paint, G, [25.74, 2.7, -16], [0, -Math.PI / 2, 0]);
for (const [x, w] of [[-17, 17.6], [12, 27.6]]) plane(w, 5.4, paint, G, [x, 2.7, -0.26], [0, Math.PI, 0]);
plane(6, 1.6, paint, G, [-5, 4.6, -0.26], [0, Math.PI, 0]);
/* binari neri con i faretti, pannelli che sfarfallano */
const track = M('#141416', { roughness: 0.5 }), spot = M('#fff8ea', { emissive: '#fff4e0', emissiveIntensity: 0.9 }), spotOff = M('#3a3a3e');
setSeed(99);
for (let z = -4; z >= -30; z -= 6.5) { mesh(rbox(48, 0.08, 0.12, 0.02), track, G, [0, 5.32, z]); for (let x = -22; x <= 22; x += 4) { mesh(new THREE.CylinderGeometry(0.09, 0.07, 0.24, 10), rnd() < 0.22 ? spotOff : spot, G, [x, 5.18, z]); } }
for (let x = -20; x <= 20; x += 13) mesh(rbox(0.1, 0.06, 26, 0.02), track, G, [x, 5.34, -16]);
const hsLights = [];
for (const [x, z, f] of [[-14, -10, 0], [12, -9, 1], [-6, -24, 0], [16, -25, 0]]) { const l = new THREE.PointLight('#f2f4ff', 0.75, 30, 1.5); l.position.set(OX + x, 4.9, z); l.userData.hs = 1; scene.add(l); hsLights.push({ l, f }); }
export function updateHS(t) { for (const s of hsLights) if (s.f) s.l.intensity = Math.sin(t * 13) + Math.sin(t * 3.1) > -0.6 ? 0.75 : 0.1; }
/* cartelli dei reparti */
function dept(text, bgc, x, z, w, rotY = 0) { plane(w, 0.9, new THREE.MeshStandardMaterial({ map: label(text, { font: '700 60px Arial,sans-serif', bg: bgc, w: 512, h: 96, shadow: null }), roughness: 0.6 }), G, [x, 4.2, z], [0, rotY, 0]); }
dept('Abbigliamento', '#2f55b0', -15, -31.7, 7); dept('Intimo', '#c8304a', -5, -31.7, 5); dept('Scuola', '#7a3ab0', 2, -16, 4, Math.PI / 2); dept('Casalinghi', '#d0702a', 25.7, -9, 6, -Math.PI / 2);
/* tutte le cose piccole colorate in un'unica mesh istanziata */
const items = []; const itemBox = (x, y, z, w, h, d, c, ry = 0) => items.push([x, y, z, w, h, d, c, ry]);
const CLOTH = ['#1a1a1d', '#c8302a', '#3a5ab0', '#e8e4da', '#6a6e74', '#8a3a5a', '#2a4a3a', '#d8b040', '#5a3a2a', '#e88aa8'];
const shelfM = M('#e6e6e8', { roughness: 0.5, metalness: 0.2 }), shelfD = M('#9aa0a8', { roughness: 0.4, metalness: 0.5 });
function gondola(x, z, len, along, cols) {
  /* along: true = corre lungo z */
  const w = along ? 1.3 : len, d = along ? len : 1.3;
  mesh(rbox(along ? 0.1 : len, 2.2, along ? len : 0.1, 0.02), shelfD, G, [x, 1.1, z]);
  for (const y of [0.2, 0.75, 1.3, 1.85]) mesh(rbox(w, 0.04, d, 0.01), shelfM, G, [x, y, z]);
  for (const y of [0.25, 0.8, 1.35, 1.9]) for (let k = -len / 2 + 0.3; k < len / 2 - 0.2; k += 0.32) for (const sd of [-1, 1]) {
    if (rnd() < 0.18) continue; const c = cols[Math.floor(rnd() * cols.length)], hh = 0.15 + rnd() * 0.3;
    if (along) itemBox(x + sd * 0.38, y + hh / 2, z + k, 0.42, hh, 0.26, c); else itemBox(x + k, y + hh / 2, z + sd * 0.38, 0.26, hh, 0.42, c);
  }
  S(x, z, w, d, true, 2.4);
}
setSeed(100);
/* scuola e cartoleria: corsie al centro */
const SCHOOL = ['#a87ad8', '#d88ab8', '#1a1a1d', '#5ab0ff', '#f2c14e', '#e84b3c', '#6cc28a', '#f4f2ec'];
for (const x of [3, 9]) gondola(x, -13, 8, true, SCHOOL);
/* zaini sulle testate */
for (const [x, z] of [[3, -8.6], [9, -8.6]]) { S(x, z + 0.15, 1.3, 0.5, true, 2.4); mesh(rbox(1.3, 2.4, 0.2, 0.03), M('#5a3a8a', { roughness: 0.7 }), G, [x, 1.2, z]); for (let k = 0; k < 4; k++) { const c = ['#a87ad8', '#c8a0e8', '#1a1a1d', '#d88ab8'][k]; mesh(rbox(0.42, 0.55, 0.22, 0.08), M(c, { roughness: 0.8 }), G, [x - 0.45 + (k % 2) * 0.9, 1.75 - Math.floor(k / 2) * 0.75, z + 0.2]); } }
/* casalinghi: scaffali sul muro est con pentole e piatti */
const potM = M('#c8ccd2', { roughness: 0.25, metalness: 0.8 }), plateM = M('#f4f2ec', { roughness: 0.4 });
for (const [z0, z1] of [[-3, -13.5], [-20.5, -30.5]]) {
  const zc = (z0 + z1) / 2, L = z0 - z1; mesh(rbox(0.7, 2.4, L, 0.02), shelfD, G, [25.3, 1.2, zc]); S(25.2, zc, 0.9, L, true, 2.4);
  for (const y of [0.5, 1.1, 1.7]) { mesh(rbox(0.9, 0.04, L, 0.01), shelfM, G, [24.95, y, zc]); for (let z = z1 + 0.4; z < z0 - 0.3; z += 0.55) { if (rnd() < 0.2) continue; if (rnd() < 0.5) mesh(new THREE.CylinderGeometry(0.2, 0.18, 0.22, 14), potM, G, [24.85, y + 0.13, z]); else mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.12, 16), plateM, G, [24.85, y + 0.08, z]); } }
}
/* intimo e pantofole: parete di fondo a sinistra */
const INT = ['#c8302a', '#e8e4da', '#1a1a1d', '#e88aa8', '#a8c8e8', '#f4f2ec', '#d8d0c8'];
mesh(rbox(20, 2.6, 0.5, 0.02), shelfD, G, [-14.5, 1.3, -31.4]); S(-14.5, -31.3, 20, 0.8, true, 2.6);
for (const y of [0.4, 0.95, 1.5, 2.05]) { mesh(rbox(20, 0.04, 0.7, 0.01), shelfM, G, [-14.5, y, -31.1]); for (let x = -24.2; x < -4.8; x += 0.36) { if (rnd() < 0.12) continue; itemBox(x, y + 0.12, -31.0, 0.3, 0.2 + rnd() * 0.08, 0.32, INT[Math.floor(rnd() * INT.length)]); } }
/* abbigliamento: tavoli tondi neri con i jeans piegati e stender con i vestiti */
const tblM = M('#1c1c1f', { roughness: 0.6 });
for (const [x, z] of [[-18, -8], [-10, -9], [-18, -18], [-10, -20]]) {
  mesh(new THREE.CylinderGeometry(1.3, 1.3, 0.08, 28), tblM, G, [x, 0.8, z]); for (const a of [0, 2.1, 4.2]) mesh(rbox(0.08, 0.8, 0.08, 0.02), tblM, G, [x + Math.cos(a) * 0.9, 0.4, z + Math.sin(a) * 0.9]); S(x, z, 2.4, 2.4, true, 1.2);
  for (let k = 0; k < 7; k++) { const a = k / 7 * Math.PI * 2; for (let j = 0; j < 4; j++) itemBox(x + Math.cos(a) * 0.8, 0.88 + j * 0.06, z + Math.sin(a) * 0.8, 0.45, 0.05, 0.35, rnd() < 0.6 ? ['#3a5a8a', '#2a3a5a', '#5a7aa8'][j % 3] : CLOTH[Math.floor(rnd() * 10)], a); }
}
function rack(x, z, len, along) {
  const pipe = M('#c8ccd2', { roughness: 0.3, metalness: 0.8 });
  for (const s of [-1, 1]) mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.6, 8), pipe, G, along ? [x, 0.8, z + s * len / 2] : [x + s * len / 2, 0.8, z]);
  mesh(new THREE.CylinderGeometry(0.025, 0.025, len, 8), pipe, G, [x, 1.6, z], along ? [Math.PI / 2, 0, 0] : [0, 0, Math.PI / 2]);
  for (let k = -len / 2 + 0.15; k < len / 2 - 0.1; k += 0.12) { if (rnd() < 0.15) continue; const c = CLOTH[Math.floor(rnd() * 10)], hh = 0.6 + rnd() * 0.5; if (along) itemBox(x, 1.58 - hh / 2, z + k, 0.5, hh, 0.05, c); else itemBox(x + k, 1.58 - hh / 2, z, 0.05, hh, 0.5, c); }
  S(x, z, along ? 0.7 : len, along ? len : 0.7, true, 1.7);
}
rack(-22.5, -13, 6, true); rack(-14, -13.5, 5, false); rack(-6, -14, 6, true); rack(-14, -26, 7, false); rack(-22, -26, 5, true);
/* manichini */
const manM = M('#f2f0ec', { roughness: 0.45 });
for (const [x, z, c] of [[-20.5, -4.5, '#c8302a'], [-7.5, -4, '#1a1a1d'], [-4, -25, '#e8c040']]) {
  const m = new THREE.Group(); mesh(new THREE.CylinderGeometry(0.25, 0.3, 0.06, 16), manM, m, [0, 0.03, 0]); mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.9, 8), manM, m, [0, 0.5, 0]);
  mesh(rbox(0.42, 0.6, 0.24, 0.1), M(c, { roughness: 0.85 }), m, [0, 1.25, 0]); mesh(sph(0.12, 14, 10), manM, m, [0, 1.72, 0]); mesh(rbox(0.36, 0.5, 0.2, 0.08), M(c, { roughness: 0.85 }), m, [0, 0.82, 0]);
  m.position.set(x, 0, z); G.add(m); S(x, z, 0.6, 0.6, true, 1.9);
}
/* casse vicino all'ingresso */
for (const x of [5, 11]) { mesh(rbox(1.0, 1.0, 3.2, 0.04), M('#2f55b0', { roughness: 0.6 }), G, [x, 0.5, -3.6]); mesh(rbox(1.1, 0.06, 3.3, 0.02), M('#d8dce2', { roughness: 0.3, metalness: 0.5 }), G, [x, 1.02, -3.6]); mesh(rbox(0.4, 0.3, 0.3, 0.04), M('#2a2c30'), G, [x, 1.2, -4.4]); S(x, -3.6, 1.1, 3.3, true, 1.2); }
/* porta del magazzino in fondo: da qui esce il Capo */
mesh(rbox(3.6, 3.4, 0.12, 0.03), M('#7a8088', { roughness: 0.4, metalness: 0.6 }), G, [9, 1.7, -31.66]);
mesh(rbox(0.05, 3.4, 0.14, 0.01), M('#3a3e44'), G, [9, 1.7, -31.6]);
plane(3.2, 0.7, new THREE.MeshStandardMaterial({ map: label('MAGAZZINO', { font: '900 70px Arial Black,Arial,sans-serif', bg: '#c8302a', w: 512, h: 96, shadow: null }), roughness: 0.6 }), G, [9, 3.8, -31.7]);
/* caos: vestiti per terra, scaffale caduto, carrelli rovesciati */
setSeed(101);
for (let i = 0; i < 70; i++) itemBox(-24 + rnd() * 48, 0.03, -2 - rnd() * 28, 0.3 + rnd() * 0.4, 0.04, 0.25 + rnd() * 0.4, CLOTH[Math.floor(rnd() * 10)], rnd() * 3);
{ const f = mesh(rbox(5, 0.2, 1.3, 0.03), shelfD, G, [18, 0.25, -13], [0, 0.4, 0.05]); for (let k = 0; k < 14; k++) itemBox(16 + rnd() * 4, 0.1, -14.5 + rnd() * 3, 0.42, 0.2, 0.26, SCHOOL[k % 8], rnd() * 3); S(18, -13, 4.8, 2.4, f, 0.6); }
cart(G, 15, -6, 0.6, true, true); S(15, -6, 1.15, 1.15); cart(G, -2, -12, 2.4, false, true); S(-2, -12, 1, 1);

/* costruzione dell'unica mesh istanziata */
{
  const inst = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial({ roughness: 0.85 }), items.length);
  const d = new THREE.Object3D(), col = new THREE.Color();
  items.forEach(([x, y, z, w, h, dd, c, ry], i) => { d.position.set(x, y, z); d.rotation.set(0, ry, 0); d.scale.set(w, h, dd); d.updateMatrix(); inst.setMatrixAt(i, d.matrix); inst.setColorAt(i, col.set(c)); });
  inst.castShadow = true; inst.receiveShadow = true; G.add(inst);
}

/* ---------- luce e nebbia del mondo attivo ---------- */
let pointLights = null;
export function applyWorldLook(w) {
  if (!pointLights) { pointLights = []; scene.traverse(o => { if (o.isPointLight && !o.userData.fx) pointLights.push(o); }); }
  for (const l of pointLights) l.visible = w === 2 ? !!l.userData.hs : !l.userData.hs;
  if (w === 2) {
    sun.position.set(OX - 25, 48, 30); sun.target.position.set(OX, 0, 0); sun.color.set('#fff0d8'); sun.intensity = 2.3;
    hemi.color.set('#e2e8f0'); hemi.groundColor.set('#4a4642'); hemi.intensity = 0.95;
    scene.fog.color.set('#b8b6ac'); scene.fog.near = 40; scene.fog.far = 120; scene.background.set('#b8b6ac');
  } else {
    sun.position.set(-30, 40, 25); sun.target.position.set(0, 0, 0); sun.color.set('#ffcf9a'); sun.intensity = 2.2;
    hemi.color.set('#ffd9b8'); hemi.groundColor.set('#4a3a40'); hemi.intensity = 1.0;
    scene.fog.color.set('#c98a6a'); scene.fog.near = 35; scene.fog.far = 110; scene.background.set('#c27a52');
  }
  sun.target.updateMatrixWorld();
}
