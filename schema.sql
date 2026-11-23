-- Même Jour — schéma MySQL (à exécuter UNE SEULE FOIS, une fois la base créée).
-- Astuce : dépose plutôt install.php sur ton hébergement, il crée tout automatiquement.

SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS characters (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  series VARCHAR(120) NOT NULL,
  birthday VARCHAR(5) NOT NULL,
  antagonist TINYINT(1) NOT NULL DEFAULT 0,
  KEY idx_birthday (birthday)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS phrases (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  category ENUM('gen','love','work','nrg','mantra','asc') NOT NULL,
  text VARCHAR(400) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS site_texts (
  k VARCHAR(40) NOT NULL PRIMARY KEY,
  value VARCHAR(600) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS subscribers (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  email VARCHAR(200) NOT NULL UNIQUE,
  whatsapp VARCHAR(30) NULL,
  birth_date DATE NULL,
  signe VARCHAR(20) NULL,
  consent TINYINT(1) NOT NULL DEFAULT 0,
  ip_hash CHAR(32) NULL,
  KEY idx_subscribers_ip (ip_hash, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS stats (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  signe VARCHAR(20) NULL,
  ip_hash CHAR(32) NULL,
  KEY idx_stats_ip (ip_hash, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS messages (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  day VARCHAR(5) NOT NULL,
  pseudo VARCHAR(24) NOT NULL,
  body VARCHAR(300) NOT NULL,
  hidden TINYINT(1) NOT NULL DEFAULT 0,
  ip_hash CHAR(32) NULL,
  KEY idx_day (day, created_at),
  KEY idx_messages_ip (ip_hash, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS journal (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  jour DATE NOT NULL,
  token CHAR(64) NOT NULL,
  humeur TINYINT UNSIGNED NOT NULL,
  note VARCHAR(280) NULL,
  signe VARCHAR(20) NULL,
  lune VARCHAR(20) NULL,
  phase VARCHAR(4) NULL,
  retro TINYINT(1) NOT NULL DEFAULT 0,
  UNIQUE KEY uq_journal_token_jour (token, jour),
  KEY idx_journal_jour (jour)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS reports (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  message_id INT UNSIGNED NOT NULL,
  ip_hash CHAR(32) NULL,
  KEY idx_reports_ip (ip_hash, created_at),
  CONSTRAINT fk_reports_message FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Phrases par défaut (le site utilise aussi ses valeurs internes si ces tables sont vides).
INSERT INTO phrases (category, text) VALUES
('gen','Une petite victoire t’attend si tu t’appuies sur {f}. Méfie-toi de {p}.'),
('gen','Ne cherche pas à tout contrôler : {f} suffit, et {p} se calmera tout seul.'),
('gen','Aujourd’hui, choisis une seule priorité et sers-toi de {f} pour l’atteindre. {p} n’aura pas le dernier mot.'),
('gen','Prends du recul avant de décider : {f} t’aidera, {p} pourrait te piéger.'),
('gen','Ce que tu fais avec {f} aujourd’hui portera ses fruits plus tard. Garde {p} sous contrôle.'),
('gen','Écoute ton instinct, tu as {f} avec toi. Si {p} se réveille, respire et recommence.'),
('gen','Appuie-toi sur {f} aujourd’hui et garde un œil sur {p}.'),
('gen','Ta force du jour : {f}. Ton point de vigilance : {p}.'),
('gen','Avance à ton rythme : {f} te servira, {p} pourrait te ralentir.'),
('gen','Fais confiance à {f}, mais ne laisse pas {p} décider à ta place.'),
('gen','Une bonne journée pour montrer {f}. Évite que {p} prenne le dessus.'),
('gen','Prends cinq minutes pour te recentrer : {f} fera le reste, {p} peut attendre.'),
('love','Un message inattendu pourrait te faire sourire : réponds avec chaleur.'),
('love','Prévois un moment à deux ou entre amis, sans téléphone.'),
('love','Pardonne une vieille maladresse : cela te soulagera plus que l’autre.'),
('love','Ne cherche pas à gagner une dispute : cherche à te comprendre.'),
('love','Montre ta reconnaissance à quelqu’un qui t’a aidé récemment.'),
('love','Ne compare pas ta relation à celle des autres : la tienne a son propre rythme.'),
('love','Dis simplement ce que tu ressens : un mot sincère vaut mieux qu’un long discours.'),
('love','Prends des nouvelles de quelqu’un que tu n’as pas appelé depuis longtemps.'),
('love','Écoute plus que tu ne parles avec ton entourage proche.'),
('love','Un petit geste attentionné fera plus d’effet qu’un grand projet.'),
('love','Évite de répondre à chaud en cas de désaccord : attends une heure.'),
('love','Les célibataires peuvent faire une belle rencontre en sortant de leurs habitudes.'),
('work','Dis non à une demande de dernière minute qui n’est pas ta priorité.'),
('work','Compare deux offres avant d’acheter : tu peux économiser sans effort.'),
('work','Demande un retour sur ton travail, il t’apprendra plus que tes propres doutes.'),
('work','Planifie ta semaine ce soir, même en cinq lignes.'),
('work','Une formation ou une lecture utile peut te rapporter gros à moyen terme.'),
('work','Ne mélange pas dépenses plaisir et dépenses obligatoires aujourd’hui.'),
('work','Termine d’abord la tâche la plus pénible, le reste ira plus vite.'),
('work','Note tes dépenses du jour : une petite fuite devient vite un gros trou.'),
('work','Une conversation franche avec un collègue ou un partenaire débloque un dossier.'),
('work','Évite de signer ou de t’engager sans avoir tout relu.'),
('work','Une idée simple, bien présentée, a plus de chances de passer qu’un plan compliqué.'),
('work','Range tes papiers et ta liste de priorités : tu y verras plus clair.'),
('nrg','Étire-toi cinq minutes en te levant, ton dos te dira merci.'),
('nrg','Mange un vrai fruit plutôt qu’une collation sucrée.'),
('nrg','Sors prendre l’air au moins un quart d’heure, même s’il fait chaud.'),
('nrg','Respire profondément avant une réunion ou un échange tendu.'),
('nrg','Évite de sauter un repas : ton humeur en dépend.'),
('nrg','Prends le temps de ranger ton espace, ton esprit suivra.'),
('nrg','Bois de l’eau et marche vingt minutes, ton esprit s’éclaircira.'),
('nrg','Dors à heure fixe ce soir, ton corps te le rendra demain.'),
('nrg','Limite les écrans en fin de journée pour mieux récupérer.'),
('nrg','Un repas calme, sans téléphone, te fera du bien.'),
('nrg','Bouge un peu dès le matin pour lancer l’énergie de la journée.'),
('nrg','Fais une vraie pause au milieu de la journée, même courte.'),
('mantra','Un pas après l’autre.'),
('mantra','Je choisis ce qui compte.'),
('mantra','Je fais de mon mieux, et c’est suffisant.'),
('mantra','Chaque jour est une page neuve.'),
('mantra','Je reste calme et clair.'),
('mantra','Je commence petit, je finis grand.'),
('mantra','Je suis patient avec moi-même.'),
('mantra','Mes efforts finissent toujours par se voir.'),
('mantra','Je dis oui à ce qui me fait grandir.'),
('mantra','Je laisse partir ce que je ne contrôle pas.'),
('mantra','Je me concentre sur ce qui avance.'),
('mantra','Aujourd’hui, je prends soin de moi.'),
('asc','Ton ascendant {a} colore ta première impression : mise sur {f} dans tes premiers contacts, surveille {p}.'),
('asc','Avec un ascendant {a}, les autres te voient d’abord par {f}. Aujourd’hui, évite que {p} ne prenne le devant.'),
('asc','Ton ascendant {a} pèse dans tes rencontres du jour : {f} t’ouvre des portes, {p} peut les refermer.'),
('asc','Ton ascendant {a} influence ton attitude : montre {f}, garde {p} en retrait.');
