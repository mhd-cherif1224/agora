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

    /* ══════════════════════════════════════════
       1. LIRE LES ÉVALUATIONS
    ══════════════════════════════════════════ */
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
        LEFT JOIN utilisateur u ON e.ID_Evaluateur = u.ID
        WHERE e.ID_Utilisateur = :id
        ORDER BY e.DateEval DESC
    ");
    $stmt->execute([':id' => $userId]);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $notifications = [];
    $unread        = 0;

    foreach ($rows as $row) {
        $isRead   = (int)$row['lue'] === 1;
        $fullname = trim(($row['prenom'] ?? '') . ' ' . ($row['nom'] ?? ''));
        if ($fullname === '') $fullname = 'Utilisateur inconnu';

        /* ── Notification 1 : la note (toujours) ── */
        if (!$isRead) $unread++;

        $notifications[] = [
            'ID'           => $row['ID'] . '_eval',
            'db_id'        => $row['ID'],
            'type'         => 'eval',
            'title'        => $fullname,
            'photo_profil' => $row['photo_profil'],
            'note'         => (int)$row['note'],
            'message'      => null,
            'created_at'   => $row['DateEval'],
            'is_read'      => $isRead,
            'evaluateur_id'=> $row['ID_Evaluateur'],
        ];

        /* ── Notification 2 : le commentaire (si non vide) ── */
        if (!empty(trim($row['commentaire'] ?? ''))) {
            // Le commentaire partage le même statut "lue" que l'évaluation
            $notifications[] = [
                'ID'           => $row['ID'] . '_comment',
                'db_id'        => $row['ID'],
                'type'         => 'comment',
                'title'        => $fullname,
                'photo_profil' => $row['photo_profil'],
                'note'         => null,
                'message'      => $row['commentaire'],
                'created_at'   => $row['DateEval'],
                'is_read'      => $isRead,
                'evaluateur_id'=> $row['ID_Evaluateur'],
            ];
        }
    }

    /* ══════════════════════════════════════════
       2. STATS DU JOUR
       - evals   = évaluations reçues aujourd'hui
       - comments = évaluations avec commentaire reçues aujourd'hui
    ══════════════════════════════════════════ */
    $stmtToday = $pdo->prepare("
        SELECT
            COUNT(*)                                          AS evals_today,
            SUM(CASE WHEN commentaire IS NOT NULL
                      AND commentaire != '' THEN 1 ELSE 0 END) AS comments_today
        FROM evaluation
        WHERE ID_Utilisateur = :id
          AND DATE(DateEval) = CURDATE()
    ");
    $stmtToday->execute([':id' => $userId]);
    $today = $stmtToday->fetch(PDO::FETCH_ASSOC);

    /* ══════════════════════════════════════════
       3. ACTIVITÉ SUR 7 JOURS
    ══════════════════════════════════════════ */
    $stmtWeek = $pdo->prepare("
        SELECT
            DATE(DateEval) AS jour,
            COUNT(*)       AS evals,
            SUM(CASE WHEN commentaire IS NOT NULL
                      AND commentaire != '' THEN 1 ELSE 0 END) AS comments
        FROM evaluation
        WHERE ID_Utilisateur = :id
          AND DateEval >= CURDATE() - INTERVAL 6 DAY
        GROUP BY DATE(DateEval)
        ORDER BY jour ASC
    ");
    $stmtWeek->execute([':id' => $userId]);
    $weekRows = $stmtWeek->fetchAll(PDO::FETCH_ASSOC);

    /* ══════════════════════════════════════════
       4. TOTAUX GLOBAUX
    ══════════════════════════════════════════ */
    $stmtTotal = $pdo->prepare("
        SELECT
            COUNT(*)                                          AS total_evals,
            SUM(CASE WHEN commentaire IS NOT NULL
                      AND commentaire != '' THEN 1 ELSE 0 END) AS total_comments
        FROM evaluation
        WHERE ID_Utilisateur = :id
    ");
    $stmtTotal->execute([':id' => $userId]);
    $total = $stmtTotal->fetch(PDO::FETCH_ASSOC);

    /* ══════════════════════════════════════════
       RESPONSE
    ══════════════════════════════════════════ */
    echo json_encode([
        'success'       => true,
        'unread_count'  => $unread,
        'notifications' => $notifications,
        'stats_today'   => [
            'evals'    => (int)($today['evals_today']    ?? 0),
            'comments' => (int)($today['comments_today'] ?? 0),
        ],
        'stats_week'    => array_map(fn($r) => [
            'jour'     => $r['jour'],
            'evals'    => (int)$r['evals'],
            'comments' => (int)$r['comments'],
        ], $weekRows),
        'totals'        => [
            'evals'    => (int)($total['total_evals']    ?? 0),
            'comments' => (int)($total['total_comments'] ?? 0),
        ],
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error'   => $e->getMessage(),
    ]);
}