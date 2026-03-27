<?php
// Démarre la session pour vérifier que l'utilisateur est connecté
session_start();

// Vérifie que c'est bien un super_admin qui fait la requête
// Si quelqu'un essaie d'accéder directement à ce fichier sans être connecté
if (!isset($_SESSION['admin_id']) || $_SESSION['admin_role'] !== 'super_admin') {
    echo json_encode(['success' => false, 'message' => 'Accès refusé']);
    exit();
}

// Importe les fichiers nécessaires
require_once '../model/Database.php';
require_once '../model/Admin.php';

// Récupère les données JSON envoyées par fetch() dans le JS
// file_get_contents('php://input') = lit le corps de la requête POST
$data = json_decode(file_get_contents('php://input'), true);

// Récupère l'action demandée : 'lister', 'ajouter', 'modifier', 'supprimer'
$action = $data['action'] ?? '';

// Connexion à la base de données
$pdo = Database::getConnection();

// ============================================================
// Redirige vers la bonne fonction selon l'action demandée
// ============================================================
switch ($action) {

    case 'lister':
        listerAdmins($pdo);
        break;

    case 'ajouter':
        ajouterAdmin($pdo, $data);
        break;

    case 'modifier':
        modifierAdmin($pdo, $data);
        break;

    case 'supprimer':
        supprimerAdmin($pdo, $data);
        break;

    default:
        echo json_encode(['success' => false, 'message' => 'Action inconnue']);
        break;
}


// ============================================================
// LISTER — Récupère tous les admins depuis la BDD
// ============================================================
function listerAdmins($pdo) {

    // Sélectionne tout sauf le mot de passe — on ne l'envoie jamais au JS !
    $stmt = $pdo->prepare("SELECT ID, nom, prenom, DateDeNaissance, email, numTel, role FROM Admin");
    $stmt->execute();
    $admins = $stmt->fetchAll();

    // Retourne les données en JSON vers le JS
    echo json_encode(['success' => true, 'admins' => $admins]);
}


// ============================================================
// AJOUTER — Insère un nouvel admin dans la BDD
// ============================================================
function ajouterAdmin($pdo, $data) {

    // Récupère et nettoie les données reçues du JS
    $nom      = trim($data['nom']      ?? '');
    $prenom   = trim($data['prenom']   ?? '');
    $date     = trim($data['date']     ?? '');
    $email    = trim($data['email']    ?? '');
    $tel      = trim($data['tel']      ?? '') ?: null; // null si vide
    $password = trim($data['password'] ?? '');
    $role     = trim($data['role']     ?? 'admin');

    // Vérifie que les champs obligatoires ne sont pas vides
    if (empty($nom) || empty($prenom) || empty($date) || empty($email) || empty($password)) {
        echo json_encode(['success' => false, 'message' => 'Champs obligatoires manquants']);
        return;
    }

    // Vérifie que le rôle est valide
    if (!in_array($role, ['admin', 'super_admin'])) {
        echo json_encode(['success' => false, 'message' => 'Rôle invalide']);
        return;
    }

    // Vérifie que l'email n'existe pas déjà dans la BDD
    $check = $pdo->prepare("SELECT ID FROM Admin WHERE email = :email");
    $check->execute([':email' => $email]);
    if ($check->fetch()) {
        echo json_encode(['success' => false, 'message' => 'Email déjà utilisé']);
        return;
    }

    // Hache le mot de passe avant de le stocker
    $hash = password_hash($password, PASSWORD_BCRYPT);

    // Insère le nouvel admin dans la BDD
    $stmt = $pdo->prepare("
        INSERT INTO Admin (nom, prenom, DateDeNaissance, email, numTel, MotDePass, role)
        VALUES (:nom, :prenom, :date, :email, :tel, :hash, :role)
    ");

    $stmt->execute([
        ':nom'    => $nom,
        ':prenom' => $prenom,
        ':date'   => $date,
        ':email'  => $email,
        ':tel'    => $tel,
        ':hash'   => $hash,
        ':role'   => $role
    ]);

    // Récupère l'ID auto-généré par MySQL pour l'envoyer au JS
    $newId = $pdo->lastInsertId();

    echo json_encode(['success' => true, 'id' => $newId]);
}


// ============================================================
// MODIFIER — Met à jour un admin existant dans la BDD
// ============================================================
function modifierAdmin($pdo, $data) {

    $id       = intval($data['id']     ?? 0);
    $nom      = trim($data['nom']      ?? '');
    $prenom   = trim($data['prenom']   ?? '');
    $date     = trim($data['date']     ?? '');
    $email    = trim($data['email']    ?? '');
    $tel      = trim($data['tel']      ?? '') ?: null;
    $password = trim($data['password'] ?? '');
    $role     = trim($data['role']     ?? 'admin');

    // Vérifie que l'ID est valide
    if ($id <= 0) {
        echo json_encode(['success' => false, 'message' => 'ID invalide']);
        return;
    }

    // Vérifie les champs obligatoires
    if (empty($nom) || empty($prenom) || empty($date) || empty($email) || empty($role)) {
        echo json_encode(['success' => false, 'message' => 'Champs obligatoires manquants']);
        return;
    }

    // Vérifie que l'email n'est pas déjà utilisé par un AUTRE admin
    $check = $pdo->prepare("SELECT ID FROM Admin WHERE email = :email AND ID != :id");
    $check->execute([':email' => $email, ':id' => $id]);
    if ($check->fetch()) {
        echo json_encode(['success' => false, 'message' => 'Email déjà utilisé par un autre admin']);
        return;
    }

    // Si un nouveau mot de passe est fourni → on le hache et on le met à jour
    // Si le champ mot de passe est vide → on garde l'ancien mot de passe
    if (!empty($password)) {
        $hash = password_hash($password, PASSWORD_BCRYPT);
        $stmt = $pdo->prepare("
            UPDATE Admin 
            SET nom=:nom, prenom=:prenom, DateDeNaissance=:date,
                email=:email, numTel=:tel, MotDePass=:hash, role=:role
            WHERE ID=:id
        ");
        $stmt->execute([
            ':nom'    => $nom,
            ':prenom' => $prenom,
            ':date'   => $date,
            ':email'  => $email,
            ':tel'    => $tel,
            ':hash'   => $hash,
            ':role'   => $role,
            ':id'     => $id
        ]);
    } else {
        // Sans mot de passe → on ne touche pas à MotDePass
        $stmt = $pdo->prepare("
            UPDATE Admin 
            SET nom=:nom, prenom=:prenom, DateDeNaissance=:date,
                email=:email, numTel=:tel, role=:role
            WHERE ID=:id
        ");
        $stmt->execute([
            ':nom'    => $nom,
            ':prenom' => $prenom,
            ':date'   => $date,
            ':email'  => $email,
            ':tel'    => $tel,
            ':role'   => $role,
            ':id'     => $id
        ]);
    }

    echo json_encode(['success' => true]);
}


// ============================================================
// SUPPRIMER — Supprime un admin de la BDD
// ============================================================
function supprimerAdmin($pdo, $data) {

    $id = intval($data['id'] ?? 0);

    // Vérifie que l'ID est valide
    if ($id <= 0) {
        echo json_encode(['success' => false, 'message' => 'ID invalide']);
        return;
    }

    // Empêche le super_admin de se supprimer lui-même !
    if ($id === (int)$_SESSION['admin_id']) {
        echo json_encode(['success' => false, 'message' => 'Vous ne pouvez pas vous supprimer vous-même !']);
        return;
    }

    // Supprime l'admin de la BDD
    $stmt = $pdo->prepare("DELETE FROM Admin WHERE ID = :id");
    $stmt->execute([':id' => $id]);

    echo json_encode(['success' => true]);
}
?>