/* Cielo nuovo: sfumatura vera dall'orizzonte allo zenit, alone del sole e nuvole che si muovono piano.
   Una sola cupola che segue la camera; i colori cambiano per ogni mondo. */
import * as THREE from 'three';

function cloudTex() {
  const S = 512, c = document.createElement('canvas'); c.width = S; c.height = S; const g = c.getContext('2d');
  let seed = 7; const rnd = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
  g.fillStyle = '#000'; g.fillRect(0, 0, S, S);
  for (let i = 0; i < 70; i++) {
    const x = rnd() * S, y = rnd() * S, r = 30 + rnd() * 90;
    for (const dx of [-S, 0, S]) for (const dy of [-S, 0, S]) {
      for (let k = 0; k < 6; k++) { const gr = g.createRadialGradient(x + dx + (rnd() - 0.5) * r, y + dy + (rnd() - 0.5) * r * 0.5, 0, x + dx, y + dy, r * (0.5 + rnd() * 0.6));
        gr.addColorStop(0, 'rgba(255,255,255,0.22)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, S, S); }
    }
  }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
}

const LOOKS = {
  1: { top: '#3a5a8a', mid: '#e89a6a', bot: '#c27a52', sun: '#ffd8a0', sunDir: [-0.55, 0.32, 0.45], cloud: '#ffe2c8', amt: 0.85 },   // tramonto arancione sul Tigros
  2: { top: '#4a78b8', mid: '#c8d4dc', bot: '#b8b6ac', sun: '#fff4dc', sunDir: [-0.4, 0.6, 0.5], cloud: '#ffffff', amt: 0.95 },      // giorno velato all'Happy Shopping
  4: { top: '#3c66a6', mid: '#d6d4cc', bot: '#a8a49a', sun: '#fff2d6', sunDir: [-0.5, 0.55, 0.6], cloud: '#ffffff', amt: 1.05 },     // pomeriggio con le nuvole sul centro di Busto
  3: { top: '#2e3e4a', mid: '#8a9a8c', bot: '#8a9484', sun: '#e8f0d8', sunDir: [-0.3, 0.5, 0.6], cloud: '#c8d0c4', amt: 1.25 },     // cielo coperto e verdognolo al Tribunale
};

export function makeSky(scene) {
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false, toneMapped: false,
    uniforms: { top: { value: new THREE.Color() }, mid: { value: new THREE.Color() }, bot: { value: new THREE.Color() }, sunC: { value: new THREE.Color() },
      sunDir: { value: new THREE.Vector3(0, 1, 0) }, cloudC: { value: new THREE.Color() }, clouds: { value: cloudTex() }, t: { value: 0 }, amt: { value: 1 } },
    vertexShader: 'varying vec3 vDir; void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: `uniform vec3 top, mid, bot, sunC, cloudC; uniform vec3 sunDir; uniform sampler2D clouds; uniform float t, amt; varying vec3 vDir;
      void main(){
        float h = vDir.y;
        vec3 col = h > 0.0 ? mix(mid, top, pow(clamp(h * 1.6, 0.0, 1.0), 0.7)) : mix(mid, bot, clamp(-h * 4.0, 0.0, 1.0));
        float s = max(dot(normalize(vDir), normalize(sunDir)), 0.0);
        col += sunC * (pow(s, 380.0) * 2.2 + pow(s, 12.0) * 0.35 + pow(s, 3.0) * 0.08);
        if (h > 0.02) { vec2 uv = vDir.xz / (h + 0.18) * 0.22; float c = texture2D(clouds, uv + vec2(t * 0.004, t * 0.0016)).r * 0.75 + texture2D(clouds, uv * 2.1 - vec2(t * 0.006, 0.0)).r * 0.45;
          c = smoothstep(0.18, 0.75, c * amt) * smoothstep(0.02, 0.22, h); col = mix(col, cloudC * (0.85 + 0.25 * pow(s, 4.0)), c * 0.85); }
        gl_FragColor = vec4(col, 1.0);
        #include <tonemapping_fragment>
        #include <encodings_fragment>
      }`,
  });
  const sky = new THREE.Mesh(new THREE.SphereGeometry(170, 32, 16), mat); sky.renderOrder = -10; sky.frustumCulled = false; sky.userData.keep = 1; scene.add(sky);
  /* le vecchie cupole del cielo dei mondi 2 e 3 non servono piu' */
  scene.traverse(o => { if (o !== sky && o.isMesh && o.geometry && o.geometry.type === 'SphereGeometry' && o.material && o.material.side === THREE.BackSide && o.geometry.parameters.radius >= 100) o.visible = false; });
  return sky;
}
export function setSky(sky, w) {
  const L = LOOKS[w] || LOOKS[1], u = sky.material.uniforms;
  u.top.value.set(L.top); u.mid.value.set(L.mid); u.bot.value.set(L.bot); u.sunC.value.set(L.sun); u.cloudC.value.set(L.cloud); u.amt.value = L.amt; u.sunDir.value.set(...L.sunDir).normalize();
}
export function updateSky(sky, camera, dt) { sky.position.copy(camera.position); sky.material.uniforms.t.value += dt; }
