/* Renderer, scena, luci, camera e collisioni */
import * as THREE from 'three';
THREE.ColorManagement.legacyMode=false;
export const renderer=new THREE.WebGLRenderer({antialias:true});
renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.outputEncoding=THREE.sRGBEncoding;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.0;
document.getElementById("game").append(renderer.domElement);
export const scene=new THREE.Scene();scene.background=new THREE.Color("#c27a52");scene.fog=new THREE.Fog("#b06a48",30,95);
export const camera=new THREE.PerspectiveCamera(70,1,0.1,200);
scene.add(new THREE.HemisphereLight("#ffd9b8","#4a3a40",1.0));
{const rim=new THREE.DirectionalLight("#9ab8ff",0.6);rim.position.set(30,20,-30);scene.add(rim);}
export const sun=new THREE.DirectionalLight("#ffcf9a",2.2);sun.position.set(-30,40,25);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);sun.shadow.bias=-0.0005;sun.shadow.normalBias=0.03;
Object.assign(sun.shadow.camera,{left:-45,right:45,top:45,bottom:-45,near:1,far:120});scene.add(sun);
function resize(){const w=innerWidth,h=innerHeight;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();}
addEventListener("resize",resize);resize();

/* collisioni: rettangoli [x1,z1,x2,z2] */
export const solids=[];export const blockers=[];
export function solid(x,z,w,d,mesh){const s={x1:x-w/2,z1:z-d/2,x2:x+w/2,z2:z+d/2,mesh};solids.push(s);if(mesh)blockers.push(mesh);return s;}
export const BOUNDS={x1:-40,x2:40,z1:-14,z2:30};

