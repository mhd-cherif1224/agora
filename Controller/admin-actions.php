<?php
session_start();

if (!isset($_SESSION['admin_id']) || $_SESSION['admin_role'] !== 'super_admin') {
    echo json_encode(['success' => false, 'message' => 'Accès refusé']);
    exit();
}

require_once '../model/Database.php';
require_once '../model/Admin.php';

$data   = json_decode(file_get_contents('php://input'), true);
$action = $data['action'] ?? '';
$pdo    = Database::getConnection();

switch ($action) {

    // ========================================================
    // LISTER
    // ========================================================
    case 'lister':
        try {
            $stmt   = $pdo->query("SELECT * FROM Admin ORDER BY ID ASC");
            $admins = $stmt->fetchAll();
            echo json_encode(['success' => true, 'admins' => $admins]);
        } catch (PDOException $e) {
            echo json_encode(['success' => false, 'message' => 'Erreur BDD : ' . $e->getMessage()]);
        }
        break;

    // ========================================================
    // AJOUTER
    // ========================================================
    case 'ajouter':
        $nom      = trim($data['nom']      ?? '');
        $prenom   = trim($data['prenom']   ?? '');
        $date     = trim($data['date']     ?? '');
        $sexe     = trim($data['sexe']     ?? '');
        $email    = trim($data['email']    ?? '');
        $tel      = trim($data['tel']      ?? '');
        $password = trim($data['password'] ?? '');
        $role     = trim($data['role']     ?? 'admin');

        if (empty($nom) || empty($prenom) || empty($date) || empty($email) || empty($password)) {
            echo json_encode(['success' => false, 'message' => 'Champs obligatoires manquants']);
            exit();
        }

        if (!in_array($role, ['admin', 'super_admin'])) {
            echo json_encode(['success' => false, 'message' => 'Rôle invalide']);
            exit();
        }

        $hash = password_hash($password, PASSWORD_BCRYPT);

        try {
            $stmt = $pdo->prepare("
                INSERT INTO Admin (nom, prenom, DateDeNaissance, sexe, email, numTel, MotDePass, role)
                VALUES (:nom, :prenom, :date, :sexe, :email, :tel, :password, :role)
            ");
            $stmt->execute([
                ':nom'      => $nom,
                ':prenom'   => $prenom,
                ':date'     => $date,
                ':sexe'     => $sexe,
                ':email'    => $email,
                ':tel'      => $tel ?: null,
                ':password' => $hash,
                ':role'     => $role
            ]);
            echo json_encode(['success' => true, 'id' => $pdo->lastInsertId(), 'message' => 'Admin ajouté avec succès']);
        } catch (PDOException $e) {
            if ($e->getCode() === '23000') {
                echo json_encode(['success' => false, 'message' => 'Cet email existe déjà en base de données']);
            } else {
                echo json_encode(['success' => false, 'message' => 'Erreur BDD : ' . $e->getMessage()]);
            }
        }
        break;

    // ========================================================
    // MODIFIER
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

        if ($id <= 0) {
            echo json_encode(['success' => false, 'message' => 'ID invalide']);
            exit();
        }

        if (empty($nom) || empty($prenom) || empty($date) || empty($email)) {
            echo json_encode(['success' => false, 'message' => 'Champs obligatoires manquants']);
            exit();
        }

        if (!in_array($role, ['admin', 'super_admin'])) {
            echo json_encode(['success' => false, 'message' => 'Rôle invalide']);
            exit();
        }

        try {
            if (!empty($password)) {
                $hash = password_hash($password, PASSWORD_BCRYPT);
                $stmt = $pdo->prepare("
                    UPDATE Admin
                    SET nom = :nom, prenom = :prenom, DateDeNaissance = :date,
                        sexe = :sexe, email = :email, numTel = :tel, MotDePass = :password, role = :role
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
                $stmt = $pdo->prepare("
                    UPDATE Admin
                    SET nom = :nom, prenom = :prenom, DateDeNaissance = :date,
                        sexe = :sexe, email = :email, numTel = :tel, role = :role
                    WHERE ID = :id
                ");
                $stmt->execute([
                    ':nom'    => $nom,
                    ':prenom' => $prenom,
                    ':date'   => $date,
                    ':sexe'   => $sexe,
                    ':email'  => $email,
                    ':tel'    => $tel ?: null,
                    ':role'   => $role,
                    ':id'     => $id
                ]);
            }
            echo json_encode(['success' => true, 'message' => 'Admin modifié avec succès']);
        } catch (PDOException $e) {
            if ($e->getCode() === '23000') {
                echo json_encode(['success' => false, 'message' => 'Cet email est déjà utilisé par un autre admin']);
            } else {
                echo json_encode(['success' => false, 'message' => 'Erreur BDD : ' . $e->getMessage()]);
            }
        }
        break;

    // ========================================================
    // SUPPRIMER
    // ========================================================
    case 'supprimer':
        $id = intval($data['id'] ?? 0);

        if ($id <= 0) {
            echo json_encode(['success' => false, 'message' => 'ID invalide']);
            exit();
        }

        if ($id === $_SESSION['admin_id']) {
            echo json_encode(['success' => false, 'message' => 'Vous ne pouvez pas vous supprimer vous-même !']);
            exit();
        }

        try {
            $stmt = $pdo->prepare("DELETE FROM Admin WHERE ID = :id");
            $stmt->execute([':id' => $id]);
            echo json_encode(['success' => true, 'message' => 'Admin supprimé avec succès']);
        } catch (PDOException $e) {
            echo json_encode(['success' => false, 'message' => 'Erreur BDD : ' . $e->getMessage()]);
        }
        break;

    // ========================================================
    // ACTION INCONNUE
    // ========================================================
    default:
        echo json_encode(['success' => false, 'message' => 'Action inconnue']);
        break;
}
?>