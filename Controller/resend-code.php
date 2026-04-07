<?php
/* ══════════════════════════════════════════
   RESEND-CODE.PHP
   — Génère un code OTP, le stocke en session,
     l'envoie via Resend.com API
══════════════════════════════════════════ */

/* 1. Bloquer tout output parasite AVANT session_start */
ob_start();

/* 2. Démarrer la session */
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

/* 3. Headers JSON obligatoires */
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Methods: POST, OPTIONS');

/* 4. Répondre aux preflight CORS */
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

/* ══ CONFIG ══ */
$RESEND_API_KEY = 're_KtfUFMcS_HJRC6SATALJc4hR287zeNDY1'; // ex: re_xxxxxxxxxxxxxxxxxx
$FROM_EMAIL = 'onboarding@resend.dev';
$FROM_NAME  = 'Plateforme d`échange univérsitaire';

/* ══ LECTURE DU BODY ══ */
$raw  = file_get_contents('php://input');
$body = json_decode($raw, true);
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
$_SESSION['otp_expires'] = time() + 600; // expire dans 10 minutes

/* ══ ENVOI VIA RESEND API ══ */
$payload = json_encode([
    'from'    => $FROM_NAME . ' <' . $FROM_EMAIL . '>',
    'to'      => [$email],
    'subject' => 'Votre code de vérification',
    'html'    => '
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
]);

$ch = curl_init('https://api.resend.com/emails');
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST           => true,
    CURLOPT_POSTFIELDS     => $payload,
    CURLOPT_HTTPHEADER     => [
        'Authorization: Bearer ' . $RESEND_API_KEY,
        'Content-Type: application/json'
    ],
    CURLOPT_TIMEOUT        => 15,
    CURLOPT_SSL_VERIFYPEER => false,  // ← ajouter cette ligne
    CURLOPT_SSL_VERIFYHOST => false,  // ← et celle-ci
]);

$response   = curl_exec($ch);
$httpStatus = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curlError  = curl_error($ch);
curl_close($ch);

ob_end_clean(); // vider tout output parasite avant de répondre

/* ══ RÉPONSE ══ */
if ($curlError) {
    echo json_encode(['success' => false, 'message' => 'Erreur cURL : ' . $curlError]);
    exit;
}

if ($httpStatus === 200 || $httpStatus === 201) {
    error_log('=== RESEND === Code généré: ' . $code . ' pour ' . $email);
    error_log('=== RESEND === Session ID: ' . session_id());    
    echo json_encode(['success' => true]);
} else {
    $resendData = json_decode($response, true);
    $errMsg = isset($resendData['message']) ? $resendData['message'] : 'Erreur Resend (HTTP ' . $httpStatus . ')';
    echo json_encode(['success' => false, 'message' => $errMsg]);
}
?>