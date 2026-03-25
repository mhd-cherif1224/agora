<?php
session_start();

require_once '../model/Database.php';
require_once '../model/Admin.php';

// 1. Récupérer les données du formulaire
$email         = trim($_POST['email']    ?? '');
$motDePassSaisi = trim($_POST['password'] ?? '');

// 2. Validation basique — champs vides
if (empty($email) || empty($motDePassSaisi)) {
    header('Location: ../view/html/login-admin.html?error=champs_vides');
    exit();
}

// 3. Connexion BDD
$pdo = Database::getConnection();

// 4. Chercher l'admin par email
$stmt = $pdo->prepare("SELECT * FROM Admin WHERE email = :email LIMIT 1");
$stmt->execute([':email' => $email]);
$row = $stmt->fetch();

// 5. Vérifier si l'admin existe
if (!$row) {
    header('Location: ../view/html/login-admin.html?error=introuvable');
    exit();
}

// 6. Construire l'objet Admin depuis la BDD
$admin = Admin::fromBDD($row);

// 7. Vérifier le mot de passe
if (!$admin->verifierMotDePasse($motDePassSaisi)) {
    header('Location: ../view/html/login-admin.html?error=mot_de_passe');
    exit();
}

// 8. Stocker les infos en SESSION (jamais en localStorage !)
$_SESSION['admin_id']     = $admin->getId();
$_SESSION['admin_email']  = $admin->getEmail();
$_SESSION['admin_nom']    = $admin->getNom();
$_SESSION['admin_prenom'] = $admin->getPrenom();
$_SESSION['admin_role']   = $admin->getRole();

// 9. Rediriger selon le rôle
if ($admin->estSuperAdmin()) {
    header('Location: ../view/html/home-page-admin.html');
} else {
    header('Location: ../view/html/home-page-admin.html');
}
exit();
?>