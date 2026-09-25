# Auto-update API IP address
$ip = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -notlike "127.*" -and $_.IPAddress -notlike "169.*" } | Select-Object -First 1).IPAddress
$apiFile = "$PSScriptRoot\car-again\constants\api.ts"
Set-Content -Path $apiFile -Value "export const API_BASE = 'http://${ip}:8000/api/v1';" -Encoding UTF8
Write-Host "IP updated to: $ip" -ForegroundColor Green
