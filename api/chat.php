<?php
/**
 * Focus IA - PHP API Bridge (Versão 2026 - Gemini 3.1)
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit; }

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => ['message' => 'Método não permitido']]);
    exit;
}

$json = file_get_contents('php://input');
$input = json_decode($json, true);

$messages = $input['messages'] ?? null;
$system_prompt = $input['system_prompt'] ?? null;

if (!$messages || !$system_prompt) {
    http_response_code(400);
    echo json_encode(['error' => ['message' => 'Dados insuficientes']]);
    exit;
}

// --- CONFIGURAÇÃO (ATUALIZADA PARA 2026) ---
$API_KEY = "AIzaSyDp4jIYu82PEZe9ZOOKbp4HUpAzSG3XLcM";
$MODEL = "gemini-3.1-flash-lite"; // Versão estável e ultra rápida de 2026
$API_URL = "https://generativelanguage.googleapis.com/v1beta/models/{$MODEL}:generateContent?key={$API_KEY}";

$payload = [
    "system_instruction" => [
        "parts" => [
            ["text" => $system_prompt]
        ]
    ],
    "contents" => $messages,
    "generationConfig" => [
        "maxOutputTokens" => 4096, // Limite aumentado em 2026
        "temperature" => 0.7
    ]
];

$ch = curl_init($API_URL);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);

$response = curl_exec($ch);
$http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

http_response_code($http_code);
echo $response;
