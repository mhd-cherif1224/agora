<?php
ob_start();
require_once __DIR__ . '/session-config.php';

require_once '../model/Database.php';

$raw      = file_get_contents('php://input');
$body     = json_decode($raw, true);
$email    = isset($body['email'])    ? filter_var(trim($body['email']), FILTER_VALIDATE_EMAIL) : false;
$password = isset($body['password']) ? trim($body['password']) : '';

if (!$email) {
    ob_end_clean();
    echo json_encode(['success' => false, 'message' => 'Email invalide.']);
    exit;
}
if (empty($password)) {
    ob_end_clean();
    echo json_encode(['success' => false, 'message' => 'Mot de passe requis.']);
    exit;
}

// ── Validation email universitaire ──────────────────────────
// Accepte : @univ-bejaia.dz (personnel/profs)
//       ET : @fac.univ-bejaia.dz où fac ∈ {se, snv, shs, eco, droit, st} (étudiants)
$facultes_valides = ['se', 'snv', 'shs', 'eco', 'droit', 'st'];
$facultes_pattern = implode('|', $facultes_valides);

$est_universitaire = preg_match(
    '/^[^@]+@((' . $facultes_pattern . ')\.)?univ-bejaia\.dz$/i',
    $email
);

if (!$est_universitaire) {
    ob_end_clean();
    echo json_encode([
        'success' => false,
        'message' => 'L\'inscription est réservée aux membres de l\'Université de Béjaïa. Veuillez utiliser votre email universitaire (@univ-bejaia.dz ou @fac.univ-bejaia.dz).'
    ]);
    exit;
}

// ── Vérifier que l'email n'existe pas déjà ──────────────────
$pdo  = Database::getConnection();
$stmt = $pdo->prepare("SELECT ID FROM utilisateur WHERE email = :email LIMIT 1");
$stmt->execute([':email' => $email]);
if ($stmt->fetch()) {
    ob_end_clean();
    echo json_encode(['success' => false, 'message' => 'Cet email est déjà utilisé.']);
    exit;
}

// ── Stocker en SESSION ───────────────────────────────────────
$_SESSION['signup_email']    = $email;
$_SESSION['signup_password'] = password_hash($password, PASSWORD_BCRYPT);

// ── Chargement du .env ──────────────────────────────────────
function loadEnv($path) {
    if (!file_exists($path)) return;
    $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        $line = trim($line);
        if ($line === '' || $line[0] === '#' || strpos($line, '=') === false) continue;
        [$key, $value] = explode('=', $line, 2);
        $_ENV[trim($key)] = trim($value);
    }
}

loadEnv(__DIR__ . '/../.env');

$GMAIL_USER     = $_ENV['GMAIL_USER']         ?? null;
$GMAIL_PASSWORD = $_ENV['GMAIL_APP_PASSWORD'] ?? null;
$FROM_NAME      = $_ENV['FROM_NAME']          ?? 'Plateforme Universitaire Béjaïa';

if (!$GMAIL_USER || !$GMAIL_PASSWORD) {
    ob_end_clean();
    echo json_encode(['success' => false, 'message' => 'Configuration Gmail manquante dans .env.']);
    exit;
}

// ── Générer le code OTP ─────────────────────────────────────
$code = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);
$_SESSION['otp_code']    = $code;
$_SESSION['otp_email']   = $email;
$_SESSION['otp_expires'] = time() + 600;

// ── Préparer le contenu de l'email ──────────────────────────
$subject  = '=?UTF-8?B?' . base64_encode('Votre code de vérification') . '?=';
$htmlBody = '
<div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:30px;">
    <h2 style="color:#16376E;">Vérification de votre email</h2>
    <p>Votre code de vérification est :</p>
    <div style="font-size:36px;font-weight:bold;letter-spacing:10px;color:#16376E;
                background:#f0f6ff;padding:20px;border-radius:10px;text-align:center;">
        ' . $code . '
    </div>
    <p style="color:#888;font-size:13px;margin-top:20px;">
        Ce code expire dans 10 minutes. Ne le partagez avec personne.
    </p>
</div>';

// ── Fonction d'envoi via Gmail SMTP ─────────────────────────
function sendGmailSMTP(
    string $gmailUser,
    string $gmailPassword,
    string $toEmail,
    string $fromName,
    string $subject,
    string $htmlBody
): array {

    $socket = fsockopen('smtp.gmail.com', 587, $errno, $errstr, 15);
    if (!$socket) {
        return ['success' => false, 'message' => "Connexion SMTP échouée : $errstr ($errno)"];
    }

    // Lire la réponse du serveur SMTP
    $read = function() use ($socket) {
        $response = '';
        while ($line = fgets($socket, 515)) {
            $response .= $line;
            if (substr($line, 3, 1) === ' ') break;
        }
        return $response;
    };

    // Envoyer une commande SMTP
    $send = function(string $cmd) use ($socket) {
        fputs($socket, $cmd . "\r\n");
    };

    $read(); // Bannière de bienvenue Gmail

    $send("EHLO smtp.gmail.com"); $read();
    $send("STARTTLS");            $read();

    // Activer le chiffrement TLS
    stream_socket_enable_crypto($socket, true, STREAM_CRYPTO_METHOD_TLS_CLIENT);

    $send("EHLO smtp.gmail.com"); $read();

    // Authentification LOGIN
    $send("AUTH LOGIN");                    $read();
    $send(base64_encode($gmailUser));       $read();
    $send(base64_encode($gmailPassword));
    $authResponse = $read();

    if (strpos($authResponse, '235') === false) {
        fclose($socket);
        return [
            'success' => false,
            'message' => 'Authentification Gmail échouée. Vérifiez le mot de passe d\'application dans .env.'
        ];
    }

    $send("MAIL FROM:<$gmailUser>"); $read();
    $send("RCPT TO:<$toEmail>");     $read();
    $send("DATA");                   $read();

    $message  = "From: $fromName <$gmailUser>\r\n";
    $message .= "To: $toEmail\r\n";
    $message .= "Subject: $subject\r\n";
    $message .= "MIME-Version: 1.0\r\n";
    $message .= "Content-Type: text/html; charset=UTF-8\r\n";
    $message .= "\r\n";
    $message .= $htmlBody . "\r\n.";

    $send($message);
    $dataResponse = $read();

    $send("QUIT");
    fclose($socket);

    if (strpos($dataResponse, '250') === false) {
        return ['success' => false, 'message' => 'Erreur envoi email : ' . trim($dataResponse)];
    }

    return ['success' => true];
}

// ── Envoi ────────────────────────────────────────────────────
$result = sendGmailSMTP(
    $GMAIL_USER,
    $GMAIL_PASSWORD,
    $email,
    $FROM_NAME,
    $subject,
    $htmlBody
);

if (!$result['success']) {
    ob_end_clean();
    echo json_encode(['success' => false, 'message' => $result['message']]);
    exit;
}

ob_end_clean();
echo json_encode(['success' => true, 'email' => $email]);
?>