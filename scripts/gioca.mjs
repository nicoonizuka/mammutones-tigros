/* Avvia il gioco in locale e lo apre a schermo intero.
   Uso: npm run gioca   (oppure doppio clic su Gioca.bat in Windows) */
import { createServer } from 'vite';
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

const server = await createServer({ server: { port: 5173, strictPort: false } });
await server.listen();
const url = server.resolvedUrls.local[0];
console.log(`\n  Mammutones al Tigros gira su ${url}\n  Chiudi questa finestra (o premi Ctrl+C) per spegnere il gioco.\n`);

/* cerca Chrome o Edge e lo apre in modalita' app a schermo intero */
const env = process.env;
const candidates = process.platform === 'win32'
  ? [
      join(env['PROGRAMFILES'] || 'C:\\Program Files', 'Google\\Chrome\\Application\\chrome.exe'),
      join(env['PROGRAMFILES(X86)'] || 'C:\\Program Files (x86)', 'Google\\Chrome\\Application\\chrome.exe'),
      join(env['LOCALAPPDATA'] || '', 'Google\\Chrome\\Application\\chrome.exe'),
      join(env['PROGRAMFILES(X86)'] || 'C:\\Program Files (x86)', 'Microsoft\\Edge\\Application\\msedge.exe'),
      join(env['PROGRAMFILES'] || 'C:\\Program Files', 'Microsoft\\Edge\\Application\\msedge.exe'),
    ]
  : process.platform === 'darwin'
    ? ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge']
    : ['/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser', '/usr/bin/microsoft-edge'];

const browser = candidates.find(p => p && existsSync(p));
if (browser) {
  spawn(browser, [`--app=${url}`, '--start-fullscreen', '--autoplay-policy=no-user-gesture-required', `--user-data-dir=${join(process.cwd(), '.browser-profile')}`], { detached: true, stdio: 'ignore' }).unref();
} else {
  console.log('  Non ho trovato Chrome o Edge: apri il link qui sopra nel browser e premi F11 per lo schermo intero.');
  const opener = process.platform === 'win32' ? ['cmd', ['/c', 'start', '', url]] : process.platform === 'darwin' ? ['open', [url]] : ['xdg-open', [url]];
  spawn(opener[0], opener[1], { detached: true, stdio: 'ignore' }).unref();
}
