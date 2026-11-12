'use strict';

// Focused source-only regression for the three optional early side stories.
// This verifies the declared script contract, not Clausewitz runtime behavior.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
// The shared parser has an optional installed-Vanilla audit. This regression
// is intentionally game-independent, so import it in its source-only mode.
process.argv.push(path.resolve(__dirname, '..'), '--source-only');
const { parse, get, parsedByPath } = require('./test_clausewitz_structure.cjs');
process.argv.splice(-2, 2);

const root = path.resolve(__dirname, '..');
const read = p => fs.readFileSync(path.join(root, p), 'utf8').replace(/^\uFEFF/, '');
const eventPath = 'events/epoch_echoes_events.txt';
const projectPath = 'common/special_projects/epoch_echoes_projects.txt';
const decisionPath = 'common/decisions/epoch_echoes_decisions.txt';
const eventSource = read(eventPath);
const projectSource = read(projectPath);
const decisionSource = read(decisionPath);
const eventBlocks = parse(eventSource, eventPath);
const projectBlocks = parse(projectSource, projectPath);
const decisionBlocks = parse(decisionSource, decisionPath);
const check = (condition, message) => assert.ok(condition, message);
const ids = new Set();
for (const [, block] of eventBlocks) {
  if (!Array.isArray(block)) continue;
  const id = get(block, 'id');
  check(id && !ids.has(id), `Unique event ID ${id}`);
  ids.add(id);
}
for (const source of [eventSource, projectSource, read('common/on_actions/epoch_core_on_actions.txt')]) {
  for (const match of source.matchAll(/\bid\s*=\s*(epoch_echoes\.\d+)\b/g)) check(ids.has(match[1]), `Defined callback ${match[1]}`);
}
for (const hook of ['epoch_echoes.1', 'epoch_echoes.20', 'epoch_echoes.22', 'epoch_echoes.900']) check(read('common/on_actions/epoch_core_on_actions.txt').includes(hook), `Registered on-action ${hook}`);

const projects = new Map(projectBlocks.map(([, block]) => [get(block, 'key'), block]));
const projectKeys = [
  'EPOCH_ECHOES_GHOST_TRACE', 'EPOCH_ECHOES_GHOST_CAUTIOUS',
  'EPOCH_ECHOES_GHOST_FORCED', 'EPOCH_ECHOES_GHOST_STABILIZE',
  'EPOCH_ECHOES_RELAY_SURVEY', 'EPOCH_ECHOES_RELAY_DEFUSE',
  'EPOCH_ECHOES_RELAY_DEFUSE_AIDED',
];
for (const key of projectKeys) {
  const project = projects.get(key);
  check(project, `Defined project ${key}`);
  check(get(project, 'event_scope') === 'ship_event', `${key} uses a ship callback`);
  check(get(project, 'location') === 'yes', `${key} has a visible target`);
  check(get(get(project, 'requirements'), 'shipclass_science_ship') === '1', `${key} requires a Science Ship`);
  check(get(get(project, 'requirements'), 'leader') === 'scientist', `${key} requires a scientist`);
  check(JSON.stringify(get(project, 'on_start')).includes('save_global_event_target_as'), `${key} persists its assigned location`);
  check(JSON.stringify(get(project, 'on_success')).includes('scopes'), `${key} passes its saved destination to its callback`);
  check(get(project, 'on_fail').length && get(project, 'on_cancel').length, `${key} has an interruption path`);
}
check(Number(get(projects.get('EPOCH_ECHOES_GHOST_CAUTIOUS'), 'days_to_research')) > Number(get(projects.get('EPOCH_ECHOES_GHOST_FORCED'), 'days_to_research')), 'Cautious recovery takes longer');
check(/energy\s*=\s*-250[\s\S]*alloys\s*=\s*-100/.test(eventSource), 'Forced recovery spends energy and alloys');
check(/35\s*=\s*\{[^}]*epoch_echoes_ghost_complication/.test(eventSource), 'Forced recovery can require a follow-up stabilization project');
check(/epoch_echoes_ghost_trace_complete/.test(eventSource) && /add_resource = \{ society_research = 180 physics_research = 120 \}/.test(eventSource), 'Ghost completion grants a bounded research reward');

const decisions = new Map(decisionBlocks);
for (const key of ['decision_epoch_echoes_containment', 'decision_epoch_echoes_research', 'decision_epoch_echoes_exploit']) {
  const decision = decisions.get(key);
  check(decision, `Defined colony strategy ${key}`);
  check(get(decision, 'enactment_time') > 0, `${key} takes time`);
  check(get(get(decision, 'resources'), 'cost').length > 0, `${key} costs resources`);
  check(JSON.stringify(get(decision, 'potential')).includes('epoch_echoes_unquiet_active'), `${key} applies to the active disturbance`);
  check(JSON.stringify(get(decision, 'effect')).includes('epoch_echoes_unquiet_closed'), `${key} closes exactly once`);
}
check(JSON.stringify(decisions.get('decision_epoch_echoes_exploit')).includes('random_list'), 'Exploitation has a real success/backlash roll');
check(decisions.has('decision_epoch_echoes_recover'), 'Backlash has a paid repair decision');
const storyTriggers = read('common/scripted_triggers/epoch_echoes_triggers.txt');
check(/epoch_echoes_safe_colony/.test(eventSource) && /epoch_res_infected/.test(storyTriggers) && /epoch_ii_controlled_resonance/.test(storyTriggers) && /epoch_core_resonance_scar_healed/.test(storyTriggers), 'Colony selection excludes protected, healed, and active Resonance states');
check(/epoch_echoes_unquiet_hive/.test(eventSource) && /epoch_echoes_unquiet_machine/.test(eventSource), 'Hive and machine colonies receive class-specific disturbance modifiers');

check(/create_country\s*=\s*\{[\s\S]*?type\s*=\s*epoch_echoes_sentinels/.test(eventSource), 'Military route creates a private hostile country');
check(/create_fleet\s*=\s*\{[\s\S]*?set_owner\s*=\s*event_target:epoch_echoes_sentinel_country@root[\s\S]*?create_ship/.test(eventSource), 'Military route creates a native fleet with ships');
check(read('common/on_actions/epoch_core_on_actions.txt').includes('epoch_echoes.900'), 'Relay outcome listens to native fleet destruction');
check(/id = epoch_echoes\.23[\s\S]*?value >= 4[\s\S]*?epoch_echoes_finalize_relay/.test(eventSource), 'Closed relay result has a spaced, capped recovery path');
check(!/on_monthly_pulse\s*=\s*\{[^}]*epoch_echoes/.test(read('common/on_actions/epoch_core_on_actions.txt')), 'Stories add no monthly galaxy scan');
check(/epoch_echoes_ghost_signal_insight/.test(eventSource) && /epoch_echoes_unquiet_contained/.test(eventSource) && /EPOCH_ECHOES_RELAY_DEFUSE_AIDED/.test(eventSource), 'Ghost and colony outcomes shorten the relay research route');
check(/create_point_of_interest\s*=/.test(read('common/scripted_effects/epoch_echoes_effects.txt')) && /epoch_echoes_relay_site/.test(eventSource), 'Relay story has a native map point of interest and cleanup');
check(/epoch_core_campaign_opted_out/.test(eventSource) && /epoch_echoes_decline_cleaned/.test(eventSource), 'Permanent refusal has an owner-local cleanup path');

for (const language of ['english', 'german']) {
  const locDir = path.join(root, 'localisation', language);
  const text = fs.readdirSync(locDir).filter(file => file.endsWith('.yml')).map(file => read(`localisation/${language}/${file}`)).join('\n');
  for (const key of [...projectKeys, 'decision_epoch_echoes_containment', 'decision_epoch_echoes_research', 'decision_epoch_echoes_exploit', 'decision_epoch_echoes_recover']) {
    check(new RegExp(`^\\s*${key}:`, 'm').test(text), `${language} project/decision label ${key}`);
    if (key.startsWith('EPOCH_')) check(new RegExp(`^\\s*${key}_DESC:`, 'm').test(text), `${language} project description ${key}`);
  }
}
check(/'common\/\*\*'/.test(read('.github/workflows/release-regression-pr.yml')) && /'events\/\*\*'/.test(read('.github/workflows/release-regression-pr.yml')), 'PR CI includes gameplay source paths');

console.log(`PASS: ${ids.size} unique story callbacks, ${projectKeys.length} native projects, paid colony paths, combat route, story links, recovery, and EN/DE references.`);
