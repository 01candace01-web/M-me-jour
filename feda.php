<?php
/**
 * Même Jour — branchement FedaPay (paiement Mobile Money : MTN MoMo, Moov, Wave, Orange Money).
 * API REST appelée directement avec cURL, sans dépendance.
 * FEDA_ENV 'sandbox' = argent fictif de test ; 'live' = vrai argent.
 * Document : https://docs.fedapay.com
 */

require_once __DIR__ . '/config.php';

function feda_base(): string
{
    return FEDA_ENV === 'live' ? 'https://api.fedapay.com/v1' : 'https://sandbox-api.fedapay.com/v1';
}

function feda_checkout_base(): string
{
    return FEDA_ENV === 'live' ? 'https://checkout.fedapay.com' : 'https://sandbox-checkout.fedapay.com';
}

function feda_api(string $methode, string $chemin, ?array $corps = null): array
{
    $ch = curl_init(feda_base() . $chemin);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_CUSTOMREQUEST  => $methode,
        CURLOPT_HTTPHEADER     => [
            'Content-Type: application/json',
            'Authorization: Bearer ' . FEDA_SECRET,
        ],
        CURLOPT_TIMEOUT        => 20,
    ]);
    if ($corps !== null) {
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($corps, JSON_UNESCAPED_UNICODE));
    }
    $rep  = curl_exec($ch);
    $code = curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
    $err  = curl_error($ch);
    curl_close($ch);

    if ($rep === false) {
        return ['erreur' => 'Connexion à FedaPay impossible : ' . $err];
    }
    $j = json_decode((string)$rep, true);
    if (!is_array($j)) {
        return ['erreur' => 'Réponse illisible de FedaPay (code ' . (int)$code . ').'];
    }
    if ($code >= 300) {
        return ['erreur' => 'FedaPay a refusé : ' . (string)($j['message'] ?? ('erreur API ' . (int)$code))];
    }
    return ['ok' => true, 'reponse' => $j];
}

/**
 * Catalogue des offres. Ajouter une offre ici suffit ; le prix vient de config.php.
 * jours = durée de l'accès débloqué après paiement.
 */
function offres(): array
{
    return [
        'rapport' => ['label' => 'Rapport de naissance complet', 'montant' => (int)PRIX_RAPPORT, 'jours' => 30],
        'annee'   => ['label' => 'Rapport complet + ton année favorable', 'montant' => (int)PRIX_ANNEE, 'jours' => 365],
    ];
}

/**
 * Crée la transaction FedaPay et retourne l'URL de caisse.
 * $retourUrl : où renvoyer le client une fois payé (page qui vérifie et débloque).
 * $callbackUrl : URL de webhook que FedaPay appellera pour confirmer automatiquement.
 * Retour ['erreur' => '...'] ou ['url' => '...', 'feda_id' => '...'].
 */
function feda_creer_paiement(string $cle, string $ref, string $retourUrl, string $callbackUrl): array
{
    $o = offres();
    if (!isset($o[$cle])) {
        return ['erreur' => 'Offre inconnue.'];
    }
    $offre = $o[$cle];
    $r = feda_api('POST', '/transactions', [
        'description'        => 'Même Jour — ' . $offre['label'],
        'amount'             => $offre['montant'],
        'currency'           => ['iso' => 'XOF'],
        'merchant_reference' => $ref,
        'callback_url'       => $callbackUrl,
        'customer'           => ['firstname' => 'Client', 'lastname' => 'Même Jour'],
    ]);
    if (!empty($r['erreur'])) {
        return $r;
    }
    $id = $r['reponse']['transaction']['id'] ?? null;
    if (!$id) {
        return ['erreur' => 'Transaction non créée par FedaPay.'];
    }
    $t = feda_api('POST', '/transactions/' . $id . '/token');
    if (!empty($t['erreur'])) {
        return $t;
    }
    $token = $t['reponse']['token']['token'] ?? null;
    if (!$token) {
        return ['erreur' => 'Lien de paiement non obtenu.'];
    }
    return ['url' => feda_checkout_base() . '/' . $token, 'feda_id' => (string)$id];
}

/**
 * Relit la transaction chez FedaPay (source de vérité : on ne fait jamais
 * confiance au contenu du webhook seul).
 * Retour ['erreur' => '...'] ou ['statut' => 'approved'|'pending'|..., 'montant' => int].
 */
function feda_verifier(string $fedaId): array
{
    if (!preg_match('/^[0-9]{1,15}$/', $fedaId)) {
        return ['erreur' => 'Identifiant de transaction invalide.'];
    }
    $r = feda_api('GET', '/transactions/' . $fedaId);
    if (!empty($r['erreur'])) {
        return $r;
    }
    $tx = $r['reponse']['transaction'] ?? null;
    if (!is_array($tx)) {
        return ['erreur' => 'Transaction introuvable chez FedaPay.'];
    }
    return ['statut' => (string)($tx['status'] ?? ''), 'montant' => (int)($tx['amount'] ?? 0)];
}
