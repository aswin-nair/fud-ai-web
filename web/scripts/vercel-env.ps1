<#
.SYNOPSIS
  Give the poiem Vercel project its production settings without printing any secret.

.DESCRIPTION
  Run this yourself, from the web folder, after:
    npx vercel@latest login
    npx vercel@latest link --yes --project poiem

  - DATABASE_URL is read from web\.env (written by create-neon-db.ps1).
  - JWT_SECRET, CRON_SECRET and RATE_LIMIT_SECRET are generated here. If the
    project already has one, it is kept: replacing JWT_SECRET signs everyone out.
  - APP_ORIGIN is the fixed address used in password-reset links.
  - GOOGLE_CLIENT_ID is optional and only needed for Google sign-in.

  Everything goes to Production only, so preview deployments never reach the
  live database. Each value travels to Vercel through a temporary file that is
  deleted as soon as the CLI has read it. Redeploy afterwards.

.EXAMPLE
  powershell -ExecutionPolicy Bypass -File .\scripts\vercel-env.ps1

.EXAMPLE
  powershell -ExecutionPolicy Bypass -File .\scripts\vercel-env.ps1 -GoogleClientId 123-abc.apps.googleusercontent.com
#>
param(
  [string]$Project = 'poiem',
  [string]$Origin = 'https://poiem.app',
  [string]$GoogleClientId = ''
)

# Native tools are judged by exit code; see create-neon-db.ps1 for why.
$ErrorActionPreference = 'Continue'
$webRoot = Split-Path -Parent $PSScriptRoot
$script:tempFile = $null
Push-Location $webRoot

function New-RandomSecret {
  $bytes = New-Object byte[] 48
  $rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
  try { $rng.GetBytes($bytes) } finally { $rng.Dispose() }
  return [Convert]::ToBase64String($bytes).TrimEnd('=').Replace('+', '-').Replace('/', '_')
}

function Set-ProductionValue([string]$Name, [string]$Value, [bool]$Sensitive) {
  $script:tempFile = Join-Path ([System.IO.Path]::GetTempPath()) ('poiem-env-{0}.txt' -f [guid]::NewGuid())
  # No trailing newline, so the stored value is exactly the value.
  [System.IO.File]::WriteAllText($script:tempFile, $Value)
  $kind = if ($Sensitive) { '--sensitive' } else { '--no-sensitive' }
  # cmd does the stdin redirect; --yes stops npx from reading the value as an install answer.
  & cmd /c "npx --yes vercel@latest env add $Name production --force $kind < `"$script:tempFile`""
  $code = $LASTEXITCODE
  Remove-Item -Force $script:tempFile
  $script:tempFile = $null
  if ($code -ne 0) { throw "Vercel did not accept $Name." }
  Write-Host "     $Name set"
}

try {
  Write-Host '1/4  Checking which Vercel project this folder is linked to...'
  $linkFile = Join-Path $webRoot '.vercel\project.json'
  if (-not (Test-Path $linkFile)) {
    throw "This folder is not linked yet. Run: npx vercel@latest link --yes --project $Project"
  }
  $link = Get-Content $linkFile -Raw | ConvertFrom-Json
  if ($link.projectName -ne $Project) {
    throw ("This folder is linked to the Vercel project '{0}', not '{1}'. Run: npx vercel@latest link --yes --project {1}" -f $link.projectName, $Project)
  }

  Write-Host '2/4  Reading which settings Production already has...'
  $listed = & npx --yes vercel@latest env ls production 2>&1
  if ($LASTEXITCODE -ne 0) {
    throw 'Could not read the project settings. Run "npx vercel@latest login" and try again.'
  }
  $listing = $listed | Out-String
  $generated = @('JWT_SECRET', 'CRON_SECRET', 'RATE_LIMIT_SECRET')
  $existing = @($generated | Where-Object { $listing -match ('(?m)^\s*' + [regex]::Escape($_) + '\s') })

  Write-Host '3/4  Preparing values...'
  $envFile = Join-Path $webRoot '.env'
  if (-not (Test-Path $envFile)) { throw 'web\.env was not found. Run scripts\create-neon-db.ps1 first.' }
  $line = Get-Content $envFile | Where-Object { $_ -match '^\s*DATABASE_URL=' } | Select-Object -First 1
  if (-not $line) { throw 'web\.env has no DATABASE_URL line.' }
  $databaseUrl = ($line -replace '^\s*DATABASE_URL=', '').Trim().Trim('"')
  if (-not $databaseUrl) { throw 'DATABASE_URL in web\.env is empty.' }

  Write-Host '4/4  Sending to Vercel (Production only)...'
  Set-ProductionValue 'DATABASE_URL' $databaseUrl $true
  foreach ($name in $generated) {
    if ($existing -contains $name) {
      Write-Host "     $name is already set, keeping it"
    } else {
      Set-ProductionValue $name (New-RandomSecret) $true
    }
  }
  Set-ProductionValue 'APP_ORIGIN' $Origin $false
  if ($GoogleClientId.Trim()) {
    # The API verifies tokens with GOOGLE_CLIENT_ID; the build bakes VITE_GOOGLE_CLIENT_ID into the sign-in button.
    Set-ProductionValue 'GOOGLE_CLIENT_ID' $GoogleClientId.Trim() $false
    Set-ProductionValue 'VITE_GOOGLE_CLIENT_ID' $GoogleClientId.Trim() $false
  }

  Write-Host ''
  Write-Host 'Done. None of the values were printed.'
  Write-Host 'Now redeploy in Vercel (Deployments > latest > Redeploy) so they take effect.'
} catch {
  Write-Host ''
  Write-Host ('Stopped: {0}' -f $_.Exception.Message) -ForegroundColor Red
  exit 1
} finally {
  if ($script:tempFile -and (Test-Path $script:tempFile)) { Remove-Item -Force $script:tempFile }
  Pop-Location
}
