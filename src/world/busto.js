/* Mondo 4: il centro di Busto Arsizio (per ora solo la mappa, da esplorare).
   Piazza Garibaldi con la fontana -> a est (a destra) i portici e la torre grigia col fast food (il "Mac")
   -> a nord via Fratelli d'Italia, il corso coi bar e piazza San Giovanni con la basilica e il campanile.
   Dentro la chiesa c'e' gia' il sigillo delle catacombe (chiuso).
   Tutto il mondo sta lontano dagli altri (x = +1000). Nord = z negativo. */
import * as THREE from 'three';
import { scene, solid } from '../render/engine.js';
import { M, rbox, mesh, sph, ctex, texMat, label, plane, rnd, setSeed, TEX } from './kit.js';
import { makeCar } from './parking.js';
import { buildSheep } from '../characters/styled.js';

export const BX = 1000;
const ROOT = new THREE.Group(); ROOT.position.x = BX; scene.add(ROOT);
let G = ROOT, OXo = 0, OZo = 0; /* G e lo spostamento cambiano solo per costruire la torre del Mac */
const S = (x, z, w, d, m, h, top) => solid(BX + OXo + x, OZo + z, w, d, m, h, top);

/* ---------- confini, zone, interni ---------- */
export const BUB = { x1: BX - 54, x2: BX + 100, z1: -192, z2: 46 };
export const MACIN = { x1: BX + 34.5, x2: BX + 49.4, z1: 0.3, z2: 23.7, ceil: 4.3 };
export const CHIESA = { x1: BX - 14, x2: BX + 14, z1: -191, z2: -151, ceil: 13.6 };
export const inBU = p => p.x > 800;
export const inMac = p => p.x > MACIN.x1 - 0.2 && p.x < MACIN.x2 + 0.3 && p.z > MACIN.z1 && p.z < MACIN.z2;
export const inChiesa = p => p.x > CHIESA.x1 && p.x < CHIESA.x2 && p.z < CHIESA.z2 + 0.3 && p.z > CHIESA.z1;
/* le zone (servono dopo per nemici e boss) */
export const buRegion = p => (p.x > BX + 500 ? 'bsard' : p.x > BX + 270 ? 'bcata' : inChiesa(p) ? 'bchiesa' : inMac(p) ? 'bmacin' : p.z < -104 ? 'bpiazza' : p.z < -53 ? 'bbar' : 'bfontana');
/* sotto i portici la camera resta bassa */
export const BU_LOW = [
  { x1: BX - 13.2, x2: BX - 10, z1: -104, z2: -4, ceil: 4 }, { x1: BX + 10, x2: BX + 13.2, z1: -104, z2: -4, ceil: 4 },
  { x1: BX + 30, x2: BX + 34.4, z1: 0, z2: 24, ceil: 4.2 },
];
export const BU_START = { x: BX + 0, z: 31, yaw: 0 };
/* posti per la storia (dopo) */
export const BU_SPOTS = {
  pierre: { x: BX + 0, z: 12 }, corti: { x: BX + 41, z: 12 }, gt: { x: BX + 20.5, z: 22 },
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
pave(23, -73, 154, 238, asphM, 0.002);

/* ================= PIAZZA GARIBALDI E LA FONTANA ================= */

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
bld(-41, 6, 26, 20, { style: 'giallo', floors: 3, roof: 'tetto', shops: shops2M });
bld(-41, 31, 26, 30, { style: 'storico', floors: 4, roof: 'tetto' });
bld(-42, -32, 24, 56, { style: 'giallo', floors: 4, roof: 'tetto' });
bld(1, 43, 54, 6, { style: 'giallo', floors: 3, roof: 'tetto' });
pave(-25, 10, 4, 52, porfM(1, 13), 0.006);
/* a destra (est): la torre grigia col Mac proprio sulla piazza, e i palazzi intorno */
bld(45, 39, 38, 14, { style: 'balconi', floors: 9, balc: 'n', gh: 4.4 });
bld(82, 8, 36, 76, { style: 'verde', floors: 5 });
bld(47, -19, 34, 22, { style: 'rosa', floors: 6, gh: 4.2, shops: shopsM });
/* la torre e' staccata dai palazzi vicini: intorno solo marciapiede */
pave(47, 12, 34, 40, porfM(8, 10), 0.005);
/* marciapiede davanti al Mac, aiuole coi cespugli e i pioppi come nella foto */
pave(26, 12, 8, 32, porfM(2, 8), 0.007);
for (const z0 of [3, 21]) { pave(25.2, z0, 2.6, 7, grassM, 0.012); curb(25.2, z0 - 3.6, 2.8, 0.25); curb(25.2, z0 + 3.6, 2.8, 0.25); curb(23.8, z0, 0.25, 7.2); curb(26.6, z0, 0.25, 7.2);
  for (const dz of [-2.4, 0, 2.4]) bush(25.2, z0 + dz, 0.9); poplar(25.2, z0); S(25.2, z0, 2.6, 7, null, 0, 0.3); }
/* macchine: una e' la GT di Corti (dopo) */
makeCar(BX + 20.5, -1, 0, '#c8ccd0', false); makeCar(BX + 20.5, 30.5, 0, '#4a5a6a', false);
makeCar(BU_SPOTS.gt.x, BU_SPOTS.gt.z, 0, '#1c2028', false);
const gtCar = scene.children.find(c => c.isGroup && Math.abs(c.position.x - BU_SPOTS.gt.x) < 0.01 && Math.abs(c.position.z - BU_SPOTS.gt.z) < 0.01);

/* ================= LA TORRE GRIGIA (13 piani) CON IL FAST FOOD AL PIANO TERRA ================= */
const FFG = new THREE.Group(); FFG.position.set(-32, 0, 22); ROOT.add(FFG); G = FFG; OXo = -32; OZo = 22;
const TW = { x: 72, z: -10, w: 20, d: 24 }, TGH = 4.6, TH = TGH + 16 * STY.torre.fl;
{
  const up = mesh(fgeo(TW.w, TH - TGH, TW.d, STY.torre.bay, STY.torre.fl), STY.torre.mat, G, [TW.x, TGH + (TH - TGH) / 2, TW.z]); up.castShadow = up.receiveShadow = true;
  mesh(new THREE.BoxGeometry(TW.w + 0.4, 0.4, TW.d + 0.4), stoneCol, G, [TW.x, TH, TW.z]); mesh(new THREE.BoxGeometry(TW.w - 0.6, 0.1, TW.d - 0.6), flatRoof, G, [TW.x, TH + 0.25, TW.z]);
  for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) mesh(new THREE.CylinderGeometry(0.04, 0.04, 3, 6), pole, G, [TW.x + x * (TW.w / 2 - 1), TH + 1.6, TW.z + z * (TW.d / 2 - 1)]);
  /* fascia scura sopra le vetrine, come nella foto */
  mesh(new THREE.BoxGeometry(0.3, 0.9, TW.d), M('#3a2e28', { roughness: 0.6 }), G, [TW.x - TW.w / 2 + 4.6, TGH - 0.6, TW.z]);
  /* colonne del porticato davanti al fast food */
  for (let i = 0; i < 6; i++) { const z = TW.z - TW.d / 2 + 0.8 + i * (TW.d - 1.6) / 5; mesh(new THREE.BoxGeometry(0.9, TGH, 0.9), stoneCol, G, [TW.x - TW.w / 2 + 0.45, TGH / 2, z]).castShadow = true; S(TW.x - TW.w / 2 + 0.45, z, 0.9, 0.9); }
  mesh(new THREE.BoxGeometry(4.4, 0.2, TW.d), portCeil, G, [TW.x - TW.w / 2 + 2.2, TGH - 0.1, TW.z]);
}
pave(64.2, -10, 4.4, 24, porfM(1, 6), 0.008);
/* ---------- dentro il fast food ---------- */
const ffTile = texMat(wrap(ctex(128, 128, (g, w, h) => { g.fillStyle = '#c8bfb2'; g.fillRect(0, 0, w, h); g.fillStyle = '#b4aa9c'; g.fillRect(0, 0, 64, 64); g.fillRect(64, 64, 64, 64); g.fillStyle = 'rgba(0,0,0,.08)'; g.fillRect(0, 63, w, 2); g.fillRect(63, 0, 2, h); }), 8, 12), { roughness: 0.4 });
pave(74.2, -10, 15.6, 23.4, ffTile, 0.015);
const ffWall = M('#4a3a32', { roughness: 0.7 }), ffWall2 = M('#d8c8a8', { roughness: 0.8 }), ffGlass = new THREE.MeshStandardMaterial({ color: '#7a9aaa', roughness: 0.05, metalness: 0.5, transparent: true, opacity: 0.35 });
function ffw(x, z, w, d, mat = ffWall2, h = TGH) { const m = mesh(new THREE.BoxGeometry(w, h, d), mat, G, [x, h / 2, z]); m.receiveShadow = true; S(x, z, w, d, m, h); return m; }
/* muri: est, nord, sud pieni; ovest vetrata (verso la piazza) con la porta in mezzo (z -13..-9) */
ffw(81.7, -10, 0.6, 24); ffw(72, -21.7, 20, 0.6); ffw(72, 1.7, 20, 0.6);
ffw(66.3, -17.5, 0.4, 9, ffGlass); ffw(66.3, -3.5, 0.4, 11, ffGlass);
mesh(new THREE.BoxGeometry(0.5, 0.9, 4.2), ffWall, G, [66.3, TGH - 0.45, -11]);
flat(mesh(new THREE.PlaneGeometry(16, 24), M('#e8e2d6', { roughness: 0.9, side: THREE.DoubleSide }), G, [74, 4.35, -10], [Math.PI / 2, 0, 0]));
/* insegna generica sopra l'ingresso */
plane(7, 1, new THREE.MeshStandardMaterial({ map: label('FAST FOOD', { font: '900 82px Arial Black,Arial,sans-serif', bg: '#2a1e18', color: '#f4d48a', w: 512, h: 80, shadow: null }), emissive: '#ffffff', emissiveIntensity: 0.25 }), G, [61.4, 3.6, -11], [0, -Math.PI / 2, 0]);
plane(4.4, 0.9, new THREE.MeshStandardMaterial({ map: label('BURGER', { font: '900 80px Arial Black,Arial,sans-serif', bg: '#2a1e18', color: '#f4d48a', w: 512, h: 90, shadow: null }), emissive: '#ffffff', emissiveIntensity: 0.2 }), G, [61.4, 3.6, -18.8], [0, -Math.PI / 2, 0]);
/* bancone in fondo, cucina, menu luminosi */
const counterM = M('#3a2a22', { roughness: 0.5 }), counterTop = M('#b8b4ac', { roughness: 0.25, metalness: 0.4 });
mesh(new THREE.BoxGeometry(1.2, 1.05, 14), counterM, G, [77.6, 0.52, -10]); mesh(new THREE.BoxGeometry(1.4, 0.06, 14.2), counterTop, G, [77.6, 1.08, -10]); S(77.6, -10, 1.2, 14, null, 0, 1.1);
for (const z of [-15, -11.5, -8, -4.5]) { mesh(new THREE.BoxGeometry(0.4, 0.3, 0.5), M('#202428'), G, [77.8, 1.26, z]); mesh(new THREE.BoxGeometry(0.05, 0.3, 0.4), M('#6ad0ff', { emissive: '#3a90c0', emissiveIntensity: 0.6 }), G, [77.58, 1.32, z]); }
mesh(new THREE.BoxGeometry(2.4, 4.3, 14), M('#9aa0a6', { roughness: 0.3, metalness: 0.6 }), G, [80.2, 2.15, -10]); /* cucina d'acciaio dietro */
const menuTex = ctex(1024, 256, (g) => { g.fillStyle = '#1e1a18'; g.fillRect(0, 0, 1024, 256); const items = [['BURGER', '#e8a03a'], ['PATATINE', '#e8c84a'], ['BIBITE', '#5ab0e8'], ['GELATI', '#e87ab0']];
  items.forEach(([n, c], i) => { const x = i * 256; g.fillStyle = c; g.beginPath(); g.arc(x + 128, 100, 56, 0, 6.28); g.fill(); g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(x + 84, 96, 88, 10);
    g.fillStyle = '#f6f0e4'; g.font = '700 34px Arial,sans-serif'; g.textAlign = 'center'; g.fillText(n, x + 128, 200); g.font = '600 26px Arial'; g.fillStyle = '#c8c0b0'; g.fillText((4 + i * 1.5).toFixed(2) + ' €', x + 128, 236); }); });
plane(11, 2.75, new THREE.MeshStandardMaterial({ map: menuTex, emissive: '#ffffff', emissiveMap: menuTex, emissiveIntensity: 0.55 }), G, [78.95, 2.8, -10], [0, -Math.PI / 2, 0]);
/* totem per ordinare vicino all'ingresso */
for (const z of [-17.5, -15.5, -6.5, -4.5]) { mesh(new THREE.BoxGeometry(0.45, 1.9, 0.7), M('#e8e6e2', { roughness: 0.4 }), G, [68.2, 0.95, z]); mesh(new THREE.BoxGeometry(0.05, 0.9, 0.55), M('#3a8ad0', { emissive: '#2a6aa0', emissiveIntensity: 0.7 }), G, [68.45, 1.3, z]); S(68.2, z, 0.5, 0.75); }
/* tavoli e sedute */
const tblM = M('#d8d0c0', { roughness: 0.4 }), seatM = M('#6a3a2a', { roughness: 0.6 }), legM = M('#2a2a2c', { metalness: 0.5, roughness: 0.4 });
for (const x of [71.2, 74.6]) for (const z of [-19.4, -15.6, -4.6, -0.8]) {
  mesh(new THREE.BoxGeometry(1.4, 0.06, 0.9), tblM, G, [x, 0.75, z]); mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.72, 8), legM, G, [x, 0.38, z]);
  for (const s of [-1, 1]) { mesh(new THREE.BoxGeometry(1.4, 0.45, 0.5), seatM, G, [x, 0.23, z + s * 0.85]); mesh(new THREE.BoxGeometry(1.4, 0.6, 0.12), seatM, G, [x, 0.75, z + s * 1.1]); }
  S(x, z, 1.4, 2.4, null, 0, 0.78);
}
for (const z of [-20.8, 0.8]) { mesh(new THREE.BoxGeometry(1, 1.2, 0.6), M('#5a4a3a'), G, [68, 0.6, z]); S(68, z, 1, 0.6, null, 0, 1.2); }
const ffLights = [];
for (const [x, z] of [[70.5, -10], [75.5, -10]]) { const l = new THREE.PointLight('#fff2dc', 0.9, 20, 1.4); l.position.set(x, 3.9, z); l.userData.bu = 1; G.add(l); ffLights.push(l); mesh(new THREE.BoxGeometry(1.4, 0.06, 1.4), lampM, G, [x, 4.3, z]); }

G = ROOT; OXo = 0; OZo = 0;

/* ================= VIA FRATELLI D'ITALIA (verso il corso) ================= */
bld(-20, -29, 20, 50, { style: 'balconi', floors: 10, por: 'e', dep: 3.2, balc: 'e', gh: 4.4, shops: shopsM });
bld(20, -29, 20, 50, { style: 'rosa', floors: 7, por: 'w', dep: 3.2, gh: 4.2, shops: shops2M });
pave(-11.6, -29, 3.2, 50, porfM(1, 12), 0.007); pave(11.6, -29, 3.2, 50, porfM(1, 12), 0.007);
for (const z of [-14, -28, -42]) { lamp(-9.4, z, 0); lamp(9.4, z - 7, 0); }
for (const [x, z] of [[-9, -20], [9, -38], [-9, -48]]) tree(x, z, 0.9);
zebra(0, -52, 8, true);
/* riempimento dietro (case vecchie) */
bld(66, -45, 72, 30, { style: 'giallo', floors: 4, roof: 'tetto' });

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
bld(-47, -82, 14, 44, { style: 'salmone', floors: 4, roof: 'tetto' });
bld(77, -82, 46, 44, { style: 'salmone', floors: 4, roof: 'tetto' });
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
bld(77, -149, 46, 86, { style: 'giallo', floors: 4, roof: 'tetto' });
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

/* ===================================================================================
   STORIA DEL MONDO 4: la citta' distrutta, porte e barricate, catacombe, Sardegna
   =================================================================================== */
export const buDyn = [];   /* oggetti che cambiano o si muovono: fuori dalla fusione delle mesh */
/* ---------- la GT di Corti: si puo' rigare ---------- */
export const buGT = gtCar;
{
  /* scritta GT dietro e la riga rossa davanti come una Golf GT */
  const red = M('#d02a2a', { roughness: 0.4 }); mesh(new THREE.BoxGeometry(1.5, 0.04, 0.02), red, buGT, [0, 0.66, 2.06]);
  plane(0.42, 0.16, new THREE.MeshStandardMaterial({ map: label('GT', { font: '900 90px Arial Black,Arial', color: '#e8e8e8', bg: '#1c2028', w: 256, h: 100, shadow: null }) }), buGT, [0, 0.82, -2.06], [0, Math.PI, 0]);
  const sc = new THREE.Group(); sc.visible = false; buGT.add(sc); buGT.userData.scratch = sc; const wm = M('#e8e8e0', { roughness: 0.4 });
  setSeed(91); for (const sd of [-1, 1]) for (let k = 0; k < 5; k++) mesh(new THREE.BoxGeometry(0.01, 0.015, 0.8 + rnd() * 1.4), wm, sc, [sd * 0.94, 0.5 + rnd() * 0.3, (rnd() - 0.5) * 2], [(rnd() - 0.5) * 0.3, 0, 0]);
  buDyn.push(buGT);
}
/* ---------- la citta' distrutta: macchine bruciate, macerie, fuochi, fumo ---------- */
const rubbleM = [M('#7a7672', { roughness: 0.95 }), M('#8e8478', { roughness: 0.95 }), M('#5a5652', { roughness: 0.95 }), M('#9a6a4a', { roughness: 0.9 })];
function rubble(x, z, n = 10, s = 1, solidIt = true) {
  setSeed(Math.abs(Math.floor(x * 13 + z * 7)) + 3);
  for (let i = 0; i < n; i++) { const m = mesh(new THREE.DodecahedronGeometry((0.25 + rnd() * 0.45) * s, 0), rubbleM[i % 4], G, [x + (rnd() - 0.5) * 2.4 * s, 0.15 * s, z + (rnd() - 0.5) * 2.4 * s], [rnd() * 3, rnd() * 3, rnd() * 3], [1, 0.6, 1]); m.castShadow = true; }
  for (let i = 0; i < 3; i++) mesh(new THREE.BoxGeometry(0.15 * s, 0.15 * s, 1.6 * s), M('#6a6a6e', { roughness: 0.6, metalness: 0.4 }), G, [x + (rnd() - 0.5) * 2, 0.2, z + (rnd() - 0.5) * 2], [0.2, rnd() * 3, 0.3]);
  if (solidIt) S(x, z, 1.8 * s, 1.8 * s, null, 0, 0.5 * s);
}
function scorch(x, z, r = 2.5) { flat(mesh(new THREE.CircleGeometry(r, 16), new THREE.MeshBasicMaterial({ color: '#141210', transparent: true, opacity: 0.55, depthWrite: false }), G, [x, 0.02, z], [-Math.PI / 2, 0, 0])); }
const fireMs = [new THREE.MeshBasicMaterial({ color: '#ff7a1a', transparent: true, opacity: 0.85, depthWrite: false }), new THREE.MeshBasicMaterial({ color: '#ffd24a', transparent: true, opacity: 0.9, depthWrite: false })];
export const buFires = [];
function fire(x, y, z, s = 1) {
  const g = new THREE.Group(); g.position.set(x, y, z); G.add(g);
  for (let k = 0; k < 4; k++) { const c = mesh(new THREE.ConeGeometry((0.35 - k * 0.05) * s, (1.1 + k * 0.2) * s, 7), fireMs[k % 2], g, [(k - 1.5) * 0.18 * s, (0.5 + k * 0.08) * s, (k % 2 - 0.5) * 0.2 * s]); c.userData.ph = k * 1.7; }
  buFires.push(g); buDyn.push(g); return g;
}
const smokeM = new THREE.MeshBasicMaterial({ color: '#3a3836', transparent: true, opacity: 0.32, depthWrite: false });
export const buSmoke = [];
function smoke(x, z, y0 = 1) { for (let k = 0; k < 6; k++) { const m = mesh(new THREE.SphereGeometry(1, 10, 8), smokeM, G, [x, y0, z]); m.userData = { x, z, y0, t: k / 6 }; buSmoke.push(m); buDyn.push(m); } }
function jersey(x, z, rot = 0) { const m = mesh(new THREE.BoxGeometry(2, 0.85, 0.55), M('#c8c4bc', { roughness: 0.8 }), G, [x, 0.42, z], [0, rot, 0]); m.castShadow = true; mesh(new THREE.BoxGeometry(2.02, 0.12, 0.57), M('#c83a2a', { roughness: 0.7 }), G, [x, 0.7, z], [0, rot, 0]); const h = Math.abs(Math.sin(rot)) > 0.5; S(x, z, h ? 0.6 : 2, h ? 2 : 0.6, null, 0, 0.85); }
/* macchine bruciate e casino per tutta la citta' */
[[-18, 30, 0.4], [16, -1, 1.3], [-6, -36, 0.2], [6, -20, 2.9], [-17, 2, 1.7], [0, 34.5, 1.57]].forEach(([x, z, r]) => makeCar(BX + x, z, r, '#2e2826', true));
[[-20, 33], [17, 1], [-5, -34], [5, -22], [-2, -70], [4, -96], [-30, -118], [28, -140], [0, -128], [24, 18]].forEach(([x, z], i) => scorch(x, z, 2 + (i % 3)));
[[-16, 28], [18, 4], [-4, -40], [8, -60], [-6, -88], [24, -120], [-26, -134], [12, -144], [-22, 6], [40, -2], [2, -116]].forEach(([x, z], i) => rubble(x, z, 9 + (i % 4), 0.9 + (i % 3) * 0.2));
fire(-18, 0.9, 30, 1.1); fire(16, 0.9, -1, 1); fire(-6, 0.9, -36, 1); fire(-30, 0, -118, 0.9); fire(28, 0, -140, 1.1); fire(4, 0, -96, 0.8); fire(24, 0, 18, 0.8);
smoke(-18, 30, 2); smoke(16, -1, 2); smoke(-6, -36, 2); smoke(28, -140, 1.5); smoke(-30, -118, 1.5);
/* fumo che esce dalla torre e dai palazzi */
smoke(52, 10, 64); smoke(-40, 31, 22); smoke(30, -75, 22);
for (const [x, z, r] of [[-12, 26, 0.2], [12, 27, -0.3], [-24, -10, 1.57], [19, -50, 0.3], [-9, -100, 0.1], [9, -60, -0.2], [-36, -150, 0.5]]) jersey(x, z, r);
/* cassonetti rovesciati */
for (const [x, z, r] of [[-23, 20, 0.6], [23, -3, 1.8], [-9, -58, 0.4], [9, -104 + 3, 2.2], [36, -104 - 3, 1.1]]) { const m = mesh(new THREE.BoxGeometry(1.6, 1.1, 1.0), M('#3a5a3a', { roughness: 0.6 }), G, [x, 0.5, z], [0, r, 1.4]); m.castShadow = true; S(x, z, 1.4, 1.4, null, 0, 1.0); }
/* striscioni dei Mammutones appesi ai palazzi */
const banTex = ctex(256, 512, (g) => { g.fillStyle = '#1a1410'; g.fillRect(0, 0, 256, 512); g.strokeStyle = '#a03a2a'; g.lineWidth = 10; g.beginPath(); g.arc(128, 200, 80, 0, 6.28); g.stroke(); g.fillStyle = '#a03a2a'; g.beginPath(); g.ellipse(128, 210, 34, 44, 0, 0, 6.28); g.fill();
  g.lineWidth = 9; g.beginPath(); g.moveTo(98, 170); g.quadraticCurveTo(70, 120, 86, 96); g.moveTo(158, 170); g.quadraticCurveTo(186, 120, 170, 96); g.stroke(); g.fillStyle = '#e8d8c0'; g.font = '900 44px Arial Black,Arial'; g.textAlign = 'center'; g.fillText('BUSTO', 128, 360); g.fillText('È NOSTRA', 128, 420); });
const banM = new THREE.MeshStandardMaterial({ map: banTex, side: THREE.DoubleSide, roughness: 0.9 });
for (const [x, y, z, r] of [[-27.7, 9, 6, Math.PI / 2], [29.7, 12, 12, -Math.PI / 2], [-9.7, 12, -30, Math.PI / 2], [9.7, 12, -70, -Math.PI / 2], [-39.7, 10, -128, Math.PI / 2]]) plane(3, 6, banM, G, [x, y, z], [0, r, 0]);

/* ---------- porte e barricate ---------- */
/* la porta a vetri del fast food (chiusa finche' non paghi) */
export const buMacDoor = new THREE.Group(); G.add(buMacDoor);
{ const gl = new THREE.MeshStandardMaterial({ color: '#8ab0c0', roughness: 0.05, metalness: 0.5, transparent: true, opacity: 0.5 }), fr = M('#2a2420', { roughness: 0.5 });
  for (const sd of [-1, 1]) { mesh(new THREE.BoxGeometry(0.12, 3.4, 1.9), gl, buMacDoor, [34.3, 1.7, 11 + sd * 1]); mesh(new THREE.BoxGeometry(0.16, 3.4, 0.1), fr, buMacDoor, [34.3, 1.7, 11 + sd * 1.95]); }
  mesh(new THREE.BoxGeometry(0.2, 0.08, 1.2), steel, buMacDoor, [34.15, 1.1, 11]);
  plane(1.6, 0.5, new THREE.MeshStandardMaterial({ map: label('CHIUSO', { font: '900 70px Arial Black,Arial', color: '#ffffff', bg: '#c0302a', w: 320, h: 100, shadow: null }) }), buMacDoor, [34.1, 2.2, 11], [0, -Math.PI / 2, 0]);
  buDyn.push(buMacDoor); }
export const buMacSolid = S(34.3, 11, 0.5, 4.1, null, 3);
/* barricata in fondo a via Fratelli d'Italia: per i bar */
function barricade(z, tag) {
  const g = new THREE.Group(); G.add(g);
  const crate = M('#7a5a36', { roughness: 0.85 }), sand = M('#a8946a', { roughness: 1 }), wire = M('#9aa0a6', { roughness: 0.4, metalness: 0.7 });
  setSeed(Math.abs(z) * 3 + 1);
  for (let x = -12.6; x <= 12.6; x += 1.8) { const tall = rnd() < 0.4; mesh(new THREE.BoxGeometry(1.6, tall ? 2.4 : 1.4, 1.2), rnd() < 0.5 ? crate : sand, g, [x, tall ? 1.2 : 0.7, z + (rnd() - 0.5) * 0.4], [0, (rnd() - 0.5) * 0.3, 0]); }
  for (let x = -12; x <= 12; x += 3) { mesh(new THREE.CylinderGeometry(0.05, 0.05, 2.8, 6), wire, g, [x, 1.4, z + 0.8]); }
  for (let k = 0; k < 3; k++) mesh(new THREE.TorusGeometry(0.35, 0.02, 4, 10), wire, g, [-11 + k * 11, 2.6, z + 0.8], [0, Math.PI / 2, 0], [1, 1, 30]);
  plane(4, 1, new THREE.MeshStandardMaterial({ map: label(tag, { font: '900 64px Arial Black,Arial', color: '#1a1a1a', bg: '#f2c14e', w: 512, h: 128, shadow: null }), side: THREE.DoubleSide }), g, [0, 2.8, z + 0.7]);
  g.traverse(o => { if (o.isMesh) o.castShadow = true; }); buDyn.push(g);
  return { g, solid: S(0, z, 27, 1.6, null, 3) };
}
export const buBarGate = barricade(-52, 'STRADA CHIUSA');
export const buPiazzaGate = barricade(-104, 'ZONA ROSSA');
/* il portone della basilica */
export const buChurchDoor = new THREE.Group(); G.add(buChurchDoor);
{ const wd = M('#4a2e1a', { roughness: 0.7 }), ir = M('#2a2a2c', { roughness: 0.4, metalness: 0.7 });
  for (const sd of [-1, 1]) { mesh(new THREE.BoxGeometry(2.95, 6.4, 0.3), wd, buChurchDoor, [sd * 1.5, 3.2, -150.3]); for (let k = 0; k < 4; k++) mesh(new THREE.BoxGeometry(2.6, 0.12, 0.34), ir, buChurchDoor, [sd * 1.5, 0.9 + k * 1.5, -150.25]); mesh(new THREE.TorusGeometry(0.16, 0.03, 6, 12), ir, buChurchDoor, [sd * 0.35, 3, -150.1]); }
  buDyn.push(buChurchDoor); }
export const buChurchSolid = S(0, -150.5, 6, 1, null, 6.5);
/* il sigillo aperto: un buco con le scale che scendono */
export const buHole = new THREE.Group(); buHole.visible = false; G.add(buHole);
{ flat(mesh(new THREE.PlaneGeometry(3.2, 3.2), new THREE.MeshBasicMaterial({ color: '#050404' }), buHole, [0, 0.43, -182.5], [-Math.PI / 2, 0, 0]));
  for (let k = 0; k < 5; k++) mesh(new THREE.BoxGeometry(2.6, 0.08, 0.5), M('#5a5450', { roughness: 0.9 }), buHole, [0, 0.35 - k * 0.12, -181.4 - k * 0.45]);
  const gl = mesh(new THREE.CylinderGeometry(1.6, 1.6, 0.05, 20), new THREE.MeshBasicMaterial({ color: '#ff4a20', transparent: true, opacity: 0.25, depthWrite: false }), buHole, [0, 0.46, -182.5]); gl.userData.glow = 1;
  buDyn.push(buHole); }

/* ---------- armi al muro del centro di Busto ---------- */
export const BU_BUYS = [
  { id: 'pistola', cost: 400, ammoCost: 200, x: BX - 27.9, z: 0, rot: Math.PI / 2, zone: 'bu-fontana' },
  { id: 'pompa', cost: 2500, ammoCost: 1200, x: BX - 27.9, z: 10, rot: Math.PI / 2, zone: 'bu-fontana' },
  { id: 'ak47', cost: 5000, ammoCost: 2500, x: BX - 27.9, z: 24, rot: Math.PI / 2, zone: 'bu-fontana' },
  { id: 'ar', cost: 7000, ammoCost: 3500, x: BX - 27.9, z: 33, rot: Math.PI / 2, zone: 'bu-fontana' },
  { id: 'pompauto', cost: 6000, ammoCost: 3000, x: BX - 10, z: 39.9, rot: Math.PI, zone: 'bu-fontana' },
  { id: 'mitra', cost: 1600, ammoCost: 800, x: BX + 10, z: 39.9, rot: Math.PI, zone: 'bu-fontana' },
  { id: 'granate', cost: 9000, ammoCost: 4500, x: BX + 46.5, z: 0.65, rot: 0, zone: 'bu-mac' },
  { id: 'mitragliatore', cost: 12000, ammoCost: 6000, x: BX + 40, z: 23.35, rot: Math.PI, zone: 'bu-mac' },
  { id: 'cecchino', cost: 14000, ammoCost: 5000, x: BX - 13.1, z: -66, rot: Math.PI / 2, zone: 'bu-bar' },
  { id: 'bazooka', cost: 5000, ammoCost: 3000, x: BX - 13.1, z: -90, rot: Math.PI / 2, zone: 'bu-bar' },
  { id: 'deagle', cost: 3000, ammoCost: 1500, x: BX + 13.1, z: -72, rot: -Math.PI / 2, zone: 'bu-bar' },
  { id: 'minigun', cost: 25000, ammoCost: 12000, x: BX - 13.8, z: -164, rot: Math.PI / 2, zone: 'bu-chiesa' },
];

/* ================= LE CATACOMBE (sotto la chiesa) ================= */
export const CATA = { x1: BX + 282, x2: BX + 318, z1: -36, z2: 4, ceil: 4.6 };
export const inCata = p => p.x > BX + 270 && p.x < BX + 330;
export const CATA_START = { x: BX + 300, z: 1, yaw: 0 };
export const PORTAL = { x: BX + 300, z: -33 };
{
  const stone = texMat(wrap(ctex(256, 256, (g, w, h) => { g.fillStyle = '#4a4440'; g.fillRect(0, 0, w, h); setSeed(501);
    for (let y = 0; y < h; y += 32) for (let x = ((y / 32) % 2) * 32 - 64; x < w; x += 64) { const v = 60 + Math.floor(rnd() * 30); g.fillStyle = `rgb(${v + 6},${v},${v - 6})`; g.fillRect(x + 2, y + 2, 60, 28); } }), 8, 2), { roughness: 0.95 });
  const floorM = texMat(wrap(ctex(128, 128, (g, w, h) => { g.fillStyle = '#3a3430'; g.fillRect(0, 0, w, h); setSeed(503); for (let i = 0; i < 40; i++) { const v = 50 + Math.floor(rnd() * 25); g.fillStyle = `rgb(${v},${v - 4},${v - 8})`; g.fillRect(rnd() * w, rnd() * h, 20 + rnd() * 30, 14 + rnd() * 20); } }), 9, 10), { roughness: 0.95 });
  pave(300, -16, 36, 40, floorM, 0.01);
  const cw2 = (x, z, w, d, h = CATA.ceil) => { const m = mesh(new THREE.BoxGeometry(w, h, d), stone, G, [x, h / 2, z]); m.receiveShadow = true; S(x, z, w, d, m, h); };
  cw2(281.5, -16, 1, 42); cw2(318.5, -16, 1, 42); cw2(300, -36.5, 38, 1); cw2(300, 4.5, 38, 1);
  flat(mesh(new THREE.PlaneGeometry(38, 42), M('#1e1a18', { roughness: 1, side: THREE.DoubleSide }), G, [300, CATA.ceil, -16], [Math.PI / 2, 0, 0]));
  /* scala da cui arrivi */
  for (let k = 0; k < 6; k++) mesh(new THREE.BoxGeometry(3, 0.3, 0.6), M('#5a5450', { roughness: 0.9 }), G, [300, 0.15 + k * 0.3, 3.7 - k * 0.12 + 0.0]);
  /* pilastri e archi */
  for (const x of [292, 308]) for (let z = -6; z >= -30; z -= 8) { const m = mesh(new THREE.BoxGeometry(1.2, CATA.ceil, 1.2), stone, G, [x, CATA.ceil / 2, z]); m.castShadow = true; S(x, z, 1.2, 1.2); }
  /* nicchie con i teschi */
  const skull = M('#d8ccb4', { roughness: 0.7 }), hole = M('#141010');
  for (const sd of [-1, 1]) for (let z = -2; z >= -32; z -= 5) { const x = 300 + sd * 17.9; mesh(new THREE.BoxGeometry(0.3, 1.4, 2.4), M('#1a1614'), G, [x, 1.6, z]);
    for (let k = 0; k < 3; k++) { const sk = new THREE.Group(); sk.position.set(x - sd * 0.1, 1.2 + (k % 2) * 0.5, z - 0.7 + k * 0.7); G.add(sk); mesh(sph(0.16, 10, 8), skull, sk); for (const e of [-1, 1]) mesh(sph(0.04, 6, 4), hole, sk, [-sd * 0.13, 0.02, e * 0.06]); } }
  /* sarcofagi */
  for (const [x, z] of [[287, -14], [313, -14], [287, -28], [313, -28]]) { mesh(new THREE.BoxGeometry(1.5, 1, 2.6), M('#6a625a', { roughness: 0.8 }), G, [x, 0.5, z]); mesh(new THREE.BoxGeometry(1.7, 0.18, 2.8), M('#7a7268'), G, [x, 1.05, z]); S(x, z, 1.5, 2.6, null, 0, 1.1); }
  /* torce */
  for (const [x, z] of [[282.2, -8], [317.8, -8], [282.2, -24], [317.8, -24], [296, -35.8], [304, -35.8]]) { mesh(new THREE.CylinderGeometry(0.05, 0.07, 0.6, 6), M('#4a3020'), G, [x, 2.2, z]); fire(x, 2.4, z, 0.35); }
  for (const [x, z] of [[300, -6], [300, -22], [300, -32]]) { const l = new THREE.PointLight('#ffaa5a', 1.6, 30, 1.1); l.position.set(x, 3.6, z); l.userData.bu = 1; G.add(l); }
}
/* i quattro campanacci del rituale */
const bellMs = M('#b88634', { roughness: 0.3, metalness: 0.85 });
export const BELLS = [['rosso', '#e83a3a', 286, -8], ['verde', '#3ad05a', 314, -8], ['blu', '#3a7ae8', 286, -22], ['giallo', '#f2c83a', 314, -22]].map(([n, c, x, z]) => {
  const g = new THREE.Group(); g.position.set(x, 0, z); G.add(g); const wd = M('#4a3020', { roughness: 0.8 });
  for (const s of [-0.9, 0.9]) mesh(new THREE.BoxGeometry(0.16, 2.8, 0.16), wd, g, [s, 1.4, 0]); mesh(new THREE.BoxGeometry(2, 0.16, 0.16), wd, g, [0, 2.8, 0]);
  const b = mesh(new THREE.LatheGeometry([[0.001, 0.6], [0.16, 0.6], [0.25, 0.5], [0.28, 0.25], [0.36, 0], [0.4, -0.1], [0.3, -0.1]].map(([r, y]) => new THREE.Vector2(r, y)), 18), bellMs, g, [0, 1.9, 0]);
  mesh(new THREE.TorusGeometry(0.3, 0.05, 6, 16), M(c, { roughness: 0.6, emissive: c, emissiveIntensity: 0.3 }), g, [0, 2.3, 0], [Math.PI / 2, 0, 0]);
  const glow = mesh(new THREE.SphereGeometry(0.75, 12, 8), new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0.0, depthWrite: false }), g, [0, 1.9, 0]);
  S(x, z, 2, 0.5); buDyn.push(g);
  return { n, c, x: BX + x, z, g, b, glow };
});
/* la tavola di pietra che mostra l'ordine dei campanacci */
const tabCanvas = document.createElement('canvas'); tabCanvas.width = 512; tabCanvas.height = 256; const tabTex = new THREE.CanvasTexture(tabCanvas); tabTex.encoding = THREE.sRGBEncoding;
export function setTablet(seq, done = 0) {
  const g = tabCanvas.getContext('2d'); g.fillStyle = '#5a5450'; g.fillRect(0, 0, 512, 256); g.strokeStyle = '#2a2622'; g.lineWidth = 10; g.strokeRect(10, 10, 492, 236);
  g.fillStyle = '#d8ccb4'; g.font = '700 30px Georgia,serif'; g.textAlign = 'center'; g.fillText('Suona i campanacci in quest\'ordine', 256, 56);
  seq.forEach((k, i) => { const x = 86 + i * 113; g.fillStyle = i < done ? '#2a2622' : BELLS[k].c; g.beginPath(); g.arc(x, 150, 40, 0, 6.28); g.fill(); g.lineWidth = 6; g.strokeStyle = '#2a2622'; g.stroke(); g.fillStyle = '#f4f0e6'; g.font = '900 40px Arial Black,Arial'; g.fillText(String(i + 1), x, 164); });
  tabTex.needsUpdate = true;
}
{ mesh(new THREE.BoxGeometry(2.6, 1.2, 0.5), M('#5a5450', { roughness: 0.9 }), G, [300, 0.6, -28]); const t = plane(2.8, 1.4, new THREE.MeshStandardMaterial({ map: tabTex, roughness: 0.8 }), G, [300, 1.9, -28], [-0.25, 0, 0]); buDyn.push(t); S(300, -28, 2.6, 0.5, null, 0, 1.2); }
/* il portale */
const portalTex = ctex(256, 256, (g) => { const gr = g.createRadialGradient(128, 128, 10, 128, 128, 128); gr.addColorStop(0, '#ffffff'); gr.addColorStop(0.3, '#c070ff'); gr.addColorStop(0.7, '#5a1a9a'); gr.addColorStop(1, '#1a0a2a'); g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
  g.strokeStyle = 'rgba(255,255,255,.35)'; g.lineWidth = 6; for (let k = 0; k < 5; k++) { g.beginPath(); for (let a = 0; a < 12; a += 0.1) { const r = a * 9 + k * 8; g.lineTo(128 + Math.cos(a + k * 1.25) * r, 128 + Math.sin(a + k * 1.25) * r); } g.stroke(); } });
export const buPortal = new THREE.Group(); buPortal.position.set(300, 0, -33.5); G.add(buPortal);
{ const ringM = M('#5a5450', { roughness: 0.85 }); mesh(new THREE.TorusGeometry(2.3, 0.45, 10, 28), ringM, buPortal, [0, 2.6, 0]);
  for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2; mesh(new THREE.BoxGeometry(0.4, 0.4, 0.6), M('#a03a2a', { emissive: '#a03a2a', emissiveIntensity: 0.4 }), buPortal, [Math.cos(a) * 2.3, 2.6 + Math.sin(a) * 2.3, 0.2], [0, 0, a]); }
  const disc = mesh(new THREE.CircleGeometry(2.0, 32), new THREE.MeshBasicMaterial({ map: portalTex, transparent: true, opacity: 0.0, side: THREE.DoubleSide, depthWrite: false }), buPortal, [0, 2.6, 0.05]); buPortal.userData.disc = disc;
  mesh(new THREE.BoxGeometry(5.6, 0.4, 1.6), ringM, buPortal, [0, 0.2, 0]); buDyn.push(buPortal); S(300, -33.5, 5.6, 1.2); }
export function setPortal(on) { const d = buPortal.userData.disc; d.material.opacity = on === 2 ? 0.95 : on === 1 ? 0.35 : 0; buPortal.userData.on = on; }

/* ================= SARDEGNA: IL REGNO DEI MAMMUTONES ================= */
export const SARD = { x1: BX + 540, x2: BX + 660, z1: -60, z2: 60 };
export const inSard = p => p.x > BX + 500;
export const SARD_START = { x: BX + 600, z: 50, yaw: 0 };
export const RE_SPOT = { x: BX + 600, z: -22 };
export const SHEEP = [];
{
  const grassTex = wrap(ctex(256, 256, (g, w, h) => { g.fillStyle = '#6a9a3a'; g.fillRect(0, 0, w, h); setSeed(601); for (let i = 0; i < 3000; i++) { const v = rnd(); g.fillStyle = v < 0.4 ? '#5a8a32' : v < 0.8 ? '#7aaa48' : v < 0.93 ? '#8ab050' : (v < 0.97 ? '#f2e050' : '#f0f0f0'); g.fillRect(rnd() * w, rnd() * h, 2, 2 + rnd() * 2); } }), 60, 60);
  pave(600, 0, 420, 420, texMat(grassTex, { roughness: 1 }), 0.004);
  /* colline intorno */
  const hillM = [M('#5a8a34', { roughness: 1 }), M('#6a9a3e', { roughness: 1 }), M('#4e7a2e', { roughness: 1 })];
  setSeed(611);
  for (let k = 0; k < 26; k++) { const a = k / 26 * Math.PI * 2, R = 110 + rnd() * 50; const m = mesh(new THREE.SphereGeometry(30 + rnd() * 30, 16, 10), hillM[k % 3], G, [600 + Math.cos(a) * R, -6, Math.sin(a) * R], null, [1.4, 0.38 + rnd() * 0.25, 1.2]); m.receiveShadow = true; }
  /* nuraghi: torri di pietra a tronco di cono */
  const nurTex = wrap(ctex(256, 256, (g, w, h) => { g.fillStyle = '#8a7a64'; g.fillRect(0, 0, w, h); setSeed(621); for (let y = 0; y < h; y += 22) for (let x = ((y / 22) % 2) * 20 - 40; x < w; x += 40) { const v = 110 + Math.floor(rnd() * 40); g.fillStyle = `rgb(${v + 10},${v},${v - 16})`; g.beginPath(); g.ellipse(x + 20, y + 11, 18, 9, 0, 0, 6.28); g.fill(); } }), 4, 3);
  const nurM = texMat(nurTex, { roughness: 0.95 });
  function nuraghe(x, z, s = 1) {
    const m = mesh(new THREE.CylinderGeometry(3.2 * s, 4.6 * s, 9 * s, 18, 1, true), nurM, G, [x, 4.5 * s, z]); m.castShadow = true;
    mesh(new THREE.CircleGeometry(3.2 * s, 18), nurM, G, [x, 9 * s, z], [-Math.PI / 2, 0, 0]);
    mesh(new THREE.BoxGeometry(1.3 * s, 2.2 * s, 0.6), M('#1a1612'), G, [x, 1.1 * s, z + 4.3 * s]);
    S(x, z, 7.4 * s, 7.4 * s, m, 9 * s);
  }
  nuraghe(565, -35, 1.1); nuraghe(640, -28, 0.95); nuraghe(560, 25, 0.85); nuraghe(650, 30, 1);
  for (const [x, z] of [[700, -90], [480, -60], [520, 120], [720, 60]]) nuraghe(x, z, 1.6);
  /* ulivi e sughere */
  const oliveL = [M('#7a8a5a', { roughness: 0.9 }), M('#8a9a6a', { roughness: 0.9 })], bark = M('#5a4a3a', { roughness: 1 });
  setSeed(631);
  for (let k = 0; k < 24; k++) { const x = 548 + rnd() * 104, z = -54 + rnd() * 108; if (Math.abs(x - 600) < 14 && Math.abs(z) < 20) continue; if (Math.hypot(x - 600, z - 50) < 8) continue;
    const t = mesh(new THREE.CylinderGeometry(0.25, 0.45, 2.6, 7), bark, G, [x, 1.3, z], [rnd() * 0.3, 0, rnd() * 0.3]); t.castShadow = true;
    for (let i = 0; i < 4; i++) mesh(new THREE.IcosahedronGeometry(1.4 + rnd() * 0.8, 1), oliveL[i % 2], G, [x + (rnd() - 0.5) * 2.4, 3 + rnd(), z + (rnd() - 0.5) * 2.4], null, [1, 0.7, 1]).castShadow = true;
    S(x, z, 0.8, 0.8); }
  /* muretti a secco e macchia mediterranea */
  for (const [x, z, w, d] of [[580, 10, 14, 1], [622, -8, 1, 16], [600, -48, 22, 1], [552, -5, 1, 14]]) { mesh(new THREE.BoxGeometry(w, 0.9, d), nurM, G, [x, 0.45, z]).castShadow = true; S(x, z, w, d, null, 0, 0.9); }
  for (let k = 0; k < 30; k++) { const x = 545 + rnd() * 110, z = -56 + rnd() * 112; mesh(new THREE.IcosahedronGeometry(0.6 + rnd() * 0.5, 1), rnd() < 0.5 ? leaf[1] : M('#4a6a2a', { roughness: 1 }), G, [x, 0.4, z], null, [1.3, 0.7, 1.3]); }
  /* il portale da cui arrivi */
  const ar = new THREE.Group(); ar.position.set(600, 0, 56); G.add(ar);
  mesh(new THREE.TorusGeometry(2.3, 0.45, 10, 28), nurM, ar, [0, 2.6, 0]); const d2 = mesh(new THREE.CircleGeometry(2.0, 32), new THREE.MeshBasicMaterial({ map: portalTex, transparent: true, opacity: 0.85, side: THREE.DoubleSide, depthWrite: false }), ar, [0, 2.6, 0]);
  ar.userData.disc = d2; buDyn.push(ar); buPortal.userData.twin = ar; S(600, 56, 5, 1);
  /* le pecore */
  for (let k = 0; k < 26; k++) { const m = buildSheep(); const x = 550 + rnd() * 100, z = -50 + rnd() * 100; m.position.set(BX + x, 0, z); m.rotation.y = rnd() * 6.28; scene.add(m); SHEEP.push({ m, t: rnd() * 5, dir: m.rotation.y, run: 0 }); buDyn.push(m); }
}

/* ---------- dove escono i nemici, zona per zona ---------- */
const A = arr => arr.map(([x, z]) => [BX + x, z]);
export const BU_SPAWNS = {
  bfontana: A([[-20, -2], [20, -2], [-20, 30], [20, 30], [0, 38], [-22, 12], [27, -2], [27, 27], [0, -30], [0, -46]]),
  bmac: A([[27, -2], [27, 27], [20, -2], [20, 30]]),
  bmacin: A([[36.5, 2], [36.5, 22], [44, 22.5], [44, 1.5], [27, 11]]),
  bbar: A([[0, -58], [-8, -100], [8, -100], [0, -80], [-11, -70], [11, -92]]),
  bpiazza: A([[-36, -108], [36, -108], [-36, -146], [36, -146], [0, -108], [-20, -130], [20, -130]]),
  bchiesa: A([[-11, -155], [11, -155], [-11, -184], [11, -184], [0, -158]]),
  bcata: A([[286, -2], [314, -2], [300, -14], [290, -34], [310, -34]]),
  bsard: A([[545, -55], [655, -55], [545, 55], [655, 55], [600, -58], [542, 0], [658, 0], [580, -50], [620, -50]]),
};
export const BU_DOORS = { mac: { x: BX + 34.3, z: 11 }, chiesa: { x: BX, z: -150.5 } };

/* oggetti animati: fuori dalla fusione delle mesh statiche */
export const buAnim = [...jets, ...flames, ...buDyn];
/* ---------- animazioni ---------- */
const tmp = new THREE.Vector3();
export function updateBU(t, dt = 0.016) {
  jets.forEach((j, i) => { const k = 1 + Math.sin(t * 9 + i * 1.7) * 0.05; j.scale.set(k, i % 2 ? 1 : 1 + Math.sin(t * 5 + i) * 0.04, k); });
  for (let i = 0; i < DN; i++) { const d = dv[i]; d.t += dt; if (d.t > 1.2) { d.t = 0; d.k = Math.floor(Math.random() * 3); d.a = Math.random() * 6.28; d.r = 0.2 + Math.random() * 1.1; }
    const b = JB[d.k], s = d.t / 1.2; tmp.set(b[0] + Math.cos(d.a) * d.r * s * 1.4, b[2] + 4.6 - 5 * s * s, b[1] + Math.sin(d.a) * d.r * s * 1.4); dp[i * 3] = FX + tmp.x; dp[i * 3 + 1] = Math.max(0.5, tmp.y); dp[i * 3 + 2] = FZ + tmp.z; }
  dropsGeo.attributes.position.needsUpdate = true;
  flames.forEach((f, i) => f.scale.setScalar(0.85 + Math.sin(t * 17 + i * 2) * 0.2));
  buSeal.material.emissiveIntensity = 0.12 + Math.sin(t * 1.4) * 0.06;
  for (const f of buFires) f.children.forEach(c => { const k = 0.8 + Math.sin(t * 14 + c.userData.ph) * 0.2; c.scale.set(k, 0.8 + Math.sin(t * 11 + c.userData.ph * 2) * 0.3, k); });
  for (const m of buSmoke) { const d = m.userData; d.t += dt * 0.12; if (d.t > 1) d.t -= 1; m.position.set(d.x + Math.sin(d.t * 6 + d.z) * 1.2 * d.t, d.y0 + d.t * 14, d.z + d.t * 2); m.scale.setScalar(0.8 + d.t * 3.5); m.material.opacity = 0.32; }
  if (buPortal.userData.disc) { buPortal.userData.disc.rotation.z -= dt * (buPortal.userData.on === 2 ? 2.5 : 0.6); if (buPortal.userData.twin) buPortal.userData.twin.userData.disc.rotation.z += dt * 1.5; }
  for (const b of BELLS) { if (b.ring > 0) { b.ring -= dt; b.b.rotation.z = Math.sin(b.ring * 25) * 0.3 * b.ring; } }
  buHole.children.forEach(c => { if (c.userData.glow) c.material.opacity = 0.2 + Math.sin(t * 3) * 0.1; });
}
/* pecore: brucano, ogni tanto camminano; se ci passa vicino qualcuno scappano */
export function updateSheep(dt, px, pz) {
  for (const s of SHEEP) { const m = s.m; s.t -= dt; const d = Math.hypot(m.position.x - px, m.position.z - pz);
    if (d < 5) { s.dir = Math.atan2(m.position.x - px, m.position.z - pz); s.run = 1.2; }
    if (s.t <= 0) { s.t = 2 + Math.random() * 5; if (Math.random() < 0.5) s.dir += (Math.random() - 0.5) * 2; s.walk = Math.random() < 0.5; }
    const sp = s.run > 0 ? 4.5 : s.walk ? 0.8 : 0; s.run = Math.max(0, s.run - dt);
    if (sp) { m.position.x += Math.sin(s.dir) * sp * dt; m.position.z += Math.cos(s.dir) * sp * dt; m.rotation.y = s.dir;
      m.position.x = Math.max(SARD.x1 + 2, Math.min(SARD.x2 - 2, m.position.x)); m.position.z = Math.max(SARD.z1 + 2, Math.min(SARD.z2 - 2, m.position.z)); }
    const hd = m.userData.head; if (hd) hd.position.y = sp ? 0.72 : 0.5 + Math.sin(performance.now() / 600 + s.dir) * 0.04;
  }
}
