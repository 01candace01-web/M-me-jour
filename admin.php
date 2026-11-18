<?php
/**
 * Même Jour — administration : /admin.php
 * Identifiants définis dans config.php (ADMIN_EMAIL, ADMIN_PASSWORD).
 */

require_once __DIR__ . '/db.php';

session_start([
    'cookie_httponly' => true,
    'cookie_samesite' => 'Lax',
    'use_strict_mode' => true,
]);

if (!isset($_SESSION['csrf'])) {
    $_SESSION['csrf'] = bin2hex(random_bytes(16));
}
if (!isset($_SESSION['fails'])) {
    $_SESSION['fails'] = 0;
    $_SESSION['last_try'] = 0;
}
$locked = ($_SESSION['fails'] >= 5) && (time() - (int)$_SESSION['last_try'] < 300);

if (isset($_GET['logout'])) {
    $_SESSION = [];
    session_destroy();
    header('Location: admin.php');
    exit;
}

$msg = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST' && !$locked) {
    $email = strtolower(trim((string)($_POST['email'] ?? '')));
    $pwd = (string)($_POST['pwd'] ?? '');
    if (hash_equals(ADMIN_EMAIL, $email) && hash_equals(ADMIN_PASSWORD, $pwd)) {
        session_regenerate_id(true);
        $_SESSION['admin'] = true;
        $_SESSION['fails'] = 0;
    } else {
        $_SESSION['fails']++;
        $_SESSION['last_try'] = time();
        $msg = 'Identifiants incorrects.';
    }
}
if ($_SERVER['REQUEST_METHOD'] === 'POST' && $locked) {
    $msg = 'Trop de tentatives : réessaie dans quelques minutes.';
}
$admin = !empty($_SESSION['admin']);
$csrf = $_SESSION['csrf'];
?>
<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self'; base-uri 'none'; form-action 'self'; object-src 'none'">
<meta name="referrer" content="strict-origin-when-cross-origin">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex,nofollow">
<title>Administration | Même Jour</title>
<style>
:root{--bg:#1c1a38;--card:#2a2750;--tx:#f1e9d6;--mut:#aaa5cc;--gold:#e8b86b;--teal:#7fd1c4;--line:#413d73;--red:#e58a8a;color-scheme:dark}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--tx);font:16px/1.5 system-ui,sans-serif}
main{max-width:980px;margin:0 auto;padding:24px 16px 80px}
h1{font-size:1.6rem;margin:0 0 16px}h2{font-size:1.2rem;margin:24px 0 10px}
input,textarea,select{font:inherit;color:var(--tx);background:var(--bg);border:1px solid var(--line);border-radius:8px;padding:9px;width:100%}
textarea{min-height:64px}
button{font:inherit;font-weight:600;background:var(--gold);color:#2a1d05;border:0;border-radius:8px;padding:9px 14px;cursor:pointer}
button.alt{background:transparent;color:var(--tx);border:1px solid var(--line)}
button.del{background:transparent;color:var(--red);border:1px solid var(--red)}
input:focus,textarea:focus,select:focus,button:focus-visible{outline:2px solid var(--gold);outline-offset:2px}
.card{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:16px;margin-bottom:12px}
.tabs{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:16px}
.tabs button.on{background:var(--gold);color:#2a1d05}
.tabs button:not(.on){background:transparent;color:var(--tx);border:1px solid var(--line)}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px}
.num{font-size:2rem;font-weight:800;color:var(--gold)}
.row{display:grid;grid-template-columns:2fr 2fr 1fr 1fr auto auto;gap:8px;margin-bottom:8px;align-items:start}
.prow{display:grid;grid-template-columns:1fr auto auto;gap:8px;margin-bottom:8px;align-items:start}
.bar{height:10px;background:var(--teal);border-radius:5px;min-width:2px}
.line{display:grid;grid-template-columns:110px 1fr 40px;gap:10px;align-items:center;margin-bottom:6px}
table{width:100%;border-collapse:collapse;font-size:.92rem}
th,td{text-align:left;padding:8px;border-bottom:1px solid var(--line);vertical-align:top;word-break:break-word}
.wrap{overflow-x:auto}
.mut{color:var(--mut)}.err{color:var(--red)}.ok{color:var(--teal)}
.hid{display:none}
label{display:grid;gap:4px;margin-bottom:10px;font-weight:600}
@media(max-width:640px){.row,.prow{grid-template-columns:1fr}}
</style>
</head>
<body>
<main>
<h1>Administration de Même Jour</h1>
<?php if (!$admin): ?>
<form method="post" class="card" style="max-width:420px">
 <label>E-mail <input type="email" name="email" required autocomplete="username"></label>
 <label>Mot de passe <input type="password" name="pwd" required autocomplete="current-password"></label>
 <button type="submit">Se connecter</button>
 <p class="err"><?= htmlspecialchars($msg) ?></p>
</form>
<?php else: ?>
<div>
 <div class="tabs" id="tabs"></div>
 <p id="msg" role="status" class="mut"></p>
 <div id="view"></div>
 <p><button class="alt" id="out" type="button">Se déconnecter</button></p>
</div>
<script>const CSRF=<?= json_encode($csrf) ?>;</script>
<script src="admin.js"></script>
<?php endif; ?>
</main>
</body>
</html>
