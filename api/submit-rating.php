<?php
session_start();
require_once __DIR__ . '/../model/Database.php';

header('Content-Type: application/json');

if (!isset($_SESSION['utilisateur_id'])) {
    echo json_encode(['success' => false, 'message' => 'Utilisateur non connecté']);
    exit;
}

$userId = intval($_SESSION['utilisateur_id']);
$data   = json_decode(file_get_contents("php://input"), true);

$note        = intval($data['note']        ?? 0);
$commentaire = trim($data['commentaire']   ?? '');
$dateEval    = $data['DateEval']           ?? date('Y-m-d');
$serviceId   = intval($data['ID_Service']  ?? 0);

// Convertir format fr (d/m/Y) → Y-m-d
if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $dateEval)) {
    $parts = explode('/', $dateEval);
    if (count($parts) === 3) {
        $dateEval = $parts[2] . '-' . $parts[1] . '-' . $parts[0];
    }
}

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

    // Récupérer le propriétaire du service
    $stmt = $pdo->prepare("SELECT ID_Utilisateur FROM service WHERE ID = :serviceId");
    $stmt->execute([':serviceId' => $serviceId]);
    $service = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$service) {
        echo json_encode(['success' => false, 'message' => 'Service non trouvé']);
        exit;
    }

    $serviceOwnerUserId = $service['ID_Utilisateur'];

    // Un seul INSERT en BDD
    $stmt = $pdo->prepare("
        INSERT INTO evaluation (note, commentaire, DateEval, ID_Evaluateur, ID_Utilisateur, ID_Service)
        VALUES (:note, :commentaire, :dateEval, :evaluatorId, :userId, :serviceId)
    ");
    $stmt->execute([
        ':note'        => $note,
        ':commentaire' => $commentaire ?: null,
        ':dateEval'    => $dateEval,
        ':evaluatorId' => $userId,
        ':userId'      => $serviceOwnerUserId,
        ':serviceId'   => $serviceId,
    ]);

    $evalId = $pdo->lastInsertId();

    // Récupérer les infos de l'évaluateur pour les notifications
    $stmtUser = $pdo->prepare("SELECT nom, prenom, photo_profil FROM utilisateur WHERE ID = :id");
    $stmtUser->execute([':id' => $userId]);
    $evaluateur = $stmtUser->fetch(PDO::FETCH_ASSOC);

    $fullname = trim(($evaluateur['prenom'] ?? '') . ' ' . ($evaluateur['nom'] ?? ''));
    if ($fullname === '') $fullname = 'Utilisateur inconnu';

    /* ══════════════════════════════════════════
       Construire les notifications séparées
       (logique PHP uniquement, pas de BDD supplémentaire)
    ══════════════════════════════════════════ */

    // Notification 1 — toujours présente : la note
    $notifications = [
        [
            'id'           => $evalId . '_eval',
            'type'         => 'eval',
            'title'        => $fullname,
            'photo_profil' => $evaluateur['photo_profil'] ?? null,
            'note'         => $note,
            'message'      => null,
            'created_at'   => $dateEval,
        ]
    ];

    // Notification 2 — uniquement si commentaire non vide
    if ($commentaire !== '') {
        $notifications[] = [
            'id'           => $evalId . '_comment',
            'type'         => 'comment',
            'title'        => $fullname,
            'photo_profil' => $evaluateur['photo_profil'] ?? null,
            'note'         => null,
            'message'      => $commentaire,
            'created_at'   => $dateEval,
        ];
    }

    echo json_encode([
        'success'       => true,
        'message'       => 'Évaluation soumise avec succès',
        'evaluation_id' => $evalId,
        'notifications' => $notifications,   // retourné au JS pour affichage immédiat
    ]);

} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => 'Erreur : ' . $e->getMessage()]);
}