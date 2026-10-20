/* Renderer, scena, luci, camera e collisioni */
import * as THREE from 'three';
import { mergeBufferGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
THREE.ColorManagement.legacyMode=false;
export const renderer=new THREE.WebGLRenderer({antialias:true});
renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.outputEncoding=THREE.sRGBEncoding;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.0;
document.getElementById("game").append(renderer.domElement);
export const scene=new THREE.Scene();scene.background=new THREE.Color("#c27a52");scene.fog=new THREE.Fog("#b06a48",30,95);
export const camera=new THREE.PerspectiveCamera(70,1,0.1,200);
export const hemi=new THREE.HemisphereLight("#ffd9b8","#4a3a40",1.0);scene.add(hemi);
{const rim=new THREE.DirectionalLight("#9ab8ff",0.6);rim.position.set(30,20,-30);scene.add(rim);}
export const sun=new THREE.DirectionalLight("#ffcf9a",2.2);sun.position.set(-30,40,25);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);sun.shadow.bias=-0.0005;sun.shadow.normalBias=0.03;
Object.assign(sun.shadow.camera,{left:-45,right:45,top:45,bottom:-45,near:1,far:120});scene.add(sun);scene.add(sun.target);
function resize(){const w=innerWidth,h=innerHeight;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();}
addEventListener("resize",resize);resize();

/* collisioni: rettangoli [x1,z1,x2,z2] */
/* ostacoli: rettangoli per le collisioni + una scatola invisibile per fermare i proiettili */
export const solids=[];
const proxyMat=new THREE.MeshBasicMaterial({visible:false});
export function solid(x,z,w,d,mesh,h){const s={x1:x-w/2,z1:z-d/2,x2:x+w/2,z2:z+d/2};
  if(mesh){const hh=h||(mesh.geometry&&mesh.geometry.parameters&&mesh.geometry.parameters.height>3?7:2.6);s.proxy=new THREE.Mesh(new THREE.BoxGeometry(w,hh,d),proxyMat);s.proxy.position.set(x,hh/2,z);scene.add(s.proxy);}
  solids.push(s);return s;}
export function blockers(){const out=[];for(const s of solids)if(s.proxy&&!s.off)out.push(s.proxy);return out;}

/* unisce tutte le mesh ferme con lo stesso materiale in una sola: molte meno chiamate di disegno */
export function bakeStatic(root,exclude){
  const skip=new Set();exclude.forEach(o=>o&&o.traverse(c=>skip.add(c)));
  root.updateMatrixWorld(true);const groups=new Map();const toRemove=[];
  root.traverse(o=>{if(!o.isMesh||o.isInstancedMesh||skip.has(o)||Array.isArray(o.material)||o.material===proxyMat||!o.material.visible)return;
    if(o.geometry.parameters&&o.geometry.parameters.radius>=100)return;
    const key=o.material.uuid+'|'+o.castShadow+'|'+o.receiveShadow;if(!groups.has(key))groups.set(key,{mat:o.material,cast:o.castShadow,recv:o.receiveShadow,geos:[]});
    let g=o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone();for(const k of Object.keys(g.attributes))if(!['position','normal','uv'].includes(k))g.deleteAttribute(k);
    if(!g.attributes.uv){g.setAttribute('uv',new THREE.BufferAttribute(new Float32Array(g.attributes.position.count*2),2));}
    g.applyMatrix4(o.matrixWorld);groups.get(key).geos.push(g);toRemove.push(o);});
  toRemove.forEach(o=>o.parent&&o.parent.remove(o));
  for(const {mat,cast,recv,geos} of groups.values()){const merged=mergeBufferGeometries(geos,false);geos.forEach(g=>g.dispose());if(!merged)continue;
    const m=new THREE.Mesh(merged,mat);m.castShadow=cast;m.receiveShadow=recv;m.matrixAutoUpdate=false;root.add(m);}
  return groups.size;}
export const BOUNDS={x1:-40,x2:40,z1:-70,z2:30};

