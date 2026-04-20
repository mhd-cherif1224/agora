<?php
session_start();

require_once '../model/Database.php';
require_once '../model/user.php';   // ← minuscule, comme votre fichier réel

header('Content-Type: application/json; charset=utf-8');

$email          = trim($_POST['email']    ?? '');
$motDePassSaisi = trim($_POST['password'] ?? '');

// ── Champs vides ──
if (empty($email) || empty($motDePassSaisi)) {
    ob_end_clean();
    header('Location: ../view/html/login-user.html?error=champs_vides');
    exit();
}

// ── Connexion BDD ──
$pdo = Database::getConnection();

$stmt = $pdo->prepare("SELECT * FROM utilisateur WHERE email = :email LIMIT 1");
$stmt->execute([':email' => $email]);
$row = $stmt->fetch(PDO::FETCH_ASSOC);

// ── Utilisateur introuvable ──
if (!$row) {
    ob_end_clean();
    header('Location: ../view/html/login-user.html?error=introuvable');
    exit();
}

// ── Construire l'objet Utilisateur depuis la BDD ──
$utilisateur = Utilisateur::fromBDD($row);

// ── Mauvais mot de passe ──
if (!$utilisateur->verifierMotDePasse($motDePassSaisi)) {
    ob_end_clean();
    header('Location: ../view/html/login-user.html?error=mot_de_passe');
    exit();
}

// ── Succès : stocker la session ──
$_SESSION['utilisateur_id']     = $utilisateur->getId();
$_SESSION['utilisateur_email']  = $utilisateur->getEmail();
$_SESSION['utilisateur_nom']    = $utilisateur->getNom();
$_SESSION['utilisateur_prenom'] = $utilisateur->getPrenom();
$_SESSION['utilisateur_role']   = $utilisateur->getRole();   // status (Chercheur/Proposeur)

ob_end_clean();
header('Location: ../view/html/landing-page.html');
exit();
?>
