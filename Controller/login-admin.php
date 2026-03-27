<?php
session_start();

require_once '../model/Database.php';
require_once '../model/Admin.php';

$email          = trim($_POST['email']    ?? '');
$motDePassSaisi = trim($_POST['password'] ?? '');

if (empty($email) || empty($motDePassSaisi)) {
    header('Location: ../view/html/login-admin.html?error=champs_vides');
    exit();
}

$pdo = Database::getConnection();

$stmt = $pdo->prepare("SELECT * FROM Admin WHERE email = :email LIMIT 1");
$stmt->execute([':email' => $email]);
$row = $stmt->fetch();

if (!$row) {
    header('Location: ../view/html/login-admin.html?error=introuvable');
    exit();
}

$admin = Admin::fromBDD($row);

if (!$admin->verifierMotDePasse($motDePassSaisi)) {
    header('Location: ../view/html/login-admin.html?error=mot_de_passe');
    exit();
}

$_SESSION['admin_id']     = $admin->getId();
$_SESSION['admin_email']  = $admin->getEmail();
$_SESSION['admin_nom']    = $admin->getNom();
$_SESSION['admin_prenom'] = $admin->getPrenom();
$_SESSION['admin_role']   = $admin->getRole();

// ✅ Redirige vers session-bridge.php au lieu de home-page-admin.html
header('Location: ../view/html/session-bridge.php');
exit();
?>