<?php
class EmailVerification {

    public static function sendVerification($email, $code) {

        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            throw new InvalidArgumentException('Invalid email address');
        }

        $apiKey = 're_hAZzMtvc_9n6VFdNVW8VWHmJqmeCexcx8';

        $data = [
            "from"    => "onboarding@resend.dev",
            
            "to"      => [$email],
            "subject" => "Verify your email",
            "html"    => "<p>Your verification code is: <strong>" . htmlspecialchars($code) . "</strong></p>"
        ];

        $ch = curl_init("https://api.resend.com/emails");

        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            "Authorization: Bearer $apiKey",
            "Content-Type: application/json"
        ]);

        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false); // For testing, disable SSL verification

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

        if (curl_errno($ch)) {
            throw new Exception('Curl error: ' . curl_error($ch));
        }

        curl_close($ch);

        if ($httpCode !== 200) {
            throw new Exception('Email sending failed: ' . $response);
        }

        return json_decode($response, true);
    }
}