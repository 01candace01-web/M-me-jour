<?php
/**
 * Même Jour — page principale (PHP + MySQL).
 */

require_once __DIR__ . '/db.php';

$def = defaults();
$characters = $def['characters'];
$phrases = $def['phrases'];
$texts = $def['texts'];
$hasDb = true;

try {
    $pdo = db();
    $trows = $pdo->query('SELECT k, value FROM site_texts')->fetchAll(PDO::FETCH_KEY_PAIR);
    foreach ($trows as $k => $v) {
        $texts[$k] = $v;
    }
    $crows = $pdo->query('SELECT name, series, birthday, antagonist FROM characters')->fetchAll();
    if ($crows) {
        $characters = array_map(fn($r) => [
            $r['name'], $r['series'], $r['birthday'], (int)$r['antagonist'],
        ], $crows);
    }
    $prows = $pdo->query('SELECT category, text FROM phrases')->fetchAll();
    if ($prows) {
        $fromDb = ['gen' => [], 'love' => [], 'work' => [], 'nrg' => [], 'mantra' => [], 'asc' => []];
        foreach ($prows as $p) {
            $fromDb[$p['category']][] = $p['text'];
        }
        foreach ($phrases as $k => $v) {
            $phrases[$k] = $fromDb[$k] ?: $v;
        }
    }
} catch (Throwable $e) {
    $hasDb = false;
}

function e(?string $s): string
{
    return htmlspecialchars($s ?? '', ENT_QUOTES, 'UTF-8');
}

function jdata($v): string
{
    return json_encode(
        $v,
        JSON_UNESCAPED_UNICODE | JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT
    );
}
?>
<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Même Jour</title>
<meta name="description" content="Entre ta date de naissance : découvre ton signe, ton ascendant, ton horoscope du jour, les événements de ton jour et les personnages nés le même jour que toi.">
<meta name="theme-color" content="#1c1a38">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ctext y='.9em' font-size='90'%3E✨%3C/text%3E%3C/svg%3E">
<link rel="icon" type="image/svg+xml" href="assets/logo.svg">
<link rel="apple-touch-icon" href="assets/apple-touch-icon.png">
<!-- Remplace https://TON-SITE.fr par l'adresse réelle de ton site (garde le / final) -->
<link rel="canonical" href="https://TON-SITE.fr/">
<meta property="og:type" content="website">
<meta property="og:locale" content="fr_FR">
<meta property="og:title" content="Ce qui s'est passé le jour de ta naissance">
<meta property="og:description" content="Signe, ascendant, horoscope du jour et personnages nés le même jour que toi. Essaie avec ta date !">
<meta property="og:url" content="https://TON-SITE.fr/">
<meta property="og:image" content="https://TON-SITE.fr/assets/og-image.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="Ce qui s'est passé le jour de ta naissance">
<meta name="twitter:description" content="Signe, ascendant, horoscope du jour et personnages nés le même jour que toi.">
<meta name="twitter:image" content="https://TON-SITE.fr/assets/og-image.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,800&family=Figtree:wght@400;600&display=swap" rel="stylesheet">
<style>
:root{
  --bg:#070816;
  --card:#12132b;
  --line:rgba(232,184,107,.28);
  --tx:#f6eedb;
  --mut:#aeacce;
  --gold:#efc272;
  --teal:#8fd3c8;
  color-scheme:dark;
}

body{
  background:
    radial-gradient(ellipse 70% 45% at 15% 0%,rgba(98,64,170,.30),transparent 60%),
    radial-gradient(ellipse 60% 40% at 95% 100%,rgba(239,194,114,.10),transparent 60%),
    var(--bg);
  background-attachment:fixed;
}

/* Étoiles : deux couches de tailles différentes, la seconde scintille doucement */
body::before,body::after{content:"";position:fixed;inset:0;z-index:-1;pointer-events:none}
body::before{
  background-image:
    radial-gradient(1.4px 1.4px at 20px 30px,#fff,transparent 60%),
    radial-gradient(1.4px 1.4px at 95px 125px,#f6e2b3,transparent 60%),
    radial-gradient(1.5px 1.5px at 165px 62px,#fff,transparent 60%),
    radial-gradient(1.4px 1.4px at 215px 185px,#fff,transparent 60%),
    radial-gradient(1.4px 1.4px at 60px 205px,#f6e2b3,transparent 60%),
    radial-gradient(1.4px 1.4px at 130px 15px,#fff,transparent 60%);
  background-size:240px 240px;
  opacity:1;
}
body::after{
  background-image:
    radial-gradient(1.6px 1.6px at 70px 90px,#fff,transparent 60%),
    radial-gradient(2px 2px at 250px 40px,#ffe9b0,transparent 60%),
    radial-gradient(1.4px 1.4px at 180px 260px,#fff,transparent 60%),
    radial-gradient(1.6px 1.6px at 320px 200px,#ffe9b0,transparent 60%);
  background-size:380px 380px;
  opacity:.9;
}
@media (prefers-reduced-motion:no-preference){
  body::after{animation:scintille 6s ease-in-out infinite alternate}
}
@keyframes scintille{from{opacity:.35}to{opacity:1}}

/* Titres */
h1{
  background:linear-gradient(180deg,#fff6de 10%,#efc272 100%);
  -webkit-background-clip:text;background-clip:text;
  color:transparent;
  filter:drop-shadow(0 2px 18px rgba(239,194,114,.25));
}
h2::before{content:"✦ ";color:var(--gold);font-size:.65em;vertical-align:.15em}
.big{color:var(--gold)}

/* Cartes, formulaires et blocs */
form,.tip,.about,dl div{
  background:linear-gradient(180deg,rgba(26,27,64,.86),rgba(13,14,36,.92));
  border:1px solid var(--line);
  box-shadow:0 8px 30px rgba(0,0,0,.35),inset 0 1px 0 rgba(255,236,190,.06);
}
li{background:linear-gradient(90deg,rgba(26,27,64,.85),rgba(13,14,36,.85))}

/* Champs */
input,textarea,select{
  background:#0a0b1f;
  border:1px solid rgba(239,194,114,.30);
  color:var(--tx);
}
input::placeholder{color:#7e7ca3}
input:focus,textarea:focus{border-color:var(--gold);box-shadow:0 0 0 3px rgba(239,194,114,.18)}

/* Boutons */
button,.wab{
  background:linear-gradient(135deg,#f6d792,#d9a24c);
  color:#2a1d05;
  box-shadow:0 4px 18px rgba(217,162,76,.28);
}
button:hover{filter:brightness(1.07)}
.share button,.nav button{
  background:rgba(239,194,114,.06);
  color:var(--tx);
  border:1px solid var(--line);
  box-shadow:none;
}
.share .wa,.wab{background:linear-gradient(135deg,#a8e3d9,#6fc1b4);color:#06302a}

.about img{border-color:var(--gold);box-shadow:0 0 0 4px rgba(239,194,114,.15)}
.foot{border-top-color:var(--line)}

:root{--bg:#1f15757c;--surf:rgba(28, 77, 16, 0.6);--card:#5046dacc;--tx:#f1e9d6;--mut:#aaa5cc;--gold:#e8b86b;--teal:#7fd1c4;--line:#413d73;color-scheme:dark}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--tx);font:17px/1.6 Figtree,system-ui,sans-serif}
main{max-width:760px;margin:0 auto;padding:40px 20px 80px}
h1{font:800 clamp(2.4rem,9vw,4.4rem)/1.02 Fraunces,Georgia,serif;margin:0 0 14px;letter-spacing:-.02em}
.lead{color:var(--mut);max-width:52ch;margin:0 0 32px}
form{display:grid;gap:16px;background:var(--card);border:1px solid var(--line);border-radius:18px;padding:22px}
.row{display:grid;grid-template-columns:1fr 1fr;gap:16px}
label{display:grid;gap:6px;font-weight:600;font-size:.95rem}
label small{font-weight:400;color:var(--mut)}
input{font:inherit;color:var(--tx);background:var(--bg);border:1px solid var(--line);border-radius:10px;padding:12px}
input:focus,button:focus-visible{outline:2px solid var(--gold);outline-offset:2px}
button{font:600 1rem Figtree,sans-serif;background:var(--gold);color:#2a1d05;border:0;border-radius:12px;padding:14px;cursor:pointer}
button:disabled{opacity:.6;cursor:wait}
#msg{color:var(--gold);min-height:1.4em;margin:12px 0 0}
section{margin-top:44px}
h2{font:500 1.7rem/1.2 Fraunces,Georgia,serif;margin:0 0 6px}
.sub{color:var(--mut);margin:0 0 16px;font-size:.95rem}
.big{font:800 clamp(1.6rem,6vw,2.4rem)/1.15 Fraunces,Georgia,serif;color:var(--gold);margin:0 0 20px}
dl{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:12px;margin:0}
dl div{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:14px 16px}
dt{color:var(--mut);font-size:.88rem}
dd{margin:2px 0 0;font-weight:600}
ul{list-style:none;margin:0;padding:0;display:grid;gap:10px}
li{padding:12px 16px;background:var(--card);border-left:3px solid var(--teal);border-radius:0 12px 12px 0}
li b{color:var(--teal);margin-right:8px}
.vil{border-left-color:var(--gold)}.vil b{color:var(--gold)}
.nav{display:flex;flex-wrap:wrap;gap:10px;margin:0 0 16px}
.nav button{background:transparent;color:var(--tx);border:1px solid var(--line);padding:9px 14px;font-weight:400}
.nav button:hover{border-color:var(--gold)}
.tip{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:16px 18px;margin:0 0 12px}
.note{color:var(--mut);font-size:.88rem;margin:14px 0 0}
.share{display:flex;flex-wrap:wrap;gap:10px;margin:20px 0 0}
.share button{background:var(--card);color:var(--tx);border:1px solid var(--line);font-weight:600}
.share button:hover{border-color:var(--gold)}
.share .wa{background:var(--teal);color:#06302a;border:0}
.chk{display:flex;gap:10px;align-items:flex-start;font-weight:400;font-size:.9rem;color:var(--mut)}
.chk input{margin-top:4px}
.foot{margin-top:60px;padding-top:20px;border-top:1px solid var(--line);font-size:.9rem}
.foot a{color:var(--mut)}
.hid{display:none}
/* Chat */
#chatList{max-height:340px;overflow-y:auto;display:grid;gap:8px;padding:4px}
#chatList li{padding:8px 14px;display:grid;gap:2px}
#chatList .meta{font-size:.85rem;color:var(--mut)}
#chatList .meta b{color:var(--gold);margin-right:6px}
.rep{font-size:.75rem;padding:2px 8px;background:transparent;color:var(--mut);border:1px solid var(--line);border-radius:8px;margin-left:8px;box-shadow:none}
.rep:hover{color:var(--tx);border-color:var(--gold)}
.wab{display:inline-block;padding:12px 18px;border-radius:12px;text-decoration:none;font-weight:600}
@media(max-width:520px){.row{grid-template-columns:1fr}}
</style>
</head>
<body>
<main>
<h1><?= e($texts['h1']) ?></h1>
<p class="lead"><?= e($texts['lead']) ?></p>

<form id="f">
 <label>Date de naissance
  <input type="date" id="date" required max="2100-12-31" min="1000-01-01">
 </label>
 <div class="row">
  <label>Heure de naissance <small>pour l'ascendant</small>
   <input type="time" id="time">
  </label>
  <label>Ville de naissance <small>pour l'ascendant</small>
   <input type="text" id="place" placeholder="Ex. : Cotonou" autocomplete="off">
  </label>
 </div>
 <label class="chk"><input type="checkbox" id="rem"> Se souvenir de moi (sur cet appareil seulement)</label>
 <button id="go" type="submit"><?= e($texts['btn_go']) ?></button>
</form>
<p id="msg" role="status"></p>
<button type="button" id="forget" class="hid">Oublier mes données</button>

<div id="out" class="hid">
 <section>
  <p class="big" id="headline"></p>
  <dl id="facts"></dl>
  <div class="share">
   <button type="button" class="wa" id="shWa">Partager sur WhatsApp</button>
   <button type="button" id="shNative">Partager</button>
   <button type="button" id="shCopy">Copier le texte</button>
  </div>
  <p class="note" id="shNote">Le partage ne contient ni l'heure ni la ville de naissance.</p>
 </section>
 <section>
  <h2>Ton horoscope du jour</h2>
  <p class="sub" id="hDate"></p>
  <div class="nav">
   <button type="button" id="hPrev">Jour précédent</button>
   <button type="button" id="hToday">Aujourd'hui</button>
   <button type="button" id="hNext">Jour suivant</button>
  </div>
  <div id="hTips"></div>
  <dl id="hFacts"></dl>
  <p class="note"><?= e($texts['horo_note']) ?></p>
 </section>
 <section id="subSec" class="hid">
  <h2><?= e($texts['sub_title']) ?></h2>
  <p class="sub"><?= e($texts['sub_text']) ?></p>
  <form id="sf">
   <label>E-mail <input type="email" id="sEmail" required maxlength="200"></label>
   <label>WhatsApp <small>facultatif</small> <input type="tel" id="sWa" maxlength="30" placeholder="+229 …"></label>
   <label class="chk"><input type="checkbox" id="sConsent"> J'accepte que mon e-mail, mon numéro et ma date de naissance soient enregistrés pour être contacté. Je peux demander leur suppression à tout moment. <a href="confidentialite.php" target="_blank" rel="noopener">En savoir plus</a></label>
   <button type="submit">Je m'inscris</button>
  </form>
  <p class="note" id="sMsg" role="status"></p>
 </section>
 <section id="chatSec" class="hid">
  <h2>Salon des personnes nées ce jour</h2>
  <p class="sub" id="chatTitle"></p>
  <ul id="chatList"></ul>
  <form id="cf">
   <div class="row">
    <label>Pseudo <input id="cPseudo" maxlength="24" autocomplete="off" placeholder="Ton pseudo"></label>
    <label>Message <input id="cBody" maxlength="300" autocomplete="off" placeholder="Ton message…"></label>
   </div>
   <button type="submit">Envoyer</button>
  </form>
  <p class="note" id="cMsg" role="status"></p>
  <p class="note">Messages publics, liens interdits. Chaque message peut être signalé. Voir <a href="confidentialite.php">la confidentialité</a>.</p>
 </section>
 <section>
  <h2>Cette année-là, ce jour-là</h2>
  <p class="sub" id="yearSub"></p>
  <ul id="yearEv"></ul>
 </section>
 <section>
  <h2>Personnalités nées le même jour</h2>
  <p class="sub">Toutes années confondues.</p>
  <ul id="births"></ul>
 </section>
 <section>
  <h2>Personnages d'animé nés le même jour</h2>
  <p class="sub" id="vilSub"></p>
  <ul id="vil"></ul>
 </section>
 <section>
  <h2>Autres événements de ce jour</h2>
  <ul id="events"></ul>
 </section>
 <section class="about">
  <h2><?= e($texts['about_title']) ?></h2>
  <p class="sub"><?= e($texts['about_text']) ?></p>
  <a id="waBtn" class="wab hid" href="#" target="_blank" rel="noopener">Discuter sur WhatsApp</a>
 </section>
</div>
<footer class="foot"><a href="confidentialite.php">Confidentialité et mentions légales</a> · <a href="admin.php">Administration</a></footer>
</main>

<script>
const CHARACTERS=<?= jdata($characters) ?>;
const SITE_PHRASES=<?= jdata($phrases) ?>;
const CHAT_ON=<?= $hasDb ? 'true' : 'false' ?>;
const WHATSAPP=<?= jdata(CONTACT_WHATSAPP) ?>;
</script>
<script src="app.js"></script>
</body>
</html>
