/* Ta carte du ciel en 3D — anneau écliptique tournant, dessiné en canvas 2D.
   Projection orthographique maison (aucune bibliothèque 3D) :
   yaw (tourner à plat) puis inclinaison, tri par profondeur pour l'ordre de dessin.
   Les positions viennent du moteur du site (ASTRO), tout se passe dans le navigateur. */
(function(){
"use strict";
function $(id){return document.getElementById(id)}

var C={w:960,h:620};
var ctx=null;
var yaw=Math.PI, tilt=0.55, zoom=1;
var ASC=null; /* longitude écliptique de l'ascendant, en degrés, ou null */
var MOIS=["janvier","février","mars","avril","mai","juin","juillet","août","septembre","octobre","novembre","décembre"];

/* aspects : écart de signes (0 à 11) -> glyphe, couleur, nom */
function aspect(d){
  d=((d%12)+12)%12;
  if(d===4||d===8){return {g:"△",n:"trine",c:"#efc272"}}
  if(d===2||d===10){return {g:"✶",n:"sextile",c:"#9fdcaa"}}
  if(d===3||d===9){return {g:"□",n:"carré",c:"#ff8f7a"}}
  if(d===6){return {g:"☍",n:"opposition",c:"#8fb8ff"}}
  if(d===0){return {g:"☀",n:"conjonction",c:"#f6eedb"}}
  return null;
}

/* 40 étoiles de fond, position fixe par graine (comme la vidéo : fond stable) */
var ETOILES=[];
(function(){
  var gr=7, i;
  function suiv(){gr=(gr*16807)%2147483647; return gr/2147483647}
  for(i=0;i<40;i++){ETOILES.push({x:suiv()*C.w,y:suiv()*C.h,t:suiv()*6.28,al:0.25+suiv()*0.4})}
})();

/* Ascendant : même formule que coach.js et theme-video.js, mais degré exact.
   Précision de quelques degrés, heure locale supposée GT+1, Bénin par défaut (6,5° N / 2,4° E). */
function ascDeg(d,latDeg,lonEstDeg){
  var jd=d+2451544.5;
  var eps=23.4393-0.0000004*d;
  var lst=(280.46061837+360.98564736629*(jd-2451545)+lonEstDeg)%360;
  lst=((lst%360)+360)%360;
  var phi=latDeg*Math.PI/180, L=lst*Math.PI/180, E=eps*Math.PI/180;
  var a=Math.atan2(Math.cos(L),-(Math.sin(L)*Math.cos(E)+Math.tan(phi)*Math.sin(E)))*180/Math.PI;
  return ((a%360)+360)%360;
}

/* ===== projection : degrés écliptiques -> coordonnées écran =====
   Retourne {x,y,z} : x,y à l'écran, z = profondeur (négatif = devant). */
function proj(lon,r){
  var a=lon*Math.PI/180;
  /* yaw autour de l'axe vertical */
  var x=Math.cos(a+yaw)*r, y=Math.sin(a+yaw)*r, z=0;
  /* inclinaison autour de l'axe horizontal de l'écran */
  var ct=Math.cos(tilt), st=Math.sin(tilt);
  var y2=y*ct-z*st, z2=y*st+z*ct;
  return {x:x, y:-z2, prof:y2}; /* y écran inversé (le canvas compte vers le bas) */
}

function dessine(){
  var w=C.w, h=C.h, cx=w/2, cy=h/2, R=225*zoom;
  /* fond + étoiles */
  var g=ctx.createLinearGradient(0,0,0,h);
  g.addColorStop(0,"#0b0c22"); g.addColorStop(1,"#070816");
  ctx.fillStyle=g; ctx.fillRect(0,0,w,h);
  var i,s,x,y,e,al;
  for(i=0;i<ETOILES.length;i++){
    e=ETOILES[i];
    al=e.al*(0.7+0.3*Math.sin(Date.now()/1400+e.t));
    ctx.fillStyle="rgba(246,238,219,"+al.toFixed(2)+")";
    ctx.fillRect(e.x,e.y,1.6,1.6);
  }

  /* anneau écliptique : 120 segments, l'arrière plus pâle (profondeur) */
  var SEGS=120, r0=R*0.86, r1=R;
  for(i=0;i<SEGS;i++){
    var a0=i/SEGS*360, a1=(i+1)/SEGS*360;
    var p0=proj(a0,r1), p1=proj(a1,r1);
    var prof=(p0.prof+p1.prof)/2;
    var k=Math.max(0,Math.min(1,0.5-prof/R)); /* 0 derrière, 1 devant */
    ctx.strokeStyle="rgba(239,194,114,"+(0.22+0.5*k).toFixed(2)+")";
    ctx.lineWidth=2;
    ctx.beginPath(); ctx.moveTo(cx+p0.x,cy+p0.y); ctx.lineTo(cx+p1.x,cy+p1.y); ctx.stroke();
    if(i%5===0){ /*Cadres internes discrets */
      var q0=proj(a0,r0), q1=proj(a0,r1);
      ctx.strokeStyle="rgba(239,194,114,0.14)";
      ctx.beginPath(); ctx.moveTo(cx+q0.x,cy+q0.y); ctx.lineTo(cx+q1.x,cy+q1.y); ctx.stroke();
    }
  }

  /* 12 secteurs de signes : séparations radiales + étiquettes aux milieux */
  var S=ASTRO.SIGNES;
  for(i=0;i<12;i++){
    var base=i*30;
    var ps=proj(base,r0), pe=proj(base,r1);
    var pm=proj(base,-6); /* séparation vers le centre pour bien voir */
    ctx.strokeStyle="rgba(174,172,206,"+(0.5).toFixed(2)+")";
    ctx.beginPath(); ctx.moveTo(cx+pm.x,cy+pm.y); ctx.lineTo(cx+pe.x,cy+pe.y); ctx.stroke();
    var ml=base+15, pmid=proj(ml,(r0+r1)/2+14);
    var devant=pmid.prof<0;
    ctx.fillStyle="rgba(174,172,206,"+(devant?0.95:0.4).toFixed(2)+")";
    ctx.font="600 14px Figtree, sans-serif";
    ctx.textAlign="center"; ctx.textBaseline="middle";
    ctx.fillText(S[i],cx+pmid.x*1.16,cy+pmid.y*1.16);
  }

  /* planètes : posées sur l'anneau, légèrement au-dessus du plan, triées par profondeur */
  var ps=C.p || [];
  var ordre=ps.slice().sort(function(a,b){return b.proj.prof-a.proj.prof});
  for(i=0;i<ordre.length;i++){
    s=ordre[i];
    /* trait de repère depuis l'anneau vers la pastille */
    ctx.strokeStyle="rgba(246,238,219,0.25)";
    ctx.beginPath(); ctx.moveTo(cx+s.anneau.x,cy+s.anneau.y); ctx.lineTo(cx+s.proj.x,cy+s.proj.y); ctx.stroke();
    /* pastille */
    ctx.beginPath();
    ctx.arc(cx+s.proj.x,cy+s.proj.y,15,0,2*Math.PI);
    ctx.fillStyle=s.retro?"#3a2b3f":"#12132b";
    ctx.fill();
    ctx.strokeStyle=s.retro?"#ff8f7a":"#efc272"; ctx.lineWidth=2; ctx.stroke();
    ctx.fillStyle="#f6eedb"; ctx.font="600 15px Figtree, sans-serif";
    ctx.textAlign="center"; ctx.textBaseline="middle";
    ctx.fillText(s.glyphe,cx+s.proj.x,cy+s.proj.y);
    /* étiquette */
    ctx.font="600 12px Figtree, sans-serif";
    ctx.fillStyle="rgba(174,172,206,0.95)";
    ctx.fillText(s.nom+(s.retro?" ℞":""),cx+s.proj.x,cy+s.proj.y+24);
  }

  /* traits d'aspects entre planètes (au-dessus de l'anneau, sous les pastilles déjà posées) */
  for(i=0;i<ordre.length;i++){
    var a=ordre[i];
    for(var j=i+1;j<ordre.length;j++){
      var b=ordre[j];
      var asp=aspect(a.idx-b.idx);
      if(!asp||asp.n==="conjonction") continue;
      ctx.strokeStyle=asp.c; ctx.globalAlpha=0.75; ctx.lineWidth=1.6; ctx.setLineDash([]);
      ctx.beginPath(); ctx.moveTo(cx+a.proj.x,cy+a.proj.y); ctx.lineTo(cx+b.proj.x,cy+b.proj.y); ctx.stroke();
      ctx.globalAlpha=1;
    }
  }

  /* ascendant : trait pointillé du centre vers le bord gauche de la carte (9 h) */
  if(ASC!==null){
    var pa=proj(ASC,r1*1.05);
    ctx.strokeStyle="#8fd3c8"; ctx.setLineDash([6,5]); ctx.lineWidth=1.6;
    ctx.beginPath(); ctx.moveTo(cx,cy); ctx.lineTo(cx+pa.x,cy+pa.y); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle="#8fd3c8"; ctx.font="600 13px Figtree, sans-serif";
    ctx.textAlign="center";
    ctx.fillText("ASC",cx+pa.x,cy+pa.y-14);
    /* petit repère fixe à gauche (le 9 h du cadran) */
    ctx.fillStyle="rgba(143,211,200,0.5)";
    ctx.fillText("le côté gauche du cadran = l'horizon est",16,h-40);
    ctx.textAlign="left";
  }

  /* rappel discret du zoom */
  ctx.fillStyle="rgba(174,172,206,0.6)"; ctx.font="600 12px Figtree, sans-serif";
  ctx.textAlign="right";
  ctx.fillText("zoom ×"+zoom.toFixed(2),w-16,h-16);
  ctx.textAlign="left";
}

/* ===== lecture rapide ===== */
function lecture(ps){
  var ul=$("c3liste");
  while(ul.firstChild) ul.removeChild(ul.firstChild);
  var i,j,a,b,asp;
  for(i=0;i<ps.length;i++){
    a=ps[i];
    var li=document.createElement("li");
    var b1=document.createElement("b");
    b1.textContent=a.nom+" — "+ASTRO.SIGNES[a.idx]+" "+a.deg.toFixed(0)+"°";
    if(a.retro){var rr=document.createElement("span"); rr.style.color="#ff8f7a"; rr.textContent=" (rétrograde)"; b1.appendChild(rr)}
    var mot=document.createElement("div"); mot.className="why";
    var aspTxt=[];
    for(j=0;j<ps.length;j++){
      if(j===i) continue;
      b=ps[j];
      asp=aspect(a.idx-b.idx);
      if(asp&&asp.n!=="conjonction") aspTxt.push(asp.g+" "+asp.n+" avec "+b.nom);
    }
    mot.textContent=aspTxt.length?aspTxt.join(" · "):"aucun aspect majeur avec les autres planètes";
    li.appendChild(b1); li.appendChild(mot);
    ul.appendChild(li);
  }
}

/* ===== soumission du formulaire ===== */
$("cf3").addEventListener("submit",function(ev){
  ev.preventDefault();
  var dv=$("bd3").value;
  if(!dv){$("c3m").textContent="Donne ta date de naissance.";return}
  var an=+dv.slice(0,4), mo=+dv.slice(5,7), j=+dv.slice(8,10);
  var mid=ASTRO.dn(an,mo,j);
  var ps=ASTRO.planetes(mid);
  var GLYPHE={Soleil:"☀",Lune:"☾",Mercure:"☿",Vénus:"♀",Mars:"♂",Jupiter:"♃",Saturne:"♄"};
  var i,p,hv=$("bh3").value;
  /* orienter la carte : ascendant à gauche, sinon Bélier à gauche */
  ASC=null; yaw=Math.PI;
  if(hv){
    var hh=+hv.slice(0,2), mi=+hv.slice(3,5);
    var dFrac=mid+(hh-1)/24+mi/1440; /* heure locale GT+1 en UT */
    var ad=ascDeg(dFrac,6.5,2.4);
    if(!isNaN(ad)){ASC=ad; yaw=(180-ad)*Math.PI/180}
  }
  for(i=0;i<ps.length;i++){
    p=ps[i];
    p.glyphe=GLYPHE[p.nom]||"●";
    p.proj=proj(p.lon,238*zoom+14);
    p.anneau=proj(p.lon,238*zoom);
  }
  C.p=ps;
  if(ctx){$("c3res").classList.remove("hid");$("c3m").textContent="";dessine();lecture(ps)}
});

/* ===== souris / tactile ===== */
var drag=null;
$("c3").addEventListener("mousedown",function(e){drag={x:e.clientX,y:e.clientY,yaw0:yaw,tilt0:tilt}});
window.addEventListener("mousemove",function(e){
  if(!drag) return;
  yaw=drag.yaw0+(e.clientX-drag.x)*0.008;
  tilt=Math.max(-1.4,Math.min(1.4,drag.tilt0+(e.clientY-drag.y)*0.006));
  desproj(); dessine();
});
window.addEventListener("mouseup",function(){drag=null});
$("c3").addEventListener("touchstart",function(e){if(e.touches.length===1){drag={x:e.touches[0].clientX,y:e.touches[0].clientY,yaw0:yaw,tilt0:tilt}}},{passive:true});
$("c3").addEventListener("touchmove",function(e){
  if(!drag||e.touches.length!==1) return;
  e.preventDefault();
  yaw=drag.yaw0+(e.touches[0].clientX-drag.x)*0.008;
  tilt=Math.max(-1.4,Math.min(1.4,drag.tilt0+(e.touches[0].clientY-drag.y)*0.006));
  desproj(); dessine();
},{passive:false});
$("c3").addEventListener("touchend",function(){drag=null});

/* recalcule les positions projetées (après rotation ou zoom) */
function desproj(){
  var ps=C.p; if(!ps) return;
  var i;
  for(i=0;i<ps.length;i++){ps[i].proj=proj(ps[i].lon,238*zoom+14); ps[i].anneau=proj(ps[i].lon,238*zoom)}
}

/* ===== zoom ===== */
$("c3").addEventListener("wheel",function(e){
  e.preventDefault();
  zoom=Math.max(0.5,Math.min(2.5,zoom+(e.deltaY<0?0.1:-0.1)));
  desproj(); if(C.p) dessine();
},{passive:false});
$("zplus").addEventListener("click",function(){zoom=Math.max(0.5,Math.min(2.5,zoom+0.15));desproj();if(C.p)dessine()});
$("zmoins").addEventListener("click",function(){zoom=Math.max(0.5,Math.min(2.5,zoom-0.15));desproj();if(C.p)dessine()});
$("vue3").addEventListener("click",function(){
  tilt=tilt===0?0.55:0;
  desproj(); if(C.p) dessine();
});

/* ===== démarrage ===== */
var cv=$("c3");
if(cv.getContext){
  ctx=cv.getContext("2d");
  C.w=cv.width; C.h=cv.height;
  /* redessine le scintillement des étoiles tant qu'aucune carte n'est affichée */
  var tic=setInterval(function(){
    if(C.p){clearInterval(tic);return}
    if(ctx) dessine();
  },200);
  dessine();
}
})();
