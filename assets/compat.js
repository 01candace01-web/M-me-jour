/* Page Compatibilité narrative — tout est calculé dans le navigateur, rien n'est envoyé. */
(function(){
"use strict";
var SIG=ASTRO.SIGNES;
var ELEM=["feu","terre","air","eau"];     /* index%4 */
var MODA=["cardinal","fixe","mutable"];  /* index%3 */
var EMOJ=["♈","♉","♊","♋","♌","♍","♎","♏","♐","♑","♒","♓"];
function $(id){return document.getElementById(id)}

/* Relation entre deux indicateurs 0..11 (écart mod 12) */
function aspect(a,b){
  var d=(a-b)%12; d=(d+12)%12;
  if(d===0)return {k:"conj"};
  if(d===2||d===10)return {k:"sext"};
  if(d===3||d===9)return {k:"carre"};
  if(d===4||d===8)return {k:"trine"};
  if(d===6)return {k:"opp"};
  return {k:"neutre"};
}
function echappe(x){return x.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}

$("cform").addEventListener("submit",function(ev){
  ev.preventDefault();
  var m=$("m");
  var dvA=$("da").value, dvB=$("db").value;
  if(!dvA||!dvB){m.textContent="Donne les deux dates de naissance.";return}
  var pA=dvA.split("-"), pB=dvB.split("-");
  var dA=new Date(+pA[0],+pA[1]-1,+pA[2],12,0,0);
  var dB=new Date(+pB[0],+pB[1]-1,+pB[2],12,0,0);
  if(isNaN(dA.getTime())||isNaN(dB.getTime())){m.textContent="Dates invalides.";return}
  var nomA=echappe($("pa").value.trim()), nomB=echappe($("pb").value.trim());
  var A_titre=nomA||"La personne A", B_titre=nomB||"La personne B";
  /* prénoms du jour (fon/adja + akan) */
  var jA=window.JOUR_PRENOMS[dA.getDay()], jB=window.JOUR_PRENOMS[dB.getDay()];
  /* signes : longitude précise du Soleil (moteur astro partagé) */
  var iA=ASTRO.signe(ASTRO.lonSoleil(ASTRO.dn(+pA[0],+pA[1],+pA[2])));
  var iB=ASTRO.signe(ASTRO.lonSoleil(ASTRO.dn(+pB[0],+pB[1],+pB[2])));
  var elA=ELEM[iA%4], elB=ELEM[iB%4], mdA=MODA[iA%3], mdB=MODA[iB%3];
  var rel=aspect(iA,iB);
  var sA=SIG[iA], sB=SIG[iB];

  /* 1. Prénoms du jour */
  $("prenomA").innerHTML=A_titre+" : né·e un <b>"+jA.fr+"</b> — prénom du jour « <b>"+jA.h+"</b> » (garçon) ou « <b>"+jA.f+"</b> » (fille), aussi "+jA.hv+" / "+jA.fv+", et côté akan : "+jA.ak[0]+" / "+jA.ak[1]+".";
  $("prenomB").innerHTML=B_titre+" : né·e un <b>"+jB.fr+"</b> — prénom du jour « <b>"+jB.h+"</b> » (garçon) ou « <b>"+jB.f+"</b> » (fille), aussi "+jB.hv+" / "+jB.fv+", et côté akan : "+jB.ak[0]+" / "+jB.ak[1]+".";
  var prefrel;
  if(jA.fr===jB.fr){
    prefrel="Vous êtes <b>du même jour</b> : même sens traditionnel ("+jA.sens+"). Les anciens diraient que vous vous reconnaissez d'instinct — complices naturels, à condition de vous laisser respirer.";
  }else if((dA.getDay()+1)%7===dB.getDay()||(dB.getDay()+1)%7===dA.getDay()){
    prefrel="Vos jours se <b>suivent dans la semaine</b> : deux saisons voisines — l'un prépare souvent le terrain de l'autre sans même s'en rendre compte.";
  }else{
    prefrel="Vos jours se répondent : "+jA.sens+" d'un côté, "+jB.sens+" de l'autre — un duo qui mêle deux courants. À condition de partager ce que chacun vient chercher, c'est une richesse.";
  }
  $("prenomRel").innerHTML=prefrel;

  /* 2. Signes solaires */
  $("signeA").innerHTML=A_titre+" : <b>"+sA+" "+EMOJ[iA]+"</b> — élément "+elA+", mode "+mdA+".";
  $("signeB").innerHTML=B_titre+" : <b>"+sB+" "+EMOJ[iB]+"</b> — élément "+elB+", mode "+mdB+".";
  var aspTxt;
  if(rel.k==="conj")aspTxt="Vos Soleils sont <b>en conjonction</b> (les deux en "+sA+") : même orbite, anniversaires aux mêmes dates. Une fusion rare — formidable quand chacun garde son jardin, pesante dès que l'un se met à parler à la place de l'autre. Protégez un projet par personne : vos retrouvailles n'en seront que plus belles.";
  else if(rel.k==="trine")aspTxt="Vos Soleils sont <b>en trine</b> ("+sA+" / "+sB+", même élément "+elA+") : la complicité qui coule de source. Points communs faciles, silencieux confortables. Seul risque : le confort qui dort — tout ce qui se mérite moins se néglige plus vite. Faites vivre de vrais projets communs.";
  else if(rel.k==="sext")aspTxt="Vos Soleils sont <b>en sextile</b> ("+sA+" / "+sB+") : deux éléments voisins ("+elA+" et "+elB+"), des occasions à saisir mutuellement. C'est la relation qui s'améliore quand vous décidez des choses ensemble — spontanée mais pas automatique. Le sextile aime les invitations explicites : « viens », « réserve », « propose ».";
  else if(rel.k==="carre")aspTxt="Vos Soleils sont <b>au carré</b> ("+sA+" / "+sB+") : le classique des duos qui s'aiment en se disputant. Vos façons d'avancer (mode "+mdA+" contre "+mdB+") se coincent sur les mêmes points — argent, ponctualité, la gestion des émotions. Faites des règles nettes : qui décide quoi, à quelle occasion, avec quel budget. Un carré mis en règles devient un moteur ; dans le doute, écrivez ce qui bloque avant de débattre.";
  else if(rel.k==="opp")aspTxt="Vos Soleils sont <b>en opposition</b> ("+sA+" / "+sB+") : l'aimant. Chacun porte ce que l'autre cherche — souvent d'abord chez l'autre plutôt qu'en soi. À deux modes opposés ("+mdA+" / "+mdB+"), les montagnes russes sont garanties ; marchez chacun sur vos jambes : ne demandez pas à l'autre de faire vos pas.";
  else aspTxt="Vos Soleils forment un aspect discret ("+sA+" / "+sB+") : ni fusion, ni choc — la relation se construit par des ajustements réguliers. La qualité viendra de vos rituels : appeler, écouter, ne rien supposer.";
  $("aspect").innerHTML=aspTxt;

  /* 3. Forces */
  var f=[];
  if(elA===elB)f.push("Même élément ("+elA+") : vous captez le monde de façon semblable. Quand l'un dit « bizarre, non ? », l'autre dit déjà « exactement ». Ces moments-là sont le carburant des longues histoires.");
  else f.push("Éléments différents ("+elA+" / "+elB+") : chacun apporte ce que l'autre n'a pas. C'est ce qui rend le duo fertile — il fait grandir au lieu d'endormir.");
  if(mdA===mdB)f.push("Même mode ("+mdA+") : vos façons de démarrer et de tenir sont calées. Les projets avancent sans sprint inutile.");
  else f.push("Modes différents ("+mdA+" / "+mdB+") : l'un lance, l'autre déroule. Bien répartis — le lanceur n'administre pas, l'administreur n'entrave pas — ces deux rythmes font une équipe très solide.");
  $("forces").innerHTML=f.map(function(x){return "– "+x}).join("<br>");

  /* 4. Frottements */
  var fr;
  if(rel.k==="carre")fr="<b>Le carré dit tout : mêmes objectifs, méthodes opposées.</b> Vos disputes repasseront toujours par les mêmes points. Bonne pratique : identifier ces points à froid (une fois, par écrit), puis vous y tenir — le carré devient votre force d'exécution.";
  else if(rel.k==="opp")fr="<b>L'opposition fait des montagnes russes :</b> grande attirance, grandes émotions, et la tentation de rendre l'autre responsable de ce qu'on ne veut pas voir en soi. Bon réflexe : avant d'attaquer, se demander « est-ce que je ne me reproche pas exactement ça ? ».";
  else if(rel.k==="conj")fr="<b>La conjonction peut étouffer :</b> mêmes humeurs au même moment, donc les périodes creuses tombent en même temps. Prévoyez chacun un projet bien à soi — et un rituel de mise à jour : dites-vous ce qui vous a rendu heureux cette semaine, au lieu de supposer que l'autre sait.";
  else if(rel.k==="trine")fr="<b>Le trine peut s'endormir :</b> tout passe trop bien, et les vrais sujets restent en jachère. Une fois par mois, sortez le sujet dont « personne n'a envie de parler ». Le trine bien vécu est de ceux qui s'éternisent.";
  else fr="<b>L'aspect discret demande de la maintenance :</b> les malentendus viennent du style, pas des intentions. Répétez ce que vous avez compris de l'autre avant de répondre — la moitié des frottements s'évapore ainsi.";
  $("frotte").innerHTML=fr;

  $("res").classList.remove("hid");
  $("res").scrollIntoView({behavior:"smooth"});
});
})();
