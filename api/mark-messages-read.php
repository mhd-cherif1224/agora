<?php
require_once __DIR__ . '/../controller/session-config.php';
require_once __DIR__ . '/../model/Database.php';

header('Content-Type: application/json');

if (!isset($_SESSION['utilisateur_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false]);
    exit;
}

$userId = intval($_SESSION['utilisateur_id']);
$body   = json_decode(file_get_contents('php://input'), true);
$otherId = intval($body['other_id'] ?? 0);

if (!$otherId) {
    echo json_encode(['success' => false, 'message' => 'other_id manquant']);
    exit;
}

try {
    $pdo = Database::getConnection();
    $stmt = $pdo->prepare("
        UPDATE message
        SET lue = 1
        WHERE ID_Destinataire = :me
          AND ID_Expediteur   = :other
          AND lue = 0
    ");
    $stmt->execute(['me' => $userId, 'other' => $otherId]);
    echo json_encode(['success' => true, 'updated' => $stmt->rowCount()]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}