'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const release = require('./epoch_release.cjs');

let checks = 0;
function check(fn) { fn(); checks++; }

check(() => assert.deepEqual(release.parseVersion('name="EPOCH"\nversion="0.1.0"\n'), [0, 1, 0]));
check(() => assert.equal(release.selectVersion({ tags: [], commit: 'abc', baseVersion: [0, 1, 0] }).version, '0.1.0'));
check(() => assert.deepEqual(release.parseStableTag('0.1.0'), [0, 1, 0]));
check(() => assert.equal(release.selectVersion({ tags: [{ name: 'stable-v0.1.1', commit: 'old' }], commit: 'new' }).version, '0.1.2'));
check(() => assert.deepEqual(release.selectVersion({ tags: [{ name: 'stable-v0.1.3', commit: 'same' }], commit: 'same' }), { version: '0.1.3', tag: 'stable-v0.1.3', reused: true }));
check(() => assert.equal(release.selectVersion({ tags: [{ name: 'stable-v0.1.3', commit: 'same' }, { name: 'stable-v0.1.2', commit: 'same' }], commit: 'same' }).version, '0.1.3'));
check(() => assert.throws(() => release.parseVersion('version="latest"'), /semantic version/));
check(() => assert.throws(() => release.rewriteDescriptor('version="0.1.0"', '0.1.0-rc1'), /Invalid release version/));
check(() => assert.deepEqual(release.validateWorkshopConfig({}), { enabled: false, reason: 'Steam session and Workshop ID are not configured; package-only dry run' }));
check(() => assert.throws(() => release.validateWorkshopConfig({ workshopId: 'not-an-id', username: 'u', session: 'x' }), /numeric/));
check(() => assert.throws(() => release.validateWorkshopConfig({ workshopId: '000000', username: 'u', session: 'dGVzdA==' }), /nonzero/));
check(() => assert.throws(() => release.validateWorkshopConfig({ workshopId: '123456789' }), /incomplete/));
check(() => assert.throws(() => release.validateWorkshopConfig({ username: 'u' }), /incomplete/));
check(() => assert.throws(() => release.validateWorkshopConfig({ workshopId: '123456789', username: 'u' }), /incomplete/));
check(() => assert.throws(() => release.validateWorkshopConfig({ workshopId: '123456789', username: 'u', session: 'not base64' }), /base64-encoded/));
check(() => assert.equal(release.validateWorkshopConfig({ workshopId: '123456789', username: 'u', session: 'dGVzdA==' }).enabled, true));

const workflow = fs.readFileSync(path.join(__dirname, '..', '.github', 'workflows', 'stable-release.yml'), 'utf8');
for (const [pattern, label] of [
	[/runs-on:\s*ubuntu-latest/, 'GitHub-hosted Ubuntu runner'],
	[/cancel-in-progress:\s*false/, 'serialized non-cancelling releases'],
	[/git rev-parse FETCH_HEAD/, 'current-main freshness guard'],
	[/git tag -a/, 'per-commit annotated version reservation'],
	[/git push origin "refs\/tags\/\$RELEASE_TAG"/, 'remote permanent tag reservation'],
	[/"publishedfileid"\s+"\$STEAM_WORKSHOP_ID"/, 'upload configured item ID'],
	[/Success\\\..*Published file update/, 'SteamCMD success-result verification'],
	[/if: steps\.steam-upload\.outputs\.uploaded == 'true'/, 'GitHub Release waits for verified upload'],
]) check(() => assert.match(workflow, pattern, label));
check(() => assert.doesNotMatch(workflow, /EPOCH_VANILLA_ROOT|EPOCH_LOG_DIRECTORY|STEAM_PASSWORD|STEAM_GUARD_CODE/, 'CI has no local-game paths or stored passwords/Guard codes'));

const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'epoch-release-'));
try {
	const source = path.join(temp, 'source');
	const output = path.join(temp, 'package');
	fs.mkdirSync(source);
	fs.writeFileSync(path.join(source, 'descriptor.mod'), 'name="EPOCH"\nversion="0.1.0"\nsupported_version="4.5.*"\n');
	for (const dir of ['common', 'events', 'localisation', 'gfx', 'interface', 'compatibility', 'docs', 'scripts', 'test-mods', '.github']) {
		fs.mkdirSync(path.join(source, dir), { recursive: true });
		fs.writeFileSync(path.join(source, dir, 'payload.txt'), 'payload');
	}
	release.walkPackage(source, output, '0.1.0');
	const files = release.validatePackage(output, '0.1.0');
	check(() => assert(files.includes('descriptor.mod')));
	check(() => assert(files.includes('common/payload.txt')));
	check(() => assert(files.includes('compatibility/payload.txt')));
	check(() => assert(!files.some(file => /^(docs|scripts|test-mods|\.github)\//.test(file))));
	check(() => assert.equal(release.formatVersion(release.parseVersion(fs.readFileSync(path.join(output, 'descriptor.mod'), 'utf8'))), '0.1.0'));
	fs.mkdirSync(path.join(output, 'docs'), { recursive: true });
	fs.writeFileSync(path.join(output, 'docs', 'leak.txt'), 'forbidden');
	check(() => assert.throws(() => release.validatePackage(output, '0.1.0'), /Development file/));
} finally {
	fs.rmSync(temp, { recursive: true, force: true });
}

process.stdout.write(`PASS: ${checks} release automation checks passed.\n`);
