<?php
session_start();

// IMPORTANT : pour fetch()
header('Content-Type: application/json');

require_once '../model/Database.php';
require_once '../model/Categorie.php';

// Récupère les données JSON envoyées par fetch()
$data = json_decode(file_get_contents('php://input'), true);

// Récupère l'action demandée
$action = $data['action'] ?? '';

// Connexion à la base de données
$pdo = Database::getConnection();


// ============================================================
// ROUTER (choix de l'action)
// ============================================================
switch ($action) {

    case 'lister':
        listerCategorie($pdo);
        break;

    case 'ajouter':
        ajouterCategorie($pdo, $data);
        break;

    case 'modifier':
        modifierCategorie($pdo, $data);
        break;

    case 'supprimer':
        supprimerCategorie($pdo, $data);
        break;

    default:
        echo json_encode(['success' => false, 'message' => 'Action inconnue']);
        break;
}


// ============================================================
// LISTER — récupérer toutes les catégories
// ============================================================
function listerCategorie($pdo) {

    $stmt = $pdo->prepare("SELECT ID, titre FROM Categorie");
    $stmt->execute();

    $categories = $stmt->fetchAll();

    echo json_encode([
        'success' => true,
        'categories' => $categories
    ]);
}


// ============================================================
// AJOUTER — ajouter une catégorie
// ============================================================
function ajouterCategorie($pdo, $data){

    $titre = trim($data['titre'] ?? '');

    if (empty($titre)) {
        echo json_encode([
            'success' => false,
            'message' => 'Champs obligatoires manquants'
        ]);
        return;
    }

    $stmt = $pdo->prepare("
        INSERT INTO Categorie (titre)
        VALUES (:titre)
    ");

    $stmt->execute([
        ':titre' => $titre
    ]);

    $newId = $pdo->lastInsertId();

    echo json_encode([
        'success' => true,
        'id' => $newId
    ]);
}


// ============================================================
// MODIFIER — modifier une catégorie
// ============================================================
function modifierCategorie($pdo, $data) {

    $id = intval($data['id'] ?? 0);
    $titre = trim($data['titre'] ?? '');

    if ($id <= 0) {
        echo json_encode([
            'success' => false,
            'message' => 'ID invalide'
        ]);
        return;
    }

    if (empty($titre)) {
        echo json_encode([
            'success' => false,
            'message' => 'Champs obligatoires manquants'
        ]);
        return;
    }

    $stmt = $pdo->prepare("
        UPDATE Categorie 
        SET titre = :titre
        WHERE ID = :id
    ");

    $stmt->execute([
        ':titre' => $titre,
        ':id'    => $id
    ]);

    echo json_encode([
        'success' => true
    ]);
}


// ============================================================
// SUPPRIMER — supprimer une catégorie
// ============================================================
function supprimerCategorie($pdo, $data) {

    $id = intval($data['id'] ?? 0);

    if ($id <= 0) {
        echo json_encode([
            'success' => false,
            'message' => 'ID invalide'
        ]);
        return;
    }

    $stmt = $pdo->prepare("DELETE FROM Categorie WHERE ID = :id");
    $stmt->execute([
        ':id' => $id
    ]);

    echo json_encode([
        'success' => true
    ]);
}

?>