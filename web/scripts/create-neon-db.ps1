<#
.SYNOPSIS
  Create a brand-new Neon Postgres project for Poiem, apply the schema, and save
  DATABASE_URL to web\.env (git-ignored).

.DESCRIPTION
  Run this yourself. It signs you in to Neon in your browser, creates a fresh
  project (your existing projects and their data are not touched), creates every
  table from db\schema.sql, and writes the connection string to web\.env.
  The connection string contains the database password, so it is never printed.

  The Neon sign-in for this script is kept in its own folder
  (%USERPROFILE%\.config\neon-poiem). A stale session left in the default Neon
  folder is ignored rather than read, changed or deleted.

.EXAMPLE
  powershell -ExecutionPolicy Bypass -File .\scripts\create-neon-db.ps1
#>
param(
  [string]$Name = 'poiem',
  # Singapore: the closest Neon AWS region to India. Override with -Region.
  [string]$Region = 'aws-ap-southeast-1'
)

# Windows PowerShell 5.1 turns a Node tool's error output into a fatal error when
# ErrorActionPreference is Stop, which aborted the sign-in fallback. Native tools
# are judged by their exit code instead, and failures throw explicitly.
$ErrorActionPreference = 'Continue'
$webRoot = Split-Path -Parent $PSScriptRoot
$neonConfig = Join-Path $env:USERPROFILE '.config\neon-poiem'
New-Item -ItemType Directory -Force -Path $neonConfig | Out-Null
Push-Location $webRoot

function Invoke-Neon {
  param([Parameter(ValueFromRemainingArguments = $true)][string[]]$Arguments)
  $output = & npx --yes neonctl@latest @Arguments --config-dir $neonConfig
  if ($LASTEXITCODE -ne 0) { throw "neon $($Arguments[0]) $($Arguments[1]) failed (exit code $LASTEXITCODE)" }
  return ($output -join "`n")
}

function ConvertFrom-NeonJson([string]$Text, [string]$What) {
  try {
    return $Text | ConvertFrom-Json -ErrorAction Stop
  } catch {
    throw "Neon returned output for '$What' that was not JSON."
  }
}

try {
  Write-Host '1/4  Signing in to Neon...'
  & npx --yes neonctl@latest me --output json --config-dir $neonConfig *> $null
  if ($LASTEXITCODE -ne 0) {
    Write-Host '     Approve access in the browser window that opens.'
    & npx --yes neonctl@latest auth --config-dir $neonConfig
    if ($LASTEXITCODE -ne 0) { throw 'Neon sign-in did not complete.' }
  }

  # Choose the organization up front: an interactive prompt inside a captured
  # command would corrupt the JSON the next step reads.
  $parsed = ConvertFrom-NeonJson (Invoke-Neon orgs list --output json) 'orgs list'
  $orgs = @($parsed | ForEach-Object { $_ })
  if ($orgs.Count -eq 1 -and $orgs[0].PSObject.Properties.Name -contains 'organizations') {
    $orgs = @($orgs[0].organizations | ForEach-Object { $_ })
  }
  $orgArgs = @()
  if ($orgs.Count -eq 1) {
    $orgArgs = @('--org-id', $orgs[0].id)
  } elseif ($orgs.Count -gt 1) {
    Write-Host '     Your Neon organizations:'
    for ($i = 0; $i -lt $orgs.Count; $i++) {
      Write-Host ('       [{0}] {1}' -f ($i + 1), $orgs[$i].name)
    }
    $pick = 0
    if (-not [int]::TryParse((Read-Host '     Type the number to create Poiem in'), [ref]$pick) -or $pick -lt 1 -or $pick -gt $orgs.Count) {
      throw 'That number is not in the list.'
    }
    $orgArgs = @('--org-id', $orgs[$pick - 1].id)
  }

  Write-Host "2/4  Creating a new Neon project '$Name' in $Region..."
  $created = ConvertFrom-NeonJson (Invoke-Neon projects create --name $Name --region-id $Region @orgArgs --output json) 'projects create'
  $uri = $created.connection_uris[0].connection_uri
  if (-not $uri) { throw 'Neon created the project but returned no connection string.' }
  Write-Host ('     Created project {0}' -f $created.project.id)

  Write-Host '3/4  Creating the tables...'
  $env:DATABASE_URL = $uri
  try {
    & npm run db:migrate
    if ($LASTEXITCODE -ne 0) { throw 'Creating the tables failed.' }
  } finally {
    Remove-Item Env:DATABASE_URL -ErrorAction SilentlyContinue
  }

  Write-Host '4/4  Saving DATABASE_URL to web\.env ...'
  $envFile = Join-Path $webRoot '.env'
  $kept = @()
  if (Test-Path $envFile) {
    $kept = @(Get-Content -ErrorAction Stop $envFile | Where-Object { $_ -notmatch '^\s*DATABASE_URL=' })
  }
  [System.IO.File]::WriteAllLines($envFile, [string[]](@("DATABASE_URL=$uri") + $kept))
  & git check-ignore -q $envFile
  if ($LASTEXITCODE -ne 0) { Write-Warning 'web\.env is not git-ignored. Do not commit it.' }

  Write-Host ''
  Write-Host 'Done. Your new database is ready and its connection string is saved in web\.env.'
  Write-Host 'It was not printed. Your old Neon projects were not changed.'
} catch {
  Write-Host ''
  Write-Host ('Stopped: {0}' -f $_.Exception.Message) -ForegroundColor Red
  exit 1
} finally {
  Remove-Variable uri -ErrorAction SilentlyContinue
  Pop-Location
}
