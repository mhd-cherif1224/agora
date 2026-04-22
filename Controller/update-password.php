<?php
/* ══════════════════════════════════════════
   UPDATE-PASSWORD.PHP
   Met à jour le mot de passe depuis la session
   reset_email (flux mot de passe oublié).
══════════════════════════════════════════ */
ob_start();
require_once __DIR__ . '/session-config.php';
require_once __DIR__ . '/../model/Database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    ob_end_clean();
    echo json_encode(['success' => false, 'message' => 'Méthode non autorisée.']);
    exit;
}

// ── Vérifier que la session reset existe ──
if (empty($_SESSION['reset_email'])) {
    ob_end_clean();
    echo json_encode(['success' => false, 'message' => 'Session expirée. Recommencez la procédure.']);
    exit;
}

// BUG CORRIGÉ : lecture JSON (le JS envoie du JSON avec credentials:include)
$raw              = file_get_contents('php://input');
$body             = json_decode($raw, true);
$nouveauMotDePasse = trim($body['password'] ?? '');

if (empty($nouveauMotDePasse) || strlen($nouveauMotDePasse) < 8) {
    ob_end_clean();
    echo json_encode(['success' => false, 'message' => 'Mot de passe trop court (8 caractères minimum).']);
    exit;
}

$email = $_SESSION['reset_email'];

// ── Hash + mise à jour BDD ──
try {
    $hash = password_hash($nouveauMotDePasse, PASSWORD_BCRYPT);
    $pdo  = Database::getConnection();
    $stmt = $pdo->prepare("UPDATE utilisateur SET MotDePass = :hash WHERE email = :email");
    $stmt->execute([':hash' => $hash, ':email' => $email]);

    if ($stmt->rowCount() === 0) {
        ob_end_clean();
        echo json_encode(['success' => false, 'message' => 'Utilisateur introuvable.']);
        exit;
    }

    // ── Nettoyer la session ──
    unset($_SESSION['reset_email']);

    ob_end_clean();
    echo json_encode(['success' => true]);

} catch (PDOException $e) {
    ob_end_clean();
    echo json_encode(['success' => false, 'message' => 'Erreur BDD : ' . $e->getMessage()]);
}
?>