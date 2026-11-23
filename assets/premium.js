/* Rapport de naissance complet — page premium.
   Paiement Mobile Money via FedaPay (le serveur crée la transaction et confirme
   par webhook) ; ici on ne fait que : afficher les offres, rediriger vers la
   caisse, vérifier la référence au retour, et générer le rapport débloqué. */
(function(){
"use strict";
function $(id){return document.getElementById(id)}
var API="api.php";
var MOIS=["janvier","février","mars","avril","mai","juin","juillet","août","septembre","octobre","novembre","décembre"];
var CLE_ACCES="mj_acces_ref";

/* ===== petites briques ===== */
function fcfa(n){return n.toLocaleString("fr-FR")+" F"}
function waLien(msg){return "https://wa.me/"+String(WhatsApp).replace(/\D/g,"")+"?text="+encodeURIComponent(msg)}

var WhatsApp="",configure=false;

/* ===== 1. afficher les offres ===== */
function chargeOffres(){
  return fetch(API+"?action=offres").then(function(r){return r.json()}).then(function(j){
    if(!j.ok) return;
    configure=!!j.configure;
    WhatsApp=j.whatsapp||"";
    var c=$("offres");
    while(c.firstChild) c.removeChild(c.firstChild);
    var desc={
      rapport:"Toutes tes planètes expliquées, ta liste complète d'aspects, tes jours favorables du mois. Accès 30 jours.",
      annee:"Le rapport complet, plus ton calendrier des mois favorables sur 12 mois. Accès un an."
    };
    j.offres.forEach(function(o){
      var art=document.createElement("article");
      art.className="card poche";
      var b=document.createElement("b");
      b.textContent=o.label;
      var prix=document.createElement("div");
      prix.className="prix big";
      prix.textContent=fcfa(o.montant);
      var d=document.createElement("span");
      d.textContent=desc[o.cle]||"";
      var btn=document.createElement("button");
      btn.type="button";
      btn.textContent="Payer par Mobile Money";
      btn.addEventListener("click",function(){acheter(o.cle)});
      art.appendChild(b);art.appendChild(prix);art.appendChild(d);art.appendChild(btn);
      c.appendChild(art);
    });
    if(!configure&&WhatsApp){
      var p=document.createElement("p");
      p.className="note";
      p.appendChild(document.createTextNode("Le paiement en ligne n'est pas encore activé sur ce site : écris-nous et on débloque ton accès. "));
      var a=document.createElement("a");
      a.href=waLien("Bonjour, je veux le rapport de naissance complet.");
      a.setAttribute("rel","noopener");
      a.textContent="Discuter sur WhatsApp";
      p.appendChild(a);
      c.appendChild(p);
    }
  }).catch(function(){});
}

/* ===== 2. acheter (redirige vers la caisse FedaPay) ===== */
function acheter(cle){
  $("omsg").textContent="Préparation du paiement…";
  fetch(API+"?action=commande_add",{
    method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({produit:cle})
  }).then(function(r){return r.json()}).then(function(j){
    if(j.ok&&j.url){window.location.href=j.url;return}
    $("omsg").textContent=j.error||"Achat impossible pour le moment.";
    if(j.whatsapp){
      var a=document.createElement("a");
      a.href=waLien("Bonjour, je veux acheter : "+cle);
      a.setAttribute("rel","noopener");
      a.textContent=" Finaliser sur WhatsApp";
      $("omsg").appendChild(a);
    }
  }).catch(function(){$("omsg").textContent="Connexion impossible. Vérifie ta connexion internet."});
}

/* ===== 3. référence : URL de retour ou entrée manuelle ===== */
function refDepuisURL(){
  var m=location.search.match(/[?&]ref=([A-Za-z0-9]{12})/);
  return m?m[1].toUpperCase():null;
}
function refEnMemoire(){return localStorage.getItem(CLE_ACCES)}

/* une question au serveur : la référence est-elle payée et non expirée ? */
function verifierStatut(ref,silencieux){
  return fetch(API+"?action=acces_statut&ref="+encodeURIComponent(ref)).then(function(r){return r.json()}).then(function(j){
    if(!j.ok){if(!silencieux)$("refMsg").textContent=j.error||"Référence inconnue.";return false}
    if(j.paye){
      localStorage.setItem(CLE_ACCES,ref);
      debloque(j.expire,j.produit);
      return true;
    }
    if(!silencieux) $("refMsg").textContent="Cette référence existe mais le paiement n'est pas encore confirmé.";
    return false;
  }).catch(function(){return false});
}

/* au retour de la caisse : on surveille (le webhook peut mettre quelques secondes) */
function surveillerRef(ref){
  $("omsg").textContent="Paiement en cours de confirmation… Ne ferme pas la page.";
  var essais=0;
  var tick=setInterval(function(){
    essais++;
    verifierStatut(ref,true).then(function(paye){
      if(paye){clearInterval(tick);$("omsg").textContent="";return}
      if(essais>30){
        clearInterval(tick);
        $("omsg").textContent="";
        $("refMsg").textContent="Pas encore confirmé. Dans une minute, entre ta référence : "+ref;
        $("retourRef").classList.remove("hid");
        $("refIn").value=ref;
      }
    });
  },4000);
}

$("refBtn").addEventListener("click",function(){
  var v=($("refIn").value||"").trim().toUpperCase();
  if(!/^[A-Z0-9]{12}$/.test(v)){$("refMsg").textContent="Une référence fait 12 caractères (ex : 4F7A2B90C1D3).";return}
  $("refMsg").textContent="Vérification…";
  verifierStatut(v,false);
});

/* ===== 4. déblocage ===== */
function debloque(expire,produit){
  $("zoneAcces").classList.remove("hid");
  $("retourRef").classList.remove("hid");
  $("accesInfo").textContent="Accès actif"+(expire?" jusqu'au "+expire:"")
    +(produit&&produit!=="rapport"?" (offre « ton année favorable » : le calendrier des 12 mois est inclus plus bas)":"")+".";
}

/* ===== 5. génération du rapport complet ===== */
/* Le rapport dit d'abord le fait (position calculée réellement), puis une
   lecture symbolique courte, puis un réflexe concret. Les textes dépendent de
   l'élément (feu/terre/air/eau) et du mode (cardinal/fixe/mutable). */
var ELEM=["feu","terre","air","eau"];
var ELEM_TXT=[
"tu démarres vite et tu as besoin d'une cible claire ; ton risque, c'est l'étincelle qui s'éteint sans suite.",
"tu construis lentement et tu ne lâches que si la base est solide ; ton risque, c'est l'obstination par habitude.",
"tu comprends en parlant et en reliant les idées ; ton risque, c'est la dispersion entre dix projets à la fois.",
"tu ressens avant de savoir, et tu retiens tout ; ton risque, c'est de décider sous le coup de l'émotion."];
var MODA=["cardinal","fixe","mutable"];
var MODA_TXT=[
"Ta préférence naturelle : ouvrir des portes — tu vas vers les commencements, tu décides, tu engages.",
"Ta préférence naturelle : tenir une position — tu approfondis, tu cultives un domaine, tu rends solide ce que tu as lancé.",
"Ta préférence naturelle : t'adapter — tu apprends sans cesse, tu changes d'angle, tu transformes plutôt que de fonder."];
var PLAN_TXT={
"Vénus":["Ton style d'affection est direct et chaleureux : tu t'attaches en agissant, et tu crées du lien en partageant des activités.",
"Ton style d'affection est posé et fidèle : tu prouves le lien par la constance, pas par les grands mots.",
"Ton style d'affection passe par l'échange : les conversations, l'humour et la curiosité partagée sont ta langue.",
"Ton style d'affection est profond : quand tu donnes ta confiance, c'est sur la durée — et les ruptures laissent des traces."],
"Mars":["Tu passes à l'action avant d'avoir fini de réfléchir : ta force, c'est l'initiative ; ton garde-fou, c'est d'attendre 10 minutes avant de trancher.",
"Tu connais la valeur d'un effort régulier : tu avances pas à pas, et peu de choses résistent à ta patience.",
"Tu règles les choses par l'information : un argument vaut mieux qu'un bras de fer, mais attention à ne jamais couper la discussion.",
"Tu avances quand ça compte émotionnellement : ta ténacité est réelle, mais l'humeur peut te bloquer — externalise avant de décider."],
"Jupiter":["Ta chance grandit quand tu oses : les projets visibles, les déplacements et la formation sont tes points d'appui.",
"Ta chance grandit dans la durée : le patrimoine, la terre, l'épargne rigide et le savoir-faire accumulé te servent.",
"Ta chance grandit par le réseau : associations, quartier, langues, commerce — parle de tes projets souvent.",
"Ta chance grandit dans l'entraide : familles, communautés, celui qui aide chez toi — ce que tu sèmes pour les autres te revient."],
"Saturne":["Ton grand chantier de vie : transformer l'impulsivité en stratégie. Là où tu brûles, apprends à chauffer.",
"Ton grand chantier de vie : accepter le changement sans le craindre. Ce que tu lâches un jour te revient l'autre.",
"Ton grand chantier de vie : finir ce que tu commences. Ton esprit saute de l'un à l'autre — choisis deux priorités et ancre-les.",
"Ton grand chantier de vie : nommer ce que tu ressens au lieu de le laisser déborder. Écris-le, dis-le, ça s'apaise."]};
var ASC_TXT=["Tu arrives direct et on te remarque vite.","Tu arrives posé et on te fait confiance.",
"Tu arrives curieux et on te parle volontiers.","Tu arrives attentif et on se confie à toi."];

function sig(i){return ASTRO.SIGNES[((i%12)+12)%12]}

function bloc(titre,html){
  var h=document.createElement("h3");
  h.textContent=titre;
  var p=document.createElement("p");
  p.innerHTML=html;
  return [h,p];
}

function ecrisRapport(nat,ev){
  var R=$("rapport");
  while(R.firstChild) R.removeChild(R.firstChild);
  function add(noeuds){noeuds.forEach(function(n){R.appendChild(n)})}
  var E=ELEM_TXT, M=MODA_TXT, P=PLAN_TXT;

  add(bloc("En un mot","Né(e) le <b>"+ev.dateTxt+"</b>"+(ev.heureTxt?" à "+ev.heureTxt+" (heure locale)":"")+" — "+ev.resume+"."));

  var s=nat.soleil;
  add(bloc("Soleil en "+sig(s.idx),"<b>"+sig(s.idx)+"</b> est un signe de <b>"+ELEM[s.idx%4]+"</b> et <b>"+MODA[s.idx%3]+"</b> — en substance : "+E[s.idx%4]+" "+M[s.idx%3]+" <b>Ton réflexe</b> : chaque semaine, une action qui te ressemble ("+MODA[s.idx%3]+") que tu fais sans négocier."));

  var l=nat.lune;
  add(bloc("Lune en "+sig(l.idx),"Ta sensibilité passe par le filtre <b>"+ELEM[l.idx%4]+"</b> : "+E[l.idx%4]+" <b>Ton réflexe</b> : quand l'émotion monte, pose-la sur le papier (le <a href=\"journal.html\">journal d'humeur</a> du site est fait pour ça) avant de parler."));

  if(nat.mercureRx!==null&&nat.mercureRx!==undefined){
    add(bloc("Mercure"+(nat.mercureRx?" rétrograde à ta naissance":" à ta naissance"),(nat.mercureRx
      ?"Mercure était <b>rétrograde</b> le jour où tu es né(e) : ta pensée revient sur elle-même — tu relis, tu remets en question, tu approfondis. Les grands penseurs sont souvent nés sous une Mercure rétrograde : ce n'est pas un défaut, c'est une méthode."
      :"Mercure était <b>directe</b> : ta pensée sort vite et clairement — attention juste à écouter l'autre jusqu'au bout.")));
  }

  add(bloc("Vénus en "+sig(nat.venus.idx),P["Vénus"][nat.venus.idx%4]+" Vénus parle de ce que tu aimes et comment — garde ce style en tête dans tes relations."));

  add(bloc("Mars en "+sig(nat.mars.idx),P["Mars"][nat.mars.idx%4]+" Mars parle de ton énergie et de ta colère : ton moteur a son mode d'emploi."));

  add(bloc("Jupiter en "+sig(nat.jupiter.idx),P["Jupiter"][nat.jupiter.idx%4]+" Jupiter parle d'expansion : c'est par cette porte que ça passe le plus facilement pour toi."));

  add(bloc("Saturne en "+sig(nat.saturne.idx),P["Saturne"][nat.saturne.idx%4]+" Saturne parle de l'effort qui structure une vie : il finit par devenir ta force."));

  if(nat.asc!==null) add(bloc("Ascendant "+sig(nat.asc),"Par ton heure de naissance (approximation de quelques degrés) : "+ASC_TXT[nat.asc%4]+" C'est la <b>première impression</b> que tu donnes avant même de parler."));

  /* aspects : liste complète entre les 7 points du thème */
  var ASP={0:["conjonction","les deux énergies sont fondues : difficile de les séparer, puissant quand tu le fais consciemment"],
           2:["sextile","une porte s'ouvre si tu donnes un petit coup d'épaule"],
           3:["carré","tension permanente : inconfortable, mais c'est là que tu progresses le plus"],
           4:["trine","fluide et naturel : méfie-toi juste de le laisser au régime de croisière"],
           6:["opposition","un balancier : les deux pôles alternent — ton métier, c'est l'équilibre"],
           8:["trine","fluide et naturel (par un autre chemin) : laisse-les travailler ensemble"],
           10:["sextile","une porte s'ouvre si tu donnes un petit coup d'épaule"]};
  var tous=[["Soleil",nat.soleil.idx],["Lune",nat.lune.idx],["Vénus",nat.venus.idx],["Mars",nat.mars.idx],["Jupiter",nat.jupiter.idx],["Saturne",nat.saturne.idx]];
  if(nat.asc!==null) tous.push(["Ascendant",nat.asc]);
  var lignes=[];
  for(var i=0;i<tous.length;i++){
    for(var k=i+1;k<tous.length;k++){
      var ecart=((tous[i][1]-tous[k][1])%12+12)%12;
      if(ASP[ecart]) lignes.push("<b>"+tous[i][0]+" × "+tous[k][0]+"</b> — "+ASP[ecart][0]+" : "+ASP[ecart][1]+".");
    }
  }
  add(bloc("Les aspects de ta carte (la conversation entre tes planètes)","<ul><li>"+lignes.join("</li><li>")+"</li></ul>"));

  add(bloc("Ton année favorable",ev.anneTxt));

  var d=document.createElement("p");
  d.className="disclaimer";
  d.textContent="Rapport symbolique généré par les formules du site (précision d'environ 1°, ascendant approximatif, maisons non calculées). Il décrit des tendances, il ne prédit rien et ne remplace aucun professionnel.";
  R.appendChild(d);
  R.classList.remove("hid");
  $("rbtns").classList.remove("hid");
}

var JOURS_MOIS=[31,28,31,30,31,30,31,31,30,31,30,31];
function joursDuMois(an,mo){
  if(mo===1&&(an%4===0&&(an%100!==0||an%400===0))) return 29;
  return JOURS_MOIS[mo];
}

/* fenêtres favorables du mois : Lune croissante (élongation 15–165°) et Mercure directe */
function fenetresDuMois(an,mo){
  var bon=[],i,d;
  for(i=1;i<=joursDuMois(an,mo);i++){
    d=ASTRO.dn(an,mo+1,i);
    var e=ASTRO.elong(d);
    if(e>=15&&e<=165&&!ASTRO.estRx(an,mo+1,i)) bon.push(i);
  }
  var seq=[],cur=null;
  for(i=0;i<bon.length;i++){
    if(cur&&bon[i]===cur.fin+1){cur.fin=bon[i]}
    else{cur={debut:bon[i],fin:bon[i]};seq.push(cur)}
  }
  return seq.filter(function(s){return s.fin-s.debut>=1}).slice(0,4);
}

$("rf").addEventListener("submit",function(ev){
  ev.preventDefault();
  var dv=$("rd").value;
  if(!dv){$("rmsg").textContent="Donne ta date de naissance.";return}
  var an=+dv.slice(0,4),mo=+dv.slice(5,7)-1,j=+dv.slice(8,10);
  if(an<1900||an>2100){$("rmsg").textContent="Génère le rapport pour une date entre 1900 et 2100.";return}
  var mid=ASTRO.dn(an,mo+1,j);
  var ps=ASTRO.planetes(mid); /* ordre : Soleil, Lune, Mercure, Vénus, Mars, Jupiter, Saturne */
  var nat={
    soleil:{idx:ps[0].idx},lune:{idx:ps[1].idx},
    mercureRx:ps[2].retro,
    venus:{idx:ps[3].idx},mars:{idx:ps[4].idx},
    jupiter:{idx:ps[5].idx},saturne:{idx:ps[6].idx},
    asc:null};
  var hv=$("rh").value;
  if(hv){
    var hh=+hv.slice(0,2),mi=+hv.slice(3,5);
    var dFrac=mid+(hh-1)/24+mi/1440; /* heure locale GT+1 en UT */
    nat.asc=ascendant(dFrac,6.5,2.4);
  }
  /* année favorable : 12 prochains mois */
  var an2=an,mo2=mo,parts=[];
  for(var m=0;m<12;m++){
    var f=fenetresDuMois(an2,mo2);
    if(f.length){
      parts.push("<b>"+MOIS[mo2]+"</b> : "+f.map(function(s){return s.debut===s.fin?String(s.debut):s.debut+"–"+s.fin}).join(", "));
    }
    mo2++;if(mo2>11){mo2=0;an2++}
  }
  var ev={
    dateTxt:j+" "+MOIS[mo]+" "+an,
    heureTxt:hv?hv:"",
    resume:"Soleil en "+sig(nat.soleil.idx)+", Lune en "+sig(nat.lune.idx),
    anneTxt:"Sur les 12 prochains mois, tes fenêtres les plus favorables (Lune croissante et Mercure directe) : "+(parts.length?"<ul><li>"+parts.join("</li><li>")+"</li></ul>":"aucune fenêtre claire ce cycle — lisse, avance à ton rythme.")
  };
  ecrisRapport(nat,ev);
  $("rmsg").textContent="";
});

$("printBtn").addEventListener("click",function(){window.print()});

/* ===== ascendant : formule identique aux autres outils ===== */
function ascendant(d,latDeg,lonEstDeg){
  var jd=d+2451544.5;
  var eps=23.4393-0.0000004*d;
  var lst=(280.46061837+360.98564736629*(jd-2451545)+lonEstDeg)%360;
  lst=((lst%360)+360)%360;
  var phi=latDeg*Math.PI/180,L=lst*Math.PI/180,E=eps*Math.PI/180;
  var a=Math.atan2(Math.cos(L),-(Math.sin(L)*Math.cos(E)+Math.tan(phi)*Math.sin(E)))*180/Math.PI;
  return Math.floor((((a%360)+360)%360)/30);
}

/* ===== démarrage ===== */
chargeOffres();
var r0=refDepuisURL();
if(r0){surveillerRef(r0)}
else{
  var mem=refEnMemoire();
  if(mem) verifierStatut(mem,false);
}
})();
