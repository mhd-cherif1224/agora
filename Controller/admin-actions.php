<?php
// Démarre la session pour vérifier que l'utilisateur est connecté
session_start();

// Vérifie que c'est bien un super_admin qui envoie les requêtes
// Si non → on bloque tout de suite
if (!isset($_SESSION['admin_id']) || $_SESSION['admin_role'] !== 'super_admin') {
    echo json_encode(['success' => false, 'message' => 'Accès refusé']);
    exit();
}

// Importe la connexion BDD et le modèle Admin
require_once '../model/Database.php';
require_once '../model/Admin.php';

// Récupère les données envoyées par fetch() en JSON
// file_get_contents('php://input') = lit le corps de la requête POST
$data = json_decode(file_get_contents('php://input'), true);

// Récupère l'action demandée : 'lister', 'ajouter', 'modifier', 'supprimer'
$action = $data['action'] ?? '';

// Connexion à la base de données
$pdo = Database::getConnection();

// ============================================================
// SWITCH — exécute l'action demandée
// ============================================================
switch ($action) {

    // ========================================================
    // LISTER — charge tous les admins depuis la BDD
    // ========================================================
    case 'lister':

        $stmt = $pdo->query("SELECT * FROM Admin ORDER BY ID ASC");
        $admins = $stmt->fetchAll();

        // Retourne la liste en JSON vers le JS
        echo json_encode([
            'success' => true,
            'admins'  => $admins
        ]);
        break;

    // ========================================================
    // AJOUTER — insère un nouvel admin dans la BDD
    // ========================================================
    case 'ajouter':

        // Récupère et nettoie les données envoyées par le JS
        $nom      = trim($data['nom']      ?? '');
        $prenom   = trim($data['prenom']   ?? '');
        $date     = trim($data['date']     ?? '');
        $sexe     = trim($data['sexe']     ?? '');
        $email    = trim($data['email']    ?? '');
        $tel      = trim($data['tel']      ?? '');
        $password = trim($data['password'] ?? '');
        $role     = trim($data['role']     ?? 'admin');

        // Vérifie que les champs obligatoires ne sont pas vides
        if(empty($nom) || empty($prenom) || empty($date) || empty($email) || empty($password)){
            echo json_encode(['success' => false, 'message' => 'Champs obligatoires manquants']);
            exit();
        }

        // Vérifie que le rôle est valide
        if(!in_array($role, ['admin', 'super_admin'])){
            echo json_encode(['success' => false, 'message' => 'Rôle invalide']);
            exit();
        }

        // Hache le mot de passe avant de l'insérer en BDD
        $hash = password_hash($password, PASSWORD_BCRYPT);

        // Insère le nouvel admin dans la BDD
        $stmt = $pdo->prepare("
            INSERT INTO Admin (nom, prenom, DateDeNaissance,sexe, email, numTel, MotDePass, role)
            VALUES (:nom, :prenom, :date, :sexe, :email, :tel, :password, :role)
        ");

        $stmt->execute([
            ':nom'      => $nom,
            ':prenom'   => $prenom,
            ':date'     => $date,
            ':sexe'     => $sexe,
            ':email'    => $email,
            ':tel'      => $tel ?: null,  // si vide → NULL en BDD
            ':password' => $hash,
            ':role'     => $role
        ]);

        // Récupère l'ID auto-généré par MySQL
        $newId = $pdo->lastInsertId();

        // Retourne le succès et le nouvel ID au JS
        echo json_encode([
            'success' => true,
            'id'      => $newId,
            'message' => 'Admin ajouté avec succès'
        ]);
        break;

    // ========================================================
    // MODIFIER — met à jour un admin existant
    // ========================================================
    case 'modifier':

        $id       = intval($data['id']       ?? 0);
        $nom      = trim($data['nom']        ?? '');
        $prenom   = trim($data['prenom']     ?? '');
        $date     = trim($data['date']       ?? '');
        $sexe     = trim($data['sexe']       ?? '');
        $email    = trim($data['email']      ?? '');
        $tel      = trim($data['tel']        ?? '');
        $password = trim($data['password']   ?? '');
        $role     = trim($data['role']       ?? 'admin');

        // Vérifie que l'ID est valide
        if($id <= 0){
            echo json_encode(['success' => false, 'message' => 'ID invalide']);
            exit();
        }

        // Vérifie les champs obligatoires
        if(empty($nom) || empty($prenom) || empty($date) || empty($email)){
            echo json_encode(['success' => false, 'message' => 'Champs obligatoires manquants']);
            exit();
        }

        // Vérifie que le rôle est valide
        if(!in_array($role, ['admin', 'super_admin'])){
            echo json_encode(['success' => false, 'message' => 'Rôle invalide']);
            exit();
        }

        // Si un nouveau mot de passe est fourni → on le hache et on le met à jour
        // Si le champ est vide → on garde l'ancien mot de passe en BDD
        if(!empty($password)){

            $hash = password_hash($password, PASSWORD_BCRYPT);

            $stmt = $pdo->prepare("
                UPDATE Admin
                SET nom = :nom, prenom = :prenom, DateDeNaissance = :date,
                  sexe=:sexe,  email = :email, numTel = :tel, MotDePass = :password, role = :role
                WHERE ID = :id
            ");

            $stmt->execute([
                ':nom'      => $nom,
                ':prenom'   => $prenom,
                ':date'     => $date,
                ':sexe'     => $sexe,
                ':email'    => $email,
                ':tel'      => $tel ?: null,
                ':password' => $hash,
                ':role'     => $role,
                ':id'       => $id
            ]);

        } else {

            // Pas de nouveau mot de passe → on ne touche pas à MotDePass
            $stmt = $pdo->prepare("
                UPDATE Admin
                SET nom = :nom, prenom = :prenom, DateDeNaissance = :date,
                   sexe=:sexe, email = :email, numTel = :tel, role = :role
                WHERE ID = :id
            ");

            $stmt->execute([
                ':nom'    => $nom,
                ':prenom' => $prenom,
                ':date'   => $date,
                ':sexe'     => $sexe,
                ':email'  => $email,
                ':tel'    => $tel ?: null,
                ':role'   => $role,
                ':id'     => $id
            ]);
        }

        echo json_encode([
            'success' => true,
            'message' => 'Admin modifié avec succès'
        ]);
        break;

    // ========================================================
    // SUPPRIMER — supprime un admin de la BDD
    // ========================================================
    case 'supprimer':

        $id = intval($data['id'] ?? 0);

        // Vérifie que l'ID est valide
        if($id <= 0){
            echo json_encode(['success' => false, 'message' => 'ID invalide']);
            exit();
        }

        // Empêche le super_admin de se supprimer lui-même !
        if($id === $_SESSION['admin_id']){
            echo json_encode(['success' => false, 'message' => 'Vous ne pouvez pas vous supprimer vous-même !']);
            exit();
        }

        $stmt = $pdo->prepare("DELETE FROM Admin WHERE ID = :id");
        $stmt->execute([':id' => $id]);

        echo json_encode([
            'success' => true,
            'message' => 'Admin supprimé avec succès'
        ]);
        break;

    // ========================================================
    // ACTION INCONNUE
    // ========================================================
    default:
        echo json_encode([
            'success' => false,
            'message' => 'Action inconnue'
        ]);
        break;
}
?>