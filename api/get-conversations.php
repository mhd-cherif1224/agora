<?php
require_once __DIR__ . '/../controller/session-config.php';
require_once __DIR__ . '/../model/Database.php';

header('Content-Type: application/json');

$userId = $_SESSION['utilisateur_id'];

try {
    $pdo = Database::getConnection();
    $pdo->exec("SET time_zone = '+00:00'");

    $sql = "
        SELECT 
          u.ID,
          u.nom,
          u.prenom,
          u.photo_profil,
          m.contenue AS last_message,
          DATE_FORMAT(m.DateEnvoie, '%Y-%m-%dT%H:%i:%sZ') AS last_message_time,
          CASE 
            WHEN m.ID_Expediteur = :me1 THEN 1
            ELSE 0
          END AS is_sent_by_me,
          (
            SELECT COUNT(*) FROM message unread
            WHERE unread.ID_Destinataire = :me2
              AND unread.ID_Expediteur = t.other_user
              AND unread.lue = 0
          ) AS unread_count
        FROM message m
        JOIN (
          SELECT 
            CASE 
              WHEN ID_Expediteur = :me3 THEN ID_Destinataire
              ELSE ID_Expediteur
            END AS other_user,
            MAX(ID) AS last_msg_id
          FROM message
          WHERE ID_Expediteur = :me4 OR ID_Destinataire = :me5
          GROUP BY other_user
        ) t ON m.ID = t.last_msg_id
        JOIN utilisateur u ON u.ID = t.other_user
        ORDER BY m.DateEnvoie DESC
    ";

    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        'me1' => $userId,
        'me2' => $userId,
        'me3' => $userId,
        'me4' => $userId,
        'me5' => $userId,
    ]);

    $results = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $formatted = array_map(function($row) {
        return [
            'ID'                => $row['ID'],
            'nom'               => $row['nom'],
            'prenom'            => $row['prenom'],
            'photo_profil'      => $row['photo_profil'],
            'last_message'      => $row['last_message']      ?? null,
            'last_message_time' => $row['last_message_time'] ?? null,
            'is_sent_by_me'     => (int)($row['is_sent_by_me'] ?? 0),
            'unread_count'      => (int)($row['unread_count']  ?? 0),
        ];
    }, $results);

    echo json_encode($formatted);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Erreur BDD: ' . $e->getMessage()]);
}