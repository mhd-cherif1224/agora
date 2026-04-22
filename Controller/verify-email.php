<?php
ob_start();
require_once __DIR__ . '/session-config.php';
error_log('SESSION dans verify: ' . print_r($_SESSION, true));



$raw   = file_get_contents('php://input');
$body  = json_decode($raw, true);
$email = isset($body['email']) ? trim($body['email']) : '';
$code  = isset($body['code'])  ? trim($body['code'])  : '';

if (empty($code) || strlen($code) !== 6 || !ctype_digit($code)) {
    ob_end_clean();
    echo json_encode(['success' => false, 'message' => 'Code invalide.']);
    exit;
}

if (empty($_SESSION['otp_code']) || empty($_SESSION['otp_email']) || empty($_SESSION['otp_expires'])) {
    ob_end_clean();
    echo json_encode(['success' => false, 'message' => 'Aucun code trouvé. Demandez un nouveau code.']);
    exit;
}

if (time() > $_SESSION['otp_expires']) {
    unset($_SESSION['otp_code'], $_SESSION['otp_email'], $_SESSION['otp_expires']);
    ob_end_clean();
    echo json_encode(['success' => false, 'message' => 'Code expiré. Cliquez sur "Renvoyer le code".']);
    exit;
}

if ($_SESSION['otp_email'] !== $email) {
    ob_end_clean();
    echo json_encode(['success' => false, 'message' => 'Email non reconnu.']);
    exit;
}

if ($_SESSION['otp_code'] === $code) {
    $_SESSION['reset_email'] = $email;
    unset($_SESSION['otp_code'], $_SESSION['otp_email'], $_SESSION['otp_expires']);
    ob_end_clean();
    echo json_encode(['success' => true]);
} else {
    ob_end_clean();
    echo json_encode(['success' => false, 'message' => 'Code incorrect. Réessayez.']);
}
?>