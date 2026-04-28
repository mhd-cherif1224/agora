<?php
require_once __DIR__ . '/../controller/session-config.php';
require_once __DIR__ . '/../model/Database.php';

header('Content-Type: application/json');

// Check session
if (!isset($_SESSION['utilisateur_id'])) {
    http_response_code(401);
    echo json_encode([
        'success' => false,
        'message' => 'Non authentifié'
    ]);
    exit;
}

$userId = $_SESSION['utilisateur_id'];

try {
    $pdo = Database::getConnection();

    // Update all evaluations (notifications) for this user
    $sql = "
        UPDATE evaluation
        SET lue = 1
        WHERE ID_Utilisateur = :userId
    ";

    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        'userId' => $userId
    ]);

    echo json_encode([
        'success' => true,
        'updated' => $stmt->rowCount()
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Erreur BDD: ' . $e->getMessage()
    ]);
}

?>