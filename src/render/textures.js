/* Texture pixel (canvas), materiali e cubi */
import * as THREE from 'three';
export const tex=(w,h,draw)=>{const c=document.createElement("canvas");c.width=w;c.height=h;draw(c.getContext("2d"),w,h);const t=new THREE.CanvasTexture(c);t.magFilter=THREE.NearestFilter;t.minFilter=THREE.NearestFilter;t.encoding=THREE.sRGBEncoding;return t;};
export const mat=(o)=>new THREE.MeshLambertMaterial(typeof o==="string"?{color:o}:o);
export const box=(w,h,d,m)=>new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);
let rs=11;export const setSeed=v=>{rs=v;};export const rr=()=>{rs=(rs*16807)%2147483647;return(rs-1)/2147483646};
export function noiseTex(pal,size,n){return tex(size,size,(g,w,h)=>{for(let y=0;y<h;y++)for(let x=0;x<w;x++){const r=rr();g.fillStyle=r<.55?pal[0]:r<.85?pal[1]:pal[2];g.fillRect(x,y,1,1);}});}

/* faccia dal disegno 2D: ritaglio della testa dello sprite */
export function faceTex(s,hair){const top=s.top;return tex(17,16,(g)=>{g.fillStyle=hair;g.fillRect(0,0,17,16);
  for(let y=0;y<16;y++)for(let x=0;x<17;x++){const row=s.g[top-3+y];const c=row&&row[14+x];if(c&&!String(c).startsWith("rgba")){g.fillStyle=c;g.fillRect(x,y,1,1);}}});}
export function sideTex(hair,skin,back){return tex(8,8,(g)=>{g.fillStyle=skin;g.fillRect(0,0,8,8);g.fillStyle=hair;g.fillRect(0,0,8,back?6:3);if(!back){g.fillRect(0,0,2,5);}});}

export const sign=(txt,font,col,w,h)=>tex(w,h,(g)=>{g.clearRect(0,0,w,h);g.font=font;g.textAlign="center";g.textBaseline="middle";g.fillStyle="#3a1a10";g.fillText(txt,w/2+3,h/2+3);g.fillStyle=col;g.fillText(txt,w/2,h/2);});
