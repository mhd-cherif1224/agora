<?php

session_start();

require_once __DIR__ . '/../model/Database.php';

header('Content-Type: application/json');

if (!isset($_SESSION['utilisateur_id'])) {
    echo json_encode([
        'success' => false,
        'message' => 'Utilisateur non connecté'
    ]);
    exit;
}

$userId = intval($_SESSION['utilisateur_id']);

$data = json_decode(
    file_get_contents("php://input"),
    true
);

$note = intval($data['note'] ?? 0);
$commentaire = trim($data['commentaire'] ?? '');
$dateEval = $data['DateEval'] ?? date('Y-m-d');
$serviceId = intval($data['ID_Service'] ?? 0);

// Convert French date format (d/m/Y) to database format (Y-m-d)
if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $dateEval)) {
    $dateParts = explode('/', $dateEval);
    if (count($dateParts) === 3) {
        $dateEval = $dateParts[2] . '-' . $dateParts[1] . '-' . $dateParts[0];
    }
}

if ($note < 1 || $note > 5) {
    echo json_encode([
        'success' => false,
        'message' => 'Note invalide'
    ]);
    exit;
}

if ($serviceId <= 0) {
    echo json_encode([
        'success' => false,
        'message' => 'Service invalide'
    ]);
    exit;
}

try {

    $pdo = Database::getConnection();

    // Get service owner ID
    $stmt = $pdo->prepare("
        SELECT ID_Utilisateur FROM service WHERE ID = :serviceId
    ");
    $stmt->execute([':serviceId' => $serviceId]);
    $service = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$service) {
        echo json_encode([
            'success' => false,
            'message' => 'Service non trouvé'
        ]);
        exit;
    }

    $serviceOwnerUserId = $service['ID_Utilisateur'];

    // Insert evaluation
    $stmt = $pdo->prepare("
        INSERT INTO evaluation (
            note,
            commentaire,
            DateEval,
            ID_Evaluateur,
            ID_Utilisateur,
            ID_Service
        ) VALUES (
            :note,
            :commentaire,
            :dateEval,
            :evaluatorId,
            :userId,
            :serviceId
        )
    ");

    $stmt->execute([
        ':note' => $note,
        ':commentaire' => $commentaire ?: null,
        ':dateEval' => $dateEval,
        ':evaluatorId' => $userId,
        ':userId' => $serviceOwnerUserId,
        ':serviceId' => $serviceId
    ]);

    echo json_encode([
        'success' => true,
        'message' => 'Évaluation soumise avec succès',
        'evaluation_id' => $pdo->lastInsertId()
    ]);

} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Erreur lors de la soumission : ' . $e->getMessage()
    ]);
    exit;
}
