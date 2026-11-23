/* Ton jour Fâ — tout est calculé dans le navigateur, rien n'est envoyé au serveur. */
(function () {
  "use strict";
  const $ = (id) => document.getElementById(id);

  /* Jours de la semaine — Sunday=0 to Saturday=6 (ordre JS).
     Noms fon/adja (Bénin–Togo) et akan (Ghana), orthographes variables selon les régions.
     Sens akan d'après la littérature sur les day names akan. */
  const DAYS = [
    { fr: "dimanche", h: "Kossi", hv: "Kossivi, Kossiwa", f: "Akossiwa", fv: "Akossi", ak: ["Kwasi", "Akosua"], sens: "associé à l\u2019univers" },
    { fr: "lundi", h: "Kodjo", hv: "Kodjovi, Sedjro", f: "Adjoua", fv: "Adjo, Adjowa", ak: ["Kwadwo", "Adwoa"], sens: "associé à la paix" },
    { fr: "mardi", h: "Komlan", hv: "Komlavi", f: "Abla", fv: "Ablavi, Abra", ak: ["Kwabena", "Abena"], sens: "associé à l\u2019océan" },
    { fr: "mercredi", h: "Kokou", hv: "Kokouvi", f: "Akouavi", fv: "Akouwa, Akoué", ak: ["Kwaku", "Akua"], sens: "associé à l\u2019araignée (Anansé)" },
    { fr: "jeudi", h: "Yaovi", hv: "Yao", f: "Yawa", fv: "Ayaba", ak: ["Yaw", "Yaa"], sens: "associé à la terre" },
    { fr: "vendredi", h: "Kofi", hv: "Koffi, Kofiwa", f: "Afi", fv: "Afua", ak: ["Kofi", "Afua"], sens: "associé à la fertilité" },
    { fr: "samedi", h: "Komi", hv: "Kouami", f: "Ama", fv: "Amu", ak: ["Kwame", "Ama"], sens: "associé à Dieu" }
  ];

  /* Signes solaires (zodiaque tropical, dates approchées) */
  const ZOD = [
    [3, 21, "Bélier"], [4, 20, "Taureau"], [5, 21, "Gémeaux"], [6, 21, "Cancer"],
    [7, 23, "Lion"], [8, 23, "Vierge"], [9, 23, "Balance"], [10, 23, "Scorpion"],
    [11, 22, "Sagittaire"], [12, 22, "Capricorne"], [1, 20, "Verseau"], [2, 19, "Poissons"]
  ];
  function zodiaque(m, d) {
    let out = "Capricorne";
    for (let i = ZOD.length - 1; i >= 0; i--) {
      const [zm, zd, n] = ZOD[i];
      if (m > zm || (m === zm && d >= zd)) { out = n; break; }
    }
    return out;
  }

  function renderRes(dd, sex, prenom) {
    const day = DAYS[dd.getDay()];
    const isH = sex === "h";
    const nom = isH ? day.h : day.f;
    $("dnName").textContent = nom;
    $("dnLine").textContent = "Tu es " + (isH ? "un fils" : "une fille") + " du " + day.fr + " — en langue fon/adja, le prénom du jour est « " + nom + " »" + ((isH && day.hv) || (!isH && day.fv) ? 
      " (aussi : " + (isH ? day.hv : day.fv) + ")" : "") + ".";

    /* faits */
    const facts = $("dnFacts");
    facts.innerHTML = "";
    const F = [
      ["Jour de la semaine", day.fr],
      ["Prénom fon/adja", (isH ? day.h : day.f) + (isH ? (day.hv ? " — " + day.hv : "") : (day.fv ? " — " + day.fv : ""))],
      ["Prénom akan (Ghana)", isH ? day.ak[0] : day.ak[1]],
      ["Sens akan traditionnel", day.sens]
    ];
    F.forEach(([k, v]) => {
      const dv = document.createElement("div");
      const dt = document.createElement("dt"); dt.textContent = k;
      const d2 = document.createElement("dd"); d2.textContent = v;
      dv.append(dt, d2);
      facts.append(dv);
    });

    /* prénom saisi → rappel */
    const p = (prenom || "").trim();
    const self = $("dnSelf");
    if (p) {
      self.textContent = "Ton prénom, " + p + ", se joint à ton jour : « " + p + ", " + nom + " le " + day.fr + " ». Beaucoup portent les deux : le prénom de circonstance donné par la famille, et le prénom du jour hérité de la naissance.";
    } else {
      self.textContent = "Astuce : rejoue le calcul avec ton prénom habituel — tu découvriras peut-être que ton « nom de semaine » fait déjà partie de ton entourage (Kossi, Abla, Yao, Kofi…).";
    }

    /* croisement zodiaque */
    const signe = zodiaque(dd.getMonth() + 1, dd.getDate());
    $("znLine").textContent = "Né·e le " + dd.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }) + ", tu es « " + nom + " » du " + day.fr + " dans la tradition fon, et " + signe + " dans le zodiaque tropical occidental. Deux systèmes, deux façons de dire ton jour — libre à toi de les lire ensemble.";

    /* table complète */
    const tb = $("tbl").querySelector("tbody");
    tb.innerHTML = "";
    DAYS.forEach((d, i) => {
      const tr = document.createElement("tr");
      if (i === dd.getDay()) tr.className = "me";
      const tds = [d.fr, d.h + " · " + d.f, d.ak[0] + " · " + d.ak[1], d.sens];
      tds.forEach((v) => { const td = document.createElement("td"); td.textContent = v; tr.append(td); });
      tb.append(tr);
    });

    $("res").classList.remove("hid");
  }

  /* Simulateur pédagogique de l'akplèkan (chapelet divinatoire).
     Une vraie consultation du Fâ se fait auprès d'un bokonon : ceci n'est qu'un jeu de découverte. */
  $("throw") && $("throw").addEventListener("click", () => {
    const fig = (n) => {
      const box = document.createElement("div");
      box.className = "fig";
      for (let r = 0; r < 4; r++) {
        const row = document.createElement("div");
        row.className = "markrow";
        const val = n[r];
        for (let k = 0; k < val; k++) {
          const bar = document.createElement("span");
          bar.className = "bar";
          row.append(bar);
        }
        box.append(row);
      }
      return box;
    };
    const rnd = () => (Math.random() < 0.5 ? 1 : 2);
    const a = [rnd(), rnd(), rnd(), rnd()];
    const b = [rnd(), rnd(), rnd(), rnd()];
    const c1 = $("c1"), c2 = $("c2");
    c1.innerHTML = ""; c2.innerHTML = "";
    c1.append(fig(a)); c2.append(fig(b));
    const same = a.every((v, i) => v === b[i]);
    if (same) {
      $("cdName").textContent = "Signe-mère (meji)";
      const K = a.map((v) => (v === 1 ? "I" : "II")).join(" ");
      $("cdSub").textContent = "Les deux colonnes sont identiques (" + K + ") : comme Gbe-Meji (tout simple) ou Yeku-Meji (tout double), tu es tombé sur un des seize signes-mères du Fâ — ceux dont le bokonon connaît les vers et les interdits.";
    } else {
      $("cdName").textContent = "Signe secondaire (douvi)";
      $("cdSub").textContent = "Les deux colonnes diffèrent : c'est un « enfant de signes » (douvi/vikando). Près de 240 figures de ce type composent le Fâ, chacune croisant deux signes-mères.";
    }
  });

  $("fafa") && $("fafa").addEventListener("submit", (ev) => {
    ev.preventDefault();
    const v = $("d").value;
    if (!v) { $("m").textContent = "Choisis ta date de naissance."; return; }
    const dd = new Date(v + "T12:00:00");
    renderRes(dd, $("s").value, $("p").value);
    $("m").textContent = "";
    $("res").scrollIntoView({ behavior: "smooth", block: "start" });
  });
})();
