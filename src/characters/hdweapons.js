/* Armi e oggetti realistici (Meshy). L'arma a blocchi resta (con la bocca di fuoco e le misure che il gioco usa),
   diventa invisibile e dentro ci mettiamo il modello vero, girato con la canna in avanti e della stessa lunghezza. */
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import { hdOn } from './hd.js';
import { weaponHook } from './styled.js';

const BASE = (import.meta.env.BASE_URL || '/') + 'models/';
const loader = new GLTFLoader(); loader.setMeshoptDecoder(MeshoptDecoder);
const WEAP = ['pistola', 'pistauto', 'deagle', 'fucile', 'pompa', 'pompauto', 'ak47', 'ar', 'mitra', 'mitragliatore', 'minigun', 'cecchino', 'bazooka', 'katana'];
const PROPS = ['panino', 'campanaccio', 'sigarette', 'pipistrello'];
/* piccole correzioni di misura (rispetto all'arma a blocchi) */
const FIX = { pistola: 1.0, deagle: 1.05, minigun: 1.0 };
const T = {}, PR = {};
let started = null;

function prep(scene, turn) {
  const root = new THREE.Group(); if (turn) scene.rotation.y = Math.PI / 2; root.add(scene);
  scene.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = false; const m = o.material; if (m) m.envMapIntensity = 0.9; } });
  root.updateMatrixWorld(true); return { root, box: new THREE.Box3().setFromObject(root) };
}
export function preloadWeapons() {
  if (!hdOn) return Promise.resolve(); if (started) return started;
  const a = WEAP.map(id => loader.loadAsync(BASE + 'arma_' + id + '.glb').then(g => { T[id] = prep(g.scene, true); }).catch(() => {}));
  const b = PROPS.map(id => loader.loadAsync(BASE + 'prop_' + id + '.glb').then(g => { PR[id] = id === 'pipistrello' ? prepBat(g.scene) : prep(g.scene, false); }).catch(() => {}));
  return (started = Promise.all(a.concat(b)));
}
const hide = g => g.traverse(o => { if (o.isMesh) o.visible = false; });

weaponHook.fn = (id, g) => {
  const t = T[id]; if (!hdOn || !t) return g;
  const pb = new THREE.Box3().setFromObject(g); if (pb.isEmpty()) return g;
  const len = pb.max.z - pb.min.z, hl = t.box.max.z - t.box.min.z, k = len / hl * (FIX[id] || 1);
  const m = t.root.clone(true); m.scale.setScalar(k);
  m.position.set(-(t.box.min.x + t.box.max.x) / 2 * k, (pb.min.y + pb.max.y) / 2 - (t.box.min.y + t.box.max.y) / 2 * k, pb.max.z - t.box.max.z * k);
  hide(g); g.add(m); g.userData.hdWeapon = 1; return g;
};

/* oggetti lanciati: stessa misura di quello a blocchi */
export function propify(g, name) {
  const t = PR[name]; if (!hdOn || !t || name === 'pipistrello') return g;
  const pb = new THREE.Box3().setFromObject(g), s = new THREE.Vector3(); pb.getSize(s); const ts = new THREE.Vector3(); t.box.getSize(ts);
  const k = Math.max(s.x, s.y, s.z) / Math.max(ts.x, ts.y, ts.z) * 1.15;
  const m = t.root.clone(true); m.scale.setScalar(k); const c = new THREE.Vector3(); t.box.getCenter(c); m.position.copy(c).multiplyScalar(-k);
  hide(g); g.add(m); return g;
}

/* pipistrello: il modello e' un pezzo unico, lo tagliamo in corpo + due ali (incernierate ai lati del corpo) cosi' le ali sbattono */
function prepBat(scene) {
  scene.updateMatrixWorld(true); const parts = { body: [], L: [], R: [] }; let mat = null;
  scene.traverse(o => {
    if (!o.isMesh) return; mat = o.material; const g = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone(); g.applyMatrix4(o.matrixWorld);
    const P = g.attributes.position, N = g.attributes.normal, U = g.attributes.uv;
    for (let i = 0; i < P.count; i += 3) { const cx = (P.getX(i) + P.getX(i + 1) + P.getX(i + 2)) / 3; const side = cx < -0.1 ? 'L' : cx > 0.1 ? 'R' : 'body';
      for (let j = 0; j < 3; j++) parts[side].push([P.getX(i + j), P.getY(i + j), P.getZ(i + j), N ? N.getX(i + j) : 0, N ? N.getY(i + j) : 1, N ? N.getZ(i + j) : 0, U ? U.getX(i + j) : 0, U ? U.getY(i + j) : 0]); }
  });
  const box = new THREE.Box3(); for (const k in parts) for (const v of parts[k]) box.expandByPoint(new THREE.Vector3(v[0], v[1], v[2]));
  const c = new THREE.Vector3(); box.getCenter(c); const span = box.max.x - box.min.x;
  const geo = (list, hx) => { const g = new THREE.BufferGeometry(); const n = list.length;
    const p = new Float32Array(n * 3), nn = new Float32Array(n * 3), uv = new Float32Array(n * 2);
    list.forEach((v, i) => { p.set([v[0] - hx, v[1] - c.y, v[2] - c.z], i * 3); nn.set([v[3], v[4], v[5]], i * 3); uv.set([v[6], v[7]], i * 2); });
    g.setAttribute('position', new THREE.BufferAttribute(p, 3)); g.setAttribute('normal', new THREE.BufferAttribute(nn, 3)); g.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); return g; };
  return { mat, span, body: geo(parts.body, c.x), L: geo(parts.L, c.x - 0.1), R: geo(parts.R, c.x + 0.1) };
}
export function makeBatHD(size = 0.9) {
  const t = PR.pipistrello; if (!hdOn || !t) return null;
  const k = size / t.span, G = new THREE.Group(), inner = new THREE.Group(); inner.scale.setScalar(k); G.add(inner);
  const body = new THREE.Mesh(t.body, t.mat); body.castShadow = true; inner.add(body);
  const wings = [];
  for (const [geo, x] of [[t.L, -0.1], [t.R, 0.1]]) { const w = new THREE.Group(); w.position.x = x; const m = new THREE.Mesh(geo, t.mat); m.castShadow = true; w.add(m); inner.add(w); wings.push(w); }
  G.userData.wings = wings; G.userData.body = inner; return G;
}
