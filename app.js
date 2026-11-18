// Même Jour — logique client. Les données (personnages, phrases) sont injectées par index.php.
const SIGNS=["Bélier","Taureau","Gémeaux","Cancer","Lion","Vierge","Balance","Scorpion","Sagittaire","Capricorne","Verseau","Poissons"];
const ANIMALS=["Rat","Buffle","Tigre","Lapin","Dragon","Serpent","Cheval","Chèvre","Singe","Coq","Chien","Cochon"];
const ELEMENTS=["Bois","Feu","Terre","Métal","Eau"];
const STONES=["Grenat","Améthyste","Aigue-marine","Diamant","Émeraude","Perle","Rubis","Péridot","Saphir","Opale","Topaze","Turquoise"];
const FLOWERS=["Œillet","Violette","Jonquille","Pâquerette","Muguet","Rose","Delphinium","Glaïeul","Myosotis","Souci","Chrysanthème","Houx"];
const DAYS=["dimanche","lundi","mardi","mercredi","jeudi","vendredi","samedi"];
const MONTHS=["janvier","février","mars","avril","mai","juin","juillet","août","septembre","octobre","novembre","décembre"];
const $=id=>document.getElementById(id);
const pad=n=>String(n).padStart(2,"0");
const T_GEN=SITE_PHRASES.gen||[],T_LOVE=SITE_PHRASES.love||[],T_WORK=SITE_PHRASES.work||[],T_NRG=SITE_PHRASES.nrg||[],T_MANTRA=SITE_PHRASES.mantra||[],T_ASC=SITE_PHRASES.asc||[];
const API="api.php";
async function post(action,body){
 const r=await fetch(API+"?action="+action,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body||{})});
 const j=await r.json().catch(()=>({}));
 if(!r.ok&&j.error===undefined) j.error="Connexion impossible. Réessaie plus tard.";
 return j;
}

function sunSignOf(m,d){
 const starts=[[1,20,"Verseau"],[2,19,"Poissons"],[3,21,"Bélier"],[4,20,"Taureau"],[5,21,"Gémeaux"],[6,21,"Cancer"],[7,23,"Lion"],[8,23,"Vierge"],[9,23,"Balance"],[10,23,"Scorpion"],[11,22,"Sagittaire"],[12,22,"Capricorne"]];
 let cur="Capricorne";
 for(const [mm,dd,n] of starts){ if(m>mm||(m===mm&&d>=dd)) cur=n; }
 return cur;
}
function lifePath(y,m,d){
 const red=n=>{while(n>9&&n!==11&&n!==22&&n!==33){n=String(n).split("").reduce((a,c)=>a+ +c,0)}return n};
 return red(red(y)+red(m)+red(d));
}
function chinese(y,m,d){
 let ry=y;
 try{
  const p=new Intl.DateTimeFormat("fr-u-ca-chinese",{year:"numeric"}).formatToParts(new Date(Date.UTC(y,m-1,d,12)));
  const r=p.find(x=>x.type==="relatedYear"); if(r) ry=+r.value;
 }catch(e){}
 return ANIMALS[((ry-4)%12+12)%12]+" de "+ELEMENTS[Math.floor((((ry-4)%10)+10)%10/2)];
}
function generation(y){
 return y>=2013?"Génération Alpha":y>=1997?"Génération Z":y>=1981?"Génération Y (Millennials)":y>=1965?"Génération X":y>=1946?"Baby-boomers":"Génération d'avant 1946";
}
function moon(jd){
 const P=29.530588853,age=(((jd-2451550.1)%P)+P)%P,ill=Math.round((1-Math.cos(2*Math.PI*age/P))/2*100);
 const n=["Nouvelle lune","Premier croissant","Premier quartier","Lune gibbeuse croissante","Pleine lune","Lune gibbeuse décroissante","Dernier quartier","Dernier croissant"];
 return n[Math.floor(((age/P)*8+.5))%8]+" ("+ill+" % éclairée)";
}
function tzOffset(tz,t){
 const p=Object.fromEntries(new Intl.DateTimeFormat("en-US",{timeZone:tz,hourCycle:"h23",year:"numeric",month:"numeric",day:"numeric",hour:"numeric",minute:"numeric",second:"numeric"}).formatToParts(new Date(t)).map(x=>[x.type,x.value]));
 const asUTC=Date.UTC(+p.year,+p.month-1,+p.day,+p.hour,+p.minute,+p.second);
 return (asUTC-Math.floor(t/1000)*1000)/60000;
}
function localToUTC(y,m,d,h,mi,tz){
 const base=Date.UTC(y,m-1,d,h,mi); let t=base;
 for(let i=0;i<2;i++) t=base-tzOffset(tz,t)*60000;
 return t;
}
function ascendant(jd,lat,lon){
 const rad=Math.PI/180,T=(jd-2451545)/36525;
 let gmst=280.46061837+360.98564736629*(jd-2451545);
 const ramc=(((gmst+lon)%360)+360)%360*rad;
 const eps=(23.4392911-0.0130042*T)*rad,phi=lat*rad;
 let a=Math.atan2(Math.cos(ramc),-(Math.sin(ramc)*Math.cos(eps)+Math.tan(phi)*Math.sin(eps)))/rad;
 a=((a%360)+360)%360;
 return SIGNS[Math.floor(a/30)]+" ("+Math.floor(a%30)+"°)";
}
function ageText(y,m,d){
 const now=new Date();let yy=now.getFullYear()-y,mm=now.getMonth()+1-m,dd=now.getDate()-d;
 if(dd<0){mm--;dd+=new Date(now.getFullYear(),now.getMonth(),0).getDate()}
 if(mm<0){yy--;mm+=12}
 const next=new Date(now.getFullYear(),m-1,d);const today=new Date(now.getFullYear(),now.getMonth(),now.getDate());
 if(next<today) next.setFullYear(next.getFullYear()+1);
 const left=Math.round((next-today)/864e5);
 return [yy+" ans, "+mm+" mois, "+dd+" jours", left===0?"C'est aujourd'hui !":left+" jours"];
}
function fill(ul,items){
 ul.replaceChildren();
 items.forEach(([lead,text])=>{
  const li=document.createElement("li");
  const b=document.createElement("b");b.textContent=lead;li.append(b,document.createTextNode(text));ul.append(li);
 });
}
function spread(arr,n){
 if(arr.length<=n) return arr;
 const out=[];for(let i=0;i<n;i++) out.push(arr[Math.floor(i*arr.length/n)]);return out;
}
function dayOfYear(m,d){return Math.round((Date.UTC(2001,m-1,d)-Date.UTC(2001,0,1))/864e5)}
function animeOn(m,d){const k=pad(m)+"-"+pad(d);return CHARACTERS.filter(c=>c[2]===k).sort((a,b)=>(b[3]?1:0)-(a[3]?1:0))}
function villains(m,d){
 const list=animeOn(m,d),ul=$("vil"),ants=list.filter(c=>c[3]);ul.replaceChildren();
 const add=(lead,text,vil)=>{const li=document.createElement("li");if(vil)li.className="vil";if(lead){const b=document.createElement("b");b.textContent=lead;li.append(b)}li.append(document.createTextNode(text));ul.append(li)};
 $("vilSub").textContent=list.length?"Nés le "+d+" "+MONTHS[m-1]+(ants.length?" : les antagonistes d'abord.":". Aucun antagoniste ce jour-là."):"Aucun personnage enregistré ce jour-là.";
 list.forEach(c=>add(c[3]?"Antagoniste":"",c[0]+" ("+c[1]+")",c[3]));
 if(!ants.length){
  const me=dayOfYear(m,d);
  const r=CHARACTERS.filter(c=>c[3]).map(c=>{const [cm,cd]=c[2].split("-").map(Number);const g=Math.abs(dayOfYear(cm,cd)-me);return {c,g:Math.min(g,365-g)}}).sort((a,b)=>a.g-b.g)[0];
  if(r) add("Le plus proche",r.c[0]+" ("+r.c[1]+"), antagoniste né le "+(+r.c[2].slice(3))+" "+MONTHS[+r.c[2].slice(0,2)-1]+", à "+r.g+" jour"+(r.g>1?"s":"")+" d'écart.",true);
 }
}
async function geocode(name){
 const r=await fetch("https://geocoding-api.open-meteo.com/v1/search?count=1&language=fr&name="+encodeURIComponent(name));
 const j=await r.json();return j.results&&j.results[0];
}
async function history(y,m,d){
 const r=await fetch("https://api.wikimedia.org/feed/v1/wikipedia/fr/onthisday/all/"+pad(m)+"/"+pad(d));
 if(!r.ok) throw new Error("wiki");
 return r.json();
}

const TRAITS={
"Bélier":["ton sens de l'initiative","ton impulsivité","dynamique"],
"Taureau":["ta constance","ton entêtement","posée"],
"Gémeaux":["ton sens du contact","ta dispersion","vive"],
"Cancer":["ton intuition","ta sensibilité excessive","protectrice"],
"Lion":["ta générosité","ton orgueil","brillante"],
"Vierge":["ton sens de l'analyse","ton perfectionnisme","méthodique"],
"Balance":["ta diplomatie","ton indécision","harmonieuse"],
"Scorpion":["ta détermination","ton esprit possessif","intense"],
"Sagittaire":["ton optimisme","ton goût de l'excès","aventureuse"],
"Capricorne":["ta discipline","ta rigidité","structurée"],
"Verseau":["ton originalité","ta distance","inventive"],
"Poissons":["ton empathie","ta tendance à rêver","douce"]
};
const COLORS=["Bleu nuit","Vert sauge","Jaune safran","Rouge brique","Blanc cassé","Violet","Orange","Turquoise"];
function seedOf(str){let h=1779033703^str.length;for(let i=0;i<str.length;i++){h=Math.imul(h^str.charCodeAt(i),3432918353);h=h<<13|h>>>19}return()=>{h=Math.imul(h^h>>>16,2246822507);h=Math.imul(h^h>>>13,3266489909);return((h^=h>>>16)>>>0)/4294967296}}
function moonSign(jd){const d=jd-2451545,r=Math.PI/180,M=(134.963+13.064993*d)*r;let L=218.316+13.176396*d+6.289*Math.sin(M);L=((L%360)+360)%360;return SIGNS[Math.floor(L/30)]}
let hSign=null,hAsc=null,hDate=new Date();
function stars(n){return "★".repeat(n)+"☆".repeat(5-n)}
function renderHoro(){
 if(!hSign) return;
 const y=hDate.getFullYear(),m=hDate.getMonth()+1,d=hDate.getDate();
 const rnd=seedOf(hSign+"|"+y+"-"+m+"-"+d),pick=a=>a[Math.floor(rnd()*a.length)];
 const [f,p]=TRAITS[hSign],jd=Date.UTC(y,m-1,d,12)/864e5+2440587.5,ms=moonSign(jd);
 $("hDate").textContent=hSign+" : "+hDate.toLocaleDateString("fr-FR",{weekday:"long",day:"numeric",month:"long",year:"numeric"})+".";
 const tips=[
  ["Conseil du jour",pick(T_GEN).replace("{f}",f).replace("{p}",p)],
  ["Amour et relations",pick(T_LOVE)],
  ["Travail et argent",pick(T_WORK)],
  ["Énergie et santé",pick(T_NRG)],
  ["Mantra du jour",pick(T_MANTRA)],
  ["Ciel du jour","La Lune traverse le "+ms+" : l'ambiance est plutôt "+TRAITS[ms][2]+"."]
 ];
 if(hAsc){const r2=seedOf(hAsc+"|asc|"+y+"-"+m+"-"+d),q=a=>a[Math.floor(r2()*a.length)],[af,ap]=TRAITS[hAsc];tips.splice(1,0,["Pour ton ascendant",q(T_ASC).replace("{a}",hAsc).replace("{f}",af).replace("{p}",ap)])}
 const box=$("hTips");box.replaceChildren();
 tips.forEach(([t,v])=>{const w=document.createElement("div");w.className="tip";const b=document.createElement("b");b.textContent=t+" : ";w.append(b,document.createTextNode(v));box.append(w)});
 const facts=[["Amour",stars(1+Math.floor(rnd()*5))],["Travail",stars(1+Math.floor(rnd()*5))],["Énergie",stars(1+Math.floor(rnd()*5))],["Chiffre porte-bonheur",String(1+Math.floor(rnd()*99))],["Couleur du jour",pick(COLORS)]];
 const dl=$("hFacts");dl.replaceChildren();
 facts.forEach(([t,v])=>{const w=document.createElement("div"),a=document.createElement("dt"),b=document.createElement("dd");a.textContent=t;b.textContent=v;w.append(a,b);dl.append(w)});
}
function shiftDay(n){hDate=new Date(hDate.getFullYear(),hDate.getMonth(),hDate.getDate()+n);renderHoro()}
$("hPrev").addEventListener("click",()=>shiftDay(-1));
$("hNext").addEventListener("click",()=>shiftDay(1));
$("hToday").addEventListener("click",()=>{hDate=new Date();renderHoro()});

let shareMsg="";
function buildShare(wd,d,m,y,sun,asc,cn,exact){
 const url=/^https?:/.test(location.protocol)?location.href.split("#")[0]:"";
 let t="Je suis né un "+wd+" "+d+" "+MONTHS[m-1]+" "+y+". Signe : "+sun+(asc&&!/nécessaire|Non/.test(asc)?", ascendant : "+asc.replace(/ \(.*/,""):"")+", astrologie chinoise : "+cn+".";
 if(exact.length) t+=" Je suis né le même jour que "+exact[0][0]+" ("+exact[0][1]+") !";
 t+=" Découvre le tien sur Même Jour";
 return t+(url?" : "+url:".");
}
function shNote(t){$("shNote").textContent=t}
$("shWa").addEventListener("click",()=>{if(shareMsg) window.open("https://wa.me/?text="+encodeURIComponent(shareMsg),"_blank","noopener")});
$("shNative").addEventListener("click",async()=>{
 if(!shareMsg) return;
 if(navigator.share){try{await navigator.share({text:shareMsg})}catch(e){}}
 else shNote("Le partage direct n'est pas disponible sur cet appareil : utilise WhatsApp ou copie le texte.");
});
$("shCopy").addEventListener("click",async()=>{
 if(!shareMsg) return;
 try{await navigator.clipboard.writeText(shareMsg);shNote("Texte copié. Colle-le où tu veux.")}
 catch(e){shNote("Copie impossible : sélectionne et copie le texte manuellement.")}
});

if(CHAT_ON){$("subSec").classList.remove("hid");$("chatSec").classList.remove("hid")}
let lastBirth=null;
(()=>$("sf").addEventListener("submit",async ev=>{
 ev.preventDefault();const b=$("sMsg");
 if(!$("sConsent").checked){b.textContent="Coche la case pour accepter d'être contacté.";return}
 try{
  const j=await post("subscribe",{email:$("sEmail").value.trim().toLowerCase(),whatsapp:$("sWa").value.trim()||null,birth_date:lastBirth?lastBirth.date:null,sign:lastBirth?lastBirth.sign:null});
  b.textContent=j.ok?"Merci, c'est enregistré.":(j.error||"Inscription impossible. Vérifie ton e-mail et réessaie.");
  if(j.ok)$("sf").reset();
 }catch(e){b.textContent="Connexion impossible. Réessaie plus tard."}
}))();
if(WHATSAPP){const a=$("waBtn");a.href="https://wa.me/"+String(WHATSAPP).replace(/\D/g,"");a.classList.remove("hid")}

const LS={get(k){try{return localStorage.getItem(k)}catch(e){return null}},set(k,v){try{localStorage.setItem(k,v)}catch(e){}},del(k){try{localStorage.removeItem(k)}catch(e){}}};
let autoRun=false,chatDay=null,chatTimer=null,lastSend=0,chatFirst=true;
const reported=new Set((()=>{try{return JSON.parse(LS.get("mj_rep")||"[]")}catch(e){return[]}})());
async function loadChat(){
 if(!CHAT_ON||!chatDay) return;
 try{
  const r=await fetch(API+"?action=messages&day="+chatDay);
  if(!r.ok) return;
  const j=await r.json(),list=(j.messages||[]).reverse(),ul=$("chatList");
  const stick=chatFirst||ul.scrollTop+ul.clientHeight>=ul.scrollHeight-40;
  ul.replaceChildren();
  if(!list.length){const li=document.createElement("li");li.textContent="Aucun message pour l'instant. Lance la discussion !";ul.append(li)}
  list.forEach(m=>{
   const li=document.createElement("li"),meta=document.createElement("span"),b=document.createElement("b");
   meta.className="meta";b.textContent=m.pseudo;
   meta.append(b,document.createTextNode(" · "+new Date(m.created_at.replace(" ","T")).toLocaleString("fr-FR",{day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"})));
   const rep=document.createElement("button");rep.type="button";rep.className="rep";
   if(reported.has(+m.id)){rep.textContent="Signalé";rep.disabled=true}
   else{rep.textContent="Signaler";rep.addEventListener("click",async()=>{
    try{const j=await post("report",{message_id:+m.id});if(j.ok){reported.add(+m.id);LS.set("mj_rep",JSON.stringify([...reported]));rep.textContent="Signalé";rep.disabled=true}}catch(e){}
   })}
   meta.append(rep);li.append(meta,document.createTextNode(m.body));ul.append(li);
  });
  if(stick) ul.scrollTop=ul.scrollHeight;
  chatFirst=false;
 }catch(e){}
}
function openChat(m,d){
 chatDay=pad(m)+"-"+pad(d);chatFirst=true;
 $("chatTitle").textContent="Le salon du "+d+" "+MONTHS[m-1];
 clearInterval(chatTimer);loadChat();
 chatTimer=setInterval(()=>{if(!document.hidden)loadChat()},6000);
}
$("cf").addEventListener("submit",async ev=>{
 ev.preventDefault();const note=$("cMsg");
 const pseudo=$("cPseudo").value.trim(),body=$("cBody").value.trim();
 if(pseudo.length<2||pseudo.length>24){note.textContent="Choisis un pseudo de 2 à 24 caractères.";return}
 if(!body||!chatDay) return;
 if(/(https?:\/\/|www\.|\.com|\.net)/i.test(body)){note.textContent="Les liens ne sont pas autorisés.";return}
 if(Date.now()-lastSend<4000){note.textContent="Doucement : attends quelques secondes entre deux messages.";return}
 lastSend=Date.now();
 try{
  const j=await post("message",{day:chatDay,pseudo,body});
  if(j.ok){LS.set("mj_pseudo",pseudo);$("cBody").value="";note.textContent="";loadChat()}
  else note.textContent=/Trop de/.test(j.error||"")?"Trop de messages : réessaie dans une minute.":(j.error||"Envoi impossible. Les liens, les pseudos réservés et les messages trop longs sont refusés.");
 }catch(e){note.textContent="Connexion impossible. Réessaie."}
});
$("forget").addEventListener("click",()=>{
 LS.del("mj_profile");LS.del("mj_pseudo");$("f").reset();$("cPseudo").value="";$("forget").classList.add("hid");
 $("msg").textContent="Tes données ont été effacées de cet appareil.";
});
const line=e=>[String(e.year??""),e.text||""];

$("f").addEventListener("submit",async ev=>{
 ev.preventDefault();
 const [y,m,d]=$("date").value.split("-").map(Number);
 if(!y) return;
 const auto=autoRun;autoRun=false;
 const time=$("time").value,place=$("place").value.trim(),msg=$("msg");
 $("go").disabled=true;msg.textContent="Calcul en cours…";
 const wd=DAYS[new Date(Date.UTC(y,m-1,d,12)).getUTCDay()];
 let h=12,mi=0,tz=null,lat=null,lon=null,placeName="",asc="Non calculé (heure et ville nécessaires)";
 if(time){[h,mi]=time.split(":").map(Number)}
 let notes=[];
 if(place){
  try{
   const g=await geocode(place);
   if(g){lat=g.latitude;lon=g.longitude;tz=g.timezone;placeName=g.name+(g.country?", "+g.country:"")}
   else notes.push("Ville introuvable : vérifie l'orthographe pour obtenir l'ascendant.");
  }catch(e){notes.push("Recherche de la ville impossible : vérifie ta connexion.")}
 }
 const utc=tz?localToUTC(y,m,d,h,mi,tz):Date.UTC(y,m-1,d,h,mi);
 const jd=utc/864e5+2440587.5;
 if(tz&&time) asc=ascendant(jd,lat,lon);
 else if(tz&&!time) asc="Heure de naissance nécessaire";
 const [age,left]=ageText(y,m,d);
 $("headline").textContent="Tu es né un "+wd+" "+d+" "+MONTHS[m-1]+" "+y+(placeName?", à "+placeName:"")+".";
 const facts=[
  ["Signe solaire",sunSignOf(m,d)],["Ascendant",asc],["Astrologie chinoise",chinese(y,m,d)],
  ["Lune à ta naissance",moon(jd)],["Âge exact",age],["Prochain anniversaire",left],
  ["Chemin de vie (numérologie)",String(lifePath(y,m,d))],["Pierre de naissance",STONES[m-1]],
  ["Fleur de naissance",FLOWERS[m-1]],["Génération",generation(y)]
 ];
 const dl=$("facts");dl.replaceChildren();
 facts.forEach(([t,v])=>{const w=document.createElement("div"),a=document.createElement("dt"),b=document.createElement("dd");a.textContent=t;b.textContent=v;w.append(a,b);dl.append(w)});
 villains(m,d);
 lastBirth={date:$("date").value,sign:sunSignOf(m,d)};
 if($("rem").checked){LS.set("mj_profile",JSON.stringify({date:$("date").value,time:$("time").value,place:$("place").value}));$("forget").classList.remove("hid")}
 else LS.del("mj_profile");
 if(CHAT_ON)openChat(m,d);
 if(CHAT_ON&&!auto)post("stat",{sign:lastBirth.sign}).catch(()=>{});
 shareMsg=buildShare(wd,d,m,y,sunSignOf(m,d),asc,chinese(y,m,d),animeOn(m,d));shNote("Le partage ne contient ni l'heure ni la ville de naissance.");
 hSign=sunSignOf(m,d);hAsc=SIGNS.find(x=>asc.startsWith(x))||null;hDate=new Date();renderHoro();
 $("out").classList.remove("hid");
 try{
  const data=await history(y,m,d);
  const all=[...(data.events||[]),...(data.births||[]),...(data.deaths||[])];
  const same=all.filter(e=>e.year===y);
  $("yearSub").textContent=same.length?"Événements, naissances et décès enregistrés le "+d+" "+MONTHS[m-1]+" "+y+".":"Wikipédia n'a rien de noté précisément le "+d+" "+MONTHS[m-1]+" "+y+".";
  fill($("yearEv"),same.map(line));
  fill($("births"),spread((data.births||[]).filter(e=>e.year!==y),10).map(line));
  fill($("events"),spread(data.events||[],8).map(line));
 }catch(e){
  notes.push("Impossible de charger l'histoire du jour : vérifie ta connexion, puis réessaie.");
  ["yearEv","births","events"].forEach(i=>$(i).replaceChildren());
 }
 msg.textContent=notes.join(" ");
 $("go").disabled=false;
 if(!auto)$("headline").scrollIntoView({behavior:"smooth",block:"start"});
});
(()=>{
 let p=null;try{p=JSON.parse(LS.get("mj_profile")||"")}catch(e){}
 $("cPseudo").value=LS.get("mj_pseudo")||"";
 if(p&&p.date){$("date").value=p.date;$("time").value=p.time||"";$("place").value=p.place||"";$("forget").classList.remove("hid");autoRun=true;$("go").click()}
})();
