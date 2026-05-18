<?php
require_once __DIR__ . '/../Controller/session-config.php';

header('Content-Type: application/json; charset=utf-8');

/* ══ CONNEXION BDD ══ */
require_once __DIR__ . '/../Model/Database.php'; 
$pdo = Database::getConnection();

/* ══ PARAMÈTRES ══ */
$search  = isset($_GET['q'])      ? trim($_GET['q'])           : '';
$sort    = isset($_GET['sort'])   ? $_GET['sort']              : 'date'; // 'date' ou 'id'
$order   = isset($_GET['order'])  ? strtoupper($_GET['order']) : 'DESC';
$categorie = isset($_GET['categorie']) ? (int)$_GET['categorie'] : 0;

// Sécuriser l'ordre
if (!in_array($order, ['ASC', 'DESC'])) $order = 'DESC';
// Sécuriser le tri
if (!in_array($sort, ['date', 'id'])) $sort = 'date';

$like = '%' . $search . '%';

try {

    /* ══════════════════════════════════════
       1. RECHERCHE SERVICES
    ══════════════════════════════════════ */
    $sortColService = ($sort === 'id') ? 's.ID' : 's.DateDePublication';

    $sqlService = "
        SELECT
            s.ID,
            s.titre,
            s.description,
            s.DateDePublication,
            s.status,
            s.prix,
            s.Evaluation_Moyenne,
            u.ID          AS utilisateur_id,
            u.nom         AS utilisateur_nom,
            u.prenom      AS utilisateur_prenom,
            u.photo_profil,
            u.specialite,
            u.localisation,
            GROUP_CONCAT(DISTINCT c.titre ORDER BY c.titre SEPARATOR ', ') AS categories,
            MIN(p.photo_path) AS photo_service
        FROM service s
        INNER JOIN utilisateur u ON s.ID_Utilisateur = u.ID
        LEFT JOIN service_categorie sc ON sc.ID_Service = s.ID
        LEFT JOIN categorie c          ON c.ID = sc.ID_Categorie
        LEFT JOIN service_photos sp    ON sp.ID_Service = s.ID
        LEFT JOIN photos p             ON p.ID = sp.ID_Photos
        WHERE (
            s.titre       LIKE :like
            OR s.description LIKE :like2
            OR u.nom      LIKE :like3
            OR u.prenom   LIKE :like4
            OR c.titre    LIKE :like5
        )
    ";

    // Filtre catégorie optionnel
    if ($categorie > 0) {
        $sqlService .= " AND sc.ID_Categorie = :categorie ";
    }

    $sqlService .= "
        GROUP BY s.ID, u.ID
        ORDER BY {$sortColService} {$order}
    ";

    $stmtS = $pdo->prepare($sqlService);
    $stmtS->bindValue(':like',  $like);
    $stmtS->bindValue(':like2', $like);
    $stmtS->bindValue(':like3', $like);
    $stmtS->bindValue(':like4', $like);
    $stmtS->bindValue(':like5', $like);
    if ($categorie > 0) {
        $stmtS->bindValue(':categorie', $categorie, PDO::PARAM_INT);
    }
    $stmtS->execute();
    $services = $stmtS->fetchAll(PDO::FETCH_ASSOC);

    // Formatage des services
    foreach ($services as &$s) {
        $s['ID']               = (int)$s['ID'];
        $s['utilisateur_id']   = (int)$s['utilisateur_id'];
        $s['prix']             = (float)$s['prix'];
        $s['Evaluation_Moyenne'] = $s['Evaluation_Moyenne'] !== null ? (int)$s['Evaluation_Moyenne'] : null;
        $s['categories']       = $s['categories'] ? explode(', ', $s['categories']) : [];
    }
    unset($s);

    /* ══════════════════════════════════════
       2. RECHERCHE UTILISATEURS
    ══════════════════════════════════════ */
    $sortColUser = ($sort === 'id') ? 'u.ID' : 'u.ID'; // pas de date sur utilisateur → fallback ID

    $sqlUser = "
        SELECT
            u.ID,
            u.nom,
            u.prenom,
            u.sexe,
            u.email,
            u.niveau,
            u.specialite,
            u.localisation,
            u.status,
            u.photo_profil,
            u.photo_banniere,
            u.role,
            COUNT(DISTINCT s.ID)  AS nb_services,
            ROUND(AVG(e.note), 1) AS note_moyenne
        FROM utilisateur u
        LEFT JOIN service s    ON s.ID_Utilisateur = u.ID
        LEFT JOIN evaluation e ON e.ID_Utilisateur = u.ID
        WHERE (
            u.nom       LIKE :like
            OR u.prenom LIKE :like2
            OR u.email  LIKE :like3
            OR u.specialite LIKE :like4
            OR u.localisation LIKE :like5
        )
        GROUP BY u.ID
        ORDER BY {$sortColUser} {$order}
    ";

    $stmtU = $pdo->prepare($sqlUser);
    $stmtU->bindValue(':like',  $like);
    $stmtU->bindValue(':like2', $like);
    $stmtU->bindValue(':like3', $like);
    $stmtU->bindValue(':like4', $like);
    $stmtU->bindValue(':like5', $like);
    $stmtU->execute();
    $utilisateurs = $stmtU->fetchAll(PDO::FETCH_ASSOC);

    // Formatage des utilisateurs
    foreach ($utilisateurs as &$u) {
        $u['ID']           = (int)$u['ID'];
        $u['nb_services']  = (int)$u['nb_services'];
        $u['note_moyenne'] = $u['note_moyenne'] !== null ? (float)$u['note_moyenne'] : null;
        unset($u['email']); // ne pas exposer l'email dans les résultats publics
    }
    unset($u);

    /* ══════════════════════════════════════
       3. CATEGORIES (pour les filtres)
    ══════════════════════════════════════ */
    $cats = $pdo->query("SELECT ID, titre FROM categorie ORDER BY titre ASC")
                ->fetchAll(PDO::FETCH_ASSOC);
    foreach ($cats as &$c) $c['ID'] = (int)$c['ID'];
    unset($c);

    /* ══════════════════════════════════════
       4. RÉPONSE JSON
    ══════════════════════════════════════ */
    echo json_encode([
        'success'      => true,
        'query'        => $search,
        'sort'         => $sort,
        'order'        => $order,
        'categories'   => $cats,
        'results'      => [
            'services'     => $services,
            'utilisateurs' => $utilisateurs,
        ],
        'count' => [
            'services'     => count($services),
            'utilisateurs' => count($utilisateurs),
        ]
    ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Erreur BDD : ' . $e->getMessage()
    ]);
}
?>