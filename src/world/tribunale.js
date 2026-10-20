/* Mondo 3: il Tribunale di Busto Arsizio.
   Parcheggio (Fab La Rue) -> strada bloccata -> piazza con i tavolini (Pierre e Fabio Regaglia)
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
  trpiazza: [[-34, -28], [-1, -28.5], [-20, -28.5], [34, -4], [-34, -4], [33, -18]].map(([x, z]) => [TX + x, z]),
  trgarage: [[6, -56], [34, -33], [6, -33], [28, -56], [20, -44]].map(([x, z]) => [TX + x, z]),
  trcasa: [[98, -14], [122, -2], [110, -14], [122, -14]].map(([x, z]) => [TX + x, z]),
};
/* armi al muro del mondo 3 */
export const TR_BUYS = [
  { id: 'pistola', cost: 400, ammoCost: 200, x: TX - 35.6, z: 24, rot: Math.PI / 2, zone: 'tr-parcheggio' },
  { id: 'pompauto', cost: 6000, ammoCost: 3000, x: TX + 35.6, z: 20, rot: -Math.PI / 2, zone: 'tr-parcheggio' },
  { id: 'ak47', cost: 5000, ammoCost: 2500, x: TX - 35.6, z: -10, rot: Math.PI / 2, zone: 'tr-piazza' },
  { id: 'mitragliatore', cost: 12000, ammoCost: 6000, x: TX - 30, z: -29.95, rot: 0, zone: 'tr-piazza' },
  { id: 'bazooka', cost: 5000, ammoCost: 3000, x: TX + 12, z: -57.6, rot: 0, zone: 'tr-garage' },
];

/* ---------- cielo: nuvoloso e verdognolo, come se il maleficio fosse nell'aria ---------- */
{
  const t = ctex(4, 256, (g) => { const gr = g.createLinearGradient(0, 0, 0, 256);
    gr.addColorStop(0, '#3e4a52'); gr.addColorStop(0.45, '#7a8a84'); gr.addColorStop(0.6, '#a4ac94'); gr.addColorStop(0.7, '#8a8a76'); gr.addColorStop(1, '#3a3a34'); g.fillStyle = gr; g.fillRect(0, 0, 4, 256); });
  mesh(new THREE.SphereGeometry(150, 32, 16), new THREE.MeshBasicMaterial({ map: t, side: THREE.BackSide, fog: false }), G);
}

/* ---------- parcheggio coperto (sud): un piano solo, buio, colonne di cemento, neon che sfarfallano ---------- */
const asph = ctex(256, 256, (g, w, h) => { g.fillStyle = '#3a3a3c'; g.fillRect(0, 0, w, h); setSeed(301); for (let i = 0; i < 3000; i++) { const v = 46 + Math.floor(rnd() * 26); g.fillStyle = `rgb(${v},${v},${v + 2})`; g.fillRect(rnd() * w, rnd() * h, 1, 1); } g.fillStyle = 'rgba(20,20,20,.35)'; for (let i = 0; i < 30; i++) g.fillRect(rnd() * w, rnd() * h, 10 + rnd() * 30, 2 + rnd() * 6); }, 12, 6);
flat(plane(72, 30, texMat(asph, { roughness: 0.95 }), G, [0, 0.005, 21], [-Math.PI / 2, 0, 0]));
const lineM = M('#d8d4c8', { roughness: 0.9, transparent: true, opacity: 0.6 });
for (let x = -32; x <= 32; x += 3.2) { if (Math.abs(x) < 6) continue; flat(plane(0.1, 5, lineM, G, [x, 0.01, 31], [-Math.PI / 2, 0, 0])); flat(plane(0.1, 5, lineM, G, [x, 0.01, 15], [-Math.PI / 2, 0, 0])); }
for (let z = 9; z < 35; z += 3) flat(plane(0.14, 1.6, M('#e0c040', { roughness: 0.8 }), G, [0, 0.011, z], [-Math.PI / 2, 0, 0]));
const conc = M('#8a8880', { roughness: 0.95 }), concD = M('#6a6862', { roughness: 0.95 });
function cwall(x, z, w, d, h = 2.4, m0 = conc) { const m = mesh(new THREE.BoxGeometry(w, h, d), m0, G, [x, h / 2, z]); m.castShadow = m.receiveShadow = true; S(x, z, w, d, m, 5); return m; }
/* muri pieni intorno e soffitto: copre tutto, il sole non entra */
cwall(0, 36.25, 73, 0.5, 4.4, concD); cwall(-36.25, 21, 0.5, 30.5, 4.4, concD); cwall(36.25, 21, 0.5, 30.5, 4.4, concD);
const ceil = mesh(new THREE.BoxGeometry(73, 0.5, 30.6), concD, G, [0, 4.45, 21]); ceil.castShadow = true; ceil.receiveShadow = true;
for (let z = 8; z <= 34; z += 6.5) mesh(rbox(73, 0.5, 0.5, 0.02), conc, G, [0, 4.0, z]);
/* colonne con la fascia gialla e nera e la scritta P1 */
const stripe = ctex(64, 16, (g) => { for (let x = 0; x < 64; x += 16) { g.fillStyle = '#e8c040'; g.fillRect(x, 0, 8, 16); g.fillStyle = '#1a1a1a'; g.fillRect(x + 8, 0, 8, 16); } }, 2, 1);
const stripeM = texMat(stripe, { roughness: 0.7 }), p1 = new THREE.MeshStandardMaterial({ map: label('P1', { font: '900 100px Arial Black,Arial', color: '#2a4a8a', w: 256, h: 128, bg: '#e8e4d8' }), roughness: 0.7 });
for (const x of [-27, -18, -9, 9, 18, 27]) for (const z of [8.5, 23]) {
  mesh(new THREE.BoxGeometry(0.8, 4.2, 0.8), conc, G, [x, 2.1, z]).castShadow = true; mesh(new THREE.BoxGeometry(0.84, 0.6, 0.84), stripeM, G, [x, 0.3, z]);
  plane(0.6, 0.3, p1, G, [x, 2.4, z + 0.41]); S(x, z, 0.85, 0.85, null);
}
/* macchine parcheggiate (qualcuna bruciata) */
setSeed(302); const CARC = ['#9aa4ae', '#2a3a5a', '#7a1e22', '#d8d4cc', '#3a3a3e', '#4a6a3a'];
for (const z of [31, 15]) for (let x = -30.4; x <= 30; x += 3.2) { if (Math.abs(x) < 6 || rnd() < 0.3) continue; makeCar(TX + x + 1.6, z + (rnd() - 0.5) * 0.4, (rnd() < 0.5 ? 0 : Math.PI) + (rnd() - 0.5) * 0.2, CARC[Math.floor(rnd() * CARC.length)], rnd() < 0.3); }
/* la macchina di Libe con cui siete arrivati */
makeCar(TX - 6, 24, 0.15, '#c8b060', false);
/* neon sul soffitto: luce fredda, qualcuno sfarfalla */
const tubeOn = new THREE.MeshBasicMaterial({ color: '#e8f4ff' }), tubeOff = M('#5a5e64', { roughness: 0.5 });
export const trNeons = [];
export const trFx = new THREE.Group(); G.add(trFx);
for (const [x, z, f] of [[-20, 20, 1], [20, 20, 0], [0, 28, 1]]) {
  const tube = mesh(rbox(2.2, 0.08, 0.2, 0.03), tubeOn, trFx, [x, 4.12, z]);
  const l = new THREE.PointLight('#cfe4ff', 1.1, 26, 1.4); l.position.set(TX + x, 3.6, z); l.userData.tr = 1; scene.add(l); trNeons.push({ l, tube, f });
}
for (const [x, z] of [[-30, 20], [30, 20], [-10, 32], [10, 8], [-10, 8], [10, 32], [-20, 12], [20, 12], [-20, 28], [20, 28]]) mesh(rbox(2.2, 0.08, 0.2, 0.03), Math.abs(x) === 30 ? tubeOff : tubeOn, G, [x, 4.12, z]);
/* facciata del Multipiano Volturno verso la strada: fascia salmone, fascia grigia e l'insegna blu */
const salmon = M('#e0a084', { roughness: 0.9 });
mesh(new THREE.BoxGeometry(73, 1.6, 0.5), salmon, G, [0, 5.3, 5.9]); mesh(new THREE.BoxGeometry(73, 0.8, 0.3), M('#c8c8c4', { roughness: 0.9 }), G, [0, 3.8, 5.95]);
for (const sd of [-1, 1]) mesh(new THREE.BoxGeometry(0.6, 6.1, 31), salmon, G, [sd * 36.8, 3.05, 21]);
const signT = ctex(1024, 128, (g, w, h) => { g.fillStyle = '#1e8ad8'; g.fillRect(0, 0, w, h); g.fillStyle = '#ffffff'; g.font = '900 80px Arial Black,Arial'; g.textBaseline = 'middle'; g.fillText('MULTIPIANO VOLTURNO', 190, h / 2);
  g.font = '700 26px Arial'; g.fillText('ENTRATA', 30, 40); g.fillText('PARK', 30, 72);
  for (const [cx, t] of [[880, '10'], [970, '2,00']]) { g.fillStyle = '#ffffff'; g.beginPath(); g.arc(cx, h / 2, 40, 0, Math.PI * 2); g.fill(); g.strokeStyle = '#d02020'; g.lineWidth = 9; g.stroke(); g.fillStyle = '#111'; g.font = '900 30px Arial'; g.textAlign = 'center'; g.fillText(t, cx, h / 2 + 2); g.textAlign = 'left'; } });
const signM = new THREE.MeshStandardMaterial({ map: signT, roughness: 0.6 });
plane(14, 1.75, signM, G, [-12, 3.8, 5.78], [0, Math.PI, 0]); plane(14, 1.75, signM, G, [-12, 3.8, 6.12]);
/* posti gialli a righe davanti all'ingresso */
const hatch = texMat(ctex(64, 64, (g, w, h) => { g.fillStyle = '#4a4a4c'; g.fillRect(0, 0, w, h); g.strokeStyle = '#e8c030'; g.lineWidth = 5; g.strokeRect(3, 3, w - 6, h - 6); for (let k = -64; k < 64; k += 16) { g.beginPath(); g.moveTo(k, 64); g.lineTo(k + 64, 0); g.stroke(); } }), { roughness: 0.9, transparent: true, opacity: 0.9 });
for (const x of [14, 18, 22]) flat(plane(3.2, 3.2, hatch, G, [x, 0.014, 3.6], [-Math.PI / 2, 0, 0]));
/* uscita nord del parcheggio: muretto e colonne, con il passaggio in mezzo */
for (const sd of [-1, 1]) { cwall(sd * 20.5, 6, 31, 0.6, 1.1); for (let x = 6; x <= 34; x += 7) { mesh(new THREE.BoxGeometry(0.8, 4.2, 0.8), conc, G, [sd * x, 2.1, 6]).castShadow = true; S(sd * x, 6, 0.85, 0.85); } }
const pole = M('#3a3e44', { roughness: 0.5, metalness: 0.5 });

/* ---------- la strada con le macchine in fiamme ---------- */
flat(plane(72, 6, texMat(asph, { roughness: 0.95 }), G, [0, 0.006, 3], [-Math.PI / 2, 0, 0]));
for (let x = -34; x <= 34; x += 5) flat(plane(2.4, 0.15, M('#e8e4d8', { roughness: 0.9 }), G, [x, 0.012, 3], [-Math.PI / 2, 0, 0]));
const fireM = [new THREE.MeshBasicMaterial({ color: '#ff7a1a', transparent: true, opacity: 0.85, depthWrite: false }), new THREE.MeshBasicMaterial({ color: '#ffd04a', transparent: true, opacity: 0.8, depthWrite: false })];
export const trFires = [];
function fire(parent, x, y, z, s = 1, lit = true) {
  const g = new THREE.Group(); g.position.set(x, y, z); parent.add(g);
  for (let k = 0; k < 5; k++) { const c = mesh(new THREE.ConeGeometry(0.25 * s, 0.9 * s, 7), fireM[k % 2], g, [(k - 2) * 0.22 * s, 0.4 * s, ((k * 7) % 3 - 1) * 0.15 * s]); c.castShadow = false; }
  let l = null; if (lit) { l = new THREE.PointLight('#ff8a3a', 1.2, 16, 1.6); l.position.set(TX + x, y + 1, z); l.userData.tr = 1; scene.add(l); } trFires.push({ g, l, ph: x * 1.7 + z });
  return g;
}
/* barricata: macchine in fiamme di traverso, bidoni e transenne. Sparisce quando batti Fab La Rue */
export const trGate = new THREE.Group(); G.add(trGate);
{
  const sm = texMat(stripe, { roughness: 0.7 });
  for (const y of [0.5, 1.1]) mesh(rbox(8, 0.3, 0.12, 0.04), sm, trGate, [0, y, 6.4]);
  for (const x of [-3.6, 3.6]) mesh(new THREE.CylinderGeometry(0.08, 0.08, 1.3, 8), pole, trGate, [x, 0.65, 6.4]);
  const barrel = M('#a8401e', { roughness: 0.6, metalness: 0.3 });
  for (const [x, z] of [[-2.4, 5.2], [-1.4, 5.4], [1.8, 5.1], [2.8, 5.5]]) mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.95, 14), barrel, trGate, [x, 0.48, z]);
  const burnt = M('#2e2826', { roughness: 0.9 });
  mesh(rbox(4.2, 1.1, 1.9, 0.2), burnt, trGate, [0.3, 0.75, 4.6], [0, 0.35, 0]); mesh(rbox(2.4, 0.7, 1.7, 0.2), burnt, trGate, [0.1, 1.5, 4.6], [0, 0.35, 0]);
  fire(trGate, 0.2, 1.8, 4.6, 1.3); fire(trGate, -2.2, 1.0, 5.2, 0.8, false);
  trGate.traverse(o => { if (o.isMesh && !fireM.includes(o.material)) o.castShadow = true; });
}
export const trGateSolid = S(0, 5.6, 8.2, 2.4, trGate.children[0], 2);
/* altre macchine bruciate lungo la strada, ancora in fiamme */
for (const [x, z, r, lit] of [[-14, 2.6, 1.4, 1], [15, 3.2, 1.8, 1], [-28, 3, 1.6, 0]]) { makeCar(TX + x, z, r, '#2e2826', true); fire(trFx, x, 1.6, z, 1, !!lit); }

/* ---------- piazza davanti al Tribunale ---------- */
const stone = ctex(256, 256, (g, w, h) => { g.fillStyle = '#a8a094'; g.fillRect(0, 0, w, h); setSeed(304);
  for (let y = 0; y < h; y += 32) for (let x = 0; x < w; x += 32) { const v = 150 + Math.floor(rnd() * 22); g.fillStyle = `rgb(${v},${v - 6},${v - 14})`; g.fillRect(x + 1, y + 1, 30, 30); } }, 14, 6);
flat(plane(72, 30, texMat(stone, { roughness: 0.9 }), G, [0, 0.006, -15], [-Math.PI / 2, 0, 0]));
cwall(-36.25, -15, 0.5, 30); cwall(36.25, -15, 0.5, 30);
const hedgeM = [M('#3f6a3a', { roughness: 0.95 }), M('#4f7d42', { roughness: 0.95 }), M('#355a32', { roughness: 0.95 })];
const trunk = M('#5a4030', { roughness: 0.9 });
setSeed(305);
for (const [x, z] of [[-28, -12], [-12, -8], [12, -10], [28, -6]]) {
  mesh(rbox(2.4, 0.4, 2.4, 0.08), M('#7a7468', { roughness: 0.9 }), G, [x, 0.2, z]); mesh(new THREE.CylinderGeometry(0.18, 0.26, 3.4, 8), trunk, G, [x, 1.9, z]);
  for (let k = 0; k < 4; k++) mesh(new THREE.IcosahedronGeometry(1.3 + rnd() * 0.5, 1), hedgeM[k % 3], G, [x + (rnd() - 0.5) * 1.4, 4.2 + rnd(), z + (rnd() - 0.5) * 1.4]);
  S(x, z, 2.4, 2.4);
}

/* prato davanti al Tribunale con la cancellata di ferro, e il vialetto in autobloccanti al centro */
const grassM = texMat(ctex(64, 64, (g, w, h) => { g.fillStyle = '#4a8a3a'; g.fillRect(0, 0, w, h); setSeed(308); for (let i = 0; i < 500; i++) { g.fillStyle = rnd() < 0.5 ? '#3e7a32' : '#5a9a44'; g.fillRect(rnd() * w, rnd() * h, 1, 2); } }, 8, 4), { roughness: 1 });
for (const sd of [-1, 1]) {
  flat(plane(26, 12, grassM, G, [sd * 22, 0.02, -7.5], [-Math.PI / 2, 0, 0]));
  /* muretto con la cancellata verso la strada */
  const wall = mesh(rbox(26, 0.5, 0.35, 0.03), M('#9a9890', { roughness: 0.95 }), G, [sd * 22, 0.25, -1.3]); S(sd * 22, -1.3, 26, 0.5);
  const fenceM = M('#3a3e44', { roughness: 0.4, metalness: 0.6 }); mesh(rbox(26, 0.05, 0.05, 0.01), fenceM, G, [sd * 22, 1.7, -1.3]); for (let x = 9.2; x <= 35; x += 0.22) mesh(new THREE.CylinderGeometry(0.015, 0.015, 1.2, 4), fenceM, G, [sd * x, 1.1, -1.3]);
}
const pathT = ctex(128, 128, (g, w, h) => { g.fillStyle = '#9a6a56'; g.fillRect(0, 0, w, h); setSeed(309); for (let y = 0; y < h; y += 8) for (let x = 0; x < w; x += 16) { g.fillStyle = rnd() < 0.5 ? '#a8786a' : '#8e5e4c'; g.fillRect(x + ((y / 8) % 2) * 8 + 1, y + 1, 14, 6); } g.strokeStyle = 'rgba(240,235,225,.8)'; g.lineWidth = 3; for (let y = 16; y < h; y += 32) { g.beginPath(); for (let x = 0; x <= w; x += 4) g.lineTo(x, y + Math.sin(x / 10) * 5); g.stroke(); } }, 2, 4);
flat(plane(18, 14, texMat(pathT, { roughness: 0.9 }), G, [0, 0.015, -8], [-Math.PI / 2, 0, 0]));
const bloom = [M('#4a7a3a', { roughness: 0.95 }), M('#f4f2ec', { roughness: 0.9 }), M('#3e6a32', { roughness: 0.95 })];
setSeed(310); for (const [x, z] of [[-12, -4], [12, -3], [-20, -12], [24, -10]]) { for (let k = 0; k < 7; k++) mesh(sph(0.6 + rnd() * 0.4, 8, 6), bloom[k % 3], G, [x + (rnd() - 0.5) * 2, 0.8 + rnd() * 0.8, z + (rnd() - 0.5) * 1.6]); S(x, z, 2.2, 1.8); }

/* ---------- il Tribunale: edificio marroncino con la struttura in vetro e i portici con i tavolini ---------- */
const brownT = ctex(128, 128, (g, w, h) => { g.fillStyle = '#a8644e'; g.fillRect(0, 0, w, h); setSeed(306); for (let y = 0; y < h; y += 8) for (let x = ((y / 8) % 2) * 8 - 8; x < w; x += 16) { const c = rnd(); g.fillStyle = c < 0.33 ? '#b4705a' : c < 0.66 ? '#a86450' : '#bc7a62'; g.fillRect(x + 1, y + 1, 14, 6); } }, 10, 6);
const brownM = texMat(brownT, { roughness: 0.85 }), brownD = M('#8a4e3c', { roughness: 0.8 });
const glass = M('#4a86b8', { roughness: 0.04, metalness: 0.5, transparent: true, opacity: 0.78 }), frame = M('#2e3238', { roughness: 0.4, metalness: 0.6 }), darkGlass = M('#1e3442', { roughness: 0.04, metalness: 0.6, transparent: true, opacity: 0.85 });
{
  /* corpo dell'edificio, pieno, dietro i portici */
  const core = mesh(new THREE.BoxGeometry(40, 16, 28), brownM, G, [-16, 8, -44]); core.receiveShadow = core.castShadow = true; S(-16, -44, 40.4, 28, core, 9);
  /* piani di sopra che sporgono sopra i portici, con le fasce di vetro */
  const over = mesh(new THREE.BoxGeometry(40.4, 8.6, 10.5), brownM, G, [-16, 9.0, -24.75]); over.castShadow = over.receiveShadow = true;
  mesh(new THREE.BoxGeometry(40.4, 0.4, 10.5), brownD, G, [-16, 4.55, -24.75]);
  for (const y of [6.3, 9.0, 11.7]) { mesh(rbox(39.6, 1.5, 0.1, 0.02), glass, G, [-16, y, -19.45]); for (let x = -35.5; x <= 3.5; x += 2.6) mesh(rbox(0.08, 1.5, 0.12, 0.01), frame, G, [x, y, -19.42]); }
  /* torre di vetro sopra l'ingresso */
  mesh(new THREE.BoxGeometry(14, 18, 8), glass, G, [-16, 13.6, -33]); for (let x = -22.6; x <= -9.4; x += 2.2) mesh(rbox(0.1, 18, 0.12, 0.01), frame, G, [x, 13.6, -28.95]);
  for (let y = 5; y <= 22; y += 3) mesh(rbox(14, 0.12, 0.12, 0.01), frame, G, [-16, y, -28.95]);
  plane(22, 1.6, new THREE.MeshStandardMaterial({ map: label('TRIBUNALE DI BUSTO ARSIZIO', { font: '900 76px Arial Black,Arial', color: '#f0e8d8', shadow: 'rgba(0,0,0,.4)', w: 1024, h: 128 }), transparent: true, roughness: 0.6 }), G, [-16, 13.4, -19.38]);
  /* lunghe vetrate verticali sulla facciata, come nelle foto */
  for (const x of [-33, -3]) { mesh(rbox(3.2, 14, 0.1, 0.02), glass, G, [x, 9, -19.4]); for (let k = -1; k <= 1; k++) mesh(rbox(0.08, 14, 0.14, 0.01), frame, G, [x + k * 1.05, 9, -19.36]); }
  for (const z of [-36, -44, -52]) { mesh(rbox(0.1, 12, 3, 0.02), glass, G, [-36.06, 9, z]); mesh(rbox(0.12, 12, 0.08, 0.01), frame, G, [-36.08, 9, z]); }
  /* padiglione basso di vetro scuro accanto all'ingresso */
  mesh(new THREE.BoxGeometry(9, 3.6, 4.2), darkGlass, G, [-29, 1.8, -17.8]); mesh(rbox(9.2, 0.25, 4.4, 0.03), brownD, G, [-29, 3.7, -17.8]);
  for (let x = -33.4; x <= -24.6; x += 1.47) mesh(rbox(0.06, 3.6, 0.06, 0.01), frame, G, [x, 1.8, -15.68]);
  S(-29, -17.8, 9.1, 4.3);
  /* scritta sopra la porta */
  plane(6, 0.6, new THREE.MeshStandardMaterial({ map: label('TRIBUNALE DI BUSTO ARSIZIO', { font: '700 58px Arial,sans-serif', color: '#e8e4d8', shadow: null, w: 1024, h: 96, bg: '#1e1e22' }), roughness: 0.6 }), G, [-16, 3.35, -29.92]);
  /* pilastri dei portici */
  for (const x of [-34, -27, -20, -12, -5, 2]) { mesh(new THREE.BoxGeometry(0.9, 4.4, 0.9), brownD, G, [x, 2.2, -20.2]).castShadow = true; S(x, -20.2, 0.95, 0.95); }
  /* vetrate al piano terra sotto i portici, con la porta d'ingresso */
  for (let x = -35; x <= 3; x += 2.4) { mesh(rbox(2.2, 4.3, 0.08, 0.01), glass, G, [x + 1.1, 2.15, -30.1]); mesh(rbox(0.08, 4.3, 0.14, 0.01), frame, G, [x, 2.15, -30.06]); }
  mesh(rbox(4, 3, 0.1, 0.02), M('#2a2420', { roughness: 0.4 }), G, [-16, 1.5, -30.0]);
  /* luci sotto i portici */
  for (const x of [-30, -16, -2]) mesh(rbox(1.2, 0.06, 0.3, 0.02), tubeOn, G, [x, 4.32, -25]);
  for (const x of [-26, -6]) { const l = new THREE.PointLight('#ffe0b0', 0.7, 18, 1.5); l.position.set(TX + x, 4.0, -25); l.userData.tr = 1; scene.add(l); }
}
/* tavolini con le sedie sotto i portici (e qualcuno fuori) */
const tblM = M('#2e3238', { roughness: 0.4, metalness: 0.6 }), chairM = M('#5a3a26', { roughness: 0.7 });
const umb = [M('#b8302a', { roughness: 0.8, side: THREE.DoubleSide }), M('#e8e2d4', { roughness: 0.8, side: THREE.DoubleSide })];
setSeed(307);
for (const [x, z, u] of [[-31, -26, 0], [-24, -24, 0], [-17, -27, 0], [-9, -24, 0], [-2, -26.5, 0], [-6, -16, 1], [20, -18, 1], [28, -14, 1]]) {
  mesh(new THREE.CylinderGeometry(0.6, 0.6, 0.05, 20), tblM, G, [x, 0.78, z]); mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.78, 8), tblM, G, [x, 0.39, z]); mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.03, 14), tblM, G, [x, 0.02, z]);
  for (let k = 0; k < 3; k++) { const a = k * 2.1 + rnd(); const c = new THREE.Group(); mesh(rbox(0.42, 0.05, 0.42, 0.02), chairM, c, [0, 0.45, 0]); mesh(rbox(0.42, 0.4, 0.04, 0.02), chairM, c, [0, 0.68, -0.19]);
    for (const sx of [-0.16, 0.16]) for (const sz of [-0.16, 0.16]) mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.45, 6), tblM, c, [sx, 0.22, sz]);
    c.position.set(x + Math.cos(a) * 1.0, 0, z + Math.sin(a) * 1.0); c.rotation.y = -a + Math.PI / 2; if (rnd() < 0.25) { c.rotation.z = 1.4; c.position.y = 0.22; } G.add(c); }
  if (u) { mesh(new THREE.CylinderGeometry(0.035, 0.035, 2.4, 8), tblM, G, [x, 1.2, z]); mesh(new THREE.ConeGeometry(1.6, 0.6, 8, 1, true), umb[Math.floor(rnd() * 2)], G, [x, 2.5, z]); }
  S(x, z, 1.3, 1.3);
}
/* blocco del garage: muri, tetto, insegna */
const gWall = M('#6e4c38', { roughness: 0.85 });
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
/* quadro elettrico del garage: senza corrente l'ascensore non va */
export const TR_PANEL = { x: TX + 4.9, z: -47 };
{ const q = new THREE.Group(); q.position.set(4.6, 0, -47); G.add(q); mesh(rbox(0.4, 1.8, 1.6, 0.05), M('#d8b040', { roughness: 0.5, metalness: 0.3 }), q, [0, 1.3, 0]); mesh(rbox(0.05, 1.4, 1.3, 0.02), M('#2a2c30'), q, [0.21, 1.3, 0]);
  for (let k = 0; k < 4; k++) mesh(rbox(0.06, 0.12, 0.3, 0.02), M('#9aa0a6', { metalness: 0.6, roughness: 0.4 }), q, [0.25, 0.9 + k * 0.25, 0]); }
export const trPanelLed = mesh(sph(0.07, 8, 6), new THREE.MeshBasicMaterial({ color: '#ff3030' }), G, [4.9, 2.05, -47]);
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
/* easter egg: Paul, appoggiato al muro accanto al garage di Pika */
export const PAUL = { x: TX + 34.2, z: -24 };
export const paulM = buildHuman(19); paulM.position.set(PAUL.x, 0, PAUL.z); paulM.rotation.y = -Math.PI / 2 - 0.4; scene.add(paulM); S(34.2, -24, 0.7, 0.7);
paulM.userData.P.armR.rotation.x = -0.3; paulM.userData.P.armL.rotation.z = 0.25;
export function updateTR(t) {
  paulM.userData.P.torso.rotation.z = Math.sin(t * 1.3) * 0.04; paulM.userData.P.head.rotation.y = Math.sin(t * 0.7) * 0.4;
  liftLed.scale.setScalar(1 + Math.sin(t * 6) * 0.15);
  for (const n of trNeons) if (n.f) { const on = Math.sin(t * 11 + n.l.position.x) + Math.sin(t * 2.7) > -0.5; n.l.intensity = on ? 0.9 : 0.08; n.tube.visible = on; }
  for (const f of trFires) { const vis = f.g.visible && f.g.parent.visible; if (f.l) f.l.visible = vis; if (!vis) continue; const k = 0.85 + Math.sin(t * 9 + f.ph) * 0.15 + Math.sin(t * 23 + f.ph) * 0.08; f.g.scale.set(1, k, 1); if (f.l) f.l.intensity = 1.1 * k; }
}
