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
	return Get-Block $Text "(?m)^[ \t]*(?:country_event|ship_event|fleet_event|situation_event)[ \t]*=[ \t]*\{[ \t]*\r?\n[ \t]*id[ \t]*=[ \t]*epoch_core\.$Id[ \t]*\r?$" "epoch_core.$Id"
}

function Test-BraceBalance([string]$Text) {
	$depth = 0; $quoted = $false; $comment = $false
	for ($i = 0; $i -lt $Text.Length; $i++) {
		$c = $Text[$i]
		if ($comment) { if ($c -eq "`n") { $comment = $false }; continue }
		if (-not $quoted -and $c -eq '#') { $comment = $true; continue }
		if ($c -eq '"') { $quoted = -not $quoted; continue }
		if ($quoted) { continue }
		if ($c -eq '{') { $depth++ }
		if ($c -eq '}') { $depth--; if ($depth -lt 0) { return $false } }
	}
	return (-not $quoted -and $depth -eq 0)
}

$eventPath = 'events/epoch_core_events.txt'
$situationPath = 'common/situations/epoch_core_situations.txt'
$archaeologicalSitePath = 'common/archaeological_site_types/epoch_core_sites.txt'
$projectPath = 'common/special_projects/epoch_core_projects.txt'
$modifierPath = 'common/static_modifiers/epoch_core_modifiers.txt'
$scriptedEffectsPath = 'common/scripted_effects/epoch_core_effects.txt'
$onActionPath = 'common/on_actions/epoch_core_on_actions.txt'
$phaseSpecPath = 'docs/phases/phase-i-first-contact.md'
$events = Read-ProjectFile $eventPath
$situations = Read-ProjectFile $situationPath
$archaeologicalSites = Read-ProjectFile $archaeologicalSitePath
$projects = Read-ProjectFile $projectPath
$modifiers = Read-ProjectFile $modifierPath
$scriptedEffects = Read-ProjectFile $scriptedEffectsPath
$onActions = Read-ProjectFile $onActionPath
$phaseSpec = Read-ProjectFile $phaseSpecPath

foreach ($entry in @(
	@{ Path = $eventPath; Text = $events },
	@{ Path = $situationPath; Text = $situations },
	@{ Path = $archaeologicalSitePath; Text = $archaeologicalSites },
	@{ Path = $projectPath; Text = $projects },
	@{ Path = $modifierPath; Text = $modifiers },
	@{ Path = $scriptedEffectsPath; Text = $scriptedEffects },
	@{ Path = $onActionPath; Text = $onActions }
)) {
	Assert-Check (Test-BraceBalance $entry.Text) "$($entry.Path) has unbalanced braces or quotes"
}

# The binding campaign contract must remain linked and must not regress to the
# original First Echo / expedition-only PR scope.
foreach ($section in @('First Echo', 'Missing Expedition', 'First Contamination', 'The Silent Structure', 'Phase I Conclusion')) {
	Assert-Check ($phaseSpec.Contains($section)) "Binding Phase I specification is missing section: $section"
}
Assert-Check ($phaseSpec -match 'PR #6 is the technical starting point for Phase I, but it is not the complete Phase I implementation') 'Phase I specification must state PR #6 is not complete Phase I'
foreach ($requirement in @('permanent exit', 'AI', 'multiple simultaneous empires', 'save/load', 'multiplayer', 'VERIFIED', 'RUNTIME', 'negative consequence', 'in-world language', 'preserve uncertainty')) {
	Assert-Check ($phaseSpec.Contains($requirement)) "Binding Phase I specification is missing requirement: $requirement"
}
Assert-Check ((Read-ProjectFile 'docs/architecture.md') -match 'phases/phase-i-first-contact\.md') 'Architecture overview must link to the binding Phase I specification'

# Player-facing conclusion options may not expose implementation vocabulary.
$englishLoc = Read-ProjectFile 'localisation/english/epoch_core_l_english.yml'
$germanLoc = Read-ProjectFile 'localisation/german/epoch_core_l_german.yml'
foreach ($loc in @(@{ Language = 'English'; Text = $englishLoc }, @{ Language = 'German'; Text = $germanLoc })) {
	Assert-Check ($loc.Text -notmatch '(?i)leave (the )?epoch campaign|exit (the )?campaign|disable epoch|stop participating|aus der epoch-kampagne aussteigen|kampagne verlassen|teilnahme beenden|epoch deaktivieren|nicht mehr an zukünftigen phasen teilnehmen') "$($loc.Language) localization exposes campaign opt-out meta-language"
}
Assert-Check ($phaseSpec -match 'save/load') 'Phase I contract must require persistent consequences to survive save/load'

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
	'epoch_first_echo_phase_echo', 'epoch_first_echo_phase_expedition',
	'epoch_first_echo_phase_contamination', 'epoch_first_echo_phase_structure',
	'epoch_first_echo_phase_report', 'epoch_echo_cautious_approach',
	'epoch_echo_aggressive_approach'
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
$modifierKeys = @([regex]::Matches($modifiers, '(?m)^([A-Za-z0-9_]+)\s*=\s*\{') | ForEach-Object { $_.Groups[1].Value })
foreach ($key in $modifierKeys) {
	Assert-Check $allLocKeys.ContainsKey($key) "Missing EN/DE modifier localization $key"
	Assert-Check $allLocKeys.ContainsKey("${key}_desc") "Missing EN/DE modifier description localization ${key}_desc"
}
foreach ($key in @('epoch_core_contamination_active_organic','epoch_core_contamination_active_hive','epoch_core_contamination_active_machine','epoch_core_contamination_worsened_organic','epoch_core_contamination_worsened_hive','epoch_core_contamination_worsened_machine','epoch_core_contamination_studied_organic','epoch_core_contamination_studied_hive','epoch_core_contamination_studied_machine','epoch_core_silent_structure','epoch_core_structure_secured','epoch_core_structure_investigated','epoch_core_structure_ruins','epoch_core_permanent_scar_organic','epoch_core_permanent_scar_hive','epoch_core_permanent_scar_machine','epoch_core_permanent_scar_exacerbated')) {
	$modifierBlock = Get-Block $modifiers "(?m)^$key\s*=\s*\{" $key
	Assert-Check ($null -ne $modifierBlock -and $modifierBlock -match 'icon\s*=\s*"gfx/interface/icons/planet_modifiers/[^\"]+\.dds"' -and $modifierBlock -notmatch 'GFX_evt_|unknown|placeholder') "$key must use an explicit thematic planet-view icon"
}
$projectUses = @([regex]::Matches($events, 'name\s*=\s*"(EPOCH_[A-Z0-9_]+)"') | ForEach-Object { $_.Groups[1].Value } | Sort-Object -Unique)
foreach ($key in $projectUses) { Assert-Check ($key -in $projectKeys) "Event references undefined project $key" }
$localizedPlayerText = @()
foreach ($language in @('english', 'german')) {
	$relative = "localisation/$language/epoch_core_l_$language.yml"
	$localizedPlayerText += @([System.IO.File]::ReadAllLines((Join-Path $Root $relative), [System.Text.Encoding]::UTF8) | Where-Object { $_ -match '^\s*[A-Za-z0-9_.]+:\d+\s+"' } | ForEach-Object { $_ -replace '^\s*[A-Za-z0-9_.]+:\d+\s+"', '' -replace '"\s*$', '' })
}
Assert-Check (($localizedPlayerText -join "`n") -notmatch '(?i)epoch_core|epoch_first_echo|EPOCH_|event.flag|set_country_flag|set_variable|debug|phase\s*(?:i|1)\b|kampagnenstatus|kampagnen-flagge') 'Player-facing localisations must not expose internal IDs, flags, variables, debugging, or phase labels'

# Event ID coverage across event calls, project callbacks and on_action entries.
$eventDefinitions = @([regex]::Matches($events, '(?m)^\s*id\s*=\s*epoch_core\.(\d+)\s*$') | ForEach-Object { $_.Groups[1].Value } | Sort-Object -Unique)
$eventDefinitionCount = @([regex]::Matches($events, '(?m)^\s*id\s*=\s*epoch_core\.\d+\s*$')).Count
Assert-Check ($eventDefinitionCount -eq $eventDefinitions.Count) 'Event IDs must not be defined more than once'
$eventRefs = @([regex]::Matches($events + "`n" + $projects + "`n" + $onActions, '\bepoch_core\.(\d+)\b') | ForEach-Object { $_.Groups[1].Value } | Sort-Object -Unique)
foreach ($id in $eventRefs) { Assert-Check ($id -in $eventDefinitions) "Reference to undefined event epoch_core.$id" }
Assert-Check ($onActions -match 'on_survey_planet\s*=\s*\{[\s\S]*?epoch_core\.15' -and $onActions -match 'on_game_start_country\s*=\s*\{[\s\S]*?epoch_core\.1') 'Vanilla survey and country-start hooks must dispatch defined EPOCH entry events'

# Situation and stage references must exist and the midpoint event must enter
# only after the first ship-project callback advances progress to the next
# real milestone; the same situation remains active through the campaign.
$situationBlock = Get-Block $situations '(?m)^\s*epoch_first_echo_investigation\s*=\s*\{' 'First Echo situation'
Assert-Check ($null -ne $situationBlock) 'First Echo situation definition is missing'
$sourceStage = Get-Block $situationBlock '(?m)^\s*stage_source_analysis\s*=\s*\{' 'source-analysis stage'
Assert-Check ($null -ne $sourceStage -and $sourceStage -match 'on_first_enter\s*=\s*\{\s*situation_event\s*=\s*\{\s*id\s*=\s*epoch_core\.3') 'epoch_core.3 must fire on entering the second stage'
$signalStage = Get-Block $situationBlock '(?m)^\s*stage_signal_analysis\s*=\s*\{' 'signal-analysis stage'
Assert-Check ($signalStage -notmatch 'situation_event\s*=\s*\{\s*id\s*=\s*epoch_core\.3') 'epoch_core.3 must not fire when the Situation is first created'
Assert-Check (@([regex]::Matches($situationBlock, '(?m)^\s*stage_[a-z_]+\s*=\s*\{')).Count -eq 5 -and $situationBlock -match 'stage_signal_analysis\s*=\s*\{[\s\S]*?end\s*=\s*20' -and $situationBlock -match 'stage_source_analysis\s*=\s*\{[\s\S]*?end\s*=\s*40' -and $situationBlock -match 'stage_contamination\s*=\s*\{[\s\S]*?end\s*=\s*60' -and $situationBlock -match 'stage_excavation\s*=\s*\{[\s\S]*?end\s*=\s*80' -and $situationBlock -match 'stage_report\s*=\s*\{[\s\S]*?end\s*=\s*100') 'The unified Phase I Situation must have five milestone stages through its final report'
Assert-Check ($situationBlock -match 'monthly_progress\s*=\s*\{\s*base\s*=\s*0\s*\}') 'Situation must not progress without a completed ship project'
Assert-Check ($situationBlock -match 'on_progress_complete\s*=\s*\{[\s\S]*?destroy_situation\s*=\s*this') 'Situation completion must close the situation'
Assert-Check ($situationBlock -match 'epoch_echo_cautious_approach[\s\S]*?energy\s*=\s*2' -and $situationBlock -match 'epoch_echo_aggressive_approach[\s\S]*?energy\s*=\s*5') 'Situation approaches must have distinct, visible upkeep costs'

# Trace every project/callback/decision edge, including the country-scope bridge
# used to avoid a Situation -> Country context switch when enabling projects.
$expectedCallbacks = @{
	'EPOCH_FIRST_ECHO_CAUTIOUS' = 10; 'EPOCH_FIRST_ECHO_AGGRESSIVE' = 10
	'EPOCH_ECHO_CALIBRATION' = 11; 'EPOCH_ECHO_BASELINE' = 11
	'EPOCH_ECHO_OVERDRIVE' = 11; 'EPOCH_ECHO_THROTTLED' = 11
	'EPOCH_MISSING_EXPEDITION' = 12
	'EPOCH_EXPEDITION_RESCUE' = 13; 'EPOCH_EXPEDITION_SALVAGE' = 13; 'EPOCH_EXPEDITION_SURVEY' = 13
	'EPOCH_CONTAMINATION_STUDY' = 21
}
foreach ($projectKey in $expectedCallbacks.Keys) {
	$block = Get-Block $projects "(?m)^\s*special_project\s*=\s*\{\s*key\s*=\s*`"$([regex]::Escape($projectKey))`"" $projectKey
	Assert-Check ($null -ne $block) "Project definition missing: $projectKey"
	$callback = $expectedCallbacks[$projectKey]
	Assert-Check ($block -match "event_scope\s*=\s*ship_event[\s\S]*on_success\s*=\s*\{\s*ship_event\s*=\s*\{\s*id\s*=\s*epoch_core\.$callback\s*\}") "$projectKey must call ship event epoch_core.$callback"
	Assert-Check ($block -notmatch 'cost\s*=\s*[^\r\n]+[\s\S]*days_to_research\s*=|days_to_research\s*=\s*[^\r\n]+[\s\S]*cost\s*=') "$projectKey cannot define both cost and days_to_research"
	Assert-Check ($block -match '(?:cost|days_to_research)\s*=') "$projectKey must define one valid project duration/cost mode"
}
$contaminationProject = Get-Block $projects '(?m)^\s*special_project\s*=\s*\{\s*key\s*=\s*"EPOCH_CONTAMINATION_STUDY"' 'contamination project'
Assert-Check ($contaminationProject -match 'on_fail\s*=\s*\{\s*ship_event\s*=\s*\{\s*id\s*=\s*epoch_core\.26') 'Contamination project failure must resolve to a guarded fallback'
$missingProject = Get-Block $projects '(?m)^\s*special_project\s*=\s*\{\s*key\s*=\s*"EPOCH_MISSING_EXPEDITION"' 'missing expedition project'
Assert-Check ($missingProject -match 'on_fail\s*=\s*\{\s*ship_event\s*=\s*\{\s*id\s*=\s*epoch_core\.28') 'Expedition project failure must resolve to its non-destructive fallback'
$firstCallback = Get-EventBlock $events 10
Assert-Check ($firstCallback -match 'add_situation_progress\s*=\s*20' -and $firstCallback -notmatch 'destroy_ship\s*=') 'The first First Echo callback must advance the campaign milestone without removing its ship'
$opening = Get-EventBlock $events 2
Assert-Check ($opening -match 'name\s*=\s*epoch_core\.2\.a[\s\S]*EPOCH_FIRST_ECHO_CAUTIOUS' -and $opening -match 'name\s*=\s*epoch_core\.2\.b[\s\S]*EPOCH_FIRST_ECHO_AGGRESSIVE') 'The two opening investigation choices must start their corresponding projects'
Assert-Check ($opening -match 'name\s*=\s*epoch_core\.2\.c[\s\S]*set_country_flag\s*=\s*epoch_core_campaign_opted_out' -and $opening -notmatch 'name\s*=\s*epoch_core\.2\.c[\s\S]*start_situation|name\s*=\s*epoch_core\.2\.c[\s\S]*enable_special_project') 'Refusal must start no Situation or project'
Assert-Check ((Get-EventBlock $events 2) -match 'name\s*=\s*epoch_core\.2\.a[\s\S]*hidden_effect\s*=\s*\{' -and (Get-EventBlock $events 2) -match 'name\s*=\s*epoch_core\.2\.c[\s\S]*hidden_effect\s*=\s*\{') 'Opening decisions must hide internal campaign-state effects from event tooltips'
Assert-Check ((Get-EventBlock $events 3) -match 'hidden_effect\s*=\s*\{[\s\S]*set_situation_approach' -and (Get-EventBlock $events 20) -match 'hidden_effect\s*=\s*\{[\s\S]*enable_special_project') 'Interactive approach and contamination options must hide internal effects while presenting player-facing choices'
foreach ($id in @(4,5,6,7,20,22,23,40,41,42,43)) { Assert-Check ((Get-EventBlock $events $id) -match 'hidden_effect\s*=\s*\{') "Player-facing event epoch_core.$id must execute internal effects through the hidden-effect pattern" }
Assert-Check (($englishLoc + $germanLoc) -match '500 Energy, 300 Minerals' -and ($englishLoc + $germanLoc) -match '500 Energie, 300 Mineralien') 'The visible containment choice must state its actual stockpile cost in English and German'
$discovery = Get-EventBlock $events 15
Assert-Check ($discovery -match 'NOT\s*=\s*\{\s*has_country_flag\s*=\s*epoch_core_campaign_opted_out\s*\}' -and $discovery -match 'NOT\s*=\s*\{\s*has_country_flag\s*=\s*epoch_core_first_echo_discovered\s*\}' -and $discovery -match 'save_global_event_target_as\s*=\s*epoch_core_signal_system@root\.owner') 'Discovery must respect refusal, remain one-shot and save a persistent country-specific system target'
Assert-Check ($discovery -match 'epoch_core_expedition_origin_system@root\.owner' -and $discovery -match 'epoch_core_expedition_destination@root\.owner') 'Survey discovery must save an owner-specific expedition route'
Assert-Check ($scriptedEffects -notmatch 'create_(?:leader|fleet|ship)\s*=') 'Missing Expedition must not create a substitute leader, fleet, or ship'
$midpoint = Get-EventBlock $events 3
Assert-Check ($midpoint -match 'situation\s*=\s*this' -and $midpoint -match 'owner\s*=\s*\{[\s\S]*country_event\s*=\s*\{\s*id\s*=\s*epoch_core\.16') 'epoch_core.3 must use Situation scope and dispatch its country-scope bridge'
$bridge = Get-EventBlock $events 16
Assert-Check ($bridge -match 'has_country_flag\s*=\s*epoch_core_echo_choice_pending' -and $bridge -match 'NOT\s*=\s*\{\s*has_country_flag\s*=\s*epoch_core_second_stage_project_enabled\s*\}') 'epoch_core.16 must be pending-gated and idempotent'
foreach ($key in @('EPOCH_ECHO_CALIBRATION','EPOCH_ECHO_BASELINE','EPOCH_ECHO_OVERDRIVE','EPOCH_ECHO_THROTTLED')) {
	Assert-Check ($bridge -match "name\s*=\s*`"$key`"[\s\S]*owner\s*=\s*root") "Country-scope bridge is missing correctly-owned project $key"
}
$secondCallback = Get-EventBlock $events 11
Assert-Check ($secondCallback -match 'add_situation_progress\s*=\s*20' -and $secondCallback -notmatch 'destroy_situation\s*=|destroy_ship\s*=' -and $secondCallback -match 'country_event\s*=\s*\{\s*id\s*=\s*epoch_core\.4' -and $secondCallback -match 'country_event\s*=\s*\{\s*id\s*=\s*epoch_core\.5') 'epoch_core.11 must complete First Echo, advance one milestone, and queue the path-specific follow-up without ending the situation'
foreach ($id in @(4,5)) {
	$followup = Get-EventBlock $events $id
	Assert-Check ($followup -match 'epoch_core_active_campaign_empire\s*=\s*yes' -and $followup -match 'epoch_core_(?:cautious|aggressive)_investigation_complete' -and $followup -match 'NOT\s*=\s*\{\s*has_country_flag\s*=\s*epoch_core_expedition_project_enabled\s*\}') "epoch_core.$id follow-up trigger is inconsistent"
	Assert-Check ($followup -match 'set_country_flag\s*=\s*epoch_core_expedition_project_enabled[\s\S]*epoch_core_expedition_destination@root[\s\S]*EPOCH_MISSING_EXPEDITION') "epoch_core.$id must enable the missing-expedition project at its saved destination"
}
$outbound = Get-EventBlock $events 12
Assert-Check ($outbound -match 'set_country_flag\s*=\s*epoch_core_expedition_contact_lost' -and $outbound -match 'save_global_event_target_as\s*=\s*epoch_core_expedition_ship@root\.owner' -and $outbound -match 'destroy_ship\s*=\s*this' -and $outbound -match 'save_global_event_target_as\s*=\s*epoch_core_expedition_scientist@root\.owner' -and $outbound -match 'country_event\s*=\s*\{\s*id\s*=\s*epoch_core\.6') 'epoch_core.12 must track the project-performing ship and scientist, remove that ship, and queue the search decision'
Assert-Check ($outbound.IndexOf('save_global_event_target_as = epoch_core_expedition_ship@root.owner') -lt $outbound.IndexOf('save_global_event_target_as = epoch_core_expedition_scientist@root.owner') -and $outbound.IndexOf('save_global_event_target_as = epoch_core_expedition_scientist@root.owner') -lt $outbound.IndexOf('destroy_ship = this')) 'Missing Expedition must save both exact performing-ship and fleet-scientist references before destroying the ship'
foreach ($id in @(10,11,13,21,26,28,30,31,32)) { Assert-Check ((Get-EventBlock $events $id) -notmatch 'destroy_ship\s*=') "Non-Missing-Expedition callback epoch_core.$id must not remove a ship" }
Assert-Check ($outbound -match 'fleet\s*=\s*\{\s*leader\s*=\s*\{\s*set_leader_flag\s*=\s*epoch_core_missing_expedition\s*save_global_event_target_as\s*=\s*epoch_core_expedition_scientist@root\.owner') 'The assigned expedition scientist must be flagged and saved from the project ship''s fleet before that ship is destroyed'
$expeditionChoice = Get-EventBlock $events 6
foreach ($key in @('EPOCH_EXPEDITION_RESCUE','EPOCH_EXPEDITION_SALVAGE','EPOCH_EXPEDITION_SURVEY')) { Assert-Check ($expeditionChoice -match "name\s*=\s*`"$key`"") "epoch_core.6 is missing $key" }
Assert-Check ($expeditionChoice -match 'epoch_core_expedition_search_abandoned[\s\S]*country_event\s*=\s*\{\s*id\s*=\s*epoch_core\.7') 'Abandoning the search must queue the final report'
$resultCallback = Get-EventBlock $events 13
Assert-Check ($resultCallback -match 'epoch_core_expedition_outcome_recorded' -and $resultCallback -match 'country_event\s*=\s*\{\s*id\s*=\s*epoch_core\.7') 'epoch_core.13 must record a result and queue epoch_core.7'
Assert-Check ($resultCallback -match 'random_list\s*=\s*\{[\s\S]*epoch_core_expedition_survivors_found[\s\S]*epoch_core_expedition_recorder_recovered[\s\S]*epoch_core_expedition_search_failed' -and $resultCallback -match 'epoch_core_signal_trace_degraded') 'Expedition outcome must be non-guaranteed and depend on earlier signal quality'
$finalEvent = Get-EventBlock $events 7
Assert-Check ($finalEvent -match 'epoch_core_active_campaign_empire\s*=\s*yes' -and $finalEvent -match 'epoch_core_expedition_outcome_recorded') 'epoch_core.7 must accept recorded expedition outcomes'
Assert-Check ($finalEvent -match 'NOT\s*=\s*\{\s*has_country_flag\s*=\s*epoch_core_expedition_later_clue_seen\s*\}' -and $finalEvent -match 'epoch_core_expedition_survivors_found[\s\S]*remove_leader_flag\s*=\s*epoch_core_missing_expedition[\s\S]*epoch_core_expedition_scientist_recovered' -and $finalEvent -match 'else\s*=\s*\{[\s\S]*kill_leader\s*=\s*\{\s*show_notification\s*=\s*no\s*\}[\s\S]*epoch_core_expedition_scientist_lost') 'The recorded expedition outcome must resolve the saved scientist once as recovered or lost'

# New Phase I stages must apply actual planet mechanics, preserve uncertainty,
# and impose a permanent path-sensitive cost before the final decision.
$contaminationEvent = Get-EventBlock $events 20
$structureEvent = Get-EventBlock $events 22
$conclusionEvent = Get-EventBlock $events 23
Assert-Check ($contaminationEvent -match 'epoch_core_apply_contamination_active' -and $contaminationEvent -match 'epoch_core_apply_contamination_worsened' -and $contaminationEvent -match 'enable_special_project.*EPOCH_CONTAMINATION_STUDY' -and $contaminationEvent -match 'random_owned_planet\s*=\s*\{[\s\S]*?epoch_core_apply_contamination_worsened\s*=\s*yes') 'Contamination must affect a planet, worsen on neglect, spread to another owned world when possible, and offer investigation'
$structureFiles = @(Get-ChildItem -LiteralPath (Join-Path $Root 'common') -Recurse -File -Filter '*.txt' | ForEach-Object { [System.IO.File]::ReadAllText($_.FullName, [System.Text.Encoding]::UTF8) })
$structureMechanics = $events + "`n" + ($structureFiles -join "`n")
$silentSite = Get-Block $archaeologicalSites '(?m)^epoch_core_silent_structure\s*=\s*\{' 'Silent Structure archaeology definition'
Assert-Check ($null -ne $silentSite -and $silentSite -match 'stages\s*=\s*4' -and @([regex]::Matches($silentSite, '(?m)^\s*stage\s*=\s*\{')).Count -eq 4 -and $silentSite -match 'event\s*=\s*epoch_core\.40' -and $silentSite -match 'event\s*=\s*epoch_core\.43') 'The Silent Structure must define a native four-stage Archaeological Site'
Assert-Check (@([regex]::Matches($silentSite, '(?m)^\s*difficulty\s*=\s*[2-5]\s*$')).Count -eq 4 -and $silentSite -match 'difficulty\s*=\s*2[\s\S]*difficulty\s*=\s*3[\s\S]*difficulty\s*=\s*4[\s\S]*difficulty\s*=\s*5') 'All four excavation chapters must require regular archaeology progress at increasing but playable difficulty'
foreach ($id in @(40,41,42,43)) {
	$chapter = Get-EventBlock $events $id
	Assert-Check ($null -ne $chapter -and $chapter -match 'archaeology\s*=\s*yes' -and $chapter -match 'is_triggered_only\s*=\s*yes' -and $chapter -match 'ai_chance\s*=') "Archaeology chapter epoch_core.$id must use a native callback and provide AI decisions"
}
Assert-Check ($structureEvent -match 'create_archaeological_site\s*=\s*epoch_core_silent_structure' -and $structureEvent -match 'epoch_core_structure_site_created' -and $structureMechanics -match 'destroy_archaeological_site\s*=\s*this') 'The structure event must create the site on a saved world, and destruction must remove the native site object'
$siteVisibility = Get-Block $silentSite '(?m)^\s*visible\s*=\s*\{' 'Silent Structure visibility trigger'
Assert-Check ($siteVisibility -match 'has_country_flag\s*=\s*epoch_core_structure_site_created' -and $siteVisibility -notmatch 'default_site_visible_trigger|from\.planet') 'Site visibility must stay owner-scoped without the failing helper scope switch'
Assert-Check ((Get-EventBlock $events 43) -match 'set_site_progress_locked\s*=\s*yes' -and (Get-EventBlock $events 43) -match 'destroy_archaeological_site\s*=\s*this' -and (Get-EventBlock $events 43) -match 'epoch_core_structure_investigated') 'Final structure decisions must respectively preserve, destroy, or complete the native site'
$activeContaminationEffect = Get-Block $scriptedEffects '(?m)^epoch_core_apply_contamination_active\s*=\s*\{' 'class-specific active contamination effect'
$worsenedContaminationEffect = Get-Block $scriptedEffects '(?m)^epoch_core_apply_contamination_worsened\s*=\s*\{' 'class-specific worsened contamination effect'
Assert-Check ($activeContaminationEffect -match 'is_machine_empire\s*=\s*yes[\s\S]*epoch_core_contamination_active_machine' -and $activeContaminationEffect -match 'is_hive_empire\s*=\s*yes[\s\S]*epoch_core_contamination_active_hive' -and $activeContaminationEffect -match 'epoch_core_contamination_active_organic') 'Active contamination must use separate organic, Hive, and machine gameplay modifiers'
Assert-Check ($worsenedContaminationEffect -match 'is_machine_empire\s*=\s*yes[\s\S]*epoch_core_contamination_worsened_machine' -and $worsenedContaminationEffect -match 'is_hive_empire\s*=\s*yes[\s\S]*epoch_core_contamination_worsened_hive' -and $worsenedContaminationEffect -match 'epoch_core_contamination_worsened_organic') 'Worsened contamination must use separate organic, Hive, and machine gameplay modifiers'
Assert-Check ($conclusionEvent -match 'epoch_core_permanent_scar_organic' -and $conclusionEvent -match 'epoch_core_permanent_scar_hive' -and $conclusionEvent -match 'epoch_core_permanent_scar_machine') 'Conclusion must apply a class-specific permanent consequence'
Assert-Check ($conclusionEvent -match 'epoch_core_permanent_scar_exacerbated' -and $conclusionEvent -match 'epoch_core_expedition_loss_recorded' -and $conclusionEvent -match 'epoch_core_contamination_neglected' -and $conclusionEvent -match 'epoch_core_structure_destroyed') 'Permanent consequence severity must reflect the campaign path'
Assert-Check ($conclusionEvent -match 'days\s*=\s*-1' -and $conclusionEvent -match 'epoch_core_phase_ii_ready' -and $conclusionEvent -match 'epoch_core_campaign_opted_out') 'Permanent consequence must be applied before in-world continuation/closure options'
Assert-Check ($finalEvent -match 'country_event\s*=\s*\{\s*id\s*=\s*epoch_core\.20') 'Expedition report must transition into First Contamination'
Assert-Check ($contaminationEvent -match 'country_event\s*=\s*\{\s*id\s*=\s*epoch_core\.22' -and $structureEvent -match 'country_event\s*=\s*\{\s*id\s*=\s*epoch_core\.23') 'Contamination and structure must transition toward Phase I Conclusion'
Assert-Check ($conclusionEvent -match 'set_country_flag\s*=\s*epoch_core_campaign_opted_out' -and $conclusionEvent -match 'remove_country_flag\s*=\s*epoch_core_campaign_active' -and $conclusionEvent -match 'set_country_flag\s*=\s*epoch_core_phase_ii_ready') 'Conclusion must set permanent internal exit or Phase II continuation state'
Assert-Check ($modifiers -match 'epoch_core_permanent_scar_organic\s*=\s*\{[\s\S]*?planet_jobs_food_produces_mult\s*=\s*-0\.05' -and $modifiers -match 'epoch_core_permanent_scar_hive\s*=\s*\{[\s\S]*?planet_jobs_unity_produces_mult\s*=\s*-0\.05' -and $modifiers -match 'epoch_core_permanent_scar_machine\s*=\s*\{[\s\S]*?planet_jobs_energy_produces_mult\s*=\s*-0\.05') 'Permanent class-specific modifiers must reduce actual job output'
foreach ($modifierKey in @('epoch_core_permanent_scar_organic', 'epoch_core_permanent_scar_hive', 'epoch_core_permanent_scar_machine', 'epoch_core_permanent_scar_exacerbated', 'epoch_core_permanent_scar_fallback', 'epoch_core_permanent_scar_exacerbated_fallback')) {
	$modifierBlock = Get-Block $modifiers "(?m)^$modifierKey\s*=\s*\{" $modifierKey
	Assert-Check ($null -ne $modifierBlock -and $modifierBlock -notmatch '(?m)^\s*(days|months)\s*=') "$modifierKey must have no timed expiry"
	Assert-Check ($events -match "add_modifier\s*=\s*\{\s*modifier\s*=\s*$modifierKey\s+days\s*=\s*-1") "$modifierKey must be applied permanently"
	Assert-Check ($events -notmatch "remove_modifier\s*=\s*$modifierKey") "$modifierKey must never be removed by campaign events"
}
foreach ($timer in @(33,34,35,37,38)) {
	$timerBlock = Get-EventBlock $events $timer
	Assert-Check ($null -ne $timerBlock -and $timerBlock -match 'epoch_core_active_campaign_empire\s*=\s*yes') "One-shot recovery timer epoch_core.$timer must be campaign-gated"
}
$conclusionChoiceText = (($englishLoc + $germanLoc) -split "`r?`n" | Where-Object { $_ -match '^\s*epoch_core\.23\.[ab]:0' }) -join "`n"
Assert-Check ($conclusionChoiceText -notmatch '(?i)campaign|participat|phase|einstieg|kampagne|teilnahme|zukünftigen phasen') 'Conclusion options must use only in-world language'
Assert-Check (($englishLoc + $germanLoc) -notmatch '(?i)UAP|Universal Ascension|original purpose|ursprüngliche zivilisation|ursprüngliche Zweck|eigentliche Zweck') 'Phase I closing text must not reveal the later purpose or UAP'

# AI routes and absent-object recovery must be explicit at each blocking step.
foreach ($id in @(2,3,4,5,6,7,20,22,23,40,41,42,43)) {
	$decisionEvent = Get-EventBlock $events $id
	Assert-Check ($null -ne $decisionEvent -and $decisionEvent -match 'ai_chance\s*=\s*\{\s*factor\s*=') "Blocking event epoch_core.$id must provide AI decision weights"
}
foreach ($id in @(4,5)) {
	$followup = Get-EventBlock $events $id
	Assert-Check ($followup -match 'epoch_core_expedition_project_enabled' -and $followup -match 'epoch_core_expedition_destination@root') "AI follow-up epoch_core.$id must use the destination-anchored player ship project"
}
Assert-Check ((Get-EventBlock $events 28) -match 'epoch_core_expedition_project_enabled' -and (Get-EventBlock $events 28) -match 'epoch_core_expedition_project_failed' -and (Get-EventBlock $events 28) -notmatch 'destroy_ship\s*=') 'Expedition project failure must preserve the player''s ship and resolve through a recoverable path'
Assert-Check ((Get-EventBlock $events 37) -match 'epoch_core_expedition_mission_timed_out' -and (Get-EventBlock $events 37) -notmatch 'epoch_core_expedition_object_lost|destroy_ship\s*=') 'Expedition timeout must not claim or cause loss of a ship that was never identified'
Assert-Check ($events -notmatch 'epoch_core\.36|epoch_core_structure_excavation_timed_out|days\s*=\s*2190' -and $events -notmatch 'country_event\s*=\s*\{\s*id\s*=\s*epoch_core\.36') 'No calendar timeout may destroy or prematurely conclude a site that is still being excavated'
Assert-Check ((Get-EventBlock $events 22) -match 'exists\s*=\s*event_target:epoch_core_world@root' -and (Get-EventBlock $events 22) -match 'save_global_event_target_as\s*=\s*epoch_core_world@root') 'Structure event must fall back to a local capital if the saved world target is missing'
Assert-Check ((Get-EventBlock $events 23) -match 'exists\s*=\s*capital_scope' -and (Get-EventBlock $events 23) -match 'epoch_core_permanent_scar_fallback') 'Conclusion must preserve a permanent consequence if the empire has no capital'
Assert-Check ($onActions -match 'on_country_created\s*=\s*\{[\s\S]*?epoch_core\.1' -and $onActions -match 'on_country_type_changed\s*=\s*\{[\s\S]*?epoch_core\.1') 'Newly created or converted empires must receive the same guarded enrollment dispatch'

# Saved system targets must be persistent and country-keyed for concurrent empires.
Assert-Check ($events -match 'save_global_event_target_as\s*=\s*epoch_core_signal_system@root\.owner' -and $events -notmatch 'save_event_target_as\s*=\s*epoch_core_signal_system') 'Signal system must be saved as a persistent owner-keyed global event target'
Assert-Check ($events -match 'event_target:epoch_core_signal_system@root\s*=\s*\{\s*enable_special_project') 'Country-scoped follow-ups must enable projects at the owning empire system'
Assert-Check ($events -match 'save_global_event_target_as\s*=\s*epoch_core_expedition_ship@root\.owner' -and $events -match 'save_global_event_target_as\s*=\s*epoch_core_expedition_scientist@root\.owner') 'Expedition callback must save the actual performing ship and assigned scientist against its owner'
Assert-Check ($events -match 'save_global_event_target_as\s*=\s*epoch_core_world@root' -and $events -match 'event_target:epoch_core_world@root') 'Contamination and structure world targets must be keyed to their campaign owner'
$optOutGuards = @(
	(Get-EventBlock $events 15), (Get-EventBlock $events 2), (Get-EventBlock $events 3),
	(Get-EventBlock $events 4), (Get-EventBlock $events 5), (Get-EventBlock $events 6),
	(Get-EventBlock $events 7), (Get-EventBlock $events 20), (Get-EventBlock $events 22),
	(Get-EventBlock $events 23)
)
foreach ($guardedEvent in $optOutGuards) {
	Assert-Check ($guardedEvent -match 'epoch_core_active_campaign_empire\s*=\s*yes|NOT\s*=\s*\{\s*has_country_flag\s*=\s*epoch_core_campaign_opted_out') 'Every public progression or enrollment handler must re-check active campaign/opt-out state'
}
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
