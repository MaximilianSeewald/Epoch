// Static executable model of the actual Clausewitz progress/dispatch blocks.
// This checks script invariants, not Stellaris engine behavior or runtime scopes.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = process.argv[2] || path.resolve(__dirname, '..');
let checks = 0;
function check(condition, message) { checks++; assert.ok(condition, message); }
function parse(file) {
  const text = fs.readFileSync(path.join(root, file), 'utf8').replace(/^\uFEFF/, '');
  const tokens = text.match(/#[^\n]*|"(?:\\.|[^"\\])*"|[{}]|>=|<=|!=|[=<>]|[^\s{}=<>!#]+/g).filter(t => !t.startsWith('#'));
  let i = 0;
  function block(nested) {
    const result = [];
    while (i < tokens.length && tokens[i] !== '}') {
      const key = tokens[i++];
      if (!['=', '<', '>', '<=', '>=', '!='].includes(tokens[i])) {
        result.push({key:'$literal', value:key});
        continue;
      }
      const op = tokens[i++];
      assert.ok(['=', '<', '>', '<=', '>=', '!='].includes(op), `Unexpected syntax ${key} ${op} in ${file}`);
      let value = tokens[i++];
      if (value === '{') value = block(true);
      else if (value.startsWith('"')) value = value.slice(1, -1);
      result.push({key, op, value});
    }
    if (nested) assert.equal(tokens[i++], '}');
    return result;
  }
  return block(false);
}
const values = (b, k) => b.filter(e => e.key === k).map(e => e.value);
const one = (b, k) => { const v = values(b, k); assert.equal(v.length, 1, k); return v[0]; };
const situation = one(parse('common/situations/epoch_core_situations.txt'), 'epoch_first_echo_investigation');
const eventFile = parse('events/epoch_core_events.txt');
const event = id => eventFile.find(e => Array.isArray(e.value) && values(e.value, 'id')[0] === `epoch_core.${id}`).value;
const stages = one(situation, 'stages');
const monthly = one(situation, 'monthly_progress');
const dispatcher = event(48);
const expected = [
  ['stage_signal_analysis', 'stage_echo_resolution', 15, 20, 'epoch_core_first_echo_complete', 'epoch_core_echo_first_project_pending', null],
  ['stage_source_analysis', 'stage_expedition_resolution', 25, 30, 'epoch_core_expedition_phase_resolved', 'epoch_core_expedition_phase_started', 'epoch_core.4'],
  ['stage_contamination', 'stage_contamination_resolution', 35, 40, 'epoch_core_contamination_phase_resolved', 'epoch_core_contamination_event_started', 'epoch_core.20'],
  ['stage_excavation', 'stage_structure_resolution', 45, 50, 'epoch_core_structure_phase_resolved', 'epoch_core_structure_event_started', 'epoch_core.22'],
  ['stage_report', 'stage_conclusion_resolution', 55, 60, 'epoch_core_conclusion_decision_resolved', 'epoch_core_conclusion_event_started', 'epoch_core.23']
];
const approaches = values(situation, 'approach').map(b => one(b, 'name'));
function compare(a, op, b) { return ({'=':a === b, '<':a < b, '>':a > b, '<=':a <= b, '>=':a >= b, '!=':a !== b})[op]; }
function predicate(entry, state) {
  const {key:k, op, value:v} = entry;
  if (k === 'OR') return v.some(e => predicate(e, state));
  if (k === 'NOT') return !test(v, state);
  if (k === 'AND' || k === 'owner') return test(v, state);
  if (k === 'current_stage') return state.stage === v;
  if (k === 'current_situation_approach') return state.approach === v;
  if (k === 'situation_progress') return compare(state.progress, op, Number(v));
  if (k === 'has_country_flag') return state.flags.has(v);
  if (k === 'exists') return !state.missingSignal;
  if (k === 'epoch_core_active_campaign_empire') return state.flags.has('epoch_core_campaign_active') && !state.flags.has('epoch_core_campaign_opted_out');
  if (k === 'always') return v === 'yes';
  throw Error(`Unsupported model predicate: ${k}`);
}
function test(block, state) { return block.every(e => predicate(e, state)); }
function progress(state) {
  let result = Number(one(monthly, 'base'));
  for (const m of values(monthly, 'modifier')) {
    if (test(m.filter(e => !['add', 'desc'].includes(e.key)), state)) result += Number(one(m, 'add'));
  }
  return result;
}
function effects(block, state) {
  for (let i = 0; i < block.length; i++) {
    const {key:k, value:v} = block[i];
    if (k === 'if') {
      let chosen = test(one(v, 'limit'), state) ? v : null;
      while (i + 1 < block.length && ['else_if', 'else'].includes(block[i + 1].key)) {
        const next = block[++i];
        if (!chosen && (next.key === 'else' || test(one(next.value, 'limit'), state))) chosen = next.value;
      }
      if (chosen) effects(chosen.filter(e => e.key !== 'limit'), state);
    } else if (k === 'owner') effects(v, state);
    else if (k === 'set_country_flag') state.flags.add(v);
    else if (k === 'country_event') state.calls.push(one(v, 'id'));
    else if (k === 'enable_special_project') state.projects.push(one(v, 'name'));
    else if (k.startsWith('event_target:')) effects(v, state);
    else if (k !== 'set_variable') throw Error(`Unsupported dispatcher effect: ${k}`);
  }
}
function dispatch(state) { if (test(one(dispatcher, 'trigger'), state)) effects(one(dispatcher, 'immediate'), state); }
function makeState(stage, p, approach, flags = []) {
  return {stage, progress:p, approach, flags:new Set(['epoch_core_campaign_active', 'epoch_core_initial_cautious', ...flags]), calls:[], projects:[]};
}
function stageAt(p) { return stages.find(s => p < Number(one(s.value, 'end')))?.key; }
check(stages.length === 10, 'Exactly five research/wait pairs');
for (let phase = 0; phase < expected.length; phase++) {
  const [research, wait, threshold, end, objective, released, call] = expected[phase];
  check(stages[phase * 2].key === research && stages[phase * 2 + 1].key === wait, 'Stage order');
  check(Number(one(stages[phase * 2].value, 'end')) === threshold && Number(one(stages[phase * 2 + 1].value, 'end')) === end, 'Fixed boundaries');
  const callback = one(stages[phase * 2 + 1].value, 'on_first_enter');
  check(one(one(callback, 'situation_event'), 'id') === 'epoch_core.48', 'Wait entry must release its own objective');
  const prior = expected.slice(0, phase).map(p => p[4]);
  for (const approach of approaches) {
    const applicable = approach !== 'epoch_echo_containment_approach' || phase === 2;
    if (!applicable) continue;
    // Enumerate all quarter-point offsets and all selectable approaches. This
    // includes overshoot from changing approaches immediately before a boundary.
    for (let p = threshold; p < end; p += 0.25) {
      const state = makeState(wait, p, approach, prior);
      check(progress(state) === 0, `${wait} advances with an unresolved objective`);
      dispatch(state);
      check(state.flags.has(released), `${wait} did not release its objective`);
      check(state.calls.length === (call ? 1 : 0), 'Exactly one current-section event');
      if (call) check(state.calls[0] === call, 'Wrong-section event released');
      else check(state.projects.length === 1 && state.projects[0] === 'EPOCH_FIRST_ECHO_CAUTIOUS', 'First project release');
      // Save/load restores flags, not a fresh dispatcher. Repeated entry/monthly
      // dispatches may not duplicate projects or decisions.
      const saved = {...state, flags:new Set(JSON.parse(JSON.stringify([...state.flags]))), calls:[...state.calls], projects:[...state.projects]};
      dispatch(saved); dispatch(saved);
      check(saved.calls.length === state.calls.length && saved.projects.length === state.projects.length, 'Duplicate release after restored save');
      state.flags.add(objective);
      const rate = progress(state);
      check(phase === 4 ? rate === 0 : rate > 0 && rate < 5, 'Resolved gate must resume; final gate only closes on a choice');
      if (phase < 4) check(stages.findIndex(s => s.key === stageAt(p + rate)) <= phase * 2 + 2, 'Monthly step skips next research stage');
      if (phase === 0) {
        state.flags.delete(objective); state.flags.add('epoch_core_echo_second_abandoned');
        check(progress(state) > 0, 'Explicit follow-up abandonment is a valid Echo alternative');
      }
    }
    const low = phase === 0 ? 0 : expected[phase - 1][3];
    for (let p = low; p < threshold; p += 0.25) {
      const state = makeState(research, p, approach, prior);
      const rate = progress(state);
      check(rate > 0 && rate < 5, 'Analysis must progress without skipping a five-point gate');
      dispatch(state);
      check(!state.flags.has(released), 'Objective released during research');
      check(stages.findIndex(s => s.key === stageAt(p + rate)) <= phase * 2 + 1, 'Research step skips wait stage');
    }
  }
  if (phase > 0) {
    const outOfOrder = makeState(wait, threshold, approaches[0]);
    dispatch(outOfOrder);
    check(!outOfOrder.flags.has(released), 'Dispatch without prior objective resolution');
  }
}
// Explore complete campaigns with arbitrary approach changes. The next state
// comes from actual monthly_progress, not a duplicated rate table.
const queue = [makeState(stageAt(0), 0, approaches[0])];
const seen = new Set(), reached = new Set();
while (queue.length) {
  const state = queue.pop();
  const key = `${state.progress}:${[...state.flags].sort().join(',')}`;
  if (seen.has(key)) continue;
  seen.add(key); reached.add(state.stage);
  dispatch(state);
  const pair = expected.find(p => p[1] === state.stage);
  if (pair && !state.flags.has(pair[4])) {
    const resolved = {...state, flags:new Set(state.flags), calls:[], projects:[]};
    resolved.flags.add(pair[4]); queue.push(resolved);
    if (pair === expected[0]) {
      const alternative = {...state, flags:new Set(state.flags), calls:[], projects:[]};
      alternative.flags.add('epoch_core_echo_second_abandoned'); queue.push(alternative);
    }
  }
  for (const approach of approaches) {
    if (approach === 'epoch_echo_containment_approach' && !['stage_contamination','stage_contamination_resolution'].includes(state.stage)) continue;
    const next = {...state, approach, flags:new Set(state.flags), calls:[], projects:[]};
    const rate = progress(next);
    if (rate === 0) continue;
    next.progress += rate; next.stage = stageAt(next.progress);
    check(next.stage !== undefined, 'Campaign auto-completed without a final choice');
    queue.push(next);
  }
}
check(reached.size === 10, 'At least one complete route reaches each of the ten stages');
// Both initial methods must release their own project and expedition narrative.
for (const [wait, p, expectedCall, project] of [
  ['stage_echo_resolution',15,null,'EPOCH_FIRST_ECHO_AGGRESSIVE'],
  ['stage_expedition_resolution',25,'epoch_core.5',null]
]) {
  const state = makeState(wait,p,approaches[1],['epoch_core_first_echo_complete']);
  state.flags.delete('epoch_core_initial_cautious'); state.flags.add('epoch_core_initial_aggressive');
  dispatch(state);
  check(project ? state.projects[0] === project : state.calls[0] === expectedCall, 'Aggressive method releases the matching content');
}
// Opt-out blocks every release, including the monthly save/load fallback.
for (const [,wait,p] of expected) {
  const state = makeState(wait, p, approaches[0], ['epoch_core_campaign_opted_out', ...expected.map(p => p[4])]);
  dispatch(state); check(state.calls.length + state.projects.length === 0, 'Opt-out dispatch');
}
const missingSignal = makeState('stage_echo_resolution',15,approaches[0]);
missingSignal.missingSignal = true;
dispatch(missingSignal);
check(missingSignal.projects.length === 0 && missingSignal.calls[0] === 'epoch_core.31', 'Missing signal must request a decision without entering an invalid target scope');
// Enumerate source-level resolution routes instead of assuming every branch
// sets the gate. These assertions fail if a single actual choice loses a flag.
function deepHas(block, key, value) { return block.some(e => e.key === key && e.value === value || Array.isArray(e.value) && deepHas(e.value, key, value)); }
function option(id, suffix) { return values(event(id), 'option').find(o => one(o, 'name') === `epoch_core.${id}.${suffix}`); }
for (const [id, suffixes, flag] of [
  [7,['a'],'epoch_core_expedition_phase_resolved'],
  [20,['b','c'],'epoch_core_contamination_phase_resolved'],
  [26,['b'],'epoch_core_contamination_phase_resolved'],
  [43,['a','b','c'],'epoch_core_structure_phase_resolved'],
  [44,['b'],'epoch_core_structure_phase_resolved'],
  [46,['b'],'epoch_core_structure_phase_resolved'],
  [23,['a','b'],'epoch_core_conclusion_decision_resolved']
]) for (const suffix of suffixes) check(deepHas(option(id,suffix),'set_country_flag',flag), `Missing gate on ${id}.${suffix}`);
for (const [id,flag] of [[21,'epoch_core_contamination_phase_resolved'],[45,'epoch_core_structure_phase_resolved']]) check(deepHas(one(event(id),'immediate'),'set_country_flag',flag), `Missing project-success gate ${id}`);
for (const suffix of ['a','b']) {
  const o = option(23,suffix);
  check(deepHas(o,'destroy_situation','this') && deepHas(o,'set_country_flag','epoch_core_phase_i_situation_complete'), 'Final decision must close immediately');
}
console.log(`PASS: ${checks} parsed campaign-state checks (all research/wait gates, approaches, offsets, save-state dispatch, alternatives). Static model only.`);
