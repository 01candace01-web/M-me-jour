<?php
/**
 * Même Jour — installation automatique.
 * Ouvre ce fichier UNE FOIS dans ton navigateur. Il crée les tables MySQL.
 * Supprime-le ensuite de ton hébergement.
 */

require_once __DIR__ . '/config.php';

header('Content-Type: text/plain; charset=utf-8');

/* garde-fou 1 : on n'installe qu'une fois. Re-executer ce fichier recree
   des doublons de phrases et expose la page a des abus. */
if (is_file(__DIR__ . '/install.lock')) {
    http_response_code(403);
    exit("Déjà installé : le fichier install.lock existe.\n"
         . "Pour relancer l'installation, supprime install.lock (et ensuite install.php).\n");
}

/* garde-fou 2 : DB_NAME passe dans du SQL brut, on exige des caracteres
   surs (lettres, chiffres, underscore) : pas d'accents, pas d'espaces. */
if (!preg_match('/^[A-Za-z0-9_]+$/', DB_NAME)) {
    http_response_code(500);
    echo "DB_NAME invalide dans config.php : utilise uniquement des lettres, des chiffres et _ (pas d'accents, pas d'espaces).\n";
    exit(1);
}

$sql = file_get_contents(__DIR__ . '/schema.sql');

$dsn = 'mysql:host=' . DB_HOST . ';charset=utf8mb4';
try {
    $root = new PDO($dsn, DB_USER, DB_PASS, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
    $name = DB_NAME;
    try {
        $root->exec("CREATE DATABASE IF NOT EXISTS `$name` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
        echo "Base « $name » vérifiée.\n";
    } catch (Throwable $e) {
        echo "Création de base impossible (normal sur beaucoup d'hébergeurs, crée-la depuis ton panneau) : " . $e->getMessage() . "\n";
    }
    $pdo = new PDO($dsn . ';dbname=' . $name, DB_USER, DB_PASS, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
} catch (Throwable $e) {
    file_put_contents('php://stderr', $e->getMessage() . "\n");
    http_response_code(500);
    echo "Connexion MySQL impossible : vérifie DB_HOST, DB_NAME, DB_USER et DB_PASS dans config.php.\n";
    exit(1);
}

$statements = array_filter(array_map('trim', explode(';', $sql)));
foreach ($statements as $q) {
    if ($q === '' || str_starts_with($q, '--')) continue;
    try {
        $pdo->exec($q);
    } catch (Throwable $e) {
        echo "Erreur sur une requête : " . $e->getMessage() . "\n";
    }
}
/* on pose un verrou : la page ne pourra plus être relancée */
file_put_contents(__DIR__ . '/install.lock', date('c'));
echo "Installation terminée : les tables sont créées.\n";
echo "AVANT DE METTRE EN LIGNE :\n";
echo " 1. Change ADMIN_EMAIL, ADMIN_PASSWORD et IP_HASH_SECRET dans config.php.\n";
echo " 2. Remplace TON-SITE.fr par ton domaine dans index.html, blog.html, blog/, sitemap.xml et robots.txt.\n";
echo " 3. Supprime install.php ET install.lock de ton hébergement (le .htaccess bloque leur téléchargement, mais supprime-les quand même).\n";
echo "Ensuite : https://ton-site.fr/index.html (site), /blog.html (articles) et /admin.html (administration).\n";
