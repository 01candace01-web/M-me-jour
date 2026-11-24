/* Journal d'humeur — page journal.html. Jeton anonyme en localStorage, sauvegarde via api.php,
   miroir local en cas de base indisponible, corrélations calculées côté navigateur. */
(function(){
"use strict";
var EMPJ=["😞","😕","😐","🙂","😄"];
var MOTS=["difficile","moyenne","neutre","bonne","excellente"];
var JSEM=["lundi","mardi","mercredi","jeudi","vendredi","samedi","dimanche"];
function $(id){return document.getElementById(id)}

/* Jeton anonyme (48 hex) */
function token(){
  var t="";
  try{
    t=localStorage.getItem("mj_jtok")||"";
    if(!t){
      var b=new Uint8Array(24);(window.crypto||{getRandomValues:function(a){for(var i=0;i<a.length;i++)a[i]=Math.floor(Math.random()*256)}}).getRandomValues(b);
      var i,s="";for(i=0;i<b.length;i++)s+=("0"+b[i].toString(16)).slice(-2);
      t=s;localStorage.setItem("mj_jtok",t);
    }
  }catch(e){t="0123456789abcdef0123456789abcdef0123456789abcdef"}
  return t;
}
function lsGet(k,d){try{var v=localStorage.getItem(k);return v?JSON.parse(v):d}catch(e){return d}}
function lsSet(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}

var ENTRIES=lsGet("mj_journal",[]);      /* miroir local : [{jour,humeur,note,signe,lune,phase,retro}] */
var LOCAL_ONLY=false;

/* Date ISO locale (pas UTC) */
function iso(d){return d.getFullYear()+"-"+("0"+(d.getMonth()+1)).slice(-2)+"-"+("0"+d.getDate()).slice(-2)}
function jourInfo(ymd){
  var p=ymd.split("-"), dd=ASTRO.dn(+p[0],+p[1],+p[2]);
  var sgn=ASTRO.signe(ASTRO.lonLune(dd));
  return {lune:ASTRO.SIGNES[sgn], phase:ASTRO.phase(dd), croiss:ASTRO.elong(dd)<180, rx:ASTRO.estRx(+p[0],+p[1],+p[2])};
}
function soleilInfo(){ /* renvoie l'index du signe solaire selon la date de naissance en #bd */
  var v=$("bd").value;
  if(!v)return null;
  var p=v.split("-"), i=ASTRO.signe(ASTRO.lonSoleil(ASTRO.dn(+p[0],+p[1],+p[2])));
  try{localStorage.setItem("mj_jbirth",v)}catch(e){}
  return i;
}

/* ===== Humeurs : boutons 1-5 ===== */
var SEL=3;
(function(){
  var box=$("moody"),i;
  for(i=0;i<5;i++){
    (function(k){
      var b=document.createElement("button");
      b.type="button";b.className="mood";b.setAttribute("role","radio");
      b.innerHTML=EMPJ[k]+"<span>"+MOTS[k]+"</span>";
      b.addEventListener("click",function(){SEL=k+1;marque()});
      box.appendChild(b);
    })(i);
  }
  function marque(){
    var all=box.querySelectorAll(".mood");
    for(var i=0;i<all.length;i++)all[i].classList.toggle("on",i===SEL-1);
  }
  marque();
})();

/* ===== Date par défaut = aujourd'hui; naissance mémorisée ===== */
$("jdate").value=iso(new Date());
var bdSave=lsGet("mj_jbirth","");
if(bdSave)$("bd").value=bdSave;
$("bd").addEventListener("change",function(){soleilInfo();rendre()});

async function charger(){
  try{
    var r=await fetch("api.php?action=journal_get&token="+encodeURIComponent(token()));
    var j=await r.json();
    if(j&&j.ok){
      LOCAL_ONLY=false;$("dbWarn").classList.add("hid");
      /* fusion : le serveur gagne, on met à jour le miroir */
      var vue={};ENTRIES.forEach(function(e){vue[e.jour]=e});
      j.entries.forEach(function(e){vue[e.jour]={jour:e.jour,humeur:+e.humeur,note:e.note||"",signe:e.signe||"",lune:e.lune||"",phase:e.phase||"",retro:+e.retro}});
      ENTRIES=Object.values(vue);lsSet("mj_journal",ENTRIES);
    }else{localOnly("La base n'est pas joignable : ton journal fonctionne en local (ce navigateur uniquement).")}
  }catch(e){localOnly("La base n'est pas joignable : ton journal fonctionne en local (ce navigateur uniquement).")}
  rendre();
}
function localOnly(msg){LOCAL_ONLY=true;$("dbWarn").textContent=msg;$("dbWarn").classList.remove("hid")}

$("jform").addEventListener("submit",async function(ev){
  ev.preventDefault();
  var m=$("m"), jour=$("jdate").value, note=$("jnote").value.trim();
  if(!jour){m.textContent="Choisis une date.";return}
  var info=jourInfo(jour);
  var si=soleilInfo();
  var payload={token:token(),jour:jour,humeur:SEL,note:note,
      signe:si===null?"":ASTRO.SIGNES[si],lune:info.lune,phase:info.phase,retro:info.rx?1:0};
  m.textContent="Enregistrement…";
  try{
    var r=await fetch("api.php?action=journal_save",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
    var j=await r.json();
    if(!j||!j.ok){m.textContent=j&&j.error?j.error:"Enregistrement impossible.";}
    else{
      m.textContent="✓ Ton jour est enregistré — humeur "+MOTS[SEL-1]+", Lune en "+info.lune+(info.phase==="🌑"?" (nouvelle lune)":info.phase==="🌕"?" (pleine lune)":"")+(info.rx?", Mercure rétrograde":"")+".";
      maj(jour,payload);rendre();
    }
  }catch(e){
    m.textContent="Base inaccessible : jour gardé uniquement dans ce navigateur.";
    maj(jour,payload);rendre();
  }
});
function maj(jour,p){
  var e={jour:jour,humeur:p.humeur,note:p.note,signe:p.signe,lune:p.lune,phase:p.phase,retro:p.retro};
  var vue={};ENTRIES.forEach(function(x){vue[x.jour]=x});vue[jour]=e;
  ENTRIES=Object.values(vue).sort(function(a,b){return a.jour<b.jour?-1:1});
  lsSet("mj_journal",ENTRIES);
}

/* ===== Rendu ===== */
function rendre(){
  var L=$("list"),i;
  L.innerHTML="";
  ENTRIES.sort(function(a,b){return a.jour<b.jour?1:-1});
  for(i=0;i<Math.min(ENTRIES.length,15);i++){L.appendChild(une(ENTRIES[i]))}
  $("countLine").textContent=ENTRIES.length?("("+ENTRIES.length+" jour"+(ENTRIES.length>1?"s":"")+" notés — 15 derniers affichés)"):"";
  corriger();
  $("res").classList.remove("hid");
}
function une(e){
  var li=document.createElement("li"),info;
  li.innerHTML="<b>"+e.jour+" — "+EMPJ[e.humeur-1]+" "+MOTS[Math.max(0,Math.min(4,e.humeur-1))]+"</b><span class='why'>"+
    "Lune en "+(e.lune||"?")+(e.phase==="🌑"?" (🌑 nouvelle)":e.phase==="🌕"?" (🌕 pleine)":"")+
    (e.retro?" · Rx Mercure":"")+(e.note?" · "+e.note.replace(/&/g,"&amp;").replace(/</g,"&lt;"):"")+"</span>";
  var b=document.createElement("button");b.type="button";b.className="del";b.textContent="Supprimer";
  b.addEventListener("click",async function(){
    try{await fetch("api.php?action=journal_delete",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({token:token(),jour:e.jour})})}catch(_e){}
    ENTRIES=ENTRIES.filter(function(x){return x.jour!==e.jour});lsSet("mj_journal",ENTRIES);rendre();
  });
  li.appendChild(b);
  return li;
}

/* ===== Corrélations ===== */
function classe(iLune,iSoleil){
  var ds=(iSoleil-iLune)%12;ds=(ds+12)%12;
  if(ds===0||ds===4||ds===8||ds===2||ds===10)return "vert";
  if(ds===3||ds===9||ds===6)return "rouge";
  return "orange";
}
function moy(a){var s=0,i;for(i=0;i<a.length;i++)s+=a[i];return a.length?s/a.length:0}
function corriger(){
  var C=$("corr");C.innerHTML="";
  if(ENTRIES.length<5){
    $("corrNote").textContent="Note encore quelques jours (au moins 5) : les moyennes n'ont aucun sens avant ça.";
    return;
  }
  $("corrNote").textContent="Moyennes calculées sur tes "+ENTRIES.length+" jours notés. Une différence de 1 point peut déjà être un vrai motif.";
  var si=soleilInfo();
  /* 1. par phase lunaire */
  var ph={"Autour de la nouvelle lune 🌑":[],"Lune croissante":"",
          "Autour de la pleine lune 🌕":[],"Lune décroissante":""};
  ph["Lune croissante"]=[];ph["Lune décroissante"]=[];
  ENTRIES.forEach(function(e){
    var dd=ASTRO.elong(ASTRO.dn(+e.jour.slice(0,4),+e.jour.slice(5,7),+e.jour.slice(8,10)));
    if(dd<45||dd>315)ph["Autour de la nouvelle lune 🌑"].push(e.humeur);
    else if(dd<135)ph["Lune croissante"].push(e.humeur);
    else if(dd<225)ph["Autour de la pleine lune 🌕"].push(e.humeur);
    else ph["Lune décroissante"].push(e.humeur);
  });
  /* 2. par classe Lune/Soleil ; 3. par jour de semaine ; 4. par Mercure */
  var cls={vert:[],orange:[],rouge:[]},sem=[[],[],[],[],[],[],[]],rx={oui:[],non:[]};
  ENTRIES.forEach(function(e){
    var dt=new Date(e.jour+"T12:00:00"),wd=(dt.getDay()+6)%7;
    sem[wd].push(e.humeur);
    (e.retro?rx.oui:rx.non).push(e.humeur);
    if(si!==null&&e.signe){
      var iL=ASTRO.SIGNES.indexOf(e.lune);
      if(iL>=0)cls[classe(iL,si)].push(e.humeur);
    }
  });
  var bloc=document.createElement("div");bloc.className="corr";
  bloc.appendChild(ligne("Par phase lunaire",ph,function(k){return k+" : "+moy(ph[k]).toFixed(1)+" ("+ph[k].length+" j)"}));
  if(si!==null){
    var cl={};
    ["vert","orange","rouge"].forEach(function(k){cl[k+"s 🟢🟠🔴"]=cls[k]});
    bloc.appendChild(ligne("Selon ton Soleil ("+ASTRO.SIGNES[si]+")",cl,function(k){return k+" : "+moy(cl[k]).toFixed(1)+" ("+cl[k].length+" j)"}));
  }else{
    var p2=document.createElement("p");p2.className="why";p2.textContent="Renseigne ta date de naissance en haut pour croiser avec ton signe solaire.";
    bloc.appendChild(p2);
  }
  bloc.appendChild(ligne("Par jour de semaine",{"lundi":sem[0],"mardi":sem[1],"mercredi":sem[2],"jeudi":sem[3],"vendredi":sem[4],"samedi":sem[5],"dimanche":sem[6]},
    function(k){return k+" : "+moy(sem[JSEM.indexOf(k)]).toFixed(1)}));
  var rxB={};rxB["Mercure rétrograde"]=rx.oui;rxB["Mercure direct"]=rx.non;
  bloc.appendChild(ligne("Selon Mercure",rxB,function(k){return k+" : "+moy(rxB[k]).toFixed(1)+" ("+rxB[k].length+" j)"}));
  C.appendChild(bloc);
}
function ligne(titre,dic,fmt){
  var d=document.createElement("div");d.className="cgr";
  var h=document.createElement("h3");h.textContent=titre;d.appendChild(h);
  Object.keys(dic).forEach(function(k){
    if(dic[k].length){
      var p=document.createElement("p");p.textContent=fmt(k);d.appendChild(p);
    }
  });
  return d;
}

charger();
})();
