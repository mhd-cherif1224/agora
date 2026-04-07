<?php
/* ══════════════════════════════════════════
   VERIFY-EMAIL.PHP
   — Compare le code saisi avec celui en session
══════════════════════════════════════════ */

/* 1. Bloquer tout output parasite AVANT session_start */
ob_start();

/* 2. Démarrer la session — MÊME configuration que resend-code.php */
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// DEBUG TEMPORAIRE — à supprimer après
error_log('SESSION au moment verify: ' . print_r($_SESSION, true));
error_log('Code reçu: ' . $code);

/* 3. Headers JSON */
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Methods: POST, OPTIONS');

/* 4. Preflight CORS */
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

/* ══ LECTURE DU BODY ══ */
$raw   = file_get_contents('php://input');
$body  = json_decode($raw, true);
$email = isset($body['email']) ? trim($body['email']) : '';
$code  = isset($body['code'])  ? trim($body['code'])  : '';

/* ══ VALIDATION BASIQUE ══ */
if (empty($code) || strlen($code) !== 6 || !ctype_digit($code)) {
    ob_end_clean();
    echo json_encode(['success' => false, 'message' => 'Code invalide.']);
    exit;
}

/* ══ VÉRIFIER QUE LA SESSION EXISTE ══ */
if (empty($_SESSION['otp_code']) || empty($_SESSION['otp_email']) || empty($_SESSION['otp_expires'])) {
    ob_end_clean();
    echo json_encode(['success' => false, 'message' => 'Aucun code trouvé. Demandez un nouveau code.']);
    exit;
}

/* ══ CODE EXPIRÉ ? ══ */
if (time() > $_SESSION['otp_expires']) {
    unset($_SESSION['otp_code'], $_SESSION['otp_email'], $_SESSION['otp_expires']);
    ob_end_clean();
    echo json_encode(['success' => false, 'message' => 'Code expiré. Cliquez sur "Renvoyer le code".']);
    exit;
}

/* ══ EMAIL CORRESPOND ? ══ */
if ($_SESSION['otp_email'] !== $email) {
    ob_end_clean();
    echo json_encode(['success' => false, 'message' => 'Email non reconnu.']);
    exit;
}

/* ══ CODE CORRECT ? ══ */
if ($_SESSION['otp_code'] === $code) {
    /* Invalider après usage unique */
    unset($_SESSION['otp_code'], $_SESSION['otp_email'], $_SESSION['otp_expires']);
    ob_end_clean();
    echo json_encode(['success' => true]);
} else {
    ob_end_clean();
    echo json_encode(['success' => false, 'message' => 'Code incorrect. Réessayez.']);
}
?>