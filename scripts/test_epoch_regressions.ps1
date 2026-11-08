param(
	[string]$Root = (Split-Path -Parent $PSScriptRoot),
	[string]$LogDirectory = (Join-Path ([Environment]::GetFolderPath('MyDocuments')) 'Paradox Interactive/Stellaris/logs'),
	[string]$VanillaRoot = 'G:\Steam\steamapps\common\Stellaris'
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
$features = Read-ProjectFile 'common/deposits/epoch_phase_ii_features.txt'
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
foreach ($section in @('First Echo', 'Missing Expedition', 'First Contamination', 'The Silent Structure', 'Phase-I Conclusion')) {
	Assert-Check ($phaseSpec.Contains($section)) "Binding Phase I specification is missing section: $section"
}
Assert-Check ($phaseSpec -match 'does not establish complete multiplayer, AI, or alternative-path validation') 'Phase I specification must distinguish implementation from final in-game acceptance'
foreach ($requirement in @('permanent exit', 'AI', 'Each empire', 'save/load', 'multiplayer', 'Engine-specific', 'negative gameplay consequence', 'in-world', 'Preserve uncertainty')) {
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
$scriptedLoc = Read-ProjectFile 'common/scripted_loc/epoch_core_loc.txt'
Assert-Check (Test-BraceBalance $scriptedLoc) 'Scripted conclusion localization must parse balanced blocks'
foreach ($ref in [regex]::Matches($scriptedLoc, 'localization_key\s*=\s*([A-Za-z0-9_.]+)')) { Assert-Check ($allLocKeys.ContainsKey($ref.Groups[1].Value)) "Missing summary localization $($ref.Groups[1].Value)" }
foreach ($stage in [regex]::Matches($situations, '(?m)^\s*(stage_[a-z_]+)\s*=\s*\{')) { Assert-Check ($allLocKeys.ContainsKey($stage.Groups[1].Value)) "Missing stage localization $($stage.Groups[1].Value)" }
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
Assert-Check (((($localizedPlayerText -join "`n") -replace '\[[^\]]+\]', '') -replace '\$[^$]+\$', '') -notmatch '(?i)epoch_core|epoch_first_echo|EPOCH_|event.flag|set_country_flag|set_variable|debug|phase\s*(?:i|1)\b|kampagnenstatus|kampagnen-flagge') 'Player-facing localisations must not expose internal IDs, flags, variables, debugging, or phase labels outside native localization references'

# Event ID coverage across event calls, project callbacks and on_action entries.
$eventDefinitions = @([regex]::Matches($events, '(?m)^\s*id\s*=\s*epoch_core\.(\d+)\s*$') | ForEach-Object { $_.Groups[1].Value } | Sort-Object -Unique)
$eventDefinitionCount = @([regex]::Matches($events, '(?m)^\s*id\s*=\s*epoch_core\.\d+\s*$')).Count
Assert-Check ($eventDefinitionCount -eq $eventDefinitions.Count) 'Event IDs must not be defined more than once'
$eventRefs = @([regex]::Matches($events + "`n" + $projects + "`n" + $onActions, '\bepoch_core\.(\d+)\b') | ForEach-Object { $_.Groups[1].Value } | Sort-Object -Unique)
foreach ($id in $eventRefs) { Assert-Check ($id -in $eventDefinitions) "Reference to undefined event epoch_core.$id" }
Assert-Check ($onActions -match 'on_survey_planet\s*=\s*\{[\s\S]*?epoch_core\.15' -and $onActions -match 'on_game_start_country\s*=\s*\{[\s\S]*?epoch_core\.1') 'Vanilla survey and country-start hooks must dispatch defined EPOCH entry events'

# Situation boundaries need both approach progress and a saved, phase-specific
# objective. The first ship-project callback opens the next First Echo choice;
# it does not itself award progress.
$situationBlock = Get-Block $situations '(?m)^\s*epoch_first_echo_investigation\s*=\s*\{' 'First Echo situation'
Assert-Check ($null -ne $situationBlock) 'First Echo situation definition is missing'
$sourceStage = Get-Block $situationBlock '(?m)^\s*stage_source_analysis\s*=\s*\{' 'source-analysis stage'
$firstCallback = Get-EventBlock $events 10
Assert-Check ($null -ne $sourceStage -and $sourceStage -notmatch 'situation_event\s*=\s*\{\s*id\s*=\s*epoch_core\.3' -and $firstCallback -match 'situation_event\s*=\s*\{\s*id\s*=\s*epoch_core\.3') 'epoch_core.3 must follow the first successful First Echo project, not a stage threshold'
$signalStage = Get-Block $situationBlock '(?m)^\s*stage_signal_analysis\s*=\s*\{' 'signal-analysis stage'
Assert-Check ($signalStage -notmatch 'situation_event\s*=\s*\{\s*id\s*=\s*epoch_core\.3') 'epoch_core.3 must not fire when the Situation is first created'
Assert-Check (@([regex]::Matches($situationBlock, '(?m)^\s*stage_[a-z_]+\s*=\s*\{')).Count -eq 10 -and $situationBlock -notmatch 'end\s*=\s*\{') 'All five sections need separate research/wait stages with fixed ends'
Assert-Check ($situationBlock -match 'permanent\s*=\s*yes' -and $situationBlock -match 'on_progress_complete\s*=\s*\{[\s\S]*epoch_core_conclusion_decision_resolved[\s\S]*destroy_situation\s*=\s*this') 'The final stage must remain at full progress until its conclusion choice is recorded'
Assert-Check ($situationBlock -match 'monthly_progress\s*=\s*\{\s*base\s*=\s*0[\s\S]*current_situation_approach[\s\S]*situation_progress\s*<\s*15' -and $situationBlock -match 'situation_progress\s*<\s*25' -and $situationBlock -match 'situation_progress\s*<\s*35' -and $situationBlock -match 'situation_progress\s*<\s*45') 'Situation progress must come from the selected approach and stop at each explicit phase boundary'
Assert-Check ($events -notmatch 'add_situation_progress\s*=') 'Project and choice callbacks must not award manual progress or complete projects automatically'
Assert-Check ($situationBlock -match 'epoch_echo_cautious_approach[\s\S]*?energy\s*=\s*2' -and $situationBlock -match 'epoch_echo_aggressive_approach[\s\S]*?energy\s*=\s*5') 'Situation approaches must have distinct, visible upkeep costs'
foreach ($approach in @('epoch_echo_cautious_approach','epoch_echo_aggressive_approach','epoch_echo_containment_approach','epoch_echo_minimal_approach')) {
	$approachBlock = Get-Block $situationBlock "(?m)^\s*approach\s*=\s*\{\s*name\s*=\s*$approach\b" $approach
	Assert-Check ($null -ne $approachBlock -and $approachBlock -match 'potential\s*=\s*\{' -and $approachBlock -match 'resources\s*=\s*\{[\s\S]*upkeep\s*=') "Situation approach $approach must be gated and impose real resource upkeep"
	Assert-Check ($allLocKeys.ContainsKey($approach) -and $allLocKeys.ContainsKey("${approach}_desc")) "Situation approach $approach needs English and German title/description keys"
}
Assert-Check ($situationBlock -match 'epoch_echo_containment_approach[\s\S]*current_stage\s*=\s*stage_contamination[\s\S]*energy\s*=\s*4\s+minerals\s*=\s*1' -and $situationBlock -match 'epoch_echo_minimal_approach[\s\S]*energy\s*=\s*1') 'Containment and minimal operation must have stage-appropriate, distinct ongoing costs'
$cautiousApproach = Get-Block $situationBlock '(?m)^\s*approach\s*=\s*\{\s*name\s*=\s*epoch_echo_cautious_approach\b' 'cautious approach'
$intensiveApproach = Get-Block $situationBlock '(?m)^\s*approach\s*=\s*\{\s*name\s*=\s*epoch_echo_aggressive_approach\b' 'intensive approach'
$containmentApproach = Get-Block $situationBlock '(?m)^\s*approach\s*=\s*\{\s*name\s*=\s*epoch_echo_containment_approach\b' 'containment approach'
$minimalApproach = Get-Block $situationBlock '(?m)^\s*approach\s*=\s*\{\s*name\s*=\s*epoch_echo_minimal_approach\b' 'minimal approach'
Assert-Check ($cautiousApproach -match 'country_physics_research_produces_mult\s*=\s*0\.02' -and $intensiveApproach -match 'country_engineering_research_produces_mult\s*=\s*0\.03' -and $containmentApproach -match 'country_society_research_produces_mult\s*=\s*0\.02' -and $minimalApproach -match 'country_physics_research_produces_mult\s*=\s*-0\.02' -and $situationBlock -notmatch 'on_select\s*=|set_country_flag\s*=\s*epoch_core_structure_risk_increased') 'Approaches must use their live modifiers/upkeep without turning temporary selections into permanent structural risk'
Assert-Check ($situationBlock -match 'on_monthly\s*=\s*\{\s*events\s*=\s*\{\s*epoch_core\.47\s+epoch_core\.48\s*\}\s*\}' -and (Get-EventBlock $events 47) -match 'situation\s*=\s*this[\s\S]*owner\s*=\s*\{[\s\S]*?country_event\s*=\s*\{\s*id\s*=\s*epoch_core\.44' -and (Get-EventBlock $events 48) -match 'situation\s*=\s*this[\s\S]*situation_progress\s*>=\s*15' -and $onActions -notmatch 'on_monthly_pulse_country') 'Situation monthly events must update feedback and release gated objectives without a global country pulse'

# Trace every project/callback/decision edge, including the country-scope bridge
# used to avoid a Situation -> Country context switch when enabling projects.
$expectedCallbacks = @{
	'EPOCH_FIRST_ECHO_CAUTIOUS' = 10; 'EPOCH_FIRST_ECHO_AGGRESSIVE' = 10
	'EPOCH_ECHO_CALIBRATION' = 11; 'EPOCH_ECHO_BASELINE' = 11
	'EPOCH_ECHO_OVERDRIVE' = 11; 'EPOCH_ECHO_THROTTLED' = 11
	'EPOCH_MISSING_EXPEDITION' = 12
	'EPOCH_EXPEDITION_RESCUE' = 13; 'EPOCH_EXPEDITION_SALVAGE' = 13; 'EPOCH_EXPEDITION_SURVEY' = 13
	'EPOCH_CONTAMINATION_STUDY' = 21; 'EPOCH_STRUCTURE_REMOTE_STUDY' = 45
}
foreach ($projectKey in $expectedCallbacks.Keys) {
	$block = Get-Block $projects "(?m)^\s*special_project\s*=\s*\{\s*key\s*=\s*`"$([regex]::Escape($projectKey))`"" $projectKey
	Assert-Check ($null -ne $block) "Project definition missing: $projectKey"
	$callback = $expectedCallbacks[$projectKey]
	Assert-Check ($block -match "event_scope\s*=\s*ship_event[\s\S]*on_success\s*=\s*\{\s*ship_event\s*=\s*\{\s*id\s*=\s*epoch_core\.$callback\s*\}\s*\}") "$projectKey must call ship event epoch_core.$callback directly in the Vanilla performing-ship scope"
	Assert-Check ($block -notmatch 'cost\s*=\s*[^\r\n]+[\s\S]*days_to_research\s*=|days_to_research\s*=\s*[^\r\n]+[\s\S]*cost\s*=') "$projectKey cannot define both cost and days_to_research"
	Assert-Check ($block -match '(?:cost|days_to_research)\s*=') "$projectKey must define one valid project duration/cost mode"
}
$contaminationProject = Get-Block $projects '(?m)^\s*special_project\s*=\s*\{\s*key\s*=\s*"EPOCH_CONTAMINATION_STUDY"' 'contamination project'
Assert-Check ($contaminationProject -match 'on_fail\s*=\s*\{\s*country_event\s*=\s*\{\s*id\s*=\s*epoch_core\.26') 'Contamination project failure must open an explicit retry/abandon decision'
$missingProject = Get-Block $projects '(?m)^\s*special_project\s*=\s*\{\s*key\s*=\s*"EPOCH_MISSING_EXPEDITION"' 'missing expedition project'
Assert-Check ($missingProject -match 'on_fail\s*=\s*\{\s*country_event\s*=\s*\{\s*id\s*=\s*epoch_core\.28') 'Expedition project failure must open a recovery decision without destroying a ship'
Assert-Check ($firstCallback -match 'epoch_core_echo_first_resolved' -and $firstCallback -match 'situation_event\s*=\s*\{\s*id\s*=\s*epoch_core\.3' -and $firstCallback -notmatch 'add_situation_progress|destroy_ship\s*=') 'The first First Echo callback must open the follow-up choice without fabricating progress or removing its ship'
$opening = Get-EventBlock $events 2
Assert-Check ($opening -match 'name\s*=\s*epoch_core\.2\.a[\s\S]*start_situation' -and $opening -match 'name\s*=\s*epoch_core\.2\.b[\s\S]*start_situation' -and $opening -notmatch 'enable_special_project') 'The two opening choices must start the Situation; its progress threshold releases First Echo'
Assert-Check ($opening -match 'name\s*=\s*epoch_core\.2\.c[\s\S]*set_country_flag\s*=\s*epoch_core_campaign_opted_out' -and $opening -notmatch 'name\s*=\s*epoch_core\.2\.c[\s\S]*start_situation|name\s*=\s*epoch_core\.2\.c[\s\S]*enable_special_project') 'Refusal must start no Situation or project'
Assert-Check ((Get-EventBlock $events 2) -match 'name\s*=\s*epoch_core\.2\.a[\s\S]*hidden_effect\s*=\s*\{' -and (Get-EventBlock $events 2) -match 'name\s*=\s*epoch_core\.2\.c[\s\S]*hidden_effect\s*=\s*\{') 'Opening decisions must hide internal campaign-state effects from event tooltips'
Assert-Check ((Get-EventBlock $events 3) -match 'hidden_effect\s*=\s*\{[\s\S]*set_situation_approach' -and (Get-EventBlock $events 20) -match 'hidden_effect\s*=\s*\{[\s\S]*enable_special_project') 'Interactive approach and contamination options must hide internal effects while presenting player-facing choices'
foreach ($id in @(4,5,6,7,20,22,23,40,41,42,43)) { Assert-Check ((Get-EventBlock $events $id) -match 'hidden_effect\s*=\s*\{') "Player-facing event epoch_core.$id must execute internal effects through the hidden-effect pattern" }
Assert-Check ($englishLoc -notmatch 'epoch_core\.20\.b\.tooltip:0 "Cost:' -and $germanLoc -notmatch 'epoch_core\.20\.b\.tooltip:0 "Kosten:' -and ([regex]::Matches((Get-EventBlock $events 20), 'add_resource\s*=\s*\{\s*energy\s*=\s*-500\s+minerals\s*=\s*-300\s*\}')).Count -eq 1) 'Containment cost must be a single native option effect, without a duplicate localized cost note'
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
Assert-Check ($secondCallback -match 'set_country_flag\s*=\s*epoch_core_first_echo_complete' -and $secondCallback -notmatch 'add_situation_progress|destroy_situation\s*=|destroy_ship\s*=|country_event\s*=\s*\{\s*id\s*=\s*epoch_core\.(?:4|5)') 'epoch_core.11 must record First Echo completion without starting the next phase early'
$phaseGates = @(
    @{ Research = 'stage_signal_analysis'; Stage = 'stage_echo_resolution'; Threshold = 15; End = 20; Objective = 'epoch_core_first_echo_complete' },
    @{ Research = 'stage_source_analysis'; Stage = 'stage_expedition_resolution'; Threshold = 25; End = 30; Objective = 'epoch_core_expedition_phase_resolved' },
    @{ Research = 'stage_contamination'; Stage = 'stage_contamination_resolution'; Threshold = 35; End = 40; Objective = 'epoch_core_contamination_phase_resolved' },
    @{ Research = 'stage_excavation'; Stage = 'stage_structure_resolution'; Threshold = 45; End = 50; Objective = 'epoch_core_structure_phase_resolved' },
    @{ Research = 'stage_report'; Stage = 'stage_conclusion_resolution'; Threshold = 55; End = 60; Objective = 'epoch_core_conclusion_decision_resolved' }
)
foreach ($gate in $phaseGates) {
    $research = Get-Block $situationBlock "(?m)^\s*$($gate.Research)\s*=\s*\{" $gate.Research
    $wait = Get-Block $situationBlock "(?m)^\s*$($gate.Stage)\s*=\s*\{" $gate.Stage
    Assert-Check ($research -match "end\s*=\s*$($gate.Threshold)\b" -and $research -notmatch 'on_first_enter') "$($gate.Research) must end at its fixed research threshold"
    Assert-Check ($wait -match "end\s*=\s*$($gate.End)\b" -and $wait -match 'on_first_enter\s*=\s*\{\s*situation_event\s*=\s*\{\s*id\s*=\s*epoch_core\.48') "$($gate.Stage) must release its objective through native stage entry"
    Assert-Check ((Get-EventBlock $events 48) -match "current_stage\s*=\s*$($gate.Stage)\b[\s\S]*situation_progress\s*>=\s*$($gate.Threshold)\b") "$($gate.Stage) dispatcher must recognize the stage present at the threshold"
    Assert-Check ($events -match "set_country_flag\s*=\s*$($gate.Objective)\b") "$($gate.Stage) must have a saved resolution state"
    Assert-Check ($allLocKeys.ContainsKey($gate.Research) -and $allLocKeys.ContainsKey($gate.Stage)) "$($gate.Stage) and its research stage must be localized in both languages"
}
Assert-Check ($situationBlock -match 'current_stage\s*=\s*stage_signal_analysis\s+situation_progress\s*<\s*15' -and $situationBlock -match 'current_stage\s*=\s*stage_echo_resolution[\s\S]*?epoch_core_first_echo_complete[\s\S]*?situation_progress\s*<\s*20' -and $situationBlock -match 'current_stage\s*=\s*stage_echo_resolution[\s\S]*?epoch_core_echo_second_abandoned') 'Phase 1 must collect progress to 15, wait for its objective, then advance toward phase 2'
Assert-Check ((Get-EventBlock $events 47) -match 'set_country_flag\s*=\s*epoch_core_monthly_dispatcher_seen' -and (Get-EventBlock $events 47) -match 'epoch_core_situation_diagnostics[\s\S]*GetCurrentStage[\s\S]*GetProgress[\s\S]*epoch_core_echo_first_project_pending[\s\S]*epoch_core_first_echo_complete' -and (Get-EventBlock $events 49) -match 'epoch_core_situation_diagnostics') 'Opt-in diagnostics must report stage, progress, dispatcher, project, and objective state'
Assert-Check ((Get-EventBlock $events 48) -match 'current_stage\s*=\s*stage_echo_resolution[\s\S]*?situation_progress\s*>=\s*15') 'The native stage-entry callback must release the first project at the phase-1 threshold'
Assert-Check ((Get-EventBlock $events 2) -notmatch 'enable_special_project\s*=\s*\{\s*name\s*=\s*"EPOCH_FIRST_ECHO_' -and (Get-EventBlock $events 48) -match 'epoch_core_echo_first_project_pending[\s\S]*event_target:epoch_core_signal_system@root\.owner[\s\S]*EPOCH_FIRST_ECHO_CAUTIOUS[\s\S]*EPOCH_FIRST_ECHO_AGGRESSIVE') 'First Echo projects must wait for the signal threshold, use the Situation owner, and dispatch once'
Assert-Check ((Get-EventBlock $events 48) -match 'epoch_core_expedition_phase_started[\s\S]*epoch_core\.4[\s\S]*epoch_core\.5' -and (Get-EventBlock $events 48) -match 'epoch_core_expedition_phase_resolved[\s\S]*epoch_core\.20' -and (Get-EventBlock $events 48) -match 'epoch_core_contamination_phase_resolved[\s\S]*epoch_core\.22' -and (Get-EventBlock $events 48) -match 'epoch_core_structure_phase_resolved[\s\S]*epoch_core\.23') 'All five phase events must be dispatched only by the current phase threshold'
Assert-Check ((Get-EventBlock $events 11) -notmatch 'country_event\s*=\s*\{\s*id\s*=\s*epoch_core\.(?:4|5)' -and (Get-EventBlock $events 7) -notmatch 'country_event\s*=\s*\{\s*id\s*=\s*epoch_core\.20' -and (Get-EventBlock $events 20) -notmatch 'country_event\s*=\s*\{\s*id\s*=\s*epoch_core\.22' -and (Get-EventBlock $events 21) -notmatch 'country_event\s*=\s*\{\s*id\s*=\s*epoch_core\.22' -and (Get-EventBlock $events 43) -notmatch 'country_event\s*=\s*\{\s*id\s*=\s*epoch_core\.23') 'Objective callbacks must not start future campaign chains in parallel'
Assert-Check ((Get-EventBlock $events 48) -match 'set_country_flag\s*=\s*epoch_core_echo_first_project_pending[\s\S]*enable_special_project' -and ([regex]::Matches((Get-EventBlock $events 48), 'set_country_flag\s*=\s*epoch_core_(?:expedition_phase_started|contamination_event_started|structure_event_started|conclusion_event_started)')).Count -eq 4) 'Every threshold release must persist its one-shot guard before scheduling work for save/load idempotency'
Assert-Check ((Get-EventBlock $events 32) -match 'epoch_core_echo_second_abandoned' -and (Get-EventBlock $events 32) -notmatch 'add_situation_progress') 'Only an explicit First Echo abandonment resolves that alternative; a failed project alone does not'
Assert-Check ((Get-EventBlock $events 28) -match 'epoch_core_expedition_project_abandoned' -and (Get-EventBlock $events 28) -notmatch 'epoch_core_expedition_phase_resolved|add_situation_progress') 'An expedition project failure alone must not satisfy its stage gate'
Assert-Check ((Get-Block (Get-EventBlock $events 26) '(?m)^\s*immediate\s*=\s*\{' 'contamination failure effects') -notmatch 'epoch_core_contamination_phase_resolved' -and (Get-EventBlock $events 26) -match 'name\s*=\s*epoch_core\.26\.b[\s\S]*epoch_core_contamination_phase_resolved') 'Failed contamination work satisfies the gate only through the explicit abandon option'
Assert-Check ((Get-Block (Get-EventBlock $events 46) '(?m)^\s*option\s*=\s*\{\s*name\s*=\s*epoch_core\.46\.a' 'remote retry option') -notmatch 'epoch_core_structure_phase_resolved' -and (Get-EventBlock $events 46) -match 'name\s*=\s*epoch_core\.46\.b[\s\S]*epoch_core_structure_phase_resolved') 'Failed remote study satisfies the structure gate only through explicit archive resolution'
Assert-Check ((Get-EventBlock $events 23) -match 'name\s*=\s*epoch_core\.23\.a[\s\S]*epoch_core_conclusion_decision_resolved' -and (Get-EventBlock $events 23) -match 'name\s*=\s*epoch_core\.23\.b[\s\S]*epoch_core_conclusion_decision_resolved') 'Both final decisions must resolve the conclusion gate; exit also closes the Situation'
foreach ($choice in @('a','b')) {
    $option = Get-Block (Get-EventBlock $events 23) "option\s*=\s*\{\s*name\s*=\s*epoch_core\.23\.$choice\b" "final choice $choice"
    Assert-Check ($option -match 'set_country_flag\s*=\s*epoch_core_conclusion_decision_resolved' -and $option -match 'set_country_flag\s*=\s*epoch_core_phase_i_situation_complete' -and $option -match 'remove_country_flag\s*=\s*epoch_core_campaign_active' -and $option -match 'destroy_situation\s*=\s*this') "Final choice $choice must immediately and permanently close the Situation"
}
Assert-Check (($phaseGates | ForEach-Object { $_.Objective; $_.Alternative } | Where-Object { $_ }) -notmatch '^$' -and $events -notmatch 'set_variable\s*=\s*\{\s*which\s*=\s*epoch_core_(?:first_echo_complete|expedition_phase_resolved|contamination_phase_resolved|structure_phase_resolved|conclusion_decision_resolved)') 'Phase gates must use persistent campaign flags rather than transient local test state'
Assert-Check ($situationBlock -match 'desc\s*=\s*\{\s*trigger\s*=\s*\{\s*always\s*=\s*yes\s*\}\s*text\s*=\s*epoch_first_echo_investigation_desc\s*\}' -and $situationBlock -notmatch 'epoch_core_situation_(?:waiting|active)') 'Situation description must stay narrative and independent of monthly status flags'
Assert-Check ((Get-EventBlock $events 31) -match 'epoch_core_campaign_opted_out[\s\S]*destroy_situation\s*=\s*this' -and (Get-EventBlock $events 23) -match 'epoch_core_campaign_opted_out[\s\S]*destroy_situation\s*=\s*this') 'Both campaign exit routes must destroy the saved Situation to avoid a deadlock'
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
Assert-Check ($finalEvent -match 'NOT\s*=\s*\{\s*has_country_flag\s*=\s*epoch_core_expedition_later_clue_seen\s*\}' -and $finalEvent -match 'epoch_core_expedition_survivors_found[\s\S]*remove_leader_flag\s*=\s*epoch_core_missing_expedition[\s\S]*epoch_core_expedition_scientist_recovered' -and $finalEvent -match 'has_country_flag\s*=\s*epoch_core_expedition_contact_lost[\s\S]*kill_leader\s*=\s*\{\s*show_notification\s*=\s*no\s*\}[\s\S]*epoch_core_expedition_scientist_lost') 'The saved scientist may be removed only after real contact loss; project abandonment cannot imply a missing scientist'

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
Assert-Check ($siteVisibility -match 'is_country_type\s*=\s*default' -and $siteVisibility -match 'has_country_flag\s*=\s*epoch_core_structure_site_created' -and $siteVisibility -notmatch 'default_site_visible_trigger|from\.planet') 'Site visibility must use a valid country-scope Vanilla check and remain owner-specific'
Assert-Check ($silentSite -notmatch '(?m)^\s*potential\s*=|from\.planet' -and $silentSite -match 'allow\s*=\s*\{[\s\S]*is_ship_class\s*=\s*shipclass_science_ship[\s\S]*exists\s*=\s*leader[\s\S]*leader\s*=\s*\{\s*leader_class\s*=\s*scientist\s*\}[\s\S]*epoch_core_structure_site_created') 'Site eligibility must match vanilla fleet-scope requirements and avoid the invalid from.planet scope switch'
Assert-Check ($silentSite -notmatch '(?m)^\s*potential\s*=') 'Site must not add a non-vanilla potential filter that blocks every excavation fleet'
# Planetary Feature families, exclusive state transitions, and save migration.
$featureDefinitions = [regex]::Matches($features, '(?m)^(d_epoch_[A-Za-z0-9_]+)\s*=\s*\{') | ForEach-Object { $_.Groups[1].Value }
Assert-Check ($features -notmatch 'category\s*=\s*deposit_cat_blockers') 'No EPOCH Planetary Feature may use a manually clearable blocker category'
Assert-Check (@($featureDefinitions | Where-Object { $_ -match '^d_epoch_resonance_contamination_' }).Count -eq 8 -and @($featureDefinitions | Where-Object { $_ -match '^d_epoch_resonance_scar' }).Count -eq 3 -and @($featureDefinitions | Where-Object { $_ -match '^d_epoch_silent_structure_' }).Count -eq 4 -and $featureDefinitions.Count -eq 15) 'All feature deposits must belong to exactly the three defined logical families'
$contaminationClear = Get-Block $scriptedEffects '(?m)^epoch_core_clear_contamination_deposits\s*=\s*\{' 'Shared contamination family state cleanup'
foreach ($state in @('active','worsened','studied','contained','latent','resonant','unstable','controlled')) { Assert-Check ($contaminationClear -match "remove_deposit\s*=\s*d_epoch_resonance_contamination_$state\b") "Contamination transitions must remove prior $state state" }
Assert-Check ((Get-Block $scriptedEffects '(?m)^epoch_ii_clear_site_state\s*=\s*\{' 'Phase II state cleanup') -match 'epoch_core_clear_contamination_deposits\s*=\s*yes') 'Phase II setters must delegate to the shared contamination-family manager'
$phaseTwoContaminationClear = Get-Block $scriptedEffects '(?m)^epoch_ii_clear_site_state\s*=\s*\{' 'Phase II state cleanup'
Assert-Check ($phaseTwoContaminationClear -match 'remove_modifier\s*=\s*epoch_ii_resonance_active' -and $phaseTwoContaminationClear -notmatch 'remove_planet_flag\s*=\s*epoch_core_contamination_(active|worsened|studied)_state') 'Phase-I consequences must survive Phase-II transitions'
foreach ($setter in @('epoch_core_apply_contamination_active','epoch_core_apply_contamination_worsened','epoch_core_apply_contamination_studied')) { Assert-Check ((Get-Block $scriptedEffects "(?m)^$setter\s*=\s*\{" $setter) -match 'epoch_core_remove_contamination_effects\s*=\s*yes') "$setter must use shared contamination cleanup" }
foreach ($setter in @('epoch_ii_set_site_latent','epoch_ii_set_site_active','epoch_ii_set_site_unstable','epoch_ii_set_site_controlled')) { Assert-Check ((Get-Block $scriptedEffects "(?m)^$setter\s*=\s*\{" $setter) -match 'epoch_ii_clear_site_state\s*=\s*yes') "$setter must clear the contamination family before setting its state" }
foreach ($setter in @('epoch_core_set_resonance_scar','epoch_core_set_resonance_scar_altered','epoch_core_set_resonance_scar_healed')) { Assert-Check ((Get-Block $scriptedEffects "(?m)^$setter\s*=\s*\{" $setter) -match 'epoch_core_clear_resonance_scar\s*=\s*yes') "$setter must enforce one scar state" }
foreach ($setter in @('epoch_core_set_structure_unsecured','epoch_core_set_structure_secured','epoch_core_set_structure_investigated','epoch_core_set_structure_destroyed')) { Assert-Check ((Get-Block $scriptedEffects "(?m)^$setter\s*=\s*\{" $setter) -match 'epoch_core_clear_structure_state\s*=\s*yes') "$setter must enforce one structure state" }
Assert-Check ($contaminationClear -notmatch 'd_epoch_resonance_scar|d_epoch_silent_structure_' -and (Get-Block $scriptedEffects '(?m)^epoch_core_clear_resonance_scar\s*=\s*\{' 'Scar family clear') -notmatch 'd_epoch_resonance_contamination_|d_epoch_silent_structure_' -and (Get-Block $scriptedEffects '(?m)^epoch_core_clear_structure_state\s*=\s*\{' 'Structure family clear') -notmatch 'd_epoch_resonance_contamination_|d_epoch_resonance_scar') 'The three feature-family managers must leave the other two families untouched'
Assert-Check ($events -notmatch 'add_modifier\s*=\s*\{\s*modifier\s*=\s*epoch_core_(silent_structure|structure_secured|structure_investigated|structure_ruins)' -and $scriptedEffects -match 'remove_modifier\s*=\s*epoch_core_silent_structure' -and $scriptedEffects -match 'remove_modifier\s*=\s*epoch_core_structure_secured') 'Legacy structure modifiers must be removed and structure effects must come from features'
foreach ($key in @('d_epoch_silent_structure_unsecured','d_epoch_silent_structure_secured','d_epoch_silent_structure_investigated','d_epoch_silent_structure_destroyed')) { Assert-Check $allLocKeys.ContainsKey($key) "Missing EN/DE structure feature localization $key"; Assert-Check $allLocKeys.ContainsKey(($key + '_desc')) "Missing EN/DE structure feature description $key" }
foreach ($language in @('english','german')) { $locText = Read-ProjectFile "localisation/$language/epoch_core_l_$language.yml"; Assert-Check ($locText -match '(?m)^epoch_resonance_protocol_type:0\s+"') "$language must load the standalone situation type localization key" }
Assert-Check ($siteVisibility -match 'is_country_type\s*=\s*default' -and $silentSite -notmatch 'default_site_visible_trigger|from\.planet') 'Archaeology visibility must avoid the invalid country-to-planet scope switch'

$rollFailed = Get-Block $silentSite '(?m)^\s*on_roll_failed\s*=\s*\{' 'Silent Structure failed-roll callback'
Assert-Check ($rollFailed -match 'from\s*=\s*\{\s*standard_archaeological_site_on_roll_failed\s*=\s*\{\s*RANDOM_EVENTS\s*=\s*no_events\s*\}\s*\}' -and $rollFailed -notmatch '\b(?:prev|owner)\s*=|planet_owner|from\.planet') 'Failed excavation rolls must use only Vanilla''s supported site-score callback and contain no invalid fleet-scope switches'
if (Test-Path -LiteralPath (Join-Path $VanillaRoot 'common/archaeological_site_types/00_base_game_arc_sites.txt')) {
	$vanillaSites = [System.IO.File]::ReadAllText((Join-Path $VanillaRoot 'common/archaeological_site_types/00_base_game_arc_sites.txt'), [System.Text.Encoding]::UTF8)
	$vanillaSite = Get-Block $vanillaSites '(?m)^\s*site_ruins_of_shallash\s*=\s*\{' 'Vanilla four-stage archaeology reference'
	Assert-Check ($null -ne $vanillaSite -and $vanillaSite -match 'stages\s*=\s*4' -and $vanillaSite -notmatch '(?m)^\s*potential\s*=') 'Installed Vanilla reference site must demonstrate four stages without a potential filter'
	Assert-Check ($vanillaSite -match 'allow\s*=\s*\{[\s\S]*exists\s*=\s*leader[\s\S]*leader_class\s*=\s*scientist[\s\S]*visible\s*=\s*\{\s*default_site_visible_trigger\s*=\s*yes') 'Installed Vanilla reference site must demonstrate fleet scientist eligibility and default visibility'
	Assert-Check ($vanillaSite -match 'on_roll_failed\s*=\s*\{\s*from\s*=\s*\{\s*standard_archaeological_site_on_roll_failed\s*=') 'Installed Vanilla site must demonstrate native failed-roll handling from the archaeological-site scope'
} else { Write-Output "VANILLA SOURCE CHECK skipped: no archaeological-site source under $VanillaRoot." }
$vanillaSituationPath = Join-Path $VanillaRoot 'common/situations/12_biogenesis_situations.txt'
$vanillaProjectPath = Join-Path $VanillaRoot 'common/special_projects/00_projects_1.txt'
if ((Test-Path -LiteralPath $vanillaSituationPath) -and (Test-Path -LiteralPath $vanillaProjectPath)) {
	$vanillaSituations = [System.IO.File]::ReadAllText($vanillaSituationPath, [System.Text.Encoding]::UTF8)
	$vanillaProjects = [System.IO.File]::ReadAllText($vanillaProjectPath, [System.Text.Encoding]::UTF8)
	$vanillaPredatorSituation = Get-Block $vanillaSituations '(?m)^evolutionary_predators_situation\s*=\s*\{' 'Vanilla scriptable Situation'
	$vanillaScriptableStage = Get-Block $vanillaPredatorSituation '(?m)^\s*stage_1\s*=\s*\{' 'Vanilla scriptable Situation stage'
	$vanillaShipProject = Get-Block $vanillaProjects '(?m)^\s*special_project\s*=\s*\{\s*key\s*=\s*"GAS_GIANT_SIGNAL"' 'Vanilla ship-scope project callback'
	Assert-Check ($vanillaScriptableStage -match 'end\s*=\s*\{\s*base\s*=\s*1000[\s\S]*mult\s*=') 'Installed Vanilla 4.5.3 must demonstrate a scriptable Situation stage end'
	Assert-Check ($vanillaSituations -match 'on_monthly\s*=\s*\{[\s\S]*?events\s*=\s*\{') 'Installed Vanilla situations must use an events list for Situation on_monthly dispatch'
	Assert-Check ($vanillaShipProject -match 'event_scope\s*=\s*ship_event[\s\S]*on_success\s*=\s*\{\s*ship_event\s*=\s*\{\s*id\s*=\s*anomaly\.5001') 'Installed Vanilla project callback must directly dispatch a ship_event in ship scope'
} else { Write-Output "VANILLA SITUATION/PROJECT SOURCE CHECK skipped: no source under $VanillaRoot." }
Assert-Check ((Get-EventBlock $events 22) -notmatch 'add_situation_progress\s*=\s*20' -and (Get-EventBlock $events 22) -match 'epoch_core_structure_site_creation_failed[\s\S]*country_event\s*=\s*\{\s*id\s*=\s*epoch_core\.44') 'Creating the archaeological site must not count as excavation progress; missing sites open recovery choices'
Assert-Check ((Get-EventBlock $events 44) -match 'EPOCH_STRUCTURE_REMOTE_STUDY[\s\S]*epoch_core_structure_choice_recorded' -and (Get-EventBlock $events 44) -match 'epoch_core.44.b[\s\S]*epoch_core_structure_choice_recorded') 'A destroyed or missing site must offer remote study or explicit closure'
Assert-Check ((Get-EventBlock $events 43) -match 'name\s*=\s*epoch_core\.43\.a[\s\S]*event_target:epoch_core_structure_site@root.owner\s*=\s*\{\s*set_site_progress_locked\s*=\s*yes' -and (Get-EventBlock $events 43) -match 'destroy_archaeological_site\s*=\s*this' -and (Get-EventBlock $events 43) -match 'epoch_core_structure_investigated') 'The final callback must terminally lock the saved owned site, destroy it only on the destruction path, or record investigation'
$activeContaminationEffect = Get-Block $scriptedEffects '(?m)^epoch_core_apply_contamination_active\s*=\s*\{' 'class-specific active contamination effect'
$worsenedContaminationEffect = Get-Block $scriptedEffects '(?m)^epoch_core_apply_contamination_worsened\s*=\s*\{' 'class-specific worsened contamination effect'
Assert-Check ($activeContaminationEffect -match 'set_planet_flag\s*=\s*epoch_core_contamination_active_state' -and $activeContaminationEffect -match 'add_deposit\s*=\s*d_epoch_resonance_contamination' -and $features -match 'epoch_core_contamination_active_state[\s\S]*?planet_jobs_food_produces_mult\s*=\s*-0\.05' -and $features -match 'epoch_core_contamination_active_state[\s\S]*?planet_jobs_unity_produces_mult\s*=\s*-0\.05' -and $features -match 'epoch_core_contamination_active_state[\s\S]*?planet_jobs_energy_produces_mult\s*=\s*-0\.05') 'Active contamination uses one Planetary Feature with class-specific planetary economy effects'
Assert-Check ($worsenedContaminationEffect -match 'set_planet_flag\s*=\s*epoch_core_contamination_worsened_state' -and $features -match 'epoch_core_contamination_worsened_state[\s\S]*?planet_jobs_produces_mult\s*=\s*-0\.05') 'Worsened contamination preserves stronger effects on the shared Planetary Feature'
Assert-Check ($conclusionEvent -match 'epoch_core_set_resonance_scar\s*=\s*yes' -and $features -match 'epoch_core_resonance_scar[\s\S]*?planet_jobs_food_produces_mult\s*=\s*-0\.05' -and $features -match 'epoch_core_resonance_scar[\s\S]*?planet_jobs_unity_produces_mult\s*=\s*-0\.05' -and $features -match 'epoch_core_resonance_scar[\s\S]*?planet_jobs_energy_produces_mult\s*=\s*-0\.05') 'Conclusion applies the permanent class-dependent scar through the shared blocker feature'
Assert-Check ($conclusionEvent -match 'epoch_core_permanent_scar_exacerbated' -and $conclusionEvent -match 'epoch_core_expedition_loss_recorded' -and $conclusionEvent -match 'epoch_core_contamination_neglected' -and $conclusionEvent -match 'epoch_core_structure_destroyed') 'Permanent consequence severity must reflect the campaign path'
Assert-Check ($conclusionEvent -match 'days\s*=\s*-1' -and $conclusionEvent -match 'epoch_core_phase_ii_ready' -and $conclusionEvent -match 'epoch_core_campaign_opted_out') 'Permanent consequence must be applied before in-world continuation/closure options'
Assert-Check ($finalEvent -match 'set_country_flag\s*=\s*epoch_core_expedition_phase_resolved' -and (Get-EventBlock $events 48) -match 'stage_contamination_resolution[\s\S]*epoch_core_expedition_phase_resolved[\s\S]*country_event\s*=\s*\{\s*id\s*=\s*epoch_core\.20') 'Expedition report resolves its phase; the Situation threshold releases First Contamination'
Assert-Check ($contaminationEvent -match 'set_country_flag\s*=\s*epoch_core_contamination_phase_resolved' -and (Get-EventBlock $events 21) -match 'set_country_flag\s*=\s*epoch_core_contamination_phase_resolved' -and (Get-EventBlock $events 43) -match 'set_country_flag\s*=\s*epoch_core_structure_phase_resolved' -and (Get-EventBlock $events 45) -match 'set_country_flag\s*=\s*epoch_core_structure_phase_resolved' -and (Get-EventBlock $events 48) -match 'stage_structure_resolution[\s\S]*epoch_core_contamination_phase_resolved[\s\S]*country_event\s*=\s*\{\s*id\s*=\s*epoch_core\.22' -and (Get-EventBlock $events 48) -match 'stage_conclusion_resolution[\s\S]*epoch_core_structure_phase_resolved[\s\S]*country_event\s*=\s*\{\s*id\s*=\s*epoch_core\.23') 'Phase callbacks resolve state; the Situation thresholds release the native site and closing report'
Assert-Check ($conclusionEvent -match 'set_country_flag\s*=\s*epoch_core_campaign_opted_out' -and $conclusionEvent -match 'remove_country_flag\s*=\s*epoch_core_campaign_active' -and $conclusionEvent -match 'set_country_flag\s*=\s*epoch_core_phase_ii_ready') 'Conclusion must set permanent internal exit or Phase II continuation state'
Assert-Check ($modifiers -match 'epoch_core_permanent_scar_organic\s*=\s*\{[\s\S]*?planet_jobs_food_produces_mult\s*=\s*-0\.05' -and $modifiers -match 'epoch_core_permanent_scar_hive\s*=\s*\{[\s\S]*?planet_jobs_unity_produces_mult\s*=\s*-0\.05' -and $modifiers -match 'epoch_core_permanent_scar_machine\s*=\s*\{[\s\S]*?planet_jobs_energy_produces_mult\s*=\s*-0\.05') 'Permanent class-specific modifiers must reduce actual job output'
foreach ($modifierKey in @('epoch_core_permanent_scar_exacerbated', 'epoch_core_permanent_scar_fallback', 'epoch_core_permanent_scar_exacerbated_fallback')) {
	$modifierBlock = Get-Block $modifiers "(?m)^$modifierKey\s*=\s*\{" $modifierKey
	Assert-Check ($null -ne $modifierBlock -and $modifierBlock -notmatch '(?m)^\s*(days|months)\s*=') "$modifierKey must have no timed expiry"
	Assert-Check ($events -match "add_modifier\s*=\s*\{\s*modifier\s*=\s*$modifierKey\s+days\s*=\s*-1") "$modifierKey must be applied permanently"
	Assert-Check ($events -notmatch "remove_modifier\s*=\s*$modifierKey") "$modifierKey must never be removed by campaign events"
}
Assert-Check ($events -notmatch 'days\s*=\s*(?:730|2190)|epoch_core\.(?:33|34|35|36|37|38)|timed_out|timedout') 'No timer or timeout callback may resolve, skip, fail, or destroy a campaign project or site'
foreach ($id in @(30,31,32,26,44,46)) {
	$recovery = Get-EventBlock $events $id
	Assert-Check ($null -ne $recovery -and $recovery -match 'option\s*=\s*\{[\s\S]*ai_chance\s*=') "Real project/site blockage epoch_core.$id must offer an explicit AI-safe resolution"
}
Assert-Check ((Get-EventBlock $events 31) -match 'EPOCH_FIRST_ECHO_[A-Z_]+' -and (Get-EventBlock $events 31) -match 'name\s*=\s*epoch_core\.31\.b[\s\S]*epoch_core_campaign_opted_out[\s\S]*remove_country_flag\s*=\s*epoch_core_campaign_active[\s\S]*destroy_situation\s*=\s*this' -and (Get-EventBlock $events 31) -notmatch 'add_situation_progress\s*=') 'The first-project failure option must be a full campaign exit with no research credit or situation progress'
Assert-Check ((Get-EventBlock $events 32) -match 'epoch_core_echo_second_abandoned' -and (Get-EventBlock $events 32) -match 'EPOCH_ECHO_[A-Z_]+' -and (Get-EventBlock $events 32) -notmatch 'country_event\s*=\s*\{\s*id\s*=\s*epoch_core\.(?:4|5)' -and (Get-EventBlock $events 48) -match 'has_country_flag\s*=\s*epoch_core_echo_second_abandoned[\s\S]*country_event\s*=\s*\{\s*id\s*=\s*epoch_core\.4') 'A follow-up failure offers retry or abandonment; explicit abandonment unlocks the expedition at its Situation threshold'
$conclusionChoiceText = (($englishLoc + $germanLoc) -split "`r?`n" | Where-Object { $_ -match '^\s*epoch_core\.23\.[ab]:0' }) -join "`n"
Assert-Check ($conclusionChoiceText -notmatch '(?i)campaign|participat|phase|einstieg|kampagne|teilnahme|zukünftigen phasen') 'Conclusion options must use only in-world language'
Assert-Check ((($englishLoc + $germanLoc) -split "`r?`n" | Where-Object { $_ -match '^epoch_core\.' }) -join "`n" -notmatch '(?i)UAP|Universal Ascension|original purpose|ursprüngliche zivilisation|ursprüngliche Zweck|eigentliche Zweck') 'Phase I closing text must not reveal the later purpose or UAP'

# AI routes and absent-object recovery must be explicit at each blocking step.
foreach ($id in @(2,3,4,5,6,7,20,22,23,40,41,42,43)) {
	$decisionEvent = Get-EventBlock $events $id
	Assert-Check ($null -ne $decisionEvent -and $decisionEvent -match 'ai_chance\s*=\s*\{\s*factor\s*=') "Blocking event epoch_core.$id must provide AI decision weights"
}
foreach ($id in @(4,5)) {
	$followup = Get-EventBlock $events $id
	Assert-Check ($followup -match 'epoch_core_expedition_project_enabled' -and $followup -match 'epoch_core_expedition_destination@root') "AI follow-up epoch_core.$id must use the destination-anchored player ship project"
}
Assert-Check ((Get-EventBlock $events 28) -match 'epoch_core_expedition_project_enabled' -and (Get-EventBlock $events 28) -match 'epoch_core_expedition_project_failed' -and (Get-EventBlock $events 28) -match 'EPOCH_MISSING_EXPEDITION' -and (Get-EventBlock $events 28) -match 'epoch_core_expedition_project_abandoned' -and (Get-EventBlock $events 28) -notmatch 'set_country_flag\s*=\s*epoch_core_expedition_contact_lost|country_event\s*=\s*\{\s*id\s*=\s*epoch_core\.6|destroy_ship\s*=') 'Expedition project failure must offer retry or explicit project abandonment without declaring a ship lost or opening rescue/search'
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

# Native syntax evidence from this target installation, rather than assumptions.
$situationReadmePath = Join-Path $VanillaRoot 'common/situations/99_README_SITUATIONS.txt'
if (Test-Path -LiteralPath $situationReadmePath) {
    $native = [System.IO.File]::ReadAllText($situationReadmePath)
    Assert-Check ($native -match 'on_first_enter\s*=' -and $native -match 'permanent\s*=\s*yes/no' -and $native -match 'default\s*=\s*yes') 'Installed Situation documentation must support stage entry, manual endings and default approach fallback'
}
foreach ($id in @(26,28,30,31,32,46)) {
    $recovery = Get-EventBlock $events $id
    Assert-Check ($recovery -match "NOT\s*=\s*\{\s*has_country_flag\s*=\s*epoch_core_recovery_$($id)_open" -and $recovery -match "set_country_flag\s*=\s*epoch_core_recovery_$($id)_open" -and ([regex]::Matches($recovery, "remove_country_flag\s*=\s*epoch_core_recovery_$($id)_open")).Count -eq 2) "Recovery $id must suppress duplicate windows and reset its guard on both decisions"
    Assert-Check ($recovery -match 'abort_special_project\s*=') "Recovery $id must remove outstanding projects on explicit closure"
}
Assert-Check ((Get-EventBlock $events 50) -notmatch 'set_country_flag|add_situation_progress|destroy_ship|days\s*=' -and (Get-EventBlock $events 50) -match 'NOT\s*=\s*\{\s*exists\s*=\s*event_target:epoch_core_world@root') 'Missing-object detection may only request explicit decisions, never resolve objectives'
Assert-Check ($silentSite -match 'is_same_value\s*=\s*event_target:epoch_core_structure_site@root\.owner' -and $siteVisibility -match 'has_country_flag\s*=\s*epoch_core_structure_site_created') 'Site eligibility and visibility must remain isolated to the saved owner-specific native site'
Assert-Check ((Get-EventBlock $events 21) -match 'exists\s*=\s*event_target:epoch_core_world@root\.owner[\s\S]*event_target:epoch_core_world@root\.owner\s*=\s*\{\s*epoch_core_remove_contamination_effects\s*=\s*yes\s*epoch_core_apply_contamination_studied\s*=\s*yes') 'Ship-scope project success must resolve the country-keyed campaign world with root.owner before applying studied contamination'
Assert-Check ($scriptedEffects -match 'epoch_core_set_contamination_contained\s*=\s*\{\s*epoch_core_remove_contamination_effects\s*=\s*yes\s*set_planet_flag\s*=\s*epoch_core_contamination_contained_state\s*add_deposit\s*=\s*d_epoch_resonance_contamination_contained') 'Contained contamination must use the shared family transition operation'
Assert-Check ((Get-EventBlock $events 22) -match 'NOT\s*=\s*\{\s*has_country_flag\s*=\s*epoch_core_structure_site_created\s*\}[\s\S]*?create_archaeological_site\s*=\s*epoch_core_silent_structure' -and (Get-EventBlock $events 22) -match 'NOT\s*=\s*\{\s*has_country_flag\s*=\s*epoch_core_structure_site_created\s*\}[\s\S]*?random_owned_planet') 'The structure-site event must gate both primary and fallback creation on the owner-local idempotency flag'
$structureMigration = Get-Block $scriptedEffects '(?m)^epoch_core_migrate_planetary_features\s*=\s*\{' 'Planetary feature migration'
Assert-Check ($structureMigration -match 'NOR\s*=\s*\{\s*has_deposit\s*=\s*d_epoch_silent_structure_unsecured[\s\S]*?has_deposit\s*=\s*d_epoch_silent_structure_destroyed\s*\}') 'Phase II migration must preserve an existing Silent Structure deposit instead of clearing and recreating it'
Assert-Check ((Get-EventBlock $events 23) -notmatch 'epoch_core_clear_structure_state|epoch_core_set_structure_') 'Phase-I conclusion must not clear or rewrite the archaeological structure state'
Assert-Check ($cautiousApproach -match 'default\s*=\s*yes' -and $containmentApproach -notmatch 'NOT\s*=\s*\{\s*has_country_flag\s*=\s*epoch_core_contamination_phase_resolved') 'Containment must remain valid until stage exit, then fall back to a default approach'
foreach ($approach in @($cautiousApproach,$intensiveApproach,$minimalApproach)) {
    Assert-Check ($approach -match 'triggered_modifier\s*=\s*\{\s*potential\s*=\s*\{\s*situation_monthly_progress\s*>\s*0' -and $approach -notmatch 'upkeep\s*=\s*\{\s*trigger\s*=\s*\{\s*current_stage') 'Ordinary research costs and bonuses must pause together at unresolved objectives'
}
& node (Join-Path $PSScriptRoot 'test_phase_i_flow.cjs') $Root
Assert-Check ($LASTEXITCODE -eq 0) 'Parsed campaign-state regression must pass'
& node (Join-Path $PSScriptRoot 'test_resonance.cjs') $Root $VanillaRoot
Assert-Check ($LASTEXITCODE -eq 0) 'Five-chapter Resonance structural and invariant checks must pass'
& node (Join-Path $PSScriptRoot 'test_resonance_vanilla.cjs') $Root $VanillaRoot
Assert-Check ($LASTEXITCODE -eq 0) 'Feedback fixes must match installed native project, scope, localization and UI definitions'
& node (Join-Path $PSScriptRoot 'test_clausewitz_structure.cjs') $Root $VanillaRoot
Assert-Check ($LASTEXITCODE -eq 0) 'Clausewitz lexer/parser must validate every common/events text file and top-level scripted effects'
& node (Join-Path $PSScriptRoot 'test_stellaris_runtime_log.cjs') --self-test
Assert-Check ($LASTEXITCODE -eq 0) 'Runtime log classifier must separate root causes, cascades, and foreign errors'

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
		@{ Name = 'Event-target/scope'; Lines = @($epochErrors | Where-Object { $_ -match '(?i)event target|context switch|wrong scope|unable to resolve' }) }
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
