/* Jours verts et rouges — astrologie décisionnelle.
   Moteur astronomique partagé : assets/astro.js (Soleil, Lune, phases, Mercure rétrograde). */
(function(){
"use strict";
var SIGNS=ASTRO.SIGNES;
var MOIS=["janvier","février","mars","avril","mai","juin","juillet","août","septembre","octobre","novembre","décembre"];
var JSEM=["lundi","mardi","mercredi","jeudi","vendredi","samedi","dimanche"];
var JSEM_C=["lun","mar","mer","jeu","ven","sam","dim"];
function $(id){return document.getElementById(id)}

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
  var sgS=ASTRO.signe(ASTRO.lonSoleil(ASTRO.dn(an,mo,jo)));
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
    var dd0=ASTRO.dn(yan,ymo,j);
    var idxL=ASTRO.signe(ASTRO.lonLune(dd0));
    var el=ASTRO.elong(dd0);
    var cl=classeJour(sgS,idxL,ASTRO.estRx(yan,ymo,j));
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
