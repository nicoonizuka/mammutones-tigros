/* Attrezzi comuni per costruire le zone: materiali, forme e texture disegnate su canvas */
import * as THREE from 'three';
import { M, rbox, mesh, sph } from '../characters/styled.js';
export { M, rbox, mesh, sph };

let seed = 1;
export const rnd = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
export const setSeed = v => { seed = v; };

/* texture da canvas, filtrata (non pixelosa) e in sRGB */
export function ctex(w, h, draw, rx = 1, ry = rx) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; t.anisotropy = 4;
  if (rx !== 1 || ry !== 1) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry); }
  return t;
}
export function texMat(t, o = {}) { return new THREE.MeshStandardMaterial(Object.assign({ map: t, roughness: 0.85 }, o)); }

/* scritte (insegne, cartelli) */
export function label(text, { font = '900 96px Arial Black,Arial,sans-serif', color = '#f6f3ee', shadow = 'rgba(0,0,0,.35)', w = 512, h = 128, bg = null } = {}) {
  return ctex(w, h, (g) => {
    if (bg) { g.fillStyle = bg; g.fillRect(0, 0, w, h); }
    g.font = font; g.textAlign = 'center'; g.textBaseline = 'middle';
    if (shadow) { g.fillStyle = shadow; g.fillText(text, w / 2 + 5, h / 2 + 5); }
    g.fillStyle = color; g.fillText(text, w / 2, h / 2);
  });
}
export function plane(w, h, mat, parent, pos, rot) { return mesh(new THREE.PlaneGeometry(w, h), mat, parent, pos, rot); }

/* texture ricorrenti */
export const TEX = {
  asphalt: () => ctex(512, 512, (g, w, h) => {
    g.fillStyle = '#4a4d55'; g.fillRect(0, 0, w, h); setSeed(3);
    for (let i = 0; i < 26000; i++) { const c = rnd(); g.fillStyle = c < 0.4 ? '#3f424a' : c < 0.75 ? '#565961' : '#5f5a55'; g.fillRect(rnd() * w, rnd() * h, 1 + rnd() * 2, 1 + rnd() * 2); }
    g.strokeStyle = '#2a2c30'; g.lineWidth = 1.5;
    for (let k = 0; k < 7; k++) { g.beginPath(); let x = rnd() * w, y = rnd() * h; g.moveTo(x, y); for (let i = 0; i < 14; i++) { x += (rnd() - 0.5) * 22; y += 6 + rnd() * 8; g.lineTo(x, y); } g.stroke(); }
  }),
  brick: () => ctex(256, 128, (g, w, h) => {
    g.fillStyle = '#8f4430'; g.fillRect(0, 0, w, h); setSeed(5);
    for (let y = 0; y < h; y += 16) for (let x = ((y / 16) % 2) * 16 - 16; x < w; x += 32) { g.fillStyle = ['#b5583a', '#a9503a', '#c0643f', '#a24a30'][Math.floor(rnd() * 4)]; g.fillRect(x + 1, y + 1, 30, 14); }
  }),
  tiles: () => ctex(256, 256, (g, w, h) => {
    g.fillStyle = '#d8d4cc'; g.fillRect(0, 0, w, h); setSeed(7);
    for (let y = 0; y < h; y += 64) for (let x = 0; x < w; x += 64) { const v = 214 + Math.floor(rnd() * 14); g.fillStyle = `rgb(${v},${v - 3},${v - 9})`; g.fillRect(x + 2, y + 2, 60, 60); }
    g.fillStyle = 'rgba(80,70,60,.25)'; for (let i = 0; i < 40; i++) g.fillRect(rnd() * w, rnd() * h, 3 + rnd() * 10, 2 + rnd() * 6);
  }),
  sidewalk: () => ctex(256, 256, (g, w, h) => {
    g.fillStyle = '#b9b2a6'; g.fillRect(0, 0, w, h); g.fillStyle = '#a69f93';
    for (let y = 0; y < h; y += 64) g.fillRect(0, y, w, 2); for (let x = 0; x < w; x += 64) g.fillRect(x, 0, 2, h);
  }),
};
