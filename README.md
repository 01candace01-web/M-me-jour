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
| `config.php` | **À remplir** : accès MySQL, e-mail + mot de passe admin, phrase secrète, WhatsApp |
| `db.php` | Connexion PDO, hachage d'IP, limitation d'envois |
| `data-defaults.js` / `defaults.php` | Valeurs par défaut (896 personnages, phrases, textes) si la base est vide |
| `schema.sql` | Schéma MySQL (7 tables + phrases par défaut) |
| `seed-characters.sql` | Seed optionnel des 896 personnages |
| `install.php` | Crée la base et les tables automatiquement, puis **à supprimer** |
| `jour-fa.html` + `assets/jour-fa.js` + `assets/jour-fa.css` | Outil « Ton jour Fâ » : prénom du jour (fon/adja + akan), croisement signe solaire, initiation pédagogique au Fâ et simulateur d'akplèkan |
| `blog.html` + `blog/*.html` | 6 articles d'astrologie (contenu original) + index des articles |
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
5. Ouvre **`http://localhost/memejour/install.php`** → « Installation terminée ». **Supprime ensuite `install.php`.**
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

## Fonctionnalités

- **Calculs côté navigateur** : signe solaire, ascendant (Open-Meteo pour géocodage et fuseau), astrologie chinoise, Lune, numérologie, âge, horoscope déterministe, événements Wikipédia.
- **Chat par jour de naissance** : public, sans liens, pseudos réservés interdits, messages signalables.
- **Back-office** : stats par signe et par jour, inscrits + export CSV, CRUD personnages/phrases/textes, masquage/suppression de messages.
- **Anti-spam** : validations serveur + limites par empreinte d'IP (`md5(IP + secret)`), jamais l'IP elle-même ; empreintes effacées après 24 h.
- **Sécurité** : sessions admin (cookie HttpOnly / SameSite=Lax, limite de tentatives), jeton CSRF sur les mutations, requêtes préparées, échappement HTML.
