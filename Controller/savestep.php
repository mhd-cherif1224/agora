<?php
ob_start();
require_once __DIR__ . '/session-config.php';

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Methods: POST, OPTIONS');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }

$raw    = file_get_contents('php://input');
$body   = json_decode($raw, true);
$action = $body['action'] ?? '';

switch ($action) {

    case 'save_role':
        $role = trim($body['role'] ?? '');
        if (!in_array($role, ['Chercheur', 'Proposeur'])) {
            ob_end_clean();
            echo json_encode(['success' => false, 'message' => 'Rôle invalide.']);
            exit;
        }
        $_SESSION['signup_role'] = $role;
        ob_end_clean();
        echo json_encode(['success' => true]);
        break;

    case 'save_formulaire':
        $nom           = trim($body['nom']            ?? '');
        $prenom        = trim($body['prenom']         ?? '');
        $sexe          = trim($body['sexe']           ?? '');
        $dateNaissance = trim($body['date_naissance'] ?? '');

        if (!$nom || !$prenom || !$sexe || !$dateNaissance) {
            ob_end_clean();
            echo json_encode(['success' => false, 'message' => 'Données incomplètes.']);
            exit;
        }

        $_SESSION['signup_nom']            = $nom;
        $_SESSION['signup_prenom']         = $prenom;
        $_SESSION['signup_sexe']           = $sexe;
        $_SESSION['signup_date_naissance'] = $dateNaissance;

        ob_end_clean();
        echo json_encode(['success' => true]);
        break;

    // ── DEBUG : voir l'état de la session ──
    case 'debug':
        ob_end_clean();
        echo json_encode(['session' => $_SESSION]);
        break;

    default:
        ob_end_clean();
        echo json_encode(['success' => false, 'message' => 'Action inconnue.']);
        break;
}
?>