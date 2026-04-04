<?php
header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/../model/user.php';
require_once __DIR__ . '/../utilities/EmailVerification.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST' || !isset($_GET['action'])) {
    echo json_encode([
        "success" => false,
        "message" => "Requête invalide"
    ]);
    exit;
}

$data = json_decode(file_get_contents("php://input"), true);
$email = isset($data['email']) ? trim($data['email']) : '';



$action = $_GET['action'];

if ($action === 'register') {
    $code = rand(100000, 999999);

    
    // Removed saveCode since column doesn't exist

    $sent = EmailVerification::sendVerification($email, $code);

    echo json_encode([
        "success" => $sent,
        "email" => $email,
        "message" => $sent ? "Utilisateur enregistré et email envoyé" : "Échec de l'envoi de l'email"
    ]);
    exit;
}


echo json_encode([
    "success" => false,
    "message" => "Action inconnue"
]);
exit;
?>