<?php
require_once __DIR__ . '/../model/Database.php';

header('Content-Type: application/json');

if (!isset($_GET['id'])) {
    echo json_encode([
        'success' => false,
        'message' => 'ID manquant'
    ]);
    exit;
}

$id = intval($_GET['id']);

try {
    $pdo = Database::getConnection();

    $stmt = $pdo->prepare("
    SELECT 
        ID,
        nom,
        prenom,
        photo_profil,
        photo_banniere,
        banner_color_dark,
        banner_color_light,
        specialite,
        niveau,
        role,
        localisation
    FROM utilisateur
    WHERE ID = :id
");

    $stmt->execute(['id' => $id]);

    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user) {
        echo json_encode([
            'success' => false,
            'message' => 'Utilisateur introuvable'
        ]);
        exit;
    }

    echo json_encode([
        'success' => true,
        'user' => $user
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}