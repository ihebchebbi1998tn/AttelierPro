<?php
error_reporting(E_ALL);
ini_set('display_errors', 0);

// Enable CORS for all requests, including preflight OPTIONS requests
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, X-Request-ID, X-Client-Version");
header("Content-Type: application/json; charset=UTF-8");
// Handle preflight OPTIONS requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}
 //private $host = "luccybcdb.mysql.db";
  //  private $username = "luccybcdb";
   // private $password = "Dadouhibou2025";
   // private $database = "luccybcdb";
  //  public $conn;
  
class Database {
    private $host = "luccybcdb.mysql.db";
    private $username = "luccybcdb";
    private $password = "Dadouhibou2025";
    private $database = "luccybcdb";
    public $conn;

    public function getConnection() {
        $this->conn = null;
        try {
            $this->conn = new PDO(
                "mysql:host=" . $this->host . ";dbname=" . $this->database,
                $this->username,
                $this->password
            );
            $this->conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            $this->conn->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
        } catch(PDOException $e) {
            echo json_encode([
                'success' => false,
                'message' => 'Connection error: ' . $e->getMessage()
            ]);
            exit;
        }
        return $this->conn;
    }
}
?>