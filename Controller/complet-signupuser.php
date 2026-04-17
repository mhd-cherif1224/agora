<?php
/* ══════════════════════════════════════════
   COMPLET-SIGNUPUSER.PHP
   — Dernière étape : INSERT de l'utilisateur
     en BDD depuis les données en session.
══════════════════════════════════════════ */

ob_start();
require_once __DIR__ . '/session-config.php';
require_once '../model/Database.php';
// ⚠️ SUPPRIMÉ : require_once '../model/user.php' — ce fichier n'existe pas

// ── Vérifier les données obligatoires en session ──
// signup_role est optionnel : si l'utilisateur a sauté l'étape,
// on met 'Chercheur' par défaut (modifiable selon votre logique métier)
$required = [
    'signup_email',
    'signup_password',
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
// Si le rôle a été sauté → 'Chercheur' par défaut
$role     = !empty($_SESSION['signup_role']) ? $_SESSION['signup_role'] : 'Chercheur';
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

// ── Gestion des photos uploadées ──
$photoProfilPath  = null;
$photoBannierePath = null;
$uploadDir = __DIR__ . '/../uploads/';

if (!is_dir($uploadDir)) {
    mkdir($uploadDir, 0755, true);
}

function saveUploadedFile($fileKey, $uploadDir, $prefix) {
    if (!isset($_FILES[$fileKey]) || $_FILES[$fileKey]['error'] !== UPLOAD_ERR_OK) {
        return null;
    }
    $ext      = 'jpg'; // on reçoit toujours du JPEG depuis le crop
    $filename = $prefix . '_' . time() . '_' . bin2hex(random_bytes(4)) . '.' . $ext;
    $dest     = $uploadDir . $filename;
    if (move_uploaded_file($_FILES[$fileKey]['tmp_name'], $dest)) {
        return 'uploads/' . $filename;
    }
    return null;
}

$photoProfilPath   = saveUploadedFile('photo_profil',   $uploadDir, 'profil');
$photoBannierePath = saveUploadedFile('photo_banniere', $uploadDir, 'banniere');

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
        INSERT INTO utilisateur
            (nom, prenom, DateDeNaissance, email, MotDePass, sexe, status, photo_profil, photo_banniere)
        VALUES
            (:nom, :prenom, :date, :email, :password, :sexe, :role, :photo_profil, :photo_banniere)
    ");
    $stmt->execute([
        ':nom'           => $nom,
        ':prenom'        => $prenom,
        ':date'          => $dateNaissance,
        ':email'         => $email,
        ':password'      => $password,
        ':sexe'          => $sexe,
        ':role'          => $role,
        ':photo_profil'  => $photoProfilPath,
        ':photo_banniere'=> $photoBannierePath,
    ]);

    $newId = $pdo->lastInsertId();

    // ── Nettoyer la session d'inscription ──
    $keysToClean = array_merge($required, ['signup_role']);
    foreach ($keysToClean as $key) {
        unset($_SESSION[$key]);
    }

    ob_end_clean();
    echo json_encode(['success' => true, 'id' => $newId]);

} catch (PDOException $e) {
    ob_end_clean();
    echo json_encode(['success' => false, 'message' => 'Erreur BDD : ' . $e->getMessage()]);
}