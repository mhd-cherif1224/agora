<?php

require_once __DIR__ . '/../controller/session-config.php';
require_once __DIR__ . '/../model/Database.php';

header('Content-Type: application/json');

if (!isset($_SESSION['utilisateur_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Non authentifié']);
    exit;
}

$userId = intval($_SESSION['utilisateur_id']);
$pdo    = Database::getConnection();
$pdo->exec("SET time_zone = '+00:00'");

$titre          = trim($_POST['titre'] ?? '');
$description    = trim($_POST['description'] ?? '');
$prix_affichage = trim($_POST['prix_affichage'] ?? '');
$prix           = $_POST['prix'] ?? 0;
$status         = $_POST['status'] ?? 'disponible';
$categories     = $_POST['categories'] ?? [];

if (!empty($prix_affichage) && !is_numeric($prix_affichage)) {
    $description .= "\n[prix_texte:" . $prix_affichage . "]";
}

if (empty($titre)) {
    echo json_encode(['success' => false, 'message' => 'Titre obligatoire']);
    exit;
}

$allowedTypes  = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
$maxFileSize   = 5 * 1024 * 1024;
$uploadedFiles = [];

if (!empty($_FILES['photos']['name'][0])) {
    foreach ($_FILES['photos']['tmp_name'] as $i => $tmpName) {
        if ($_FILES['photos']['error'][$i] === UPLOAD_ERR_NO_FILE) continue;
        if ($_FILES['photos']['error'][$i] !== UPLOAD_ERR_OK) {
            echo json_encode(['success' => false, 'message' => 'Erreur upload photo']);
            exit;
        }
        $finfo    = finfo_open(FILEINFO_MIME_TYPE);
        $mimeType = finfo_file($finfo, $tmpName);
        finfo_close($finfo);
        if (!in_array($mimeType, $allowedTypes)) {
            echo json_encode(['success' => false, 'message' => 'Type fichier non autorisé']);
            exit;
        }
        if ($_FILES['photos']['size'][$i] > $maxFileSize) {
            echo json_encode(['success' => false, 'message' => 'Photo trop lourde (max 5 Mo)']);
            exit;
        }
        $uploadedFiles[] = [
            'tmp_name' => $tmpName,
            'original' => $_FILES['photos']['name'][$i],
        ];
    }
}

try {
    $pdo->beginTransaction();

    $stmt = $pdo->prepare("
        INSERT INTO service (titre, description, prix, status, ID_Utilisateur, DateDePublication)
        VALUES (?, ?, ?, ?, ?, UTC_TIMESTAMP())
    ");
    $stmt->execute([$titre, $description, $prix, $status, $userId]);
    $serviceId = $pdo->lastInsertId();

    if (!empty($categories)) {
        $stmtCat = $pdo->prepare("
            INSERT INTO service_categorie (ID_Service, ID_Categorie) VALUES (?, ?)
        ");
        foreach ($categories as $catId) {
            $stmtCat->execute([$serviceId, (int)$catId]);
        }
    }

    if (!empty($uploadedFiles)) {
        $uploadDir = __DIR__ . '/../uploads/services/';
        if (!is_dir($uploadDir)) mkdir($uploadDir, 0755, true);

        $stmtPhoto    = $pdo->prepare("INSERT INTO photos (photo_path) VALUES (?)");
        $stmtSvcPhoto = $pdo->prepare("INSERT INTO service_photos (ID_Service, ID_Photos) VALUES (?, ?)");

        foreach ($uploadedFiles as $file) {
            $ext      = strtolower(pathinfo($file['original'], PATHINFO_EXTENSION));
            $filename = 'service_' . uniqid() . '_' . bin2hex(random_bytes(4)) . '.' . $ext;
            $destPath = $uploadDir . $filename;
            if (!move_uploaded_file($file['tmp_name'], $destPath)) {
                throw new Exception('Impossible de sauvegarder la photo');
            }
            $relativePath = 'uploads/services/' . $filename;
            $stmtPhoto->execute([$relativePath]);
            $photoId = $pdo->lastInsertId();
            $stmtSvcPhoto->execute([$serviceId, $photoId]);
        }
    }

    $pdo->commit();
    echo json_encode(['success' => true, 'serviceId' => $serviceId]);

} catch (Exception $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}