# Launches backend (port 8001) and frontend (port 3000) in separate PowerShell windows.
# Usage:  powershell -ExecutionPolicy Bypass -File .\run-stack.ps1

$root = $PSScriptRoot
$backendDir  = Join-Path $root 'EO.NET +Selenium\EO .NET + Selenium\EO_Backend\EOWebMicroservice'
$frontendDir = Join-Path $root 'EO_Frontend'

if (-not (Test-Path $backendDir))  { throw "Backend dir not found: $backendDir" }
if (-not (Test-Path $frontendDir)) { throw "Frontend dir not found: $frontendDir" }

Write-Host "Starting backend on http://localhost:8001 ..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit","-Command","cd `"$backendDir`"; dotnet run --launch-profile http"

Start-Sleep -Seconds 3

Write-Host "Starting frontend on http://localhost:3000/eo_ui ..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit","-Command","cd `"$frontendDir`"; npm run dev"

Write-Host "`nTwo new PowerShell windows should have opened."
Write-Host "Backend  -> http://localhost:8001/swagger"
Write-Host "Frontend -> http://localhost:3000/eo_ui/"
