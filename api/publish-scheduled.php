<?php
require_once __DIR__ . '/../model/Database.php';
require_once __DIR__ . '/../controller/session-config.php';

$pdo = Database::getConnection();
$pdo->exec("SET time_zone = '+00:00'");

$stmt = $pdo->prepare("
    UPDATE service
    SET status = 'disponible', DateDePublication = NULL
    WHERE status = 'scheduled'
      AND DateDePublication IS NOT NULL
      AND DateDePublication <= NOW()
");
$stmt->execute();

echo json_encode(['updated' => $stmt->rowCount()]);