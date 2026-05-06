<?php
ob_start();

require_once __DIR__ . '/session-config.php';

/* ══ CHARGEMENT DU .env ══ */
function loadEnv($path) {
    if (!file_exists($path)) {
        error_log('ERREUR: fichier .env introuvable à : ' . $path);
        return;
    }
    $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        $line = trim($line);
        if ($line === '' || $line[0] === '#') continue;
        if (strpos($line, '=') === false) continue;
        list($key, $value) = explode('=', $line, 2);
        $_ENV[trim($key)] = trim($value);
    }
}

loadEnv(__DIR__ . '/../.env');

$GMAIL_USER     = $_ENV['GMAIL_USER']         ?? null;
$GMAIL_PASSWORD = $_ENV['GMAIL_APP_PASSWORD'] ?? null;
$FROM_NAME      = $_ENV['FROM_NAME']          ?? 'Plateforme universitaire';

if (!$GMAIL_USER || !$GMAIL_PASSWORD) {
    ob_end_clean();
    echo json_encode(['success' => false, 'message' => 'Configuration manquante dans .env']);
    exit;
}

/* ══ LECTURE DU BODY ══ */
$raw   = file_get_contents('php://input');
$body  = json_decode($raw, true);
$email = isset($body['email']) ? filter_var(trim($body['email']), FILTER_VALIDATE_EMAIL) : false;

if (!$email) {
    ob_end_clean();
    echo json_encode(['success' => false, 'message' => 'Email invalide.']);
    exit;
}

/* ══ GÉNÉRATION DU CODE ══ */
$code = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);

/* ══ STOCKAGE EN SESSION ══ */
$_SESSION['otp_code']    = $code;
$_SESSION['otp_email']   = $email;
$_SESSION['otp_expires'] = time() + 600;

/* ══ ENVOI VIA GMAIL SMTP (cURL) ══ */
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
    </div>
';

$message  = "From: {$FROM_NAME} <{$GMAIL_USER}>\r\n";
$message .= "To: {$email}\r\n";
$message .= "Subject: Votre code de verification\r\n";
$message .= "MIME-Version: 1.0\r\n";
$message .= "Content-Type: text/html; charset=UTF-8\r\n";
$message .= "\r\n";
$message .= $htmlBody;

$ch = curl_init('smtps://smtp.gmail.com:465');
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_USE_SSL        => CURLUSESSL_ALL,
    CURLOPT_MAIL_FROM      => $GMAIL_USER,
    CURLOPT_MAIL_RCPT      => [$email],
    CURLOPT_READDATA       => fopen('data://text/plain,' . urlencode($message), 'r'),
    CURLOPT_UPLOAD         => true,
    CURLOPT_USERNAME       => $GMAIL_USER,
    CURLOPT_PASSWORD       => $GMAIL_PASSWORD,
    CURLOPT_SSL_VERIFYPEER => false,
    CURLOPT_SSL_VERIFYHOST => false,
    CURLOPT_TIMEOUT        => 15,
]);

$response  = curl_exec($ch);
$curlError = curl_error($ch);
curl_close($ch);

if ($curlError) {
    error_log('Erreur cURL SMTP : ' . $curlError);
    ob_end_clean();
    echo json_encode(['success' => false, 'message' => 'Erreur envoi email : ' . $curlError]);
    exit;
}

error_log('=== GMAIL SMTP === Code: ' . $code . ' pour ' . $email);
ob_end_clean();
echo json_encode(['success' => true]);
?>