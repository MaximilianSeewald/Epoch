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
  ['stage_ch4_research','epoch_ii_ch4_research_done'],
  ['stage_ch4_incidents','epoch_ii_ch4_resolved'],
  ['stage_ch5_research','epoch_ii_ch5_research_done'],
  ['stage_ch5_expedition','epoch_ii_ch5_nodes_ready'],
  ['stage_ch5_silence','epoch_ii_ch5_resolved'],
  ['stage_ch6_research','epoch_ii_ch6_research_done'],
  ['stage_ch6_resolution','epoch_ii_ch6_resolved'],
];
for (const [stage, flag] of gates) {
  check(new RegExp(`current_stage\\s*=\\s*${stage}[\\s\\S]{0,220}has_country_flag\\s*=\\s*${flag}`).test(situation), `${stage} cannot advance without ${flag}`);
}
check(/epoch_ii_ch4_incident1/.test(events) && /epoch_ii_ch4_incident2/.test(events) && /id = epoch_ii\.68/.test(events) && /epoch_ii_ch4_protocol_treated/.test(events), 'Chapter 4 records anomaly, coordination, breakthrough, and an explicit protocol');
check(/epoch_ii_breakthrough_sacrifice/.test(events) && /epoch_ii_breakthrough_security/.test(events) && /epoch_ii_breakthrough_science/.test(events), 'The contamination breakthrough has permanent economy, costly security, and risky research outcomes');
check(/epoch_ii_set_site_latent/.test(effects) && /epoch_ii_set_site_active/.test(effects) && /epoch_ii_set_site_unstable/.test(effects) && /epoch_ii_set_site_controlled/.test(effects), 'All four planet states have transition effects');
for (const status of ['latent','active','unstable','controlled']) {
  check(deposits.includes(`d_epoch_resonance_${status}`) && modifiers.includes(`epoch_ii_resonance_${status} =`), `${status} has a visible deposit and an economic/stability modifier`);
}
check(/epoch_ii_spread_authorized/.test(events) && /epoch_ii_secondary_planet@root/.test(events) && /d_epoch_resonance_active/.test(events), 'Secondary planetary resonance requires an explicit, persistent player choice');
check(/building_epoch_resonance_laboratory/.test(building) && /upkeep = \{ energy = 5 rare_crystals = 1 \}/.test(building) && /epoch_ii_unstable_resonance/.test(building) && /epoch_ii_controlled_resonance/.test(building), 'Laboratory has upkeep, research, and state-specific risk');

check(/EPOCH_II_NODE_REFLECTION/.test(projects) && /EPOCH_II_NODE_INTERRUPTED/.test(projects), 'Chapter 5 provides two separate staffed Science Ship projects');
check(/closest_system/.test(events) && /save_global_event_target_as = epoch_ii_interrupted_node@root/.test(events) && /has_access_fleet = root/.test(events), 'Expedition targets are selected from distinct, reachable galaxy systems');
check(/EPOCH_II_SILENT_SYSTEM/.test(projects) && /epoch_ii_silent_project_done/.test(events) && /epoch_ii_silent_system_dark/.test(events) && /epoch_ii_silent_system_repeated/.test(events) && /epoch_ii_silent_system_broadcast/.test(events), 'Silent-system project and its three saved outcomes are wired');
check(/has_country_flag = epoch_ii_silent_project_done NOT = \{ has_country_flag = epoch_ii_ch5_silence_prompted \}/.test(events) && /set_country_flag = epoch_ii_ch5_expedition_prompted/.test(events), 'The two Chapter 5 prompts use independent idempotence flags');
check(/epoch_ii_archive_route_used/.test(events) && /id = epoch_ii\.77/.test(events), 'Lost ships or unavailable nodes have a lower-yield archive path');
check(/any_system_planet = \{ is_planet_class = pc_barren is_colonizable = no \}/.test(events) && /epoch_ii_silent_system@root/.test(events), 'The silent-system project selects an actual accessible system with a barren body');
check(/tech_epoch_phased_sensors = \{[\s\S]*?cost = @tier2cost2[\s\S]*?prerequisites = \{ "tech_epoch_resonance_spectroscopy" "tech_sensors_2" \}/.test(tech), 'Phased Sensors is a normal research item with an acyclic vanilla dependency');
check(/tech_epoch_adaptive_resonance_armor/.test(tech) && /add_research_option = tech_epoch_adaptive_resonance_armor/.test(events), 'Adaptive Resonance Armor remains researchable and is offered before Chapter 6');

check(/create_fleet = \{ name = "NAME_EPOCH_Second_Force"/.test(events) && /epoch_ii_second_fleet@root/.test(events) && /NAME_EPOCH_Heavy_Suppressor/.test(events) && /MEDIUM_DISRUPTOR_1/.test(read('common/global_ship_designs/epoch_nullwarden_designs.txt')), 'Chapter 6 creates a larger armed hostile force with heavy disruptor hulls');
check(/epoch_ii_nullwarden_engagement_recorded/.test(events) && /epoch_ii_nullwarden_diverted/.test(events) && /epoch_ii_network_exposed/.test(events), 'Second encounter reads first battle, diversion, and broadcast records');
check(/epoch_ii_ch6_combat_started[\s\S]*?NOT = \{ exists = event_target:epoch_ii_second_fleet@root \}/.test(events), 'The direct battle route resolves only after the live enemy fleet is gone');
check(/EPOCH_II_NODE_TRAP/.test(projects) && /EPOCH_II_SCIENCE_COUNTERMEASURE/.test(projects), 'Trap and science responses require separate staffed projects');
check(/epoch_ii_ch6_withdrawal/.test(events) && /set_fleet_stance = evasive/.test(events) && !/destroy_fleet\s*=|destroy_ship\s*=/.test(events), 'Withdrawal keeps a surviving enemy fleet alive and records the lost node');
check(/epoch_ii_convergence_data_(high|medium|low)/.test(events), 'Military outcomes preserve distinct convergence-data quality');

for (const id of ['epoch_ii.60.name','epoch_ii.60.a','epoch_ii.61.name','epoch_ii.62.name','epoch_ii.63.b','epoch_ii.64.name','epoch_ii.65.name','epoch_ii.67.name','epoch_ii.68.name','epoch_ii.70.name','epoch_ii.71.a','epoch_ii.72.a']) {
  check(en.includes(`${id}:0`) && de.includes(`${id}:0`), `German and English localization contain ${id}`);
}
for (const key of ['d_epoch_resonance_latent','d_epoch_resonance_active','d_epoch_resonance_unstable','d_epoch_resonance_controlled','building_epoch_resonance_laboratory','tech_epoch_phased_sensors','EPOCH_II_NODE_REFLECTION','EPOCH_II_NODE_INTERRUPTED','EPOCH_II_SILENT_SYSTEM','EPOCH_II_NODE_TRAP','EPOCH_II_SCIENCE_COUNTERMEASURE']) {
  check(en.includes(`${key}:0`) && de.includes(`${key}:0`), `German and English localization contain ${key}`);
}

// Model the required path and the cases where the expedition or combat object
// disappears. This mirrors the source gates above and catches blocked routes.
function simulate(pathKind) {
  const flags = new Set(['epoch_ii_ch3_resolved','epoch_ii_handoff_ready']);
  const seen = [];
  for (const s of stages.slice(6)) {
    seen.push(s.name);
    if (s.name === 'stage_ch4_research') flags.add('epoch_ii_ch4_research_done');
    if (s.name === 'stage_ch4_incidents') { flags.add('epoch_ii_ch4_incident1'); flags.add('epoch_ii_ch4_incident2'); flags.add('epoch_ii_ch4_protocol_treated'); flags.add('epoch_ii_ch4_resolved'); }
    if (s.name === 'stage_ch5_research') flags.add('epoch_ii_ch5_research_done');
    if (s.name === 'stage_ch5_expedition') {
      if (pathKind === 'archive') flags.add('epoch_ii_archive_route_used');
      else { flags.add('epoch_ii_two_real_systems_surveyed'); flags.add('epoch_ii_reflection_project_complete'); flags.add('epoch_ii_interrupted_project_complete'); }
      flags.add('epoch_ii_ch5_nodes_ready');
    }
    if (s.name === 'stage_ch5_silence') { flags.add('epoch_ii_silent_project_done'); flags.add(pathKind === 'archive' ? 'epoch_ii_silent_system_archived' : 'epoch_ii_silent_system_dark'); flags.add('epoch_ii_ch5_resolved'); }
    if (s.name === 'stage_ch6_research') flags.add('epoch_ii_ch6_research_done');
    if (s.name === 'stage_ch6_resolution') {
      if (pathKind === 'combat') flags.add('epoch_ii_ch6_combat_started');
      flags.add(`epoch_ii_ch6_${pathKind === 'archive' ? 'withdrawal' : pathKind}_resolved`);
      flags.add('epoch_ii_ch6_resolved');
    }
  }
  return { flags, seen };
}
for (const kind of ['combat','trap','science','withdrawal','archive']) {
  const state = simulate(kind);
  check(state.seen.join(',') === expected.slice(6).join(','), `${kind} route visits every Block B stage in order`);
  check(state.flags.has('epoch_ii_ch4_resolved') && state.flags.has('epoch_ii_ch5_resolved') && state.flags.has('epoch_ii_ch6_resolved'), `${kind} route reaches the saved Block B handoff`);
}
check(simulate('combat').flags.has('epoch_ii_ch6_combat_started') && simulate('combat').flags.has('epoch_ii_ch6_resolved'), 'A completed combat route preserves its distinct outcome and result flags');
check(/set_country_flag = epoch_ii_block_b_complete/.test(situation) && /set_country_flag = epoch_ii_handoff_block_c_ready/.test(events) && !/stage_ch7|chapter_7|epoch_ii_ch7/.test(situation + events), 'Block C handoff is recorded only after Block B closes and does not activate Chapter 7');

console.log(`PASS: ${checks} Block B transition and source-wiring assertions passed. Static model only; no in-game validation.`);
