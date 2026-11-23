/* Le ciel en direct — positions en temps réel, aspects nataux, horizon local, alertes.
   Moteur astronomique partagé : assets/astro.js. Tout est calculé dans le navigateur. */
(function(){
"use strict";
var SIG=ASTRO.SIGNES;
var EMOJ=["♈","♉","♊","♋","♌","♍","♎","♏","♐","♑","♒","♓"];
var MOIS=["janvier","février","mars","avril","mai","juin","juillet","août","septembre","octobre","novembre","décembre"];
function $(id){return document.getElementById(id)}
function nrm(x){x%=360;return x<0?x+360:x}

var lat=null, lon=null; /* position du visiteur (facultative, jamais envoyée au serveur) */
var natalIdx=null;

/* Identité d'un décalage (en signes entiers) entre deux points du thème */
function nomAspect(ds){
  ds=((ds%12)+12)%12;
  if(ds===0)return "conjonction";
  if(ds===4||ds===8)return "trine";
  if(ds===2||ds===10)return "sextile";
  if(ds===3||ds===9)return "carré";
  if(ds===6)return "opposition";
  return "aspect neutre";
}
function symboleAspect(ds){
  ds=((ds%12)+12)%12;
  if(ds===0)return "⁂";
  if(ds===4||ds===8)return "△";
  if(ds===2||ds===10)return "✶";
  if(ds===3||ds===9)return "□";
  if(ds===6)return "☍";
  return "·";
}

/* Petits textes de transit (clé : planète × aspect) */
var TRANSITS={
 "Lune":{"conjonction":"journée sous ton influence — humeurs à l'écoute, intuition plus forte que d'habitude.",
  "trine":"le courant passe avec tes envies du moment ; profites-en pour avancer en douceur.",
  "sextile":"petites occasions à saisir ; dis oui à ce qui arrive facilement.",
  "carré":"l'humeur va à contre-courant : repousse d'un jour les décisions sensibles.",
  "opposition":"les autres semblent demander ce que tu ne peux pas donner — tempère.",
  "aspect neutre":"rien de spécial : journée de réglage."},
 "Soleil":{"conjonction":"point culminant de ton année solaire : leadership et clarté.",
  "trine":"confiance qui coule de source : bon moment pour initier. ",
  "sextile":"occasions utiles par les rencontres.",
  "carré":"frottements avec des figures d'autorité : recule d'un pas avant de trancher.",
  "opposition":"mi-parcours de l'année : équilibre ce que tu donnes et ce que tu reçois.",
  "aspect neutre":"saison neutre : mets en place, sans forcer."},
 "Mercure":{"conjonction":"tête alignée : négocie, écris, décide.",
  "trine":"idées qui coulent : parfait pour les dossiers.",
  "sextile":"bonnes nouvelles possibles par messages.",
  "carré":"malentendus en série : relis deux fois avant d'envoyer.",
  "opposition":"discussions qui tournent en cercle : mets les choses par écrit.",
  "aspect neutre":"échanges ordinaires."},
 "Vénus":{"conjonction":"charme en hausse : moment favorable pour les relations.",
  "trine":"harmonie qui coule : plaisirs simples, complicité.",
  "sextile":"invitation possible — accepte.",
  "carré":"désirs et budget se disputent : mets les priorités à plat.",
  "opposition":"tensions affectives : écoute avant de répondre.",
  "aspect neutre":"vie affective au repos."},
 "Mars":{"conjonction":"énergie et débrouillardise : fonce, mais compte tes forces.",
  "trine":"force appliquée : match avec tes ambitions.",
  "sextile":"audace utile : propose, tente.",
  "carré":"irritations et impatience : ne force rien aujourd'hui.",
  "opposition":"conflits possibles : choisis tes batailles.",
  "aspect neutre":"énergie dispersée : une chose à la fois."},
 "Jupiter":{"conjonction":"porte qui s'ouvre : agrandis le cadre.",
  "trine":"chance tranquille : lance le projet.",
  "sextile":"occasions de croissance via ton réseau.",
  "carré":"tentation de trop promettre : cadre tes engagements.",
  "opposition":"excès à doser : ce qui grandit doit rester utile.",
  "aspect neutre":"croissance en sourdine."},
 "Saturne":{"conjonction":"épreuve de structure : construis durable, avance lentement — mais avance.",
  "trine":"discipline qui paie : consolide tes routines.",
  "sextile":"travaux de fond qui tiennent.",
  "carré":"le mur est réel : contourne au lieu de foncer dedans.",
  "opposition":"responsabilité à négocier avec l'autre.",
  "aspect neutre":"le temps travaille sans te presser."}
};

/* ===== 1. Positions en direct ===== */
function rendu(){
  var t=new Date();
  var d=ASTRO.dnDate(t);
  $("horloge").textContent="Le "+t.getDate()+" "+MOIS[t.getMonth()]+" "+t.getFullYear()
    +", "+("0"+t.getHours()).slice(-2)+" h "+("0"+t.getMinutes()).slice(-2)+" — heure de ton fuseau, calculée dans ton navigateur.";
  var ps=ASTRO.planetes(d);
  var tb="<table><thead><tr><th>Astre</th><th>Signe</th><th>Degré</th><th>Mouvement</th></tr></thead><tbody>",i,p;
  for(i=0;i<ps.length;i++){
    p=ps[i];
    tb+="<tr><td><b>"+p.nom+"</b></td><td>"+SIG[p.idx]+" "+EMOJ[p.idx]+"</td>"
      +"<td>"+p.deg.toFixed(1)+"°</td>"
      +"<td>"+(p.retro?"<span class='rx'>rétrograde ↺</span>":"direct")+"</td></tr>";
  }
  tb+="</tbody></table>";
  $("ciel").innerHTML=tb;
  var e=ASTRO.elong(d), ph;
  if(e<11.25||e>348.75)ph="Nouvelle lune autour de maintenant : moment classique pour lancer.";
  else if(Math.abs(e-180)<11.25)ph="Pleine lune autour de maintenant : émotions fortes, prudence.";
  else if(e<180)ph="Lune croissante : propice à la construction.";
  else ph="Lune décroissante : propice à la finition et au tri.";
  $("phaseLigne").textContent="Phase du moment : "+ph;
  if(natalIdx!==null)rendeNatal(ps);
  if(lat!==null)renduHorizon(d,ps);
}

/* ===== 2. Aspects nataux ===== */
function rendeNatal(ps){
  $("natalLigne").textContent="Ton Soleil natal : "+SIG[natalIdx]+" "+EMOJ[natalIdx]+".";
  var items=[],i,p,ds;
  for(i=0;i<ps.length;i++){
    p=ps[i];
    ds=((p.idx-natalIdx)%12+12)%12;
    if(p.nom==="Soleil"&&ds===0){
      items.push("<b>Soleil</b> conjoint à ton Soleil natal : retour de Soleil annuel — ta saison.");
      continue;
    }
    var asp=nomAspect(ds), texte=TRANSITS[p.nom]&&TRANSITS[p.nom][asp];
    if(!texte)continue;
    items.push("<b>"+p.nom+"</b> en "+SIG[p.idx]+(p.retro?" (rétrograde)":"")+" — "
      +symboleAspect(ds)+" "+asp+" de ton Soleil natal. "+texte.charAt(0).toUpperCase()+texte.slice(1));
  }
  $("natalListe").innerHTML=items.map(function(x){return "<li>"+x+"</li>"}).join("");
}
$("natalForm").addEventListener("submit",function(ev){
  ev.preventDefault();
  var dv=$("nd").value;
  if(!dv)return;
  var an=parseInt(dv.slice(0,4),10), mo=parseInt(dv.slice(5,7),10), j=parseInt(dv.slice(8,10),10);
  if(!an||!mo||!j)return;
  natalIdx=ASTRO.signe(ASTRO.lonSoleil(ASTRO.dn(an,mo,j)));
  $("natal").classList.remove("hid");
  rendeNatal(ASTRO.planetes(ASTRO.dnDate(new Date())));
});

/* ===== 3. Horizon local (position facultative) ===== */
$("geoBtn").addEventListener("click",function(){
  if(!navigator.geolocation){
    $("geoLigne").textContent="Ton navigateur ne prend pas en charge la géolocalisation.";
    return;
  }
  $("geoLigne").textContent="Demande en cours…";
  navigator.geolocation.getCurrentPosition(function(pos){
    lat=pos.coords.latitude; lon=pos.coords.longitude;
    $("geoLigne").textContent="Position réglée ("+lat.toFixed(1)+"°, "+lon.toFixed(1)+"°) — utilisée localement, jamais envoyée.";
    $("horizon").classList.remove("hid");
    renduHorizon(ASTRO.dnDate(new Date()),ASTRO.planetes(ASTRO.dnDate(new Date())));
  },function(){
    $("geoLigne").textContent="Position refusée ou indisponible — pas grave, le reste de la page marche sans.";
  },{timeout:10000});
});
/* Hauteur approximative : déclinaison + angle horaire local. Retourne vrai si l'astre est au-dessus de l'horizon. */
function auDessusLon(lonEcl,d){
  var eps=23.4393-0.0000004*d;
  var ra=Math.atan2(Math.sin(lonEcl*Math.PI/180)*Math.cos(eps*Math.PI/180),Math.cos(lonEcl*Math.PI/180));
  var dec=ASTRO.declinaison(lonEcl,d);
  var jd=d+2451544.5;
  var lst=nrm(280.46061837+360.98564736629*(jd-2451545)+lon);
  var ha=lst-deg(ra);
  ha=((ha%360)+360)%360; if(ha>180)ha-=360;
  var phi=lat*Math.PI/180, dl=dec*Math.PI/180;
  var sinH=Math.sin(phi)*Math.sin(dl)+Math.cos(phi)*Math.cos(dl)*Math.cos(ha*Math.PI/180);
  return sinH>0;
}
function renduHorizon(d,ps){
  if(lat===null||lon===null)return;
  var items=[],i,p;
  for(i=0;i<ps.length;i++){
    p=ps[i];
    var vis=auDessusLon(p.lon,d);
    items.push("<li><b>"+p.nom+"</b> en "+SIG[p.idx]+(vis?" — <b>au-dessus de ton horizon</b> en ce moment":" — sous ton horizon (se lèvera plus tard)"));
  }
  $("horizonListe").innerHTML=items.join("");
}
/* ===== 4. Notifications du ciel ===== */
function cleVue(k){
  try{
    var v=JSON.parse(localStorage.getItem("mj_alertes")||"[]");
    if(Array.isArray(v))return v;
  }catch(e){}
  return [];
}
function dejaVu(k){
  return cleVue().indexOf(k)!==-1;
}
function marquerVu(k){
  var v=cleVue();
  v.push(k);
  if(v.length>200)v=v.slice(-200);
  try{localStorage.setItem("mj_alertes",JSON.stringify(v))}catch(e){}
}
function notifier(titre,corps,k){
  if(k&&dejaVu(k))return false;
  if(!("Notification" in window)||Notification.permission!=="granted")return false;
  try{new Notification(titre,{})}catch(e){}
  if(k)marquerVu(k);
  return true;
}
/* Événements du ciel : Mercure (tabexact), phase lunaire par traversée, rétrogrades des autres planètes */
function alertes7jours(){
  var out=[],i,j,t0=ASTRO.dnDate(new Date());
  /* Mercure rétrograde : stations dans les 7 jours (tableau exact) */
  var dd=new Date();
  for(i=-1;i<=8;i++){
    var dt=new Date(dd.getTime()+i*86400000);
    var y=dt.getFullYear(),mo=dt.getMonth()+1,j=dt.getDate();
    var avant=A_stRx(y,mo,j-1), auj=A_stRx(y,mo,j), dem=A_stRx(y,mo,j+1);
    if(auj&&!avant)out.push({k:"rxdebut"+y+mo+j,t:"Mercure rétrograde à partir d'aujourd'hui : relis tes documents avant de signer."});
    if(!auj&&avant)out.push({k:"rxfin"+y+mo+j,t:"Mercure redevient direct : les malentendus se dénouent."});
  }
  /* Pleine et nouvelle lune : on balaie jour par jour */
  for(i=0;i<=7;i++){
    var d1=t0+i, d2=t0+i+1;
    var e1=ASTRO.elong(d1), e2=ASTRO.elong(d2);
    var c1=Math.min(e1,360-e1), c2=Math.min(e2,360-e2);
    if(c1>2&&c2<=2)out.push({k:"nl"+Math.floor(d1),t:"Nouvelle lune : bon moment pour lancer un projet."});
    var p1=Math.abs(e1-180), p2=Math.abs(e2-180);
    if(p1>2&&p2<=2)out.push({k:"pl"+Math.floor(d1),t:"Pleine lune : émotions fortes — prudence et patience."});
  }
  /* Rétrogrades des autres planètes (dérivée numérique, jour par jour) */
  var noms=["Vénus","Mars","Jupiter","Saturne"];
  for(var q=0;q<noms.length;q++){
    var prec=ASTRO.retroPlanete(noms[q],Math.floor(t0)-1);
    for(i=0;i<=8;i++){
      var enc=ASTRO.retroPlanete(noms[q],Math.floor(t0)+i);
      if(enc!==prec){
        out.push({k:noms[q]+(enc?"rx":"d")+Math.floor(t0+i),
          t:noms[q]+(enc?" commence une rétrograde":" redevient direct")+" — à un jour près."});
      }
      prec=enc;
    }
  }
  return out;
}
function A_stRx(y,m,j){return ASTRO.estRx(y,m,j)}
function verifierAlertes(){
  if(!("Notification" in window)||Notification.permission!=="granted")return;
  var evs=alertes7jours(),i,n=0;
  for(i=0;i<evs.length;i++){
    if(notifier("Même Jour — ciel",evs[i].t,evs[i].k))n++;
  }
  $("notifLigne").textContent=n?("Notification(s) envoyée(s) : regarde le coin de ton écran."):"Rien de neuf dans les 7 jours — on te préviendra.";
}
$("notifBtn").addEventListener("click",function(){
  if(!("Notification" in window)){$("notifLigne").textContent="Ton navigateur ne prend pas en charge les notifications.";return}
  if(Notification.permission==="granted"){$("notifLigne").textContent="Notifications déjà activées — vérification…";verifierAlertes();return}
  if(Notification.permission==="denied"){$("notifLigne").textContent="Notifications bloquées : débloque-les dans les réglages du site (icône cadenas).";return}
  Notification.requestPermission().then(function(p){
    if(p==="granted"){$("notifLigne").textContent="Activé ! Voici ce qui t'attend :";verifierAlertes()}
    else $("notifLigne").textContent="Demande refusée — tu pourras réessayer plus tard.";
  });
});
if("Notification" in window&&Notification.permission==="granted"){
  verifierAlertes();
}

/* ===== 5. Inscription au rappel quotidien par e-mail ===== */
$("rappelForm").addEventListener("submit",function(ev){
  ev.preventDefault();
  var mail=$("remail").value.trim();
  $("rmsg").textContent="Inscription en cours…";
  fetch("api.php?action=rappel_add",{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({email:mail,signe:$("rsigne").value.trim()})
  }).then(function(r){return r.json()}).then(function(j){
    if(j.ok){$("rmsg").textContent="Inscription confirmée ! Ton premier e-mail arrivera demain matin (une fois le site en ligne et l'envoi d'e-mails configuré).";$("rappelForm").reset()}
    else $("rmsg").textContent=j.error||"Inscription impossible pour le moment.";
  }).catch(function(){$("rmsg").textContent="L'inscription a besoin du serveur (api.php) — sur ta copie XAMPP, démarre Apache et MySQL."});
});

rendu();
setInterval(rendu,30000);
})();
