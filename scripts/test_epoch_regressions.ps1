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
$projectPath = 'common/special_projects/epoch_core_projects.txt'
$modifierPath = 'common/static_modifiers/epoch_core_modifiers.txt'
$scriptedEffectsPath = 'common/scripted_effects/epoch_core_effects.txt'
$shipDesignPath = 'common/global_ship_designs/epoch_core_designs.txt'
$onActionPath = 'common/on_actions/epoch_core_on_actions.txt'
$phaseSpecPath = 'docs/phases/phase-i-first-contact.md'
$events = Read-ProjectFile $eventPath
$situations = Read-ProjectFile $situationPath
$projects = Read-ProjectFile $projectPath
$modifiers = Read-ProjectFile $modifierPath
$scriptedEffects = Read-ProjectFile $scriptedEffectsPath
$shipDesign = Read-ProjectFile $shipDesignPath
$onActions = Read-ProjectFile $onActionPath
$phaseSpec = Read-ProjectFile $phaseSpecPath

foreach ($entry in @(
	@{ Path = $eventPath; Text = $events },
	@{ Path = $situationPath; Text = $situations },
	@{ Path = $projectPath; Text = $projects },
	@{ Path = $modifierPath; Text = $modifiers },
	@{ Path = $scriptedEffectsPath; Text = $scriptedEffects },
	@{ Path = $shipDesignPath; Text = $shipDesign },
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
$modifierKeys = @([regex]::Matches($modifiers, '(?m)^([A-Za-z0-9_]+)\s*=\s*\{') | ForEach-Object { $_.Groups[1].Value })
foreach ($key in $modifierKeys) {
	Assert-Check $allLocKeys.ContainsKey($key) "Missing EN/DE modifier localization $key"
	Assert-Check $allLocKeys.ContainsKey("${key}_desc") "Missing EN/DE modifier description localization ${key}_desc"
}
foreach ($key in @('NAME_EPOCH_Expedition', 'NAME_EPOCH_Expedition_Ship')) { Assert-Check $allLocKeys.ContainsKey($key) "Missing EN/DE expedition name localization $key" }
$projectUses = @([regex]::Matches($events, 'name\s*=\s*"(EPOCH_[A-Z0-9_]+)"') | ForEach-Object { $_.Groups[1].Value } | Sort-Object -Unique)
foreach ($key in $projectUses) { Assert-Check ($key -in $projectKeys) "Event references undefined project $key" }

# Event ID coverage across event calls, project callbacks and on_action entries.
$eventDefinitions = @([regex]::Matches($events, '(?m)^\s*id\s*=\s*epoch_core\.(\d+)\s*$') | ForEach-Object { $_.Groups[1].Value } | Sort-Object -Unique)
$eventDefinitionCount = @([regex]::Matches($events, '(?m)^\s*id\s*=\s*epoch_core\.\d+\s*$')).Count
Assert-Check ($eventDefinitionCount -eq $eventDefinitions.Count) 'Event IDs must not be defined more than once'
$eventRefs = @([regex]::Matches($events + "`n" + $projects + "`n" + $onActions, '\bepoch_core\.(\d+)\b') | ForEach-Object { $_.Groups[1].Value } | Sort-Object -Unique)
foreach ($id in $eventRefs) { Assert-Check ($id -in $eventDefinitions) "Reference to undefined event epoch_core.$id" }
Assert-Check ($onActions -match 'on_survey_planet\s*=\s*\{[\s\S]*?epoch_core\.15' -and $onActions -match 'on_game_start_country\s*=\s*\{[\s\S]*?epoch_core\.1') 'Vanilla survey and country-start hooks must dispatch defined EPOCH entry events'
Assert-Check ($onActions -match 'on_ship_destroyed_victim\s*=\s*\{[\s\S]*?epoch_core\.29') 'Unexpected expedition destruction must be routed through the vanilla victim hook'
$unexpectedLoss = Get-EventBlock $events 29
Assert-Check ($unexpectedLoss -match 'fromfrom\s*=\s*\{\s*has_ship_flag\s*=\s*epoch_core_expedition_vessel' -and $unexpectedLoss -match 'NOT\s*=\s*\{\s*has_country_flag\s*=\s*epoch_core_expedition_scripted_loss' -and $unexpectedLoss -match 'epoch_core_expedition_contact_lost') 'Unexpected loss handler must filter to the campaign vessel and avoid duplicate scripted loss'

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
	'EPOCH_CONTAMINATION_STUDY' = 21; 'EPOCH_STRUCTURE_ANALYSIS' = 24
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
$structureProject = Get-Block $projects '(?m)^\s*special_project\s*=\s*\{\s*key\s*=\s*"EPOCH_STRUCTURE_ANALYSIS"' 'structure project'
Assert-Check ($contaminationProject -match 'on_fail\s*=\s*\{\s*ship_event\s*=\s*\{\s*id\s*=\s*epoch_core\.26') 'Contamination project failure must resolve to a guarded fallback'
Assert-Check ($structureProject -match 'on_fail\s*=\s*\{\s*ship_event\s*=\s*\{\s*id\s*=\s*epoch_core\.27') 'Structure project failure must resolve to a guarded fallback'
$missingProject = Get-Block $projects '(?m)^\s*special_project\s*=\s*\{\s*key\s*=\s*"EPOCH_MISSING_EXPEDITION"' 'missing expedition project'
Assert-Check ($missingProject -match 'on_fail\s*=\s*\{\s*ship_event\s*=\s*\{\s*id\s*=\s*epoch_core\.28') 'Expedition project failure must resolve to the owned-vessel loss path'
$firstCallback = Get-EventBlock $events 10
Assert-Check ($firstCallback -match 'add_situation_progress\s*=\s*50') 'epoch_core.10 must advance the owned situation by 50'
$opening = Get-EventBlock $events 2
Assert-Check ($opening -match 'name\s*=\s*epoch_core\.2\.a[\s\S]*EPOCH_FIRST_ECHO_CAUTIOUS' -and $opening -match 'name\s*=\s*epoch_core\.2\.b[\s\S]*EPOCH_FIRST_ECHO_AGGRESSIVE') 'The two opening investigation choices must start their corresponding projects'
Assert-Check ($opening -match 'name\s*=\s*epoch_core\.2\.c[\s\S]*set_country_flag\s*=\s*epoch_core_campaign_opted_out' -and $opening -notmatch 'name\s*=\s*epoch_core\.2\.c[\s\S]*start_situation|name\s*=\s*epoch_core\.2\.c[\s\S]*enable_special_project') 'Refusal must start no Situation or project'
$discovery = Get-EventBlock $events 15
Assert-Check ($discovery -match 'NOT\s*=\s*\{\s*has_country_flag\s*=\s*epoch_core_campaign_opted_out\s*\}' -and $discovery -match 'NOT\s*=\s*\{\s*has_country_flag\s*=\s*epoch_core_first_echo_discovered\s*\}' -and $discovery -match 'save_global_event_target_as\s*=\s*epoch_core_signal_system@root\.owner') 'Discovery must respect refusal, remain one-shot and save a persistent country-specific system target'
Assert-Check ($discovery -match 'epoch_core_expedition_origin_system@root\.owner' -and $discovery -match 'epoch_core_expedition_destination@root\.owner') 'Survey discovery must save an owner-specific expedition route'
$expeditionFactory = Get-Block $scriptedEffects '(?m)^epoch_core_create_expedition\s*=\s*\{' 'expedition factory'
Assert-Check ($expeditionFactory -match 'create_leader\s*=\s*\{[\s\S]*class\s*=\s*scientist' -and $expeditionFactory -match 'create_fleet\s*=\s*\{[\s\S]*create_ship\s*=\s*\{' -and $expeditionFactory -match 'assign_leader\s*=\s*event_target:epoch_core_expedition_scientist@root') 'Expedition factory must create an owned ship with a scientist'
Assert-Check ($expeditionFactory -match 'set_location\s*=\s*event_target:epoch_core_expedition_origin_system@root' -and $expeditionFactory -match 'auto_move_to_planet\s*=\s*\{[\s\S]*epoch_core_expedition_destination@root') 'Created expedition must travel from its origin to its mission destination'
Assert-Check ($shipDesign -match 'ship_size\s*=\s*science' -and $shipDesign -match 'DEFAULT_SCIENCESHIP_SECTION') 'Expedition ship must use a science-ship design'
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
Assert-Check ($outbound -match 'set_country_flag\s*=\s*epoch_core_expedition_contact_lost' -and $outbound -match 'epoch_core_expedition_ship@root\.owner\s*=\s*\{\s*destroy_ship\s*=\s*this' -and $outbound -match 'country_event\s*=\s*\{\s*id\s*=\s*epoch_core\.6') 'epoch_core.12 must destroy only the saved expedition ship and queue the search decision'
$expeditionChoice = Get-EventBlock $events 6
foreach ($key in @('EPOCH_EXPEDITION_RESCUE','EPOCH_EXPEDITION_SALVAGE','EPOCH_EXPEDITION_SURVEY')) { Assert-Check ($expeditionChoice -match "name\s*=\s*`"$key`"") "epoch_core.6 is missing $key" }
Assert-Check ($expeditionChoice -match 'epoch_core_expedition_search_abandoned[\s\S]*country_event\s*=\s*\{\s*id\s*=\s*epoch_core\.7') 'Abandoning the search must queue the final report'
$resultCallback = Get-EventBlock $events 13
Assert-Check ($resultCallback -match 'epoch_core_expedition_outcome_recorded' -and $resultCallback -match 'country_event\s*=\s*\{\s*id\s*=\s*epoch_core\.7') 'epoch_core.13 must record a result and queue epoch_core.7'
Assert-Check ($resultCallback -match 'random_list\s*=\s*\{[\s\S]*epoch_core_expedition_survivors_found[\s\S]*epoch_core_expedition_recorder_recovered[\s\S]*epoch_core_expedition_search_failed' -and $resultCallback -match 'epoch_core_signal_trace_degraded') 'Expedition outcome must be non-guaranteed and depend on earlier signal quality'
$finalEvent = Get-EventBlock $events 7
Assert-Check ($finalEvent -match 'epoch_core_active_campaign_empire\s*=\s*yes' -and $finalEvent -match 'epoch_core_expedition_outcome_recorded') 'epoch_core.7 must accept recorded expedition outcomes'

# New Phase I stages must apply actual planet mechanics, preserve uncertainty,
# and impose a permanent path-sensitive cost before the final decision.
$contaminationEvent = Get-EventBlock $events 20
$structureEvent = Get-EventBlock $events 22
$conclusionEvent = Get-EventBlock $events 23
Assert-Check ($contaminationEvent -match 'epoch_core_contamination_active' -and $contaminationEvent -match 'epoch_core_contamination_worsened' -and $contaminationEvent -match 'enable_special_project.*EPOCH_CONTAMINATION_STUDY') 'Contamination must affect a planet, worsen on neglect, and offer investigation'
Assert-Check ($structureEvent -match 'epoch_core_silent_structure' -and $structureEvent -match 'EPOCH_STRUCTURE_ANALYSIS' -and $structureEvent -match 'epoch_core_structure_secured' -and $structureEvent -match 'epoch_core_structure_ruins') 'The Silent Structure must offer investigation, securing, and destruction with distinct effects'
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
foreach ($timer in @(33,34,35,36,37,38)) {
	$timerBlock = Get-EventBlock $events $timer
	Assert-Check ($null -ne $timerBlock -and $timerBlock -match 'epoch_core_active_campaign_empire\s*=\s*yes') "One-shot recovery timer epoch_core.$timer must be campaign-gated"
}
$conclusionChoiceText = (($englishLoc + $germanLoc) -split "`r?`n" | Where-Object { $_ -match '^\s*epoch_core\.23\.[ab]:0' }) -join "`n"
Assert-Check ($conclusionChoiceText -notmatch '(?i)campaign|participat|phase|einstieg|kampagne|teilnahme|zukünftigen phasen') 'Conclusion options must use only in-world language'
Assert-Check (($englishLoc + $germanLoc) -notmatch '(?i)UAP|Universal Ascension|original purpose|ursprüngliche zivilisation|ursprüngliche Zweck|eigentliche Zweck') 'Phase I closing text must not reveal the later purpose or UAP'

# AI routes and absent-object recovery must be explicit at each blocking step.
foreach ($id in @(2,3,4,5,6,7,20,22,23)) {
	$decisionEvent = Get-EventBlock $events $id
	Assert-Check ($null -ne $decisionEvent -and $decisionEvent -match 'ai_chance\s*=\s*\{\s*factor\s*=') "Blocking event epoch_core.$id must provide AI decision weights"
}
foreach ($id in @(4,5)) {
	$followup = Get-EventBlock $events $id
	Assert-Check ($followup -match 'epoch_core_create_expedition\s*=\s*yes' -and $followup -match 'set_country_flag\s*=\s*epoch_core_expedition_project_enabled') "AI follow-up epoch_core.$id must use the normal owned expedition route"
}
Assert-Check ((Get-EventBlock $events 12) -match 'exists\s*=\s*event_target:epoch_core_expedition_ship@root\.owner') 'Expedition success must safely handle a missing saved ship'
Assert-Check ((Get-EventBlock $events 28) -match 'exists\s*=\s*event_target:epoch_core_expedition_ship@root\.owner') 'Expedition project failure must safely handle a missing saved ship'
Assert-Check ((Get-EventBlock $events 22) -match 'exists\s*=\s*event_target:epoch_core_world@root' -and (Get-EventBlock $events 22) -match 'save_global_event_target_as\s*=\s*epoch_core_world@root') 'Structure event must fall back to a local capital if the saved world target is missing'
Assert-Check ((Get-EventBlock $events 23) -match 'exists\s*=\s*capital_scope' -and (Get-EventBlock $events 23) -match 'epoch_core_permanent_scar_fallback') 'Conclusion must preserve a permanent consequence if the empire has no capital'
Assert-Check ($onActions -match 'on_country_created\s*=\s*\{[\s\S]*?epoch_core\.1' -and $onActions -match 'on_country_type_changed\s*=\s*\{[\s\S]*?epoch_core\.1') 'Newly created or converted empires must receive the same guarded enrollment dispatch'

# Saved system targets must be persistent and country-keyed for concurrent empires.
Assert-Check ($events -match 'save_global_event_target_as\s*=\s*epoch_core_signal_system@root\.owner' -and $events -notmatch 'save_event_target_as\s*=\s*epoch_core_signal_system') 'Signal system must be saved as a persistent owner-keyed global event target'
Assert-Check ($events -match 'event_target:epoch_core_signal_system@root\s*=\s*\{\s*enable_special_project') 'Country-scoped follow-ups must enable projects at the owning empire system'
Assert-Check ($scriptedEffects -match 'save_global_event_target_as\s*=\s*epoch_core_expedition_ship@root' -and $scriptedEffects -match 'save_global_event_target_as\s*=\s*epoch_core_expedition_scientist@root') 'Expedition ship and scientist must be saved against the current owner'
Assert-Check ($events -match 'save_global_event_target_as\s*=\s*epoch_core_world@root' -and $events -match 'event_target:epoch_core_world@root') 'Contamination and structure world targets must be keyed to their campaign owner'
$optOutGuards = @(
	(Get-EventBlock $events 15), (Get-EventBlock $events 2), (Get-EventBlock $events 3),
	(Get-EventBlock $events 4), (Get-EventBlock $events 5), (Get-EventBlock $events 6),
	(Get-EventBlock $events 7), (Get-EventBlock $events 20), (Get-EventBlock $events 22),
	(Get-EventBlock $events 23), (Get-EventBlock $events 29)
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
