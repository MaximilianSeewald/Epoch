# Windows PowerShell 5.1 / PowerShell 7. This is the bounded startup gate for #36.
# It deliberately cannot report combat PASS before a combat driver exists.
[CmdletBinding()]
param(
    [string]$InstallPath = 'G:\Steam\steamapps\common\Stellaris',
    [string]$TestRoot = 'G:\EPOCH-Stellaris-Test',
    [string]$Revision = 'HEAD',
    [ValidateRange(5, 300)][int]$TimeoutSeconds = 60
)

$ErrorActionPreference = 'Stop'
$repo = Split-Path -Parent $PSScriptRoot
$runId = [DateTime]::UtcNow.ToString('yyyyMMddTHHmmssfffZ') + '-' + [guid]::NewGuid().ToString('N').Substring(0, 8)
$regularProfile = Join-Path ([Environment]::GetFolderPath('MyDocuments')) 'Paradox Interactive\Stellaris'
$testProcess = $null
$reportPath = $null
$before = @()
$report = [ordered]@{
    schemaVersion = 1; harnessVersion = 'stage-iv-startup-gate-v1'
    scenarioVersion = $null; runnerSha256 = $null; powershellVersion = $PSVersionTable.PSVersion.ToString(); runId = $runId
    status = 'blocked'; reason = 'Startup gate has not completed.'
    startedUtc = [DateTime]::UtcNow.ToString('o'); finishedUtc = $null
    candidate = $null; installation = $null; startup = $null
    regularProfileUnchanged = $null; diagnostics = @(); artifacts = @()
    checks = [ordered]@{
        isolatedProfile = 'not_observed'; modLoaded = 'not_attempted'
        scenarioLoaded = 'not_attempted'; continueLastSave = 'not_attempted'
        observe = 'not_attempted'; fastForward = 'not_attempted'
        attackAndCombat = 'not_attempted'; survivingRetreat = 'not_attempted'
        noOrderFor180Days = 'not_attempted'; monthlyReattack = 'not_attempted'
        brokenBaseline = 'not_attempted'; fixedRepeat = 'not_attempted'
    }
}

function Get-RegularMetadata {
    # Metadata only: never read, copy, enumerate or load regular saves/playsets.
    $result = @()
    foreach ($relative in @('settings.txt', 'dlc_load.json', 'logs\system.log', 'logs\setup.log', 'logs\error.log', 'logs\game.log', 'logs\debug.log')) {
        $file = Join-Path $regularProfile $relative
        if (Test-Path -LiteralPath $file -PathType Leaf) {
            $item = Get-Item -LiteralPath $file
            $result += [ordered]@{ file = $relative; length = $item.Length; writtenUtc = $item.LastWriteTimeUtc.ToString('o') }
        }
    }
    return $result
}

function Read-OwnCrash([int]$ProcessId, [datetime]$SinceUtc) {
    # Use XML field names, independent of Windows display language. No WER dump
    # or raw stdout is published (the Steam crash handler prints account IDs).
    $result = @()
    try {
        $events = Get-WinEvent -FilterHashtable @{ LogName = 'Application'; Id = 1000; StartTime = $SinceUtc.ToLocalTime() } -ErrorAction Stop
        foreach ($event in $events) {
            $xml = [xml]$event.ToXml()
            $fields = @{}
            foreach ($entry in $xml.Event.EventData.Data) { $fields[[string]$entry.Name] = [string]$entry.'#text' }
            if ($fields.AppName -ine 'stellaris.exe') { continue }
            $eventPid = if ($fields.ProcessId -match '^0x') { [Convert]::ToInt32($fields.ProcessId.Substring(2), 16) } else { [int]$fields.ProcessId }
            if ($eventPid -ne $ProcessId -or $event.TimeCreated.ToUniversalTime() -lt $SinceUtc) { continue }
            $result += [ordered]@{
                eventId = $event.Id; recordId = $event.RecordId
                timeUtc = $event.TimeCreated.ToUniversalTime().ToString('o')
                processId = $eventPid; application = $fields.AppName
                module = $fields.ModuleName; exceptionCode = $fields.ExceptionCode
                faultingOffset = $fields.FaultingOffset
            }
        }
    } catch {
        $report.diagnostics += 'Windows Application event log unavailable or no matching event; process exit code remains primary evidence.'
    }
    return $result
}

try {
    $fullRoot = [IO.Path]::GetFullPath($TestRoot).TrimEnd('\', '/')
    $regularFull = [IO.Path]::GetFullPath($regularProfile).TrimEnd('\', '/')
    # No writing within, or above, the regular profile; reject reparse points on
    # the target ancestry so a junction cannot redirect the dedicated profile.
    if ($fullRoot -ieq $regularFull -or $fullRoot.StartsWith($regularFull + '\', [StringComparison]::OrdinalIgnoreCase) -or $regularFull.StartsWith($fullRoot + '\', [StringComparison]::OrdinalIgnoreCase)) {
        throw 'TestRoot overlaps the regular Stellaris profile.'
    }
    $ancestor = $fullRoot
    while ($ancestor) {
        if ((Test-Path -LiteralPath $ancestor) -and ((Get-Item -LiteralPath $ancestor -Force).Attributes -band [IO.FileAttributes]::ReparsePoint)) { throw 'TestRoot ancestry contains a reparse point.' }
        $ancestor = Split-Path -Parent $ancestor
    }
    $runDirectory = Join-Path $fullRoot ('runs\' + $runId)
    $testProfile = Join-Path $runDirectory 'profile'
    New-Item -ItemType Directory -Path $testProfile -ErrorAction Stop | Out-Null
    $reportPath = Join-Path $runDirectory 'report.json'
    $report.runnerSha256 = (Get-FileHash -LiteralPath $PSCommandPath -Algorithm SHA256).Hash.ToLowerInvariant()
    $report.startup = [ordered]@{
        profile = $testProfile; arguments = @(('-userdir="' + $testProfile.Replace('\', '/') + '"'), '-debug_mode')
        processId = $null; startedUtc = $null; exitCode = $null; timedOut = $false
        timeoutSeconds = $TimeoutSeconds; freshEngineFiles = @(); crashEvents = @()
    }
    $before = @(Get-RegularMetadata)
    $before | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath (Join-Path $runDirectory 'regular-before.json') -Encoding UTF8

    $commit = & git -C $repo rev-parse --verify ($Revision + '^{commit}')
    if ($LASTEXITCODE -ne 0 -or $commit -notmatch '^[0-9a-f]{40}$') { throw 'Cannot resolve candidate Git commit.' }
    $report.candidate = [ordered]@{ commit = [string]$commit; loadedInEngine = $false; snapshotSha256 = $null }
    $snapshot = Join-Path $runDirectory 'candidate.zip'
    & git -C $repo archive --format=zip ('--output=' + $snapshot) $commit common events localisation gfx interface compatibility descriptor.mod thumbnail.png
    if ($LASTEXITCODE -ne 0) { throw 'Cannot archive exact candidate mod content.' }
    $report.candidate.snapshotSha256 = (Get-FileHash -LiteralPath $snapshot -Algorithm SHA256).Hash.ToLowerInvariant()

    $exe = Join-Path $InstallPath 'stellaris.exe'
    $launcherPath = Join-Path $InstallPath 'launcher-settings.json'
    $manifestPath = Join-Path (Split-Path -Parent (Split-Path -Parent $InstallPath)) 'appmanifest_281990.acf'
    $launcher = Get-Content -LiteralPath $launcherPath -Raw | ConvertFrom-Json
    $manifest = Get-Content -LiteralPath $manifestPath -Raw
    $build = [regex]::Match($manifest, '"buildid"\s+"(\d+)"').Groups[1].Value
    $report.installation = [ordered]@{
        version = $launcher.rawVersion; launcherVersion = $launcher.version
        checksumFromLauncher = [regex]::Match($launcher.version, '\(([0-9a-f]+)\)').Groups[1].Value
        checksumObservedInEngine = $null; steamBuildId = $build
        exeSha256 = (Get-FileHash -LiteralPath $exe -Algorithm SHA256).Hash.ToLowerInvariant()
    }
    Copy-Item -LiteralPath $launcherPath -Destination (Join-Path $runDirectory 'launcher-settings.json')
    # Do not archive the Steam manifest: it includes account identifiers.
    if ($launcher.rawVersion -ne 'v4.5.4' -or $build -ne '26557690') { throw 'Installed build differs from approved 4.5.4 / 26557690; no launch performed.' }
    if (Get-Process -Name stellaris -ErrorAction SilentlyContinue) { throw 'An existing Stellaris process is running; no launch performed.' }
    $launchUtc = [DateTime]::UtcNow
    $report.startup.startedUtc = $launchUtc.ToString('o')
    $testProcess = Start-Process -FilePath $exe -WorkingDirectory $InstallPath -ArgumentList $report.startup.arguments -PassThru
    $report.startup.processId = $testProcess.Id
    $deadline = $launchUtc.AddSeconds($TimeoutSeconds)
    while (-not $testProcess.WaitForExit(250)) {
        if ([DateTime]::UtcNow -ge $deadline) {
            $report.startup.timedOut = $true
            Stop-Process -Id $testProcess.Id -ErrorAction Stop
            if (-not $testProcess.WaitForExit(5000)) { throw 'Timed-out process could not be confirmed stopped.' }
            break
        }
    }
    $report.startup.exitCode = $testProcess.ExitCode
    # Read only this invocation's new profile. No historical log fallback.
    $freshFiles = @(Get-ChildItem -LiteralPath $testProfile -Recurse -File | Where-Object { $_.LastWriteTimeUtc -ge $launchUtc })
    $report.startup.freshEngineFiles = @($freshFiles | ForEach-Object {
        [ordered]@{ file = $_.FullName.Substring($testProfile.Length + 1); length = $_.Length; sha256 = (Get-FileHash -LiteralPath $_.FullName -Algorithm SHA256).Hash.ToLowerInvariant() }
    })
    $systemLog = Join-Path $testProfile 'logs\system.log'
    $setupLog = Join-Path $testProfile 'logs\setup.log'
    if (@($freshFiles | Where-Object { $_.FullName -eq $systemLog -and $_.Length -gt 0 }).Count -and @($freshFiles | Where-Object { $_.FullName -eq $setupLog -and $_.Length -gt 0 }).Count) {
        $report.checks.isolatedProfile = 'fresh_system_and_setup_logs'
    }
    $errorLog = Join-Path $testProfile 'logs\error.log'
    if (@($freshFiles | Where-Object { $_.FullName -eq $errorLog }).Count -and (Get-Command node -ErrorAction SilentlyContinue)) {
        & node (Join-Path $PSScriptRoot 'test_stellaris_runtime_log.cjs') $errorLog *> (Join-Path $runDirectory 'runtime-classifier.txt')
        $report.diagnostics += "Runtime classifier exit: $LASTEXITCODE. Startup only; this is not combat evidence."
    }
    $report.startup.crashEvents = @(Read-OwnCrash $testProcess.Id $launchUtc)
    if ($report.startup.timedOut) { $report.reason = 'Startup timeout. No verified scenario/load/combat driver is implemented.' }
    elseif ($testProcess.ExitCode -ne 0) { $report.reason = 'Stellaris exited before a verified scenario load. See startup.exitCode and crashEvents.' }
    else { $report.reason = 'Process ended; scenario identity, loading and combat remain unverified.' }
} catch {
    $report.reason = $_.Exception.Message
} finally {
    if ($testProcess -and -not $testProcess.HasExited) {
        Stop-Process -Id $testProcess.Id -ErrorAction SilentlyContinue
        if (-not $testProcess.WaitForExit(5000)) { $report.diagnostics += 'Own process could not be confirmed stopped within five seconds.' }
    }
    if ($reportPath) {
        $after = @(Get-RegularMetadata)
        $report.regularProfileUnchanged = (($before | ConvertTo-Json -Depth 5 -Compress) -ceq ($after | ConvertTo-Json -Depth 5 -Compress))
        $after | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath (Join-Path $runDirectory 'regular-after.json') -Encoding UTF8
        if (-not $report.regularProfileUnchanged) { $report.reason += ' Regular profile metadata changed; isolation is not established.' }
        $report.finishedUtc = [DateTime]::UtcNow.ToString('o')
        $report.artifacts = @(Get-ChildItem -LiteralPath $runDirectory -File | ForEach-Object { [ordered]@{ file = $_.Name; sha256 = (Get-FileHash -LiteralPath $_.FullName -Algorithm SHA256).Hash.ToLowerInvariant() } })
        $report | ConvertTo-Json -Depth 12 | Set-Content -LiteralPath $reportPath -Encoding UTF8
        Write-Output "BLOCKED: $($report.reason)"
        Write-Output "Report: $reportPath"
    } else {
        Write-Output "BLOCKED: $($report.reason)"
    }
}
# A successful preflight must never masquerade as the requested regression.
exit 3
