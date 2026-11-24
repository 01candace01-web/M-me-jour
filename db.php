<?php
/**
 * Connexion MySQL, hachage d'IP et limitation d'envois par visiteur.
 */

require_once __DIR__ . '/config.php';

function db(): PDO
{
    static $pdo = null;
    if ($pdo === null) {
        $dsn = 'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=utf8mb4';
        $pdo = new PDO($dsn, DB_USER, DB_PASS, [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ]);
    }
    return $pdo;
}

/**
 * Empreinte de l'IP du visiteur (l'IP elle-même n'est jamais stockée).
 */
function ip_hash(): ?string
{
    $ip = $_SERVER['HTTP_X_FORWARDED_FOR'] ?? '';
    if ($ip === '' && PHP_SAPI !== 'cli') {
        $ip = $_SERVER['REMOTE_ADDR'] ?? '';
    }
    $ip = trim(explode(',', $ip)[0]);
    if ($ip === '') {
        return null;
    }
    return md5($ip . IP_HASH_SECRET);
}

function rate_ok(string $table, int $max, int $seconds): bool
{
    $h = ip_hash();
    if ($h === null) {
        return true;
    }
    $pdo = db();
    if (mt_rand(1, 10) === 1) {
        $pdo->prepare("UPDATE `$table` SET ip_hash = NULL WHERE ip_hash IS NOT NULL AND created_at < NOW() - INTERVAL 1 DAY")->execute();
    }
    $st = $pdo->prepare("SELECT COUNT(*) FROM `$table` WHERE ip_hash = ? AND created_at > NOW() - INTERVAL " . (int)$seconds . " SECOND");
    $st->bindValue(1, $h);
    $st->execute();
    return (int)$st->fetchColumn() < $max;
}

function json_out(array $payload, int $status = 200): void
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($payload, JSON_UNESCAPED_UNICODE);
    exit;
}

/**
 * Valeurs par défaut du site (personnages, phrases horoscope, textes).
 */
function defaults(): array
{
    static $d = null;
    if ($d === null) {
        require __DIR__ . '/defaults.php';
        $d = [
            'characters' => $DEFAULT_CHARACTERS,
            'phrases'    => $DEFAULT_PHRASES,
            'texts'      => $DEFAULT_TEXTS,
        ];
    }
    return $d;
}

function valid_day(?string $d): bool
{
    if (!is_string($d) || !preg_match('/^(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$/', $d)) {
        return false;
    }
    [$m, $day] = array_map('intval', explode('-', $d));
    return checkdate($m, $day, 2000);
}

function valid_birth_date(?string $s): bool
{
    if ($s === null || $s === '') {
        return true;
    }
    if (!preg_match('/^(\d{4})-(\d{2})-(\d{2})$/', $s, $m)) {
        return false;
    }
    return checkdate((int)$m[2], (int)$m[3], (int)$m[1]) && $s >= '1900-01-01' && $s <= '2100-12-31';
}
