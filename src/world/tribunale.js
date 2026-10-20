/* Mondo 3: il Tribunale di Busto Arsizio.
   Parcheggio (Fab La Rue) -> strada bloccata -> piazza con i tavolini (Well e Fabio Regaglia)
   -> garage di Pika (gli amici in gabbia) -> ascensore -> casa di Pika.
   Tutto il mondo sta lontano dagli altri (x = +400) cosi' le mappe non si vedono mai. */
import * as THREE from 'three';
import { scene, solid } from '../render/engine.js';
import { M, rbox, mesh, sph, ctex, texMat, label, plane, rnd, setSeed } from './kit.js';
import { makeCar } from './parking.js';
import { buildHuman } from '../characters/styled.js';

export const TX = 400;
const G = new THREE.Group(); G.position.x = TX; scene.add(G);
const S = (x, z, w, d, m, h) => solid(TX + x, z, w, d, m, h);
const flat = m => { m.castShadow = false; m.receiveShadow = true; return m; };

/* ---------- confini e zone ---------- */
export const TRB = { x1: TX - 36, x2: TX + 36, z1: -58, z2: 36 };
export const CASA = { x1: TX + 96, x2: TX + 124, z1: -16, z2: 0, ceil: 3.4 };
export const GARAGE = { x1: TX + 4.3, x2: TX + 35.7, z1: -57.7, z2: -30.3, ceil: 4.2 };
export const inTR = p => p.x > 200;
export const inCasa = p => p.x > TX + 80;
export const inGarage = p => p.x > 200 && p.x < TX + 60 && p.z < -30.2 && p.x > TX + 4;
export const trRegion = p => (inCasa(p) ? 'trcasa' : inGarage(p) ? 'trgarage' : p.z < 6 ? 'trpiazza' : 'trpark');
export const TR_ORDER = { trpark: 0, trpiazza: 1, trgarage: 2, trcasa: 3 };
/* passaggi tra le zone: la strada bloccata e la saracinesca del garage */
export const TR_GATE = { x: TX, z: 6, w: 8 };
export const TR_GDOOR = { x: TX + 20, z: -30, w: 6 };
export const TR_START = { x: TX - 6, z: 27, yaw: 0 };
export const FAB_SPOT3 = { x: TX + 22, z: 14 };
export const WELL_SPOT = { x: TX - 14, z: -22 };
export const FABIO_SPOT = { x: TX + 12, z: -24 };
export const PIKA_SPOT_G = { x: TX + 20, z: -50 };
export const PIKA_SPOT_C = { x: TX + 116, z: -10 };
export const LIFT = { x: TX + 32.5, z: -54.5 };
export const CASA_START = { x: TX + 99.5, z: -3, yaw: -1.25 };
export const TR_SPAWNS = {
  trpark: [[-33, 33], [-12, 34], [10, 34], [33, 33], [34, 20], [-34, 20], [-34, 10], [34, 10]].map(([x, z]) => [TX + x, z]),
  trpiazza: [[-34, 3], [34, 3], [-34, -12], [34, -14], [-30, -27], [30, -27]].map(([x, z]) => [TX + x, z]),
  trgarage: [[6, -56], [34, -33], [6, -33], [28, -56], [20, -44]].map(([x, z]) => [TX + x, z]),
  trcasa: [[98, -14], [122, -2], [110, -14], [122, -14]].map(([x, z]) => [TX + x, z]),
};
/* armi al muro del mondo 3 */
export const TR_BUYS = [
  { id: 'pistola', cost: 400, ammoCost: 200, x: TX - 35.6, z: 24, rot: Math.PI / 2, zone: 'tr-parcheggio' },
  { id: 'pompa', cost: 2500, ammoCost: 1200, x: TX + 35.6, z: 22, rot: -Math.PI / 2, zone: 'tr-parcheggio' },
  { id: 'ak47', cost: 5000, ammoCost: 2500, x: TX - 35.6, z: -8, rot: Math.PI / 2, zone: 'tr-piazza' },
  { id: 'bazooka', cost: 5000, ammoCost: 3000, x: TX + 12, z: -57.6, rot: 0, zone: 'tr-garage' },
];

/* ---------- cielo: nuvoloso e verdognolo, come se il maleficio fosse nell'aria ---------- */
{
  const t = ctex(4, 256, (g) => { const gr = g.createLinearGradient(0, 0, 0, 256);
    gr.addColorStop(0, '#3e4a52'); gr.addColorStop(0.45, '#7a8a84'); gr.addColorStop(0.6, '#a4ac94'); gr.addColorStop(0.7, '#8a8a76'); gr.addColorStop(1, '#3a3a34'); g.fillStyle = gr; g.fillRect(0, 0, 4, 256); });
  mesh(new THREE.SphereGeometry(150, 32, 16), new THREE.MeshBasicMaterial({ map: t, side: THREE.BackSide, fog: false }), G);
}

/* ---------- parcheggio (sud) ---------- */
const asph = ctex(256, 256, (g, w, h) => { g.fillStyle = '#4a4a4c'; g.fillRect(0, 0, w, h); setSeed(301); for (let i = 0; i < 3000; i++) { const v = 60 + Math.floor(rnd() * 30); g.fillStyle = `rgb(${v},${v},${v + 2})`; g.fillRect(rnd() * w, rnd() * h, 1, 1); } }, 12, 6);
flat(plane(72, 30, texMat(asph, { roughness: 0.95 }), G, [0, 0.005, 21], [-Math.PI / 2, 0, 0]));
const lineM = M('#e8e4d8', { roughness: 0.9, transparent: true, opacity: 0.7 });
for (let x = -32; x <= 32; x += 3.2) { if (Math.abs(x) < 6) continue; flat(plane(0.1, 5, lineM, G, [x, 0.01, 31], [-Math.PI / 2, 0, 0])); flat(plane(0.1, 5, lineM, G, [x, 0.01, 15], [-Math.PI / 2, 0, 0])); }
for (let z = 9; z < 35; z += 3) flat(plane(0.14, 1.6, M('#e0c040', { roughness: 0.8 }), G, [0, 0.011, z], [-Math.PI / 2, 0, 0]));
/* muri di confine */
const conc = M('#9c9a92', { roughness: 0.95 });
function cwall(x, z, w, d, h = 2.4) { const m = mesh(new THREE.BoxGeometry(w, h, d), conc, G, [x, h / 2, z]); m.castShadow = m.receiveShadow = true; S(x, z, w, d, m, 4); return m; }
cwall(0, 36.25, 73, 0.5); cwall(-36.25, 10, 0.5, 53); cwall(36.25, 10, 0.5, 53);
/* macchine parcheggiate (qualcuna bruciata) */
setSeed(302); const CARC = ['#9aa4ae', '#2a3a5a', '#7a1e22', '#d8d4cc', '#3a3a3e', '#4a6a3a'];
for (const z of [31, 15]) for (let x = -30.4; x <= 30; x += 3.2) { if (Math.abs(x) < 6 || rnd() < 0.3) continue; makeCar(TX + x + 1.6, z + (rnd() - 0.5) * 0.4, (rnd() < 0.5 ? 0 : Math.PI) + (rnd() - 0.5) * 0.2, CARC[Math.floor(rnd() * CARC.length)], rnd() < 0.3); }
/* la macchina di Libe con cui siete arrivati, ancora con gli sportelli aperti */
makeCar(TX - 6, 24, 0.15, '#c8b060', false);
/* lampioni */
const pole = M('#3a3e44', { roughness: 0.5, metalness: 0.5 });
for (const [x, z] of [[-24, 23], [24, 23], [-24, 8], [24, 8]]) { mesh(new THREE.CylinderGeometry(0.09, 0.13, 6, 10), pole, G, [x, 3, z]); mesh(rbox(1.2, 0.14, 0.4, 0.06), pole, G, [x + 0.5, 5.95, z]); S(x, z, 0.3, 0.3); }

/* ---------- strada bloccata tra parcheggio e piazza ---------- */
const hedgeM = [M('#3f6a3a', { roughness: 0.95 }), M('#4f7d42', { roughness: 0.95 }), M('#355a32', { roughness: 0.95 })];
for (const sd of [-1, 1]) { cwall(sd * 20.5, 6, 31, 0.6, 1.2); setSeed(303 + sd); for (let x = 5; x < 36; x += 1.5) mesh(sph(0.9 + rnd() * 0.3, 8, 6), hedgeM[Math.floor(rnd() * 3)], G, [sd * x, 1.7, 6]); }
/* barricata: macchine di traverso, bidoni e transenne. Sparisce quando batti Fab La Rue */
export const trGate = new THREE.Group(); G.add(trGate);
{
  const stripe = ctex(64, 16, (g) => { for (let x = 0; x < 64; x += 16) { g.fillStyle = '#e8c040'; g.fillRect(x, 0, 8, 16); g.fillStyle = '#1a1a1a'; g.fillRect(x + 8, 0, 8, 16); } }, 4, 1);
  const sm = texMat(stripe, { roughness: 0.7 });
  for (const y of [0.5, 1.1]) mesh(rbox(8, 0.3, 0.12, 0.04), sm, trGate, [0, y, 6.4]);
  for (const x of [-3.6, 3.6]) mesh(new THREE.CylinderGeometry(0.08, 0.08, 1.3, 8), pole, trGate, [x, 0.65, 6.4]);
  const barrel = M('#a8401e', { roughness: 0.6, metalness: 0.3 });
  for (const [x, z] of [[-2.4, 5.2], [-1.4, 5.4], [1.8, 5.1], [2.8, 5.5]]) mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.95, 14), barrel, trGate, [x, 0.48, z]);
  const burnt = M('#2e2826', { roughness: 0.9 });
  mesh(rbox(4.2, 1.1, 1.9, 0.2), burnt, trGate, [0.3, 0.75, 4.6], [0, 0.35, 0]); mesh(rbox(2.4, 0.7, 1.7, 0.2), burnt, trGate, [0.1, 1.5, 4.6], [0, 0.35, 0]);
  trGate.traverse(o => { if (o.isMesh) o.castShadow = true; });
}
export const trGateSolid = S(0, 5.6, 8.2, 2.4, trGate.children[0], 2);

/* ---------- piazza con i tavolini (centro) ---------- */
const stone = ctex(256, 256, (g, w, h) => { g.fillStyle = '#b8b0a2'; g.fillRect(0, 0, w, h); setSeed(304);
  for (let y = 0; y < h; y += 32) for (let x = 0; x < w; x += 32) { const v = 168 + Math.floor(rnd() * 22); g.fillStyle = `rgb(${v},${v - 6},${v - 16})`; g.fillRect(x + 1, y + 1, 30, 30); } }, 14, 7);
flat(plane(72, 36.5, texMat(stone, { roughness: 0.9 }), G, [0, 0.006, -12.2], [-Math.PI / 2, 0, 0]));
cwall(-36.25, -12, 0.5, 36); cwall(36.25, -12, 0.5, 36);
/* tavolini con sedie e ombrelloni */
const tblM = M('#2e3238', { roughness: 0.4, metalness: 0.6 }), chairM = M('#5a3a26', { roughness: 0.7 });
const umb = [M('#b8302a', { roughness: 0.8, side: THREE.DoubleSide }), M('#e8e2d4', { roughness: 0.8, side: THREE.DoubleSide }), M('#2a5a3a', { roughness: 0.8, side: THREE.DoubleSide })];
setSeed(305);
for (const [x, z] of [[-26, -4], [-18, -2], [-10, -5], [-26, -14], [-18, -12], [-6, -14], [8, -4], [16, -6], [26, -3], [10, -15], [26, -14]]) {
  mesh(new THREE.CylinderGeometry(0.6, 0.6, 0.05, 20), tblM, G, [x, 0.78, z]); mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.78, 8), tblM, G, [x, 0.39, z]); mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.03, 14), tblM, G, [x, 0.02, z]);
  for (let k = 0; k < 3; k++) { const a = k * 2.1 + rnd(); const c = new THREE.Group(); mesh(rbox(0.42, 0.05, 0.42, 0.02), chairM, c, [0, 0.45, 0]); mesh(rbox(0.42, 0.4, 0.04, 0.02), chairM, c, [0, 0.68, -0.19]);
    for (const sx of [-0.16, 0.16]) for (const sz of [-0.16, 0.16]) mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.45, 6), tblM, c, [sx, 0.22, sz]);
    c.position.set(x + Math.cos(a) * 1.0, 0, z + Math.sin(a) * 1.0); c.rotation.y = -a + Math.PI / 2; if (rnd() < 0.25) { c.rotation.z = 1.4; c.position.y = 0.22; } G.add(c); }
  if (rnd() < 0.7) { mesh(new THREE.CylinderGeometry(0.035, 0.035, 2.4, 8), tblM, G, [x, 1.2, z]); mesh(new THREE.ConeGeometry(1.6, 0.6, 8, 1, true), umb[Math.floor(rnd() * 3)], G, [x, 2.5, z]); }
  S(x, z, 1.3, 1.3);
}
/* aiuole con alberi, panchine, fontana */
const trunk = M('#5a4030', { roughness: 0.9 });
for (const [x, z] of [[-31, 2], [31, 2], [-2, 0], [0, -20], [-31, -22], [31, -22]]) {
  mesh(rbox(2.4, 0.4, 2.4, 0.08), M('#8a8478', { roughness: 0.9 }), G, [x, 0.2, z]); mesh(new THREE.CylinderGeometry(0.18, 0.26, 3.4, 8), trunk, G, [x, 1.9, z]);
  for (let k = 0; k < 4; k++) mesh(new THREE.IcosahedronGeometry(1.3 + rnd() * 0.5, 1), hedgeM[k % 3], G, [x + (rnd() - 0.5) * 1.4, 4.2 + rnd(), z + (rnd() - 0.5) * 1.4]);
  S(x, z, 2.4, 2.4);
}
for (const [x, z, r] of [[-12, -22, 0], [12, -22, 0], [-20, 3, Math.PI / 2]]) { const b = new THREE.Group(); mesh(rbox(2.2, 0.08, 0.5, 0.02), chairM, b, [0, 0.45, 0]); mesh(rbox(2.2, 0.4, 0.06, 0.02), chairM, b, [0, 0.72, -0.22]); for (const sx of [-0.9, 0.9]) mesh(rbox(0.08, 0.45, 0.5, 0.02), tblM, b, [sx, 0.22, 0]); b.position.set(x, 0, z); b.rotation.y = r; G.add(b); S(x, z, r ? 0.6 : 2.3, r ? 2.3 : 0.6); }

/* ---------- il Tribunale: facciata con colonne (nord-ovest) e garage (nord-est) ---------- */
const marble = ctex(256, 256, (g, w, h) => { g.fillStyle = '#e4ded2'; g.fillRect(0, 0, w, h); setSeed(306); for (let i = 0; i < 40; i++) { g.strokeStyle = 'rgba(150,140,128,.25)'; g.beginPath(); g.moveTo(rnd() * w, rnd() * h); g.lineTo(rnd() * w, rnd() * h); g.stroke(); }
  g.fillStyle = 'rgba(120,110,96,.35)'; for (let y = 0; y < h; y += 32) g.fillRect(0, y, w, 1); }, 6, 2);
const marbleM = texMat(marble, { roughness: 0.6 }), marbleD = M('#c8c0b2', { roughness: 0.6 });
{
  /* corpo dell'edificio, pieno */
  const core = mesh(new THREE.BoxGeometry(40, 12, 28), marbleM, G, [-16, 6, -44]); core.receiveShadow = core.castShadow = true; S(-16, -44, 40.4, 28, core, 9);
  /* gradini e colonnato */
  for (let k = 0; k < 4; k++) mesh(rbox(30 - k * 1.2, 0.22, 3.2 - k * 0.7, 0.03), marbleD, G, [-16, 0.11 + k * 0.22, -27.2 - k * 0.35]);
  S(-16, -27.4, 30, 3.2);
  for (let x = -29; x <= -3; x += 3.7) { mesh(new THREE.CylinderGeometry(0.55, 0.62, 8.2, 18), marbleM, G, [x, 4.95, -29]).castShadow = true; mesh(rbox(1.5, 0.35, 1.5, 0.05), marbleD, G, [x, 9.1, -29]); }
  mesh(rbox(32, 1.2, 3.2, 0.1), marbleD, G, [-16, 9.8, -29.4]);
  const tri = new THREE.Shape(); tri.moveTo(-16.5, 0); tri.lineTo(16.5, 0); tri.lineTo(0, 4); tri.lineTo(-16.5, 0);
  mesh(new THREE.ExtrudeGeometry(tri, { depth: 2.6, bevelEnabled: false }), marbleM, G, [-16, 10.4, -31]);
  plane(16, 1.6, new THREE.MeshStandardMaterial({ map: label('TRIBUNALE', { font: '900 110px Georgia,serif', color: '#5a5040', shadow: null, w: 1024, h: 128 }), transparent: true, roughness: 0.6 }), G, [-16, 9.8, -27.75]);
  /* portone chiuso e finestre */
  mesh(rbox(4, 5.5, 0.2, 0.05), M('#4a3020', { roughness: 0.6 }), G, [-16, 2.75, -29.95]);
  const winM = M('#2a3440', { roughness: 0.2, metalness: 0.4 });
  for (let x = -34; x <= 2; x += 4.5) for (const y of [3, 7.5]) if (Math.abs(x + 16) > 3) mesh(rbox(1.4, 2.2, 0.1, 0.03), winM, G, [x, y, -29.96]);
  /* bandiere strappate */
  for (const x of [-31, -1]) { mesh(new THREE.CylinderGeometry(0.05, 0.05, 6, 8), pole, G, [x, 15, -32]); mesh(rbox(1.6, 1.0, 0.02, 0.01), M(x < -15 ? '#3a6a3a' : '#8a2a2a', { roughness: 0.9 }), G, [x + 0.85, 17.2, -32], [0, 0, -0.1]); }
}
/* blocco del garage: muri, tetto, insegna */
const gWall = M('#8a8478', { roughness: 0.95 });
function gwall(x, z, w, d, h = 5) { const m = mesh(new THREE.BoxGeometry(w, h, d), gWall, G, [x, h / 2, z]); m.castShadow = m.receiveShadow = true; S(x, z, w, d, m, 7); return m; }
gwall(10.5, -30, 13, 0.6); gwall(29.5, -30, 13, 0.6); mesh(new THREE.BoxGeometry(6, 0.8, 0.6), gWall, G, [20, 4.6, -30]);
gwall(4, -44, 0.6, 28.6); gwall(36, -44, 0.6, 28.6); gwall(20, -58, 32.6, 0.6);
mesh(new THREE.BoxGeometry(32.6, 0.4, 28.6), M('#5a5650', { roughness: 0.95 }), G, [20, 5.2, -44]).castShadow = true;
plane(10, 1.2, new THREE.MeshStandardMaterial({ map: label('GARAGE PIKA', { font: '900 100px Arial Black,Arial', color: '#e8c040', w: 1024, h: 128, bg: '#2a2c30' }), roughness: 0.6 }), G, [20, 4.6, -29.65]);
/* saracinesca del garage: si apre quando batti Fabio Regaglia */
export const trGDoor = new THREE.Group(); G.add(trGDoor);
{ const sar = ctex(64, 64, (g, w, h) => { g.fillStyle = '#9aa0a6'; g.fillRect(0, 0, w, h); g.fillStyle = '#7a8086'; for (let y = 0; y < h; y += 8) g.fillRect(0, y, w, 3); }, 3, 3);
  mesh(rbox(6, 4.2, 0.15, 0.02), texMat(sar, { roughness: 0.5, metalness: 0.5 }), trGDoor, [20, 2.1, -30]); }
export const trGDoorSolid = S(20, -30, 6, 0.6, trGDoor.children[0], 5);

/* ---------- dentro il garage ---------- */
flat(plane(31.4, 27.4, M('#5c5a56', { roughness: 0.9 }), G, [20, 0.008, -44], [-Math.PI / 2, 0, 0]));
for (let x = 8; x <= 32; x += 6) flat(plane(0.12, 27, M('#e0c040', { roughness: 0.8, transparent: true, opacity: 0.6 }), G, [x, 0.012, -44], [-Math.PI / 2, 0, 0]));
/* casse di sigarette di contrabbando, scaffali, una macchina coperta dal telo */
const crateM = M('#8a6a40', { roughness: 0.85 }), cartonM = [M('#f2f2ee', { roughness: 0.6 }), M('#c8302a', { roughness: 0.6 })];
setSeed(307);
for (const [x, z] of [[8, -36], [8, -40], [32, -38], [32, -42], [26, -34]]) {
  mesh(rbox(1.4, 1.0, 1.4, 0.05), crateM, G, [x, 0.5, z]); for (let k = 0; k < 6; k++) mesh(rbox(0.5, 0.12, 0.25, 0.02), cartonM[k % 2], G, [x - 0.3 + (k % 2) * 0.5, 1.06 + Math.floor(k / 2) * 0.12, z + (rnd() - 0.5) * 0.6]);
  S(x, z, 1.5, 1.5);
}
mesh(rbox(4.4, 1.5, 2.2, 0.4), M('#3a4a3a', { roughness: 0.95 }), G, [16, 0.75, -38]); S(16, -38, 4.4, 2.2);
/* gabbie degli amici prigionieri sul muro in fondo */
export const CAGES = [{ x: TX + 10, z: -55.4, model: 14, name: 'Leodessi' }, { x: TX + 18, z: -55.4, model: 17, name: 'Castelluccio' }, { x: TX + 26, z: -55.4, model: 16, name: 'Bulegato' }];
const barM = M('#5a5e64', { roughness: 0.35, metalness: 0.8 });
for (const c of CAGES) {
  const g = new THREE.Group(); g.position.set(c.x - TX, 0, c.z); G.add(g);
  mesh(rbox(2.6, 0.12, 2.6, 0.02), barM, g, [0, 0.06, 0]); mesh(rbox(2.6, 0.12, 2.6, 0.02), barM, g, [0, 2.84, 0]);
  const bars = new THREE.Group(); g.add(bars);
  for (let k = 0; k < 9; k++) { const t = -1.2 + k * 0.3; for (const [bx, bz] of [[t, 1.25], [t, -1.25], [1.25, t], [-1.25, t]]) mesh(new THREE.CylinderGeometry(0.03, 0.03, 2.8, 6), barM, bars, [bx, 1.42, bz]); }
  const who = buildHuman(c.model); who.rotation.y = 0; g.add(who); who.userData.P.armR.rotation.x = -0.4; who.userData.P.armL.rotation.x = -0.3;
  c.group = g; c.bars = bars; c.who = who; c.freed = false; c.solid = S(c.x - TX, c.z, 2.7, 2.7);
}
/* ascensore per la casa di Pika */
{ mesh(rbox(2.6, 3.4, 0.3, 0.05), M('#8a9098', { roughness: 0.3, metalness: 0.7 }), G, [32.5, 1.7, -57.6]); mesh(rbox(0.02, 3.2, 0.02, 0.01), M('#2a2c30'), G, [32.5, 1.7, -57.43]);
  plane(1.6, 0.4, new THREE.MeshStandardMaterial({ map: label('CASA', { font: '900 90px Arial Black,Arial', color: '#ff5a3a', w: 512, h: 128, bg: '#1a1a1e' }), roughness: 0.5 }), G, [32.5, 3.7, -57.44]); }
export const liftLed = mesh(sph(0.08, 8, 6), new THREE.MeshBasicMaterial({ color: '#ff3030' }), G, [34.1, 1.5, -57.4]);

/* ---------- casa di Pika (in alto, ci si arriva con l'ascensore) ---------- */
{
  const H = 3.4, wood = ctex(128, 128, (g, w, h) => { g.fillStyle = '#7a5a3c'; g.fillRect(0, 0, w, h); for (let y = 0; y < h; y += 16) { g.fillStyle = y % 32 ? '#6a4c32' : '#86643f'; g.fillRect(0, y, w, 15); } }, 8, 4);
  flat(plane(28, 16, texMat(wood, { roughness: 0.7 }), G, [110, 0.01, -8], [-Math.PI / 2, 0, 0]));
  const wallM = M('#6a4a5a', { roughness: 0.9 });
  const cw = (x, z, w, d) => { const m = mesh(new THREE.BoxGeometry(w, H, d), wallM, G, [x, H / 2, z]); m.receiveShadow = true; S(x, z, w, d, m, 5); };
  cw(110, -16.2, 28.4, 0.4); cw(110, 0.2, 28.4, 0.4); cw(95.8, -8, 0.4, 16.4); cw(124.2, -8, 0.4, 16.4);
  mesh(new THREE.BoxGeometry(28.4, 0.2, 16.4), M('#3a2a32', { roughness: 0.9 }), G, [110, H + 0.1, -8]);
  /* finestrone da cui scappa Loris */
  mesh(rbox(6, 2.2, 0.1, 0.02), M('#9ac0d0', { roughness: 0.05, transparent: true, opacity: 0.4 }), G, [116, 1.7, -16]);
  /* divano, tv, tappeto, trono di Pika e casse di sigarette */
  mesh(rbox(4, 0.5, 1.4, 0.15), M('#3a2a4a', { roughness: 0.8 }), G, [104, 0.4, -14]); mesh(rbox(4, 0.9, 0.4, 0.15), M('#3a2a4a', { roughness: 0.8 }), G, [104, 0.8, -14.6]); S(104, -14.3, 4, 1.6);
  mesh(rbox(2.6, 1.5, 0.1, 0.03), M('#111214', { roughness: 0.2 }), G, [104, 1.6, -0.4]);
  flat(mesh(new THREE.CircleGeometry(3, 28), M('#8a2a3a', { roughness: 0.95 }), G, [110, 0.02, -8], [-Math.PI / 2, 0, 0]));
  const gold = M('#c8a03a', { roughness: 0.3, metalness: 0.8 });
  mesh(rbox(1.4, 0.6, 1.2, 0.1), M('#4a1a2a', { roughness: 0.7 }), G, [119, 0.3, -12]); mesh(rbox(1.4, 2.2, 0.3, 0.1), gold, G, [119, 1.3, -12.7]); S(119, -12.2, 1.5, 1.6);
  for (const [x, z] of [[122, -3], [122, -5], [98.5, -12]]) { mesh(rbox(1.2, 1, 1.2, 0.05), crateM, G, [x, 0.5, z]); for (let k = 0; k < 4; k++) mesh(rbox(0.5, 0.12, 0.25, 0.02), cartonM[k % 2], G, [x - 0.25 + (k % 2) * 0.5, 1.06 + Math.floor(k / 2) * 0.12, z]); S(x, z, 1.3, 1.3); }
  mesh(rbox(2.6, 3.0, 0.3, 0.05), M('#8a9098', { roughness: 0.3, metalness: 0.7 }), G, [97.5, 1.5, 0.0]);
  const l1 = new THREE.PointLight('#ffb070', 0.9, 22, 1.5); l1.position.set(TX + 106, 3, -8); l1.userData.tr = 1; scene.add(l1);
  const l2 = new THREE.PointLight('#c060ff', 0.8, 18, 1.5); l2.position.set(TX + 118, 2.6, -11); l2.userData.tr = 1; scene.add(l2);
}
/* luci nel garage */
for (const [x, z] of [[12, -40], [28, -40], [20, -52]]) { const l = new THREE.PointLight('#f2e8d0', 0.75, 22, 1.5); l.position.set(TX + x, 3.9, z); l.userData.tr = 1; scene.add(l); }

export const LIBE_CAR = { x: TX - 6, z: 24 };
export function updateTR(t) { liftLed.scale.setScalar(1 + Math.sin(t * 6) * 0.15); }
