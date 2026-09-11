<#
.SYNOPSIS
  Give the poiem Worker its secrets without printing any of them.

.DESCRIPTION
  Run this yourself, after `npx wrangler login` and one `npm run cf:deploy`.

  - DATABASE_URL is read from web\.env (written by create-neon-db.ps1).
  - JWT_SECRET, CRON_SECRET and RATE_LIMIT_SECRET are generated here. If the
    Worker already has one, it is kept: replacing JWT_SECRET signs everyone out.
  - GOOGLE_CLIENT_ID is optional and only needed for Google sign-in.

  The values go to Cloudflare through a temporary file that is deleted as soon
  as Wrangler has read it.

.EXAMPLE
  powershell -ExecutionPolicy Bypass -File .\scripts\cloudflare-secrets.ps1

.EXAMPLE
  powershell -ExecutionPolicy Bypass -File .\scripts\cloudflare-secrets.ps1 -GoogleClientId 123-abc.apps.googleusercontent.com
#>
param(
  [string]$GoogleClientId = ''
)

# Native tools are judged by exit code; see create-neon-db.ps1 for why.
$ErrorActionPreference = 'Continue'
$webRoot = Split-Path -Parent $PSScriptRoot
$tempFile = $null
Push-Location $webRoot

function New-RandomSecret {
  $bytes = New-Object byte[] 48
  $rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
  try { $rng.GetBytes($bytes) } finally { $rng.Dispose() }
  return [Convert]::ToBase64String($bytes).TrimEnd('=').Replace('+', '-').Replace('/', '_')
}

try {
  Write-Host '1/3  Reading which secrets the Worker already has...'
  $listed = & npx wrangler secret list --format json
  if ($LASTEXITCODE -ne 0) {
    throw 'Could not read the Worker. Run "npx wrangler login", deploy once with "npm run cf:deploy", then run this again.'
  }
  $existing = @()
  $text = ($listed -join "`n").Trim()
  if ($text) {
    try {
      $existing = @(($text | ConvertFrom-Json -ErrorAction Stop) | ForEach-Object { $_ } | ForEach-Object { $_.name })
    } catch {
      throw 'Wrangler returned a secret list that was not JSON.'
    }
  }

  Write-Host '2/3  Preparing values...'
  $envFile = Join-Path $webRoot '.env'
  if (-not (Test-Path $envFile)) { throw 'web\.env was not found. Run scripts\create-neon-db.ps1 first.' }
  $line = Get-Content $envFile | Where-Object { $_ -match '^\s*DATABASE_URL=' } | Select-Object -First 1
  if (-not $line) { throw 'web\.env has no DATABASE_URL line.' }

  $secrets = [ordered]@{}
  $secrets['DATABASE_URL'] = ($line -replace '^\s*DATABASE_URL=', '').Trim()
  foreach ($name in @('JWT_SECRET', 'CRON_SECRET', 'RATE_LIMIT_SECRET')) {
    if ($existing -contains $name) {
      Write-Host "     $name is already set, keeping it"
    } else {
      $secrets[$name] = New-RandomSecret
      Write-Host "     $name generated"
    }
  }
  if ($GoogleClientId.Trim()) {
    $secrets['GOOGLE_CLIENT_ID'] = $GoogleClientId.Trim()
    Write-Host '     GOOGLE_CLIENT_ID added'
  }

  Write-Host '3/3  Sending to Cloudflare...'
  $tempFile = Join-Path ([System.IO.Path]::GetTempPath()) ('poiem-secrets-{0}.json' -f [guid]::NewGuid())
  [System.IO.File]::WriteAllText($tempFile, ($secrets | ConvertTo-Json -Compress))
  & npx wrangler secret bulk $tempFile
  if ($LASTEXITCODE -ne 0) { throw 'Cloudflare did not accept the secrets.' }

  Write-Host ''
  Write-Host 'Done. The Worker has its secrets; none were printed.'
} catch {
  Write-Host ''
  Write-Host ('Stopped: {0}' -f $_.Exception.Message) -ForegroundColor Red
  exit 1
} finally {
  if ($tempFile -and (Test-Path $tempFile)) { Remove-Item -Force $tempFile }
  Pop-Location
}
