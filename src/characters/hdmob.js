/* Mob realistici (Meshy). Il nemico resta quello di styled.js (hitbox, parti, altezza, scala: tutto il gioco
   continua a usarle) ma diventa invisibile, e dentro ci mettiamo il modello vero animato.
   - mob a due gambe: scheletro Mixamo, animazioni prese tutte da public/models/mobanim.glb (il Mammutones)
   - ratti: scheletro da animale di Meshy con la sua camminata; morso, colpo e morte li facciamo qui nel codice */
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import { clone as skClone } from 'three/examples/jsm/utils/SkeletonUtils.js';
import { hdOn } from './hd.js';
import { buildEnemy } from './styled.js';

const V3 = THREE.Vector3, Q = THREE.Quaternion;
const BASE = (import.meta.env.BASE_URL || '/') + 'models/';
const loader = new GLTFLoader(); loader.setMeshoptDecoder(MeshoptDecoder);
const files = {};
const get = id => files[id] || (files[id] = loader.loadAsync(BASE + id + '.glb').catch(e => { delete files[id]; throw e; }));
const lowEnd = typeof matchMedia !== 'undefined' && matchMedia('(pointer: coarse)').matches;

/* che modello e che animazioni per ogni nemico.
   move: corsa o camminata, ref: a che velocita' (m/s, per uno alto 1,8) quella clip non fa scivolare i piedi */
const CFG = {
  base:         { files: ['mob_base'],        move: 'Walking',             ref: 1.35, atk: ['Punch_Combo', 'Right_Hand_Sword_Slash'], die: ['Dead', 'dying_backwards', 'Fall_Dead_from_Abdominal_Injury'], idle: 'Neck_Slashing_Gesture' },
  grosso:       { files: ['mob_grosso'],      move: 'Walking',             ref: 1.35, atk: ['Charged_Slash'], die: ['Fall_Dead_from_Abdominal_Injury', 'Dead'], idle: 'Block5' },
  cornuto:      { files: ['mob_cornuto'],     move: 'run_fast_7_inplace',  ref: 5.0,  atk: ['Right_Hand_Sword_Slash', 'Punch_Combo'], die: ['dying_backwards', 'Dead'], idle: 'Neck_Slashing_Gesture' },
  furia:        { files: ['mob_furia'],       move: 'run_fast_10_inplace', ref: 5.6,  atk: ['Punch_Combo'], die: ['Dead', 'dying_backwards'], idle: 'Neck_Slashing_Gesture' },
  impossessato: { files: ['mob_impossessato'], move: 'Running',            ref: 3.6,  atk: ['Charged_Slash', 'Punch_Combo'], die: ['Fall_Dead_from_Abdominal_Injury', 'dying_backwards'], idle: 'Neck_Slashing_Gesture' },
  orco:         { files: ['mob_orco1', 'mob_orco2'], move: 'Running',      ref: 3.6,  atk: ['Right_Hand_Sword_Slash'], die: ['dying_backwards', 'Dead', 'Fall_Dead_from_Abdominal_Injury'], idle: 'Block5', weapon: 'tubo' },
  orcone:       { files: ['mob_orcone'],      move: 'Walking',             ref: 1.35, atk: ['Charged_Slash'], die: ['Fall_Dead_from_Abdominal_Injury', 'Dead'], idle: 'Block5', weapon: 'palo' },
  sgherrone:    { files: ['mob_sgherrone'],   move: 'Running',             ref: 3.6,  atk: ['Punch_Combo', 'Charged_Slash'], die: ['Dead', 'dying_backwards'], idle: 'Block5' },
  ratto:        { files: ['mob_ratto'],   quad: 1, h: 0.42, ref: 1.1 },
  fachiro:      { files: ['mob_fachiro'], quad: 1, h: 0.78, ref: 1.1 },
};
/* in che ordine scaricarli, a seconda del mondo (prima quelli che escono subito) */
const ORDER = {
  1: ['base', 'cornuto', 'furia', 'ratto', 'grosso'],
  2: ['base', 'cornuto', 'furia', 'grosso'],
  3: ['orco', 'orcone', 'ratto', 'fachiro', 'impossessato', 'base', 'furia'],
  4: ['base', 'orco', 'orcone', 'sgherrone', 'furia', 'cornuto', 'grosso', 'impossessato'],
};
const tpl = {}; let lib = null, loading = null;

/* altezza vera del modello in posa di partenza (funziona anche coi ratti, che Meshy esporta in scala minuscola) */
function measure(scene) {
  scene.updateMatrixWorld(true); const box = new THREE.Box3(), v = new V3();
  scene.traverse(o => {
    if (!o.isSkinnedMesh) return; const pos = o.geometry.attributes.position; const step = Math.max(1, Math.floor(pos.count / 1500));
    for (let i = 0; i < pos.count; i += step) { v.fromBufferAttribute(pos, i); o.boneTransform(i, v); v.applyMatrix4(o.matrixWorld); box.expandByPoint(v); }
  });
  return box;
}
function fit(clips, nodes, hips, srcY) {
  return clips.map(c0 => {
    const c = c0.clone(); c.tracks = c.tracks.filter(t => nodes.has(t.name.slice(0, t.name.lastIndexOf('.'))));
    if (hips) for (const t of c.tracks) if (/Hips\.position$/.test(t.name)) { const v = t.values, r = srcY ? hips.y / srcY : 1; for (let i = 0; i < v.length; i += 3) { v[i] = hips.x; v[i + 1] *= r; v[i + 2] = hips.z; } }
    return c;
  });
}
async function loadType(type) {
  const C = CFG[type]; if (tpl[type]) return;
  if (!C.quad && !lib) lib = await get('mobanim');
  const list = [];
  for (const f of C.files) {
    const g = await get(f); const nodes = new Set(); let hips = null;
    g.scene.traverse(o => { nodes.add(o.name); if (/Hips$/.test(o.name) && o.isBone) hips = o; if (o.isMesh) { o.castShadow = !lowEnd; o.receiveShadow = false; o.frustumCulled = false; const m = o.material; m.metalness = 0; m.roughness = Math.max(0.6, m.roughness ?? 0.85); m.envMapIntensity = 0.6; } });
    let srcY = 0; if (lib) lib.scene.traverse(o => { if (/Hips$/.test(o.name)) srcY = o.position.y; });
    const clips = C.quad ? fit(g.animations, nodes, null, 0) : fit(lib.animations, nodes, hips && hips.position, srcY);
    list.push({ scene: g.scene, clips, box: measure(g.scene) });
  }
  tpl[type] = list;
}
export function preloadMobs(world) {
  if (!hdOn) return Promise.resolve();
  const order = (ORDER[world] || []).concat(Object.keys(CFG)).filter((t, i, a) => a.indexOf(t) === i);
  const run = async () => { for (const t of order) { try { await loadType(t); } catch (e) { console.warn('mob HD non caricato', t, e); } } };
  loading = (loading || Promise.resolve()).then(run); return loading;
}
export const mobReady = type => !!tpl[type];

/* il nemico: quello di sempre, invisibile, con dentro il modello realistico */
export function makeMob(type) {
  if (!hdOn || !tpl[type]) return null;
  const C = CFG[type], T = tpl[type][Math.floor(Math.random() * tpl[type].length)];
  const G = buildEnemy(type);
  G.traverse(o => { if (o.isMesh && o.name !== 'hitBody' && o.name !== 'hitHead') o.visible = false; });
  const model = skClone(T.scene); const raw = T.box.max.y - T.box.min.y;
  const H = (C.h || G.userData.height) / G.scale.x;
  model.scale.multiplyScalar(H / raw); model.position.y = -T.box.min.y * H / raw;
  /* i ratti di Meshy guardano verso +X: li giriamo dentro un gruppo, cosi' guardano avanti come tutti */
  if (C.quad) { const w = new THREE.Group(); w.rotation.y = -Math.PI / 2; w.add(model); G.add(w); } else G.add(model);
  const ctl = G.userData.hdm = new MobCtl(type, C, model, T.clips, H * G.scale.x); ctl.y0 = model.position.y; return G;
}

const _q1 = new Q(), _q2 = new Q(), _q3 = new Q(), UP = new V3(0, 1, 0);
function turnBone(bone, axis, ang) {
  if (!bone || Math.abs(ang) < 1e-4) return;
  const bw = bone.getWorldQuaternion(_q1); const tgt = _q2.setFromAxisAngle(axis, ang).multiply(bw);
  bone.quaternion.copy(bone.parent.getWorldQuaternion(_q3).invert().multiply(tgt)); bone.updateMatrixWorld(true);
}
const pick = a => a[Math.floor(Math.random() * a.length)];
const metal = new THREE.MeshStandardMaterial({ color: '#7a7f86', roughness: 0.45, metalness: 0.7 });
const wood = new THREE.MeshStandardMaterial({ color: '#6a4a2c', roughness: 0.85 });

class MobCtl {
  constructor(type, C, model, clips, height) {
    this.type = type; this.C = C; this.model = model; this.height = height; this.dead = false; this.t = Math.random() * 10;
    this.mixer = new THREE.AnimationMixer(model); this.act = {};
    for (const c of clips) { const a = this.mixer.clipAction(c); if (/Dead|dying|Fall_Dead/.test(c.name)) { a.setLoop(THREE.LoopOnce, 1); a.clampWhenFinished = true; } this.act[c.name] = a; }
    this.bones = {}; model.traverse(o => { if (o.isBone) this.bones[o.name.replace(/^mixamorig:?/, '')] = o; });
    this.atkName = C.atk ? pick(C.atk.filter(n => this.act[n])) : null; this.dieName = C.die ? pick(C.die.filter(n => this.act[n])) : null;
    this.cur = null;
    if (C.quad) { this.walk = Object.values(this.act)[0]; if (this.walk) { this.walk.play(); this.walk.time = Math.random() * 1; } }
    else this.play(C.move, 0);
    if (C.weapon && this.bones.RightHand) this.arm(C.weapon);
  }
  arm(kind) {
    const len = kind === 'palo' ? 1.7 : 0.95, r = kind === 'palo' ? 0.035 : 0.024;
    const g = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 8), kind === 'palo' ? wood : metal); g.castShadow = !lowEnd;
    const h = this.bones.RightHand; h.updateMatrixWorld(true); const ws = h.getWorldScale(new V3()).x / this.model.parent.getWorldScale(new V3()).x || 1;
    /* il bastone attraversa il pugno (asse X dell'osso della mano), con la parte lunga in avanti */
    g.rotation.z = Math.PI / 2; g.position.set(len * 0.32, 0.07 * this.height / 1.9, 0); g.scale.setScalar(1 / ws / (this.model.scale.x || 1));
    h.add(g);
  }
  root() { let o = this.model; while (o.parent && !o.userData.hdm) o = o.parent; return o; }
  play(name, fade = 0.25, ts = 1) {
    const a = this.act[name]; if (!a) return;
    if (this.cur === a) { a.timeScale = ts; return; }
    a.reset(); a.timeScale = ts; a.fadeIn(fade).play(); if (this.cur) this.cur.fadeOut(fade); this.cur = a;
  }
  die() { if (this.dead) return; this.dead = true; this.deadT = 0; if (!this.C.quad && this.dieName) this.play(this.dieName, 0.15, 1); }
  /* s: { moving, speed, attacking, atkCd, slow, kick } */
  update(dt, s) {
    this.t += dt; const C = this.C;
    this.mixer.timeScale = this.dead ? 1 : s.slow;
    if (C.quad) return this.quad(dt, s);
    if (!this.dead) {
      const k = this.height / 1.8;
      if (s.attacking && this.atkName) { const d = this.act[this.atkName].getClip().duration; this.play(this.atkName, 0.15, THREE.MathUtils.clamp(d / Math.max(0.5, s.atkCd || 1.2), 0.8, 2.2)); }
      else if (s.moving) this.play(C.move, 0.2, THREE.MathUtils.clamp(s.speed / (C.ref * k), 0.5, 2.3));
      else this.play(this.act[C.idle] ? C.idle : C.move, 0.3, this.act[C.idle] ? 1 : 0.0001);
    }
    this.mixer.update(dt);
    if (!this.dead && s.kick > 0) {
      /* colpito: il busto va indietro per un attimo */
      const yaw = this.root().rotation.y, R = new V3(-Math.cos(yaw), 0, Math.sin(yaw));
      this.model.updateMatrixWorld(true); turnBone(this.bones.Spine1 || this.bones.Spine, R, s.kick * 3);
    }
  }
  /* ratti: camminata di Meshy accelerata, il resto a mano sulle ossa */
  quad(dt, s) {
    const B = this.bones, m = this.model;
    if (this.dead) {
      this.deadT += dt; const k = Math.min(1, this.deadT * 4);
      m.rotation.x = k * Math.PI / 2 * 0.95; if (this.walk) this.walk.timeScale = Math.max(0, 1 - k * 2); this.mixer.update(dt); return;
    }
    const k = this.height / 0.6;
    if (this.walk) this.walk.timeScale = s.moving ? THREE.MathUtils.clamp(s.speed / (this.C.ref * k), 0.6, 3.2) : s.attacking ? 0.4 : 0.15;
    this.mixer.update(dt);
    m.updateMatrixWorld(true);
    const yaw = this.root().rotation.y, R = new V3(-Math.cos(yaw), 0, Math.sin(yaw));
    /* corsa: il corpo rimbalza un po' */
    m.position.x = 0;
    if (s.moving) m.position.y = this.y0 + Math.abs(Math.sin(this.t * 14)) * 0.04 * this.height;
    else m.position.y = this.y0;
    if (s.attacking) {
      /* morso: scatto in avanti con la testa che si abbassa e si rialza */
      const a = Math.max(0, Math.sin(this.t * 9));
      m.position.x = a * 0.22 * this.height / this.root().scale.x; turnBone(B.head, R, -a * 0.5); turnBone(B.chest, R, -a * 0.18);
    } else if (!s.moving) turnBone(B.chest, R, Math.sin(this.t * 3) * 0.04);
    if (s.kick > 0) turnBone(B.chest, R, s.kick * 2.5);
  }
}
