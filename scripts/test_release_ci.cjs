'use strict';

// Deliberately game-independent CI test set. Native/Vanilla integration
// assertions remain in the existing full regression suite and are not mocked.
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const cases = [
	['test_phase_i_flow.cjs', [root]],
	['test_clausewitz_structure.cjs', [root, '--source-only']],
	['test_resonance.cjs', [root, '--source-only']],
	['test_tech_dependencies.cjs', [root, '--source-only']],
	['test_stellaris_runtime_log.cjs', ['--self-test']],
	['test_stage_iv_d1.cjs', []],
	['test_stage_iv_d2.cjs', [root, '--source-only']],
	['test_epoch_release.cjs', []],
];

for (const [name, args] of cases) {
	process.stdout.write(`\n=== ${name} ===\n`);
	const result = spawnSync(process.execPath, [path.join(__dirname, name), ...args], {
		cwd: root,
		stdio: 'inherit',
		env: process.env,
	});
	if (result.error) throw result.error;
	if (result.status !== 0) {
		process.stderr.write(`FAIL: game-independent CI test ${name} exited ${result.status}\n`);
		process.exit(result.status || 1);
	}
}

process.stdout.write(`\nPASS: all ${cases.length} game-independent CI test commands passed. This does not establish in-game acceptance.\n`);
