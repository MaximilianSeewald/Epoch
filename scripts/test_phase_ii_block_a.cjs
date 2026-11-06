// Static Block A regression contract. Does not emulate Stellaris runtime scopes.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = process.argv[2] || path.resolve(__dirname, '..');
let checks = 0;
const check = (value, message) => { checks++; assert.ok(value, message); };
const read = file => fs.readFileSync(path.join(root, file), 'utf8').replace(/^\uFEFF/, '');
const files = [
  'events/epoch_phase_ii_events.txt', 'common/situations/epoch_phase_ii_situations.txt',
  'common/scripted_effects/epoch_core_effects.txt', 'common/static_modifiers/epoch_core_modifiers.txt',
  'common/deposits/epoch_phase_ii_features.txt', 'common/technology/epoch_phase_ii_technologies.txt',
  'common/component_templates/epoch_phase_ii_components.txt', 'common/global_ship_designs/epoch_nullwarden_designs.txt',
  'common/special_projects/epoch_phase_ii_projects.txt', 'common/country_types/epoch_nullwarden_country_type.txt'
];
for (const file of files) {
  const source = read(file).replace(/"(?:\\.|[^"\\])*"/g, '""').replace(/#[^\n]*/g, '');
  let depth = 0;
  for (const char of source) { if (char === '{') depth++; if (char === '}') depth--; check(depth >= 0, `Unmatched closing brace in ${file}`); }
  check(depth === 0, `Unclosed block in ${file}`);
}
const events = read(files[0]);
const situation = read(files[1]);
const effects = read(files[2]);
const projects = read(files[8]);
const countryType = read(files[9]);
const tech = read(files[5]);
const component = read(files[6]);
const ships = read(files[7]);
const features = read(files[4]);
const english = read('localisation/english/epoch_core_l_english.yml');
const german = read('localisation/german/epoch_core_l_german.yml');
const phaseI = read('events/epoch_core_events.txt');

check(/epoch_ii_start_invitation_clock\s*=\s*yes/.test(phaseI), 'The invite clock must start from the Phase I continuation decision');
const delayPairs = [...effects.matchAll(/value\s*=\s*(\d+)\s*\}\s*set_timed_country_flag\s*=\s*\{\s*flag\s*=\s*epoch_ii_invitation_clock\s*days\s*=\s*(\d+)\s*\}\s*country_event\s*=\s*\{\s*id\s*=\s*epoch_ii\.1\s*days\s*=\s*(\d+)/g)];
check(delayPairs.length === 7 && delayPairs.every(m => m[1] === m[2] && m[2] === m[3] && +m[1] >= 1780 && +m[1] <= 1960), 'Each saved empire-specific delay must match its due timer and invitation event');
check(/set_country_flag\s*=\s*epoch_ii_invitation_clock_started/.test(effects) && /NOR\s*=\s*\{\s*has_country_flag\s*=\s*epoch_ii_invited\s+has_country_flag\s*=\s*epoch_ii_invitation_clock\s+has_country_flag\s*=\s*epoch_ii_invite_recovery_armed/.test(events), 'Clock recovery must be one-shot and wait until the persisted due timer expires');
check(/id\s*=\s*epoch_ii\.1[\s\S]*?NOR\s*=\s*\{[^}]*epoch_core_campaign_opted_out[^}]*epoch_ii_invited[^}]*epoch_ii_invitation_clock/s.test(events), 'Invite delivery must respect opt-out, existing invitations, and the due timer');
check(/id\s*=\s*epoch_ii\.1[\s\S]*?value\s*=\s*60/.test(events), 'Resonance stability must initialize at 60');
check(!/destroy_fleet\s*=/.test(events + effects), 'No Block A outcome may erase a surviving Nullwarden fleet');
check(/epoch_ii_disengage_nullwarden_fleet\s*=\s*yes/.test(events) && /set_fleet_stance\s*=\s*evasive/.test(effects) && /queue_actions\s*=\s*\{\s*move_to\s*=/.test(effects), 'Surviving forces must disengage by changing hostility and moving away');
check(/set_faction_hostility\s*=\s*\{\s*target\s*=\s*root\s+set_hostile\s*=\s*yes/.test(events) && /neutral\s*=\s*yes[\s\S]*?hostile\s*=\s*no[\s\S]*?hostile_when_attacked\s*=\s*no/.test(countryType), 'Nullwarden hostility must be scoped to the campaign owner');
check(/fleet_power\s*>=\s*240/.test(events) && /fleet_power\s*>=\s*480/.test(events) && !/epoch_ii_emergency_fortifications/.test(events), 'Defense must require real owned fleet power and grant no imaginary army defense');
check(/name\s*=\s*epoch_ii\.15\.evacuate/.test(events) && /add_planet_devastation\s*=\s*20/.test(events) && /alloys\s*=\s*-300\s+energy\s*=\s*-500/.test(events), 'Evacuation and withdrawal must carry concrete costs and consequences');
check(/EPOCH_II_SIGNAL_DIVERSION[\s\S]*?requirements\s*=\s*\{\s*shipclass_science_ship\s*=\s*1\s+leader\s*=\s*scientist\s*\}[\s\S]*?on_start\s*=\s*\{\s*ship_event\s*=\s*\{\s*id\s*=\s*epoch_ii\.32/s.test(projects), 'Signal diversion must be a real staffed project with start costs');
check(/id\s*=\s*epoch_ii\.6[\s\S]*?epoch_ii_disengage_nullwarden_fleet\s*=\s*yes/.test(events), 'Successful diversion must resolve by disengaging the live force');
check(/EPOCH_II_SIGNAL_DIVERSION[\s\S]*?on_fail\s*=\s*\{\s*country_event\s*=\s*\{\s*id\s*=\s*epoch_ii\.18\s*\}\s*\}[\s\S]*?on_cancel\s*=\s*\{\s*country_event\s*=\s*\{\s*id\s*=\s*epoch_ii\.24/s.test(projects), 'Diversion failure and cancellation must reach distinct callbacks');
const projectDefs = [...projects.matchAll(/special_project\s*=\s*\{([\s\S]*?)\n\}/g)].map(m => m[1]);
check(projectDefs.length === 5 && projectDefs.every(p => /timelimit\s*=\s*1080/.test(p) && /requirements\s*=\s*\{\s*shipclass_science_ship\s*=\s*1\s+leader\s*=\s*scientist\s*\}/.test(p) && /abort_trigger\s*=\s*\{[^\n]*is_owned_by\s*=\s*root/.test(p)), 'All projects need a timeout, native staffing requirements, and an owned location');
check(!/any_owned_ship\s*=\s*\{\s*is_ship_class\s*=\s*shipclass_science_ship/.test(events) && !/any_owned_leader\s*=\s*\{\s*leader_class\s*=\s*scientist/.test(events), 'Project availability must not be inferred from unrelated empire-wide assets');
check(/id\s*=\s*epoch_ii\.20[\s\S]*?remove_country_flag\s*=\s*epoch_ii_c1_waiting_for_ship[\s\S]*?country_event\s*=\s*\{\s*id\s*=\s*epoch_ii\.12/.test(events) && !/country_event\s*=\s*\{\s*id\s*=\s*epoch_ii\.20\s+days\s*=\s*90/.test(events), 'Legacy project recovery must be one-shot, with no polling loop');
check(/every_owned_planet\s*=/.test(events) && !/every_planet\s*=/.test(events), 'Legacy feature migration must scan owned planets only');
check(/event_target:epoch_core_world@root = \{\s*is_owned_by = root\s*\}/.test(events) && /NOT = \{\s*has_deposit\s*=\s*d_epoch_contamination_active\s*\}/.test(events), 'Contamination migration must be owner-local and idempotent');
check(/epoch_ii_contamination_feature_not_applicable/.test(events) && /epoch_ii_legacy_scar_feature_not_applicable/.test(events), 'Migration must explicitly record non-applicable legacy worlds');
check(/set_country_flag\s*=\s*epoch_ii_legacy_scar_features_migrated/.test(events) && !/set_global_flag\s*=\s*epoch_ii_legacy_scar_features_migrated/.test(events), 'Legacy migration idempotency must be per empire');
check(/save_global_event_target_as\s*=\s*epoch_ii_conclusion_capital@root/.test(phaseI), 'Phase I must preserve the conclusion-capital target');
check(['stage_scar_wakes','stage_scar_report','stage_first_hunters','stage_hunters_resolution','stage_broken_code','stage_block_a_handoff'].every(s => situation.includes(`${s} =`)), 'Situation must have the complete Block A stage order and handoff');
check(['epoch_ii_ch1_resolved','epoch_ii_ch2_resolved','epoch_ii_ch3_resolved'].every(f => situation.includes(`has_country_flag = ${f}`)), 'Wait stages must require explicit chapter resolution');
check(/situation_monthly_progress\s*>\s*0/.test(situation) && /epoch_ii_handoff_ready/.test(situation), 'Action waits must pause research and Block A must end at an explicit handoff');
check(/stage_scar_report\s*=\s*\{[^}]*id\s*=\s*epoch_ii\.2/.test(situation) && /stage_hunters_resolution\s*=\s*\{[^}]*id\s*=\s*epoch_ii\.4/.test(situation), 'Research thresholds must precede player action events');
check([...events.matchAll(/set_variable\s*=\s*\{\s*which\s*=\s*epoch_ii_resonance_stability/g)].length === 1 && /change_variable\s*=\s*\{\s*which\s*=\s*epoch_ii_resonance_stability/.test(events), 'Events must adjust stability relatively instead of resetting player decisions');
check(/add_research_option\s*=\s*tech_epoch_resonance_spectroscopy/.test(events) && /add_research_option\s*=\s*tech_epoch_adaptive_resonance_armor/.test(events) && !/enable_technology\s*=/.test(events), 'Chapter 3 must add normal research options, not auto-complete technologies');
check(/potential\s*=\s*\{\s*has_country_flag\s*=\s*epoch_ii_spectroscopy_lead\s*\}/.test(tech), 'Spectroscopy must require the Chapter 3 research lead');
check(/SMALL_EPOCH_RESONANCE_ARMOR[\s\S]*?ship_armor_add\s*=\s*8[\s\S]*?ship_hull_add\s*=\s*8/.test(component), 'Adaptive armor must have a defined functional component');
check(/category\s*=\s*deposit_cat_misc/.test(features) && /d_epoch_conclusion_scar_machine/.test(features), 'Presentation feature deposits must exist');
const eventDefs = [...events.matchAll(/^\s*(country_event|situation_event|ship_event)\s*=\s*\{\s*\n\s*id\s*=\s*(epoch_ii\.\d+)/gm)];
const definitions = new Map();
for (const match of eventDefs) { check(!definitions.has(match[2]), `Duplicate event ${match[2]}`); definitions.set(match[2], match[1]); }
for (const kind of ['country_event','situation_event','ship_event']) for (const match of events.matchAll(new RegExp(`${kind}\\s*=\\s*\\{\\s*id\\s*=\\s*(epoch_ii\\.\\d+)`, 'g'))) check(definitions.get(match[1]) === kind, `Event call ${kind} ${match[1]} must match its definition scope`);
const enKeys = new Set([...english.matchAll(/^\s*([A-Za-z0-9_.]+):\d+\s/gm)].map(m => m[1]));
const deKeys = new Set([...german.matchAll(/^\s*([A-Za-z0-9_.]+):\d+\s/gm)].map(m => m[1]));
const referenced = new Set([events, situation].flatMap(text => [...text.matchAll(/(?:title|desc|text|custom_tooltip|name)\s*=\s*(epoch_ii(?:\.[A-Za-z0-9_.]+|_[A-Za-z0-9_]+))/g)].map(m => m[1])));
check([...referenced].every(k => enKeys.has(k)), `Missing English keys: ${[...referenced].filter(k => !enKeys.has(k)).join(', ')}`);
check([...referenced].every(k => deKeys.has(k)), `Missing German keys: ${[...referenced].filter(k => !deKeys.has(k)).join(', ')}`);
console.log(`PASS: ${checks} static Phase II Block A checks passed. This is not an in-game or parser validation.`);
