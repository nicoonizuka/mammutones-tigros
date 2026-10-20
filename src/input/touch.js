/* Comandi touch per giocare da telefono o tablet.
   A sinistra: joystick che compare dove appoggi il pollice. A destra: trascina per mirare.
   Pulsanti trasparenti: spara (tenendolo premuto puoi anche mirare), salto, ricarica, potere, usa, cambio arma,
   inventario, visuale, pausa. */
export const isTouch = (() => {
  try { return matchMedia('(pointer: coarse)').matches || (('ontouchstart' in window) && !matchMedia('(pointer: fine)').matches); } catch (_) { return false; }
})();
export const touch = { mx: 0, my: 0, lx: 0, ly: 0, fire: false, sprint: false };

const R = 62; // raggio del joystick in pixel
export function initTouch(act) {
  if (!isTouch) return null;
  const root = document.createElement('div'); root.id = 'touch'; root.hidden = true;
  root.innerHTML = `
    <div class="tz tz-move" id="tzMove"><div class="joy" id="joy"><i id="knob"></i></div></div>
    <div class="tz tz-look" id="tzLook"></div>
    <button class="tb tb-fire" data-a="fire" aria-label="Spara">SPARA</button>
    <button class="tb tb-jump" data-a="jump" aria-label="Salta">⤒</button>
    <button class="tb tb-reload" data-a="reload" aria-label="Ricarica">R</button>
    <button class="tb tb-power" data-a="power" aria-label="Potere">Q</button>
    <button class="tb tb-use" data-a="use" aria-label="Compra o apri">E</button>
    <button class="tb tb-swap" data-a="swap" aria-label="Cambia arma">⇄</button>
    <button class="tb tb-inv tb-s" data-a="inv" aria-label="Inventario">🎒</button>
    <button class="tb tb-view tb-s" data-a="view" aria-label="Prima o terza persona">👁</button>
    <button class="tb tb-pause tb-s" data-a="pause" aria-label="Pausa">II</button>
    <div class="rotate">Gira il telefono in orizzontale per giocare</div>`;
  document.body.appendChild(root);
  const joy = root.querySelector('#joy'), knob = root.querySelector('#knob');
  let moveId = null, ox = 0, oy = 0; const look = new Map();

  const mz = root.querySelector('#tzMove');
  mz.addEventListener('pointerdown', e => { e.preventDefault(); if (moveId !== null) return; moveId = e.pointerId; ox = e.clientX; oy = e.clientY; mz.setPointerCapture(e.pointerId);
    joy.style.left = ox + 'px'; joy.style.top = oy + 'px'; joy.classList.add('on'); knob.style.transform = 'translate(-50%,-50%)'; });
  mz.addEventListener('pointermove', e => { if (e.pointerId !== moveId) return; let dx = e.clientX - ox, dy = e.clientY - oy; const l = Math.hypot(dx, dy);
    if (l > R) { dx *= R / l; dy *= R / l; } touch.mx = dx / R; touch.my = dy / R; touch.sprint = l > R * 1.25; knob.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`; });
  const endMove = e => { if (e.pointerId !== moveId) return; moveId = null; touch.mx = touch.my = 0; touch.sprint = false; joy.classList.remove('on'); };
  mz.addEventListener('pointerup', endMove); mz.addEventListener('pointercancel', endMove);

  /* mira: zona a destra, e anche il pulsante spara mentre lo tieni premuto */
  const startLook = (e, el) => { look.set(e.pointerId, { x: e.clientX, y: e.clientY }); try { el.setPointerCapture(e.pointerId); } catch (_) {} };
  const moveLook = e => { const p = look.get(e.pointerId); if (!p) return; touch.lx += e.clientX - p.x; touch.ly += e.clientY - p.y; p.x = e.clientX; p.y = e.clientY; };
  const endLook = e => { look.delete(e.pointerId); };
  const lz = root.querySelector('#tzLook');
  lz.addEventListener('pointerdown', e => { e.preventDefault(); startLook(e, lz); });
  lz.addEventListener('pointermove', moveLook); lz.addEventListener('pointerup', endLook); lz.addEventListener('pointercancel', endLook);

  root.querySelectorAll('.tb').forEach(b => {
    const a = b.dataset.a;
    b.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); b.classList.add('down');
      if (a === 'fire') { touch.fire = true; startLook(e, b); act.fire && act.fire(); } else act[a] && act[a](); });
    if (a === 'fire') b.addEventListener('pointermove', moveLook);
    const up = e => { b.classList.remove('down'); if (a === 'fire') { touch.fire = false; endLook(e); } };
    b.addEventListener('pointerup', up); b.addEventListener('pointercancel', up); b.addEventListener('contextmenu', e => e.preventDefault());
  });
  return root;
}
/* la mira accumulata dall'ultimo fotogramma */
export function takeLook() { const r = [touch.lx, touch.ly]; touch.lx = touch.ly = 0; return r; }
