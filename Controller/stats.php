<?php
ob_start(); // capture tout output parasite (warnings, notices)

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

// ── Chemin vers Database.php ──
// Ajustez si votre structure est différente
$dbPath = __DIR__ . '/../model/Database.php';

if (!file_exists($dbPath)) {
    ob_end_clean();
    http_response_code(500);
    echo json_encode(['error' => 'Database.php introuvable : ' . $dbPath]);
    exit;
}

require_once $dbPath;

try {
    $pdo = Database::getConnection();

    $users      = $pdo->query("SELECT COUNT(*) FROM utilisateur")->fetchColumn();
    $services   = $pdo->query("SELECT COUNT(*) FROM service")->fetchColumn();
    $categories = $pdo->query("SELECT COUNT(*) FROM categorie")->fetchColumn();
    $activities = $pdo->query("
        SELECT COUNT(*) FROM evaluation
        WHERE MONTH(DateEval) = MONTH(CURDATE())
          AND YEAR(DateEval)  = YEAR(CURDATE())
    ")->fetchColumn();

    ob_end_clean(); // vide tout output parasite avant d'envoyer le JSON
    echo json_encode([
        'users'      => (int)$users,
        'services'   => (int)$services,
        'categories' => (int)$categories,
        'activities' => (int)$activities,
        'error'      => null
    ]);

} catch (PDOException $e) {
    ob_end_clean();
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}