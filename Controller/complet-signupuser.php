<?php
/* ══════════════════════════════════════════
   COMPLET-SIGNUPUSER.PHP
   — Dernière étape : INSERT de l'utilisateur
     en BDD depuis les données en session.
   — À appeler depuis la dernière page du
     formulaire d'inscription (photo-profil
     ou équivalent).
══════════════════════════════════════════ */

ob_start();
require_once __DIR__ . '/session-config.php';

require_once '../model/Database.php';
require_once '../model/user.php';

// ── Vérifier que toutes les données sont en session ──
$required = [
    'signup_email',
    'signup_password',
    'signup_role',
    'signup_nom',
    'signup_prenom',
    'signup_sexe',
    'signup_date_naissance'
];

foreach ($required as $key) {
    if (empty($_SESSION[$key])) {
        ob_end_clean();
        echo json_encode([
            'success' => false,
            'message' => 'Session incomplète (' . $key . '). Recommencez l\'inscription.'
        ]);
        exit;
    }
}

// ── Récupérer les données depuis la session ──
$email    = $_SESSION['signup_email'];
$password = $_SESSION['signup_password'];  // déjà hashé en bcrypt
$role     = $_SESSION['signup_role'];
$nom      = $_SESSION['signup_nom'];
$prenom   = $_SESSION['signup_prenom'];
$sexe     = $_SESSION['signup_sexe'];
$dateRaw  = $_SESSION['signup_date_naissance']; // format DD/MM/YYYY

// ── Convertir DD/MM/YYYY → YYYY-MM-DD pour MySQL ──
$parts = explode('/', $dateRaw);
if (count($parts) !== 3) {
    ob_end_clean();
    echo json_encode(['success' => false, 'message' => 'Format de date invalide : ' . $dateRaw]);
    exit;
}
$dateNaissance = $parts[2] . '-' . $parts[1] . '-' . $parts[0]; // YYYY-MM-DD

try {
    $pdo = Database::getConnection();

    // ── Double vérification : email déjà utilisé ? ──
    $stmt = $pdo->prepare("SELECT ID FROM utilisateur WHERE email = :email LIMIT 1");
    $stmt->execute([':email' => $email]);
    if ($stmt->fetch()) {
        ob_end_clean();
        echo json_encode(['success' => false, 'message' => 'Cet email est déjà utilisé.']);
        exit;
    }

    // ── INSERT dans la BDD ──
    $stmt = $pdo->prepare("
        INSERT INTO utilisateur (nom, prenom, DateDeNaissance, email, MotDePass, sexe, status)
        VALUES (:nom, :prenom, :date, :email, :password, :sexe, :role)
    ");
    $stmt->execute([
        ':nom'      => $nom,
        ':prenom'   => $prenom,
        ':date'     => $dateNaissance,
        ':email'    => $email,
        ':password' => $password,
        ':sexe'     => $sexe,
        ':role'     => $role,
    ]);

    $newId = $pdo->lastInsertId();

    // ── Nettoyer la session d'inscription ──
    foreach ($required as $key) {
        unset($_SESSION[$key]);
    }

    ob_end_clean();
    echo json_encode(['success' => true, 'id' => $newId]);

} catch (PDOException $e) {
    ob_end_clean();
    echo json_encode(['success' => false, 'message' => 'Erreur BDD : ' . $e->getMessage()]);
}
?>