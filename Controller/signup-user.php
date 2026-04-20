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

// Vérifier que l'email n'existe pas déjà
$pdo  = Database::getConnection();
$stmt = $pdo->prepare("SELECT ID FROM utilisateur WHERE email = :email LIMIT 1");
$stmt->execute([':email' => $email]);
if ($stmt->fetch()) {
    ob_end_clean();
    echo json_encode(['success' => false, 'message' => 'Cet email est déjà utilisé.']);
    exit;
}

// Stocker en SESSION
$_SESSION['signup_email']    = $email;
$_SESSION['signup_password'] = password_hash($password, PASSWORD_BCRYPT);

// ── Logique OTP (copiée de resend-code.php) ──
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

$MAILJET_API_KEY    = $_ENV['MAILJET_API_KEY']    ?? null;
$MAILJET_SECRET_KEY = $_ENV['MAILJET_SECRET_KEY'] ?? null;
$FROM_EMAIL         = $_ENV['FROM_EMAIL']         ?? null;
$FROM_NAME          = $_ENV['FROM_NAME']          ?? 'Plateforme universitaire';

if (!$MAILJET_API_KEY || !$MAILJET_SECRET_KEY || !$FROM_EMAIL) {
    ob_end_clean();
    echo json_encode(['success' => false, 'message' => 'Configuration .env manquante.']);
    exit;
}

$code = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);
$_SESSION['otp_code']    = $code;
$_SESSION['otp_email']   = $email;
$_SESSION['otp_expires'] = time() + 600;

$payload = json_encode([
    'Messages' => [[
        'From' => ['Email' => $FROM_EMAIL, 'Name' => $FROM_NAME],
        'To'   => [['Email' => $email]],
        'Subject'  => 'Votre code de vérification',
        'HTMLPart' => '
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
        '
    ]]
]);

$ch = curl_init('https://api.mailjet.com/v3.1/send');
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST           => true,
    CURLOPT_POSTFIELDS     => $payload,
    CURLOPT_HTTPHEADER     => ['Content-Type: application/json'],
    CURLOPT_USERPWD        => $MAILJET_API_KEY . ':' . $MAILJET_SECRET_KEY,
    CURLOPT_TIMEOUT        => 15,
    CURLOPT_SSL_VERIFYPEER => false,
    CURLOPT_SSL_VERIFYHOST => false,
]);

$response   = curl_exec($ch);
$httpStatus = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curlError  = curl_error($ch);
curl_close($ch);

if ($curlError) {
    ob_end_clean();
    echo json_encode(['success' => false, 'message' => 'Erreur cURL : ' . $curlError]);
    exit;
}
if ($httpStatus !== 200 && $httpStatus !== 201) {
    $mailjetData = json_decode($response, true);
    $errMsg = $mailjetData['ErrorMessage'] ?? 'Erreur Mailjet (HTTP ' . $httpStatus . ')';
    ob_end_clean();
    echo json_encode(['success' => false, 'message' => $errMsg]);
    exit;
}

ob_end_clean();
echo json_encode(['success' => true, 'email' => $email]);
?>