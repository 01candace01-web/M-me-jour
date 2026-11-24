# Même Jour — version PHP + MySQL

Reconstruction du site « Même Jour » (calculs astro/nombre, chat par date, inscriptions, back-office).

**Architecture demandée (chaque technologie a son rôle) :**
- **HTML** — les pages : `index.html`, `admin.html`, `confidentialite.html`
- **CSS** — l'affichage : `assets/style.css`, `assets/admin.css`, `assets/confidentialite.css`
- **JavaScript** — les interactions : `assets/app.js`, `assets/admin.js`, `assets/data-defaults.js`
- **PHP** — uniquement la base de données : `api.php` (API JSON), `db.php`, `config.php`, `install.php`, `defaults.php`

## Fichiers

| Fichier | Rôle |
|---|---|
| `index.html` | Page principale (le navigateur charge les données via l'API) |
| `app.js` | Interactions client : signes, ascendant, horoscope, chat, partage |
| `style.css` | Tout l'affichage du site |
| `api.php` | Seule porte vers MySQL : contenu du site, chat, inscription, stats, admin |
| `admin.html` + `admin.js` + `admin.css` | Back-office (connexion par session PHP) |
| `config.php` | **À remplir** : accès MySQL, e-mail + mot de passe admin, phrases secrètes, WhatsApp, URL du site, expéditeur e-mail |
| `db.php` | Connexion PDO, hachage d'IP, limitation d'envois |
| `data-defaults.js` / `defaults.php` | Valeurs par défaut (896 personnages, phrases, textes) si la base est vide |
| `schema.sql` | Schéma MySQL (8 tables + phrases par défaut) |
| `seed-characters.sql` | Seed optionnel des 896 personnages |
| `install.php` | Crée la base et les tables automatiquement (verrou `install.lock` après succès), puis **à supprimer** |
| `.htaccess` | Sécurité Apache : liste des dossiers interdite, fichiers sensibles (`.sql`, `.md`, `.lock` …) inaccessibles, en-têtes de protection du navigateur |
| `jour-fa.html` + `assets/jour-fa.js` + `assets/jour-fa.css` | Outil « Ton jour Fâ » : prénom du jour (fon/adja + akan), croisement signe solaire, initiation pédagogique au Fâ et simulateur d'akplèkan |
| `jours.html` + `assets/jours.js` + `assets/jours.css` | Outil « Jours verts et rouges » : calendrier décisionnel du mois (Lune × Soleil, phases lunaires, Mercure rétrograde) + export .ics pour Google Agenda |
| `journal.html` + `assets/journal.js` + `assets/journal.css` | Outil « Journal d'humeur » : note ton humeur (1–5), corrélations avec Lune/phases/Mercure, sauvegarde MySQL par jeton anonyme |
| `compatibilite.html` + `assets/compat.js` + `assets/compat.css` | Outil « Compatibilité narrative » : deux naissances → prénoms du jour, signes solaires, aspect raconté, forces et frottements — zéro pourcentage, tout dans le navigateur |
| `assets/prenoms.js` | Prénoms du jour (fon/adja + akan) et calendrier solaire approché, partagés par les outils |
| `maintenant.html` + `assets/maintenant.js` + `assets/maintenant.css` | Outil « Le ciel en direct » : positions planétaires en temps réel (Soleil → Saturne), aspects avec le Soleil natal, horizon local (géolocalisation facultative), notifications du ciel, inscription au rappel e-mail |
| `coach.html` + `assets/coach.js` | Outil « Ton coach de thème » : moteur de règles local qui croise ta question (fatigue, argent, travail, amour…), ton thème natal et le ciel du moment — sans envoi au serveur |
| `theme-video.html` + `assets/theme-video.js` | Outil « Ton thème en vidéo » : une vidéo animée d'environ 30 secondes (Soleil, Lune, ascendant, Vénus, Mars…) dessinée en canvas et téléchargeable en .webm |
| `carte3d.html` + `assets/carte3d.js` | Outil « Ta carte du ciel en 3D » : anneau écliptique que l'on fait tourner (glisser/zoomer), 12 signes, planètes, aspects colorés et ascendant — projection maison en canvas |
| `assets/viz.css` | Styles partagés des pages interactives (coach, vidéo, 3D, rapport premium) |
| `premium.html` + `assets/premium.js` | Offres payantes : rapport de naissance complet, paiement Mobile Money (FedaPay), déblocage automatique après paiement, impression PDF |
| `feda.php` + `webhook.php` | Branchement FedaPay : création de paiements (cURL) et confirmation automatique par webhook |
| `cron-quotidien.php` + `rappels.php` | Envoi du rappel quotidien par e-mail (à appeler 1×/jour par cron ou Planificateur de tâches) |
| `blog.html` + `blog/*.html` | 12 articles d'astrologie (contenu original) + index des articles |
| `assets/ads.js` | Emplacements publicitaires Google AdSense (un seul réglage) |
| `assets/blog.css` | Style des pages d'articles |
| `ads.txt` / `robots.txt` / `sitemap.xml` | Fichiers exigés/utiles pour Google (AdSense et indexation) |

## Installation avec XAMPP (Windows)

1. Copie tout le contenu du projet dans `C:\xampp\htdocs\memejour\` (les fichiers doivent être directement dans ce dossier).
2. Dans le **XAMPP Control Panel**, démarre **Apache** et **MySQL** (verts). Note le port d'Apache (80 par défaut ; `:8080` si indiqué).
3. Crée la base : ouvre `http://localhost/phpmyadmin` → onglet **Bases de données** → crée `memejour` (sans accent).
4. Dans `config.php`, mets :
   ```php
   define('DB_HOST', 'localhost');
   define('DB_NAME', 'memejour');
   define('DB_USER', 'root');      // XAMPP : utilisateur root
   define('DB_PASS', '');          // XAMPP : mot de passe vide
   ```
5. Ouvre **`http://localhost/memejour/install.php`** → « Installation terminée ».
   L'installation pose un verrou (`install.lock`) : on ne peut pas la relancer par erreur. **Supprime ensuite `install.php`.**
   (Mise à jour du site : si une nouvelle version ajoute des tables, supprime `install.lock`, relance `install.php` une fois — il ne crée que les tables manquantes — puis supprime `install.php` et `install.lock` de nouveau.)
6. Le site : **`http://localhost/memejour/`**. Admin : `http://localhost/memejour/admin.html`.

⚠️ Toujours ouvrir via `http://localhost/...` — jamais en double-cliquant le fichier HTML dans l'Explorateur.

## Après installation (important)

- Dans `config.php` : change `ADMIN_EMAIL`, `ADMIN_PASSWORD` et `IP_HASH_SECRET` (longue phrase secrète).
- Remplace `https://TON-SITE.fr` par ton domaine dans `index.html`, `blog.html`, les fichiers de `blog/`, `sitemap.xml`, `robots.txt` et `confidentialite.html` (balises canonical / Open Graph).
- Admin : onglet **Personnages** → « Importer la liste par défaut » pour remplir la base depuis l'interface.

## Google AdSense : pour être accepté et afficher les annonces

Le site est déjà préparé : articles originaux, liens internes entre les pages, politique de confidentialité complète, emplacements publicitaires intégrés. Il te reste à faire ces étapes :

1. **Mets le site en ligne sur un vrai domaine** (hebergeur avec PHP/MySQL : o2switch, Hostinger, OVH…). Google n'accepte **jamais** un site hébergé en `localhost`. Vérifie que toutes les pages s'ouvrent sans erreur et qu'aucun lien n'est cassé.
2. **Remplace `https://TON-SITE.fr`** par ton domaine partout (voir ci-dessus), puis complète les `[À COMPLÉTER]` de `confidentialite.html` (nom, contact, date, hébergeur) : la page confidentialité doit être joignable depuis toutes les pages.
3. **Inscris-toi sur [adsense.google.com](https://adsense.google.com)**, ajoute ton site, et colle le code de vérification dans la balise `<head>` de `index.html` (Google te donne un `<script>` à insérer ; tu peux aussi l'ajouter via `assets/ads.js`).
4. **Une fois validé**, récupère ton identifiant éditeur (`ca-pub-…`) :
   - ouvre `assets/ads.js` et colle-le dans `const ADSENSE_CLIENT = "ca-pub-…";` : les emplacements du site s'activent automatiquement (accueil, liste d'articles, milieu et bas de chaque article) ;
   - décommente la ligne dans `ads.txt` avec le même identifiant ;
   - dans AdSense, crée des blocs d'annonces (annonces display responsives, les annonces textuelles sont incluses automatiquement) et, si tu veux, indique leur numéro dans `data-ad-slot` des emplacements.
5. **Conditions à respecter en continu** : contenu original, trafic humain (pas d'achat de visites, pas de clics sur tes propres annonces), pas de contenu interdit, aucune modification du code des annonces, page confidentialité à jour. L'astrologie étant présentée comme divertissement (c'est déjà le cas sur le site et dans la confidentialité), garde cette mention visible.

## Rappel quotidien par e-mail

1. les visiteurs s'inscrivent sur `maintenant.html` (table MySQL `rappels`, jeton de désinscription automatique) ;
2. l'e-mail de test se déclenche depuis l'administration (onglet « Rappels e-mail ») ;
3. l'envoi quotidien appelle une fois par jour `cron-quotidien.php` :
   - **hébergement Linux** : ajoute une tâche cron, par exemple à 7 h 00 : `0 7 * * * php /chemin/vers/cron-quotidien.php`
   - **XAMPP (Windows)** : Planificateur de tâches de Windows → nouvelle tâche quotidienne à 7 h 00 → programme : `C:\xampp\php\php.exe` → arguments : `C:\xampp\htdocs\memejour\cron-quotidien.php`
   - **hébergement mutualisé sans accès SSH** : planifie une visite quotidienne (il existe des services gratuits de « cron en ligne ») de `https://ton-site.fr/cron-quotidien.php?key=TA_PHRASE_SECRETE` (constante `CRON_SECRET` de `config.php`)
4. sous XAMPP, la fonction `mail()` de PHP exige de configurer `sendmail_from` et le sendmail inclus (C:\xampp\sendmail\sendmail.ini) — sinon les e-mails ne partent pas ; sur un vrai hébergeur, `mail()` fonctionne d'ordinaire dès que le domaine est configuré.

## Paiement Mobile Money avec FedaPay (offres payantes)

La page `premium.html` vend le **rapport de naissance complet** (2 000 F, 30 jours) et
**rapport + année favorable** (5 000 F, 365 jours) via [FedaPay](https://fedapay.com).

1. crée un compte FedaPay, valide ton marchand, puis copie ta **clé secrète** dans `config.php` (constante `FEDA_SECRET`) ;
2. mets `FEDA_ENV` à `'sandbox'` pour tester avec l'argent fictif, puis `'live'` pour encaisser réellement ;
3. dans le tableau de bord FedaPay, déclare le **webhook** : `https://ton-site.fr/webhook.php?secret=FEDA_WEBHOOK_SECRET` (la même phrase secrète que dans `config.php`) — c'est lui qui **débloque l'accès tout seul** après paiement ;
4. les prix se règlent dans `config.php` (constantes `PRIX_RAPPORT` et `PRIX_ANNEE`), le catalogue dans `feda.php` (fonction `offres()`) ;
5. l'onglet **Paiements** de `admin.html` liste les commandes ; « Marquer payée » sert de repli si un client paie par un autre canal ;
6. `FEDA_SECRET` vide = le site affiche proprement un contact WhatsApp à la place du paiement en ligne.

Si la table `commandes` n'existe pas (base installée avant l'ajout), réexécute `install.php` ou importe `schema.sql` : le script ne touche pas aux autres tables (`CREATE TABLE IF NOT EXISTS`).

## Fonctionnalités

- **Calculs côté navigateur** : signe solaire, ascendant (Open-Meteo pour géocodage et fuseau), astrologie chinoise, Lune, numérologie, âge, horoscope déterministe, événements Wikipédia.
- **Chat par jour de naissance** : public, sans liens, pseudos réservés interdits, messages signalables.
- **Back-office** : stats par signe et par jour, inscrits + export CSV, CRUD personnages/phrases/textes, masquage/suppression de messages.
- **Anti-spam** : validations serveur + limites par empreinte d'IP (`md5(IP + secret)`), jamais l'IP elle-même ; empreintes effacées après 24 h.
- **Sécurité** : sessions admin (cookie HttpOnly / SameSite=Lax/secure, limite de tentatives + temporisation), jeton CSRF sur les mutations, requêtes préparées, échappement HTML, export CSV neutralisé (pas d'injection de formule dans Excel/Sheets), webhook de paiement refusé tant que la phrase secrète n'est pas changée, installation verrouillée, `.htaccess` de protection.
