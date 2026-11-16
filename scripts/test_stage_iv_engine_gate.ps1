# Game-independent failure-path tests. Never launches Stellaris.
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$sandbox = Join-Path ([IO.Path]::GetTempPath()) ('epoch-engine-gate-' + [guid]::NewGuid().ToString('N'))
$runner = Join-Path $PSScriptRoot 'test_stage_iv_engine.ps1'
$hostExe = (Get-Process -Id $PID).Path
New-Item -ItemType Directory -Path $sandbox | Out-Null

# A stale log in another run must not become evidence for this invocation.
$stale = Join-Path $sandbox 'runs\old\profile\logs'
New-Item -ItemType Directory -Path $stale -Force | Out-Null
Set-Content -LiteralPath (Join-Path $stale 'system.log') -Value 'stale fixture'
Set-Content -LiteralPath (Join-Path $stale 'setup.log') -Value 'stale fixture'
$missing = Join-Path $sandbox 'no-installation'
& $hostExe -NoProfile -File $runner -InstallPath $missing -TestRoot $sandbox -TimeoutSeconds 5
if ($LASTEXITCODE -ne 3) { throw 'Missing installation must return blocked exit 3.' }
$reports = @(Get-ChildItem -LiteralPath (Join-Path $sandbox 'runs') -Filter report.json -Recurse)
if ($reports.Count -ne 1) { throw 'Expected exactly one fresh report.' }
$report = Get-Content -LiteralPath $reports[0].FullName -Raw | ConvertFrom-Json
if ($report.status -ne 'blocked' -or $report.startup.processId -or $report.startup.freshEngineFiles.Count -ne 0) { throw 'Missing installation or stale logs produced false engine evidence.' }
if ($report.checks.isolatedProfile -ne 'not_observed' -or $report.candidate.loadedInEngine) { throw 'Unexpected isolation/mod-load claim.' }
if (-not $report.regularProfileUnchanged) { throw 'Regular profile metadata changed.' }

# Reject overlap before creating anything in the regular profile.
$regular = Join-Path ([Environment]::GetFolderPath('MyDocuments')) 'Paradox Interactive\Stellaris'
$output = & $hostExe -NoProfile -File $runner -TestRoot $regular -InstallPath $missing 2>&1
if ($LASTEXITCODE -ne 3 -or ($output -join "`n") -notmatch 'overlaps the regular Stellaris profile') { throw 'Regular-profile overlap was not rejected.' }
Write-Output 'PASS: startup gate rejects missing installation, stale logs and regular-profile overlap. No engine test.'
Write-Output "Fixtures retained: $sandbox"
