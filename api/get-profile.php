<?php
// api/get-profile.php
require_once __DIR__ . '/../controller/session-config.php';
require_once __DIR__ . '/../model/Database.php';

header('Content-Type: application/json');

// Guard: must be logged in
if (!isset($_SESSION['utilisateur_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Non connecté']);
    exit;
}

try {
    $pdo  = Database::getConnection();
    $stmt = $pdo->prepare("SELECT * FROM utilisateur WHERE ID = :id LIMIT 1");
    $stmt->execute([':id' => $_SESSION['utilisateur_id']]);
    $row  = $stmt->fetch();

    if (!$row) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Utilisateur introuvable']);
        exit;
    }

    echo json_encode([
    'success'      => true,
    'id'           => $row['ID'],
    'status'       => $row['status'],
    'nom'          => $row['nom'],
    'prenom'       => $row['prenom'],
    'email'        => $row['email'],
    'role'         => $row['role'],
    'localisation' => $row['localisation']   ?? '',
    'niveau'       => $row['niveau']         ?? '',
    'specialite'   => $row['specialite']     ?? '',
    'numTel'       => $row['NumTel']         ?? '',
    'avatar'       => $row['photo_profil']   ? '/Mini-Projet - Copy/' . $row['photo_profil'] : null,
    'banner'       => $row['photo_banniere'] ? '/Mini-Projet - Copy/' . $row['photo_banniere'] : null,
    'banner_color_dark'  => $row['banner_color_dark']  ?? null,
    'banner_color_light' => $row['banner_color_light'] ?? null
]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Erreur BDD']);
}
?>