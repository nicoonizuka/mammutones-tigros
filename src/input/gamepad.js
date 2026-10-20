/* Controller (PlayStation, Xbox o altri con mappatura standard) tramite la Gamepad API del browser.
   Tasti PlayStation: X=0, Cerchio=1, Quadrato=2, Triangolo=3, L1=4, R1=5, L2=6, R2=7, Options=9, L3=10, R3=11, frecce 12-15 */
const DEAD = 0.18;
let prev = [], padId = '', centered = [false, false, false, false];
export const pad = { connected: false, lx: 0, ly: 0, rx: 0, ry: 0, fire: false, held: {}, pressed: {} };
const dz = v => (Math.abs(v) < DEAD ? 0 : (v - Math.sign(v) * DEAD) / (1 - DEAD));

/* alcuni dispositivi (volanti, joystick, tastiere o cuffie viste come controller, oppure il controller
   della Play senza mappatura standard) hanno un asse che a riposo sta a -1 o +1: la visuale
   andava da sola verso l'alto. Un asse conta solo dopo che e' passato almeno una volta dal centro. */
function axis(gp, i) {
  const v = gp.axes[i] || 0;
  if (!centered[i]) { if (Math.abs(v) < 0.25) centered[i] = true; else return 0; }
  return dz(v);
}
export function pollPad() {
  const list = [...(navigator.getGamepads ? navigator.getGamepads() : [])].filter(g => g && g.connected);
  /* prima i controller con la mappatura standard (PlayStation, Xbox) */
  const gp = list.find(g => g.mapping === 'standard') || list.find(g => g.axes.length >= 4 && g.buttons.length >= 12);
  pad.connected = !!gp; pad.pressed = {}; pad.held = {};
  if (!gp) { prev = []; return pad; }
  if (gp.id !== padId) { padId = gp.id; centered = [false, false, false, false]; prev = []; }
  pad.lx = axis(gp, 0); pad.ly = axis(gp, 1); pad.rx = axis(gp, 2); pad.ry = axis(gp, 3);
  gp.buttons.forEach((b, i) => { const on = b.pressed || b.value > 0.4; pad.held[i] = on; if (on && !prev[i]) pad.pressed[i] = true; prev[i] = on; });
  pad.fire = !!pad.held[7];
  return pad;
}
export const BTN = { X: 0, CIRCLE: 1, SQUARE: 2, TRIANGLE: 3, L1: 4, R1: 5, L2: 6, R2: 7, OPTIONS: 9, L3: 10, UP: 12, DOWN: 13, LEFT: 14, RIGHT: 15 };
