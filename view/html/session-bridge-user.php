<?php
session_start();

// Si l'admin n'est pas connecté → retour au login
if (!isset($_SESSION['utilisateur_id'])) {
    header('Location: login-user.html');
    exit();
}

// Récupère les données depuis la session PHP (côté serveur)
$id     = $_SESSION['utilisateur_id'];
$email  = $_SESSION['utilisateur_email'];
$nom    = $_SESSION['utilisateur_nom'];
$prenom = $_SESSION['utilisateur_prenom'];
?>
<!DOCTYPE html>
<html>
<head></head>
<body>
<script>
    // Écrit dans localStorage SEULEMENT après vérification PHP
    localStorage.setItem("utilisateur_id", "<?= htmlspecialchars($id) ?>");
    localStorage.setItem("email",  "<?= htmlspecialchars($email) ?>");
    localStorage.setItem("nom",    "<?= htmlspecialchars($nom) ?>");
    localStorage.setItem("prenom", "<?= htmlspecialchars($prenom) ?>");

    // Redirige vers la page HTML — sans la modifier !
    window.location.href = "landing-page.html";
</script>
</body>
</html>