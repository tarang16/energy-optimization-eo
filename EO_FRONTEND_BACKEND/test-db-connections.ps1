# Quick sanity check that Windows auth can reach each restored DB.
# Usage: right-click in File Explorer -> "Run with PowerShell"
#        or: powershell -ExecutionPolicy Bypass -File .\test-db-connections.ps1

param(
    [string]$Server = "localhost\SQLEXPRESS"
)

$dbs = @(
    "SABIC_DT_EnergyOptimization",
    "SABIC_DT_EnergyOptimization_WebUI",
    "SABIC_DT_MFG_EnergyOptimizer_WF",
    "Manufacturing_Master"
)

Write-Host "Testing SQL Server connection to $Server using Windows auth`n" -ForegroundColor Cyan

foreach ($db in $dbs) {
    $connStr = "Server=$Server;Database=$db;Integrated Security=True;TrustServerCertificate=True;Connection Timeout=5"
    try {
        $conn = New-Object System.Data.SqlClient.SqlConnection $connStr
        $conn.Open()
        $cmd = $conn.CreateCommand()
        $cmd.CommandText = "SELECT COUNT(*) FROM sys.tables"
        $tableCount = $cmd.ExecuteScalar()
        Write-Host ("  [OK]   {0,-45}  tables: {1}" -f $db, $tableCount) -ForegroundColor Green
        $conn.Close()
    } catch {
        Write-Host ("  [FAIL] {0,-45}  {1}" -f $db, $_.Exception.InnerException.Message) -ForegroundColor Red
    }
}

Write-Host "`nIf Manufacturing_Master fails, that's expected (not restored yet)." -ForegroundColor DarkGray
Write-Host "If the others fail, update Server name in appsettings.json and in this script." -ForegroundColor DarkGray
