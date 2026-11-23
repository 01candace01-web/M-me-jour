/* Jours verts et rouges — astrologie décisionnelle.
   Soleil et Lune : formules astronomiques simplifiées (type Schlyter, précision ~1°).
   Mercure rétrograde : stations réelles issue d'éphémérides exactes (UTC). */
(function(){
"use strict";
var SIGNS=["Bélier","Taureau","Gémeaux","Cancer","Lion","Vierge","Balance","Scorpion","Sagittaire","Capricorne","Verseau","Poissons"];
var MOIS=["janvier","février","mars","avril","mai","juin","juillet","août","septembre","octobre","novembre","décembre"];
var JSEM=["lundi","mardi","mercredi","jeudi","vendredi","samedi","dimanche"];
var JSEM_C=["lun","mar","mer","jeu","ven","sam","dim"];
function $(id){return document.getElementById(id)}
function nrm(x){x%=360;return x<0?x+360:x}
function sn(x){return Math.sin(x*Math.PI/180)}
function cs(x){return Math.cos(x*Math.PI/180)}
function deg(r){return r*180/Math.PI}

/* Nombre de jours écoulés depuis le 31/12/1999 0h TU */
function dn(y,m,d){return 367*y-Math.floor(7*(y+Math.floor((m+9)/12))/4)+Math.floor(275*m/9)+d-730530}

/* Soleil : longitude géocentrique (degrés) */
function lonSoleil(d){
  var M=356.0470+0.9856002585*d, w=282.9404+4.70935e-5*d;
  var C=1.9148*sn(M)+0.02*sn(2*M)+0.0003*sn(3*M);
  return nrm(w+M+C);
}

/* Résolution de l'équation de Kepler */
function kepler(M,e){
  var E=M+e*deg(sn(M))*(1+e*cs(M)), i;
  for(i=0;i<6;i++){E=E-(E-e*deg(sn(E))-M)/(1-e*cs(E))}
  return E;
}

/* Lune : longitude géocentrique (degrés), perturbations principales incluses */
function lonLune(d){
  var N=nrm(125.1228-0.0529538083*d), i=5.1454;
  var w=nrm(318.0634+0.1643573223*d), a=60.2666, e=0.054900;
  var M=nrm(115.3654+13.0649929509*d);
  var E=kepler(M,e);
  var xv=a*(cs(E)-e), yv=a*Math.sqrt(1-e*e)*sn(E);
  var v=nrm(deg(Math.atan2(yv,xv))), r=Math.sqrt(xv*xv+yv*yv);
  var u=nrm(v+w);
  var xh=r*(cs(N)*cs(u)-sn(N)*sn(u)*cs(i));
  var yh=r*(sn(N)*cs(u)+cs(N)*sn(u)*cs(i));
  var lon=nrm(deg(Math.atan2(yh,xh)));
  var Ms=356.0470+0.9856002585*d, ws=282.9404+4.70935e-5*d;
  var Ls=nrm(Ms+ws), Lm=nrm(M+w+N), D=nrm(Lm-Ls), F=nrm(Lm-N);
  lon+=-1.274*sn(M-2*D)+0.658*sn(2*D)-0.186*sn(Ms)-0.059*sn(2*M-2*D)
      -0.057*sn(M-2*D+Ms)+0.053*sn(M+2*D)+0.046*sn(2*D-Ms)+0.041*sn(M-Ms)
      -0.035*sn(D)-0.031*sn(M+Ms)-0.015*sn(2*F-2*D)+0.011*sn(M-4*D);
  return nrm(lon);
}
function signe(lon){return Math.floor(nrm(lon)/30)%12}

/* Mercure rétrograde : plages réelles (stations en UTC), années 2024 à 2031.
   Chaque entrée : [année début, mois, jour, année fin, mois, jour] */
var RX=[
 [2024,4,1, 2024,4,25],[2024,8,5, 2024,8,28],[2024,11,25, 2024,12,15],
 [2025,3,15, 2025,4,7],[2025,7,18, 2025,8,11],[2025,11,9, 2025,11,29],
 [2026,2,26, 2026,3,20],[2026,6,29, 2026,7,23],[2026,10,24, 2026,11,13],
 [2027,2,9, 2027,3,3],[2027,6,10, 2027,7,4],[2027,10,7, 2027,10,28],
 [2028,1,24, 2028,2,14],[2028,5,21, 2028,6,14],[2028,9,19, 2028,10,11],
 [2029,1,7, 2029,1,27],[2029,5,1, 2029,5,25],[2029,9,2, 2029,9,25],[2029,12,22, 2030,1,11],
 [2030,4,13, 2030,5,6],[2030,8,16, 2030,9,8],[2030,12,6, 2030,12,25],
 [2031,3,26, 2031,4,18],[2031,7,29, 2031,8,22],[2031,11,19, 2031,12,9]
];
function numRx(y,m,j){return dn(y,m,j)}
function estRx(y,m,j){
  var n=numRx(y,m,j), i;
  for(i=0;i<RX.length;i++){
    if(n>=numRx(RX[i][0],RX[i][1],RX[i][2]) && n<=numRx(RX[i][3],RX[i][4],RX[i][5]))return true;
  }
  return false;
}

/* Classement d'un jour : {c:"g"|"o"|"r", rx:bool, phase:"", raison:""} */
function classeJour(IdxS,IdxL,rx){
  var ds=(IdxS-IdxL)%12; ds=(ds+12)%12;
  var c,r;
  if(ds===0){c="g";r="Lune dans ton signe : énergie alignée, idéal pour démarrer"}
  else if(ds===4||ds===8){c="g";r="Lune en trine avec ton Soleil (même élément) : les choses coulent"}
  else if(ds===2||ds===10){c="g";r="Lune en sextile avec ton Soleil : occasions à saisir"}
  else if(ds===3||ds===9){c="r";r="Lune au carré de ton Soleil : frictions possibles, ne tranche rien d'important"}
  else if(ds===6){c="r";r="Lune opposée à ton Soleil : tensions relationnelles, garde ton calme"}
  else if(ds===5||ds===7){c="o";r="Aspect neutre : journée de réglages, privilégie la souplesse"}
  else{c="o";r="Journée ordinaire, rien de bloquant"}
  var phase="", note="";
  return {c:c,rx:rx,phase:phase,raison:r+note};
}

/* Groupage des jours consécutifs : [[1,3],[7,7],...] */
function plages(jrs){
  var out=[],i,s=jrs[0],p=jrs[0];
  for(i=1;i<jrs.length;i++){
    if(jrs[i]===p+1){p=jrs[i]}
    else{out.push([s,p]);s=p=jrs[i]}
  }
  if(s!==undefined)out.push([s,p]);
  return out;
}
function dateTxt(y,mi,j){var dt=new Date(y,mi-1,j);return JSEM[(dt.getDay()+6)%7]+" "+j}

$("jj").addEventListener("submit",function(ev){
  ev.preventDefault();
  var dv=$("d").value, mv=$("mv").value, msg=$("m");
  if(!dv||!mv){msg.textContent="Renseigne ta date de naissance et le mois à afficher.";return}
  var an=parseInt(dv.slice(0,4),10), mo=parseInt(dv.slice(5,7),10), jo=parseInt(dv.slice(8,10),10);
  var yan=parseInt(mv.slice(0,4),10), ymo=parseInt(mv.slice(5,7),10);
  if(!an||!yan){msg.textContent="Dates invalides.";return}
  var sgS=signe(lonSoleil(dn(an,mo,jo)));
  var nb=new Date(yan,ymo,0).getDate();
  var cal=$("cal");cal.innerHTML="";
  var t,h;
  for(t=0;t<7;t++){h=document.createElement("div");h.className="dow";h.textContent=JSEM_C[t];cal.appendChild(h)}
  var premier=(new Date(yan,ymo-1,1).getDay()+6)%7;
  for(t=0;t<premier;t++){cal.appendChild(document.createElement("div"))}
  var auj=new Date(),aujour=auj.getDate(),aujmo=auj.getMonth()+1,aujan=auj.getFullYear();
  var gList=[],rList=[],rxList=[];
  var infos={};
  for(var j=1;j<=nb;j++){
    var idxL=signe(lonLune(dn(yan,ymo,j)));
    var dd=dn(yan,ymo,j);
    var el=nrm(lonLune(dd)-lonSoleil(dd));
    var cl=classeJour(sgS,idxL,estRx(yan,ymo,j));
    /* marqueurs de phase : à partir de l'élongation Lune–Soleil */
    cl.phase=el<11.25||el>348.75?"🌑":(Math.abs(el-180)<11.25?"🌕":"");
    if(cl.rx){cl.raison="Mercure rétrograde : relis deux fois avant de signer — "+cl.raison;
      cl.phase=cl.phase||"";
    }
    if(cl.phase==="🌑"&&cl.c==="g"){cl.raison=cl.raison+" — nouvelle lune : moment classique pour lancer"}
    if(cl.phase==="🌕"){if(cl.c==="g"){cl.c="o";cl.raison="pleine lune : émotions fortes, privilégie la prudence — "+cl.raison}}
    infos[j]=cl;
    var cell=document.createElement("div");
    cell.className="day "+cl.c+(cl.rx?" rx":"");
    if(j===aujour&&ymo===aujmo&&yan===aujan)cell.classList.add("today");
    cell.innerHTML="<span class='num'>"+j+"</span>"+(cl.phase?"<span class='mk'>"+cl.phase+"</span>":"")+(cl.rx?"<span class='mk'>Rx</span>":"");
    cell.setAttribute("title",dateTxt(yan,ymo,j)+" — "+cl.raison);
    cal.appendChild(cell);
    if(cl.c==="g")gList.push(j);
    if(cl.c==="r")rList.push(j);
    if(cl.rx)rxList.push(j);
  }
  $("calTitle").textContent=MOIS[ymo-1]+" "+yan;
  $("whoLine").textContent="Ton Soleil : "+SIGNS[sgS]+" — le classement compare la Lune de chaque jour à ton signe.";
  $("best").innerHTML="";$("avoid").innerHTML="";
  var i,p;
  var pages=plages(gList);
  for(i=0;i<pages.length;i++){p=pages[i];
    var li=document.createElement("li");
    li.innerHTML="<b>"+(p[0]===p[1]?dateTxt(yan,ymo,p[0]):"du "+dateTxt(yan,ymo,p[0])+" au "+dateTxt(yan,ymo,p[1]))+"</b><span class='why'>"+infos[p[0]].raison+"</span>";
    $("best").appendChild(li);
  }
  if(!gList.length){var le=document.createElement("li");le.innerHTML="<span class='why'>Aucun jour vert ce mois-ci — patience, le cycle change.</span>";$("best").appendChild(le)}
  pages=plages(rList);
  for(i=0;i<pages.length;i++){p=pages[i];
    var li2=document.createElement("li");
    li2.innerHTML="<b>"+(p[0]===p[1]?dateTxt(yan,ymo,p[0]):"du "+dateTxt(yan,ymo,p[0])+" au "+dateTxt(yan,ymo,p[1]))+"</b><span class='why'>"+infos[p[0]].raison+"</span>";
    $("avoid").appendChild(li2);
  }
  if(!rList.length){var le2=document.createElement("li");le2.innerHTML="<span class='why'>Aucun jour rouge ce mois-ci — profites-en.</span>";$("avoid").appendChild(le2)}
  var pg=plages(rxList),txt;
  if(!rxList.length&&an>=2024&&an<=2031){txt="Bonne nouvelle : Mercure est direct tout le mois. Profites-en pour les grandes signatures."}
  else if(!pg.length){
    txt="Pas de données Mercure intégrées pour ce mois (le tableau couvre 2024–2031). Consulte une éphéméride à jour si le sujet te préoccupe.";
  }else{
    txt="";
    for(i=0;i<pg.length;i++){p=pg[i];
      txt+="Mercure rétrograde "+(p[0]===p[1]?"le "+dateTxt(yan,ymo,p[0]):"du "+dateTxt(yan,ymo,p[0])+" au "+dateTxt(yan,ymo,p[1]))+". ";
    }
    txt+="Pendant ces périodes, la tradition conseille de relire ses documents, reporter les grandes signatures et sauvegarder ses fichiers.";
  }
  $("rxLine").textContent=txt;
  $("res").classList.remove("hid");
  $("res").scrollIntoView({behavior:"smooth"});
});
})();
