<?php
/* ══════════════════════════════════════════
   LOGIN-USER.PHP
   Authentification utilisateur via fetch JSON.
   Retourne toujours du JSON (pas de redirect).
══════════════════════════════════════════ */
ob_start();
require_once __DIR__ . '/session-config.php';
require_once '../model/Database.php';
// BUG CORRIGÉ : suppression de user.php (fichier inexistant)

// ── Lecture du body JSON ──
$raw      = file_get_contents('php://input');
$body     = json_decode($raw, true);
$email    = isset($body['email'])    ? filter_var(trim($body['email']), FILTER_VALIDATE_EMAIL) : false;
$password = isset($body['password']) ? trim($body['password']) : '';

if (!$email) {
    ob_end_clean();
    echo json_encode(['success' => false, 'message' => 'Email invalide.']);
    exit;
}
if (empty($password)) {
    ob_end_clean();
    echo json_encode(['success' => false, 'message' => 'Mot de passe requis.']);
    exit;
}

try {
    $pdo  = Database::getConnection();
    $stmt = $pdo->prepare("SELECT * FROM utilisateur WHERE email = :email LIMIT 1");
    $stmt->execute([':email' => $email]);
    $row  = $stmt->fetch();

    // Message générique : ne pas révéler si l'email existe
    if (!$row || !password_verify($password, $row['MotDePass'])) {
        ob_end_clean();
        echo json_encode(['success' => false, 'message' => 'Email ou mot de passe incorrect.']);
        exit;
    }

    // ── Régénérer l'ID de session (protection fixation) ──
    session_regenerate_id(true);

    // ── Stocker en session ──
    $_SESSION['utilisateur_id']     = $row['ID'];
    $_SESSION['utilisateur_email']  = $row['email'];
    $_SESSION['utilisateur_nom']    = $row['nom'];
    $_SESSION['utilisateur_prenom'] = $row['prenom'];
    $_SESSION['utilisateur_role']   = $row['status'];

    ob_end_clean();
    echo json_encode([
        'success' => true,
        'role'    => $row['status'],   // 'Chercheur' ou 'Proposeur'
        'prenom'  => $row['prenom'],
    ]);

} catch (PDOException $e) {
    ob_end_clean();
    echo json_encode(['success' => false, 'message' => 'Erreur BDD : ' . $e->getMessage()]);
}
?>