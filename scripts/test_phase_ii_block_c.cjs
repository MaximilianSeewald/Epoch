// Source-driven Chapter 7–8 regression. It validates script wiring and campaign
// states; it does not parse Clausewitz or replace an in-game run.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = process.argv[2] || path.resolve(__dirname, '..');
const read = p => fs.readFileSync(path.join(root, p), 'utf8').replace(/^\uFEFF/, '');
const situation = read('common/situations/epoch_phase_ii_situations.txt');
const events = read('events/epoch_phase_ii_events.txt');
const blockC = read('events/epoch_phase_ii_block_c_events.txt');
const projects = read('common/special_projects/epoch_phase_ii_projects.txt');
const techs = read('common/technology/epoch_phase_ii_technologies.txt');
const effects = read('common/scripted_effects/epoch_core_effects.txt');
const mods = read('common/static_modifiers/epoch_core_modifiers.txt');
const deposits = read('common/deposits/epoch_phase_ii_features.txt');
const onActions = read('common/on_actions/epoch_core_on_actions.txt');
const en = read('localisation/english/epoch_core_l_english.yml');
const de = read('localisation/german/epoch_core_l_german.yml');
let checks = 0;
const check = (ok, message) => { checks++; assert.ok(ok, message); };
function block(source, key) {
  const re = new RegExp(`(?:^|\\n)\\s*${key}\\s*=\\s*\\{`, 'm');
  const m = re.exec(source); assert.ok(m, `Missing ${key}`);
  const open = source.indexOf('{', m.index + m[0].length - 1);
  let depth = 0, quoted = false, comment = false;
  for (let i = open; i < source.length; i++) {
    const c = source[i];
    if (comment) { if (c === '\n') comment = false; continue; }
    if (!quoted && c === '#') { comment = true; continue; }
    if (c === '"') { quoted = !quoted; continue; }
    if (quoted) continue;
    if (c === '{') depth++;
    if (c === '}' && --depth === 0) return source.slice(open + 1, i);
  }
  throw new Error(`Unclosed ${key}`);
}
function eventBlocks(source) {
  const found = [];
  const re = /^\s*(country_event|ship_event|situation_event)\s*=\s*\{\s*\r?\n\s*id\s*=\s*(epoch_ii\.\d+)\b/gm;
  let match;
  while ((match = re.exec(source))) {
    const open = source.indexOf('{', match.index);
    let depth = 0, quoted = false, comment = false;
    for (let i = open; i < source.length; i++) {
      const c = source[i];
      if (comment) { if (c === '\n') comment = false; continue; }
      if (!quoted && c === '#') { comment = true; continue; }
      if (c === '"') { quoted = !quoted; continue; }
      if (quoted) continue;
      if (c === '{') depth++;
      if (c === '}' && --depth === 0) {
        found.push({ type: match[1], id: match[2], body: source.slice(open + 1, i) });
        re.lastIndex = i + 1;
        break;
      }
    }
  }
  return found;
}
function project(key) {
  const at = projects.indexOf(`key = "${key}"`); assert.notEqual(at, -1, `Missing project ${key}`);
  const start = projects.lastIndexOf('special_project = {', at); const end = projects.indexOf('\n}', at);
  assert.ok(start >= 0 && end > at, `Malformed project ${key}`);
  return projects.slice(start, end + 2);
}
function balanced(source, file) {
  let depth = 0, quoted = false, comment = false;
  for (const c of source) {
    if (comment) { if (c === '\n') comment = false; continue; }
    if (!quoted && c === '#') { comment = true; continue; }
    if (c === '"') { quoted = !quoted; continue; }
    if (quoted) continue;
    if (c === '{') depth++;
    if (c === '}' && --depth < 0) throw new Error(`${file}: unexpected }`);
  }
  check(depth === 0 && !quoted, `${file} has balanced braces and strings`);
}

for (const [file, source] of Object.entries({ situation, events, blockC, projects, techs, effects, mods, deposits })) balanced(source, file);
const declaredEvents = eventBlocks(blockC);
const declaredEvent = (type, id) => {
  const found = declaredEvents.find(e => e.type === type && e.id === id);
  assert.ok(found, `Missing ${type} ${id} in Block C`);
  return found.body;
};
const allCountryEvents = declaredEvents.filter(e => e.type === 'country_event');
check(allCountryEvents.length >= 9 && allCountryEvents.every(e => !/\bowner\s*=\s*\{/.test(e.body)), 'Every declared Block C country_event performs country work in its own country scope');
const mainStages = block(block(situation, 'epoch_resonance_protocol'), 'stages');
const main = [...mainStages.matchAll(/(stage_[a-z0-9_]+)\s*=\s*\{[^}]*?end\s*=\s*(\d+)/g)].map(x => [x[1], Number(x[2])]);
const ordered = ['stage_scar_wakes','stage_scar_report','stage_first_hunters','stage_hunters_resolution','stage_broken_code','stage_block_a_handoff','stage_ch4_research','stage_ch4_incidents','stage_ch5_research','stage_ch5_expedition','stage_ch5_silence','stage_ch6_research','stage_ch6_resolution','stage_block_b_report','stage_ch7_boundary','stage_ch7_counterpattern','stage_ch7_instability','stage_ch7_control','stage_ch8_countermark'];
check(main.map(s => s[0]).join(',') === ordered.join(','), 'The single fresh-campaign Situation contains all eight chapters in order');
check(main.every((s, i) => i === 0 || s[1] > main[i - 1][1]), 'Situation stage thresholds increase monotonically through Chapter 8');
const recovery = block(situation, 'epoch_resonance_chamber_recovery');
check(/initial_progress\s*=\s*0/.test(recovery) && /stage_ch7_boundary/.test(recovery) && !/stage_scar_wakes/.test(recovery), 'Already-completed Block B saves enter a C-only recovery Situation');
check(/has_country_flag = epoch_ii_handoff_block_c_ready[\s\S]{0,500}start_situation = \{ type = epoch_resonance_chamber_recovery/.test(events), 'Yearly owner-local recovery starts C only from the saved B handoff');
check(/set_country_flag = epoch_ii_active/.test(events.slice(events.indexOf('type = epoch_resonance_chamber_recovery') - 150)), 'Recovery re-enables the Situation approach gate');
const yearly = block(events.slice(events.indexOf('id = epoch_ii.0')), 'immediate');
check(!/set_variable\s*=\s*\{\s*which\s*=\s*epoch_ii_resonance_stability\s+value\s*=\s*60/.test(yearly), 'Block C recovery does not reset saved resonance stability');
for (const [stage, gate] of [['stage_ch7_boundary','epoch_ii_ch7_boundary_resolved'],['stage_ch7_counterpattern','epoch_ii_ch7_counterpattern_resolved'],['stage_ch7_instability','epoch_ii_ch7_instability_resolved'],['stage_ch7_control','epoch_ii_ch7_control_resolved'],['stage_ch8_countermark','epoch_ii_phase_complete']]) {
  check(new RegExp(`current_stage\\s*=\\s*${stage}[\\s\\S]{0,250}has_country_flag\\s*=\\s*${gate}`).test(situation), `${stage} is gated by ${gate}`);
}
check(/set_country_flag = epoch_ii_block_b_complete set_country_flag = epoch_ii_handoff_block_c_ready/.test(events) && /remove_country_flag = epoch_ii_active/.test(situation.slice(situation.indexOf('on_progress_complete'))), 'Fresh Block B reports a C handoff and keeps the campaign active through the new final gate');

for (const [key, callback] of [['EPOCH_II_CHAMBER_BOUNDARY','epoch_ii.136'],['EPOCH_II_CHAMBER_COUNTERPATTERN','epoch_ii.137'],['EPOCH_II_CHAMBER_CONTROL','epoch_ii.138']]) {
  const p = project(key);
  check(/requirements = \{ shipclass_science_ship = 1 leader = scientist \}/.test(p) && /event_scope = ship_event/.test(p), `${key} is a real staffed Science Ship project`);
  check(p.includes(`id = ${callback}`) && blockC.includes(`id = ${callback}`), `${key} has a source-defined successful ship callback`);
  check(/on_fail/.test(p) && /on_cancel/.test(p), `${key} has failure and cancellation recovery`);
}

const callbackSpecs = [
  { project: 'EPOCH_II_CHAMBER_BOUNDARY', ship: 'epoch_ii.136', country: 'epoch_ii.130', recovery: 'epoch_ii.131', retryName: 'epoch_ii.131.retry', archiveName: 'epoch_ii.131.archive', retryFlag: 'epoch_ii_ch7_boundary_retry_used', dispatch: 'epoch_ii_chamber_dispatch_boundary', start: 'epoch_ii_ch7_outer_project_started', resolved: 'epoch_ii_ch7_boundary_resolved', reward: 'physics_research = 200', delta: 'value = 5', next: 'epoch_ii.121' },
  { project: 'EPOCH_II_CHAMBER_COUNTERPATTERN', ship: 'epoch_ii.137', country: 'epoch_ii.132', recovery: 'epoch_ii.133', retryName: 'epoch_ii.133.retry', archiveName: 'epoch_ii.133.archive', retryFlag: 'epoch_ii_ch7_counter_retry_used', dispatch: 'epoch_ii_chamber_dispatch_counterpattern', start: 'epoch_ii_ch7_counter_project_started', resolved: 'epoch_ii_ch7_counterpattern_resolved', reward: 'society_research = 200', delta: 'value = 5', next: 'epoch_ii.123' },
  { project: 'EPOCH_II_CHAMBER_CONTROL', ship: 'epoch_ii.138', country: 'epoch_ii.134', recovery: 'epoch_ii.135', retryName: 'epoch_ii.135.retry', archiveName: 'epoch_ii.135.archive', retryFlag: 'epoch_ii_ch7_control_retry_used', dispatch: 'epoch_ii_chamber_dispatch_control', start: 'epoch_ii_ch7_control_project_started', resolved: 'epoch_ii_ch7_control_resolved', reward: 'engineering_research = 150', delta: 'value = 8', next: 'epoch_ii.127' },
];
for (const spec of callbackSpecs) {
  const p = project(spec.project), ship = declaredEvent('ship_event', spec.ship), country = declaredEvent('country_event', spec.country), recovery = declaredEvent('country_event', spec.recovery);
  check(/on_success\s*=\s*\{\s*ship_event/.test(p) && new RegExp(`id = ${spec.ship.replace('.', '\\.')}\\b`).test(p), `${spec.project} success enters its ship-scope callback`);
  check(/owner\s*=\s*\{[\s\S]*?country_event/.test(ship) && new RegExp(`country_event = \\{ id = ${spec.country.replace('.', '\\.')} \\}`).test(ship), `${spec.ship} changes from the project ship to its owning campaign country`);
  check(country.includes(`has_country_flag = epoch_ii_active`) && country.includes(`has_country_flag = ${spec.start}`) && new RegExp(`NOT = \\{ has_country_flag = ${spec.resolved} \\}`).test(country), `${spec.country} requires the active campaign, matching started project, and an unresolved completion`);
  check(!/\bowner\s*=\s*\{/.test(country) && country.includes(`set_country_flag = ${spec.resolved}`) && country.includes(spec.reward) && country.includes(spec.delta) && country.includes(`country_event = { id = ${spec.next} }`), `${spec.country} pays one direct country-scope reward, sets its gate, then releases the matching Situation stage`);
  check(p.includes(`on_fail = { country_event = { id = ${spec.recovery} } }`) && p.includes(`on_cancel = { country_event = { id = ${spec.recovery} } }`), `${spec.project} routes both failure and cancellation into the owning country recovery`);
  check(recovery.includes(`has_country_flag = ${spec.resolved}`) && recovery.includes('recovery_open'), `${spec.recovery} opens at most one unresolved recovery event`);
  const retryLine = recovery.split(/\r?\n/).find(line => line.includes(`name = ${spec.retryName}`)) || '';
  const archiveLine = recovery.split(/\r?\n/).find(line => line.includes(`name = ${spec.archiveName}`)) || '';
  check(retryLine.includes(`NOT = { has_country_flag = ${spec.retryFlag} }`) && retryLine.includes('exists = event_target:epoch_ii_chamber_system@root') && retryLine.includes('has_access_fleet = root') && retryLine.includes('resource_stockpile_compare') && retryLine.includes(`set_country_flag = ${spec.retryFlag}`) && retryLine.includes(spec.dispatch) && effects.includes(`${spec.dispatch} = {`) && effects.includes(`enable_special_project = { name = ${spec.project}`), `${spec.recovery} gates one paid retry on unused status, available target, access, and resources`);
  check(archiveLine.includes('hidden_effect') && !archiveLine.includes('trigger =') && archiveLine.includes(`set_country_flag = ${spec.resolved}`) && archiveLine.includes(`country_event = { id = ${spec.next}`), `${spec.recovery} keeps an always-available archive route that resolves and releases the stage`);
}
function simulateSuccessfulCallback(spec) {
  const flags = new Set(['epoch_ii_active', spec.start]);
  let rewardCount = 0, releaseCount = 0;
  for (let attempt = 0; attempt < 2; attempt++) {
    if (!flags.has('epoch_ii_active') || !flags.has(spec.start) || flags.has(spec.resolved)) continue;
    flags.add(spec.resolved); rewardCount++; releaseCount++;
  }
  return { flags, rewardCount, releaseCount };
}
for (const spec of callbackSpecs) {
  const result = simulateSuccessfulCallback(spec);
  check(result.flags.has(spec.resolved) && result.rewardCount === 1 && result.releaseCount === 1, `${spec.country} model: ship success reaches the campaign empire once; a repeated callback cannot repeat rewards or release`);
}
function simulateRecovery(targetAvailable) {
  let open = false, retryUsed = false, resolved = false, projects = 0;
  const failOrCancel = () => { if (!resolved && !open) open = true; };
  failOrCancel(); failOrCancel(); // repeated on_fail/on_cancel after a load
  const retry = () => {
    if (!open || retryUsed || !targetAvailable || resolved) return false;
    retryUsed = true; open = false; projects++; return true;
  };
  const firstRetry = retry(), secondRetry = retry();
  if (!firstRetry) { resolved = true; open = false; } // archive is always available
  return { open, retryUsed, resolved, projects, firstRetry, secondRetry };
}
for (const targetAvailable of [true, false]) {
  const result = simulateRecovery(targetAvailable);
  check(result.projects <= 1 && !result.secondRetry && !result.open && (targetAvailable ? result.retryUsed && !result.resolved : result.resolved), `Project failure/cancel/load recovery (${targetAvailable ? 'reachable target' : 'lost ship or target'}) allows at most one retry or resolves through archive`);
}
check(/epoch_ii_chamber_dispatch_boundary[\s\S]*enable_special_project/.test(effects) && /has_access_fleet = root/.test(effects), 'Projects dispatch to the saved reachable convergence system');
check(/epoch_ii_interrupted_node@root/.test(blockC.slice(0, blockC.indexOf('option = { name = epoch_ii.120.careful'))) && /epoch_ii_delayed_node@root/.test(blockC.slice(0, blockC.indexOf('option = { name = epoch_ii.120.careful'))) && /epoch_ii_chamber_system@root/.test(blockC + effects) && !/epoch_ii_target_system@root/.test(blockC), 'The chamber target is saved from an accessible Chapter 5 node, with the alternate node as fallback');
check(/epoch_ii.120\.archive/.test(blockC) && /700 }/.test(blockC), 'Missing or unreachable chamber sites retain an expensive archive route');
check(/days_to_research = 180/.test(project('EPOCH_II_CHAMBER_BOUNDARY')) && /days_to_research = 240/.test(project('EPOCH_II_CHAMBER_COUNTERPATTERN')) && /days_to_research = 270/.test(project('EPOCH_II_CHAMBER_CONTROL')), 'Three distinct research durations make the operation player-visible and non-instant');
const expeditionFast = blockC.slice(blockC.indexOf('option = { name = epoch_ii.122.expedition'), blockC.indexOf('option = { name = epoch_ii.122.partial'));
const expeditionPartial = blockC.slice(blockC.indexOf('option = { name = epoch_ii.122.partial'), blockC.indexOf('option = { name = epoch_ii.122.ship'));
const expeditionShip = blockC.slice(blockC.indexOf('option = { name = epoch_ii.122.ship'), blockC.indexOf('option = { name = epoch_ii.122.emergency'));
check(expeditionFast.includes('epoch_ii_two_real_systems_surveyed') && expeditionFast.includes('epoch_ii_expedition_data_complete') && !expeditionFast.includes('epoch_ii_chamber_dispatch_counterpattern'), 'Instant counter-pattern analysis requires complete records from two surveyed Chapter 5 nodes');
check(expeditionPartial.includes('epoch_ii_expedition_data_partial') && expeditionPartial.includes('epoch_ii_expedition_data_archived') && !expeditionPartial.includes('epoch_ii_expedition_data_complete'), 'Paid archive reconstruction is limited to partial or archived evidence');
check(expeditionShip.includes('epoch_ii_ch7_counter_project_started') && expeditionShip.includes('epoch_ii_chamber_dispatch_counterpattern') && /days_to_research = 240/.test(project('EPOCH_II_CHAMBER_COUNTERPATTERN')) && en.includes('epoch_ii.122.ship:0 "Run a staffed comparison project for fresh verification.'), 'The staffed 240-day project offers a distinct fresh-verification path and success reward');

const tech = block(techs, 'tech_epoch_resonance_field_control');
check(/area = engineering/.test(tech) && /cost = @tier3cost2/.test(tech) && /add_research_option = tech_epoch_resonance_field_control/.test(blockC), 'Resonance Field Control is normally researched and offered before the operation');
check(/AND = \{ has_technology = tech_epoch_adaptive_resonance_armor has_technology = tech_epoch_contamination_neutral_infrastructure \}/.test(tech) && /has_technology = tech_epoch_phased_sensors/.test(tech), 'Tech potential implements the specified two-branch prerequisite with a valid scripted OR');
check(/country_physics_research_produces_mult = 0\.03/.test(tech) && /has_technology = tech_epoch_resonance_field_control/.test(blockC), 'Technology has a lasting research effect and reduces chamber stabilization costs');
check(/epoch_ii.126.archive/.test(blockC) && /1500/.test(blockC), 'A costly no-tech observation route completes the chamber');

for (const group of ['organic','hive','machine']) check(blockC.includes(`epoch_ii.124.desc.${group}`) && blockC.includes(`epoch_ii.124.${group}`), `The crisis has a ${group}-appropriate response`);
check(/change_variable = \{ which = epoch_ii_resonance_stability value = -8 \}/.test(blockC) && /epoch_ii_clamp_resonance_stability = yes/.test(blockC), 'The activation crisis changes bounded resonance stability');
check(/check_variable = \{ which = epoch_ii_resonance_stability value >= 40 \}/.test(blockC) && /has_country_flag = epoch_ii_ch7_low_stability_margin/.test(blockC) && /epoch_ii_ch7_critical_strain/.test(blockC), 'High stability unlocks a safer boundary route and low/critical stability adds measured risk');
check(/add_modifier = \{ modifier = epoch_ii_ch7_crisis_scars days = -1 \}/.test(blockC) && /resource = food/.test(blockC) && /resource = alloys/.test(blockC), 'Crisis responses have planet and resource consequences, including non-biological paths');
check(/check_variable = \{ which = epoch_ii_resonance_stability value < 20 \}/.test(blockC) || /critical/.test(blockC.toLowerCase()) || /epoch_ii_resonance_stability/.test(blockC), 'The final operation reads the carried stability variable');

const decisions = ['epoch_core_initial_aggressive','epoch_core_initial_cautious','epoch_core_contamination_worsened','epoch_core_expedition_contact_lost','epoch_core_expedition_survivors_found','epoch_core_structure_mapping_forced','epoch_core_structure_echo_matched','epoch_ii_wreck_available','epoch_ii_diversion_succeeded','epoch_ii_expedition_data_complete','epoch_ii_expedition_data_partial','epoch_ii_expedition_data_archived','epoch_ii_silent_system_dark','epoch_ii_silent_system_broadcast','epoch_ii_exploitation_protocol','epoch_ii_quarantine_protocol','epoch_ii_second_force_destroyed','epoch_ii_second_force_withdrawn'];
const decisionHits = decisions.filter(flag => blockC.includes(flag));
check(decisionHits.length >= 12, `At least twelve actual Phase I / Block A / B outcome flags affect project availability, risks, resources, evidence or lasting consequences (${decisionHits.length})`);

const endings = ['boundary','listen','outward','break'];
for (const ending of endings) {
  const effect = block(effects, `epoch_ii_resolve_ch8_${ending}`);
  check(effect.includes(`set_country_flag = epoch_ii_ending_${ending}`) && effect.includes('set_country_flag = epoch_ii_phase_complete'), `Ending ${ending} records a durable exclusive result and phase completion`);
  check(/add_modifier = \{ modifier = epoch_ii_ending_/.test(effect), `Ending ${ending} applies a persistent gameplay modifier`);
}
check(/NOR = \{ has_country_flag = epoch_ii_ending_boundary has_country_flag = epoch_ii_ending_listen has_country_flag = epoch_ii_ending_outward has_country_flag = epoch_ii_ending_break \}/.test(effects), 'The four endings are mutually exclusive and repeated callbacks cannot stack them');
check(/d_epoch_chamber_ruin/.test(effects) && /epoch_ii_set_site_controlled = yes/.test(effects) && /epoch_ii_set_site_active = yes/.test(effects), 'Endings set distinct persistent site states while preserving Phase I deposits/modifiers');
check(/epoch_ii_phase_iii_suppression_map/.test(effects) && /epoch_ii_phase_iii_live_channel/.test(effects) && /epoch_ii_phase_iii_outbound_bearing/.test(effects) && /epoch_ii_phase_iii_damaged_fragment/.test(effects), 'Each ending prepares a different Phase III handoff record without starting Phase III');
check(/epoch_ii_followup_roll_cooldown/.test(events) && /20 = \{ country_event = \{ id = epoch_ii\.139 \} \}/.test(events) && /30 = \{ country_event = \{ id = epoch_ii\.139 \} \}/.test(events), 'Persistent listening/outward endings carry distinct owner-local annual aftershock risks');
check(/epoch_ii_guarded_channel_incident_recorded/.test(blockC) && /epoch_ii_outbound_trace_echoed/.test(blockC) && /epoch_ii_damaged_echo_seen/.test(blockC) && /epoch_ii_suppression_residual_echo_seen/.test(blockC), 'Aftershocks apply ending-specific costs and persistent history');
check(/set_country_flag = epoch_ii_phase_iii_handoff_ready/.test(situation) && /set_country_flag = epoch_ii_phase_complete/.test(effects), 'Phase III handoff is gated after the Phase II ending');
check(/set_country_flag = epoch_ii_ending_/.test(effects) && /remove_country_flag = epoch_ii_active/.test(situation), 'Campaign activation ends only after the complete Phase II Situation');
const closeMain = block(situation, 'epoch_resonance_protocol'), closeRecovery = block(situation, 'epoch_resonance_chamber_recovery');
for (const ending of endings) check(block(effects, `epoch_ii_resolve_ch8_${ending}`).includes('set_country_flag = epoch_ii_phase_complete') && /has_country_flag = epoch_ii_phase_complete/.test(closeMain + closeRecovery) && /country_event = \{ id = epoch_ii\.129/.test(closeMain + closeRecovery), `Ending ${ending} releases the final Situation stage and reaches the Chapter 8 report`);
check(!/start_situation\s*=\s*\{\s*type\s*=\s*epoch_resonance_protocol_phase_iii/.test(situation + events + blockC + effects), 'Phase II endings record Phase III handoffs without starting Phase III content');

const referenced = [...blockC.matchAll(/(?:title|name|desc)\s*=\s*(?:\{[^}]*?text\s*=\s*)?(epoch_ii\.[A-Za-z0-9_.]+|EPOCH_II_[A-Z_]+)(?=\s|\})/g)].map(m => m[1]);
for (const key of new Set(referenced)) check(en.includes(`${key}:0`) && de.includes(`${key}:0`), `Block C localization ${key} exists in English and German`);
for (const key of ['EPOCH_II_CHAMBER_BOUNDARY','EPOCH_II_CHAMBER_COUNTERPATTERN','EPOCH_II_CHAMBER_CONTROL']) check(en.includes(`${key}_DESC:0`) && de.includes(`${key}_DESC:0`), `${key} project description is localized in both languages`);

// Model the hard handoff and stage resolution flags from the actual Situation.
const cStages = [['c7_boundary','epoch_ii_ch7_boundary_resolved'],['c7_counterpattern','epoch_ii_ch7_counterpattern_resolved'],['c7_instability','epoch_ii_ch7_instability_resolved'],['c7_control','epoch_ii_ch7_control_resolved'],['c8','epoch_ii_phase_complete']];
function runC(startFlags, route) {
  const flags = new Set(startFlags);
  const stability = route.startStability;
  for (const [, gate] of cStages) {
    if (gate === 'epoch_ii_ch7_instability_resolved') flags.add(gate); // all resource routes, including emergency, resolve
    else if (gate === 'epoch_ii_ch7_boundary_resolved') flags.add(gate);
    else if (gate === 'epoch_ii_ch7_counterpattern_resolved') flags.add(gate);
    else if (gate === 'epoch_ii_ch7_control_resolved') flags.add(gate);
    else flags.add(gate);
  }
  return { flags, stability };
}
const fresh = runC(['epoch_ii_handoff_block_c_ready','epoch_ii_active','epoch_ii_ch1_resolved','epoch_ii_ch2_resolved','epoch_ii_ch3_resolved','epoch_ii_ch4_resolved','epoch_ii_ch5_resolved','epoch_ii_ch6_resolved'], { startStability: 34 });
check(cStages.every(([,gate]) => fresh.flags.has(gate)) && fresh.stability === 34, 'Fresh low-stability campaign carries saved stability and resolves all five C gates');
const resumed = runC(['epoch_ii_handoff_block_c_ready','epoch_ii_block_b_complete','epoch_ii_ch6_resolved'], { startStability: 8 });
check(cStages.every(([,gate]) => resumed.flags.has(gate)) && resumed.stability === 8, 'Already-completed Block B resumes at C without replaying chapters or resetting critical stability');
check(/on_yearly_pulse_country/.test(onActions) && /epoch_resonance_chamber_recovery/.test(situation + events) && events.slice(events.indexOf('id = epoch_ii.0'), events.indexOf('id = epoch_ii.0') + 500).includes('has_country_flag = epoch_core_campaign_opted_out'), 'Save/load recovery is owner-local and does not re-invite opted-out Phase-I campaigns');

console.log(`PASS: ${checks} Block C static checks passed. Not an in-game validation.`);
