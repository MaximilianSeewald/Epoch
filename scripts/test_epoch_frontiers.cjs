'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { parse, get } = require('./test_clausewitz_structure.cjs');
const root = process.argv[2] || path.resolve(__dirname, '..');
const read = file => parse(fs.readFileSync(path.join(root, file), 'utf8'), file);
const events = new Map(read('events/epoch_frontiers_events.txt')
  .filter(([, body]) => Array.isArray(body)).map(([, body]) => [get(body, 'id'), body]));
const triggers = new Map(read('common/scripted_triggers/epoch_frontiers_triggers.txt'));
const effects = new Map(read('common/scripted_effects/epoch_frontiers_effects.txt'));
const projects = new Map(read('common/special_projects/epoch_frontiers_projects.txt')
  .map(([, body]) => [get(body, 'key'), body]));

assert.equal(get(get(events.get('epoch_frontiers.1'), 'trigger'), 'has_global_flag'), 'epoch_iii_first_repulsed');
assert.equal(projects.size, 8);
for (const [, config] of get(events.get('epoch_frontiers.1'), 'immediate')) {
  const front = get(config, 'FRONT');
  for (const [key, kind, callback] of [['PROJECT', 'survey', 11], ['SALVAGE', 'salvage', 20]]) {
    const project = projects.get(get(config, key));
    assert.deepEqual(get(project, 'requirements'), [['shipclass_science_ship', '1'], ['leader', 'scientist']]);
    const abort = get(get(project, 'abort_trigger'), 'NOT');
    assert.equal(get(get(abort, 'epoch_frontiers_can_' + kind), 'FRONT'), front);
    const finish = get(get(get(project, 'on_success'), 'if'), 'ship_event');
    assert.equal(get(finish, 'id'), 'epoch_frontiers.' + callback);
    assert.equal(get(get(finish, 'scopes'), 'fromfrom'), 'event_target:epoch_iii_front_' + front);
  }
}

// Every payout must check the same live gate as its choice. The site ledger is
// updated first, so a stale option cannot award that payload a second time.
const claim = get(effects.get('epoch_frontiers_claim_recovery'), 'if');
assert.deepEqual(claim.map(([key]) => key), ['limit', 'from', 'add_resource']);
assert.equal(get(get(get(claim, 'limit'), 'epoch_frontiers_can_collect'), 'WRECK'), '$WRECK$');
const collect = get(triggers.get('epoch_frontiers_can_collect'), 'from');
const rewardLedger = get(claim, 'from');
for (const flag of ['$WRECK$', 'epoch_frontiers_recovery_ready', 'epoch_frontiers_recovered_for@root']) {
  assert.ok(collect.some(([key, value]) => key === 'has_star_flag' && value === flag));
  assert.ok(rewardLedger.some(([key, value]) => key === 'remove_star_flag' && value === flag));
}
assert.equal(get(rewardLedger, 'set_star_flag'), '$SPENT$');
assert.equal(get(get(get(collect, 'starbase'), 'owner'), 'is_same_value'), 'root');
assert.equal(get(get(triggers.get('epoch_frontiers_station_operational'), 'controller'), 'is_same_value'), 'prev.owner');
const loss = get(get(events.get('epoch_frontiers.2'), 'immediate'), 'from');

for (const [id, number] of [[21, 'one'], [22, 'two']]) {
  const ready = 'epoch_frontiers_wreck_' + number + '_ready';
  const spent = 'epoch_frontiers_wreck_' + number + '_spent';
  assert.ok(loss.some(([key, value]) => key === 'remove_star_flag' && value === ready));
  assert.ok(!loss.some(([key, value]) => key === 'remove_star_flag' && value === spent));
  const options = events.get('epoch_frontiers.' + id).filter(([key]) => key === 'option');
  for (const [, option] of options.filter(([, body]) => get(body, 'tooltip'))) {
    const params = get(get(option, 'hidden_effect'), 'epoch_frontiers_claim_recovery');
    assert.equal(get(params, 'WRECK'), ready);
    assert.equal(get(params, 'SPENT'), spent);
    assert.deepEqual(get(get(option, 'tooltip'), 'add_resource'), [[get(params, 'RESOURCE'), get(params, 'AMOUNT')]]);
  }
}
assert.ok(get(triggers.get('epoch_frontiers_salvage_site'), 'NOR').some(
  ([key, value]) => key === 'has_star_flag' && value === 'epoch_frontiers_wreck_two_spent'
));
console.log('PASS: Contested Frontiers project routing, ownership gates, finite rewards and tooltip parity. Source checks only.');
