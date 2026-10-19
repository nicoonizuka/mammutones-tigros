/* Controller (PlayStation, Xbox o altri con mappatura standard) tramite la Gamepad API del browser.
   Tasti PlayStation: X=0, Cerchio=1, Quadrato=2, Triangolo=3, L1=4, R1=5, L2=6, R2=7, Options=9, L3=10, R3=11, frecce 12-15 */
const DEAD = 0.15;
let prev = [];
export const pad = { connected: false, lx: 0, ly: 0, rx: 0, ry: 0, fire: false, held: {}, pressed: {} };
const dz = v => (Math.abs(v) < DEAD ? 0 : (v - Math.sign(v) * DEAD) / (1 - DEAD));

export function pollPad() {
  const list = navigator.getGamepads ? navigator.getGamepads() : [];
  const gp = [...list].find(g => g && g.connected);
  pad.connected = !!gp; pad.pressed = {}; pad.held = {};
  if (!gp) { prev = []; return pad; }
  pad.lx = dz(gp.axes[0] || 0); pad.ly = dz(gp.axes[1] || 0); pad.rx = dz(gp.axes[2] || 0); pad.ry = dz(gp.axes[3] || 0);
  gp.buttons.forEach((b, i) => { const on = b.pressed || b.value > 0.4; pad.held[i] = on; if (on && !prev[i]) pad.pressed[i] = true; prev[i] = on; });
  pad.fire = !!pad.held[7];
  return pad;
}
export const BTN = { X: 0, CIRCLE: 1, SQUARE: 2, TRIANGLE: 3, L1: 4, R1: 5, L2: 6, R2: 7, OPTIONS: 9, L3: 10, UP: 12, DOWN: 13, LEFT: 14, RIGHT: 15 };
