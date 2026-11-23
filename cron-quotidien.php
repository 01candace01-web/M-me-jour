<?php
/**
 * Même Jour — rappel quotidien par e-mail (script à appeler une fois par jour).
 *
 * Deux façons de l'exécuter :
 *  1. En ligne de commande :        php cron-quotidien.php
 *     (hébergement Linux : cron ; Windows/XAMPP : Planificateur de tâches — voir README)
 *  2. Via le Web (hébergement mutualisé) : https://ton-site.fr/cron-quotidien.php?key=CRON_SECRET
 *     (CRON_SECRET est défini dans config.php — change-le impérativement)
 */

require_once __DIR__ . '/db.php';
require_once __DIR__ . '/rappels.php';

/* Authentification : CLI toujours autorisé, le Web exige la phrase secrète. */
$secret = $_GET['key'] ?? ($_SERVER['argv'][1] ?? '');
if (PHP_SAPI !== 'cli' && !hash_equals(CRON_SECRET, (string)$secret)) {
    http_response_code(403);
    exit('Accès refusé.');
}
header('Content-Type: text/plain; charset=utf-8');

try {
    $pdo = db();
    $rows = $pdo->query('SELECT email, signe, token FROM rappels WHERE actif = 1')->fetchAll(PDO::FETCH_ASSOC);
} catch (Throwable $e) {
    http_response_code(500);
    exit('Base de données inaccessible : ' . $e->getMessage() . "\n");
}

$envoyes = 0;
$echecs  = 0;
foreach ($rows as $r) {
    $corps = str_replace('__TOKEN__', (string)$r['token'], email_ciel($r['signe'] !== null ? (string)$r['signe'] : null));
    if (envoyer_mail((string)$r['email'], 'Ton ciel du jour', $corps)) {
        $envoyes++;
    } else {
        $echecs++;
        echo "Échec d'envoi : " . $r['email'] . "\n";
    }
}
echo "Rappel quotidien : {$envoyes} e-mail(s) envoyé(s), {$echecs} échec(s), " . count($rows) . " abonné(s) actif(s).\n";
