# START_SHARE.ps1
# One-click launcher for the EO dashboard + two ngrok tunnels.
# Opens four PowerShell windows: backend, frontend, ngrok-frontend, ngrok-backend.
# Close any window (or Ctrl-C inside it) to stop that piece.

$ErrorActionPreference = "Stop"

# --- paths (edit if your layout differs) ---
$root        = "C:\Users\tnigam\Desktop\Python EO\EO_FRONTEND_BACKEND"
$backend     = Join-Path $root "EO.NET +Selenium\EO .NET + Selenium\EO_Backend\EOWebMicroservice"
$frontend    = Join-Path $root "EO_Frontend"
$ngrokFeCfg  = Join-Path $root "ngrok-frontend.yml"
$ngrokBeCfg  = Join-Path $root "ngrok-backend.yml"

function Start-InNewWindow {
    param([string]$Title, [string]$WorkingDir, [string]$Command)
    $ps = "-NoExit -Command `"`$Host.UI.RawUI.WindowTitle='$Title'; Set-Location '$WorkingDir'; $Command`""
    Start-Process powershell -ArgumentList $ps
}

Write-Host "Starting EO share stack..." -ForegroundColor Cyan

# 1. Backend
Start-InNewWindow -Title "EO Backend (:8001)" `
                  -WorkingDir $backend `
                  -Command "dotnet run --urls 'http://localhost:8001'"

Start-Sleep -Seconds 3

# 2. Frontend
Start-InNewWindow -Title "EO Frontend (:3000)" `
                  -WorkingDir $frontend `
                  -Command "npm run dev"

Start-Sleep -Seconds 3

# 3. ngrok frontend tunnel (account 1)
Start-InNewWindow -Title "ngrok frontend" `
                  -WorkingDir $root `
                  -Command "ngrok start --config `"$ngrokFeCfg`" eo-frontend"

Start-Sleep -Seconds 2

# 4. ngrok backend tunnel (account 2)
Start-InNewWindow -Title "ngrok backend" `
                  -WorkingDir $root `
                  -Command "ngrok start --config `"$ngrokBeCfg`" eo-backend"

Write-Host ""
Write-Host "Four windows launched. Give them ~20s to warm up, then open:" -ForegroundColor Green
Write-Host "  https://edition-unpleased-confiding.ngrok-free.dev/eo_ui"
Write-Host ""
Write-Host "Close any window to stop that piece. This launcher can now be closed." -ForegroundColor Yellow
