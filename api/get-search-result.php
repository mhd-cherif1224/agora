<?php

require_once __DIR__ . '/../model/Database.php';

header('Content-Type: application/json');

try {

    $sort      = $_GET['sort']      ?? 'recent';
    $categorie = $_GET['categorie'] ?? null;
    $query     = $_GET['q']         ?? null;

    if (!$query || trim($query) === '') {
        echo json_encode([
            'success' => true,
            'count'   => ['services' => 0, 'utilisateurs' => 0],
            'results' => ['services' => [], 'utilisateurs' => []]
        ]);
        exit;
    }

    $keyword = trim($query);

    $orderBy = "s.DateDePublication DESC";
    if ($sort === "popular") {
        $orderBy = "nb_avis DESC, note_moyenne DESC";
    }

    $pdo = Database::getConnection();
    $pdo->exec("SET time_zone = '+00:00'");

    // ── SERVICES — filtrage par catégorie enregistrée uniquement ──
    $serviceParams = [':kw' => "%$keyword%"];

    $havingClause = "";
    if ($categorie) {
        $havingClause          = "HAVING categorie LIKE :cat";
        $serviceParams[':cat'] = "%$categorie%";
    }

    $stmtServices = $pdo->prepare("
        SELECT
            s.ID,
            s.titre,
            s.description,
            s.prix,
            s.status,
            s.DateDePublication,

            u.ID AS ID_Utilisateur,
            u.nom,
            u.prenom,
            u.photo_profil,
            u.specialite,
            u.niveau,

            GROUP_CONCAT(DISTINCT c.titre) AS categorie,

            p.photo_path AS service_photo,

            COALESCE(ROUND(AVG(e.note), 1), 0) AS note_moyenne,
            COUNT(DISTINCT e.ID)               AS nb_avis

        FROM service s

        INNER JOIN utilisateur u ON s.ID_Utilisateur = u.ID
        LEFT JOIN service_categorie sc ON s.ID = sc.ID_Service
        LEFT JOIN categorie c ON sc.ID_Categorie = c.ID
        LEFT JOIN evaluation e ON s.ID = e.ID_Service
        LEFT JOIN service_photos sp ON s.ID = sp.ID_Service
        LEFT JOIN photos p ON sp.ID_Photos = p.ID

        WHERE EXISTS (
            SELECT 1
            FROM service_categorie sc2
            INNER JOIN categorie c2 ON sc2.ID_Categorie = c2.ID
            WHERE sc2.ID_Service = s.ID
            AND c2.titre LIKE :kw
        )

        GROUP BY s.ID

        $havingClause

        ORDER BY $orderBy
    ");

    $stmtServices->execute($serviceParams);
    $services = $stmtServices->fetchAll(PDO::FETCH_ASSOC);

    // ── UTILISATEURS — recherche par nom / prénom / spécialité ──
    $stmtUsers = $pdo->prepare("
        SELECT
            ID,
            nom,
            prenom,
            photo_profil,
            specialite,
            niveau
        FROM utilisateur
        WHERE
            nom           LIKE :kw1
            OR prenom     LIKE :kw2
            OR specialite LIKE :kw3
            OR CONCAT(prenom, ' ', nom) LIKE :kw4
            OR CONCAT(nom, ' ', prenom) LIKE :kw5
        LIMIT 10
    ");

    $stmtUsers->execute([
        ':kw1' => "%$keyword%",
        ':kw2' => "%$keyword%",
        ':kw3' => "%$keyword%",
        ':kw4' => "%$keyword%",
        ':kw5' => "%$keyword%",
    ]);

    $utilisateurs = $stmtUsers->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        'success' => true,
        'query'   => $keyword,
        'count'   => [
            'services'     => count($services),
            'utilisateurs' => count($utilisateurs),
        ],
        'results' => [
            'services'     => $services,
            'utilisateurs' => $utilisateurs,
        ]
    ]);

} catch (PDOException $e) {

    http_response_code(500);

    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}