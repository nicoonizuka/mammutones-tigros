/* Modelli 3D a blocchi: amici (dal disegno 2D) e Mammutones */
import * as THREE from 'three';
import {tex,mat,box,noiseTex,faceTex,sideTex,setSeed} from '../render/textures.js';
import {SPR,HAIR} from './data.js';
export function humanModel(i){
  const s=SPR[i],o=s.o,hair=HAIR[i],hs=o.H/49;
  const G=new THREE.Group();const parts={};
  const skin=mat(o.skin),top=mat(o.top),pants=mat(o.pants),shoe=mat(o.shoe||"#eeeeee");
  const legH=0.78*hs,torH=0.6*hs,tw=0.32+o.bw*0.04,td=0.26+o.bw*0.012,lw=tw*0.46;
  for(const side of[-1,1]){const piv=new THREE.Group();piv.position.set(side*lw*0.55,legH,0);
    if(o.shorts){const up=box(lw,legH*0.42,lw,pants);up.position.y=-legH*0.21;piv.add(up);
      const lo=box(lw*0.9,legH*0.58,lw*0.9,o.socks?mat("#f4f4f0"):skin);lo.position.y=-legH*0.71;piv.add(lo);}
    else{const l=box(lw,legH,lw,pants);l.position.y=-legH/2;piv.add(l);}
    const sh=box(lw*1.05,0.1,lw*1.4,shoe);sh.position.set(0,-legH+0.05,0.05);piv.add(sh);
    G.add(piv);parts[side<0?"lL":"lR"]=piv;}
  const tor=box(tw,torH,td,top);tor.position.y=legH+torH/2;G.add(tor);
  const aw=0.12+o.bw*0.006;
  for(const side of[-1,1]){const piv=new THREE.Group();piv.position.set(side*(tw/2+aw/2),legH+torH-0.05,0);
    const sl=o.sleeve===undefined?1:Math.min(1,o.sleeve/(torH*20));
    const a1=box(aw,torH*Math.max(.15,sl),aw,o.sleeve===0?skin:top);a1.position.y=-torH*Math.max(.15,sl)/2;piv.add(a1);
    const rest=torH*(1-Math.max(.15,sl))+0.08;const a2=box(aw*0.92,rest,aw*0.92,skin);a2.position.y=-torH*Math.max(.15,sl)-rest/2;piv.add(a2);
    G.add(piv);parts[side<0?"aL":"aR"]=piv;}
  const gun=box(0.08,0.12,0.5,mat("#22262c"));gun.position.set(0,-torH+0.02,0.22);parts.aR.add(gun);parts.gun=gun;
  const ft=faceTex(s,hair),st=sideTex(hair,o.skin,false),bt=sideTex(hair,o.skin,true),tp=tex(4,4,(g)=>{g.fillStyle=hair;g.fillRect(0,0,4,4)});
  const hm=[mat({map:st}),mat({map:st}),mat({map:tp}),mat(o.skin),mat({map:ft}),mat({map:bt})];
  const head=new THREE.Mesh(new THREE.BoxGeometry(0.56,0.53,0.5),hm);head.position.y=legH+torH+0.29;G.add(head);parts.head=head;
  G.userData={parts,height:legH+torH+0.55};
  G.traverse(m=>{if(m.isMesh){m.castShadow=true;}});
  return G;}

export const MT={
 base:   {hp:100,spd:2.3,dmg:14,sc:1,   fur:["#2a2220","#3a2f2a","#18120f"],mask:"#1a1414",hi:"#3e3434",kerch:"#7a4a2a",eye:"#000",cash:60},
 cornuto:{hp:70, spd:4.6,dmg:11,sc:0.95,fur:["#e9e4da","#d2cabd","#f8f5ee"],mask:"#8a3b26",hi:"#b85a3a",kerch:"#efe9de",eye:"#2a0d08",horns:1,cash:70},
 grosso: {hp:340,spd:1.5,dmg:28,sc:1.4, fur:["#4a5568","#39424f","#5d6a7e"],mask:"#141114",hi:"#363036",kerch:"#2f3640",eye:"#ff3030",cash:120},
};
const furCache={};
export function mammModel(type){
  const T=MT[type];const G=new THREE.Group();const parts={};
  if(!furCache[type]){setSeed(type.length*97);furCache[type]={fur:noiseTex(T.fur,16,0),mask:tex(16,16,(g)=>{g.fillStyle=T.kerch;g.fillRect(0,0,16,16);
      g.fillStyle=T.mask;g.fillRect(3,2,10,13);g.fillRect(2,4,12,9);g.fillStyle=T.hi;g.fillRect(3,4,10,1);g.fillRect(7,6,2,5);g.fillRect(6,10,4,2);
      g.fillStyle=T.eye;g.fillRect(4,6,3,2);g.fillRect(9,6,3,2);g.fillRect(5,13,6,1);g.fillStyle="#000";g.fillRect(6,11,1,1);g.fillRect(9,11,1,1);})};}
  const F=furCache[type];const fur=mat({map:F.fur});const dark=mat("#24242c");const boot=mat("#5a3a22");const bell=mat("#c9902e");
  for(const side of[-1,1]){const piv=new THREE.Group();piv.position.set(side*0.16,0.75,0);const l=box(0.2,0.7,0.2,dark);l.position.y=-0.35;piv.add(l);
    const b=box(0.24,0.12,0.32,boot);b.position.set(0,-0.7,0.04);piv.add(b);G.add(piv);parts[side<0?"lL":"lR"]=piv;}
  const tor=box(0.78,0.95,0.55,fur);tor.position.y=1.12;G.add(tor);
  const skirt=box(0.84,0.25,0.6,fur);skirt.position.y=0.66;G.add(skirt);
  for(const side of[-1,1]){const piv=new THREE.Group();piv.position.set(side*0.5,1.5,0);const a=box(0.22,0.8,0.24,fur);a.position.y=-0.4;piv.add(a);G.add(piv);parts[side<0?"aL":"aR"]=piv;}
  const nb=type==="grosso"?7:3;for(let k=0;k<nb;k++){const b=box(0.14,0.16,0.12,bell);b.position.set(-0.25+((k*0.19)%0.6),0.85+(k%3)*0.22,0.3);G.add(b);}
  for(const side of[-1,1]){const b=box(0.2,0.24,0.18,bell);b.position.set(side*0.3,1.62,-0.25);G.add(b);}
  const km=mat(T.kerch);const hm=[km,km,km,km,mat({map:F.mask}),km];
  const head=new THREE.Mesh(new THREE.BoxGeometry(0.5,0.52,0.46),hm);head.position.y=1.86;G.add(head);parts.head=head;
  if(T.horns){const hn=mat("#1d1a1a");for(const side of[-1,1]){const h1=box(0.12,0.12,0.5,hn);h1.position.set(side*0.38,2.08,0);h1.rotation.z=side*0.6;h1.rotation.y=0;G.add(h1);
      const h2=box(0.09,0.4,0.09,hn);h2.position.set(side*0.58,2.3,0);h2.rotation.z=-side*0.3;G.add(h2);}}
  if(type==="grosso"){const ey=new THREE.MeshBasicMaterial({color:"#ff2a2a"});for(const side of[-1,1]){const e=box(0.08,0.05,0.02,ey);e.position.set(side*0.1,1.92,0.24);G.add(e);}}
  G.scale.setScalar(T.sc);G.userData={parts,height:2.1*T.sc};G.traverse(m=>{if(m.isMesh)m.castShadow=true;});
  return G;}

