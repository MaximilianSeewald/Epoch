'use strict';

// Add legitimate post-baseline gameplay and bilingual localization to a
// temporary source copy, then run the exact CI selection. This guards against
// historical immutability checks accidentally returning to the release gate.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { runCiTests } = require('./test_release_ci.cjs');
const sourceRoot = path.resolve(__dirname, '..');
const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'epoch-new-gameplay-ci-'));
const tempPrefix = `${path.resolve(os.tmpdir())}${path.sep}`;
if (!path.resolve(tempRoot).startsWith(tempPrefix)) throw new Error('Regression fixture escaped the system temporary directory');
const omit = new Set(['.git', '.codegraph', 'node_modules']);
try {
  fs.cpSync(sourceRoot, tempRoot, { recursive: true, filter: source => !omit.has(path.basename(source)) });
  fs.writeFileSync(path.join(tempRoot, 'common', 'technology', 'epoch_ci_future_technology.txt'), `tech_epoch_ci_future_regression = {\n icon = tech_physics_lab_1\n cost = 1000 area = physics tier = 1\n category = { computing }\n prerequisites = { }\n}\n`);
  fs.writeFileSync(path.join(tempRoot, 'events', 'epoch_ci_future_event.txt'), `country_event = {\n id = epoch_ci_future_regression.1\n hide_window = yes\n immediate = { }\n}\n`);
  for (const [language, value] of [['english', 'Future Technology'], ['german', 'Zukunftstechnologie']]) {
    const file = path.join(tempRoot, 'localisation', language, `epoch_core_l_${language}.yml`);
    const addition = Buffer.from(`tech_epoch_ci_future_regression:0 "${value}"\ntech_epoch_ci_future_regression_desc:0 "A valid new CI regression technology."\n`, 'utf8');
    fs.appendFileSync(file, addition);
  }
  const result = runCiTests(tempRoot, { includeRegression: false });
  assert.equal(result, 0, 'CI selection accepts a valid new technology, event and matching bilingual keys');
  console.log('PASS: CI accepts post-baseline gameplay additions and bilingual localization.');
} finally {
  fs.rmSync(tempRoot, { recursive: true, force: true });
}
