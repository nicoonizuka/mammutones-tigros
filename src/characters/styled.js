/* Modelli 3D nello stile "modellato": amici, Mirko, Mammutones, Fab La Rue e armi.
   Tutto e' costruito con forme semplici (capsule, sfere, torni, cubi smussati). */
import * as THREE from 'three';

THREE.ColorManagement.legacyMode = false;
const V3 = THREE.Vector3;

/* ---------- materiali e geometrie di base ---------- */
const matCache = new Map();
export function M(color, o = {}) {
  const key = color + JSON.stringify(o);
  if (!o.map && matCache.has(key)) return matCache.get(key);
  const m = new THREE.MeshStandardMaterial(Object.assign({ color, roughness: 0.7, metalness: 0 }, o));
  if (!o.map) matCache.set(key, m);
  return m;
}
function canvasTex(w, h, draw, rep) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding;
  if (rep) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep, rep); }
  return t;
}
const geoCache = new Map();
function cached(key, make) { if (!geoCache.has(key)) geoCache.set(key, make()); return geoCache.get(key); }
export function rbox(w, h, d, r, seg = 3) {
  return cached(`rb${w},${h},${d},${r},${seg}`, () => {
    const g = new THREE.BoxGeometry(w, h, d, seg * 2, seg * 2, seg * 2); const p = g.attributes.position;
    const hw = w / 2 - r, hh = h / 2 - r, hd = d / 2 - r; const v = new V3(), c = new V3();
    for (let i = 0; i < p.count; i++) {
      v.fromBufferAttribute(p, i);
      c.set(Math.max(-hw, Math.min(hw, v.x)), Math.max(-hh, Math.min(hh, v.y)), Math.max(-hd, Math.min(hd, v.z)));
      v.sub(c); if (v.lengthSq() > 0) v.normalize().multiplyScalar(r); v.add(c); p.setXYZ(i, v.x, v.y, v.z);
    }
    g.computeVertexNormals(); return g;
  });
}
export const sph = (r, ws = 18, hs = 12) => cached(`s${r},${ws},${hs}`, () => new THREE.SphereGeometry(r, ws, hs));
export function mesh(geo, mat, parent, pos, rot, scl) {
  const m = new THREE.Mesh(geo, mat); if (pos) m.position.set(...pos); if (rot) m.rotation.set(...rot); if (scl) m.scale.set(...scl);
  if (parent) parent.add(m); return m;
}
function limb(a, b, r, mat, parent, r2) {
  const A = new V3(...a), B = new V3(...b); const len = A.distanceTo(B);
  const g = r2 ? new THREE.CylinderGeometry(r2, r, len, 12, 1) : new THREE.CapsuleGeometry(r, Math.max(0.001, len), 4, 12);
  const m = mesh(g, mat, parent); m.position.copy(A).add(B).multiplyScalar(0.5);
  m.quaternion.setFromUnitVectors(new V3(0, 1, 0), B.clone().sub(A).normalize()); return m;
}
function lathe(pts, mat, parent, pos, scl, seg = 24) {
  return mesh(new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(r, y)), seg), mat, parent, pos, null, scl);
}
let seed = 7; const rnd = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
function finish(G) {
  G.traverse(m => {
    if (!m.isMesh) return; m.receiveShadow = true;
    if (!m.geometry.boundingSphere) m.geometry.computeBoundingSphere();
    m.castShadow = m.geometry.boundingSphere.radius * Math.max(m.scale.x, m.scale.y, m.scale.z) > 0.06;
  });
  return G;
}

/* ---------- armi ---------- */
export function buildWeapon(id) {
  const g = new THREE.Group(); const dark = M('#2a2d33', { roughness: 0.4, metalness: 0.55 });
  if (id === 'pistauto') {
    mesh(rbox(0.045, 0.065, 0.22, 0.012), dark, g, [0, 0.02, 0.06]);
    mesh(rbox(0.035, 0.1, 0.05, 0.012), dark, g, [0, -0.04, 0]);
    mesh(rbox(0.03, 0.2, 0.04, 0.01), M('#3a3d44', { roughness: 0.4, metalness: 0.5 }), g, [0, -0.14, 0.005]);
    mesh(rbox(0.05, 0.05, 0.06, 0.012), M('#c8a03a', { roughness: 0.3, metalness: 0.8 }), g, [0, 0.025, 0.19]);
    mesh(rbox(0.012, 0.03, 0.05, 0.006), M('#d84040'), g, [0.026, 0.0, 0.02]);
    g.userData.muzzle = new V3(0, 0.03, 0.23);
  } else if (id === 'katana') {
    const steel = M('#e4e8ee', { roughness: 0.12, metalness: 0.95 }), wrap = M('#1a1a20', { roughness: 0.7 }), gold = M('#d8a83a', { roughness: 0.3, metalness: 0.8 });
    mesh(rbox(0.012, 0.035, 0.78, 0.006), steel, g, [0, 0.02, 0.5]);
    mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.012, 16), gold, g, [0, 0.02, 0.1], [Math.PI / 2, 0, 0]);
    mesh(rbox(0.03, 0.035, 0.24, 0.012), wrap, g, [0, 0.02, -0.03]);
    g.userData.muzzle = new V3(0, 0.02, 0.9);
  } else if (id === 'bazooka') {
    const olive = M('#4f5a34', { roughness: 0.6, metalness: 0.2 }), blk = M('#1e2022', { roughness: 0.5 });
    mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.95, 16), olive, g, [0, 0.07, 0.2], [Math.PI / 2, 0, 0]);
    mesh(new THREE.CylinderGeometry(0.09, 0.075, 0.12, 16), blk, g, [0, 0.07, 0.7], [Math.PI / 2, 0, 0]);
    mesh(new THREE.CylinderGeometry(0.085, 0.085, 0.08, 16), blk, g, [0, 0.07, -0.29], [Math.PI / 2, 0, 0]);
    mesh(rbox(0.04, 0.13, 0.05, 0.012), blk, g, [0, -0.04, 0.05], [0.2, 0, 0]);
    mesh(rbox(0.05, 0.06, 0.12, 0.015), olive, g, [0, 0.16, 0.12]);
    g.userData.muzzle = new V3(0, 0.07, 0.78);
  } else if (id === 'fucile') {
    const wood = M('#7a4a28', { roughness: 0.55 });
    mesh(rbox(0.05, 0.07, 0.62, 0.015), dark, g, [0, 0.02, 0.18]);
    mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.4, 10), dark, g, [0, 0.04, 0.62], [Math.PI / 2, 0, 0]);
    mesh(rbox(0.055, 0.11, 0.3, 0.02), wood, g, [0, -0.02, -0.22], [0.12, 0, 0]);
    mesh(rbox(0.05, 0.06, 0.24, 0.015), wood, g, [0, -0.025, 0.32]);
    mesh(rbox(0.035, 0.1, 0.04, 0.01), dark, g, [0, -0.06, 0.05]);
    mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.16, 10), M('#111', { roughness: 0.3, metalness: 0.6 }), g, [0, 0.085, 0.18], [Math.PI / 2, 0, 0]);
    g.userData.muzzle = new V3(0, 0.04, 0.84);
  } else if (id === 'ak47') {
    const wood = M('#8a4a22', { roughness: 0.5 });
    mesh(rbox(0.06, 0.09, 0.4, 0.02), dark, g, [0, 0.02, 0.1]);
    mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.4, 10), dark, g, [0, 0.04, 0.48], [Math.PI / 2, 0, 0]);
    mesh(rbox(0.055, 0.06, 0.22, 0.02), wood, g, [0, 0.0, 0.36]);
    mesh(rbox(0.045, 0.22, 0.08, 0.02), dark, g, [0, -0.13, 0.17], [0.35, 0, 0]);
    mesh(rbox(0.04, 0.1, 0.05, 0.012), wood, g, [0, -0.06, -0.02]);
    mesh(rbox(0.055, 0.11, 0.28, 0.025), wood, g, [0, -0.03, -0.22], [0.12, 0, 0]);
    g.userData.muzzle = new V3(0, 0.04, 0.69);
  } else if (id === 'deagle') {
    const chrome = M('#d8dce2', { roughness: 0.15, metalness: 0.95 });
    mesh(rbox(0.05, 0.075, 0.27, 0.012), chrome, g, [0, 0.025, 0.08]);
    mesh(rbox(0.045, 0.12, 0.06, 0.012), M('#2a2420', { roughness: 0.6 }), g, [0, -0.05, -0.01], [0.2, 0, 0]);
    g.userData.muzzle = new V3(0, 0.03, 0.23);
  } else if (id === 'pompa') {
    const wood = M('#5a3a22', { roughness: 0.6 });
    mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.62, 12), dark, g, [0, 0.04, 0.32], [Math.PI / 2, 0, 0]);
    mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.5, 10), dark, g, [0, -0.005, 0.3], [Math.PI / 2, 0, 0]);
    mesh(rbox(0.06, 0.06, 0.18, 0.02), wood, g, [0, -0.005, 0.34]);
    mesh(rbox(0.06, 0.09, 0.2, 0.02), dark, g, [0, 0.02, 0.0]);
    mesh(rbox(0.06, 0.12, 0.3, 0.025), wood, g, [0, -0.03, -0.24], [0.15, 0, 0]);
    g.userData.muzzle = new V3(0, 0.04, 0.64);
  } else if (id === 'mitra') {
    mesh(rbox(0.06, 0.09, 0.42, 0.02), dark, g, [0, 0.02, 0.12]);
    mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.22, 10), dark, g, [0, 0.03, 0.42], [Math.PI / 2, 0, 0]);
    mesh(rbox(0.04, 0.2, 0.06, 0.012), M('#1a1c20', { roughness: 0.5 }), g, [0, -0.11, 0.16], [0.15, 0, 0]);
    mesh(rbox(0.035, 0.1, 0.045, 0.012), dark, g, [0, -0.06, 0.0]);
    mesh(rbox(0.03, 0.04, 0.22, 0.01), dark, g, [0, 0.0, -0.18]);
    g.userData.muzzle = new V3(0, 0.03, 0.54);
  } else {
    mesh(rbox(0.04, 0.06, 0.2, 0.012), dark, g, [0, 0.02, 0.06]);
    mesh(rbox(0.035, 0.1, 0.05, 0.012), dark, g, [0, -0.04, 0]);
    mesh(rbox(0.02, 0.02, 0.06, 0.006), M('#111'), g, [0, 0.035, 0.17]);
    g.userData.muzzle = new V3(0, 0.03, 0.2);
  }
  return g;
}

/* ---------- umano ---------- */
function human(o) {
  const G = new THREE.Group(), s = o.h / 1.8, w = o.w || 1, P = {};
  const skin = M(o.skin, { roughness: 0.62 }), top = o.topMat || M(o.top, { roughness: 0.85 }), pants = o.pantsMat || M(o.pants, { roughness: 0.9 });
  const hipY = 0.93 * s, kneeY = 0.5 * s, ankY = 0.1 * s, hx = 0.085 * w;
  lathe([[0.001, -0.03], [0.115 * w, -0.02], [0.14 * w, 0.04], [0.142 * w, 0.12], [0.001, 0.13]], pants, G, [0, hipY - 0.05, 0], [1, 1, 0.7]);
  for (const sd of [-1, 1]) {
    const L = new THREE.Group(); L.position.set(sd * hx, hipY, 0); G.add(L); P[sd < 0 ? 'legL' : 'legR'] = L;
    const kz = 0.02;
    if (o.shorts) { limb([0, 0, 0], [sd * 0.005, -(hipY - kneeY) * 0.55, kz * 0.5], 0.088 * w, pants, L); limb([0, -0.02, 0], [sd * 0.008, -(hipY - kneeY), kz], 0.068 * w, skin, L); }
    else limb([0, 0, 0], [sd * 0.008, -(hipY - kneeY), kz], 0.074 * w, pants, L);
    limb([sd * 0.008, -(hipY - kneeY), kz], [sd * 0.01, -(hipY - ankY), 0], 0.06 * w, o.shorts ? skin : pants, L);
    if (o.socks) limb([sd * 0.01, -(hipY - ankY) + 0.13 * s, 0], [sd * 0.01, -(hipY - ankY), 0], 0.063 * w, M('#f4f4ef'), L);
    mesh(rbox(0.13 * w, 0.1, 0.29, 0.045), M(o.shoe || '#f2f2f2', { roughness: 0.5 }), L, [sd * 0.01, -(hipY - ankY) - 0.045, 0.05]);
    mesh(rbox(0.135 * w, 0.035, 0.3, 0.015), M(o.sole || '#d8d8d8', { roughness: 0.6 }), L, [sd * 0.01, -(hipY - ankY) - 0.09, 0.05]);
    if (o.shoeStripe) mesh(rbox(0.137 * w, 0.025, 0.16, 0.01), M(o.shoeStripe), L, [sd * 0.01, -(hipY - ankY) - 0.04, 0.03]);
  }
  const T = new THREE.Group(); T.position.y = hipY; G.add(T); P.torso = T;
  const tw = w * (o.chest || 1);
  lathe([[0.001, 0], [0.14 * w, 0.02], [0.15 * w, 0.1], [0.145 * w, 0.2], [0.165 * tw, 0.34], [0.18 * tw, 0.44], [0.165 * tw, 0.52], [0.11 * tw, 0.575], [0.05, 0.6], [0.001, 0.6]], top, T, [0, 0, 0], [1, 1, 0.66]);
  if (o.hem) mesh(new THREE.TorusGeometry(0.143 * w, 0.018, 8, 24), M(o.hem, { roughness: 0.9 }), T, [0, 0.03, 0], [Math.PI / 2, 0, 0], [1, 0.66, 1]);
  limb([0, 0.56, 0], [0, 0.68, 0], 0.05, skin, T);
  const H = new THREE.Group(); H.position.set(0, 0.78, 0.005); T.add(H); P.head = H;
  mesh(sph(0.135, 24, 18), skin, H, [0, 0, 0], null, [0.95, 1.06, 1]);
  mesh(sph(0.11, 20, 14), skin, H, [0, -0.055, 0.02], null, [0.98, 0.8, 0.95]);
  for (const sd of [-1, 1]) mesh(sph(0.035, 10, 8), skin, H, [sd * 0.128, -0.005, -0.005], null, [0.5, 1, 0.75]);
  mesh(sph(0.026, 10, 8), skin, H, [0, -0.03, 0.125], null, [0.85, 1, 1.05]);
  for (const sd of [-1, 1]) {
    mesh(sph(0.021, 12, 8), M('#ffffff', { roughness: 0.3 }), H, [sd * 0.048, 0.012, 0.112], null, [1.1, 0.85, 0.6]);
    mesh(sph(0.012, 8, 6), M(o.eye || '#2a1a12', { roughness: 0.2 }), H, [sd * 0.048, 0.011, 0.123]);
    mesh(rbox(0.055, o.brow ? 0.022 : 0.014, 0.02, 0.007), M(o.hair, { roughness: 0.9 }), H, [sd * 0.05, 0.05, 0.118], [0, 0, sd * (o.browTilt || -0.1)]);
  }
  mesh(rbox(0.05, 0.012, 0.012, 0.005), M(o.mouth || '#8a4a40'), H, [0, -0.082, 0.112]);
  const shY = 0.52, shX = 0.19 * tw;
  for (const sd of [-1, 1]) {
    const A = new THREE.Group(); A.position.set(sd * shX, shY, 0); T.add(A); P[sd < 0 ? 'armL' : 'armR'] = A;
    const el = [sd * 0.035, -0.27, 0.01], wr = [sd * 0.03, -0.5, 0.06]; const ar = 0.052 * w * (o.arm || 1);
    const long = o.sleeve === 'long';
    limb([0, 0, 0], el, ar, long ? top : skin, A);
    if (o.sleeve === 'short' || o.sleeve === 'wide') limb([0, 0.01, 0], [sd * 0.02, -0.15, 0.005], ar * (o.sleeve === 'wide' ? 1.38 : 1.22), top, A);
    limb(el, wr, ar * 0.88, long ? top : skin, A);
    if (long && o.cuff) mesh(new THREE.TorusGeometry(ar * 0.9, 0.012, 8, 16), M(o.cuff, { roughness: 0.9 }), A, [wr[0] * 0.95, wr[1] + 0.03, wr[2] * 0.95], [Math.PI / 2 + 0.1, 0, 0]);
    const hand = mesh(sph(0.045, 14, 10), skin, A, [wr[0], wr[1] - 0.05, wr[2]], null, [0.75, 1.05, 0.95]);
    A.userData.hand = hand;
    mesh(sph(0.018, 8, 6), skin, A, [wr[0] - sd * 0.035, wr[1] - 0.03, wr[2] + 0.025], null, [1, 1.5, 1]);
  }
  const hairM = M(o.hair, { roughness: 0.75 });
  if (o.hairFn) o.hairFn(H, hairM, o);
  if (o.extra) o.extra(G, T, H, P, skin);
  G.userData.P = P; G.userData.height = o.h;
  return finish(G);
}
function hairCap(H, mat, r, cut) { return mesh(new THREE.SphereGeometry(r, 24, 16, 0, Math.PI * 2, 0, Math.PI * cut), mat, H, [0, 0.012, -0.006], null, [0.98, 1.08, 1.04]); }
function backHair(H, mat) { return mesh(new THREE.SphereGeometry(0.14, 22, 14, Math.PI * 0.15, Math.PI * 0.7, Math.PI * 0.25, Math.PI * 0.45), mat, H, [0, 0, -0.008], [0, Math.PI, 0], [1, 1.05, 1.05]); }
function clumps(H, mat, n, rnd0, spread = 0.08) {
  seed = rnd0; for (let i = 0; i < n; i++) {
    const a = rnd() * Math.PI * 2, rr = 0.03 + rnd() * spread;
    mesh(sph(0.04, 10, 8), mat, H, [Math.cos(a) * rr, 0.135 + rnd() * 0.015 - rr * 0.25, Math.sin(a) * rr - 0.01], [(rnd() - 0.5) * 0.8, a, (rnd() - 0.5) * 0.6], [1, 0.55, 1.5]);
  }
}
function fringe(H, mat, n, seedV, tilt = 0.4) {
  seed = seedV; for (let i = 0; i < n; i++) {
    const x = -0.095 + i * (0.19 / (n - 1));
    mesh(sph(0.04, 10, 8), mat, H, [x, 0.075 - Math.abs(x) * 0.25, 0.118 - Math.abs(x) * 0.35], [tilt + rnd() * 0.2, 0, (rnd() - 0.5) * 0.5 + x * 2], [0.5, 1.25, 0.45]);
  }
}
function necklace(T, color, r = 0.09, y = 0.57) { mesh(new THREE.TorusGeometry(r, 0.008, 6, 24), M(color, { roughness: 0.25, metalness: 0.85 }), T, [0, y, 0.035], [Math.PI / 2 - 0.35, 0, 0], [1, 0.75, 1]); }

/* configurazioni nell'ordine dei personaggi: 0 Nathan, 1 Dado, 2 Nico, 3 Slime, 4 Leo, 5 Ponta, 6 Mirko */
const CONFIGS = [
  /* Nathan: magro, piumino nero col collo di pelliccia, occhiali da aviatore */
  () => human({
    h: 1.75, w: 0.9, skin: '#f0cfb0', top: '#1c1c22', pants: '#2e3a55', shoe: '#f0f0f0', sole: '#c9c9c9', sleeve: 'long', cuff: '#2a2a33', hair: '#241a14',
    hairFn: (H, mat) => { hairCap(H, mat, 0.139, 0.38); },
    extra: (G, T, H) => {
      const q = M('#2a2a34', { roughness: 0.8 }); for (let k = 0; k < 4; k++) mesh(new THREE.TorusGeometry(0.15 - Math.abs(k - 1.5) * 0.008, 0.012, 6, 24), q, T, [0, 0.16 + k * 0.1, 0], [Math.PI / 2, 0, 0], [1, 0.66, 1]);
      const fur = M('#7a8090', { roughness: 1 }); seed = 3; for (let k = 0; k < 18; k++) { const a = k / 18 * Math.PI * 2; mesh(sph(0.04, 8, 6), fur, T, [Math.cos(a) * 0.12, 0.6 + rnd() * 0.02, Math.sin(a) * 0.085 - 0.01]); }
      const silver = M('#d4d8e0', { roughness: 0.2, metalness: 0.9 }), lens = M('#cfe6f2', { roughness: 0.05, transparent: true, opacity: 0.35 });
      for (const sd of [-1, 1]) { mesh(new THREE.TorusGeometry(0.028, 0.004, 6, 18), silver, H, [sd * 0.047, 0.008, 0.128], null, [1, 1.1, 1]); mesh(new THREE.CircleGeometry(0.027, 16), lens, H, [sd * 0.047, 0.008, 0.129]); mesh(rbox(0.006, 0.006, 0.12, 0.002), silver, H, [sd * 0.124, 0.02, 0.07]); }
      mesh(rbox(0.03, 0.005, 0.005, 0.002), silver, H, [0, 0.03, 0.13]);
    },
  }),
  /* Dado: ciuffo, felpa nera col cappuccio, braccialetto, sorriso strano */
  () => human({
    h: 1.75, w: 1, skin: '#eec6a4', top: '#18181d', pants: '#8a909b', shoe: '#f0f0f0', sleeve: 'long', cuff: '#202026', hem: '#202026', hair: '#1e1612', brow: 1, browTilt: 0.15, mouth: '#ffffff',
    hairFn: (H, mat) => { hairCap(H, mat, 0.139, 0.4); backHair(H, mat); for (let k = 0; k < 5; k++) mesh(sph(0.045, 10, 8), mat, H, [-0.05 + k * 0.03, 0.15 + Math.sin(k) * 0.01, 0.08], [-0.6, 0, 0], [1, 0.7, 1.4]); },
    extra: (G, T, H, P) => {
      mesh(new THREE.TorusGeometry(0.1, 0.035, 8, 20, Math.PI * 1.3), M('#202026', { roughness: 0.9 }), T, [0, 0.58, -0.04], [Math.PI / 2 + 0.3, 0, Math.PI * 0.85]);
      for (const sd of [-1, 1]) limb([sd * 0.03, 0.55, 0.1], [sd * 0.035, 0.4, 0.105], 0.006, M('#e0e0e0'), T);
      mesh(new THREE.TorusGeometry(0.045, 0.008, 6, 16), M('#e8c35a', { roughness: 0.25, metalness: 0.9 }), P.armL, [-0.03, -0.47, 0.055], [Math.PI / 2, 0, 0]);
      mesh(rbox(0.06, 0.016, 0.01, 0.005), M('#ffffff', { roughness: 0.3 }), H, [0, -0.082, 0.116], [0, 0, 0.12]);
    },
  }),
  /* Nico: frangia spettinata, occhiali da sole, pizzetto, maglione blu */
  () => human({
    h: 1.8, w: 1, skin: '#f0c8a8', top: '#2f62c4', pants: '#2b303d', shoe: '#1d1f25', sole: '#f2f2f2', shoeStripe: '#f2f2f2', sleeve: 'long', cuff: '#2753a8', hem: '#2753a8', hair: '#5e3f27',
    hairFn: (H, mat) => { hairCap(H, mat, 0.142, 0.43); backHair(H, mat); fringe(H, mat, 9, 4, 0.35); clumps(H, mat, 16, 5); for (const sd of [-1, 1]) mesh(sph(0.04, 10, 8), mat, H, [sd * 0.125, 0.055, 0.03], [0.1, 0, sd * 0.2], [0.4, 1.2, 0.6]); },
    extra: (G, T, H) => {
      const black = M('#0d0e10', { roughness: 0.15, metalness: 0.4 });
      for (const sd of [-1, 1]) { mesh(rbox(0.07, 0.045, 0.02, 0.012), black, H, [sd * 0.046, 0.012, 0.13]); mesh(rbox(0.012, 0.012, 0.13, 0.005), black, H, [sd * 0.122, 0.02, 0.07]); }
      mesh(rbox(0.03, 0.012, 0.012, 0.005), black, H, [0, 0.025, 0.135]);
      mesh(rbox(0.035, 0.03, 0.02, 0.01), M('#5e3f27', { roughness: 0.95 }), H, [0, -0.115, 0.1]);
    },
  }),
  /* Slime: basso e robusto, ricci biondi, baffetti, maglia bianca larga */
  () => human({
    h: 1.65, w: 1.3, chest: 1.06, arm: 1.25, skin: '#e8ac86', top: '#f4f3ef', pants: '#2e58cc', shorts: 1, socks: 1, shoe: '#efefef', sole: '#c9c9c9', sleeve: 'wide', hair: '#d8b45a', eye: '#3a6a8a', brow: 1,
    hairFn: (H) => {
      hairCap(H, M('#8a6a3a', { roughness: 0.9 }), 0.138, 0.42);
      const tones = [M('#e2bf68', { roughness: 0.6 }), M('#d4a84e', { roughness: 0.65 }), M('#f0d488', { roughness: 0.55 })];
      const N = 90; seed = 9;
      for (let i = 0; i < N; i++) {
        const y = 1 - (i / (N - 1)) * 2; const r = Math.sqrt(1 - y * y); const th = i * 2.399963; const p = new V3(Math.cos(th) * r, y, Math.sin(th) * r);
        if (p.y < -0.05 || (p.z > 0.55 && p.y < 0.5) || (p.y < 0.25 && p.z > 0.2)) continue;
        const q = p.multiplyScalar(0.145); q.y = q.y * 1.05 + 0.025; mesh(sph(0.03 + rnd() * 0.014, 8, 6), tones[i % 3], H, [q.x, q.y, q.z - 0.004]);
      }
      for (const sd of [-1, 1]) for (let k = 0; k < 3; k++) mesh(sph(0.028, 8, 6), tones[k % 3], H, [sd * (0.12 + k * 0.005), 0.04 - k * 0.035, -0.02 - k * 0.02]);
    },
    extra: (G, T, H) => { mesh(rbox(0.075, 0.014, 0.016, 0.006), M('#9a7438', { roughness: 0.95 }), H, [0, -0.06, 0.123]); },
  }),
  /* Leo: altissimo e magro, canottiera, tatuaggi, collanina, pantaloncini verdi, la siga */
  () => human({
    h: 1.9, w: 0.88, skin: '#e6b48c', top: '#e8e4da', pants: '#5a6b34', shorts: 1, shoe: '#f0f0f0', sleeve: 'none', hair: '#9a7448',
    hairFn: (H, mat) => { hairCap(H, mat, 0.141, 0.42); backHair(H, mat); fringe(H, mat, 7, 11, 0.7); clumps(H, mat, 12, 12, 0.07); },
    extra: (G, T, H, P) => {
      for (const sd of [-1, 1]) limb([sd * 0.1, 0.5, 0.02], [sd * 0.07, 0.6, 0], 0.016, M('#e8e4da', { roughness: 0.85 }), T);
      necklace(T, '#e0b040');
      const ink = M('#3a3a46', { roughness: 0.9 }); for (let k = 0; k < 5; k++) mesh(rbox(0.008, 0.035, 0.012, 0.003), ink, P.armR, [0.065 - k * 0.004, -0.33 - k * 0.03, 0.058], [0.3, 0, 0.4]);
      mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.07, 8), M('#f6f2ea'), H, [0.035, -0.085, 0.14], [Math.PI / 2, 0, -0.3]);
      mesh(sph(0.007, 6, 4), new THREE.MeshBasicMaterial({ color: '#ff7a2a' }), H, [0.045, -0.085, 0.175]);
    },
  }),
  /* Ponta: codino biondo, un po' grosso, maglia rossa, collanina con la croce */
  () => human({
    h: 1.75, w: 1.15, chest: 1.05, arm: 1.12, skin: '#e0a880', top: '#c8463c', pants: '#2b3040', shoe: '#f0f0f0', sleeve: 'short', hair: '#e0c070',
    hairFn: (H, mat) => {
      hairCap(H, mat, 0.14, 0.45); backHair(H, mat);
      const d = M('#c4a050', { roughness: 0.8 }); for (let k = 0; k < 6; k++) mesh(rbox(0.012, 0.005, 0.2, 0.002), d, H, [-0.08 + k * 0.032, 0.125 - Math.abs(k - 2.5) * 0.01, 0], [0.2, 0, 0]);
      mesh(sph(0.045, 12, 10), mat, H, [0, 0.12, -0.12]);
    },
    extra: (G, T) => {
      necklace(T, '#e8c35a', 0.08, 0.565);
      const gold = M('#e8c35a', { roughness: 0.25, metalness: 0.9 }); mesh(rbox(0.012, 0.05, 0.006, 0.002), gold, T, [0, 0.47, 0.105]); mesh(rbox(0.034, 0.012, 0.006, 0.002), gold, T, [0, 0.48, 0.105]);
    },
  }),
  /* Mirko: testa rasata coi tatuaggi tribali, catena d'oro, occhiali da sole */
  () => {
    const tattoo = canvasTex(256, 128, (g, w, h) => {
      g.clearRect(0, 0, w, h); g.fillStyle = '#2e221c';
      g.beginPath(); g.moveTo(0, 30); for (let x = 0; x <= w; x += 16) g.quadraticCurveTo(x + 8, 10 + (x % 32), x + 16, 34); g.lineTo(w, 0); g.lineTo(0, 0); g.fill();
      for (let k = 0; k < 9; k++) { const x = 20 + k * 26; g.beginPath(); g.moveTo(x, 30); g.lineTo(x + 10, 70 + (k % 3) * 12); g.lineTo(x + 18, 30); g.fill(); }
      g.fillRect(150, 30, 6, 60); g.fillRect(140, 52, 26, 6);
    });
    return human({
      h: 1.8, w: 1.25, chest: 1.08, arm: 1.2, skin: '#c98f63', top: '#151515', pants: '#2a2f3a', shoe: '#1a1a1a', sole: '#d8d8d8', sleeve: 'short', hair: '#3a2a20', brow: 1,
      hairFn: (H) => { mesh(new THREE.SphereGeometry(0.1375, 24, 14, 0, Math.PI * 2, 0, Math.PI * 0.5), new THREE.MeshStandardMaterial({ map: tattoo, transparent: true, roughness: 0.6 }), H, [0, 0.006, -0.004], null, [0.97, 1.07, 1.01]); },
      extra: (G, T, H, P) => {
        const lensM = M('#3a2410', { roughness: 0.1, metalness: 0.3 }), gold = M('#d8b040', { roughness: 0.2, metalness: 0.9 });
        for (const sd of [-1, 1]) { mesh(sph(0.03, 12, 8), lensM, H, [sd * 0.047, 0.006, 0.122], null, [1.15, 0.9, 0.3]); mesh(rbox(0.006, 0.006, 0.12, 0.002), gold, H, [sd * 0.124, 0.02, 0.07]); }
        mesh(rbox(0.035, 0.006, 0.006, 0.002), gold, H, [0, 0.028, 0.128]);
        mesh(rbox(0.04, 0.03, 0.02, 0.01), M('#3a2a20', { roughness: 0.95 }), H, [0, -0.115, 0.1]);
        mesh(new THREE.TorusGeometry(0.105, 0.016, 8, 28), gold, T, [0, 0.575, 0.03], [Math.PI / 2 - 0.4, 0, 0], [1, 0.78, 1]);
        const ink = M('#3a2a22', { roughness: 0.9 }); for (const A of [P.armL, P.armR]) for (let k = 0; k < 6; k++) mesh(rbox(0.06, 0.012, 0.07, 0.004), ink, A, [A === P.armL ? -0.03 : 0.03, -0.2 - k * 0.05, 0.03], [0.2, 0, 0], [1.05, 1, 0.95]);
      },
    });
  },
  /* 7 Jacopo: ricci scuri sulla fronte, occhi verdi, maglietta nera col logo */
  () => human({
    h: 1.74, w: 1.02, skin: '#e2ab86', top: '#1b1c20', pants: '#2b303d', shoe: '#f0f0f0', sole: '#cfcfcf', sleeve: 'short', hair: '#1f1612', eye: '#5f9a6a', brow: 1,
    hairFn: (H) => {
      const curl = [M('#1f1612', { roughness: 0.6 }), M('#2c201a', { roughness: 0.6 })];
      hairCap(H, curl[0], 0.141, 0.44); backHair(H, curl[0]); seed = 31;
      for (let i = 0; i < 60; i++) {
        const a = rnd() * Math.PI * 2, rr = Math.sqrt(rnd()) * 0.12; const front = Math.sin(a) * rr;
        const y = 0.125 + Math.sqrt(Math.max(0, 0.016 - rr * rr)) * 0.45 + rnd() * 0.02 - (front > 0.06 ? 0.035 : 0);
        mesh(sph(0.03 + rnd() * 0.012, 8, 6), curl[i % 2], H, [Math.cos(a) * rr, y, front + 0.01]);
      }
      for (let i = 0; i < 8; i++) mesh(sph(0.03, 8, 6), curl[i % 2], H, [-0.085 + i * 0.024, 0.075 + Math.sin(i * 1.7) * 0.01, 0.112]);
    },
    extra: (G, T, H) => {
      mesh(rbox(0.03, 0.02, 0.006, 0.003), M('#c0303a'), T, [0.07, 0.43, 0.115]); mesh(rbox(0.012, 0.02, 0.007, 0.002), M('#f2f2f2'), T, [0.07, 0.43, 0.116]);
      mesh(rbox(0.06, 0.02, 0.02, 0.008), M('#2c201a', { roughness: 0.95 }), H, [0, -0.118, 0.098]);
    },
  }),
  /* 8 Corti: alto e grosso, felpa grigia col cappuccio, pantaloni della tuta, anelli */
  () => human({
    h: 1.88, w: 1.45, chest: 1.12, arm: 1.3, skin: '#dca07c', top: '#b9bcc2', pants: '#4a4d55', shoe: '#2a2a2e', sole: '#f0f0f0', sleeve: 'long', cuff: '#a9acb2', hem: '#a9acb2', hair: '#3a2618',
    hairFn: (H, mat) => {
      hairCap(H, M('#2a1c12', { roughness: 0.9 }), 0.139, 0.36);
      const tip = M('#8a6440', { roughness: 0.7 }); fringe(H, mat, 8, 41, 0.45); clumps(H, mat, 10, 42, 0.07);
      seed = 43; for (let i = 0; i < 8; i++) mesh(sph(0.03, 8, 6), tip, H, [-0.08 + i * 0.023, 0.13 + rnd() * 0.02, 0.06 + rnd() * 0.03], null, [1, 0.6, 1.4]);
    },
    extra: (G, T, H, P) => {
      const hood = M('#a9acb2', { roughness: 0.95 });
      mesh(sph(0.2, 16, 12), M('#b9bcc2', { roughness: 0.85 }), T, [0, 0.24, 0.08], null, [1.15, 0.95, 0.75]);
      mesh(rbox(0.22, 0.1, 0.03, 0.02), hood, T, [0, 0.2, 0.2], [-0.15, 0, 0]);
      mesh(new THREE.TorusGeometry(0.11, 0.045, 8, 20, Math.PI * 1.3), hood, T, [0, 0.58, -0.04], [Math.PI / 2 + 0.3, 0, Math.PI * 0.85]);
      for (const sd of [-1, 1]) limb([sd * 0.03, 0.55, 0.12], [sd * 0.035, 0.42, 0.15], 0.006, M('#e8e8e8'), T);
      mesh(rbox(0.035, 0.012, 0.004, 0.003), M('#ffffff'), T, [0.09, 0.45, 0.14], [0, 0, 0.3]);
      const silver = M('#c8ccd2', { roughness: 0.2, metalness: 0.9 }); for (const A of [P.armL, P.armR]) mesh(new THREE.TorusGeometry(0.014, 0.004, 6, 12), silver, A, [A.userData.hand.position.x, A.userData.hand.position.y - 0.04, A.userData.hand.position.z + 0.01], [Math.PI / 2, 0, 0]);
      for (const L of [P.legL, P.legR]) for (let k = 0; k < 3; k++) mesh(rbox(0.012, 0.09, 0.03, 0.004), M('#1d1e22'), L, [0, -0.5 - k * 0.11, 0.072]);
    },
  }),
  /* 9 Tefalin: 1,70 m, capelli spettinati voluminosi, occhiali rossi a gatto, piumino grigio chiaro aperto, maglia blu */
  () => human({
    h: 1.7, w: 1.08, chest: 1.08, arm: 1.12, skin: '#efc9ae', top: '#d3d6d9', pants: '#2c3444', shoe: '#f0f0f0', sole: '#cfcfcf', sleeve: 'long', cuff: '#c2c5c9', hem: '#c2c5c9', hair: '#3a281c',
    hairFn: (H, mat) => {
      hairCap(H, mat, 0.145, 0.45); backHair(H, mat); clumps(H, mat, 26, 51, 0.1); fringe(H, mat, 9, 52, 0.15);
      const hl = M('#4e3626', { roughness: 0.7 }); seed = 53;
      for (let i = 0; i < 14; i++) { const a = rnd() * Math.PI * 2, rr = 0.05 + rnd() * 0.08; mesh(sph(0.042, 10, 8), i % 2 ? hl : mat, H, [Math.cos(a) * rr, 0.16 + rnd() * 0.03, Math.sin(a) * rr - 0.01], [(rnd() - 0.5) * 1.2, a, (rnd() - 0.5) * 1.2], [1, 0.6, 1.6]); }
      for (const sd of [-1, 1]) mesh(sph(0.045, 10, 8), mat, H, [sd * 0.13, 0.06, 0.0], [0.1, 0, sd * 0.3], [0.45, 1.3, 0.8]);
    },
    extra: (G, T, H) => {
      /* piumino: trapuntature, collo alto, zip nere e maglia blu sotto */
      const q = M('#bfc2c6', { roughness: 0.85 }); for (let k = 0; k < 4; k++) mesh(new THREE.TorusGeometry(0.16 - Math.abs(k - 1.5) * 0.008, 0.013, 6, 24), q, T, [0, 0.14 + k * 0.1, 0], [Math.PI / 2, 0, 0], [1.05, 0.68, 1]);
      mesh(new THREE.TorusGeometry(0.1, 0.05, 8, 22), M('#d3d6d9', { roughness: 0.85 }), T, [0, 0.58, -0.005], [Math.PI / 2, 0, 0], [1, 0.8, 1]);
      mesh(rbox(0.12, 0.44, 0.02, 0.01), M('#22305a', { roughness: 0.9 }), T, [0, 0.3, 0.12]);
      for (const sd of [-1, 1]) limb([sd * 0.07, 0.08, 0.118], [sd * 0.065, 0.56, 0.1], 0.007, M('#121316'), T);
      mesh(rbox(0.02, 0.012, 0.004, 0.002), M('#c0303a'), T, [0, 0.42, 0.131]); mesh(rbox(0.02, 0.012, 0.004, 0.002), M('#f2f2f2'), T, [0, 0.43, 0.132]);
      /* occhiali a gatto rossi, sfumati verso il trasparente in basso */
      const red = M('#8e1a26', { roughness: 0.3 }), clear = M('#e8b8bc', { roughness: 0.2, transparent: true, opacity: 0.55 }), lens = M('#d8ecf4', { roughness: 0.05, transparent: true, opacity: 0.25 });
      for (const sd of [-1, 1]) {
        mesh(rbox(0.082, 0.02, 0.014, 0.006), red, H, [sd * 0.048, 0.036, 0.13], [0, 0, sd * -0.12]);
        mesh(rbox(0.026, 0.02, 0.014, 0.006), red, H, [sd * 0.088, 0.048, 0.126], [0, 0, sd * -0.6]);
        mesh(rbox(0.012, 0.05, 0.012, 0.004), red, H, [sd * 0.086, 0.012, 0.127]);
        mesh(rbox(0.078, 0.01, 0.012, 0.004), clear, H, [sd * 0.048, -0.017, 0.13]);
        mesh(new THREE.PlaneGeometry(0.074, 0.05), lens, H, [sd * 0.048, 0.01, 0.137]);
        mesh(rbox(0.008, 0.008, 0.12, 0.003), red, H, [sd * 0.126, 0.03, 0.07]);
      }
      mesh(rbox(0.024, 0.008, 0.01, 0.003), red, H, [0, 0.03, 0.136]);
    },
  }),
  /* 10 Debe: 1,75 m, ricci neri, occhiolino, giacca scura e dolcevita bianco, un filo di barba */
  () => human({
    h: 1.75, w: 1.15, chest: 1.06, arm: 1.1, skin: '#e2b48e', top: '#1d2028', pants: '#2b2f38', shoe: '#1c1c20', sole: '#e8e8e8', sleeve: 'long', cuff: '#25282f', hair: '#16110e', brow: 1, browTilt: 0.05,
    hairFn: (H) => {
      const curl = [M('#16110e', { roughness: 0.6 }), M('#241a15', { roughness: 0.6 })];
      hairCap(H, curl[0], 0.142, 0.42); backHair(H, curl[0]); seed = 61;
      for (let i = 0; i < 64; i++) {
        const a = rnd() * Math.PI * 2, rr = Math.sqrt(rnd()) * 0.13; const front = Math.sin(a) * rr;
        const y = 0.12 + Math.sqrt(Math.max(0, 0.018 - rr * rr)) * 0.45 + rnd() * 0.02 - (front > 0.07 ? 0.03 : 0);
        mesh(sph(0.03 + rnd() * 0.013, 8, 6), curl[i % 2], H, [Math.cos(a) * rr, y, front + 0.008]);
      }
      for (const sd of [-1, 1]) for (let k = 0; k < 3; k++) mesh(sph(0.03, 8, 6), curl[k % 2], H, [sd * (0.125 + k * 0.004), 0.05 - k * 0.03, -0.01 - k * 0.025]);
    },
    extra: (G, T, H, P, skin) => {
      mesh(new THREE.CylinderGeometry(0.075, 0.08, 0.1, 18), M('#f2f0ea', { roughness: 0.9 }), T, [0, 0.6, 0.005]);
      mesh(rbox(0.1, 0.3, 0.02, 0.01), M('#f2f0ea', { roughness: 0.9 }), T, [0, 0.42, 0.112]);
      for (const sd of [-1, 1]) mesh(rbox(0.05, 0.36, 0.02, 0.01), M('#2a2e38', { roughness: 0.8 }), T, [sd * 0.075, 0.36, 0.113], [0, 0, sd * 0.12]);
      /* occhiolino: palpebra chiusa sull'occhio destro */
      mesh(sph(0.024, 12, 8), skin, H, [0.048, 0.012, 0.114], null, [1.15, 0.9, 0.65]);
      mesh(rbox(0.04, 0.007, 0.008, 0.003), M('#3a2418'), H, [0.048, 0.006, 0.131], [0, 0, -0.1]);
      mesh(rbox(0.055, 0.016, 0.012, 0.005), M('#ffffff', { roughness: 0.3 }), H, [0.005, -0.085, 0.114], [0, 0, 0.15]);
      const stub = M('#5a4434', { roughness: 1, transparent: true, opacity: 0.45 });
      mesh(new THREE.SphereGeometry(0.11, 16, 10, 0, Math.PI * 2, Math.PI * 0.55, Math.PI * 0.3), stub, H, [0, -0.06, 0.025], null, [1.0, 0.85, 1.0]);
    },
  }),
  /* 11 Diego Margarito: 1,85 m, il piu' alto, ricci neri folti, sopracciglia marcate, maglietta nera */
  () => human({
    h: 1.85, w: 1.0, skin: '#ddab86', top: '#1a1a1d', pants: '#383b43', shoe: '#f0f0f0', sole: '#cfcfcf', sleeve: 'short', hair: '#120d0b', eye: '#2a170e', brow: 1, browTilt: -0.05,
    hairFn: (H) => {
      const curl = [M('#120d0b', { roughness: 0.55 }), M('#21170f', { roughness: 0.6 }), M('#2c2016', { roughness: 0.6 })];
      hairCap(H, curl[0], 0.143, 0.44); backHair(H, curl[0]); seed = 71;
      for (let i = 0; i < 95; i++) {
        const a = rnd() * Math.PI * 2, rr = Math.sqrt(rnd()) * 0.15; const front = Math.sin(a) * rr;
        const y = 0.13 + Math.sqrt(Math.max(0, 0.026 - rr * rr)) * 0.55 + rnd() * 0.035 - (front > 0.09 ? 0.04 : 0);
        mesh(sph(0.034 + rnd() * 0.016, 8, 6), curl[i % 3], H, [Math.cos(a) * rr, y, front]);
      }
      for (let i = 0; i < 9; i++) mesh(sph(0.033, 8, 6), curl[i % 3], H, [-0.095 + i * 0.024, 0.085 + Math.sin(i * 2.1) * 0.012, 0.11]);
    },
    extra: (G, T, H) => {
      mesh(rbox(0.07, 0.014, 0.014, 0.006), M('#3a2a20', { roughness: 0.95, transparent: true, opacity: 0.7 }), H, [0, -0.062, 0.12]);
    },
  }),
  /* 12 Damiano Ducaj (easter egg nella Mercedes): ricci scuri con la barba */
  () => human({
    h: 1.78, w: 1.1, skin: '#e4b896', top: '#2a2d33', pants: '#2b2f38', shoe: '#1c1c20', sleeve: 'long', cuff: '#24272c', hair: '#21160f', brow: 1,
    hairFn: (H) => {
      const curl = [M('#21160f', { roughness: 0.6 }), M('#30221a', { roughness: 0.6 })];
      hairCap(H, curl[0], 0.142, 0.43); backHair(H, curl[0]); seed = 81;
      for (let i = 0; i < 60; i++) { const a = rnd() * Math.PI * 2, rr = Math.sqrt(rnd()) * 0.13; const front = Math.sin(a) * rr; const y = 0.12 + Math.sqrt(Math.max(0, 0.018 - rr * rr)) * 0.45 + rnd() * 0.02 - (front > 0.07 ? 0.03 : 0); mesh(sph(0.03 + rnd() * 0.012, 8, 6), curl[i % 2], H, [Math.cos(a) * rr, y, front + 0.008]); }
    },
    extra: (G, T, H) => {
      const beard = M('#2a1c14', { roughness: 0.95 }); seed = 82;
      for (let i = 0; i < 26; i++) { const a = Math.PI * (0.08 + 0.84 * (i / 25)); mesh(sph(0.034, 8, 6), beard, H, [Math.cos(a) * 0.11, -0.06 - Math.sin(a) * 0.055, 0.03 + Math.sin(a) * 0.075]); }
      mesh(rbox(0.07, 0.02, 0.02, 0.008), beard, H, [0, -0.062, 0.122]);
    },
  }),
  /* 13 il Capo dell'Happy Shopping (boss): grosso, capelli corti neri, occhiali, felpa grigia con la zip, jeans */
  () => human({
    h: 1.95, w: 1.8, chest: 1.28, arm: 1.5, skin: '#e8b894', top: '#b6bac0', pants: '#4a6a9a', shoe: '#2a2a2e', sole: '#e0e0e0', sleeve: 'long', cuff: '#a6aab0', hem: '#a6aab0', hair: '#141010', brow: 1, browTilt: 0.18,
    hairFn: (H, mat) => { hairCap(H, mat, 0.14, 0.33); fringe(H, mat, 8, 91, 0.6); },
    extra: (G, T, H, P, skin) => {
      mesh(sph(0.27, 18, 14), M('#b6bac0', { roughness: 0.85 }), T, [0, 0.2, 0.1], null, [1.25, 1.05, 0.95]);
      mesh(new THREE.TorusGeometry(0.13, 0.05, 8, 20, Math.PI * 1.3), M('#a6aab0', { roughness: 0.95 }), T, [0, 0.58, -0.05], [Math.PI / 2 + 0.3, 0, Math.PI * 0.85]);
      limb([0, 0.58, 0.16], [0, 0.0, 0.33], 0.007, M('#d8dce2', { roughness: 0.3, metalness: 0.6 }), T);
      for (const sd of [-1, 1]) limb([sd * 0.035, 0.56, 0.14], [sd * 0.04, 0.42, 0.2], 0.007, M('#e8e8e8'), T);
      mesh(sph(0.1, 14, 10), skin, H, [0, -0.11, 0.04], null, [1.2, 0.7, 1]);
      for (const sd of [-1, 1]) mesh(sph(0.05, 10, 8), skin, H, [sd * 0.085, -0.06, 0.07]);
      const frame = M('#2a2420', { roughness: 0.4 }), lens = M('#d8ecf4', { roughness: 0.05, transparent: true, opacity: 0.22 });
      for (const sd of [-1, 1]) {
        mesh(rbox(0.07, 0.008, 0.01, 0.003), frame, H, [sd * 0.048, 0.035, 0.132]); mesh(rbox(0.07, 0.008, 0.01, 0.003), frame, H, [sd * 0.048, -0.012, 0.132]);
        mesh(rbox(0.008, 0.05, 0.01, 0.003), frame, H, [sd * 0.083, 0.012, 0.13]); mesh(rbox(0.008, 0.05, 0.01, 0.003), frame, H, [sd * 0.013, 0.012, 0.134]);
        mesh(new THREE.PlaneGeometry(0.066, 0.044), lens, H, [sd * 0.048, 0.012, 0.136]); mesh(rbox(0.006, 0.006, 0.12, 0.002), frame, H, [sd * 0.126, 0.03, 0.07]);
      }
    },
  }),
  /* 14 Leodessi: magro, ricci scuri morbidi con la frangia sugli occhi, sorriso, felpa grigia con la zip e il cappuccio */
  () => human({
    h: 1.76, w: 1.0, skin: '#ecc3a2', top: '#8e9196', pants: '#2f333c', shoe: '#f0f0f0', sole: '#d0d0d0', sleeve: 'long', cuff: '#7f8287', hem: '#7f8287', hair: '#150f0c', eye: '#3a2214', brow: 1,
    hairFn: (H) => {
      const c = [M('#150f0c', { roughness: 0.55 }), M('#22180f', { roughness: 0.6 })];
      hairCap(H, c[0], 0.143, 0.45); backHair(H, c[0]); seed = 141;
      for (let i = 0; i < 70; i++) { const a = rnd() * Math.PI * 2, rr = Math.sqrt(rnd()) * 0.14, f = Math.sin(a) * rr; mesh(sph(0.033 + rnd() * 0.012, 8, 6), c[i % 2], H, [Math.cos(a) * rr, 0.13 + Math.sqrt(Math.max(0, 0.022 - rr * rr)) * 0.5 + rnd() * 0.02, f]); }
      for (let i = 0; i < 10; i++) mesh(sph(0.036, 8, 6), c[i % 2], H, [-0.1 + i * 0.022, 0.06 + Math.sin(i * 1.9) * 0.012 - (i > 3 && i < 8 ? 0.012 : 0), 0.118], [0.5, 0, 0], [0.8, 1.3, 0.6]);
    },
    extra: (G, T, H) => {
      const hood = M('#7f8287', { roughness: 0.95 });
      mesh(new THREE.TorusGeometry(0.11, 0.045, 8, 20, Math.PI * 1.3), hood, T, [0, 0.58, -0.04], [Math.PI / 2 + 0.3, 0, Math.PI * 0.85]);
      limb([0, 0.58, 0.115], [0, 0.03, 0.115], 0.006, M('#c8ccd2', { roughness: 0.3, metalness: 0.7 }), T);
      for (const sd of [-1, 1]) limb([sd * 0.03, 0.55, 0.12], [sd * 0.035, 0.4, 0.13], 0.005, M('#d8dade'), T);
      mesh(rbox(0.06, 0.015, 0.012, 0.005), M('#ffffff', { roughness: 0.3 }), H, [0, -0.085, 0.114]);
    },
  }),
  /* 15 Libe il matto: capelli castani spettinati, barbetta, occhi chiari, camicia beige aperta sopra la maglietta bianca */
  () => human({
    h: 1.78, w: 1.02, skin: '#e6b896', top: '#b9ad94', pants: '#2c3038', shoe: '#e8e8e8', sole: '#bdbdbd', sleeve: 'long', cuff: '#a89c84', hair: '#2e2016', eye: '#6a7a52', brow: 1, browTilt: 0.05,
    hairFn: (H) => {
      const c = [M('#2e2016', { roughness: 0.75 }), M('#3c2a1c', { roughness: 0.75 })];
      hairCap(H, c[0], 0.142, 0.42); backHair(H, c[0]); seed = 151;
      for (let i = 0; i < 26; i++) { const a = rnd() * Math.PI * 2, rr = Math.sqrt(rnd()) * 0.12; mesh(sph(0.04, 8, 6), c[i % 2], H, [Math.cos(a) * rr, 0.14 + rnd() * 0.03, Math.sin(a) * rr], [(rnd() - 0.5), a, (rnd() - 0.5)], [1, 0.55, 1.6]); }
      fringe(H, c[1], 7, 152, 0.75);
    },
    extra: (G, T, H) => {
      mesh(rbox(0.13, 0.42, 0.02, 0.01), M('#f2f2ee', { roughness: 0.9 }), T, [0, 0.33, 0.106]);
      const col = M('#a89c84', { roughness: 0.9 });
      for (const sd of [-1, 1]) { mesh(rbox(0.035, 0.44, 0.02, 0.008), M('#b9ad94', { roughness: 0.85 }), T, [sd * 0.08, 0.32, 0.112], [0, 0, sd * 0.06]); mesh(rbox(0.08, 0.05, 0.02, 0.008), col, T, [sd * 0.06, 0.56, 0.1], [0.3, 0, sd * 0.6]); mesh(rbox(0.05, 0.05, 0.01, 0.005), col, T, [sd * 0.105, 0.42, 0.122]); }
      const st = M('#4a3424', { roughness: 1, transparent: true, opacity: 0.45 });
      mesh(new THREE.SphereGeometry(0.11, 16, 10, 0, Math.PI * 2, Math.PI * 0.55, Math.PI * 0.3), st, H, [0, -0.06, 0.025]);
    },
  }),
  /* 16 Bulegato: ricci castano scuro alti, occhi azzurri, barbetta leggera, maglietta bianca larga, jeans scuri larghi */
  () => human({
    h: 1.8, w: 1.05, skin: '#eec3a4', top: '#f4f4f0', pants: '#2a3348', shoe: '#8f8a84', sole: '#e4e0d8', sleeve: 'wide', hair: '#2a1a12', eye: '#5a86b0', brow: 1,
    hairFn: (H) => {
      const c = [M('#2a1a12', { roughness: 0.6 }), M('#3a2618', { roughness: 0.6 }), M('#1e130d', { roughness: 0.6 })];
      hairCap(H, c[0], 0.142, 0.42); backHair(H, c[0]); seed = 161;
      for (let i = 0; i < 90; i++) { const a = rnd() * Math.PI * 2, rr = Math.sqrt(rnd()) * 0.15, f = Math.sin(a) * rr; mesh(sph(0.035 + rnd() * 0.015, 8, 6), c[i % 3], H, [Math.cos(a) * rr, 0.1 + Math.sqrt(Math.max(0, 0.026 - rr * rr)) * 0.45 + rnd() * 0.03, f]); }
      for (let i = 0; i < 8; i++) mesh(sph(0.032, 8, 6), c[i % 3], H, [-0.085 + i * 0.024, 0.085 + Math.sin(i * 2.3) * 0.01, 0.112]);
    },
    extra: (G, T, H) => {
      mesh(rbox(0.04, 0.03, 0.005, 0.004), M('#2a2a2e'), T, [0.07, 0.45, 0.118]);
      const st = M('#5a3e2c', { roughness: 1, transparent: true, opacity: 0.18 });
      mesh(new THREE.SphereGeometry(0.11, 16, 10, 0, Math.PI * 2, Math.PI * 0.58, Math.PI * 0.27), st, H, [0, -0.06, 0.025]);
    },
  }),
  /* 17 Castelluccio: ricci castani sopra e lati rasati, barbetta, giacca grigio-verde con la zip sopra la maglietta bianca */
  () => human({
    h: 1.78, w: 1.06, skin: '#ebbf9e', top: '#7d8a84', pants: '#2b2f38', shoe: '#f0f0f0', sole: '#cfcfcf', sleeve: 'long', cuff: '#6c7872', hem: '#6c7872', hair: '#4a3020', eye: '#3a2a1c', brow: 1, browTilt: -0.15,
    hairFn: (H) => {
      const c = [M('#4a3020', { roughness: 0.6 }), M('#5c3c28', { roughness: 0.6 })];
      hairCap(H, M('#3a2618', { roughness: 0.95 }), 0.139, 0.36); seed = 171;
      for (let i = 0; i < 55; i++) { const a = rnd() * Math.PI * 2, rr = Math.sqrt(rnd()) * 0.1, f = Math.sin(a) * rr; mesh(sph(0.032 + rnd() * 0.01, 8, 6), c[i % 2], H, [Math.cos(a) * rr, 0.115 + Math.sqrt(Math.max(0, 0.012 - rr * rr)) * 0.45 + rnd() * 0.02, f + 0.01]); }
      for (let i = 0; i < 6; i++) mesh(sph(0.03, 8, 6), c[i % 2], H, [-0.06 + i * 0.024, 0.1 + Math.sin(i * 2.1) * 0.01, 0.105]);
    },
    extra: (G, T, H) => {
      mesh(rbox(0.12, 0.08, 0.02, 0.01), M('#f2f2ee', { roughness: 0.9 }), T, [0, 0.54, 0.09], [0.35, 0, 0]);
      limb([0, 0.52, 0.115], [0, 0.03, 0.115], 0.006, M('#c8ccd2', { roughness: 0.3, metalness: 0.7 }), T);
      mesh(new THREE.TorusGeometry(0.1, 0.03, 8, 20, Math.PI * 1.2), M('#6c7872', { roughness: 0.9 }), T, [0, 0.57, -0.01], [Math.PI / 2 + 0.25, 0, Math.PI * 0.9]);
      const st = M('#4a3020', { roughness: 1, transparent: true, opacity: 0.25 });
      mesh(new THREE.SphereGeometry(0.11, 16, 10, 0, Math.PI * 2, Math.PI * 0.58, Math.PI * 0.27), st, H, [0, -0.06, 0.025]);
    },
  }),
];
export function buildHuman(i) { return CONFIGS[i](); }

/* ---------- Fab La Rue (boss del seminterrato) ---------- */
export function buildFab() {
  const bandana = canvasTex(128, 128, (g, w, h) => {
    g.fillStyle = '#2b3c63'; g.fillRect(0, 0, w, h); g.strokeStyle = '#e8ecf2'; g.fillStyle = '#e8ecf2'; g.lineWidth = 2;
    for (let y = 0; y < h; y += 32) for (let x = 0; x < w; x += 32) {
      g.beginPath(); g.arc(x + 16, y + 16, 9, 0, Math.PI * 2); g.stroke();
      for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2; g.beginPath(); g.ellipse(x + 16 + Math.cos(a) * 12, y + 16 + Math.sin(a) * 12, 3, 1.6, a, 0, Math.PI * 2); g.fill(); }
      g.beginPath(); g.arc(x + 16, y + 16, 3, 0, Math.PI * 2); g.fill();
    }
  }, 2);
  return human({
    h: 1.75, w: 1, skin: '#d9a98a', top: '#17171b', pantsMat: new THREE.MeshStandardMaterial({ map: bandana, roughness: 0.9 }), shorts: 1, shoe: '#1a1a1d', sole: '#2a2a2e', sleeve: 'short', hair: '#14100e', eye: '#1a0c08', brow: 1, browTilt: 0.12,
    hairFn: (H) => {
      const fade = M('#3a3230', { roughness: 0.95 });
      mesh(new THREE.SphereGeometry(0.139, 24, 14, Math.PI * 0.86, Math.PI * 1.28, 0, Math.PI * 0.6), fade, H, [0, 0.008, -0.008], null, [0.98, 1.06, 1.03]);
      mesh(new THREE.SphereGeometry(0.139, 24, 8, 0, Math.PI * 2, 0, Math.PI * 0.3), fade, H, [0, 0.008, -0.008], null, [0.98, 1.06, 1.03]);
      const curl = [M('#16110f', { roughness: 0.55 }), M('#241a16', { roughness: 0.6 })]; seed = 13;
      for (let i = 0; i < 46; i++) {
        const a = rnd() * Math.PI * 2, rr = Math.sqrt(rnd()) * 0.1; const y = 0.12 + Math.sqrt(Math.max(0, 0.012 - rr * rr)) * 0.5 + rnd() * 0.03;
        if (Math.sin(a) * rr > 0.07 && y < 0.13) continue; mesh(sph(0.026 + rnd() * 0.012, 8, 6), curl[i % 2], H, [Math.cos(a) * rr, y, Math.sin(a) * rr + 0.01]);
      }
    },
    extra: (G, T, H, P, skin) => {
      const pink = M('#e89aa8', { roughness: 0.5 }), ratFur = M('#8a7c7a', { roughness: 0.95 });
      for (const sd of [-1, 1]) {
        const E = new THREE.Group(); E.position.set(sd * 0.12, 0.12, -0.01); E.rotation.set(0, 0, sd * -0.5); H.add(E);
        mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.018, 20), ratFur, E, [0, 0.05, 0], [Math.PI / 2, 0, 0]);
        mesh(new THREE.CylinderGeometry(0.056, 0.056, 0.02, 20), pink, E, [0, 0.05, 0.004], [Math.PI / 2, 0, 0]);
      }
      mesh(sph(0.06, 18, 12), skin, H, [0, -0.045, 0.115], null, [0.9, 0.7, 1.05]);
      mesh(sph(0.022, 12, 8), M('#d86a80', { roughness: 0.3 }), H, [0, -0.025, 0.178]);
      const wh = M('#f2ece8', { roughness: 0.4 }); for (const sd of [-1, 1]) for (let k = 0; k < 3; k++) mesh(new THREE.CylinderGeometry(0.0025, 0.0025, 0.17, 5), wh, H, [sd * 0.085, -0.04 - k * 0.012, 0.15], [0, 0, Math.PI / 2 + sd * (k - 1) * 0.18]);
      for (const sd of [-1, 1]) mesh(rbox(0.018, 0.035, 0.01, 0.004), M('#fffaf0', { roughness: 0.3 }), H, [sd * 0.0105, -0.088, 0.138]);
      const curve = new THREE.CatmullRomCurve3([new V3(0, 0.06, -0.1), new V3(0, -0.15, -0.32), new V3(0.1, -0.55, -0.48), new V3(0.28, -0.85, -0.3), new V3(0.42, -0.88, 0.02), new V3(0.55, -0.8, 0.12)]);
      const tail = new THREE.Group(); T.add(tail); P.tail = tail; mesh(new THREE.TubeGeometry(curve, 40, 0.02, 8, false), pink, tail);
      const gold = M('#e8b83a', { roughness: 0.25, metalness: 0.85 }); const crown = new THREE.Group(); crown.position.set(0.02, 0.2, 0); crown.rotation.z = -0.18; H.add(crown);
      mesh(new THREE.CylinderGeometry(0.075, 0.08, 0.04, 18, 1, true), gold, crown);
      for (let k = 0; k < 6; k++) { const a = k / 6 * Math.PI * 2; mesh(new THREE.ConeGeometry(0.017, 0.05, 6), gold, crown, [Math.cos(a) * 0.075, 0.04, Math.sin(a) * 0.075]); }
    },
  });
}

/* ---------- Mammutones ---------- */
function bellGeo(s) { return cached('bell' + s, () => new THREE.LatheGeometry([[0.001, 0.13], [0.035, 0.13], [0.05, 0.11], [0.056, 0.05], [0.07, 0], [0.078, -0.02], [0.06, -0.02]].map(([r, y]) => new THREE.Vector2(r * s, y * s)), 14)); }
const MAMM_LOOK = {
  base: { fur: ['#2a2220', '#3a2e29', '#1c1513', '#4a3a32'], mask: '#16100e', maskHi: '#2c201a', kerch: '#6e4226', scale: 1 },
  cornuto: { fur: ['#e9e4da', '#d2cabd', '#f8f5ee', '#c4bbac'], mask: '#7a2e1c', maskHi: '#a8462c', kerch: '#efe9de', scale: 0.96, horns: 1 },
  grosso: { fur: ['#4a5568', '#39424f', '#5d6a7e', '#2f3642'], mask: '#141114', maskHi: '#2e282e', kerch: '#2f3640', scale: 1.4, eyes: 1 },
  furia: { fur: ['#3a1414', '#5a1e1a', '#2a0e0c', '#6a2a22'], mask: '#e8e0d0', maskHi: '#ffffff', kerch: '#8a1a1a', scale: 0.86, eyes: 1 },
};
const mammTemplates = {};
function makeMammutones(type) {
  const L = MAMM_LOOK[type]; const G = new THREE.Group(); seed = 21;
  const fm = L.fur.map(c => M(c, { roughness: 1 }));
  const trous = M('#26262e', { roughness: 0.95 }), boot = M('#4a2e1c', { roughness: 0.6 });
  for (const sd of [-1, 1]) {
    const Lg = new THREE.Group(); Lg.name = sd < 0 ? 'legL' : 'legR'; Lg.position.set(sd * 0.13, 0.8, 0); G.add(Lg);
    limb([0, 0, 0], [0, -0.38, 0.02], 0.085, trous, Lg); limb([0, -0.38, 0.02], [0, -0.68, 0], 0.075, trous, Lg);
    mesh(rbox(0.17, 0.16, 0.32, 0.06), boot, Lg, [0, -0.74, 0.05]);
  }
  const B = new THREE.Group(); B.name = 'torso'; B.position.y = 0.62; G.add(B);
  lathe([[0.001, 0], [0.36, 0.02], [0.4, 0.18], [0.38, 0.45], [0.36, 0.7], [0.3, 0.88], [0.16, 0.98], [0.001, 1.0]], fm[0], B, [0, 0, 0], [1, 1, 0.8]);
  /* ciuffi di pelliccia: un'unica mesh istanziata */
  const tuftG = cached('tuft', () => { const g = new THREE.ConeGeometry(0.06, 0.24, 6); g.rotateX(Math.PI); g.translate(0, -0.12, 0); return g; });
  const tm = new THREE.MeshStandardMaterial({ roughness: 1, color: '#ffffff' });
  const N = 190; const tufts = new THREE.InstancedMesh(tuftG, tm, N); const d = new THREE.Object3D(); const col = new THREE.Color();
  for (let i = 0; i < N; i++) {
    const bottom = i >= 150; const y = bottom ? 0.02 : rnd() * 0.95, a = rnd() * Math.PI * 2;
    const r = bottom ? 0.38 : [0.36, 0.4, 0.39, 0.37, 0.32, 0.18][Math.min(5, Math.floor(y / 0.18))] * (1.02 + rnd() * 0.04);
    d.position.set(Math.cos(a) * r, y + (bottom ? 0 : 0.08), Math.sin(a) * r * 0.8);
    d.rotation.set(-Math.sin(a) * (bottom ? 0.3 : 0.45), 0, Math.cos(a) * (bottom ? 0.3 : 0.45));
    const sc = bottom ? 1 : 0.55 + rnd() * 0.4; d.scale.set(sc, bottom ? 1.5 : sc, sc); d.updateMatrix();
    tufts.setMatrixAt(i, d.matrix); tufts.setColorAt(i, col.set(L.fur[i % 4]));
  }
  B.add(tufts);
  for (const sd of [-1, 1]) {
    const A = new THREE.Group(); A.name = sd < 0 ? 'armL' : 'armR'; A.position.set(sd * 0.4, 0.82, 0); B.add(A);
    limb([0, 0, 0], [sd * 0.06, -0.55, 0.08], 0.1, fm[1], A);
    const at = new THREE.InstancedMesh(tuftG, tm, 22);
    for (let k = 0; k < 22; k++) {
      const f = k / 22; d.position.set(sd * 0.06 * f + (rnd() - 0.5) * 0.12, -0.55 * f, 0.08 * f + (rnd() - 0.5) * 0.12);
      d.rotation.set((rnd() - 0.5) * 0.5, rnd() * 3, sd * 0.3 + (rnd() - 0.5) * 0.4); d.scale.setScalar(0.6); d.updateMatrix(); at.setMatrixAt(k, d.matrix); at.setColorAt(k, col.set(L.fur[k % 4]));
    }
    A.add(at);
    mesh(sph(0.065, 10, 8), M('#3a2a22', { roughness: 0.8 }), A, [sd * 0.07, -0.64, 0.09]);
  }
  const bronze = M('#b88634', { roughness: 0.32, metalness: 0.85 }), strap = M('#5a3820', { roughness: 0.8 });
  const bellSpots = [[-0.2, 0.72, -0.3, 1.5], [0, 0.76, -0.34, 1.7], [0.2, 0.72, -0.3, 1.5], [-0.12, 0.5, -0.36, 1.3], [0.12, 0.5, -0.36, 1.3]];
  for (let k = 0; k < 4; k++) bellSpots.push([-0.18 + k * 0.12, 0.66 - Math.abs(k - 1.5) * 0.05, 0.4, 0.75]);
  if (type === 'grosso') for (let k = 0; k < 5; k++) bellSpots.push([-0.24 + k * 0.12, 0.36, 0.42, 0.9]);
  bellSpots.forEach(([x, y, z, s]) => { const piv = new THREE.Group(); piv.name = 'bell'; piv.position.set(x, y, z); B.add(piv); mesh(bellGeo(s), bronze, piv, [0, -0.13 * s, 0]); });
  for (const sd of [-1, 1]) mesh(new THREE.TorusGeometry(0.42, 0.025, 6, 32, Math.PI * 1.2), strap, B, [0, 0.62, 0], [Math.PI / 2, 0, sd * 0.5 + Math.PI * 0.9]);
  const H = new THREE.Group(); H.name = 'head'; H.position.set(0, 1.12, 0.04); B.add(H);
  const kerch = M(L.kerch, { roughness: 0.95 }); mesh(sph(0.2, 20, 14), kerch, H, [0, 0.02, -0.03], null, [1, 1.05, 1]);
  mesh(sph(0.07, 10, 8), kerch, H, [0, -0.02, -0.21], null, [1.2, 0.8, 1]);
  for (const sd of [-1, 1]) limb([sd * 0.03, -0.04, -0.24], [sd * 0.08, -0.22, -0.28], 0.03, kerch, H, 0.01);
  const wood = M(L.mask, { roughness: 0.38, metalness: 0.1 }), woodHi = M(L.maskHi, { roughness: 0.45 }), hole = M('#000', { roughness: 1 });
  const mk = new THREE.Group(); mk.position.set(0, -0.01, 0.12); H.add(mk);
  mesh(sph(0.15, 22, 16), wood, mk, [0, 0, 0], null, [0.95, 1.22, 0.55]);
  for (const sd of [-1, 1]) {
    mesh(sph(0.06, 12, 8), woodHi, mk, [sd * 0.055, 0.075, 0.055], [0, 0, sd * 0.2], [1.3, 0.45, 0.7]);
    mesh(sph(0.03, 10, 8), L.eyes ? new THREE.MeshBasicMaterial({ color: '#ff2a2a' }) : hole, mk, [sd * 0.052, 0.035, 0.075], null, [1.2, 0.8, 0.5]);
    mesh(sph(0.04, 10, 8), woodHi, mk, [sd * 0.07, -0.07, 0.06], null, [1, 0.8, 0.6]);
  }
  mesh(new THREE.ConeGeometry(0.035, 0.13, 10), woodHi, mk, [0, 0, 0.1], [Math.PI * 0.42, 0, 0]);
  mesh(sph(0.035, 10, 8), woodHi, mk, [0, -0.045, 0.13], null, [1.2, 0.8, 1]);
  mesh(rbox(0.1, 0.022, 0.04, 0.01), hole, mk, [0, -0.115, 0.065]);
  for (let k = 0; k < 5; k++) mesh(rbox(0.012, 0.016, 0.02, 0.004), M('#d8cfc0', { roughness: 0.6 }), mk, [-0.04 + k * 0.02, -0.11, 0.08]);
  if (L.horns) { const hn = M('#1d1a1a', { roughness: 0.5 }); for (const sd of [-1, 1]) { const c = new THREE.CatmullRomCurve3([new V3(sd * 0.12, 0.1, -0.02), new V3(sd * 0.3, 0.16, -0.05), new V3(sd * 0.42, 0.32, -0.02), new V3(sd * 0.4, 0.48, 0.05)]); mesh(new THREE.TubeGeometry(c, 16, 0.03, 8, false), hn, H); } }
  /* hitbox invisibili: corpo e testa */
  const inv = new THREE.MeshBasicMaterial({ visible: false });
  const body = mesh(new THREE.BoxGeometry(0.9, 1.45, 0.75), inv, G, [0, 1.0, 0]); body.name = 'hitBody';
  const head = mesh(new THREE.SphereGeometry(0.25, 10, 8), inv, B, [0, 1.13, 0.06]); head.name = 'hitHead';
  G.scale.setScalar(L.scale);
  finish(G); body.castShadow = head.castShadow = false;
  return G;
}
export function buildMammutones(type) {
  if (!mammTemplates[type]) mammTemplates[type] = makeMammutones(type);
  const G = mammTemplates[type].clone(true);
  const P = { bells: [] };
  G.traverse(o => { if (['legL', 'legR', 'armL', 'armR', 'head', 'torso'].includes(o.name)) P[o.name] = o; if (o.name === 'bell') P.bells.push(o); });
  G.userData.P = P; G.userData.height = 1.95 * MAMM_LOOK[type].scale;
  G.userData.hit = { body: G.getObjectByName('hitBody'), head: G.getObjectByName('hitHead') };
  return G;
}

/* ---------- ratto (nemico del seminterrato) ---------- */
let ratTemplate = null;
function makeRat() {
  const G = new THREE.Group(); const fur = M('#6e6462', { roughness: 1 }), furD = M('#4e4644', { roughness: 1 }), pink = M('#e89aa8', { roughness: 0.5 });
  const T = new THREE.Group(); T.name = 'torso'; T.position.y = 0.32; G.add(T);
  mesh(sph(0.26, 14, 10), fur, T, [0, 0, -0.05], null, [0.9, 0.8, 1.35]);
  const H = new THREE.Group(); H.name = 'head'; H.position.set(0, 0.06, 0.32); T.add(H);
  mesh(sph(0.15, 12, 10), fur, H, [0, 0, 0], null, [0.9, 0.85, 1.1]);
  mesh(new THREE.ConeGeometry(0.1, 0.22, 10), fur, H, [0, -0.02, 0.17], [Math.PI / 2, 0, 0]);
  mesh(sph(0.03, 8, 6), M('#d86a80', { roughness: 0.3 }), H, [0, -0.02, 0.28]);
  for (const sd of [-1, 1]) { mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.015, 14), pink, H, [sd * 0.1, 0.12, -0.02], [Math.PI / 2, 0, sd * 0.4]); mesh(sph(0.022, 8, 6), new THREE.MeshBasicMaterial({ color: '#ff3a3a' }), H, [sd * 0.06, 0.04, 0.11]); }
  const curve = new THREE.CatmullRomCurve3([new V3(0, 0, -0.38), new V3(0, -0.05, -0.6), new V3(0.1, -0.2, -0.8), new V3(0.2, -0.28, -0.95)]);
  mesh(new THREE.TubeGeometry(curve, 12, 0.025, 6, false), pink, T);
  for (const [n, x, z] of [['legL', -0.14, 0.15], ['legR', 0.14, 0.15], ['armL', -0.14, -0.22], ['armR', 0.14, -0.22]]) {
    const L = new THREE.Group(); L.name = n; L.position.set(x, 0.22, z); G.add(L); mesh(new THREE.CapsuleGeometry(0.045, 0.14, 3, 6), furD, L, [0, -0.11, 0]);
  }
  const inv = new THREE.MeshBasicMaterial({ visible: false });
  const body = mesh(new THREE.BoxGeometry(0.6, 0.6, 0.95), inv, G, [0, 0.32, 0.05]); body.name = 'hitBody';
  const head = mesh(new THREE.SphereGeometry(0.2, 8, 6), inv, H, [0, 0, 0.05]); head.name = 'hitHead';
  finish(G); body.castShadow = head.castShadow = false; return G;
}
export function buildEnemy(type) {
  if (type !== 'ratto') return buildMammutones(type);
  if (!ratTemplate) ratTemplate = makeRat();
  const G = ratTemplate.clone(true); const P = { bells: [] };
  G.traverse(o => { if (['legL', 'legR', 'armL', 'armR', 'head', 'torso'].includes(o.name)) P[o.name] = o; });
  G.userData.P = P; G.userData.height = 0.6; G.userData.hit = { body: G.getObjectByName('hitBody'), head: G.getObjectByName('hitHead') };
  return G;
}
/* Fab La Rue come boss: piu' grande, con le hitbox */
export function buildFabBoss() {
  const G = buildFab(); G.scale.setScalar(1.35);
  const inv = new THREE.MeshBasicMaterial({ visible: false });
  const body = mesh(new THREE.BoxGeometry(0.62, 1.5, 0.45), inv, G, [0, 0.78, 0]); body.name = 'hitBody';
  const head = mesh(new THREE.SphereGeometry(0.2, 8, 6), inv, G.userData.P.head, [0, 0, 0]); head.name = 'hitHead';
  G.userData.hit = { body, head }; G.userData.P.bells = []; G.userData.height = 1.75 * 1.35;
  return G;
}

/* ---------- Loris Busato: il boss finale ---------- */
export function buildLoris() {
  const G = human({
    h: 1.85, w: 1.15, chest: 1.08, arm: 1.15, skin: '#e8b896', top: '#1e1816', pants: '#26262e', shoe: '#3a2416', sole: '#2a1a10', sleeve: 'long', cuff: '#2a2220', hair: '#3a2618', brow: 1, browTilt: 0.2,
    hairFn: (H) => {
      const curl = [M('#3a2618', { roughness: 0.6 }), M('#4e3420', { roughness: 0.6 })]; hairCap(H, curl[0], 0.142, 0.46); backHair(H, curl[0]); seed = 77;
      for (let i = 0; i < 80; i++) { const a = rnd() * Math.PI * 2, rr = Math.sqrt(rnd()) * 0.15; const front = Math.sin(a) * rr; const y = 0.12 + Math.sqrt(Math.max(0, 0.024 - rr * rr)) * 0.5 + rnd() * 0.04 - (front > 0.08 ? 0.04 : 0); mesh(sph(0.034 + rnd() * 0.014, 8, 6), curl[i % 2], H, [Math.cos(a) * rr, y, front + 0.005]); }
    },
    extra: (G, T, H, P) => {
      const black = M('#0d0e10', { roughness: 0.15, metalness: 0.4 });
      for (const sd of [-1, 1]) { mesh(rbox(0.075, 0.05, 0.022, 0.012), black, H, [sd * 0.047, 0.012, 0.13]); mesh(rbox(0.014, 0.014, 0.13, 0.005), black, H, [sd * 0.124, 0.02, 0.07]); mesh(sph(0.012, 6, 4), new THREE.MeshBasicMaterial({ color: '#ff2a2a' }), H, [sd * 0.047, 0.012, 0.142]); }
      mesh(rbox(0.035, 0.014, 0.014, 0.005), black, H, [0, 0.025, 0.137]);
      /* mantello di pelliccia da capo dei Mammutones con i campanacci */
      const fur = [M('#1e1816', { roughness: 1 }), M('#2e2422', { roughness: 1 }), M('#141010', { roughness: 1 })]; seed = 78;
      for (let i = 0; i < 70; i++) { const a = rnd() * Math.PI * 2, y = 0.25 + rnd() * 0.35; mesh(sph(0.07 + rnd() * 0.04, 8, 6), fur[i % 3], T, [Math.cos(a) * 0.2, y, Math.sin(a) * 0.15 - 0.02], null, [1, 1.4, 1]); }
      const bronze = M('#b88634', { roughness: 0.32, metalness: 0.85 });
      for (let k = 0; k < 5; k++) mesh(bellGeo(0.8), bronze, T, [-0.16 + k * 0.08, 0.3 - Math.abs(k - 2) * 0.03, 0.17]);
      for (let k = 0; k < 3; k++) mesh(bellGeo(1.3), bronze, T, [-0.12 + k * 0.12, 0.42, -0.2]);
      const mk = new THREE.Group(); mk.position.copy(P.armL.userData.hand.position); mk.position.y -= 0.1; mk.position.z += 0.05; P.armL.add(mk);
      mesh(sph(0.15, 18, 12), M('#16100e', { roughness: 0.38 }), mk, [0, 0, 0], null, [0.95, 1.22, 0.45]); mesh(new THREE.ConeGeometry(0.035, 0.12, 8), M('#2c201a'), mk, [0, 0, 0.08], [Math.PI * 0.42, 0, 0]);
      for (const sd of [-1, 1]) mesh(sph(0.03, 8, 6), M('#000'), mk, [sd * 0.05, 0.04, 0.05], null, [1.2, 0.8, 0.5]);
    },
  });
  G.scale.setScalar(1.5);
  const inv = new THREE.MeshBasicMaterial({ visible: false });
  const body = mesh(new THREE.BoxGeometry(0.7, 1.55, 0.5), inv, G, [0, 0.8, 0]); body.name = 'hitBody';
  const head = mesh(new THREE.SphereGeometry(0.2, 8, 6), inv, G.userData.P.head, [0, 0, 0]); head.name = 'hitHead';
  G.userData.hit = { body, head }; G.userData.P.bells = []; G.userData.height = 1.85 * 1.5;
  return G;
}

/* ---------- il Capo dell'Happy Shopping: boss del mondo 2, enorme ---------- */
export function buildCapo() {
  const G = buildHuman(13); G.scale.setScalar(1.55);
  const inv = new THREE.MeshBasicMaterial({ visible: false });
  const body = mesh(new THREE.BoxGeometry(1.0, 1.65, 0.8), inv, G, [0, 0.85, 0]); body.name = 'hitBody';
  const head = mesh(new THREE.SphereGeometry(0.21, 8, 6), inv, G.userData.P.head, [0, 0, 0]); head.name = 'hitHead';
  G.userData.hit = { body, head }; G.userData.P.bells = []; G.userData.height = 1.95 * 1.55;
  return G;
}
