<?php
session_start();

if (($_SESSION['role'] ?? null) === 'staff') {
    header('Location: /ChickNPastil/staff/dashboard.html');
    exit;
} elseif (($_SESSION['role'] ?? null) === 'manager') {
    header('Location: /ChickNPastil/manager/dashboard.html');
    exit;
} else {
    header('Location: /ChickNPastil/login.html');
    exit;
}