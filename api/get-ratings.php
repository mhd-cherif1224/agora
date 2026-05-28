<?php
// api/get-ratings.php
session_start();
require_once __DIR__ . '/../model/Database.php';

header('Content-Type: application/json');

$service_id = intval($_GET['service_id'] ?? 0);
if (!$service_id) {
    echo json_encode(['success' => false, 'message' => 'ID manquant']);
    exit;
}

try {
    $pdo = Database::getConnection();

    $stmt = $pdo->prepare("
        SELECT e.note, e.commentaire, e.DateEval,
               u.nom, u.prenom, u.photo_profil
        FROM evaluation e
        JOIN utilisateur u ON u.ID = e.ID_Evaluateur
        WHERE e.ID_Service = ?
        ORDER BY e.DateEval DESC
    ");
    $stmt->execute([$service_id]);
    $ratings = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode(['success' => true, 'ratings' => $ratings]);

} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}