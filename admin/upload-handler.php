<?php
// Admin Upload Handler
// Handles file uploads and asset updates for the portfolio admin panel

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit;
}

$action = $_GET['action'] ?? '';

switch ($action) {
    case 'upload':
        handleFileUpload();
        break;
    case 'update-assets':
        handleAssetsUpdate();
        break;
    default:
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Invalid action']);
        break;
}

function handleFileUpload() {
    try {
        if (!isset($_FILES['file']) || !isset($_POST['targetPath'])) {
            throw new Exception('Missing file or target path');
        }
        
        $uploadedFile = $_FILES['file'];
        $targetPath = $_POST['targetPath'];
        $originalName = $_POST['originalName'] ?? $uploadedFile['name'];
        
        // Validate file
        if ($uploadedFile['error'] !== UPLOAD_ERR_OK) {
            throw new Exception('File upload error: ' . $uploadedFile['error']);
        }
        
        // Security: Validate file type
        $allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm'];
        $fileType = $uploadedFile['type'];
        
        if (!in_array($fileType, $allowedTypes)) {
            throw new Exception('Invalid file type: ' . $fileType);
        }
        
        // Construct full target path
        $targetDir = '../' . $targetPath;
        $targetFile = $targetDir . $originalName;
        
        // Create directory if it doesn't exist
        if (!is_dir($targetDir)) {
            if (!mkdir($targetDir, 0755, true)) {
                throw new Exception('Failed to create target directory');
            }
        }
        
        // Move uploaded file
        if (!move_uploaded_file($uploadedFile['tmp_name'], $targetFile)) {
            throw new Exception('Failed to move uploaded file');
        }
        
        echo json_encode([
            'success' => true,
            'filename' => $originalName,
            'path' => $targetFile,
            'size' => filesize($targetFile)
        ]);
        
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'error' => $e->getMessage()
        ]);
    }
}

function handleAssetsUpdate() {
    try {
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!isset($input['content'])) {
            throw new Exception('Missing content data');
        }
        
        $newContent = $input['content'];
        $assetsFile = '../assestsName.js';
        
        // Backup existing file
        if (file_exists($assetsFile)) {
            $backupFile = '../assestsName.js.backup.' . date('Y-m-d_H-i-s');
            if (!copy($assetsFile, $backupFile)) {
                throw new Exception('Failed to create backup');
            }
        }
        
        // Write new content
        if (file_put_contents($assetsFile, $newContent) === false) {
            throw new Exception('Failed to write to assets file');
        }
        
        echo json_encode([
            'success' => true,
            'message' => 'Assets file updated successfully',
            'backup' => basename($backupFile ?? '')
        ]);
        
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'error' => $e->getMessage()
        ]);
    }
}

function sanitizeFilename($filename) {
    // Remove any path components
    $filename = basename($filename);
    
    // Remove or replace unsafe characters
    $filename = preg_replace('/[^a-zA-Z0-9._-]/', '_', $filename);
    
    return $filename;
}
?>