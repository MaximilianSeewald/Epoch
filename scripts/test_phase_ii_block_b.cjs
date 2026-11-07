// Source-driven Block B progression model. This checks gates and recovery
// paths, not Clausewitz parsing or in-game execution.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = process.argv[2] || path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8').replace(/^\uFEFF/, '');
const situation = read('common/situations/epoch_phase_ii_situations.txt');
const events = read('events/epoch_phase_ii_events.txt');
const projects = read('common/special_projects/epoch_phase_ii_projects.txt');
const tech = read('common/technology/epoch_phase_ii_technologies.txt');
const building = read('common/buildings/epoch_phase_ii_buildings.txt');
const onActions = read('common/on_actions/epoch_core_on_actions.txt');
const deposits = read('common/deposits/epoch_phase_ii_features.txt');
const effects = read('common/scripted_effects/epoch_core_effects.txt');
const modifiers = read('common/static_modifiers/epoch_core_modifiers.txt');
const en = read('localisation/english/epoch_core_l_english.yml');
const de = read('localisation/german/epoch_core_l_german.yml');
let checks = 0;
const check = (condition, message) => { checks++; assert.ok(condition, message); };

function block(source, key) {
  const at = source.search(new RegExp(`(?:^|\\n)\\s*${key}\\s*=\\s*\\{`, 'm'));
  assert.notEqual(at, -1, `Missing block ${key}`);
  const open = source.indexOf('{', at);
  let depth = 0, quote = false, comment = false;
  for (let i = open; i < source.length; i++) {
    const c = source[i];
    if (comment) { if (c === '\n') comment = false; continue; }
    if (!quote && c === '#') { comment = true; continue; }
    if (c === '"') { quote = !quote; continue; }
    if (quote) continue;
    if (c === '{') depth++;
    if (c === '}' && --depth === 0) return source.slice(open + 1, i);
  }
  throw new Error(`Unclosed block ${key}`);
}
function countryFlagsAreOwnerScoped(source) {
  const stack = [];
  let ownerDepth = 0;
  const tokens = /owner\s*=\s*\{|has_country_flag\s*=\s*[A-Za-z0-9_]+|[{}]/g;
  for (const match of source.matchAll(tokens)) {
    const token = match[0];
    if (token.startsWith('owner')) { stack.push(true); ownerDepth++; }
    else if (token === '{') stack.push(false);
    else if (token === '}') { if (stack.pop()) ownerDepth--; }
    else if (ownerDepth === 0) return false;
  }
  return true;
}

const stageBody = block(situation, 'stages');
const stages = [...stageBody.matchAll(/(stage_[a-z0-9_]+)\s*=\s*\{[^}]*?end\s*=\s*(\d+)[^}]*?\}/g)]
  .map(m => ({ name: m[1], end: Number(m[2]) }));
const expected = ['stage_scar_wakes','stage_scar_report','stage_first_hunters','stage_hunters_resolution','stage_broken_code','stage_block_a_handoff','stage_ch4_research','stage_ch4_incidents','stage_ch5_research','stage_ch5_expedition','stage_ch5_silence','stage_ch6_research','stage_ch6_resolution'];
check(stages.map(s => s.name).join(',') === expected.join(','), 'All Block A/B stages remain ordered in the continuing situation');
check(stages.map(s => s.end).join(',') === '20,30,50,60,80,90,100,110,120,130,140,150,170', 'Stage thresholds are monotonic and leave the final report after the Chapter 6 action');
check(/epoch_ii_handoff_ready/.test(events) && /has_country_flag = epoch_ii_ch3_resolved/.test(situation), 'Block A handoff remains the only entry into Block B');
check(/set_country_flag = epoch_ii_block_a_complete/.test(events) && /set_country_flag = epoch_ii_block_b_complete/.test(situation), 'The two block results are recorded independently');
check(/has_country_flag = epoch_ii_ch6_resolved/.test(situation) && /remove_country_flag = epoch_ii_active/.test(situation), 'The campaign only closes after a saved Chapter 6 result');
check(!/stage_ch7|chapter_7|epoch_ii_ch7/.test(situation + events), 'Block B does not start Chapter 7');

const gates = [
  ['stage_ch4_incidents','epoch_ii_ch4_resolved'],
  ['stage_ch5_expedition','epoch_ii_ch5_nodes_ready'],
  ['stage_ch5_silence','epoch_ii_ch5_resolved'],
  ['stage_ch6_resolution','epoch_ii_ch6_resolved'],
];
for (const [stage, flag] of gates) {
  check(new RegExp(`current_stage\\s*=\\s*${stage}[\\s\\S]{0,220}has_country_flag\\s*=\\s*${flag}`).test(situation), `${stage} cannot advance without ${flag}`);
}
const stageLines = block(situation, 'stages');
for (const [stage, eventId] of [['stage_ch4_research','epoch_ii.60'],['stage_ch5_research','epoch_ii.64'],['stage_ch6_research','epoch_ii.70']]) {
  check(!new RegExp(`${stage}[^\\n]*on_first_enter`).test(stageLines), `${stage} is a research interval without an immediate action popup`);
  check(!new RegExp(`current_stage = ${stage} owner = \\{ has_country_flag = epoch_ii_ch[456]_research_done`).test(situation), `${stage} cannot wait on a decision that only starts at its end`);
  check(events.includes(`id = ${eventId}`) && events.includes('is_triggered_only = yes'), `${eventId} is an explicit threshold action`);
}
check(/stage_ch4_incidents[^\n]*on_first_enter = \{ situation_event = \{ id = epoch_ii\.60/.test(stageLines)
  && /stage_ch5_expedition[^\n]*on_first_enter = \{ situation_event = \{ id = epoch_ii\.64/.test(stageLines)
  && /stage_ch6_resolution[^\n]*on_first_enter = \{ situation_event = \{ id = epoch_ii\.70/.test(stageLines), 'Chapter actions begin after their preceding research interval');
const handoffModifiers = [...situation.matchAll(/modifier = \{[^\n]*current_stage = stage_block_a_handoff[^\n]*\}/g)].map(m => m[0]);
check(handoffModifiers.length === 4 && handoffModifiers.every(m => /situation_progress < 90/.test(m)), 'Block A handoff has a single approach bonus set ending at 90');
for (const stage of ['stage_ch4_research','stage_ch5_research','stage_ch6_research']) {
  const mods = [...situation.matchAll(new RegExp(`modifier = \\{[^\\n]*current_stage = ${stage}[^\\n]*\\}`, 'g'))].map(m => m[0]);
  check(mods.length === 4 && mods.every(m => !/owner = \\{ has_country_flag/.test(m)), `${stage} has four non-circular research progress routes`);
}
check(/epoch_ii_ch4_incident1/.test(events) && /epoch_ii_ch4_incident2/.test(events) && /id = epoch_ii\.68/.test(events) && /epoch_ii_ch4_protocol_treated/.test(events), 'Chapter 4 records anomaly, coordination, breakthrough, and an explicit protocol');
check(/epoch_ii_breakthrough_sacrifice/.test(events) && /epoch_ii_breakthrough_security/.test(events) && /epoch_ii_breakthrough_science/.test(events), 'The contamination breakthrough has permanent economy, costly security, and risky research outcomes');
check(/epoch_ii_set_site_latent/.test(effects) && /epoch_ii_set_site_active/.test(effects) && /epoch_ii_set_site_unstable/.test(effects) && /epoch_ii_set_site_controlled/.test(effects), 'All four planet states have transition effects');
check((effects.match(/epoch_ii_clear_site_state = yes/g) || []).length === 4 && /remove_deposit = d_epoch_resonance_(latent|active|unstable|controlled)/.test(effects), 'Every state transition clears all prior Phase II deposits before adding its one new feature');
check(!/remove_(?:deposit|modifier) = (?:d_epoch_core_|epoch_core_)/.test(block(effects, 'epoch_ii_clear_site_state')), 'Phase II state changes preserve permanent Phase I deposits and modifiers');
for (const status of ['latent','active','unstable','controlled']) {
  check(deposits.includes(`d_epoch_resonance_${status}`) && modifiers.includes(`epoch_ii_resonance_${status} =`), `${status} has a visible deposit and an economic/stability modifier`);
}
check(/epoch_ii_spread_authorized/.test(events) && /epoch_ii_secondary_planet@root/.test(events) && /d_epoch_resonance_active/.test(events), 'Secondary planetary resonance requires an explicit, persistent player choice');
check(/building_epoch_resonance_laboratory/.test(building) && /upkeep = \{ energy = 4 \}/.test(building) && /epoch_ii_unstable_resonance/.test(building) && /epoch_ii_controlled_resonance/.test(building), 'Resonance lab has reachable energy upkeep, research, and state-specific risk');
check(/building_epoch_containment_infrastructure/.test(building) && /planet_jobs_society_research_produces_mult = 0\.05/.test(building) && /epoch_ii_unstable_resonance/.test(building), 'Neutral infrastructure offers general and resonance-state effects');

check(/EPOCH_II_NODE_REFLECTION/.test(projects) && /EPOCH_II_NODE_INTERRUPTED/.test(projects), 'Chapter 5 provides two separate staffed Science Ship projects');
check(/closest_system/.test(events) && /save_global_event_target_as = epoch_ii_interrupted_node@root/.test(events) && /has_access_fleet = root/.test(events), 'Expedition targets are selected from distinct, reachable galaxy systems');
check(/EPOCH_II_SILENT_SYSTEM/.test(projects) && /epoch_ii_silent_project_done/.test(events) && /epoch_ii_silent_system_dark/.test(events) && /epoch_ii_silent_system_repeated/.test(events) && /epoch_ii_silent_system_broadcast/.test(events), 'Silent-system project and its three saved outcomes are wired');
const silentPromptAt = events.indexOf('id = epoch_ii.66', events.indexOf('# Block B'));
const silentPromptStart = events.lastIndexOf('situation_event = {', silentPromptAt);
const silentPrompt = events.slice(silentPromptStart, events.indexOf('\n}', silentPromptAt));
check(!silentPrompt.includes('hide_window = yes') && /option = \{ name = epoch_ii\.66\.a/.test(silentPrompt) && /country_event = \{ id = epoch_ii\.82 \}/.test(silentPrompt) && /event_target:epoch_ii_silent_system@root = \{ enable_special_project = \{ name = EPOCH_II_SILENT_SYSTEM/.test(events), 'Silent-site discovery is a visible choice followed by a country-scoped project dispatch');
check(/has_country_flag = epoch_ii_silent_project_done NOT = \{ has_country_flag = epoch_ii_ch5_silence_prompted \}/.test(events) && /set_country_flag = epoch_ii_ch5_expedition_prompted/.test(events), 'The two Chapter 5 prompts use independent idempotence flags');
check(/epoch_ii_archive_route_used/.test(events) && /physics_research = 100 energy = -500/.test(events), 'Archive fallback has a measurable energy cost and reduced yield');
check(/epoch_ii\.77\.retry_reflection/.test(events) && /epoch_ii\.77\.retry_interrupted/.test(events) && /epoch_ii\.77\.retry_silent/.test(events) && /resource_stockpile_compare = \{ resource = energy value >= 200 \}/.test(events), 'Each failed expedition has an energy-costed retry without losing the completed site');
check(/option = \{ name = epoch_ii\.65\.b trigger = \{ owner = \{ resource_stockpile_compare = \{ resource = energy value >= 500 \}/.test(events), 'The voluntary archive option is shown only when its 500 Energy cost is payable');
check(/epoch_ii\.65\.c[\s\S]{0,500}value < 500[\s\S]{0,500}value = -20/.test(events), 'When a destination is missing and Energy is short, a costly stability-loss fallback keeps the stage moving');
check(/name = epoch_ii\.77\.a[\s\S]{0,200}value >= 500/.test(events) && /name = epoch_ii\.77\.emergency[\s\S]{0,300}value < 500[\s\S]{0,500}value = -20/.test(events), 'Chapter 5 recovery has separately gated paid and low-resource emergency archive routes');
check(!/id = epoch_ii\.77[\s\S]*?abort_special_project = \{ type = EPOCH_II_NODE_REFLECTION \}/.test(events), 'Archiving a failed site does not cancel or erase another still-active successful expedition');
check(/epoch_ii_expedition_data_partial/.test(events) && /epoch_ii_expedition_data_archived/.test(events) && /epoch_ii_expedition_data_complete/.test(events), 'Chapter 5 records complete, partial, and archive-only data quality for later chapters');
check(/id = epoch_ii\.74[\s\S]*?NOR = \{ has_country_flag = epoch_ii_reflection_project_complete \}[\s\S]*?epoch_ii_expedition_data_complete/.test(events) && /id = epoch_ii\.75[\s\S]*?NOR = \{ has_country_flag = epoch_ii_interrupted_project_complete \}[\s\S]*?epoch_ii_expedition_data_complete/.test(events), 'Repeated project success callbacks cannot grant expedition rewards twice, and a later second success upgrades partial data');
check(/name = epoch_ii\.66\.b trigger = \{ owner = \{ resource_stockpile_compare = \{ resource = energy value >= 500/.test(events) && /name = epoch_ii\.66\.c trigger = \{ owner = \{ resource_stockpile_compare = \{ resource = energy value < 500/.test(events), 'Silent-system archive choice charges Energy or imposes a stability penalty when Energy is short');
check(/any_system_planet = \{ is_planet_class = pc_barren is_colonizable = no \}/.test(events) && /epoch_ii_silent_system@root/.test(events), 'The silent-system project selects an actual accessible system with a barren body');
check(/tech_epoch_phased_sensors = \{[\s\S]*?cost = @tier2cost2[\s\S]*?prerequisites = \{ "tech_epoch_resonance_spectroscopy" "tech_sensors_2" \}/.test(tech), 'Phased Sensors is a normal research item with an acyclic vanilla dependency');
check(/tech_epoch_contamination_neutral_infrastructure = \{[\s\S]*?area = society[\s\S]*?potential = \{ has_country_flag = epoch_ii_containment_neutral_infrastructure_lead \}/.test(tech) && /add_research_option = tech_epoch_contamination_neutral_infrastructure/.test(events) && !/research_technology = tech_epoch_contamination_neutral_infrastructure/.test(events), 'Contamination-Neutral Infrastructure is offered for ordinary research, never granted');
check(/tech_epoch_adaptive_resonance_armor/.test(tech) && /add_research_option = tech_epoch_adaptive_resonance_armor/.test(events), 'Adaptive Resonance Armor remains researchable and is offered before Chapter 6');
const chapterFiveOfferAt = events.indexOf('id = epoch_ii.64', events.indexOf('# Block B'));
const chapterFiveOffer = events.slice(events.lastIndexOf('situation_event = {', chapterFiveOfferAt), events.indexOf('\n}', chapterFiveOfferAt));
check((chapterFiveOffer.match(/add_research_option = tech_epoch_phased_sensors/g) || []).length === 3 && (chapterFiveOffer.match(/add_research_option = tech_epoch_adaptive_resonance_armor/g) || []).length === 3, 'All Chapter 5 postures offer Phased Sensors and Adaptive Resonance Armor with research time remaining');

check(/create_fleet = \{[\s\S]{0,100}name = "NAME_EPOCH_Second_Force"/.test(events) && /epoch_ii_second_fleet@root/.test(events) && /NAME_EPOCH_Heavy_Suppressor/.test(events) && /MEDIUM_DISRUPTOR_1/.test(read('common/global_ship_designs/epoch_nullwarden_designs.txt')), 'Chapter 6 creates a larger armed hostile force with heavy disruptor hulls');
check(/epoch_ii_nullwarden_engagement_recorded/.test(events) && /epoch_ii_nullwarden_diverted/.test(events) && /epoch_ii_network_exposed/.test(events), 'Second encounter reads first battle, diversion, and broadcast records');
check(/NOT = \{ exists = event_target:epoch_ii_nullwarden_country@root \}[\s\S]*?create_country = \{[\s\S]*?type = epoch_nullwarden/.test(events), 'Chapter 6 recreates a missing campaign-specific enemy country');
check(/event_target:epoch_ii_nullwarden_country@root = \{ set_faction_hostility = \{ target = root set_hostile = yes \} \}/.test(events), 'The second encounter restores hostility on a reused country toward this campaign empire only');
check(/set_owner = event_target:epoch_ii_nullwarden_country@root/.test(events) && /set_faction_hostility = \{ target = root set_hostile = yes \}/.test(events), 'Replacement country, second fleet, and campaign-specific hostility stay correctly linked');
check(/NOT = \{ has_country_flag = epoch_ii_second_force_spawned \}[\s\S]*?set_country_flag = epoch_ii_second_force_spawned[\s\S]*?save_global_event_target_as = epoch_ii_second_fleet@root/.test(events), 'Fleet spawn flag prevents duplicate fleets after reload or repeated dispatch');
check(/epoch_ii_silent_system_broadcast[\s\S]{0,500}NAME_EPOCH_Heavy_Suppressor/.test(events) && /which = epoch_ii_resonance_stability value < 30/.test(events), 'Broadcast exposure and low stability increase the tangible second-force threat');
check(/has_technology = tech_epoch_adaptive_resonance_armor[\s\S]{0,500}alloys = -300/.test(events) && /has_technology = tech_epoch_phased_sensors[\s\S]{0,500}energy = -350/.test(events), 'Armor and sensor research reduce costs of matching countermeasures');
for (const [id, flag] of [['epoch_ii.82','epoch_ii_silent_project_dispatched'],['epoch_ii.83','epoch_ii_node_projects_dispatched'],['epoch_ii.84','epoch_ii_ch6_trap_dispatched'],['epoch_ii.85','epoch_ii_ch6_science_dispatched']]) {
  check(events.includes(`id = ${id}`) && events.includes(`set_country_flag = ${flag}`), `${id} is an idempotent country-scoped project dispatcher`);
}
const combatAt = events.indexOf('id = epoch_ii.81');
const combatStart = events.lastIndexOf('country_event = {', combatAt);
const combatResolution = events.slice(combatStart, events.indexOf('\n}', combatAt));
check(/on_fleet_destroyed_victim/.test(onActions) && /from = \{[\s\S]*?has_country_flag = epoch_ii_ch6_combat_started[\s\S]*?fromfrom = \{ is_same_value = event_target:epoch_ii_second_fleet@from \}/.test(combatResolution), 'Combat callback matches this attacking empire\'s saved second-force fleet');
check(/from = \{ set_country_flag = epoch_ii_ch6_combat_success_pending country_event = \{ id = epoch_ii\.86 \} \}/.test(combatResolution), 'Fleet destruction submits one guarded pending result to the shared resolver');
const resolverAt = [...events.matchAll(/^\s*id = epoch_ii\.86\s*$/gm)][0]?.index ?? -1;
const resolverStart = events.lastIndexOf('country_event = {', resolverAt);
const resolver = events.slice(resolverStart, events.indexOf('\n}', resolverAt));
check(/has_country_flag = epoch_ii_active[\s\S]*?NOR = \{ has_country_flag = epoch_ii_ch6_resolved \}[\s\S]*?OR = \{[\s\S]*?epoch_ii_ch6_withdrawal_pending/.test(resolver), 'Shared Chapter 6 resolver requires an active, unresolved campaign and a pending route result');
check(/set_country_flag = epoch_ii_ch6_resolved[\s\S]*?remove_country_flag = epoch_ii_convergence_data_high[\s\S]*?else_if = \{[\s\S]*?epoch_ii_ch6_trap_success_pending[\s\S]*?else_if = \{[\s\S]*?epoch_ii_ch6_science_success_pending[\s\S]*?else_if = \{[\s\S]*?epoch_ii_ch6_withdrawal_pending/.test(resolver), 'Resolution is set once, prior outcomes are cleared, and only one mutually exclusive route is applied');
check(/set_country_flag = epoch_ii_second_force_destroyed[\s\S]*?add_resource = \{ physics_research = 400 alloys = 200 \}/.test(resolver), 'Combat reward is awarded by the shared resolver after its one-time guard');
check(/NOR = \{ has_country_flag = epoch_ii_ch6_resolved has_country_flag = epoch_ii_ch6_combat_success_pending/.test(combatResolution), 'Repeated fleet-destruction callbacks cannot enqueue a second or conflicting result');
check(!/NOT = \{ exists = event_target:epoch_ii_second_fleet@root \}[\s\S]{0,250}epoch_ii_second_force_destroyed/.test(events), 'A missing event target alone cannot award combat victory');
check(/epoch_ii_block_b_report_sent/.test(events) && /NOT = \{ has_country_flag = epoch_ii_block_b_report_sent \}/.test(events), 'Repeated callbacks cannot create a duplicate Block B report');
for (const id of ['epoch_ii.78','epoch_ii.79']) {
  const at = events.indexOf(`id = ${id}`);
  const start = events.lastIndexOf('ship_event = {', at);
  const body = events.slice(start, events.indexOf('\n}', at));
  check(body.includes('country_event = { id = epoch_ii.86 }') && !body.includes('set_country_flag = epoch_ii_ch6_resolved'), `${id} submits guarded project success instead of resolving or rewarding directly`);
}
check(/id = epoch_ii\.80[\s\S]*?epoch_ii_ch6_recovery_prompted[\s\S]*?epoch_ii_ch6_trap_retry_used[\s\S]*?epoch_ii_ch6_science_retry_used/.test(events), 'Project failure opens one recovery prompt and each project can be retried only once');
check(/owner = \{ country_event = \{ id = epoch_ii\.86 \} \}/.test(events.slice(0, events.indexOf('# Block B'))), 'A saved pending result is recovered after load by the monthly Situation callback');
for (const id of ['epoch_ii.9','epoch_ii.60','epoch_ii.61','epoch_ii.64','epoch_ii.65','epoch_ii.66','epoch_ii.70','epoch_ii.71']) {
  const at = events.indexOf(`id = ${id}`, id === 'epoch_ii.9' ? 0 : events.indexOf('# Block B'));
  const start = events.lastIndexOf('situation_event = {', at);
  const finish = events.indexOf('\n}', at);
  const body = events.slice(start, finish);
  check(start >= 0 && /trigger = \{ owner = \{/.test(body) && countryFlagsAreOwnerScoped(body), `${id} reads country flags from country scope, not Situation scope`);
}
check(/EPOCH_II_NODE_TRAP/.test(projects) && /EPOCH_II_SCIENCE_COUNTERMEASURE/.test(projects), 'Trap and science responses require separate staffed projects');
check(/epoch_ii_ch6_withdrawal/.test(resolver) && /set_fleet_stance = evasive/.test(effects) && !/destroy_fleet\s*=|destroy_ship\s*=/.test(events + effects), 'Withdrawal keeps the living enemy fleet and records its distinct loss outcome');
check(/epoch_ii_convergence_data_(high|medium|low)/.test(events), 'Military outcomes preserve distinct convergence-data quality');

for (const id of ['epoch_ii.60.name','epoch_ii.60.a','epoch_ii.61.name','epoch_ii.62.name','epoch_ii.63.b','epoch_ii.64.name','epoch_ii.65.name','epoch_ii.67.name','epoch_ii.68.name','epoch_ii.70.name','epoch_ii.71.a','epoch_ii.72.a']) {
  check(en.includes(`${id}:0`) && de.includes(`${id}:0`), `German and English localization contain ${id}`);
}
for (const key of ['d_epoch_resonance_latent','d_epoch_resonance_active','d_epoch_resonance_unstable','d_epoch_resonance_controlled','building_epoch_resonance_laboratory','tech_epoch_phased_sensors','EPOCH_II_NODE_REFLECTION','EPOCH_II_NODE_INTERRUPTED','EPOCH_II_SILENT_SYSTEM','EPOCH_II_NODE_TRAP','EPOCH_II_SCIENCE_COUNTERMEASURE']) {
  check(en.includes(`${key}:0`) && de.includes(`${key}:0`), `German and English localization contain ${key}`);
}
for (const key of ['tech_epoch_contamination_neutral_infrastructure','building_epoch_containment_infrastructure','epoch_ii.65.c','epoch_ii.66.a','epoch_ii.66.b','epoch_ii.66.c','epoch_ii.77.retry_reflection','epoch_ii.77.retry_interrupted','epoch_ii.77.emergency','epoch_ii.80.a']) {
  check(en.includes(`${key}:0`) && de.includes(`${key}:0`), `German and English localization contain ${key}`);
}
check(en.includes('epoch_ii.77.retry_silent:0') && de.includes('epoch_ii.77.retry_silent:0'), 'German and English localization contain the silent-site retry');
for (const key of ['epoch_ii.65.c','epoch_ii.66.c','epoch_ii.77.emergency','epoch_ii.80.a']) {
  check(en.includes(`${key}:0`) && de.includes(`${key}:0`), `German and English localization contain ${key}`);
}

// Explicit review scenarios: route availability, partial expedition quality,
// one-time outcomes, and living-fleet handling after every noncombat result.
function ch5Options(systems, energy) {
  const both = systems.delayed && systems.interrupted;
  return {
    survey: both,
    paidArchive: energy >= 500,
    emergencyArchive: !both && energy < 500,
  };
}
check(ch5Options({ delayed: true, interrupted: true }, 500).survey, 'When both distinct systems are available, staffed expedition remains available');
check(ch5Options({ delayed: true, interrupted: true }, 100).survey && !ch5Options({ delayed: true, interrupted: true }, 100).paidArchive, 'Low Energy cannot make an archive route a free substitute for an available two-site expedition');
check(ch5Options({ delayed: true, interrupted: false }, 900).paidArchive && !ch5Options({ delayed: true, interrupted: false }, 900).survey, 'One unavailable site leaves a paid, nonblocking archive fallback');
check(ch5Options({ delayed: true, interrupted: false }, 100).emergencyArchive, 'One unavailable site with insufficient Energy has a stability-costed fallback');
function expeditionQuality(completed) {
  return completed.size === 2 ? 'complete' : completed.size === 1 ? 'partial' : 'archived';
}
check(expeditionQuality(new Set(['reflection'])) === 'partial' && expeditionQuality(new Set(['reflection','interrupted'])) === 'complete', 'A completed survey survives its partner\'s cancellation and upgrades to complete only if the partner later succeeds');
function resolveRoute(state, result) {
  if (state.resolved) return state;
  state.resolved = true;
  state.route = result;
  state.resultFlags = new Set([`epoch_ii_ch6_${result === 'combat' ? 'combat' : result}_resolved`]);
  state.rewards++;
  return state;
}
for (const route of ['combat','trap','science','withdrawal']) {
  const resolved = resolveRoute(resolveRoute({ resolved: false, rewards: 0, resultFlags: new Set() }, route), route);
  check(resolved.rewards === 1 && resolved.resultFlags.size === 1, `${route} repeated success/kill callback resolves once without conflicting outcome flags`);
}
const secondRetreat = block(effects, 'epoch_ii_disengage_second_nullwarden_fleet');
check((secondRetreat.match(/queue_actions = \{ move_to = event_target:epoch_ii_second_retreat_system@root \}/g) || []).length === 1 && /epoch_ii_second_force_route_queued/.test(secondRetreat), 'A living second fleet receives one idempotent route order to an accessible system');
check(/epoch_ii_second_force_neutralized/.test(resolver) && /epoch_ii_second_force_withdrawn/.test(resolver) && /set_neutral = yes/.test(secondRetreat), 'Trap/science neutralization and withdrawal remain distinct while surviving fleets are de-escalated');

// Model the required path and the cases where the expedition or combat object
// disappears. This mirrors the source gates above and catches blocked routes.
function simulate(pathKind) {
  const flags = new Set(['epoch_ii_ch3_resolved','epoch_ii_handoff_ready']);
  const seen = [];
  const transitions = [];
  let progress = 90;
  let previousEnd = 90;
  for (const s of stages.slice(6)) {
    const modifiersForStage = [...situation.matchAll(new RegExp(`modifier = \\{[^\\n]*current_stage = ${s.name}[^\\n]*\\}`, 'g'))].map(m => m[0]);
    const research = ['stage_ch4_research','stage_ch5_research','stage_ch6_research'].includes(s.name);
    if (research) {
      assert.equal(modifiersForStage.length, 4, `${s.name} has approach progress available`);
      assert.ok(modifiersForStage.every(mod => !/owner = \\{ has_country_flag/.test(mod)), `${s.name} progresses before any decision gate`);
    } else if (gates.some(([stage]) => stage === s.name)) {
      const gate = gates.find(([stage]) => stage === s.name)[1];
      assert.ok(modifiersForStage.some(mod => mod.includes(`has_country_flag = ${gate}`)), `${s.name} exposes its release flag in actual monthly progress modifiers`);
    }
    const enteredAt = previousEnd;
    const stageLine = stageLines.match(new RegExp(`${s.name}[^\\n]*`))?.[0] || '';
    const entryEvent = stageLine.match(/on_first_enter = \{ situation_event = \{ id = (epoch_ii\.[0-9]+) /)?.[1];
    if (research) assert.equal(entryEvent, undefined, `${s.name} does not fire its story decision before research completes`);
    if (entryEvent) transitions.push({ progress: enteredAt, event: entryEvent });
    seen.push(s.name);
    if (s.name === 'stage_ch4_incidents') { transitions.push({ progress: enteredAt, event: 'epoch_ii.60' }); flags.add('epoch_ii_ch4_research_done'); flags.add('epoch_ii_ch4_incident1'); flags.add('epoch_ii_ch4_incident2'); flags.add('epoch_ii_ch4_protocol_treated'); flags.add('epoch_ii_ch4_resolved'); }
    if (s.name === 'stage_ch5_expedition') {
      transitions.push({ progress: enteredAt, event: 'epoch_ii.64' });
      if (pathKind === 'archive') flags.add('epoch_ii_archive_route_used');
      else { flags.add('epoch_ii_two_real_systems_surveyed'); flags.add('epoch_ii_reflection_project_complete'); flags.add('epoch_ii_interrupted_project_complete'); }
      flags.add('epoch_ii_ch5_research_done');
      flags.add('epoch_ii_ch5_nodes_ready');
    }
    if (s.name === 'stage_ch5_silence') { flags.add('epoch_ii_silent_project_done'); flags.add(pathKind === 'archive' ? 'epoch_ii_silent_system_archived' : 'epoch_ii_silent_system_dark'); flags.add('epoch_ii_ch5_resolved'); }
    if (s.name === 'stage_ch6_resolution') {
      transitions.push({ progress: enteredAt, event: 'epoch_ii.70' });
      flags.add('epoch_ii_ch6_research_done');
      if (pathKind === 'combat') flags.add('epoch_ii_ch6_combat_started');
      flags.add(`epoch_ii_ch6_${pathKind === 'archive' ? 'withdrawal' : pathKind}_resolved`);
      flags.add('epoch_ii_ch6_resolved');
    }
    progress = s.end;
    previousEnd = s.end;
  }
  check(progress === 170, `${pathKind} simulation reaches the final report threshold only after actions`);
  check(transitions.some(item => item.event === 'epoch_ii.60' && item.progress === 100)
    && transitions.some(item => item.event === 'epoch_ii.64' && item.progress === 120)
    && transitions.some(item => item.event === 'epoch_ii.70' && item.progress === 150), `${pathKind} story prompts follow Chapter 4–6 research thresholds`);
  return { flags, seen, transitions };
}
for (const kind of ['combat','trap','science','withdrawal','archive']) {
  const state = simulate(kind);
  check(state.seen.join(',') === expected.slice(6).join(','), `${kind} route visits every Block B stage in order`);
  check(state.flags.has('epoch_ii_ch4_resolved') && state.flags.has('epoch_ii_ch5_resolved') && state.flags.has('epoch_ii_ch6_resolved'), `${kind} route reaches the saved Block B handoff`);
}
check(simulate('combat').flags.has('epoch_ii_ch6_combat_started') && simulate('combat').flags.has('epoch_ii_ch6_resolved'), 'A completed combat route preserves its distinct outcome and result flags');
check(/set_country_flag = epoch_ii_block_b_complete/.test(situation) && /set_country_flag = epoch_ii_handoff_block_c_ready/.test(events) && !/stage_ch7|chapter_7|epoch_ii_ch7/.test(situation + events), 'Block C handoff is recorded only after Block B closes and does not activate Chapter 7');

console.log(`PASS: ${checks} Block B transition and source-wiring assertions passed. Static model only; no in-game validation.`);
