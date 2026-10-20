/* Mondo 4: il centro di Busto Arsizio (per ora solo la mappa, da esplorare).
   Piazza Garibaldi con la fontana -> a ovest i portici e la torre grigia col fast food (il "Mac")
   -> a nord via Fratelli d'Italia, il corso coi bar e piazza San Giovanni con la basilica e il campanile.
   Dentro la chiesa c'e' gia' il sigillo delle catacombe (chiuso).
   Tutto il mondo sta lontano dagli altri (x = +1000). Nord = z negativo. */
import * as THREE from 'three';
import { scene, solid } from '../render/engine.js';
import { M, rbox, mesh, sph, ctex, texMat, label, plane, rnd, setSeed, TEX } from './kit.js';
import { makeCar } from './parking.js';

export const BX = 1000;
const G = new THREE.Group(); G.position.x = BX; scene.add(G);
const S = (x, z, w, d, m, h, top) => solid(BX + x, z, w, d, m, h, top);

/* ---------- confini, zone, interni ---------- */
export const BUB = { x1: BX - 100, x2: BX + 54, z1: -192, z2: 46 };
export const MACIN = { x1: BX - 95.5, x2: BX - 66.5, z1: -25.5, z2: 5.5, ceil: 4.3 };
export const CHIESA = { x1: BX - 14, x2: BX + 14, z1: -191, z2: -151, ceil: 13.6 };
export const inBU = p => p.x > 800;
export const inMac = p => p.x > MACIN.x1 - 0.3 && p.x < MACIN.x2 + 0.2 && p.z > MACIN.z1 && p.z < MACIN.z2;
export const inChiesa = p => p.x > CHIESA.x1 && p.x < CHIESA.x2 && p.z < CHIESA.z2 + 0.3 && p.z > CHIESA.z1;
/* le zone (servono dopo per nemici e boss) */
export const buRegion = p => (inChiesa(p) ? 'bchiesa' : inMac(p) ? 'bmacin' : p.z < -104 ? 'bpiazza' : p.z < -54 ? 'bbar' : p.x < BX - 24 ? 'bmac' : 'bfontana');
/* sotto i portici la camera resta bassa */
export const BU_LOW = [
  { x1: BX - 13.2, x2: BX - 10, z1: -104, z2: -4, ceil: 4 }, { x1: BX + 10, x2: BX + 13.2, z1: -104, z2: -12, ceil: 4 },
  { x1: BX - 60, x2: BX - 30, z1: -7.4, z2: -4, ceil: 4 }, { x1: BX - 66.4, x2: BX - 62, z1: -26, z2: 6, ceil: 4.2 },
];
export const BU_START = { x: BX + 0, z: 31, yaw: 0 };
/* posti per la storia (dopo) */
export const BU_SPOTS = {
  pierre: { x: BX + 0, z: 12 }, corti: { x: BX - 80, z: -10 }, gt: { x: BX - 48, z: 21 },
  napo: { x: BX - 4, z: -80 }, loris: { x: BX, z: -178 }, sigillo: { x: BX, z: -181 },
};

/* ---------- materiali ---------- */
const wrap = (t, rx = 1, ry = rx) => { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry); return t; };
const flat = m => { m.castShadow = false; m.receiveShadow = true; return m; };
const asphM = texMat(wrap(TEX.asphalt(), 30, 46), { roughness: 0.95 });
/* porfido: cubetti rettangolari marrone-viola come in piazza Garibaldi */
const porfTex = () => ctex(256, 256, (g, w, h) => {
  g.fillStyle = '#6e6260'; g.fillRect(0, 0, w, h); setSeed(41);
  for (let y = 0; y < h; y += 32) for (let x = ((y / 32) % 2) * 24 - 48; x < w; x += 48) {
    const v = rnd(); g.fillStyle = v < 0.3 ? '#8c7c76' : v < 0.6 ? '#9a8a82' : v < 0.85 ? '#7e706c' : '#a4948a'; g.fillRect(x + 2, y + 2, 44, 28);
  }
});
const porfM = (rx, ry) => texMat(wrap(porfTex(), rx, ry), { roughness: 0.9 });
const grassM = texMat(wrap(ctex(128, 128, (g, w, h) => { g.fillStyle = '#5a8a3a'; g.fillRect(0, 0, w, h); setSeed(43); for (let i = 0; i < 900; i++) { g.fillStyle = rnd() < 0.5 ? '#4a7a2e' : '#6a9a46'; g.fillRect(rnd() * w, rnd() * h, 2, 3); } }), 4, 4), { roughness: 1 });
const curbM = M('#a8a6a0', { roughness: 0.8 });
const whiteM = M('#eeeeea', { roughness: 0.6 });
const pole = M('#30343a', { roughness: 0.45, metalness: 0.6 });
const lampM = M('#fff2c8', { emissive: '#ffe0a0', emissiveIntensity: 0.6 });
const trunk = M('#5a4232', { roughness: 0.9 });
const leaf = [M('#3e6a2a', { roughness: 0.9 }), M('#4f7e32', { roughness: 0.9 }), M('#36592a', { roughness: 0.9 })];
const purpleLeaf = M('#5a2e3e', { roughness: 0.9 });
const pinkM = M('#e87ab0', { roughness: 0.8 });
const steel = M('#b4b8bc', { roughness: 0.3, metalness: 0.75 });
const darkGlass = M('#2a3440', { roughness: 0.08, metalness: 0.6 });

/* ---------- facciate: una texture per stile = una campata x un piano, ripetuta con le UV ---------- */
function cell(draw, w = 128, h = 128) { return wrap(ctex(w, h, draw)); }
function shutter(g, x, y, w, h, c) { g.fillStyle = c; g.fillRect(x, y, w, h); g.fillStyle = 'rgba(0,0,0,.18)'; for (let k = y + 3; k < y + h; k += 5) g.fillRect(x, k, w, 1.5); }
const STY = {
  /* palazzi gialli dell'Ottocento con le persiane verdi */
  giallo: { bay: 3.6, fl: 3.4, tex: cell((g) => { g.fillStyle = '#e2c26c'; g.fillRect(0, 0, 128, 128); g.fillStyle = '#d4b25e'; g.fillRect(0, 118, 128, 10);
    g.fillStyle = '#f0e6cc'; g.fillRect(40, 22, 48, 74); g.fillStyle = '#3a4048'; g.fillRect(46, 28, 36, 62); g.fillStyle = '#5a6670'; g.fillRect(63, 28, 2, 62);
    shutter(g, 26, 26, 15, 66, '#7d988a'); shutter(g, 87, 26, 15, 66, '#7d988a'); g.fillStyle = '#efe4c8'; g.fillRect(36, 94, 56, 6); g.fillRect(38, 16, 52, 6); }) },
  /* palazzi storici chiari con cornici (piazza San Giovanni) */
  storico: { bay: 3.8, fl: 3.8, tex: cell((g) => { g.fillStyle = '#e6d8bc'; g.fillRect(0, 0, 128, 128); g.fillStyle = '#d6c6a6'; g.fillRect(0, 0, 8, 128); g.fillRect(120, 0, 8, 128); g.fillRect(0, 116, 128, 12);
    g.fillStyle = '#c4b08c'; g.fillRect(34, 18, 60, 86); g.fillStyle = '#2e3238'; g.fillRect(42, 30, 44, 68); g.fillStyle = '#4a5058'; g.fillRect(63, 30, 2, 68);
    g.fillStyle = '#b8a07a'; g.beginPath(); g.moveTo(30, 20); g.lineTo(64, 4); g.lineTo(98, 20); g.fill(); g.fillStyle = '#e8dcc4'; g.fillRect(30, 98, 68, 8); }) },
  /* palazzo salmone/mattone (piazza San Giovanni, angolo) */
  salmone: { bay: 3.6, fl: 3.5, tex: cell((g) => { g.fillStyle = '#c99a7c'; g.fillRect(0, 0, 128, 128); g.fillStyle = '#b8886a'; g.fillRect(0, 120, 128, 8);
    g.fillStyle = '#ece0cc'; g.fillRect(38, 20, 52, 78); g.fillStyle = '#343a42'; g.fillRect(44, 26, 40, 66); shutter(g, 44, 26, 40, 22, '#8a6a4a'); }) },
  /* torre grigia: pietra, tapparelle beige, listelli bianchi verticali */
  torre: { bay: 2.6, fl: 3.2, tex: cell((g) => { g.fillStyle = '#8c9096'; g.fillRect(0, 0, 128, 128); g.fillStyle = '#7e8288'; for (let y = 0; y < 128; y += 32) g.fillRect(0, y, 128, 2);
    g.fillStyle = '#e6e6e2'; g.fillRect(0, 0, 9, 128); g.fillStyle = '#a4a6a8'; g.fillRect(20, 14, 96, 84);
    shutter(g, 24, 18, 88, 50, '#d6b48a'); g.fillStyle = '#2c343c'; g.fillRect(24, 68, 88, 28); g.fillStyle = '#c8c8c6'; g.fillRect(66, 68, 3, 28); g.fillStyle = '#8a8c90'; g.fillRect(18, 100, 100, 8); }) },
  /* palazzoni anni '60 di via Fratelli d'Italia con i balconi */
  balconi: { bay: 3.4, fl: 3.1, tex: cell((g) => { g.fillStyle = '#d2d0ca'; g.fillRect(0, 0, 128, 128); g.fillStyle = '#e6e6e2'; g.fillRect(0, 0, 8, 128);
    shutter(g, 16, 8, 100, 46, '#c8b496'); g.fillStyle = '#3a444e'; g.fillRect(16, 54, 100, 40); g.fillStyle = '#9aa0a6'; g.fillRect(64, 54, 3, 40);
    g.fillStyle = '#b8b6b0'; g.fillRect(0, 100, 128, 10); g.strokeStyle = '#8a8e92'; g.lineWidth = 2; g.strokeRect(10, 76, 112, 24); for (let x = 14; x < 122; x += 7) g.fillRect(x, 78, 1.5, 22);
    g.fillStyle = '#c4c2bc'; g.fillRect(0, 110, 128, 18); }) },
  /* palazzo rivestito di lastre rosa (Camomilla / finanziaria) */
  rosa: { bay: 3.4, fl: 3.2, tex: cell((g) => { g.fillStyle = '#c9aca0'; g.fillRect(0, 0, 128, 128); g.strokeStyle = '#b4978c'; g.lineWidth = 2; for (let y = 0; y < 128; y += 42) { g.beginPath(); g.moveTo(0, y); g.lineTo(128, y); g.stroke(); } g.beginPath(); g.moveTo(64, 0); g.lineTo(64, 128); g.stroke();
    g.fillStyle = '#ecebe6'; g.fillRect(28, 18, 72, 70); shutter(g, 34, 22, 60, 26, '#b49a7c'); g.fillStyle = '#34404a'; g.fillRect(34, 48, 60, 36); g.fillStyle = '#e8e6e0'; g.fillRect(63, 48, 2, 36); g.fillRect(26, 88, 76, 5); }) },
  /* verde chiaro (via Cattaneo) */
  verde: { bay: 3.4, fl: 3.3, tex: cell((g) => { g.fillStyle = '#a6b29c'; g.fillRect(0, 0, 128, 128); g.fillStyle = '#96a28c'; g.fillRect(0, 118, 128, 10);
    g.fillStyle = '#e6e6de'; g.fillRect(42, 22, 44, 70); g.fillStyle = '#323a40'; g.fillRect(48, 28, 32, 58); shutter(g, 48, 28, 32, 20, '#c8c0aa'); }) },
  /* basilica: intonaco chiaro */
  chiesa: { bay: 4, fl: 4, tex: cell((g) => { g.fillStyle = '#ddd6c6'; g.fillRect(0, 0, 128, 128); g.fillStyle = '#cfc6b4'; for (let y = 0; y < 128; y += 32) g.fillRect(0, y, 128, 2); for (let x = 0; x < 128; x += 64) g.fillRect(x, 0, 2, 128); }) },
};
for (const k in STY) STY[k].mat = new THREE.MeshStandardMaterial({ map: STY[k].tex, roughness: 0.85 });

/* box con le UV in metri: le finestre si ripetono giuste per ogni lato */
function fgeo(w, h, d, bay, fl) {
  const g = new THREE.BoxGeometry(w, h, d), uv = g.attributes.uv, fw = [d, d, w, w, w, w];
  for (let f = 0; f < 6; f++) { const nx = Math.max(1, Math.round(fw[f] / bay)), ny = Math.max(1, Math.round(h / fl));
    for (let i = 0; i < 4; i++) { const k = f * 4 + i; if (f === 2 || f === 3) uv.setXY(k, 0.03, 0.97); else uv.setXY(k, uv.getX(k) * nx, uv.getY(k) * ny); } }
  return g;
}
/* piano terra: vetrine (negozi, banche) o bar */
function shopStrip(names, palette) {
  return wrap(ctex(1024, 160, (g) => {
    g.fillStyle = '#3a3c40'; g.fillRect(0, 0, 1024, 160);
    names.forEach((n, i) => { const x = i * 256; g.fillStyle = palette[i % palette.length]; g.fillRect(x + 8, 6, 240, 34);
      g.fillStyle = '#f4f0e6'; g.font = '700 26px Arial,sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(n, x + 128, 24);
      g.fillStyle = '#26303a'; g.fillRect(x + 14, 46, 228, 108); g.fillStyle = 'rgba(160,190,210,.25)'; g.beginPath(); g.moveTo(x + 30, 46); g.lineTo(x + 90, 46); g.lineTo(x + 40, 154); g.lineTo(x + 14, 154); g.fill();
      g.fillStyle = '#7a7c80'; g.fillRect(x + 126, 46, 5, 108); g.fillStyle = 'rgba(255,220,160,.35)'; g.fillRect(x + 20, 120, 100, 30); g.fillRect(x + 136, 110, 100, 40); });
  }));
}
const shopsM = new THREE.MeshStandardMaterial({ map: shopStrip(['ABITI', 'BANCA', 'OTTICA', 'SCARPE'], ['#5a4a6a', '#2a4a7a', '#7a3a2a', '#2a5a4a']), roughness: 0.5 });
const barsM = new THREE.MeshStandardMaterial({ map: shopStrip(['BAR', 'CAFFÈ', 'PASTICCERIA', 'APERITIVO'], ['#6a2a22', '#2e4a32', '#7a5a2a', '#3a2a4a']), roughness: 0.5, emissive: '#3a2a14', emissiveIntensity: 0.3 });
const shops2M = new THREE.MeshStandardMaterial({ map: shopStrip(['LIBRI', 'GIOIELLI', 'FARMACIA', 'PROFUMI'], ['#2a3a5a', '#5a4a2a', '#2a6a3a', '#6a2a4a']), roughness: 0.5 });
function gfloorGeo(w, h, d) { const g = new THREE.BoxGeometry(w, h, d), uv = g.attributes.uv, fw = [d, d, w, w, w, w];
  for (let f = 0; f < 6; f++) for (let i = 0; i < 4; i++) { const k = f * 4 + i; if (f === 2 || f === 3) uv.setXY(k, 0.002, 0.99); else uv.setXY(k, uv.getX(k) * Math.max(1, Math.round(fw[f] / 4)) / 4, uv.getY(k)); }
  return g; }
const tileRoof = M('#a8553a', { roughness: 0.85 }), tileRoof2 = M('#94493a', { roughness: 0.85 });
const flatRoof = M('#8a8a86', { roughness: 0.95 }), parapet = M('#b6b4ae', { roughness: 0.8 });
function gable(w, d, hr, mat, parent, x, y, z) {
  /* tetto a due falde lungo il lato piu' lungo */
  const along = d >= w, sw = along ? w : d, L = along ? d : w;
  const sh = new THREE.Shape(); sh.moveTo(-sw / 2 - 0.4, 0); sh.lineTo(0, hr); sh.lineTo(sw / 2 + 0.4, 0); sh.closePath();
  const geo = new THREE.ExtrudeGeometry(sh, { depth: L + 0.6, bevelEnabled: false }); geo.translate(0, 0, -(L + 0.6) / 2);
  const m = mesh(geo, mat, parent, [x, y, z]); if (!along) m.rotation.y = Math.PI / 2; m.castShadow = true; return m;
}
const portCeil = M('#c8c6c0', { roughness: 0.9 }), colM = M('#c4c8cc', { roughness: 0.3, metalness: 0.7 }), stoneCol = M('#8a8e92', { roughness: 0.7 });
/* un palazzo: piano terra coi negozi, piani sopra, tetto. Portico = piano terra arretrato su un lato con le colonne. */
function bld(x, z, w, d, o = {}) {
  const st = STY[o.style || 'giallo'], fl = o.floors || 4, gh = o.gh || 4.2, H = gh + fl * st.fl;
  const por = o.por, dep = o.dep || 3.2;
  let gx = x, gz = z, gw = w, gd = d;
  if (por === 'e') { gw -= dep; gx -= dep / 2; } if (por === 'w') { gw -= dep; gx += dep / 2; } if (por === 'n') { gd -= dep; gz += dep / 2; } if (por === 's') { gd -= dep; gz -= dep / 2; }
  const gm = mesh(gfloorGeo(gw, gh, gd), o.shops || shopsM, G, [gx, gh / 2, gz]); gm.receiveShadow = true;
  const up = mesh(fgeo(w, H - gh, d, st.bay, st.fl), st.mat, G, [x, gh + (H - gh) / 2, z]); up.castShadow = true; up.receiveShadow = true;
  /* cornicione */
  mesh(new THREE.BoxGeometry(w + 0.5, 0.35, d + 0.5), o.style === 'torre' ? stoneCol : parapet, G, [x, H, z]);
  mesh(new THREE.BoxGeometry(w + 0.2, 0.25, d + 0.2), parapet, G, [x, gh + 0.1, z]);
  if (o.roof === 'tetto') { gable(w, d, Math.min(w, d) * 0.28, o.style === 'storico' ? tileRoof2 : tileRoof, G, x, H + 0.15, z);
    setSeed(Math.abs(Math.floor(x * 7 + z * 13)) + 1); for (let i = 0; i < Math.max(2, Math.round(Math.max(w, d) / 7)); i++) { const along = d >= w;
      const cx = along ? x + (rnd() - 0.5) * w * 0.5 : x - w / 2 + 2 + rnd() * (w - 4), cz = along ? z - d / 2 + 2 + rnd() * (d - 4) : z + (rnd() - 0.5) * d * 0.5;
      mesh(new THREE.BoxGeometry(0.7, 2.2, 0.7), M('#b89878', { roughness: 0.9 }), G, [cx, H + 1.4, cz]); mesh(new THREE.BoxGeometry(0.95, 0.25, 0.95), M('#8a7a6a'), G, [cx, H + 2.5, cz]); } }
  else { mesh(new THREE.BoxGeometry(w - 0.4, 0.1, d - 0.4), flatRoof, G, [x, H + 0.2, z]); if (w > 10 && d > 10) { mesh(new THREE.BoxGeometry(3, 2.4, 3), parapet, G, [x + w * 0.2, H + 1.3, z - d * 0.15]); mesh(new THREE.BoxGeometry(2, 1.4, 4), parapet, G, [x - w * 0.25, H + 0.8, z + d * 0.2]); } }
  /* balconi veri sporgenti sul lato della strada */
  if (o.balc) { const s = o.balc, bw = s === 'e' || s === 'w' ? 1.1 : w - 1, bd = s === 'e' || s === 'w' ? d - 1 : 1.1;
    const bxp = s === 'e' ? x + w / 2 + 0.55 : s === 'w' ? x - w / 2 - 0.55 : x, bzp = s === 's' ? z + d / 2 + 0.55 : s === 'n' ? z - d / 2 - 0.55 : z;
    for (let f = 1; f < fl; f++) { const y = gh + f * st.fl; mesh(new THREE.BoxGeometry(bw, 0.18, bd), parapet, G, [bxp, y, bzp]); mesh(new THREE.BoxGeometry(bw, 0.9, bd), railM, G, [bxp, y + 0.55, bzp]); } }
  /* portico: soffitto e colonne */
  if (por) { const along = por === 'e' || por === 'w', L = along ? d : w, cnt = Math.max(2, Math.round(L / 4.6));
    const ex = por === 'e' ? x + w / 2 - 0.35 : por === 'w' ? x - w / 2 + 0.35 : 0, ez = por === 's' ? z + d / 2 - 0.35 : por === 'n' ? z - d / 2 + 0.35 : 0;
    for (let i = 0; i < cnt; i++) { const t = -L / 2 + 0.6 + (L - 1.2) * i / (cnt - 1); const cx = along ? ex : x + t, cz = along ? z + t : ez;
      mesh(new THREE.CylinderGeometry(0.26, 0.26, gh, 14), o.style === 'torre' ? stoneCol : colM, G, [cx, gh / 2, cz]).castShadow = true; S(cx, cz, 0.55, 0.55); } }
  S(gx, gz, gw, gd, null, H);
  return H;
}
const railM = new THREE.MeshStandardMaterial({ map: wrap(ctex(64, 32, (g) => { g.clearRect(0, 0, 64, 32); g.fillStyle = '#8c9094'; g.fillRect(0, 0, 64, 3); for (let x = 2; x < 64; x += 6) g.fillRect(x, 0, 1.6, 32); }), 12, 1), transparent: true, alphaTest: 0.4, side: THREE.DoubleSide, roughness: 0.4, metalness: 0.6 });

/* ---------- arredo urbano ---------- */
function tree(x, z, s = 1, purple = false) {
  mesh(new THREE.CylinderGeometry(0.16 * s, 0.24 * s, 3.4 * s, 8), trunk, G, [x, 1.7 * s, z]).castShadow = true;
  for (let k = 0; k < 4; k++) { const m = mesh(new THREE.IcosahedronGeometry((1.3 + rnd() * 0.6) * s, 1), purple && k % 2 ? purpleLeaf : leaf[k % 3], G, [x + (rnd() - 0.5) * 1.6 * s, (3.6 + rnd() * 1.4) * s, z + (rnd() - 0.5) * 1.6 * s]); m.castShadow = true; }
  S(x, z, 0.6, 0.6);
}
function poplar(x, z) { /* alberi alti e stretti come davanti alla torre */
  mesh(new THREE.CylinderGeometry(0.15, 0.22, 3, 8), trunk, G, [x, 1.5, z]);
  for (let k = 0; k < 5; k++) mesh(new THREE.IcosahedronGeometry(1.25 - k * 0.12, 1), leaf[k % 3], G, [x + (rnd() - 0.5) * 0.4, 3 + k * 1.5, z + (rnd() - 0.5) * 0.4]).castShadow = true;
  S(x, z, 0.6, 0.6);
}
function bush(x, z, s = 1, mat) { mesh(new THREE.IcosahedronGeometry(0.75 * s, 1), mat || (rnd() < 0.5 ? purpleLeaf : leaf[1]), G, [x, 0.55 * s, z], null, [1, 0.8, 1]); }
function lamp(x, z, rot = 0) { /* lampione a due bracci */
  mesh(new THREE.CylinderGeometry(0.08, 0.13, 5.6, 10), pole, G, [x, 2.8, z]);
  for (const s of [-1, 1]) { const a = mesh(new THREE.BoxGeometry(1.1, 0.07, 0.07), pole, G, [x + Math.cos(rot) * s * 0.55, 5.5, z + Math.sin(rot) * s * 0.55]); a.rotation.y = -rot;
    mesh(new THREE.CylinderGeometry(0.22, 0.32, 0.22, 12), pole, G, [x + Math.cos(rot) * s * 1.05, 5.35, z + Math.sin(rot) * s * 1.05]);
    mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.05, 12), lampM, G, [x + Math.cos(rot) * s * 1.05, 5.22, z + Math.sin(rot) * s * 1.05]); }
  S(x, z, 0.35, 0.35);
}
function bench(x, z, rot = 0) { const g = new THREE.Group(); G.add(g); g.position.set(x, 0, z); g.rotation.y = rot;
  mesh(new THREE.BoxGeometry(1.8, 0.08, 0.45), M('#8a6440', { roughness: 0.8 }), g, [0, 0.45, 0]); mesh(new THREE.BoxGeometry(1.8, 0.4, 0.06), M('#8a6440', { roughness: 0.8 }), g, [0, 0.72, -0.22]);
  for (const s of [-0.75, 0.75]) mesh(new THREE.BoxGeometry(0.08, 0.45, 0.45), pole, g, [s, 0.22, 0]);
  const h = Math.abs(Math.sin(rot)) > 0.5; S(x, z, h ? 0.5 : 1.8, h ? 1.8 : 0.5, null, 0, 0.5); }
function zebra(x, z, w, along) { for (let i = 0; i < Math.floor(w / 1); i++) { const t = -w / 2 + 0.5 + i; flat(mesh(new THREE.PlaneGeometry(along ? 0.5 : 3, along ? 3 : 0.5), whiteM, G, [x + (along ? t : 0), 0.012, z + (along ? 0 : t)], [-Math.PI / 2, 0, 0])); } }
function pave(x, z, w, d, m, y = 0.01) { return flat(plane(w, d, m, G, [x, y, z], [-Math.PI / 2, 0, 0])); }
function curb(x, z, w, d) { mesh(new THREE.BoxGeometry(w, 0.14, d), curbM, G, [x, 0.07, z]).receiveShadow = true; }
function bin(x, z) { mesh(new THREE.CylinderGeometry(0.24, 0.22, 0.85, 12), M('#3a3c40', { roughness: 0.6, metalness: 0.4 }), G, [x, 0.43, z]); S(x, z, 0.5, 0.5, null, 0, 0.85); }

/* ---------- terreno ---------- */
pave(-23, -73, 154, 238, asphM, 0.002);

/* ================= PIAZZA GARIBALDI E LA FONTANA ================= */
pave(-24, 30, 4, 20, porfM(1, 5), 0.006); /* marciapiede ovest */
pave(-14, 40, 80, 8, porfM(20, 2), 0.006); /* marciapiede sud */
/* strada ad anello intorno all'isola (asfalto gia' sotto), cordoli */
pave(0, 12, 28, 22, porfM(7, 5.5), 0.008);
curb(0, 1, 28.4, 0.3); curb(0, 23, 28.4, 0.3); curb(-14, 12, 0.3, 22); curb(14, 12, 0.3, 22);
/* via di corsa sull'isola: aiuole agli angoli */
for (const [x, z] of [[-10, 3.5], [10, 3.5], [-10, 20.5], [10, 20.5]]) { pave(x, z, 6, 4, grassM, 0.012); bush(x - 1.5, z, 1.1, pinkM); bush(x + 1.2, z + 0.6, 0.9); }
tree(-11.5, 21, 1.1, true); tree(11.5, 21.5, 1.15); tree(-11.8, 3, 1.05); tree(12, 2.6, 1.1, true);
/* la fontana: vasca di granito, gradoni di pietra e tre coppe con gli zampilli */
const granite = texMat(wrap(ctex(128, 64, (g, w, h) => { g.fillStyle = '#9a9a96'; g.fillRect(0, 0, w, h); setSeed(51); for (let i = 0; i < 1400; i++) { const v = 120 + Math.floor(rnd() * 70); g.fillStyle = `rgb(${v},${v},${v - 4})`; g.fillRect(rnd() * w, rnd() * h, 1, 1); } g.fillStyle = '#7e7e7a'; g.fillRect(0, 0, 2, h); }), 6, 1), { roughness: 0.6 });
const FX = 0, FZ = 12, FW = 17, FD = 10.5;
for (const [x, z, w, d] of [[FX, FZ - FD / 2, FW, 0.6], [FX, FZ + FD / 2, FW, 0.6], [FX - FW / 2, FZ, 0.6, FD], [FX + FW / 2, FZ, 0.6, FD]]) {
  const m = mesh(new THREE.BoxGeometry(w, 0.75, d), granite, G, [x, 0.375, z]); m.castShadow = m.receiveShadow = true; S(x, z, w, d, m, 0, 0.75); }
const water = new THREE.MeshStandardMaterial({ color: '#4a7a8a', roughness: 0.05, metalness: 0.3, transparent: true, opacity: 0.8 });
flat(mesh(new THREE.PlaneGeometry(FW - 0.6, FD - 0.6), water, G, [FX, 0.5, FZ], [-Math.PI / 2, 0, 0]));
const stoneB = M('#8e8c86', { roughness: 0.75 });
for (const [x, z, w, d, h] of [[-4.5, 12, 4.4, 4, 1.25], [0, 11.4, 5.2, 4.4, 1.75], [4.6, 12.4, 4.4, 4, 1.2], [-2.2, 14.8, 3.6, 2.4, 0.9], [2.6, 9.4, 3.6, 2.4, 0.95], [-6.6, 9.8, 2.6, 2.4, 0.8]]) {
  const m = mesh(new THREE.BoxGeometry(w, h, d), stoneB, G, [FX + x, h / 2, FZ + z - 12]); m.castShadow = m.receiveShadow = true; S(FX + x, FZ + z - 12, w, d, m, 0, h); }
const bronze = M('#3a3632', { roughness: 0.4, metalness: 0.6 });
const jetM = new THREE.MeshBasicMaterial({ color: '#f2f8ff', transparent: true, opacity: 0.62, depthWrite: false });
const jets = [];
for (const [x, z, y] of [[-4.5, 12, 1.25], [0, 11.4, 1.75], [4.6, 12.4, 1.2]]) {
  mesh(new THREE.CylinderGeometry(0.95, 0.35, 0.4, 18), bronze, G, [FX + x, y + 0.2, FZ + z - 12]);
  const j = mesh(new THREE.CylinderGeometry(0.12, 0.42, 4.4, 12, 1, true), jetM, G, [FX + x, y + 2.5, FZ + z - 12]); jets.push(j);
  const sp = mesh(new THREE.CylinderGeometry(1.1, 0.25, 1.2, 14, 1, true), jetM, G, [FX + x, y + 0.9, FZ + z - 12]); sp.rotation.x = Math.PI; jets.push(sp);
}
/* gocce che ricadono */
const dropsGeo = new THREE.BufferGeometry(); const DN = 420, dp = new Float32Array(DN * 3), dv = []; for (let i = 0; i < DN; i++) dv.push({ t: rnd() * 1.2, k: Math.floor(rnd() * 3), a: rnd() * 6.28, r: 0.2 + rnd() * 1.1 });
dropsGeo.setAttribute('position', new THREE.BufferAttribute(dp, 3));
const dropsPts = new THREE.Points(dropsGeo, new THREE.PointsMaterial({ color: '#f4faff', size: 0.14, transparent: true, opacity: 0.9 })); G.add(dropsPts); dropsPts.frustumCulled = false;
const JB = [[-4.5, 0, 1.25], [0, -0.6, 1.75], [4.6, 0.4, 1.2]];
/* lampioni e panchine della piazza */
lamp(-13, 26, 0); lamp(13, 26, 0); lamp(-13, -2, 0); lamp(13, -2.5, 0); lamp(-24, 30, Math.PI / 2); lamp(24, 8, Math.PI / 2);
bench(-6, 22, 0); bench(6, 22, 0); bench(-6, 2, Math.PI); bin(9, 23.4); bin(-9, 1);
zebra(0, 28, 8, true); zebra(-18, 12, 8, false); zebra(18, 12, 8, false); zebra(0, -3.5, 8, true);
/* palazzi intorno alla piazza */
bld(41, 2, 26, 28, { style: 'giallo', floors: 3, roof: 'tetto', shops: shops2M });
bld(41, 31, 26, 30, { style: 'storico', floors: 4, roof: 'tetto' });
bld(1, 43, 54, 6, { style: 'giallo', floors: 3, roof: 'tetto' });
pave(25, 10, 4, 52, porfM(1, 13), 0.006);
/* sud-ovest: palazzone a balconi e palazzo verde */
bld(-43, 37, 34, 18, { style: 'balconi', floors: 9, balc: 'n', gh: 4.4 });
bld(-80, 26.5, 40, 39, { style: 'verde', floors: 5 });

/* ================= VERSO IL MAC: PORTICI E TORRE GRIGIA ================= */
pave(-44, -5.5, 36, 3.4, porfM(9, 1), 0.007); /* sotto i portici */
bld(-45, -18, 30, 28, { style: 'rosa', floors: 6, por: 's', dep: 3.4, gh: 4.2, shops: shopsM, balc: null });
/* la torre grigia (13 piani) con il fast food al piano terra */
const TW = { x: -79, z: -10, w: 34, d: 32 }, TGH = 4.6, TH = TGH + 13 * STY.torre.fl;
{
  const up = mesh(fgeo(TW.w, TH - TGH, TW.d, STY.torre.bay, STY.torre.fl), STY.torre.mat, G, [TW.x, TGH + (TH - TGH) / 2, TW.z]); up.castShadow = up.receiveShadow = true;
  mesh(new THREE.BoxGeometry(TW.w + 0.4, 0.4, TW.d + 0.4), stoneCol, G, [TW.x, TH, TW.z]); mesh(new THREE.BoxGeometry(TW.w - 0.6, 0.1, TW.d - 0.6), flatRoof, G, [TW.x, TH + 0.25, TW.z]);
  for (const [x, z] of [[-14, -14], [14, -14], [-14, 14], [14, 14]]) mesh(new THREE.CylinderGeometry(0.04, 0.04, 3, 6), pole, G, [TW.x + x * 0.95, TH + 1.6, TW.z + z * 0.9]);
  /* fascia scura sopra le vetrine, come nella foto */
  mesh(new THREE.BoxGeometry(0.3, 0.9, TW.d), M('#3a2e28', { roughness: 0.6 }), G, [TW.x + TW.w / 2 - 4.6, TGH - 0.6, TW.z]);
  /* colonne del porticato davanti al fast food */
  for (let i = 0; i < 7; i++) { const z = TW.z - TW.d / 2 + 1 + i * (TW.d - 2) / 6; mesh(new THREE.BoxGeometry(0.9, TGH, 0.9), stoneCol, G, [TW.x + TW.w / 2 - 0.45, TGH / 2, z]).castShadow = true; S(TW.x + TW.w / 2 - 0.45, z, 0.9, 0.9); }
  mesh(new THREE.BoxGeometry(4.4, 0.2, TW.d), portCeil, G, [TW.x + TW.w / 2 - 2.2, TGH - 0.1, TW.z]);
}
pave(-64.2, -10, 4.4, 32, porfM(1, 8), 0.008);
/* aiuola con i cespugli davanti alla torre e i pioppi */
pave(-54, 6, 8, 10, grassM, 0.012); curb(-54, 1, 8.2, 0.25); curb(-54, 11, 8.2, 0.25); curb(-58, 6, 0.25, 10); curb(-50, 6, 0.25, 10);
for (const [x, z] of [[-56, 3], [-52.5, 4], [-55.5, 8], [-52, 9]]) bush(x, z, 1.1);
poplar(-54, 6); poplar(-60.5, -24); poplar(-60.5, 4.5); S(-54, 6, 8, 10, null, 0, 0.3);
lamp(-40, 10, Math.PI / 2); lamp(-30, -1.2, 0); lamp(-58, 13, 0);
/* macchine parcheggiate lungo la strada (una e' la GT di Corti, dopo) */
setSeed(61);
[[-36, 21], [-42, 21], [-56, 21], [-62, 21], [-30, 21]].forEach(([x, z], i) => makeCar(BX + x, z, Math.PI / 2, ['#c8ccd0', '#2a2e34', '#7a8088', '#e8e8e6', '#4a5a6a'][i], false));
makeCar(BX + BU_SPOTS.gt.x - BX, BU_SPOTS.gt.z, Math.PI / 2, '#1c2028', false);
zebra(-27, 12, 10, false);

/* ---------- dentro il fast food ---------- */
const ffTile = texMat(wrap(ctex(128, 128, (g, w, h) => { g.fillStyle = '#c8bfb2'; g.fillRect(0, 0, w, h); g.fillStyle = '#b4aa9c'; g.fillRect(0, 0, 64, 64); g.fillRect(64, 64, 64, 64); g.fillStyle = 'rgba(0,0,0,.08)'; g.fillRect(0, 63, w, 2); g.fillRect(63, 0, 2, h); }), 15, 16), { roughness: 0.4 });
pave(-81, -10, 29, 31, ffTile, 0.015);
const ffWall = M('#4a3a32', { roughness: 0.7 }), ffWall2 = M('#d8c8a8', { roughness: 0.8 }), ffGlass = new THREE.MeshStandardMaterial({ color: '#7a9aaa', roughness: 0.05, metalness: 0.5, transparent: true, opacity: 0.35 });
function ffw(x, z, w, d, mat = ffWall2, h = TGH) { const m = mesh(new THREE.BoxGeometry(w, h, d), mat, G, [x, h / 2, z]); m.receiveShadow = true; S(x, z, w, d, m, h); return m; }
/* muri: ovest, nord, sud pieni; est vetrata con la porta in mezzo (z -12..-8) */
ffw(-96, -10, 0.6, 32); ffw(-79, -26, 34, 0.6); ffw(-79, 6, 34, 0.6);
ffw(-66.3, -19.5, 0.4, 13, ffGlass); ffw(-66.3, -1.5, 0.4, 15, ffGlass);
mesh(new THREE.BoxGeometry(0.5, 0.9, 4.2), ffWall, G, [-66.3, TGH - 0.45, -11]);
flat(mesh(new THREE.PlaneGeometry(30, 32), M('#e8e2d6', { roughness: 0.9, side: THREE.DoubleSide }), G, [-81, 4.35, -10], [Math.PI / 2, 0, 0]));
/* insegna generica sopra l'ingresso */
plane(7, 1, new THREE.MeshStandardMaterial({ map: label('FAST FOOD', { font: '900 82px Arial Black,Arial,sans-serif', bg: '#2a1e18', color: '#f4d48a', w: 512, h: 80, shadow: null }), emissive: '#ffffff', emissiveIntensity: 0.25 }), G, [-61.4, 3.6, -10], [0, Math.PI / 2, 0]);
plane(5, 0.9, new THREE.MeshStandardMaterial({ map: label('BURGER', { font: '900 80px Arial Black,Arial,sans-serif', bg: '#2a1e18', color: '#f4d48a', w: 512, h: 90, shadow: null }), emissive: '#ffffff', emissiveIntensity: 0.2 }), G, [-61.4, 3.6, 2], [0, Math.PI / 2, 0]);
/* bancone in fondo, cucina, menu luminosi */
const counterM = M('#3a2a22', { roughness: 0.5 }), counterTop = M('#b8b4ac', { roughness: 0.25, metalness: 0.4 });
mesh(new THREE.BoxGeometry(1.2, 1.05, 18), counterM, G, [-90, 0.52, -10]); mesh(new THREE.BoxGeometry(1.4, 0.06, 18.2), counterTop, G, [-90, 1.08, -10]); S(-90, -10, 1.2, 18, null, 0, 1.1);
for (const z of [-16, -12, -8, -4]) { mesh(new THREE.BoxGeometry(0.4, 0.3, 0.5), M('#202428'), G, [-90.2, 1.26, z]); mesh(new THREE.BoxGeometry(0.05, 0.3, 0.4), M('#6ad0ff', { emissive: '#3a90c0', emissiveIntensity: 0.6 }), G, [-89.98, 1.32, z]); }
mesh(new THREE.BoxGeometry(5, 4.3, 18), M('#9aa0a6', { roughness: 0.3, metalness: 0.6 }), G, [-93.4, 2.15, -10]); /* cucina d'acciaio dietro */
const menuTex = ctex(1024, 256, (g) => { g.fillStyle = '#1e1a18'; g.fillRect(0, 0, 1024, 256); const items = [['BURGER', '#e8a03a'], ['PATATINE', '#e8c84a'], ['BIBITE', '#5ab0e8'], ['GELATI', '#e87ab0']];
  items.forEach(([n, c], i) => { const x = i * 256; g.fillStyle = c; g.beginPath(); g.arc(x + 128, 100, 56, 0, 6.28); g.fill(); g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(x + 84, 96, 88, 10);
    g.fillStyle = '#f6f0e4'; g.font = '700 34px Arial,sans-serif'; g.textAlign = 'center'; g.fillText(n, x + 128, 200); g.font = '600 26px Arial'; g.fillStyle = '#c8c0b0'; g.fillText((4 + i * 1.5).toFixed(2) + ' €', x + 128, 236); }); });
plane(14, 3.5, new THREE.MeshStandardMaterial({ map: menuTex, emissive: '#ffffff', emissiveMap: menuTex, emissiveIntensity: 0.55 }), G, [-90.85, 2.7, -10], [0, Math.PI / 2, 0]);
/* totem per ordinare vicino all'ingresso */
for (const z of [-17, -15, -5, -3]) { mesh(new THREE.BoxGeometry(0.45, 1.9, 0.7), M('#e8e6e2', { roughness: 0.4 }), G, [-68.5, 0.95, z]); mesh(new THREE.BoxGeometry(0.05, 0.9, 0.55), M('#3a8ad0', { emissive: '#2a6aa0', emissiveIntensity: 0.7 }), G, [-68.25, 1.3, z]); S(-68.5, z, 0.5, 0.75); }
/* tavoli e sedute */
const tblM = M('#d8d0c0', { roughness: 0.4 }), seatM = M('#6a3a2a', { roughness: 0.6 }), legM = M('#2a2a2c', { metalness: 0.5, roughness: 0.4 });
for (const x of [-84, -79, -74]) for (const z of [-22, -16.5, -3.5, 2]) {
  mesh(new THREE.BoxGeometry(1.4, 0.06, 0.9), tblM, G, [x, 0.75, z]); mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.72, 8), legM, G, [x, 0.38, z]);
  for (const s of [-1, 1]) { mesh(new THREE.BoxGeometry(1.4, 0.45, 0.5), seatM, G, [x, 0.23, z + s * 0.85]); mesh(new THREE.BoxGeometry(1.4, 0.6, 0.12), seatM, G, [x, 0.75, z + s * 1.1]); }
  S(x, z, 1.4, 2.4, null, 0, 0.78);
}
for (const z of [-24.5, 4.5]) { mesh(new THREE.BoxGeometry(1, 1.2, 0.6), M('#5a4a3a'), G, [-70, 0.6, z]); S(-70, z, 1, 0.6, null, 0, 1.2); }
const ffLights = [];
for (const [x, z] of [[-75, -10], [-86, -10]]) { const l = new THREE.PointLight('#fff2dc', 0.9, 22, 1.4); l.position.set(x, 3.9, z); l.userData.bu = 1; G.add(l); ffLights.push(l); mesh(new THREE.BoxGeometry(1.4, 0.06, 1.4), lampM, G, [x, 4.3, z]); }

/* ================= VIA FRATELLI D'ITALIA (verso il corso) ================= */
bld(-20, -29, 20, 50, { style: 'balconi', floors: 10, por: 'e', dep: 3.2, balc: 'e', gh: 4.4, shops: shopsM });
bld(32, -33, 44, 42, { style: 'rosa', floors: 6, por: 'w', dep: 3.2, gh: 4.2, shops: shops2M });
pave(-11.6, -29, 3.2, 50, porfM(1, 12), 0.007); pave(11.6, -33, 3.2, 42, porfM(1, 10), 0.007);
for (const z of [-14, -28, -42]) { lamp(-9.4, z, 0); lamp(9.4, z - 7, 0); }
for (const [x, z] of [[-9, -20], [9, -38], [-9, -48]]) tree(x, z, 0.9);
zebra(0, -52, 8, true);
/* riempimento dietro (case vecchie) */
bld(-66, -45, 72, 30, { style: 'giallo', floors: 4, roof: 'tetto' });

/* ================= CORSO XX SETTEMBRE: LA ZONA DEI BAR ================= */
/* pavimento con i rombi a scacchi bianchi e neri */
const corsoTex = ctex(512, 1024, (g, w, h) => {
  g.fillStyle = '#7a706a'; g.fillRect(0, 0, w, h); setSeed(71);
  for (let y = 0; y < h; y += 16) for (let x = ((y / 16) % 2) * 12 - 24; x < w; x += 24) { const v = rnd(); g.fillStyle = v < 0.4 ? '#857a72' : v < 0.75 ? '#6e6560' : '#948a80'; g.fillRect(x + 1, y + 1, 22, 14); }
  /* rombo grande */
  const cx = w / 2, cy = h / 2, rx = w * 0.46, ry = h * 0.3;
  g.save(); g.beginPath(); g.moveTo(cx, cy - ry); g.lineTo(cx + rx, cy); g.lineTo(cx, cy + ry); g.lineTo(cx - rx, cy); g.closePath(); g.fillStyle = '#e8e6e0'; g.fill(); g.clip();
  g.translate(cx, cy); g.scale(rx / 10, ry / 10);
  for (let i = -10; i < 10; i++) for (let j = -10; j < 10; j++) if ((i + j) % 2 === 0) { g.fillStyle = '#4a4a4c'; g.beginPath(); g.moveTo(i, j); g.lineTo(i + 1, j); g.lineTo(i + 1, j + 1); g.closePath(); g.fill(); }
  g.restore(); g.strokeStyle = '#e8e6e0'; g.lineWidth = 10; g.beginPath(); g.moveTo(cx, cy - ry - 14); g.lineTo(cx + rx + 14, cy); g.lineTo(cx, cy + ry + 14); g.lineTo(cx - rx - 14, cy); g.closePath(); g.stroke();
});
const corsoM = texMat(corsoTex, { roughness: 0.75 });
for (let z = -59; z > -104; z -= 12.5) pave(0, z, 20, 12.5, corsoM, 0.008);
bld(-25, -79, 30, 50, { style: 'balconi', floors: 7, por: 'e', dep: 3.2, balc: 'e', shops: barsM });
bld(32, -79, 44, 50, { style: 'storico', floors: 4, por: 'w', dep: 3.2, roof: 'tetto', shops: barsM });
pave(-11.6, -79, 3.2, 50, porfM(1, 12), 0.009); pave(11.6, -79, 3.2, 50, porfM(1, 12), 0.009);
bld(-71, -82, 62, 44, { style: 'salmone', floors: 4, roof: 'tetto' });
/* tavolini dei bar con gli ombrelloni */
const umbM = M('#f0ece4', { roughness: 0.8, side: THREE.DoubleSide }), chairM = M('#1e2024', { roughness: 0.5, metalness: 0.3 }), tTop = M('#d8d4cc', { roughness: 0.4 });
function barTable(x, z, umb) {
  mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.05, 16), tTop, G, [x, 0.76, z]); mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.74, 8), chairM, G, [x, 0.38, z]);
  for (let k = 0; k < 3; k++) { const a = k * 2.1 + rnd(); const cx = x + Math.cos(a) * 0.75, cz = z + Math.sin(a) * 0.75;
    mesh(new THREE.BoxGeometry(0.42, 0.05, 0.42), chairM, G, [cx, 0.46, cz]); const b = mesh(new THREE.BoxGeometry(0.42, 0.45, 0.05), chairM, G, [cx + Math.cos(a) * 0.2, 0.7, cz + Math.sin(a) * 0.2]); b.rotation.y = -a + Math.PI / 2;
    for (const s of [-0.18, 0.18]) mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.45, 5), chairM, G, [cx + s, 0.22, cz]); }
  if (umb) { mesh(new THREE.CylinderGeometry(0.04, 0.04, 2.6, 8), M('#8a8a86'), G, [x, 1.3, z]); mesh(new THREE.ConeGeometry(1.9, 0.6, 8, 1, true), umbM, G, [x, 2.55, z]).castShadow = true; }
  S(x, z, 0.9, 0.9, null, 0, 0.78);
}
setSeed(77);
for (let z = -62; z > -100; z -= 3.4) { barTable(-7.6, z, (Math.round(z) % 2) === 0); barTable(7.6, z - 1.2, (Math.round(z) % 2) !== 0); }
for (const z of [-58, -72, -86, -98]) { lamp(-4.2, z, Math.PI / 2); lamp(4.2, z - 6, Math.PI / 2); }
for (const [x, z] of [[-3, -66], [3, -79], [-3, -92]]) { mesh(new THREE.BoxGeometry(1.6, 0.55, 1.6), M('#c8b898', { roughness: 0.8 }), G, [x, 0.28, z]); bush(x, z, 0.8, rnd() < 0.5 ? pinkM : leaf[1]); S(x, z, 1.6, 1.6, null, 0, 0.6); }
bench(-1.6, -60, Math.PI / 2); bench(1.6, -85, -Math.PI / 2);
/* luci calde dei bar */
for (const [x, z] of [[-11.5, -70], [11.5, -88]]) { const l = new THREE.PointLight('#ffcc88', 0.7, 22, 1.4); l.position.set(x, 3.4, z); l.userData.bu = 1; G.add(l); }

/* ================= PIAZZA SAN GIOVANNI E LA BASILICA ================= */
/* pavimento a fasce chiare e grigie a "V" */
const chevTex = ctex(1024, 1024, (g, w, h) => {
  g.fillStyle = '#d8d6d0'; g.fillRect(0, 0, w, h);
  for (let k = 0; k < 22; k++) { g.strokeStyle = k % 2 ? '#8e8c88' : '#c8c6c0'; g.lineWidth = 22; const o = k * 46 - 260;
    g.beginPath(); g.moveTo(-40, o + 600); g.lineTo(w / 2, o); g.lineTo(w + 40, o + 600); g.stroke(); }
  g.fillStyle = 'rgba(80,70,60,.08)'; setSeed(81); for (let i = 0; i < 400; i++) g.fillRect(rnd() * w, rnd() * h, 2 + rnd() * 6, 2 + rnd() * 6);
});
pave(0, -127, 80, 46, texMat(chevTex, { roughness: 0.7 }), 0.008);
pave(-33, -127, 14, 46, porfM(3, 11), 0.01); pave(33, -127, 14, 46, porfM(3, 11), 0.01);
/* palazzi storici ai lati */
bld(-47, -116, 14, 24, { style: 'storico', floors: 4, roof: 'tetto', shops: barsM });
bld(-47, -144, 14, 32, { style: 'salmone', floors: 5, roof: 'tetto', shops: shops2M });
bld(47, -118, 14, 28, { style: 'storico', floors: 4, roof: 'tetto', shops: barsM });
bld(47, -145, 14, 26, { style: 'salmone', floors: 5, shops: shops2M });
bld(-34.5, -177, 39, 34, { style: 'giallo', floors: 4, roof: 'tetto' });
bld(34.5, -175, 39, 38, { style: 'storico', floors: 4, roof: 'tetto' });
bld(32, -153.5, 16, 7, { style: 'giallo', floors: 3, roof: 'tetto' });
bld(-77, -149, 46, 86, { style: 'giallo', floors: 4, roof: 'tetto' });
/* dehors con gli ombrelloni bianchi */
setSeed(88);
for (let z = -110; z > -146; z -= 3.6) { barTable(-34, z, z > -128); barTable(-30.5, z - 1.5, false); barTable(34, z, z < -122); barTable(30.5, z - 1.5, false); }
for (const [x, z] of [[-22, -108], [22, -108], [-22, -140], [22, -140]]) lamp(x, z, 0);
bench(-14, -112, 0); bench(14, -112, 0);

/* ---------- la basilica ---------- */
const CH = STY.chiesa.mat, cream = M('#e4ddcc', { roughness: 0.75 }), cream2 = M('#cfc6b2', { roughness: 0.75 }), woodD = M('#3a2618', { roughness: 0.7 });
function cw(x, z, w, d, h, mat = CH, y0 = 0) { const m = mesh(fgeo(w, h, d, 4, 4), mat, G, [x, y0 + h / 2, z]); m.castShadow = m.receiveShadow = true; if (y0 === 0) S(x, z, w, d, m, h); return m; }
cw(16, -153.5, 2, 7, 12); /* tappa il buco tra chiesa e campanile */
/* muri della navata */
cw(-14.5, -171.5, 1, 41, 20); cw(14.5, -171.5, 1, 41, 20); cw(0, -191.5, 30, 1, 20);
/* facciata: ordine basso con la porta centrale aperta, ordine alto piu' stretto */
cw(-9, -150.5, 12, 1, 15); cw(9, -150.5, 12, 1, 15); cw(0, -150.5, 6, 1, 8.5, CH, 6.5);
const FAC = new THREE.Group(); G.add(FAC);
mesh(new THREE.BoxGeometry(32, 1, 2), cream2, FAC, [0, 15.3, -149.6]);
mesh(new THREE.BoxGeometry(18, 9, 1.4), cream, FAC, [0, 20.3, -150.4]);
mesh(new THREE.BoxGeometry(19, 0.8, 2), cream2, FAC, [0, 25, -149.8]);
{ const sh = new THREE.Shape(); sh.moveTo(-9.5, 0); sh.lineTo(0, 3.4); sh.lineTo(9.5, 0); sh.closePath(); const p = mesh(new THREE.ExtrudeGeometry(sh, { depth: 1.6, bevelEnabled: false }), cream2, FAC, [0, 25.4, -150.6]); p.castShadow = true; }
/* lesene e colonne */
for (const x of [-14.5, -10.5, -6.5, -3.4, 3.4, 6.5, 10.5, 14.5]) { mesh(new THREE.BoxGeometry(1, 14.6, 0.6), cream2, FAC, [x, 7.3, -149.7]); mesh(new THREE.BoxGeometry(1.4, 0.6, 0.9), cream2, FAC, [x, 0.3, -149.6]); }
for (const x of [-8, -3.4, 3.4, 8]) mesh(new THREE.BoxGeometry(0.9, 8.6, 0.5), cream2, FAC, [x, 20.3, -149.5]);
/* porte (le due laterali chiuse, quella centrale aperta) e finestre */
for (const x of [-8.5, 8.5]) { mesh(new THREE.BoxGeometry(2.6, 4.6, 0.2), woodD, FAC, [x, 2.3, -149.9]); mesh(new THREE.BoxGeometry(3.2, 0.5, 0.5), cream2, FAC, [x, 4.9, -149.8]); }
mesh(new THREE.BoxGeometry(6.6, 0.7, 0.8), cream2, FAC, [0, 6.8, -149.7]);
const rose = mesh(new THREE.CylinderGeometry(1.6, 1.6, 0.3, 24), M('#2a2e36', { roughness: 0.2, metalness: 0.4 }), FAC, [0, 20.6, -149.6]); rose.rotation.x = Math.PI / 2;
mesh(new THREE.TorusGeometry(1.7, 0.2, 8, 24), cream2, FAC, [0, 20.6, -149.55]);
for (const x of [-10.5, 10.5]) mesh(new THREE.BoxGeometry(1.4, 3, 0.3), M('#2a2e36'), FAC, [x, 10.4, -149.9]);
/* statue in cima */
const statM = M('#d4ccbc', { roughness: 0.8 });
for (const [x, y] of [[-15, 15.8], [-11, 15.8], [11, 15.8], [15, 15.8], [-8.5, 25.4], [8.5, 25.4], [0, 28.8]]) { mesh(new THREE.CylinderGeometry(0.35, 0.45, 1.6, 8), statM, FAC, [x, y + 0.8, -149.8]); mesh(sph(0.3, 10, 8), statM, FAC, [x, y + 1.85, -149.8]); }
mesh(new THREE.BoxGeometry(0.15, 1.6, 0.15), pole, FAC, [0, 31.4, -149.8]); mesh(new THREE.BoxGeometry(0.9, 0.15, 0.15), pole, FAC, [0, 31.8, -149.8]);
/* tetto della navata */
gable(30, 41, 6, M('#8a8a86', { roughness: 0.8 }), G, 0, 20, -171.5);
mesh(new THREE.BoxGeometry(30, 0.3, 41), cream2, G, [0, 20, -171.5]);
/* gradini davanti */
for (let i = 0; i < 3; i++) { const m = mesh(new THREE.BoxGeometry(22 - i * 2, 0.18 + i * 0.18, 0.9), cream2, G, [0, 0.09 + i * 0.09, -147.4 - i * 0.8]); m.receiveShadow = true; }
/* il campanile di mattoni */
{
  const brickM = texMat(wrap(TEX.brick(), 2, 18), { roughness: 0.9 }), x = 20.5, z = -153.5, H = 40;
  const t = mesh(new THREE.BoxGeometry(7, H, 7), brickM, G, [x, H / 2, z]); t.castShadow = true; S(x, z, 7, 7, t, H);
  for (const y of [10, 20, 30]) mesh(new THREE.BoxGeometry(7.4, 0.4, 7.4), cream2, G, [x, y, z]);
  /* cella campanaria aperta e orologio */
  mesh(new THREE.BoxGeometry(7.6, 0.6, 7.6), cream2, G, [x, H + 0.3, z]);
  for (const [dx, dz] of [[-3.2, -3.2], [3.2, -3.2], [-3.2, 3.2], [3.2, 3.2]]) mesh(new THREE.BoxGeometry(1.2, 5, 1.2), brickM, G, [x + dx, H + 3.1, z + dz]);
  mesh(new THREE.BoxGeometry(7.6, 0.6, 7.6), cream2, G, [x, H + 5.9, z]);
  const bellM = M('#8a6a2a', { roughness: 0.35, metalness: 0.8 }); mesh(new THREE.CylinderGeometry(0.6, 1.2, 1.8, 14), bellM, G, [x, H + 3, z]);
  const spire = mesh(new THREE.ConeGeometry(4.6, 9, 4), M('#5a5a58', { roughness: 0.6 }), G, [x, H + 10.7, z]); spire.rotation.y = Math.PI / 4; spire.castShadow = true;
  mesh(new THREE.BoxGeometry(0.15, 2.4, 0.15), pole, G, [x, H + 16.2, z]); mesh(new THREE.BoxGeometry(1.1, 0.15, 0.15), pole, G, [x, H + 16.8, z]);
  const clock = ctex(256, 256, (g) => { g.fillStyle = '#f2ece0'; g.beginPath(); g.arc(128, 128, 120, 0, 6.28); g.fill(); g.strokeStyle = '#2a2a2a'; g.lineWidth = 8; g.stroke();
    for (let i = 0; i < 12; i++) { const a = i / 12 * 6.28; g.fillStyle = '#2a2a2a'; g.fillRect(128 + Math.cos(a) * 96 - 5, 128 + Math.sin(a) * 96 - 5, 10, 10); }
    g.lineWidth = 10; g.beginPath(); g.moveTo(128, 128); g.lineTo(128, 50); g.stroke(); g.lineWidth = 7; g.beginPath(); g.moveTo(128, 128); g.lineTo(186, 150); g.stroke(); });
  const cm = new THREE.MeshStandardMaterial({ map: clock, transparent: true, roughness: 0.6 });
  plane(3.6, 3.6, cm, G, [x, H - 6, z + 3.52]); plane(3.6, 3.6, cm, G, [x - 3.52, H - 6, z], [0, -Math.PI / 2, 0]);
}

/* ---------- dentro la basilica ---------- */
const marble = texMat(wrap(ctex(128, 128, (g, w, h) => { g.fillStyle = '#d8d2c4'; g.fillRect(0, 0, w, h); g.fillStyle = '#8a7a6a'; g.fillRect(0, 0, 64, 64); g.fillRect(64, 64, 64, 64); g.strokeStyle = 'rgba(255,255,255,.2)'; g.beginPath(); g.moveTo(0, 30); g.bezierCurveTo(40, 10, 80, 60, 128, 40); g.stroke(); }), 10, 14), { roughness: 0.3 });
pave(0, -171, 28, 40, marble, 0.015);
flat(mesh(new THREE.PlaneGeometry(28, 40), M('#c8b896', { roughness: 0.9, side: THREE.DoubleSide }), G, [0, 14, -171], [Math.PI / 2, 0, 0]));
/* pareti interne piu' calde con le cappelle */
for (const s of [-1, 1]) { mesh(new THREE.PlaneGeometry(40, 14), M('#e2d4b4', { roughness: 0.85 }), G, [s * 13.95, 7, -171], [0, -s * Math.PI / 2, 0]);
  for (let k = 0; k < 4; k++) { const z = -160 - k * 8; mesh(new THREE.BoxGeometry(0.2, 5, 3.4), M('#5a3a2a'), G, [s * 13.85, 3.5, z]); mesh(new THREE.BoxGeometry(0.15, 2.4, 2), M('#c8a050', { emissive: '#6a4a10', emissiveIntensity: 0.3, metalness: 0.6 }), G, [s * 13.78, 3.8, z]);
    mesh(new THREE.BoxGeometry(0.2, 3.2, 1.6), M('#3a5a8a', { emissive: '#2a4a8a', emissiveIntensity: 0.5 }), G, [s * 13.9, 10.5, z]); } }
mesh(new THREE.PlaneGeometry(28, 14), M('#e2d4b4', { roughness: 0.85 }), G, [0, 7, -190.95]);
/* colonne della navata */
const colIn = M('#d8cfbe', { roughness: 0.5 });
for (const x of [-7, 7]) for (let z = -158; z >= -184; z -= 6.5) { mesh(new THREE.CylinderGeometry(0.55, 0.65, 13.4, 16), colIn, G, [x, 6.7, z]).castShadow = true; mesh(new THREE.BoxGeometry(1.6, 0.6, 1.6), colIn, G, [x, 13.5, z]); mesh(new THREE.BoxGeometry(1.6, 0.5, 1.6), colIn, G, [x, 0.25, z]); S(x, z, 1.4, 1.4); }
/* panche di legno */
const pewM = M('#5a3a24', { roughness: 0.65 });
for (const s of [-1, 1]) for (let z = -157; z >= -177; z -= 2.2) { const x = s * 3.4; mesh(new THREE.BoxGeometry(5, 0.1, 0.5), pewM, G, [x, 0.48, z]); mesh(new THREE.BoxGeometry(5, 0.6, 0.08), pewM, G, [x, 0.8, z + 0.28]); for (const e of [-2.4, 2.4]) mesh(new THREE.BoxGeometry(0.08, 0.95, 0.65), pewM, G, [x + e, 0.48, z]); S(x, z, 5, 0.65, null, 0, 0.55); }
/* presbiterio con l'altare */
const stepM = M('#c8beac', { roughness: 0.5 });
mesh(new THREE.BoxGeometry(26, 0.4, 10), stepM, G, [0, 0.2, -186]); S(0, -186, 26, 10, null, 0, 0.4);
mesh(new THREE.BoxGeometry(5, 1.1, 1.6), M('#eae2d0', { roughness: 0.4 }), G, [0, 0.95, -188]); S(0, -188, 5, 1.6, null, 0, 1.5);
mesh(new THREE.BoxGeometry(5.4, 0.12, 1.9), M('#c8a050', { metalness: 0.6, roughness: 0.3 }), G, [0, 1.56, -188]);
mesh(new THREE.BoxGeometry(8, 9, 0.4), M('#6a4a2a', { roughness: 0.6 }), G, [0, 5, -190.6]);
mesh(new THREE.BoxGeometry(5, 6, 0.2), M('#c8a050', { emissive: '#7a5a10', emissiveIntensity: 0.4, metalness: 0.7, roughness: 0.3 }), G, [0, 5.4, -190.35]);
mesh(new THREE.BoxGeometry(0.3, 3.2, 0.3), M('#c8a050', { metalness: 0.8 }), G, [0, 5.4, -190.1]); mesh(new THREE.BoxGeometry(1.8, 0.3, 0.3), M('#c8a050', { metalness: 0.8 }), G, [0, 6.3, -190.1]);
/* candele */
const flameM = M('#ffcc66', { emissive: '#ff9a20', emissiveIntensity: 1.2 }), flames = [];
for (const x of [-2, -1, 1, 2]) { mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.4, 8), whiteM, G, [x, 1.82, -188]); flames.push(mesh(sph(0.06, 6, 5), flameM, G, [x, 2.08, -188])); }
/* il sigillo delle catacombe nel pavimento: chiuso, con il simbolo dei Mammutones */
const sealTex = ctex(256, 256, (g) => { g.fillStyle = '#4a4440'; g.fillRect(0, 0, 256, 256); g.strokeStyle = '#2a2420'; g.lineWidth = 6; g.strokeRect(8, 8, 240, 240);
  g.strokeStyle = '#a03a2a'; g.lineWidth = 5; g.beginPath(); g.arc(128, 128, 96, 0, 6.28); g.stroke(); g.beginPath(); g.arc(128, 128, 60, 0, 6.28); g.stroke();
  /* maschera con le corna stilizzata */
  g.fillStyle = '#a03a2a'; g.beginPath(); g.ellipse(128, 136, 30, 38, 0, 0, 6.28); g.fill(); g.fillStyle = '#4a4440'; g.fillRect(110, 124, 12, 8); g.fillRect(134, 124, 12, 8); g.fillRect(118, 150, 20, 5);
  g.strokeStyle = '#a03a2a'; g.lineWidth = 7; g.beginPath(); g.moveTo(104, 110); g.quadraticCurveTo(84, 80, 96, 60); g.moveTo(152, 110); g.quadraticCurveTo(172, 80, 160, 60); g.stroke();
  g.lineWidth = 2; g.beginPath(); g.moveTo(128, 8); g.lineTo(128, 248); g.stroke(); });
export const buSeal = mesh(new THREE.PlaneGeometry(3.4, 3.4), new THREE.MeshStandardMaterial({ map: sealTex, emissive: '#ff3010', emissiveMap: sealTex, emissiveIntensity: 0.15, roughness: 0.6 }), G, [0, 0.42, -182.5], [-Math.PI / 2, 0, 0]);
/* luci della chiesa */
const chLights = [];
for (const [x, y, z] of [[0, 9, -161], [0, 9, -175], [0, 6, -186]]) { const l = new THREE.PointLight('#ffd8a0', 0.95, 28, 1.3); l.position.set(x, y, z); l.userData.bu = 1; G.add(l); chLights.push(l); }
/* lampadari */
for (const z of [-160, -174]) { mesh(new THREE.TorusGeometry(1, 0.06, 6, 18), M('#c8a050', { metalness: 0.8 }), G, [0, 10, z], [Math.PI / 2, 0, 0]); mesh(new THREE.CylinderGeometry(0.02, 0.02, 4, 4), pole, G, [0, 12, z]); }

/* oggetti animati: fuori dalla fusione delle mesh statiche */
export const buAnim = [...jets, ...flames];
/* ---------- animazioni ---------- */
const tmp = new THREE.Vector3();
export function updateBU(t, dt = 0.016) {
  jets.forEach((j, i) => { const k = 1 + Math.sin(t * 9 + i * 1.7) * 0.05; j.scale.set(k, i % 2 ? 1 : 1 + Math.sin(t * 5 + i) * 0.04, k); });
  for (let i = 0; i < DN; i++) { const d = dv[i]; d.t += dt; if (d.t > 1.2) { d.t = 0; d.k = Math.floor(Math.random() * 3); d.a = Math.random() * 6.28; d.r = 0.2 + Math.random() * 1.1; }
    const b = JB[d.k], s = d.t / 1.2; tmp.set(b[0] + Math.cos(d.a) * d.r * s * 1.4, b[2] + 4.6 - 5 * s * s, b[1] + Math.sin(d.a) * d.r * s * 1.4); dp[i * 3] = FX + tmp.x; dp[i * 3 + 1] = Math.max(0.5, tmp.y); dp[i * 3 + 2] = FZ + tmp.z; }
  dropsGeo.attributes.position.needsUpdate = true;
  flames.forEach((f, i) => f.scale.setScalar(0.85 + Math.sin(t * 17 + i * 2) * 0.2));
  buSeal.material.emissiveIntensity = 0.12 + Math.sin(t * 1.4) * 0.06;
}
