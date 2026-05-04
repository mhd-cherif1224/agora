<?php

// Importation de la configuration de session
require_once __DIR__ . '/../controller/session-config.php';

// Importation de la connexion à la base de données
require_once __DIR__ . '/../model/Database.php';

// Retour en format JSON
header('Content-Type: application/json');


// ======================================
// Vérifier si l'utilisateur est connecté
// ======================================
if (!isset($_SESSION['utilisateur_id'])) {
    
    http_response_code(401);

    echo json_encode([
        'success' => false,
        'message' => 'Non authentifié'
    ]);

    exit;
}


// Récupérer l'ID de l'utilisateur connecté
$userId = $_SESSION['utilisateur_id'];


// Connexion à la base
$pdo = Database::getConnection();


// ======================================
// Récupération des données envoyées
// ======================================

// Titre du service
$titre = trim($_POST['titre'] ?? '');

// Description du service
$description = trim($_POST['description'] ?? '');

// Prix du service
$prix = $_POST['prix'] ?? null;

// Tableau des catégories sélectionnées
$categories = $_POST['categories'] ?? [];


// ======================================
// Validation
// ======================================
if (empty($titre) || empty($prix)) {

    echo json_encode([
        'success' => false,
        'message' => 'Titre et prix obligatoires'
    ]);

    exit;
}


try {

    // Début de transaction
    $pdo->beginTransaction();


    // ======================================
    // Insertion du service
    // ======================================
    $sql = "
        INSERT INTO service (
            titre,
            description,
            prix,
            ID_Utilisateur
        )
        VALUES (?, ?, ?, ?)
    ";

    $stmt = $pdo->prepare($sql);

    $stmt->execute([
        $titre,
        $description,
        $prix,
        $userId
    ]);


    // Récupérer l'ID du service créé
    $serviceId = $pdo->lastInsertId();


    // ======================================
    // Insertion des catégories liées
    // ======================================
    if (!empty($categories)) {

        $sqlCat = "
            INSERT INTO service_categorie (
                ID_Service,
                ID_Categorie
            )
            VALUES (?, ?)
        ";

        $stmtCat = $pdo->prepare($sqlCat);


        // Parcourir toutes les catégories
        foreach ($categories as $catId) {

            $stmtCat->execute([
                $serviceId,
                $catId
            ]);
        }
    }


    // Sauvegarder les changements
    $pdo->commit();


    // Réponse de succès
    echo json_encode([
        'success' => true,
        'serviceId' => $serviceId
    ]);

} catch (Exception $e) {

    // Annuler en cas d'erreur
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }

    http_response_code(500);

    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}