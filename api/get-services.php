<?php

require_once __DIR__ . '/../model/Database.php';

header('Content-Type: application/json');

try {

    $pdo = Database::getConnection();

    $stmt = $pdo->prepare("
    SELECT 
        s.ID,
        s.titre,
        s.description,
        s.prix,
        s.status,
        s.DateDePublication,

        u.nom,
        u.prenom,
        u.photo_profil,
        u.specialite,
        u.niveau,

        GROUP_CONCAT(DISTINCT c.titre) AS categorie,

        p.photo_path AS service_photo,

        COALESCE(ROUND(AVG(e.note), 1), 0) AS note_moyenne,
        COUNT(DISTINCT e.ID) AS nb_avis

    FROM service s

    INNER JOIN utilisateur u
        ON s.ID_Utilisateur = u.ID

    LEFT JOIN service_categorie sc
        ON s.ID = sc.ID_Service

    LEFT JOIN categorie c
        ON sc.ID_Categorie = c.ID

    LEFT JOIN evaluation e
        ON s.ID = e.ID_Service

    LEFT JOIN service_photos sp
        ON s.ID = sp.ID_Service

    LEFT JOIN photos p
        ON sp.ID_Photos = p.ID

    GROUP BY s.ID

    ORDER BY s.DateDePublication DESC
");

    $stmt->execute();

    $services = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        'success' => true,
        'services' => $services
    ]);

} catch (PDOException $e) {

    http_response_code(500);

    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}