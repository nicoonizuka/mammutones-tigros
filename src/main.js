/* Mammutones al Tigros - avvio, giocatore, nemici, armi, HUD e loop */
import * as THREE from 'three';
import './style.css';
import {CH,HAIR,POWERS,SPR} from './characters/data.js';
import {humanModel,mammModel,MT} from './characters/models.js';
import {mat,box,sign,setSeed} from './render/textures.js';
import {renderer,scene,camera,solids,blockers,solid,BOUNDS} from './render/engine.js';
import {gzBar,gzSolids,plk} from './world/parking.js';
import {audio,tone,shotSound,click,reloadSound,bell,pickS,buy,denied,hurt} from './audio.js';
const $=id=>document.getElementById(id);
const V3=THREE.Vector3;
/* ===================== GIOCATORE ===================== */
const W={
 pistola: {n:"Pistola",dmg:34,rate:.26,mag:10,res:80,spread:.012,auto:false,pel:1,reload:1.2},
 mitra:   {n:"Mitra",dmg:24,rate:.085,mag:32,res:192,spread:.035,auto:true,pel:1,reload:1.8},
 pompa:   {n:"Fucile a pompa",dmg:20,rate:.75,mag:6,res:42,spread:.085,auto:false,pel:8,reload:2.2},
 cecchino:{n:"Cecchino",dmg:190,rate:1.1,mag:5,res:30,spread:0,auto:false,pel:1,pierce:1,reload:2.4},
};
let P,charIdx=0,pModel,state="menu",enemies=[],drops=[],tracers=[],wave=0,toSpawn=0,spawnT=0,breakT=0,alive=0,kills=0,coins=500,mirko=null,gzOpen=false,time=0;
const keys={};let yaw=Math.PI,pitch=-0.12,mouseDown=false,fireT=0,locked=false,rDrag=false;
const SPAWN1=[[-30,28],[0,28.5],[30,28],[38.5,12],[-38.5,20],[38.5,-4],[-38.5,0]];
const SPAWN2=[[-34,-12.5],[-16,-13]];

function newPlayer(i){
  if(pModel)scene.remove(pModel);pModel=humanModel(i);scene.add(pModel);
  P={pos:new V3(4,0,-2),vy:0,hp:100,ar:0,weapons:[{...W.pistola,id:"pistola",ammo:W.pistola.mag,res:W.pistola.res}],cur:0,reloadT:0,pw:POWERS[i],pwT:0,pwCd:0,hurtT:0,walk:0};
  yaw=0;pitch=-0.1;}

/* ===================== NEMICI ===================== */
function spawnEnemy(){const pts=gzOpen?SPAWN1.concat(SPAWN2):SPAWN1;const p=pts[Math.floor(Math.random()*pts.length)];
  let type="base";const r=Math.random();if(wave>=4&&r<.12)type="grosso";else if(wave>=2&&r<.38)type="cornuto";
  const T=MT[type];const m=mammModel(type);m.position.set(p[0]+(Math.random()-.5)*2,0,p[1]+(Math.random()-.5)*2);scene.add(m);
  const e={m,type,T,hp:T.hp*(1+0.14*(wave-1)),max:0,spd:T.spd*(1+Math.min(.4,wave*.03))*(0.9+Math.random()*.2),atk:0,dead:0,stuck:0,side:0,walk:Math.random()*6,r:0.45*T.sc};
  e.max=e.hp;m.traverse(o=>{if(o.isMesh){o.userData.enemy=e;if(!Array.isArray(o.material))o.material=o.material.clone();}});m.userData.parts.head.userData.head=true;enemies.push(e);alive++;bell();}

function collide(pos,r,extra){
  pos.x=Math.max(BOUNDS.x1+r,Math.min(BOUNDS.x2-r,pos.x));pos.z=Math.max(BOUNDS.z1+r,Math.min(BOUNDS.z2-r,pos.z));
  for(const s of solids){if(s.off)continue;if(pos.x+r>s.x1&&pos.x-r<s.x2&&pos.z+r>s.z1&&pos.z-r<s.z2){
    const dx1=s.x2-(pos.x-r),dx2=(pos.x+r)-s.x1,dz1=s.z2-(pos.z-r),dz2=(pos.z+r)-s.z1;const m=Math.min(dx1,dx2,dz1,dz2);
    if(m===dx1)pos.x+=dx1;else if(m===dx2)pos.x-=dx2;else if(m===dz1)pos.z+=dz1;else pos.z-=dz2;}}
  if(!gzOpen){/* dentro il gazebo non si entra finche' e' chiuso */
    if(pos.x<-12+r&&pos.z<-6+r&&!extra){if(-6+r-pos.z<-12+r-pos.x)pos.z=-6+r;else pos.x=-12+r;}}}

function animLimbs(m,phase,amp){const p=m.userData.parts;const s=Math.sin(phase)*amp;p.lL.rotation.x=s;p.lR.rotation.x=-s;if(p.aL)p.aL.rotation.x=-s*0.8;}

/* ===================== SPARO ===================== */
const ray=new THREE.Raycaster();const tracerM=new THREE.LineBasicMaterial({color:"#ffe08a"});
function muzzle(){const g=pModel.userData.parts.gun;const v=new V3(0,0,0.3);g.localToWorld(v);return v;}
function shoot(){const w=P.weapons[P.cur];if(P.reloadT>0)return;
  const inf=P.pwT>0&&P.pw.k==="ammo";if(w.ammo<=0&&!inf){if(w.res>0)startReload();else click();return;}
  if(!inf)w.ammo--;fireT=w.rate*(P.pwT>0&&P.pw.k==="aim"?0.6:1);shotSound(w.pel>1?1:w.dmg>100?2:0);
  const camDir=new V3();camera.getWorldDirection(camDir);let assist=null;
  if(P.pwT>0&&P.pw.k==="aim"){let best=0.17;for(const e of enemies){if(e.dead)continue;const hp=e.m.position.clone();hp.y+=e.m.userData.height*0.88;const d=hp.clone().sub(camera.position).normalize();const a=d.angleTo(camDir);if(a<best){best=a;assist=hp;}}}
  /* bersagli attaccati: se un Mammutones e' davanti a meno di 2,6 m, il colpo lo prende */
  if(!assist){let bd=2.6;const pf=new V3(-Math.sin(yaw),0,-Math.cos(yaw));for(const e of enemies){if(e.dead)continue;const to=e.m.position.clone().sub(P.pos);to.y=0;const d=to.length();
    if(d<bd&&to.normalize().dot(pf)>0.55){bd=d;assist=e.m.position.clone();assist.y+=e.m.userData.height*0.6;}}}
  let anyHit=false;
  for(let k=0;k<w.pel;k++){
    let dir;if(assist)dir=assist.clone().sub(camera.position).normalize();
    else{dir=camDir.clone();dir.x+=(Math.random()-.5)*w.spread*2;dir.y+=(Math.random()-.5)*w.spread*2;dir.z+=(Math.random()-.5)*w.spread*2;dir.normalize();}
    ray.set(camera.position,dir);ray.far=90;
    const targets=[...blockers,...enemies.filter(e=>!e.dead).map(e=>e.m)];const hits=ray.intersectObjects(targets,true);
    let end=camera.position.clone().add(dir.clone().multiplyScalar(60));const hitE=new Set();
    for(const h of hits){const e=h.object.userData.enemy;if(!e){end=h.point;break;}if(e.dead||hitE.has(e))continue;hitE.add(e);
      const mult=(h.object.userData.head?2:1)*(P.pwT>0&&P.pw.k==="aim"?1.5:1);damageEnemy(e,w.dmg*mult,h.object.userData.head);anyHit=true;end=h.point;if(!w.pierce)break;}
    tracer(muzzle(),end);}
  if(anyHit){$("cross").classList.add("hit");setTimeout(()=>$("cross").classList.remove("hit"),90);}
  pModel.userData.parts.aR.rotation.x=-1.75;}
function tracer(a,b){const g=new THREE.BufferGeometry().setFromPoints([a,b]);const l=new THREE.Line(g,tracerM);scene.add(l);tracers.push({l,t:.06});}
function damageEnemy(e,d,head){e.hp-=d;coins+=10;flashEnemy(e);if(e.hp<=0&&!e.dead){e.dead=1;e.deadT=0;coins+=e.T.cash+(head?30:0);kills++;alive--;
  if(Math.random()<.14)dropItem(e.m.position.clone());}}
function flashEnemy(e){e.m.traverse(o=>{if(o.isMesh&&o.material.emissive){o.material.emissive.set("#ff3020");}});clearTimeout(e.fl);e.fl=setTimeout(()=>e.m.traverse(o=>{if(o.isMesh&&o.material.emissive)o.material.emissive.set("#000");}),70);}
function startReload(){const w=P.weapons[P.cur];if(P.reloadT>0||w.ammo>=w.mag||w.res<=0)return;P.reloadT=w.reload;reloadSound();}

/* ===================== OGGETTI ===================== */
const DROP={cura:{c:"#6fd14f",n:"Cura"},munizioni:{c:"#f2c14e",n:"Munizioni"},armatura:{c:"#5ab0ff",n:"Armatura"}};
function dropItem(pos){const r=Math.random();const k=r<.3?"cura":r<.75?"munizioni":"armatura";const m=box(0.45,0.45,0.45,new THREE.MeshLambertMaterial({color:DROP[k].c,emissive:DROP[k].c,emissiveIntensity:.35}));
  m.position.set(pos.x,0.5,pos.z);scene.add(m);drops.push({m,k,t:25});}
function pickup(d){if(d.k==="cura")P.hp=Math.min(100,P.hp+40);else if(d.k==="armatura")P.ar=Math.min(50,P.ar+25);else P.weapons.forEach(w=>w.res=Math.min(w.res+w.mag*2,W[w.id].res*1.5));feed("+ "+DROP[d.k].n);pickS();}

/* punti interattivi */
const BOX={x:-7,z:-11.5};const AMMO={x:17,z:-11.5};
const mbox=new THREE.Group();{const b=box(1.6,0.9,0.9,mat("#7a5232"));b.position.y=0.45;mbox.add(b);const l=box(1.7,0.12,1,mat("#e8c35a"));l.position.y=0.92;mbox.add(l);
  const q=new THREE.Mesh(new THREE.PlaneGeometry(1.4,0.7),new THREE.MeshBasicMaterial({map:sign("?","900 60px Arial Black,Arial","#ffd447",64,64),transparent:true}));q.position.set(0,0.5,0.46);mbox.add(q);}
mbox.position.set(BOX.x,0,BOX.z);scene.add(mbox);solid(BOX.x,BOX.z,1.7,1);
const abox=new THREE.Group();{const b=box(1.2,1,0.8,mat("#3f5a3a"));b.position.y=0.5;abox.add(b);for(let i=0;i<3;i++){const s=box(0.12,0.4,0.12,mat("#e8c35a"));s.position.set(-0.3+i*0.3,1.2,0);abox.add(s);}}
abox.position.set(AMMO.x,0,AMMO.z);scene.add(abox);solid(AMMO.x,AMMO.z,1.3,0.9);
const INTER=[
 {x:BOX.x,z:BOX.z,r:2.9,label:()=>"<b>E</b> Cassa armi misteriosa · <b>950</b>",cost:950,act:()=>{const pool=["mitra","pompa","cecchino"].filter(id=>!P.weapons.some(w=>w.id===id));const id=pool[Math.floor(Math.random()*pool.length)]||"mitra";
   const nw={...W[id],id,ammo:W[id].mag,res:W[id].res};if(P.weapons.length<2){P.weapons.push(nw);P.cur=1;}else P.weapons[P.cur]=nw;feed("Hai trovato: "+W[id].n);}},
 {x:AMMO.x,z:AMMO.z,r:2.2,label:()=>"<b>E</b> Munizioni per l'arma in mano · <b>300</b>",cost:300,act:()=>{const w=P.weapons[P.cur];w.res=W[w.id].res;w.ammo=w.mag;feed("Munizioni piene");}},
 {x:-18,z:-5.4,r:3,label:()=>gzOpen?null:"<b>E</b> Apri il gazebo Buongusto · <b>750</b>",cost:750,act:()=>{gzOpen=true;scene.remove(gzBar);gzSolids.forEach(s=>s.off=1);banner("Gazebo aperto","I Mammutones ora escono anche da qui");},once:1},
 {x:-11.4,z:-10,r:2.4,label:()=>gzOpen?null:"<b>E</b> Apri il gazebo Buongusto · <b>750</b>",cost:750,act:()=>INTER[2].act(),once:1},
 {x:8,z:-12.6,r:2.6,label:()=>"Il negozio si apre nella prossima versione",cost:0},
 {x:34,z:17.2,r:2.6,label:()=>"La rampa per il seminterrato è bloccata, per ora",cost:0},
];
let nearI=null;
function useInter(){if(!nearI||!nearI.cost)return;if(nearI.once&&gzOpen)return;if(coins<nearI.cost){feed("Ti servono "+nearI.cost+" monete");denied();return;}coins-=nearI.cost;nearI.act();buy();}

/* ===================== MIRKO ===================== */
function callMirko(){if(mirko)scene.remove(mirko.m);const m=humanModel(6);m.position.copy(P.pos).add(new V3(1.5,0,1.5));scene.add(m);mirko={m,t:P.pw.dur,fire:0,walk:0};banner("Arriva Mirko!","Spara ai Mammutones per qualche secondo");}
function updMirko(dt){if(!mirko)return;mirko.t-=dt;const m=mirko.m;
  if(mirko.t<=0){scene.remove(m);mirko=null;feed("Mirko se ne va");return;}
  let target=null,bd=22;for(const e of enemies){if(e.dead)continue;const d=e.m.position.distanceTo(m.position);if(d<bd){bd=d;target=e;}}
  const want=P.pos.clone().add(new V3(Math.sin(time*.5)*2.2,0,Math.cos(time*.5)*2.2));const mv=want.sub(m.position);mv.y=0;const dist=mv.length();
  if(dist>1){mv.normalize().multiplyScalar(Math.min(dist,6*dt));m.position.add(mv);mirko.walk+=dt*9;animLimbs(m,mirko.walk,.6);}collide(m.position,.4,1);
  if(target){const d=target.m.position.clone().sub(m.position);m.rotation.y=Math.atan2(d.x,d.z);m.userData.parts.aR.rotation.x=-1.6;
    mirko.fire-=dt;if(mirko.fire<=0){mirko.fire=.22;const a=m.position.clone();a.y=1.3;const b=target.m.position.clone();b.y=1.2*target.T.sc;tracer(a,b);damageEnemy(target,32,false);shotSound(0,.4);}}}

/* ===================== INPUT ===================== */
const cv=renderer.domElement;
addEventListener("keydown",e=>{keys[e.code]=true;if(state!=="play")return;
  if(e.code==="KeyR")startReload();if(e.code==="KeyE")useInter();if(e.code==="KeyQ")usePower();
  if(e.code==="Digit1"&&P.weapons[0]){P.cur=0;P.reloadT=0;}if(e.code==="Digit2"&&P.weapons[1]){P.cur=1;P.reloadT=0;}
  if(e.code==="Space"&&P.pos.y<=0.001)P.vy=6.2;if(["Space","ArrowUp","ArrowDown"].includes(e.code))e.preventDefault();});
addEventListener("keyup",e=>{keys[e.code]=false;});
addEventListener("wheel",e=>{if(state==="play"&&P.weapons.length>1){P.cur=1-P.cur;P.reloadT=0;}},{passive:true});
cv.addEventListener("mousedown",e=>{audio();if(state!=="play")return;if(!locked){try{const r=cv.requestPointerLock();if(r&&r.catch)r.catch(()=>{});}catch(_){}}
  if(e.button===0){mouseDown=true;if(fireT<=0)shoot();}if(e.button===2)rDrag=true;});
addEventListener("mouseup",e=>{if(e.button===0)mouseDown=false;if(e.button===2)rDrag=false;});
cv.addEventListener("contextmenu",e=>e.preventDefault());
addEventListener("mousemove",e=>{if(state!=="play")return;if(locked||rDrag||mouseDown){yaw-=e.movementX*0.0026;pitch-=e.movementY*0.0022;pitch=Math.max(-1.1,Math.min(0.9,pitch));}});
document.addEventListener("pointerlockchange",()=>{locked=document.pointerLockElement===cv;if(!locked&&state==="play"&&everLocked)pauseGame();if(locked)everLocked=true;});
let everLocked=false;
function usePower(){if(P.pwCd>0)return;const pw=P.pw;P.pwCd=pw.cd;
  if(pw.k==="heal"){P.hp=Math.min(100,P.hp+60);feed("Dado si cura");pickS();}else if(pw.k==="call")callMirko();else{P.pwT=pw.dur;feed(pw.n+"!");}
  if(pw.k==="shield")shieldMesh.visible=true;}
const shieldMesh=new THREE.Mesh(new THREE.SphereGeometry(1.25,12,8),new THREE.MeshBasicMaterial({color:"#f2b93b",transparent:true,opacity:.22,wireframe:false}));shieldMesh.visible=false;scene.add(shieldMesh);

/* ===================== HUD ===================== */
let feedT=[];function feed(t){const d=document.createElement("div");d.textContent=t;$("feed").prepend(d);setTimeout(()=>d.remove(),2600);while($("feed").children.length>5)$("feed").lastChild.remove();}
let bannerT=0;function banner(t,s){$("banner").innerHTML=t+(s?`<small>${s}</small>`:"");$("banner").hidden=false;bannerT=2.6;}
function hud(){$("wave").innerHTML=wave+"<small>Ondata</small>";$("coins").textContent=coins;
  $("hpb").style.width=P.hp+"%";$("hpt").textContent=Math.ceil(P.hp);$("arb").style.width=(P.ar/50*100)+"%";
  const w=P.weapons[P.cur];const inf=P.pwT>0&&P.pw.k==="ammo";$("wname").textContent=w.n+(P.reloadT>0?" · ricarica…":"");
  $("ammo").innerHTML=inf?"∞":`${w.ammo}<small> / ${w.res}</small>`;
  $("slots").innerHTML=P.weapons.map((x,i)=>`<span class="${i===P.cur?"on":""}">${i+1} ${x.n}</span>`).join("");
  const on=P.pwT>0||(P.pw.k==="call"&&mirko);$("pw").classList.toggle("on",!!on);
  $("pwb").style.width=(on?(P.pw.k==="call"&&mirko?mirko.t:P.pwT)/P.pw.dur*100:(1-P.pwCd/P.pw.cd)*100)+"%";
  $("prompt").hidden=!nearI||!nearI.label();if(nearI&&nearI.label())$("prompt").innerHTML=nearI.label();}

/* ===================== LOOP ===================== */
let last=performance.now();
function loop(t){requestAnimationFrame(loop);const dt=Math.min(.05,(t-last)/1000);last=t;
  if(state==="play"){time+=dt;update(dt);}
  else{time+=dt*.3;if(state==="menu"){camera.position.set(Math.sin(time*.2)*30,14,20+Math.cos(time*.2)*6);camera.lookAt(0,2,-8);}}
  renderer.render(scene,camera);}
function update(dt){
  /* ondate */
  if(toSpawn>0){spawnT-=dt;if(spawnT<=0&&alive<18){spawnEnemy();toSpawn--;spawnT=Math.max(.45,1.3-wave*.06);}}
  else if(alive<=0){if(breakT<=0){breakT=6;if(wave>0){banner("Ondata "+wave+" superata","Prossima ondata tra poco");coins+=100;}}breakT-=dt;if(breakT<=0)startWave();}
  /* poteri */
  if(P.pwCd>0)P.pwCd=Math.max(0,P.pwCd-dt);if(P.pwT>0){P.pwT-=dt;if(P.pwT<=0){P.pwT=0;shieldMesh.visible=false;}}
  /* movimento */
  const fwd=new V3(-Math.sin(yaw),0,-Math.cos(yaw)),right=new V3(Math.cos(yaw),0,-Math.sin(yaw));
  if(keys.ArrowLeft)yaw+=dt*2.2;if(keys.ArrowRight)yaw-=dt*2.2;
  const mv=new V3();if(keys.KeyW)mv.add(fwd);if(keys.KeyS)mv.sub(fwd);if(keys.KeyD)mv.add(right);if(keys.KeyA)mv.sub(right);
  const moving=mv.lengthSq()>0;let spd=keys.ShiftLeft||keys.ShiftRight?7.2:4.8;if(P.pwT>0&&P.pw.k==="speed")spd*=1.9;
  if(moving){mv.normalize().multiplyScalar(spd*dt);P.pos.add(mv);P.walk+=dt*spd*1.9;}
  P.vy-=18*dt;P.pos.y=Math.max(0,P.pos.y+P.vy*dt);if(P.pos.y===0)P.vy=0;
  collide(P.pos,.4);
  pModel.position.copy(P.pos);pModel.rotation.y=yaw+Math.PI;animLimbs(pModel,P.walk,moving?.7:0);
  const ar=pModel.userData.parts.aR;ar.rotation.x+=(-1.5-pitch*0.9-ar.rotation.x)*Math.min(1,dt*14);
  shieldMesh.position.set(P.pos.x,P.pos.y+1,P.pos.z);
  /* camera in terza persona */
  const d=new V3(-Math.sin(yaw)*Math.cos(pitch),Math.sin(pitch),-Math.cos(yaw)*Math.cos(pitch));
  const head=P.pos.clone();head.y+=pModel.userData.height*0.92;
  const cam=head.clone().sub(d.clone().multiplyScalar(3.6)).add(right.clone().multiplyScalar(0.95));cam.y=Math.max(0.4,cam.y+0.15);cam.x=Math.max(-39.5,Math.min(39.5,cam.x));cam.z=Math.max(-13.6,Math.min(29.5,cam.z));
  camera.position.copy(cam);camera.lookAt(cam.clone().add(d));
  /* sparo */
  fireT-=dt;const w=P.weapons[P.cur];if(mouseDown&&w.auto&&fireT<=0)shoot();
  if(P.reloadT>0){P.reloadT-=dt;if(P.reloadT<=0){const n=Math.min(w.mag-w.ammo,w.res);w.ammo+=n;w.res-=n;P.reloadT=0;}}
  else if(w.ammo===0&&w.res>0&&!(P.pwT>0&&P.pw.k==="ammo"))startReload();
  /* nemici */
  for(const e of enemies){const m=e.m;
    if(e.dead){e.deadT+=dt;m.rotation.x=Math.min(1.5,e.deadT*4);m.position.y=-Math.max(0,e.deadT-1.2)*0.8;if(e.deadT>2.6){scene.remove(m);e.gone=1;}continue;}
    const to=P.pos.clone().sub(m.position);to.y=0;const dist=to.length();m.rotation.y=Math.atan2(to.x,to.z);
    if(dist>1.15){to.normalize();if(e.side){const s=new V3(to.z,0,-to.x).multiplyScalar(e.side);to.add(s).normalize();e.sideT-=dt;if(e.sideT<=0)e.side=0;}
      const before=m.position.clone();m.position.add(to.multiplyScalar(e.spd*dt));
      for(const o of enemies){if(o===e||o.dead)continue;const dd=m.position.clone().sub(o.m.position);dd.y=0;const l=dd.length();if(l<0.8&&l>0)m.position.add(dd.multiplyScalar((0.8-l)/l*0.5));}
      collide(m.position,e.r,1);const moved=m.position.distanceTo(before);
      if(moved<e.spd*dt*0.3){e.stuck+=dt;if(e.stuck>.4){e.side=Math.random()<.5?1:-1;e.sideT=1.2;e.stuck=0;}}else e.stuck=0;
      e.walk+=dt*e.spd*2.2;animLimbs(m,e.walk,.6);m.userData.parts.aR.rotation.x=-Math.sin(e.walk)*.5;}
    else{e.atk-=dt;m.userData.parts.aR.rotation.x=-1.4+Math.sin(time*12)*.4;m.userData.parts.aL.rotation.x=-1.4-Math.sin(time*12)*.4;
      if(e.atk<=0){e.atk=1;hit(e.T.dmg*(1+wave*.03));}}}
  enemies=enemies.filter(e=>!e.gone);
  /* oggetti */
  for(const d of drops){d.t-=dt;d.m.rotation.y+=dt*2;d.m.position.y=0.5+Math.sin(time*4)*0.1;if(d.m.position.distanceTo(new V3(P.pos.x,0.5,P.pos.z))<1.3){pickup(d);d.t=0;}if(d.t<=0)scene.remove(d.m);}
  drops=drops.filter(d=>d.t>0);
  tracers.forEach(x=>{x.t-=dt;if(x.t<=0){scene.remove(x.l);x.l.geometry.dispose();}});tracers=tracers.filter(x=>x.t>0);
  updMirko(dt);
  nearI=null;for(const i of INTER){if(Math.hypot(P.pos.x-i.x,P.pos.z-i.z)<i.r&&i.label()){nearI=i;break;}}
  if(bannerT>0){bannerT-=dt;if(bannerT<=0)$("banner").hidden=true;}
  P.hurtT=Math.max(0,P.hurtT-dt);$("dmg").style.boxShadow=`inset 0 0 120px 30px rgba(220,30,30,${Math.min(.65,P.hurtT*1.4)})`;
  hud();}
function hit(dmg){if(P.pwT>0&&P.pw.k==="shield"){tone(1200,.05,"square",.03);return;}
  if(P.ar>0){const a=Math.min(P.ar,dmg*.7);P.ar-=a;dmg-=a;}P.hp-=dmg;P.hurtT=.5;hurt();if(P.hp<=0){P.hp=0;gameOver();}}
function startWave(){wave++;toSpawn=5+wave*3;spawnT=.5;banner("Ondata "+wave,wave===2?"Arrivano i Mammutones Cornuti":wave===4?"Attento ai Mammutones Grossi":"");}

/* ===================== STATI ===================== */
function resetWorld(){enemies.forEach(e=>scene.remove(e.m));drops.forEach(d=>scene.remove(d.m));enemies=[];drops=[];alive=0;toSpawn=0;wave=0;kills=0;coins=500;breakT=3;
  if(mirko){scene.remove(mirko.m);mirko=null;}if(gzOpen){gzOpen=false;scene.add(gzBar);gzSolids.forEach(s=>s.off=0);}shieldMesh.visible=false;}
function startGame(i){charIdx=i;resetWorld();newPlayer(i);state="play";["sel","dead","pause"].forEach(id=>$(id).hidden=true);$("hud").hidden=false;
  $("pname").textContent=CH[i].name;$("pwn").textContent=POWERS[i].n;const wc=$("who");const s=SPR[i];const g=wc.getContext("2d");g.clearRect(0,0,17,16);
  for(let y=0;y<16;y++)for(let x=0;x<17;x++){const c=s.g[s.top-3+y]&&s.g[s.top-3+y][14+x];if(c&&!String(c).startsWith("rgba")){g.fillStyle=c;g.fillRect(x,y,1,1);}}
  try{const r=cv.requestPointerLock();if(r&&r.catch)r.catch(()=>{});}catch(_){}
  banner("Sopravvivi al parcheggio","Compra armi e apri il gazebo con le monete");audio();}
function pauseGame(){if(state!=="play")return;state="pause";$("pause").hidden=false;mouseDown=false;}
function resume(){state="play";$("pause").hidden=true;last=performance.now();try{const r=cv.requestPointerLock();if(r&&r.catch)r.catch(()=>{});}catch(_){}}
function gameOver(){state="dead";try{document.exitPointerLock();}catch(_){}$("hud").hidden=true;$("dead").hidden=false;
  $("deadmsg").textContent=`${CH[charIdx].name} è caduto al parcheggio del Tigros. Loris Busato ride da qualche parte nel magazzino.`;
  $("deadstats").innerHTML=`<div>${wave}<small>Ondata raggiunta</small></div><div>${kills}<small>Mammutones abbattuti</small></div>`;}
function toMenu(){state="menu";resetWorld();if(pModel){scene.remove(pModel);pModel=null;}["dead","pause"].forEach(id=>$(id).hidden=true);$("hud").hidden=true;$("sel").hidden=false;}
$("resume").onclick=resume;$("quit").onclick=toMenu;$("again").onclick=()=>startGame(charIdx);$("change").onclick=toMenu;
addEventListener("keydown",e=>{if(e.code==="KeyP"&&state==="play")pauseGame();});

/* schermata di scelta */
CH.slice(0,6).forEach((c,i)=>{const b=document.createElement("button");b.type="button";b.className="pc";b.style.setProperty("--c",c.c);
  const can=document.createElement("canvas");SPR[i].draw(can,3);b.append(can);
  b.insertAdjacentHTML("beforeend",`<b>${c.name.split(" ")[0]}</b><span>${POWERS[i].n}</span>`);b.onclick=()=>startGame(i);$("pick").append(b);});
if(matchMedia("(pointer:coarse)").matches)$("touchwarn").hidden=false;
requestAnimationFrame(loop);

