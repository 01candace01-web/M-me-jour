<?php
/**
 * Même Jour — webhook de confirmation de paiement FedaPay.
 *
 * À configurer dans le tableau de bord FedaPay (Webhooks) :
 *   https://TON-SITE.fr/webhook.php?secret=TA_PHRASE_SECRETE
 * où TA_PHRASE_SECRETE est la constante FEDA_WEBHOOK_SECRET de config.php.
 *
 * Réception d'un événement → on RELIT la transaction chez FedaPay (source de
 * vérité) et ce n'est que si elle est réellement payée qu'on débloque l'accès.
 */

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/feda.php';
require_once __DIR__ . '/db.php';

header('Content-Type: text/plain; charset=utf-8');

/* 1. la phrase secrète dans l'URL doit être la bonne (le webhook FedaPay est public) */
$secret = (string)($_GET['secret'] ?? '');
if (!hash_equals(FEDA_WEBHOOK_SECRET, $secret)) {
    http_response_code(403);
    exit('Refuse');
}

/* 2. lecture de l'événement */
$brut = file_get_contents('php://input');
$evenement = json_decode((string)$brut, true);
if (!is_array($evenement)) {
    http_response_code(400);
    exit('Corps invalide');
}

$nom = (string)($evenement['event_name'] ?? ''); /* ex : transaction.approved */
$tx  = is_array($evenement['transaction'] ?? null) ? $evenement['transaction'] : null;
if ($nom !== 'transaction.approved' && $nom !== 'transaction.deleted' || !is_array($tx)) {
    /* événement sans importance pour nous : on répond OK pour ne pas re-coller */
    exit('OK (ignoré : ' . $nom . ')');
}

$ref     = (string)($tx['merchant_reference'] ?? '');
$fedaId  = (string)($tx['id'] ?? '');
if (!preg_match('/^[A-Z0-9]{12}$/', $ref) || !preg_match('/^[0-9]{1,15}$/', $fedaId)) {
    exit('OK (référence inconnue)');
}

/* 3. transaction annulée : on bascule la commande en attente */
if ($nom === 'transaction.deleted') {
    db()->prepare("UPDATE commandes SET statut = 'en_attente', paid_at = NULL, expire = NULL WHERE ref = ? AND statut = 'paye'")
        ->execute([$ref]);
    exit('OK (annulé)');
}

/* 4. source de vérité : on redemande la transaction à FedaPay avec notre clé */
$v = feda_verifier($fedaId);
if (empty($v['ok']) && isset($v['erreur'])) {
    exit('OK (vérification impossible : ' . $v['erreur'] . ')');
}
if (($v['statut'] ?? '') !== 'approved' && ($v['statut'] ?? '') !== 'transferred') {
    exit('OK (pas encore approuvée : ' . ($v['statut'] ?? '?') . ')');
}

/* 5. marque la commande payée + durée d'accès (idempotent : un 2e webhook ne re-rabote pas la date) */
$pdo = db();
$st  = $pdo->prepare('SELECT produit, montant, statut FROM commandes WHERE ref = ?');
$st->execute([$ref]);
$c = $st->fetch(PDO::FETCH_ASSOC);
if (!$c) {
    exit('OK (commande inconnue)');
}
if ($c['statut'] === 'paye') {
    exit('OK (déjà payée)');
}
$offres = offres();
$jours  = isset($offres[$c['produit']]) ? (int)$offres[$c['produit']]['jours'] : 30;
if ((int)$v['montant'] < (int)$c['montant']) {
    /* montant payé inférieur au prix : on refuse silencieusement, l'admin voit la commande en attente */
    exit('OK (montant insuffisant)');
}
$pdo->prepare("UPDATE commandes SET statut = 'paye', feda_id = ?, paid_at = NOW(), expire = DATE_ADD(CURDATE(), INTERVAL " . $jours . " DAY) WHERE ref = ?")
    ->execute([$fedaId, $ref]);

exit('OK (débloqué ' . $ref . ')');
