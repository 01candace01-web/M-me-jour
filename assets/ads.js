/* Google AdSense : configure ton identifiant \u00e9diteur ci-dessous (une seule ligne \u00e0 changer).
   Tant que ADSENSE_CLIENT est vide, les emplacements publicitaires restent masqu\u00e9s :
   le site s'affiche normalement, sans publicit\u00e9. */
const ADSENSE_CLIENT = "";

/* \u00c0 partir d'ici, ne rien modifier. */
(function () {
  "use strict";
  const slots = document.querySelectorAll(".ad-slot");
  if (!slots.length) { return; }
  if (!/^ca-pub-\d{10,}$/.test(ADSENSE_CLIENT)) {
    slots.forEach((s) => { s.closest(".adwrap, .ad-slot").hidden = true; });
    return;
  }
  window.adsbygoogle = window.adsbygoogle || [];
  slots.forEach((s) => {
    const ins = document.createElement("ins");
    ins.className = "adsbygoogle";
    ins.style.display = "block";
    ins.setAttribute("data-ad-client", ADSENSE_CLIENT);
    if (/^\d{10,}$/.test(s.dataset.adSlot || "")) {
      ins.setAttribute("data-ad-slot", s.dataset.adSlot);
    }
    ins.setAttribute("data-ad-format", "auto");
    ins.setAttribute("data-full-width-responsive", "true");
    s.appendChild(ins);
    window.adsbygoogle.push({});
  });
  const js = document.createElement("script");
  js.async = true;
  js.crossOrigin = "anonymous";
  js.src = "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=" + encodeURIComponent(ADSENSE_CLIENT);
  document.head.appendChild(js);
})();
