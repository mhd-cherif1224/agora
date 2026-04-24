<?php
// Démarre la session pour accéder aux données du login
session_start();

// Si l'admin n'est pas connecté → retour au login
if (!isset($_SESSION['admin_id'])) {
    header('Location: login-admin.html');
    exit();
}

// Récupère les données depuis la session PHP (côté serveur)
$id     = $_SESSION['admin_id'];
$role   = $_SESSION['admin_role'];
$email  = $_SESSION['admin_email'];
$nom    = $_SESSION['admin_nom'];
$prenom = $_SESSION['admin_prenom'];
?>
<!DOCTYPE html>
<html>
<head></head>
<body>
<script>
    // Écrit dans localStorage SEULEMENT après vérification PHP
    localStorage.setItem("admin_id", "<?= htmlspecialchars($id) ?>");
    localStorage.setItem("role",   "<?= htmlspecialchars($role) ?>");
    localStorage.setItem("email",  "<?= htmlspecialchars($email) ?>");
    localStorage.setItem("nom",    "<?= htmlspecialchars($nom) ?>");
    localStorage.setItem("prenom", "<?= htmlspecialchars($prenom) ?>");

    // Redirige vers la page HTML — sans la modifier !
    window.location.href = "home-page-admin.html";
</script>
</body>
</html>