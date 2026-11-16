# Windows PowerShell 5.1 / PowerShell 7. This is the bounded startup gate for #36.
# It deliberately cannot report combat PASS before a combat driver exists.
[CmdletBinding()]
param(
    [string]$InstallPath = 'G:\Steam\steamapps\common\Stellaris',
    [string]$TestRoot = 'G:\EPOCH-Stellaris-Test',
    [string]$Revision = 'HEAD',
    [ValidateSet('DirectX11', 'Default')][string]$Renderer = 'DirectX11',
    [ValidateSet('UserdirFile', 'Argument')][string]$ProfileMethod = 'UserdirFile',
    [ValidateSet('Direct', 'Steam')][string]$LaunchMethod = 'Direct',
    [switch]$DebugMode,
    [switch]$LoadCandidate,
    [switch]$SeedProbe,
    [string]$SeedFixtureDirectory,
    [switch]$BattleAttempt,
    [switch]$FirstMonthOrder,
    [ValidateRange(1, 2000)][int]$CandidateShips = 200,
    [switch]$StopAfterSeedLoad,
    [ValidateRange(5, 1800)][int]$TimeoutSeconds = 180
)

$ErrorActionPreference = 'Stop'
$repo = Split-Path -Parent $PSScriptRoot
$runId = [DateTime]::UtcNow.ToString('yyyyMMddTHHmmssfffZ') + '-' + [guid]::NewGuid().ToString('N').Substring(0, 8)
$regularProfile = Join-Path ([Environment]::GetFolderPath('MyDocuments')) 'Paradox Interactive\Stellaris'
$testProcess = $null
$reportPath = $null
$before = @()
$redirectPath = $null
$redirectValue = $null
$report = [ordered]@{
    schemaVersion = 1; harnessVersion = 'stage-iv-startup-gate-v2'
    scenarioVersion = $null; runnerSha256 = $null; powershellVersion = $PSVersionTable.PSVersion.ToString(); runId = $runId
    status = 'blocked'; reason = 'Startup gate has not completed.'
    startedUtc = [DateTime]::UtcNow.ToString('o'); finishedUtc = $null
    candidate = $null; installation = $null; startup = $null
    regularProfileUnchanged = $null; diagnostics = @(); artifacts = @()
    firstMonthOrder = $null
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

function Read-FirstMonthOrder([string]$LogPath, [string]$RunId) {
    if (-not (Test-Path -LiteralPath $LogPath -PathType Leaf)) { return }
    $pattern = 'EPOCH36\|run=' + [regex]::Escape($RunId) + '\|state=([a-z0-9-]+)(?=\||\s|$)'
    foreach ($line in Select-String -LiteralPath $LogPath -Pattern $pattern) {
        $line.Matches[0].Groups[1].Value
    }
}

try {
    if ($BattleAttempt -and -not $SeedFixtureDirectory) { throw 'BattleAttempt requires SeedFixtureDirectory.' }
    if ($FirstMonthOrder -and -not $SeedFixtureDirectory) { throw 'FirstMonthOrder requires SeedFixtureDirectory.' }
    if ($FirstMonthOrder -and ($BattleAttempt -or $StopAfterSeedLoad)) { throw 'FirstMonthOrder must run separately from BattleAttempt and StopAfterSeedLoad.' }
    if ($StopAfterSeedLoad -and -not $SeedFixtureDirectory) { throw 'StopAfterSeedLoad requires SeedFixtureDirectory.' }
    if ($SeedFixtureDirectory -and ($LoadCandidate -or $SeedProbe)) { throw 'SeedFixtureDirectory already stages candidate and probe; do not combine staging switches.' }
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
        profile = $testProfile; arguments = @('-gdpr-compliant')
        profileMethod = $ProfileMethod; temporaryRedirectRemoved = $null
        renderer = $Renderer; debugMode = [bool]$DebugMode; launchMethod = $LaunchMethod; commandLineObserved = $null
        processId = $null; startedUtc = $null; exitCode = $null; timedOut = $false
        timeoutSeconds = $TimeoutSeconds; freshEngineFiles = @(); crashEvents = @()
    }
    if ($ProfileMethod -eq 'Argument') { $report.startup.arguments += ('-userdir="' + $testProfile.Replace('\', '/') + '"') }
    if ($Renderer -eq 'DirectX11') { $report.startup.arguments += '-dx11' }
    if ($DebugMode) { $report.startup.arguments += '-debug_mode' }
    $before = @(Get-RegularMetadata)
    $before | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath (Join-Path $runDirectory 'regular-before.json') -Encoding UTF8

    $fixture = $null
    if ($SeedFixtureDirectory) {
        $fixture = Get-Content -LiteralPath (Join-Path $SeedFixtureDirectory 'fixture.json') -Raw | ConvertFrom-Json
        if ($fixture.scenarioVersion -ne 'seed-save-load-probe-v1') { throw 'Unsupported seed fixture.' }
        if (-not $PSBoundParameters.ContainsKey('Revision')) { $Revision = $fixture.modCommit }
        $fixtureSave = [IO.Path]::GetFullPath((Join-Path $SeedFixtureDirectory $fixture.saveRelativePath))
        $fixtureRoot = [IO.Path]::GetFullPath($SeedFixtureDirectory).TrimEnd('\', '/') + '\'
        if (-not $fixtureSave.StartsWith($fixtureRoot, [StringComparison]::OrdinalIgnoreCase)) { throw 'Fixture save escapes its directory.' }
        if ((Get-FileHash -LiteralPath $fixtureSave -Algorithm SHA256).Hash.ToLowerInvariant() -ne $fixture.saveSha256) { throw 'Fixture save hash mismatch.' }
    }
    $commit = & git -C $repo rev-parse --verify ($Revision + '^{commit}')
    if ($LASTEXITCODE -ne 0 -or $commit -notmatch '^[0-9a-f]{40}$') { throw 'Cannot resolve candidate Git commit.' }
    $report.candidate = [ordered]@{ commit = [string]$commit; loadedInEngine = $false; snapshotSha256 = $null }
    $snapshot = Join-Path $runDirectory 'candidate.zip'
    & git -C $repo archive --format=zip ('--output=' + $snapshot) $commit common events localisation gfx interface compatibility descriptor.mod thumbnail.png
    if ($LASTEXITCODE -ne 0) { throw 'Cannot archive exact candidate mod content.' }
    $report.candidate.snapshotSha256 = (Get-FileHash -LiteralPath $snapshot -Algorithm SHA256).Hash.ToLowerInvariant()
    $enabledMods = @()
    if ($fixture -and $commit -ne $fixture.modCommit) { throw 'Fixture and candidate mod commits differ.' }
    if ($LoadCandidate -or $fixture) {
        $modDirectory = Join-Path $testProfile 'mod\epoch-candidate'
        Expand-Archive -LiteralPath $snapshot -DestinationPath $modDirectory
        $descriptor = [IO.File]::ReadAllText((Join-Path $modDirectory 'descriptor.mod'))
        [IO.File]::WriteAllText((Join-Path $testProfile 'mod\epoch-candidate.mod'), ($descriptor + "`npath=""" + $modDirectory.Replace('\', '/') + """`n"), [Text.UTF8Encoding]::new($false))
        $enabledMods += 'mod/epoch-candidate.mod'
    }
    if ($SeedProbe -or $fixture) {
        if (-not ($LoadCandidate -or $fixture)) { throw 'SeedProbe requires LoadCandidate.' }
        $probeDirectory = Join-Path $testProfile 'mod\epoch36-probe'
        Copy-Item -LiteralPath (Join-Path $repo 'test-mods\stage-iv-engine-probe') -Destination $probeDirectory -Recurse
        Get-ChildItem -LiteralPath (Join-Path $probeDirectory 'events') -Filter '*.txt.in' | Remove-Item
        $probeEvents = Join-Path $probeDirectory 'events\epoch36_events.txt'
        $markerRunId = if ($fixture) { $fixture.runId } else { $runId }
        [IO.File]::WriteAllText($probeEvents, ([IO.File]::ReadAllText($probeEvents).Replace('__RUN_ID__', $markerRunId).Replace('__RUN_FLAG__', $markerRunId.Replace('-', '_'))), [Text.UTF8Encoding]::new($false))
        $probeDescriptor = [IO.File]::ReadAllText((Join-Path $probeDirectory 'descriptor.mod'))
        [IO.File]::WriteAllText((Join-Path $testProfile 'mod\epoch36-probe.mod'), ($probeDescriptor + "`npath=""" + $probeDirectory.Replace('\', '/') + """`n"), [Text.UTF8Encoding]::new($false))
        $enabledMods += 'mod/epoch36-probe.mod'
        $report.scenarioVersion = 'seed-save-load-probe-v1'
    }
    # Native JSON input must not depend on Windows PowerShell's UTF-8 BOM.
    [IO.File]::WriteAllText((Join-Path $testProfile 'dlc_load.json'), ([ordered]@{ disabled_dlcs = @(); enabled_mods = $enabledMods } | ConvertTo-Json), [Text.UTF8Encoding]::new($false))
    if ($fixture) {
        # Product files always come from the verified Git archive, not a mutable
        # fixture mod directory. Probe scripts come from this runner checkout.
        foreach ($name in @('save games', 'settings.txt', 'continue_game.json')) {
            Copy-Item -LiteralPath (Join-Path $SeedFixtureDirectory $name) -Destination $testProfile -Recurse -Force
        }
        $report.scenarioVersion = $fixture.scenarioVersion
        $report.candidate.seedSourceRunId = $fixture.runId
        $report.candidate.seedSaveSha256 = $fixture.saveSha256
        if (-not $FirstMonthOrder) { $report.startup.arguments += '-continuelastsave' }
        if ($BattleAttempt -or $FirstMonthOrder) {
            $templates = Join-Path $repo 'test-mods\stage-iv-engine-probe\events'
            $probeActions = Join-Path $probeDirectory 'common\on_actions\epoch36_on_actions.txt'
            $battleFile = Join-Path $probeDirectory 'events\epoch36_battle_attempt.txt'
            $battleText = [IO.File]::ReadAllText((Join-Path $templates 'epoch36_battle_attempt.txt.in'))
            $economy = 'add_resource = { energy = 1000000 alloys = 1000000 minerals = 1000000 }'
            $observation = "set_variable = { which = epoch36_observed_days value = 0 }`n  country_event = { id = epoch36.12 days = 1 }"
            $report.candidate.battleProbe = 'stage-iv-setup-probe-v2'
            if ($FirstMonthOrder) {
                $report.candidate.battleProbe = 'stage-iv-first-month-order-v1'
                if (-not $PSBoundParameters.ContainsKey('CandidateShips')) { $CandidateShips = 1000 }
                $economy = "add_modifier = { modifier = epoch36_first_month_budget days = 60 }`n  add_resource = { energy = 50000 alloys = 50000 minerals = 50000 food = 50000 consumer_goods = 50000 }"
                $observation = 'set_country_flag = epoch36_first_month_pending'
                $monthText = [IO.File]::ReadAllText((Join-Path $templates 'epoch36_first_month.txt.in'))
                $monthText = $monthText.Replace('__RUN_ID__', $runId).Replace('__RUN_FLAG__', $fixture.runId.Replace('-', '_'))
                [IO.File]::WriteAllText((Join-Path $probeDirectory 'events\epoch36_first_month.txt'), $monthText, [Text.UTF8Encoding]::new($false))
                Add-Content -LiteralPath $probeActions -Value 'on_single_player_save_game_load = { events = { epoch36.15 } } on_monthly_pulse = { events = { epoch36.20 } }' -Encoding ASCII
            } else {
                Add-Content -LiteralPath $probeActions -Value 'on_single_player_save_game_load = { events = { epoch36.10 } }' -Encoding ASCII
                Add-Content -LiteralPath $probeActions -Value 'on_fleet_combat_joined_attacker = { events = { epoch36.13 } } on_fleet_combat_joined_defender = { events = { epoch36.13 } } on_fleet_exit_battle = { events = { epoch36.14 } }' -Encoding ASCII
            }
            $report.candidate.candidateShips = $CandidateShips
            $ships = (1..$CandidateShips | ForEach-Object { 'create_ship = { design = "NAME_EPOCH_III_Enforcer" graphical_culture = mammalian_01 }' }) -join "`n"
            $battleText = $battleText.Replace('__RUN_ID__', $runId).Replace('__CANDIDATE_SHIPS__', $ships)
            $battleText = $battleText.Replace('__ECONOMY_SETUP__', $economy).Replace('__OBSERVATION_START__', $observation)
            [IO.File]::WriteAllText($battleFile, $battleText, [Text.UTF8Encoding]::new($false))
        }
    }

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
    if ($ProfileMethod -eq 'UserdirFile') {
        $redirectPath = Join-Path $InstallPath 'userdir.txt'
        if (Test-Path -LiteralPath $redirectPath) { $redirectPath = $null; throw 'Existing userdir.txt will not be overwritten.' }
        $redirectValue = $testProfile.Replace('\', '/')
        [IO.File]::WriteAllText($redirectPath, $redirectValue, [Text.Encoding]::ASCII)
    }
    $launchUtc = [DateTime]::UtcNow
    $report.startup.startedUtc = $launchUtc.ToString('o')
    if ($LaunchMethod -eq 'Steam') {
        if (-not (Get-Process -Name steam -ErrorAction SilentlyContinue)) { throw 'Steam must already be running.' }
        $steamPath = (Get-Process -Name steam | Select-Object -First 1).Path
        $handoff = Start-Process -FilePath $steamPath -ArgumentList (@('-applaunch', '281990') + $report.startup.arguments) -PassThru
        $handoff.WaitForExit(10000) | Out-Null
        $report.startup.steamHandoffExitCode = if ($handoff.HasExited) { $handoff.ExitCode } else { $null }
        $gameDeadline = $launchUtc.AddSeconds($TimeoutSeconds)
        while (-not $testProcess -and [DateTime]::UtcNow -lt $gameDeadline) {
            $testProcess = Get-Process -Name stellaris -ErrorAction SilentlyContinue | Where-Object { $_.StartTime.ToUniversalTime() -ge $launchUtc } | Select-Object -First 1
            if (-not $testProcess) { Start-Sleep -Milliseconds 250 }
        }
        if (-not $testProcess) { throw 'No Stellaris child observed before launcher timeout.' }
        $null = $testProcess.Handle
    } else {
        $testProcess = Start-Process -FilePath $exe -WorkingDirectory $InstallPath -ArgumentList $report.startup.arguments -PassThru
    }
    $report.startup.processId = $testProcess.Id
    try {
        $report.startup.commandLineObserved = (Get-CimInstance Win32_Process -Filter ('ProcessId=' + $testProcess.Id) -ErrorAction Stop).CommandLine
    } catch { $report.diagnostics += 'Actual process command line unavailable.' }
    $deadline = $launchUtc.AddSeconds($TimeoutSeconds)
    $liveLog = Join-Path $testProfile 'logs\game.log'
    while (-not $testProcess.WaitForExit(250)) {
        if ($FirstMonthOrder) {
            $states = @(Read-FirstMonthOrder $liveLog $runId)
            if ($states -contains 'first-month-ended' -or $states -contains 'first-month-invalid-start') {
                $report.startup.stopReason = 'first_month_probe_finished'
            }
        } elseif ($fixture -and $StopAfterSeedLoad) {
            $loadMarker = 'EPOCH36|run=' + $fixture.runId + '|state=marker-present'
            if ((Test-Path -LiteralPath $liveLog) -and (Select-String -LiteralPath $liveLog -SimpleMatch $loadMarker -Quiet)) {
                $report.startup.stopReason = 'seed_marker_observed'
            }
        }
        if ($report.startup.stopReason) {
            if (-not $testProcess.HasExited) { Stop-Process -Id $testProcess.Id }
            if (-not $testProcess.WaitForExit(5000)) { throw 'Test process could not be confirmed stopped after the observation.' }
            break
        }
        if ([DateTime]::UtcNow -ge $deadline) {
            $report.startup.timedOut = $true
            $testProcess.Refresh()
            if ($testProcess.HasExited) { $report.startup.timedOut = $false; break }
            Stop-Process -Id $testProcess.Id -ErrorAction Stop
            if (-not $testProcess.WaitForExit(5000)) { throw 'Timed-out process could not be confirmed stopped.' }
            break
        }
    }
    $report.startup.exitCode = $testProcess.ExitCode
    # Read only this invocation's new profile. No historical log fallback.
    # Retain evidence files, not thousands of shader/account/cache artifacts.
    $freshFiles = @(Get-ChildItem -LiteralPath $testProfile -Recurse -File | Where-Object {
        $_.LastWriteTimeUtc -ge $launchUtc -and
        ($_.FullName.StartsWith((Join-Path $testProfile 'logs\'), [StringComparison]::OrdinalIgnoreCase) -or
         $_.Name -in @('settings.txt', 'continue_game.json'))
    })
    $report.startup.freshEngineFiles = @($freshFiles | ForEach-Object {
        [ordered]@{ file = $_.FullName.Substring($testProfile.Length + 1); length = $_.Length; sha256 = (Get-FileHash -LiteralPath $_.FullName -Algorithm SHA256).Hash.ToLowerInvariant() }
    })
    $systemLog = Join-Path $testProfile 'logs\system.log'
    $setupLog = Join-Path $testProfile 'logs\setup.log'
    if (@($freshFiles | Where-Object { $_.FullName -eq $systemLog -and $_.Length -gt 0 }).Count -and @($freshFiles | Where-Object { $_.FullName -eq $setupLog -and $_.Length -gt 0 }).Count) {
        $report.checks.isolatedProfile = 'fresh_system_and_setup_logs'
    }
    if ((Test-Path -LiteralPath $setupLog) -and (Select-String -LiteralPath $setupLog -Pattern 'tag = epoch_iv_judge_body' -Quiet)) {
        $report.candidate.loadedInEngine = $true
        $report.checks.modLoaded = 'epoch_setup_entries_observed'
    }
    if ($fixture) {
        $seedLog = Join-Path $testProfile 'logs\game.log'
        $marker = 'EPOCH36|run=' + $fixture.runId + '|state=marker-present'
        if ((Test-Path -LiteralPath $seedLog) -and (Select-String -LiteralPath $seedLog -SimpleMatch $marker -Quiet)) {
            $report.checks.scenarioLoaded = 'persisted_seed_marker_observed'
            # A UI Load or launcher Resume can produce this same native hook.
            # The marker proves save identity, never the route used to load it.
            if (-not $FirstMonthOrder) { $report.checks.continueLastSave = 'argument_passed_route_requires_observation' }
        }
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
    if ($report.checks.scenarioLoaded -eq 'persisted_seed_marker_observed') {
        $report.reason = 'Persisted seed marker observed; load route requires observation. Combat/retreat/180-day regression remains unverified.'
    }
    if ($FirstMonthOrder) {
        $states = @(Read-FirstMonthOrder $liveLog $runId)
        $result = [ordered]@{
            status = 'blocked'; reason = 'Missing verified fixture load or complete first monthly observation.'
            observedOrder = ($states -contains 'first-month-order-observed')
            missing = @($states | Where-Object { $_ -like 'missing-*' } | Sort-Object -Unique)
            markers = $states
        }
        if ($states -contains 'first-month-invalid-start') {
            $result.reason = 'Expected the marked fixture with one unassigned, unprepared default AI empire.'
        } elseif ($report.candidate.loadedInEngine -and $report.checks.scenarioLoaded -eq 'persisted_seed_marker_observed' -and
            $states -contains 'first-month-pulse' -and $states -contains 'first-month-ended') {
            if ($result.missing.Count) { $result.reason = 'Scenario prerequisites missing: ' + ($result.missing -join ', ') }
            elseif ($result.observedOrder) {
                $result.status = 'passed'
                $result.reason = 'Production assigned the marked AI fleet to the personal guardian at the first monthly pulse.'
            } elseif ($states -contains 'first-month-unverified-order') {
                $result.reason = 'An attack flag appeared without verified ownership and candidate identity.'
            } elseif ($states -contains 'first-month-fleet-checked') {
                $result.reason = 'No order observed although the pulse observer found no missing prerequisite.'
            }
        }
        $report.firstMonthOrder = $result
    }
} catch {
    $report.reason = $_.Exception.Message
} finally {
    if ($testProcess -and -not $testProcess.HasExited) {
        Stop-Process -Id $testProcess.Id -ErrorAction SilentlyContinue
        if (-not $testProcess.WaitForExit(5000)) { $report.diagnostics += 'Own process could not be confirmed stopped within five seconds.' }
    }
    if ($redirectPath -and (Test-Path -LiteralPath $redirectPath)) {
        if ([IO.File]::ReadAllText($redirectPath) -ceq $redirectValue) {
            Remove-Item -LiteralPath $redirectPath
            $report.startup.temporaryRedirectRemoved = $true
        } else { $report.diagnostics += 'userdir.txt changed externally; retained without overwrite/removal.' }
    }
    if ($reportPath) {
        $after = @(Get-RegularMetadata)
        $report.regularProfileUnchanged = (($before | ConvertTo-Json -Depth 5 -Compress) -ceq ($after | ConvertTo-Json -Depth 5 -Compress))
        $after | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath (Join-Path $runDirectory 'regular-after.json') -Encoding UTF8
        if (-not $report.regularProfileUnchanged) { $report.reason += ' Regular profile metadata changed; isolation is not established.' }
        if ($report.firstMonthOrder) {
            if ($report.firstMonthOrder.status -eq 'passed' -and
                (-not $report.regularProfileUnchanged -or $report.startup.temporaryRedirectRemoved -ne $true -or
                 $report.checks.isolatedProfile -ne 'fresh_system_and_setup_logs' -or $report.startup.timedOut -or
                 $report.startup.crashEvents.Count)) {
                $report.firstMonthOrder.status = 'blocked'
                $report.firstMonthOrder.reason = 'Order observed, but the run did not establish clean isolation, completion and cleanup.'
            }
            Write-Output "First monthly order: $($report.firstMonthOrder.status). $($report.firstMonthOrder.reason)"
        }
        $report.finishedUtc = [DateTime]::UtcNow.ToString('o')
        $report.artifacts = @(Get-ChildItem -LiteralPath $runDirectory -File | ForEach-Object { [ordered]@{ file = $_.Name; sha256 = (Get-FileHash -LiteralPath $_.FullName -Algorithm SHA256).Hash.ToLowerInvariant() } })
        $report | ConvertTo-Json -Depth 12 | Set-Content -LiteralPath $reportPath -Encoding UTF8
        if ($report.firstMonthOrder) { Write-Output "Full combat regression BLOCKED: $($report.reason)" }
        else { Write-Output "BLOCKED: $($report.reason)" }
        Write-Output "Report: $reportPath"
    } else {
        Write-Output "BLOCKED: $($report.reason)"
    }
}
# A successful preflight must never masquerade as the requested regression.
if ($report.firstMonthOrder -and $report.firstMonthOrder.status -eq 'passed') { exit 0 }
exit 3
