<?php
// session-config.php


ini_set('session.cookie_httponly', 1);
ini_set('session.cookie_samesite', 'Lax'); 

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Headers CORS corrects pour les requêtes avec credentials (cookies)
header('Access-Control-Allow-Origin: ' . (isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '*'));
header('Access-Control-Allow-Credentials: true');   // ← CRUCIAL pour les sessions
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Content-Type: application/json; charset=utf-8');

// Gestion preflight OPTIONS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}