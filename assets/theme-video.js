/* Thème astral en vidéo — animation dessinée sur canvas, exportable en .webm via MediaRecorder.
   Moteur partagé : assets/astro.js. Tout est généré dans le navigateur. */
(function(){
"use strict";
function $(id){return document.getElementById(id)}
var SIG=ASTRO.SIGNES;
var EMOJ=["♈","♉","♊","♋","♌","♍","♎","♏","♐","♑","♒","♓"];
var ELEM=["feu","terre","air","eau"];
var MOIS=["janvier","février","mars","avril","mai","juin","juillet","août","septembre","octobre","novembre","décembre"];

var cv=$("vc"),ctx=cv.getContext("2d");
var scenes=[],t0=0,lecture=false,raf=null;
var DUREE_SCENE=5200; /* millisecondes par scène */

/* étoiles fixes du fond (constantes : la même scène ne « grésille » pas) */
var etoiles=[];
(function(){
  for(var i=0;i<90;i++)etoiles.push([Math.random(),Math.random(),Math.random()*1.4+0.3,Math.random()*6.28]);
})();

function fond(t){
  var g=ctx.createLinearGradient(0,0,0,540);
  g.addColorStop(0,"#14122b");g.addColorStop(1,"#1c1a38");
  ctx.fillStyle=g;ctx.fillRect(0,0,960,540);
  for(var i=0;i<etoiles.length;i++){
    var e=etoiles[i];
    ctx.globalAlpha=0.35+0.35*Math.sin(t/900+e[3]);
    ctx.fillStyle="#ffe9a8";
    ctx.beginPath();ctx.arc(e[0]*960,e[1]*540,e[2],0,6.28);ctx.fill();
  }
  ctx.globalAlpha=1;
}
function titre(txt,y,size,couleur,alpha){
  ctx.globalAlpha=alpha;
  ctx.fillStyle=couleur||"#f5ecd7";
  ctx.font="800 "+size+"px Fraunces, Georgia, serif";
  ctx.textAlign="center";
  ctx.fillText(txt,y);
  ctx.globalAlpha=1;
}
function sous(txt,y,alpha){
  ctx.globalAlpha=alpha;
  ctx.fillStyle="#b9b2d6";
  ctx.font="400 26px Figtree, sans-serif";
  ctx.textAlign="center";
  ctx.fillText(txt,y);
  ctx.globalAlpha=1;
}
function glyphe(car,x,y,size,alpha){
  ctx.globalAlpha=alpha;
  ctx.fillStyle="#e8b04b";
  ctx.font=size+"px serif";
  ctx.textAlign="center";
  ctx.textBaseline="middle";
  ctx.fillText(car,x,y);
  ctx.textBaseline="alphabetic";
  ctx.globalAlpha=1;
}
function anneau(x,y,r,alpha){
  ctx.globalAlpha=alpha*0.5;
  ctx.strokeStyle="#8f86b8";
  ctx.lineWidth=2;
  ctx.beginPath();ctx.arc(x,y,r,0,6.28);ctx.stroke();
  ctx.globalAlpha=1;
}

function dessine(num,avancement){
  var sc=scenes[num];
  if(!sc)return false;
  /* entrée : 0→1 sur les 800 premières ms ; sortie sur les 400 dernières */
  var ent=Math.min(avancement/800,1), sor=avancement>DUREE_SCENE-400?(DUREE_SCENE-avancement)/400:1;
  var al=Math.min(1,ent+sor-1); al=Math.max(0,al); al=al*al*(3-2*al); /* lissage */
  fond(Date.now());
  anneau(480,220,150,al);
  glyphe(sc.g,480,220,150*(0.85+0.15*ent),al);
  if(sc.titre)titre(sc.titre,426,42,"#f5ecd7",al);
  if(sc.lignes){
    for(var i=0;i<sc.lignes.length;i++)sous(sc.lignes[i],470+i*38,al);
  }
  ctx.globalAlpha=0.55*al;
  ctx.fillStyle="#8f86b8";
  ctx.font="400 18px Figtree, sans-serif";
  ctx.textAlign="center";
  ctx.fillText("Même Jour — "+sc.pied,480,515);
  ctx.globalAlpha=1;
  return true;
}

function boucle(){
  if(!lecture)return;
  var num=Math.floor((Date.now()-t0)/DUREE_SCENE);
  var av=(Date.now()-t0)%DUREE_SCENE;
  if(!dessine(num,av)){
    lecture=false;
    $("playBtn").textContent="▶ Revoir";
    $("vstatus").textContent="Fin de la vidéo.";
    return;
  }
  $("vstatus").textContent="Scène "+(num+1)+" / "+scenes.length;
  raf=requestAnimationFrame(boucle);
}
$("playBtn").addEventListener("click",function(){
  if(lecture){lecture=false;cancelAnimationFrame(raf);$("playBtn").textContent="▶ Reprendre";return}
  if(scenes.length===0)return;
  t0=Date.now();
  lecture=true;
  $("playBtn").textContent="❚❚ Pause";
  boucle();
});

/* ===== construction des scènes depuis la naissance ===== */
$("vf").addEventListener("submit",function(ev){
  ev.preventDefault();
  var dv=$("vd").value;
  if(!dv){$("vm").textContent="Donne ta date de naissance.";return}
  var an=+dv.slice(0,4),mo=+dv.slice(5,7),j=+dv.slice(8,10);
  var mid=ASTRO.dn(an,mo,j);
  var nom=$("vnom").value.trim();
  var iS=ASTRO.signe(ASTRO.lonSoleil(mid));
  var iL=ASTRO.signe(ASTRO.lonLune(mid));
  var iV=ASTRO.signe(ASTRO.lonPlanete("Vénus",mid));
  var iM=ASTRO.signe(ASTRO.lonPlanete("Mars",mid));
  var iJ=ASTRO.signe(ASTRO.lonPlanete("Jupiter",mid));
  var iSa=ASTRO.signe(ASTRO.lonPlanete("Saturne",mid));
  var hu=$("vh").value, ascIdx=null;
  if(hu){/* ascendant approché : heure locale supposée GT+1, latitude Bénin (6,5° N approx) */
    var hh=+hu.slice(0,2),mi=+hu.slice(3,5);
    var dF=mid+(hh-1)/24+mi/1440;
    ascIdx=ascendant(dF,6.5,2.4);
  }
  scenes=[
    {g:"✨",titre:nom?("Thème de "+nom):"Ton thème",lignes:["né·e le "+j+" "+MOIS[mo-1]+" "+an],pied:"généré dans ton navigateur"},
    {g:EMOJ[iS],titre:"Soleil en "+SIG[iS],lignes:["élément "+ELEM[iS%4]+" — ton moteur, là où tu cherches à briller"],pied:"Soleil natal"},
    {g:EMOJ[iL],titre:"Lune en "+SIG[iL],lignes:["ce qui te rassure, ton rythme intérieur, tes atmosphères"],pied:"Lune natale"},
    {g:EMOJ[iV],titre:"Vénus en "+SIG[iV]+" · Mars en "+SIG[iM],lignes:["Vénus : toi qui aimes · Mars : toi qui agis"],pied:"les deux accélérateurs"},
    {g:"♃",titre:"Jupiter en "+SIG[iJ]+" · Saturne en "+SIG[iSa],lignes:["ce qui s'ouvre · ce qui exige du cadre"],pied:"les planètes lentes"}
  ];
  if(ascIdx!==null)scenes.splice(3,0,{g:"↑",titre:"Ascendant en "+SIG[ascIdx],lignes:["approximatif : heure et lieu précis affineraient le calcul"],pied:"ascendant"});
  scenes.push({g:"✨",titre:"À retenir",lignes:["des tendances symboliques, jamais des destins","le dernier mot t'appartient"],pied:"Même Jour"});
  t0=0;lecture=false;cancelAnimationFrame(raf);
  $("playBtn").textContent="▶ Lire";
  $("vres").classList.remove("hid");
  $("vstatus").textContent="Prête : appuie sur Lire.";
  dessine(0,300); /* affiche la première scène en pause */
});

/* Ascendant par formule classique (précision de quelques degrés) */
function ascendant(d,latDeg,lonEstDeg){
  var jd=d+2451544.5;
  var eps=23.4393-0.0000004*d;
  var lst=((280.46061837+360.98564736629*(jd-2451545)+lonEstDeg)%360+360)%360;
  var asc=Math.atan2(Math.cos(lst*Math.PI/180),
    -(Math.sin(lst*Math.PI/180)*Math.cos(eps*Math.PI/180)+Math.tan(latDeg*Math.PI/180)*Math.sin(eps*Math.PI/180)));
  return Math.floor(((asc*180/Math.PI+360)%360)/30)%12;
}

/* ===== export .webm (si le navigateur le permet) ===== */
$("recBtn").addEventListener("click",function(){
  if(!scenes.length){$("vstatus").textContent="Fabrique d'abord la vidéo.";return}
  if(!cv.captureStream||!window.MediaRecorder){
    $("vstatus").textContent="Ton navigateur ne permet pas l'export vidéo — la lecture ici reste complète.";
    return;
  }
  var rec;
  try{rec=new MediaRecorder(cv.captureStream(30),{mimeType:"video/webm"})}
  catch(e){$("vstatus").textContent="Export vidéo indisponible sur ce navigateur.";return}
  var morceaux=[];
  rec.ondataavailable=function(e){if(e.data)morceaux.push(e.data)};
  rec.onstop=function(){
    var blob=new Blob(morceaux,{type:"video/webm"});
    var a=document.createElement("a");
    a.href=URL.createObjectURL(blob);
    a.download="mon-theme-memejour.webm";
    document.body.appendChild(a);a.click();document.body.removeChild(a);
    $("vstatus").textContent="Vidéo téléchargée (.webm).";
  };
  rec.start();
  t0=Date.now();
  var fin=t0+scenes.length*DUREE_SCENE;
  function film(){
    var auj=Date.now();
    if(auj>=fin){rec.stop();$("vstatus").textContent="Finalisation…";return}
    dessine(Math.floor((auj-t0)/DUREE_SCENE),(auj-t0)%DUREE_SCENE);
    $("vstatus").textContent="Enregistrement : scène "+(Math.floor((auj-t0)/DUREE_SCENE)+1)+" / "+scenes.length+" — ne quitte pas l'onglet.";
    requestAnimationFrame(film);
  }
  film();
});
})();
