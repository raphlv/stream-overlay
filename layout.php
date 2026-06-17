<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle CORS preflight options request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

$file = 'layout.json';

// POST: Save current configuration (Theme, Labels, and Widget positions)
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = file_get_contents('php://input');
    if ($input) {
        $decoded = json_decode($input, true);
        if ($decoded) {
            file_put_contents($file, json_encode($decoded, JSON_PRETTY_PRINT));
            echo json_encode(['success' => true, 'message' => 'Configuration saved successfully']);
            exit;
        }
    }
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Invalid or empty JSON input']);
    exit;
}

// GET: Load configuration, or return defaults if file doesn't exist
if (file_exists($file)) {
    echo file_get_contents($file);
} else {
    $defaultConfig = [
        'theme' => [
            'primaryColor' => '#ff7bb0',
            'secondaryColor' => '#9d8df2'
        ],
        'labels' => [
            'webcamText' => 'STREAMING LIVE',
            'subText' => 'Rafi_Gamer',
            'donationText' => 'Budi_Luhur (Rp 100K)',
            'goalText' => '742 / 1000',
            'ytHandle' => 'RyanPahlevi TV',
            'igHandle' => '@ryan_pahlevi'
        ],
        'layout' => [
            'webcam' => ['x' => 50, 'y' => 50, 'scale' => 100],
            'chatbox' => ['x' => 50, 'y' => 670, 'scale' => 100],
            'stats' => ['x' => 1240, 'y' => 50, 'scale' => 100],
            'social' => ['x' => 1610, 'y' => 982, 'scale' => 100]
        ],
        'latestAlert' => null,
        'chats' => []
    ];
    echo json_encode($defaultConfig, JSON_PRETTY_PRINT);
}
