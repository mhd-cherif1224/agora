<?php
ob_start();
require_once __DIR__ . '/../controller/session-config.php';
require_once __DIR__ . '/../model/Database.php';
ob_clean();

if (!isset($_SESSION['utilisateur_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Non connecté']);
    exit;
}

$type = $_POST['type'] ?? ''; // 'profil' or 'banniere'
if (!in_array($type, ['profil', 'banniere'])) {
    echo json_encode(['success' => false, 'message' => 'Type invalide.']);
    exit;
}

if (empty($_FILES['image']['tmp_name'])) {
    echo json_encode(['success' => false, 'message' => 'Aucune image reçue.']);
    exit;
}

$uploadDir = __DIR__ . '/../uploads/';
if (!is_dir($uploadDir)) mkdir($uploadDir, 0755, true);

$ext      = 'jpg';
$filename = $type . '_' . time() . '_' . substr(md5(rand()), 0, 8) . '.' . $ext;
$filepath = $uploadDir . $filename;

if (!move_uploaded_file($_FILES['image']['tmp_name'], $filepath)) {
    echo json_encode(['success' => false, 'message' => 'Erreur lors du téléchargement.']);
    exit;
}

$dbPath = 'uploads/' . $filename;
$col    = $type === 'profil' ? 'photo_profil' : 'photo_banniere';

try {
    $pdo  = Database::getConnection();
    $stmt = $pdo->prepare("UPDATE utilisateur SET {$col} = :path WHERE ID = :id");
    $stmt->execute([':path' => $dbPath, ':id' => $_SESSION['utilisateur_id']]);

    echo json_encode(['success' => true, 'path' => $dbPath]);

} catch (PDOException $e) {
    ob_clean();
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Erreur BDD: ' . $e->getMessage()]);
}