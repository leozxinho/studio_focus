<?php
/**
 * Focus IA - PHP API Bridge
 * Esconde a chave do Gemini e processa as requisições no servidor.
 */

// Configurações de cabeçalho
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *'); // Ajuste para seu domínio em produção
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Tratar requisição OPTIONS (Preflight)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit;
}

// Validar se é POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => ['message' => 'Método não permitido', 'code' => 405]]);
    exit;
}

// Obter dados da requisição
$json = file_get_contents('php://input');
$input = json_decode($json, true);

$messages = $input['messages'] ?? null;
$system_prompt = $input['system_prompt'] ?? null;

if (!$messages || !$system_prompt) {
    http_response_code(400);
    echo json_encode(['error' => ['message' => 'Dados insuficientes (messages ou system_prompt ausentes)', 'code' => 400]]);
    exit;
}

// --- CONFIGURAÇÃO SEGURA ---
$API_KEY = "AIzaSyDp4jIYu82PEZe9ZOOKbp4HUpAzSG3XLcM";
$MODEL = "gemini-1.5-flash";
$API_URL = "https://generativelanguage.googleapis.com/v1beta/models/{$MODEL}:generateContent?key={$API_KEY}";

// Montar payload para o Gemini
$payload = [
    "system_instruction" => [
        "parts" => [
            ["text" => $system_prompt]
        ]
    ],
    "contents" => $messages,
    "generationConfig" => [
        "maxOutputTokens" => 2048,
        "temperature" => 0.7
    ]
];

// Iniciar CURL para chamada externa
$ch = curl_init($API_URL);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json'
]);

// Executar e capturar resposta
$response = curl_exec($ch);
$http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curl_error = curl_error($ch);
curl_close($ch);

// Tratar erro de conexão
if ($response === false) {
    http_response_code(500);
    echo json_encode(['error' => ['message' => 'Erro de conexão com o servidor de IA: ' . $curl_error, 'code' => 500]]);
    exit;
}

// Retornar resposta do Gemini para o widget
http_response_code($http_code);
echo $response;
