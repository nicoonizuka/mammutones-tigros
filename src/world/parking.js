/* Zona 1 e 2: parcheggio del Tigros e gazebo Buongusto (stile modellato) */
import * as THREE from 'three';
import { scene, solid } from '../render/engine.js';
import { M, rbox, mesh, ctex, texMat, plane, TEX, rnd, setSeed } from './kit.js';

const flat = (m) => { m.castShadow = false; m.receiveShadow = true; return m; };

/* cielo al tramonto */
{
  const t = ctex(4, 256, (g) => { const gr = g.createLinearGradient(0, 0, 0, 256);
    gr.addColorStop(0, '#3b4a78'); gr.addColorStop(0.42, '#c9806a'); gr.addColorStop(0.58, '#f2b27a'); gr.addColorStop(0.7, '#e8a06a'); gr.addColorStop(1, '#5a3a30'); g.fillStyle = gr; g.fillRect(0, 0, 4, 256); });
  scene.add(new THREE.Mesh(new THREE.SphereGeometry(140, 32, 16), new THREE.MeshBasicMaterial({ map: t, side: THREE.BackSide, fog: false })));
  scene.fog.color.set('#c98a6a'); scene.fog.near = 35; scene.fog.far = 110;
}

/* asfalto, marciapiede, strisce */
const asph = TEX.asphalt(); asph.wrapS = asph.wrapT = THREE.RepeatWrapping; asph.repeat.set(10, 6);
flat(plane(80, 44, texMat(asph, { roughness: 0.95 }), scene, [0, 0, 8], [-Math.PI / 2, 0, 0]));
const sw = TEX.sidewalk(); sw.wrapS = sw.wrapT = THREE.RepeatWrapping; sw.repeat.set(26, 4);
flat(mesh(rbox(52, 0.16, 8, 0.04), texMat(sw, { roughness: 0.95 }), scene, [14, 0.02, -10]));
const tiles = ctex(256, 256, (g, w, h) => { g.fillStyle = '#8a6a55'; g.fillRect(0, 0, w, h); g.fillStyle = '#7a5c48'; for (let y = 0; y < h; y += 32) g.fillRect(0, y, w, 2); for (let x = 0; x < w; x += 64) g.fillRect(x, 0, 2, h); }, 12, 4);
flat(mesh(rbox(24, 0.14, 8, 0.03), texMat(tiles), scene, [-24, 0.02, -10]));
const lineM = M('#ece6d8', { roughness: 0.8 });
for (const [z0, z1] of [[0, 7], [12, 19]]) {
  for (let x = -36; x <= 36; x += 3) flat(plane(0.12, z1 - z0, lineM, scene, [x, 0.01, (z0 + z1) / 2], [-Math.PI / 2, 0, 0]));
}
const kerbM = M('#c7c0b4', { roughness: 0.85 });
for (const z of [7.3, 19.3]) mesh(rbox(72, 0.18, 0.4, 0.06), kerbM, scene, [0, 0.09, z]);
[[0, 29.7, 80, 0.6], [-39.7, 8, 0.6, 44], [39.7, 8, 0.6, 44]].forEach(([x, z, w, d]) => mesh(rbox(w, 0.5, d, 0.1), kerbM, scene, [x, 0.25, z]));
/* aiuole con alberi oltre il muretto */
const leaf = [M('#4f8a4a', { roughness: 0.9 }), M('#3c7440', { roughness: 0.9 }), M('#6aa25a', { roughness: 0.9 })], trunk = M('#6b4a30', { roughness: 0.9 });
setSeed(17);
for (let x = -36; x <= 36; x += 8) { const z = 32 + rnd() * 3; mesh(new THREE.CylinderGeometry(0.18, 0.25, 3, 8), trunk, scene, [x, 1.5, z]); for (let k = 0; k < 4; k++) mesh(new THREE.IcosahedronGeometry(1.4 + rnd() * 0.6, 1), leaf[k % 3], scene, [x + (rnd() - 0.5) * 1.6, 3.4 + rnd() * 1.4, z + (rnd() - 0.5) * 1.6]); }

/* macchine */
const CARC = ['#c94a42', '#3f7fc0', '#bfc4ca', '#34343e', '#6f9fc4', '#d9ad3c', '#5b6370', '#6a8a5a'];
function makeCar(x, z, rot, col, burnt) {
  const G = new THREE.Group();
  const body = M(burnt ? '#2e2826' : col, { roughness: burnt ? 0.9 : 0.35, metalness: burnt ? 0 : 0.4 });
  const glass = M(burnt ? '#141110' : '#203040', { roughness: 0.1, metalness: 0.5 }), tire = M('#121214', { roughness: 0.9 }), rim = M('#9aa3ad', { roughness: 0.3, metalness: 0.8 });
  const b = mesh(rbox(1.85, 0.7, 4.1, 0.25), body, G, [0, 0.62, 0]);
  mesh(rbox(1.62, 0.62, 2.2, 0.22), glass, G, [0, 1.2, -0.25]);
  mesh(rbox(1.66, 0.1, 1.95, 0.05), body, G, [0, 1.52, -0.25]);
  for (const sx of [-0.88, 0.88]) for (const sz of [-1.32, 1.32]) { mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.26, 18), tire, G, [sx, 0.34, sz], [0, 0, Math.PI / 2]); mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.27, 12), rim, G, [sx, 0.34, sz], [0, 0, Math.PI / 2]); }
  if (!burnt) for (const sx of [-0.6, 0.6]) { mesh(rbox(0.36, 0.14, 0.05, 0.04), M('#fff4d0', { emissive: '#fff4d0', emissiveIntensity: 0.3 }), G, [sx, 0.72, 2.05]); mesh(rbox(0.36, 0.12, 0.05, 0.04), M('#c0302a'), G, [sx, 0.75, -2.05]); }
  else { mesh(rbox(0.9, 0.05, 1.2, 0.03), M('#7a3e22', { roughness: 0.9 }), G, [0.3, 0.98, 1.3]); G.rotation.z = 0.04; }
  G.position.set(x, 0, z); G.rotation.y = rot; G.traverse(m => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } }); scene.add(G);
  const horiz = Math.abs(Math.sin(rot)) > 0.5; solid(x, z, horiz ? 4.1 : 1.9, horiz ? 1.9 : 4.1, b);
}
setSeed(31);
[[-34, 3.5], [-28, 3.5], [-19, 3.5], [-10, 3.5], [-4, 3.5], [5, 3.5], [14, 3.5], [23, 3.5], [32, 3.5], [-31, 15.5], [-22, 15.5], [-13, 15.5], [-1, 15.5], [8, 15.5], [17, 15.5], [29, 15.5]].forEach(([x, z], k) => {
  if (rnd() < 0.22) return; makeCar(x + 0.5 + rnd() * 0.4, z + rnd() * 0.6, (rnd() < 0.5 ? 0 : Math.PI) + (rnd() - 0.5) * 0.2, CARC[k % CARC.length], rnd() < 0.3);
});
makeCar(-6, 10.2, Math.PI / 2 + 0.3, '#2e2a28', true); makeCar(20, 23, Math.PI / 2 - 0.2, '#3f7fc0', false);

/* lampioni */
const pole = M('#3d4350', { roughness: 0.5, metalness: 0.5 });
for (const [x, z] of [[-26, 9.6], [-8, 9.6], [10, 9.6], [28, 9.6], [-18, 22], [12, 24]]) {
  mesh(new THREE.CylinderGeometry(0.09, 0.13, 5.2, 10), pole, scene, [x, 2.6, z]);
  mesh(rbox(1.3, 0.14, 0.4, 0.06), pole, scene, [x + 0.55, 5.15, z]);
  mesh(rbox(0.8, 0.05, 0.3, 0.02), M('#fff2c0', { emissive: '#ffd890', emissiveIntensity: 0.6 }), scene, [x + 0.75, 5.07, z]);
  solid(x, z, 0.4, 0.4);
}
/* carrelli */
const cartM = M('#aab2bb', { roughness: 0.3, metalness: 0.75 }), redM = M('#e0403a', { roughness: 0.5 });
export function cart(parent, x, z, r, fallen) {
  const G = new THREE.Group();
  mesh(rbox(0.62, 0.48, 0.95, 0.04), new THREE.MeshStandardMaterial({ color: '#aab2bb', roughness: 0.3, metalness: 0.75, wireframe: true }), G, [0, 0.78, 0]);
  mesh(rbox(0.62, 0.03, 0.95, 0.01), cartM, G, [0, 0.55, 0]);
  mesh(rbox(0.64, 0.05, 0.05, 0.02), redM, G, [0, 1.08, -0.52]);
  for (const sx of [-0.25, 0.25]) for (const sz of [-0.38, 0.38]) { mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.5, 6), cartM, G, [sx, 0.3, sz]); mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.04, 10), M('#222'), G, [sx, 0.05, sz], [0, 0, Math.PI / 2]); }
  G.position.set(x, 0, z); G.rotation.y = r; if (fallen) { G.rotation.z = 1.45; G.position.y = 0.32; }
  G.traverse(m => { if (m.isMesh) m.castShadow = true; }); parent.add(G); return G;
}
mesh(rbox(7.2, 0.14, 2.7, 0.05), M('#7a8592', { roughness: 0.4, metalness: 0.5 }), scene, [24, 2.45, -10.5]);
for (const x of [20.6, 27.4]) mesh(new THREE.CylinderGeometry(0.06, 0.06, 2.4, 8), pole, scene, [x, 1.2, -11.7]);
for (let i = 0; i < 6; i++) cart(scene, 21.5 + i * 1, -10.5, 0); solid(24, -10.5, 7, 2.4);
cart(scene, -15, 12, 0.7, true); cart(scene, 3, 20, 2); cart(scene, 30, 9, 1, true); cart(scene, -30, 25, 0.3);
/* paletti davanti all'ingresso */
const bollM = M('#a9b1ba', { roughness: 0.35, metalness: 0.6 });
for (let x = 2.6; x < 14; x += 1.5) mesh(new THREE.CylinderGeometry(0.08, 0.09, 0.9, 12), bollM, scene, [x, 0.5, -12.4]);
/* detriti */
const deb = [M('#6b6560'), M('#8a837b'), M('#a87a4a'), M('#d8d0c0')]; setSeed(40);
for (let i = 0; i < 90; i++) mesh(rbox(0.12 + rnd() * 0.4, 0.04 + rnd() * 0.1, 0.12 + rnd() * 0.4, 0.02), deb[i % 4], scene, [-38 + rnd() * 76, 0.05, -5 + rnd() * 34], [0, rnd() * 3, 0]);

/* rampa verso il seminterrato (chiusa) */
mesh(rbox(8, 0.06, 10, 0.02), M('#2a2c30', { roughness: 0.95 }), scene, [34, 0.03, 23]);
const stripe = ctex(64, 16, (g) => { for (let x = 0; x < 64; x += 16) { g.fillStyle = '#f2c14e'; g.fillRect(x, 0, 8, 16); g.fillStyle = '#1a1a1a'; g.fillRect(x + 8, 0, 8, 16); } }, 6, 1);
const stripeM = texMat(stripe, { roughness: 0.6 });
mesh(rbox(8, 0.3, 0.12, 0.04), stripeM, scene, [34, 1.0, 18]); for (const x of [30.2, 37.8]) mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.1, 8), pole, scene, [x, 0.55, 18]);
solid(34, 23, 8, 10);

/* gazebo Buongusto: tettoia, pali, tavolini rotondi */
mesh(rbox(24, 0.22, 8.4, 0.08), M('#eceae4', { roughness: 0.6 }), scene, [-24, 3.4, -10]).castShadow = true;
for (let x = -36; x <= -12; x += 6) mesh(new THREE.CylinderGeometry(0.1, 0.1, 3.4, 10), M('#dedcd6', { roughness: 0.5, metalness: 0.3 }), scene, [x, 1.7, -6.2]);
const tableM = M('#f2f2ee', { roughness: 0.5 }), chairM = M('#4a4440', { roughness: 0.7 });
[[-32, -10], [-27, -8.4], [-22, -10.4], [-17, -8.6], [-30, -12.4], [-19, -12.4]].forEach(([x, z], k) => {
  mesh(new THREE.CylinderGeometry(0.65, 0.65, 0.05, 24), tableM, scene, [x, 0.95, z]); mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.95, 8), tableM, scene, [x, 0.47, z]);
  mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.03, 16), tableM, scene, [x, 0.02, z]); solid(x, z, 1.4, 1.4);
  [[-1, 0], [1, 0], [0, -1], [0, 1]].forEach(([dx, dz], j) => {
    const c = new THREE.Group(); mesh(rbox(0.45, 0.06, 0.45, 0.02), chairM, c, [0, 0.47, 0]); mesh(rbox(0.45, 0.45, 0.05, 0.02), chairM, c, [0, 0.72, -0.2]);
    for (const sx of [-0.18, 0.18]) for (const sz of [-0.18, 0.18]) mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.47, 6), chairM, c, [sx, 0.23, sz]);
    c.position.set(x + dx * 1.05, 0, z + dz * 1.05); c.rotation.y = Math.atan2(-dx, -dz); if (k === 2 && j === 1) { c.rotation.z = 1.45; c.position.y = 0.25; }
    c.traverse(m => { if (m.isMesh) m.castShadow = true; }); scene.add(c);
  });
});
/* barriera del gazebo (si compra) */
export const gzBar = new THREE.Group();
function plank(x, z, len, rot) { for (const y of [0.55, 1.2]) { const p = mesh(rbox(len, 0.3, 0.12, 0.04), stripeM, gzBar, [x, y, z]); p.rotation.y = rot; } }
plank(-24, -6, 24, 0); plank(-12, -10, 8, Math.PI / 2); scene.add(gzBar);
export const gzSolids = [solid(-24, -6, 24, 0.4), solid(-12, -10, 0.4, 8)];
