/* Astro — moteur astronomique partagé (formules simplifiées type Schlyter, précision ~1°).
   Utilisé par jours.js (jours verts/rouges) et journal.js (journal d'humeur). */
(function(){
"use strict";
function nrm(x){x%=360;return x<0?x+360:x}
function sn(x){return Math.sin(x*Math.PI/180)}
function cs(x){return Math.cos(x*Math.PI/180)}
function deg(r){return r*180/Math.PI}

/* Nombre de jours écoulés depuis le 31/12/1999 0h TU */
function dn(y,m,d){return 367*y-Math.floor(7*(y+Math.floor((m+9)/12))/4)+Math.floor(275*m/9)+d-730530}

/* Résolution de l'équation de Kepler */
function kepler(M,e){
  var E=M+e*deg(sn(M))*(1+e*cs(M)), i;
  for(i=0;i<6;i++){E=E-(E-e*deg(sn(E))-M)/(1-e*cs(E))}
  return E;
}

/* Soleil : longitude géocentrique (degrés) */
function lonSoleil(d){
  var M=356.0470+0.9856002585*d, w=282.9404+4.70935e-5*d;
  var C=1.9148*sn(M)+0.02*sn(2*M)+0.0003*sn(3*M);
  return nrm(w+M+C);
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

/* Élongation Lune–Soleil (0 = nouvelle lune, 180 = pleine lune) */
function elong(d){return nrm(lonLune(d)-lonSoleil(d))}
/* Phase courte : "🌑" (nouvelle), "🌕" (pleine), sinon "" */
function phase(d){
  var e=elong(d);
  return (e<11.25||e>348.75)?"🌑":(Math.abs(e-180)<11.25?"🌕":"");
}

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
function estRx(y,m,j){
  var n=dn(y,m,j), i;
  for(i=0;i<RX.length;i++){
    if(n>=dn(RX[i][0],RX[i][1],RX[i][2]) && n<=dn(RX[i][3],RX[i][4],RX[i][5]))return true;
  }
  return false;
}

/* ===== Planètes (Mercure → Saturne), éléments orbitaux simplifiés =====
   Précision de l'ordre du degré : largement suffisant pour un signe et un sens de marche.
   rayonSoleil : distance Terre–Soleil (unités astronomiques) à d jours. */
var rayonSoleil=function(d){
  var M=nrm(356.0470+0.9856002585*d);
  return 1.00014-0.01671*cs(M)-0.00014*cs(2*M);
};
var ORBITES={
  "Mercure":{N:[48.3313,3.24587e-5],i:[7.0047,5.0e-8],w:[29.1241,1.01444e-5],a:0.387098,e:[0.205635,5.59e-10],M:[168.6562,4.0923344368]},
  "Vénus":{N:[76.6799,2.46590e-5],i:[3.3946,2.75e-8],w:[54.8910,1.38374e-5],a:0.723330,e:[0.006773,-4.77e-9],M:[48.0052,1.6021302244]},
  "Mars":{N:[49.5574,2.11081e-5],i:[1.8497,-1.78e-8],w:[286.5016,2.92961e-5],a:1.523688,e:[0.093405,2.516e-9],M:[18.6021,0.5240207766]},
  "Jupiter":{N:[100.4542,2.76854e-5],i:[1.3030,-1.557e-7],w:[273.8777,1.64505e-5],a:5.20256,e:[0.048498,4.469e-9],M:[19.8950,0.0830853001]},
  "Saturne":{N:[113.6634,2.38980e-5],i:[2.4886,-1.081e-7],w:[339.3939,2.97661e-5],a:9.55475,e:[0.055546,-9.499e-9],M:[316.9670,0.0334442282]}
};
/* Longitude géocentrique d'une planète (degrés) */
function lonPlanete(nom,d){
  var o=ORBITES[nom];
  if(!o)return NaN;
  var N=o.N[0]+o.N[1]*d, i=o.i[0]+o.i[1]*d, w=o.w[0]+o.w[1]*d;
  var a=o.a, e=o.e[0]+o.e[1]*d, M=nrm(o.M[0]+o.M[1]*d);
  var E=kepler(M,e);
  var xv=a*(cs(E)-e), yv=a*Math.sqrt(1-e*e)*sn(E);
  var v=deg(Math.atan2(yv,xv)), r=Math.sqrt(xv*xv+yv*yv);
  var u=nrm(v+w);
  var xh=r*(cs(N)*cs(u)-sn(N)*sn(u)*cs(i));
  var yh=r*(sn(N)*cs(u)+cs(N)*sn(u)*cs(i));
  /* vecteur géocentrique du Soleil, puis somme */
  var lonS=lonSoleil(d), rS=rayonSoleil(d);
  return nrm(deg(Math.atan2(yh+rS*sn(lonS),xh+rS*cs(lonS))));
}
/* Sens du mouvement : dérivée numérique sur ±0,25 jour (vrai = rétrograde).
   Mercure : on utilise le tableau d'éphémérides exactes (estRx) à la place. */
function retroPlanete(nom,d){
  var b=lonPlanete(nom,d+0.25), a=lonPlanete(nom,d-0.25);
  var diff=nrm(b-a); if(diff>180)diff-=360;
  return diff<0;
}
/* dn depuis un objet Date (temps universel, fraction de jour incluse) */
function dnDate(dt){
  var y=dt.getUTCFullYear(), m=dt.getUTCMonth()+1, j=dt.getUTCDate();
  var h=dt.getUTCHours()+dt.getUTCMinutes()/60+dt.getUTCSeconds()/3600;
  return dn(y,m,j)+h/24;
}
/* Déclinaison (degrés) d'un point de longitude écliptique lon, latitude ~0 */
function declinaison(lon,d){
  var eps=23.4393-0.0000004*d;
  return deg(Math.asin(sn(eps)*sn(lon)));
}
/* Positions instantanées : [{nom, lon, idx, deg, retro}] — Mercure via le tableau exact */
function planetes(d){
  var noms=["Mercure","Vénus","Mars","Jupiter","Saturne"], out=[{nom:"Soleil",lon:lonSoleil(d)}];
  out.push({nom:"Lune",lon:lonLune(d)});
  var i,nom,lon;
  for(i=0;i<noms.length;i++){
    nom=noms[i];
    lon=lonPlanete(nom,d);
    /* date calendaire UTC correspondant au jour fractionnaire d (dn=0 le 1999-12-31 0h TU) */
    var dd=new Date(Date.UTC(1970,0,1)); dd.setUTCDate(dd.getUTCDate()+Math.floor(d)+10956);
    out.push({nom:nom,lon:lon,retro:nom==="Mercure"?estRx(dd.getUTCFullYear(),dd.getUTCMonth()+1,dd.getUTCDate()):retroPlanete(nom,d)});
  }
  for(i=0;i<out.length;i++){
    out[i].idx=signe(out[i].lon);
    out[i].deg=nrm(out[i].lon)%30;
  }
  return out;
}

window.ASTRO={
  SIGNES:["Bélier","Taureau","Gémeaux","Cancer","Lion","Vierge","Balance","Scorpion","Sagittaire","Capricorne","Verseau","Poissons"],
  dn:dn, dnDate:dnDate, lonSoleil:lonSoleil, lonLune:lonLune, signe:signe,
  elong:elong, phase:phase, estRx:estRx,
  lonPlanete:lonPlanete, retroPlanete:retroPlanete, declinaison:declinaison, planetes:planetes
};
})();
