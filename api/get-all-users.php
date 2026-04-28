<?php
require_once __DIR__ . '/../controller/session-config.php';
require_once __DIR__ . '/../model/Database.php';

header('Content-Type: application/json');

// Temporarily remove session check for testing
if (!isset($_SESSION['utilisateur_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Not logged in']);
    exit;
}

$userId = $_SESSION['utilisateur_id'];
// $userId = 1; // Assume user 1 for testing

try {
    $pdo = Database::getConnection();

    // Get all users except the current one
    $sql = "
        SELECT 
            ID,
            nom,
            prenom,
            photo_profil,
            specialite,
            niveau,
            role,
            localisation
        FROM utilisateur
        WHERE ID != :me
        ORDER BY prenom, nom
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
            'specialite' => $row['specialite'],
            'niveau' => $row['niveau'],
            'role' => $row['role'],
            'localisation' => $row['localisation']
        ];
    }, $results);

    echo json_encode($formatted);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Erreur BDD: ' . $e->getMessage()]);
}
?>