// Même Jour — tableau de bord d'administration. Connexion gérée par api.php (sessions PHP).
const $=id=>document.getElementById(id);
function h(tag,attrs={},...kids){
 const e=document.createElement(tag);
 for(const [k,v] of Object.entries(attrs)){ if(k==="class")e.className=v; else if(k==="on"||k==="onclick"||k==="onchange")e.addEventListener(k.slice(2),v); else if(v!==false&&v!=null)e.setAttribute(k,v===true?"":v) }
 kids.flat().forEach(c=>e.append(c instanceof Node?c:document.createTextNode(c==null?"":String(c))));
 return e;
}
let CSRF="";
const MONTHS=["janvier","février","mars","avril","mai","juin","juillet","août","septembre","octobre","novembre","décembre"];
const PHRASE_CATS={gen:"Conseil du jour",love:"Amour et relations",work:"Travail et argent",nrg:"Énergie et santé",mantra:"Mantra du jour",asc:"Ascendant"};
const TEXTS_LABELS={h1:"Titre principal",lead:"Texte d'introduction",btn_go:"Bouton principal",horo_note:"Note sous l'horoscope",sub_title:"Titre de l'inscription",sub_text:"Texte de l'inscription",about_title:"Titre « à propos »",about_text:"Texte « à propos »"};

function say(t,cls){const m=$("msg");m.textContent=t;m.className=cls||"mut"}
async function api(action,body,method="GET"){
 const opt={method,headers:{"X-CSRF":CSRF}};
 if(method==="POST"){opt.headers["Content-Type"]="application/json";opt.body=JSON.stringify(body||{})}
 const r=await fetch("api.php?"+new URLSearchParams({action,...strip(body,method)}).toString(),opt);
 if(r.status===401){showLogin();throw new Error("401")}
 if(!r.ok) throw new Error((await r.text())||r.status);
 return r.json();
}
function strip(body,method){
 if(method!=="GET"||!body) return {};
 const p={};
 for(const [k,v] of Object.entries(body)) if(v!=null&&typeof v!=="object") p[k]=v;
 return p;
}
function showDashboard(){$("login").classList.add("hid");$("app").classList.remove("hid")}
function showLogin(){$("app").classList.add("hid");$("login").classList.remove("hid")}

const TABS=[["stats","Statistiques"],["users","Utilisateurs"],["villains","Personnages"],["phrases","Phrases"],["messages","Messages"],["texts","Textes"]];
const show=k=>{
 document.querySelectorAll("#tabs button").forEach(b=>b.classList.toggle("on",b.dataset.k===k));
 say("Chargement…");$("view").replaceChildren();
 VIEWS[k]().then(()=>say("")).catch(e=>{if(e.message!=="401")say("Erreur : "+e.message,"err")});
};

const VIEWS={
 async stats(){
  const j=await api("admin_stats"),s=j.stats;
  const max=j.bySign.length?j.bySign[0].n:1, maxD=j.byDay.length?Math.max(...j.byDay.map(x=>+x.n)):1;
  $("view").append(
   h("div",{class:"grid"},...[["Calculs au total",s.total],["Dernières 24 h",s.day],["7 derniers jours",s.week],["Inscrits",s.subs]].map(([l,v])=>h("div",{class:"card"},h("div",{class:"num"},v),h("div",{class:"mut"},l)))),
   h("h2",{},"Répartition par signe"),
   h("div",{class:"card"},j.bySign.length?j.bySign.map(r=>h("div",{class:"line"},r.s,h("div",{class:"bar",style:"width:"+Math.round(r.n/max*100)+"%"}),String(r.n))):h("span",{class:"mut"},"Aucune donnée pour l'instant.")),
   h("h2",{},"Derniers jours"),
   h("div",{class:"card"},j.byDay.length?j.byDay.map(r=>h("div",{class:"line"},r.d,h("div",{class:"bar",style:"width:"+Math.round(r.n/maxD*100)+"%"}),String(r.n))):h("span",{class:"mut"},"Aucune donnée pour l'instant.")),
   h("p",{class:"mut"},"Les statistiques ne comptent que les 1 000 derniers calculs."));
 },
 async users(){
  const j=await api("admin_subscribers"),u=j.subscribers;
  const del=async id=>{if(confirm("Supprimer cet inscrit ?")){await api("admin_subscriber_delete",{id},"POST");show("users")}};
  $("view").append(
   h("p",{},h("b",{},u.length+" inscrit(s). "),h("button",{class:"alt",type:"button",onclick:()=>{location.href="api.php?action=admin_subscribers_export"}},"Exporter en CSV")),
   h("div",{class:"card wrap"},h("table",{},
    h("thead",{},h("tr",{},...["Date","E-mail","WhatsApp","Naissance","Signe",""].map(x=>h("th",{},x)))),
    h("tbody",{},u.map(x=>h("tr",{},
     h("td",{},new Date(x.created_at.replace(" ","T")).toLocaleDateString("fr-FR")),
     h("td",{},x.email),h("td",{},x.whatsapp||""),h("td",{},x.birth_date||""),h("td",{},x.signe||""),
     h("td",{},h("button",{class:"del",type:"button",onclick:()=>del(+x.id)},"Supprimer"))))))));
 },
 async villains(){
  const mo=sessionStorage.getItem("vm")||"01";
  const j=await api("admin_characters"+(mo?"&month="+mo:"")),v=j.characters;
  const OK=/^(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$/;
  const sel=h("select",{onchange:e=>{sessionStorage.setItem("vm",e.target.value);show("villains")}},
   MONTHS.map((x,i)=>h("option",{value:String(i+1).padStart(2,"0"),selected:String(i+1).padStart(2,"0")===mo},x)));
  const yn=val=>{const s=h("select",{},h("option",{value:"0"},"Personnage"),h("option",{value:"1"},"Antagoniste"));s.value=val?"1":"0";return s};
  const nn=h("input",{placeholder:"Nom"}),ns=h("input",{placeholder:"Série"}),nb=h("input",{placeholder:"MM-JJ",maxlength:"5",value:mo+"-"}),na=yn(false);
  const form=h("div",{class:"card"},h("b",{},"Ajouter un personnage"),
   h("div",{class:"row",style:"margin-top:8px"},nn,ns,nb,na,
    h("button",{type:"button",onclick:async()=>{
     if(!OK.test(nb.value.trim())){say("Date au format MM-JJ.","err");return}
     try{await api("admin_character_save",{name:nn.value.trim(),series:ns.value.trim(),birthday:nb.value.trim(),antagonist:na.value==="1"},"POST");show("villains")}catch(e){say("Erreur : "+e.message,"err")}
    }},"Ajouter"))),
   add=h("button",{class:"alt",type:"button",onclick:async()=>{
    try{say("Import en cours…");await api("admin_characters_import",{},"POST");show("villains")}catch(e){say("Erreur : "+e.message,"err")}
   }},"Importer la liste par défaut");
  const rows=v.map(x=>{
   const n=h("input",{value:x.name}),s=h("input",{value:x.series}),b=h("input",{value:x.birthday,maxlength:"5"}),t=yn(+x.antagonist);
   return h("div",{class:"row"},n,s,b,t,
    h("button",{type:"button",onclick:async()=>{if(!OK.test(b.value.trim())){say("Date au format MM-JJ.","err");return}
     try{await api("admin_character_save",{id:+x.id,name:n.value.trim(),series:s.value.trim(),birthday:b.value.trim(),antagonist:t.value==="1"},"POST");say("Enregistré.","ok")}catch(e){say("Erreur : "+e.message,"err")}}},"Enregistrer"),
    h("button",{class:"del",type:"button",onclick:async()=>{if(confirm("Supprimer "+x.name+" ?")){try{await api("admin_character_delete",{id:+x.id},"POST");show("villains")}catch(e){say("Erreur : "+e.message,"err")}}}},"Supprimer"));
  });
  $("view").append(h("label",{},"Mois",sel),form,h("p",{class:"mut"},j.count+" personnage(s) en base. "+(j.count?0===v.length?"Le mois sélectionné n'a aucun personnage.":"":"Le site utilise sa liste par défaut si la base est vide.")),j.count?"":add,...rows);
 },
 async phrases(){
  const j=await api("admin_phrases"),p=j.phrases;
  const cat=sessionStorage.getItem("pc")||"gen";
  const sel=h("select",{onchange:e=>{sessionStorage.setItem("pc",e.target.value);show("phrases")}},
   Object.entries(PHRASE_CATS).map(([k,l])=>h("option",{value:k,selected:k===cat},l)));
  const mine=p.filter(x=>x.category===cat);
  const hint=cat==="gen"||cat==="asc"?"Utilise {f} pour la force du signe et {p} pour son point de vigilance"+(cat==="asc"?", et {a} pour le signe de l'ascendant.":"."):"";
  const add=h("div",{class:"card"},h("b",{},"Ajouter une phrase"),hint?h("p",{class:"mut"},hint):"",h("textarea",{id:"np",maxlength:"400"}),
   h("p",{},h("button",{type:"button",onclick:async()=>{const t=$("np").value.trim();if(!t){say("Écris une phrase.","err");return}
    try{await api("admin_phrase_save",{category:cat,text:t},"POST");show("phrases")}catch(e){say("Erreur : "+e.message,"err")}}},"Ajouter")));
  const rows=mine.map(x=>{const t=h("textarea",{maxlength:"400"});t.value=x.text;
   return h("div",{class:"prow"},t,
    h("button",{type:"button",onclick:async()=>{try{await api("admin_phrase_save",{id:+x.id,category:cat,text:t.value.trim()},"POST");say("Enregistré.","ok")}catch(e){say("Erreur : "+e.message,"err")}}},"Enregistrer"),
    h("button",{class:"del",type:"button",onclick:async()=>{if(confirm("Supprimer cette phrase ?")){try{await api("admin_phrase_delete",{id:+x.id},"POST");show("phrases")}catch(e){say("Erreur : "+e.message,"err")}}}},"Supprimer"))});
  const imp=h("button",{class:"alt",type:"button",onclick:async()=>{
   try{await api("admin_phrases_import",{category:cat},"POST");show("phrases")}catch(e){say("Erreur : "+e.message,"err")}
  }},"Importer les phrases par défaut");
  $("view").append(h("label",{},"Catégorie",sel),add,h("p",{class:"mut"},mine.length?mine.length+" phrase(s) : le site utilise uniquement cette liste.":"Aucune phrase enregistrée : le site utilise ses phrases par défaut."),...rows,mine.length?"":imp);
 },
 async messages(){
  const j=await api("admin_messages"),m=j.messages.sort((a,b)=>(+b.reports)-(+a.reports));
  $("view").append(h("p",{class:"mut"},m.length+" message(s) récents. Les messages signalés apparaissent en premier."),
   ...m.map(x=>h("div",{class:"card"},
    h("div",{class:"mut"},x.day+" · "+x.pseudo+" · "+new Date(x.created_at.replace(" ","T")).toLocaleString("fr-FR")+(+x.reports?" · "+x.reports+" signalement(s)":"")+(+x.hidden?" · masqué":"")),
    h("p",{},x.body),
    h("button",{class:"alt",type:"button",onclick:async()=>{try{await api("admin_message_toggle",{id:+x.id},"POST");show("messages")}catch(e){say("Erreur : "+e.message,"err")}}},+x.hidden?"Réafficher":"Masquer")," ",
    h("button",{class:"del",type:"button",onclick:async()=>{if(confirm("Supprimer ce message ?")){try{await api("admin_message_delete",{id:+x.id},"POST");show("messages")}catch(e){say("Erreur : "+e.message,"err")}}}},"Supprimer"))));
 },
 async texts(){
  const j=await api("admin_texts");
  const fields={};
  const items=Object.entries(TEXTS_LABELS).map(([k,label])=>{const a=h("textarea",{maxlength:"600"});a.value=j.texts[k]||"";fields[k]=a;return h("label",{},label,a)});
  $("view").append(h("div",{class:"card"},...items,h("button",{type:"button",onclick:async()=>{
   try{const body={};for(const k in fields)body[k]=fields[k].value.trim();await api("admin_texts_save",{texts:body},"POST");say("Textes enregistrés.","ok")}catch(e){say("Erreur : "+e.message,"err")}
  }},"Enregistrer les textes")));
 }
};
$("tabs").replaceChildren(...TABS.map(([k,l])=>h("button",{type:"button","data-k":k,onclick:()=>show(k)},l)));
$("out").addEventListener("click",async()=>{try{await fetch("api.php?action=logout",{method:"POST"})}catch(e){}showLogin()});

$("login").addEventListener("submit",async ev=>{
 ev.preventDefault();$("lmsg").textContent="";
 try{
  const r=await fetch("api.php?action=login",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email:$("email").value.trim(),pwd:$("pwd").value})});
  const j=await r.json();
  if(j.ok){CSRF=j.csrf;$("#pwd").value="";showDashboard();show("stats")}
  else $("lmsg").textContent=j.error||"Identifiants incorrects.";
 }catch(e){$("lmsg").textContent="Connexion impossible. Vérifie ta connexion internet."}
});

(async()=>{
 try{
  const j=await (await fetch("api.php?action=me")).json();
  if(j.ok&&j.admin){CSRF=j.csrf;showDashboard();show("stats")}
 }catch(e){}
})();
