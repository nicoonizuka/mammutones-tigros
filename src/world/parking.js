/* Zona 1 e 2: parcheggio del Tigros, facciata, gazebo Buongusto */
import * as THREE from 'three';
import {tex,mat,box,rr,setSeed,sign} from '../render/textures.js';
import {scene,solid} from '../render/engine.js';
/* terreno: asfalto con le strisce */
const ground=new THREE.Mesh(new THREE.PlaneGeometry(80,44),mat({map:tex(320,176,(g,w,h)=>{
  setSeed(5);for(let y=0;y<h;y++)for(let x=0;x<w;x++){const r=rr();g.fillStyle=r<.6?"#4a4e57":r<.9?"#43474f":"#565a63";g.fillRect(x,y,1,1);}
  g.fillStyle="#b3ada3";g.fillRect(0,0,w,32);for(let x=0;x<w;x+=8)g.fillRect(x,0,1,32);g.fillStyle="#9d978d";for(let x=0;x<w;x+=8)g.fillRect(x,0,1,32);g.fillStyle="#8f897f";g.fillRect(0,31,w,1);
  g.fillStyle="#e8e4dc";[[56,84],[104,132]].forEach(([y0,y1])=>{for(let x=16;x<=304;x+=12)g.fillRect(x,y0,1,y1-y0);});
  g.fillStyle="#c9c3b8";g.fillRect(16,84,289,3);g.fillRect(16,132,289,3);
  g.fillStyle="#2a2c30";for(let k=0;k<26;k++){let x=rr()*w,y=40+rr()*130;for(let i=0;i<14;i++){g.fillRect(x,y,1,1);x+=rr()<.5?1:-1;y+=1;}}
  g.fillStyle="#6a5a4a";for(let k=0;k<200;k++)g.fillRect(rr()*w,40+rr()*130,1,1);
})}));
ground.rotation.x=-Math.PI/2;ground.position.set(0,0,8);ground.receiveShadow=true;scene.add(ground);

/* edificio: facciata in mattoni */
const brick=tex(64,32,(g,w,h)=>{g.fillStyle="#b5563a";g.fillRect(0,0,w,h);g.fillStyle="#9a4630";for(let y=0;y<h;y+=4){g.fillRect(0,y,w,1);for(let x=(y/4)%2?0:4;x<w;x+=8)g.fillRect(x,y,1,4);}g.fillStyle="#c86a4a";for(let k=0;k<60;k++)g.fillRect(rr()*w,rr()*h,2,1);});
brick.wrapS=brick.wrapT=THREE.RepeatWrapping;brick.repeat.set(10,2);
const bld=box(80,9,16,mat({map:brick}));bld.position.set(0,4.5,-22);bld.receiveShadow=true;scene.add(bld);solid(0,-22,80,16,bld);
const tigros=new THREE.Mesh(new THREE.PlaneGeometry(12,3),new THREE.MeshBasicMaterial({map:sign("TIGROS","900 64px Arial Black,Arial,sans-serif","#f4f2ee",320,80),transparent:true}));
tigros.position.set(8,7,-13.95);scene.add(tigros);
const bg=new THREE.Mesh(new THREE.PlaneGeometry(10,2),new THREE.MeshBasicMaterial({map:sign("Buongusto","italic 700 54px Georgia,serif","#f4f2ee",320,64),transparent:true}));
bg.position.set(-24,6.6,-13.95);scene.add(bg);
/* ingresso a vetri */
const glass=box(8,3.6,0.2,mat({color:"#7fb4cc",transparent:true,opacity:.75}));glass.position.set(8,1.8,-13.9);scene.add(glass);
for(const x of[4.5,6.8,9.2,11.5]){const y=box(1.2,0.35,0.22,mat("#f2c14e"));y.position.set(x,2.2,-13.85);scene.add(y);}
const frame=box(8.4,0.3,0.4,mat("#dcdcdc"));frame.position.set(8,3.75,-13.8);scene.add(frame);
for(let x=3;x<14;x+=1.6){const p=box(0.18,0.9,0.18,mat("#9aa3ad"));p.position.set(x,0.45,-12.3);scene.add(p);}
/* vetrine Buongusto */
for(let x=-36;x<-12;x+=4){const w=box(3.4,2.6,0.15,mat({color:"#5f8ea4",transparent:true,opacity:.8}));w.position.set(x+2,1.6,-13.9);scene.add(w);}

/* gazebo Buongusto: tettoia, pali, tavolini */
const canopy=box(24,0.25,8.4,mat("#ecebe6"));canopy.position.set(-24,3.4,-10);canopy.castShadow=true;scene.add(canopy);
for(let x=-36;x<=-12;x+=6)for(const z of[-6.2]){const p=box(0.25,3.4,0.25,mat("#e0dfda"));p.position.set(x,1.7,z);scene.add(p);}
const tableM=mat("#f2f2ee"),chairM=mat("#4a4440");
[[-32,-10],[-27,-8.4],[-22,-10.4],[-17,-8.6],[-30,-12.4],[-19,-12.4]].forEach(([x,z],k)=>{const t=box(1.3,0.08,1.3,tableM);t.position.set(x,0.95,z);scene.add(t);
  const l=box(0.12,0.95,0.12,tableM);l.position.set(x,0.47,z);scene.add(l);solid(x,z,1.4,1.4);
  [[-1,0],[1,0],[0,-1],[0,1]].forEach(([dx,dz],j)=>{const c=box(0.5,0.5,0.5,chairM);c.position.set(x+dx*1.05,0.25,z+dz*1.05);if(k===2&&j===1){c.rotation.z=1.4;c.position.y=0.2;}scene.add(c);});});

/* barriera del gazebo (si compra) */
export const gzBar=new THREE.Group();export const plk=tex(8,2,(g)=>{for(let x=0;x<8;x++){g.fillStyle=x%4<2?"#f2c14e":"#1a1a1a";g.fillRect(x,0,1,2);}});plk.wrapS=THREE.RepeatWrapping;plk.repeat.set(6,1);
function plank(x,z,len,rot){const p=box(len,0.35,0.12,mat({map:plk}));p.position.set(x,1.2,z);p.rotation.y=rot;gzBar.add(p);const p2=p.clone();p2.position.y=0.55;gzBar.add(p2);}
plank(-24,-6,24,0);plank(-12,-10,8,Math.PI/2);scene.add(gzBar);
export const gzSolids=[solid(-24,-6,24,0.4),solid(-12,-10,0.4,8)];

/* macchine */
const CARC=["#c94a42","#3f7fc0","#bfc4ca","#34343e","#6f9fc4","#d9ad3c","#5b6370"];
function makeCar(x,z,rot,col,burnt){const G=new THREE.Group();const b=mat(burnt?"#2e2a28":col),gl=mat(burnt?"#151312":"#8fc0d6"),tire=mat("#141418");
  const body=box(1.8,0.75,4,b);body.position.y=0.62;G.add(body);const cab=box(1.6,0.6,2.1,gl);cab.position.set(0,1.28,-0.2);G.add(cab);
  const roof=box(1.62,0.1,1.9,b);roof.position.set(0,1.6,-0.2);G.add(roof);
  for(const sx of[-0.85,0.85])for(const sz of[-1.3,1.3]){const t=box(0.25,0.55,0.6,tire);t.position.set(sx,0.28,sz);G.add(t);}
  if(burnt){const r=box(0.5,0.05,0.6,mat("#b0552a"));r.position.set(0.3,1.0,1.4);G.add(r);G.rotation.z=0.04;}
  G.position.set(x,0,z);G.rotation.y=rot;G.traverse(m=>{if(m.isMesh){m.castShadow=true;m.receiveShadow=true;}});scene.add(G);
  const horiz=Math.abs(Math.sin(rot))>0.5;solid(x,z,horiz?4.1:1.9,horiz?1.9:4.1,body);}
setSeed(31);
[[-34,4],[-28,4],[-20,4],[-10,4],[-4,4],[6,4],[14,4],[24,4],[33,4],[-31,16],[-22,16],[-13,16],[0,16],[9,16],[18,16],[30,16]].forEach(([x,z],k)=>{
  if(rr()<.25)return;makeCar(x+rr()*0.6,z+rr()*0.6,(rr()<.5?0:Math.PI)+(rr()-.5)*0.2,CARC[k%CARC.length],rr()<.3);});
makeCar(-6,10.5,Math.PI/2+0.3,"#2e2a28",true);makeCar(20,22,Math.PI/2-0.2,"#3f7fc0",false);
/* lampioni, carrelli */
for(const [x,z] of[[-26,10],[-8,10],[10,10],[28,10],[-18,22],[12,24]]){const p=box(0.18,5,0.18,mat("#3d4350"));p.position.set(x,2.5,z);scene.add(p);const h=box(1.2,0.15,0.4,mat("#3d4350"));h.position.set(x+0.5,5,z);scene.add(h);solid(x,z,0.4,0.4);}
const cartM=mat("#9aa3ad");
function cartAt(x,z,r,fallen){const G=new THREE.Group();const b=box(0.6,0.5,0.95,cartM);b.position.y=0.75;G.add(b);const h=box(0.6,0.06,0.06,mat("#ef5350"));h.position.set(0,1.05,-0.5);G.add(h);
  for(const sx of[-0.25,0.25])for(const sz of[-0.38,0.38]){const w=box(0.06,0.5,0.06,cartM);w.position.set(sx,0.25,sz);G.add(w);}
  G.position.set(x,0,z);G.rotation.y=r;if(fallen){G.rotation.z=1.5;G.position.y=0.3;}scene.add(G);}
const shelter=box(7,0.15,2.6,mat("#7a8592"));shelter.position.set(24,2.4,-10.5);scene.add(shelter);
for(const x of[20.7,27.3]){const p=box(0.15,2.4,0.15,mat("#7a8592"));p.position.set(x,1.2,-11.6);scene.add(p);}
for(let i=0;i<6;i++)cartAt(21.5+i*1,-10.5,0);solid(24,-10.5,7,2.4);
cartAt(-15,12,0.7,true);cartAt(3,20,2,false);cartAt(30,9,1,true);cartAt(-30,25,0.3,false);
/* detriti */
const deb=[mat("#6b6560"),mat("#8a837b"),mat("#a87a4a")];
for(let i=0;i<70;i++){const d=box(0.2+rr()*0.5,0.1+rr()*0.2,0.2+rr()*0.5,deb[i%3]);d.position.set(-38+rr()*76,0.08,-5+rr()*34);d.rotation.y=rr()*3;scene.add(d);}
/* muretti del parcheggio sui bordi */
const kerb=mat("#c9c3b8");
[[0,29.6,80,0.6],[-39.7,8,0.6,44],[39.7,8,0.6,44]].forEach(([x,z,w,d])=>{const k=box(w,0.5,d,kerb);k.position.set(x,0.25,z);scene.add(k);});
/* rampa al -1 (chiusa) */
const ramp=box(8,0.05,10,mat("#2a2c30"));ramp.position.set(34,0.03,23);scene.add(ramp);
const rb=box(8,1.1,0.25,mat({map:plk}));rb.position.set(34,0.8,18);scene.add(rb);solid(34,23,8,10);

