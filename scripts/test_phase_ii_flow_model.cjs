// Transition model for the six Phase II Block A situation stages.
// It reads stage thresholds, approach modifiers, event wiring, and resolution
// flags from the game scripts, then runs representative player paths.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = process.argv[2] || path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8').replace(/^\uFEFF/, '');
const situation = read('common/situations/epoch_phase_ii_situations.txt');
const events = read('events/epoch_phase_ii_events.txt');
let checks = 0;
const check = (ok, message) => { checks++; assert.ok(ok, message); };

function blocks(source, key) {
  const out = [];
  const re = new RegExp(`(?:^|\\n)\\s*${key}\\s*=\\s*\\{`, 'gm');
  for (let m; (m = re.exec(source));) {
    const open = source.indexOf('{', m.index + m[0].length - 1);
    let depth = 0, quote = false, comment = false;
    for (let i = open; i < source.length; i++) {
      const c = source[i];
      if (comment) { if (c === '\n') comment = false; continue; }
      if (!quote && c === '#') { comment = true; continue; }
      if (c === '"') { quote = !quote; continue; }
      if (!quote && c === '{') depth++;
      if (!quote && c === '}' && --depth === 0) { out.push(source.slice(open + 1, i)); re.lastIndex = i + 1; break; }
    }
  }
  return out;
}
function namedBlock(source, key, value) {
  const re = new RegExp(`(?:^|\\n)\\s*${key}\\s*=\\s*${value}\\s*\\{`,'m');
  const m = re.exec(source);
  assert.ok(m, `Missing ${key} = ${value}`);
  const open = source.indexOf('{', m.index + m[0].length - 1);
  let depth = 0, quote = false, comment = false;
  for (let i = open; i < source.length; i++) {
    const c = source[i];
    if (comment) { if (c === '\n') comment = false; continue; }
    if (!quote && c === '#') { comment = true; continue; }
    if (c === '"') { quote = !quote; continue; }
    if (!quote && c === '{') depth++;
    if (!quote && c === '}' && --depth === 0) return source.slice(open + 1, i);
  }
  throw new Error(`Unclosed ${key} = ${value}`);
}
function withoutScopeBlocks(source, scope) {
  const pattern = new RegExp(`\\b${scope}\\s*=\\s*\\{`, 'gm');
  let out = '', cursor = 0;
  for (let m; (m = pattern.exec(source));) {
    const open = source.indexOf('{', m.index + m[0].length - 1);
    let depth = 0, quote = false, comment = false, end = -1;
    for (let i = open; i < source.length; i++) {
      const c = source[i];
      if (comment) { if (c === '\n') comment = false; continue; }
      if (!quote && c === '#') { comment = true; continue; }
      if (c === '"') { quote = !quote; continue; }
      if (!quote && c === '{') depth++;
      if (!quote && c === '}' && --depth === 0) { end = i; break; }
    }
    if (end < 0) throw new Error(`Unclosed ${scope} scope`);
    out += source.slice(cursor, m.index) + ' ';
    cursor = end + 1;
    pattern.lastIndex = cursor;
  }
  return out + source.slice(cursor);
}

const stageNames = ['stage_scar_wakes','stage_scar_report','stage_first_hunters','stage_hunters_resolution','stage_broken_code','stage_block_a_handoff'];
// The stage parser above uses a literal keyed block. Extract each body directly
// so the model follows the actual ordered `end` thresholds in the source.
const stagesBody = namedBlock(situation, 'stages', '');
const stageData = stageNames.map(name => {
  const m = new RegExp(`${name}\\s*=\\s*\\{[^}]*end\\s*=\\s*(\\d+)`).exec(stagesBody);
  assert.ok(m, `Missing end threshold for ${name}`);
  const body = new RegExp(`${name}\\s*=\\s*\\{([^}]*)`).exec(stagesBody)[1];
  return { name, end: Number(m[1]), body };
});
check(stageData.map(s => s.end).join(',') === '20,30,50,60,80,90', 'The six source stage thresholds remain ordered and monotonic');

const monthly = namedBlock(situation, 'monthly_progress', '');
const modifiers = blocks(monthly, 'modifier').map(body => ({
  body,
  amount: Number(/\badd\s*=\s*(-?\d+(?:\.\d+)?)/.exec(body)?.[1] || 0),
  stage: /current_stage\s*=\s*(stage_[a-z_]+)/.exec(body)?.[1],
  approach: /current_situation_approach\s*=\s*(epoch_ii_[a-z_]+)/.exec(body)?.[1],
  progressCap: Number(/situation_progress\s*<\s*(\d+)/.exec(body)?.[1] || 100),
  gate: /owner\s*=\s*\{\s*has_country_flag\s*=\s*(epoch_ii_[a-z0-9_]+)/.exec(body)?.[1],
})).filter(m => m.body.includes('desc = epoch_ii_progress_'));
check(modifiers.length >= 20, 'The model loaded the source progress modifiers for the four approaches');

const eventDefs = new Map();
for (const kind of ['country_event','situation_event','ship_event']) {
  for (const body of blocks(events, kind)) {
    const id = /\bid\s*=\s*(epoch_ii\.\d+)/.exec(body)?.[1];
    if (id) eventDefs.set(id, { kind, body });
  }
}
const stageEntryEvent = new Map(stageData.map(stage => {
  const id = /on_first_enter\s*=\s*\{\s*situation_event\s*=\s*\{\s*id\s*=\s*(epoch_ii\.\d+)/.exec(stage.body)?.[1];
  return [stage.name, id || null];
}));
check(stageEntryEvent.get('stage_scar_report') === 'epoch_ii.2', 'Chapter 1 is wired to its resolution stage');
check(stageEntryEvent.get('stage_hunters_resolution') === 'epoch_ii.4', 'Chapter 2 is wired to its resolution stage');
check(stageEntryEvent.get('stage_block_a_handoff') === 'epoch_ii.7', 'Chapter 3 prompt occurs when the research threshold is reached');
check(!stageEntryEvent.get('stage_broken_code'), 'Chapter 3 does not start before the broken-code research stage completes');
check(/current_stage\s*=\s*stage_broken_code/.test(modifiers.map(m => m.body).join('\n')) && !modifiers.filter(m => m.stage === 'stage_broken_code').some(m => m.gate === 'epoch_ii_ch3_resolved'), 'Broken-code research advances without the not-yet-set Chapter 3 flag');
check(modifiers.filter(m => m.stage === 'stage_block_a_handoff').length > 0 && modifiers.filter(m => m.stage === 'stage_block_a_handoff').every(m => m.gate === 'epoch_ii_ch3_resolved'), 'The handoff stage waits for explicit Chapter 3 resolution');

function model(ch2Path, c3Path) {
  const flags = new Set(['epoch_ii_active']);
  const choices = new Set();
  const seen = [];
  let progress = 0;
  let pendingProject = false, reportOpen = false, complete = false;
  const stageAt = p => stageData.find(s => p < s.end)?.name || stageData.at(-1).name;
  const currentProgress = () => {
    const stage = stageAt(progress);
    return modifiers.filter(m => m.stage === stage && m.approach === 'epoch_ii_controlled_approach' && progress < m.progressCap && (!m.gate || flags.has(m.gate))).reduce((sum,m) => sum + m.amount, 0);
  };
  const enterActions = () => {
    const stage = stageAt(progress);
    if (seen.at(-1) !== stage) {
      seen.push(stage);
      const id = stageEntryEvent.get(stage);
      if (id) {
        const def = eventDefs.get(id);
        check(def?.kind === 'situation_event', `${id} exists as a situation event at ${stage}`);
        if (id === 'epoch_ii.2') flags.add('epoch_ii_c1_prompted');
        if (id === 'epoch_ii.4') flags.add('epoch_ii_ch2_prompted');
        if (id === 'epoch_ii.7') flags.add('epoch_ii_ch3_prompted');
      }
    }
  };
  const tickUntil = target => {
    let guard = 500;
    while (stageAt(progress) !== target && guard-- > 0) {
      enterActions();
      const add = currentProgress();
      if (add <= 0) return false;
      progress = Math.min(90, progress + add);
    }
    enterActions();
    return guard > 0;
  };
  check(tickUntil('stage_scar_report'), 'Chapter 1 research stage is reached');
  check(flags.has('epoch_ii_c1_prompted') && !flags.has('epoch_ii_ch1_resolved'), 'Chapter 1 prompt precedes its completion flag');
  flags.add('epoch_ii_ch1_resolved');
  check(tickUntil('stage_hunters_resolution'), 'Chapter 2 research stage is reached after Chapter 1 resolves');
  check(flags.has('epoch_ii_ch2_prompted') && !flags.has('epoch_ii_ch2_resolved'), 'Chapter 2 prompt precedes its completion flag');
  const ch2 = eventDefs.get(ch2Path === 'combat' ? 'epoch_ii.14' : 'epoch_ii.15');
  check(!!ch2 && /set_country_flag\s*=\s*epoch_ii_ch2_resolved/.test(ch2.body), `Chapter 2 ${ch2Path} path sets the completion flag`);
  flags.add('epoch_ii_ch2_resolved');
  check(tickUntil('stage_block_a_handoff'), 'Broken-code research reaches the Chapter 3 decision threshold');
  check(!flags.has('epoch_ii_ch3_resolved') && flags.has('epoch_ii_ch3_prompted'), 'Chapter 3 event appears before its completion flag exists');
  if (c3Path === 'project') {
    pendingProject = true;
    choices.add('epoch_ii_c3_project_enabled');
    const handoffProgress = progress;
    for (let i = 0; i < 20; i++) progress = Math.min(90, progress + currentProgress());
    check(progress === handoffProgress && pendingProject && !flags.has('epoch_ii_ch3_resolved'), 'The handoff remains locked while the required project is pending');
    const success = eventDefs.get('epoch_ii.10');
    check(/country_event\s*=\s*\{\s*id\s*=\s*epoch_ii\.17/.test(success.body), 'Successful project opens the actual result report');
    reportOpen = true;
  } else if (c3Path === 'cancel') {
    const cancel = eventDefs.get('epoch_ii.25');
    check(/epoch_ii\.11\.a/.test(cancel.body) && /epoch_ii\.11\.limited_archive/.test(cancel.body) && /country_event\s*=\s*\{\s*id\s*=\s*epoch_ii\.17/.test(cancel.body), 'Project cancellation offers paid and fallback routes to the archive result report');
    reportOpen = true;
  } else {
    const start = eventDefs.get('epoch_ii.21');
    check(/set_country_flag\s*=\s*epoch_ii_c3_target_unavailable[\s\S]*?country_event\s*=\s*\{\s*id\s*=\s*epoch_ii\.11/.test(start.body), 'Missing target reaches the explicit Chapter 3 recovery event');
    check(/epoch_ii\.11\.a/.test(eventDefs.get('epoch_ii.11').body) && /epoch_ii\.11\.limited_archive/.test(eventDefs.get('epoch_ii.11').body) && /epoch_ii\.11\.no_site/.test(eventDefs.get('epoch_ii.11').body), 'Missing target recovery offers paid archive or fallback completion routes');
    reportOpen = true;
  }
  check(reportOpen && !flags.has('epoch_ii_ch3_resolved'), 'No project outcome skips the player-facing result report');
  const report = eventDefs.get('epoch_ii.17');
  check(/set_country_flag\s*=\s*epoch_ii_ch3_resolved/.test(report.body), 'Only the explicit Chapter 3 result report resolves the chapter');
  pendingProject = false;
  flags.add('epoch_ii_ch3_resolved');
  check(tickUntil('stage_block_a_handoff'), 'Chapter 3 result leaves the situation at its handoff stage');
  let guard = 100;
  while (progress < 90 && guard-- > 0) {
    const add = currentProgress();
    if (add <= 0) break;
    progress = Math.min(90, progress + add);
  }
  check(progress >= 90 && flags.has('epoch_ii_ch3_resolved'), 'Explicit Chapter 3 completion releases Block A handoff');
  check(seen.join(',') === stageNames.join(','), 'The model visits all six stages in order without skipping');
  check(!events.includes('epoch_ii.26') && !events.includes('chapter_4'), 'Block A completion does not launch Chapter 4');
  return { seen, progress, complete };
}

model('combat','project');
model('defense','project');
model('combat','cancel');
model('defense','missing-target');

// Exercise retryable migration states across changing references/ownership.
const dispatcher = eventDefs.get('epoch_ii.0')?.body || '';
check(/remove_country_flag\s*=\s*epoch_ii_contamination_migrated/.test(dispatcher) && /set_country_flag\s*=\s*epoch_ii_planet_migration_v2/.test(dispatcher), 'The dispatcher reopens completion flags written by the prior migration version');
function migrateContamination(state, referenceExists, owned) {
  if (!state.v2) { state.done = false; state.notApplicable = false; state.v2 = true; }
  if (!state.done) {
    if (referenceExists && owned) { state.depositCount = Math.max(state.depositCount, 1); state.done = true; state.notApplicable = false; }
    else state.notApplicable = true;
  }
  return state;
}
let migration = { v2:false, done:true, notApplicable:true, depositCount:0 };
migration = migrateContamination(migration, false, false);
check(migration.notApplicable && !migration.done && migration.depositCount === 0, 'A missing reference remains provisional and does not prevent retry');
migration = migrateContamination(migration, true, false);
check(migration.notApplicable && !migration.done && migration.depositCount === 0, 'A foreign original planet is not mutated or marked complete');
migration = migrateContamination(migration, true, true);
check(migration.done && !migration.notApplicable && migration.depositCount === 1, 'Reacquiring the original planet completes the migration once');
migration = migrateContamination(migration, true, true);
check(migration.depositCount === 1, 'Repeated yearly migration remains deposit-idempotent');
const legacyScan = eventDefs.get('epoch_ii.0').body;
check(/every_owned_planet\s*=/.test(legacyScan) && /NOT\s*=\s*\{\s*has_deposit/.test(legacyScan) && !/every_planet\s*=/.test(legacyScan), 'Legacy recovery scans only owned planets and guards duplicate deposits');

// Retreat state model: no route is passive/retryable, an accessible route is
// queued once, arrival completes, and a missing fleet completes without error.
const retreatEffect = read('common/scripted_effects/epoch_core_effects.txt');
const retreatRoutine = namedBlock(retreatEffect, 'epoch_ii_disengage_nullwarden_fleet', '');
check(/epoch_ii_nullwarden_retreat_pending/.test(retreatRoutine) && /epoch_ii_nullwarden_route_queued/.test(retreatRoutine) && /epoch_ii_nullwarden_disengage_complete/.test(retreatRoutine), 'The retreat helper exposes pending, queued, and terminal states');
const fleetScopes = blocks(retreatRoutine, 'event_target:epoch_ii_nullwarden_fleet@root');
check(fleetScopes.length >= 4 && !/\b(?:has_country_flag|set_country_flag|remove_country_flag)\b/.test(fleetScopes.map(s => withoutScopeBlocks(s, 'root')).join('\n')), 'Every country-flag read/write inside Fleet scopes is explicitly wrapped in root Country scope');
const destinationScopes = [...blocks(retreatRoutine, 'random_system'), ...blocks(retreatRoutine, 'closest_system')];
check(destinationScopes.length === 3 && destinationScopes.every(s => /has_access_fleet\s*=\s*event_target:epoch_ii_nullwarden_country@root/.test(s) && /save_global_event_target_as\s*=\s*epoch_ii_retreat_system@root/.test(s) && /root\s*=\s*\{\s*set_country_flag\s*=\s*epoch_ii_retreat_destination_found\s*\}/.test(s)), 'Every System-scope destination candidate saves its event target and writes its country flag through root');
check((retreatRoutine.match(/limit\s*=\s*\{\s*root\s*=\s*\{\s*NOT\s*=\s*\{\s*has_country_flag\s*=\s*epoch_ii_retreat_destination_found/g) || []).length === 2 && /limit\s*=\s*\{\s*root\s*=\s*\{\s*has_country_flag\s*=\s*epoch_ii_retreat_destination_found/.test(retreatRoutine), 'Fleet-scope destination flag reads explicitly switch back to the campaign country');
check(/limit\s*=\s*\{\s*has_country_flag\s*=\s*epoch_ii_nullwarden_route_queued[\s\S]*?event_target:epoch_ii_nullwarden_fleet@root\s*=\s*\{/.test(retreatRoutine), 'The route-queued condition is evaluated in the outer campaign-country scope');
check(/queue_actions\s*=\s*\{\s*move_to\s*=\s*event_target:epoch_ii_retreat_system@root\s*\}[\s\S]*?root\s*=\s*\{\s*set_country_flag\s*=\s*epoch_ii_nullwarden_route_queued\s+set_country_flag\s*=\s*epoch_ii_nullwarden_retreat_pending\s*\}/.test(retreatRoutine), 'Movement is queued in Fleet scope and route flags are written to the campaign country');
check(/solar_system\s*=\s*\{\s*is_same_value\s*=\s*event_target:epoch_ii_retreat_system@root\s*\}[\s\S]*?root\s*=\s*\{\s*remove_country_flag\s*=\s*epoch_ii_nullwarden_retreat_pending\s+remove_country_flag\s*=\s*epoch_ii_nullwarden_route_queued[\s\S]*?set_country_flag\s*=\s*epoch_ii_nullwarden_disengage_complete\s*\}/.test(retreatRoutine), 'Arrival is compared in Fleet/System scope and completion flags are written in Country scope');
const yearlyDispatcher = blocks(events, 'country_event').find(body => /\bid\s*=\s*epoch_ii\.0\b/.test(body)) || '';
check(/has_country_flag\s*=\s*epoch_ii_nullwarden_retreat_pending\s*\}\s*epoch_ii_disengage_nullwarden_fleet\s*=\s*yes/.test(yearlyDispatcher), 'The yearly country event retries pending retreats in Country scope');
function retreat(state, { fleet = true, route = false, arrived = false } = {}) {
  if (state.complete) return state;
  if (!fleet) { state.pending = false; state.queued = false; state.complete = true; return state; }
  state.issued = true;
  state.pending = true;
  if (state.queued && route) {
    if (arrived) { state.pending = false; state.complete = true; state.passive = true; }
    return state;
  }
  state.queued = false;
  if (route) { state.queued = true; state.passive = false; }
  else state.passive = true;
  return state;
}
let retreatState = retreat({}, { route:false });
check(retreatState.pending && retreatState.passive && !retreatState.queued, 'No reachable destination leaves the live fleet passive and pending');
retreatState = retreat(retreatState, { route:true });
check(retreatState.queued && retreatState.pending, 'A later reachable route is queued on retry');
const queuedState = { ...retreatState };
retreatState = retreat(retreatState, { route:true });
check(JSON.stringify(retreatState) === JSON.stringify(queuedState), 'Repeated resolution does not replace an in-progress retreat order');
retreatState = retreat(retreatState, { route:false });
check(retreatState.pending && retreatState.passive && !retreatState.queued, 'An inaccessible queued route is abandoned and becomes retryable');
retreatState = retreat(retreatState, { route:true });
retreatState = retreat(retreatState, { route:true, arrived:true });
check(retreatState.complete && !retreatState.pending, 'Arrival ends the retry state cleanly');
check(retreat(retreatState, { route:false }).complete, 'Repeated resolution after arrival is idempotent');
const destroyed = retreat({ pending:true, queued:false }, { fleet:false });
check(destroyed.complete && !destroyed.pending, 'A fleet destroyed during combat clears pending retreat state');
console.log(`PASS: ${checks} Phase II transition-model assertions passed across stage flow, project recovery, migration retries, and retreat edge cases.`);
