<?php
// Démarre la session pour vérifier que l'utilisateur est connecté
session_start();

// Vérifie que l'admin est bien connecté
if (!isset($_SESSION['admin_id'])) {
    echo json_encode(['success' => false, 'message' => 'Accès refusé']);
    exit();
}

// Importe les fichiers nécessaires
require_once '../model/Database.php';
require_once '../model/User.php';  

// Récupère les données JSON envoyées par fetch() dans le JS
$data = json_decode(file_get_contents('php://input'), true);

// Récupère l'action demandée : 'lister', 'modifier', 'supprimer'
$action = $data['action'] ?? '';

// Connexion à la base de données
$pdo = Database::getConnection();

// Redirige vers la bonne fonction selon l'action demandée
switch ($action) {

    case 'lister':
        listerUser($pdo);
        break;

    case 'modifier':
        modifierUser($pdo, $data);
        break;

    case 'supprimer':
        supprimerUser($pdo, $data);
        break;

    default:
        echo json_encode(['success' => false, 'message' => 'Action inconnue']);
        break;

} 

// ============================================================
// LISTER — Récupère tous les utilisateurs depuis la BDD
// ============================================================
function listerUser($pdo) {

    $stmt = $pdo->prepare("
        SELECT ID, nom, prenom, DateDeNaissance, sexe, email, NumTel, niveau, specialite, local, statut
        FROM Utilisateur 
        ORDER BY ID ASC
    "); 
    $stmt->execute();
    $utilisateurs = $stmt->fetchAll();

    echo json_encode(['success' => true, 'utilisateurs' => $utilisateurs]);
}


// ============================================================
// MODIFIER — Met à jour un utilisateur existant dans la BDD
// ============================================================
function modifierUser($pdo, $data) {

    $id         = intval($data['id']       ?? 0);
    $nom        = trim($data['nom']        ?? '');
    $prenom     = trim($data['prenom']     ?? '');
    $date       = trim($data['date']       ?? '');
    $sexe       = trim($data['sexe']       ?? '');
    $email      = trim($data['email']      ?? '');
    $tel        = trim($data['tel']        ?? '') ?: null;
    $niveau     = trim($data['niveau']     ?? '') ?: null;
    $specialite = trim($data['specialite'] ?? '') ?: null;
    $specialite = trim($data['local'] ?? '') ?: null;
    $specialite = trim($data['satut'] ?? '') ?: null;

    // Vérifie que l'ID est valide
    if ($id <= 0) {
        echo json_encode(['success' => false, 'message' => 'ID invalide']);
        return;
    }

    // Vérifie les champs obligatoires
    if (empty($nom) || empty($prenom) || empty($date) || empty($email) || empty($sexe)) {
        echo json_encode(['success' => false, 'message' => 'Champs obligatoires manquants']);
        return;
    }

    // Vérifie que l'email n'est pas déjà utilisé par un AUTRE utilisateur
    $check = $pdo->prepare("SELECT ID FROM Utilisateur WHERE email = :email AND ID != :id");
    $check->execute([':email' => $email, ':id' => $id]);
    if ($check->fetch()) {
        echo json_encode(['success' => false, 'message' => 'Email déjà utilisé par un autre utilisateur']);
        return;
    }

    $stmt = $pdo->prepare("
        UPDATE Utilisateur 
        SET nom=:nom, prenom=:prenom, DateDeNaissance=:date, sexe=:sexe,
            email=:email, NumTel=:tel, niveau=:niveau, specialite=:specialite, local=:local, statut:=statut
        WHERE ID=:id
    "); 

    $stmt->execute([
        ':nom'        => $nom,
        ':prenom'     => $prenom,
        ':date'       => $date,
        ':sexe'       => $sexe,
        ':email'      => $email,
        ':tel'        => $tel,
        ':niveau'     => $niveau,
        ':specialite' => $specialite,
        ':local'      => $local,
        ':statut'     => $statut,
        ':id'         => $id
    ]);

    echo json_encode(['success' => true, 'message' => 'Utilisateur modifié avec succès']);
}


// ============================================================
// SUPPRIMER — Supprime un utilisateur de la BDD
// ============================================================
function supprimerUser($pdo, $data) {

    $id = intval($data['id'] ?? 0);

    // Vérifie que l'ID est valide
    if ($id <= 0) {
        echo json_encode(['success' => false, 'message' => 'ID invalide']);
        return;
    }

    // Supprime l'utilisateur de la BDD
    $stmt = $pdo->prepare("DELETE FROM Utilisateur WHERE ID = :id");
    $stmt->execute([':id' => $id]);

    echo json_encode(['success' => true, 'message' => 'Utilisateur supprimé avec succès']);
}
?>