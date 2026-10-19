/* Capelli, poteri e sprite gia' disegnati dei personaggi */
import {CH} from './sprites.js';
export {CH};
export const HAIR=["#241a14","#1e1612","#6b4a2e","#e2bf68","#9a7448","#e0c070","#b07850"];
export const POWERS=[
 {k:"aim",  n:"Precisione",        dur:6, cd:22},
 {k:"heal", n:"Cura",              dur:0, cd:28},
 {k:"speed",n:"Velocità",          dur:6, cd:18},
 {k:"shield",n:"Scudo",            dur:6, cd:24},
 {k:"ammo", n:"Munizioni infinite",dur:8, cd:24},
 {k:"call", n:"Chiama Mirko",      dur:12,cd:35},
];
export const SPR=CH.map(c=>c.fn());

