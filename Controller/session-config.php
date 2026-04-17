<?php
// session-config.php

// ══════════════════════════════════════════════════════════════════
// IMPORTANT : ces ini_set DOIVENT être appelés AVANT session_start()
// ══════════════════════════════════════════════════════════════════

ini_set('session.cookie_httponly', 1);

// ── Détection HTTP vs HTTPS ────────────────────────────────────────
// Chrome exige SameSite=None UNIQUEMENT avec Secure (HTTPS).
// En localhost (HTTP), on met SameSite=Lax sans Secure.
$isSecure = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
         || (isset($_SERVER['SERVER_PORT']) && $_SERVER['SERVER_PORT'] == 443);

if ($isSecure) {
    // Production HTTPS : SameSite=None obligatoire pour les fetch cross-origin
    ini_set('session.cookie_samesite', 'None');
    ini_set('session.cookie_secure',   1);
} else {
    // Développement HTTP (localhost) : SameSite=Lax suffit
    ini_set('session.cookie_samesite', 'Lax');
    ini_set('session.cookie_secure',   0);
}

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// ── CORS ───────────────────────────────────────────────────────────
// RÈGLE ABSOLUE : credentials='include' → jamais Access-Control-Allow-Origin: *
// Il faut renvoyer l'origine EXACTE de la requête.
$origin = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '';

if ($origin !== '') {
    header('Access-Control-Allow-Origin: ' . $origin);
}

header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Content-Type: application/json; charset=utf-8');

// Gestion preflight OPTIONS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}
