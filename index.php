<?php
session_start();

$_SESSION['role'] = 'staff';

if ($_SESSION['role'] === 'staff') {
    header('Location: /ChickNPastil/staff/dashboard.html');
    exit;
} else if ($_SESSION['role'] === 'manager') {
    header('Location: /ChickNPastil/manager/dashboard.html');
    exit;
} else {
    header('Location: /ChickNPastil/login.html');
    exit;
}