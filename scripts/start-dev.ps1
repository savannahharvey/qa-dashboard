$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

$apiLog = Join-Path $root "api-live.log"
$apiErr = Join-Path $root "api-live.err"
$webLog = Join-Path $root "web-live.log"
$webErr = Join-Path $root "web-live.err"

Start-Process -FilePath (Join-Path $root "node_modules\.bin\tsx.cmd") `
  -ArgumentList "watch", "src/server.ts" `
  -WorkingDirectory $root `
  -RedirectStandardOutput $apiLog `
  -RedirectStandardError $apiErr `
  -WindowStyle Hidden | Out-Null

Start-Process -FilePath (Join-Path $root "node_modules\.bin\vite.cmd") `
  -ArgumentList "--host", "127.0.0.1" `
  -WorkingDirectory $root `
  -RedirectStandardOutput $webLog `
  -RedirectStandardError $webErr `
  -WindowStyle Hidden | Out-Null

Write-Host "Started dev processes."
