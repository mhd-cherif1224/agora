<?php
require_once __DIR__ . '/../controller/session-config.php';
require_once __DIR__ . '/../model/Database.php';

header('Content-Type: application/json');

if (!isset($_SESSION['utilisateur_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false]);
    exit;
}

$data = json_decode(file_get_contents("php://input"), true);

if (!isset($data['id'])) {
    http_response_code(400);
    echo json_encode(['success' => false]);
    exit;
}

try {
    $pdo = Database::getConnection();

    $stmt = $pdo->prepare("
        UPDATE evaluation
        SET lue = 1
        WHERE ID = :id
    ");

    $stmt->execute([':id' => $data['id']]);

    echo json_encode(['success' => true]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false]);
}