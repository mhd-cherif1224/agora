<?php
// update-service.php
require_once __DIR__ . '/../controller/session-config.php';
require_once __DIR__ . '/../model/Database.php';

header('Content-Type: application/json');

// ── Auth ──
if (!isset($_SESSION['utilisateur_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Non authentifié']);
    exit;
}

$currentUserId = intval($_SESSION['utilisateur_id']);
$pdo = Database::getConnection();
$pdo->exec("SET time_zone = '+00:00'");

// ── Récupérer l'ID du service ──
$serviceId = intval($_POST['id'] ?? 0);
if (!$serviceId) {
    echo json_encode(['success' => false, 'message' => 'ID service manquant']);
    exit;
}

// ── Vérifier que le service appartient à l'utilisateur connecté ──
$check = $pdo->prepare("SELECT ID_Utilisateur FROM service WHERE ID = :id");
$check->execute(['id' => $serviceId]);
$row = $check->fetch(PDO::FETCH_ASSOC);

if (!$row) {
    echo json_encode(['success' => false, 'message' => 'Service introuvable']);
    exit;
}

if (intval($row['ID_Utilisateur']) !== $currentUserId) {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Accès refusé']);
    exit;
}

// ── Données ──
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

// ── Validation photos ──
$allowedTypes  = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
$maxFileSize   = 5 * 1024 * 1024;
$uploadedFiles = [];

if (!empty($_FILES['photos']['name'][0])) {
    foreach ($_FILES['photos']['tmp_name'] as $i => $tmpName) {
        if ($_FILES['photos']['error'][$i] === UPLOAD_ERR_NO_FILE) continue;
        if ($_FILES['photos']['error'][$i] !== UPLOAD_ERR_OK) {
            echo json_encode(['success' => false, 'message' => 'Erreur upload photo ' . ($i + 1)]);
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

    // ── Mettre à jour le service ──
    $stmt = $pdo->prepare("
        UPDATE service
        SET titre       = ?,
            description = ?,
            prix        = ?,
            status      = ?
        WHERE ID = ?
    ");
    $stmt->execute([$titre, $description, $prix, $status, $serviceId]);

    // ── Mettre à jour les catégories ──
    // Supprimer les anciennes
    $pdo->prepare("DELETE FROM service_categorie WHERE ID_Service = ?")->execute([$serviceId]);
    // Insérer les nouvelles
    if (!empty($categories)) {
        $stmtCat = $pdo->prepare("INSERT INTO service_categorie (ID_Service, ID_Categorie) VALUES (?, ?)");
        foreach ($categories as $catId) {
            $stmtCat->execute([$serviceId, (int)$catId]);
        }
    }

    // ── Mettre à jour les photos si nouvelles ──
    if (!empty($uploadedFiles)) {
        // Supprimer les anciennes photos liées
        $oldPhotos = $pdo->prepare("
            SELECT p.ID, p.photo_path
            FROM photos p
            INNER JOIN service_photos sp ON p.ID = sp.ID_Photos
            WHERE sp.ID_Service = ?
        ");
        $oldPhotos->execute([$serviceId]);
        $olds = $oldPhotos->fetchAll(PDO::FETCH_ASSOC);

        $pdo->prepare("DELETE FROM service_photos WHERE ID_Service = ?")->execute([$serviceId]);

        foreach ($olds as $old) {
            $pdo->prepare("DELETE FROM photos WHERE ID = ?")->execute([$old['ID']]);
            // Supprimer le fichier physique
            $fullPath = __DIR__ . '/../' . $old['photo_path'];
            if (file_exists($fullPath)) @unlink($fullPath);
        }

        // Uploader les nouvelles
        $uploadDir = __DIR__ . '/../uploads/services/';
        if (!is_dir($uploadDir)) mkdir($uploadDir, 0755, true);

        $stmtPhoto    = $pdo->prepare("INSERT INTO photos (photo_path) VALUES (?)");
        $stmtSvcPhoto = $pdo->prepare("INSERT INTO service_photos (ID_Service, ID_Photos) VALUES (?, ?)");

        foreach ($uploadedFiles as $file) {
            $ext      = strtolower(pathinfo($file['original'], PATHINFO_EXTENSION));
            $filename = 'service_' . uniqid() . '_' . bin2hex(random_bytes(4)) . '.' . $ext;
            $destPath = $uploadDir . $filename;

            if (!move_uploaded_file($file['tmp_name'], $destPath)) {
                throw new Exception('Impossible de sauvegarder : ' . $file['original']);
            }

            $relativePath = 'uploads/services/' . $filename;
            $stmtPhoto->execute([$relativePath]);
            $photoId = $pdo->lastInsertId();
            $stmtSvcPhoto->execute([$serviceId, $photoId]);
        }
    }

    $pdo->commit();

    echo json_encode([
        'success'   => true,
        'serviceId' => $serviceId
    ]);

} catch (Exception $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}