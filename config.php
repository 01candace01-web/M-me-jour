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
