/* Ton coach — moteur de règles local (aucun envoi serveur, aucune IA externe).
   Spécialité : repérer des mots-clés dans la question, croiser avec le thème natal
   et le ciel du moment, et répondre du concret + un rappel d'honnêteté. */
(function(){
"use strict";
function $(id){return document.getElementById(id)}
var ELEM=["feu","terre","air","eau"];
var MODA=["cardinal","fixe","mutable"];
var MODE_TXT=["lance les choses","tient ce qu'il prend","sème large"];

var natal=null; /* {soleil,lune,asc,venus,mars} indices de signes */

function sansAccent(x){return x.normalize("NFD").replace(/[\u0300-\u036f]/g,"")}
function echappe(x){return String(x).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}

/* ===== natal ===== */
$("natalForm").addEventListener("submit",function(ev){
  ev.preventDefault();
  var dv=$("bd").value;
  if(!dv){$("nm").textContent="Donne ta date de naissance.";return}
  var an=+dv.slice(0,4), mo=+dv.slice(5,7), j=+dv.slice(8,10);
  var mid=ASTRO.dn(an,mo,j);
  natal={
    soleil:ASTRO.signe(ASTRO.lonSoleil(mid)),
    lune:ASTRO.signe(ASTRO.lonLune(mid)),
    asc:null,
    venus:ASTRO.signe(ASTRO.lonPlanete("Vénus",mid)),
    mars:ASTRO.signe(ASTRO.lonPlanete("Mars",mid))
  };
  var hv=$("bh").value;
  if(hv){
    /* ascendant approximatif : temps sidéral local (Bénin ~6,5° N par défaut) */
    var hh=+hv.slice(0,2), mi=+hv.slice(3,5);
    var dFrac=mid+(hh-1)/24+mi/1440; /* heure locale GT+1 en UT */
    natal.asc=ascendant(dFrac,6.5,2.4);
  }
  $("chatSec").classList.remove("hid");
  $("nm").textContent="";
  bot("Session ouverte. Soleil en "+SIG(natal.soleil)+", Lune en "+SIG(natal.lune)
     +(natal.asc!==null?", ascendant "+SIG(natal.asc)+" (approximatif)":"")
     +". Demande-moi ce que tu veux — « pourquoi je procrastine ? » est un grand classique.");
});

/* Ascendant par formule classique (précision de quelques degrés, heure locale supposée GT+1) */
function ascendant(d,latDeg,lonEstDeg){
  var jd=d+2451544.5;
  var eps=23.4393-0.0000004*d;
  var lst=(280.46061837+360.98564736629*(jd-2451545)+lonEstDeg)%360;
  lst=((lst%360)+360)%360;
  var phi=latDeg*Math.PI/180, L=lst*Math.PI/180, E=eps*Math.PI/180;
  var asc=Math.atan2(Math.cos(L),-(Math.sin(L)*Math.cos(E)+Math.tan(phi)*Math.sin(E)));
  var degA=asc*180/Math.PI;
  degA=((degA%360)+360)%360;
  return Math.floor(degA/30)%12;
}

var SIG_n=ASTRO.SIGNES;
function SIG(i){return SIG_n[i]}

/* ===== chat ===== */
function bulle(html,moi){
  var d=document.createElement("div");
  d.className="bul "+(moi?"moi":"bot");
  d.innerHTML=html;
  $("chat").appendChild(d);
  d.scrollIntoView({behavior:"smooth",block:"end"});
}
function bot(html){
  bulle(html,false);
}
function aidant(q){
  bulle(echappe(q),true);
  setTimeout(function(){bulle(repondre(q.toLowerCase()))},650);
}
$("qform").addEventListener("submit",function(ev){
  ev.preventDefault();
  var q=$("q").value.trim();
  if(!q)return;
  if(!natal){bot("Ouvre d'abord une session : ta date de naissance en haut de la page.");return}
  $("q").value="";
  aidant(q);
});
Array.prototype.forEach.call(document.querySelectorAll(".chipq"),function(b){
  b.addEventListener("click",function(){
    if(!natal){bot("Ouvre d'abord une session : ta date de naissance en haut de la page.");return}
    aidant(b.getAttribute("data-q"));
  });
});

/* ===== ciel du moment (contexte des réponses) ===== */
function ciel(){
  var d=ASTRO.dnDate(new Date());
  return {
    lune:ASTRO.signe(ASTRO.lonLune(d)),
    phase:ASTRO.elong(d),
    mercureRx:ASTRO.estRx(new Date().getFullYear(),new Date().getMonth()+1,new Date().getDate())
  };
}
function phaseTxt(e){
  if(e<11.25||e>348.75)return "nouvelle lune";
  if(Math.abs(e-180)<11.25)return "pleine lune";
  return e<180?"lune croissante":"lune décroissante";
}

/* ===== moteur de règles ===== */
function repondre(qRaw){
  var q=sansAccent(qRaw);
  var n=natal, S=SIG(n.soleil), Mo=SIG(n.lune);
  var el=ELEM[n.soleil%4], md=MODA[n.soleil%3];
  var c=ciel(), ph=phaseTxt(c.phase);
  var fin=" <span class='disclaimer'>Billet symbolique, pas un diagnostic : garde le dernier mot.</span>";

  function a(mots){return mots.some(function(m){return q.indexOf(m)!==-1})}

  /* Procrastination */
  if(a(["procrastin","reporte","trainer","train ","pousse a demain","jamais termin","petit pas"])){
    var t="La procrastination a deux pieds : l'un est le <b>plan</b>, l'autre la <b>peur du premier pas</b>. Astuce qui marche : commence par la version la plus moche du travail (10 minutes, minuteur compris) — on corrige une ébauche, on ne démarre pas un chef-d'œuvre. ";
    t+="De ton côté, ton Soleil en <b>"+S+"</b> ("+el+", mode "+md+" — "+MODE_TXT[n.soleil%3]+") : ";
    if(md==="cardinal")t+="tu démarres bien, c'est la continuation qui t'use — découpe le travail en jalons datés. ";
    else if(md==="fixe")t+="tu tiens ce que tu prends... parfois un peu trop longtemps : fixe-toi une date de fin raisonnable pour te permettre de clore. ";
    else t+="tu sèmes large — deux chantiers ouverts en même temps finissent en zéro : une seule fenêtre, la semaine, tout le reste en liste d'attente. ";
    t+="Ta Lune en <b>"+Mo+"</b> embarque les humeurs : repère l'heure où tu es naturellement au meilleur — c'est là que le boulot demandant le plus de force doit se placer.";
    return t+fin;
  }
  /* Fatigue */
  if(a(["fatigu","epuise","pas d energie","trop flema","mou ","creve","sommeil","dors mal","insomnie"])){
    var t="La fatigue, ça se trie en trois piles : le <b>corps</b> (sommeil régulier, eau, bouger un peu), l'<b>agenda</b> (trop de chantiers ouverts ?), et le <b>fond</b> (si ça dure trois semaines, le vrai premier réflexe est d'en parler à un médecin ou pharmacien — pas au ciel). ";
    t+="Côté symbolique : la Lune est en <b>"+SIG(c.lune)+"</b> et nous voici en <b>"+ph+"</b> — ";
    if(ph==="pleine lune")t+="les pleines lunes drainent : allège la semaine au lieu d'ajouter. ";
    else if(ph==="nouvelle lune")t+="moment classique pour redémarrer une routine de sommeil à heure fixe. ";
    else if(ph==="lune croissante")t+="l'énergie remonte : remets le sport ou le chantier différé. ";
    else t+="phase de finition : fais moins, mais termine. ";
    t+="Ta Lune natale en <b>"+Mo+"</b> te dit sensible aux atmosphères : si la maison est en pagaille, ranger 30 minutes vaut parfois mieux qu'une nuit de plus.";
    return t+fin;
  }
  /* Argent / budget */
  if(a(["argent","budget","salaire","econom","dettes","depens ","caisse"])){
    var t="L'argent se conduit à trois vitesses : ce qui <b>entre</b>, ce qui <b>sort</b>, et ce qui <b>dort</b>. La règle #1 reste bancale mais redoutable : écris tout pendant un mois — tu sauras exactement où passe l'argent. ";
    t+="Ta Vénus natale en <b>"+SIG(n.venus)+"</b> colore ta façon de donner plaisir à ton argent : ";
    var vn=n.venus%4;
    if(vn===0)t+="feu — les coups de cœur rapides : impose-toi une nuit de délai avant chaque achat au-dessus d'un seuil que tu choisis. ";
    else if(vn===1)t+="terre — la sécurité d'abord : automatise une épargne le jour de la paie, même petite. ";
    else if(vn===2)t+="air — les découvertes et les gadjets : fixe un plafond mensuel de « nouveautés » et respecte-le. ";
    else t+="eau — le cœur emprunte : les prêts affectifs non écrits sont le piège classique, mets tout par écrit. ";
    if(c.mercureRx)t+="Nous sommes en période de <b>Mercure rétrograde</b> : pour les grandes signatures financières, double relecture ou report léger ne coûte rien.";
    return t+fin;
  }
  /* Travail / négociation */
  if(a(["travail","boss","patron","collegue","entretien","augment","promotion","metier","boulot","demission","job"])){
    var t="Une demande, ça se prépare comme un dossier : le <b>fait</b> (ce que tu as apporté, en chiffres si tu peux), la <b>demande</b> (précise : montant, poste, plage : chez time), et le <b>moment</b> (après une réussite visible, jamais en pleine crise). ";
    t+="Ton Soleil en <b>"+S+"</b> ("+MODA[n.soleil%3]+") : ";
    if(n.soleil%3===0)t+="tu lances bien l'entretien : ouvre direct avec le fait principal. ";
    else if(n.soleil%3===1)t+="appuie-toi sur ce que tu tiens déjà (dossiers menés à terme) : c'est ton meilleur argument. ";
    else t+="prépare ta demande par écrit et relis-la deux fois : l'improvisation te fait tourner en rond. ";
    t+="Et si tu cherches LE jour : la page <a href='jours.html'>Jours verts et rouges</a> existe exactement pour ça.";
    return t+fin;
  }
  /* Amour / relations */
  if(a(["amour","couple","ex ","crush","relation","mariage","celibat","separe","disput"])){
    var t="Une relation, c'est un langage commun à construire : nomme ce que tu ressens au « je » (« je me sens seul·e quand… »), jamais en « tu » accusateur. ";
    var vn=n.venus%4;
    t+="Ta Vénus en <b>"+SIG(n.venus)+"</b> aime : ";
    if(vn===0)t+="le mouvement et la spontanéité — propose une sortie nouvelle plutôt que la sortie habituelle. ";
    else if(vn===1)t+="la régularité et le concret — un coup de main, un repas, ça compte plus qu'un discours. ";
    else if(vn===2)t+="la conversation — un vrai échange (téléphone, pas des messages à rallonge) désamorce la moitié des tensions. ";
    else t+="la sécurité affective — dis clairement ce qui t'inquiète ; les non-dits rongent plus vite que les disputes. ";
    t+="Ta Lune natale en <b>"+Mo+"</b> : tes surprises émotionnelles viennent souvent de là — apprends ton propre cycle, c'est la meilleure relation du monde avec toi-même.";
    return t+fin;
  }
  /* Stress / angoisse */
  if(a(["stress","angoiss","paniqu","pression","surmene","deborde","trop de tout"])){
    var t="Sous pression, fais court : <b>respire</b> (4 secondes inspire, 6 secondes expire, trois fois), <b>écris</b> (la liste totale, même sale — le cerveau déteste détenir une liste qu'il ne tient pas), <b>traite une seule chose</b> (la plus urgente, pas la plus grosse). ";
    t+="Le ciel du moment : Lune en <b>"+SIG(c.lune)+"</b>, "+ph+" — ";
    if(ph==="pleine lune")t+="les émotions montent à bloc : reporte une décision, rien ne fondra. ";
    else if(ph==="nouvelle lune")t+="bon moment pour vider la liste et n'en garder que trois lignes. ";
    else t+="le rythme est ordinaire : le problème se règle par petites marches. ";
    t+="Ta Lune en <b>"+Mo+"</b> : sa carré/opposition avec le signe du jour (voir <a href='journal.html'>ton journal</a>) expliquerait les jours où tout paraît lourd — c'est fluide, ça passe.";
    return t+fin;
  }
  /* Sommeil distinct? traité avec fatigue */
  /* Décision / signature / lancement */
  if(a(["signer","decision","decide","demenag","lancer","lance ","meilleur jour","bon jour","bon moment","quand "])||a(["lancer un business","ouvrir"])){
    return "Pour choisir un jour : la page <a href='jours.html'>Jours verts et rouges</a> calcule ton calendrier du mois (Lune × ton signe, phases, Mercure rétrograde) et exporte même le tout dans Google Agenda. Grande règle du métier : <b>jamais de signature importante en plein Mercure rétrograde</b>"+(c.mercureRx?" — et justement, nous y sommes : relis deux fois ou reporte.":" — vérifie toujours la période en cours.")+fin;
  }
  /* Mercure */
  if(a(["mercure","retrograde","retro "])||(q.indexOf("retro")!==-1)){
    var t="Mercure rétrograde, c'est une illusion optique (la Terre la dépasse) : symboliquement, le moment de <b>réviser</b> plutôt que d'<b>initier</b> — relis, répare, renégocie, sauvegarde. ";
    t+=c.mercureRx?"Nous y sommes actuellement : précautions simples — double relecture des e-mails et contrats, sauvegardes, et pas de panique : aucune fatalité, ça repart.":"Nous n'y sommes pas en ce moment — consulte <a href='maintenant.html'>le ciel en direct</a>, qui annonce les stations à l'avance.";
    return t+fin;
  }
  /* Pleine/nouvelle lune */
  if(a(["pleine lune","nouvelle lune","lune"])){
    var t="La Lune est en <b>"+SIG(c.lune)+"</b>, phase : <b>"+ph+"</b>. Règle courte : nouvelle lune → lancer (projet, routine, message difficile à écrire) ; pleine lune → clôturer et éviter de trancher à chaud. Ton journal (<a href='journal.html'>journal d'humeur</a>), sur quelques semaines, te dira si TOI tu sens vraiment les phases — c'est la seule donnée qui compte pour toi.";
    return t+fin;
  }
  /* horoscope général */
  if(a(["horoscope","aujourd","journee","semaine","ce soir","mon signe"])){
    var t="Ton Soleil en <b>"+S+"</b>",t2="";
    var ds=((c.lune-n.soleil)%12+12)%12;
    t2+=" Aujourd'hui, la Lune est en <b>"+SIG(c.lune)+"</b> — ";
    if(ds===0)t2+="dans ton signe : énergie alignée, bonne journée pour toi.";
    else if(ds===4||ds===8)t2+="en trine de ton Soleil : le courant passe, avance.";
    else if(ds===2||ds===10)t2+="en sextile : occasions modestes à saisir.";
    else if(ds===3||ds===9)t2+="au carré : frictions ordinaires, ne tranche rien de sensible.";
    else if(ds===6)t2+="opposée à ton Soleil : tensions relationnelles possibles, garde ton calme.";
    else t2+="dans un signe neutre : journée de réglage.";
    return t+"."+t2+" Le détail jour par jour : <a href='jours.html'>jour vert/rouge du mois</a>"+fin;
  }
  /* défaut */
  return "Je n'ai pas reconnu assez de mots-clés pour répondre avec honnêteté (je préfère avouer plutôt qu'inventer). Reformule avec un thème : <b>procrastiner</b>, <b>fatigue</b>, <b>argent</b>, <b>travail</b>, <b>amour</b>, <b>stress</b>, <b>signer</b>, <b>Mercure</b>, <b>lune</b>… — ou regarde <a href='jour-fa.html'>ton jour Fâ</a> et <a href='compatibilite.html'>ta compatibilité narrative</a>."+fin;
}
})();
