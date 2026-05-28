<?php

require_once __DIR__ . '/../controller/session-config.php';
require_once __DIR__ . '/../model/Database.php';

header('Content-Type: application/json');

// ── Auth ──
if (!isset($_SESSION['utilisateur_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Non authentifié']);
    exit;
}

$currentUserId = intval($_SESSION['utilisateur_id']);

// ── Récupérer l'ID ──
$body      = json_decode(file_get_contents('php://input'), true);
$serviceId = intval($body['id'] ?? 0);

if (!$serviceId) {
    echo json_encode(['success' => false, 'message' => 'ID manquant']);
    exit;
}

try {
    $pdo = Database::getConnection();
    $pdo->exec("SET time_zone = '+00:00'");

    // ── Vérifier propriété ──
    $check = $pdo->prepare("SELECT ID_Utilisateur FROM service WHERE ID = :id");
    $check->execute(['id' => $serviceId]);
    $row = $check->fetch(PDO::FETCH_ASSOC);

    if (!$row) {
        echo json_encode(['success' => false, 'message' => 'Service introuvable']);
        exit;
    }

    if (intval($row['ID_Utilisateur']) !== $currentUserId) {
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'Accès refusé']);
        exit;
    }

    $pdo->beginTransaction();

    // ── Supprimer les photos physiques ──
    $oldPhotos = $pdo->prepare("
        SELECT p.ID, p.photo_path
        FROM photos p
        INNER JOIN service_photos sp ON p.ID = sp.ID_Photos
        WHERE sp.ID_Service = ?
    ");
    $oldPhotos->execute([$serviceId]);
    $olds = $oldPhotos->fetchAll(PDO::FETCH_ASSOC);

    foreach ($olds as $old) {
        $fullPath = __DIR__ . '/../' . $old['photo_path'];
        if (file_exists($fullPath)) @unlink($fullPath);
    }

    // ── Supprimer les relations ──
    $pdo->prepare("DELETE FROM service_photos    WHERE ID_Service = ?")->execute([$serviceId]);
    $pdo->prepare("DELETE FROM service_categorie WHERE ID_Service = ?")->execute([$serviceId]);
    $pdo->prepare("DELETE FROM evaluation        WHERE ID_Service = ?")->execute([$serviceId]);

    // ── Supprimer les photos en BDD ──
    foreach ($olds as $old) {
        $pdo->prepare("DELETE FROM photos WHERE ID = ?")->execute([$old['ID']]);
    }

    // ── Supprimer le service ──
    $pdo->prepare("DELETE FROM service WHERE ID = ?")->execute([$serviceId]);

    $pdo->commit();

    echo json_encode(['success' => true]);

} catch (Exception $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}