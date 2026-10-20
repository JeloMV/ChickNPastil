<?php
// header('Content-Type: application/json');

// if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
//     http_response_code(405);
//     echo json_encode(['error' => 'Method not allowed']);
//     exit;
// }

// $file = __DIR__ . '/../data/menu.json';
// $json = file_get_contents($file);
// $menu = json_decode($json, true);

// if ($menu === null) {
//     http_response_code(500);
//     echo json_encode(['error' => 'Invalid menu data']);
//     exit;
// }

// echo json_encode($menu);
