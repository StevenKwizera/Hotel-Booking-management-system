# Load backend/.env and start Orkestra API
$envFile = Join-Path (Join-Path $PSScriptRoot "..") ".env"
if (Test-Path $envFile) {
  Get-Content $envFile | ForEach-Object {
    if ($_ -match '^\s*#' -or $_ -match '^\s*$') { return }
    $pair = $_ -split '=', 2
    if ($pair.Length -eq 2) {
      [System.Environment]::SetEnvironmentVariable($pair[0].Trim(), $pair[1].Trim())
    }
  }
  Write-Host "Loaded $envFile"
}

Set-Location (Join-Path $PSScriptRoot "..")
mvn spring-boot:run
