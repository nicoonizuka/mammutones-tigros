/* Grafica migliorata per tutti i mondi:
   - effetti sull'immagine (bagliori sulle luci, colori da film, angoli piu' scuri, un filo di grana)
   - riflessi d'ambiente per i materiali (metallo, vetro, asfalto bagnato)
   - dettaglio sulle superfici senza texture nuove: sporco, variazioni di colore e di ruvidita', scuro alla base dei muri,
     chiazze bagnate sull'asfalto (tutto calcolato dalla posizione nel mondo, quindi vale per ogni muro e ogni pavimento)
   - chiome degli alberi fatte di foglie vere (tante foglie disegnate) invece dei palloncini, che si muovono col vento
   - erba alta in Sardegna
   - ombre nitide che seguono il giocatore
   Sul telefono si tiene la versione leggera (niente effetti a schermo intero, meno foglie, niente erba). */
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

const coarse = typeof matchMedia !== 'undefined' && matchMedia('(pointer: coarse)').matches;
export const HQ = !coarse && !/[?&]lq=1/.test(location.search);
let lookOn = true; try { lookOn = localStorage.getItem('mt_look') !== '0'; } catch (_) {}
export const looks = { on: lookOn };

const U = { time: { value: 0 } };
let composer = null, vmPass = null, bloom = null, grade = null, R = null;

/* ---------- ritocco finale dell'immagine ---------- */
const GradeShader = {
  uniforms: { tDiffuse: { value: null }, exposure: { value: 1.0 }, contrast: { value: 1.06 }, saturation: { value: 1.06 }, vignette: { value: 0.32 }, grain: { value: 0.025 }, tint: { value: new THREE.Color(1, 1, 1) }, time: { value: 0 } },
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
  fragmentShader: `uniform sampler2D tDiffuse; uniform float exposure, contrast, saturation, vignette, grain, time; uniform vec3 tint; varying vec2 vUv;
    vec3 rrt(vec3 v){ vec3 a = v * (v + 0.0245786) - 0.000090537; vec3 b = v * (0.983729 * v + 0.4329510) + 0.238081; return a / b; }
    vec3 aces(vec3 c){ const mat3 I = mat3(vec3(0.59719,0.07600,0.02840), vec3(0.35458,0.90834,0.13383), vec3(0.04823,0.01566,0.83777));
      const mat3 O = mat3(vec3(1.60475,-0.10208,-0.00327), vec3(-0.53108,1.10813,-0.07276), vec3(-0.07367,-0.00605,1.07602));
      c *= 1.0 / 0.6; c = I * c; c = rrt(c); c = O * c; return clamp(c, 0.0, 1.0); }
    vec3 srgb(vec3 c){ return mix(c * 12.92, pow(c, vec3(0.41666)) * 1.055 - 0.055, step(0.0031308, c)); }
    float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233))) * 43758.5453); }
    void main(){
      vec3 c = texture2D(tDiffuse, vUv).rgb * exposure * tint;
      c = aces(c);
      float l = dot(c, vec3(0.2126,0.7152,0.0722)); c = mix(vec3(l), c, saturation);
      c = (c - 0.5) * contrast + 0.5;
      vec2 d = vUv - 0.5; c *= 1.0 - vignette * smoothstep(0.25, 0.85, dot(d, d) * 2.2);
      c = srgb(clamp(c, 0.0, 1.0));
      c += (h(vUv * 913.0 + time) - 0.5) * grain;
      gl_FragColor = vec4(c, 1.0);
    }`,
};
export function initLook(renderer, scene, camera, vmScene) {
  R = renderer;
  if (!looks.on) return;
  /* riflessi d'ambiente: una stanza luminosa finta, molto attenuata, cosi' metallo e vetro riflettono qualcosa */
  const pm = new THREE.PMREMGenerator(renderer); scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture; pm.dispose();
  if (HQ) {
    sun.shadow.mapSize.set(4096, 4096); Object.assign(sun.shadow.camera, { left: -40, right: 40, top: 40, bottom: -40, near: 1, far: 160 }); sun.shadow.camera.updateProjectionMatrix();
    renderer.toneMapping = THREE.NoToneMapping;
    const size = renderer.getDrawingBufferSize(new THREE.Vector2());
    const rt = new THREE.WebGLRenderTarget(size.x, size.y, { type: THREE.HalfFloatType, samples: renderer.capabilities.isWebGL2 ? 4 : 0 });
    composer = new EffectComposer(renderer, rt);
    composer.addPass(new RenderPass(scene, camera));
    vmPass = new RenderPass(vmScene, camera); vmPass.clear = false; vmPass.clearDepth = true; composer.addPass(vmPass);
    bloom = new UnrealBloomPass(new THREE.Vector2(size.x / 2, size.y / 2), 0.28, 0.5, 1.25); composer.addPass(bloom);
    grade = new ShaderPass(GradeShader); composer.addPass(grade);
    addEventListener('resize', () => { const s = renderer.getDrawingBufferSize(new THREE.Vector2()); composer.setSize(s.x / renderer.getPixelRatio(), s.y / renderer.getPixelRatio()); });
  }
}
/* ogni mondo ha il suo ritocco */
const GRADE = {
  1: { exposure: 1.0, contrast: 1.07, saturation: 1.08, tint: [1.04, 0.98, 0.93], bloom: 0.36 },   /* tramonto */
  2: { exposure: 0.9, contrast: 1.08, saturation: 1.04, tint: [1, 1, 1], bloom: 0.22 },
  3: { exposure: 0.98, contrast: 1.08, saturation: 0.92, tint: [0.96, 1.0, 0.98], bloom: 0.34 },   /* coperto, freddo */
  4: { exposure: 0.95, contrast: 1.08, saturation: 1.05, tint: [1.02, 1.0, 0.97], bloom: 0.24 },
  5: { exposure: 1.04, contrast: 1.04, saturation: 1.12, tint: [1.0, 1.0, 0.96], bloom: 0.26 },    /* Sardegna */
  6: { exposure: 1.12, contrast: 1.1, saturation: 0.95, tint: [1.08, 0.96, 0.86], bloom: 0.55 },   /* catacombe: torce che brillano */
};
export function lookForWorld(w) {
  if (!grade) return; const G = GRADE[w] || GRADE[1], u = grade.uniforms;
  u.exposure.value = G.exposure; u.contrast.value = G.contrast; u.saturation.value = G.saturation; u.tint.value.setRGB(...G.tint); bloom.strength = G.bloom;
  sunOff.copy(sun.position).sub(sun.target.position);
}
export function renderFrame(scene, camera, vmScene, vmVisible) {
  if (composer) { vmPass.enabled = vmVisible; grade.uniforms.time.value = U.time.value % 10; composer.render(); return; }
  R.render(scene, camera);
  if (vmVisible) { const ac = R.autoClear; R.autoClear = false; R.clearDepth(); R.render(vmScene, camera); R.autoClear = ac; }
}

/* ---------- ombre che seguono il giocatore ---------- */
import { sun } from './engine.js';
const sunOff = new THREE.Vector3(-35, 62, 40);
export function followSun(p) {
  if (!looks.on) return;
  /* agganciata alla griglia della mappa d'ombra, cosi' le ombre non tremano quando ti muovi */
  const step = 80 / sun.shadow.mapSize.x * 4; const x = Math.round(p.x / step) * step, z = Math.round(p.z / step) * step;
  sun.target.position.set(x, 0, z); sun.position.set(x + sunOff.x, sunOff.y, z + sunOff.z); sun.target.updateMatrixWorld();
}
export function updateLook(dt) { U.time.value += dt; }
export const lookInfo = () => ({ composer: !!composer, hq: HQ });

/* ---------- dettaglio sulle superfici ---------- */
const NOISE = `
float lk_h(vec3 p){ p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
float lk_n(vec3 x){ vec3 i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(lk_h(i), lk_h(i + vec3(1,0,0)), f.x), mix(lk_h(i + vec3(0,1,0)), lk_h(i + vec3(1,1,0)), f.x), f.y),
             mix(mix(lk_h(i + vec3(0,0,1)), lk_h(i + vec3(1,0,1)), f.x), mix(lk_h(i + vec3(0,1,1)), lk_h(i + vec3(1,1,1)), f.x), f.y), f.z); }
varying vec3 lkP; varying vec3 lkN;`;
function detail(m, opt) {
  m.userData.look = 1;
  m.onBeforeCompile = (sh) => {
    sh.uniforms.lkWet = { value: opt.wet || 0 }; sh.uniforms.lkAmt = { value: opt.amt ?? 1 };
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 lkP; varying vec3 lkN;')
      .replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\n  { vec4 wp = vec4(transformed, 1.0);\n  #ifdef USE_INSTANCING\n  wp = instanceMatrix * wp;\n  #endif\n  lkP = (modelMatrix * wp).xyz; lkN = normalize(mat3(modelMatrix) * objectNormal); }');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform float lkWet, lkAmt;' + NOISE)
      .replace('#include <map_fragment>', `#include <map_fragment>
  { float n = lk_n(lkP * 0.33) * 0.55 + lk_n(lkP * 1.9) * 0.3 + lk_n(lkP * 9.0) * 0.15;
    diffuseColor.rgb *= mix(1.0, mix(0.8, 1.1, n), lkAmt);
    float wall = 1.0 - abs(lkN.y);
    float base = smoothstep(-0.05, 1.3, lkP.y - floor(lkP.y / 100.0) * 100.0);
    diffuseColor.rgb *= mix(1.0, mix(0.58, 1.0, base), wall * lkAmt);
    float up = max(lkN.y, 0.0);
    float st = smoothstep(0.58, 0.72, lk_n(lkP * 0.12 + 7.3)) * up * lkWet;
    diffuseColor.rgb *= 1.0 - st * 0.28; }`)
      .replace('#include <roughnessmap_fragment>', `#include <roughnessmap_fragment>
  { float rn = lk_n(lkP * 2.3 + 3.1); roughnessFactor = clamp(roughnessFactor * mix(0.82, 1.12, rn), 0.04, 1.0);
    float st2 = smoothstep(0.58, 0.72, lk_n(lkP * 0.12 + 7.3)) * max(lkN.y, 0.0) * lkWet; roughnessFactor = mix(roughnessFactor, 0.12, st2 * 0.85); }`);
  };
  m.customProgramCacheKey = () => 'look' + (opt.wet ? 'w' : '') + (opt.amt ?? 1);
  m.needsUpdate = true;
}
/* Lambert (vecchi materiali del mondo 1) -> Standard, cosi' prendono riflessi e dettaglio */
function toStandard(m) {
  const s = new THREE.MeshStandardMaterial({ color: m.color, map: m.map, emissive: m.emissive, emissiveMap: m.emissiveMap, emissiveIntensity: m.emissiveIntensity,
    transparent: m.transparent, opacity: m.opacity, side: m.side, alphaTest: m.alphaTest, roughness: 0.88, metalness: 0, vertexColors: m.vertexColors });
  s.name = m.name; return s;
}

/* ---------- foglie ---------- */
function leafTex() {
  const S = 128, c = document.createElement('canvas'); c.width = c.height = S; const g = c.getContext('2d');
  let sd = 5; const rnd = () => { sd = (sd * 16807) % 2147483647; return (sd - 1) / 2147483646; };
  for (let i = 0; i < 26; i++) {
    const x = 16 + rnd() * 96, y = 16 + rnd() * 96, a = rnd() * Math.PI * 2, L = 14 + rnd() * 14, v = 150 + Math.floor(rnd() * 105);
    g.save(); g.translate(x, y); g.rotate(a); g.fillStyle = `rgb(${v},${v},${v})`;
    g.beginPath(); g.moveTo(0, -L / 2); g.quadraticCurveTo(L * 0.38, 0, 0, L / 2); g.quadraticCurveTo(-L * 0.38, 0, 0, -L / 2); g.fill();
    g.strokeStyle = `rgba(60,60,60,0.5)`; g.lineWidth = 1; g.beginPath(); g.moveTo(0, -L / 2); g.lineTo(0, L / 2); g.stroke(); g.restore();
  }
  const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; return t;
}
function isLeaf(o) {
  if (!o.isMesh || o.isInstancedMesh || !o.geometry) return false;
  const ty = o.geometry.type; if (ty !== 'IcosahedronGeometry' && ty !== 'DodecahedronGeometry' && ty !== 'SphereGeometry') return false;
  const r = o.geometry.parameters && o.geometry.parameters.radius; if (!r || r < 0.35 || r > 6) return false;
  const m = o.material; if (!m || Array.isArray(m) || !m.color || m.map || m.transparent || m.emissiveIntensity > 0 && m.emissive && m.emissive.getHex()) return false;
  const hsl = {}; m.color.getHSL(hsl);
  return hsl.s > 0.12 && ((hsl.h > 0.13 && hsl.h < 0.47 && hsl.l < 0.7) || ((hsl.h > 0.72 || hsl.h < 0.03) && hsl.l < 0.82));
}
function foliage(root) {
  const blobs = []; root.traverse(o => { if (isLeaf(o)) blobs.push(o); });
  if (!blobs.length) return 0;
  root.updateMatrixWorld(true);
  const tex = leafTex(), per = HQ ? 40 : 18;
  const mat = new THREE.MeshStandardMaterial({ map: tex, alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.85, metalness: 0 });
  /* vento: le foglie oscillano piano */
  mat.onBeforeCompile = sh => { sh.uniforms.lkTime = U.time;
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nuniform float lkTime;').replace('#include <begin_vertex>', `#include <begin_vertex>
      { vec3 ip = vec3(instanceMatrix[3][0], instanceMatrix[3][1], instanceMatrix[3][2]); float ph = ip.x * 0.7 + ip.z * 0.9;
        transformed.x += sin(lkTime * 1.7 + ph) * 0.05; transformed.y += cos(lkTime * 2.1 + ph) * 0.03; }`); };
  const depth = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: tex, alphaTest: 0.5 });
  const card = new THREE.PlaneGeometry(1, 1);
  const list = []; const q = new THREE.Quaternion(), e = new THREE.Euler(), v = new THREE.Vector3(), s = new THREE.Vector3(), c = new THREE.Color();
  let sd = 11; const rnd = () => { sd = (sd * 16807) % 2147483647; return (sd - 1) / 2147483646; };
  for (const o of blobs) {
    const wp = o.getWorldPosition(new THREE.Vector3()), ws = o.getWorldScale(new THREE.Vector3()); const r = o.geometry.parameters.radius * Math.max(ws.x, ws.y, ws.z);
    const n = Math.round(Math.min(180, Math.max(HQ ? 30 : 16, r * r * per))); const base = o.material.color;
    for (let i = 0; i < n; i++) {
      v.set(rnd() * 2 - 1, rnd() * 2 - 1, rnd() * 2 - 1).normalize(); const rr = r * (0.62 + rnd() * 0.42);
      const pos = wp.clone().addScaledVector(v, rr); pos.y += r * 0.05 * (ws.y / Math.max(ws.x, 1e-3) - 1);
      e.set(rnd() * Math.PI, rnd() * Math.PI * 2, rnd() * Math.PI); q.setFromEuler(e); const sz = Math.max(r * (0.5 + rnd() * 0.35), 0.35 + rnd() * 0.2); s.set(sz, sz, sz);
      const k = 0.7 + rnd() * 0.45 * (0.6 + 0.4 * (v.y + 1) / 2); c.copy(base).multiplyScalar(k * 1.25);
      list.push([new THREE.Matrix4().compose(pos, q, s), c.clone()]);
    }
    /* il palloncino resta come interno della chioma, piu' piccolo e scuro, cosi' non si vede attraverso le foglie */
    o.scale.multiplyScalar(0.6); o.material = o.material.clone(); o.material.color.multiplyScalar(0.42); o.castShadow = false;
  }
  const im = new THREE.InstancedMesh(card, mat, list.length); im.customDepthMaterial = depth; im.castShadow = true; im.receiveShadow = true;
  list.forEach(([m4, col], i) => { im.setMatrixAt(i, m4); im.setColorAt(i, col); }); im.instanceMatrix.needsUpdate = true; if (im.instanceColor) im.instanceColor.needsUpdate = true;
  im.frustumCulled = false; root.add(im); return list.length;
}

/* ---------- erba alta in Sardegna ---------- */
function grassTex() {
  const S = 128, c = document.createElement('canvas'); c.width = c.height = S; const g = c.getContext('2d');
  let sd = 9; const rnd = () => { sd = (sd * 16807) % 2147483647; return (sd - 1) / 2147483646; };
  for (let i = 0; i < 40; i++) { const x = 8 + rnd() * 112, w = 2 + rnd() * 3, h = 50 + rnd() * 78, bend = (rnd() - 0.5) * 30, v = 140 + Math.floor(rnd() * 100);
    g.fillStyle = `rgb(${v},${v},${v})`; g.beginPath(); g.moveTo(x - w, S); g.quadraticCurveTo(x + bend * 0.4, S - h * 0.6, x + bend, S - h); g.quadraticCurveTo(x + bend * 0.4 + 1, S - h * 0.6, x + w, S); g.fill(); }
  const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; return t;
}
export function addGrass(root, area, color = '#7a9a4a', count = 9000) {
  if (!looks.on || !HQ) return;
  const tex = grassTex();
  const mat = new THREE.MeshStandardMaterial({ map: tex, alphaTest: 0.45, side: THREE.DoubleSide, roughness: 0.9, color });
  mat.onBeforeCompile = sh => { sh.uniforms.lkTime = U.time;
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nuniform float lkTime;').replace('#include <begin_vertex>', `#include <begin_vertex>
      { vec3 ip = vec3(instanceMatrix[3][0], instanceMatrix[3][1], instanceMatrix[3][2]); float k = max(position.y + 0.5, 0.0);
        transformed.x += sin(lkTime * 1.3 + ip.x * 0.3 + ip.z * 0.2) * 0.18 * k; transformed.z += cos(lkTime * 1.1 + ip.z * 0.3) * 0.1 * k; }`); };
  const geo = new THREE.PlaneGeometry(1, 1); geo.translate(0, 0.5, 0);
  const g2 = geo.clone(); g2.rotateY(Math.PI / 2); const both = mergeTwo(geo, g2);
  const im = new THREE.InstancedMesh(both, mat, count); const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), p = new THREE.Vector3(), c = new THREE.Color(color), cc = new THREE.Color();
  let sd = 3; const rnd = () => { sd = (sd * 16807) % 2147483647; return (sd - 1) / 2147483646; };
  for (let i = 0; i < count; i++) {
    p.set(area.x1 + rnd() * (area.x2 - area.x1), 0, area.z1 + rnd() * (area.z2 - area.z1)); q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), rnd() * Math.PI);
    const h = 0.35 + rnd() * 0.45; s.set(0.6 + rnd() * 0.5, h, 1); m4.compose(p, q, s); im.setMatrixAt(i, m4); cc.copy(c).multiplyScalar(0.75 + rnd() * 0.45); im.setColorAt(i, cc);
  }
  im.receiveShadow = true; im.frustumCulled = false; root.add(im);
}
function mergeTwo(a, b) {
  const g = new THREE.BufferGeometry();
  for (const k of ['position', 'normal', 'uv']) { const A = a.attributes[k], B = b.attributes[k]; const arr = new Float32Array(A.array.length + B.array.length); arr.set(A.array); arr.set(B.array, A.array.length); g.setAttribute(k, new THREE.BufferAttribute(arr, A.itemSize)); }
  const ia = a.index.array, ib = b.index.array, off = a.attributes.position.count; const idx = new Uint16Array(ia.length + ib.length); idx.set(ia); for (let i = 0; i < ib.length; i++) idx[ia.length + i] = ib[i] + off; g.setIndex(new THREE.BufferAttribute(idx, 1));
  return g;
}

/* ---------- passata su tutto il mondo (prima di unire le mesh ferme) ---------- */
export function upgradeWorld(root, wetTest) {
  if (!looks.on) return { leaves: 0 };
  const leaves = foliage(root);
  const conv = new Map();
  root.traverse(o => {
    if (!o.isMesh || o.isSkinnedMesh || o.isSprite) return;
    const one = m => {
      if (!m || m.userData.look || m.transparent || m.isShaderMaterial || m.isMeshBasicMaterial || m.isMeshDepthMaterial || m.isPointsMaterial || m.isLineBasicMaterial) return m;
      if (m.isMeshLambertMaterial || m.isMeshPhongMaterial) { if (!conv.has(m)) conv.set(m, toStandard(m)); m = conv.get(m); }
      if (!m.isMeshStandardMaterial) return m;
      if (!m.userData.look) { m.envMapIntensity = m.metalness > 0.3 ? 0.9 : 0.35; detail(m, { wet: wetTest && wetTest(o) ? 1 : 0, amt: m.map ? 0.6 : 1 }); }
      return m;
    };
    o.material = Array.isArray(o.material) ? o.material.map(one) : one(o.material);
  });
  return { leaves };
}
