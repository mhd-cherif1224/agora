<?php
// 1. Démarrer la session pour accéder aux données de l'admin
session_start();

// 2. Vérifier si l'admin est connecté
// Si la variable de session n'existe pas, on redirige vers le login
if (!isset($_SESSION['admin_id'])) {
    header('Location: login-admin.html');
    exit();
}

// 3. Récupérer les infos de l'admin pour les afficher
$username = $_SESSION['admin_username'];
$email    = $_SESSION['admin_email'];
?>

<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Dashboard Admin</title>
    <style>
        body { font-family: Arial, sans-serif; background-color: #f3f2ef; margin: 0; padding: 20px; }
        .dashboard-container { background: white; padding: 30px; border-radius: 15px; box-shadow: 0 4px 10px rgba(0,0,0,0.1); max-width: 800px; margin: auto; }
        h1 { color: #16376E; }
        .stats { display: flex; gap: 20px; margin-top: 20px; }
        .card { background: #eef3f8; padding: 20px; border-radius: 10px; flex: 1; text-align: center; }
        .logout-btn { display: inline-block; margin-top: 20px; padding: 10px 20px; background: #d32f2f; color: white; text-decoration: none; border-radius: 5px; }
        .logout-btn:hover { background: #b71c1c; }
    </style>
</head>
<body>

    <div class="dashboard-container">
        <h1>Tableau de Bord</h1>
        <p>Bienvenue, <strong><?php echo htmlspecialchars($username); ?></strong> !</p>
        <p>Email : <?php echo htmlspecialchars($email); ?></p>

        <hr>

        <div class="stats">
            <div class="card">
                <h3>Utilisateurs</h3>
                <p>124</p>
            </div>
            <div class="card">
                <h3>Services</h3>
                <p>12</p>
            </div>
            <div class="card">
                <h3>Demandes</h3>
                <p>5 nouvelles</p>
            </div>
        </div>

        <a href="../../Controller/logout.php" class="logout-btn">Se déconnecter</a>
    </div>

</body>
</html>