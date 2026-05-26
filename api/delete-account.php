<?php
session_start();
require_once __DIR__ . '/../model/Database.php';
header('Content-Type: application/json');

if (!isset($_SESSION['utilisateur_id'])) {
    echo json_encode(['success' => false, 'message' => 'Non connecté']);
    exit;
}

$userId = intval($_SESSION['utilisateur_id']);

try {
    $pdo = Database::getConnection();
    $pdo->exec("SET time_zone = '+00:00'"); 

    // 1. Supprimer les évaluations liées aux services
    $pdo->prepare("
        DELETE e FROM evaluation e
        JOIN service s ON e.ID_Service = s.ID
        WHERE s.ID_Utilisateur = ?
    ")->execute([$userId]);

    // 2. Supprimer les liaisons service_photos EN PREMIER
    $pdo->prepare("
        DELETE sp FROM service_photos sp
        JOIN service s ON sp.ID_Service = s.ID
        WHERE s.ID_Utilisateur = ?
    ")->execute([$userId]);

    // 3. Supprimer les photos APRÈS (plus de contrainte FK)
    $pdo->prepare("
        DELETE p FROM photos p
        WHERE p.ID NOT IN (SELECT ID_Photos FROM service_photos)
    ")->execute();

    // 4. Supprimer les liaisons service_categorie
    $pdo->prepare("
        DELETE sc FROM service_categorie sc
        JOIN service s ON sc.ID_Service = s.ID
        WHERE s.ID_Utilisateur = ?
    ")->execute([$userId]);

    // 5. Supprimer les services
    $pdo->prepare("DELETE FROM service WHERE ID_Utilisateur = ?")->execute([$userId]);

    // 6. Supprimer l'utilisateur
    $pdo->prepare("DELETE FROM utilisateur WHERE ID = ?")->execute([$userId]);

    session_destroy();

    echo json_encode(['success' => true]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}