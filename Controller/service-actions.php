<?php
session_start();

if (!isset($_SESSION['admin_id'])) {
    echo json_encode(['success' => false, 'message' => 'Accès refusé']);
    exit();
}

require_once '../model/Database.php';
require_once '../model/Service.php';  

$data   = json_decode(file_get_contents('php://input'), true);
$action = $data['action'] ?? '';
$pdo    = Database::getConnection();

switch ($action) {

    case 'lister':
        listerService($pdo);
        break;

    case 'supprimer':
        supprimerService($pdo, $data);
        break;

    default:
        echo json_encode(['success' => false, 'message' => 'Action inconnue']);
        break;
}

// ============================================================
// LISTER — Récupère tous les services depuis la BDD
// ============================================================
function listerService($pdo) {

    $stmt = $pdo->prepare("
        SELECT ID, titre, description, DateDePublication, status, prix 
        FROM Service 
        ORDER BY ID ASC
    ");
  
    $stmt->execute();
    $services = $stmt->fetchAll();
   

    echo json_encode(['success' => true, 'services' => $services]);
}

// ============================================================
// SUPPRIMER — Supprime un service de la BDD
// ============================================================
function supprimerService($pdo, $data) {

    $id = intval($data['id'] ?? 0);

    if ($id <= 0) {
        echo json_encode(['success' => false, 'message' => 'ID invalide']);
        return;
    }

    $stmt = $pdo->prepare("DELETE FROM Service WHERE ID = :id");
    $stmt->execute([':id' => $id]);

    echo json_encode(['success' => true, 'message' => 'Service supprimé avec succès']);
}
?>