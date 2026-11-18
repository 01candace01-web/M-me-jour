<?php
/**
 * Même Jour — API JSON (fetch depuis app.js et admin.js).
 * Actions publiques : messages (lecture), message, subscribe, stat, report.
 * Actions d'admin : préfixées admin_* , exige une session connectée dans admin.php.
 */

require_once __DIR__ . '/db.php';

header('X-Content-Type-Options: nosniff');

function input(): array
{
    $raw = file_get_contents('php://input');
    $j = json_decode($raw ?: '', true);
    if (!is_array($j)) {
        parse_str($raw ?: '', $j);
    }
    return is_array($j) ? $j : [];
}

function require_admin(): void
{
    if (empty($_SESSION['admin'])) {
        json_out(['ok' => false, 'error' => 'Session expirée : reconnecte-toi.'], 401);
    }
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $h = $_SERVER['HTTP_X_CSRF'] ?? '';
        if (!hash_equals($_SESSION['csrf'] ?? '', (string)$h)) {
            json_out(['ok' => false, 'error' => 'Requête invalide.'], 403);
        }
    }
}

session_start();

try {
    $pdo = db();
} catch (Throwable $e) {
    json_out(['ok' => false, 'error' => 'Base de données inaccessible.'], 500);
}

$action = $_GET['action'] ?? '';
$in = [];

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $in = input();
}

switch ($action) {

case 'messages': {
    $day = $_GET['day'] ?? '';
    if (!valid_day($day)) {
        json_out(['ok' => false, 'error' => 'Date invalide.']);
    }
    $st = $pdo->prepare('SELECT id, created_at, pseudo, body FROM messages WHERE day = ? AND hidden = 0 ORDER BY created_at DESC, id DESC LIMIT 50');
    $st->execute([$day]);
    json_out(['ok' => true, 'messages' => $st->fetchAll()]);
}

case 'message': {
    $day  = trim((string)($in['day'] ?? ''));
    $pseudo = trim((string)($in['pseudo'] ?? ''));
    $body = trim((string)($in['body'] ?? ''));
    if (!valid_day($day))            json_out(['ok' => false, 'error' => 'Date invalide.']);
    if (mb_strlen($pseudo) < 2 || mb_strlen($pseudo) > 24) json_out(['ok' => false, 'error' => 'Choisis un pseudo de 2 à 24 caractères.']);
    if (mb_strlen($body) < 1 || mb_strlen($body) > 300)    json_out(['ok' => false, 'error' => 'Message de 1 à 300 caractères.']);
    if (preg_match('/(https?:\/\/|www\.|\.com|\.net)/i', $body)) {
        json_out(['ok' => false, 'error' => 'Les liens ne sont pas autorisés.']);
    }
    if (preg_match('/(admin|mod[eé]rat|m[ême]me\s?jour)/i', $pseudo)) {
        json_out(['ok' => false, 'error' => 'Ce pseudo est réservé.']);
    }
    if (!rate_ok('messages', 6, 60)) json_out(['ok' => false, 'error' => 'Trop de requêtes, réessaie plus tard.']);
    $st = $pdo->prepare('INSERT INTO messages (day, pseudo, body, ip_hash) VALUES (?, ?, ?, ?)');
    $st->execute([$day, $pseudo, $body, ip_hash()]);
    json_out(['ok' => true]);
}

case 'subscribe': {
    $email = strtolower(trim((string)($in['email'] ?? '')));
    $wa    = trim((string)($in['whatsapp'] ?? ''));
    $bd    = trim((string)($in['birth_date'] ?? ''));
    $sign  = trim((string)($in['sign'] ?? ''));
    if (!filter_var($email, FILTER_VALIDATE_EMAIL) || mb_strlen($email) > 200) {
        json_out(['ok' => false, 'error' => 'E-mail invalide.']);
    }
    if (mb_strlen($wa) > 30 || !valid_birth_date($bd) || mb_strlen($sign) > 20) {
        json_out(['ok' => false, 'error' => 'Données invalides.']);
    }
    if (!rate_ok('subscribers', 3, 3600)) json_out(['ok' => false, 'error' => 'Trop de requêtes, réessaie plus tard.']);
    $st = $pdo->prepare('INSERT IGNORE INTO subscribers (email, whatsapp, birth_date, signe, consent, ip_hash) VALUES (?, ?, ?, ?, 1, ?)');
    $st->execute([$email, $wa !== '' ? $wa : null, $bd !== '' ? $bd : null, $sign !== '' ? $sign : null, ip_hash()]);
    json_out(['ok' => true]);
}

case 'stat': {
    $sign = trim((string)($in['sign'] ?? ''));
    if (mb_strlen($sign) > 20) json_out(['ok' => false]);
    if (!rate_ok('stats', 60, 60)) json_out(['ok' => false]);
    $st = $pdo->prepare('INSERT INTO stats (signe, ip_hash) VALUES (?, ?)');
    $st->execute([$sign !== '' ? $sign : null, ip_hash()]);
    json_out(['ok' => true]);
}

case 'report': {
    $id = (int)($in['message_id'] ?? 0);
    if ($id <= 0) json_out(['ok' => false]);
    if (!rate_ok('reports', 20, 600)) json_out(['ok' => false, 'error' => 'Trop de requêtes, réessaie plus tard.']);
    $st = $pdo->prepare('INSERT INTO reports (message_id, ip_hash) VALUES (?, ?)');
    $st->execute([$id, ip_hash()]);
    json_out(['ok' => true]);
}

case 'admin_stats': {
    require_admin();
    $stats = [
        'total' => (int)$pdo->query('SELECT COUNT(*) FROM stats')->fetchColumn(),
        'day'   => (int)$pdo->query('SELECT COUNT(*) FROM stats WHERE created_at > NOW() - INTERVAL 1 DAY')->fetchColumn(),
        'week'  => (int)$pdo->query('SELECT COUNT(*) FROM stats WHERE created_at > NOW() - INTERVAL 7 DAY')->fetchColumn(),
        'subs'  => (int)$pdo->query('SELECT COUNT(*) FROM subscribers')->fetchColumn(),
    ];
    $bySign = $pdo->query("SELECT COALESCE(NULLIF(signe, ''), 'Inconnu') AS s, COUNT(*) AS n FROM stats GROUP BY s ORDER BY n DESC")->fetchAll();
    $byDay  = $pdo->query("SELECT d, COUNT(*) AS n FROM (SELECT DATE_FORMAT(created_at, '%d/%m/%Y') AS d FROM stats ORDER BY created_at DESC LIMIT 1000) t GROUP BY d LIMIT 10")->fetchAll();
    json_out(['ok' => true, 'stats' => $stats, 'bySign' => $bySign, 'byDay' => $byDay]);
}

case 'admin_subscribers': {
    require_admin();
    $rows = $pdo->query('SELECT id, created_at, email, whatsapp, birth_date, signe FROM subscribers ORDER BY created_at DESC LIMIT 1000')->fetchAll();
    json_out(['ok' => true, 'subscribers' => $rows]);
}

case 'admin_subscribers_export': {
    require_admin();
    header('Content-Type: text/csv; charset=utf-8');
    header('Content-Disposition: attachment; filename="inscrits.csv"');
    echo "\ufeffDate;E-mail;WhatsApp;Naissance;Signe\n";
    $st = $pdo->query('SELECT created_at, email, whatsapp, birth_date, signe FROM subscribers ORDER BY created_at DESC');
    while ($r = $st->fetch(PDO::FETCH_NUM)) {
        echo implode(';', array_map(fn($v) => '"' . str_replace('"', '""', (string)$v) . '"', $r)), "\n";
    }
    exit;
}

case 'admin_subscriber_delete': {
    require_admin();
    $st = $pdo->prepare('DELETE FROM subscribers WHERE id = ?');
    $st->execute([(int)($in['id'] ?? 0)]);
    json_out(['ok' => true]);
}

case 'admin_characters': {
    require_admin();
    $month = (string)($_GET['month'] ?? '');
    if (!preg_match('/^(0[1-9]|1[0-2])$/', $month)) {
        $month = '';
    }
    if ($month !== '') {
        $st = $pdo->prepare('SELECT * FROM characters WHERE birthday LIKE ? ORDER BY birthday, name');
        $st->execute([$month . '-%']);
    } else {
        $st = $pdo->prepare('SELECT * FROM characters ORDER BY birthday, name');
        $st->execute();
    }
    $any = (int)$pdo->query('SELECT COUNT(*) FROM characters')->fetchColumn();
    json_out(['ok' => true, 'count' => $any, 'characters' => $st->fetchAll()]);
}

case 'admin_character_save': {
    require_admin();
    $name = trim((string)($in['name'] ?? ''));
    $series = trim((string)($in['series'] ?? ''));
    $bd = trim((string)($in['birthday'] ?? ''));
    $ant = !empty($in['antagonist']) ? 1 : 0;
    if ($name === '' || mb_strlen($name) > 120 || mb_strlen($series) > 120 || !valid_day($bd)) {
        json_out(['ok' => false, 'error' => 'Renseigne le nom, la série et la date au format MM-JJ.']);
    }
    $id = (int)($in['id'] ?? 0);
    if ($id > 0) {
        $st = $pdo->prepare('UPDATE characters SET name = ?, series = ?, birthday = ?, antagonist = ? WHERE id = ?');
        $st->execute([$name, $series, $bd, $ant, $id]);
    } else {
        $st = $pdo->prepare('INSERT INTO characters (name, series, birthday, antagonist) VALUES (?, ?, ?, ?)');
        $st->execute([$name, $series, $bd, $ant]);
    }
    json_out(['ok' => true]);
}

case 'admin_character_delete': {
    require_admin();
    $st = $pdo->prepare('DELETE FROM characters WHERE id = ?');
    $st->execute([(int)($in['id'] ?? 0)]);
    json_out(['ok' => true]);
}

case 'admin_characters_import': {
    require_admin();
    $any = (int)$pdo->query('SELECT COUNT(*) FROM characters')->fetchColumn();
    if ($any > 0) json_out(['ok' => false, 'error' => 'La base contient déjà des personnages.']);
    $def = defaults();
    $st = $pdo->prepare('INSERT INTO characters (name, series, birthday, antagonist) VALUES (?, ?, ?, ?)');
    foreach ($def['characters'] as $c) {
        $st->execute([$c[0], $c[1], $c[2], !empty($c[3]) ? 1 : 0]);
    }
    json_out(['ok' => true, 'imported' => count($def['characters'])]);
}

case 'admin_phrases': {
    require_admin();
    $rows = $pdo->query('SELECT id, category, text FROM phrases ORDER BY category, id')->fetchAll();
    json_out(['ok' => true, 'phrases' => $rows]);
}

case 'admin_phrase_save': {
    require_admin();
    $cat = (string)($in['category'] ?? '');
    $text = trim((string)($in['text'] ?? ''));
    if (!in_array($cat, ['gen', 'love', 'work', 'nrg', 'mantra', 'asc'], true) || $text === '' || mb_strlen($text) > 400) {
        json_out(['ok' => false, 'error' => 'Écris une phrase (max 400 caractères).']);
    }
    $id = (int)($in['id'] ?? 0);
    if ($id > 0) {
        $st = $pdo->prepare('UPDATE phrases SET category = ?, text = ? WHERE id = ?');
        $st->execute([$cat, $text, $id]);
    } else {
        $st = $pdo->prepare('INSERT INTO phrases (category, text) VALUES (?, ?)');
        $st->execute([$cat, $text]);
    }
    json_out(['ok' => true]);
}

case 'admin_phrase_delete': {
    require_admin();
    $st = $pdo->prepare('DELETE FROM phrases WHERE id = ?');
    $st->execute([(int)($in['id'] ?? 0)]);
    json_out(['ok' => true]);
}

case 'admin_phrases_import': {
    require_admin();
    $cat = (string)($in['category'] ?? '');
    if (!in_array($cat, ['gen', 'love', 'work', 'nrg', 'mantra', 'asc'], true)) {
        json_out(['ok' => false, 'error' => 'Catégorie inconnue.']);
    }
    $def = defaults();
    $list = $def['phrases'][$cat] ?? [];
    if (!$list) json_out(['ok' => false, 'error' => 'Aucune phrase par défaut pour cette catégorie.']);
    $st = $pdo->prepare('INSERT INTO phrases (category, text) VALUES (?, ?)');
    foreach ($list as $t) $st->execute([$cat, $t]);
    json_out(['ok' => true, 'imported' => count($list)]);
}

case 'admin_messages': {
    require_admin();
    $rows = $pdo->query('SELECT m.id, m.created_at, m.day, m.pseudo, m.body, m.hidden,
            (SELECT COUNT(*) FROM reports r WHERE r.message_id = m.id) AS reports
        FROM messages m ORDER BY m.created_at DESC LIMIT 300')->fetchAll();
    json_out(['ok' => true, 'messages' => $rows]);
}

case 'admin_message_toggle': {
    require_admin();
    $st = $pdo->prepare('UPDATE messages SET hidden = 1 - hidden WHERE id = ?');
    $st->execute([(int)($in['id'] ?? 0)]);
    json_out(['ok' => true]);
}

case 'admin_message_delete': {
    require_admin();
    $st = $pdo->prepare('DELETE FROM messages WHERE id = ?');
    $st->execute([(int)($in['id'] ?? 0)]);
    json_out(['ok' => true]);
}

case 'admin_texts': {
    require_admin();
    $rows = $pdo->query('SELECT k, value FROM site_texts')->fetchAll(PDO::FETCH_KEY_PAIR);
    json_out(['ok' => true, 'texts' => $rows]);
}

case 'admin_texts_save': {
    require_admin();
    $texts = $in['texts'] ?? [];
    if (!is_array($texts)) json_out(['ok' => false, 'error' => 'Textes invalides.']);
    $def = defaults();
    $st = $pdo->prepare('INSERT INTO site_texts (k, value) VALUES (?, ?) ON DUPLICATE KEY UPDATE value = VALUES(value)');
    foreach ($texts as $k => $v) {
        if (!array_key_exists((string)$k, $def['texts'])) continue;
        $v = trim((string)$v);
        if ($v === '' || $v === $def['texts'][$k] || mb_strlen($v) > 600) continue;
        $st->execute([(string)$k, $v]);
    }
    json_out(['ok' => true]);
}

default:
    json_out(['ok' => false, 'error' => 'Action inconnue.'], 404);
}
