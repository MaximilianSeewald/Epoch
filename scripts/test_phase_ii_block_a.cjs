// Static Block A contract checks. These do not emulate Stellaris or verify runtime scopes.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = process.argv[2] || path.resolve(__dirname, '..');
let checks = 0;
const check = (value, message) => { checks++; assert.ok(value, message); };
const read = file => fs.readFileSync(path.join(root, file), 'utf8').replace(/^\uFEFF/, '');
const files = [
  'events/epoch_phase_ii_events.txt',
  'common/situations/epoch_phase_ii_situations.txt',
  'common/scripted_effects/epoch_core_effects.txt',
  'common/static_modifiers/epoch_core_modifiers.txt',
  'common/deposits/epoch_phase_ii_features.txt',
  'common/technology/epoch_phase_ii_technologies.txt',
  'common/component_templates/epoch_phase_ii_components.txt',
  'common/global_ship_designs/epoch_nullwarden_designs.txt',
  'common/special_projects/epoch_phase_ii_projects.txt'
];
for (const file of files) {
  const source = read(file).replace(/"(?:\\.|[^"\\])*"/g, '""').replace(/#[^\n]*/g, '');
  let depth = 0;
  for (const char of source) {
    if (char === '{') depth++;
    if (char === '}') depth--;
    check(depth >= 0, `Unmatched closing brace in ${file}`);
  }
  check(depth === 0, `Unclosed block in ${file}`);
}
const events = read(files[0]);
const situation = read(files[1]);
const projects = read('common/special_projects/epoch_phase_ii_projects.txt');
const tech = read('common/technology/epoch_phase_ii_technologies.txt');
const component = read('common/component_templates/epoch_phase_ii_components.txt');
const ships = read('common/global_ship_designs/epoch_nullwarden_designs.txt');
const features = read('common/deposits/epoch_phase_ii_features.txt');
const english = read('localisation/english/epoch_core_l_english.yml');
const german = read('localisation/german/epoch_core_l_german.yml');
const phaseI = read('events/epoch_core_events.txt');
check(/country_event\s*=\s*\{[\s\S]*?id\s*=\s*epoch_ii\.0[\s\S]*?NOT\s*=\s*\{\s*has_country_flag\s*=\s*epoch_ii_wait_scheduled/.test(events), 'Migration must schedule exactly one delayed invitation per continuing empire');
check(/id\s*=\s*epoch_ii\.1[\s\S]*?NOT\s*=\s*\{[^}]*epoch_core_campaign_opted_out[^}]*epoch_ii_invited/s.test(events), 'Delayed invitation must respect permanent exit and an already-issued invitation');
check(/id\s*=\s*epoch_ii\.1[\s\S]*?value\s*=\s*60/.test(events), 'Resonance stability must start at 60');
check(['stage_scar_wakes','stage_scar_report','stage_first_hunters','stage_hunters_resolution','stage_broken_code','stage_block_a_handoff'].every(s => situation.includes(`${s} =`)), 'Situation must contain the full Block A stage order and an explicit handoff');
check(['epoch_ii_ch1_resolved','epoch_ii_ch2_resolved','epoch_ii_ch3_resolved'].every(flag => situation.includes(`has_country_flag = ${flag}`)), 'Every chapter wait must be gated on its recorded resolution');
check(['epoch_ii_controlled_approach','epoch_ii_intensive_approach','epoch_ii_suppress_approach','epoch_ii_exploit_approach'].every(name => situation.includes(`name = ${name}`)), 'All four approaches must be available');
check(/EPOCH_II_SCAR_SURVEY[\s\S]*?requirements\s*=\s*\{\s*shipclass_science_ship\s*=\s*1\s+leader\s*=\s*scientist/s.test(projects), 'Chapter 1 must have a real staffed Science Ship project');
check(/on_fail\s*=\s*\{\s*country_event\s*=\s*\{\s*id\s*=\s*epoch_ii\.8/s.test(projects), 'Failed or canceled projects must open a recovery route');
check(/create_country\s*=\s*\{[\s\S]*?type\s*=\s*epoch_nullwarden[\s\S]*?set_faction_hostility\s*=\s*\{\s*target\s*=\s*root/s.test(events), 'Nullwarden country must be hostile only to its campaign owner');
check(/set_owner\s*=\s*event_target:epoch_ii_nullwarden_country@root[\s\S]*?create_ship\s*=\s*\{[\s\S]*?NAME_EPOCH_Unknown_Skirmisher/s.test(events), 'Nullwardens must be an actual separately owned fleet of ships');
check(/destroy_fleet\s*=\s*this/.test(events), 'Fleet removal must occur only through explicit defense or withdrawal decisions');
check(/potential\s*=\s*\{\s*has_country_flag\s*=\s*epoch_ii_spectroscopy_lead\s*\}/.test(tech), 'Spectroscopy must require the Chapter 3 lead');
check(/SMALL_EPOCH_RESONANCE_ARMOR[\s\S]*?ship_armor_add\s*=\s*8[\s\S]*?ship_hull_add\s*=\s*8/.test(component), 'Adaptive armor must have a defined functional ship component');
check(/category\s*=\s*deposit_cat_misc/.test(features) && /d_epoch_conclusion_scar_machine/.test(features), 'Planet feature deposits must exist for contamination and class scars');
check(/set_country_flag\s*=\s*epoch_ii_contamination_migrated/.test(events) && /set_country_flag\s*=\s*epoch_ii_capital_migrated/.test(events), 'Feature migration must have separate idempotency guards for both records');
check(/NOT = \{ has_country_flag = epoch_ii_legacy_scar_features_migrated \}/.test(events) && /set_country_flag = epoch_ii_legacy_scar_features_migrated/.test(events) && !/set_global_flag = epoch_ii_legacy_scar_features_migrated/.test(events), 'Legacy scar marker migration must run once per empire, not stop after the first empire');
check(/save_global_event_target_as\s*=\s*epoch_ii_conclusion_capital@root/.test(phaseI), 'Phase I conclusion must preserve its own capital target');
check(/NOT = \{\s*has_country_flag = epoch_ii_wait_scheduled/.test(events) && /has_country_flag = epoch_ii_wait_scheduled NOT = \{\s*has_country_flag = epoch_ii_invited/.test(events), 'A missing delayed event must be recoverable without a second invitation');
check(/event_target:epoch_core_world@root = \{ is_owned_by = root \}/.test(events), 'The hostile force may only target the old world while it remains in the campaign owner’s possession');
check(/any_owned_leader = \{ leader_class = scientist \}/.test(events) && /epoch_ii\.19/.test(events), 'Science Ship projects need a no-ship or no-scientist route');
check(/situation_event = \{ id = epoch_ii\.2 \}/.test(events) && /situation_event = \{ id = epoch_ii\.4 \}/.test(events) && /situation_event = \{ id = epoch_ii\.7 \}/.test(events), 'Monthly situation dispatch must recover missing chapter entry prompts');
check(/trigger = \{ situation_monthly_progress > 0 \}/.test(situation), 'Approach research bonuses and upkeep must pause while a required objective is open');
check(/root = \{ has_technology = tech_destroyers \}/.test(events), 'Force scaling must use the campaign owner’s development');
check(/epoch_ii_emergency_fortifications\s*=\s*\{[^}]*planet_defense_armies_add\s*=\s*8/s.test(read('common/static_modifiers/epoch_core_modifiers.txt')) && /name = epoch_ii\.15\.evacuate/.test(events), 'Defensive response must establish native planet defense and offer a distinct evacuation outcome');
const eventIds = [...events.matchAll(/^\s*(country_event|situation_event|ship_event)\s*=\s*\{\s*\n\s*id\s*=\s*(epoch_ii\.\d+)/gm)];
const definitions = new Map();
for (const match of eventIds) {
  check(!definitions.has(match[2]), `Duplicate Phase II event ${match[2]}`);
  definitions.set(match[2], match[1]);
}
for (const kind of ['country_event','situation_event','ship_event']) {
  for (const match of events.matchAll(new RegExp(`${kind}\\s*=\\s*\\{\\s*id\\s*=\\s*(epoch_ii\\.\\d+)`, 'g'))) {
    check(definitions.get(match[1]) === kind, `Event call ${kind} ${match[1]} must match its definition scope`);
  }
}
const locKeys = new Set([...english.matchAll(/^\s*([A-Za-z0-9_.]+):\d+\s/gm)].map(m => m[1]));
const deKeys = new Set([...german.matchAll(/^\s*([A-Za-z0-9_.]+):\d+\s/gm)].map(m => m[1]));
const referenced = new Set([events, situation].flatMap(text => [...text.matchAll(/(?:title|desc|text|custom_tooltip|name)\s*=\s*(epoch_ii(?:\.[A-Za-z0-9_.]+|_[A-Za-z0-9_]+))/g)].map(m => m[1])));
const missingEn = [...referenced].filter(key => !locKeys.has(key));
const missingDe = [...referenced].filter(key => !deKeys.has(key));
check(missingEn.length === 0, `Missing English Block A keys: ${missingEn.join(', ')}`);
check(missingDe.length === 0, `Missing German Block A keys: ${missingDe.join(', ')}`);
console.log(`PASS: ${checks} static Phase II Block A checks passed. This is not an in-game or parser validation.`);
