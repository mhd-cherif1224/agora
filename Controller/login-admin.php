<?php
session_start();

require_once '../model/database.php';
require_once '../model/admin.php';

$email         = $_POST['email']    ?? '';
$inputPassword = $_POST['password'] ?? '';

// 1. Connexion BDD
$pdo = Database::getConnection();

// 2. Chercher l'admin par email
$stmt = $pdo->prepare("SELECT * FROM admin WHERE Email = :email LIMIT 1");
$stmt->execute([':email' => $email]);
$row = $stmt->fetch();

// 3. Vérifications
if (!$row || !password_verify($inputPassword, $row['Password_hash'])) {
    header('Location: view/html/login-admin.html?error=1');

    exit();
}

// 4. Créer l'objet Admin
$admin = new Admin($row['Email'], $inputPassword);
$admin->setIdAdmin($row['Id_admin']);
$admin->setUserName($row['UserName']);

// 5. Stocker en session
$_SESSION['admin_id']       = $admin->getIdAdmin();
$_SESSION['admin_email']    = $admin->getEmail();
$_SESSION['admin_username'] = $admin->getUserName();

// 6. Rediriger vers le dashboard
header('Location: view/html/dashboard.php');

exit();
?>

