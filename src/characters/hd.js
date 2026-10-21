/* Personaggi HD: modelli realistici (Meshy, scheletro Mixamo) con le animazioni di Pika condivise.
   Ogni personaggio sta in public/models/<id>.glb, le 14 animazioni comuni in public/models/anim.glb.
   Il gruppo restituito si usa come i vecchi modelli: userData.height, userData.P (parti finte, cosi'
   il codice che muoveva braccia e gambe dei modelli a blocchi non si rompe) e userData.hd (il controller). */
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { clone as skClone } from 'three/examples/jsm/utils/SkeletonUtils.js';

const V3 = THREE.Vector3;
const BASE = (import.meta.env.BASE_URL || '/') + 'models/';
const loader = new GLTFLoader();
const files = {};
const get = id => files[id] || (files[id] = loader.loadAsync(BASE + id + '.glb').catch(e => { delete files[id]; throw e; }));

/* nomi delle animazioni (quelle di Pika, uguali per tutti) */
export const ANIM = {
  idle: 'Idle_02', walk: 'Walking', run: 'Running', back: 'Walk_Backward_with_Gun_inplace', side: 'Walk_Left_with_Gun',
  runShoot: 'Run_and_Shoot', reload: 'Standing_Reload', runReload: 'Running_Reload', hit: 'Slap_Reaction',
  die: 'Shot_and_Fall_Forward', jump: 'Regular_Jump', throw: 'baseball_pitching',
};
/* animazioni extra fatte apposta per alcuni personaggi */
const POWER_ANIM = { ali: 'Skill_01', debe: 'Shake_It_Off_Dance', diego: 'Shouting_Angrily' };
const FAST_RUN = { nico: 'RunFast' };
const ONCE = new Set(['Regular_Jump', 'Shot_and_Fall_Forward', 'Slap_Reaction', 'Standing_Reload', 'Running_Reload', 'baseball_pitching', 'Skill_01', 'Shouting_Angrily', 'Shake_It_Off_Dance', 'Run_and_Jump']);

/* interruttore: ?hd=0 nell'indirizzo o l'opzione nel menu tornano ai modelli classici */
export let hdOn = true;
try { hdOn = localStorage.getItem('mt_hd') !== '0'; } catch (_) {}
if (/[?&]hd=0/.test(location.search)) hdOn = false;
export function setHD(on) { hdOn = on; try { localStorage.setItem('mt_hd', on ? '1' : '0'); } catch (_) {} }

export function preloadHD(id) { if (!id) return; get('anim').catch(() => {}); get(id).catch(() => {}); }

/* prepara le clip per questo scheletro: niente spostamento del bacino (le animazioni restano sul posto),
   altezza del bacino riscalata sul personaggio, tracce di ossa che il modello non ha tolte */
function fitClips(clips, nodes, hipsRest, hipsSrcY) {
  const out = [];
  for (const c0 of clips) {
    const c = c0.clone(); const ratio = hipsSrcY ? hipsRest.y / hipsSrcY : 1;
    c.tracks = c.tracks.filter(t => nodes.has(t.name.slice(0, t.name.lastIndexOf('.'))));
    for (const t of c.tracks) if (/Hips\.position$/.test(t.name)) {
      const v = t.values; for (let i = 0; i < v.length; i += 3) { v[i] = hipsRest.x; v[i + 1] *= ratio; v[i + 2] = hipsRest.z; }
    }
    out.push(c);
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
  const box = new THREE.Box3().setFromObject(model);
  return new HDChar(id, model, clips, bones, box.max.y - box.min.y);
}

/* ---------- piccoli aiuti per l'IK delle braccia ---------- */
const Y = new V3(0, 1, 0);
const _q1 = new THREE.Quaternion(), _q2 = new THREE.Quaternion(), _q3 = new THREE.Quaternion();
const _a = new V3(), _b = new V3(), _c = new V3(), _d = new V3(), _e = new V3();
/* gira l'osso perche' punti (asse +Y) verso dir, mescolando con l'animazione di peso w */
function pointBone(bone, dir, w) {
  const bw = bone.getWorldQuaternion(_q1); const cur = _a.copy(Y).applyQuaternion(bw);
  const tgt = _q2.setFromUnitVectors(cur, dir).multiply(bw);
  const local = bone.parent.getWorldQuaternion(_q3).invert().multiply(tgt);
  bone.quaternion.slerp(local, w); bone.updateMatrixWorld(true);
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
  const lowDir = Tt.sub(low.getWorldPosition(new V3())).normalize();
  pointBone(low, lowDir, w);
}
const TWO_HANDS = new Set(['fucile', 'pompa', 'ak47', 'bazooka', 'pompauto', 'mitragliatore', 'minigun', 'mitra', 'ar', 'cecchino']);

class HDChar {
  constructor(id, model, clips, bones, height) {
    this.id = id; this.model = model; this.bones = bones; this.height = height;
    const root = this.root = new THREE.Group(); root.add(model);
    this.mixer = new THREE.AnimationMixer(model); this.act = {};
    for (const c of clips) { const a = this.mixer.clipAction(c); if (ONCE.has(c.name)) { a.setLoop(THREE.LoopOnce, 1); a.clampWhenFinished = true; } this.act[c.name] = a; }
    this.cur = null; this.lockT = 0; this.aimW = 0; this.kick = 0; this.hurtCd = 0; this.dead = false; this.gunId = null; this.gun = null;
    this.powerAnim = POWER_ANIM[id]; this.fastRun = FAST_RUN[id];
    /* parti finte per il vecchio codice (armR.rotation.x -= ... ecc.) */
    const dummy = () => { const o = new THREE.Object3D(); o.userData.hand = new THREE.Object3D(); return o; };
    root.userData.P = { armR: dummy(), armL: dummy(), legL: dummy(), legR: dummy(), torso: dummy(), head: dummy() };
    root.userData.height = height; root.userData.hd = this;
    this.play(ANIM.idle, 0);
  }
  play(name, fade = 0.25, ts = 1) {
    const a = this.act[name]; if (!a) return false;
    if (this.cur === a) { a.timeScale = ts; return true; }
    a.reset(); a.timeScale = ts; a.setEffectiveWeight(1); a.fadeIn(fade).play();
    if (this.cur) this.cur.fadeOut(fade);
    this.cur = a; return true;
  }
  /* animazione singola che blocca le altre per la sua durata (o per dur secondi) */
  once(name, dur, fade = 0.15) {
    const a = this.act[name]; if (!a || this.dead) return false;
    const ts = dur ? a.getClip().duration / dur : 1;
    if (this.cur === a) this.cur = null;
    this.play(name, fade, ts); this.lockT = (dur || a.getClip().duration) - fade; this.lockName = name; return true;
  }
  attachGun(g, id) { if (this.gun) this.root.remove(this.gun); this.gun = g; this.gunId = id; if (g) this.root.add(g); }
  recoil(k = 0.5) { this.kick = Math.min(1, this.kick + k); }
  hurt() { if (this.hurtCd > 0 || this.lockT > 0 || this.dead) return; this.hurtCd = 1.6; this.once(ANIM.hit, 0.45, 0.08); }
  power() { return this.powerAnim ? this.once(this.powerAnim, 1.4) : false; }
  throw() { this.once(ANIM.throw, 0.6, 0.08); }
  die() { if (this.dead) return; this.dead = true; this.lockT = 0; this.play(ANIM.die, 0.15); }
  revive() { this.dead = false; this.lockT = 0; this.play(ANIM.idle, 0.2); }
  /* s: { moving, running, f, side, air, reloadT, reloadDur, shooting, pitch, dir (V3 mondo), fast } */
  update(dt, s) {
    this.hurtCd -= dt; this.kick = Math.max(0, this.kick - dt * 7);
    if (!this.dead) {
      if (this.lockT > 0) { this.lockT -= dt; if (s.moving && /Slap/.test(this.lockName || '')) this.lockT = 0; }
      if (this.lockT <= 0) {
        if (s.reloadT > 0) this.once(s.moving ? ANIM.runReload : ANIM.reload, Math.max(0.4, s.reloadT));
        else if (s.air) this.play(ANIM.jump, 0.12);
        else if (s.moving) {
          if (s.running && s.f > 0.3) this.play(s.fast && this.fastRun ? this.fastRun : s.shooting ? ANIM.runShoot : ANIM.run, 0.2);
          else if (s.f < -0.3) this.play(ANIM.back, 0.25);
          else if (Math.abs(s.side) > Math.abs(s.f)) this.play(ANIM.side, 0.25, s.side < 0 ? 1 : -1);
          else this.play(ANIM.walk, 0.25);
        } else this.play(ANIM.idle, 0.3);
      }
    }
    this.mixer.update(dt);
    const busy = this.dead || (this.lockT > 0 && this.lockName !== ANIM.hit) || s.reloadT > 0;
    const aim = this.gun && this.gunId !== 'katana' && this.gunId !== 'granate' && !busy && !(s.running && !s.shooting) ? 1 : 0;
    this.aimW += (aim - this.aimW) * Math.min(1, dt * 10);
    this.root.updateMatrixWorld(true);
    if (this.aimW > 0.02) this.pose(s);
    this.placeGun(s.dir);
  }
  /* busto che segue la mira e braccia che tengono l'arma puntata dove guardi */
  pose(s) {
    const B = this.bones, w = this.aimW, D = s.dir;
    const R = new V3().crossVectors(D, Y).normalize(); const U = new V3().crossVectors(R, D).normalize();
    const sp = B.Spine1 || B.Spine; if (sp) {
      const q = new THREE.Quaternion().setFromAxisAngle(R, (s.pitch || 0) * 0.45 * w);
      const bw = sp.getWorldQuaternion(new THREE.Quaternion()); const tgt = q.multiply(bw);
      sp.quaternion.copy(sp.parent.getWorldQuaternion(new THREE.Quaternion()).invert().multiply(tgt)); sp.updateMatrixWorld(true);
    }
    const chest = (B.Spine2 || B.Spine1 || B.Spine).getWorldPosition(new V3());
    const two = TWO_HANDS.has(this.gunId);
    const grip = chest.clone().addScaledVector(D, two ? 0.32 : 0.42 - this.kick * 0.06).addScaledVector(R, two ? 0.16 : 0.1).addScaledVector(U, two ? 0.06 : 0.16);
    const poleR = new V3().copy(R).multiplyScalar(0.6).addScaledVector(U, -1).normalize();
    const poleL = new V3().copy(R).multiplyScalar(-0.6).addScaledVector(U, -1).normalize();
    if (B.RightArm && B.RightForeArm && B.RightHand) { ik2(B.RightArm, B.RightForeArm, B.RightHand, grip, poleR, w); pointBone(B.RightHand, D, w * 0.8); }
    if (B.LeftArm && B.LeftForeArm && B.LeftHand) {
      const sup = grip.clone().addScaledVector(D, two ? 0.24 : 0.02).addScaledVector(R, two ? -0.04 : -0.05).addScaledVector(U, two ? -0.02 : -0.03);
      ik2(B.LeftArm, B.LeftForeArm, B.LeftHand, sup, poleL, w); pointBone(B.LeftHand, D, w * 0.7);
    }
  }
  placeGun(D) {
    const g = this.gun, h = this.bones.RightHand; if (!g || !h) return;
    const hp = h.getWorldPosition(new V3());
    const fingers = new V3(0, 1, 0).applyQuaternion(h.getWorldQuaternion(new THREE.Quaternion()));
    const p = hp.clone().addScaledVector(fingers, 0.05);
    const dir = fingers.clone().lerp(D, this.aimW).normalize();
    g.position.copy(this.root.worldToLocal(p.clone()));
    this.root.updateMatrixWorld(true); g.lookAt(p.add(dir));
    g.rotateX(-this.kick * 0.25);
  }
}
