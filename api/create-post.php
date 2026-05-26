<?php

session_start();

require_once __DIR__ . '/../model/Database.php';

header('Content-Type: application/json');

if (!isset($_SESSION['utilisateur_id'])) {
    echo json_encode([
        'success' => false,
        'message' => 'Utilisateur non connecté'
    ]);
    exit;
}

$userId = intval($_SESSION['utilisateur_id']);

$data = json_decode(
    file_get_contents("php://input"),
    true
);

$titre = trim($data['titre'] ?? '');
$description = trim($data['description'] ?? '');
$prix = floatval($data['prix'] ?? 0);
$categories = $data['categories'] ?? [];

if (empty($titre) || empty($description)) {
    echo json_encode([
        'success' => false,
        'message' => 'Champs obligatoires manquants'
    ]);
    exit;
}

try {

    $pdo = Database::getConnection();
    $pdo->exec("SET time_zone = '+00:00'"); 

    $pdo->beginTransaction();

    // Insert service
    $stmt = $pdo->prepare("
        INSERT INTO service (
            titre,
            description,
            prix,
            ID_Utilisateur,
            DateDePublication
        )
        VALUES (
            :titre,
            :description,
            :prix,
            :userId,
            NOW()
        )
    ");

    $stmt->execute([
        'titre' => $titre,
        'description' => $description,
        'prix' => $prix,
        'userId' => $userId
    ]);

    $serviceId = $pdo->lastInsertId();

    // Insert categories
    if (!empty($categories)) {

        $catStmt = $pdo->prepare("
            INSERT INTO service_categorie (
                ID_Service,
                ID_Categorie
            )
            VALUES (
                :serviceId,
                :categoryId
            )
        ");

        foreach ($categories as $categoryId) {

            $catStmt->execute([
                'serviceId' => $serviceId,
                'categoryId' => intval($categoryId)
            ]);
        }
    }

    $pdo->commit();

    echo json_encode([
        'success' => true,
        'message' => 'Service publié'
    ]);

} catch (PDOException $e) {

    $pdo->rollBack();

    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}