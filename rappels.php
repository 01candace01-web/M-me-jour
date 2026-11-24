<?php
/**
 * Même Jour — rappel quotidien par e-mail.
 * Bibliothèque partagée par cron-quotidien.php (envoi de masse) et api.php (e-mail de test).
 * Le ciel du jour est calculé avec les mêmes formules simplifiées que assets/astro.js (précision ~1°).
 */

require_once __DIR__ . '/config.php';

function ciel_signe(float $lon): string
{
    $signes = ['Bélier', 'Taureau', 'Gémeaux', 'Cancer', 'Lion', 'Vierge',
                'Balance', 'Scorpion', 'Sagittaire', 'Capricorne', 'Verseau', 'Poissons'];
    $lon = fmod($lon, 360.0);
    if ($lon < 0) {
        $lon += 360.0;
    }
    return $signes[(int)floor($lon / 30)];
}

function ciel_sn(float $x): float
{
    return sin(deg2rad($x));
}

/* Longitude géocentrique du Soleil (degrés) — même formule que assets/astro.js. */
function ciel_soleil(int $d): float
{
    $M = 356.0470 + 0.9856002585 * $d;
    $w = 282.9404 + 4.70935e-5 * $d;
    $C = 1.9148 * ciel_sn($M) + 0.02 * ciel_sn(2 * $M) + 0.0003 * ciel_sn(3 * $M);
    return ciel_signe_php($w + $M + $C);
}

function ciel_signe_php(float $x): float
{
    $x = fmod($x, 360);
    return $x < 0 ? $x + 360 : $x;
}

/* Lune : stocke la longitude pour afficher le signe de la Lune du jour. */
function ciel_lune(int $d): float
{
    $N = ciel_signe_php(125.1228 - 0.0529538083 * $d);
    $i = 5.1454;
    $w = ciel_signe_php(318.0634 + 0.1643573223 * $d);
    $a = 60.2666;
    $e = 0.054900;
    $M = ciel_signe_php(115.3654 + 13.0649929509 * $d);
    // équation de Kepler
    $E = $M + rad2deg($e * sin(deg2rad($M)));
    for ($k = 0; $k < 5; $k++) {
        $E = $E - ($E - rad2deg($e * sin(deg2rad($E))) - $M) / (1 - $e * cos(deg2rad($E)));
    }
    $xv = $a * (cos(deg2rad($E)) - $e);
    $yv = $a * sqrt(1 - $e * $e) * sin(deg2rad($E));
    $v = rad2deg(atan2($yv, $xv));
    $u = $v + $w;
    $r = sqrt($xv * $xv + $yv * $yv);
    $xh = $r * (cos(deg2rad($N)) * cos(deg2rad($u)) - sin(deg2rad($N)) * sin(deg2rad($u)) * cos(deg2rad($i)));
    $yh = $r * (sin(deg2rad($N)) * cos(deg2rad($u)) + cos(deg2rad($N)) * sin(deg2rad($u)) * cos(deg2rad($i)));
    $lon = rad2deg(atan2($yh, $xh));
    $Ms = 356.0470 + 0.9856002585 * $d;
    $Ls = fmod($Ms + 282.9404 + 4.70935e-5 * $d, 360);
    $Lm = fmod($M + $w + $N, 360);
    $D = fmod($Lm - $Ls, 360);
    $F = fmod($Lm - $N, 360);
    $lon += -1.274 * ciel_sn($M - 2 * $D) + 0.658 * ciel_sn(2 * $D) - 0.186 * ciel_sn($Ms) - 0.059 * ciel_sn(2 * $M - 2 * $D)
          - 0.057 * ciel_sn($M - 2 * $D + $Ms) + 0.053 * ciel_sn($M + 2 * $D) + 0.046 * ciel_sn(2 * $D - $Ms) + 0.041 * ciel_sn($M - $Ms)
          - 0.035 * ciel_sn($D) - 0.031 * ciel_sn($M + $Ms) - 0.015 * ciel_sn(2 * $F - 2 * $D) + 0.011 * ciel_sn($M - 4 * $D);
    return ciel_signe_php($lon);
}

/* Mercure rétrograde : plages réelles (stations en UTC), années 2024 à 2031 — même tableau que astro.js. */
function ciel_mercure_rx(int $y, int $m, int $j): bool
{
    $rx = [
        [2024, 4, 1, 2024, 4, 25], [2024, 8, 5, 2024, 8, 28], [2024, 11, 25, 2024, 12, 15],
        [2025, 3, 15, 2025, 4, 7], [2025, 7, 18, 2025, 8, 11], [2025, 11, 9, 2025, 11, 29],
        [2026, 2, 26, 2026, 3, 20], [2026, 6, 29, 2026, 7, 23], [2026, 10, 24, 2026, 11, 13],
        [2027, 2, 9, 2027, 3, 3], [2027, 6, 10, 2027, 7, 4], [2027, 10, 7, 2027, 10, 28],
        [2028, 1, 24, 2028, 2, 14], [2028, 5, 21, 2028, 6, 14], [2028, 9, 19, 2028, 10, 11],
        [2029, 1, 7, 2029, 1, 27], [2029, 5, 1, 2029, 5, 25], [2029, 9, 2, 2029, 9, 25], [2029, 12, 22, 2030, 1, 11],
        [2030, 4, 13, 2030, 5, 6], [2030, 8, 16, 2030, 9, 8], [2030, 12, 6, 2030, 12, 25],
        [2031, 3, 26, 2031, 4, 18], [2031, 7, 29, 2031, 8, 22], [2031, 11, 19, 2031, 12, 9],
    ];
    $n = $y * 10000 + $m * 100 + $j;
    foreach ($rx as $r) {
        if ($n >= $r[0] * 10000 + $r[1] * 100 + $r[2] && $n <= $r[3] * 10000 + $r[4] * 100 + $r[5]) {
            return true;
        }
    }
    return false;
}

/**
 * Texte de l'e-mail « ciel du jour » (texte brut, UTF-8).
 * $signe est le signe déclaré par l'abonné (facultatif).
 */
function email_ciel(?string $signe): string
{
    $auj = new DateTime('now', new DateTimeZone('UTC'));
    $d = 367 * (int)$auj->format('Y')
        - (int)floor(7 * ((int)$auj->format('Y') + (int)floor(((int)$auj->format('n') + 9) / 12)) / 4)
        + (int)floor(275 * (int)$auj->format('n') / 9) + (int)$auj->format('j') - 730530;
    $lonS = ciel_soleil($d);
    $lonL = ciel_lune($d);
    $elong = ciel_signe_php($lonL - $lonS);
    $phase = $elong < 11.25 || $elong > 348.75 ? 'Nouvelle lune'
        : (abs($elong - 180) < 11.25 ? 'Pleine lune' : ($elong < 180 ? 'Lune croissante' : 'Lune décroissante'));
    $rx = ciel_mercure_rx((int)$auj->format('Y'), (int)$auj->format('n'), (int)$auj->format('j'));

    $lignes = [];
    $lignes[] = 'Ton ciel du jour — ' . $auj->format('j') . ' ' . ['','janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre'][(int)$auj->format('n')] . ' ' . $auj->format('Y');
    $lignes[] = '';
    $lignes[] = 'Soleil en ' . ciel_signe($lonS) . ' · Lune en ' . ciel_signe($lonL) . ' · ' . $phase;
    if ($rx) {
        $lignes[] = 'Mercure est rétrograde : relis deux fois avant de signer, sauvegarde tes fichiers.';
    }
    if ($signe !== null && $signe !== '') {
        $lignes[] = '';
        $lignes[] = 'Ton signe : ' . $signe . '.';
    }
    $lignes[] = '';
    $lignes[] = 'Voir tes jours verts du mois : ' . SITE_URL . '/jours.html';
    $lignes[] = 'Le ciel en direct : ' . SITE_URL . '/maintenant.html';
    $lignes[] = '';
    $lignes[] = 'Pour arrêter ces e-mails : ' . SITE_URL . '/api.php?action=rappel_out&token=__TOKEN__';
    return implode("\n", $lignes);
}

/**
 * Envoi d'un e-mail texte encodé UTF-8. Renvoie vrai si la fonction mail() accepte le message.
 * Sous XAMPP, configurer le sendmail (voir README, section « Rappel quotidien par e-mail »).
 */
function envoyer_mail(string $to, string $sujet, string $corps): bool
{
    $entetes = 'From: ' . MAIL_FROM . "\r\n"
        . 'Content-Type: text/plain; charset=utf-8' . "\r\n"
        . 'X-Mailer: MemeJour';
    return @mail($to, '=?UTF-8?B?' . base64_encode($sujet) . '?=', $corps, $entetes);
}
