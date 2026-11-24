<?php
/**
 * Même Jour — configuration du site en PHP + MySQL.
 * Renseigne les informations ci-dessous, puis ouvre install.php dans ton navigateur
 * (ou importe schema.sql via phpMyAdmin).
 */

// Base de données MySQL (fournie par ton hébergeur).
define('DB_HOST', 'localhost');
define('DB_NAME', 'meme_jour');
define('DB_USER', 'utilisateur');
define('DB_PASS', 'motdepasse');

// Identifiants de l'administration (https://ton-site.fr/admin.html).
// Change-les IMPÉRATIVEMENT après installation.
define('ADMIN_EMAIL', 'admin@exemple.com');
define('ADMIN_PASSWORD', 'ChangeMe2024!');

// Longue phrase secrète, en modèle pour signer (hacher) l'adresse IP sans la conserver.
define('IP_HASH_SECRET', 'CHANGE_ME_une_longue_phrase_secrete_de_ton_choix');

// Numéro WhatsApp (chiffres seulement, ex. 22990112233) pour le bouton contact. Vide = bouton caché.
define('CONTACT_WHATSAPP', '');

// Adresse publique du site (sans / final) — utilisée dans les e-mails du rappel quotidien.
define('SITE_URL', 'https://TON-SITE.fr');

// Expéditeur des e-mails (doit exister sur ton hébergeur pour éviter les spams).
define('MAIL_FROM', 'no-reply@TON-SITE.fr');

// Phrase secrète pour déclencher le rappel quotidien (cron-quotidien.php). Change-la IMPÉRATIVEMENT.
define('CRON_SECRET', 'CHANGE_ME_une_autre_longue_phrase_secrete');

// ===== Offres payantes (paiement Mobile Money via FedaPay — https://fedapay.com) =====
// 1. crée un compte FedaPay et valide ton marchand ;
// 2. dans « API keys », copie la clé secrète (elle commence par sk_...) ;
// 3. FEDA_ENV : 'sandbox' pour tester avec de l'argent fictif, 'live' pour l'argent réel ;
// 4. FEDA_SECRET vide = le paiement en ligne est désactivé (le site affiche le contact WhatsApp).
define('FEDA_ENV', 'sandbox');
define('FEDA_SECRET', '');
// Phrase secrète du webhook de confirmation (met-la aussi dans l'URL du webhook côté FedaPay).
define('FEDA_WEBHOOK_SECRET', 'CHANGE_ME_phrase_secrete_du_webhook_fedapay');
// Prix des offres, en FCFA (XOF).
define('PRIX_RAPPORT', 2000);
define('PRIX_ANNEE', 5000);
