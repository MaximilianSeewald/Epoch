param(
	[string]$Root = (Split-Path -Parent $PSScriptRoot),
	[string]$LogDirectory = (Join-Path ([Environment]::GetFolderPath('MyDocuments')) 'Paradox Interactive/Stellaris/logs')
)

$ErrorActionPreference = 'Stop'
$script:Failures = [System.Collections.Generic.List[string]]::new()
$script:Checks = 0

function Assert-Check([bool]$Condition, [string]$Message) {
	$script:Checks++
	if (-not $Condition) { $script:Failures.Add($Message) }
}

function Read-ProjectFile([string]$RelativePath) {
	$path = Join-Path $Root $RelativePath
	if (-not (Test-Path -LiteralPath $path -PathType Leaf)) { throw "Missing file: $RelativePath" }
	return [System.IO.File]::ReadAllText($path, [System.Text.Encoding]::UTF8)
}

function Get-Block([string]$Text, [string]$Pattern, [string]$Label) {
	$match = [regex]::Match($Text, $Pattern)
	if (-not $match.Success) { return $null }
	$open = $Text.LastIndexOf('{', $match.Index + $match.Length - 1)
	if ($open -lt 0) { return $null }
	$depth = 0; $quoted = $false; $comment = $false
	for ($i = $open; $i -lt $Text.Length; $i++) {
		$c = $Text[$i]
		if ($comment) { if ($c -eq "`n") { $comment = $false }; continue }
		if (-not $quoted -and $c -eq '#') { $comment = $true; continue }
		if ($c -eq '"') { $quoted = -not $quoted; continue }
		if (-not $quoted) {
			if ($c -eq '{') { $depth++ }
			if ($c -eq '}') {
				$depth--
				if ($depth -eq 0) { return $Text.Substring($open, $i - $open + 1) }
			}
		}
	}
	return $null
}

function Get-EventBlock([string]$Text, [int]$Id) {
	return Get-Block $Text "(?m)^[ \t]*(?:country_event|ship_event|situation_event)[ \t]*=[ \t]*\{[ \t]*\r?\n[ \t]*id[ \t]*=[ \t]*epoch_core\.$Id[ \t]*\r?$" "epoch_core.$Id"
}

$eventPath = 'events/epoch_core_events.txt'
$situationPath = 'common/situations/epoch_core_situations.txt'
$projectPath = 'common/special_projects/epoch_core_projects.txt'
$onActionPath = 'common/on_actions/epoch_core_on_actions.txt'
$events = Read-ProjectFile $eventPath
$situations = Read-ProjectFile $situationPath
$projects = Read-ProjectFile $projectPath
$onActions = Read-ProjectFile $onActionPath

# Localization format, BOM, header, key syntax, duplication and language parity.
$localization = @{}
foreach ($language in @('english', 'german')) {
	$relative = "localisation/$language/epoch_core_l_$language.yml"
	$path = Join-Path $Root $relative
	$bytes = [System.IO.File]::ReadAllBytes($path)
	$hasBom = $bytes.Length -ge 3 -and $bytes[0] -eq 0xEF -and $bytes[1] -eq 0xBB -and $bytes[2] -eq 0xBF
	Assert-Check $hasBom "$relative must be UTF-8 with BOM"
	$text = [System.Text.Encoding]::UTF8.GetString($bytes, [Math]::Min(3, $bytes.Length), [Math]::Max(0, $bytes.Length - 3))
	$expectedHeader = "l_${language}:"
	$lines = $text -split "`r?`n"
	Assert-Check ($lines.Count -gt 0 -and $lines[0] -eq $expectedHeader) "$relative must begin with $expectedHeader"
	$keys = [System.Collections.Generic.List[string]]::new()
	$lineNumber = 0
	foreach ($line in $lines) {
		$lineNumber++
		if ([string]::IsNullOrWhiteSpace($line) -or $line -eq $expectedHeader) { continue }
		if ($line -notmatch '^\s*[A-Za-z0-9_.]+:\d+\s+".*"\s*$') {
			Assert-Check $false "$relative has invalid localization syntax at line $lineNumber"
			continue
		}
		$key = [regex]::Match($line, '^\s*([A-Za-z0-9_.]+):').Groups[1].Value
		if ($keys.Contains($key)) { Assert-Check $false "$relative contains duplicate key $key" }
		$keys.Add($key)
	}
	$localization[$language] = @($keys)
}
$languageDiff = Compare-Object @($localization.english | Sort-Object -Unique) @($localization.german | Sort-Object -Unique)
Assert-Check ($null -eq $languageDiff) 'English and German localization keys must match exactly'

$allLocKeys = @{}; foreach ($key in $localization.english) { $allLocKeys[$key] = $true }
$requiredSituationLocKeys = @(
	'epoch_first_echo_investigation', 'epoch_first_echo_investigation_type',
	'epoch_first_echo_investigation_desc', 'epoch_first_echo_investigation_monthly_change_tooltip',
	'stage_signal_analysis', 'stage_source_analysis',
	'epoch_first_echo_phase_signal', 'epoch_first_echo_phase_source'
)
foreach ($key in $requiredSituationLocKeys) { Assert-Check $allLocKeys.ContainsKey($key) "Missing situation/stage localization key $key" }
$textRefs = [regex]::Matches($events + "`n" + $situations, '(?:title|desc|text|name|custom_tooltip)\s*=\s*(epoch_core\.[A-Za-z0-9_.]+|epoch_first_echo_[A-Za-z0-9_]+|stage_(?:signal_analysis|source_analysis))')
foreach ($ref in $textRefs) { Assert-Check $allLocKeys.ContainsKey($ref.Groups[1].Value) "Missing EN/DE localization key $($ref.Groups[1].Value)" }
$projectKeys = @([regex]::Matches($projects, '(?m)^\s*key\s*=\s*"([A-Z0-9_]+)"') | ForEach-Object { $_.Groups[1].Value })
Assert-Check ($projectKeys.Count -eq (@($projectKeys | Sort-Object -Unique)).Count) 'Special project keys must be unique'
foreach ($key in $projectKeys) {
	Assert-Check $allLocKeys.ContainsKey($key) "Missing EN/DE project localization $key"
	Assert-Check $allLocKeys.ContainsKey("${key}_DESC") "Missing EN/DE project description localization ${key}_DESC"
}
$projectUses = @([regex]::Matches($events, 'name\s*=\s*"(EPOCH_[A-Z0-9_]+)"') | ForEach-Object { $_.Groups[1].Value } | Sort-Object -Unique)
foreach ($key in $projectUses) { Assert-Check ($key -in $projectKeys) "Event references undefined project $key" }

# Event ID coverage across event calls, project callbacks and on_action entries.
$eventDefinitions = @([regex]::Matches($events, '(?m)^\s*id\s*=\s*epoch_core\.(\d+)\s*$') | ForEach-Object { $_.Groups[1].Value } | Sort-Object -Unique)
$eventRefs = @([regex]::Matches($events + "`n" + $projects + "`n" + $onActions, '\bepoch_core\.(\d+)\b') | ForEach-Object { $_.Groups[1].Value } | Sort-Object -Unique)
foreach ($id in $eventRefs) { Assert-Check ($id -in $eventDefinitions) "Reference to undefined event epoch_core.$id" }
Assert-Check ($onActions -match 'on_survey_planet\s*=\s*\{[\s\S]*?epoch_core\.15' -and $onActions -match 'on_game_start_country\s*=\s*\{[\s\S]*?epoch_core\.1') 'Vanilla survey and country-start hooks must dispatch defined EPOCH entry events'

# Situation and stage references must exist and the midpoint event must enter
# only after the first ship-project callback advances progress to 50.
$situationBlock = Get-Block $situations '(?m)^\s*epoch_first_echo_investigation\s*=\s*\{' 'First Echo situation'
Assert-Check ($null -ne $situationBlock) 'First Echo situation definition is missing'
$sourceStage = Get-Block $situationBlock '(?m)^\s*stage_source_analysis\s*=\s*\{' 'source-analysis stage'
Assert-Check ($null -ne $sourceStage -and $sourceStage -match 'on_first_enter\s*=\s*\{\s*situation_event\s*=\s*\{\s*id\s*=\s*epoch_core\.3') 'epoch_core.3 must fire on entering the second stage'
$signalStage = Get-Block $situationBlock '(?m)^\s*stage_signal_analysis\s*=\s*\{' 'signal-analysis stage'
Assert-Check ($signalStage -notmatch 'situation_event\s*=\s*\{\s*id\s*=\s*epoch_core\.3') 'epoch_core.3 must not fire when the Situation is first created'
Assert-Check ($situationBlock -match 'stage_signal_analysis\s*=\s*\{[\s\S]*?end\s*=\s*50' -and $situationBlock -match 'stage_source_analysis\s*=\s*\{[\s\S]*?end\s*=\s*100') 'First Echo stage definitions or boundaries are missing'
Assert-Check ($situationBlock -match 'monthly_progress\s*=\s*\{\s*base\s*=\s*0\s*\}') 'Situation must not progress without a completed ship project'
Assert-Check ($situationBlock -match 'on_progress_complete\s*=\s*\{[\s\S]*?destroy_situation\s*=\s*this') 'Situation completion must close the situation'

# Trace every project/callback/decision edge, including the country-scope bridge
# used to avoid a Situation -> Country context switch when enabling projects.
$expectedCallbacks = @{
	'EPOCH_FIRST_ECHO_CAUTIOUS' = 10; 'EPOCH_FIRST_ECHO_AGGRESSIVE' = 10
	'EPOCH_ECHO_CALIBRATION' = 11; 'EPOCH_ECHO_BASELINE' = 11
	'EPOCH_ECHO_OVERDRIVE' = 11; 'EPOCH_ECHO_THROTTLED' = 11
	'EPOCH_MISSING_EXPEDITION' = 12
	'EPOCH_EXPEDITION_RESCUE' = 13; 'EPOCH_EXPEDITION_SALVAGE' = 13; 'EPOCH_EXPEDITION_SURVEY' = 13
}
foreach ($projectKey in $expectedCallbacks.Keys) {
	$block = Get-Block $projects "(?m)^\s*special_project\s*=\s*\{\s*key\s*=\s*`"$([regex]::Escape($projectKey))`"" $projectKey
	Assert-Check ($null -ne $block) "Project definition missing: $projectKey"
	$callback = $expectedCallbacks[$projectKey]
	Assert-Check ($block -match "event_scope\s*=\s*ship_event[\s\S]*on_success\s*=\s*\{\s*ship_event\s*=\s*\{\s*id\s*=\s*epoch_core\.$callback\s*\}") "$projectKey must call ship event epoch_core.$callback"
	Assert-Check ($block -notmatch 'cost\s*=\s*[^\r\n]+[\s\S]*days_to_research\s*=|days_to_research\s*=\s*[^\r\n]+[\s\S]*cost\s*=') "$projectKey cannot define both cost and days_to_research"
	Assert-Check ($block -match '(?:cost|days_to_research)\s*=') "$projectKey must define one valid project duration/cost mode"
}
$firstCallback = Get-EventBlock $events 10
Assert-Check ($firstCallback -match 'add_situation_progress\s*=\s*50') 'epoch_core.10 must advance the owned situation by 50'
$opening = Get-EventBlock $events 2
Assert-Check ($opening -match 'name\s*=\s*epoch_core\.2\.a[\s\S]*EPOCH_FIRST_ECHO_CAUTIOUS' -and $opening -match 'name\s*=\s*epoch_core\.2\.b[\s\S]*EPOCH_FIRST_ECHO_AGGRESSIVE') 'The two opening investigation choices must start their corresponding projects'
Assert-Check ($opening -match 'name\s*=\s*epoch_core\.2\.c[\s\S]*set_country_flag\s*=\s*epoch_core_campaign_opted_out' -and $opening -notmatch 'name\s*=\s*epoch_core\.2\.c[\s\S]*start_situation|name\s*=\s*epoch_core\.2\.c[\s\S]*enable_special_project') 'Refusal must start no Situation or project'
$discovery = Get-EventBlock $events 15
Assert-Check ($discovery -match 'NOT\s*=\s*\{\s*has_country_flag\s*=\s*epoch_core_campaign_opted_out\s*\}' -and $discovery -match 'NOT\s*=\s*\{\s*has_country_flag\s*=\s*epoch_core_first_echo_discovered\s*\}' -and $discovery -match 'save_global_event_target_as\s*=\s*epoch_core_signal_system@root\.owner') 'Discovery must respect refusal, remain one-shot and save a persistent country-specific system target'
$midpoint = Get-EventBlock $events 3
Assert-Check ($midpoint -match 'situation\s*=\s*this' -and $midpoint -match 'owner\s*=\s*\{[\s\S]*country_event\s*=\s*\{\s*id\s*=\s*epoch_core\.16') 'epoch_core.3 must use Situation scope and dispatch its country-scope bridge'
$bridge = Get-EventBlock $events 16
Assert-Check ($bridge -match 'has_country_flag\s*=\s*epoch_core_echo_choice_pending' -and $bridge -match 'NOT\s*=\s*\{\s*has_country_flag\s*=\s*epoch_core_second_stage_project_enabled\s*\}') 'epoch_core.16 must be pending-gated and idempotent'
foreach ($key in @('EPOCH_ECHO_CALIBRATION','EPOCH_ECHO_BASELINE','EPOCH_ECHO_OVERDRIVE','EPOCH_ECHO_THROTTLED')) {
	Assert-Check ($bridge -match "name\s*=\s*`"$key`"[\s\S]*owner\s*=\s*root") "Country-scope bridge is missing correctly-owned project $key"
}
$secondCallback = Get-EventBlock $events 11
Assert-Check ($secondCallback -match 'add_situation_progress\s*=\s*50' -and $secondCallback -match 'country_event\s*=\s*\{\s*id\s*=\s*epoch_core\.4' -and $secondCallback -match 'country_event\s*=\s*\{\s*id\s*=\s*epoch_core\.5') 'epoch_core.11 must complete the situation and queue the path-specific follow-up'
foreach ($id in @(4,5)) {
	$followup = Get-EventBlock $events $id
	Assert-Check ($followup -match 'epoch_core_active_campaign_empire\s*=\s*yes' -and $followup -match 'epoch_core_(?:cautious|aggressive)_investigation_complete' -and $followup -match 'NOT\s*=\s*\{\s*has_country_flag\s*=\s*epoch_core_expedition_project_enabled\s*\}') "epoch_core.$id follow-up trigger is inconsistent"
	Assert-Check ($followup -match 'set_country_flag\s*=\s*epoch_core_expedition_project_enabled[\s\S]*EPOCH_MISSING_EXPEDITION') "epoch_core.$id must enable the missing-expedition project from its option"
}
$outbound = Get-EventBlock $events 12
Assert-Check ($outbound -match 'set_country_flag\s*=\s*epoch_core_expedition_contact_lost' -and $outbound -match 'country_event\s*=\s*\{\s*id\s*=\s*epoch_core\.6') 'epoch_core.12 must queue the expedition decision'
$expeditionChoice = Get-EventBlock $events 6
foreach ($key in @('EPOCH_EXPEDITION_RESCUE','EPOCH_EXPEDITION_SALVAGE','EPOCH_EXPEDITION_SURVEY')) { Assert-Check ($expeditionChoice -match "name\s*=\s*`"$key`"") "epoch_core.6 is missing $key" }
Assert-Check ($expeditionChoice -match 'epoch_core_expedition_search_abandoned[\s\S]*country_event\s*=\s*\{\s*id\s*=\s*epoch_core\.7') 'Abandoning the search must queue the final report'
$resultCallback = Get-EventBlock $events 13
Assert-Check ($resultCallback -match 'epoch_core_expedition_outcome_recorded' -and $resultCallback -match 'country_event\s*=\s*\{\s*id\s*=\s*epoch_core\.7') 'epoch_core.13 must record a result and queue epoch_core.7'
$finalEvent = Get-EventBlock $events 7
Assert-Check ($finalEvent -match 'epoch_core_active_campaign_empire\s*=\s*yes' -and $finalEvent -match 'epoch_core_expedition_outcome_recorded') 'epoch_core.7 must accept recorded expedition outcomes'

# Saved system targets must be persistent and country-keyed for concurrent empires.
Assert-Check ($events -match 'save_global_event_target_as\s*=\s*epoch_core_signal_system@root\.owner' -and $events -notmatch 'save_event_target_as\s*=\s*epoch_core_signal_system') 'Signal system must be saved as a persistent owner-keyed global event target'
Assert-Check ($events -match 'event_target:epoch_core_signal_system@root\s*=\s*\{\s*enable_special_project') 'Country-scoped follow-ups must enable projects at the owning empire system'
$refusal = Get-EventBlock $events 2
Assert-Check ($refusal -match 'name\s*=\s*epoch_core\.2\.c[\s\S]*set_country_flag\s*=\s*epoch_core_campaign_opted_out' -and $events -match 'NOT\s*=\s*\{\s*has_country_flag\s*=\s*epoch_core_campaign_opted_out\s*\}') 'Refusal must remain permanent and suppress active campaign events'

# Summarize existing test logs by source. Old EPOCH failures are reported as
# evidence from the pre-fix run; unrelated-mod/base-game errors are separated.
if (Test-Path -LiteralPath $LogDirectory -PathType Container) {
	$errorLog = Join-Path $LogDirectory 'error.log'
	if (Test-Path -LiteralPath $errorLog) {
		$logLines = Get-Content -LiteralPath $errorLog
		$epochErrors = @($logLines | Where-Object { $_ -match '(?i)epoch_core|epoch_first_echo|EPOCH_' })
		$otherErrors = @($logLines | Where-Object { $_ -notmatch '(?i)epoch_core|epoch_first_echo|EPOCH_' -and -not [string]::IsNullOrWhiteSpace($_) })
		$logGroups = @(
			@{ Name = 'Localization'; Lines = @($epochErrors | Where-Object { $_ -match '(?i)locali[sz]ation|missing localization|situation localization' }) },
			@{ Name = 'Special-project definitions'; Lines = @($epochErrors | Where-Object { $_ -match '(?i)special project .*both set' }) },
			@{ Name = 'Event-target/scope'; Lines = @($epochErrors | Where-Object { $_ -match '(?i)event target|context switch' }) }
		)
		Write-Output "LOG REVIEW (pre-fix files): $($epochErrors.Count) EPOCH-related and $($otherErrors.Count) unrelated/base-game/other-mod error lines in error.log."
		foreach ($group in $logGroups) {
			if ($group.Lines.Count -gt 0) { Write-Output "  $($group.Name): $($group.Lines.Count) lines; sample: $($group.Lines[0])" }
		}
		$gameLog = Join-Path $LogDirectory 'game.log'
		if (Test-Path -LiteralPath $gameLog) {
			$epochGameEvents = @(Get-Content -LiteralPath $gameLog | Where-Object { $_ -match '(?i)Event epoch_core\.' })
			Write-Output "  game.log: $($epochGameEvents.Count) EPOCH event-choice records in the existing run."
			foreach ($line in $epochGameEvents) { Write-Output "    $line" }
		}
		Write-Output '  Other-mod/base-game log lines are classified separately and do not count as EPOCH failures.'
	} else { Write-Output 'LOG REVIEW: no error.log found.' }
} else { Write-Output "LOG REVIEW: no log directory found at $LogDirectory." }

if ($script:Failures.Count -gt 0) {
	Write-Output "FAIL: $($script:Failures.Count) of $script:Checks regression checks failed."
	$script:Failures | ForEach-Object { Write-Output "  - $_" }
	exit 1
}
Write-Output "PASS: $script:Checks static regression checks passed. This is not an in-game validation."
