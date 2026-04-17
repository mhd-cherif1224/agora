<?php
/* ══════════════════════════════════════════
   SAVESTEP.PHP
   Sauvegarde les étapes intermédiaires
   du formulaire d'inscription en session.
══════════════════════════════════════════ */
ob_start();
require_once __DIR__ . '/session-config.php';

$raw    = file_get_contents('php://input');
$body   = json_decode($raw, true);
$action = $body['action'] ?? '';

switch ($action) {

    // ── Étape 1 : choix du rôle ──────────────────────────────
    case 'save_role':
        // BUG CORRIGÉ : on lit 'role' (pas 'status')
        $role = trim($body['role'] ?? '');

        // BUG CORRIGÉ : valeurs en majuscule pour correspondre à l'enum BDD
        $role = ucfirst(strtolower($role));
            if (!in_array($role, ['Chercheur', 'Proposeur'])) {
            ob_end_clean();
            echo json_encode(['success' => false, 'message' => 'Rôle invalide : ' . $role]);
            exit;
        }
        $_SESSION['signup_role'] = $role;
        ob_end_clean();
        echo json_encode(['success' => true]);
        break;

    // ── Étape 2 : formulaire nom/prénom/sexe/date ────────────
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

        // BUG CORRIGÉ : accepte M/F (déjà converti côté JS)
        if (!in_array($sexe, ['M', 'F'])) {
            ob_end_clean();
            echo json_encode(['success' => false, 'message' => 'Sexe invalide.']);
            exit;
        }

        $_SESSION['signup_nom']            = $nom;
        $_SESSION['signup_prenom']         = $prenom;
        $_SESSION['signup_sexe']           = $sexe;
        $_SESSION['signup_date_naissance'] = $dateNaissance;

        ob_end_clean();
        echo json_encode(['success' => true]);
        break;

    // ── DEBUG : état de la session ───────────────────────────
    case 'debug':
        ob_end_clean();
        echo json_encode(['session' => $_SESSION]);
        break;

    default:
        ob_end_clean();
        echo json_encode(['success' => false, 'message' => 'Action inconnue : ' . $action]);
        break;
}
?>