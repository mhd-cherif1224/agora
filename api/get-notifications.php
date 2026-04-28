<?php
require_once __DIR__ . '/../controller/session-config.php';
require_once __DIR__ . '/../model/Database.php';

header('Content-Type: application/json');

if (!isset($_SESSION['utilisateur_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false]);
    exit;
}

$userId = $_SESSION['utilisateur_id'];

try {
    $pdo = Database::getConnection();

    $stmt = $pdo->prepare("
        SELECT 
            e.ID,
            e.note,
            e.commentaire,
            e.DateEval,
            e.lue,
            e.ID_Evaluateur,
            
            u.prenom,
            u.nom,
            u.photo_profil

        FROM evaluation e
        LEFT JOIN utilisateur u 
            ON e.ID_Evaluateur = u.ID

        WHERE e.ID_Utilisateur = :id
        ORDER BY e.DateEval DESC
    ");

    $stmt->execute([':id' => $userId]);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $notifications = [];
    $unread = 0;

    foreach ($rows as $row) {

        $isRead = (int)$row['lue'] === 1;
        if (!$isRead) $unread++;

        // Build evaluator name safely
        $fullname = trim(($row['prenom'] ?? '') . ' ' . ($row['nom'] ?? ''));
        if ($fullname === '') $fullname = 'Utilisateur inconnu';

        $notifications[] = [
            'ID' => $row['ID'],
            'type' => 'eval',

            // 👇 THIS is what your UI will show
            'title' => $fullname,
            'photo_profil' => $row['photo_profil'] ? '/Mini-Projet%20-%20Copy/' . $row['photo_profil'] : null,

            'message' => $row['commentaire'] ?: 'Vous avez reçu une évaluation',
            'note' => (int)$row['note'],
            'created_at' => $row['DateEval'],
            'is_read' => $isRead,

            // optional extras
            'evaluateur_id' => $row['ID_Evaluateur']
        ];
    }

    echo json_encode([
        'success' => true,
        'unread_count' => $unread,
        'notifications' => $notifications
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage() // remove in production
    ]);
}