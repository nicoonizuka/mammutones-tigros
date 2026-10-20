/* Disegni pixel art dei personaggi: motore sprite + i 6 amici e Mirko */
/* ---------- motore sprite ---------- */
let seed=1;const rnd=()=>{seed=(seed*16807)%2147483647;return(seed-1)/2147483646};
function Sprite(w,h){const g=[...Array(h)].map(()=>Array(w).fill(null));
  const s={w,h,g,
    px(x,y,c){x=Math.round(x);y=Math.round(y);if(x>=0&&y>=0&&x<w&&y<h)g[y][x]=c;},
    rect(x,y,ww,hh,c){for(let j=0;j<hh;j++)for(let i=0;i<ww;i++)s.px(x+i,y+j,typeof c==="function"?c(x+i,y+j):c);},
    ell(cx,cy,rx,ry,c){for(let y=Math.floor(cy-ry);y<=cy+ry;y++)for(let x=Math.floor(cx-rx);x<=cx+rx;x++){if(((x-cx)/rx)**2+((y-cy)/ry)**2<=1)s.px(x,y,typeof c==="function"?c(x,y):c);}},
    outline(col){const add=[];for(let y=0;y<h;y++)for(let x=0;x<w;x++){if(g[y][x])continue;
      if([[1,0],[-1,0],[0,1],[0,-1]].some(([dx,dy])=>g[y+dy]&&g[y+dy][x+dx]&&g[y+dy][x+dx]!==col&&!String(g[y+dy][x+dx]).startsWith("rgba")))add.push([x,y]);}add.forEach(([x,y])=>g[y][x]=col);},
    draw(cv,sc){cv.width=w*sc;cv.height=h*sc;const c=cv.getContext("2d");g.forEach((row,y)=>row.forEach((col,x)=>{if(col){c.fillStyle=col;c.fillRect(x*sc,y*sc,sc,sc);}}));}
  };return s;}
const pick=p=>()=>{const r=rnd();return r<.55?p[0]:r<.85?p[1]:p[2];};
const OUT="#0a0d12";

/* ---------- omino base: altezza H in pixel, mezza larghezza bw ---------- */
function human(o){
  seed=o.seed||5;const s=Sprite(44,64);s.o=o;const cx=22,top=62-o.H;s.top=top;const _t=top,T=Math.round((o.H-13)*.45),legTop=top+13+T;
  const bw=o.bw,lw=Math.max(3,bw-2),sk=o.skin;
  /* gambe */
  const legC=(y)=>o.shorts&&y>legTop+o.shorts?(o.socks&&y>57-o.socks?"#f4f4f0":sk):o.pants;
  for(let y=legTop;y<59;y++){s.rect(cx-lw-1,y,lw,1,legC(y));s.rect(cx+1,y,lw,1,legC(y));}
  if(!o.shorts)s.rect(cx-1,legTop,2,3,o.pants);
  s.rect(cx-lw-2,59,lw+2,3,o.shoe||"#f2f2f2");s.rect(cx+1,59,lw+2,3,o.shoe||"#f2f2f2");s.rect(cx-lw-2,61,lw+2,1,o.sole||"#9aa0aa");s.rect(cx+1,61,lw+2,1,o.sole||"#9aa0aa");
  /* braccia */
  const armTop=top+14,armLen=T+3,aw=o.aw||3;
  for(const side of[-1,1]){const ax=side<0?cx-bw-aw:cx+bw;
    for(let y=armTop;y<armTop+armLen;y++){const sleeve=o.sleeve===undefined?armLen:o.sleeve;s.rect(ax,y,aw,1,y-armTop<sleeve?o.top:sk);}
    s.rect(ax,armTop+armLen,aw,2,sk);}
  /* busto */
  s.rect(cx-bw,top+13,bw*2,T+2,o.topFn||o.top);s.px(cx-bw,top+13,null);s.px(cx+bw-1,top+13,null);
  if(o.hem)s.rect(cx-bw,top+13+T,bw*2,2,o.hem);
  /* collo e testa */
  s.rect(cx-2,top+11,4,3,sk);
  s.rect(cx-5,top+1,10,11,sk);s.px(cx-5,top+1,null);s.px(cx+4,top+1,null);s.px(cx-5,top+11,null);s.px(cx+4,top+11,null);
  s.rect(cx-6,top+5,1,3,o.ear||sk);s.rect(cx+5,top+5,1,3,o.ear||sk);
  s.rect(cx-3,top+6,2,1,"#1a1418");s.rect(cx+1,top+6,2,1,"#1a1418");
  s.rect(cx-3,top+5,2,1,o.brow||"#3a281c");s.rect(cx+1,top+5,2,1,o.brow||"#3a281c");
  s.rect(cx,top+7,1,2,o.nose||"#d9a888");
  s.rect(cx-1,top+9,3,1,o.mouth||"#a8564a");
  o.extra&&o.extra(s,cx,top,T,legTop,bw,aw);
  s.outline(OUT);
  o.post&&o.post(s,cx,top);
  return s;}

/* ---------- personaggi ---------- */
const CH=[
 {name:"Nathan Mascheroni",role:"Magro, occhiali da aviatore",h:"1,75 m",c:"#5ab0ff",tag:"GIOCABILE",pw:"Precisione",pd:"Mira assistita e colpi più veloci.",ic:"aim",
  fn:()=>human({seed:2,H:49,bw:5,skin:"#f0cfb0",top:"#1c1c22",topFn:(x,y)=>y%3===0?"#2a2a34":"#1c1c22",pants:"#2e3a55",shoe:"#e8e8e8",nose:"#dcb294",
   extra:(s,cx,t,T,lt,bw)=>{
     s.rect(cx-5,t+1,10,2,"#241a14");s.rect(cx-5,t+3,1,2,"#241a14");s.rect(cx+4,t+3,1,2,"#241a14");for(let x=cx-5;x<cx+5;x+=2)s.px(x,t,"#241a14");
     const fur=pick(["#6a7282","#9aa2b2","#454c5a"]);s.ell(cx,t+13,bw+2,2.4,fur);s.rect(cx-1,t+15,2,T-1,"#33333d");
     const AV="#d4d8e0";[[cx-4],[cx+1]].forEach(([x])=>{s.rect(x,t+5,4,1,AV);s.rect(x,t+8,4,1,AV);s.px(x-1,t+6,AV);s.px(x-1,t+7,AV);s.px(x+4,t+6,AV);s.px(x+4,t+7,AV);s.px(x+1,t+6,"rgba(200,230,255,.35)");});
     s.rect(cx-1,t+5,2,1,AV);}})},
 {name:"Dado",role:"Il ciuffo, il più strano del gruppo",h:"1,75 m",c:"#5fd38a",tag:"GIOCABILE",pw:"Cura",pd:"Si ricarica la vita. La vita è una sola, quindi usala bene.",ic:"heal",
  fn:()=>human({seed:4,H:49,bw:6,skin:"#eec6a4",top:"#18181d",pants:"#8a909b",shoe:"#f0f0f0",mouth:"#ffffff",nose:"#d8ac8a",
   extra:(s,cx,t,T,lt,bw,aw)=>{
     const HC="#1e1612";s.rect(cx-5,t+1,10,3,HC);s.rect(cx-5,t+4,1,2,HC);s.rect(cx+4,t+4,1,2,HC);s.ell(cx+1,t,4.2,2.2,HC);s.px(cx+3,t-2,HC);s.px(cx+1,t-1,"#3a2c24");s.px(cx+2,t,"#3a2c24");
     s.rect(cx-3,t+4,2,1,HC);s.rect(cx+1,t+5,2,1,HC);
     s.rect(cx-2,t+9,5,1,"#ffffff");s.px(cx-3,t+8,"#a8564a");s.px(cx+3,t+8,"#a8564a");
     s.rect(cx-bw+1,t+12,bw*2-2,2,"#26262c");
     s.rect(cx-2,t+14,1,4,"#d8d8d8");s.rect(cx+1,t+14,1,4,"#d8d8d8");s.rect(cx+2,t+19,3,2,"#c8c8d0");
     s.rect(cx-bw-aw,t+14+T+1,aw,1,"#e8c35a");}})},
 {name:"Nico",role:"Occhiali da sole e frangia spettinata",h:"1,80 m",c:"#4f8cf0",tag:"GIOCABILE",pw:"Velocità",pd:"Scatto rapidissimo per scappare dai Mammutones o arrivare primo alle armi.",ic:"speed",
  fn:()=>human({seed:7,H:51,bw:6,skin:"#f2d0b4",top:"#2f5fb8",topFn:(x,y)=>(x+y)%2?"#2a55a6":"#3366c4",hem:"#244c96",pants:"#2a2f3a",shoe:"#1e1e24",sole:"#f0f0f0",nose:"#ddb294",
   extra:(s,cx,t)=>{
     const HC="#6b4a2e",HL="#8a6240";s.rect(cx-6,t,12,4,HC);s.rect(cx-6,t+4,1,3,HC);s.rect(cx+5,t+4,1,3,HC);
     [[-5,4],[-3,5],[-1,4],[1,5],[3,4]].forEach(([dx,y])=>s.rect(cx+dx,t+4,2,y-3,HC));
     [[-5,-1],[-2,-2],[1,-1],[4,-2],[-4,-2],[2,-2]].forEach(([dx,dy])=>s.px(cx+dx,t+dy+1,HC));s.px(cx-3,t+1,HL);s.px(cx+1,t+1,HL);s.px(cx+3,t+2,HL);
     s.rect(cx-5,t+5,4,3,"#111");s.rect(cx+1,t+5,4,3,"#111");s.rect(cx-1,t+5,2,1,"#111");s.px(cx-4,t+5,"#9aa4b0");s.px(cx+2,t+5,"#9aa4b0");
     s.rect(cx-1,t+10,2,2,"#6b4a2e");
     s.rect(cx-3,t+13,6,1,"#244c96");}})},
 {name:"Slime",role:"Ricci biondi, basso e robusto",h:"1,65 m",c:"#f2b93b",tag:"GIOCABILE",pw:"Scudo",pd:"Alza uno scudo che blocca gli attacchi dei Mammutones.",ic:"shield",
  fn:()=>human({seed:9,H:44,bw:8,aw:4,skin:"#e8b090",top:"#f2f2ee",sleeve:6,pants:"#2f55c8",shorts:5,socks:4,shoe:"#e8e8e8",nose:"#d4987a",
   extra:(s,cx,t)=>{
     const B=["#e2bf68","#d4ab52","#f0d488"];
     [[-5,1],[-3,0],[-1,-1],[1,-1],[3,0],[5,1],[-6,3],[6,3],[-6,6],[6,6],[-2,1],[2,1],[0,0]].forEach(([dx,dy],k)=>s.ell(cx+dx,t+dy+1,2.3,2.1,B[k%3]));
     [[-4,2],[0,1],[3,2],[-6,5],[6,5]].forEach(([dx,dy])=>s.px(cx+dx,t+dy+1,"#8a6a3a"));
     s.rect(cx-4,t+4,2,1,"#e2bf68");s.rect(cx+2,t+4,2,1,"#e2bf68");
     s.rect(cx-2,t+8,5,1,"#a8803e");
     s.rect(cx-3,t+13,6,1,"#dcdcd6");}})},
 {name:"Leonardo Ceriotti",role:"Altissimo, tatuaggi, sempre con la siga",h:"1,90 m",c:"#a8d14f",tag:"GIOCABILE",pw:"Munizioni infinite",pd:"Spara senza mai fermarsi a ricaricare.",ic:"ammo",
  fn:()=>human({seed:11,H:55,bw:5,skin:"#e6b48c",top:"#e8e4da",sleeve:0,pants:"#5a6b34",shorts:7,shoe:"#f0f0f0",nose:"#cf9a74",
   extra:(s,cx,t,T,lt,bw,aw)=>{
     const HC="#9a7448",HL="#b89060";s.rect(cx-6,t,12,4,HC);s.rect(cx-6,t+4,1,3,HC);s.rect(cx+5,t+4,1,2,HC);
     s.rect(cx-4,t+4,5,1,HC);s.rect(cx-4,t+5,2,1,HC);[[-5,-1],[-1,-2],[2,-1],[5,-1],[0,-1]].forEach(([dx,dy])=>s.px(cx+dx,t+dy+1,HC));s.px(cx-2,t+1,HL);s.px(cx+2,t+2,HL);
     s.rect(cx-bw,t+13,1,3,"#e8e4da");s.rect(cx+bw-1,t+13,1,3,"#e8e4da");s.rect(cx-bw+1,t+13,bw*2-2,2,"#e6b48c");
     s.px(cx-2,t+15,"#d8a830");s.px(cx-1,t+16,"#d8a830");s.px(cx,t+16,"#d8a830");s.px(cx+1,t+15,"#d8a830");
     const ax=cx+bw;for(let y=t+14+6;y<t+14+T+2;y+=2)s.px(ax+1,y,"#3a3a44");s.px(ax,t+14+T,"#3a3a44");s.px(ax+2,t+14+T-3,"#3a3a44");
     s.rect(cx+2,t+9,3,1,"#f6f2ea");s.px(cx+5,t+9,"#ff7a3a");}
   ,post:(s,cx,t)=>{s.px(cx+6,t+7,"rgba(220,220,230,.55)");s.px(cx+7,t+5,"rgba(220,220,230,.45)");s.px(cx+6,t+3,"rgba(220,220,230,.35)");s.px(cx+8,t+2,"rgba(220,220,230,.25)");}})},
 {name:"Ponta",role:"Codino biondo, un po' grosso",h:"1,75 m",c:"#ff7a6a",tag:"GIOCABILE",pw:"Chiama Mirko",pd:"Arriva suo padre, Mirko, e combatte al suo fianco per qualche secondo.",ic:"call",
  fn:()=>human({seed:13,H:49,bw:7,aw:4,skin:"#e0a880",top:"#c8463c",sleeve:5,pants:"#2b3040",shoe:"#f0f0f0",nose:"#c9926c",
   extra:(s,cx,t,T)=>{
     const HC="#e0c070",HD="#c4a050";s.rect(cx-5,t+1,10,3,HC);s.rect(cx-5,t+4,1,2,HC);s.rect(cx+4,t+4,1,2,HC);for(let x=cx-4;x<cx+4;x+=2)s.px(x,t+2,HD);
     s.ell(cx,t-1,2.4,2,HC);s.px(cx-1,t-2,HD);s.rect(cx-1,t+1,2,1,"#a87a3a");
     s.rect(cx-2,t+14,1,1,"#e8c35a");s.rect(cx+1,t+14,1,1,"#e8c35a");s.rect(cx-1,t+15,2,1,"#e8c35a");s.rect(cx,t+16,1,3,"#e8c35a");s.rect(cx-1,t+17,3,1,"#e8c35a");}})},
 {name:"Mirko",role:"Il papà di Ponta",h:"papà",c:"#e8c35a",tag:"ALLEATO",ally:1,pw:"Rinforzo",pd:"Compare quando Ponta lo chiama, spara ai Mammutones e poi se ne va.",ic:"call",
  fn:()=>human({seed:17,H:50,bw:8,aw:4,skin:"#c98f63",top:"#151515",sleeve:3,pants:"#2a2f3a",shoe:"#1a1a1a",sole:"#d8d8d8",nose:"#b07850",brow:"#2a1a12",
   extra:(s,cx,t,T,lt,bw,aw)=>{
     const TT="#2e221c";s.rect(cx-4,t+1,8,1,TT);s.px(cx-5,t+2,TT);s.px(cx-3,t+2,TT);s.px(cx-1,t+2,TT);s.rect(cx,t+2,2,2,TT);s.px(cx+3,t+2,TT);s.px(cx+4,t+3,TT);s.px(cx-1,t+3,TT);s.px(cx+4,t+5,TT);s.px(cx+4,t+7,TT);s.px(cx-5,t+4,TT);
     s.rect(cx-5,t+5,4,2,"#3a2410");s.rect(cx+1,t+5,4,2,"#3a2410");s.rect(cx-1,t+5,2,1,"#d8b040");s.rect(cx-5,t+5,4,1,"#5a3a1c");s.rect(cx+1,t+5,4,1,"#5a3a1c");s.px(cx-4,t+5,"#d8b040");s.px(cx+4,t+5,"#d8b040");
     s.rect(cx-1,t+10,3,2,"#4a3020");s.rect(cx-3,t+9,1,1,"#4a3020");s.rect(cx+3,t+9,1,1,"#4a3020");
     s.rect(cx-3,t+13,6,1,"#e0b040");s.px(cx-4,t+12,"#e0b040");s.px(cx+3,t+12,"#e0b040");s.rect(cx-2,t+14,4,1,"#c89a30");
     for(const side of[-1,1]){const ax=side<0?cx-bw-aw:cx+bw;for(let y=t+18;y<t+14+T+2;y++)if((y+side)%2===0)s.px(ax+1,y,"#3a2a22");s.px(ax+2,t+19,"#3a2a22");}}})},
 {name:"Jacopo Castiglioni",role:"Ricci scuri e occhi verdi",h:"1,74 m",c:"#c07ae8",tag:"GIOCABILE",pw:"Doppio colpo",pd:"Ogni colpo ne spara due.",ic:"aim",
  fn:()=>human({seed:23,H:49,bw:6,skin:"#e2ab86",top:"#1b1c20",sleeve:5,pants:"#2b303d",shoe:"#f0f0f0",nose:"#cc9572",brow:"#1f1612",
   extra:(s,cx,t)=>{const C=["#1f1612","#2c201a"];
     [[-4,1],[-2,0],[0,0],[2,0],[4,1],[-5,3],[5,3],[-3,2],[1,2],[3,3],[-1,1]].forEach(([dx,dy],k)=>s.ell(cx+dx,t+dy+1,1.9,1.7,C[k%2]));
     [[-4,4],[-2,4],[0,4],[2,4]].forEach(([dx,dy],k)=>s.rect(cx+dx,t+dy,2,1,C[k%2]));s.rect(cx-6,t+3,1,3,C[0]);s.rect(cx+5,t+3,1,3,C[0]);
     s.px(cx-3,t+6,"#5f9a6a");s.px(cx+2,t+6,"#5f9a6a");
     s.rect(cx+2,t+16,2,1,"#c0303a");s.px(cx+2,t+16,"#f2f2f2");}})},
 {name:"Corti",role:"Alto e grosso, felpa grigia",h:"1,88 m",c:"#e8c35a",tag:"GIOCABILE",pw:"Monete doppie",pd:"Le monete valgono il doppio per qualche secondo.",ic:"call",
  fn:()=>human({seed:29,H:53,bw:9,aw:4,skin:"#dca07c",top:"#b9bcc2",hem:"#a9acb2",pants:"#4a4d55",shoe:"#2a2a2e",sole:"#f0f0f0",nose:"#c88d6a",brow:"#2a1c12",
   extra:(s,cx,t,T,lt,bw)=>{const H="#3a2618",L="#9a7448";
     s.rect(cx-5,t+1,10,3,H);s.rect(cx-5,t+4,1,2,H);s.rect(cx+4,t+4,1,2,H);[[-4,0],[-2,-1],[0,0],[2,-1],[4,0]].forEach(([dx,dy])=>s.rect(cx+dx,t+dy+1,2,1,L));
     s.rect(cx-4,t+4,3,1,H);s.rect(cx+1,t+4,2,1,H);
     s.rect(cx-bw-1,t+19,bw*2+2,T-6,"#b9bcc2");
     s.rect(cx-4,t+13,8,2,"#a9acb2");s.rect(cx-2,t+15,1,4,"#e8e8e8");s.rect(cx+1,t+15,1,4,"#e8e8e8");
     s.rect(cx-4,t+21,8,4,"#a9acb2");s.px(cx+3,t+16,"#ffffff");s.px(cx+4,t+16,"#ffffff");
     for(let y=lt+4;y<57;y+=3){s.px(cx-6,y,"#1d1e22");s.px(cx+5,y,"#1d1e22");}}})},
 {name:"Tefalin",role:"Capelli spettinati, occhiali rossi, piumino grigio",h:"1,70 m",c:"#ff6a7a",tag:"GIOCABILE",pw:"Amici albanesi",pd:"Due amici albanesi con l'AK-47 smitragliano i Mammutones.",ic:"aim",
  fn:()=>human({seed:31,H:47,bw:7,aw:4,skin:"#efc9ae",top:"#d3d6d9",topFn:(x,y)=>y%4===0?"#bfc2c6":"#d3d6d9",hem:"#c2c5c9",pants:"#2c3444",shoe:"#f0f0f0",nose:"#dcae90",brow:"#3a281c",
   extra:(s,cx,t,T)=>{const H="#3a281c",L="#4e3626";
     s.rect(cx-6,t,12,4,H);s.rect(cx-6,t+4,1,3,H);s.rect(cx+5,t+4,1,3,H);
     [[-6,-1],[-4,-2],[-2,-2],[0,-3],[2,-2],[4,-2],[6,-1],[-7,1],[7,1],[-3,-1],[1,-1]].forEach(([dx,dy],k)=>s.ell(cx+dx,t+dy+1,1.8,1.6,k%3?H:L));
     [[-5,4],[-3,5],[0,4],[2,5],[4,4]].forEach(([dx,y])=>s.rect(cx+dx,t+4,2,y-3,H));
     const R="#9a1e28";s.rect(cx-5,t+5,4,1,R);s.rect(cx+1,t+5,4,1,R);s.px(cx-6,t+4,R);s.px(cx+5,t+4,R);s.rect(cx-1,t+5,2,1,R);
     s.px(cx-5,t+6,R);s.px(cx+4,t+6,R);s.rect(cx-5,t+7,4,1,"#e8b8bc");s.rect(cx+1,t+7,4,1,"#e8b8bc");
     s.rect(cx-1,t+14,3,T,"#22305a");s.rect(cx-2,t+14,1,T,"#121316");s.rect(cx+2,t+14,1,T,"#121316");
     s.rect(cx-4,t+12,8,2,"#d3d6d9");}})},
 {name:"Debe",role:"Ricci neri, sempre con l'occhiolino",h:"1,75 m",c:"#7ad0ff",tag:"GIOCABILE",pw:"Proiettili lenti",pd:"I nemici colpiti rallentano tantissimo.",ic:"aim",
  fn:()=>human({seed:37,H:49,bw:7,aw:4,skin:"#e2b48e",top:"#1d2028",pants:"#2b2f38",shoe:"#1c1c20",sole:"#e8e8e8",nose:"#cf9c78",brow:"#16110e",mouth:"#ffffff",
   extra:(s,cx,t)=>{const C=["#16110e","#241a15"];
     [[-4,1],[-2,0],[0,0],[2,0],[4,1],[-5,3],[5,3],[-3,2],[1,2],[3,2],[-1,1]].forEach(([dx,dy],k)=>s.ell(cx+dx,t+dy+1,1.9,1.7,C[k%2]));
     [[-4,4],[-2,4],[0,4],[2,4]].forEach(([dx,dy],k)=>s.rect(cx+dx,t+dy,2,1,C[k%2]));s.rect(cx-6,t+3,1,3,C[0]);s.rect(cx+5,t+3,1,3,C[0]);
     s.rect(cx+1,t+6,2,1,"#e2b48e");s.rect(cx+1,t+7,2,1,"#3a2418");
     s.rect(cx-1,t+9,3,1,"#ffffff");s.px(cx+2,t+8,"#a8564a");
     s.px(cx-4,t+10,"#8a6a54");s.px(cx-2,t+11,"#8a6a54");s.px(cx+2,t+11,"#8a6a54");s.px(cx+3,t+10,"#8a6a54");
     s.rect(cx-3,t+12,6,2,"#f2f0ea");s.rect(cx-1,t+14,2,6,"#f2f0ea");}})},
 {name:"Diego Margarito",role:"Il più alto, ricci neri folti",h:"1,85 m",c:"#f2a63b",tag:"GIOCABILE",pw:"Fischio",pd:"Congela tutti i nemici vicini.",ic:"aim",
  fn:()=>human({seed:41,H:52,bw:6,skin:"#ddab86",top:"#1a1a1d",sleeve:5,pants:"#383b43",shoe:"#f0f0f0",nose:"#c9946e",brow:"#120d0b",
   extra:(s,cx,t)=>{const C=["#120d0b","#21170f","#2c2016"];
     [[-5,1],[-3,0],[-1,-1],[1,-1],[3,0],[5,1],[-6,3],[6,3],[-4,-1],[2,-2],[0,-2],[-2,-2],[4,-1],[-6,5],[6,5]].forEach(([dx,dy],k)=>s.ell(cx+dx,t+dy+1,2.1,1.9,C[k%3]));
     [[-4,4],[-2,4],[0,4],[2,4]].forEach(([dx,dy],k)=>s.rect(cx+dx,t+dy,2,1,C[k%3]));
     s.rect(cx-4,t+5,3,1,"#120d0b");s.rect(cx+1,t+5,3,1,"#120d0b");
     s.rect(cx-1,t+8,3,1,"#8a6a54");}})},
 {name:"Leodessi",role:"Ricci scuri morbidi, sempre sorridente, felpa grigia",h:"1,76 m",c:"#9aa0ff",tag:"DAL TRIBUNALE",pw:"Furia",pd:"Per qualche secondo ogni colpo fa il doppio dei danni.",ic:"aim",
  fn:()=>human({seed:43,H:49,bw:6,skin:"#ecc3a2",top:"#8e9196",topFn:(x,y)=>x===22?"#c8ccd2":"#8e9196",hem:"#7f8287",pants:"#2f333c",shoe:"#f0f0f0",nose:"#d8a888",brow:"#150f0c",mouth:"#ffffff",
   extra:(s,cx,t)=>{const C=["#150f0c","#22180f"];
     [[-5,1],[-3,0],[-1,-1],[1,-1],[3,0],[5,1],[-6,3],[6,3],[-2,-2],[2,-2]].forEach(([dx,dy],k)=>s.ell(cx+dx,t+dy+1,2,1.8,C[k%2]));
     [[-5,5],[-3,6],[-1,6],[1,5],[3,5]].forEach(([dx,y],k)=>s.rect(cx+dx,t+3,2,y-3,C[k%2]));s.rect(cx-6,t+3,1,4,C[0]);s.rect(cx+5,t+3,1,4,C[0]);
     s.rect(cx-2,t+9,5,1,"#ffffff");s.rect(cx-4,t+12,8,2,"#7f8287");}})},
 {name:"Libe il matto",role:"Capelli spettinati, camicia beige aperta",h:"1,78 m",c:"#d8c08a",tag:"ALLEATO",pw:"Velocità",pd:"Guida come un matto.",ic:"aim",
  fn:()=>human({seed:47,H:50,bw:6,skin:"#e6b896",top:"#b9ad94",topFn:(x,y)=>Math.abs(x-22)<2?"#f2f2ee":"#b9ad94",pants:"#2c3038",shoe:"#e8e8e8",nose:"#d0a07e",brow:"#2e2016",
   extra:(s,cx,t)=>{const C=["#2e2016","#3c2a1c"];
     [[-5,1],[-3,-1],[0,-1],[3,-1],[5,1],[-6,3],[6,3],[-1,-2],[2,-2]].forEach(([dx,dy],k)=>s.ell(cx+dx,t+dy+1,2.1,1.6,C[k%2]));
     [[-4,4],[-1,5],[2,4]].forEach(([dx,y],k)=>s.rect(cx+dx,t+3,2,y-3,C[k%2]));s.rect(cx-6,t+3,1,3,C[0]);s.rect(cx+5,t+3,1,3,C[0]);
     s.px(cx-3,t+10,"#9a7a62");s.px(cx-1,t+11,"#9a7a62");s.px(cx+1,t+11,"#9a7a62");s.px(cx+3,t+10,"#9a7a62");
     s.rect(cx-4,t+12,2,2,"#a89c84");s.rect(cx+2,t+12,2,2,"#a89c84");}})},
 {name:"Bulegato",role:"Ricci alti, occhi azzurri, maglietta bianca larga",h:"1,80 m",c:"#7ac0ff",tag:"DAL TRIBUNALE",pw:"Onda d'urto",pd:"Respinge e ferisce i nemici vicini.",ic:"aim",
  fn:()=>human({seed:53,H:51,bw:7,aw:4,skin:"#eec3a4",top:"#f4f4f0",sleeve:6,pants:"#2a3348",shoe:"#8f8a84",sole:"#e4e0d8",nose:"#d8a888",brow:"#2a1a12",
   extra:(s,cx,t)=>{const C=["#2a1a12","#3a2618","#1e130d"];
     [[-5,0],[-3,-1],[-1,-2],[1,-2],[3,-1],[5,0],[-6,2],[6,2],[-4,-2],[0,-3],[4,-2],[-2,-3],[2,-3]].forEach(([dx,dy],k)=>s.ell(cx+dx,t+dy+1,2.1,1.9,C[k%3]));
     [[-4,4],[-2,4],[0,4],[2,4]].forEach(([dx,dy],k)=>s.rect(cx+dx,t+dy,2,1,C[k%3]));s.rect(cx-6,t+3,1,3,C[0]);s.rect(cx+5,t+3,1,3,C[0]);
     s.px(cx-3,t+6,"#3a6a9a");s.px(cx+2,t+6,"#3a6a9a");s.px(cx-3,t+10,"#a88a74");s.px(cx+2,t+10,"#a88a74");}})},
 {name:"Castelluccio",role:"Ricci castani sopra, lati rasati, giacca grigio-verde",h:"1,78 m",c:"#8ad0a0",tag:"DAL TRIBUNALE",pw:"Rallentatore",pd:"Tutti i nemici rallentano quasi fino a fermarsi.",ic:"aim",
  fn:()=>human({seed:59,H:50,bw:7,aw:4,skin:"#ebbf9e",top:"#7d8a84",topFn:(x,y)=>x===22?"#c8ccd2":"#7d8a84",hem:"#6c7872",pants:"#2b2f38",shoe:"#f0f0f0",nose:"#d6a684",brow:"#4a3020",
   extra:(s,cx,t)=>{const C=["#4a3020","#5c3c28"];
     s.rect(cx-6,t+2,1,4,"#8a6a54");s.rect(cx+5,t+2,1,4,"#8a6a54");
     [[-3,0],[-1,-1],[1,-1],[3,0],[-4,2],[4,2],[0,-2],[-2,-2],[2,-2]].forEach(([dx,dy],k)=>s.ell(cx+dx,t+dy+1,1.9,1.7,C[k%2]));
     [[-3,3],[-1,3],[1,3]].forEach(([dx,dy],k)=>s.rect(cx+dx,t+dy,2,1,C[k%2]));
     s.px(cx-3,t+10,"#9a7a62");s.px(cx+2,t+10,"#9a7a62");s.rect(cx-3,t+12,6,2,"#f2f2ee");}})},
];

export {Sprite,human,CH,OUT};
