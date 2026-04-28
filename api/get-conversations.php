<?php
require_once __DIR__ . '/../controller/session-config.php';
require_once __DIR__ . '/../model/Database.php';

header('Content-Type: application/json');

$userId = $_SESSION['utilisateur_id'];

try {
    $pdo = Database::getConnection();

    // Simplified query to get users with conversations
    $sql = "
        SELECT 
  u.ID,
  u.nom,
  u.prenom,
  u.photo_profil,

  m.contenue AS last_message,
  m.DateEnvoie AS last_message_time,

  CASE 
    WHEN m.ID_Expediteur = :me THEN 1
    ELSE 0
  END AS is_sent_by_me

FROM message m

JOIN (
  SELECT 
    CASE 
      WHEN ID_Expediteur = :me THEN ID_Destinataire
      ELSE ID_Expediteur
    END AS other_user,
    MAX(ID) AS last_msg_id
  FROM message
  WHERE ID_Expediteur = :me OR ID_Destinataire = :me
  GROUP BY other_user
) t
ON m.ID = t.last_msg_id

JOIN utilisateur u 
  ON u.ID = t.other_user

ORDER BY m.DateEnvoie DESC;
    ";

    $stmt = $pdo->prepare($sql);
    $stmt->execute(['me' => $userId]);

    $results = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Format the photo_profil paths
    $formatted = array_map(function($row) {
    return [
        'ID' => $row['ID'],
        'nom' => $row['nom'],
        'prenom' => $row['prenom'],
        'photo_profil' => $row['photo_profil'] ? '/Mini-Projet%20-%20Copy/' . $row['photo_profil'] : null,

        // ✅ KEEP REAL DATA
        'last_message' => $row['last_message'] ?? null,
        'last_message_time' => $row['last_message_time'] ?? null,
        'is_sent_by_me' => $row['is_sent_by_me'] ?? 0
    ];
}, $results);

    echo json_encode($formatted);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Erreur BDD: ' . $e->getMessage()]);
}
?>
