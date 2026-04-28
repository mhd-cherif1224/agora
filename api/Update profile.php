<?php

ob_start();
require_once __DIR__ . '/../controller/session-config.php';
require_once __DIR__ . '/../model/Database.php';
ob_clean();

$pdo  = Database::getConnection();

if (!isset($_SESSION['utilisateur_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Non connecté']);
    exit;
}

$body      = json_decode(file_get_contents('php://input'), true);
$nom       = trim($body['nom']         ?? '');
$prenom    = trim($body['prenom']      ?? '');
$role    = trim($body['role']?? '');
$local     = trim($body['localisation']?? '');
$niveau    = trim($body['niveau']      ?? '');
$specialite= trim($body['specialite']  ?? '');

if (isset($body['banner_color_dark']) && isset($body['banner_color_light'])) {
    $dark  = substr(trim($body['banner_color_dark']),  0, 7);
    $light = substr(trim($body['banner_color_light']), 0, 7);

    $stmt = $pdo->prepare("
        UPDATE utilisateur 
        SET banner_color_dark = :dark, banner_color_light = :light 
        WHERE ID = :id
    ");

    $stmt->execute([
        ':dark' => $dark,
        ':light' => $light,
        ':id' => $_SESSION['utilisateur_id']
    ]);

    echo json_encode(['success' => true]);
    exit;
}

// ✅ THEN: validate normal profile update
if (empty($nom) || empty($prenom)) {
    echo json_encode(['success' => false, 'message' => 'Nom et prénom requis.']);
    exit;
}



try {
    
    $stmt = $pdo->prepare("
        UPDATE utilisateur
        SET nom=:nom, prenom=:prenom, role=:role,localisation=:local, niveau=:niveau, specialite=:specialite
        WHERE ID=:id
    ");
    $stmt->execute([
        ':nom'       => $nom,
        ':prenom'    => $prenom,
        ':role'      => $role,
        ':local'     => $local,
        ':niveau'    => $niveau ?: null,
        ':specialite'=> $specialite ?: null,
        ':id'        => $_SESSION['utilisateur_id'],
    ]);

    // Update session name
    $_SESSION['utilisateur_nom']    = $nom;
    $_SESSION['utilisateur_prenom'] = $prenom;

    echo json_encode(['success' => true]);

} catch (PDOException $e) {
    ob_clean();
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Erreur BDD: ' . $e->getMessage()]);
}