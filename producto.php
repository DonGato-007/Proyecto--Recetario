<?php
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");

// Mock list of products/ingredients for the recipe book
$productos = [
    [
        "id" => 1,
        "nombre" => "Tomates",
        "categoria" => "Verduras",
        "precio" => 1.50,
        "stock" => 50
    ],
    [
        "id" => 2,
        "nombre" => "Harina de Trigo",
        "categoria" => "Abarrotes",
        "precio" => 2.20,
        "stock" => 30
    ],
    [
        "id" => 3,
        "nombre" => "Aceite de Oliva",
        "categoria" => "Abarrotes",
        "precio" => 8.90,
        "stock" => 15
    ],
    [
        "id" => 4,
        "nombre" => "Pechuga de Pollo",
        "categoria" => "Carnes",
        "precio" => 5.50,
        "stock" => 20
    ]
];

echo json_encode([
    "success" => true,
    "data" => $productos
], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
