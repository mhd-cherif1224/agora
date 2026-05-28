<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);
require_once __DIR__ . '/../model/Database.php';

header('Content-Type: application/json');

if (!isset($_GET['id'])) {
    echo json_encode([
        'success' => false,
        'message' => 'ID manquant'
    ]);
    exit;
}

$serviceId = intval($_GET['id']);

try {

    $pdo = Database::getConnection();
    $pdo->exec("SET time_zone = '+00:00'"); 

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

            GROUP_CONCAT(DISTINCT c.titre SEPARATOR ',') AS categorie,

            MAX(p.photo_path) AS service_photo,

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

        WHERE s.ID = :id

        GROUP BY s.ID
    ");

    $stmt->execute([
        'id' => $serviceId
    ]);

    $service = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$service) {
        echo json_encode([
            'success' => false,
            'message' => 'Service introuvable'
        ]);
        exit;
    }

    echo json_encode([
        'success' => true,
        'service' => $service
    ]);

} catch (PDOException $e) {

    http_response_code(500);

    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}