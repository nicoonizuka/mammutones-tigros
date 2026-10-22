/* Personaggi HD: modelli realistici (Meshy, scheletro Mixamo) con le animazioni di Pika condivise.
   Ogni personaggio sta in public/models/<id>.glb, le animazioni comuni in public/models/anim.glb.
   Il gruppo restituito si usa come i vecchi modelli: userData.height, userData.P (parti finte, cosi'
   il codice che muoveva braccia e gambe dei modelli a blocchi non si rompe) e userData.hd (il controller).

   Le animazioni girano su due livelli separati:
   - gambe (bacino e gambe): fermo, corsa in tutte le direzioni (il bacino si gira verso dove vai), salto, morte
   - busto (schiena, braccia, testa): segue le gambe, oppure fa ricarica / lancio / colpo / potere sopra la corsa
   Sopra al busto c'e' la mira: schiena e braccia puntano l'arma dove guardi. */
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import { clone as skClone } from 'three/examples/jsm/utils/SkeletonUtils.js';

const V3 = THREE.Vector3, Q = THREE.Quaternion;
const BASE = (import.meta.env.BASE_URL || '/') + 'models/';
const loader = new GLTFLoader(); loader.setMeshoptDecoder(MeshoptDecoder);
const files = {};
const get = id => files[id] || (files[id] = loader.loadAsync(BASE + id + '.glb').catch(e => { delete files[id]; throw e; }));

/* i modelli sono in metri veri; il mondo del gioco e' fatto un po' piu' grande, quindi li allarghiamo */
export const HD_SCALE = 1.08;
/* velocita' (m/s) a cui la corsa di Pika non fa scivolare i piedi */
const RUN_SPEED = 4.1;

const A = {
  idle: 'Idle_02', run: 'Running', jump: 'Regular_Jump', die: 'Shot_and_Fall_Forward',
  reload: 'Standing_Reload', hit: 'Slap_Reaction', throw: 'baseball_pitching', walk: 'Walking',
};
/* pezzi utili delle animazioni lunghe: [inizio, fine] in secondi */
const WIN = { Standing_Reload: [0.25, 3.0], baseball_pitching: [0.85, 1.95], Slap_Reaction: [0.05, 0.85], Regular_Jump: [0.5, 1.6] };
/* animazioni extra fatte apposta per alcuni personaggi */
const POWER_ANIM = { ali: 'Skill_01', debe: 'Shake_It_Off_Dance', diego: 'Shouting_Angrily' };
const FAST_RUN = { nico: 'RunFast' };
const ONCE = new Set(['Regular_Jump', 'Shot_and_Fall_Forward', 'Slap_Reaction', 'Standing_Reload', 'Running_Reload', 'baseball_pitching', 'Skill_01', 'Shouting_Angrily', 'Shake_It_Off_Dance', 'Run_and_Jump']);
const LOWER = /(Hips|UpLeg|Leg|Foot|Toe)/;

/* interruttore: ?hd=0 nell'indirizzo o l'opzione nel menu tornano ai modelli classici */
export let hdOn = true;
try { hdOn = localStorage.getItem('mt_hd') !== '0'; } catch (_) {}
if (/[?&]hd=0/.test(location.search)) hdOn = false;
export function setHD(on) { hdOn = on; try { localStorage.setItem('mt_hd', on ? '1' : '0'); } catch (_) {} }

export function preloadHD(id) { if (!id) return; get('anim').catch(() => {}); get(id).catch(() => {}); }

/* adatta le clip a questo scheletro: sul posto, bacino riscalato, nel salto il bacino non sale (sale gia' il giocatore),
   poi divide ogni clip in gambe e busto */
function fitClips(clips, nodes, hipsRest, hipsSrcY) {
  const out = [];
  for (const c0 of clips) {
    const c = c0.clone(); const ratio = hipsSrcY ? hipsRest.y / hipsSrcY : 1;
    c.tracks = c.tracks.filter(t => nodes.has(t.name.slice(0, t.name.lastIndexOf('.'))));
    for (const t of c.tracks) if (/Hips\.position$/.test(t.name)) {
      const v = t.values; for (let i = 0; i < v.length; i += 3) {
        v[i] = hipsRest.x; v[i + 2] = hipsRest.z; v[i + 1] *= ratio;
        if (c.name === A.jump || c.name === 'Run_and_Jump') v[i + 1] = Math.min(v[i + 1], hipsRest.y);
      }
    }
    const lo = c.clone(), up = c.clone();
    lo.tracks = c.tracks.filter(t => LOWER.test(t.name.slice(0, t.name.lastIndexOf('.'))));
    up.tracks = c.tracks.filter(t => !LOWER.test(t.name.slice(0, t.name.lastIndexOf('.'))));
    out.push({ name: c.name, dur: c.duration, lo, up });
  }
  return out;
}

export async function loadHD(id) {
  const [lib, g] = await Promise.all([get('anim'), get(id)]);
  const model = skClone(g.scene);
  const bones = {}, nodes = new Set();
  model.traverse(o => {
    nodes.add(o.name);
    if (o.isBone) bones[o.name.replace(/^mixamorig:?/, '')] = o;
    if (o.isMesh) {
      o.castShadow = true; o.receiveShadow = true; o.frustumCulled = false;
      const m = o.material = o.material.clone(); m.metalness = 0; m.roughness = Math.max(0.55, m.roughness ?? 0.8); m.envMapIntensity = 0.7;
    }
  });
  let srcY = 0; lib.scene.traverse(o => { if (/Hips$/.test(o.name)) srcY = o.position.y; });
  const clips = fitClips(lib.animations, nodes, bones.Hips.position, srcY).concat(fitClips(g.animations, nodes, bones.Hips.position, 0));
  /* altezza vera: con la compressione le posizioni sono in un'altra scala, quindi misuriamo i vertici gia' attaccati alle ossa */
  model.updateMatrixWorld(true); const box = new THREE.Box3(), v = new V3();
  model.traverse(o => { if (!o.isSkinnedMesh) return; const pos = o.geometry.attributes.position, step = Math.max(1, Math.floor(pos.count / 2000));
    for (let i = 0; i < pos.count; i += step) { v.fromBufferAttribute(pos, i); o.boneTransform(i, v); v.applyMatrix4(o.matrixWorld); box.expandByPoint(v); } });
  model.scale.setScalar(HD_SCALE);
  return new HDChar(id, model, clips, bones, (box.max.y - box.min.y) * HD_SCALE);
}

/* ---------- aiuti per orientare le ossa ---------- */
const Y = new V3(0, 1, 0);
const _q1 = new Q(), _q2 = new Q(), _q3 = new Q(), _q4 = new Q();
const _a = new V3(), _b = new V3(), _c = new V3(), _d = new V3(), _e = new V3();
/* gira l'osso perche' punti (asse +Y) verso dir, mescolando con l'animazione di peso w */
function pointBone(bone, dir, w) {
  const bw = bone.getWorldQuaternion(_q1); const cur = _a.copy(Y).applyQuaternion(bw);
  const tgt = _q2.setFromUnitVectors(cur, dir).multiply(bw);
  const local = bone.parent.getWorldQuaternion(_q3).invert().multiply(tgt);
  bone.quaternion.slerp(local, w); bone.updateMatrixWorld(true);
}
/* ruota l'osso nello spazio del mondo */
function turnBone(bone, axis, ang) {
  if (!bone || Math.abs(ang) < 1e-4) return;
  const bw = bone.getWorldQuaternion(_q1); const tgt = _q4.setFromAxisAngle(axis, ang).multiply(bw);
  bone.quaternion.copy(bone.parent.getWorldQuaternion(_q3).invert().multiply(tgt)); bone.updateMatrixWorld(true);
}
/* IK a due ossa (spalla-gomito-mano) verso T, gomito spinto verso pole */
function ik2(up, low, hand, T, pole, w) {
  const S = up.getWorldPosition(_b), E0 = low.getWorldPosition(_c), H0 = hand.getWorldPosition(_d);
  const a = S.distanceTo(E0), b = E0.distanceTo(H0);
  const u = _e.copy(T).sub(S); let c = u.length(); u.normalize();
  c = Math.max(Math.abs(a - b) + 1e-3, Math.min(c, (a + b) * 0.999));
  const perp = pole.clone().addScaledVector(u, -pole.dot(u)).normalize();
  const cosA = THREE.MathUtils.clamp((a * a + c * c - b * b) / (2 * a * c), -1, 1);
  const upDir = u.clone().multiplyScalar(cosA).addScaledVector(perp, Math.sqrt(1 - cosA * cosA));
  const Tt = S.clone().addScaledVector(u, c);
  pointBone(up, upDir, w);
  pointBone(low, Tt.sub(low.getWorldPosition(new V3())).normalize(), w);
}
const TWO_HANDS = new Set(['fucile', 'pompa', 'ak47', 'bazooka', 'pompauto', 'mitragliatore', 'minigun', 'mitra', 'ar', 'cecchino']);
const NO_AIM = new Set(['katana', 'granate']);

/* un livello di animazione (gambe o busto) */
class Layer {
  constructor(acts) { this.acts = acts; this.cur = null; this.name = null; this.lock = 0; this.end = 0; }
  play(name, fade = 0.25, ts = 1, start = -1) {
    const a = this.acts[name]; if (!a) return false;
    if (this.cur === a && start < 0) { a.timeScale = ts; return true; }
    a.reset(); a.timeScale = ts; a.setEffectiveWeight(1); if (start >= 0) a.time = start;
    a.fadeIn(fade).play(); if (this.cur && this.cur !== a) this.cur.fadeOut(fade);
    this.cur = a; this.name = name; return true;
  }
  /* pezzo singolo [inizio, fine] lungo dur secondi; blocca il livello finche' non finisce */
  once(name, dur, fade = 0.12) {
    const a = this.acts[name]; if (!a) return false;
    const [t0, t1] = WIN[name] || [0, a.getClip().duration];
    const len = Math.max(0.05, Math.min(t1, a.getClip().duration) - t0);
    const ts = dur ? len / dur : 1;
    if (this.cur === a) this.cur = null;
    this.play(name, fade, ts, t0); this.lock = len / ts; return true;
  }
}

class HDChar {
  constructor(id, model, clips, bones, height) {
    this.id = id; this.model = model; this.bones = bones; this.height = height;
    const root = this.root = new THREE.Group(); root.add(model);
    this.mixer = new THREE.AnimationMixer(model);
    const lo = {}, up = {};
    for (const c of clips) {
      for (const [set, clip] of [[lo, c.lo], [up, c.up]]) { const a = this.mixer.clipAction(clip); if (ONCE.has(c.name)) { a.setLoop(THREE.LoopOnce, 1); a.clampWhenFinished = true; } set[c.name] = a; }
    }
    this.lo = new Layer(lo); this.up = new Layer(up);
    this.aimW = 0; this.kick = 0; this.hurtCd = 0; this.dead = false; this.gunId = null; this.gun = null;
    this.hipYaw = 0; this.wasAir = false; this.full = false;
    this.powerAnim = POWER_ANIM[id]; this.fastRun = FAST_RUN[id];
    /* parti finte per il vecchio codice (armR.rotation.x -= ... ecc.) */
    const dummy = () => { const o = new THREE.Object3D(); o.userData.hand = new THREE.Object3D(); return o; };
    root.userData.P = { armR: dummy(), armL: dummy(), legL: dummy(), legR: dummy(), torso: dummy(), head: dummy() };
    root.userData.height = height; root.userData.hd = this;
    this.lo.play(A.idle, 0); this.up.play(A.idle, 0);
  }
  attachGun(g, id) { if (this.gun) this.root.remove(this.gun); this.gun = g; this.gunId = id; if (g) this.root.add(g); }
  recoil(k = 0.5) { this.kick = Math.min(1, this.kick + k); }
  /* azioni del busto (le gambe continuano a correre) */
  upper(name, dur) { if (this.dead || this.full) return false; return this.up.once(name, dur); }
  hurt() { if (this.hurtCd > 0 || this.up.lock > 0 || this.dead) return; this.hurtCd = 1.6; this.upper(A.hit, 0.5); }
  throw() { this.upper(A.throw, 0.55); }
  slash() { this.upper(A.throw, 0.4); }
  reload(dur) { this.upper(A.reload, dur); }
  /* potere: animazione intera se sei fermo, solo busto se stai correndo */
  power(moving) {
    const n = this.powerAnim; if (!n || this.dead) return false;
    const dur = Math.min(1.8, this.lo.acts[n].getClip().duration);
    if (!moving) { this.full = true; this.lo.once(n, dur); }
    this.up.once(n, dur); return true;
  }
  die() { if (this.dead) return; this.dead = true; this.full = true; this.lo.play(A.die, 0.15); this.up.play(A.die, 0.15); }
  /* s: { moving, running, speed, f, side, air, reloadT, reloadDur, shooting, pitch, dir (V3 mondo), fast } */
  update(dt, s) {
    this.hurtCd -= dt; this.kick = Math.max(0, this.kick - dt * 7);
    const L = this.lo, U = this.up;
    if (L.lock > 0 && !this.dead) { L.lock -= dt; if (L.lock <= 0 || (s.moving && this.full) || (!s.air && L.name === A.jump && L.lock < 0.45)) { L.lock = 0; this.full = false; } }
    if (U.lock > 0) { U.lock -= dt; if (U.lock <= 0) U.lock = 0; }
    let yawT = 0;
    if (!this.dead && L.lock <= 0) {
      if (s.air) { if (!this.wasAir) L.once(A.jump, 0.85); }
      else if (s.moving) {
        /* il bacino si gira verso dove cammini (fino a 75 gradi), all'indietro la corsa va al contrario */
        let a = Math.atan2(s.side || 0, s.f || 0), back = false;
        if (Math.abs(a) > Math.PI * 0.58) { back = true; a -= Math.sign(a) * Math.PI; }
        yawT = -THREE.MathUtils.clamp(a, -1.3, 1.3);
        const spd = s.speed || 4.8;
        const clip = s.fast && this.fastRun && !back ? this.fastRun : A.run;
        const ts = THREE.MathUtils.clamp(spd / (clip === A.run ? RUN_SPEED : RUN_SPEED * 1.35), 0.7, 1.9) * (back ? -0.85 : 1);
        L.play(clip, 0.18, ts);
      } else L.play(A.idle, 0.3);
    }
    this.wasAir = !!s.air;
    /* il busto copia le gambe quando non sta facendo altro (stesso tempo, cosi' non va fuori passo) */
    if (!this.dead && U.lock <= 0 && L.cur) {
      if (U.name !== L.name) { U.play(L.name, 0.2, L.cur.timeScale); if (U.cur) U.cur.time = L.cur.time; }
      else U.cur.timeScale = L.cur.timeScale;
    }
    this.hipYaw += (yawT - this.hipYaw) * Math.min(1, dt * 10);
    this.mixer.update(dt);
    const busy = this.dead || U.lock > 0 || this.full || s.reloadT > 0;
    const aim = this.gun && !NO_AIM.has(this.gunId) && !busy && !(s.running && !s.shooting) ? 1 : 0;
    this.aimW += (aim - this.aimW) * Math.min(1, dt * 10);
    this.root.updateMatrixWorld(true);
    const B = this.bones;
    if (!this.dead && Math.abs(this.hipYaw) > 1e-3) {
      /* gambe verso il movimento, schiena di nuovo dritta verso la mira */
      turnBone(B.Hips, Y, this.hipYaw);
      turnBone(B.Spine, Y, -this.hipYaw * 0.55); turnBone(B.Spine1 || B.Spine, Y, -this.hipYaw * 0.45);
    }
    if (this.aimW > 0.02) this.pose(s);
    this.placeGun(s.dir);
  }
  /* busto che segue la mira e braccia che tengono l'arma puntata dove guardi */
  pose(s) {
    const B = this.bones, w = this.aimW, D = s.dir;
    const R = new V3().crossVectors(D, Y).normalize(); const U = new V3().crossVectors(R, D).normalize();
    turnBone(B.Spine1 || B.Spine, R, (s.pitch || 0) * 0.45 * w);
    const chest = (B.Spine2 || B.Spine1 || B.Spine).getWorldPosition(new V3());
    const two = TWO_HANDS.has(this.gunId), sc = HD_SCALE;
    const grip = chest.clone().addScaledVector(D, (two ? 0.3 : 0.4 - this.kick * 0.06) * sc).addScaledVector(R, (two ? 0.15 : 0.08) * sc).addScaledVector(U, (two ? 0.05 : 0.14) * sc);
    const poleR = new V3().copy(R).multiplyScalar(0.6).addScaledVector(U, -1).normalize();
    const poleL = new V3().copy(R).multiplyScalar(-0.6).addScaledVector(U, -1).normalize();
    if (B.RightArm && B.RightForeArm && B.RightHand) { ik2(B.RightArm, B.RightForeArm, B.RightHand, grip, poleR, w); pointBone(B.RightHand, D, w * 0.8); }
    if (B.LeftArm && B.LeftForeArm && B.LeftHand) {
      const sup = grip.clone().addScaledVector(D, (two ? 0.24 : 0.02) * sc).addScaledVector(R, (two ? -0.04 : -0.05) * sc).addScaledVector(U, (two ? -0.02 : -0.03) * sc);
      ik2(B.LeftArm, B.LeftForeArm, B.LeftHand, sup, poleL, w); pointBone(B.LeftHand, D, w * 0.7);
    }
  }
  placeGun(D) {
    const g = this.gun, h = this.bones.RightHand; if (!g || !h) return;
    const hp = h.getWorldPosition(new V3());
    const fingers = new V3(0, 1, 0).applyQuaternion(h.getWorldQuaternion(new Q()));
    const p = hp.clone().addScaledVector(fingers, 0.05 * HD_SCALE);
    const dir = fingers.clone().lerp(D, this.aimW).normalize();
    g.position.copy(this.root.worldToLocal(p.clone()));
    this.root.updateMatrixWorld(true); g.lookAt(p.add(dir));
    g.rotateX(-this.kick * 0.25);
  }
}
