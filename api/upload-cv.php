<?php
// api/upload-cv.php
ob_start();
require_once __DIR__ . '/../controller/session-config.php';
require_once __DIR__ . '/../model/Database.php';
ob_clean();

if (!isset($_SESSION['utilisateur_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Non connecté']);
    exit;
}

if (!isset($_FILES['cv']) || $_FILES['cv']['error'] !== UPLOAD_ERR_OK) {
    echo json_encode(['success' => false, 'message' => 'Fichier manquant ou erreur upload']);
    exit;
}

$file     = $_FILES['cv'];
$allowed  = ['application/pdf', 'application/msword',
             'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
$mime     = mime_content_type($file['tmp_name']);

if (!in_array($mime, $allowed)) {
    echo json_encode(['success' => false, 'message' => 'Format non autorisé (PDF/DOC/DOCX uniquement)']);
    exit;
}

if ($file['size'] > 5 * 1024 * 1024) {
    echo json_encode(['success' => false, 'message' => 'Fichier trop lourd (max 5 Mo)']);
    exit;
}

$ext      = pathinfo($file['name'], PATHINFO_EXTENSION);
$filename = 'cv_' . $_SESSION['utilisateur_id'] . '_' . time() . '.' . $ext;
$uploadDir = __DIR__ . '/../uploads/cv/';

if (!is_dir($uploadDir)) mkdir($uploadDir, 0755, true);

$destPath = $uploadDir . $filename;
if (!move_uploaded_file($file['tmp_name'], $destPath)) {
    echo json_encode(['success' => false, 'message' => 'Erreur sauvegarde fichier']);
    exit;
}

$relativePath = 'uploads/cv/' . $filename;

try {
    $pdo  = Database::getConnection();
    $stmt = $pdo->prepare("UPDATE utilisateur SET cv = :cv WHERE ID = :id");
    $stmt->execute([':cv' => $relativePath, ':id' => $_SESSION['utilisateur_id']]);
    echo json_encode(['success' => true, 'cv_path' => $relativePath]);
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Erreur BDD: ' . $e->getMessage()]);
}