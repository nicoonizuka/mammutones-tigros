/* Suoni sintetizzati con WebAudio (niente file audio) */
let AC=null;export function audio(){if(!AC){try{AC=new (window.AudioContext||window.webkitAudioContext)();}catch(e){}}}
export function tone(f,d,type,vol,slide){if(!AC)return;const o=AC.createOscillator(),g=AC.createGain();o.type=type||"square";o.frequency.value=f;if(slide)o.frequency.exponentialRampToValueAtTime(slide,AC.currentTime+d);
  g.gain.value=vol||.06;g.gain.exponentialRampToValueAtTime(.0001,AC.currentTime+d);o.connect(g);g.connect(AC.destination);o.start();o.stop(AC.currentTime+d);}
function noiseBurst(d,vol,lp){if(!AC)return;const b=AC.createBuffer(1,AC.sampleRate*d,AC.sampleRate);const a=b.getChannelData(0);for(let i=0;i<a.length;i++)a[i]=(Math.random()*2-1)*(1-i/a.length);
  const s=AC.createBufferSource();s.buffer=b;const f=AC.createBiquadFilter();f.type="lowpass";f.frequency.value=lp||2400;const g=AC.createGain();g.gain.value=vol;s.connect(f);f.connect(g);g.connect(AC.destination);s.start();}
export const shotSound=(k,v)=>noiseBurst(k===1?.28:k===2?.4:.12,(v||1)*(k===1?.32:.22),k===2?1200:2600);
export const click=()=>tone(900,.05,"square",.04);export const reloadSound=()=>{tone(300,.06,"square",.04);setTimeout(()=>tone(500,.06,"square",.04),180);};
export const bell=()=>{tone(620+Math.random()*120,.5,"triangle",.025);tone(930,.35,"sine",.012);};
export const pickS=()=>{tone(660,.08,"square",.04);setTimeout(()=>tone(990,.1,"square",.04),70);};export const buy=()=>{tone(520,.08,"square",.05);setTimeout(()=>tone(780,.14,"square",.05),90);};
export const denied=()=>tone(160,.18,"square",.05);export const hurt=()=>tone(140,.15,"sawtooth",.06,70);

