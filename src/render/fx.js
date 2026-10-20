/* Effetti: lampo dello sparo, cenere/polvere che volteggia, scossone della telecamera */
import * as THREE from 'three';

let flashLight, flashMesh, flashT = 0, shakeA = 0, ash, ashPos;
const N = 700, SPAN = 46, HGT = 12;

export function initFx(scene) {
  flashLight = new THREE.PointLight('#ffc870', 0, 7, 2); flashLight.userData.fx = 1; scene.add(flashLight);
  flashMesh = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 6), new THREE.MeshBasicMaterial({ color: '#ffe0a0', transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false }));
  flashMesh.visible = false; scene.add(flashMesh);
  const g = new THREE.BufferGeometry(); ashPos = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) { ashPos[i * 3] = (Math.random() - 0.5) * SPAN; ashPos[i * 3 + 1] = Math.random() * HGT; ashPos[i * 3 + 2] = (Math.random() - 0.5) * SPAN; }
  g.setAttribute('position', new THREE.BufferAttribute(ashPos, 3));
  ash = new THREE.Points(g, new THREE.PointsMaterial({ color: '#ffb48a', size: 0.07, transparent: true, opacity: 0.7, depthWrite: false }));
  ash.frustumCulled = false; scene.add(ash);
}
export function muzzleFlash(p) { flashLight.position.copy(p); flashLight.intensity = 3; flashMesh.position.copy(p); flashMesh.visible = true; flashMesh.scale.setScalar(1 + Math.random()); flashT = 0.05; }
export function shake(a) { shakeA = Math.min(0.35, shakeA + a); }
export function updateFx(dt, camera, center, down) {
  if (flashT > 0) { flashT -= dt; if (flashT <= 0) { flashLight.intensity = 0; flashMesh.visible = false; } }
  if (shakeA > 0) { camera.position.x += (Math.random() - 0.5) * shakeA * 0.4; camera.position.y += (Math.random() - 0.5) * shakeA * 0.4; shakeA = Math.max(0, shakeA - dt * 1.6); }
  /* cenere all'aperto, polvere grigia nel seminterrato: le particelle seguono il giocatore */
  ash.material.color.set(down ? '#a8a8b0' : '#ffb48a'); const top = down ? 3.3 : HGT;
  for (let i = 0; i < N; i++) {
    let x = ashPos[i * 3], y = ashPos[i * 3 + 1], z = ashPos[i * 3 + 2];
    y -= dt * (0.25 + (i % 7) * 0.05); x += dt * Math.sin(i + y) * 0.3;
    if (y < 0) y += top; if (y > top) y = Math.random() * top;
    const dx = x - center.x, dz = z - center.z;
    if (dx > SPAN / 2) x -= SPAN; else if (dx < -SPAN / 2) x += SPAN; if (dz > SPAN / 2) z -= SPAN; else if (dz < -SPAN / 2) z += SPAN;
    ashPos[i * 3] = x; ashPos[i * 3 + 1] = y; ashPos[i * 3 + 2] = z;
  }
  ash.geometry.attributes.position.needsUpdate = true;
}
