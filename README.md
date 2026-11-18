# Même Jour — version PHP + MySQL

Reconstruction du site « Même Jour » (calculs astro/nombre, chat par date, inscriptions, back-office) en **PHP + MySQL**, sans Supabase.

## Contenu

| Fichier | Rôle |
|---|---|
| `index.php` | Page principale : données du site (personnages, phrases, textes) injectées depuis MySQL |
| `app.js` | Logique client : signes, ascendant, horoscope, chat, partage (identique à l'original) |
| `api.php` | API JSON : chat (`messages`, `message`, `report`), inscription (`subscribe`), stats (`stat`) |
| `admin.php` | Administration : connexion par session PHP (identifiants de `config.php`) |
| `admin.js` | Tableau de bord : statistiques, inscrits, personnages, phrases, messages, textes |
| `confidentialite.php` | Page confidentialité / mentions légales |
| `config.php` | **À remplir** : accès MySQL, e-mail + mot de passe admin, phrase secrète, WhatsApp |
| `db.php` | Connexion PDO, hachage d'IP, limitation d'envois |
| `defaults.php` | Valeurs par défaut (896 personnages, phrases, textes) si la base est vide |
| `schema.sql` | Schéma MySQL (7 tables + phrases par défaut) |
| `seed-characters.sql` | Seed optionnel des 896 personnages (l'admin peut aussi les importer) |
| `install.php` | Crée la base et les tables automatiquement, puis **à supprimer** |
| `assets/` | Logo, icônes, image de partage |

## Installation

1. Envoie tous les fichiers sur ton hébergement PHP (ou lance `php -S localhost:8000` dans le dossier pour tester en local).
2. Crée une base MySQL sur ton hébergeur (chez certains, depuis phpMyAdmin ou le panneau).
3. Remplis `config.php` : `DB_HOST`, `DB_NAME`, `DB_USER`, `DB_PASS`.
4. Ouvre `https://ton-site.fr/install.php` — il crée les tables (ou importe `schema.sql` via phpMyAdmin).
5. **Supprime `install.php`.**

## Après installation (important)

- Dans `config.php` : change `ADMIN_EMAIL`, `ADMIN_PASSWORD` et `IP_HASH_SECRET` (une longue phrase secrète).
- Dans `index.php` : remplace `https://TON-SITE.fr` par ton domaine (balises canonical / Open Graph).
- Admin : `https://ton-site.fr/admin.php`. Onglet **Personnages** → « Importer la liste par défaut » pour remplir la base depuis l'interface.
- Renseigne aussi la page `confidentialite.php` (champs marqués « [À COMPLÉTER] »).

## Fonctionnalités

- **Calcul côté navigateur** : signe solaire, ascendant (via Open-Meteo pour géocodage et fuseau), astrologie chinoise, Lune, numérologie, âge, horoscope journalier déterministe, événements Wikipédia.
- **Chat par jour de naissance** : public, sans liens, pseudos réservés interdits, messages signalables, rafraîchissement toutes les 6 s.
- **Back-office complet** : stats par signe et par jour, export et suppression d'inscrits, CRUD personnages/phrases/textes, masquage/suppression de messages.
- **Anti-spam** : validations serveur + limite d'envois par empreinte d'IP (`md5(IP + secret)`), jamais l'IP elle-même ; empreintes effacées après 24 h.
- **Sécurité** : sessions admin (cookie HttpOnly / SameSite=Lax, limite de tentatives), jeton CSRF sur toutes les mutations admin, requêtes préparées partout, échappement HTML.

## Différences assumées avec la version Supabase

- L'admin se connecte avec e-mail + mot de passe définis dans `config.php` (pas de comptes multiples).
- Le champ « sign » côté PHP est nommé `signe` et la colonne clé des textes est `site_texts.k` (mot réservé MySQL évité).
