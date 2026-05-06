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


// ======================================
// Validation des photos (optionnel)
// ======================================
$allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
$maxFileSize  = 5 * 1024 * 1024; // 5 MB par photo
$uploadedFiles = [];

if (!empty($_FILES['photos']['name'][0])) {

    foreach ($_FILES['photos']['tmp_name'] as $i => $tmpName) {

        // Ignorer les entrées vides
        if ($_FILES['photos']['error'][$i] === UPLOAD_ERR_NO_FILE) continue;

        // Vérifier les erreurs d'upload
        if ($_FILES['photos']['error'][$i] !== UPLOAD_ERR_OK) {
            echo json_encode([
                'success' => false,
                'message' => 'Erreur lors de l\'upload de la photo ' . ($i + 1)
            ]);
            exit;
        }

        // Vérifier le type MIME
        $finfo    = finfo_open(FILEINFO_MIME_TYPE);
        $mimeType = finfo_file($finfo, $tmpName);
        finfo_close($finfo);

        if (!in_array($mimeType, $allowedTypes)) {
            echo json_encode([
                'success' => false,
                'message' => 'Type de fichier non autorisé. Utilisez JPEG, PNG ou WebP.'
            ]);
            exit;
        }

        // Vérifier la taille
        if ($_FILES['photos']['size'][$i] > $maxFileSize) {
            echo json_encode([
                'success' => false,
                'message' => 'La photo ' . ($i + 1) . ' dépasse la taille maximale de 5 Mo.'
            ]);
            exit;
        }

        $uploadedFiles[] = [
            'tmp_name' => $tmpName,
            'original' => $_FILES['photos']['name'][$i],
        ];
    }
}


try {

    // Début de transaction
    $pdo->beginTransaction();


    // ======================================
    // Insertion du service
    // ======================================
    $stmt = $pdo->prepare("
        INSERT INTO service (titre, description, prix, ID_Utilisateur)
        VALUES (?, ?, ?, ?)
    ");

    $stmt->execute([$titre, $description, $prix, $userId]);

    // Récupérer l'ID du service créé
    $serviceId = $pdo->lastInsertId();


    // ======================================
    // Insertion des catégories liées
    // ======================================
    if (!empty($categories)) {

        $stmtCat = $pdo->prepare("
            INSERT INTO service_categorie (ID_Service, ID_Categorie)
            VALUES (?, ?)
        ");

        foreach ($categories as $catId) {
            $stmtCat->execute([$serviceId, (int)$catId]);
        }
    }


    // ======================================
    // Upload et insertion des photos
    // ======================================
    if (!empty($uploadedFiles)) {

        // Dossier de destination
        $uploadDir = __DIR__ . '/../uploads/services/';

        // Créer le dossier s'il n'existe pas
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0755, true);
        }

        $stmtPhoto    = $pdo->prepare("INSERT INTO photos (photo_path) VALUES (?)");
        $stmtSvcPhoto = $pdo->prepare("INSERT INTO service_photos (ID_Service, ID_Photos) VALUES (?, ?)");

        foreach ($uploadedFiles as $file) {

            // Générer un nom de fichier unique
            $ext      = strtolower(pathinfo($file['original'], PATHINFO_EXTENSION));
            $filename = 'service_' . uniqid() . '_' . bin2hex(random_bytes(4)) . '.' . $ext;
            $destPath = $uploadDir . $filename;

            // Déplacer le fichier
            if (!move_uploaded_file($file['tmp_name'], $destPath)) {
                throw new Exception('Impossible de sauvegarder la photo : ' . $file['original']);
            }

            // Chemin relatif stocké en base (cohérent avec les profils existants)
            $relativePath = 'uploads/services/' . $filename;

            // Insérer dans photos
            $stmtPhoto->execute([$relativePath]);
            $photoId = $pdo->lastInsertId();

            // Lier au service
            $stmtSvcPhoto->execute([$serviceId, $photoId]);
        }
    }


    // Sauvegarder les changements
    $pdo->commit();


    // Réponse de succès
    echo json_encode([
        'success'   => true,
        'serviceId' => $serviceId,
        'photos'    => count($uploadedFiles)
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