/* Prénoms du jour (tradition fon/adja + akan) et zodiaque — partagé par jour-fa.js et compat.js.
   Ordre JS : dimanche = 0 → samedi = 6. Orthographes variables selon les régions. */
(function(){
"use strict";
var JOUR_PRENOMS=[
 {fr:"dimanche",h:"Kossi",hv:"Kossivi, Kossiwa",f:"Akossiwa",fv:"Akossi",ak:["Kwasi","Akosua"],sens:"associé à l’univers"},
 {fr:"lundi",h:"Kodjo",hv:"Kodjovi, Sedjro",f:"Adjoua",fv:"Adjo, Adjowa",ak:["Kwadwo","Adwoa"],sens:"associé à la paix"},
 {fr:"mardi",h:"Komlan",hv:"Komlavi",f:"Abla",fv:"Ablavi, Abra",ak:["Kwabena","Abena"],sens:"associé à l’océan"},
 {fr:"mercredi",h:"Kokou",hv:"Kokouvi",f:"Akouavi",fv:"Akouwa, Akoué",ak:["Kwaku","Akua"],sens:"associé à l’araignée (Anansé)"},
 {fr:"jeudi",h:"Yaovi",hv:"Yao",f:"Yawa",fv:"Ayaba",ak:["Yaw","Yaa"],sens:"associé à la terre"},
 {fr:"vendredi",h:"Kofi",hv:"Koffi, Kofiwa",f:"Afi",fv:"Afua",ak:["Kofi","Afua"],sens:"associé à la fertilité"},
 {fr:"samedi",h:"Komi",hv:"Kouami",f:"Ama",fv:"Amu",ak:["Kwame","Ama"],sens:"associé à Dieu"}
];
/* Signes solaires (zodiaque tropical, dates approchées) */
var JOUR_ZOD=[
 [3,21,"Bélier"],[4,20,"Taureau"],[5,21,"Gémeaux"],[6,21,"Cancer"],
 [7,23,"Lion"],[8,23,"Vierge"],[9,23,"Balance"],[10,23,"Scorpion"],
 [11,22,"Sagittaire"],[12,22,"Capricorne"],[1,20,"Verseau"],[2,19,"Poissons"]
];
function zodiaque(m,d){
  var out="Capricorne",i;
  for(i=JOUR_ZOD.length-1;i>=0;i--){
    var z=JOUR_ZOD[i];
    if(m>z[0]||(m===z[0]&&d>=z[1])){out=z[2];break}
  }
  return out;
}
window.JOUR_PRENOMS=JOUR_PRENOMS;
window.JOUR_ZODIAQUE=zodiaque;
})();
