'use strict';

// Source-derived accounting identities. Numeric balances are not frozen to a
// historical release, so legitimate balance changes remain eligible for CI.
const assert = require('node:assert/strict');
const path = require('node:path');
if (!process.argv.includes('--source-only')) process.argv.push('--source-only');
const { economy } = require('./epoch_core_economy.cjs');
const root = process.argv[2] || path.resolve(__dirname, '..');
const ledger = economy(root);
let checks = 0;
const check = (condition, message) => { checks++; assert.ok(condition, message); };
const near = (left, right, message) => check(Number.isFinite(left) && Number.isFinite(right) && Math.abs(left - right) < 0.00001, message);
check(ledger.scenarios.length > 0, 'economy scenarios are defined');
check(ledger.wilderness.length === ledger.scenarios.length, 'wilderness scenarios correspond to economy scenarios');
for (const row of ledger.scenarios) {
  check(row.factories > 0 && row.ships >= 0 && row.sets >= 0 && row.bases >= 0, `${row.name}: valid scenario inputs`);
  const factory = row.tier === 1 ? ledger.factory1 : ledger.factory2;
  near(row.production, row.factories * factory.grossCore, `${row.name}: production matches source factory output`);
  near(row.use, row.ships * ledger.ship + row.sets * (row.top ? ledger.buildingSetTop : ledger.buildingSetI) + row.bases * ledger.starbase + ledger.edictCore, `${row.name}: use matches source-derived fleet, building, starbase and edict costs`);
  near(row.net, row.production - row.use, `${row.name}: net equals production less use`);
  near(row.halfStaffedNet, row.production * 0.5 - row.use, `${row.name}: half-staffed projection matches source inputs`);
  near(row.oneFactoryNet, factory.grossCore - row.use, `${row.name}: one-factory projection matches source inputs`);
  for (const [resource, amount] of Object.entries(row.factoryInputs)) {
    check(Number.isFinite(amount) && amount >= 0, `${row.name}: ${resource} factory input is finite and nonnegative`);
    near(amount, row.factories * Number(factory.inputs[resource]), `${row.name}: ${resource} inputs match source factory upkeep`);
  }
}
for (const row of ledger.wilderness) {
  check(row.nodes >= 0 && row.production >= 0, `${row.name}: wilderness output is nonnegative`);
  near(row.net, row.production - row.use, `${row.name}: wilderness net equals production less use`);
  for (const [resource, amount] of Object.entries(row.inputs)) check(Number.isFinite(amount) && amount >= 0, `${row.name}: wilderness ${resource} input is finite and nonnegative`);
}
console.log(`PASS: ${checks} source-derived economy accounting consistency checks; no historical numeric balance lock.`);
