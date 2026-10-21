/* il gioco come app: installazione, blocco dello zoom (anche su iPhone, che ignora user-scalable) */
const $ = id => document.getElementById(id);
const stop = e => e.preventDefault();
for (const ev of ['gesturestart', 'gesturechange', 'gestureend']) document.addEventListener(ev, stop, { passive: false });
document.addEventListener('touchmove', e => { if (e.touches.length > 1 || (e.scale && e.scale !== 1)) e.preventDefault(); }, { passive: false });
document.addEventListener('dblclick', stop, { passive: false });
/* se per qualche motivo la pagina si e' zoomata o spostata, al cambio di orientamento la rimettiamo a posto */
const fix = () => { window.scrollTo(0, 0); };
window.addEventListener('orientationchange', () => setTimeout(fix, 300)); window.addEventListener('resize', fix);

const standalone = matchMedia('(display-mode: fullscreen), (display-mode: standalone)').matches || navigator.standalone;
if ('serviceWorker' in navigator && import.meta.env.PROD) navigator.serviceWorker.register(import.meta.env.BASE_URL + 'sw.js', { scope: import.meta.env.BASE_URL }).catch(() => {});
let prompt = null;
window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); prompt = e; if (!standalone) $('installBtn').hidden = false; });
window.addEventListener('appinstalled', () => { $('installBtn').hidden = true; $('installHint').hidden = true; });
window.addEventListener('DOMContentLoaded', () => {
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  if (ios && !standalone) { $('installHint').hidden = false; $('installHint').textContent = "Per averlo come app: tocca Condividi in Safari e poi “Aggiungi alla schermata Home”."; }
  $('installBtn').onclick = async () => { if (!prompt) return; prompt.prompt(); await prompt.userChoice.catch(() => {}); prompt = null; $('installBtn').hidden = true; };
});
