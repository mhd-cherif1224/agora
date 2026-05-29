<?php
// submit-rating.php
session_start();
require_once __DIR__ . '/../model/Database.php';

header('Content-Type: application/json');

if (!isset($_SESSION['utilisateur_id'])) {
    echo json_encode(['success' => false, 'message' => 'Utilisateur non connecté']);
    exit;
}

$userId = intval($_SESSION['utilisateur_id']);
$data   = json_decode(file_get_contents("php://input"), true);

$note        = intval($data['note']       ?? 0);
$commentaire = trim($data['commentaire']  ?? '');
$serviceId   = intval($data['ID_Service'] ?? 0);

if ($note < 1 || $note > 5) {
    echo json_encode(['success' => false, 'message' => 'Note invalide']);
    exit;
}
if ($serviceId <= 0) {
    echo json_encode(['success' => false, 'message' => 'Service invalide']);
    exit;
}

try {
    $pdo = Database::getConnection();
    $pdo->exec("SET time_zone = '+00:00'");

    // Récupérer le propriétaire du service
    $stmt = $pdo->prepare("SELECT ID_Utilisateur FROM service WHERE ID = :serviceId");
    $stmt->execute([':serviceId' => $serviceId]);
    $service = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$service) {
        echo json_encode(['success' => false, 'message' => 'Service non trouvé']);
        exit;
    }

    $serviceOwnerUserId = intval($service['ID_Utilisateur']);

    if ($userId === $serviceOwnerUserId) {
        echo json_encode(['success' => false, 'message' => 'Vous ne pouvez pas évaluer votre propre service.']);
        exit;
    }

    // ── Vérifier si l'utilisateur a déjà évalué ce service ──
    $stmtCheck = $pdo->prepare("
        SELECT ID FROM evaluation
        WHERE ID_Evaluateur = :userId AND ID_Service = :serviceId
    ");
    $stmtCheck->execute([':userId' => $userId, ':serviceId' => $serviceId]);
    $existing = $stmtCheck->fetch(PDO::FETCH_ASSOC);

    if ($existing) {
        // ── UPDATE ──
        $stmtUpdate = $pdo->prepare("
            UPDATE evaluation
            SET note = :note, commentaire = :commentaire, DateEval = UTC_TIMESTAMP()
            WHERE ID = :id
        ");
        $stmtUpdate->execute([
            ':note'        => $note,
            ':commentaire' => $commentaire ?: null,
            ':id'          => $existing['ID'],
        ]);
        $evalId   = $existing['ID'];
        $isUpdate = true;
    } else {
        // ── INSERT ──
        $stmtInsert = $pdo->prepare("
            INSERT INTO evaluation (note, commentaire, DateEval, ID_Evaluateur, ID_Utilisateur, ID_Service)
            VALUES (:note, :commentaire, UTC_TIMESTAMP(), :evaluatorId, :userId, :serviceId)
        ");
        $stmtInsert->execute([
            ':note'        => $note,
            ':commentaire' => $commentaire ?: null,
            ':evaluatorId' => $userId,
            ':userId'      => $serviceOwnerUserId,
            ':serviceId'   => $serviceId,
        ]);
        $evalId   = $pdo->lastInsertId();
        $isUpdate = false;
    }

    // Infos de l'évaluateur
    $stmtUser = $pdo->prepare("SELECT nom, prenom, photo_profil FROM utilisateur WHERE ID = :id");
    $stmtUser->execute([':id' => $userId]);
    $evaluateur = $stmtUser->fetch(PDO::FETCH_ASSOC);

    $fullname = trim(($evaluateur['prenom'] ?? '') . ' ' . ($evaluateur['nom'] ?? ''));
    if ($fullname === '') $fullname = 'Utilisateur inconnu';

    $notifications = [];
    // N'envoyer une notification que lors d'un nouvel INSERT
    if (!$isUpdate) {
        $notifications[] = [
            'id'           => $evalId . '_eval',
            'type'         => 'eval',
            'title'        => $fullname,
            'photo_profil' => $evaluateur['photo_profil'] ?? null,
            'note'         => $note,
            'message'      => null,
            'created_at'   => gmdate('Y-m-d H:i:s'),
        ];
        if ($commentaire !== '') {
            $notifications[] = [
                'id'           => $evalId . '_comment',
                'type'         => 'comment',
                'title'        => $fullname,
                'photo_profil' => $evaluateur['photo_profil'] ?? null,
                'note'         => null,
                'message'      => $commentaire,
                'created_at'   => gmdate('Y-m-d H:i:s'),
            ];
        }
    }

    echo json_encode([
        'success'       => true,
        'updated'       => $isUpdate,
        'message'       => $isUpdate ? 'Évaluation mise à jour' : 'Évaluation soumise avec succès',
        'evaluation_id' => $evalId,
        'notifications' => $notifications,
    ]);

} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => 'Erreur : ' . $e->getMessage()]);
}