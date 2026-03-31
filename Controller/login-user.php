<?php
session_start();

require_once '../model/Database.php';
require_once '../model/User.php';

$email          = trim($_POST['email']    ?? '');
$motDePassSaisi = trim($_POST['password'] ?? '');

if (empty($email) || empty($motDePassSaisi)) {
    header('Location: ../view/html/login-user.html?error=champs_vides');
    exit();
}

$pdo = Database::getConnection();

$stmt = $pdo->prepare("SELECT * FROM Utilisateur WHERE email = :email LIMIT 1");
$stmt->execute([':email' => $email]);
$row = $stmt->fetch();

if (!$row) {
    header('Location: ../view/html/login-user.html?error=introuvable');
    exit();
}

$utilisateur = Utilisateur::fromBDD($row);

if (!$utilisateur->verifierMotDePasse($motDePassSaisi)) {
    header('Location: ../view/html/login-user.html?error=mot_de_passe');
    exit();
}

$_SESSION['utilisateur_id']     = $utilisateur->getId();
$_SESSION['utilisateur_email']  = $utilisateur->getEmail();
$_SESSION['utilisateur_nom']    = $utilisateur->getNom();
$_SESSION['utilisateur_prenom'] = $utilisateur->getPrenom();

header('Location: ../view/html/session-bridge.php');
exit();
?>