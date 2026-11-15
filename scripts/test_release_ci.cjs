'use strict';

// Deliberately game-independent CI test set. Historical D1/D2 immutability
// checks remain locally runnable but are not a permanent release gate.
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const defaultRoot = path.resolve(__dirname, '..');
const cases = [
  ['test_phase_i_flow.cjs', root => [root]],
  ['test_epoch_echoes.cjs', () => []],
  ['test_clausewitz_structure.cjs', root => [root, '--source-only']],
  ['test_resonance.cjs', root => [root, '--source-only']],
  ['test_tech_dependencies.cjs', root => [root, '--source-only']],
  ['test_localization_consistency.cjs', root => [root]],
  ['test_epoch_economy_consistency.cjs', root => [root]],
  ['test_stellaris_runtime_log.cjs', () => ['--self-test']],
  ['test_steamcmd_workshop_upload_shell.cjs', () => []],
  ['test_release_ci_regression.cjs', () => []],
  ['test_epoch_release.cjs', () => []],
];

function runCiTests(root = defaultRoot, { includeRegression = true } = {}) {
  const selected = includeRegression ? cases : cases.filter(([name]) => name !== 'test_release_ci_regression.cjs');
  for (const [name, argsForRoot] of selected) {
    process.stdout.write(`\n=== ${name} ===\n`);
    const result = spawnSync(process.execPath, [path.join(root, 'scripts', name), ...argsForRoot(root)], {
      cwd: root,
      stdio: 'inherit',
      env: process.env,
    });
    if (result.error) throw result.error;
    if (result.status !== 0) {
      process.stderr.write(`FAIL: game-independent CI test ${name} exited ${result.status}\n`);
      return result.status || 1;
    }
  }
  process.stdout.write(`\nPASS: all ${selected.length} game-independent CI test commands passed. This does not establish in-game acceptance.\n`);
  return 0;
}

if (require.main === module) process.exit(runCiTests(process.env.EPOCH_CI_ROOT || defaultRoot));
module.exports = { runCiTests };
