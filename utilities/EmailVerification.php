<?php
class EmailVerification {

    private static function loadEnv($path) {
        if (!file_exists($path)) {
            error_log('ERREUR: fichier .env introuvable à : ' . $path);
            return;
        }
        $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        foreach ($lines as $line) {
            $line = trim($line);
            if ($line === '' || $line[0] === '#') continue;
            if (strpos($line, '=') === false) continue;
            list($key, $value) = explode('=', $line, 2);
            $_ENV[trim($key)] = trim($value);
        }
    }

    public static function sendVerification($email, $code) {

        self::loadEnv(__DIR__ . '/../.env');

        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            throw new InvalidArgumentException('Invalid email address');
        }

        $apiKey     = $_ENV['MAILJET_API_KEY']    ?? null;
        $secretKey  = $_ENV['MAILJET_SECRET_KEY'] ?? null;
        $fromEmail  = $_ENV['FROM_EMAIL']         ?? null;
        $fromName   = $_ENV['FROM_NAME']          ?? 'Plateforme universitaire';

        if (!$apiKey || !$secretKey || !$fromEmail) {
            throw new Exception('Configuration manquante dans le fichier .env');
        }

        $data = json_encode([
            'Messages' => [
                [
                    'From' => [
                        'Email' => $fromEmail,
                        'Name'  => $fromName
                    ],
                    'To' => [
                        ['Email' => $email]
                    ],
                    'Subject'  => 'Verify your email',
                    'HTMLPart' => '<p>Your verification code is: <strong>' . htmlspecialchars($code) . '</strong></p>'
                ]
            ]
        ]);

        $ch = curl_init('https://api.mailjet.com/v3.1/send');
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST           => true,
            CURLOPT_POSTFIELDS     => $data,
            CURLOPT_HTTPHEADER     => ['Content-Type: application/json'],
            CURLOPT_USERPWD        => $apiKey . ':' . $secretKey,
            CURLOPT_TIMEOUT        => 15,
            CURLOPT_SSL_VERIFYPEER => false,
            CURLOPT_SSL_VERIFYHOST => false,
        ]);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

        if (curl_errno($ch)) {
            throw new Exception('Curl error: ' . curl_error($ch));
        }

        curl_close($ch);

        if ($httpCode !== 200 && $httpCode !== 201) {
            throw new Exception('Email sending failed: ' . $response);
        }

        return json_decode($response, true);
    }
}