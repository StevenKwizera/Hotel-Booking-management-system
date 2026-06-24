# Orkestra — PostgreSQL setup (Windows, no Docker)
# Run from project root: .\backend\scripts\setup-database.ps1

$ErrorActionPreference = "Stop"
$pgBin = "C:\Program Files\PostgreSQL\17\bin"
if (-not (Test-Path "$pgBin\psql.exe")) {
    $pgBin = "C:\Program Files\PostgreSQL\16\bin"
}
$psql = "$pgBin\psql.exe"
$env:PGPASSWORD = if ($env:DB_PASSWORD) { $env:DB_PASSWORD } else { "ksteven" }
$user = if ($env:DB_USER) { $env:DB_USER } else { "postgres" }
$host = if ($env:DB_HOST) { $env:DB_HOST } else { "localhost" }
$port = if ($env:DB_PORT) { $env:DB_PORT } else { "5432" }
$db = if ($env:DB_NAME) { $env:DB_NAME } else { "orkestra" }

Write-Host "Using PostgreSQL at $pgBin" -ForegroundColor Cyan

$exists = & $psql -U $user -h $host -p $port -tc "SELECT 1 FROM pg_database WHERE datname='$db'"
if ($exists -match "1") {
    Write-Host "Database '$db' already exists." -ForegroundColor Yellow
} else {
    & $psql -U $user -h $host -p $port -c "CREATE DATABASE $db"
    Write-Host "Created database '$db'." -ForegroundColor Green
}

Write-Host ""
Write-Host "Next: start the API (creates tables + seeds data):" -ForegroundColor Cyan
Write-Host "  cd backend" -ForegroundColor White
Write-Host "  mvn spring-boot:run" -ForegroundColor White
